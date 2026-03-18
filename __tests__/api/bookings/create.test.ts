/**
 * Tests — POST /api/bookings/create
 * Idempotency, validation, overlap detection, booking creation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockHandleIdempotency = vi.fn()
const mockCacheIdempotencyResult = vi.fn()
vi.mock('@/lib/idempotency', () => ({
  handleIdempotency: (...args: unknown[]) => mockHandleIdempotency(...args),
  cacheIdempotencyResult: (...args: unknown[]) => mockCacheIdempotencyResult(...args),
}))

const mockRateLimit = vi.fn()
vi.mock('@/lib/rate-limiter', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  RATE_LIMITS: {
    booking: { maxRequests: 10, windowMs: 60000 },
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Supabase mock
const mockSupabaseFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  }),
}))

vi.mock('@/lib/daily', () => ({
  createDailyRoom: vi.fn().mockResolvedValue({ url: 'https://daily.co/room', name: 'test-room' }),
}))

vi.mock('@/lib/services/email-service', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  emailTemplates: {
    bookingConfirmationClient: vi.fn().mockReturnValue({ subject: 's', html: 'h' }),
    bookingNotificationAttorney: vi.fn().mockReturnValue({ subject: 's', html: 'h' }),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ATTORNEY_UUID = '550e8400-e29b-41d4-a716-446655440001'
const SPECIALTY_UUID = '550e8400-e29b-41d4-a716-446655440010'

function makePostRequest(body: Record<string, unknown>, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/bookings/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

const validBody = {
  attorney_id: ATTORNEY_UUID,
  scheduled_at: '2026-04-01T14:00:00.000Z',
  duration_minutes: 30,
  client_name: 'John Smith',
  client_email: 'john@example.com',
  client_phone: '2125551234',
}

// Chain builder for supabase queries
function makeChainBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn().mockReturnValue(builder)
  builder.insert = vi.fn().mockReturnValue(builder)
  builder.eq = vi.fn().mockReturnValue(builder)
  builder.neq = vi.fn().mockReturnValue(builder)
  builder.gte = vi.fn().mockReturnValue(builder)
  builder.lte = vi.fn().mockReturnValue(builder)
  builder.single = vi.fn().mockResolvedValue(result)
  // For queries that resolve the full chain (without .single())
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return builder
}

let fromCallCount = 0

beforeEach(() => {
  vi.clearAllMocks()
  fromCallCount = 0

  // Default: rate limit passes
  mockRateLimit.mockResolvedValue({ success: true, reset: Date.now() + 60000 })
  // Default: no idempotency
  mockHandleIdempotency.mockResolvedValue(null)
})

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------
describe('Idempotency', () => {
  it('returns cached response when idempotency key hits cache', async () => {
    const { NextResponse } = await import('next/server')
    const cachedResponse = NextResponse.json({ cached: true }, { status: 201 })
    mockHandleIdempotency.mockResolvedValue({ cached: cachedResponse })

    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(makePostRequest(validBody, { 'x-idempotency-key': 'test-key' }))

    expect(result).toBe(cachedResponse)
    // Should not proceed to rate limiting or DB
    expect(mockRateLimit).not.toHaveBeenCalled()
  })

  it('proceeds normally when idempotency returns a new key', async () => {
    mockHandleIdempotency.mockResolvedValue({ key: 'new-key' })

    // Attorney lookup
    mockSupabaseFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        // attorneys lookup
        return makeChainBuilder({ data: { id: ATTORNEY_UUID, name: 'Test Attorney' }, error: null })
      }
      if (fromCallCount === 2) {
        // conflict check - no conflicts
        return makeChainBuilder({ data: [], error: null })
      }
      if (fromCallCount === 3) {
        // insert booking
        return makeChainBuilder({
          data: {
            id: 'booking-id',
            attorney_id: ATTORNEY_UUID,
            scheduled_at: validBody.scheduled_at,
            duration_minutes: 30,
            status: 'pending',
            daily_room_url: null,
            client_name: 'John Smith',
            client_email: 'john@example.com',
            created_at: '2026-04-01T00:00:00Z',
          },
          error: null,
        })
      }
      // Attorney email lookup
      return makeChainBuilder({ data: { email: 'attorney@example.com' }, error: null })
    })

    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(makePostRequest(validBody, { 'x-idempotency-key': 'new-key' }))
    const body = await result.json()

    expect(result.status).toBe(201)
    expect(body.success).toBe(true)
    expect(mockCacheIdempotencyResult).toHaveBeenCalledWith('new-key', 201, expect.any(Object))
  })
})

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
describe('Rate limiting', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockResolvedValue({ success: false, reset: Date.now() + 30000 })

    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(makePostRequest(validBody))
    const body = await result.json()

    expect(result.status).toBe(429)
    expect(body.error).toContain('Too many requests')
    expect(result.headers.get('Retry-After')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
describe('Validation', () => {
  it('returns 400 when attorney_id is missing', async () => {
    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(
      makePostRequest({
        scheduled_at: '2026-04-01T14:00:00.000Z',
        client_name: 'John',
        client_email: 'john@example.com',
      })
    )
    const body = await result.json()

    expect(result.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('returns 400 when client_email is invalid', async () => {
    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(
      makePostRequest({
        ...validBody,
        client_email: 'not-an-email',
      })
    )
    const body = await result.json()

    expect(result.status).toBe(400)
    expect(body.details).toBeDefined()
  })

  it('returns 400 when client_name is too short', async () => {
    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(
      makePostRequest({
        ...validBody,
        client_name: 'J',
      })
    )

    expect(result.status).toBe(400)
  })

  it('returns 400 when scheduled_at is not a valid datetime', async () => {
    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(
      makePostRequest({
        ...validBody,
        scheduled_at: 'not-a-date',
      })
    )

    expect(result.status).toBe(400)
  })

  it('returns 400 when duration_minutes exceeds 120', async () => {
    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(
      makePostRequest({
        ...validBody,
        duration_minutes: 180,
      })
    )

    expect(result.status).toBe(400)
  })

  it('returns 400 for non-JSON body', async () => {
    const { POST } = await import('@/app/api/bookings/create/route')
    const req = new NextRequest('http://localhost/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const result = await POST(req)

    expect(result.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Attorney lookup
// ---------------------------------------------------------------------------
describe('Attorney lookup', () => {
  it('returns 404 when attorney does not exist', async () => {
    mockSupabaseFrom.mockReturnValue(
      makeChainBuilder({ data: null, error: { message: 'not found' } })
    )

    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(makePostRequest(validBody))
    const body = await result.json()

    expect(result.status).toBe(404)
    expect(body.error).toBe('Attorney not found')
  })
})

// ---------------------------------------------------------------------------
// Overlap detection
// ---------------------------------------------------------------------------
describe('Overlap detection', () => {
  it('returns 409 when time slot conflicts with existing booking', async () => {
    mockSupabaseFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        // attorney lookup - found
        return makeChainBuilder({ data: { id: ATTORNEY_UUID, name: 'Test' }, error: null })
      }
      // conflict check - has overlapping booking
      const conflictBuilder = makeChainBuilder({
        data: [
          {
            id: 'existing-booking',
            scheduled_at: '2026-04-01T13:45:00.000Z', // overlaps with 14:00
            duration_minutes: 30, // ends at 14:15
          },
        ],
        error: null,
      })
      // Override .then to return array directly (not via .single())
      return conflictBuilder
    })

    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(makePostRequest(validBody))
    const body = await result.json()

    expect(result.status).toBe(409)
    expect(body.error).toContain('conflicts')
  })
})

// ---------------------------------------------------------------------------
// Successful booking
// ---------------------------------------------------------------------------
describe('Successful booking', () => {
  it('returns 201 with booking data on success', async () => {
    mockSupabaseFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return makeChainBuilder({ data: { id: ATTORNEY_UUID, name: 'Jane Doe' }, error: null })
      }
      if (fromCallCount === 2) {
        return makeChainBuilder({ data: [], error: null }) // no conflicts
      }
      if (fromCallCount === 3) {
        return makeChainBuilder({
          data: {
            id: 'new-booking-id',
            attorney_id: ATTORNEY_UUID,
            scheduled_at: validBody.scheduled_at,
            duration_minutes: 30,
            status: 'pending',
            daily_room_url: 'https://daily.co/room',
            client_name: 'John Smith',
            client_email: 'john@example.com',
            created_at: '2026-04-01T00:00:00Z',
          },
          error: null,
        })
      }
      // Attorney email fetch
      return makeChainBuilder({ data: { email: 'jane@law.com' }, error: null })
    })

    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(makePostRequest(validBody))
    const body = await result.json()

    expect(result.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.booking.id).toBe('new-booking-id')
    expect(body.booking.client_name).toBe('John Smith')
  })

  it('sets status to confirmed when payment_intent_id is provided', async () => {
    mockSupabaseFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return makeChainBuilder({ data: { id: ATTORNEY_UUID, name: 'Jane' }, error: null })
      }
      if (fromCallCount === 2) {
        return makeChainBuilder({ data: [], error: null })
      }
      if (fromCallCount === 3) {
        return makeChainBuilder({
          data: {
            id: 'paid-booking',
            attorney_id: ATTORNEY_UUID,
            scheduled_at: validBody.scheduled_at,
            duration_minutes: 30,
            status: 'confirmed',
            daily_room_url: null,
            client_name: 'John Smith',
            client_email: 'john@example.com',
            created_at: '2026-04-01T00:00:00Z',
          },
          error: null,
        })
      }
      return makeChainBuilder({ data: { email: 'jane@law.com' }, error: null })
    })

    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(
      makePostRequest({ ...validBody, payment_intent_id: 'pi_test123' })
    )
    const body = await result.json()

    expect(result.status).toBe(201)
    expect(body.booking.status).toBe('confirmed')
  })
})

// ---------------------------------------------------------------------------
// Insert failure
// ---------------------------------------------------------------------------
describe('Insert failure', () => {
  it('returns 500 when booking insert fails', async () => {
    mockSupabaseFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return makeChainBuilder({ data: { id: ATTORNEY_UUID, name: 'Jane' }, error: null })
      }
      if (fromCallCount === 2) {
        return makeChainBuilder({ data: [], error: null })
      }
      // Insert fails
      return makeChainBuilder({ data: null, error: { message: 'Insert failed' } })
    })

    const { POST } = await import('@/app/api/bookings/create/route')
    const result = await POST(makePostRequest(validBody))
    const body = await result.json()

    expect(result.status).toBe(500)
    expect(body.error).toBe('Failed to create booking')
  })
})
