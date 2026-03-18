/**
 * Tests — GET /api/cron/refresh-mv
 * Cron auth, concurrent RPC refresh, fallback to standard refresh, error handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockVerifyCronSecret = vi.fn()
vi.mock('@/lib/cron-auth', () => ({
  verifyCronSecret: (...args: unknown[]) => mockVerifyCronSecret(...args),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const mockRpc = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
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
  return new Request('http://localhost/api/cron/refresh-mv', { headers })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Auth tests
// ---------------------------------------------------------------------------
describe('Cron auth', () => {
  it('returns 401 when no authorization header is provided', async () => {
    mockVerifyCronSecret.mockReturnValue(false)

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Unauthorized')
  })

  it('returns 401 when cron secret is invalid', async () => {
    mockVerifyCronSecret.mockReturnValue(false)

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest('Bearer wrong-secret'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Unauthorized')
  })

  it('returns 401 when authorization header is not Bearer format', async () => {
    mockVerifyCronSecret.mockReturnValue(false)

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest('Basic dXNlcjpwYXNz'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Concurrent refresh (happy path)
// ---------------------------------------------------------------------------
describe('Concurrent refresh success', () => {
  it('returns 200 with concurrent=true when RPC succeeds on first try', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockRpc.mockResolvedValueOnce({ error: null })

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest('Bearer valid-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.concurrent).toBe(true)
    expect(body.message).toBe('Materialized view mv_attorney_stats refreshed')
    expect(body.duration_ms).toBeTypeOf('number')
    expect(body.refreshed_at).toBeDefined()
  })

  it('calls refresh_mv_attorney_stats RPC', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockRpc.mockResolvedValueOnce({ error: null })

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    await GET(makeRequest('Bearer valid-secret'))

    expect(mockRpc).toHaveBeenCalledWith('refresh_mv_attorney_stats')
  })
})

// ---------------------------------------------------------------------------
// Fallback to standard refresh
// ---------------------------------------------------------------------------
describe('Fallback to standard refresh', () => {
  it('falls back to standard refresh when concurrent fails, returns concurrent=false', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    // First call (concurrent) fails
    mockRpc.mockResolvedValueOnce({ error: { message: 'could not refresh concurrently' } })
    // Second call (standard) succeeds
    mockRpc.mockResolvedValueOnce({ error: null })

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest('Bearer valid-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.concurrent).toBe(false)
    expect(body.message).toBe('Materialized view mv_attorney_stats refreshed')
  })

  it('calls refresh_mv_attorney_stats_standard as fallback', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockRpc.mockResolvedValueOnce({ error: { message: 'concurrent failed' } })
    mockRpc.mockResolvedValueOnce({ error: null })

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    await GET(makeRequest('Bearer valid-secret'))

    expect(mockRpc).toHaveBeenCalledTimes(2)
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'refresh_mv_attorney_stats')
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'refresh_mv_attorney_stats_standard')
  })
})

// ---------------------------------------------------------------------------
// Both RPCs fail
// ---------------------------------------------------------------------------
describe('Both RPCs fail', () => {
  it('returns 500 when both concurrent and standard refresh fail', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockRpc.mockResolvedValueOnce({ error: { message: 'concurrent failed' } })
    mockRpc.mockResolvedValueOnce({ error: { message: 'standard also failed' } })

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest('Bearer valid-secret'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Failed to refresh materialized view')
    expect(body.details).toBe('standard also failed')
    expect(body.duration_ms).toBeTypeOf('number')
  })
})

// ---------------------------------------------------------------------------
// Unexpected exception
// ---------------------------------------------------------------------------
describe('Unexpected exception', () => {
  it('returns 500 when an unexpected error is thrown', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockRpc.mockRejectedValueOnce(new Error('Network failure'))

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest('Bearer valid-secret'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Error refreshing materialized view')
    expect(body.duration_ms).toBeTypeOf('number')
  })
})

// ---------------------------------------------------------------------------
// Duration tracking
// ---------------------------------------------------------------------------
describe('Duration tracking', () => {
  it('includes duration_ms in successful response', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockRpc.mockResolvedValueOnce({ error: null })

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest('Bearer valid-secret'))
    const body = await res.json()

    expect(body.duration_ms).toBeGreaterThanOrEqual(0)
  })

  it('includes duration_ms in error response from double RPC failure', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockRpc.mockResolvedValueOnce({ error: { message: 'fail1' } })
    mockRpc.mockResolvedValueOnce({ error: { message: 'fail2' } })

    const { GET } = await import('@/app/api/cron/refresh-mv/route')
    const res = await GET(makeRequest('Bearer valid-secret'))
    const body = await res.json()

    expect(body.duration_ms).toBeGreaterThanOrEqual(0)
  })
})
