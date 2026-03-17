/**
 * POST /api/stripe/create-checkout
 * Creates a Stripe Checkout session for Pro or Premium subscription.
 * Validates price ID before calling Stripe — returns 503 if not configured.
 */

import { NextResponse } from 'next/server'
import { stripe, PLANS, PlanId } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { validateStripePriceIds } from '@/lib/stripe-admin'
import { z } from 'zod'

// Accept both plan_id (from UpgradeButton) and planId (legacy)
const checkoutSchema = z.object({
  plan_id: z.enum(['pro', 'premium'] as const).optional(),
  planId: z.enum(['pro', 'premium'] as const).optional(),
}).refine(
  (data) => data.plan_id || data.planId,
  { message: 'plan_id or planId is required' }
)

export async function POST(request: Request) {
  // Validate price IDs on first request (logs warning if missing, does not crash)
  validateStripePriceIds()

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = checkoutSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "pro" or "premium".', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const planId = result.data.plan_id || result.data.planId!

    if (!(planId in PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    const plan = PLANS[planId as PlanId]

    // Graceful handling: return 503 (not crash) if Stripe price IDs are not configured
    if (!plan.priceId) {
      logger.error(`Stripe price ID not configured for plan "${planId}". Set STRIPE_${planId.toUpperCase()}_PRICE_ID in environment.`)
      return NextResponse.json(
        { error: 'Subscription plans are not yet configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Create Stripe customer for this session
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    })
    const customerId = customer.id

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/attorney-dashboard/subscription?success=true`,
      cancel_url: `${siteUrl}/attorney-dashboard/subscription?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    logger.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
