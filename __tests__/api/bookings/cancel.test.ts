/**
 * Tests -- Bookings Cancel API (/api/bookings/[id]/cancel)
 * POST: validation, ownership check, already-cancelled, 24h rule, success
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

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/notifications/email', () => ({
  sendCancellationNotification: vi.fn().mockResolvedValue({
    clientNotification: { success: true },
    providerNotification: { success: true },
  }),
  logNotification: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/push/send', () => ({
  sendPushToUser: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/push/notifications', () => ({
  NOTIFICATION_TEMPLATES: {
    BOOKING_CANCELLED: vi.fn().mockReturnValue({ title: 'Cancelled', body: 'Booking cancelled' }),
  },
}))

// Supabase builder state
let mockBookingResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockUpdateResult: { error: unknown } = { error: null }
let mockProfileResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockAttorneyResult: { data: unknown; error: unknown } = { data: null, error: null }
let fromCallCount = 0

function makeBuilder(result: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {}
  b.select = vi.fn().mockReturnValue(b)
  b.eq = vi.fn().mockReturnValue(b)
  b.single = vi.fn().mockReturnValue(b)
  b.update = vi.fn().mockReturnValue(b)
  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: result.data, error: result.error })
  return b
}

function makeUpdateBuilder(result: { error: unknown }) {
  const b: Record<string, unknown> = {}
  b.update = vi.fn().mockReturnValue(b)
  b.eq = vi.fn().mockReturnValue(b)
  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: null, error: result.error })
  return b
}

const USER_UUID = '550e8400-e29b-41d4-a716-446655440099'

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: USER_UUID, email: 'test@example.com' } },
      error: null,
    }),
  },
  from: vi.fn((_table: string) => {
    fromCallCount++
    // 1st call = booking fetch, 2nd call = update, 3rd+ = profiles/attorneys
    if (fromCallCount === 1) return makeBuilder(mockBookingResult)
    if (fromCallCount === 2) return makeUpdateBuilder(mockUpdateResult)
    if (fromCallCount === 3) return makeBuilder(mockProfileResult)
    return makeBuilder(mockAttorneyResult)
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((_table: string) => {
      fromCallCount++
      if (fromCallCount <= 4) return makeBuilder(mockProfileResult)
      return makeBuilder(mockAttorneyResult)
    }),
  })),
}))

vi.mock('@/lib/session-timeout', () => ({
  checkSessionIdle: vi.fn().mockResolvedValue({ expired: false }),
  touchSession: vi.fn().mockResolvedValue(undefined),
}))

// ============================================
// Helpers
// ============================================

const BOOKING_UUID = '550e8400-e29b-41d4-a716-446655440010'

function makePostRequest(body: Record<string, unknown>) {
  return new Request(`http://localhost/api/bookings/${BOOKING_UUID}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Future date (48h from now) to satisfy 24h cancellation rule
const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

const validBooking = {
  id: BOOKING_UUID,
  client_id: USER_UUID,
  attorney_id: '550e8400-e29b-41d4-a716-446655440001',
  status: 'confirmed',
  scheduled_at: futureDate,
  client_name: 'John Smith',
  client_email: 'john@example.com',
  service_description: 'Personal Injury Consultation',
}

beforeEach(() => {
  vi.clearAllMocks()
  fromCallCount = 0
  mockBookingResult = { data: null, error: null }
  mockUpdateResult = { error: null }
  mockProfileResult = { data: { full_name: 'Attorney Williams', email: 'williams@law.com' }, error: null }
  mockAttorneyResult = { data: { user_id: 'att-user-id' }, error: null }
})

// ============================================
// Tests
// ============================================

describe('POST /api/bookings/[id]/cancel', () => {
  it('returns 400 when cancelledBy is missing', async () => {
    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      makePostRequest({}) as never,
      { params: { id: BOOKING_UUID } }
    ) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 400 when cancelledBy has invalid value', async () => {
    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      makePostRequest({ cancelledBy: 'admin' }) as never,
      { params: { id: BOOKING_UUID } }
    ) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 404 when booking not found', async () => {
    mockBookingResult = { data: null, error: { message: 'No rows found', code: 'PGRST116' } }

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      makePostRequest({ cancelledBy: 'client' }) as never,
      { params: { id: BOOKING_UUID } }
    ) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(404)
  })

  it('returns 403 when user is not the client or attorney', async () => {
    mockBookingResult = {
      data: {
        ...validBooking,
        client_id: 'someone-else',
        attorney_id: 'another-person',
      },
      error: null,
    }

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      makePostRequest({ cancelledBy: 'client' }) as never,
      { params: { id: BOOKING_UUID } }
    ) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(403)
  })

  it('returns 400 when booking is already cancelled', async () => {
    mockBookingResult = {
      data: { ...validBooking, status: 'cancelled' },
      error: null,
    }

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      makePostRequest({ cancelledBy: 'client' }) as never,
      { params: { id: BOOKING_UUID } }
    ) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 400 when client cancels less than 24h before booking', async () => {
    // Booking scheduled in 2 hours (less than 24h)
    const soonDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    mockBookingResult = {
      data: { ...validBooking, scheduled_at: soonDate },
      error: null,
    }

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      makePostRequest({ cancelledBy: 'client' }) as never,
      { params: { id: BOOKING_UUID } }
    ) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
  })

  it('succeeds when client cancels more than 24h before', async () => {
    mockBookingResult = {
      data: validBooking,
      error: null,
    }

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      makePostRequest({ cancelledBy: 'client', reason: 'Changed my mind' }) as never,
      { params: { id: BOOKING_UUID } }
    ) as unknown as { body: { success: boolean; data: { message: string } }; status: number }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.data.message).toContain('cancelled')
  })

  it('allows attorney to cancel even within 24h window', async () => {
    const soonDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    mockBookingResult = {
      data: {
        ...validBooking,
        attorney_id: USER_UUID, // Current user IS the attorney
        scheduled_at: soonDate,
      },
      error: null,
    }

    const { POST } = await import('@/app/api/bookings/[id]/cancel/route')
    const result = await POST(
      makePostRequest({ cancelledBy: 'attorney' }) as never,
      { params: { id: BOOKING_UUID } }
    ) as unknown as { body: { success: boolean }; status: number }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
  })
})
