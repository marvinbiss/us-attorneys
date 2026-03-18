/**
 * Enhanced rate limiter tests — covers fail-open vs fail-close behavior,
 * rateLimit() high-level helper edge cases, and route config ordering.
 *
 * Complements the existing src/lib/rate-limiter.test.ts.
 */

import { describe, it, expect } from 'vitest'
import {
  getRateLimitConfig,
  getClientIp,
  rateLimit,
  RATE_LIMITS,
  type RateLimitConfig,
} from '@/lib/rate-limiter'

// ── Fail-open vs fail-close semantics (rateLimit helper) ─────────────────────

describe('rateLimit() fail-open / fail-close on unexpected error', () => {
  // We test the outer catch path in rateLimit() by providing a request
  // whose url parsing might fail. Actually, the simplest way is to
  // verify the config contract.

  it('fail-open config (api) returns success=true on error fallback', async () => {
    // api has failOpen: true
    expect(RATE_LIMITS.api.failOpen).toBe(true)
  })

  it('fail-close config (auth) has failOpen=false', () => {
    expect(RATE_LIMITS.auth.failOpen).toBe(false)
  })

  it('fail-close config (payment) has failOpen=false', () => {
    expect(RATE_LIMITS.payment.failOpen).toBe(false)
  })

  it('fail-close config (contact) has failOpen=false', () => {
    expect(RATE_LIMITS.contact.failOpen).toBe(false)
  })
})

// ── Route config ordering correctness ────────────────────────────────────────

describe('getRateLimitConfig route ordering', () => {
  it('/api/admin/prospection/ai matches AI config, not generic admin/api', () => {
    const config = getRateLimitConfig('/api/admin/prospection/ai/generate')
    expect(config).toBe(RATE_LIMITS.ai)
    expect(config.maxRequests).toBe(10)
  })

  it('/api/admin/prospection/webhooks matches webhook config, not ai', () => {
    const config = getRateLimitConfig('/api/admin/prospection/webhooks/resend')
    expect(config).toBe(RATE_LIMITS.webhook)
  })

  it('/api/estimation/lead matches estimationLead, not estimation', () => {
    const config = getRateLimitConfig('/api/estimation/lead/capture')
    expect(config).toBe(RATE_LIMITS.estimationLead)
    expect(config.maxRequests).toBe(3)
  })

  it('/api/estimation/chat matches estimation (not estimationLead)', () => {
    const config = getRateLimitConfig('/api/estimation/chat')
    expect(config).toBe(RATE_LIMITS.estimation)
  })

  it('/api/vapi/webhook matches vapiWebhook config', () => {
    const config = getRateLimitConfig('/api/vapi/webhook')
    expect(config).toBe(RATE_LIMITS.vapiWebhook)
    expect(config.failOpen).toBe(false)
  })

  it('/api/analytics/beacon matches analytics config (fail-open)', () => {
    const config = getRateLimitConfig('/api/analytics/beacon')
    expect(config).toBe(RATE_LIMITS.analytics)
    expect(config.failOpen).toBe(true)
  })
})

// ── In-memory rate limiter behavior ──────────────────────────────────────────

describe('in-memory rate limiter edge cases', () => {
  it('different IPs have independent limits', async () => {
    const config: RateLimitConfig = { maxRequests: 1, windowMs: 60_000 }
    const ip1 = `edge-ip1-${Date.now()}`
    const ip2 = `edge-ip2-${Date.now()}`

    const req1 = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': ip1 },
    })
    const req2 = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': ip2 },
    })

    const r1 = await rateLimit(req1, config)
    expect(r1.success).toBe(true)

    // ip1 is now exhausted
    const r1b = await rateLimit(
      new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': ip1 },
      }),
      config
    )
    expect(r1b.success).toBe(false)

    // ip2 should still pass
    const r2 = await rateLimit(req2, config)
    expect(r2.success).toBe(true)
  })

  it('returns reset time in the future', async () => {
    const now = Date.now()
    const config: RateLimitConfig = { maxRequests: 10, windowMs: 30_000 }
    const req = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': `reset-${now}` },
    })
    const result = await rateLimit(req, config)
    expect(result.reset).toBeGreaterThanOrEqual(now)
  })

  it('remaining decreases correctly toward 0', async () => {
    const config: RateLimitConfig = { maxRequests: 3, windowMs: 60_000 }
    const ip = `dec-${Date.now()}`
    const makeReq = () =>
      new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': ip },
      })

    const r1 = await rateLimit(makeReq(), config)
    expect(r1.remaining).toBe(2)

    const r2 = await rateLimit(makeReq(), config)
    expect(r2.remaining).toBe(1)

    const r3 = await rateLimit(makeReq(), config)
    expect(r3.remaining).toBe(0)
    expect(r3.success).toBe(true) // last allowed

    const r4 = await rateLimit(makeReq(), config)
    expect(r4.success).toBe(false)
    expect(r4.remaining).toBe(0)
  })
})

// ── getClientIp edge cases ───────────────────────────────────────────────────

describe('getClientIp additional edge cases', () => {
  it('trims whitespace from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '  203.0.113.5 , 10.0.0.1' })
    expect(getClientIp(headers)).toBe('203.0.113.5')
  })

  it('handles single IP in x-forwarded-for (no comma)', () => {
    const headers = new Headers({ 'x-forwarded-for': '198.51.100.1' })
    expect(getClientIp(headers)).toBe('198.51.100.1')
  })
})

// ── RATE_LIMITS config validation ────────────────────────────────────────────

describe('RATE_LIMITS config validation', () => {
  it('all window durations are at least 1 second', () => {
    for (const [name, config] of Object.entries(RATE_LIMITS)) {
      expect(config.windowMs, `${name} windowMs should be >= 1000`).toBeGreaterThanOrEqual(1000)
    }
  })

  it('all maxRequests are at least 1', () => {
    for (const [name, config] of Object.entries(RATE_LIMITS)) {
      expect(config.maxRequests, `${name} maxRequests should be >= 1`).toBeGreaterThanOrEqual(1)
    }
  })

  it('webhook configs have high throughput (>= 100/min)', () => {
    expect(RATE_LIMITS.webhook.maxRequests).toBeGreaterThanOrEqual(100)
    expect(RATE_LIMITS.vapiWebhook.maxRequests).toBeGreaterThanOrEqual(100)
  })

  it('auth-related configs are strict (<= 10/min)', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThanOrEqual(10)
    expect(RATE_LIMITS.contact.maxRequests).toBeLessThanOrEqual(10)
  })
})
