/**
 * Cron Routes — Integration Tests
 *
 * Verifies auth (Bearer token) + basic flow for ALL 12 cron jobs:
 *   - GET  /api/cron/send-reminders
 *   - GET  /api/cron/send-reminders-1h
 *   - GET  /api/cron/send-review-requests
 *   - POST /api/cron/send-booking-reminders
 *   - GET  /api/cron/recalculate-quality
 *   - GET  /api/cron/calculate-trust-badges
 *   - GET  /api/cron/data-refresh
 *   - GET  /api/cron/prospection-process
 *   - GET  /api/cron/indexnow-submit
 *   - GET  /api/cron/sitemap-health
 *   - GET  /api/cron/voice-lead-expiry
 *   - GET  /api/cron/voice-stats
 *
 * All tests mock Supabase/Redis/fetch but exercise the real route handler code.
 * Each cron has at least 3 tests: 401 no auth, 401 wrong token, 200 valid + behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Shared constants ────────────────────────────────────────────────

const CRON_SECRET = 'test-cron-secret-abc123'

// ── Mock next/server ────────────────────────────────────────────────

vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest extends Request {
    constructor(url: string, init?: RequestInit) {
      super(url, init)
    }
  },
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

// ── Mock logger ─────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// ── Mock Supabase clients ───────────────────────────────────────────

const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
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

// ── Mock notification service (for send-reminders / send-reminders-1h) ──

vi.mock('@/lib/notifications/unified-notification-service', () => ({
  getNotificationService: vi.fn().mockReturnValue({
    sendBatch: vi.fn().mockResolvedValue({ succeeded: 0, failed: 0 }),
  }),
}))

// ── Mock email services ─────────────────────────────────────────────

vi.mock('@/lib/services/email-service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  emailTemplates: {
    bookingReminder: vi.fn().mockReturnValue({
      subject: 'Reminder',
      html: '<p>Reminder</p>',
      text: 'Reminder',
    }),
  },
}))

vi.mock('@/lib/notifications/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, error: null }),
}))

vi.mock('@/lib/notifications/sms', () => ({
  sendReviewRequestSMS: vi.fn().mockResolvedValue({ success: true }),
}))

// ── Mock prospection module ─────────────────────────────────────────

vi.mock('@/lib/prospection/message-queue', () => ({
  processBatch: vi.fn().mockResolvedValue({ sent: 0, failed: 0 }),
  reconcileOrphanedMessages: vi.fn().mockResolvedValue(0),
}))

// ── Mock SEO config (for sitemap-health, indexnow-submit) ───────────

vi.mock('@/lib/seo/config', () => ({
  SITE_URL: 'https://us-attorneys.com',
}))

// ── Mock usa data (for indexnow-submit) ─────────────────────────────

vi.mock('@/lib/data/usa', () => ({
  services: [
    { slug: 'personal-injury' },
    { slug: 'family-law' },
    { slug: 'criminal-defense' },
    { slug: 'immigration' },
    { slug: 'bankruptcy' },
    { slug: 'estate-planning' },
    { slug: 'employment-law' },
    { slug: 'business-law' },
    { slug: 'real-estate' },
    { slug: 'intellectual-property' },
  ],
}))

// ── Helpers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResponse = { body: any; status: number }

function makeCronRequest(withAuth: boolean | 'wrong', method = 'GET'): Request {
  const headers: Record<string, string> = {}
  if (withAuth === true) {
    headers['authorization'] = `Bearer ${CRON_SECRET}`
  } else if (withAuth === 'wrong') {
    headers['authorization'] = 'Bearer wrong-token-value-here'
  }
  return new Request('http://localhost/api/cron/test', {
    method,
    headers,
  })
}

/**
 * Helper: set up mockFrom to return empty results for any table.
 * Chains support: select->eq->limit, select->eq->range->order, select->in->eq->eq, etc.
 */
function mockEmptySupabase() {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    then: undefined as unknown,
  }
  // Make it resolve as a promise with empty data
  const resolvedValue = { data: [], error: null, count: 0 }
  Object.defineProperty(chainable, 'then', {
    get() {
      return (resolve: (v: typeof resolvedValue) => void) => resolve(resolvedValue)
    },
    configurable: true,
  })
  // Mock each method to return chainable
  for (const key of Object.keys(chainable)) {
    if (key === 'then') continue
    ;(chainable as Record<string, unknown>)[key] = vi.fn().mockReturnValue(chainable)
  }
  mockFrom.mockReturnValue(chainable)
  mockRpc.mockResolvedValue({ error: null })
  return chainable
}

// ── Setup / Teardown ────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = CRON_SECRET
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://us-attorneys.com'
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ═════════════════════════════════════════════════════════════════════
// SEND-REMINDERS
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/send-reminders', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/send-reminders/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid CRON_SECRET and no bookings', async () => {
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
// SEND-REMINDERS-1H
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/send-reminders-1h', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/send-reminders-1h/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid token and no upcoming bookings', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.sentCount).toBe(0)
  })
})

// ═════════════════════════════════════════════════════════════════════
// SEND-REVIEW-REQUESTS
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/send-review-requests', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/send-review-requests/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid token and no completed bookings', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.sentCount).toBe(0)
  })
})

// ═════════════════════════════════════════════════════════════════════
// SEND-BOOKING-REMINDERS (POST)
// ═════════════════════════════════════════════════════════════════════

describe('POST /api/cron/send-booking-reminders', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { POST } = await import('@/app/api/cron/send-booking-reminders/route')
    return POST(makeCronRequest(withAuth, 'POST')) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid token and no bookings to remind', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
    }))

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.sent).toBe(0)
    expect(res.body.message).toBe('No bookings need reminders')
  })
})

// ═════════════════════════════════════════════════════════════════════
// RECALCULATE-QUALITY
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/recalculate-quality', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/recalculate-quality/route')
    return GET(makeCronRequest(withAuth)) as unknown as MockResponse
  }

  it('returns 401 without valid Bearer token', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
    expect(res.body.error?.message || res.body.error).toBeDefined()
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
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
// CALCULATE-TRUST-BADGES (Review metrics recalculation)
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/calculate-trust-badges', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/calculate-trust-badges/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid token and no attorneys', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })
    mockRpc.mockResolvedValue({ error: null })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.updated).toBe(0)
    expect(res.body.mvRefreshed).toBe(true)
  })

  it('recalculates review metrics for attorneys with reviews', async () => {
    const mockAttorneys = [
      { id: 'a1', user_id: 'u1', rating_average: 0, review_count: 0 },
    ]
    const mockReviews = [
      { attorney_id: 'u1', rating: 5 },
      { attorney_id: 'u1', rating: 4 },
    ]

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    let selectCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockReviews, error: null }),
            }),
          }),
        }
      }
      // attorneys table
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: selectCallCount++ === 0 ? mockAttorneys : [],
                error: null,
              }),
            }),
          }),
        }),
        update: mockUpdate,
      }
    })
    mockRpc.mockResolvedValue({ error: null })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.updated).toBe(1)
    expect(mockUpdate).toHaveBeenCalled()
  })
})

// ═════════════════════════════════════════════════════════════════════
// DATA-REFRESH
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/data-refresh', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/data-refresh/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 and reports stats on successful refresh', async () => {
    mockRpc.mockResolvedValue({ error: null })
    // Permissive mock: all Supabase chains return sensible defaults
    const chainProxy = (): unknown =>
      new Proxy({}, {
        get(_t, prop: string) {
          if (prop === 'then') return undefined
          if (['data', 'error'].includes(prop)) return prop === 'data' ? [] : null
          if (prop === 'count') return 1500
          return vi.fn().mockImplementation(() => chainProxy())
        },
      })
    mockFrom.mockImplementation(() => chainProxy())

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBeDefined()
    expect(res.body.stats).toBeDefined()
    expect(res.body.steps).toBeDefined()
    expect(res.body.steps.length).toBeGreaterThanOrEqual(3)
  })

  it('handles RPC failure gracefully and continues', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Function not found' } })
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 100, error: null }),
        not: vi.fn().mockResolvedValue({ count: 50, error: null }),
      }),
    }))

    const res = await callRoute(true)

    // Still returns 200 -- partial failure is acceptable
    expect(res.status).toBe(200)
    expect(res.body.steps).toBeDefined()
    const failedStep = res.body.steps.find(
      (s: { step: string; success: boolean }) => s.step === 'refresh_mv_attorney_stats'
    )
    expect(failedStep?.success).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════
// PROSPECTION-PROCESS
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/prospection-process', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/prospection-process/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with no active campaigns', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }))

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.campaigns_processed).toBe(0)
  })

  it('processes active campaigns', async () => {
    const { processBatch } = await import('@/lib/prospection/message-queue')

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'c1', name: 'Test Campaign', batch_size: 50 }],
          error: null,
        }),
      }),
    }))

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.campaigns_processed).toBe(1)
    expect(processBatch).toHaveBeenCalledWith('c1', 50)
  })
})

// ═════════════════════════════════════════════════════════════════════
// INDEXNOW-SUBMIT
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/indexnow-submit', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/indexnow-submit/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 and submits strategic URLs', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, submitted: 212 }),
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.urlCount).toBeGreaterThan(0)
    // Should call /api/indexnow endpoint
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('submits URLs for top services x top cities', async () => {
    let submittedUrls: string[] = []
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.body) {
        const parsed = JSON.parse(init.body as string)
        submittedUrls = parsed.urls || []
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, submitted: submittedUrls.length }),
      })
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    // Should include home page + services page + practice-area pages + city pages + quote pages
    expect(res.body.urlCount).toBeGreaterThanOrEqual(102) // 2 + 10 services + 10*10 cities + 10*10 quotes = 212
  })
})

// ═════════════════════════════════════════════════════════════════════
// SITEMAP-HEALTH
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/sitemap-health', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    return GET(makeCronRequest(withAuth)) as unknown as MockResponse
  }

  it('returns 401 without valid Bearer token', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with healthy sitemaps', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/sitemap.xml')) {
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
  })

  it('reports failures for broken child sitemaps', async () => {
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
  })
})

// ═════════════════════════════════════════════════════════════════════
// VOICE-LEAD-EXPIRY
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/voice-lead-expiry', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/voice-lead-expiry/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with no expired leads', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'voice_calls') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  lt: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }
      }
      return mockEmptySupabase()
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.checked).toBe(0)
    expect(res.body.data.expired).toBe(0)
  })

  it('checks and counts expired leads correctly', async () => {
    const expiredCalls = [
      { id: 'call1', lead_id: 'lead1', qualification_score: 'A', caller_phone: '+18001234567' },
    ]

    mockFrom.mockImplementation((table: string) => {
      if (table === 'voice_calls') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  lt: vi.fn().mockResolvedValue({ data: expiredCalls, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'lead_assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      return mockEmptySupabase()
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.checked).toBe(1)
    expect(res.body.data.expired).toBe(1)
  })
})

// ═════════════════════════════════════════════════════════════════════
// VOICE-STATS
// ═════════════════════════════════════════════════════════════════════

describe('GET /api/cron/voice-stats', () => {
  async function callRoute(withAuth: boolean | 'wrong'): Promise<MockResponse> {
    const { GET } = await import('@/app/api/cron/voice-stats/route')
    return GET(makeCronRequest(withAuth) as never) as unknown as MockResponse
  }

  it('returns 401 without Authorization header', async () => {
    const res = await callRoute(false)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong Bearer token', async () => {
    const res = await callRoute('wrong')
    expect(res.status).toBe(401)
  })

  it('returns 200 with no calls yesterday', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'voice_calls') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      }
      return mockEmptySupabase()
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.total).toBe(0)
  })

  it('aggregates call stats and upserts to voice_stats_daily', async () => {
    const mockCalls = [
      { status: 'completed', duration_seconds: 120, qualification_score: 'A', vapi_cost: '0.50', lead_id: 'l1' },
      { status: 'completed', duration_seconds: 60, qualification_score: 'B', vapi_cost: '0.30', lead_id: null },
      { status: 'failed', duration_seconds: 0, qualification_score: 'C', vapi_cost: '0.10', lead_id: null },
    ]

    mockFrom.mockImplementation((table: string) => {
      if (table === 'voice_calls') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({ data: mockCalls, error: null }),
            }),
          }),
        }
      }
      if (table === 'voice_stats_daily') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return mockEmptySupabase()
    })

    const res = await callRoute(true)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.total_calls).toBe(3)
    expect(res.body.data.completed_calls).toBe(2)
    expect(res.body.data.qualified_a).toBe(1)
    expect(res.body.data.qualified_b).toBe(1)
    expect(res.body.data.qualified_c).toBe(1)
    expect(res.body.data.leads_created).toBe(1)
    expect(res.body.data.avg_duration_seconds).toBe(90) // (120+60)/2
    expect(res.body.data.total_vapi_cost).toBeCloseTo(0.9)
  })
})
