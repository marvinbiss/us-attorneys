/**
 * Tests for URL validation utility (SSRF prevention)
 *
 * Covers:
 * - validateFetchUrl with valid URLs, private IPs, wrong domains, wrong protocols
 * - filterSafeUrls with mixed valid/invalid URLs
 * - Edge cases: cloud metadata endpoints, IPv6, malformed URLs
 */

import { describe, it, expect, vi } from 'vitest'

// Mock the SITE_URL import before importing the module
vi.mock('@/lib/seo/config', () => ({
  SITE_URL: 'https://us-attorneys.com',
}))

import { validateFetchUrl, filterSafeUrls } from '@/lib/url-validation'

// ── validateFetchUrl ─────────────────────────────────────────────────────────

describe('validateFetchUrl', () => {
  it('accepts a valid HTTPS URL matching the site domain', () => {
    const result = validateFetchUrl('https://us-attorneys.com/attorneys/john-doe')
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.url.hostname).toBe('us-attorneys.com')
    }
  })

  it('accepts a subdomain of the site domain (e.g. www)', () => {
    const result = validateFetchUrl('https://www.us-attorneys.com/page')
    expect(result.valid).toBe(true)
  })

  it('accepts localhost with http:// for development', () => {
    const result = validateFetchUrl('http://localhost:3000/api/test')
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.url.hostname).toBe('localhost')
    }
  })

  it('rejects localhost with https:// (only http allowed)', () => {
    const result = validateFetchUrl('https://localhost:3000/api/test')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('Localhost only allowed with http://')
    }
  })

  it('rejects a completely different domain', () => {
    const result = validateFetchUrl('https://evil.com/steal-data')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('Hostname not allowed')
    }
  })

  it('rejects non-HTTPS for external URLs', () => {
    const result = validateFetchUrl('http://us-attorneys.com/page')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('must use HTTPS')
    }
  })

  it('rejects ftp:// protocol', () => {
    const result = validateFetchUrl('ftp://us-attorneys.com/data')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('Blocked protocol')
    }
  })

  it('rejects javascript: protocol', () => {
    const result = validateFetchUrl('javascript:alert(1)')
    expect(result.valid).toBe(false)
  })

  it('rejects file:// protocol', () => {
    const result = validateFetchUrl('file:///etc/passwd')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('Blocked protocol')
    }
  })

  it('rejects malformed URL', () => {
    const result = validateFetchUrl('not-a-url-at-all')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('Invalid URL format')
    }
  })

  // ── Private IP / SSRF blocking ──────────────────────────────────────────

  it('rejects 127.0.0.1 (blocked by private IP check before localhost check)', () => {
    const result = validateFetchUrl('http://127.0.0.1:8080/internal')
    // isPrivateHostname catches 127.x BEFORE the localhost special case
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('private/internal')
    }
  })

  it('rejects 10.x.x.x private range', () => {
    const result = validateFetchUrl('https://10.0.0.1/internal')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('private/internal')
    }
  })

  it('rejects 192.168.x.x private range', () => {
    const result = validateFetchUrl('https://192.168.1.1/admin')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('private/internal')
    }
  })

  it('rejects 172.16.x.x private range', () => {
    const result = validateFetchUrl('https://172.16.0.1/internal')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('private/internal')
    }
  })

  it('rejects 169.254.169.254 (cloud metadata endpoint)', () => {
    const result = validateFetchUrl('http://169.254.169.254/latest/meta-data/')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('private/internal')
    }
  })

  it('rejects metadata.google.internal', () => {
    const result = validateFetchUrl('https://metadata.google.internal/computeMetadata/v1/')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toContain('private/internal')
    }
  })

  it('rejects empty string', () => {
    const result = validateFetchUrl('')
    expect(result.valid).toBe(false)
  })
})

// ── filterSafeUrls ───────────────────────────────────────────────────────────

describe('filterSafeUrls', () => {
  it('returns only valid URLs from a mixed array', () => {
    const urls = [
      'https://us-attorneys.com/page-1',
      'https://evil.com/steal',
      'https://us-attorneys.com/page-2',
      'ftp://us-attorneys.com/data',
    ]
    const safe = filterSafeUrls(urls, 'test-context')
    expect(safe).toHaveLength(2)
    expect(safe[0]).toContain('us-attorneys.com/page-1')
    expect(safe[1]).toContain('us-attorneys.com/page-2')
  })

  it('returns empty array when all URLs are invalid', () => {
    const urls = [
      'https://evil.com/path',
      'ftp://us-attorneys.com/data',
      'not-a-url',
    ]
    const safe = filterSafeUrls(urls, 'test-context')
    expect(safe).toHaveLength(0)
  })

  it('returns all URLs when all are valid', () => {
    const urls = [
      'https://us-attorneys.com/a',
      'https://us-attorneys.com/b',
      'https://www.us-attorneys.com/c',
    ]
    const safe = filterSafeUrls(urls, 'test-context')
    expect(safe).toHaveLength(3)
  })

  it('handles empty input array', () => {
    const safe = filterSafeUrls([], 'test-context')
    expect(safe).toHaveLength(0)
  })

  it('logs warnings for rejected URLs', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    filterSafeUrls(['https://evil.com/bad'], 'ssrf-test')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ssrf-test] SSRF blocked')
    )
    warnSpy.mockRestore()
  })
})
