import { CacheService } from '@/lib/cache/redis-client'

// L1: in-memory (fast path, same Lambda invocation)
const memoryCache = new Map<string, { data: unknown; expiry: number }>()

// L2: Redis (shared across all Vercel instances)
const redisCache = new CacheService('sa:cache:')

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  services: 86400,  // 24 hours — services almost never change
  artisans: 3600,   // 1 hour — attorney profiles rarely change
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
 * Get cached data or fetch new data.
 * L1 (memory) → L2 (Redis) → fetcher
 * When skipNull is true, null/empty results are NOT cached (prevents caching DB errors).
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300,
  options?: { skipNull?: boolean }
): Promise<T> {
  // L1: in-memory hit (same Lambda invocation — zero latency)
  const memHit = memoryCache.get(key)
  if (memHit && memHit.expiry > Date.now()) {
    return memHit.data as T
  }

  // L2: Redis hit (shared across all instances — ~1ms)
  const redisHit = await redisCache.get<T>(key)
  if (redisHit !== null) {
    // Warm L1 from Redis hit to avoid repeated Redis calls within same invocation
    memoryCache.set(key, { data: redisHit, expiry: Date.now() + Math.min(ttl, 60) * 1000 })
    return redisHit
  }

  // Cache miss: fetch fresh data
  const data = await fetcher()

  const shouldSkip = options?.skipNull && (
    data === null ||
    data === undefined ||
    (Array.isArray(data) && data.length === 0)
  )

  if (!shouldSkip) {
    // Write to both layers (fire-and-forget Redis to not block the response)
    redisCache.set(key, data, ttl).catch(() => {})
    memoryCache.set(key, { data, expiry: Date.now() + Math.min(ttl, 60) * 1000 })
  }

  return data
}

/**
 * Invalidate cache by key or pattern
 */
export function invalidateCache(keyOrPattern: string | RegExp): void {
  if (typeof keyOrPattern === 'string') {
    memoryCache.delete(keyOrPattern)
    redisCache.delete(keyOrPattern).catch(() => {})
  } else {
    for (const key of Array.from(memoryCache.keys())) {
      if (keyOrPattern.test(key)) {
        memoryCache.delete(key)
        redisCache.delete(key).catch(() => {})
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
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
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
