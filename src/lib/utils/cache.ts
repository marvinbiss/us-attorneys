/**
 * Intelligent Caching System
 * Memory cache with TTL, LRU eviction, and stale-while-revalidate
 */

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number
  /** Maximum number of items in cache */
  maxSize?: number
  /** Stale-while-revalidate window in milliseconds */
  staleWhileRevalidate?: number
  /** Callback when item is evicted */
  onEvict?: (key: string, value: unknown) => void
}

interface CacheEntry<T> {
  value: T
  createdAt: number
  expiresAt: number
  hits: number
  lastAccess: number
}

const DEFAULT_TTL = 60 * 60 * 1000 // 1 hour
const DEFAULT_MAX_SIZE = 1000

/**
 * Memory Cache with LRU eviction
 */
export class MemoryCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private readonly ttl: number
  private readonly maxSize: number
  private readonly staleWhileRevalidate: number
  private readonly onEvict?: (key: string, value: T) => void
  private revalidating: Set<string> = new Set()

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? DEFAULT_TTL
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
    this.staleWhileRevalidate = options.staleWhileRevalidate ?? 0
    this.onEvict = options.onEvict as ((key: string, value: T) => void) | undefined
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    const now = Date.now()

    // Check if expired
    if (now > entry.expiresAt) {
      // Check stale-while-revalidate window
      if (this.staleWhileRevalidate > 0 &&
          now < entry.expiresAt + this.staleWhileRevalidate) {
        // Return stale value, mark for revalidation
        entry.hits++
        entry.lastAccess = now
        return entry.value
      }

      // Fully expired
      this.delete(key)
      return undefined
    }

    // Update stats
    entry.hits++
    entry.lastAccess = now

    return entry.value
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    const now = Date.now()
    const effectiveTtl = ttl ?? this.ttl

    this.cache.set(key, {
      value,
      createdAt: now,
      expiresAt: now + effectiveTtl,
      hits: 0,
      lastAccess: now,
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry && this.onEvict) {
      this.onEvict(key, entry.value)
    }
    return this.cache.delete(key)
  }

  /**
   * Clear all entries
   */
  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => {
        this.onEvict!(key, entry.value)
      })
    }
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    oldestEntry: number | null
    newestEntry: number | null
  } {
    let totalHits = 0
    let oldestEntry: number | null = null
    let newestEntry: number | null = null

    this.cache.forEach((entry) => {
      totalHits += entry.hits
      if (oldestEntry === null || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt
      }
      if (newestEntry === null || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt
      }
    })

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      oldestEntry,
      newestEntry,
    }
  }

  /**
   * Check if key is stale (in SWR window)
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    return now > entry.expiresAt && now < entry.expiresAt + this.staleWhileRevalidate
  }

  /**
   * Mark key as being revalidated
   */
  markRevalidating(key: string): void {
    this.revalidating.add(key)
  }

  /**
   * Check if key is being revalidated
   */
  isRevalidating(key: string): boolean {
    return this.revalidating.has(key)
  }

  /**
   * Clear revalidation flag
   */
  clearRevalidating(key: string): void {
    this.revalidating.delete(key)
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null
    let lruAccess = Infinity

    this.cache.forEach((entry, key) => {
      if (entry.lastAccess < lruAccess) {
        lruAccess = entry.lastAccess
        lruKey = key
      }
    })

    if (lruKey) {
      this.delete(lruKey)
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt + this.staleWhileRevalidate) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      this.delete(key)
      cleaned++
    })

    return cleaned
  }
}

/**
 * Cache-aside pattern helper
 */
export async function cacheAside<T>(
  cache: MemoryCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; forceRefresh?: boolean } = {}
): Promise<T> {
  // Force refresh
  if (options.forceRefresh) {
    const value = await fetcher()
    cache.set(key, value, options.ttl)
    return value
  }

  // Try cache first
  const cached = cache.get(key)
  if (cached !== undefined) {
    // If stale, trigger background revalidation
    if (cache.isStale(key) && !cache.isRevalidating(key)) {
      cache.markRevalidating(key)
      fetcher()
        .then((value) => {
          cache.set(key, value, options.ttl)
        })
        .catch(() => {
          // Ignore background refresh errors
        })
        .finally(() => {
          cache.clearRevalidating(key)
        })
    }
    return cached
  }

  // Fetch and cache
  const value = await fetcher()
  cache.set(key, value, options.ttl)
  return value
}

/**
 * Memoization decorator
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: CacheOptions & {
    keyGenerator?: (...args: TArgs) => string
  } = {}
): (...args: TArgs) => Promise<TReturn> {
  const cache = new MemoryCache<TReturn>(options)
  const keyGen = options.keyGenerator || ((...args) => JSON.stringify(args))

  return async (...args: TArgs): Promise<TReturn> => {
    const key = keyGen(...args)
    return cacheAside(cache, key, () => fn(...args))
  }
}

// Global cache instances
export const apiCache = new MemoryCache({
  ttl: 60 * 60 * 1000,    // 1 hour
  maxSize: 500,
  staleWhileRevalidate: 5 * 60 * 1000, // 5 minutes
})

export const searchCache = new MemoryCache({
  ttl: 5 * 60 * 1000,     // 5 minutes
  maxSize: 200,
})

export const geocodeCache = new MemoryCache({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 1000,
})

// Periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
    searchCache.cleanup()
    geocodeCache.cleanup()
  }, 5 * 60 * 1000) // Every 5 minutes
}
