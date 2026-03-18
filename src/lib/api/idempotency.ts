/**
 * Idempotency Key Support for Transactional POST Endpoints
 *
 * Prevents duplicate processing of the same request (e.g., double-booking,
 * double-payment) by caching responses keyed by a client-supplied
 * `X-Idempotency-Key` header.
 *
 * Storage: Upstash Redis (REST API) with 24h TTL.
 * Falls back to in-memory Map when Redis is unavailable (dev / cold-start).
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// ---------- Redis REST helpers (same pattern as rate-limiter) ----------

const REST_URL = process.env.UPSTASH_REDIS_REST_URL
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const hasRedis = Boolean(REST_URL && REST_TOKEN)

async function redisCommand<T = unknown>(command: (string | number)[]): Promise<T | null> {
  if (!hasRedis) return null
  try {
    const res = await fetch(REST_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json.result as T
  } catch (err: unknown) {
    logger.error('Idempotency Redis error', err as Error)
    return null
  }
}

// ---------- In-memory fallback (dev / no-Redis) ----------

interface MemEntry {
  response: string // JSON-serialized { status, body }
  expiresAt: number
}

const memoryStore = new Map<string, MemEntry>()

const IDEMPOTENCY_TTL_SECONDS = 86_400 // 24 hours

// ---------- Public API ----------

interface CachedResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

/**
 * Check if an idempotency key has already been processed.
 * Returns the cached NextResponse if found, or null if the key is new.
 */
export async function getIdempotentResponse(key: string): Promise<NextResponse | null> {
  const redisKey = `idempotency:${key}`

  // Try Redis first
  if (hasRedis) {
    const cached = await redisCommand<string>(['GET', redisKey])
    if (cached) {
      try {
        const parsed: CachedResponse = JSON.parse(cached)
        const res = NextResponse.json(parsed.body, { status: parsed.status })
        res.headers.set('X-Idempotency-Replay', 'true')
        if (parsed.headers) {
          for (const [k, v] of Object.entries(parsed.headers)) {
            res.headers.set(k, v)
          }
        }
        return res
      } catch {
        // Corrupted cache entry — treat as miss
        logger.warn('Corrupted idempotency cache entry', { key })
      }
    }
  }

  // Fallback: in-memory
  const mem = memoryStore.get(redisKey)
  if (mem && mem.expiresAt > Date.now()) {
    try {
      const parsed: CachedResponse = JSON.parse(mem.response)
      const res = NextResponse.json(parsed.body, { status: parsed.status })
      res.headers.set('X-Idempotency-Replay', 'true')
      return res
    } catch {
      memoryStore.delete(redisKey)
    }
  } else if (mem) {
    memoryStore.delete(redisKey) // expired
  }

  return null
}

/**
 * Store the response for an idempotency key (TTL = 24h).
 */
export async function setIdempotentResponse(
  key: string,
  response: NextResponse,
): Promise<void> {
  const redisKey = `idempotency:${key}`

  // Clone the response body so we can cache it
  const cloned = response.clone()
  let body: unknown
  try {
    body = await cloned.json()
  } catch {
    // Non-JSON response — skip caching
    return
  }

  const cached: CachedResponse = {
    status: response.status,
    body,
  }

  const serialized = JSON.stringify(cached)

  // Store in Redis
  if (hasRedis) {
    await redisCommand(['SET', redisKey, serialized, 'EX', IDEMPOTENCY_TTL_SECONDS])
  }

  // Always store in memory too (fast path for same-Lambda replays)
  memoryStore.set(redisKey, {
    response: serialized,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_SECONDS * 1000,
  })

  // Lazy cleanup of expired in-memory entries
  if (memoryStore.size > 5000) {
    const now = Date.now()
    Array.from(memoryStore.entries()).forEach(([k, v]) => {
      if (v.expiresAt < now) memoryStore.delete(k)
    })
  }
}
