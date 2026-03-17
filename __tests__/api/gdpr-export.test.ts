/**
 * Tests — GDPR Export API (/api/gdpr/export)
 * POST: unauthenticated, invalid format, pending request, successful export
 * GET: unauthenticated, with requestId, without requestId (all requests)
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

// Supabase builder state
let adminQueryResults: Array<{ data: unknown; error: unknown }> = []
let adminInsertResult: { data: unknown; error: unknown } = { data: null, error: null }
let adminUpdateResult: { data: unknown; error: unknown } = { data: null, error: null }
let adminCallIndex = 0

function makeAdminBuilder(resultGetter: () => { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {}
  b.select = vi.fn().mockReturnValue(b)
  b.insert = vi.fn().mockImplementation(() => {
    // Switch to insert result mode
    const insertBuilder: Record<string, unknown> = {}
    insertBuilder.select = vi.fn().mockReturnValue(insertBuilder)
    insertBuilder.single = vi.fn().mockReturnValue(insertBuilder)
    ;(insertBuilder as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: adminInsertResult.data, error: adminInsertResult.error })
    return insertBuilder
  })
  b.update = vi.fn().mockImplementation(() => {
    const updateBuilder: Record<string, unknown> = {}
    updateBuilder.eq = vi.fn().mockReturnValue(updateBuilder)
    ;(updateBuilder as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
      resolve({ data: adminUpdateResult.data, error: adminUpdateResult.error })
    return updateBuilder
  })
  b.eq = vi.fn().mockReturnValue(b)
  b.or = vi.fn().mockReturnValue(b)
  b.order = vi.fn().mockReturnValue(b)
  b.single = vi.fn().mockReturnValue(b)
  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) => {
    const result = resultGetter()
    return resolve({ data: result.data, error: result.error })
  }
  return b
}

const mockAdminSupabase = {
  from: vi.fn((_table: string) => {
    const idx = adminCallIndex++
    return makeAdminBuilder(() => adminQueryResults[idx] || { data: null, error: null })
  }),
}

let mockUser: { id: string; email: string } | null = { id: '550e8400-e29b-41d4-a716-446655440099', email: 'test@example.com' }

const mockSupabase = {
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: mockUser },
      error: null,
    })),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}))

// ============================================
// Helpers
// ============================================

const USER_UUID = '550e8400-e29b-41d4-a716-446655440099'

function makePostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/gdpr/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

function makeGetRequest(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params)
  const qs = searchParams.toString()
  return new Request(`http://localhost/api/gdpr/export${qs ? '?' + qs : ''}`) as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  adminCallIndex = 0
  adminQueryResults = []
  adminInsertResult = { data: null, error: null }
  adminUpdateResult = { data: null, error: null }
  mockUser = { id: USER_UUID, email: 'test@example.com' }
})

// ============================================
// POST tests
// ============================================

describe('POST /api/gdpr/export', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUser = null

    const { POST } = await import('@/app/api/gdpr/export/route')
    const result = await POST(makePostRequest({ format: 'json' })) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(401)
    expect(result.body.error).toMatchObject({ message: 'Authentication required' })
  })

  it('returns 400 for invalid format', async () => {
    const { POST } = await import('@/app/api/gdpr/export/route')
    const result = await POST(makePostRequest({ format: 'xml' })) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect((result.body.error as { message: string }).message).toBe('Invalid request')
  })

  it('returns 400 when existing pending request exists', async () => {
    // First admin from() call: check for existing pending request => found one
    adminQueryResults = [
      { data: { id: 'existing-req-id', user_id: USER_UUID, format: 'json', status: 'pending', completed_at: null, created_at: '2026-02-24T00:00:00Z' }, error: null },
    ]

    const { POST } = await import('@/app/api/gdpr/export/route')
    const result = await POST(makePostRequest({ format: 'json' })) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.requestId).toBe('existing-req-id')
  })

  it('returns successful export data', async () => {
    // Call 0: check for existing pending request => none
    // Calls 1-6: collectUserData calls (profiles, bookings, reviews x2, messages, user_preferences)
    // Plus insert + update for the export request itself
    adminQueryResults = [
      { data: null, error: null }, // no existing pending request
      // collectUserData calls:
      { data: { id: USER_UUID, email: 'test@example.com', full_name: 'Test User', phone_e164: null, role: 'viewer', subscription_plan: 'gratuit', created_at: '2026-01-01', updated_at: '2026-01-01' }, error: null }, // profiles
      { data: [], error: null }, // bookings
      { data: [], error: null }, // reviews received
      { data: [], error: null }, // reviews written
      { data: [], error: null }, // messages
      { data: null, error: null }, // user_preferences
    ]
    adminInsertResult = { data: { id: 'new-export-id', user_id: USER_UUID, format: 'json', status: 'pending' }, error: null }
    adminUpdateResult = { data: null, error: null }

    const { POST } = await import('@/app/api/gdpr/export/route')
    const result = await POST(makePostRequest({ format: 'json' })) as unknown as {
      body: { success: boolean; requestId: string; data: Record<string, unknown>; message: string }; status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.requestId).toBe('new-export-id')
    expect(result.body.data).toBeDefined()
    expect(result.body.message).toBe('Your data export is ready')
  })
})

// ============================================
// GET tests
// ============================================

describe('GET /api/gdpr/export', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUser = null

    const { GET } = await import('@/app/api/gdpr/export/route')
    const result = await GET(makeGetRequest()) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(401)
    expect(result.body.error).toMatchObject({ message: 'Authentication required' })
  })

  it('returns specific request when requestId provided', async () => {
    const exportData = {
      id: 'req-123',
      user_id: USER_UUID,
      format: 'json',
      status: 'completed',
      completed_at: '2026-02-24T01:00:00Z',
      created_at: '2026-02-24T00:00:00Z',
    }
    adminQueryResults = [
      { data: exportData, error: null },
    ]

    const { GET } = await import('@/app/api/gdpr/export/route')
    const result = await GET(makeGetRequest({ requestId: 'req-123' })) as unknown as {
      body: Record<string, unknown>; status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.id).toBe('req-123')
    expect(result.body.status).toBe('completed')
  })

  it('returns all requests when no requestId provided', async () => {
    const requests = [
      { id: 'req-1', user_id: USER_UUID, format: 'json', status: 'completed', completed_at: '2026-02-24T01:00:00Z', created_at: '2026-02-24T00:00:00Z' },
      { id: 'req-2', user_id: USER_UUID, format: 'csv', status: 'pending', completed_at: null, created_at: '2026-02-23T00:00:00Z' },
    ]
    adminQueryResults = [
      { data: requests, error: null },
    ]

    const { GET } = await import('@/app/api/gdpr/export/route')
    const result = await GET(makeGetRequest()) as unknown as {
      body: { requests: Array<Record<string, unknown>> }; status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.requests).toHaveLength(2)
    expect(result.body.requests[0].id).toBe('req-1')
  })
})
