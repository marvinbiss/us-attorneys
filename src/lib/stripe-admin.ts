import Stripe from 'stripe'
import { logger } from '@/lib/logger'

// Lazy Stripe initialization — avoids crash when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    _stripe = new Stripe(key, { apiVersion: '2023-10-16' })
  }
  return _stripe
}


/**
 * Retrieve a client's payment history
 */
export async function getCustomerPayments(customerId: string, limit = 10) {
  try {
    const paymentIntents = await getStripe().paymentIntents.list({
      customer: customerId,
      limit,
    })

    return paymentIntents.data.map((pi) => ({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      description: pi.description,
      created: new Date(pi.created * 1000).toISOString(),
      metadata: pi.metadata,
    }))
  } catch (error) {
    logger.error('Error fetching customer payments', error as Error)
    throw error
  }
}

/**
 * Retrieve subscription details
 */
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice'],
    })

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      items: subscription.items.data.map((item) => ({
        id: item.id,
        priceId: item.price.id,
        productId: typeof item.price.product === 'string' ? item.price.product : item.price.product.id,
        amount: item.price.unit_amount,
        interval: item.price.recurring?.interval,
      })),
    }
  } catch (error) {
    logger.error('Error fetching subscription', error as Error)
    throw error
  }
}

/**
 * Process a refund (full or partial)
 */
export async function processRefund(
  paymentIntentId: string,
  amount?: number, // In cents, undefined = full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
    }

    if (amount) {
      refundParams.amount = amount
    }

    const refund = await getStripe().refunds.create(refundParams)

    return {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      created: new Date(refund.created * 1000).toISOString(),
    }
  } catch (error) {
    logger.error('Error processing refund', error as Error)
    throw error
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
) {
  try {
    if (immediately) {
      // Immediate cancellation
      const subscription = await getStripe().subscriptions.cancel(subscriptionId)
      return {
        id: subscription.id,
        status: subscription.status,
        canceledAt: new Date().toISOString(),
      }
    } else {
      // Cancel at end of period
      const subscription = await getStripe().subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      return {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      }
    }
  } catch (error) {
    logger.error('Error canceling subscription', error as Error)
    throw error
  }
}

/**
 * Reactivate a cancelled subscription (if not yet expired)
 */
export async function reactivateSubscription(subscriptionId: string) {
  try {
    const subscription = await getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
    return {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: false,
    }
  } catch (error) {
    logger.error('Error reactivating subscription', error as Error)
    throw error
  }
}

/**
 * Change a subscription's plan
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPriceId: string,
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
) {
  try {
    // Retrieve l'abonnement actuel
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
    const subscriptionItemId = subscription.items.data[0].id

    // Update with the new price
    const updatedSubscription = await getStripe().subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
    })

    return {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      newPriceId,
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    }
  } catch (error) {
    logger.error('Error changing subscription plan', error as Error)
    throw error
  }
}

/**
 * Create a manual charge
 */
export async function createManualCharge(
  customerId: string,
  amount: number, // En centimes
  description: string,
  metadata?: Record<string, string>
) {
  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount,
      currency: 'eur',
      customer: customerId,
      description,
      metadata,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    })

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      created: new Date(paymentIntent.created * 1000).toISOString(),
    }
  } catch (error) {
    logger.error('Error creating manual charge', error as Error)
    throw error
  }
}

/**
 * Retrieve a client's invoices
 */
export async function getCustomerInvoices(customerId: string, limit = 10) {
  try {
    const invoices = await getStripe().invoices.list({
      customer: customerId,
      limit,
    })

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      pdfUrl: invoice.invoice_pdf,
      created: new Date(invoice.created * 1000).toISOString(),
      periodStart: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      periodEnd: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
    }))
  } catch (error) {
    logger.error('Error fetching customer invoices', error as Error)
    throw error
  }
}

/**
 * Retrieve all subscriptions with pagination
 */
export async function listAllSubscriptions(
  limit = 20,
  startingAfter?: string,
  status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'all'
) {
  try {
    const params: Stripe.SubscriptionListParams = {
      limit,
      expand: ['data.customer'],
    }

    if (startingAfter) {
      params.starting_after = startingAfter
    }

    if (status && status !== 'all') {
      params.status = status
    }

    const subscriptions = await getStripe().subscriptions.list(params)

    return {
      data: subscriptions.data.map((sub) => ({
        id: sub.id,
        customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        customerEmail:
          typeof sub.customer === 'object' && 'email' in sub.customer
            ? sub.customer.email
            : null,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        amount: sub.items.data[0]?.price.unit_amount || 0,
        interval: sub.items.data[0]?.price.recurring?.interval,
        priceId: sub.items.data[0]?.price.id,
        created: new Date(sub.created * 1000).toISOString(),
      })),
      hasMore: subscriptions.has_more,
    }
  } catch (error) {
    logger.error('Error listing subscriptions', error as Error)
    throw error
  }
}

/**
 * Get revenue statistics
 */
export async function getRevenueStats(days = 30) {
  try {
    const now = Math.floor(Date.now() / 1000)
    const startDate = now - days * 24 * 60 * 60

    const [charges, refunds] = await Promise.all([
      getStripe().charges.list({
        created: { gte: startDate },
        limit: 100,
      }),
      getStripe().refunds.list({
        created: { gte: startDate },
        limit: 100,
      }),
    ])

    const totalRevenue = charges.data
      .filter((c) => c.status === 'succeeded')
      .reduce((sum, c) => sum + c.amount, 0)

    const totalRefunded = refunds.data
      .filter((r) => r.status === 'succeeded')
      .reduce((sum, r) => sum + r.amount, 0)

    return {
      totalRevenue,
      totalRefunded,
      netRevenue: totalRevenue - totalRefunded,
      chargesCount: charges.data.length,
      refundsCount: refunds.data.length,
      period: `${days} derniers jours`,
    }
  } catch (error) {
    logger.error('Error getting revenue stats', error as Error)
    throw error
  }
}

// Export price IDs for plans
export const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
}
