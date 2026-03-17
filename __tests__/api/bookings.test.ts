/**
 * Tests — Bookings API (/api/bookings)
 * GET: param validation, slots by month, slots by date, default bookings list, DB errors
 * POST: validation, atomic RPC success/failure, slot conflicts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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

vi.mock('@/lib/notifications/unified-notification-service', () => ({
  sendBookingNotifications: vi.fn().mockResolvedValue(undefined),
}))

// Supabase builder state
let mockQueryResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockRpcResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockProfileResult: { data: unknown; error: unknown } = { data: null, error: null }
let fromCallCount = 0

function makeBuilder(result: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {}
  const chain = () => b
  b.select = vi.fn().mockReturnValue(b)
  b.eq = vi.fn().mockReturnValue(b)
  b.gte = vi.fn().mockReturnValue(b)
  b.lte = vi.fn().mockReturnValue(b)
  b.order = vi.fn().mockReturnValue(b)
  b.single = vi.fn().mockReturnValue(b)
  b.in = vi.fn().mockReturnValue(b)
  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: result.data, error: result.error })
  void chain
  return b
}

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: '550e8400-e29b-41d4-a716-446655440099', email: 'test@example.com' } },
      error: null,
    }),
  },
  from: vi.fn((_table: string) => {
    fromCallCount++
    // First call = main query, second call = profiles lookup
    if (fromCallCount > 1) return makeBuilder(mockProfileResult)
    return makeBuilder(mockQueryResult)
  }),
  rpc: vi.fn().mockImplementation(() =>
    Promise.resolve({ data: mockRpcResult.data, error: mockRpcResult.error })
  ),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => makeBuilder(mockProfileResult)),
  })),
}))

// ============================================
// Helpers
// ============================================

const ATTORNEY_UUID = '550e8400-e29b-41d4-a716-446655440001'

function makeGetRequest(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params)
  return new Request(`http://localhost/api/bookings?${searchParams.toString()}`) as unknown as NextRequest
}

function makePostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

const validBookingBody = {
  attorneyId: ATTORNEY_UUID,
  slotId: '550e8400-e29b-41d4-a716-446655440002',
  clientName: 'John Smith',
  clientPhone: '2125551234',
  clientEmail: 'john@example.com',
}

beforeEach(() => {
  vi.clearAllMocks()
  fromCallCount = 0
  mockQueryResult = { data: null, error: null }
  mockRpcResult = { data: null, error: null }
  mockProfileResult = { data: null, error: null }
})

// ============================================
// GET tests
// ============================================

describe('GET /api/bookings', () => {
  it('returns 400 when attorneyId is missing', async () => {
    const { GET } = await import('@/app/api/bookings/route')
    const result = await GET(makeGetRequest()) as unknown as { body: Record<string, unknown>; status: number }
    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 400 when attorneyId is not a UUID', async () => {
    const { GET } = await import('@/app/api/bookings/route')
    const result = await GET(makeGetRequest({ attorneyId: 'not-a-uuid' })) as unknown as { body: Record<string, unknown>; status: number }
    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns slots grouped by date when month param provided', async () => {
    mockQueryResult = {
      data: [
        { id: 's1', attorney_id: ATTORNEY_UUID, date: '2026-03-05', start_time: '09:00', end_time: '10:00', is_available: true },
        { id: 's2', attorney_id: ATTORNEY_UUID, date: '2026-03-05', start_time: '14:00', end_time: '15:00', is_available: true },
        { id: 's3', attorney_id: ATTORNEY_UUID, date: '2026-03-10', start_time: '10:00', end_time: '11:00', is_available: true },
      ],
      error: null,
    }

    const { GET } = await import('@/app/api/bookings/route')
    const result = await GET(makeGetRequest({ attorneyId: ATTORNEY_UUID, month: '2026-03' })) as unknown as {
      body: { success: boolean; data: { slots: Record<string, unknown[]> } }; status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.data.slots['2026-03-05']).toHaveLength(2)
    expect(result.body.data.slots['2026-03-10']).toHaveLength(1)
  })

  it('returns slots with booking info when date param provided', async () => {
    mockQueryResult = {
      data: [
        { id: 's1', attorney_id: ATTORNEY_UUID, date: '2026-03-05', start_time: '09:00', end_time: '10:00', is_available: false, booking: { id: 'b1', client_name: 'Alice', status: 'confirmed' } },
      ],
      error: null,
    }

    const { GET } = await import('@/app/api/bookings/route')
    const result = await GET(makeGetRequest({ attorneyId: ATTORNEY_UUID, date: '2026-03-05' })) as unknown as {
      body: { success: boolean; data: { slots: unknown[] } }; status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(Array.isArray(result.body.data.slots)).toBe(true)
  })

  it('returns bookings list by default (no date/month)', async () => {
    mockQueryResult = {
      data: [
        { id: 'b1', provider_id: ATTORNEY_UUID, status: 'confirmed', client_name: 'Alice', created_at: '2026-02-01T00:00:00Z' },
        { id: 'b2', provider_id: ATTORNEY_UUID, status: 'pending', client_name: 'Bob', created_at: '2026-02-02T00:00:00Z' },
      ],
      error: null,
    }

    const { GET } = await import('@/app/api/bookings/route')
    const result = await GET(makeGetRequest({ attorneyId: ATTORNEY_UUID })) as unknown as {
      body: { success: boolean; data: { bookings: unknown[] } }; status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.data.bookings).toHaveLength(2)
  })

  it('returns 500 on database error', async () => {
    mockQueryResult = { data: null, error: { message: 'DB connection failed', code: '08000' } }

    const { GET } = await import('@/app/api/bookings/route')
    const result = await GET(makeGetRequest({ attorneyId: ATTORNEY_UUID })) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
  })
})

// ============================================
// POST tests
// ============================================

describe('POST /api/bookings', () => {
  it('returns 400 on missing required fields', async () => {
    const { POST } = await import('@/app/api/bookings/route')
    const result = await POST(makePostRequest({ attorneyId: ATTORNEY_UUID })) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 400 on invalid email', async () => {
    const { POST } = await import('@/app/api/bookings/route')
    const result = await POST(makePostRequest({ ...validBookingBody, clientEmail: 'not-an-email' })) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 201 on successful booking creation', async () => {
    mockRpcResult = {
      data: {
        success: true,
        booking_id: 'new-booking-uuid',
        slot: { date: '2026-03-10', start_time: '09:00', end_time: '10:00' },
      },
      error: null,
    }
    mockProfileResult = { data: { full_name: 'Attorney Williams', email: 'williams@example.com' }, error: null }

    const { POST } = await import('@/app/api/bookings/route')
    const result = await POST(makePostRequest(validBookingBody)) as unknown as {
      body: { success: boolean; data: { booking: Record<string, unknown>; message: string } }; status: number
    }

    expect(result.status).toBe(201)
    expect(result.body.success).toBe(true)
    expect(result.body.data.booking.id).toBe('new-booking-uuid')
    expect(result.body.data.booking.status).toBe('confirmed')
  })

  it('returns 409 when slot is unavailable', async () => {
    mockRpcResult = {
      data: { success: false, error: 'SLOT_UNAVAILABLE', message: 'This slot is already taken' },
      error: null,
    }

    const { POST } = await import('@/app/api/bookings/route')
    const result = await POST(makePostRequest(validBookingBody)) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(409)
    expect(result.body.success).toBe(false)
  })

  it('returns 409 on duplicate booking', async () => {
    mockRpcResult = {
      data: { success: false, error: 'DUPLICATE_BOOKING', message: 'Duplicate booking' },
      error: null,
    }

    const { POST } = await import('@/app/api/bookings/route')
    const result = await POST(makePostRequest(validBookingBody)) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(409)
  })

  it('returns 500 on RPC error', async () => {
    mockRpcResult = { data: null, error: { message: 'Internal server error', code: '500' } }

    const { POST } = await import('@/app/api/bookings/route')
    const result = await POST(makePostRequest(validBookingBody)) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
  })
})
