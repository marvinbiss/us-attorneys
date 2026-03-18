/**
 * Tests — Admin Providers API (/api/admin/providers)
 * Covers: auth checks, query param validation, filtering, search,
 *         pagination, data transformation, error handling, cache headers
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
  NextRequest: vi.fn().mockImplementation((url: string) => ({
    nextUrl: new URL(url),
  })),
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

// --- Supabase mock builder ---
type MockQueryResult = {
  data?: unknown
  error?: { code?: string; message: string } | null
  count?: number | null
}

let mockQueryResult: MockQueryResult = { data: [], error: null, count: 0 }

// Flag to throw from createAdminClient (for 500 test)
let shouldThrowOnCreate = false

// Track calls for assertion
let mockFromTable = ''
let mockSelectArgs: unknown[] = []
let mockEqCalls: Array<[string, unknown]> = []
let mockInCalls: Array<[string, unknown[]]> = []
let mockOrCalls: string[] = []
let mockOrderCalls: Array<[string, Record<string, unknown>]> = []
let mockRangeCalls: Array<[number, number]> = []

function createProviderQueryBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {
    select: vi.fn((...args: unknown[]) => {
      mockSelectArgs = args
      return builder
    }),
    eq: vi.fn((col: string, val: unknown) => {
      mockEqCalls.push([col, val])
      return builder
    }),
    in: vi.fn((col: string, vals: unknown[]) => {
      mockInCalls.push([col, vals])
      return builder
    }),
    or: vi.fn((expr: string) => {
      mockOrCalls.push(expr)
      return builder
    }),
    order: vi.fn((col: string, opts: Record<string, unknown>) => {
      mockOrderCalls.push([col, opts])
      return builder
    }),
    range: vi.fn((start: number, end: number) => {
      mockRangeCalls.push([start, end])
      return builder
    }),
    limit: vi.fn().mockReturnThis(),
  }

  // Make builder thenable — await resolves with the mock result
  ;(builder as Record<string, unknown>).then = (
    resolve: (v: unknown) => unknown,
  ) => {
    return resolve({
      data: mockQueryResult.data ?? null,
      error: mockQueryResult.error ?? null,
      count: mockQueryResult.count ?? null,
    })
  }

  return builder
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    if (shouldThrowOnCreate) {
      throw new Error('Connection refused')
    }
    return {
      from: (table: string) => {
        mockFromTable = table
        return createProviderQueryBuilder()
      },
    }
  },
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

// --- Sanitize mock ---
vi.mock('@/lib/sanitize', () => ({
  sanitizeSearchQuery: vi.fn((input: string) => input.trim()),
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
        logger.error('Admin providers list error', err as Error)
        return NextResponse.json(
          { success: false, error: { message: 'Server error' } },
          { status: 500 }
        )
      }
    }
  },
}))


// ============================================
// Helper: create a mock NextRequest with URL
// ============================================

function createMockRequest(params: Record<string, string> = {}): { nextUrl: URL; url: string } {
  const url = new URL('http://localhost:3000/api/admin/providers')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return { nextUrl: url, url: url.toString() }
}

// ============================================
// Helper: sample provider data from DB
// ============================================

function sampleProvider(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prov-001',
    name: 'Smith & Associates',
    slug: 'smith-associates',
    email: 'smith@example.com',
    phone: '+12125551234',
    address_city: 'New York',
    address_state: 'New York',
    address_department: 'NY',
    bar_number: '12345678901234',
    is_verified: true,
    is_active: true,
    source_api: 'manual',
    rating_average: 4.5,
    review_count: 12,
    created_at: '2026-01-15T10:00:00Z',
    provider_services: [
      { service: { name: 'Personal Injury', slug: 'personal-injury' } },
    ],
    ...overrides,
  }
}

// ============================================
// Tests
// ============================================

describe('GET /api/admin/providers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    capturedHeaders = {}
    mockFromTable = ''
    mockSelectArgs = []
    mockEqCalls = []
    mockInCalls = []
    mockOrCalls = []
    mockOrderCalls = []
    mockRangeCalls = []
    shouldThrowOnCreate = false
    mockQueryResult = {
      data: [sampleProvider()],
      error: null,
      count: 1,
    }
    mockAuthResult = {
      success: true,
      admin: {
        id: ADMIN_ID,
        email: 'admin@test.com',
        role: 'super_admin',
        permissions: { providers: { read: true } },
      },
    }
  })

  // ------------------------------------------
  // 1. Auth check
  // ------------------------------------------
  it('returns 401 when not authenticated', async () => {
    mockAuthResult = {
      success: false,
      error: mockJsonFn({ success: false, error: { message: 'Unauthorized' } }, { status: 401 }),
    }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never)

    expect(result).toEqual(
      expect.objectContaining({ status: 401 })
    )
  })

  // ------------------------------------------
  // 2. Successful provider list
  // ------------------------------------------
  it('returns providers list on success', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as { body: Record<string, unknown> }

    expect(result.body).toHaveProperty('success', true)
    expect(result.body).toHaveProperty('providers')
    expect(result.body).toHaveProperty('total', 1)
    expect(result.body).toHaveProperty('page', 1)
    expect(result.body).toHaveProperty('totalPages', 1)
  })

  // ------------------------------------------
  // 3. Pagination (page, limit, offset)
  // ------------------------------------------
  it('paginates correctly with page and limit params', async () => {
    mockQueryResult = { data: [], error: null, count: 55 }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest({ page: '3', limit: '10' }) as never) as unknown as {
      body: { page: number; totalPages: number; total: number }
    }

    // offset = (3 - 1) * 10 = 20, range = [20, 29]
    expect(mockRangeCalls).toHaveLength(1)
    expect(mockRangeCalls[0]).toEqual([20, 29])
    expect(result.body.page).toBe(3)
    expect(result.body.total).toBe(55)
    expect(result.body.totalPages).toBe(6) // ceil(55/10)
  })

  // ------------------------------------------
  // 4. Filter: verified
  // ------------------------------------------
  it('filters by verified status', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest({ filter: 'verified' }) as never)

    expect(mockInCalls).toEqual(
      expect.arrayContaining([
        ['is_verified', [true]],
        ['is_active', [true]],
      ])
    )
  })

  // ------------------------------------------
  // 5. Filter: pending
  // ------------------------------------------
  it('filters by pending status', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest({ filter: 'pending' }) as never)

    expect(mockInCalls).toEqual(
      expect.arrayContaining([
        ['is_verified', [false]],
        ['is_active', [true]],
      ])
    )
  })

  // ------------------------------------------
  // 6. Filter: suspended
  // ------------------------------------------
  it('filters by suspended status', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest({ filter: 'suspended' }) as never)

    expect(mockInCalls).toEqual(
      expect.arrayContaining([
        ['is_active', [false]],
      ])
    )
    // Should not filter by is_verified
    const verifiedCalls = mockInCalls.filter(([col]) => col === 'is_verified')
    expect(verifiedCalls).toHaveLength(0)
  })

  // ------------------------------------------
  // 7. Filter: all (no extra filter applied)
  // ------------------------------------------
  it('applies no filter when filter=all', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest({ filter: 'all' }) as never)

    expect(mockInCalls).toHaveLength(0)
    expect(mockEqCalls).toHaveLength(0)
  })

  // ------------------------------------------
  // 8. Search query
  // ------------------------------------------
  it('applies search query via or() with sanitized input', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest({ search: 'attorney' }) as never)

    expect(mockOrCalls).toHaveLength(1)
    expect(mockOrCalls[0]).toContain('name.ilike.%attorney%')
    expect(mockOrCalls[0]).toContain('email.ilike.%attorney%')
    expect(mockOrCalls[0]).toContain('address_city.ilike.%attorney%')
    expect(mockOrCalls[0]).toContain('bar_number.ilike.%attorney%')
  })

  // ------------------------------------------
  // 9. Invalid params (page=0, limit=200)
  // ------------------------------------------
  it('returns 400 when page is 0', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest({ page: '0' }) as never) as unknown as {
      body: { success: boolean; error: { message: string } }
      status: number
    }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect(result.body.error.message).toBe('Invalid parameters')
  })

  it('returns 400 when limit exceeds max (100)', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest({ limit: '200' }) as never) as unknown as {
      body: { success: boolean }
      status: number
    }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  // ------------------------------------------
  // 10. DB error returns 502
  // ------------------------------------------
  it('returns 502 on database query error', async () => {
    mockQueryResult = {
      data: null,
      error: { code: 'PGRST301', message: 'relation not found' },
      count: null,
    }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { success: boolean; error: { message: string; code: string } }
      status: number
    }

    expect(result.status).toBe(502)
    expect(result.body.success).toBe(false)
    expect(result.body.error.code).toBe('PGRST301')
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Providers query failed',
      expect.objectContaining({ code: 'PGRST301', message: 'relation not found' })
    )
  })

  // ------------------------------------------
  // 11. Unexpected error returns 500
  // ------------------------------------------
  it('returns 500 on unexpected error', async () => {
    shouldThrowOnCreate = true

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { success: boolean; error: { message: string } }
      status: number
    }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
    expect(result.body.error.message).toBe('Server error')
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Admin providers list error',
      expect.any(Error)
    )
  })

  // ------------------------------------------
  // 12. Data transformation (name -> company_name, etc.)
  // ------------------------------------------
  it('transforms provider data correctly', async () => {
    mockQueryResult = {
      data: [sampleProvider({
        name: 'Johnson Criminal Defense',
        email: 'johnson@example.com',
        phone: '+13105559876',
        address_city: 'Los Angeles',
        address_state: 'California',
        is_verified: false,
        is_active: true,
        rating_average: 3.8,
        review_count: 7,
        source: 'scraping',
        bar_number: '98765432109876',
        specialty: 'Criminal Defense',
      })],
      error: null,
      count: 1,
    }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { providers: Array<Record<string, unknown>> }
    }

    const provider = result.body.providers[0]
    // Real column names (no remapping)
    expect(provider.name).toBe('Johnson Criminal Defense')
    // Direct field mappings
    expect(provider.email).toBe('johnson@example.com')
    expect(provider.phone).toBe('+13105559876')
    expect(provider.address_city).toBe('Los Angeles')
    expect(provider.address_state).toBe('California')
    expect(provider.is_verified).toBe(false)
    expect(provider.is_active).toBe(true)
    expect(provider.rating_average).toBe(3.8)
    expect(provider.review_count).toBe(7)
    expect(provider.source).toBe('scraping')
    expect(provider.bar_number).toBe('98765432109876')
    // Specialty column (no remapping to service_type)
    expect(provider.specialty).toBe('Criminal Defense')
  })

  // ------------------------------------------
  // 13. No-cache headers
  // ------------------------------------------
  it('sets no-cache headers on success response', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest() as never)

    expect(capturedHeaders['Cache-Control']).toContain('no-store')
    expect(capturedHeaders['Cache-Control']).toContain('no-cache')
    expect(capturedHeaders['Pragma']).toBe('no-cache')
    expect(capturedHeaders['Expires']).toBe('0')
    expect(capturedHeaders['Surrogate-Control']).toBe('no-store')
    expect(capturedHeaders['CDN-Cache-Control']).toBe('no-store')
    expect(capturedHeaders['Vercel-CDN-Cache-Control']).toBe('no-store')
  })

  // ------------------------------------------
  // 14. Correct totalPages calculation
  // ------------------------------------------
  it('calculates totalPages correctly for exact division', async () => {
    mockQueryResult = { data: [], error: null, count: 40 }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest({ limit: '20' }) as never) as unknown as {
      body: { totalPages: number }
    }

    expect(result.body.totalPages).toBe(2) // 40 / 20 = 2
  })

  it('calculates totalPages correctly for non-exact division', async () => {
    mockQueryResult = { data: [], error: null, count: 41 }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest({ limit: '20' }) as never) as unknown as {
      body: { totalPages: number }
    }

    expect(result.body.totalPages).toBe(3) // ceil(41/20) = 3
  })

  it('returns totalPages=0 when count is 0', async () => {
    mockQueryResult = { data: [], error: null, count: 0 }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { totalPages: number; total: number }
    }

    expect(result.body.totalPages).toBe(0)
    expect(result.body.total).toBe(0)
  })

  // ------------------------------------------
  // 15. Empty results
  // ------------------------------------------
  it('handles empty results gracefully', async () => {
    mockQueryResult = { data: [], error: null, count: 0 }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { success: boolean; providers: unknown[]; total: number; page: number; totalPages: number }
    }

    expect(result.body.success).toBe(true)
    expect(result.body.providers).toEqual([])
    expect(result.body.total).toBe(0)
    expect(result.body.page).toBe(1)
    expect(result.body.totalPages).toBe(0)
  })

  it('handles null data from DB as empty array', async () => {
    mockQueryResult = { data: null, error: null, count: 0 }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { providers: unknown[] }
    }

    expect(result.body.providers).toEqual([])
  })

  // ------------------------------------------
  // Additional edge cases
  // ------------------------------------------
  it('queries the providers table', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest() as never)

    expect(mockFromTable).toBe('attorneys')
  })

  it('selects with count: exact for pagination', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest() as never)

    expect(mockSelectArgs[1]).toEqual({ count: 'exact' })
  })

  it('orders by created_at descending', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest() as never)

    expect(mockOrderCalls).toHaveLength(1)
    expect(mockOrderCalls[0][0]).toBe('created_at')
    expect(mockOrderCalls[0][1]).toEqual({ ascending: false })
  })

  it('uses default pagination when no params provided', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest() as never)

    // Default page=1, limit=20 -> offset=0, range=[0, 19]
    expect(mockRangeCalls).toHaveLength(1)
    expect(mockRangeCalls[0]).toEqual([0, 19])
  })

  it('defaults service_type to Attorney when no services linked', async () => {
    mockQueryResult = {
      data: [sampleProvider({ provider_services: [] })],
      error: null,
      count: 1,
    }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { providers: Array<Record<string, unknown>> }
    }

    expect(result.body.providers[0].specialty).toBe('Attorney')
  })

  it('defaults email and phone to empty string when null', async () => {
    mockQueryResult = {
      data: [sampleProvider({ email: null, phone: null, address_city: null, address_state: null })],
      error: null,
      count: 1,
    }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { providers: Array<Record<string, unknown>> }
    }

    const provider = result.body.providers[0]
    expect(provider.email).toBe('')
    expect(provider.phone).toBe('')
    expect(provider.address_city).toBe('')
    expect(provider.address_state).toBe('')
  })

  it('does not apply or() when search is empty string', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest({ search: '' }) as never)

    expect(mockOrCalls).toHaveLength(0)
  })

  it('returns 400 for negative page number', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest({ page: '-1' }) as never) as unknown as {
      status: number
      body: { success: boolean }
    }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 400 for invalid filter value', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest({ filter: 'bogus' }) as never) as unknown as {
      status: number
      body: { success: boolean }
    }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('includes select columns with specialty (provider_services table does not exist)', async () => {
    const { GET } = await import('@/app/api/admin/providers/route')
    await GET(createMockRequest() as never)

    const selectStr = mockSelectArgs[0] as string
    expect(selectStr).toContain('specialty')
    expect(selectStr).toContain('name')
    expect(selectStr).toContain('slug')
    expect(selectStr).not.toContain('provider_services')
  })

  it('returns correct total from count when null', async () => {
    mockQueryResult = { data: [sampleProvider()], error: null, count: null }

    const { GET } = await import('@/app/api/admin/providers/route')
    const result = await GET(createMockRequest() as never) as unknown as {
      body: { total: number; totalPages: number }
    }

    // count null should fallback to 0
    expect(result.body.total).toBe(0)
    expect(result.body.totalPages).toBe(0)
  })
})
