/**
 * Tests for idempotency utility (src/lib/idempotency.ts)
 *
 * Covers:
 * - getIdempotencyKey: extraction and validation from request headers
 * - checkIdempotency: cache hit/miss with mocked Redis
 * - cacheIdempotencyResult: fire-and-forget caching
 * - handleIdempotency: convenience wrapper
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mock functions so they are available inside vi.mock factory
const { mockGet, mockSet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
}))

vi.mock('@/lib/cache/redis-client', () => ({
  CacheService: class MockCacheService {
    get = mockGet
    set = mockSet
  },
}))

// Mock logger to suppress output
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

import {
  getIdempotencyKey,
  checkIdempotency,
  cacheIdempotencyResult,
  handleIdempotency,
} from '@/lib/idempotency'

// ── getIdempotencyKey ────────────────────────────────────────────────────────

describe('getIdempotencyKey', () => {
  it('returns the key from x-idempotency-key header', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-idempotency-key': 'abc-123-def' },
    })
    expect(getIdempotencyKey(request)).toBe('abc-123-def')
  })

  it('returns null when header is absent', () => {
    const request = new Request('http://localhost/api/test')
    expect(getIdempotencyKey(request)).toBeNull()
  })

  it('returns null for empty string header', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-idempotency-key': '' },
    })
    expect(getIdempotencyKey(request)).toBeNull()
  })

  it('returns null for whitespace-only header', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-idempotency-key': '   ' },
    })
    expect(getIdempotencyKey(request)).toBeNull()
  })

  it('trims whitespace from key', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-idempotency-key': '  my-key  ' },
    })
    expect(getIdempotencyKey(request)).toBe('my-key')
  })

  it('returns null for key exceeding 256 characters', () => {
    const longKey = 'a'.repeat(257)
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-idempotency-key': longKey },
    })
    expect(getIdempotencyKey(request)).toBeNull()
  })

  it('accepts key at exactly 256 characters', () => {
    const maxKey = 'b'.repeat(256)
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-idempotency-key': maxKey },
    })
    expect(getIdempotencyKey(request)).toBe(maxKey)
  })
})

// ── checkIdempotency ─────────────────────────────────────────────────────────

describe('checkIdempotency', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('returns NextResponse with cached body on cache hit', async () => {
    mockGet.mockResolvedValue({ status: 200, body: { ok: true } })
    const response = await checkIdempotency('hit-key')
    expect(response).not.toBeNull()
    // NextResponse.json produces a Response object
    if (response) {
      const body = await response.json()
      expect(body).toEqual({ ok: true })
      expect(response.status).toBe(200)
    }
  })

  it('returns null on cache miss', async () => {
    mockGet.mockResolvedValue(null)
    const response = await checkIdempotency('miss-key')
    expect(response).toBeNull()
  })

  it('fails open when Redis throws (returns null, not error)', async () => {
    mockGet.mockRejectedValue(new Error('Redis connection refused'))
    const response = await checkIdempotency('error-key')
    expect(response).toBeNull()
  })
})

// ── cacheIdempotencyResult ───────────────────────────────────────────────────

describe('cacheIdempotencyResult', () => {
  beforeEach(() => {
    mockSet.mockReset()
  })

  it('calls redis.set with the key, entry, and 24h TTL', () => {
    mockSet.mockResolvedValue(undefined)
    cacheIdempotencyResult('cache-key', 201, { id: 'new-booking' })
    expect(mockSet).toHaveBeenCalledWith(
      'cache-key',
      { status: 201, body: { id: 'new-booking' } },
      86400
    )
  })

  it('does not throw when redis.set fails (fire-and-forget)', () => {
    mockSet.mockRejectedValue(new Error('Redis write error'))
    // Should not throw
    expect(() =>
      cacheIdempotencyResult('fail-key', 200, { ok: true })
    ).not.toThrow()
  })
})

// ── handleIdempotency ────────────────────────────────────────────────────────

describe('handleIdempotency', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('returns null when no idempotency header is present', async () => {
    const request = new Request('http://localhost/api/bookings', {
      method: 'POST',
    })
    const result = await handleIdempotency(request)
    expect(result).toBeNull()
  })

  it('returns { key } when header is present but cache misses', async () => {
    mockGet.mockResolvedValue(null)
    const request = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'x-idempotency-key': 'unique-key-1' },
    })
    const result = await handleIdempotency(request)
    expect(result).toEqual({ key: 'unique-key-1' })
  })

  it('returns { cached } when header is present and cache hits', async () => {
    mockGet.mockResolvedValue({ status: 200, body: { already: 'done' } })
    const request = new Request('http://localhost/api/bookings', {
      method: 'POST',
      headers: { 'x-idempotency-key': 'dupe-key' },
    })
    const result = await handleIdempotency(request)
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('cached')
  })
})
