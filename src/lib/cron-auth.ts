/**
 * Cron authentication helper — timing-safe Bearer token verification.
 *
 * Using `crypto.timingSafeEqual` prevents timing side-channel attacks
 * where an attacker could infer the secret length or prefix from
 * response-time differences of a naive `!==` comparison.
 */

import crypto from 'crypto'

/**
 * Verify the Bearer token in an Authorization header against CRON_SECRET.
 * Returns true if the token matches; false otherwise.
 *
 * Safe to call even when CRON_SECRET is unset (returns false).
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !authHeader) return false

  const prefix = 'Bearer '
  if (!authHeader.startsWith(prefix)) return false

  const token = authHeader.slice(prefix.length)

  // Lengths must match for timingSafeEqual; reject early if not.
  // This leaks length information but the secret length is not sensitive
  // (it's always a fixed-size random token).
  if (token.length !== cronSecret.length) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'utf-8'),
      Buffer.from(cronSecret, 'utf-8')
    )
  } catch {
    return false
  }
}
