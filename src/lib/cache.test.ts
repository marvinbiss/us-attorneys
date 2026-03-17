import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCachedData,
  invalidateCache,
  clearCache,
  getCacheStats,
  generateCacheKey,
  dedupeRequest,
} from './cache'

// Redis is disabled in test env (no UPSTASH_REDIS_REST_URL/TOKEN),
// so only L1 in-memory layer is active.

beforeEach(() => {
  clearCache()
})

describe('getCachedData', () => {
  it('calls fetcher on cache miss', async () => {
    const fetcher = vi.fn().mockResolvedValue({ foo: 'bar' })
    const result = await getCachedData('test:miss', fetcher, 60)
    expect(fetcher).toHaveBeenCalledOnce()
    expect(result).toEqual({ foo: 'bar' })
  })

  it('returns cached value on L1 hit without calling fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue(42)
    await getCachedData('test:hit', fetcher, 60)
    const result = await getCachedData('test:hit', fetcher, 60)
    expect(fetcher).toHaveBeenCalledOnce()
    expect(result).toBe(42)
  })

  it('caches array results', async () => {
    const fetcher = vi.fn().mockResolvedValue([1, 2, 3])
    await getCachedData('test:arr', fetcher, 60)
    const result = await getCachedData('test:arr', fetcher, 60)
    expect(fetcher).toHaveBeenCalledOnce()
    expect(result).toEqual([1, 2, 3])
  })

  it('does not cache null when skipNull is true', async () => {
    const fetcher = vi.fn().mockResolvedValue(null)
    await getCachedData('test:null', fetcher, 60, { skipNull: true })
    await getCachedData('test:null', fetcher, 60, { skipNull: true })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not cache empty array when skipNull is true', async () => {
    const fetcher = vi.fn().mockResolvedValue([])
    await getCachedData('test:empty', fetcher, 60, { skipNull: true })
    await getCachedData('test:empty', fetcher, 60, { skipNull: true })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('caches null when skipNull is not set', async () => {
    const fetcher = vi.fn().mockResolvedValue(null)
    await getCachedData('test:null-cached', fetcher, 60)
    await getCachedData('test:null-cached', fetcher, 60)
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('isolates different cache keys', async () => {
    const f1 = vi.fn().mockResolvedValue('value1')
    const f2 = vi.fn().mockResolvedValue('value2')
    const r1 = await getCachedData('key:1', f1, 60)
    const r2 = await getCachedData('key:2', f2, 60)
    expect(r1).toBe('value1')
    expect(r2).toBe('value2')
    expect(f1).toHaveBeenCalledOnce()
    expect(f2).toHaveBeenCalledOnce()
  })
})

describe('invalidateCache', () => {
  it('removes entry by exact string key', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    await getCachedData('inv:exact', fetcher, 60)
    invalidateCache('inv:exact')
    await getCachedData('inv:exact', fetcher, 60)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('removes matching entries by regex', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    await getCachedData('inv:a:1', fetcher, 60)
    await getCachedData('inv:a:2', fetcher, 60)
    await getCachedData('inv:b:1', fetcher, 60)
    invalidateCache(/^inv:a:/)
    // inv:a:* should be re-fetched, inv:b:* should still be cached
    const f2 = vi.fn().mockResolvedValue('data')
    await getCachedData('inv:a:1', f2, 60)
    await getCachedData('inv:a:2', f2, 60)
    await getCachedData('inv:b:1', f2, 60)
    expect(f2).toHaveBeenCalledTimes(2) // only a:1 and a:2 re-fetched
  })

  it('is a no-op for non-existent key', () => {
    expect(() => invalidateCache('nonexistent')).not.toThrow()
  })
})

describe('clearCache', () => {
  it('removes all L1 entries', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    await getCachedData('clear:1', fetcher, 60)
    await getCachedData('clear:2', fetcher, 60)
    clearCache()
    expect(getCacheStats().size).toBe(0)
  })
})

describe('getCacheStats', () => {
  it('returns zero size on empty cache', () => {
    const stats = getCacheStats()
    expect(stats.size).toBe(0)
    expect(stats.keys).toEqual([])
  })

  it('tracks stored keys', async () => {
    await getCachedData('stats:1', () => Promise.resolve(1), 60)
    await getCachedData('stats:2', () => Promise.resolve(2), 60)
    const stats = getCacheStats()
    expect(stats.size).toBe(2)
    expect(stats.keys).toContain('stats:1')
    expect(stats.keys).toContain('stats:2')
  })
})

describe('generateCacheKey', () => {
  it('produces deterministic output', () => {
    const key1 = generateCacheKey('prefix', { a: 1, b: 'x' })
    const key2 = generateCacheKey('prefix', { a: 1, b: 'x' })
    expect(key1).toBe(key2)
  })

  it('sorts params alphabetically', () => {
    const key1 = generateCacheKey('p', { z: 1, a: 2 })
    const key2 = generateCacheKey('p', { a: 2, z: 1 })
    expect(key1).toBe(key2)
  })

  it('uses prefix correctly', () => {
    const key = generateCacheKey('attorneys', { city: 'new-york' })
    expect(key.startsWith('attorneys:')).toBe(true)
  })

  it('different params produce different keys', () => {
    const key1 = generateCacheKey('p', { x: 1 })
    const key2 = generateCacheKey('p', { x: 2 })
    expect(key1).not.toBe(key2)
  })
})

describe('dedupeRequest', () => {
  it('deduplicates concurrent requests with same key', async () => {
    let callCount = 0
    const fetcher = () => new Promise<string>((resolve) => {
      callCount++
      setTimeout(() => resolve('result'), 10)
    })

    const [r1, r2, r3] = await Promise.all([
      dedupeRequest('dedup:key', fetcher),
      dedupeRequest('dedup:key', fetcher),
      dedupeRequest('dedup:key', fetcher),
    ])

    expect(callCount).toBe(1)
    expect(r1).toBe('result')
    expect(r2).toBe('result')
    expect(r3).toBe('result')
  })

  it('allows new request after previous completes', async () => {
    let callCount = 0
    const fetcher = () => Promise.resolve(++callCount)

    await dedupeRequest('dedup:seq', fetcher)
    await dedupeRequest('dedup:seq', fetcher)

    expect(callCount).toBe(2)
  })

  it('isolates different keys', async () => {
    const f1 = vi.fn().mockResolvedValue('a')
    const f2 = vi.fn().mockResolvedValue('b')

    const [r1, r2] = await Promise.all([
      dedupeRequest('dedup:x', f1),
      dedupeRequest('dedup:y', f2),
    ])

    expect(r1).toBe('a')
    expect(r2).toBe('b')
    expect(f1).toHaveBeenCalledOnce()
    expect(f2).toHaveBeenCalledOnce()
  })
})
