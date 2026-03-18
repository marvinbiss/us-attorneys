/**
 * POST /api/stripe/create-subscription
 * Creates a Stripe Checkout session for attorney subscription.
 * - Validates attorney identity and plan
 * - 14-day free trial for first-time subscribers
 * - Idempotent via X-Idempotency-Key header
 */

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { handleIdempotency, cacheIdempotencyResult } from '@/lib/idempotency'
import { getPlanBySlug } from '@/lib/subscriptions'

const subscriptionSchema = z.object({
  planId: z.enum(['pro', 'premium']),
  attorneyId: z.string().uuid(),
  billing: z.enum(['monthly', 'yearly']).default('monthly'),
})

export async function POST(request: Request) {
  // Idempotency check
  const idempotency = await handleIdempotency(request)
  if (idempotency && 'cached' in idempotency) return idempotency.cached
  const idempotencyKey = idempotency && 'key' in idempotency ? idempotency.key : null

  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse & validate body
    const body = await request.json()
    const result = subscriptionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { planId, attorneyId, billing } = result.data

    // Verify attorney belongs to this user
    const adminSupabase = createAdminClient()
    const { data: attorney, error: attorneyError } = await adminSupabase
      .from('attorneys')
      .select('id, user_id, name, stripe_customer_id, subscription_tier, subscription_started_at')
      .eq('id', attorneyId)
      .single()

    if (attorneyError || !attorney) {
      return NextResponse.json({ error: 'Attorney not found' }, { status: 404 })
    }

    if (attorney.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cannot subscribe to the same or lower plan
    const tierOrder = { free: 0, pro: 1, premium: 2 }
    if (tierOrder[planId] <= tierOrder[attorney.subscription_tier as keyof typeof tierOrder]) {
      return NextResponse.json(
        { error: `Already on ${attorney.subscription_tier} plan or higher` },
        { status: 400 }
      )
    }

    // Get plan details from DB
    const plan = await getPlanBySlug(planId)
    if (!plan || !plan.stripe_price_id) {
      logger.error(`Stripe price not configured for plan "${planId}"`)
      return NextResponse.json(
        { error: 'Subscription plan is not yet configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Reuse or create Stripe customer
    let customerId = attorney.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          attorney_id: attorneyId,
        },
        name: attorney.name || undefined,
      })
      customerId = customer.id

      // Persist customer ID
      await adminSupabase
        .from('attorneys')
        .update({ stripe_customer_id: customerId })
        .eq('id', attorneyId)
    }

    // Determine if first-time subscriber (eligible for 14-day trial)
    const isFirstTime = !attorney.subscription_started_at

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create Stripe Checkout session
    const sessionParams: Record<string, unknown> = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/attorney-dashboard/subscription?success=true&plan=${planId}`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        attorney_id: attorneyId,
        plan_id: planId,
        billing,
      },
      allow_promotion_codes: true,
    }

    // 14-day trial for first-time subscribers only
    if (isFirstTime) {
      sessionParams.subscription_data = {
        trial_period_days: 14,
        metadata: {
          attorney_id: attorneyId,
          plan_id: planId,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    )

    const responseBody = {
      sessionId: session.id,
      url: session.url,
      trial: isFirstTime,
    }

    // Cache for idempotency
    if (idempotencyKey) {
      cacheIdempotencyResult(idempotencyKey, 200, responseBody)
    }

    logger.info(`Subscription checkout created for attorney ${attorneyId}: plan=${planId}, trial=${isFirstTime}`)

    return NextResponse.json(responseBody)
  } catch (error: unknown) {
    logger.error('Stripe subscription checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription checkout' },
      { status: 500 }
    )
  }
}
