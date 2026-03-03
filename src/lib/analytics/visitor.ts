/**
 * Persistent anonymous visitor ID management
 * Uses a first-party cookie to identify returning visitors across sessions.
 *
 * RGPD compliance:
 * - The visitor ID is an anonymous UUID with no PII
 * - Cookie lifetime: 13 months (CNIL maximum for analytics)
 * - No cross-site tracking, no fingerprinting
 */

const VISITOR_COOKIE = 'sa_vid'
const VISITOR_MAX_AGE = 34164000 // 13 months in seconds (395 days)

/**
 * Get or create an anonymous visitor ID from cookie.
 * Returns empty string on server side.
 */
export function getVisitorId(): string {
  if (typeof document === 'undefined') return ''

  const existing = getCookie(VISITOR_COOKIE)
  if (existing) return existing

  // Generate new visitor ID
  const visitorId = `v_${crypto.randomUUID().replace(/-/g, '')}`

  // Set cookie (13 months, first-party only)
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${VISITOR_COOKIE}=${visitorId}; max-age=${VISITOR_MAX_AGE}; path=/; SameSite=Lax${secure}`

  return visitorId
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
