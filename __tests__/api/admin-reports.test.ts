/**
 * Tests -- Admin Reports API
 * Route 1: GET  /api/admin/reports          (list reports)
 * Route 2: POST /api/admin/reports/[id]/resolve (resolve / dismiss)
 *
 * Covers: auth checks, Zod validation, DB query building (filters, pagination),
 *         error handling (400/401/500/502), audit logging, response format.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================
// Constants
// ============================================

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000'
const REPORT_ID = '660e8400-e29b-41d4-a716-446655440001'

// ============================================
// Mock setup -- must come before route imports
// ============================================

// --- NextResponse mock ---
const mockJsonFn = vi.fn((body: unknown, init?: { status?: number }) => ({
  body,
  status: init?.status ?? 200,
}))

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

// --- Supabase chainable query builder mock ---
type MockQueryResult = {
  data?: unknown
  error?: { code?: string; message: string } | null
  count?: number | null
}

let queryResult: MockQueryResult = { data: null, error: null, count: null }

// Track which methods were called and with which arguments
let builderCalls: { method: string; args: unknown[] }[] = []

function createChainableBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'gte', 'lt', 'order', 'range', 'limit', 'update', 'single']
  for (const method of methods) {
    builder[method] = vi.fn((...args: unknown[]) => {
      builderCalls.push({ method, args })
      return builder
    })
  }

  // Make builder thenable so that `await query` resolves with the result
  builder.then = (
    resolve: (v: unknown) => unknown,
  ) => {
    return resolve({
      data: queryResult.data ?? null,
      error: queryResult.error ?? null,
      count: queryResult.count ?? null,
    })
  }

  return builder
}

// Flag to simulate createAdminClient throwing an unexpected error
let shouldThrowOnCreateClient = false
let mockFromFn: (...args: unknown[]) => unknown

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    if (shouldThrowOnCreateClient) {
      throw new Error('Simulated crash')
    }
    return {
      from: (...args: unknown[]) => mockFromFn(...args as []),
    }
  },
}))

// --- Admin auth mock ---
let mockAuthResult: {
  success: boolean
  admin?: { id: string; email: string; role: string; permissions: Record<string, Record<string, boolean>> }
  error?: unknown
}

const mockRequirePermission = vi.fn(() => Promise.resolve(mockAuthResult))
const mockLogAdminAction = vi.fn(() => Promise.resolve())

vi.mock('@/lib/admin-auth', () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args as []),
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args as []),
}))

// --- Sanitize mock ---
let mockIsValidUuid = true
vi.mock('@/lib/sanitize', () => ({
  isValidUuid: () => mockIsValidUuid,
}))

// --- createApiHandler passthrough mock ---
vi.mock('@/lib/api/handler', () => ({
  createApiHandler: (handler: (ctx: Record<string, unknown>) => unknown) => {
    return async (request: unknown, routeContext?: { params?: Record<string, string> }) => {
      try {
        return await handler({ request, params: routeContext?.params } as Record<string, unknown>)
      } catch (err) {
        const { logger } = await import('@/lib/logger')
        const { NextResponse } = await import('next/server')
        logger.error('API Error', err as Error)
        return NextResponse.json(
          { success: false, error: { message: 'Server error' } },
          { status: 500 }
        )
      }
    }
  },
}))

// ============================================
// Helpers
// ============================================

function makeAdminAuth() {
  return {
    success: true,
    admin: {
      id: ADMIN_ID,
      email: 'admin@test.com',
      role: 'super_admin',
      permissions: { reviews: { read: true, write: true } },
    },
  }
}

function makeUnauthResult() {
  return {
    success: false,
    error: mockJsonFn(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 },
    ),
  }
}

/** Builds a minimal NextRequest-like object for the GET route */
function makeGetRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/admin/reports')
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return {
    nextUrl: { searchParams: url.searchParams },
    url: url.toString(),
  }
}

/** Builds a minimal NextRequest-like object for the POST route */
function makePostRequest(body: unknown) {
  return {
    nextUrl: { searchParams: new URLSearchParams() },
    url: 'http://localhost:3000/api/admin/reports/resolve',
    json: () => Promise.resolve(body),
  }
}

const sampleReports = [
  {
    id: 'r1',
    target_type: 'review',
    reason: 'spam',
    status: 'pending',
    created_at: '2026-02-15T10:00:00Z',
    reporter_id: 'u1',
  },
  {
    id: 'r2',
    target_type: 'user',
    reason: 'abuse',
    status: 'resolved',
    created_at: '2026-02-14T10:00:00Z',
    reporter_id: 'u2',
  },
]

// ============================================
// Route 1 -- GET /api/admin/reports
// ============================================

describe('GET /api/admin/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    builderCalls = []
    shouldThrowOnCreateClient = false
    mockFromFn = vi.fn(() => createChainableBuilder())
    queryResult = { data: sampleReports, error: null, count: 2 }
    mockAuthResult = makeAdminAuth()
    mockIsValidUuid = true
  })

  it('returns 401 when not authenticated', async () => {
    mockAuthResult = makeUnauthResult()

    const { GET } = await import('@/app/api/admin/reports/route')
    const result = await GET(makeGetRequest() as never)

    expect(result).toEqual(expect.objectContaining({ status: 401 }))
  })

  it('returns reports on success', async () => {
    const { GET } = await import('@/app/api/admin/reports/route')
    const result = (await GET(makeGetRequest() as never)) as unknown as {
      body: { success: boolean; reports: unknown[]; total: number; page: number; totalPages: number }
    }

    expect(result.body.success).toBe(true)
    expect(result.body.reports).toEqual(sampleReports)
    expect(result.body.total).toBe(2)
    expect(result.body.page).toBe(1)
    expect(result.body.totalPages).toBe(1)
  })

  it('filters by status=pending', async () => {
    const { GET } = await import('@/app/api/admin/reports/route')
    await GET(makeGetRequest({ status: 'pending' }) as never)

    const eqCalls = builderCalls.filter(c => c.method === 'eq')
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ args: ['status', 'pending'] }),
      ])
    )
  })

  it('filters by targetType=review', async () => {
    const { GET } = await import('@/app/api/admin/reports/route')
    await GET(makeGetRequest({ targetType: 'review' }) as never)

    // target_type column EXISTS in user_reports (migration 004, VARCHAR(50) NOT NULL)
    const eqCalls = builderCalls.filter(c => c.method === 'eq')
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ args: ['target_type', 'review'] }),
      ])
    )
  })

  it('paginates correctly (page=2, limit=5)', async () => {
    queryResult = { data: [], error: null, count: 12 }

    const { GET } = await import('@/app/api/admin/reports/route')
    const result = (await GET(makeGetRequest({ page: '2', limit: '5' }) as never)) as unknown as {
      body: { page: number; totalPages: number }
    }

    // offset = (2-1)*5 = 5, range(5, 9)
    const rangeCalls = builderCalls.filter(c => c.method === 'range')
    expect(rangeCalls.length).toBeGreaterThanOrEqual(1)
    expect(rangeCalls[0].args).toEqual([5, 9])

    expect(result.body.page).toBe(2)
    expect(result.body.totalPages).toBe(3) // ceil(12/5)
  })

  it('returns 400 on invalid params (page=0)', async () => {
    const { GET } = await import('@/app/api/admin/reports/route')
    const result = (await GET(makeGetRequest({ page: '0' }) as never)) as unknown as {
      body: { success: boolean }
      status: number
    }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns empty list on DB error (graceful fallback)', async () => {
    queryResult = { data: null, error: { code: 'PGRST301', message: 'permission denied' }, count: null }

    const { GET } = await import('@/app/api/admin/reports/route')
    const result = (await GET(makeGetRequest() as never)) as unknown as {
      body: { success: boolean; reports: unknown[]; total: number }
      status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.reports).toEqual([])
    expect(result.body.total).toBe(0)
    expect(mockLoggerWarn).toHaveBeenCalled()
  })

  it('returns empty array when no reports exist', async () => {
    queryResult = { data: [], error: null, count: 0 }

    const { GET } = await import('@/app/api/admin/reports/route')
    const result = (await GET(makeGetRequest() as never)) as unknown as {
      body: { reports: unknown[]; total: number; totalPages: number }
    }

    expect(result.body.reports).toEqual([])
    expect(result.body.total).toBe(0)
    expect(result.body.totalPages).toBe(0)
  })

  it('applies default params when none provided', async () => {
    const { GET } = await import('@/app/api/admin/reports/route')
    const result = (await GET(makeGetRequest() as never)) as unknown as {
      body: { page: number }
    }

    // Default page = 1, limit = 20 => range(0, 19)
    const rangeCalls = builderCalls.filter(c => c.method === 'range')
    expect(rangeCalls.length).toBeGreaterThanOrEqual(1)
    expect(rangeCalls[0].args).toEqual([0, 19])

    expect(result.body.page).toBe(1)

    // status='all' and targetType='all' should NOT produce any .eq calls
    const eqCalls = builderCalls.filter(c => c.method === 'eq')
    expect(eqCalls).toHaveLength(0)
  })

  it('returns 500 on unexpected error', async () => {
    shouldThrowOnCreateClient = true

    const { GET } = await import('@/app/api/admin/reports/route')
    const result = (await GET(makeGetRequest() as never)) as unknown as {
      body: { success: boolean }
      status: number
    }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
    expect(mockLoggerError).toHaveBeenCalled()
  })
})

// ============================================
// Route 2 -- POST /api/admin/reports/[id]/resolve
// ============================================

describe('POST /api/admin/reports/[id]/resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    builderCalls = []
    shouldThrowOnCreateClient = false
    mockFromFn = vi.fn(() => createChainableBuilder())
    queryResult = {
      data: {
        id: REPORT_ID,
        status: 'resolved',
        reviewed_by: ADMIN_ID,
        resolution: null,
        reviewed_at: '2026-02-16T12:00:00Z',
      },
      error: null,
    }
    mockAuthResult = makeAdminAuth()
    mockIsValidUuid = true
  })

  it('returns 401 when not authenticated', async () => {
    mockAuthResult = makeUnauthResult()

    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'resolve' })
    const result = await POST(req as never, { params: { id: REPORT_ID } })

    expect(result).toEqual(expect.objectContaining({ status: 401 }))
  })

  it('resolves report successfully (action=resolve)', async () => {
    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'resolve' })
    const result = (await POST(req as never, { params: { id: REPORT_ID } })) as unknown as {
      body: { success: boolean; report: unknown; message: string }
      status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.report).toBeDefined()
    expect(result.body.message).toBe('Report resolved')

    // Verify the update call set status = 'reviewed' (correct DB value)
    const updateCalls = builderCalls.filter(c => c.method === 'update')
    expect(updateCalls.length).toBe(1)
    const updateArg = updateCalls[0].args[0] as Record<string, unknown>
    expect(updateArg.status).toBe('reviewed')
  })

  it('dismisses report successfully (action=dismiss)', async () => {
    queryResult = {
      data: { id: REPORT_ID, status: 'dismissed', reviewed_by: ADMIN_ID },
      error: null,
    }

    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'dismiss' })
    const result = (await POST(req as never, { params: { id: REPORT_ID } })) as unknown as {
      body: { success: boolean; message: string }
      status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.message).toBe('Report rejected')

    // Verify the update set status = 'dismissed'
    const updateCalls = builderCalls.filter(c => c.method === 'update')
    expect(updateCalls[0].args[0] as Record<string, unknown>).toMatchObject({ status: 'dismissed' })
  })

  it('returns 400 on invalid UUID', async () => {
    mockIsValidUuid = false

    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'resolve' })
    const result = (await POST(req as never, { params: { id: 'not-a-uuid' } })) as unknown as {
      body: { success: boolean; error: { message: string } }
      status: number
    }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect(result.body.error.message).toBe('Invalid ID')
  })

  it('returns 400 on invalid body (missing action)', async () => {
    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ resolution_notes: 'some notes' })
    const result = (await POST(req as never, { params: { id: REPORT_ID } })) as unknown as {
      body: { success: boolean; error: { message: string } }
      status: number
    }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 500 on DB error', async () => {
    queryResult = { data: null, error: { code: '23503', message: 'FK violation' } }

    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'resolve' })
    const result = (await POST(req as never, { params: { id: REPORT_ID } })) as unknown as {
      body: { success: boolean; error: { message: string } }
      status: number
    }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
    expect(result.body.error.message).toBe('Unable to process the report')
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('logs admin action on success', async () => {
    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'resolve', resolution: 'Confirmed spam' })
    await POST(req as never, { params: { id: REPORT_ID } })

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_ID,
      'report.resolve',
      'report',
      REPORT_ID,
      { status: 'reviewed', resolution: 'Confirmed spam' }
    )
  })

  it('includes resolution_notes in update payload', async () => {
    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'dismiss', resolution: 'Not a valid report' })
    await POST(req as never, { params: { id: REPORT_ID } })

    const updateCalls = builderCalls.filter(c => c.method === 'update')
    expect(updateCalls.length).toBe(1)
    const updateArg = updateCalls[0].args[0] as Record<string, unknown>
    expect(updateArg.resolution).toBe('Not a valid report')
  })

  it('sets reviewed_by to admin ID', async () => {
    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'resolve' })
    await POST(req as never, { params: { id: REPORT_ID } })

    const updateCalls = builderCalls.filter(c => c.method === 'update')
    const updateArg = updateCalls[0].args[0] as Record<string, unknown>
    expect(updateArg.reviewed_by).toBe(ADMIN_ID)
    // Also check reviewed_at is an ISO string
    expect(typeof updateArg.reviewed_at).toBe('string')
    expect(new Date(updateArg.reviewed_at as string).toISOString()).toBe(updateArg.reviewed_at)
  })

  it('returns 500 on unexpected error', async () => {
    shouldThrowOnCreateClient = true

    const { POST } = await import('@/app/api/admin/reports/[id]/resolve/route')
    const req = makePostRequest({ action: 'resolve' })
    const result = (await POST(req as never, { params: { id: REPORT_ID } })) as unknown as {
      body: { success: boolean; error: { message: string } }
      status: number
    }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
    expect(result.body.error.message).toBe('Server error')
    expect(mockLoggerError).toHaveBeenCalled()
  })
})
