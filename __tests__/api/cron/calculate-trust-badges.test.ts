/**
 * Tests — GET /api/cron/calculate-trust-badges
 * Cron auth, batch processing, review metrics recalculation, MV refresh, error handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const CRON_SECRET = 'test-cron-secret-abc123'

const mockVerifyCronSecret = vi.fn()
vi.mock('@/lib/cron-auth', () => ({
  verifyCronSecret: (...args: unknown[]) => mockVerifyCronSecret(...args),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const mockFrom = vi.fn()
const mockRpc = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {}
  if (authHeader !== undefined) {
    headers['authorization'] = authHeader
  }
  return new Request('http://localhost/api/cron/calculate-trust-badges', { headers })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = CRON_SECRET
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
})

// ---------------------------------------------------------------------------
// Auth tests
// ---------------------------------------------------------------------------
describe('Cron auth', () => {
  it('returns 401 when no authorization header is provided', async () => {
    mockVerifyCronSecret.mockReturnValue(false)

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Unauthorized')
  })

  it('returns 401 when cron secret is wrong', async () => {
    mockVerifyCronSecret.mockReturnValue(false)

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer wrong-token'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('proceeds when cron secret is valid', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    // Return empty attorney list to keep the test simple
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })
    mockRpc.mockResolvedValue({ error: null })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Empty attorney list
// ---------------------------------------------------------------------------
describe('No attorneys to process', () => {
  it('returns success with 0 updated and 0 errors', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })
    mockRpc.mockResolvedValue({ error: null })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.updated).toBe(0)
    expect(body.errors).toBe(0)
    expect(body.message).toBe('Review metrics recalculated')
  })
})

// ---------------------------------------------------------------------------
// Attorney batch processing with reviews
// ---------------------------------------------------------------------------
describe('Attorney batch processing', () => {
  it('updates metrics for attorneys whose values changed', async () => {
    const mockAttorneys = [{ id: 'a1', rating_average: 0, review_count: 0 }]
    const mockReviews = [
      { attorney_id: 'a1', rating: 5 },
      { attorney_id: 'a1', rating: 3 },
    ]

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    let selectCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockReviews, error: null }),
            }),
          }),
        }
      }
      // attorneys table
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: selectCallCount++ === 0 ? mockAttorneys : [],
                error: null,
              }),
            }),
          }),
        }),
        update: mockUpdate,
      }
    })
    mockRpc.mockResolvedValue({ error: null })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.updated).toBe(1)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('skips attorneys when rating and count have not changed', async () => {
    const mockAttorneys = [{ id: 'a1', rating_average: 4.5, review_count: 2 }]
    const mockReviews = [
      { attorney_id: 'a1', rating: 5 },
      { attorney_id: 'a1', rating: 4 },
    ]

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    let selectCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockReviews, error: null }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: selectCallCount++ === 0 ? mockAttorneys : [],
                error: null,
              }),
            }),
          }),
        }),
        update: mockUpdate,
      }
    })
    mockRpc.mockResolvedValue({ error: null })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.skipped).toBeGreaterThanOrEqual(1)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('skips attorneys with no reviews (nothing changed)', async () => {
    const mockAttorneys = [{ id: 'a1', rating_average: 0, review_count: 0 }]

    let selectCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: selectCallCount++ === 0 ? mockAttorneys : [],
                error: null,
              }),
            }),
          }),
        }),
      }
    })
    mockRpc.mockResolvedValue({ error: null })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.skipped).toBeGreaterThanOrEqual(1)
    expect(body.updated).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Review fetch error
// ---------------------------------------------------------------------------
describe('Review fetch error', () => {
  it('increments error count when fetching reviews fails', async () => {
    const mockAttorneys = [{ id: 'a1', user_id: 'u1', rating_average: 0, review_count: 0 }]

    let selectCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: selectCallCount++ === 0 ? mockAttorneys : [],
                error: null,
              }),
            }),
          }),
        }),
      }
    })
    mockRpc.mockResolvedValue({ error: null })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.errors).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Attorney fetch error (breaks the loop)
// ---------------------------------------------------------------------------
describe('Attorney fetch error', () => {
  it('increments error count and stops when attorney query fails', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection error' },
            }),
          }),
        }),
      }),
    })
    mockRpc.mockResolvedValue({ error: null })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.errors).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// MV refresh
// ---------------------------------------------------------------------------
describe('Materialized view refresh', () => {
  it('sets mvRefreshed=true when RPC succeeds', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })
    mockRpc.mockResolvedValue({ error: null })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(body.mvRefreshed).toBe(true)
  })

  it('sets mvRefreshed=false when RPC fails', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })
    mockRpc.mockResolvedValue({ error: { message: 'MV refresh failed' } })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(body.mvRefreshed).toBe(false)
  })

  it('sets mvRefreshed=false when RPC throws an exception', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })
    mockRpc.mockRejectedValue(new Error('Network error'))

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(body.mvRefreshed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Unexpected top-level exception
// ---------------------------------------------------------------------------
describe('Unexpected exception', () => {
  it('returns 500 when an unexpected error is thrown', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    // Make createClient throw by having .from throw
    mockFrom.mockImplementation(() => {
      throw new Error('Catastrophic failure')
    })

    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Error recalculating review metrics')
  })
})
