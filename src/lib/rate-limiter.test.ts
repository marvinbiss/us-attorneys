import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  getRateLimitConfig,
  getRateLimitKey,
  getClientIp,
  checkRateLimit,
  rateLimit,
  RATE_LIMITS,
} from './rate-limiter'

// In test env: NODE_ENV !== 'production' and no Redis → always uses MemoryRateLimiter

// ── P0.5: Lua script static analysis ───────────────────────────────────────
// Verify that the atomic Lua EVAL script contains the correct Redis commands
// and follows the correct ordering to prevent race conditions.

describe('Lua EVAL script correctness (P0.5)', () => {
  const source = fs.readFileSync(path.resolve(__dirname, 'rate-limiter.ts'), 'utf-8')

  it('contains ZADD command for adding the current request', () => {
    expect(source).toContain("redis.call('ZADD'")
  })

  it('contains ZREMRANGEBYSCORE for cleaning expired entries', () => {
    expect(source).toContain("redis.call('ZREMRANGEBYSCORE'")
  })

  it('contains ZCARD to count entries in the sliding window', () => {
    expect(source).toContain("redis.call('ZCARD'")
  })

  it('contains PEXPIRE to set TTL on the sorted set key', () => {
    expect(source).toContain("redis.call('PEXPIRE'")
  })

  it('contains ZPOPMAX to rollback the entry when over limit', () => {
    expect(source).toContain("redis.call('ZPOPMAX'")
  })

  it('EVAL command passes "1" for number of KEYS (single sorted-set key)', () => {
    // The EVAL invocation must specify exactly 1 key
    expect(source).toMatch(/'EVAL'[\s\S]*?'1'/)
  })

  it('runs ZREMRANGEBYSCORE before ZADD (cleanup before insert)', () => {
    const zremIdx = source.indexOf("redis.call('ZREMRANGEBYSCORE'")
    const zaddIdx = source.indexOf("redis.call('ZADD'")
    expect(zremIdx).toBeGreaterThan(-1)
    expect(zaddIdx).toBeGreaterThan(-1)
    expect(zremIdx).toBeLessThan(zaddIdx)
  })

  it('checks count > max_requests before invoking ZPOPMAX', () => {
    expect(source).toContain('if count > max_requests then')
  })

  it('decrements count after ZPOPMAX (atomicity: count = count - 1)', () => {
    expect(source).toContain('count = count - 1')
  })

  it('returns {count, 0} when over limit (denied)', () => {
    expect(source).toContain('return {count, 0}')
  })

  it('returns {count, 1} when under limit (allowed)', () => {
    expect(source).toContain('return {count, 1}')
  })

  it('uses math.random() in ZADD member to avoid same-ms collisions', () => {
    expect(source).toContain('math.random')
  })
})

// ── P0.5: Fail-open / fail-close semantics ─────────────────────────────────

describe('rateLimit() high-level helper', () => {
  it('returns success=true for allowed requests', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': `rl-helper-${Date.now()}` },
    })
    const result = await rateLimit(request, RATE_LIMITS.api)
    expect(result.success).toBe(true)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
    expect(result.reset).toBeGreaterThan(Date.now() - 1000)
  })

  it('returns success=false when rate limited', async () => {
    const ip = `rl-block-${Date.now()}`
    const config = { maxRequests: 1, windowMs: 60_000 }
    const makeReq = () =>
      new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': ip },
      })

    await rateLimit(makeReq(), config) // consumes the 1 allowed
    const result = await rateLimit(makeReq(), config)
    expect(result.success).toBe(false)
  })
})

describe('getRateLimitConfig', () => {
  it('returns auth config for /api/auth routes', () => {
    expect(getRateLimitConfig('/api/auth/login')).toBe(RATE_LIMITS.auth)
    expect(getRateLimitConfig('/api/auth/register')).toBe(RATE_LIMITS.auth)
  })

  it('returns payment config for payment routes', () => {
    expect(getRateLimitConfig('/api/payments/create')).toBe(RATE_LIMITS.payment)
    expect(getRateLimitConfig('/api/stripe/webhook')).toBe(RATE_LIMITS.payment)
  })

  it('returns booking config for booking routes', () => {
    expect(getRateLimitConfig('/api/bookings')).toBe(RATE_LIMITS.booking)
  })

  it('returns reviews config for review routes', () => {
    expect(getRateLimitConfig('/api/reviews')).toBe(RATE_LIMITS.reviews)
  })

  it('returns quotes config for quote routes', () => {
    expect(getRateLimitConfig('/api/quotes/create')).toBe(RATE_LIMITS.quotes)
    expect(getRateLimitConfig('/api/attorney/quotes')).toBe(RATE_LIMITS.quotes)
  })

  it('returns contact config for contact routes', () => {
    expect(getRateLimitConfig('/api/contact')).toBe(RATE_LIMITS.contact)
  })

  it('returns upload config for upload routes', () => {
    expect(getRateLimitConfig('/api/photos/upload')).toBe(RATE_LIMITS.upload)
  })

  it('returns search config for search routes', () => {
    expect(getRateLimitConfig('/api/search')).toBe(RATE_LIMITS.search)
  })

  it('returns search config for provider listing/by-city routes', () => {
    expect(getRateLimitConfig('/api/attorneys/listing')).toBe(RATE_LIMITS.search)
    expect(getRateLimitConfig('/api/attorneys/by-city')).toBe(RATE_LIMITS.search)
  })

  it('returns gdpr config for GDPR routes', () => {
    expect(getRateLimitConfig('/api/gdpr/export')).toBe(RATE_LIMITS.gdpr)
    expect(getRateLimitConfig('/api/gdpr/delete')).toBe(RATE_LIMITS.gdpr)
  })

  it('returns newsletter config for newsletter route', () => {
    expect(getRateLimitConfig('/api/newsletter')).toBe(RATE_LIMITS.newsletter)
  })

  it('returns registration config for attorney registration route', () => {
    expect(getRateLimitConfig('/api/register-attorney')).toBe(RATE_LIMITS.registration)
  })

  it('returns ai config for AI generation routes', () => {
    expect(getRateLimitConfig('/api/admin/prospection/ai/generate')).toBe(RATE_LIMITS.ai)
    expect(getRateLimitConfig('/api/admin/prospection/ai/settings')).toBe(RATE_LIMITS.ai)
  })

  it('returns verify config for verification routes', () => {
    expect(getRateLimitConfig('/api/verify/bar-number')).toBe(RATE_LIMITS.verify)
    expect(getRateLimitConfig('/api/verify/business')).toBe(RATE_LIMITS.verify)
  })

  it('returns geocode config for geocode routes', () => {
    expect(getRateLimitConfig('/api/geocode')).toBe(RATE_LIMITS.geocode)
  })

  it('returns webhook config for external webhook routes', () => {
    expect(getRateLimitConfig('/api/admin/prospection/webhooks/resend')).toBe(RATE_LIMITS.webhook)
    expect(getRateLimitConfig('/api/admin/prospection/webhooks/twilio')).toBe(RATE_LIMITS.webhook)
  })

  it('returns cron config for cron routes', () => {
    expect(getRateLimitConfig('/api/cron/send-reminders')).toBe(RATE_LIMITS.cron)
    expect(getRateLimitConfig('/api/cron/calculate-trust-badges')).toBe(RATE_LIMITS.cron)
  })

  it('returns api config for generic API routes', () => {
    expect(getRateLimitConfig('/api/geo/cities')).toBe(RATE_LIMITS.api)
  })

  it('returns default config for non-API routes', () => {
    expect(getRateLimitConfig('/practice-areas/personal-injury/new-york')).toBe(RATE_LIMITS.default)
    expect(getRateLimitConfig('/')).toBe(RATE_LIMITS.default)
  })
})

describe('getRateLimitKey', () => {
  it('combines ip and pathname', () => {
    expect(getRateLimitKey('1.2.3.4', '/api/auth')).toBe('1.2.3.4:/api/auth')
  })

  it('handles unknown IP', () => {
    expect(getRateLimitKey('unknown', '/api/contact')).toBe('unknown:/api/contact')
  })
})

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for (first entry)', () => {
    const headers = new Headers({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2' })
    expect(getClientIp(headers)).toBe('10.0.0.1')
  })

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '10.0.0.5' })
    expect(getClientIp(headers)).toBe('10.0.0.5')
  })

  it('falls back to cf-connecting-ip', () => {
    const headers = new Headers({ 'cf-connecting-ip': '10.0.0.9' })
    expect(getClientIp(headers)).toBe('10.0.0.9')
  })

  it('returns unknown when no IP header present', () => {
    const headers = new Headers()
    expect(getClientIp(headers)).toBe('unknown')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.1.1.1',
      'x-real-ip': '2.2.2.2',
    })
    expect(getClientIp(headers)).toBe('1.1.1.1')
  })
})

describe('checkRateLimit (in-memory)', () => {
  // Use unique keys per test to avoid cross-contamination from module-level memoryStore
  const uniqueKey = () => `test:${Math.random().toString(36).slice(2)}`

  it('allows requests under the limit', async () => {
    const key = uniqueKey()
    const config = { windowMs: 60_000, maxRequests: 5 }

    const result = await checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('decrements remaining on each call', async () => {
    const key = uniqueKey()
    const config = { windowMs: 60_000, maxRequests: 3 }

    const r1 = await checkRateLimit(key, config)
    const r2 = await checkRateLimit(key, config)
    const r3 = await checkRateLimit(key, config)

    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
    expect(r3.remaining).toBe(0)
    expect(r3.allowed).toBe(true)
  })

  it('blocks when limit is reached', async () => {
    const key = uniqueKey()
    const config = { windowMs: 60_000, maxRequests: 2 }

    await checkRateLimit(key, config)
    await checkRateLimit(key, config)
    const result = await checkRateLimit(key, config)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('allows exactly max requests', async () => {
    const key = uniqueKey()
    const config = { windowMs: 60_000, maxRequests: 1 }

    const first = await checkRateLimit(key, config)
    expect(first.allowed).toBe(true)

    const second = await checkRateLimit(key, config)
    expect(second.allowed).toBe(false)
  })

  it('provides a resetTime in the future', async () => {
    const key = uniqueKey()
    const config = { windowMs: 60_000, maxRequests: 10 }
    const before = Date.now()

    const result = await checkRateLimit(key, config)

    expect(result.resetTime).toBeGreaterThan(before)
    expect(result.resetTime).toBeLessThanOrEqual(before + 60_000 + 100)
  })

  it('resets after window expiry', async () => {
    const key = uniqueKey()
    const config = { windowMs: 1, maxRequests: 1 } // 1ms window

    await checkRateLimit(key, config)
    await checkRateLimit(key, config) // blocked

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 10))

    const result = await checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
  })
})

describe('RATE_LIMITS constants', () => {
  it('auth limit is stricter than api limit', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(RATE_LIMITS.api.maxRequests)
  })

  it('email-sending tiers are strict (newsletter, registration, contact)', () => {
    expect(RATE_LIMITS.newsletter.maxRequests).toBeLessThanOrEqual(5)
    expect(RATE_LIMITS.registration.maxRequests).toBeLessThanOrEqual(5)
    expect(RATE_LIMITS.contact.maxRequests).toBeLessThanOrEqual(5)
  })

  it('sensitive tiers have failOpen disabled (fail-close)', () => {
    expect(RATE_LIMITS.auth.failOpen).toBe(false)
    expect(RATE_LIMITS.payment.failOpen).toBe(false)
    expect(RATE_LIMITS.contact.failOpen).toBe(false)
    expect(RATE_LIMITS.webhook.failOpen).toBe(false)
    expect(RATE_LIMITS.cron.failOpen).toBe(false)
    expect(RATE_LIMITS.vapiWebhook.failOpen).toBe(false)
  })

  it('public/availability tiers have failOpen enabled (fail-open)', () => {
    expect(RATE_LIMITS.search.failOpen).toBe(true)
    expect(RATE_LIMITS.analytics.failOpen).toBe(true)
    expect(RATE_LIMITS.api.failOpen).toBe(true)
    expect(RATE_LIMITS.estimation.failOpen).toBe(true)
  })

  it('gdpr tier has longer window', () => {
    expect(RATE_LIMITS.gdpr.windowMs).toBeGreaterThan(RATE_LIMITS.api.windowMs)
  })

  it('all configs have positive windowMs and maxRequests', () => {
    for (const config of Object.values(RATE_LIMITS)) {
      expect(config.windowMs).toBeGreaterThan(0)
      expect(config.maxRequests).toBeGreaterThan(0)
    }
  })
})
