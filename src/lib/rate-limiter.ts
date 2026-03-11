/**
 * Rate Limiter Service - ServicesArtisans
 * Uses Redis (Upstash) for distributed rate limiting in production
 * Falls back to in-memory for development
 */

import { logger } from './logger'

// Types
interface RateLimitConfig {
  window: number    // Time window in milliseconds
  max: number       // Maximum requests in window
  failOpen?: boolean // If true, allow requests when Redis is unavailable (default: false = fail-close)
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  error?: string
}

// Environment detection
const isProduction = process.env.NODE_ENV === 'production'
const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Upstash Redis Rate Limiter
 * Uses REST API for serverless compatibility
 */
class UpstashRateLimiter {
  private baseUrl: string
  private token: string

  constructor() {
    this.baseUrl = process.env.UPSTASH_REDIS_REST_URL || ''
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  }

  private async redisCommand(command: string[]): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    })

    if (!response.ok) {
      throw new Error(`Redis error: ${response.status}`)
    }

    const data = await response.json()
    return data.result
  }

  async checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now()
    const windowKey = `ratelimit:${key}`
    const windowMs = config.window

    try {
      // Use sliding window algorithm with Redis
      // MULTI/EXEC equivalent using pipeline
      const pipeline = [
        ['ZADD', windowKey, String(now), String(now)],
        ['ZREMRANGEBYSCORE', windowKey, '0', String(now - windowMs)],
        ['ZCARD', windowKey],
        ['PEXPIRE', windowKey, String(windowMs)],
      ]

      // Execute commands
      for (const cmd of pipeline.slice(0, 2)) {
        await this.redisCommand(cmd)
      }

      const count = await this.redisCommand(['ZCARD', windowKey]) as number
      await this.redisCommand(['PEXPIRE', windowKey, String(windowMs)])

      const allowed = count <= config.max
      const remaining = Math.max(0, config.max - count)
      const resetTime = now + windowMs

      if (!allowed) {
        // Remove the request we just added since it's over limit
        await this.redisCommand(['ZREM', windowKey, String(now)])
      }

      return { allowed, remaining, resetTime }
    } catch (error) {
      logger.error('Redis rate limit error:', error)

      // Fail-close by default: deny requests when Redis is unavailable.
      // Only fall back to allowing requests when failOpen is explicitly true.
      if (config.failOpen === true) {
        logger.warn('Rate limiter: Redis unavailable, failOpen=true — using in-memory fallback')
        return memoryLimiter.checkRateLimit(`fallback:${key}`, config)
      }

      logger.warn('Rate limiter: Redis unavailable, failOpen=false — denying request (fail-close)')
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + config.window,
        error: 'Rate limiter unavailable',
      }
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically
  }
}

/**
 * In-Memory Rate Limiter (development/fallback)
 */
class MemoryRateLimiter {
  checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const record = memoryStore.get(key)

    // Clean up old entries periodically
    if (memoryStore.size > 10000) {
      Array.from(memoryStore.entries()).forEach(([k, v]) => {
        if (now > v.resetTime) {
          memoryStore.delete(k)
        }
      })
    }

    // Reset if window expired
    if (!record || now > record.resetTime) {
      memoryStore.set(key, { count: 1, resetTime: now + config.window })
      return { allowed: true, remaining: config.max - 1, resetTime: now + config.window }
    }

    // Check if over limit
    if (record.count >= config.max) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    // Increment and allow
    record.count++
    return {
      allowed: true,
      remaining: config.max - record.count,
      resetTime: record.resetTime
    }
  }
}

// Singleton instances
let upstashLimiter: UpstashRateLimiter | null = null
const memoryLimiter = new MemoryRateLimiter()

/**
 * Get the appropriate rate limiter based on environment
 */
function getRateLimiter(): UpstashRateLimiter | MemoryRateLimiter {
  if (isProduction && hasRedis) {
    if (!upstashLimiter) {
      upstashLimiter = new UpstashRateLimiter()
    }
    return upstashLimiter
  }
  return memoryLimiter
}

// Rate limit configurations per route type
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { window: 60 * 1000, max: 10 },          // 10 requests per minute for auth
  api: { window: 60 * 1000, max: 60 },           // 60 requests per minute for general API
  booking: { window: 60 * 1000, max: 30 },       // 30 requests per minute for bookings
  payment: { window: 60 * 1000, max: 10 },       // 10 requests per minute for payments
  reviews: { window: 60 * 1000, max: 5 },        // 5 requests per minute for reviews
  devis: { window: 60 * 1000, max: 10 },         // 10 requests per minute for quotes
  contact: { window: 300 * 1000, max: 3 },       // 3 requests per 5 minutes for contact
  upload: { window: 60 * 1000, max: 20 },        // 20 uploads per minute
  search: { window: 60 * 1000, max: 100 },       // 100 searches per minute
  gdpr: { window: 300 * 1000, max: 5 },          // 5 requests per 5 minutes for GDPR export/delete
  newsletter: { window: 300 * 1000, max: 3 },    // 3 requests per 5 minutes for newsletter (sends email)
  inscription: { window: 300 * 1000, max: 3 },   // 3 requests per 5 minutes for artisan registration (sends emails)
  ai: { window: 60 * 1000, max: 10 },            // 10 requests per minute for AI generation (expensive)
  estimation: { window: 60 * 1000, max: 15 },    // 15 messages per minute for estimation chat
  estimationLead: { window: 300 * 1000, max: 3 }, // 3 leads per 5 minutes for estimation lead capture (anti-spam)
  verify: { window: 60 * 1000, max: 20 },        // 20 requests per minute for SIRET/entreprise verification (external API)
  geocode: { window: 60 * 1000, max: 60 },       // 60 requests per minute for geocoding (external API)
  webhook: { window: 60 * 1000, max: 200, failOpen: true }, // 200/min for external webhooks (Resend, Twilio) — fail open
  cron: { window: 60 * 1000, max: 10, failOpen: true },     // 10/min for cron jobs — fail open so cron runs don't fail
  analytics: { window: 60 * 1000, max: 120, failOpen: true }, // 120/min for analytics beacons — fail open
  default: { window: 60 * 1000, max: 100 },      // 100 requests per minute default
}

/**
 * Get rate limit configuration for a given pathname
 *
 * Order matters: more specific prefixes MUST come before generic ones.
 * e.g. /api/admin/prospection/ai must match before /api/admin
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Auth — signin, signup, password reset, 2FA, OAuth
  if (pathname.startsWith('/api/auth')) return RATE_LIMITS.auth

  // Payments — Stripe checkout, portal, webhook
  if (pathname.startsWith('/api/payments') || pathname.startsWith('/api/stripe')) return RATE_LIMITS.payment

  // Cron jobs — Vercel cron triggers, must not be blocked
  if (pathname.startsWith('/api/cron')) return RATE_LIMITS.cron

  // External service webhooks (Resend, Twilio) — high throughput, fail-open
  if (pathname.startsWith('/api/admin/prospection/webhooks')) return RATE_LIMITS.webhook

  // AI generation — expensive external API calls (Claude, OpenAI)
  if (pathname.startsWith('/api/admin/prospection/ai')) return RATE_LIMITS.ai

  // Estimation lead capture — anti-spam (must match before /api/estimation)
  if (pathname.startsWith('/api/estimation/lead')) return RATE_LIMITS.estimationLead

  // Estimation chat — 15 messages/min
  if (pathname.startsWith('/api/estimation')) return RATE_LIMITS.estimation

  // Bookings — create, cancel, reschedule
  if (pathname.startsWith('/api/bookings')) return RATE_LIMITS.booking

  // Reviews — create, vote, list
  if (pathname.startsWith('/api/reviews')) return RATE_LIMITS.reviews

  // Quotes / devis — create, list
  if (pathname.startsWith('/api/devis') || pathname.startsWith('/api/artisan/devis')) return RATE_LIMITS.devis

  // Contact form — sends email, unauthenticated
  if (pathname.startsWith('/api/contact')) return RATE_LIMITS.contact

  // GDPR — data export and account deletion (expensive DB operations)
  if (pathname.startsWith('/api/gdpr')) return RATE_LIMITS.gdpr

  // Newsletter — sends welcome email, unauthenticated
  if (pathname.startsWith('/api/newsletter')) return RATE_LIMITS.newsletter

  // Artisan registration — sends 2 emails, unauthenticated
  if (pathname.startsWith('/api/inscription-artisan')) return RATE_LIMITS.inscription

  // SIRET / entreprise verification — external INSEE API calls
  if (pathname.startsWith('/api/verify')) return RATE_LIMITS.verify

  // Geocoding — external address API calls
  if (pathname.startsWith('/api/geocode')) return RATE_LIMITS.geocode

  // File uploads (any route containing /upload)
  if (pathname.includes('/upload')) return RATE_LIMITS.upload

  // Analytics beacons — public, high throughput, fail-open
  if (pathname.startsWith('/api/analytics')) return RATE_LIMITS.analytics

  // Search and public listing endpoints — scraping prevention
  if (pathname.startsWith('/api/search') || pathname.startsWith('/api/providers/listing') || pathname.startsWith('/api/providers/by-city')) return RATE_LIMITS.search

  // All other API routes
  if (pathname.startsWith('/api/')) return RATE_LIMITS.api

  return RATE_LIMITS.default
}

/**
 * Generate rate limit key from request
 */
export function getRateLimitKey(ip: string, pathname: string): string {
  return `${ip}:${pathname}`
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getRateLimiter()

  if (limiter instanceof UpstashRateLimiter) {
    return limiter.checkRateLimit(key, config)
  }

  return limiter.checkRateLimit(key, config)
}

/**
 * Utility to extract IP from request headers
 */
export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||  // Cloudflare
    'unknown'
}

export default {
  checkRateLimit,
  getRateLimitConfig,
  getRateLimitKey,
  getClientIp,
  RATE_LIMITS,
}
