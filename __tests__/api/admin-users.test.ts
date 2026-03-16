/**
 * Tests — Admin Users API (/api/admin/users)
 * Covers: GET (list/filter/search users), POST (create user),
 *         auth checks, validation, error handling, profile merging
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================
// Mock setup — must come before route imports
// ============================================

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000'

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

// --- Supabase mock ---
let mockListUsersResult: { data: { users: Array<Record<string, unknown>> }; error: unknown }
let mockProfilesResult: { data: Array<Record<string, unknown>> | null; error: unknown }
let mockCreateUserResult: { data: { user: Record<string, unknown> | null }; error: unknown }
let mockUpsertResult: { data: unknown; error: unknown }
let mockAdminClientThrows = false

function createProfilesQueryBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
  }
  // Make builder thenable — resolves to mockProfilesResult
  ;(builder as Record<string, unknown>).then = (
    resolve: (v: unknown) => unknown,
  ) => {
    return resolve({
      data: mockProfilesResult.data,
      error: mockProfilesResult.error,
    })
  }
  return builder
}

function createUpsertBuilder(): Record<string, unknown> {
  const builder: Record<string, unknown> = {}
  ;(builder as Record<string, unknown>).then = (
    resolve: (v: unknown) => unknown,
  ) => {
    return resolve({
      data: mockUpsertResult.data,
      error: mockUpsertResult.error,
    })
  }
  return builder
}

const mockFromFn = vi.fn((_table: string) => {
  return {
    select: vi.fn().mockReturnValue(createProfilesQueryBuilder()),
    upsert: vi.fn().mockReturnValue(createUpsertBuilder()),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    if (mockAdminClientThrows) {
      throw new Error('Connection refused')
    }
    return {
      from: (...args: unknown[]) => mockFromFn(...args as [string]),
      auth: {
        admin: {
          listUsers: () => Promise.resolve(mockListUsersResult),
          createUser: () => Promise.resolve(mockCreateUserResult),
        },
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

const mockLogAdminAction = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/admin-auth', () => ({
  requirePermission: vi.fn(() => Promise.resolve(mockAuthResult)),
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}))

// ============================================
// Helpers
// ============================================

function makeAuthUser(overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? 'user-1',
    email: overrides.email ?? 'user1@test.com',
    email_confirmed_at: overrides.email_confirmed_at ?? '2026-01-01T00:00:00Z',
    created_at: overrides.created_at ?? '2026-01-01T00:00:00Z',
    last_sign_in_at: overrides.last_sign_in_at ?? '2026-02-10T00:00:00Z',
    banned_until: overrides.banned_until ?? null,
    user_metadata: overrides.user_metadata ?? {},
    ...overrides,
  }
}

function makeRequest(params: Record<string, string> = {}): { nextUrl: { searchParams: URLSearchParams } } {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, value)
  }
  return { nextUrl: { searchParams } }
}

function makePostRequest(body: Record<string, unknown>): { nextUrl: { searchParams: URLSearchParams }; json: () => Promise<Record<string, unknown>> } {
  return {
    nextUrl: { searchParams: new URLSearchParams() },
    json: () => Promise.resolve(body),
  }
}

function setAuthSuccess() {
  mockAuthResult = {
    success: true,
    admin: {
      id: ADMIN_ID,
      email: 'admin@test.com',
      role: 'super_admin',
      permissions: { users: { read: true, write: true } },
    },
  }
}

function setAuthFailure() {
  mockAuthResult = {
    success: false,
    error: mockJsonFn({ success: false, error: { message: 'Unauthorized' } }, { status: 401 }),
  }
}

function setDefaultListUsersData() {
  mockListUsersResult = {
    data: {
      users: [
        makeAuthUser({ id: 'u1', email: 'alice@test.com', user_metadata: { full_name: 'Alice Johnson' } }),
        makeAuthUser({ id: 'u2', email: 'bob@test.com', user_metadata: { is_artisan: true, name: 'Bob Williams' } }),
        makeAuthUser({ id: 'u3', email: 'charlie@test.com', banned_until: '2027-01-01T00:00:00Z' }),
      ],
    },
    error: null,
  }

  mockProfilesResult = {
    data: [
      { id: 'u1', full_name: 'Alice Johnson (profile)', phone_e164: '2125551234', role: 'client' },
      { id: 'u2', full_name: 'Bob Williams (profile)', phone_e164: '3105559876', role: 'artisan' },
    ],
    error: null,
  }
}

// ============================================
// Tests — GET /api/admin/users
// ============================================

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mockAdminClientThrows = false
    setAuthSuccess()
    setDefaultListUsersData()
  })

  it('returns 401 when not authenticated', async () => {
    setAuthFailure()

    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest() as never)

    expect(result).toEqual(expect.objectContaining({ status: 401 }))
  })

  it('returns users on success', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest() as never) as unknown as { body: { success: boolean; users: unknown[]; total: number; page: number; totalPages: number } }

    expect(result.body.success).toBe(true)
    expect(result.body.users).toHaveLength(3)
    expect(result.body.total).toBe(3)
    expect(result.body.page).toBe(1)
    expect(result.body.totalPages).toBe(1)
  })

  it('merges profile data with auth data', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest() as never) as unknown as { body: { users: Array<Record<string, unknown>> } }

    const alice = result.body.users.find((u: Record<string, unknown>) => u.id === 'u1')
    // Profile full_name takes priority over user_metadata
    expect(alice?.full_name).toBe('Alice Johnson (profile)')
    expect(alice?.phone).toBe('2125551234')
    expect(alice?.user_type).toBe('client')
  })

  it('handles missing profiles gracefully', async () => {
    mockProfilesResult = { data: null, error: null }

    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest() as never) as unknown as { body: { success: boolean; users: Array<Record<string, unknown>> } }

    expect(result.body.success).toBe(true)
    expect(result.body.users).toHaveLength(3)

    // Falls back to user_metadata
    const alice = result.body.users.find((u: Record<string, unknown>) => u.id === 'u1')
    expect(alice?.full_name).toBe('Alice Johnson')
  })

  it('filters by clients', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest({ filter: 'clients' }) as never) as unknown as { body: { users: Array<Record<string, unknown>> } }

    // u1 is client, u3 has no profile so defaults to client
    const ids = result.body.users.map((u: Record<string, unknown>) => u.id)
    expect(ids).toContain('u1')
    expect(ids).toContain('u3')
    expect(ids).not.toContain('u2')
  })

  it('filters by artisans', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest({ filter: 'artisans' }) as never) as unknown as { body: { users: Array<Record<string, unknown>> } }

    // u2 has user_type artisan from profile
    expect(result.body.users).toHaveLength(1)
    expect(result.body.users[0].id).toBe('u2')
  })

  it('filters by banned', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest({ filter: 'banned' }) as never) as unknown as { body: { users: Array<Record<string, unknown>> } }

    // u3 has banned_until set
    expect(result.body.users).toHaveLength(1)
    expect(result.body.users[0].id).toBe('u3')
  })

  it('applies search by email', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest({ search: 'alice' }) as never) as unknown as { body: { users: Array<Record<string, unknown>> } }

    expect(result.body.users).toHaveLength(1)
    expect(result.body.users[0].email).toBe('alice@test.com')
  })

  it('returns 400 on invalid params', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest({ page: '-1', limit: '0' }) as never) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 502 on auth.admin.listUsers error', async () => {
    mockListUsersResult = {
      data: { users: [] },
      error: { message: 'Service unavailable' },
    }

    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest() as never) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(502)
    expect(result.body.success).toBe(false)
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Auth users list failed',
      expect.objectContaining({ message: 'Service unavailable' })
    )
  })

  it('returns 500 on unexpected error', async () => {
    mockAdminClientThrows = true

    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest() as never) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
  })

  it('transforms user data correctly', async () => {
    const { GET } = await import('@/app/api/admin/users/route')
    const result = await GET(makeRequest() as never) as unknown as { body: { users: Array<Record<string, unknown>> } }

    const bob = result.body.users.find((u: Record<string, unknown>) => u.id === 'u2')
    expect(bob).toEqual(expect.objectContaining({
      id: 'u2',
      email: 'bob@test.com',
      full_name: 'Bob Williams (profile)',
      phone: '3105559876',
      user_type: 'attorney',
      is_verified: true,
      is_banned: false,
      created_at: '2026-01-01T00:00:00Z',
      last_sign_in_at: '2026-02-10T00:00:00Z',
    }))

    const charlie = result.body.users.find((u: Record<string, unknown>) => u.id === 'u3')
    expect(charlie?.is_banned).toBe(true)
    expect(charlie?.is_verified).toBe(true)
    // u3 has no profile, falls back: user_metadata has no is_artisan => 'client'
    expect(charlie?.user_type).toBe('client')
    expect(charlie?.subscription_plan).toBe('free')
  })
})

// ============================================
// Tests — POST /api/admin/users
// ============================================

describe('POST /api/admin/users', () => {
  const validBody = {
    email: 'newuser@test.com',
    password: 'securePass123',
    full_name: 'New User',
    phone: '2125559999',
    user_type: 'client' as const,
  }

  const createdUser = {
    id: 'new-user-id',
    email: 'newuser@test.com',
    user_metadata: {
      full_name: 'New User',
      phone: '2125559999',
      is_artisan: false,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mockAdminClientThrows = false
    setAuthSuccess()

    mockCreateUserResult = {
      data: { user: createdUser },
      error: null,
    }

    mockUpsertResult = { data: null, error: null }
  })

  it('returns 401 when not authenticated', async () => {
    setAuthFailure()

    const { POST } = await import('@/app/api/admin/users/route')
    const result = await POST(makePostRequest(validBody) as never)

    expect(result).toEqual(expect.objectContaining({ status: 401 }))
  })

  it('creates user successfully', async () => {
    const { POST } = await import('@/app/api/admin/users/route')
    const result = await POST(makePostRequest(validBody) as never) as unknown as { body: { success: boolean; user: Record<string, unknown>; message: string }; status: number }

    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
    expect(result.body.user).toEqual(createdUser)
    expect(result.body.message).toBe('User created successfully')
  })

  it('returns 400 on validation error - missing email', async () => {
    const { POST } = await import('@/app/api/admin/users/route')
    const result = await POST(makePostRequest({ password: 'securePass123' }) as never) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect(result.body.error).toEqual(expect.objectContaining({ message: 'Validation error' }))
  })

  it('returns 400 on validation error - short password', async () => {
    const { POST } = await import('@/app/api/admin/users/route')
    const result = await POST(makePostRequest({ email: 'test@test.com', password: 'short' }) as never) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
  })

  it('returns 400 on auth creation error', async () => {
    mockCreateUserResult = {
      data: { user: null },
      error: { message: 'User already registered' },
    }

    const { POST } = await import('@/app/api/admin/users/route')
    const result = await POST(makePostRequest(validBody) as never) as unknown as { body: { success: boolean; error: { message: string } }; status: number }

    expect(result.status).toBe(400)
    expect(result.body.success).toBe(false)
    expect(result.body.error.message).toBe('User already registered')
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Auth creation error',
      expect.objectContaining({ message: 'User already registered' })
    )
  })

  it('upserts profile after creation', async () => {
    const { POST } = await import('@/app/api/admin/users/route')
    await POST(makePostRequest(validBody) as never)

    expect(mockFromFn).toHaveBeenCalledWith('profiles')
  })

  it('logs admin action after user creation', async () => {
    const { POST } = await import('@/app/api/admin/users/route')
    await POST(makePostRequest(validBody) as never)

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_ID,
      'user.create',
      'user',
      'new-user-id',
      { email: 'newuser@test.com', user_type: 'client' }
    )
  })

  it('sets is_artisan metadata for artisan type', async () => {
    const artisanUser = {
      id: 'artisan-id',
      email: 'artisan@test.com',
      user_metadata: {
        full_name: 'John Attorney',
        phone: '3105558888',
        is_artisan: true,
      },
    }
    mockCreateUserResult = {
      data: { user: artisanUser },
      error: null,
    }

    const { POST } = await import('@/app/api/admin/users/route')
    const result = await POST(makePostRequest({
      ...validBody,
      email: 'artisan@test.com',
      full_name: 'John Attorney',
      user_type: 'attorney',
    }) as never) as unknown as { body: { success: boolean; user: Record<string, unknown> } }

    expect(result.body.success).toBe(true)
    expect(result.body.user).toEqual(artisanUser)
    // The logAdminAction should record user_type: 'attorney'
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      ADMIN_ID,
      'user.create',
      'user',
      'artisan-id',
      expect.objectContaining({ user_type: 'attorney' })
    )
  })

  it('returns 500 on unexpected error', async () => {
    mockAdminClientThrows = true

    const { POST } = await import('@/app/api/admin/users/route')
    const result = await POST(makePostRequest(validBody) as never) as unknown as { body: Record<string, unknown>; status: number }

    expect(result.status).toBe(500)
    expect(result.body.success).toBe(false)
  })
})
