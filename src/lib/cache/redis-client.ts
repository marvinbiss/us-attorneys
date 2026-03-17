/**
 * Upstash Redis Cache Client — REST API (serverless-compatible)
 * Uses same UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN as rate-limiter
 */
import { logger } from '@/lib/logger'

const REST_URL = process.env.UPSTASH_REDIS_REST_URL
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const isAvailable = Boolean(REST_URL && REST_TOKEN)

async function redisCommand<T = unknown>(command: (string | number)[]): Promise<T | null> {
  if (!isAvailable) return null
  try {
    const res = await fetch(REST_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      // Crucial for Next.js: bypass fetch cache so Redis is always fresh
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json.result as T
  } catch (err) {
    logger.error('Redis command error', err as Error)
    return null
  }
}

export class CacheService {
  private prefix: string

  constructor(prefix = 'usa:') {
    this.prefix = prefix
  }

  private k(key: string) {
    return `${this.prefix}${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await redisCommand<string>(['GET', this.k(key)])
    if (value === null || value === undefined) return null
    try {
      return JSON.parse(value) as T
    } catch (err) {
      logger.warn('Redis cache: failed to parse JSON value, returning raw', { key, error: (err as Error).message })
      return value as unknown as T
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<boolean> {
    const result = await redisCommand(['SETEX', this.k(key), ttlSeconds, JSON.stringify(value)])
    return result === 'OK'
  }

  async delete(key: string): Promise<boolean> {
    const result = await redisCommand<number>(['DEL', this.k(key)])
    return (result ?? 0) > 0
  }

  async deletePattern(pattern: string): Promise<number> {
    const keys = await redisCommand<string[]>(['KEYS', this.k(pattern)])
    if (!keys || keys.length === 0) return 0
    const result = await redisCommand<number>(['DEL', ...keys])
    return result ?? 0
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached
    const value = await factory()
    await this.set(key, value, ttlSeconds)
    return value
  }

  async increment(key: string, ttlSeconds = 3600): Promise<number> {
    const value = await redisCommand<number>(['INCR', this.k(key)])
    if (value === 1) await redisCommand(['EXPIRE', this.k(key), ttlSeconds])
    return value ?? 0
  }

  async exists(key: string): Promise<boolean> {
    const result = await redisCommand<number>(['EXISTS', this.k(key)])
    return result === 1
  }

  async ttl(key: string): Promise<number> {
    return (await redisCommand<number>(['TTL', this.k(key)])) ?? -1
  }
}

// Default cache instance
export const cache = new CacheService()

/**
 * Minimal RateLimiter shim — delegates to Upstash REST (sliding window)
 * Used by src/middleware/rate-limit.ts
 */
export const rateLimiter = {
  async isAllowed(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now()
    const windowMs = windowSeconds * 1000
    const key = `usa:rl:${identifier}`

    try {
      await redisCommand(['ZADD', key, String(now), String(now)])
      await redisCommand(['ZREMRANGEBYSCORE', key, '0', String(now - windowMs)])
      const count = (await redisCommand<number>(['ZCARD', key])) ?? 0
      await redisCommand(['PEXPIRE', key, String(windowMs)])

      if (count > limit) {
        await redisCommand(['ZREM', key, String(now)])
        return { allowed: false, remaining: 0, resetAt: now + windowMs }
      }
      return { allowed: true, remaining: Math.max(0, limit - count), resetAt: now + windowMs }
    } catch (err) {
      logger.error('Rate limiter Redis error — failing open', err as Error)
      return { allowed: true, remaining: limit, resetAt: now + windowMs }
    }
  },
}

export default cache
