/**
 * Auth API Routes — Comprehensive Unit Tests
 *
 * Tests for:
 *   - POST /api/auth/signin       (8 tests)
 *   - POST /api/auth/signup       (7 tests)
 *   - POST /api/auth/reset-password (5 tests)
 *   - POST /api/auth/logout       (3 tests)
 *   - GET  /api/auth/me           (3 tests)
 *   - GET/POST /api/auth/2fa      (9 tests)
 *   - POST /api/auth/oauth        (5 tests)
 *
 * Total: 40 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (must be declared before imports that use them) ───────────

// Mock next/server
const mockJsonResponse = vi.fn().mockImplementation((body, init) => ({
  body,
  status: init?.status ?? 200,
  headers: init?.headers ?? {},
  cookies: { set: vi.fn() },
}))
vi.mock('next/server', () => ({
  NextResponse: {
    json: (...args: unknown[]) => mockJsonResponse(...args),
  },
  NextRequest: class {
    url: string
    method: string
    constructor(url: string, init?: { method?: string }) {
      this.url = url
      this.method = init?.method || 'GET'
    }
    json() { return Promise.resolve({}) }
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

// Mock Supabase SSR client (for signin)
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

// Mock Supabase JS client (for signup / reset-password / oauth)
const mockAdminCreateUser = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockInsert = vi.fn()
const mockSelectSingleSignup = vi.fn()
const mockSupabaseJS = {
  auth: {
    admin: { createUser: mockAdminCreateUser },
    resetPasswordForEmail: mockResetPasswordForEmail,
    signInWithOAuth: mockSignInWithOAuth,
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

// Mock Supabase server client (for logout + me + 2fa)
const mockSignOut = vi.fn()
const mockGetUser = vi.fn()
const mockServerFrom = vi.fn()
const mockSupabaseServer = {
  auth: {
    signOut: mockSignOut,
    getUser: mockGetUser,
  },
  from: mockServerFrom,
}
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabaseServer),
}))

// Mock Supabase admin client (for me route)
const mockAdminFrom = vi.fn()
const mockSupabaseAdmin = {
  from: mockAdminFrom,
}
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue(mockSupabaseAdmin),
}))

// Mock rate limiter
const mockRateLimit = vi.fn().mockResolvedValue({ success: true })
vi.mock('@/lib/rate-limiter', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
  RATE_LIMITS: { auth: { max: 5, windowMs: 60000 } },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  authLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock two-factor auth module
const mockTwoFactorAuth = {
  getStatus: vi.fn(),
  generateSetup: vi.fn(),
  verifyAndEnable: vi.fn(),
  verifyCode: vi.fn(),
  disable: vi.fn(),
  regenerateBackupCodes: vi.fn(),
}
vi.mock('@/lib/auth/two-factor', () => ({
  twoFactorAuth: mockTwoFactorAuth,
}))

// Mock API handler (for me route — pass through)
vi.mock('@/lib/api/handler', () => ({
  createApiHandler: vi.fn().mockImplementation((handler) => {
    return async (request: unknown) => handler({ request })
  }),
  apiSuccess: vi.fn().mockImplementation((data, status = 200) => mockJsonResponse({ success: true, data }, { status })),
  apiError: vi.fn().mockImplementation((code, message, status = 400) => mockJsonResponse({ success: false, error: { code, message } }, { status })),
  jsonResponse: vi.fn().mockImplementation((data, status = 200) => mockJsonResponse({ success: true, data }, { status })),
}))

// Mock errors module
vi.mock('@/lib/errors', () => ({
  AppError: class AppError extends Error {
    statusCode: number
    constructor(message: string, statusCode = 500) { super(message); this.statusCode = statusCode }
  },
  ValidationError: class extends Error { statusCode = 400 },
  AuthenticationError: class extends Error { statusCode = 401 },
  AuthorizationError: class extends Error { statusCode = 403 },
  NotFoundError: class extends Error { statusCode = 404 },
  RateLimitError: class extends Error { statusCode = 429 },
  ExternalServiceError: class extends Error { statusCode = 502 },
  ConflictError: class extends Error { statusCode = 409 },
  PaymentError: class extends Error { statusCode = 402 },
  isAppError: vi.fn().mockReturnValue(false),
  toAppError: vi.fn(),
  formatErrorResponse: vi.fn().mockImplementation((err) => ({
    success: false,
    error: { message: err instanceof Error ? err.message : 'Unknown error' },
  })),
}))

// ── Helpers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResponse = { body: any; status: number; headers?: any; cookies?: { set: ReturnType<typeof vi.fn> } }

function makeRequest(body: unknown, url = 'http://localhost/api/auth/test'): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(url = 'http://localhost/api/auth/test'): Request {
  return new Request(url, { method: 'GET' })
}

// ── Set env vars required by the routes ─────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://us-attorneys.com'

  // Reset rate limiter to success by default
  mockRateLimit.mockResolvedValue({ success: true })
})

// ═════════════════════════════════════════════════════════════════════
// SIGNIN
// ═════════════════════════════════════════════════════════════════════

describe('POST /api/auth/signin', () => {
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
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false, reset: Date.now() + 60000 })

    const res = await callSignin({ email: 'test@example.com', password: 'Password1' })

    expect(res.status).toBe(429)
    expect(res.body.error.message).toContain('Too many requests')
  })

  it('returns 401 on "Email not confirmed" error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed' },
    })

    const res = await callSignin({ email: 'unverified@example.com', password: 'Password1' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(res.body.error.message).toContain('confirm your email')
  })

  it('returns attorney role when profile role is attorney', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'att-1',
          email: 'attorney@example.com',
          user_metadata: { first_name: 'Jane', last_name: 'Smith' },
        },
        session: {
          access_token: 'at-456',
          refresh_token: 'rt-456',
          expires_at: 9999999999,
        },
      },
      error: null,
    })
    mockSelectSingle.mockResolvedValue({
      data: { role: 'attorney', full_name: 'Jane Smith' },
    })

    const res = await callSignin({ email: 'attorney@example.com', password: 'Password1' })

    expect(res.status).toBe(200)
    expect(res.body.data.user.role).toBe('attorney')
    expect(res.body.data.user.isAttorney).toBe(true)
    expect(res.body.data.user.userType).toBe('attorney')
  })

  it('handles unhandled auth errors with a generic message', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Some unexpected Supabase error' },
    })

    const res = await callSignin({ email: 'test@example.com', password: 'Password1' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    // Should not leak internal error details
    expect(res.body.error.message).not.toContain('Supabase')
  })

  it('lowercases email before authentication', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', user_metadata: {} },
        session: { access_token: 'at', refresh_token: 'rt', expires_at: 9999999999 },
      },
      error: null,
    })
    mockSelectSingle.mockResolvedValue({ data: { role: 'user', full_name: 'Test' } })

    await callSignin({ email: 'TEST@EXAMPLE.COM', password: 'Password1' })

    expect(mockSignInWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' })
    )
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
    mockSelectSingleSignup.mockResolvedValue({ data: null })
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: 'new-user-1' } },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })

    const res = await callSignup(validBody)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.requiresVerification).toBe(true)
  })

  it('returns 201 even for duplicate email (anti-enumeration)', async () => {
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

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false, reset: Date.now() + 60000 })

    const res = await callSignup(validBody)

    expect(res.status).toBe(429)
    expect(res.body.error.message).toContain('Too many requests')
  })

  it('returns 500 when auth creation fails', async () => {
    mockSelectSingleSignup.mockResolvedValue({ data: null })
    mockAdminCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth service error' },
    })

    const res = await callSignup(validBody)

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  it('still returns 201 even if profile insert fails', async () => {
    mockSelectSingleSignup.mockResolvedValue({ data: null })
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: 'new-user-2' } },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: { message: 'Profile insert error' } })

    const res = await callSignup(validBody)

    // Profile failure is non-fatal — user was created
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it('lowercases email before checking and creating', async () => {
    mockSelectSingleSignup.mockResolvedValue({ data: null })
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: 'new-user-3' } },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })

    await callSignup({ ...validBody, email: 'UPPER@EXAMPLE.COM' })

    expect(mockAdminCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'upper@example.com' })
    )
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
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'User not found' },
    })

    const res = await callReset({ email: 'unknown@example.com' })

    // Must still return 200 to prevent enumeration
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValueOnce({ success: false, reset: Date.now() + 60000 })

    const res = await callReset({ email: 'user@example.com' })

    expect(res.status).toBe(429)
    expect(res.body.error).toContain('Too many requests')
  })

  it('returns 400 when email field is missing entirely', async () => {
    const res = await callReset({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid email')
  })
})

// ═════════════════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout', () => {
  async function callLogout(): Promise<MockResponse> {
    const { POST } = await import('@/app/api/auth/logout/route')
    return POST() as unknown as MockResponse
  }

  it('returns success on successful logout', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const res = await callLogout()

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.message).toContain('Logout successful')
  })

  it('returns 500 when signOut fails', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } })

    const res = await callLogout()

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR')
  })

  it('returns 500 on unexpected exception', async () => {
    mockSignOut.mockRejectedValue(new Error('Network error'))

    const res = await callLogout()

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
  })
})

// ═════════════════════════════════════════════════════════════════════
// ME
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me', () => {
  async function callMe(): Promise<MockResponse> {
    const { GET } = await import('@/app/api/auth/me/route')
    return GET(makeGetRequest('http://localhost/api/auth/me') as never) as unknown as MockResponse
  }

  it('returns user profile for authenticated user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-me', email: 'me@example.com' } },
      error: null,
    })
    mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { full_name: 'Me User', email: 'me@example.com', role: 'attorney' },
          }),
        }),
      }),
    })

    const res = await callMe()

    expect(res.status).toBe(200)
    expect(res.body.data.user.id).toBe('user-me')
    expect(res.body.data.user.email).toBe('me@example.com')
    expect(res.body.data.user.fullName).toBe('Me User')
    expect(res.body.data.user.role).toBe('attorney')
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    })

    const res = await callMe()

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR')
  })

  it('uses fallback values when profile is missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-no-profile', email: 'nodata@example.com' } },
      error: null,
    })
    mockServerFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    })

    const res = await callMe()

    expect(res.status).toBe(200)
    expect(res.body.data.user.id).toBe('user-no-profile')
    expect(res.body.data.user.email).toBe('nodata@example.com')
    expect(res.body.data.user.fullName).toBe('')
    expect(res.body.data.user.role).toBe('client')
  })
})

// ═════════════════════════════════════════════════════════════════════
// 2FA
// ═════════════════════════════════════════════════════════════════════

describe('2FA /api/auth/2fa', () => {
  async function call2faGet(): Promise<MockResponse> {
    const { GET } = await import('@/app/api/auth/2fa/route')
    return GET() as unknown as MockResponse
  }

  async function call2faPost(body: unknown): Promise<MockResponse> {
    const { POST } = await import('@/app/api/auth/2fa/route')
    return POST(makeRequest(body, 'http://localhost/api/auth/2fa')) as unknown as MockResponse
  }

  describe('GET — status', () => {
    it('returns 2FA status for authenticated user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-2fa', email: 'test@test.com' } } })
      mockTwoFactorAuth.getStatus.mockResolvedValue({ enabled: true, method: 'totp' })

      const res = await call2faGet()

      expect(res.status).toBe(200)
      expect(res.body.status.enabled).toBe(true)
    })

    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const res = await call2faGet()

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST — setup', () => {
    it('returns QR code URL for setup action', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-2fa', email: 'test@test.com' } } })
      mockTwoFactorAuth.generateSetup.mockResolvedValue({
        qrCodeUrl: 'otpauth://totp/test',
        backupCodes: ['code1', 'code2'],
      })

      const res = await call2faPost({ action: 'setup' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.qrCodeUrl).toBe('otpauth://totp/test')
      expect(res.body.backupCodes).toHaveLength(2)
    })
  })

  describe('POST — verify', () => {
    it('returns success when code is valid', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-2fa', email: 'test@test.com' } } })
      mockTwoFactorAuth.verifyAndEnable.mockResolvedValue(true)

      const res = await call2faPost({ action: 'verify', code: '123456' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toContain('enabled')
    })

    it('returns failure when code is invalid', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-2fa', email: 'test@test.com' } } })
      mockTwoFactorAuth.verifyAndEnable.mockResolvedValue(false)

      const res = await call2faPost({ action: 'verify', code: '000000' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Invalid')
    })

    it('returns 400 when code is too short', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-2fa', email: 'test@test.com' } } })

      const res = await call2faPost({ action: 'verify', code: '12' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST — verify_login', () => {
    it('returns success when login code is valid', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-2fa', email: 'test@test.com' } } })
      mockTwoFactorAuth.verifyCode.mockResolvedValue(true)

      const res = await call2faPost({ action: 'verify_login', code: '123456' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('returns 401 when login code is invalid', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-2fa', email: 'test@test.com' } } })
      mockTwoFactorAuth.verifyCode.mockResolvedValue(false)

      const res = await call2faPost({ action: 'verify_login', code: '000000' })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST — rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: false, reset: Date.now() + 60000 })

      const res = await call2faPost({ action: 'verify', code: '123456' })

      expect(res.status).toBe(429)
      expect(res.body.success).toBe(false)
    })
  })
})

// ═════════════════════════════════════════════════════════════════════
// OAUTH
// ═════════════════════════════════════════════════════════════════════

describe('POST /api/auth/oauth', () => {
  async function callOAuth(body: unknown): Promise<MockResponse> {
    const { POST } = await import('@/app/api/auth/oauth/route')
    // OAuth uses NextRequest
    const req = makeRequest(body, 'http://localhost/api/auth/oauth')
    return POST(req as never) as unknown as MockResponse
  }

  it('returns OAuth URL for valid Google provider', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth?...' },
      error: null,
    })

    const res = await callOAuth({ provider: 'google' })

    expect(res.status).toBe(200)
    expect(res.body.url).toContain('google.com')
  })

  it('returns 400 for invalid provider', async () => {
    const res = await callOAuth({ provider: 'github' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid provider')
  })

  it('returns 400 when Supabase OAuth returns error', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: 'Provider not enabled' },
    })

    const res = await callOAuth({ provider: 'google' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Provider not enabled')
  })

  it('passes redirect URL with next parameter', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth' },
      error: null,
    })

    await callOAuth({ provider: 'google', next: '/attorney-dashboard' })

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('next='),
        }),
      })
    )
  })

  it('returns 400 when provider field is missing', async () => {
    const res = await callOAuth({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid provider')
  })
})
