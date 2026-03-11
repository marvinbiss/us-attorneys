import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// We need a fresh module for each test to avoid shared state between suites.
// The module-level `store` Map and `setInterval` cleanup are internal.
// ---------------------------------------------------------------------------

let rateLimit: typeof import('@/lib/rate-limit').rateLimit
let getRateLimitHeaders: typeof import('@/lib/rate-limit').getRateLimitHeaders

beforeEach(async () => {
  vi.useFakeTimers()
  // Re-import to get a fresh store each time
  vi.resetModules()
  const mod = await import('@/lib/rate-limit')
  rateLimit = mod.rateLimit
  getRateLimitHeaders = mod.getRateLimitHeaders
})

afterEach(() => {
  vi.useRealTimers()
})

// ============================== rateLimit ==================================
describe('rateLimit', () => {
  it('first call succeeds with correct remaining count', () => {
    const result = rateLimit('test-key', 5, 60_000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('calls up to the limit all succeed', () => {
    const limit = 3
    for (let i = 0; i < limit; i++) {
      const result = rateLimit('limit-key', limit, 60_000)
      expect(result.success).toBe(true)
    }
  })

  it('call at limit+1 fails', () => {
    const limit = 3
    for (let i = 0; i < limit; i++) {
      rateLimit('exceed-key', limit, 60_000)
    }
    const result = rateLimit('exceed-key', limit, 60_000)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('different keys are independent', () => {
    const limit = 2

    // Exhaust key-a
    rateLimit('key-a', limit, 60_000)
    rateLimit('key-a', limit, 60_000)
    const exhausted = rateLimit('key-a', limit, 60_000)
    expect(exhausted.success).toBe(false)

    // key-b should still work
    const fresh = rateLimit('key-b', limit, 60_000)
    expect(fresh.success).toBe(true)
    expect(fresh.remaining).toBe(1)
  })

  it('counter resets after window expires', () => {
    const limit = 2
    const windowMs = 10_000

    rateLimit('reset-key', limit, windowMs)
    rateLimit('reset-key', limit, windowMs)
    const blocked = rateLimit('reset-key', limit, windowMs)
    expect(blocked.success).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(windowMs + 1)

    const afterReset = rateLimit('reset-key', limit, windowMs)
    expect(afterReset.success).toBe(true)
    expect(afterReset.remaining).toBe(1)
  })

  it('remaining count decreases with each call', () => {
    const limit = 5
    for (let i = 0; i < limit; i++) {
      const result = rateLimit('dec-key', limit, 60_000)
      expect(result.remaining).toBe(limit - 1 - i)
    }
  })

  it('returns correct resetAt timestamp', () => {
    const now = Date.now()
    const windowMs = 30_000
    const result = rateLimit('ts-key', 5, windowMs)
    expect(result.resetAt).toBe(now + windowMs)
  })
})

// ======================== getRateLimitHeaders ===============================
describe('getRateLimitHeaders', () => {
  it('returns correct header keys', () => {
    const result = rateLimit('hdr-key', 10, 60_000)
    const headers = getRateLimitHeaders(result)
    expect(headers).toHaveProperty('X-RateLimit-Remaining')
    expect(headers).toHaveProperty('X-RateLimit-Reset')
  })

  it('header values match the result object', () => {
    const result = rateLimit('val-key', 10, 60_000)
    const headers = getRateLimitHeaders(result)
    expect(headers['X-RateLimit-Remaining']).toBe(String(result.remaining))
    expect(headers['X-RateLimit-Reset']).toBe(String(result.resetAt))
  })
})
