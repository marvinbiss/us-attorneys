/**
 * Cron Routes — Integration Tests
 *
 * Verifies auth (Bearer token) + basic flow for the 3 most critical crons:
 *   - GET /api/cron/send-reminders
 *   - GET /api/cron/recalculate-quality
 *   - GET /api/cron/sitemap-health
 *
 * All tests mock Supabase/Redis/fetch but exercise the real route handler code.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Shared constants ────────────────────────────────────────────────

const CRON_SECRET = 'test-cron-secret-abc123'

// ── Mock next/server ────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

// ── Mock logger ─────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ── Mock Supabase clients ───────────────────────────────────────────

const mockFrom = vi.fn()
const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    signInWithPassword: vi.fn(),
    admin: { createUser: vi.fn() },
    resetPasswordForEmail: vi.fn(),
  },
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabaseClient),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue(mockSupabaseClient),
}))

// ── Mock notification service (for send-reminders) ──────────────────

vi.mock('@/lib/notifications/unified-notification-service', () => ({
  getNotificationService: vi.fn().mockReturnValue({
    sendBatch: vi.fn().mockResolvedValue({ succeeded: 0, failed: 0 }),
  }),
}))

// ── Mock SEO config (for sitemap-health) ────────────────────────────

vi.mock('@/lib/seo/config', () => ({
  SITE_URL: 'https://us-attorneys.com',
}))

// ── Helpers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResponse = { body: any; status: number }

function makeCronRequest(withAuth: boolean): Request {
  const headers: Record<string, string> = {}
  if (withAuth) {
    headers['authorization'] = `Bearer ${CRON_SECRET}`
  }
  return new Request('http://localhost/api/cron/test', {
    method: 'GET',
    headers,
  })
}

// ── Setup / Teardown ────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = CRON_SECRET
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ═════════════════════════════════════════════════════════════════════
// SEND-REMINDERS
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/send-reminders', () => {
  async function callRoute(withAuth: boolean): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/send-reminders/route')
    return GET(makeCronRequest(withAuth)) as unknown as MockResponse
  }

  it('returns 401 without valid Bearer token', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid CRON_SECRET and no bookings', async () => {
    // Mock bookings query: no results
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.sentCount).toBe(0)
  })
})

// ═════════════════════════════════════════════════════════════════════
// RECALCULATE-QUALITY
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/recalculate-quality', () => {
  async function callRoute(withAuth: boolean): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/recalculate-quality/route')
    return GET(makeCronRequest(withAuth)) as unknown as MockResponse
  }

  it('returns 401 without valid Bearer token', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
    expect(res.body.error?.message || res.body.error).toBeDefined()
  })

  it('returns 200 with valid token and empty provider list', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.updated).toBe(0)
  })

  it('processes providers and updates quality scores', async () => {
    const mockProviders = [
      {
        id: 'p1',
        name: 'Test Attorney',
        siren: null,
        siret: null,
        address_street: '123 Main St',
        address_city: 'Houston',
        address_postal_code: '77001',
        address_department: 'TX',
        latitude: 29.76,
        longitude: -95.36,
        phone: '+18005551234',
        email: 'test@firm.com',
        specialty: 'Personal Injury',
        description: 'Top attorney',
        updated_at: '2026-01-01',
      },
    ]

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    let callCount = 0
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: callCount++ === 0 ? mockProviders : [],
              error: null,
            }),
          }),
        }),
      }),
      update: mockUpdate,
    }))

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.updated).toBe(1)
  })
})

// ═════════════════════════════════════════════════════════════════════
// SITEMAP-HEALTH
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/sitemap-health', () => {
  async function callRoute(withAuth: boolean): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    return GET(makeCronRequest(withAuth)) as unknown as MockResponse
  }

  it('returns 401 without valid Bearer token', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 200 with healthy sitemaps', async () => {
    // Mock global fetch for sitemap requests
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/sitemap.xml')) {
        // Sitemap index with 2 child sitemaps
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              `<?xml version="1.0"?>
              <sitemapindex>
                <sitemap><loc>https://us-attorneys.com/sitemap-0.xml</loc></sitemap>
                <sitemap><loc>https://us-attorneys.com/sitemap-1.xml</loc></sitemap>
              </sitemapindex>`
            ),
        })
      }
      // Child sitemaps
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            `<?xml version="1.0"?>
            <urlset><url><loc>https://us-attorneys.com/page</loc></url></urlset>`
          ),
      })
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.healthy).toBe(true)
    expect(res.body.checked).toBe(2)
    expect(res.body.totalUrls).toBe(2)

    globalThis.fetch = originalFetch
  })

  it('reports failures for broken child sitemaps', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/sitemap.xml') && !url.includes('sitemap-')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              `<sitemapindex><sitemap><loc>https://us-attorneys.com/sitemap-broken.xml</loc></sitemap></sitemapindex>`
            ),
        })
      }
      // Broken child sitemap
      return Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve(''),
      })
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.healthy).toBe(false)
    expect(res.body.failures).toBeDefined()
    expect(res.body.failures.length).toBe(1)

    globalThis.fetch = originalFetch
  })
})
