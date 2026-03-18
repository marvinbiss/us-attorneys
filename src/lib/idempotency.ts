/**
 * Idempotency key support for critical POST endpoints.
 * Prevents double bookings, double payments, etc.
 *
 * Pattern:
 *   1. Client sends `X-Idempotency-Key: <uuid>` header
 *   2. If key already processed → return cached response immediately
 *   3. If key is new → acquire lock, run handler, cache result (24h TTL)
 */

import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '@/lib/cache/redis-client'
import { logger } from '@/lib/logger'

const IDEMPOTENCY_TTL = 86400 // 24 hours
const redis = new CacheService('usa:idempotency:')

interface CachedResponse {
  status: number
  body: unknown
}

/**
 * Extract and validate idempotency key from request headers.
 * Returns null if header is absent (idempotency is opt-in).
 */
export function getIdempotencyKey(request: NextRequest | Request): string | null {
  const key = request.headers.get('x-idempotency-key')
  if (!key) return null

  // Basic validation: must be a non-empty string, max 256 chars
  const trimmed = key.trim()
  if (trimmed.length === 0 || trimmed.length > 256) return null

  return trimmed
}

/**
 * Check if an idempotency key has already been processed.
 * Returns the cached NextResponse if found, null otherwise.
 */
export async function checkIdempotency(key: string): Promise<NextResponse | null> {
  try {
    const cached = await redis.get<CachedResponse>(key)
    if (cached) {
      logger.info('[idempotency] Returning cached response', { key })
      return NextResponse.json(cached.body, { status: cached.status })
    }
  } catch (err) {
    // Fail open: if Redis is down, proceed with the request
    logger.warn('[idempotency] Redis check failed, proceeding', {
      key,
      error: (err as Error).message,
    })
  }
  return null
}

/**
 * Store the response for a processed idempotency key.
 * Fire-and-forget — does not block the response.
 */
export function cacheIdempotencyResult(key: string, status: number, body: unknown): void {
  const entry: CachedResponse = { status, body }
  redis.set(key, entry, IDEMPOTENCY_TTL).catch((err) => {
    logger.warn('[idempotency] Failed to cache result', {
      key,
      error: (err as Error).message,
    })
  })
}

/**
 * Convenience wrapper: wraps a handler with idempotency support.
 *
 * Usage:
 *   const cached = await handleIdempotency(request)
 *   if (cached) return cached
 *   // ... proceed with normal logic ...
 *   // At the end, before returning:
 *   cacheIdempotencyResult(key, status, body)
 */
export async function handleIdempotency(
  request: NextRequest | Request
): Promise<{ cached: NextResponse } | { key: string } | null> {
  const key = getIdempotencyKey(request)
  if (!key) return null // No idempotency header — proceed normally

  const cachedResponse = await checkIdempotency(key)
  if (cachedResponse) return { cached: cachedResponse }

  return { key }
}
