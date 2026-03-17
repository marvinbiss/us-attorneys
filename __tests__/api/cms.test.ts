/**
 * Integration tests -- CMS API Routes
 * Covers: CRUD pages, publish/unpublish, versions, restore,
 *         Zod validation, HTML sanitization, auth, cache invalidation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
// Type alias for mock responses used in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResponse = { status: number; body: Record<string, any> }


// ============================================
// Mock setup — must come before route imports
// ============================================

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000'
const PAGE_ID = '660e8400-e29b-41d4-a716-446655440001'
const VERSION_ID = '770e8400-e29b-41d4-a716-446655440002'

// --- NextResponse mock ---
const mockJsonFn = vi.fn((body: unknown, init?: { status?: number }) => ({
  body,
  status: init?.status ?? 200,
  _isNextResponse: true,
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => mockJsonFn(body, init),
  },
}))

// --- next/cache mock ---
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// --- Logger mock ---
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    api: { request: vi.fn(), success: vi.fn(), error: vi.fn() },
  },
}))

// --- DOMPurify mock ---
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((input: string) => input),
  },
}))

// --- Cache mock ---
const mockInvalidateCache = vi.fn()
vi.mock('@/lib/cache', () => ({
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
  CACHE_TTL: { cms: 300 },
  REVALIDATE: { cms: 300 },
}))

// --- cms-revalidate mock ---
const mockRevalidatePagePaths = vi.fn()
vi.mock('@/lib/cms-revalidate', () => ({
  revalidatePagePaths: (...args: unknown[]) => mockRevalidatePagePaths(...args),
}))

// --- Supabase mock builder ---

function createMockQueryBuilder(overrides: {
  selectData?: unknown
  selectError?: { code?: string; message?: string } | null
  insertData?: unknown
  insertError?: { code?: string; message?: string } | null
  updateData?: unknown
  updateError?: { code?: string; message?: string } | null
  count?: number | null
} = {}) {
  const {
    selectData = null,
    selectError = null,
    insertData = null,
    insertError = null,
    updateData = null,
    updateError = null,
    count = null,
  } = overrides

  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      // Determine which result to return based on what was called
      if ((builder.insert as ReturnType<typeof vi.fn>).mock.calls.length > 0) {
        return Promise.resolve({ data: insertData, error: insertError })
      }
      if ((builder.update as ReturnType<typeof vi.fn>).mock.calls.length > 0) {
        return Promise.resolve({ data: updateData, error: updateError })
      }
      return Promise.resolve({ data: selectData, error: selectError, count })
    }),
  }

  // For queries that do NOT call .single() (list queries)
  // Make the builder itself thenable for await
  ;(builder as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: selectData, error: selectError, count })

  return builder
}

let mockSupabaseFrom: ReturnType<typeof vi.fn>

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => (mockSupabaseFrom as (...args: unknown[]) => unknown)(...args),
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
  verifyAdmin: vi.fn(() => Promise.resolve(mockAuthResult)),
  hasPermission: vi.fn(() => true),
  logAdminAction: vi.fn(() => Promise.resolve()),
}))

// ============================================
// Helpers
// ============================================

function makeRequest(url: string, options: RequestInit = {}): NextRequest {
  return new Request(`http://localhost:3000${url}`, options as never) as unknown as NextRequest
}

function makeJsonRequest(url: string, body: unknown, method = 'POST'): NextRequest {
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

function validCreateBody(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'ma-page-test',
    page_type: 'static',
    title: 'Ma Page Test',
    ...overrides,
  }
}

const validPageData = {
  id: PAGE_ID,
  slug: 'ma-page-test',
  page_type: 'static',
  title: 'Ma Page Test',
  status: 'draft',
  is_active: true,
  content_html: null,
  content_json: null,
  structured_data: null,
  meta_title: null,
  meta_description: null,
  created_by: ADMIN_ID,
  updated_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  published_at: null,
}

// ============================================
// Default state reset
// ============================================

beforeEach(() => {
  vi.clearAllMocks()

  mockAuthResult = {
    success: true,
    admin: {
      id: ADMIN_ID,
      email: 'admin@test.com',
      role: 'super_admin',
      permissions: {
        content: { read: true, write: true, delete: true, publish: true },
      },
    },
  }

  // Default: return an empty query builder
  mockSupabaseFrom = vi.fn(() => createMockQueryBuilder())
})

// ============================================
// POST /api/admin/cms — Create page
// ============================================

describe('POST /api/admin/cms (Create)', () => {
  it('creates a valid static page and returns 201', async () => {
    const created = { ...validPageData }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ insertData: created }))

    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody())
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ success: true, data: created })
  })

  it('rejects missing title with 400', async () => {
    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', { slug: 'test', page_type: 'static' })
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects invalid slug format with 400', async () => {
    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody({ slug: 'Invalid Slug!' }))
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects invalid page_type with 400', async () => {
    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody({ page_type: 'invalid' }))
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects duplicate slug (23505 error) with 409', async () => {
    mockSupabaseFrom = vi.fn(() =>
      createMockQueryBuilder({ insertData: null, insertError: { code: '23505', message: 'duplicate key' } })
    )

    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody())
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.error.message).toContain('slug already exists')
  })

  it('returns error when auth fails', async () => {
    const authError = { body: { success: false }, status: 401, _isNextResponse: true }
    mockAuthResult = { success: false, error: authError }

    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody())
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(401)
  })

  it('sanitizes content_html via DOMPurify', async () => {
    const DOMPurify = (await import('isomorphic-dompurify')).default

    const created = { ...validPageData, content_html: '<p>clean</p>' }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ insertData: created }))

    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest(
      '/api/admin/cms',
      validCreateBody({ content_html: '<script>alert("xss")</script><p>clean</p>' })
    )
    await POST(req)

    expect(DOMPurify.sanitize).toHaveBeenCalledWith('<script>alert("xss")</script><p>clean</p>')
  })

  it('strips HTML from text fields (title, meta_title, etc.)', async () => {
    const created = { ...validPageData, title: 'Test bold', meta_title: 'Meta' }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ insertData: created }))

    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody({
      title: 'Test <b>bold</b>',
      meta_title: '<b>Meta</b>',
    }))
    const res = await POST(req) as unknown as MockResponse

    // The insert should have been called with sanitized text fields
    expect(res.status).toBe(201)
    // Verify the insert call had stripped HTML
    const insertCall = mockSupabaseFrom.mock.results[0]?.value?.insert
    if (insertCall) {
      const insertArg = insertCall.mock.calls[0]?.[0]
      if (insertArg) {
        expect(insertArg.title).toBe('Test bold')
        expect(insertArg.meta_title).toBe('Meta')
      }
    }
  })

  it('rejects oversized content_json (>500KB) with 400', async () => {
    const bigJson: Record<string, string> = {}
    // Create content_json that exceeds 500KB when stringified
    for (let i = 0; i < 600; i++) {
      bigJson[`key_${i}`] = 'x'.repeat(1000)
    }

    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody({ content_json: bigJson }))
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('JSON')
  })

  it('rejects oversized structured_data (>100KB) with 400', async () => {
    const bigData: Record<string, string> = {}
    for (let i = 0; i < 120; i++) {
      bigData[`key_${i}`] = 'x'.repeat(1000)
    }

    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody({ structured_data: bigData }))
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Structured data')
  })

  it('rejects service page without service_slug with 400', async () => {
    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody({
      page_type: 'service',
      service_slug: undefined,
    }))
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects location page without location_slug with 400', async () => {
    const { POST } = await import('@/app/api/admin/cms/route')
    const req = makeJsonRequest('/api/admin/cms', validCreateBody({
      page_type: 'location',
      service_slug: 'personal-injury',
      // location_slug missing
    }))
    const res = await POST(req) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ============================================
// GET /api/admin/cms — List pages
// ============================================

describe('GET /api/admin/cms (List)', () => {
  it('returns paginated list with defaults', async () => {
    const pages = [validPageData]
    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder({ selectData: pages, count: 1 })
      // Override single — list queries do not call .single()
      // Instead the chain resolves via range() returning the promise
      builder.range = vi.fn().mockReturnValue(
        Promise.resolve({ data: pages, error: null, count: 1 })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/route')
    const req = makeRequest('/api/admin/cms')
    const res = await GET(req) as unknown as MockResponse

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual(pages)
    expect(res.body.pagination).toBeDefined()
    expect(res.body.pagination.page).toBe(1)
    expect(res.body.pagination.pageSize).toBe(20)
  })

  it('filters by page_type', async () => {
    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder({ selectData: [], count: 0 })
      builder.range = vi.fn().mockReturnValue(
        Promise.resolve({ data: [], error: null, count: 0 })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/route')
    const req = makeRequest('/api/admin/cms?page_type=blog')
    const res = await GET(req) as unknown as MockResponse

    expect(res.status).toBe(200)
    // Verify eq was called with page_type filter
    const fromResult = mockSupabaseFrom.mock.results[0].value
    expect(fromResult.eq).toHaveBeenCalledWith('page_type', 'blog')
  })

  it('filters by status', async () => {
    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder({ selectData: [], count: 0 })
      builder.range = vi.fn().mockReturnValue(
        Promise.resolve({ data: [], error: null, count: 0 })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/route')
    const req = makeRequest('/api/admin/cms?status=published')
    const res = await GET(req) as unknown as MockResponse

    expect(res.status).toBe(200)
    const fromResult = mockSupabaseFrom.mock.results[0].value
    expect(fromResult.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('searches by title (ilike)', async () => {
    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder({ selectData: [], count: 0 })
      builder.range = vi.fn().mockReturnValue(
        Promise.resolve({ data: [], error: null, count: 0 })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/route')
    const req = makeRequest('/api/admin/cms?search=attorney')
    const res = await GET(req) as unknown as MockResponse

    expect(res.status).toBe(200)
    const fromResult = mockSupabaseFrom.mock.results[0].value
    expect(fromResult.ilike).toHaveBeenCalledWith('title', '%attorney%')
  })

  it('sorts by different columns', async () => {
    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder({ selectData: [], count: 0 })
      builder.range = vi.fn().mockReturnValue(
        Promise.resolve({ data: [], error: null, count: 0 })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/route')
    const req = makeRequest('/api/admin/cms?sortBy=title&sortOrder=asc')
    const res = await GET(req) as unknown as MockResponse

    expect(res.status).toBe(200)
    const fromResult = mockSupabaseFrom.mock.results[0].value
    expect(fromResult.order).toHaveBeenCalledWith('title', { ascending: true })
  })

  it('filters inactive pages by default', async () => {
    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder({ selectData: [], count: 0 })
      builder.range = vi.fn().mockReturnValue(
        Promise.resolve({ data: [], error: null, count: 0 })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/route')
    const req = makeRequest('/api/admin/cms')
    const res = await GET(req) as unknown as MockResponse

    expect(res.status).toBe(200)
    const fromResult = mockSupabaseFrom.mock.results[0].value
    expect(fromResult.eq).toHaveBeenCalledWith('is_active', true)
  })

  it('shows inactive pages when show_inactive=true', async () => {
    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder({ selectData: [], count: 0 })
      builder.range = vi.fn().mockReturnValue(
        Promise.resolve({ data: [], error: null, count: 0 })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/route')
    const req = makeRequest('/api/admin/cms?show_inactive=true')
    const res = await GET(req) as unknown as MockResponse

    expect(res.status).toBe(200)
    // Should NOT have filtered by is_active
    const fromResult = mockSupabaseFrom.mock.results[0].value
    const eqCalls = (fromResult.eq as ReturnType<typeof vi.fn>).mock.calls
    const isActiveFilter = eqCalls.find((call: unknown[]) => call[0] === 'is_active')
    expect(isActiveFilter).toBeUndefined()
  })

  it('rejects invalid page parameter with 400', async () => {
    const { GET } = await import('@/app/api/admin/cms/route')
    const req = makeRequest('/api/admin/cms?page=0')
    const res = await GET(req) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ============================================
// GET /api/admin/cms/[id] — Get single page
// ============================================

describe('GET /api/admin/cms/[id] (Get single)', () => {
  it('returns page by valid UUID', async () => {
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ selectData: validPageData }))

    const { GET } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}`)
    const res = await GET(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual(validPageData)
  })

  it('rejects invalid UUID with 400', async () => {
    const { GET } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeRequest('/api/admin/cms/not-a-uuid')
    const res = await GET(req, { params: { id: 'not-a-uuid' } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Invalid ID')
  })

  it('returns 404 for non-existent page', async () => {
    mockSupabaseFrom = vi.fn(() =>
      createMockQueryBuilder({ selectData: null, selectError: { code: 'PGRST116', message: 'not found' } })
    )

    const { GET } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}`)
    const res = await GET(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(404)
    expect(res.body.error.message).toContain('not found')
  })

  it('requires auth', async () => {
    const authError = { body: { success: false }, status: 401, _isNextResponse: true }
    mockAuthResult = { success: false, error: authError }

    const { GET } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}`)
    const res = await GET(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(401)
  })
})

// ============================================
// PUT /api/admin/cms/[id] — Update page
// ============================================

describe('PUT /api/admin/cms/[id] (Update)', () => {
  it('updates valid fields and returns 200', async () => {
    const updated = { ...validPageData, title: 'Updated Title' }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ updateData: updated }))

    const { PUT } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}`, { title: 'Updated Title' }, 'PUT')
    const res = await PUT(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('Updated Title')
  })

  it('rejects invalid UUID with 400', async () => {
    const { PUT } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeJsonRequest('/api/admin/cms/bad-id', { title: 'test' }, 'PUT')
    const res = await PUT(req, { params: { id: 'bad-id' } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Invalid ID')
  })

  it('returns 404 for non-existent page', async () => {
    mockSupabaseFrom = vi.fn(() =>
      createMockQueryBuilder({ updateData: null, updateError: null })
    )

    const { PUT } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}`, { title: 'test' }, 'PUT')
    const res = await PUT(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(404)
  })

  it('sanitizes content_html', async () => {
    const DOMPurify = (await import('isomorphic-dompurify')).default
    const updated = { ...validPageData, content_html: '<p>safe</p>' }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ updateData: updated }))

    const { PUT } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}`, { content_html: '<p>safe</p>' }, 'PUT')
    await PUT(req, { params: { id: PAGE_ID } })

    expect(DOMPurify.sanitize).toHaveBeenCalledWith('<p>safe</p>')
  })

  it('strips HTML from text fields', async () => {
    const updated = { ...validPageData, title: 'Clean Title' }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ updateData: updated }))

    const { PUT } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}`, { title: '<b>Clean Title</b>' }, 'PUT')
    const res = await PUT(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(200)
    // Verify update was called with stripped title
    const updateCall = mockSupabaseFrom.mock.results[0]?.value?.update
    if (updateCall) {
      const updateArg = updateCall.mock.calls[0]?.[0]
      if (updateArg) {
        expect(updateArg.title).toBe('Clean Title')
      }
    }
  })

  it('invalidates cache after update', async () => {
    const updated = { ...validPageData, title: 'New Title' }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ updateData: updated }))

    const { PUT } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}`, { title: 'New Title' }, 'PUT')
    await PUT(req, { params: { id: PAGE_ID } })

    expect(mockInvalidateCache).toHaveBeenCalled()
  })

  it('rejects invalid slug format with 400', async () => {
    const { PUT } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}`, { slug: 'INVALID SLUG!!' }, 'PUT')
    const res = await PUT(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ============================================
// DELETE /api/admin/cms/[id] — Soft delete
// ============================================

describe('DELETE /api/admin/cms/[id] (Soft delete)', () => {
  it('soft deletes page (sets is_active=false) and returns 200', async () => {
    const deleted = { ...validPageData, is_active: false }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ updateData: deleted }))

    const { DELETE } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}`)
    const res = await DELETE(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    // Verify is_active was set to false
    const updateCall = mockSupabaseFrom.mock.results[0]?.value?.update
    if (updateCall) {
      const updateArg = updateCall.mock.calls[0]?.[0]
      expect(updateArg.is_active).toBe(false)
    }
  })

  it('rejects invalid UUID with 400', async () => {
    const { DELETE } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeRequest('/api/admin/cms/bad-id')
    const res = await DELETE(req, { params: { id: 'bad-id' } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Invalid ID')
  })

  it('invalidates cache after delete', async () => {
    const deleted = { ...validPageData, is_active: false }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ updateData: deleted }))

    const { DELETE } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}`)
    await DELETE(req, { params: { id: PAGE_ID } })

    expect(mockInvalidateCache).toHaveBeenCalled()
  })

  it('requires delete permission', async () => {
    const authError = { body: { success: false }, status: 403, _isNextResponse: true }
    mockAuthResult = { success: false, error: authError }

    const { DELETE } = await import('@/app/api/admin/cms/[id]/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}`)
    const res = await DELETE(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(403)
  })
})

// ============================================
// POST /api/admin/cms/[id]/publish — Publish
// ============================================

describe('POST /api/admin/cms/[id]/publish (Publish)', () => {
  it('publishes draft page and returns 200', async () => {
    const published = { ...validPageData, status: 'published', published_at: '2026-01-15T00:00:00Z' }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ updateData: published }))

    const { POST } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/publish`)
    const res = await POST(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('published')
  })

  it('rejects already published page with 409', async () => {
    // First from() call: update query returns PGRST116 (no rows matched neq filter)
    // Second from() call: select to check if page exists and is published
    let fromCallCount = 0
    mockSupabaseFrom = vi.fn(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return createMockQueryBuilder({ updateError: { code: 'PGRST116', message: 'no rows' } })
      }
      return createMockQueryBuilder({ selectData: { status: 'published' } })
    })

    const { POST } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/publish`)
    const res = await POST(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(409)
    expect(res.body.error.message).toContain('publi')
  })

  it('rejects invalid UUID with 400', async () => {
    const { POST } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest('/api/admin/cms/bad-id/publish')
    const res = await POST(req, { params: { id: 'bad-id' } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Invalid ID')
  })

  it('requires publish permission', async () => {
    const authError = { body: { success: false }, status: 403, _isNextResponse: true }
    mockAuthResult = { success: false, error: authError }

    const { POST } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/publish`)
    const res = await POST(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(403)
  })

  it('invalidates cache after publish', async () => {
    const published = { ...validPageData, status: 'published', published_at: '2026-01-15T00:00:00Z' }
    mockSupabaseFrom = vi.fn(() => createMockQueryBuilder({ updateData: published }))

    const { POST } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/publish`)
    await POST(req, { params: { id: PAGE_ID } })

    expect(mockInvalidateCache).toHaveBeenCalled()
    expect(mockRevalidatePagePaths).toHaveBeenCalled()
  })
})

// ============================================
// DELETE /api/admin/cms/[id]/publish — Unpublish
// ============================================

describe('DELETE /api/admin/cms/[id]/publish (Unpublish)', () => {
  it('unpublishes published page and returns 200', async () => {
    const unpublished = { ...validPageData, status: 'draft', published_at: null }
    // First from() call: select current page data for revalidation
    // Second from() call: update to draft
    let fromCallCount = 0
    mockSupabaseFrom = vi.fn(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return createMockQueryBuilder({
          selectData: { page_type: 'static', slug: 'test', service_slug: null, location_slug: null },
        })
      }
      return createMockQueryBuilder({ updateData: unpublished })
    })

    const { DELETE } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/publish`)
    const res = await DELETE(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('draft')
    expect(res.body.data.published_at).toBeNull()
  })

  it('rejects invalid UUID with 400', async () => {
    const { DELETE } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest('/api/admin/cms/bad-id/publish')
    const res = await DELETE(req, { params: { id: 'bad-id' } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Invalid ID')
  })

  it('clears published_at on unpublish', async () => {
    const unpublished = { ...validPageData, status: 'draft', published_at: null }
    // First from() call: select current page data for revalidation
    // Second from() call: update to draft
    let fromCallCount = 0
    mockSupabaseFrom = vi.fn(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return createMockQueryBuilder({
          selectData: { page_type: 'static', slug: 'test', service_slug: null, location_slug: null },
        })
      }
      return createMockQueryBuilder({ updateData: unpublished })
    })

    const { DELETE } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/publish`)
    const res = await DELETE(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.body.data.published_at).toBeNull()
    // Verify the update payload includes published_at: null
    // The second from() call is the update query
    const updateCall = mockSupabaseFrom.mock.results[1]?.value?.update
    if (updateCall) {
      const updateArg = updateCall.mock.calls[0]?.[0]
      expect(updateArg.published_at).toBeNull()
    }
  })

  it('invalidates cache after unpublish', async () => {
    const unpublished = { ...validPageData, status: 'draft', published_at: null }
    // First from() call: select current page data for revalidation
    // Second from() call: update to draft
    let fromCallCount = 0
    mockSupabaseFrom = vi.fn(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return createMockQueryBuilder({
          selectData: { page_type: 'static', slug: 'test', service_slug: null, location_slug: null },
        })
      }
      return createMockQueryBuilder({ updateData: unpublished })
    })

    const { DELETE } = await import('@/app/api/admin/cms/[id]/publish/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/publish`)
    await DELETE(req, { params: { id: PAGE_ID } })

    expect(mockInvalidateCache).toHaveBeenCalled()
  })
})

// ============================================
// GET /api/admin/cms/[id]/versions — Version history
// ============================================

describe('GET /api/admin/cms/[id]/versions (Version history)', () => {
  it('returns version history', async () => {
    const versions = [
      { id: VERSION_ID, page_id: PAGE_ID, version_number: 2, title: 'V2' },
      { id: '880e8400-e29b-41d4-a716-446655440003', page_id: PAGE_ID, version_number: 1, title: 'V1' },
    ]

    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder()
      let callCount = 0
      builder.single = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First: verify page exists
          return Promise.resolve({ data: { id: PAGE_ID }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })
      // Override limit for version list query
      builder.limit = vi.fn().mockReturnValue(
        Promise.resolve({ data: versions, error: null })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/[id]/versions/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/versions`)
    const res = await GET(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual(versions)
  })

  it('rejects invalid UUID with 400', async () => {
    const { GET } = await import('@/app/api/admin/cms/[id]/versions/route')
    const req = makeRequest('/api/admin/cms/bad-id/versions')
    const res = await GET(req, { params: { id: 'bad-id' } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Invalid ID')
  })

  it('returns 404 for non-existent page', async () => {
    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder()
      builder.single = vi.fn().mockReturnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'not found' } })
      )
      return builder
    })

    const { GET } = await import('@/app/api/admin/cms/[id]/versions/route')
    const req = makeRequest(`/api/admin/cms/${PAGE_ID}/versions`)
    const res = await GET(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(404)
    expect(res.body.error.message).toContain('not found')
  })
})

// ============================================
// POST /api/admin/cms/[id]/restore — Restore version
// ============================================

describe('POST /api/admin/cms/[id]/restore (Restore version)', () => {
  it('restores a version and returns 200', async () => {
    const version = {
      id: VERSION_ID,
      page_id: PAGE_ID,
      content_json: { blocks: [] },
      content_html: '<p>Restored content</p>',
      structured_data: null,
      title: 'Restored Title',
      meta_title: 'Restored Meta',
      meta_description: 'Restored Desc',
    }
    const restored = { ...validPageData, title: 'Restored Title', content_html: '<p>Restored content</p>' }

    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder()
      let callCount = 0
      builder.single = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First: fetch version
          return Promise.resolve({ data: version, error: null })
        }
        // Second: update page with version content
        return Promise.resolve({ data: restored, error: null })
      })
      return builder
    })

    const { POST } = await import('@/app/api/admin/cms/[id]/restore/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}/restore`, { version_id: VERSION_ID })
    const res = await POST(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('Restored Title')
  })

  it('rejects invalid UUID with 400', async () => {
    const { POST } = await import('@/app/api/admin/cms/[id]/restore/route')
    const req = makeJsonRequest('/api/admin/cms/bad-id/restore', { version_id: VERSION_ID })
    const res = await POST(req, { params: { id: 'bad-id' } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.error.message).toContain('Invalid ID')
  })

  it('rejects invalid version_id with 400', async () => {
    const { POST } = await import('@/app/api/admin/cms/[id]/restore/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}/restore`, { version_id: 'not-a-uuid' })
    const res = await POST(req, { params: { id: PAGE_ID } }) as unknown as MockResponse

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('sanitizes restored content_html', async () => {
    const DOMPurify = (await import('isomorphic-dompurify')).default
    const version = {
      id: VERSION_ID,
      page_id: PAGE_ID,
      content_json: null,
      content_html: '<script>bad</script><p>Good</p>',
      structured_data: null,
      title: 'Test',
      meta_title: null,
      meta_description: null,
    }
    const restored = { ...validPageData }

    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder()
      let callCount = 0
      builder.single = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ data: version, error: null })
        }
        return Promise.resolve({ data: restored, error: null })
      })
      return builder
    })

    const { POST } = await import('@/app/api/admin/cms/[id]/restore/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}/restore`, { version_id: VERSION_ID })
    await POST(req, { params: { id: PAGE_ID } })

    expect(DOMPurify.sanitize).toHaveBeenCalledWith('<script>bad</script><p>Good</p>')
  })

  it('invalidates cache after restore', async () => {
    const version = {
      id: VERSION_ID,
      page_id: PAGE_ID,
      content_json: null,
      content_html: null,
      structured_data: null,
      title: 'Test',
      meta_title: null,
      meta_description: null,
    }
    const restored = { ...validPageData }

    mockSupabaseFrom = vi.fn(() => {
      const builder = createMockQueryBuilder()
      let callCount = 0
      builder.single = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ data: version, error: null })
        }
        return Promise.resolve({ data: restored, error: null })
      })
      return builder
    })

    const { POST } = await import('@/app/api/admin/cms/[id]/restore/route')
    const req = makeJsonRequest(`/api/admin/cms/${PAGE_ID}/restore`, { version_id: VERSION_ID })
    await POST(req, { params: { id: PAGE_ID } })

    expect(mockInvalidateCache).toHaveBeenCalled()
  })
})

// ============================================
// CMS Validation schemas — pure unit tests
// ============================================

describe('CMS Validation — createPageSchema', () => {
  it('accepts a valid static page', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody())
    expect(result.success).toBe(true)
  })

  it('rejects empty slug', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ slug: '' }))
    expect(result.success).toBe(false)
  })

  it('rejects slug with uppercase', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ slug: 'My-Page' }))
    expect(result.success).toBe(false)
  })

  it('rejects slug with spaces', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ slug: 'my page' }))
    expect(result.success).toBe(false)
  })

  it('accepts slug with numbers and dashes', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ slug: 'page-123-test' }))
    expect(result.success).toBe(true)
  })

  it('rejects missing title', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse({ slug: 'test', page_type: 'static' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid page_type', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ page_type: 'landing' }))
    expect(result.success).toBe(false)
  })

  it('accepts all valid page_types', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const types = ['static', 'blog', 'service', 'location', 'homepage', 'faq']
    for (const pt of types) {
      const extra: Record<string, string> = { page_type: pt }
      if (pt === 'service') extra.service_slug = 'personal-injury'
      if (pt === 'location') {
        extra.service_slug = 'personal-injury'
        extra.location_slug = 'paris'
      }
      const result = createPageSchema.safeParse(validCreateBody(extra))
      expect(result.success).toBe(true)
    }
  })

  it('rejects service page without service_slug', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ page_type: 'service' }))
    expect(result.success).toBe(false)
  })

  it('rejects location page without location_slug', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({
      page_type: 'location',
      service_slug: 'personal-injury',
    }))
    expect(result.success).toBe(false)
  })

  it('rejects location page without service_slug', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({
      page_type: 'location',
      location_slug: 'paris',
    }))
    expect(result.success).toBe(false)
  })

  it('accepts meta_title up to 70 chars', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ meta_title: 'x'.repeat(70) }))
    expect(result.success).toBe(true)
  })

  it('rejects meta_title over 70 chars', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ meta_title: 'x'.repeat(71) }))
    expect(result.success).toBe(false)
  })

  it('accepts meta_description up to 170 chars', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ meta_description: 'x'.repeat(170) }))
    expect(result.success).toBe(true)
  })

  it('rejects meta_description over 170 chars', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ meta_description: 'x'.repeat(171) }))
    expect(result.success).toBe(false)
  })

  it('accepts tags array', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const result = createPageSchema.safeParse(validCreateBody({ tags: ['seo', 'personal-injury'] }))
    expect(result.success).toBe(true)
  })

  it('rejects tags array exceeding 50 items', async () => {
    const { createPageSchema } = await import('@/lib/cms-utils')
    const tags = Array.from({ length: 51 }, (_, i) => `tag-${i}`)
    const result = createPageSchema.safeParse(validCreateBody({ tags }))
    expect(result.success).toBe(false)
  })
})

describe('CMS Validation — updatePageSchema', () => {
  it('accepts partial updates (all fields optional)', async () => {
    const { updatePageSchema } = await import('@/lib/cms-utils')
    const result = updatePageSchema.safeParse({ title: 'New Title' })
    expect(result.success).toBe(true)
  })

  it('accepts empty object', async () => {
    const { updatePageSchema } = await import('@/lib/cms-utils')
    const result = updatePageSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects invalid slug in update', async () => {
    const { updatePageSchema } = await import('@/lib/cms-utils')
    const result = updatePageSchema.safeParse({ slug: 'BAD SLUG!!' })
    expect(result.success).toBe(false)
  })
})

describe('CMS Utils — stripHtml', () => {
  it('strips HTML tags from string', async () => {
    const { stripHtml } = await import('@/lib/cms-utils')
    expect(stripHtml('<b>bold</b> text')).toBe('bold text')
  })

  it('strips script tags', async () => {
    const { stripHtml } = await import('@/lib/cms-utils')
    expect(stripHtml('<script>alert("xss")</script>safe')).toBe('alert("xss")safe')
  })

  it('returns null for null input', async () => {
    const { stripHtml } = await import('@/lib/cms-utils')
    expect(stripHtml(null)).toBeNull()
  })

  it('returns undefined for undefined input', async () => {
    const { stripHtml } = await import('@/lib/cms-utils')
    expect(stripHtml(undefined)).toBeUndefined()
  })

  it('returns empty string for empty string', async () => {
    const { stripHtml } = await import('@/lib/cms-utils')
    expect(stripHtml('')).toBe('')
  })
})

describe('CMS Utils — sanitizeTextFields', () => {
  it('strips HTML from all text fields', async () => {
    const { sanitizeTextFields } = await import('@/lib/cms-utils')
    const data = {
      title: '<b>Title</b>',
      meta_title: '<i>Meta</i>',
      meta_description: '<i>Desc</i>',
      excerpt: '<a href="x">Link</a>',
      author: '<span>Author</span>',
      category: '<div>Cat</div>',
    }
    sanitizeTextFields(data)
    expect(data.title).toBe('Title')
    expect(data.meta_title).toBe('Meta')
    expect(data.meta_description).toBe('Desc')
    expect(data.excerpt).toBe('Link')
    expect(data.author).toBe('Author')
    expect(data.category).toBe('Cat')
  })

  it('does not modify non-text fields', async () => {
    const { sanitizeTextFields } = await import('@/lib/cms-utils')
    const data = {
      title: 'Normal',
      content_html: '<p>Should NOT be touched</p>',
      slug: 'my-slug',
    }
    sanitizeTextFields(data)
    expect(data.content_html).toBe('<p>Should NOT be touched</p>')
    expect(data.slug).toBe('my-slug')
  })

  it('handles null and undefined values gracefully', async () => {
    const { sanitizeTextFields } = await import('@/lib/cms-utils')
    const data = {
      title: null as string | null,
      meta_title: undefined as string | undefined,
    }
    sanitizeTextFields(data)
    expect(data.title).toBeNull()
    expect(data.meta_title).toBeUndefined()
  })
})

describe('CMS Utils — UUID_RE', () => {
  it('matches valid UUID v4', async () => {
    const { UUID_RE } = await import('@/lib/cms-utils')
    expect(UUID_RE.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(UUID_RE.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
  })

  it('rejects invalid UUIDs', async () => {
    const { UUID_RE } = await import('@/lib/cms-utils')
    expect(UUID_RE.test('not-a-uuid')).toBe(false)
    expect(UUID_RE.test('')).toBe(false)
    expect(UUID_RE.test('550e8400-e29b-41d4-a716')).toBe(false)
    expect(UUID_RE.test('550e8400e29b41d4a716446655440000')).toBe(false) // missing dashes
  })

  it('is case-insensitive', async () => {
    const { UUID_RE } = await import('@/lib/cms-utils')
    expect(UUID_RE.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
  })
})

// ============================================
// File structure and security checks
// ============================================

describe('CMS API — Files existence & structure', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { readFileSync, existsSync } = require('fs') as typeof import('fs')
  const { resolve } = require('path') as typeof import('path')

  const BASE = resolve(__dirname, '..', '..')

  const requiredRoutes = [
    'src/app/api/admin/cms/route.ts',
    'src/app/api/admin/cms/[id]/route.ts',
    'src/app/api/admin/cms/[id]/publish/route.ts',
    'src/app/api/admin/cms/[id]/restore/route.ts',
    'src/app/api/admin/cms/[id]/versions/route.ts',
  ]

  for (const route of requiredRoutes) {
    it(`file exists: ${route}`, () => {
      expect(existsSync(resolve(BASE, route))).toBe(true)
    })
  }

  it('all CMS routes use requirePermission', () => {
    for (const route of requiredRoutes) {
      const content = readFileSync(resolve(BASE, route), 'utf-8')
      expect(content).toContain('requirePermission')
    }
  })

  it('all CMS routes use createAdminClient', () => {
    for (const route of requiredRoutes) {
      const content = readFileSync(resolve(BASE, route), 'utf-8')
      expect(content).toContain('createAdminClient')
    }
  })

  it('CMS routes with GET handlers use force-dynamic', () => {
    for (const route of requiredRoutes) {
      const content = readFileSync(resolve(BASE, route), 'utf-8')
      // POST-only routes don't need force-dynamic (handled by createApiHandler)
      const hasGet = content.includes('export const GET') || content.includes('export async function GET')
      if (hasGet) {
        expect(content).toContain("dynamic = 'force-dynamic'")
      }
    }
  })

  it('no route leaks error.message to client', () => {
    for (const route of requiredRoutes) {
      const content = readFileSync(resolve(BASE, route), 'utf-8')
      const jsonResponses = content.match(/NextResponse\.json\(\{[^}]*error\.message[^}]*\}/g)
      expect(jsonResponses).toBeNull()
    }
  })

  it('routes with POST+JSON body use zod safeParse', () => {
    const routesWithPost = requiredRoutes.filter(r => {
      const content = readFileSync(resolve(BASE, r), 'utf-8')
      return content.includes('export async function POST') && content.includes('request.json()')
    })

    for (const route of routesWithPost) {
      const content = readFileSync(resolve(BASE, route), 'utf-8')
      expect(content).toContain('safeParse')
    }
  })

  it('routes never use createClient (user-session) for admin operations', () => {
    for (const route of requiredRoutes) {
      const content = readFileSync(resolve(BASE, route), 'utf-8')
      expect(content).not.toMatch(/\bfrom\b.*['"]@\/lib\/supabase\/server['"]/)
    }
  })

  it('routes with mutations call invalidateCache', () => {
    const mutationRoutes = requiredRoutes.filter(r => {
      const content = readFileSync(resolve(BASE, r), 'utf-8')
      return content.includes('export async function PUT') ||
        content.includes('export async function DELETE') ||
        (content.includes('export async function POST') && r !== 'src/app/api/admin/cms/route.ts')
    })

    for (const route of mutationRoutes) {
      const content = readFileSync(resolve(BASE, route), 'utf-8')
      expect(content).toContain('invalidateCache')
    }
  })

  it('HTML content routes use DOMPurify sanitize', () => {
    const htmlRoutes = [
      'src/app/api/admin/cms/route.ts',
      'src/app/api/admin/cms/[id]/route.ts',
      'src/app/api/admin/cms/[id]/restore/route.ts',
    ]
    for (const route of htmlRoutes) {
      const content = readFileSync(resolve(BASE, route), 'utf-8')
      expect(content).toContain('DOMPurify.sanitize')
    }
  })
})
