/**
 * Tests — Admin Stats API (/api/admin/stats)
 * Covers: real data extraction, trend computation, error handling,
 *         auth checks, response format, and Supabase error logging
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================
// Mock setup — must come before route imports
// ============================================

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000'

// --- NextResponse mock ---
let capturedHeaders: Record<string, string> = {}
const mockJsonFn = vi.fn((body: unknown, init?: { status?: number }) => {
  const resp = {
    body,
    status: init?.status ?? 200,
    headers: {
      set: (key: string, value: string) => { capturedHeaders[key] = value },
    },
  }
  return resp
})

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => mockJsonFn(body, init),
  },
}))

// --- Logger mock ---
const mockLoggerWarn = vi.fn()
const mockLoggerError = vi.fn()
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: mockLoggerWarn,
    error: mockLoggerError,
    api: { request: vi.fn(), success: vi.fn(), error: vi.fn() },
  },
}))

// --- Supabase mock builder for stats ---
type MockQueryResult = {
  data?: unknown
  error?: { code?: string; message: string } | null
  count?: number | null
}

let queryResults: MockQueryResult[] = []
let queryIndex = 0

function createStatsQueryBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }

  // Make builder thenable — each await consumes the next result
  ;(builder as Record<string, unknown>).then = (
    resolve: (v: unknown) => unknown,
    reject?: (e: unknown) => unknown
  ) => {
    const result = queryResults[queryIndex++] ?? { data: null, error: null, count: 0 }
    if (result.error && reject) {
      // Supabase resolves with error, does NOT reject
    }
    return resolve({
      data: result.data ?? null,
      error: result.error ?? null,
      count: result.count ?? null,
    })
  }

  return builder
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => createStatsQueryBuilder(),
  }),
}))

// --- Admin auth mock ---
let mockAuthResult: {
  success: boolean
  admin?: { id: string; email: string; role: string; permissions: Record<string, Record<string, boolean>> }
  error?: unknown
}

vi.mock('@/lib/admin-auth', () => ({
  requirePermission: vi.fn(() => Promise.resolve(mockAuthResult)),
}))

// ============================================
// Helper: build standard query results for 20 queries
// ============================================

function buildAllSuccessResults(): MockQueryResult[] {
  return [
    // Batch 1 (14 queries)
    { count: 150, data: null, error: null },           // totalUsers
    { count: 42, data: null, error: null },             // totalArtisans
    { count: 300, data: null, error: null },            // totalBookings
    { count: 3, data: null, error: null },              // pendingReports
    { data: [{ rating: 4 }, { rating: 5 }, { rating: 3 }], error: null }, // reviews
    { count: 5, data: null, error: null },              // newUsersToday
    { count: 8, data: null, error: null },              // newBookingsToday
    { count: 20, data: null, error: null },             // usersThisMonth
    { count: 15, data: null, error: null },             // usersLastMonth
    { count: 50, data: null, error: null },             // bookingsThisMonth
    { count: 40, data: null, error: null },             // bookingsLastMonth
    { data: [{ total_amount: 100 }, { total_amount: 200 }], error: null }, // revThisMonth
    { data: [{ total_amount: 150 }], error: null },     // revLastMonth
    { count: 30, data: null, error: null },             // activeUsers7d
    // Batch 2 (6 queries)
    { data: [{ id: 'b1', status: 'pending', created_at: '2026-02-15T10:00:00Z', city: 'New York' }], error: null },
    { data: [{ id: 'r1', rating: 5, client_name: 'John', status: 'published', created_at: '2026-02-14T10:00:00Z' }], error: null },
    { data: [{ id: 'rpt1', target_type: 'review', reason: 'spam', description: 'Test', status: 'pending', created_at: '2026-02-13T10:00:00Z', reporter_id: null }], error: null },
    { data: [{ created_at: '2026-02-10T10:00:00Z' }], error: null }, // chartProfiles
    { data: [{ created_at: '2026-02-10T10:00:00Z' }], error: null }, // chartBookings
    { data: [{ created_at: '2026-02-10T10:00:00Z' }], error: null }, // chartReviews
  ]
}

// ============================================
// Tests
// ============================================

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    capturedHeaders = {}
    queryIndex = 0
    queryResults = buildAllSuccessResults()
    mockAuthResult = {
      success: true,
      admin: {
        id: ADMIN_ID,
        email: 'admin@test.com',
        role: 'super_admin',
        permissions: { settings: { read: true } },
      },
    }
  })

  it('returns 401 when not authenticated', async () => {
    mockAuthResult = {
      success: false,
      error: mockJsonFn({ success: false, error: { message: 'Unauthorized' } }, { status: 401 }),
    }

    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET()

    expect(result).toEqual(
      expect.objectContaining({ status: 401 })
    )
  })

  it('returns success: true with all stats on success', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: Record<string, unknown> }

    expect(result.body).toHaveProperty('success', true)
    expect(result.body).toHaveProperty('stats')
    expect(result.body).toHaveProperty('recentActivity')
    expect(result.body).toHaveProperty('pendingReports')
    expect(result.body).toHaveProperty('chartData')
  })

  it('computes correct stat values from DB', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { stats: Record<string, unknown> } }
    const stats = result.body.stats

    expect(stats.totalUsers).toBe(150)
    expect(stats.totalAttorneys).toBe(42)
    expect(stats.totalBookings).toBe(300)
    expect(stats.pendingReports).toBe(3)
    expect(stats.newUsersToday).toBe(5)
    expect(stats.newBookingsToday).toBe(8)
    expect(stats.activeUsers7d).toBe(30)
  })

  it('computes average rating from reviews', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { stats: { averageRating: number } } }

    // (4 + 5 + 3) / 3 = 4.0
    expect(result.body.stats.averageRating).toBe(4)
  })

  it('returns zero totalRevenue (no amount column in bookings)', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { stats: { totalRevenue: number } } }

    // total_amount does not exist in bookings table — revenue is always 0
    expect(result.body.stats.totalRevenue).toBe(0)
  })

  it('computes trend percentages', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { stats: { trends: Record<string, number> } } }
    const trends = result.body.stats.trends

    // users: (20 - 15) / 15 = 33%
    expect(trends.users).toBe(33)
    // bookings: (50 - 40) / 40 = 25%
    expect(trends.bookings).toBe(25)
  })

  it('builds activity feed from bookings and reviews', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { recentActivity: Array<{ id: string; type: string }> } }
    const activity = result.body.recentActivity

    expect(activity.length).toBe(2)
    // Sorted by timestamp desc — booking is more recent
    expect(activity[0].id).toBe('b-b1')
    expect(activity[0].type).toBe('booking')
    expect(activity[1].id).toBe('r-r1')
    expect(activity[1].type).toBe('review')
  })

  it('returns pending reports from user_reports', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { pendingReports: Array<{ id: string }> } }

    expect(result.body.pendingReports.length).toBe(1)
    expect(result.body.pendingReports[0].id).toBe('rpt1')
  })

  it('generates 30-day chart data', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { chartData: Array<{ date: string }> } }

    expect(result.body.chartData).toHaveLength(30)
    // Each entry has date, users, bookings, reviews
    const first = result.body.chartData[0] as Record<string, unknown>
    expect(first).toHaveProperty('date')
    expect(first).toHaveProperty('users')
    expect(first).toHaveProperty('bookings')
    expect(first).toHaveProperty('reviews')
  })

  it('sets no-cache headers', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    await GET()

    expect(capturedHeaders['Cache-Control']).toContain('no-store')
    expect(capturedHeaders['Pragma']).toBe('no-cache')
    expect(capturedHeaders['Surrogate-Control']).toBe('no-store')
    expect(capturedHeaders['Vercel-CDN-Cache-Control']).toBe('no-store')
  })

  it('logs Supabase query errors without crashing', async () => {
    // Make the first query (totalUsers) return a Supabase error
    queryResults[0] = { data: null, error: { code: 'PGRST301', message: 'permission denied' }, count: null }

    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { success: boolean; stats: { totalUsers: number } } }

    // Should still return success with fallback value
    expect(result.body.success).toBe(true)
    expect(result.body.stats.totalUsers).toBe(0)

    // Should have logged the Supabase error
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('[admin-stats] queries[0]'),
      expect.objectContaining({ message: 'permission denied', code: 'PGRST301' })
    )
  })

  it('returns 0 rating when no reviews exist', async () => {
    queryResults[4] = { data: [], error: null } // empty reviews

    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { stats: { averageRating: number } } }

    expect(result.body.stats.averageRating).toBe(0)
  })

  it('handles trend when previous period is zero', async () => {
    queryResults[8] = { count: 0, data: null, error: null }  // usersLastMonth = 0
    queryResults[9] = { count: 10, data: null, error: null }  // bookingsThisMonth = 10
    queryResults[10] = { count: 0, data: null, error: null }  // bookingsLastMonth = 0

    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: { stats: { trends: Record<string, number> } } }

    // When previous is 0 and current > 0, trend = 100
    expect(result.body.stats.trends.users).toBe(100)
    expect(result.body.stats.trends.bookings).toBe(100)
  })

  it('returns 500 on unexpected error', async () => {
    // Force an error by making auth succeed but then throwing
    mockAuthResult = {
      success: true,
      admin: {
        id: ADMIN_ID,
        email: 'admin@test.com',
        role: 'super_admin',
        permissions: { settings: { read: true } },
      },
    }

    // Reset modules to get fresh import
    vi.resetModules()

    // Mock createAdminClient to throw
    vi.doMock('@/lib/supabase/admin', () => ({
      createAdminClient: () => { throw new Error('Connection refused') },
    }))

    const { GET } = await import('@/app/api/admin/stats/route')
    const result = await GET() as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(500)
    expect(result.body).toHaveProperty('success', false)
  })
})
