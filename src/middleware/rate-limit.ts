/**
 * Rate Limiting Middleware
 * Protects API routes from abuse
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/cache/redis-client'

interface RateLimitConfig {
  // Requests per window
  limit: number
  // Window size in seconds
  windowSeconds: number
  // Custom identifier function
  getIdentifier?: (request: NextRequest) => string
}

// Default rate limit configurations by route type
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // API routes - general
  '/api/': { limit: 100, windowSeconds: 60 },
  // Auth routes - stricter
  '/api/auth/': { limit: 10, windowSeconds: 60 },
  // Search - moderate
  '/api/search': { limit: 30, windowSeconds: 60 },
  // Quote requests - strict
  '/api/quotes': { limit: 5, windowSeconds: 60 },
  // Contact form - very strict
  '/api/contact': { limit: 3, windowSeconds: 300 },
  // Bulk operations - very strict
  '/api/attorneys/bulk': { limit: 10, windowSeconds: 60 },
  '/api/reviews/bulk': { limit: 10, windowSeconds: 60 },
  // Admin routes - moderate
  '/api/admin/': { limit: 60, windowSeconds: 60 },
}

/**
 * Get the appropriate rate limit config for a path
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Find the most specific matching config
  const sortedPaths = Object.keys(RATE_LIMITS).sort((a, b) => b.length - a.length)

  for (const path of sortedPaths) {
    if (pathname.startsWith(path)) {
      return RATE_LIMITS[path]
    }
  }

  // Default fallback
  return { limit: 100, windowSeconds: 60 }
}

/**
 * Get identifier for rate limiting
 * Uses IP address, or user ID if authenticated
 */
function getIdentifier(request: NextRequest): string {
  // Try to get user ID from cookie/session
  const userId = request.cookies.get('user_id')?.value

  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit middleware function
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return null
  }

  // Skip health check
  if (pathname === '/api/health') {
    return null
  }

  const config = getRateLimitConfig(pathname)
  const identifier = `${getIdentifier(request)}:${pathname}`

  const result = await rateLimiter.isAllowed(
    identifier,
    config.limit,
    config.windowSeconds
  )

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  // Add rate limit headers to response
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', String(config.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

  return response
}

/**
 * Simple in-memory rate limiter for edge runtime (no Redis)
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map()

  isAllowed(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const windowStart = now - windowSeconds * 1000

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || []

    // Filter to only requests within the window
    requests = requests.filter(time => time > windowStart)

    if (requests.length >= limit) {
      return { allowed: false, remaining: 0 }
    }

    // Add new request
    requests.push(now)
    this.requests.set(identifier, requests)

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(windowSeconds)
    }

    return { allowed: true, remaining: limit - requests.length }
  }

  private cleanup(windowSeconds: number) {
    const cutoff = Date.now() - windowSeconds * 1000
    const entries = Array.from(this.requests.entries())
    for (const [key, requests] of entries) {
      const filtered = requests.filter(time => time > cutoff)
      if (filtered.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, filtered)
      }
    }
  }
}

// Export in-memory rate limiter for edge runtime
export const inMemoryRateLimiter = new InMemoryRateLimiter()
