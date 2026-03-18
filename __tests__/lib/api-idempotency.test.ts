/**
 * Tests for src/lib/api/idempotency.ts
 *
 * Covers:
 * - getIdempotentResponse: Redis hit, memory fallback, expired entries, corrupted cache
 * - setIdempotentResponse: store in Redis + memory, non-JSON skip, cleanup overflow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextResponse } from 'next/server'

// Track fetch calls for Redis REST API mocking
const mockFetch = vi.fn()

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// We need to control the env vars and re-import the module for each scenario.
// Since the module reads process.env at load time, we use dynamic imports.

describe('getIdempotentResponse — memory fallback (no Redis)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    // Ensure no Redis env
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('returns null for unknown key (empty store)', async () => {
    const mod = await import('@/lib/api/idempotency')
    const result = await mod.getIdempotentResponse('unknown-key')
    expect(result).toBeNull()
  })

  it('stores and retrieves a response via memory', async () => {
    const mod = await import('@/lib/api/idempotency')
    const original = NextResponse.json({ saved: true }, { status: 201 })
    await mod.setIdempotentResponse('mem-key-1', original)

    const cached = await mod.getIdempotentResponse('mem-key-1')
    expect(cached).not.toBeNull()
    expect(cached!.status).toBe(201)
    expect(cached!.headers.get('X-Idempotency-Replay')).toBe('true')
    const body = await cached!.json()
    expect(body).toEqual({ saved: true })
  })

  it('removes expired entries from memory', async () => {
    const mod = await import('@/lib/api/idempotency')

    // Store an entry, then manually expire it
    const original = NextResponse.json({ old: true })
    await mod.setIdempotentResponse('expired-key', original)

    // Manipulate the internal memory by setting expiresAt to the past
    // We can test by storing, then advancing Date.now
    const realDateNow = Date.now
    Date.now = () => realDateNow() + 100_000_000 // 100k seconds in the future

    const cached = await mod.getIdempotentResponse('expired-key')
    expect(cached).toBeNull()

    Date.now = realDateNow
  })

  it('skips caching for non-JSON responses', async () => {
    const mod = await import('@/lib/api/idempotency')

    // Create a response that will fail json() — a text response
    const textResponse = new NextResponse('not json', { status: 200 })
    await mod.setIdempotentResponse('text-key', textResponse)

    const cached = await mod.getIdempotentResponse('text-key')
    expect(cached).toBeNull()
  })
})

describe('getIdempotentResponse — with Redis', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
    globalThis.fetch = mockFetch
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('returns cached response from Redis on hit', async () => {
    const cachedEntry = JSON.stringify({ status: 200, body: { cached: true } })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: cachedEntry }),
    })

    const mod = await import('@/lib/api/idempotency')
    const result = await mod.getIdempotentResponse('redis-hit-key')
    expect(result).not.toBeNull()
    expect(result!.status).toBe(200)
    expect(result!.headers.get('X-Idempotency-Replay')).toBe('true')
    const body = await result!.json()
    expect(body).toEqual({ cached: true })
  })

  it('restores custom headers from cached entry', async () => {
    const cachedEntry = JSON.stringify({
      status: 200,
      body: { ok: true },
      headers: { 'X-Custom': 'value' },
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: cachedEntry }),
    })

    const mod = await import('@/lib/api/idempotency')
    const result = await mod.getIdempotentResponse('header-key')
    expect(result!.headers.get('X-Custom')).toBe('value')
  })

  it('treats corrupted Redis entry as cache miss', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'not-valid-json{{{' }),
    })

    const mod = await import('@/lib/api/idempotency')
    const result = await mod.getIdempotentResponse('corrupt-key')
    // Falls through to memory, which has nothing
    expect(result).toBeNull()
  })

  it('falls back gracefully when Redis returns HTTP error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    const mod = await import('@/lib/api/idempotency')
    const result = await mod.getIdempotentResponse('error-key')
    expect(result).toBeNull()
  })

  it('falls back gracefully when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const mod = await import('@/lib/api/idempotency')
    const result = await mod.getIdempotentResponse('network-error-key')
    expect(result).toBeNull()
  })
})

describe('setIdempotentResponse — with Redis', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
    globalThis.fetch = mockFetch
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('sends SET command to Redis with EX TTL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'OK' }),
    })

    const mod = await import('@/lib/api/idempotency')
    const response = NextResponse.json({ created: true }, { status: 201 })
    await mod.setIdempotentResponse('store-key', response)

    // The fetch should be called with a SET command
    expect(mockFetch).toHaveBeenCalled()
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody[0]).toBe('SET')
    expect(callBody[1]).toBe('idempotency:store-key')
    expect(callBody[4]).toBe(86400)
  })

  it('does not throw when Redis write fails', async () => {
    mockFetch.mockRejectedValue(new Error('Redis write error'))

    const mod = await import('@/lib/api/idempotency')
    const response = NextResponse.json({ data: true })
    // Should not throw
    await expect(
      mod.setIdempotentResponse('fail-key', response)
    ).resolves.toBeUndefined()
  })
})
