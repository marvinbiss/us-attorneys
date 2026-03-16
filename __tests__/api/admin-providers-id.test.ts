/**
 * Tests — Admin Provider [id] API (/api/admin/providers/[id])
 * GET: fetch provider by ID, invalid UUID, 404, auth check
 * PATCH: update provider fields, invalid data, invalid UUID
 * DELETE: soft delete (is_active=false), invalid UUID
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================
// Mocks — must come before route imports
// ============================================

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000'
const PROVIDER_UUID = '550e8400-e29b-41d4-a716-446655440001'

// --- NextResponse mock ---
const mockJsonFn = vi.fn((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
  body,
  status: init?.status ?? 200,
  headers: {
    set: vi.fn(),
  },
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => mockJsonFn(body, init),
  },
}))

// --- Logger mock ---
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// --- Supabase admin mock ---
type MockResult = { data: unknown; error: unknown }

let mockSelectResult: MockResult = { data: null, error: null }
let mockUpdateResult: MockResult = { data: null, error: null }
let lastOperation: 'select' | 'update' = 'select'

function makeBuilder(getResult: () => MockResult) {
  const b: Record<string, unknown> = {}
  b.select = vi.fn().mockReturnValue(b)
  b.eq = vi.fn().mockReturnValue(b)
  b.update = vi.fn((_data: unknown) => {
    lastOperation = 'update'
    return b
  })
  b.single = vi.fn().mockReturnValue(b)
  b.then = (resolve: (v: unknown) => unknown) => resolve(getResult())
  return b
}

let mockFromTable = ''

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      mockFromTable = table
      // Return a builder that dynamically picks the right result
      return makeBuilder(() => {
        if (lastOperation === 'update') return mockUpdateResult
        return mockSelectResult
      })
    }),
  })),
}))

// --- Admin auth mock ---
let mockAuthResult: {
  success: boolean
  admin?: { id: string; email: string; role: string; permissions: Record<string, Record<string, boolean>> }
  error?: unknown
}

const mockLogAdminAction = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/admin-auth', () => ({
  requirePermission: vi.fn(() => Promise.resolve(mockAuthResult)),
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}))

// --- Sanitize (real isValidUuid is simple enough, but mock the module for consistency) ---
vi.mock('@/lib/sanitize', () => ({
  isValidUuid: vi.fn((value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  }),
}))

// ============================================
// Helpers
// ============================================

function makeParams(id: string) {
  return { params: { id } }
}

function sampleProviderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PROVIDER_UUID,
    user_id: 'user-123',
    name: 'Smith & Associates',
    slug: 'smith-associates',
    email: 'smith@example.com',
    phone: '+12125551234',
    siret: '12345678901234',
    description: 'Expert trial attorney',
    address_street: '123 Broadway',
    address_city: 'New York',
    address_postal_code: '10001',
    address_region: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
    is_verified: true,
    is_active: true,
    rating_average: 4.5,
    review_count: 12,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-02-10T14:30:00Z',
    ...overrides,
  }
}

// ============================================
// beforeEach
// ============================================

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockFromTable = ''
  lastOperation = 'select'
  mockSelectResult = { data: sampleProviderRow(), error: null }
  mockUpdateResult = { data: sampleProviderRow(), error: null }
  mockAuthResult = {
    success: true,
    admin: {
      id: ADMIN_ID,
      email: 'admin@test.com',
      role: 'super_admin',
      permissions: {
        providers: { read: true, write: true, delete: true },
      },
    },
  }
})

// ============================================
// GET /api/admin/providers/[id]
// ============================================

describe('GET /api/admin/providers/[id]', () => {
  it('returns provider by ID (200)', async () => {
    const { GET } = await import('@/app/api/admin/providers/[id]/route')
    const result = await GET(
      {} as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { success: boolean; provider: Record<string, unknown> }; status: number }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.provider).toBeDefined()
    expect(result.body.provider.id).toBe(PROVIDER_UUID)
    expect(result.body.provider.name).toBe('Smith & Associates')
    expect(result.body.provider.full_name).toBe('Smith & Associates')
    expect(result.body.provider.email).toBe('smith@example.com')
    expect(result.body.provider.phone).toBe('+12125551234')
    expect(result.body.provider.slug).toBe('smith-associates')
    expect(mockFromTable).toBe('attorneys')
  })

  it('returns 400 for invalid UUID', async () => {
    const { GET } = await import('@/app/api/admin/providers/[id]/route')
    const result = await GET(
      {} as never,
      makeParams('not-a-uuid'),
    ) as unknown as { body: { success: boolean; error: string }; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect(result.body.error).toEqual({ message: 'Invalid ID' })
  })

  it('returns 404 for non-existent provider', async () => {
    mockSelectResult = { data: null, error: { code: 'PGRST116', message: 'not found' } }

    const { GET } = await import('@/app/api/admin/providers/[id]/route')
    const result = await GET(
      {} as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { success: boolean; error: string }; status: number }

    expect(result.status).toBe(404)
    expect(result.body.success).toBe(false)
    expect(result.body.error).toEqual({ message: 'Provider not found' })
  })

  it('returns 401/403 when not admin', async () => {
    mockAuthResult = {
      success: false,
      error: mockJsonFn({ success: false, error: { message: 'Unauthorized' } }, { status: 401 }),
    }

    const { GET } = await import('@/app/api/admin/providers/[id]/route')
    const result = await GET(
      {} as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { status: number }

    expect(result.status).toBe(401)
  })

  it('maps provider fields correctly for response', async () => {
    mockSelectResult = {
      data: sampleProviderRow({
        address_street: '456 Wilshire Blvd',
        address_city: 'Los Angeles',
        address_postal_code: '90017',
        address_region: 'California',
        is_verified: false,
        is_active: true,
        rating_average: 3.2,
        review_count: 5,
      }),
      error: null,
    }

    const { GET } = await import('@/app/api/admin/providers/[id]/route')
    const result = await GET(
      {} as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { provider: Record<string, unknown> } }

    const p = result.body.provider
    expect(p.address_street).toBe('456 Wilshire Blvd')
    expect(p.address_city).toBe('Los Angeles')
    expect(p.address_postal_code).toBe('90017')
    expect(p.address_region).toBe('California')
    expect(p.is_verified).toBe(false)
    expect(p.is_active).toBe(true)
    expect(p.rating_average).toBe(3.2)
    expect(p.review_count).toBe(5)
  })

  it('defaults null fields to empty strings', async () => {
    mockSelectResult = {
      data: sampleProviderRow({
        user_id: null,
        email: null,
        phone: null,
        siret: null,
        description: null,
        address_street: null,
        address_city: null,
        address_postal_code: null,
        address_region: null,
        rating_average: null,
        review_count: null,
      }),
      error: null,
    }

    const { GET } = await import('@/app/api/admin/providers/[id]/route')
    const result = await GET(
      {} as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { provider: Record<string, unknown> } }

    const p = result.body.provider
    expect(p.user_id).toBeNull()
    expect(p.email).toBe('')
    expect(p.phone).toBe('')
    expect(p.siret).toBe('')
    expect(p.description).toBe('')
    expect(p.address_street).toBe('')
    expect(p.address_city).toBe('')
    expect(p.address_postal_code).toBe('')
    expect(p.rating_average).toBeNull()
    expect(p.review_count).toBe(0)
  })
})

// ============================================
// PATCH /api/admin/providers/[id]
// ============================================

describe('PATCH /api/admin/providers/[id]', () => {
  function makePatchRequest(body: Record<string, unknown>) {
    return {
      json: () => Promise.resolve(body),
    } as never
  }

  it('updates provider fields (200)', async () => {
    lastOperation = 'update'
    mockUpdateResult = {
      data: sampleProviderRow({ name: 'Updated Law Firm', is_verified: true }),
      error: null,
    }

    const { PATCH } = await import('@/app/api/admin/providers/[id]/route')
    const result = await PATCH(
      makePatchRequest({ name: 'Updated Law Firm', is_verified: true }),
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { success: boolean; data: Record<string, unknown>; message: string }; status: number }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.message).toBe('Attorney updated successfully')
    expect(result.body.data).toBeDefined()
  })

  it('returns 400 for invalid data (zod validation)', async () => {
    const { PATCH } = await import('@/app/api/admin/providers/[id]/route')
    const result = await PATCH(
      makePatchRequest({ email: 'not-an-email' }),
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { success: boolean; error: string; details: unknown }; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect((result.body.error as unknown as { message: string }).message).toBe('Validation error')
  })

  it('returns 400 for invalid UUID', async () => {
    const { PATCH } = await import('@/app/api/admin/providers/[id]/route')
    const result = await PATCH(
      makePatchRequest({ name: 'Test' }),
      makeParams('bad-uuid'),
    ) as unknown as { body: { success: boolean; error: string }; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect(result.body.error).toEqual({ message: 'Invalid ID' })
  })

  it('returns 401/403 when not admin', async () => {
    mockAuthResult = {
      success: false,
      error: mockJsonFn({ success: false, error: { message: 'Forbidden' } }, { status: 403 }),
    }

    const { PATCH } = await import('@/app/api/admin/providers/[id]/route')
    const result = await PATCH(
      makePatchRequest({ name: 'Test' }),
      makeParams(PROVIDER_UUID),
    ) as unknown as { status: number }

    expect(result.status).toBe(403)
  })

  it('returns 400 for invalid JSON body', async () => {
    const { PATCH } = await import('@/app/api/admin/providers/[id]/route')
    const result = await PATCH(
      { json: () => Promise.reject(new Error('Invalid JSON')) } as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { success: boolean; error: string }; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect(result.body.error).toEqual({ message: 'Invalid JSON in request body' })
  })

  it('returns 500 on database update error', async () => {
    lastOperation = 'update'
    mockUpdateResult = {
      data: null,
      error: { code: '42501', message: 'permission denied' },
    }

    const { PATCH } = await import('@/app/api/admin/providers/[id]/route')
    const result = await PATCH(
      makePatchRequest({ name: 'Test' }),
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { success: boolean; error: string }; status: number }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
    expect(result.body.error).toEqual({ message: 'Error during update' })
  })

  it('calls logAdminAction on successful update', async () => {
    lastOperation = 'update'
    mockUpdateResult = {
      data: sampleProviderRow({ name: 'Logged Update' }),
      error: null,
    }

    const { PATCH } = await import('@/app/api/admin/providers/[id]/route')
    await PATCH(
      makePatchRequest({ name: 'Logged Update' }),
      makeParams(PROVIDER_UUID),
    )

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_ID,
      'provider.update',
      'provider',
      PROVIDER_UUID,
      expect.objectContaining({ updated_at: expect.any(String) }),
    )
  })

  it('strips HTML tags from text fields', async () => {
    lastOperation = 'update'
    mockUpdateResult = {
      data: sampleProviderRow({ description: 'Clean text' }),
      error: null,
    }

    const { PATCH } = await import('@/app/api/admin/providers/[id]/route')
    await PATCH(
      makePatchRequest({ description: '<script>alert("xss")</script>Clean text' }),
      makeParams(PROVIDER_UUID),
    )

    // The logAdminAction should have been called with sanitized data
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_ID,
      'provider.update',
      'provider',
      PROVIDER_UUID,
      expect.objectContaining({ description: 'alert("xss")Clean text' }),
    )
  })
})

// ============================================
// DELETE /api/admin/providers/[id]
// ============================================

describe('DELETE /api/admin/providers/[id]', () => {
  it('soft deletes provider by setting is_active=false (200)', async () => {
    lastOperation = 'update'
    mockUpdateResult = { data: null, error: null }

    const { DELETE } = await import('@/app/api/admin/providers/[id]/route')
    const result = await DELETE(
      {} as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { success: boolean; message: string }; status: number }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.message).toBe('Attorney deleted')
  })

  it('returns 400 for invalid UUID', async () => {
    const { DELETE } = await import('@/app/api/admin/providers/[id]/route')
    const result = await DELETE(
      {} as never,
      makeParams('invalid-id'),
    ) as unknown as { body: { success: boolean; error: string }; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect(result.body.error).toEqual({ message: 'Invalid ID' })
  })

  it('returns 401/403 when not admin', async () => {
    mockAuthResult = {
      success: false,
      error: mockJsonFn({ success: false, error: { message: 'Forbidden' } }, { status: 403 }),
    }

    const { DELETE } = await import('@/app/api/admin/providers/[id]/route')
    const result = await DELETE(
      {} as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { status: number }

    expect(result.status).toBe(403)
  })

  it('returns 500 on database error', async () => {
    lastOperation = 'update'
    mockUpdateResult = {
      data: null,
      error: { code: '42501', message: 'permission denied' },
    }

    const { DELETE } = await import('@/app/api/admin/providers/[id]/route')
    const result = await DELETE(
      {} as never,
      makeParams(PROVIDER_UUID),
    ) as unknown as { body: { success: boolean; error: string }; status: number }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
    expect(result.body.error).toEqual({ message: 'Error during deletion' })
  })

  it('calls logAdminAction on successful delete', async () => {
    lastOperation = 'update'
    mockUpdateResult = { data: null, error: null }

    const { DELETE } = await import('@/app/api/admin/providers/[id]/route')
    await DELETE(
      {} as never,
      makeParams(PROVIDER_UUID),
    )

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_ID,
      'provider.delete',
      'provider',
      PROVIDER_UUID,
    )
  })
})
