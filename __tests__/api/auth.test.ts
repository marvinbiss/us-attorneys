/**
 * Auth API Routes — Unit Tests
 *
 * Tests for:
 *   - POST /api/auth/signin
 *   - POST /api/auth/signup
 *   - POST /api/auth/reset-password
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (must be declared before imports that use them) ───────────

// Mock next/server
const mockJsonResponse = vi.fn().mockImplementation((body, init) => ({
  body,
  status: init?.status ?? 200,
  cookies: { set: vi.fn() },
}))
vi.mock('next/server', () => ({
  NextResponse: {
    json: (...args: unknown[]) => mockJsonResponse(...args),
  },
}))

// Mock next/headers (cookies)
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}))

// Mock Supabase SSR client
const mockSignInWithPassword = vi.fn()
const mockSelectSingle = vi.fn()
const mockSupabaseSSR = {
  auth: { signInWithPassword: mockSignInWithPassword },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSelectSingle,
      }),
    }),
  }),
}
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue(mockSupabaseSSR),
}))

// Mock Supabase JS client (for signup / reset-password)
const mockAdminCreateUser = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockInsert = vi.fn()
const mockSelectSingleSignup = vi.fn()
const mockSupabaseJS = {
  auth: {
    admin: { createUser: mockAdminCreateUser },
    resetPasswordForEmail: mockResetPasswordForEmail,
  },
  from: vi.fn().mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSelectSingleSignup,
      }),
    }),
    insert: mockInsert,
  })),
}
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabaseJS),
}))

// Mock rate limiter
vi.mock('@/lib/rate-limiter', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: { auth: { max: 10, windowMs: 60000 } },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  authLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ── Helpers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResponse = { body: any; status: number; cookies?: { set: ReturnType<typeof vi.fn> } }

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Set env vars required by the routes ─────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://us-attorneys.com'
})

// ═════════════════════════════════════════════════════════════════════
// SIGNIN
// ═════════════════════════════════════════════════════════════════════

describe('POST /api/auth/signin', () => {
  // We need a dynamic import so module-level env vars are captured after our mocks
  async function callSignin(body: unknown): Promise<MockResponse> {
    const { POST } = await import('@/app/api/auth/signin/route')
    return POST(makeRequest(body)) as unknown as MockResponse
  }

  it('returns 200 with user data on valid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { first_name: 'John', last_name: 'Doe' },
        },
        session: {
          access_token: 'at-123',
          refresh_token: 'rt-123',
          expires_at: 9999999999,
        },
      },
      error: null,
    })
    mockSelectSingle.mockResolvedValue({
      data: { role: 'user', full_name: 'John Doe' },
    })

    const res = await callSignin({ email: 'test@example.com', password: 'Password1' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.email).toBe('test@example.com')
    // Refresh token must NOT be in the JSON body (security)
    expect(res.body.data.session.refreshToken).toBeUndefined()
  })

  it('returns 401 on invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const res = await callSignin({ email: 'bad@example.com', password: 'WrongPass1' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 on missing fields', async () => {
    const res = await callSignin({ email: '' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe(2001) // VALIDATION_ERROR
  })

  it('returns 429 when rate limited', async () => {
    const { rateLimit } = await import('@/lib/rate-limiter')
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false } as never)

    const res = await callSignin({ email: 'test@example.com', password: 'Password1' })

    expect(res.status).toBe(429)
    expect(res.body.error).toBe('Too many requests')
  })
})

// ═════════════════════════════════════════════════════════════════════
// SIGNUP
// ═════════════════════════════════════════════════════════════════════

describe('POST /api/auth/signup', () => {
  async function callSignup(body: unknown): Promise<MockResponse> {
    const { POST } = await import('@/app/api/auth/signup/route')
    return POST(makeRequest(body)) as unknown as MockResponse
  }

  const validBody = {
    email: 'new@example.com',
    password: 'StrongPass1',
    confirmPassword: 'StrongPass1',
    firstName: 'Jane',
    lastName: 'Doe',
    acceptTerms: true,
  }

  it('returns 201 on valid signup', async () => {
    // No existing user
    mockSelectSingleSignup.mockResolvedValue({ data: null })
    // Auth create succeeds
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: 'new-user-1' } },
      error: null,
    })
    // Profile insert succeeds
    mockInsert.mockResolvedValue({ error: null })

    const res = await callSignup(validBody)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.requiresVerification).toBe(true)
  })

  it('returns 201 even for duplicate email (anti-enumeration)', async () => {
    // Existing user found
    mockSelectSingleSignup.mockResolvedValue({ data: { id: 'existing-1' } })

    const res = await callSignup(validBody)

    // Must be the same 201 status to prevent email enumeration
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.requiresVerification).toBe(true)
  })

  it('returns 400 on missing fields', async () => {
    const res = await callSignup({ email: 'bad' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═════════════════════════════════════════════════════════════════════

describe('POST /api/auth/reset-password', () => {
  async function callReset(body: unknown): Promise<MockResponse> {
    const { POST } = await import('@/app/api/auth/reset-password/route')
    return POST(makeRequest(body)) as unknown as MockResponse
  }

  it('returns success for a valid email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    const res = await callReset({ email: 'user@example.com' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toContain('reset link')
  })

  it('returns 400 for missing/invalid email', async () => {
    const res = await callReset({ email: 'not-an-email' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid email')
  })

  it('always returns success even when email does not exist (anti-enumeration)', async () => {
    // Supabase returns an error for unknown email but we suppress it
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'User not found' },
    })

    const res = await callReset({ email: 'unknown@example.com' })

    // Must still return 200 to prevent enumeration
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
