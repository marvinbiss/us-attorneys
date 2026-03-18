/**
 * Tests — /api/cron/sitemap-health route
 * Cron auth, SSRF validation, sitemap checking logic
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/seo/config', () => ({
  SITE_URL: 'https://us-attorneys.com',
}))

const mockVerifyCronSecret = vi.fn()
vi.mock('@/lib/cron-auth', () => ({
  verifyCronSecret: (...args: unknown[]) => mockVerifyCronSecret(...args),
}))

const mockValidateFetchUrl = vi.fn()
const mockFilterSafeUrls = vi.fn()
vi.mock('@/lib/url-validation', () => ({
  validateFetchUrl: (...args: unknown[]) => mockValidateFetchUrl(...args),
  filterSafeUrls: (...args: unknown[]) => mockFilterSafeUrls(...args),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {}
  if (authHeader !== undefined) {
    headers['authorization'] = authHeader
  }
  return new Request('http://localhost/api/cron/sitemap-health', { headers })
}

function xmlWithLocs(urls: string[]): string {
  return `<?xml version="1.0"?><sitemapindex>${urls.map((u) => `<sitemap><loc>${u}</loc></sitemap>`).join('')}</sitemapindex>`
}

function sitemapXml(urlCount: number): string {
  const urls = Array.from({ length: urlCount }, (_, i) => `<url><loc>https://us-attorneys.com/page-${i}</loc></url>`)
  return `<?xml version="1.0"?><urlset>${urls.join('')}</urlset>`
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Auth tests
// ---------------------------------------------------------------------------
describe('Cron auth', () => {
  it('returns 401 when no authorization header is provided', async () => {
    mockVerifyCronSecret.mockReturnValue(false)

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when cron secret is invalid', async () => {
    mockVerifyCronSecret.mockReturnValue(false)

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer wrong-secret'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('proceeds when cron secret is valid', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: true, url: new URL('https://us-attorneys.com/sitemap.xml') })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => xmlWithLocs([]),
    })
    mockFilterSafeUrls.mockReturnValue([])

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.healthy).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// SSRF URL validation
// ---------------------------------------------------------------------------
describe('SSRF URL validation', () => {
  it('returns 500 when sitemap index URL is blocked by SSRF filter', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: false, reason: 'Blocked private hostname' })

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Invalid sitemap index URL')
    expect(body.reason).toBe('Blocked private hostname')
  })

  it('filters child sitemap URLs through SSRF validation', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: true, url: new URL('https://us-attorneys.com/sitemap.xml') })

    const childUrls = [
      'https://us-attorneys.com/sitemap-0.xml',
      'https://evil.com/sitemap.xml',
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => xmlWithLocs(childUrls),
    })

    // filterSafeUrls should only return the valid one
    mockFilterSafeUrls.mockReturnValue(['https://us-attorneys.com/sitemap-0.xml'])

    // Mock the child sitemap fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sitemapXml(5),
    })

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(mockFilterSafeUrls).toHaveBeenCalledWith(childUrls, 'sitemap-health')
    expect(body.healthy).toBe(true)
    expect(body.checked).toBe(1)
    expect(body.totalUrls).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Sitemap index fetch failure
// ---------------------------------------------------------------------------
describe('Sitemap index fetch', () => {
  it('returns 500 when sitemap index returns non-200', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: true, url: new URL('https://us-attorneys.com/sitemap.xml') })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    })

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Sitemap index failed')
    expect(body.status).toBe(503)
  })
})

// ---------------------------------------------------------------------------
// Child sitemap health checking
// ---------------------------------------------------------------------------
describe('Child sitemap checks', () => {
  it('reports all healthy when all sitemaps return 200 with URLs', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: true, url: new URL('https://us-attorneys.com/sitemap.xml') })

    const childUrls = [
      'https://us-attorneys.com/sitemap-0.xml',
      'https://us-attorneys.com/sitemap-1.xml',
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => xmlWithLocs(childUrls),
    })
    mockFilterSafeUrls.mockReturnValue(childUrls)

    // Each child sitemap fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sitemapXml(10),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sitemapXml(20),
    })

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(body.healthy).toBe(true)
    expect(body.checked).toBe(2)
    expect(body.totalUrls).toBe(30)
    expect(body.failures).toBeUndefined()
    expect(body.timestamp).toBeDefined()
  })

  it('reports failures when a child sitemap returns non-200', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: true, url: new URL('https://us-attorneys.com/sitemap.xml') })

    const childUrls = ['https://us-attorneys.com/sitemap-0.xml']
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => xmlWithLocs(childUrls),
    })
    mockFilterSafeUrls.mockReturnValue(childUrls)

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => '',
    })

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(body.healthy).toBe(false)
    expect(body.failures).toContain('https://us-attorneys.com/sitemap-0.xml')
  })

  it('reports failure when sitemap has 0 URLs', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: true, url: new URL('https://us-attorneys.com/sitemap.xml') })

    const childUrls = ['https://us-attorneys.com/sitemap-0.xml']
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => xmlWithLocs(childUrls),
    })
    mockFilterSafeUrls.mockReturnValue(childUrls)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<?xml version="1.0"?><urlset></urlset>',
    })

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(body.healthy).toBe(false)
    expect(body.failures).toHaveLength(1)
  })

  it('handles fetch errors for child sitemaps gracefully', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: true, url: new URL('https://us-attorneys.com/sitemap.xml') })

    const childUrls = ['https://us-attorneys.com/sitemap-0.xml']
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => xmlWithLocs(childUrls),
    })
    mockFilterSafeUrls.mockReturnValue(childUrls)

    mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(body.healthy).toBe(false)
    expect(body.failures).toHaveLength(1)
  })

  it('returns correct counts with no child sitemaps', async () => {
    mockVerifyCronSecret.mockReturnValue(true)
    mockValidateFetchUrl.mockReturnValue({ valid: true, url: new URL('https://us-attorneys.com/sitemap.xml') })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<?xml version="1.0"?><sitemapindex></sitemapindex>',
    })
    mockFilterSafeUrls.mockReturnValue([])

    const { GET } = await import('@/app/api/cron/sitemap-health/route')
    const res = await GET(makeRequest('Bearer valid'))
    const body = await res.json()

    expect(body.healthy).toBe(true)
    expect(body.checked).toBe(0)
    expect(body.totalUrls).toBe(0)
  })
})
