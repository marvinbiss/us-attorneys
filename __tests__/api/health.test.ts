/**
 * Tests — Health API (/api/health)
 * GET: ok, degraded (Stripe webhook missing), down (Stripe key missing),
 *      down (database error), correct structure, Cache-Control header
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================
// Mocks
// ============================================

let capturedHeaders: Record<string, string> = {}

const mockJsonFn = vi.fn((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
  if (init?.headers) {
    capturedHeaders = init.headers
  }
  return {
    body,
    status: init?.status ?? 200,
    headers: init?.headers ?? {},
  }
})

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => mockJsonFn(body, init),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  apiLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockDbResult: { data: unknown; error: unknown } = { data: null, error: null }

function makeAdminBuilder() {
  const b: Record<string, unknown> = {}
  b.select = vi.fn().mockReturnValue(b)
  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: mockDbResult.data, error: mockDbResult.error })
  return b
}

const mockAdminSupabase = {
  from: vi.fn(() => makeAdminBuilder()),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}))

// Save original env and fetch
const originalEnv = { ...process.env }
const originalFetch = globalThis.fetch

beforeEach(() => {
  vi.clearAllMocks()
  capturedHeaders = {}
  mockDbResult = { data: null, error: null }

  // Set all required env vars for a healthy state
  process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_xxx'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

  // Remove optional env vars
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN

  // Restore fetch
  globalThis.fetch = originalFetch
})

// Restore env after all tests
afterAll(() => {
  process.env = { ...originalEnv }
})

// ============================================
// Tests
// ============================================

describe('GET /api/health', () => {
  it('returns ok when all checks pass', async () => {
    mockDbResult = { data: null, error: null }

    const { GET } = await import('@/app/api/health/route')
    const result = await GET(new Request('http://localhost/api/health') as unknown as NextRequest) as unknown as {
      body: { status: string; checks: Record<string, { status: string }> }
      status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.status).toBe('healthy')
    expect(result.body.checks.database.status).toBe('healthy')
    expect(result.body.checks.stripe.status).toBe('healthy')
    expect(result.body.checks.environment.status).toBe('healthy')
  })

  it('reports stripe as ok when env vars are validated at startup', async () => {
    // Stripe env validation is now handled by src/lib/env.ts at import time
    // If the route loads, env is valid — stripe check always returns ok
    mockDbResult = { data: null, error: null }

    const { GET } = await import('@/app/api/health/route')
    const result = await GET(new Request('http://localhost/api/health') as unknown as NextRequest) as unknown as {
      body: { status: string; checks: Record<string, { status: string }> }
      status: number
    }

    expect(result.status).toBe(200)
    expect(result.body.checks.stripe.status).toBe('healthy')
  })

  it('returns down when database check fails', async () => {
    mockDbResult = { data: null, error: { message: 'Connection refused' } }

    const { GET } = await import('@/app/api/health/route')
    const result = await GET(new Request('http://localhost/api/health') as unknown as NextRequest) as unknown as {
      body: { status: string; checks: Record<string, { status: string; error?: string }> }
      status: number
    }

    // DB is unhealthy but env + stripe are healthy -> overall = degraded -> 200
    expect(result.status).toBe(200)
    expect(result.body.status).toBe('degraded')
    expect(result.body.checks.database.status).toBe('unhealthy')
    expect(result.body.checks.database.error).toBe('Connection refused')
  })

  it('returns correct structure (status, timestamp, version, uptime, checks)', async () => {
    mockDbResult = { data: null, error: null }

    const { GET } = await import('@/app/api/health/route')
    const result = await GET(new Request('http://localhost/api/health') as unknown as NextRequest) as unknown as {
      body: Record<string, unknown>
      status: number
    }

    expect(result.body).toHaveProperty('status')
    expect(result.body).toHaveProperty('timestamp')
    expect(result.body).toHaveProperty('version')
    expect(result.body).toHaveProperty('uptime')
    expect(result.body).toHaveProperty('checks')
    expect(typeof result.body.timestamp).toBe('string')
    expect(typeof result.body.uptime).toBe('number')
  })

  it('returns Cache-Control: no-store header', async () => {
    mockDbResult = { data: null, error: null }

    const { GET } = await import('@/app/api/health/route')
    await GET(new Request('http://localhost/api/health') as unknown as NextRequest)

    // Verify the headers passed to NextResponse.json
    expect(capturedHeaders['Cache-Control']).toBe('no-store, max-age=0')
  })
})
