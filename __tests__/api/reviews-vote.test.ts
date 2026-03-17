/**
 * Tests — Review Vote API (/api/reviews/vote)
 * POST: Zod validation, fingerprint deduplication, vote upsert, recount,
 *       fallback on missing table, DB errors
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

// State for controlling mock behaviour per test
let mockAuthUser: { id: string; email: string } | null = null
let mockReviewResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockUpsertResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockCountResult: { count: number | null; error: unknown } = { count: null, error: null }
let mockUpdateResult: { data: unknown; error: unknown } = { data: null, error: null }
let adminFromCallCount = 0

/**
 * Build a thenable chain builder that resolves to `result` at the end.
 * Each chained method returns the same builder, and `.then` resolves the result.
 */
function makeBuilder(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const b: Record<string, unknown> = {}
  b.select = vi.fn().mockReturnValue(b)
  b.eq = vi.fn().mockReturnValue(b)
  b.single = vi.fn().mockReturnValue(b)
  b.update = vi.fn().mockReturnValue(b)
  b.upsert = vi.fn().mockReturnValue(b)
  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: result.data ?? null, error: result.error ?? null, count: result.count ?? null })
  return b
}

// The admin client needs to return different builders depending on the table
// and the operation sequence: reviews select -> review_votes upsert ->
// review_votes count -> reviews update
function makeAdminFrom(_table: string) {
  adminFromCallCount++
  const call = adminFromCallCount

  // Call 1: reviews.select(...).eq(...).eq(...).single() -> mockReviewResult
  if (call === 1) {
    return makeBuilder(mockReviewResult)
  }
  // Call 2: review_votes.upsert(...) -> mockUpsertResult
  if (call === 2) {
    return makeBuilder(mockUpsertResult)
  }
  // Call 3: review_votes.select('id', {count, head}).eq.eq -> mockCountResult
  if (call === 3) {
    return makeBuilder({ data: null, error: mockCountResult.error, count: mockCountResult.count })
  }
  // Call 4+: reviews.update(...).eq(...) -> mockUpdateResult
  return makeBuilder(mockUpdateResult)
}

const mockAdminSupabase = {
  from: vi.fn((_table: string) => makeAdminFrom(_table)),
}

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}))

// ============================================
// Helpers
// ============================================

const REVIEW_UUID = '550e8400-e29b-41d4-a716-446655440010'
const USER_UUID = '550e8400-e29b-41d4-a716-446655440099'

function makePostRequest(body: unknown, headers?: Record<string, string>) {
  return new Request('http://localhost/api/reviews/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

type MockResult = { body: Record<string, unknown>; status: number }

beforeEach(() => {
  vi.clearAllMocks()
  adminFromCallCount = 0
  mockAuthUser = null
  mockReviewResult = { data: null, error: null }
  mockUpsertResult = { data: null, error: null }
  mockCountResult = { count: null, error: null }
  mockUpdateResult = { data: null, error: null }

  // Default auth: no user (anonymous)
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: mockAuthUser },
    error: null,
  })
})

// ============================================
// Tests
// ============================================

describe('POST /api/reviews/vote', () => {
  it('returns 400 when body is invalid (not an object with reviewId)', async () => {
    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(makePostRequest({ bad: 'data' }))) as unknown as MockResult

    expect(result.status).toBe(400)
    expect(result.body.error).toMatchObject({ message: 'Invalid request' })
  })

  it('returns 400 when reviewId is missing', async () => {
    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(makePostRequest({}))) as unknown as MockResult

    expect(result.status).toBe(400)
    expect(result.body.error).toMatchObject({ message: 'Invalid request' })
  })

  it('uses ip-based fingerprint for unauthenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    mockReviewResult = { data: { id: REVIEW_UUID, helpful_count: 3 }, error: null }
    mockUpsertResult = { data: null, error: null }
    mockCountResult = { count: 4, error: null }
    mockUpdateResult = { data: null, error: null }

    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(
      makePostRequest({ reviewId: REVIEW_UUID }, { 'x-forwarded-for': '1.2.3.4' })
    )) as unknown as MockResult

    expect(result.status).toBe(200)
    // Verify the upsert was called with ip fingerprint
    const upsertCall = mockAdminSupabase.from.mock.results[1].value.upsert
    expect(upsertCall).toHaveBeenCalledWith(
      { review_id: REVIEW_UUID, voter_fingerprint: 'ip:1.2.3.4', is_helpful: true },
      { onConflict: 'review_id,voter_fingerprint', ignoreDuplicates: true }
    )
  })

  it('uses user-based fingerprint for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID, email: 'test@example.com' } },
      error: null,
    })
    mockReviewResult = { data: { id: REVIEW_UUID, helpful_count: 5 }, error: null }
    mockUpsertResult = { data: null, error: null }
    mockCountResult = { count: 6, error: null }
    mockUpdateResult = { data: null, error: null }

    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(
      makePostRequest({ reviewId: REVIEW_UUID })
    )) as unknown as MockResult

    expect(result.status).toBe(200)
    // Verify the upsert was called with user fingerprint
    const upsertCall = mockAdminSupabase.from.mock.results[1].value.upsert
    expect(upsertCall).toHaveBeenCalledWith(
      { review_id: REVIEW_UUID, voter_fingerprint: `user:${USER_UUID}`, is_helpful: true },
      { onConflict: 'review_id,voter_fingerprint', ignoreDuplicates: true }
    )
  })

  it('returns 404 when review does not exist', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    mockReviewResult = { data: null, error: { message: 'Row not found', code: 'PGRST116' } }

    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(
      makePostRequest({ reviewId: REVIEW_UUID })
    )) as unknown as MockResult

    expect(result.status).toBe(404)
    expect(result.body.error).toEqual({ message: 'Review not found or not published' })
  })

  it('returns 404 when review is not published', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    // Simulating .single() returning null because the status='published' filter excludes it
    mockReviewResult = { data: null, error: null }

    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(
      makePostRequest({ reviewId: REVIEW_UUID })
    )) as unknown as MockResult

    expect(result.status).toBe(404)
    expect(result.body.error).toEqual({ message: 'Review not found or not published' })
  })

  it('returns success with recounted helpful_count after vote', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    mockReviewResult = { data: { id: REVIEW_UUID, helpful_count: 7 }, error: null }
    mockUpsertResult = { data: null, error: null }
    mockCountResult = { count: 8, error: null }
    mockUpdateResult = { data: null, error: null }

    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(
      makePostRequest({ reviewId: REVIEW_UUID }, { 'x-forwarded-for': '10.0.0.1' })
    )) as unknown as MockResult

    expect(result.status).toBe(200)
    expect(result.body).toEqual({ success: true, helpful_count: 8 })
  })

  it('falls back to simple increment when review_votes table is missing (42P01)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    mockReviewResult = { data: { id: REVIEW_UUID, helpful_count: 3 }, error: null }
    // Upsert returns 42P01 (table not found)
    mockUpsertResult = { data: null, error: { message: 'relation "review_votes" does not exist', code: '42P01' } }
    mockUpdateResult = { data: null, error: null }

    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(
      makePostRequest({ reviewId: REVIEW_UUID }, { 'x-forwarded-for': '10.0.0.1' })
    )) as unknown as MockResult

    expect(result.status).toBe(200)
    expect(result.body).toEqual({ success: true, helpful_count: 4 })
  })

  it('returns 500 on unexpected database error', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    mockReviewResult = { data: { id: REVIEW_UUID, helpful_count: 0 }, error: null }
    // Upsert returns a non-42P01 error
    mockUpsertResult = { data: null, error: { message: 'connection refused', code: '08000' } }

    const { POST } = await import('@/app/api/reviews/vote/route')
    const result = (await POST(
      makePostRequest({ reviewId: REVIEW_UUID }, { 'x-forwarded-for': '10.0.0.1' })
    )) as unknown as MockResult

    expect(result.status).toBe(500)
    // Error is caught by createApiHandler and formatted via formatErrorResponse
    expect(result.body.error).toMatchObject({ message: expect.any(String) })
    expect(result.body.success).toBe(false)
  })
})
