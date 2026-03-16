import { describe, it, expect } from 'vitest'
import {
  getRateLimitConfig,
  getRateLimitKey,
  getClientIp,
  checkRateLimit,
  RATE_LIMITS,
} from './rate-limiter'

// In test env: NODE_ENV !== 'production' and no Redis → always uses MemoryRateLimiter

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
    expect(getRateLimitConfig('/api/verify/siret')).toBe(RATE_LIMITS.verify)
    expect(getRateLimitConfig('/api/verify/entreprise')).toBe(RATE_LIMITS.verify)
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
    expect(getRateLimitConfig('/practice-areas/plombier/paris')).toBe(RATE_LIMITS.default)
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
    const config = { window: 60_000, max: 5 }

    const result = await checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('decrements remaining on each call', async () => {
    const key = uniqueKey()
    const config = { window: 60_000, max: 3 }

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
    const config = { window: 60_000, max: 2 }

    await checkRateLimit(key, config)
    await checkRateLimit(key, config)
    const result = await checkRateLimit(key, config)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('allows exactly max requests', async () => {
    const key = uniqueKey()
    const config = { window: 60_000, max: 1 }

    const first = await checkRateLimit(key, config)
    expect(first.allowed).toBe(true)

    const second = await checkRateLimit(key, config)
    expect(second.allowed).toBe(false)
  })

  it('provides a resetTime in the future', async () => {
    const key = uniqueKey()
    const config = { window: 60_000, max: 10 }
    const before = Date.now()

    const result = await checkRateLimit(key, config)

    expect(result.resetTime).toBeGreaterThan(before)
    expect(result.resetTime).toBeLessThanOrEqual(before + 60_000 + 100)
  })

  it('resets after window expiry', async () => {
    const key = uniqueKey()
    const config = { window: 1, max: 1 } // 1ms window

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
    expect(RATE_LIMITS.auth.max).toBeLessThan(RATE_LIMITS.api.max)
  })

  it('contact has longer window than auth', () => {
    expect(RATE_LIMITS.contact.window).toBeGreaterThan(RATE_LIMITS.auth.window)
  })

  it('email-sending tiers are strict (newsletter, registration, contact)', () => {
    expect(RATE_LIMITS.newsletter.max).toBeLessThanOrEqual(5)
    expect(RATE_LIMITS.registration.max).toBeLessThanOrEqual(5)
    expect(RATE_LIMITS.contact.max).toBeLessThanOrEqual(5)
  })

  it('webhook and cron tiers have failOpen enabled', () => {
    expect(RATE_LIMITS.webhook.failOpen).toBe(true)
    expect(RATE_LIMITS.cron.failOpen).toBe(true)
  })

  it('gdpr tier has longer window', () => {
    expect(RATE_LIMITS.gdpr.window).toBeGreaterThan(RATE_LIMITS.api.window)
  })

  it('all configs have positive window and max', () => {
    for (const config of Object.values(RATE_LIMITS)) {
      expect(config.window).toBeGreaterThan(0)
      expect(config.max).toBeGreaterThan(0)
    }
  })
})
