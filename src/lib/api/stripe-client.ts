/**
 * Stripe API Client
 * Payment processing with world-class error handling
 * Documentation: https://stripe.com/docs/api
 */

import Stripe from 'stripe'
import { retry } from '../utils/retry'
import { APIError, ErrorCode, AppError } from '../utils/errors'
import { paymentLogger } from '@/lib/logger'

// Lazy-loaded Stripe client
let stripeClient: Stripe | null = null

function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new APIError('Stripe', 'API key not configured', {
      code: ErrorCode.API_UNAUTHORIZED,
    })
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
    maxNetworkRetries: 2,
  })

  return stripeClient
}

// Types
export interface CreateCustomerParams {
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  trialDays?: number
  metadata?: Record<string, string>
  couponId?: string
}

export interface CreatePaymentIntentParams {
  amount: number // in cents
  currency?: string
  customerId?: string
  description?: string
  metadata?: Record<string, string>
  receiptEmail?: string
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

/**
 * Create a new customer
 */
export async function createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
  const logger = paymentLogger.child({ action: 'createCustomer' })
  const start = Date.now()

  try {
    const stripe = getStripeClient()

    const customer = await retry(
      () => stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata,
      }),
      {
        maxAttempts: 3,
        initialDelay: 500,
        onRetry: (error, attempt) => {
          logger.warn(`Retry attempt ${attempt}`, { error })
        },
      }
    )

    logger.info('Customer created', {
      customerId: customer.id,
      email: params.email,
      duration: Date.now() - start,
    })

    return customer
  } catch (error) {
    logger.error('Failed to create customer', error as Error, { email: params.email })
    throw normalizeStripeError(error)
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const stripe = getStripeClient()
    const customer = await stripe.customers.retrieve(customerId)

    if ((customer as Stripe.DeletedCustomer).deleted) {
      return null
    }

    return customer as Stripe.Customer
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null
    }
    throw normalizeStripeError(error)
  }
}

/**
 * Update customer
 */
export async function updateCustomer(
  customerId: string,
  params: Partial<CreateCustomerParams>
): Promise<Stripe.Customer> {
  try {
    const stripe = getStripeClient()
    return await stripe.customers.update(customerId, {
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    })
  } catch (error) {
    throw normalizeStripeError(error)
  }
}

/**
 * Find customer by email
 */
export async function findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
  try {
    const stripe = getStripeClient()
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    })

    return customers.data[0] || null
  } catch (error) {
    throw normalizeStripeError(error)
  }
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Create subscription
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<Stripe.Subscription> {
  const logger = paymentLogger.child({ action: 'createSubscription' })

  try {
    const stripe = getStripeClient()

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    }

    if (params.trialDays) {
      subscriptionParams.trial_period_days = params.trialDays
    }

    if (params.couponId) {
      subscriptionParams.coupon = params.couponId
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams)

    logger.info('Subscription created', {
      subscriptionId: subscription.id,
      customerId: params.customerId,
      status: subscription.status,
    })

    return subscription
  } catch (error) {
    logger.error('Failed to create subscription', error as Error, {
      customerId: params.customerId,
    })
    throw normalizeStripeError(error)
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    const stripe = getStripeClient()
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice'],
    })
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null
    }
    throw normalizeStripeError(error)
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  options: { immediately?: boolean; reason?: string } = {}
): Promise<Stripe.Subscription> {
  const logger = paymentLogger.child({ action: 'cancelSubscription' })

  try {
    const stripe = getStripeClient()

    if (options.immediately) {
      const subscription = await stripe.subscriptions.cancel(subscriptionId, {
        cancellation_details: {
          comment: options.reason,
        },
      })

      logger.info('Subscription cancelled immediately', { subscriptionId })
      return subscription
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: options.reason,
      },
    })

    logger.info('Subscription scheduled for cancellation', {
      subscriptionId,
      cancelAt: subscription.cancel_at,
    })

    return subscription
  } catch (error) {
    logger.error('Failed to cancel subscription', error as Error, { subscriptionId })
    throw normalizeStripeError(error)
  }
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string,
  options: { prorate?: boolean } = {}
): Promise<Stripe.Subscription> {
  const logger = paymentLogger.child({ action: 'updateSubscription' })

  try {
    const stripe = getStripeClient()

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: options.prorate !== false ? 'create_prorations' : 'none',
    })

    logger.info('Subscription updated', {
      subscriptionId,
      newPriceId,
    })

    return updated
  } catch (error) {
    logger.error('Failed to update subscription', error as Error, { subscriptionId })
    throw normalizeStripeError(error)
  }
}

/**
 * List customer subscriptions
 */
export async function listSubscriptions(
  customerId: string,
  options: { status?: Stripe.Subscription.Status; limit?: number } = {}
): Promise<Stripe.Subscription[]> {
  try {
    const stripe = getStripeClient()
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: options.status,
      limit: options.limit || 10,
    })

    return subscriptions.data
  } catch (error) {
    throw normalizeStripeError(error)
  }
}

// ============================================
// PAYMENT INTENTS
// ============================================

/**
 * Create payment intent
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const logger = paymentLogger.child({ action: 'createPaymentIntent' })

  try {
    const stripe = getStripeClient()

    const intent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency || 'eur',
      customer: params.customerId,
      description: params.description,
      metadata: params.metadata,
      receipt_email: params.receiptEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    logger.info('Payment intent created', {
      intentId: intent.id,
      amount: params.amount,
    })

    return intent
  } catch (error) {
    logger.error('Failed to create payment intent', error as Error, {
      amount: params.amount,
    })
    throw normalizeStripeError(error)
  }
}

/**
 * Get payment intent
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  try {
    const stripe = getStripeClient()
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null
    }
    throw normalizeStripeError(error)
  }
}

/**
 * Confirm payment intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> {
  try {
    const stripe = getStripeClient()
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    })
  } catch (error) {
    throw normalizeStripeError(error)
  }
}

// ============================================
// REFUNDS
// ============================================

/**
 * Create refund
 */
export async function createRefund(
  paymentIntentId: string,
  options: { amount?: number; reason?: Stripe.RefundCreateParams.Reason } = {}
): Promise<Stripe.Refund> {
  const logger = paymentLogger.child({ action: 'createRefund' })

  try {
    const stripe = getStripeClient()

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: options.amount,
      reason: options.reason,
    })

    logger.info('Refund created', {
      refundId: refund.id,
      paymentIntentId,
      amount: refund.amount,
    })

    return refund
  } catch (error) {
    logger.error('Failed to create refund', error as Error, { paymentIntentId })
    throw normalizeStripeError(error)
  }
}

// ============================================
// INVOICES
// ============================================

/**
 * Get invoice
 */
export async function getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
  try {
    const stripe = getStripeClient()
    return await stripe.invoices.retrieve(invoiceId)
  } catch (error) {
    if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
      return null
    }
    throw normalizeStripeError(error)
  }
}

/**
 * List customer invoices
 */
export async function listInvoices(
  customerId: string,
  options: { limit?: number; status?: Stripe.Invoice.Status } = {}
): Promise<Stripe.Invoice[]> {
  try {
    const stripe = getStripeClient()
    const invoices = await stripe.invoices.list({
      customer: customerId,
      status: options.status,
      limit: options.limit || 10,
    })

    return invoices.data
  } catch (error) {
    throw normalizeStripeError(error)
  }
}

// ============================================
// CHECKOUT SESSIONS
// ============================================

/**
 * Create checkout session
 */
export async function createCheckoutSession(params: {
  customerId?: string
  customerEmail?: string
  priceId: string
  mode: 'subscription' | 'payment'
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  trialDays?: number
}): Promise<Stripe.Checkout.Session> {
  const logger = paymentLogger.child({ action: 'createCheckoutSession' })

  try {
    const stripe = getStripeClient()

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: params.mode,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    }

    if (params.customerId) {
      sessionParams.customer = params.customerId
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail
    }

    if (params.mode === 'subscription' && params.trialDays) {
      sessionParams.subscription_data = {
        trial_period_days: params.trialDays,
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    logger.info('Checkout session created', {
      sessionId: session.id,
      mode: params.mode,
    })

    return session
  } catch (error) {
    logger.error('Failed to create checkout session', error as Error)
    throw normalizeStripeError(error)
  }
}

// ============================================
// PORTAL
// ============================================

/**
 * Create customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    const stripe = getStripeClient()
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
  } catch (error) {
    throw normalizeStripeError(error)
  }
}

// ============================================
// WEBHOOKS
// ============================================

/**
 * Construct webhook event from request
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

// ============================================
// ERROR HANDLING
// ============================================

function normalizeStripeError(error: unknown): AppError {
  if (error instanceof Stripe.errors.StripeError) {
    const statusCode = error.statusCode || 500

    if (error.type === 'StripeCardError') {
      return new APIError('Stripe', error.message, {
        code: ErrorCode.PAYMENT_DECLINED,
        statusCode,
        retryable: false,
        context: {
          declineCode: error.decline_code,
          param: error.param,
        },
      })
    }

    if (error.type === 'StripeRateLimitError') {
      return new APIError('Stripe', 'Rate limit exceeded', {
        code: ErrorCode.API_RATE_LIMIT,
        statusCode: 429,
        retryable: true,
      })
    }

    if (error.type === 'StripeAuthenticationError') {
      return new APIError('Stripe', 'Authentication failed', {
        code: ErrorCode.API_UNAUTHORIZED,
        statusCode: 401,
        retryable: false,
      })
    }

    return new APIError('Stripe', error.message, {
      statusCode,
      retryable: statusCode >= 500,
      context: {
        type: error.type,
        code: error.code,
        param: error.param,
      },
    })
  }

  if (error instanceof AppError) {
    return error
  }

  return new APIError('Stripe', String(error), {
    code: ErrorCode.API_ERROR,
    retryable: true,
  })
}

// ============================================
// HELPERS
// ============================================

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

/**
 * Get subscription status label
 */
export function getSubscriptionStatusLabel(status: Stripe.Subscription.Status): string {
  const labels: Record<Stripe.Subscription.Status, string> = {
    active: 'Actif',
    past_due: 'En retard',
    unpaid: 'Unpaid',
    canceled: 'Cancelled',
    incomplete: 'Incomplet',
    incomplete_expired: 'Expired',
    trialing: 'Essai',
    paused: 'Suspendu',
  }
  return labels[status] || status
}
