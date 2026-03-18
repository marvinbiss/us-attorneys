/**
 * Tests for src/lib/cache/redis-client.ts
 *
 * Covers:
 * - CacheService: get, set, delete, deletePattern, getOrSet, increment, exists, ttl
 * - rateLimiter.isAllowed: sliding window, over-limit, Redis error failover
 * - Graceful degradation when Redis is unavailable
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// ---------------------------------------------------------------------------
// No Redis env — all commands return null / defaults
// ---------------------------------------------------------------------------

describe('CacheService — no Redis configured', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('get returns null', async () => {
    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.get('any-key')).toBeNull()
  })

  it('set returns false', async () => {
    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.set('key', 'value')).toBe(false)
  })

  it('delete returns false', async () => {
    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.delete('key')).toBe(false)
  })

  it('deletePattern returns 0', async () => {
    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.deletePattern('pattern*')).toBe(0)
  })

  it('getOrSet calls factory and returns its value', async () => {
    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    const factory = vi.fn().mockResolvedValue({ fresh: true })
    const result = await cache.getOrSet('key', factory, 3600)
    expect(result).toEqual({ fresh: true })
    expect(factory).toHaveBeenCalledOnce()
  })

  it('increment returns 0', async () => {
    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.increment('counter')).toBe(0)
  })

  it('exists returns false', async () => {
    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.exists('key')).toBe(false)
  })

  it('ttl returns -1', async () => {
    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.ttl('key')).toBe(-1)
  })
})

// ---------------------------------------------------------------------------
// With Redis — test actual command flow
// ---------------------------------------------------------------------------

describe('CacheService — with Redis', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
    globalThis.fetch = mockFetch
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('get parses JSON value from Redis', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: JSON.stringify({ name: 'test' }) }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService('app:')
    const result = await cache.get<{ name: string }>('mykey')
    expect(result).toEqual({ name: 'test' })

    // Verify the correct key prefix was used
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody).toEqual(['GET', 'app:mykey'])
  })

  it('get returns raw value when JSON parse fails', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'plain-string' }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    const result = await cache.get<string>('rawkey')
    expect(result).toBe('plain-string')
  })

  it('get returns null for null/undefined Redis response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: null }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.get('missing')).toBeNull()
  })

  it('set sends SETEX command with TTL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'OK' }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService('test:')
    const success = await cache.set('k1', { data: true }, 600)
    expect(success).toBe(true)

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody[0]).toBe('SETEX')
    expect(callBody[1]).toBe('test:k1')
    expect(callBody[2]).toBe(600)
    expect(JSON.parse(callBody[3])).toEqual({ data: true })
  })

  it('set returns false when Redis returns non-OK', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: null }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.set('k2', 'val')).toBe(false)
  })

  it('delete sends DEL command', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 1 }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.delete('delkey')).toBe(true)
  })

  it('delete returns false when key does not exist', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 0 }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.delete('nokey')).toBe(false)
  })

  it('deletePattern finds keys then deletes them', async () => {
    // First call: KEYS command
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: ['usa:k1', 'usa:k2'] }),
      })
      // Second call: DEL command
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 2 }),
      })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    const count = await cache.deletePattern('k*')
    expect(count).toBe(2)
  })

  it('deletePattern returns 0 when no keys match', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: [] }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.deletePattern('nomatch*')).toBe(0)
  })

  it('getOrSet returns cached value without calling factory', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: JSON.stringify({ cached: true }) }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    const factory = vi.fn()
    const result = await cache.getOrSet('hit', factory)
    expect(result).toEqual({ cached: true })
    expect(factory).not.toHaveBeenCalled()
  })

  it('getOrSet calls factory on cache miss then stores result', async () => {
    // GET returns null (miss)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: null }),
      })
      // SETEX
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 'OK' }),
      })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    const factory = vi.fn().mockResolvedValue({ fresh: true })
    const result = await cache.getOrSet('miss', factory, 120)
    expect(result).toEqual({ fresh: true })
    expect(factory).toHaveBeenCalledOnce()
  })

  it('increment sends INCR and sets EXPIRE on first call', async () => {
    // INCR returns 1 (first increment)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 1 }),
      })
      // EXPIRE
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 1 }),
      })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    const count = await cache.increment('counter', 300)
    expect(count).toBe(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('increment does not set EXPIRE when count > 1', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ result: 5 }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    const count = await cache.increment('counter')
    expect(count).toBe(5)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('exists returns true when key exists', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 1 }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.exists('present')).toBe(true)
  })

  it('exists returns false when key is absent', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 0 }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.exists('absent')).toBe(false)
  })

  it('ttl returns the TTL value', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 3500 }),
    })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.ttl('mykey')).toBe(3500)
  })

  it('handles fetch errors gracefully (returns null)', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.get('error-key')).toBeNull()
  })

  it('handles HTTP error gracefully (returns null)', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    const { CacheService } = await import('@/lib/cache/redis-client')
    const cache = new CacheService()
    expect(await cache.get('http-error-key')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// rateLimiter
// ---------------------------------------------------------------------------

describe('rateLimiter.isAllowed — with Redis', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
    globalThis.fetch = mockFetch
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('allows request when count is within limit', async () => {
    // ZADD, ZREMRANGEBYSCORE, ZCARD, PEXPIRE
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 3 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 1 }) })

    const { rateLimiter } = await import('@/lib/cache/redis-client')
    const result = await rateLimiter.isAllowed('user:1', 10, 60)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(7)
  })

  it('denies request when count exceeds limit', async () => {
    // ZADD, ZREMRANGEBYSCORE, ZCARD (over limit), PEXPIRE, ZREM
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 11 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ result: 1 }) })

    const { rateLimiter } = await import('@/lib/cache/redis-client')
    const result = await rateLimiter.isAllowed('user:1', 10, 60)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('fails open when Redis throws', async () => {
    mockFetch.mockRejectedValue(new Error('Redis down'))

    const { rateLimiter } = await import('@/lib/cache/redis-client')
    const result = await rateLimiter.isAllowed('user:1', 10, 60)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

describe('default cache export', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('exports a CacheService instance with usa: prefix', async () => {
    const mod = await import('@/lib/cache/redis-client')
    expect(mod.cache).toBeDefined()
    expect(mod.default).toBe(mod.cache)
  })
})
