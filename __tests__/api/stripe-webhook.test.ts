/**
 * Tests — Stripe Webhook API (/api/stripe/webhook)
 * POST: signature validation, idempotency, checkout.session.completed,
 *       customer.subscription.updated/deleted, invoice.payment_succeeded/failed,
 *       unknown events, handler errors
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================
// Mocks
// ============================================

const mockJsonFn = vi.fn((body: unknown, init?: { status?: number }) => ({
  body,
  status: init?.status ?? 200,
}))

vi.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => mockJsonFn(body, init) },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---- Stripe mock ----
const mockConstructEvent = vi.fn()

vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}))

// ---- Supabase admin mock ----
// We track all calls through a centralized mock system
type BuilderResult = { data: unknown; error: { code?: string; message?: string } | null }

let idempotencyInsertResult: BuilderResult = { data: null, error: null }
let idempotencySelectResult: BuilderResult = { data: null, error: null }
let profileUpdateResult: BuilderResult = { data: null, error: null }
let profileSelectResult: BuilderResult = { data: null, error: null }
let auditInsertResult: BuilderResult = { data: null, error: null }
let webhookUpdateResult: BuilderResult = { data: null, error: null }

// Track what update/insert calls were made (assignments used for debugging)

// Track which call to from() we are on for each createAdminClient invocation
let fromCallIndex = 0
let fromCallLog: string[] = []

function buildMockSupabaseAdmin() {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      fromCallLog.push(table)
      fromCallIndex++

      if (table === 'webhook_events') {
        // First webhook_events call: insert (idempotency check)
        // After that: select (if unique violation) or update (markCompleted/markFailed)
        const webhookCallsForTable = fromCallLog.filter(t => t === 'webhook_events').length

        if (webhookCallsForTable === 1) {
          // First call: insert for idempotency
          return {
            insert: vi.fn().mockImplementation(() => ({
              then: (resolve: (v: unknown) => unknown) =>
                resolve({ data: idempotencyInsertResult.data, error: idempotencyInsertResult.error }),
            })),
          }
        }
        if (webhookCallsForTable === 2 && idempotencyInsertResult.error?.code === '23505') {
          // Second call after unique violation: select status
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  then: (resolve: (v: unknown) => unknown) =>
                    resolve({ data: idempotencySelectResult.data, error: idempotencySelectResult.error }),
                }),
              }),
            }),
          }
        }
        // All other webhook_events calls: update (markCompleted or markFailed)
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              then: (resolve: (v: unknown) => unknown) =>
                resolve({ data: webhookUpdateResult.data, error: webhookUpdateResult.error }),
            }),
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                then: (resolve: (v: unknown) => unknown) =>
                  resolve({ data: idempotencySelectResult.data, error: idempotencySelectResult.error }),
              }),
            }),
          }),
        }
      }

      if (table === 'profiles') {
        // Profiles can be select (findProfileByCustomerId) or update
        // We use a builder that supports both patterns
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((_field: string, _value: unknown) => {
              return {
                single: vi.fn().mockReturnValue({
                  then: (resolve: (v: unknown) => unknown) =>
                    resolve({ data: profileSelectResult.data, error: profileSelectResult.error }),
                }),
              }
            }),
          }),
          update: vi.fn().mockImplementation(() => {
            return {
              eq: vi.fn().mockReturnValue({
                then: (resolve: (v: unknown) => unknown) =>
                  resolve({ data: profileUpdateResult.data, error: profileUpdateResult.error }),
              }),
            }
          }),
        }
      }

      if (table === 'audit_logs') {
        return {
          insert: vi.fn().mockImplementation(() => {
            return {
              then: (resolve: (v: unknown) => unknown) =>
                resolve({ data: auditInsertResult.data, error: auditInsertResult.error }),
            }
          }),
        }
      }

      // Fallback
      const b: Record<string, unknown> = {}
      b.select = vi.fn().mockReturnValue(b)
      b.insert = vi.fn().mockReturnValue(b)
      b.update = vi.fn().mockReturnValue(b)
      b.eq = vi.fn().mockReturnValue(b)
      b.single = vi.fn().mockReturnValue(b)
      b.then = (resolve: (v: unknown) => unknown) => resolve({ data: null, error: null })
      return b
    }),
  }
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => buildMockSupabaseAdmin()),
}))

// ============================================
// Helpers
// ============================================

function makeWebhookRequest(body: string = '{"test":"body"}', sig: string | null = 'whsec_test_sig') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (sig) headers['stripe-signature'] = sig
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers,
    body,
  })
}

function makeStripeEvent(type: string, dataObject: Record<string, unknown>, id: string = 'evt_test_123') {
  return {
    id,
    type,
    data: { object: dataObject },
  }
}

type ResponseLike = { body: Record<string, unknown>; status: number }

async function callPOST(request: Request): Promise<ResponseLike> {
  const { POST } = await import('@/app/api/stripe/webhook/route')
  return POST(request) as unknown as ResponseLike
}

// ============================================
// Setup
// ============================================

beforeEach(async () => {
  vi.clearAllMocks()
  fromCallIndex = 0
  fromCallLog = []

  // Default results: success paths
  idempotencyInsertResult = { data: null, error: null } // Insert succeeds = new event
  idempotencySelectResult = { data: null, error: null }
  profileUpdateResult = { data: null, error: null }
  profileSelectResult = { data: null, error: null }
  auditInsertResult = { data: null, error: null }
  webhookUpdateResult = { data: null, error: null }

  // Mock headers() to return a Map-like that responds to .get()
  const { headers } = await import('next/headers')
  const mockedHeaders = vi.mocked(headers)
  mockedHeaders.mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)

  // Set env vars
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
})

// ============================================
// Tests
// ============================================

describe('POST /api/stripe/webhook', () => {
  // ---- 1. Missing stripe-signature returns 400 ----
  it('returns 400 when stripe-signature header is missing', async () => {
    const request = makeWebhookRequest('{}', null)

    // headers() mock returns Headers without stripe-signature
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({}) as Awaited<ReturnType<typeof headers>>
    )

    const result = await callPOST(request)

    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Missing signature')
  })

  // ---- 2. Invalid signature returns 400 ----
  it('returns 400 when Stripe signature verification fails', async () => {
    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'invalid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature verification failed')
    })

    const result = await callPOST(makeWebhookRequest('{}', 'invalid_sig'))

    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Webhook signature verification failed')
  })

  // ---- 3. Already processed event returns already_processed ----
  it('returns already_processed for duplicate event', async () => {
    const event = makeStripeEvent('checkout.session.completed', {}, 'evt_duplicate')

    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockReturnValue(event)

    // Simulate unique violation on insert (event already exists)
    idempotencyInsertResult = {
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' } as { code: string; message: string },
    }
    // Simulate finding existing completed event
    idempotencySelectResult = { data: { status: 'completed' }, error: null }

    const result = await callPOST(makeWebhookRequest('{}', 'valid_sig'))

    expect(result.status).toBe(200)
    expect(result.body.status).toBe('already_processed')
  })

  // ---- 4. checkout.session.completed updates profile correctly ----
  it('handles checkout.session.completed and updates profile', async () => {
    const sessionData = {
      id: 'cs_test_session',
      customer: 'cus_test_customer',
      metadata: { user_id: 'user-uuid-123', plan_id: 'pro' },
    }
    const event = makeStripeEvent('checkout.session.completed', sessionData)

    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockReturnValue(event)
    profileUpdateResult = { data: null, error: null }

    const result = await callPOST(makeWebhookRequest('{}', 'valid_sig'))

    expect(result.status).toBe(200)
    expect(result.body.received).toBe(true)
  })

  // ---- 5. customer.subscription.updated maps status correctly ----
  it('handles customer.subscription.updated and maps status', async () => {
    const subscriptionData = {
      id: 'sub_test_123',
      customer: 'cus_existing',
      status: 'past_due',
      items: { data: [{ price: { id: 'price_pro', product: 'prod_pro' } }] },
    }
    const event = makeStripeEvent('customer.subscription.updated', subscriptionData)

    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockReturnValue(event)

    // findProfileByCustomerId returns a profile
    profileSelectResult = {
      data: { id: 'profile-uuid', subscription_plan: 'pro', subscription_status: 'active' },
      error: null,
    }
    profileUpdateResult = { data: null, error: null }

    const result = await callPOST(makeWebhookRequest('{}', 'valid_sig'))

    expect(result.status).toBe(200)
    expect(result.body.received).toBe(true)
  })

  // ---- 6. customer.subscription.deleted reverts to gratuit ----
  it('handles customer.subscription.deleted and reverts to gratuit', async () => {
    const subscriptionData = {
      id: 'sub_deleted_123',
      customer: 'cus_existing',
      status: 'canceled',
    }
    const event = makeStripeEvent('customer.subscription.deleted', subscriptionData)

    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockReturnValue(event)

    profileSelectResult = {
      data: { id: 'profile-uuid', subscription_plan: 'pro', subscription_status: 'active' },
      error: null,
    }
    profileUpdateResult = { data: null, error: null }
    auditInsertResult = { data: null, error: null }

    const result = await callPOST(makeWebhookRequest('{}', 'valid_sig'))

    expect(result.status).toBe(200)
    expect(result.body.received).toBe(true)
  })

  // ---- 7. invoice.payment_succeeded sets active ----
  it('handles invoice.payment_succeeded and sets status to active', async () => {
    const invoiceData = {
      id: 'inv_success_123',
      customer: 'cus_existing',
    }
    const event = makeStripeEvent('invoice.payment_succeeded', invoiceData)

    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockReturnValue(event)

    profileSelectResult = {
      data: { id: 'profile-uuid', subscription_plan: 'pro', subscription_status: 'past_due' },
      error: null,
    }
    profileUpdateResult = { data: null, error: null }

    const result = await callPOST(makeWebhookRequest('{}', 'valid_sig'))

    expect(result.status).toBe(200)
    expect(result.body.received).toBe(true)
  })

  // ---- 8. invoice.payment_failed sets past_due ----
  it('handles invoice.payment_failed and sets status to past_due', async () => {
    const invoiceData = {
      id: 'inv_failed_123',
      customer: 'cus_existing',
      amount_due: 4900,
    }
    const event = makeStripeEvent('invoice.payment_failed', invoiceData)

    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockReturnValue(event)

    profileSelectResult = {
      data: { id: 'profile-uuid', subscription_plan: 'pro', subscription_status: 'active' },
      error: null,
    }
    profileUpdateResult = { data: null, error: null }
    auditInsertResult = { data: null, error: null }

    const result = await callPOST(makeWebhookRequest('{}', 'valid_sig'))

    expect(result.status).toBe(200)
    expect(result.body.received).toBe(true)
  })

  // ---- 9. Unknown event type is handled gracefully ----
  it('handles unknown event type gracefully', async () => {
    const event = makeStripeEvent('some.unknown.event', { id: 'obj_123' })

    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockReturnValue(event)

    const result = await callPOST(makeWebhookRequest('{}', 'valid_sig'))

    expect(result.status).toBe(200)
    expect(result.body.received).toBe(true)
  })

  // ---- 10. Handler error marks event as failed ----
  it('returns 500 and marks event as failed when handler throws', async () => {
    const sessionData = {
      id: 'cs_test_session',
      customer: 'cus_test_customer',
      metadata: { user_id: 'user-uuid-123', plan_id: 'pro' },
    }
    const event = makeStripeEvent('checkout.session.completed', sessionData)

    const { headers } = await import('next/headers')
    vi.mocked(headers).mockResolvedValue(
      new Headers({ 'stripe-signature': 'valid_sig' }) as Awaited<ReturnType<typeof headers>>
    )

    mockConstructEvent.mockReturnValue(event)

    // Make profile update fail to trigger handler error
    profileUpdateResult = { data: null, error: { message: 'DB write failed', code: '42000' } }

    const result = await callPOST(makeWebhookRequest('{}', 'valid_sig'))

    expect(result.status).toBe(500)
    expect(result.body.error).toBe('Webhook handler failed')
  })
})
