import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { withTimeout, TIMEOUTS } from '@/lib/api/timeout'
import { env } from '@/lib/env'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import Stripe from 'stripe'

/**
 * Map Stripe subscription status to our DB subscription_status
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
      return 'canceled'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    case 'paused':
      return 'paused'
    default:
      return 'inactive'
  }
}

/**
 * Find a user profile by their Stripe customer ID
 */
async function findProfileByCustomerId(customerId: string) {
  const supabase = createAdminClient()
  const { data, error } = await withTimeout(
    supabase
      .from('profiles')
      .select('id, subscription_plan, subscription_status')
      .eq('stripe_customer_id', customerId)
      .single(),
    TIMEOUTS.PAYMENT
  )

  if (error || !data) {
    logger.error(`No profile found for stripe_customer_id=${customerId}`, error)
    return null
  }
  return data
}

/**
 * IDEMPOTENCY: Check if webhook event was already processed
 * Returns true if event should be skipped (already processed)
 */
async function checkIdempotency(eventId: string): Promise<boolean> {
  const supabase = createAdminClient()

  // Try to insert the event - will fail if already exists due to UNIQUE constraint
  const { error } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: eventId,
      type: 'stripe_webhook',
      status: 'processing',
      created_at: new Date().toISOString(),
    })

  if (error) {
    // Event already exists - check its status
    if (error.code === '23505') { // Unique violation
      const { data: existing } = await supabase
        .from('webhook_events')
        .select('status')
        .eq('stripe_event_id', eventId)
        .single()

      if (existing?.status === 'completed') {
        logger.info(`Webhook event ${eventId} already processed, skipping`)
        return true // Skip processing
      }
      // Event exists but not completed - might be a retry, allow processing
    }
  }

  return false // Proceed with processing
}

/**
 * Mark webhook event as completed
 */
async function markEventCompleted(eventId: string, eventType: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('webhook_events')
    .update({
      type: eventType,
      status: 'completed',
      processed_at: new Date().toISOString(),
    })
    .eq('stripe_event_id', eventId)
}

/**
 * Mark webhook event as failed
 */
async function markEventFailed(eventId: string, errorMsg: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('webhook_events')
    .update({
      status: 'failed',
      error: errorMsg.slice(0, 1000),
      processed_at: new Date().toISOString(),
    })
    .eq('stripe_event_id', eventId)
}

export const POST = createApiHandler(async ({ request }) => {
  // Rate limiting (fail-open for webhooks)
  const rl = await rateLimit(request, RATE_LIMITS.webhook)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    logger.error('Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error: unknown) {
    logger.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // IDEMPOTENCY CHECK: Skip if already processed
  const shouldSkip = await checkIdempotency(event.id)
  if (shouldSkip) {
    return NextResponse.json({ received: true, status: 'already_processed' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        logger.debug(`Unhandled event type: ${event.type}`)
    }

    // Mark event as successfully processed
    await markEventCompleted(event.id, event.type)

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Webhook handler error:', error)

    // Mark event as failed for debugging
    await markEventFailed(event.id, errorMessage)

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}, {})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const planId = session.metadata?.plan_id

  if (!userId || !planId) {
    logger.warn('Checkout session missing user_id or plan_id in metadata', {
      sessionId: session.id,
    })
    return
  }

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? null

  const supabase = createAdminClient()

  const { error: updateError } = await withTimeout(
    supabase
      .from('profiles')
      .update({
        subscription_plan: planId,
        subscription_status: 'active',
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId),
    TIMEOUTS.PAYMENT
  )

  if (updateError) {
    logger.error(`Failed to update profile for user ${userId}`, updateError)
    throw new Error(`Profile update failed: ${updateError.message}`)
  }

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'subscription.checkout_completed',
    resource_type: 'profile',
    resource_id: userId,
    new_value: {
      subscription_plan: planId,
      subscription_status: 'active',
      stripe_customer_id: customerId,
      stripe_session_id: session.id,
    },
  })

  logger.info(`Checkout completed for user ${userId}: plan=${planId}, customer=${customerId}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  const profile = await findProfileByCustomerId(customerId)
  if (!profile) return

  const newStatus = mapStripeStatus(subscription.status)
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null
  const productId = subscription.items?.data?.[0]?.price?.product
  const planIdentifier = typeof productId === 'string' ? productId : priceId

  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    subscription_status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (planIdentifier) {
    updateData.subscription_plan = planIdentifier
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id)

  if (updateError) {
    logger.error(`Failed to update subscription for profile ${profile.id}`, updateError)
    throw new Error(`Subscription update failed: ${updateError.message}`)
  }

  logger.info(`Subscription updated for profile ${profile.id}: status=${newStatus}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  const profile = await findProfileByCustomerId(customerId)
  if (!profile) return

  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_plan: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (updateError) {
    logger.error(`Failed to cancel subscription for profile ${profile.id}`, updateError)
    throw new Error(`Subscription deletion failed: ${updateError.message}`)
  }

  await supabase.from('audit_logs').insert({
    user_id: profile.id,
    action: 'subscription.deleted',
    resource_type: 'profile',
    resource_id: profile.id,
    new_value: {
      subscription_plan: 'free',
      subscription_status: 'canceled',
      previous_plan: profile.subscription_plan,
      stripe_subscription_id: subscription.id,
    },
  })

  logger.info(`Subscription deleted for profile ${profile.id}: reverted to free`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id ?? null

  if (!customerId) {
    logger.warn('Invoice payment succeeded but no customer ID', { invoiceId: invoice.id })
    return
  }

  const profile = await findProfileByCustomerId(customerId)
  if (!profile) return

  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (updateError) {
    logger.error(`Failed to activate subscription for profile ${profile.id}`, updateError)
    throw new Error(`Invoice success update failed: ${updateError.message}`)
  }

  logger.info(`Invoice payment succeeded for profile ${profile.id}: status set to active`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id ?? null

  if (!customerId) {
    logger.warn('Invoice payment failed but no customer ID', { invoiceId: invoice.id })
    return
  }

  const profile = await findProfileByCustomerId(customerId)
  if (!profile) return

  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (updateError) {
    logger.error(`Failed to mark subscription past_due for profile ${profile.id}`, updateError)
    throw new Error(`Invoice failure update failed: ${updateError.message}`)
  }

  await supabase.from('audit_logs').insert({
    user_id: profile.id,
    action: 'subscription.payment_failed',
    resource_type: 'profile',
    resource_id: profile.id,
    new_value: {
      subscription_status: 'past_due',
      stripe_invoice_id: invoice.id,
      amount_due: invoice.amount_due,
    },
  })

  logger.info(`Invoice payment failed for profile ${profile.id}: status set to past_due`)
}
