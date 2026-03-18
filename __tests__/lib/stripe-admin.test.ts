/**
 * Tests -- Stripe Admin Library (src/lib/stripe-admin.ts)
 * Tests for: getSubscription, getCustomerPayments, processRefund,
 *            cancelSubscription, validateStripePriceIds, PRICE_IDS
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================
// Mocks
// ============================================

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock Stripe SDK as a class constructor
const mockPaymentIntentsList = vi.fn()
const mockSubscriptionsRetrieve = vi.fn()
const mockSubscriptionsCancel = vi.fn()
const mockSubscriptionsUpdate = vi.fn()
const mockSubscriptionsList = vi.fn()
const mockRefundsCreate = vi.fn()
const mockRefundsList = vi.fn()
const mockChargesList = vi.fn()
const mockPaymentIntentsCreate = vi.fn()
const mockInvoicesList = vi.fn()

function createMockStripeInstance() {
  return {
    paymentIntents: { list: mockPaymentIntentsList, create: mockPaymentIntentsCreate },
    subscriptions: { retrieve: mockSubscriptionsRetrieve, cancel: mockSubscriptionsCancel, update: mockSubscriptionsUpdate, list: mockSubscriptionsList },
    refunds: { create: mockRefundsCreate, list: mockRefundsList },
    charges: { list: mockChargesList },
    invoices: { list: mockInvoicesList },
  }
}

vi.mock('stripe', () => {
  // Use a real class so `new Stripe(...)` works
  class StripeMock {
    paymentIntents: ReturnType<typeof createMockStripeInstance>['paymentIntents']
    subscriptions: ReturnType<typeof createMockStripeInstance>['subscriptions']
    refunds: ReturnType<typeof createMockStripeInstance>['refunds']
    charges: ReturnType<typeof createMockStripeInstance>['charges']
    invoices: ReturnType<typeof createMockStripeInstance>['invoices']
    constructor() {
      const instance = createMockStripeInstance()
      this.paymentIntents = instance.paymentIntents
      this.subscriptions = instance.subscriptions
      this.refunds = instance.refunds
      this.charges = instance.charges
      this.invoices = instance.invoices
    }
  }
  return { default: StripeMock }
})

// Save original env
const originalEnv = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key'
  process.env.STRIPE_PRO_PRICE_ID = 'price_pro_123'
  process.env.STRIPE_PREMIUM_PRICE_ID = 'price_premium_456'
})

afterEach(() => {
  process.env = { ...originalEnv }
})

// ============================================
// Tests
// ============================================

describe('getSubscription', () => {
  it('returns formatted subscription data', async () => {
    mockSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      cancel_at_period_end: false,
      canceled_at: null,
      items: {
        data: [{
          id: 'si_1',
          price: { id: 'price_pro_123', product: 'prod_1', unit_amount: 4900, recurring: { interval: 'month' } },
        }],
      },
    })

    const { getSubscription } = await import('@/lib/stripe-admin')
    const result = await getSubscription('sub_123')

    expect(result.id).toBe('sub_123')
    expect(result.status).toBe('active')
    expect(result.cancelAtPeriodEnd).toBe(false)
    expect(result.canceledAt).toBeNull()
    expect(result.items).toHaveLength(1)
    expect(result.items[0].priceId).toBe('price_pro_123')
    expect(result.items[0].interval).toBe('month')
  })

  it('formats canceledAt date when subscription is canceled', async () => {
    mockSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_456',
      status: 'canceled',
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      cancel_at_period_end: false,
      canceled_at: 1701000000,
      items: { data: [] },
    })

    const { getSubscription } = await import('@/lib/stripe-admin')
    const result = await getSubscription('sub_456')

    expect(result.canceledAt).toBeTruthy()
    expect(typeof result.canceledAt).toBe('string')
  })

  it('throws on Stripe API error', async () => {
    mockSubscriptionsRetrieve.mockRejectedValue(new Error('Stripe API error'))

    const { getSubscription } = await import('@/lib/stripe-admin')
    await expect(getSubscription('sub_bad')).rejects.toThrow('Stripe API error')
  })
})

describe('getCustomerPayments', () => {
  it('returns formatted payment data', async () => {
    mockPaymentIntentsList.mockResolvedValue({
      data: [{
        id: 'pi_1',
        amount: 4900,
        currency: 'usd',
        status: 'succeeded',
        description: 'Pro subscription',
        created: 1700000000,
        metadata: { plan: 'pro' },
      }],
    })

    const { getCustomerPayments } = await import('@/lib/stripe-admin')
    const result = await getCustomerPayments('cus_123')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('pi_1')
    expect(result[0].amount).toBe(4900)
    expect(result[0].currency).toBe('usd')
    expect(result[0].status).toBe('succeeded')
  })

  it('respects limit parameter', async () => {
    mockPaymentIntentsList.mockResolvedValue({ data: [] })

    const { getCustomerPayments } = await import('@/lib/stripe-admin')
    await getCustomerPayments('cus_123', 5)

    expect(mockPaymentIntentsList).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_123', limit: 5 })
    )
  })

  it('throws on Stripe error', async () => {
    mockPaymentIntentsList.mockRejectedValue(new Error('Network error'))

    const { getCustomerPayments } = await import('@/lib/stripe-admin')
    await expect(getCustomerPayments('cus_bad')).rejects.toThrow('Network error')
  })
})

describe('processRefund', () => {
  it('creates a full refund', async () => {
    mockRefundsCreate.mockResolvedValue({
      id: 're_1', amount: 4900, currency: 'usd', status: 'succeeded',
      reason: 'requested_by_customer', created: 1700000000,
    })

    const { processRefund } = await import('@/lib/stripe-admin')
    const result = await processRefund('pi_1')

    expect(result.id).toBe('re_1')
    expect(result.amount).toBe(4900)
    expect(result.status).toBe('succeeded')
  })

  it('creates a partial refund with amount', async () => {
    mockRefundsCreate.mockResolvedValue({
      id: 're_2', amount: 2000, currency: 'usd', status: 'succeeded',
      reason: 'duplicate', created: 1700000000,
    })

    const { processRefund } = await import('@/lib/stripe-admin')
    const result = await processRefund('pi_1', 2000, 'duplicate')

    expect(result.amount).toBe(2000)
    expect(mockRefundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 2000, reason: 'duplicate' })
    )
  })

  it('throws on Stripe refund error', async () => {
    mockRefundsCreate.mockRejectedValue(new Error('Refund failed'))

    const { processRefund } = await import('@/lib/stripe-admin')
    await expect(processRefund('pi_bad')).rejects.toThrow('Refund failed')
  })
})

describe('cancelSubscription', () => {
  it('cancels immediately when immediately=true', async () => {
    mockSubscriptionsCancel.mockResolvedValue({ id: 'sub_1', status: 'canceled' })

    const { cancelSubscription } = await import('@/lib/stripe-admin')
    const result = await cancelSubscription('sub_1', true)

    expect(result.status).toBe('canceled')
    expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_1')
  })

  it('cancels at period end by default', async () => {
    mockSubscriptionsUpdate.mockResolvedValue({
      id: 'sub_1', status: 'active', cancel_at_period_end: true, current_period_end: 1702592000,
    })

    const { cancelSubscription } = await import('@/lib/stripe-admin')
    const result = await cancelSubscription('sub_1')

    expect(result.cancelAtPeriodEnd).toBe(true)
    expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_1', { cancel_at_period_end: true })
  })

  it('throws on cancellation error', async () => {
    mockSubscriptionsUpdate.mockRejectedValue(new Error('Subscription not found'))

    const { cancelSubscription } = await import('@/lib/stripe-admin')
    await expect(cancelSubscription('sub_bad')).rejects.toThrow()
  })
})

describe('validateStripePriceIds', () => {
  it('returns true when both price IDs are set', async () => {
    const { validateStripePriceIds } = await import('@/lib/stripe-admin')
    const result = validateStripePriceIds()
    expect(result).toBe(true)
  })

  it('returns false when price IDs are missing', async () => {
    delete process.env.STRIPE_PRO_PRICE_ID
    delete process.env.STRIPE_PREMIUM_PRICE_ID
    vi.resetModules()

    const { validateStripePriceIds } = await import('@/lib/stripe-admin')
    const result = validateStripePriceIds()
    expect(result).toBe(false)
  })
})

describe('PRICE_IDS', () => {
  it('exports pro and premium price IDs from env', async () => {
    const { PRICE_IDS } = await import('@/lib/stripe-admin')
    expect(PRICE_IDS.pro).toBe('price_pro_123')
    expect(PRICE_IDS.premium).toBe('price_premium_456')
  })
})
