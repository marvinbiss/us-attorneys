/**
 * Rate Limiter Service - US Attorneys
 * Uses Redis (Upstash) for distributed rate limiting in production
 * Falls back to in-memory for development
 */

import { logger } from './logger'

// Types
export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  failOpen?: boolean // default true for webhooks, false for auth
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  error?: string
}

/** Legacy config shape — internal only, mapped from RateLimitConfig */
interface InternalConfig {
  window: number
  max: number
  failOpen?: boolean
}

/** Convert public RateLimitConfig to internal shape */
function toInternal(config: RateLimitConfig): InternalConfig {
  return { window: config.windowMs, max: config.maxRequests, failOpen: config.failOpen }
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

  /**
   * Lua script for atomic sliding-window rate limiting.
   * Executes ZADD + ZREMRANGEBYSCORE + ZCARD + PEXPIRE in a single
   * Redis EVAL call, eliminating the race condition where concurrent
   * requests could all pass the count check before any cleanup runs.
   *
   * KEYS[1] = sorted-set key
   * ARGV[1] = current timestamp (ms)
   * ARGV[2] = window start (now - windowMs)
   * ARGV[3] = window TTL (ms)
   * ARGV[4] = max allowed requests
   *
   * Returns {count, allowed} — count AFTER cleanup, allowed = 1 or 0.
   * If over limit, the just-added member is removed atomically.
   */
  private static readonly RATE_LIMIT_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window_start = tonumber(ARGV[2])
local window_ms = tonumber(ARGV[3])
local max_requests = tonumber(ARGV[4])

redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
redis.call('ZADD', key, now, tostring(now) .. ':' .. tostring(math.random(1000000)))
local count = redis.call('ZCARD', key)
redis.call('PEXPIRE', key, window_ms)

if count > max_requests then
  redis.call('ZPOPMAX', key)
  count = count - 1
  return {count, 0}
end

return {count, 1}
`

  async checkRateLimit(key: string, config: InternalConfig): Promise<RateLimitResult> {
    const now = Date.now()
    const windowKey = `ratelimit:${key}`
    const windowMs = config.window

    try {
      // Atomic sliding window via Lua script — no race condition
      const result = await this.redisCommand([
        'EVAL',
        UpstashRateLimiter.RATE_LIMIT_LUA,
        '1',              // number of KEYS
        windowKey,         // KEYS[1]
        String(now),       // ARGV[1] — current timestamp
        String(now - windowMs), // ARGV[2] — window start
        String(windowMs),  // ARGV[3] — TTL
        String(config.max) // ARGV[4] — max requests
      ]) as [number, number]

      const count = result[0]
      const allowed = result[1] === 1
      const remaining = Math.max(0, config.max - count)
      const resetTime = now + windowMs

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
  checkRateLimit(key: string, config: InternalConfig): RateLimitResult {
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
  auth: { maxRequests: 5, windowMs: 60_000, failOpen: false },             // 5 requests per minute for auth — fail-close (brute force prevention)
  api: { maxRequests: 60, windowMs: 60_000, failOpen: true },              // 60 requests per minute for general API
  booking: { maxRequests: 10, windowMs: 60_000 },                          // 10 requests per minute for bookings
  payment: { maxRequests: 10, windowMs: 60_000, failOpen: false },         // 10 requests per minute for payments — fail-close
  reviews: { maxRequests: 5, windowMs: 60_000 },                           // 5 requests per minute for reviews
  quotes: { maxRequests: 10, windowMs: 60_000 },                           // 10 requests per minute for quotes
  contact: { maxRequests: 3, windowMs: 60_000, failOpen: true },           // 3 requests per minute for contact (sends email, unauthenticated)
  upload: { maxRequests: 5, windowMs: 60_000 },                            // 5 uploads per minute (storage-intensive)
  search: { maxRequests: 100, windowMs: 60_000, failOpen: true },          // 100 searches per minute
  gdpr: { maxRequests: 5, windowMs: 300_000 },                             // 5 requests per 5 minutes for GDPR export/delete
  newsletter: { maxRequests: 3, windowMs: 300_000 },                       // 3 requests per 5 minutes for newsletter (sends email)
  registration: { maxRequests: 3, windowMs: 300_000 },                     // 3 requests per 5 minutes for attorney registration (sends emails)
  ai: { maxRequests: 10, windowMs: 60_000 },                               // 10 requests per minute for AI generation (expensive)
  estimation: { maxRequests: 15, windowMs: 60_000, failOpen: true },       // 15 messages per minute for estimation chat — fail open
  estimationLead: { maxRequests: 3, windowMs: 300_000, failOpen: true },   // 3 leads per 5 minutes for estimation lead capture — fail open
  verify: { maxRequests: 20, windowMs: 60_000 },                           // 20 requests per minute for bar number/business verification
  geocode: { maxRequests: 60, windowMs: 60_000 },                          // 60 requests per minute for geocoding
  vapiWebhook: { maxRequests: 300, windowMs: 60_000, failOpen: true },     // 300/min for VAPI voice webhooks — fail open
  webhook: { maxRequests: 200, windowMs: 60_000, failOpen: true },         // 200/min for external webhooks (Resend, Twilio) — fail open
  cron: { maxRequests: 100, windowMs: 60_000, failOpen: true },            // 100/min for cron jobs — fail open
  analytics: { maxRequests: 120, windowMs: 60_000, failOpen: true },       // 120/min for analytics beacons — fail open
  default: { maxRequests: 100, windowMs: 60_000 },                         // 100 requests per minute default
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

  // VAPI voice webhooks — very high throughput, fail-open
  if (pathname.startsWith('/api/vapi')) return RATE_LIMITS.vapiWebhook

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

  // Quotes — create, list
  if (pathname.startsWith('/api/quotes') || pathname.startsWith('/api/attorney/quotes')) return RATE_LIMITS.quotes

  // Contact form — sends email, unauthenticated
  if (pathname.startsWith('/api/contact')) return RATE_LIMITS.contact

  // GDPR — data export and account deletion (expensive DB operations)
  if (pathname.startsWith('/api/gdpr')) return RATE_LIMITS.gdpr

  // Newsletter — sends welcome email, unauthenticated
  if (pathname.startsWith('/api/newsletter')) return RATE_LIMITS.newsletter

  // Attorney registration — sends 2 emails, unauthenticated
  if (pathname.startsWith('/api/register-attorney')) return RATE_LIMITS.registration

  // Bar number / business verification — external API calls
  if (pathname.startsWith('/api/verify')) return RATE_LIMITS.verify

  // Geocoding — external address API calls
  if (pathname.startsWith('/api/geocode')) return RATE_LIMITS.geocode

  // File uploads (any route containing /upload)
  if (pathname.includes('/upload')) return RATE_LIMITS.upload

  // Analytics beacons — public, high throughput, fail-open
  if (pathname.startsWith('/api/analytics')) return RATE_LIMITS.analytics

  // Search and public listing endpoints — scraping prevention
  if (pathname.startsWith('/api/search') || pathname.startsWith('/api/attorneys/listing') || pathname.startsWith('/api/attorneys/by-city')) return RATE_LIMITS.search

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
 * Check rate limit for a request (low-level — prefer rateLimit() helper)
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getRateLimiter()
  const internal = toInternal(config)

  if (limiter instanceof UpstashRateLimiter) {
    return limiter.checkRateLimit(key, internal)
  }

  return limiter.checkRateLimit(key, internal)
}

/**
 * Utility to extract IP from request headers
 */
export function getClientIp(hdrs: Headers): string {
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdrs.get('x-real-ip') ||
    hdrs.get('cf-connecting-ip') ||  // Cloudflare
    'unknown'
}

/**
 * High-level rate limit helper for use directly in API route handlers.
 *
 * Usage:
 *   const rl = await rateLimit(request, RATE_LIMITS.auth)
 *   if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const ip = getClientIp(request.headers)
    const url = new URL(request.url)
    const key = getRateLimitKey(ip, url.pathname)
    const result = await checkRateLimit(key, config)
    return {
      success: result.allowed,
      remaining: result.remaining,
      reset: result.resetTime,
    }
  } catch (error) {
    logger.error('rateLimit() unexpected error:', error)
    // Fail-open by default (config.failOpen !== false means open)
    const failOpen = config.failOpen !== false
    return {
      success: failOpen,
      remaining: failOpen ? config.maxRequests : 0,
      reset: Date.now() + config.windowMs,
    }
  }
}

export default {
  checkRateLimit,
  rateLimit,
  getRateLimitConfig,
  getRateLimitKey,
  getClientIp,
  RATE_LIMITS,
}
