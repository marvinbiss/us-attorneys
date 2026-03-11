// In-memory sliding window rate limiter.
// NOTE: This is suitable for single-instance deployments only.
// For production with multiple instances, replace with Vercel KV or Redis.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  });
}, CLEANUP_INTERVAL_MS);

/**
 * Check and consume a rate limit token for the given key.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // Window expired or first request — start a new window
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  // Within current window
  if (entry.count < limit) {
    entry.count++;
    return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  }

  // Limit exceeded
  return { success: false, remaining: 0, resetAt: entry.resetAt };
}

/**
 * Build standard rate-limit response headers from a RateLimitResult.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
}
