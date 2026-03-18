import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Redis client before importing cache module.
// Use vi.hoisted() so the mock fns are available in the factory.
const { mockRedisGet, mockRedisSet, mockRedisDelete } = vi.hoisted(() => ({
  mockRedisGet: vi.fn(),
  mockRedisSet: vi.fn().mockResolvedValue(true),
  mockRedisDelete: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/cache/redis-client', () => {
  class MockCacheService {
    get = mockRedisGet
    set = mockRedisSet
    delete = mockRedisDelete
  }
  return { CacheService: MockCacheService }
})

vi.mock('@/lib/logger', () => {
  const stub = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }
  return {
    logger: { ...stub, child: vi.fn(() => stub) },
    dbLogger: stub,
    apiLogger: stub,
    authLogger: stub,
    seoLogger: stub,
    ingestLogger: stub,
    paymentLogger: stub,
  }
})

// Must import after mocks are set up
let getCachedData: typeof import('@/lib/cache').getCachedData
let clearCache: typeof import('@/lib/cache').clearCache
let invalidateCache: typeof import('@/lib/cache').invalidateCache
let generateCacheKey: typeof import('@/lib/cache').generateCacheKey
let getCacheStats: typeof import('@/lib/cache').getCacheStats
let CACHE_TTL: typeof import('@/lib/cache').CACHE_TTL

beforeEach(async () => {
  mockRedisGet.mockReset()
  mockRedisSet.mockReset().mockResolvedValue(true)
  mockRedisDelete.mockReset().mockResolvedValue(true)
  vi.resetModules()
  const mod = await import('@/lib/cache')
  getCachedData = mod.getCachedData
  clearCache = mod.clearCache
  invalidateCache = mod.invalidateCache
  generateCacheKey = mod.generateCacheKey
  getCacheStats = mod.getCacheStats
  CACHE_TTL = mod.CACHE_TTL
})

// ---------------------------------------------------------------------------
// CACHE_TTL constants
// ---------------------------------------------------------------------------
describe('CACHE_TTL', () => {
  it('has expected TTL values', () => {
    expect(CACHE_TTL.services).toBe(86400)
    expect(CACHE_TTL.attorneys).toBe(3600)
    expect(CACHE_TTL.locations).toBe(604800)
    expect(CACHE_TTL.reviews).toBe(3600)
    expect(CACHE_TTL.stats).toBe(86400)
    expect(CACHE_TTL.cms).toBe(3600)
  })
})

// ---------------------------------------------------------------------------
// getCachedData — L1 hit
// ---------------------------------------------------------------------------
describe('getCachedData — L1 (memory) hit', () => {
  it('returns cached data on second call without hitting Redis or fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({ result: 'fresh' })
    mockRedisGet.mockResolvedValue(null)

    // First call: cache miss -> calls fetcher
    const first = await getCachedData('l1-key', fetcher, 300)
    expect(first).toEqual({ result: 'fresh' })
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Second call: L1 memory hit -> no fetcher, no Redis
    const second = await getCachedData('l1-key', fetcher, 300)
    expect(second).toEqual({ result: 'fresh' })
    expect(fetcher).toHaveBeenCalledTimes(1) // Still 1
  })
})

// ---------------------------------------------------------------------------
// getCachedData — L2 (Redis) hit
// ---------------------------------------------------------------------------
describe('getCachedData — L2 (Redis) hit', () => {
  it('returns Redis-cached data without calling fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue('should not be called')
    mockRedisGet.mockResolvedValue({ cached: true })

    const result = await getCachedData('redis-key', fetcher, 300)
    expect(result).toEqual({ cached: true })
    expect(fetcher).not.toHaveBeenCalled()
    expect(mockRedisGet).toHaveBeenCalledWith('redis-key')
  })

  it('warms L1 from Redis hit so subsequent calls skip Redis', async () => {
    const fetcher = vi.fn()
    mockRedisGet.mockResolvedValueOnce('redis-value')

    // First: Redis hit
    await getCachedData('warm-key', fetcher, 300)
    expect(mockRedisGet).toHaveBeenCalledTimes(1)

    // Second: L1 hit (warmed from Redis) - Redis should not be called again
    mockRedisGet.mockClear()
    await getCachedData('warm-key', fetcher, 300)
    expect(mockRedisGet).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// getCachedData — cache miss
// ---------------------------------------------------------------------------
describe('getCachedData — cache miss', () => {
  it('calls fetcher and stores in both L1 and L2', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue([1, 2, 3])

    const result = await getCachedData('miss-key', fetcher, 600)
    expect(result).toEqual([1, 2, 3])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(mockRedisSet).toHaveBeenCalledWith('miss-key', [1, 2, 3], 600)
  })
})

// ---------------------------------------------------------------------------
// getCachedData — skipNull option
// ---------------------------------------------------------------------------
describe('getCachedData — skipNull option', () => {
  it('does NOT cache null results when skipNull is true', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue(null)

    const result = await getCachedData('null-key', fetcher, 300, { skipNull: true })
    expect(result).toBeNull()
    expect(mockRedisSet).not.toHaveBeenCalled()
  })

  it('does NOT cache empty array results when skipNull is true', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue([])

    const result = await getCachedData('empty-key', fetcher, 300, { skipNull: true })
    expect(result).toEqual([])
    expect(mockRedisSet).not.toHaveBeenCalled()
  })

  it('DOES cache null results when skipNull is false/undefined', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue(null)

    await getCachedData('null-cached-key', fetcher, 300)
    expect(mockRedisSet).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// invalidateCache
// ---------------------------------------------------------------------------
describe('invalidateCache', () => {
  it('removes a specific key from L1 cache', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue('value')

    await getCachedData('inv-key', fetcher, 300)
    expect(getCacheStats().keys).toContain('inv-key')

    invalidateCache('inv-key')
    expect(getCacheStats().keys).not.toContain('inv-key')
  })

  it('removes keys matching a regex pattern from L1 cache', async () => {
    mockRedisGet.mockResolvedValue(null)

    await getCachedData('prefix:a', vi.fn().mockResolvedValue(1), 300)
    await getCachedData('prefix:b', vi.fn().mockResolvedValue(2), 300)
    await getCachedData('other:c', vi.fn().mockResolvedValue(3), 300)

    invalidateCache(/^prefix:/)
    const stats = getCacheStats()
    expect(stats.keys).not.toContain('prefix:a')
    expect(stats.keys).not.toContain('prefix:b')
    expect(stats.keys).toContain('other:c')
  })
})

// ---------------------------------------------------------------------------
// clearCache
// ---------------------------------------------------------------------------
describe('clearCache', () => {
  it('clears all L1 entries', async () => {
    mockRedisGet.mockResolvedValue(null)

    await getCachedData('clear-a', vi.fn().mockResolvedValue(1), 300)
    await getCachedData('clear-b', vi.fn().mockResolvedValue(2), 300)
    expect(getCacheStats().size).toBeGreaterThanOrEqual(2)

    clearCache()
    expect(getCacheStats().size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// generateCacheKey
// ---------------------------------------------------------------------------
describe('generateCacheKey', () => {
  it('produces deterministic key from sorted params', () => {
    const key1 = generateCacheKey('test', { b: 2, a: 1 })
    const key2 = generateCacheKey('test', { a: 1, b: 2 })
    expect(key1).toBe(key2)
    expect(key1).toBe('test:a=1&b=2')
  })

  it('handles empty params', () => {
    expect(generateCacheKey('empty', {})).toBe('empty:')
  })

  it('handles single param', () => {
    expect(generateCacheKey('single', { slug: 'foo' })).toBe('single:slug=foo')
  })
})

// ---------------------------------------------------------------------------
// getCachedData — TTL expiry
// ---------------------------------------------------------------------------
describe('getCachedData — TTL expiry', () => {
  it('re-fetches data after L1 TTL expires', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')

    // First call: populates L1 + L2
    const first = await getCachedData('ttl-key', fetcher, 1) // 1 second TTL
    expect(first).toBe('first')

    // Manually expire the L1 entry by manipulating time
    // The L1 expiry is Date.now() + Math.min(ttl, 3600) * 1000
    // We need to advance time past this point
    const originalDateNow = Date.now
    const futureTime = Date.now() + 2000 // 2 seconds in the future
    Date.now = vi.fn(() => futureTime)

    // Also make Redis return null (simulating expired Redis TTL too)
    mockRedisGet.mockResolvedValue(null)

    const second = await getCachedData('ttl-key', fetcher, 1)
    expect(second).toBe('second')
    expect(fetcher).toHaveBeenCalledTimes(2)

    // Restore Date.now
    Date.now = originalDateNow
  })
})

// ---------------------------------------------------------------------------
// getCachedData — error handling
// ---------------------------------------------------------------------------
describe('getCachedData — error handling', () => {
  it('propagates error when fetcher throws', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockRejectedValue(new Error('DB connection failed'))

    await expect(getCachedData('error-key', fetcher, 300)).rejects.toThrow('DB connection failed')
  })

  it('still works when Redis SET fails (fire-and-forget)', async () => {
    mockRedisGet.mockResolvedValue(null)
    mockRedisSet.mockRejectedValue(new Error('Redis timeout'))
    const fetcher = vi.fn().mockResolvedValue('fallback-data')

    const result = await getCachedData('redis-fail-key', fetcher, 300)
    expect(result).toBe('fallback-data')
    // L1 cache should still be populated
    const stats = getCacheStats()
    expect(stats.keys).toContain('redis-fail-key')
  })
})

// ---------------------------------------------------------------------------
// getCachedData — skipNull with undefined
// ---------------------------------------------------------------------------
describe('getCachedData — skipNull with undefined', () => {
  it('does NOT cache undefined results when skipNull is true', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue(undefined)

    const result = await getCachedData('undef-key', fetcher, 300, { skipNull: true })
    expect(result).toBeUndefined()
    expect(mockRedisSet).not.toHaveBeenCalled()
  })

  it('DOES cache non-null results when skipNull is true', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue({ valid: true })

    await getCachedData('valid-key', fetcher, 300, { skipNull: true })
    expect(mockRedisSet).toHaveBeenCalledWith('valid-key', { valid: true }, 300)
  })

  it('DOES cache non-empty arrays when skipNull is true', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue([1, 2, 3])

    await getCachedData('arr-key', fetcher, 300, { skipNull: true })
    expect(mockRedisSet).toHaveBeenCalledWith('arr-key', [1, 2, 3], 300)
  })
})

// ---------------------------------------------------------------------------
// getCachedData — L1 TTL capped at 1 hour
// ---------------------------------------------------------------------------
describe('getCachedData — L1 TTL cap', () => {
  it('caps L1 memory TTL at 1 hour even when requested TTL is larger', async () => {
    mockRedisGet.mockResolvedValue(null)
    const fetcher = vi.fn().mockResolvedValue('long-ttl')

    await getCachedData('long-ttl-key', fetcher, 86400) // 24h requested

    // L1 TTL should be capped at 3600s (1h)
    // Verify by checking that at 3601 seconds, the L1 entry is expired
    const originalDateNow = Date.now
    const justAfterOneHour = Date.now() + 3601 * 1000
    Date.now = vi.fn(() => justAfterOneHour)

    mockRedisGet.mockResolvedValue(null)
    const fetcherSecond = vi.fn().mockResolvedValue('refreshed')
    const result = await getCachedData('long-ttl-key', fetcherSecond, 86400)

    // Should have called fetcher again because L1 expired at 1h
    expect(fetcherSecond).toHaveBeenCalledTimes(1)
    expect(result).toBe('refreshed')

    Date.now = originalDateNow
  })
})
