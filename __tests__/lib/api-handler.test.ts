/**
 * Tests for src/lib/api/handler.ts
 *
 * Covers:
 * - createApiHandler: body validation, auth, attorney check, admin check, error handling
 * - jsonResponse / apiSuccess / apiError / paginatedResponse helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Hoist mocks
const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('@/lib/api/timeout', () => ({
  isTimeoutError: (err: unknown) => err instanceof Error && err.message.startsWith('Query timeout'),
}))

vi.mock('@/lib/session-timeout', () => ({
  checkSessionIdle: vi.fn().mockResolvedValue({ expired: false }),
  touchSession: vi.fn().mockResolvedValue(undefined),
}))

import {
  createApiHandler,
  jsonResponse,
  apiSuccess,
  apiError,
  paginatedResponse,
} from '@/lib/api/handler'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  method = 'GET',
  body?: unknown,
  headers?: Record<string, string>
): NextRequest {
  const init: any = { method, headers }
  if (body) {
    init.body = JSON.stringify(body)
    init.headers = { ...init.headers, 'Content-Type': 'application/json' }
  }
  return new NextRequest('http://localhost/api/test', init)
}

// ---------------------------------------------------------------------------
// createApiHandler — basic (no auth, no schema)
// ---------------------------------------------------------------------------

describe('createApiHandler — basic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls the handler and returns its response', async () => {
    const handler = createApiHandler(async () => {
      return NextResponse.json({ ok: true })
    })

    const res = await handler(makeRequest())
    const body = await res.json()
    expect(body).toEqual({ ok: true })
    expect(res.status).toBe(200)
  })

  it('passes route params to context', async () => {
    const handler = createApiHandler(async (ctx) => {
      return NextResponse.json({ id: ctx.params?.id })
    })

    const res = await handler(makeRequest(), { params: { id: '42' } })
    const body = await res.json()
    expect(body).toEqual({ id: '42' })
  })
})

// ---------------------------------------------------------------------------
// createApiHandler — body validation
// ---------------------------------------------------------------------------

describe('createApiHandler — body validation', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses and passes valid body to handler', async () => {
    const handler = createApiHandler(async (ctx) => NextResponse.json({ parsed: ctx.body }), {
      bodySchema: schema,
    })

    const res = await handler(makeRequest('POST', { name: 'Alice', age: 30 }))
    const body = await res.json()
    expect(body.parsed).toEqual({ name: 'Alice', age: 30 })
  })

  it('returns 400 for invalid body (Zod error)', async () => {
    const handler = createApiHandler(async () => NextResponse.json({ ok: true }), {
      bodySchema: schema,
    })

    const res = await handler(makeRequest('POST', { name: '', age: -1 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for non-JSON body', async () => {
    const handler = createApiHandler(async () => NextResponse.json({ ok: true }), {
      bodySchema: schema,
    })

    // NextRequest with no body — json() will throw
    const req = new NextRequest('http://localhost/api/test', { method: 'POST' })
    const res = await handler(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})

// ---------------------------------------------------------------------------
// createApiHandler — auth
// ---------------------------------------------------------------------------

describe('createApiHandler — requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const handler = createApiHandler(async () => NextResponse.json({ ok: true }), {
      requireAuth: true,
    })

    const res = await handler(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('AUTHENTICATION_ERROR')
  })

  it('passes user info to context when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })

    const handler = createApiHandler(async (ctx) => NextResponse.json({ userId: ctx.user?.id }), {
      requireAuth: true,
    })

    const res = await handler(makeRequest())
    const body = await res.json()
    expect(body.userId).toBe('u1')
  })

  it('sets email to empty string when user has no email', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u2', email: null } },
    })

    const handler = createApiHandler(async (ctx) => NextResponse.json({ email: ctx.user?.email }), {
      requireAuth: true,
    })

    const res = await handler(makeRequest())
    const body = await res.json()
    expect(body.email).toBe('')
  })
})

// ---------------------------------------------------------------------------
// createApiHandler — requireAttorney
// ---------------------------------------------------------------------------

describe('createApiHandler — requireAttorney', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when attorney profile is missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    })

    const handler = createApiHandler(async () => NextResponse.json({ ok: true }), {
      requireAttorney: true,
    })

    const res = await handler(makeRequest())
    expect(res.status).toBe(403)
  })

  it('adds attorney and artisan (backward compat) to context', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'att-1' } }),
        }),
      }),
    })

    const handler = createApiHandler(
      async (ctx) =>
        NextResponse.json({
          attorney: ctx.attorney,
          artisan: ctx.artisan,
        }),
      { requireAttorney: true }
    )

    const res = await handler(makeRequest())
    const body = await res.json()
    expect(body.attorney).toEqual({ attorney_id: 'att-1' })
    expect(body.artisan).toEqual({ attorney_id: 'att-1' })
  })
})

// ---------------------------------------------------------------------------
// createApiHandler — requireAdmin
// ---------------------------------------------------------------------------

describe('createApiHandler — requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when user is not admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    // Admin check: .from('profiles').select('id').eq('id', user.id).eq('is_admin', true).single()
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    })

    const handler = createApiHandler(async () => NextResponse.json({ ok: true }), {
      requireAdmin: true,
    })

    const res = await handler(makeRequest())
    expect(res.status).toBe(403)
  })

  it('succeeds when user is admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin1', email: 'admin@b.com' } },
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'admin1' } }),
          }),
        }),
      }),
    })

    const handler = createApiHandler(async () => NextResponse.json({ ok: true }), {
      requireAdmin: true,
    })

    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// createApiHandler — error handling
// ---------------------------------------------------------------------------

describe('createApiHandler — error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 504 for timeout errors', async () => {
    const handler = createApiHandler(async () => {
      throw new Error('Query timeout after 8000ms')
    })

    const res = await handler(makeRequest())
    expect(res.status).toBe(504)
    const body = await res.json()
    expect(body.error.code).toBe('GATEWAY_TIMEOUT')
  })

  it('returns 500 for unknown errors', async () => {
    const handler = createApiHandler(async () => {
      throw new Error('Something unexpected')
    })

    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns proper status code for AppError subclasses', async () => {
    const { NotFoundError } = await import('@/lib/errors')
    const handler = createApiHandler(async () => {
      throw new NotFoundError('Attorney')
    })

    const res = await handler(makeRequest())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('NOT_FOUND')
  })
})

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

describe('jsonResponse (deprecated)', () => {
  it('wraps data in { success: true, data }', async () => {
    const res = jsonResponse({ id: 1 })
    const body = await res.json()
    expect(body).toEqual({ success: true, data: { id: 1 } })
    expect(res.status).toBe(200)
  })

  it('accepts custom status code', async () => {
    const res = jsonResponse({ id: 1 }, 201)
    expect(res.status).toBe(201)
  })
})

describe('apiSuccess', () => {
  it('returns { success: true, data } with 200', async () => {
    const res = apiSuccess({ items: [] })
    const body = await res.json()
    expect(body).toEqual({ success: true, data: { items: [] } })
    expect(res.status).toBe(200)
  })

  it('accepts meta parameter', async () => {
    const res = apiSuccess({ id: 'new' }, { source: 'cache' })
    const body = await res.json()
    expect(body.meta).toEqual({ source: 'cache' })
    expect(res.status).toBe(200)
  })
})

describe('apiError', () => {
  it('returns { success: false, error } with given status', async () => {
    const res = apiError('NOT_FOUND', 'Not found', 404)
    const body = await res.json()
    expect(body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Not found' },
    })
    expect(res.status).toBe(404)
  })

  it('defaults to 400', async () => {
    const res = apiError('BAD', 'Bad request')
    expect(res.status).toBe(400)
  })
})

describe('paginatedResponse', () => {
  it('includes pagination metadata', async () => {
    const res = paginatedResponse([1, 2, 3], { page: 1, limit: 10, total: 25 })
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual([1, 2, 3])
    expect(body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasMore: true,
    })
  })

  it('hasMore is false on last page', async () => {
    const res = paginatedResponse([], { page: 3, limit: 10, total: 25 })
    const body = await res.json()
    expect(body.pagination.hasMore).toBe(false)
  })

  it('handles single page', async () => {
    const res = paginatedResponse([1], { page: 1, limit: 10, total: 1 })
    const body = await res.json()
    expect(body.pagination.totalPages).toBe(1)
    expect(body.pagination.hasMore).toBe(false)
  })
})
