/**
 * Tests — GET/PUT /api/attorney/profile
 * Auth guard, profile fetch, profile update, validation, timeout handling, revalidation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireAttorney = vi.fn()
vi.mock('@/lib/auth/attorney-guard', () => ({
  requireAttorney: () => mockRequireAttorney(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const mockRevalidatePath = vi.fn()
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

vi.mock('@/lib/utils', () => ({
  slugify: (s: string) => s.toLowerCase().replace(/\s+/g, '-'),
}))

// Mock withTimeout to just resolve the promise directly
vi.mock('@/lib/api/timeout', () => ({
  withTimeout: <T>(promise: PromiseLike<T>) => Promise.resolve(promise),
  isTimeoutError: (e: unknown) => e instanceof Error && e.message.startsWith('Query timeout'),
  TIMEOUTS: { DEFAULT: 8000, PAYMENT: 15000, CRON: 30000 },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = { id: 'user-123', email: 'attorney@example.com' }

// Build chainable supabase mock
function makeChainBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn().mockReturnValue(builder)
  builder.insert = vi.fn().mockReturnValue(builder)
  builder.update = vi.fn().mockReturnValue(builder)
  builder.eq = vi.fn().mockReturnValue(builder)
  builder.single = vi.fn().mockResolvedValue(result)
  // For queries that resolve the full chain
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return builder
}

function makeSupabaseMock(fromImpl: (table: string) => unknown) {
  return {
    from: vi.fn().mockImplementation(fromImpl),
    auth: { getUser: vi.fn() },
  }
}

function setupAuthSuccess(fromImpl: (table: string) => unknown) {
  const supabase = makeSupabaseMock(fromImpl)
  mockRequireAttorney.mockResolvedValue({
    error: null,
    user: mockUser,
    supabase,
  })
  return supabase
}

function setupAuthFailure(status: number, message: string) {
  const { NextResponse } = require('next/server')
  mockRequireAttorney.mockResolvedValue({
    error: NextResponse.json({ error: message }, { status }),
    user: null,
    supabase: {},
  })
}

function makeGetRequest(): Request {
  return new Request('http://localhost/api/attorney/profile', { method: 'GET' })
}

function makePutRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/attorney/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// GET — Authentication
// ---------------------------------------------------------------------------
describe('GET /api/attorney/profile — Auth', () => {
  it('returns 401 when user is not authenticated', async () => {
    setupAuthFailure(401, 'Not authenticated')

    const { GET } = await import('@/app/api/attorney/profile/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Not authenticated')
  })

  it('returns 403 when user is not an attorney', async () => {
    setupAuthFailure(403, 'Access reserved for attorneys')

    const { GET } = await import('@/app/api/attorney/profile/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Access reserved for attorneys')
  })
})

// ---------------------------------------------------------------------------
// GET — Successful fetch
// ---------------------------------------------------------------------------
describe('GET /api/attorney/profile — Success', () => {
  it('returns profile and provider data', async () => {
    const profileData = {
      id: 'user-123',
      email: 'attorney@example.com',
      full_name: 'Jane Doe',
      role: 'attorney',
      average_rating: 4.5,
      review_count: 10,
    }
    const providerData = {
      id: 'atty-1',
      name: 'Jane Doe Law',
      slug: 'jane-doe-law',
      bar_number: '12345',
      phone: '2125551234',
      address_line1: '123 Main St',
      address_city: 'Houston',
      address_zip: '77001',
      address_state: 'TX',
      specialty: 'Personal Injury',
      rating_average: 4.5,
      review_count: 10,
      is_verified: true,
      is_active: true,
    }

    setupAuthSuccess((table: string) => {
      if (table === 'profiles') {
        return makeChainBuilder({ data: profileData, error: null })
      }
      return makeChainBuilder({ data: providerData, error: null })
    })

    const { GET } = await import('@/app/api/attorney/profile/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile).toEqual(profileData)
    expect(body.data.provider).toEqual(providerData)
  })

  it('returns profile even when provider data is null', async () => {
    const profileData = {
      id: 'user-123',
      email: 'attorney@example.com',
      full_name: 'Jane Doe',
      role: 'attorney',
      average_rating: null,
      review_count: 0,
    }

    setupAuthSuccess((table: string) => {
      if (table === 'profiles') {
        return makeChainBuilder({ data: profileData, error: null })
      }
      return makeChainBuilder({ data: null, error: null })
    })

    const { GET } = await import('@/app/api/attorney/profile/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile).toEqual(profileData)
    expect(body.data.provider).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// GET — Database error
// ---------------------------------------------------------------------------
describe('GET /api/attorney/profile — DB error', () => {
  it('returns 500 when profile query fails', async () => {
    setupAuthSuccess(() =>
      makeChainBuilder({ data: null, error: { message: 'DB connection error' } })
    )

    const { GET } = await import('@/app/api/attorney/profile/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Error retrieving profile')
  })
})

// ---------------------------------------------------------------------------
// GET — Timeout
// ---------------------------------------------------------------------------
describe('GET /api/attorney/profile — Timeout', () => {
  it('returns 504 on query timeout', async () => {
    const supabase = makeSupabaseMock(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Query timeout after 8000ms')),
        }),
      }),
    }))
    mockRequireAttorney.mockResolvedValue({
      error: null,
      user: mockUser,
      supabase,
    })

    // Need to re-mock withTimeout to actually call the promise
    // The issue is withTimeout wraps the promise. Let's make it throw the timeout.
    const { GET } = await import('@/app/api/attorney/profile/route')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(504)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('timed out')
  })
})

// ---------------------------------------------------------------------------
// PUT — Authentication
// ---------------------------------------------------------------------------
describe('PUT /api/attorney/profile — Auth', () => {
  it('returns 401 when user is not authenticated', async () => {
    setupAuthFailure(401, 'Not authenticated')

    const { PUT } = await import('@/app/api/attorney/profile/route')
    const res = await PUT(makePutRequest({ full_name: 'New Name' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Not authenticated')
  })
})

// ---------------------------------------------------------------------------
// PUT — Validation
// ---------------------------------------------------------------------------
describe('PUT /api/attorney/profile — Validation', () => {
  it('returns 400 for invalid fields (name too long)', async () => {
    setupAuthSuccess(() => makeChainBuilder({ data: null, error: null }))

    const { PUT } = await import('@/app/api/attorney/profile/route')
    const res = await PUT(makePutRequest({ full_name: 'x'.repeat(200) }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Validation error')
  })

  it('returns 400 for invalid bar_number (too long)', async () => {
    setupAuthSuccess(() => makeChainBuilder({ data: null, error: null }))

    const { PUT } = await import('@/app/api/attorney/profile/route')
    const res = await PUT(makePutRequest({ bar_number: '1'.repeat(25) }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PUT — Successful update (profiles only)
// ---------------------------------------------------------------------------
describe('PUT /api/attorney/profile — Profile update', () => {
  it('updates profiles table when full_name is provided', async () => {
    const updatedProfile = {
      id: 'user-123',
      email: 'attorney@example.com',
      full_name: 'Jane Updated',
      role: 'attorney',
      average_rating: 4.5,
      review_count: 10,
    }

    setupAuthSuccess((table: string) => {
      if (table === 'profiles') {
        return makeChainBuilder({ data: updatedProfile, error: null })
      }
      return makeChainBuilder({ data: null, error: null })
    })

    const { PUT } = await import('@/app/api/attorney/profile/route')
    const res = await PUT(makePutRequest({ full_name: 'Jane Updated' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.profile.full_name).toBe('Jane Updated')
    expect(body.data.message).toBe('Profile updated successfully')
  })
})

// ---------------------------------------------------------------------------
// PUT — Successful update (provider/attorneys table)
// ---------------------------------------------------------------------------
describe('PUT /api/attorney/profile — Provider update', () => {
  it('updates attorneys table when provider fields are provided', async () => {
    const updatedProvider = {
      id: 'atty-1',
      name: 'Updated Law Firm',
      slug: 'updated-law-firm',
      bar_number: '99999',
      phone: '2125559999',
      address_line1: '456 Oak Ave',
      address_city: 'Dallas',
      address_zip: '75001',
      specialty: 'Family Law',
      stable_id: 'stable-1',
      is_verified: true,
      is_active: true,
    }

    setupAuthSuccess((table: string) => {
      if (table === 'attorneys') {
        return makeChainBuilder({ data: updatedProvider, error: null })
      }
      return makeChainBuilder({ data: null, error: null })
    })

    const { PUT } = await import('@/app/api/attorney/profile/route')
    const res = await PUT(makePutRequest({
      name: 'Updated Law Firm',
      bar_number: '99999',
      phone: '2125559999',
      address_line1: '456 Oak Ave',
      address_city: 'Dallas',
      address_zip: '75001',
      specialty: 'Family Law',
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.provider.name).toBe('Updated Law Firm')
  })

  it('triggers revalidation after provider update', async () => {
    const updatedProvider = {
      id: 'atty-1',
      name: 'Test Firm',
      slug: 'test-firm',
      bar_number: '11111',
      phone: '2125551111',
      address_line1: '789 Elm St',
      address_city: 'Austin',
      address_zip: '73301',
      specialty: 'Criminal Defense',
      stable_id: 'stable-2',
      is_verified: true,
      is_active: true,
    }

    setupAuthSuccess((table: string) => {
      if (table === 'attorneys') {
        return makeChainBuilder({ data: updatedProvider, error: null })
      }
      return makeChainBuilder({ data: null, error: null })
    })

    const { PUT } = await import('@/app/api/attorney/profile/route')
    await PUT(makePutRequest({ name: 'Test Firm', specialty: 'Criminal Defense', address_city: 'Austin' }))

    expect(mockRevalidatePath).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// PUT — DB error on update
// ---------------------------------------------------------------------------
describe('PUT /api/attorney/profile — DB error', () => {
  it('returns 500 when profile update fails', async () => {
    setupAuthSuccess(() =>
      makeChainBuilder({ data: null, error: { message: 'Update failed' } })
    )

    const { PUT } = await import('@/app/api/attorney/profile/route')
    const res = await PUT(makePutRequest({ full_name: 'Test' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Error updating profile')
  })

  it('returns 500 when attorney update fails', async () => {
    setupAuthSuccess((table: string) => {
      if (table === 'attorneys') {
        return makeChainBuilder({ data: null, error: { message: 'Attorney update failed' } })
      }
      // profiles table not touched since we're only updating provider fields
      return makeChainBuilder({ data: null, error: null })
    })

    const { PUT } = await import('@/app/api/attorney/profile/route')
    const res = await PUT(makePutRequest({ name: 'New Name' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Error updating attorney profile')
  })
})

// ---------------------------------------------------------------------------
// PUT — Revalidation failure is non-blocking
// ---------------------------------------------------------------------------
describe('PUT — Revalidation failure', () => {
  it('still returns 200 even if revalidation throws', async () => {
    const updatedProvider = {
      id: 'atty-1',
      name: 'Test',
      slug: 'test',
      bar_number: '11111',
      phone: '555',
      address_line1: '1 st',
      address_city: 'NYC',
      address_zip: '10001',
      specialty: 'Tax Law',
      stable_id: 'stab',
      is_verified: true,
      is_active: true,
    }

    setupAuthSuccess((table: string) => {
      if (table === 'attorneys') {
        return makeChainBuilder({ data: updatedProvider, error: null })
      }
      return makeChainBuilder({ data: null, error: null })
    })

    mockRevalidatePath.mockImplementation(() => { throw new Error('Revalidation error') })

    const { PUT } = await import('@/app/api/attorney/profile/route')
    const res = await PUT(makePutRequest({ name: 'Test', specialty: 'Tax Law' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})
