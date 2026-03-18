/**
 * POST /api/attorney/billing/upgrade
 * Creates a Stripe Checkout session for plan upgrade/downgrade.
 * Handles proration automatically via Stripe.
 * Returns the checkout URL for client-side redirect.
 */

import { NextResponse } from 'next/server'
import { createApiHandler } from '@/lib/api/handler'
import { stripe, PLANS, PlanId } from '@/lib/stripe/server'
import { validateStripePriceIds } from '@/lib/stripe-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const upgradeSchema = z.object({
  plan_id: z.enum(['pro', 'premium'] as const),
})

export const dynamic = 'force-dynamic'

export const POST = createApiHandler(
  async ({ user, body }) => {
    validateStripePriceIds()

    const { plan_id: planId } = body as z.infer<typeof upgradeSchema>
    const plan = PLANS[planId as PlanId]

    if (!plan.priceId) {
      logger.error(
        `Stripe price ID not configured for plan "${planId}". Set STRIPE_${planId.toUpperCase()}_PRICE_ID.`
      )
      return NextResponse.json(
        { error: 'Subscription plans are not yet configured. Please contact support.' },
        { status: 503 }
      )
    }

    const admin = createAdminClient()

    // Check if attorney already has a Stripe customer ID
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, subscription_plan')
      .eq('id', user!.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // If no Stripe customer, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user!.email,
        metadata: { supabase_user_id: user!.id },
      })
      customerId = customer.id

      // Store customer ID for future use
      await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user!.id)
    }

    // Check if attorney has an active subscription to update (upgrade/downgrade)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    if (subscriptions.data.length > 0) {
      // Existing subscription: update with proration
      const existingSub = subscriptions.data[0]
      const subscriptionItemId = existingSub.items.data[0].id

      const updatedSubscription = await stripe.subscriptions.update(existingSub.id, {
        items: [{ id: subscriptionItemId, price: plan.priceId }],
        proration_behavior: 'create_prorations',
      })

      // Update local DB
      await admin
        .from('profiles')
        .update({ subscription_plan: planId })
        .eq('id', user!.id)

      return NextResponse.json({
        success: true,
        data: {
          type: 'upgrade',
          subscriptionId: updatedSubscription.id,
          status: updatedSubscription.status,
          message: `Successfully switched to ${plan.name} plan.`,
        },
      })
    }

    // No existing subscription: create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${siteUrl}/attorney-dashboard/billing?success=true&plan=${planId}`,
      cancel_url: `${siteUrl}/attorney-dashboard/billing?canceled=true`,
      metadata: {
        user_id: user!.id,
        plan_id: planId,
      },
      subscription_data: {
        trial_period_days: profile?.subscription_plan === 'free' ? 14 : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        type: 'checkout',
        sessionId: session.id,
        url: session.url,
      },
    })
  },
  {
    requireAuth: true,
    bodySchema: upgradeSchema,
  }
)
