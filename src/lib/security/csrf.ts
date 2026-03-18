/**
 * CSRF Protection — Double-Submit Cookie Pattern
 *
 * How it works:
 * 1. Middleware sets a random CSRF token in a cookie on every response (if not already present).
 * 2. Client-side code reads the cookie and sends it as an X-CSRF-Token header on mutating requests.
 * 3. API routes validate that the header value matches the cookie value.
 *
 * Why this works:
 * - An attacker on a different origin cannot read our cookies (SameSite + HttpOnly=false for the token).
 * - The attacker cannot forge the X-CSRF-Token header because they cannot read the cookie.
 * - The cookie is set with SameSite=Lax, so it IS sent on cross-origin POST (form submissions),
 *   but the attacker cannot read it to put it in a header.
 *
 * Integration points:
 * - Middleware: sets the cookie (see middleware.ts)
 * - Client: getCsrfToken() reads cookie, fetchWithCsrf() adds header automatically
 * - API: validateCsrfToken() checks header === cookie on POST/PUT/DELETE/PATCH
 *
 * Note: This project does NOT use Next.js Server Actions (which have built-in CSRF).
 * All form submissions use client-side fetch() to API routes, so this double-submit
 * pattern is the appropriate protection mechanism.
 */

import { NextRequest } from 'next/server'

/** Cookie name for the CSRF token */
export const CSRF_COOKIE_NAME = '__csrf'

/** Header name that clients must send */
export const CSRF_HEADER_NAME = 'x-csrf-token'

/** HTTP methods that require CSRF validation */
const CSRF_PROTECTED_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])

/** Routes exempt from CSRF (webhooks, cron jobs, external callbacks) */
const CSRF_EXEMPT_PREFIXES = [
  '/api/auth/',                  // Supabase auth (handled by Supabase SDK, separate session tokens)
  '/api/stripe/webhook',         // Stripe signature validation
  '/api/cron/',                  // Vercel cron (CRON_SECRET auth)
  '/api/vapi/',                  // VAPI webhook (API key auth)
  '/api/admin/prospection/webhooks/', // Resend/Twilio webhooks (signature auth)
  '/api/indexnow',               // IndexNow push (API key auth)
  '/api/revalidate',             // ISR revalidation (secret auth)
  '/api/csp-report',             // Browser CSP reports (no cookies)
  '/api/analytics',              // Analytics beacons (fire-and-forget)
  '/api/health',                 // Health check
  '/api/v1/',                    // Public API v1 (API key auth, no cookies)
]

/**
 * Generate a cryptographically random CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID()
}

/**
 * Check if a request requires CSRF validation.
 */
export function requiresCsrfValidation(request: NextRequest): boolean {
  if (!CSRF_PROTECTED_METHODS.has(request.method)) return false

  const pathname = request.nextUrl.pathname

  // Only validate API routes — non-API POSTs are Next.js internal (RSC, prefetch, etc.)
  if (!pathname.startsWith('/api/')) return false

  if (CSRF_EXEMPT_PREFIXES.some(prefix => pathname.startsWith(prefix))) return false

  return true
}

/**
 * Validate the CSRF token on an incoming request.
 * Returns true if valid, false if the token is missing or mismatched.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  // Both must be present and non-empty
  if (!cookieToken || !headerToken) return false

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) return false

  let mismatch = 0
  for (let i = 0; i < cookieToken.length; i++) {
    mismatch |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  }

  return mismatch === 0
}

// ---------------------------------------------------------------------------
// Client-side helpers (used in browser code)
// ---------------------------------------------------------------------------

/**
 * Read the CSRF token from the cookie (client-side).
 * The cookie is NOT HttpOnly so JavaScript can read it.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Wrapper around fetch() that automatically adds the CSRF token header.
 * Use this for all mutating requests (POST, PUT, DELETE, PATCH).
 *
 * Usage:
 *   import { fetchWithCsrf } from '@/lib/security/csrf'
 *   const res = await fetchWithCsrf('/api/contact', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(data),
 *   })
 */
export async function fetchWithCsrf(url: string, init?: RequestInit): Promise<Response> {
  const token = getCsrfToken()
  const headers = new Headers(init?.headers)

  if (token) {
    headers.set(CSRF_HEADER_NAME, token)
  }

  return fetch(url, { ...init, headers })
}
