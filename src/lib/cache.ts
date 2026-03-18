import { CacheService } from '@/lib/cache/redis-client'
import { logger } from '@/lib/logger'

// ─── LRU Cache Implementation ────────────────────────────────────────

interface LRUEntry<T = unknown> {
  data: T
  expiry: number
  prev: string | null
  next: string | null
}

/**
 * Simple LRU cache with max entry limit.
 * Doubly-linked list via prev/next keys for O(1) eviction + promotion.
 */
class LRUCache {
  private store = new Map<string, LRUEntry>()
  private head: string | null = null // Most recently used
  private tail: string | null = null // Least recently used
  private maxSize: number
  private evictions = 0

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  private detach(key: string): void {
    const entry = this.store.get(key)
    if (!entry) return

    if (entry.prev) {
      const prevEntry = this.store.get(entry.prev)
      if (prevEntry) prevEntry.next = entry.next
    } else {
      this.head = entry.next
    }

    if (entry.next) {
      const nextEntry = this.store.get(entry.next)
      if (nextEntry) nextEntry.prev = entry.prev
    } else {
      this.tail = entry.prev
    }

    entry.prev = null
    entry.next = null
  }

  private pushToHead(key: string): void {
    const entry = this.store.get(key)
    if (!entry) return

    entry.next = null
    entry.prev = null

    if (!this.head) {
      this.head = key
      this.tail = key
      return
    }

    const currentHead = this.store.get(this.head)
    if (currentHead) {
      currentHead.next = key
      entry.prev = this.head
    }
    this.head = key
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined

    if (entry.expiry <= Date.now()) {
      this.delete(key)
      return undefined
    }

    // Promote to head (most recently used)
    this.detach(key)
    this.pushToHead(key)

    return entry.data as T
  }

  set(key: string, data: unknown, expiry: number): void {
    // If key exists, update in place
    if (this.store.has(key)) {
      this.detach(key)
      const entry = this.store.get(key)!
      entry.data = data
      entry.expiry = expiry
      this.pushToHead(key)
      return
    }

    // Evict LRU entries if at capacity
    while (this.store.size >= this.maxSize && this.tail) {
      const evictKey = this.tail
      this.delete(evictKey)
      this.evictions++
    }

    // Insert new entry
    this.store.set(key, { data, expiry, prev: null, next: null })
    this.pushToHead(key)
  }

  delete(key: string): void {
    if (!this.store.has(key)) return
    this.detach(key)
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
    this.head = null
    this.tail = null
  }

  get size(): number {
    return this.store.size
  }

  get evictionCount(): number {
    return this.evictions
  }

  keys(): string[] {
    return Array.from(this.store.keys())
  }
}

// ─── Cache Metrics ───────────────────────────────────────────────────

interface CacheMetrics {
  l1: { hits: number; misses: number; size: number; evictions: number; hitRate: number }
  l2: { hits: number; misses: number; hitRate: number }
  total: { hits: number; misses: number; hitRate: number; requests: number }
}

let l1Hits = 0
let l1Misses = 0
let l2Hits = 0
let l2Misses = 0
let totalRequests = 0

/** Metrics logging interval (every N requests) */
const METRICS_LOG_INTERVAL = 100

// ─── Cache Instances ─────────────────────────────────────────────────

// L1: in-memory LRU (fast path, same Lambda invocation — max 1000 entries)
const memoryCache = new LRUCache(1000)

// L2: Redis (shared across all Vercel instances)
const redisCache = new CacheService('usa:cache:')

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  services: 86400,  // 24 hours — services almost never change
  attorneys: 3600,  // 1 hour — attorney profiles rarely change
  reviews: 3600,    // 1 hour — reviews rarely change
  locations: 604800,// 7 days — locations never change
  stats: 86400,     // 24 hours — stats recalculated by daily cron
  cms: 3600,        // 1 hour — CMS content rarely changes
} as const

// ISR Revalidation times (in seconds)
export const REVALIDATE = {
  services: 86400,
  serviceDetail: 86400,
  serviceLocation: 86400,
  attorneyProfile: 86400,
  locations: 86400,
  blog: 86400,
  staticPages: 86400,
  cms: 3600,
} as const

/**
 * Get cache metrics snapshot.
 * Returns hit/miss rates for L1, L2, and combined.
 */
export function getCacheMetrics(): CacheMetrics {
  const l1Total = l1Hits + l1Misses
  const l2Total = l2Hits + l2Misses

  return {
    l1: {
      hits: l1Hits,
      misses: l1Misses,
      size: memoryCache.size,
      evictions: memoryCache.evictionCount,
      hitRate: l1Total > 0 ? Math.round((l1Hits / l1Total) * 10000) / 100 : 0,
    },
    l2: {
      hits: l2Hits,
      misses: l2Misses,
      hitRate: l2Total > 0 ? Math.round((l2Hits / l2Total) * 10000) / 100 : 0,
    },
    total: {
      hits: l1Hits + l2Hits,
      misses: l2Misses, // Only L2 misses count as true misses (L1 miss falls through to L2)
      hitRate: totalRequests > 0
        ? Math.round(((l1Hits + l2Hits) / totalRequests) * 10000) / 100
        : 0,
      requests: totalRequests,
    },
  }
}

/**
 * Log metrics periodically (every METRICS_LOG_INTERVAL requests).
 */
function maybeLogMetrics(): void {
  totalRequests++
  if (totalRequests % METRICS_LOG_INTERVAL === 0) {
    const metrics = getCacheMetrics()
    logger.warn('[Cache] Metrics snapshot', {
      l1HitRate: `${metrics.l1.hitRate}%`,
      l2HitRate: `${metrics.l2.hitRate}%`,
      totalHitRate: `${metrics.total.hitRate}%`,
      l1Size: metrics.l1.size,
      l1Evictions: metrics.l1.evictions,
      totalRequests: metrics.total.requests,
    })
  }
}

/**
 * Get cached data or fetch new data.
 * L1 (memory LRU) -> L2 (Redis) -> fetcher
 * When skipNull is true, null/empty results are NOT cached (prevents caching DB errors).
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300,
  options?: { skipNull?: boolean }
): Promise<T> {
  maybeLogMetrics()

  // L1: in-memory LRU hit (same Lambda invocation — zero latency)
  const memHit = memoryCache.get<T>(key)
  if (memHit !== undefined) {
    l1Hits++
    return memHit
  }
  l1Misses++

  // L2: Redis hit (shared across all instances — ~1ms)
  const redisHit = await redisCache.get<T>(key)
  if (redisHit !== null) {
    l2Hits++
    // Warm L1 from Redis hit to avoid repeated Redis calls within same invocation
    memoryCache.set(key, redisHit, Date.now() + Math.min(ttl, 3600) * 1000)
    return redisHit
  }
  l2Misses++

  // Cache miss: fetch fresh data
  const data = await fetcher()

  const shouldSkip = options?.skipNull && (
    data === null ||
    data === undefined ||
    (Array.isArray(data) && data.length === 0)
  )

  if (!shouldSkip) {
    // Write to both layers (fire-and-forget Redis to not block the response)
    redisCache.set(key, data, ttl).catch((err) => logger.warn('[cache] Redis SET failed (non-blocking)', { key, error: (err as Error).message }))
    memoryCache.set(key, data, Date.now() + Math.min(ttl, 3600) * 1000)
  }

  return data
}

/**
 * Invalidate cache by key or pattern
 */
export function invalidateCache(keyOrPattern: string | RegExp): void {
  if (typeof keyOrPattern === 'string') {
    memoryCache.delete(keyOrPattern)
    redisCache.delete(keyOrPattern).catch((err) => logger.warn('[cache] Redis DELETE failed', { key: keyOrPattern, error: (err as Error).message }))
  } else {
    for (const key of memoryCache.keys()) {
      if (keyOrPattern.test(key)) {
        memoryCache.delete(key)
        redisCache.delete(key).catch((err) => logger.warn('[cache] Redis DELETE failed', { key, error: (err as Error).message }))
      }
    }
  }
}

/**
 * Clear entire cache (memory only — Redis keys expire naturally via TTL)
 */
export function clearCache(): void {
  memoryCache.clear()
}

/**
 * Get cache stats (backward-compatible with existing callers)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: memoryCache.size,
    keys: memoryCache.keys(),
  }
}

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return `${prefix}:${sortedParams}`
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 300
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    return getCachedData(key, () => fn(...args), ttl)
  }) as T
}

/**
 * Deduplicate concurrent requests (in-memory, per-invocation)
 */
const pendingRequests = new Map<string, Promise<unknown>>()

export async function dedupeRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const pending = pendingRequests.get(key)
  if (pending) return pending as Promise<T>

  const request = fetcher().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, request)
  return request
}
