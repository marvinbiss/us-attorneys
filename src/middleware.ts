import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import {
  checkRateLimit,
  getRateLimitConfig,
  getRateLimitKey,
  getClientIp,
} from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { SPANISH_PA_SLUGS, ENGLISH_PA_SLUGS } from '@/lib/seo/hreflang'
import {
  CSRF_COOKIE_NAME,
  generateCsrfToken,
  requiresCsrfValidation,
  validateCsrfToken,
} from '@/lib/security/csrf'

/**
 * Middleware v4 — security-hardened + performance-optimized
 * - Session refresh (with validation cache)
 * - Auth guard for private routes
 * - URL canonicalization
 * - Full security headers on ALL dynamic responses (defense-in-depth on top of next.config.js)
 * - CSP header with per-request nonce
 * - Rate limiting for API routes (Upstash Redis in production, in-memory fallback in dev)
 */

const IS_DEV = process.env.NODE_ENV === 'development'

// ---------------------------------------------------------------------------
// Supabase health probe — lightweight degraded-mode detection for Edge Runtime.
// Caches result in module scope to avoid probing on every single request.
// ---------------------------------------------------------------------------
let lastHealthCheck = 0
let lastHealthResult = false // false = healthy, true = degraded
const HEALTH_CHECK_INTERVAL_MS = 30_000 // probe at most every 30s per Edge isolate

async function checkSupabaseHealth(): Promise<boolean> {
  const now = Date.now()
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL_MS) {
    return lastHealthResult
  }
  lastHealthCheck = now

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    lastHealthResult = true
    return true
  }

  try {
    // HEAD request to the Supabase REST endpoint — minimal payload, fast response
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    lastHealthResult = !res.ok
  } catch {
    lastHealthResult = true
    logger.warn('Supabase health probe failed — entering degraded mode')
  }

  return lastHealthResult
}

// ---------------------------------------------------------------------------
// Content-Security-Policy — pre-computed parts (only nonce changes per request)
// ---------------------------------------------------------------------------

/** Build CSP string. In development, adds 'unsafe-eval' for Next.js HMR/Fast Refresh. */
function buildCSP(nonce: string): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    'https://js.stripe.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://googleads.g.doubleclick.net',
    'https://www.googleadservices.com',
    'https://connect.facebook.net',
    'https://t.contentsquare.net',
    ...(IS_DEV ? ["'unsafe-eval'"] : []),
  ].join(' ')

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.sentry.io https://connect.facebook.net https://t.contentsquare.net https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org" +
      (IS_DEV ? ' ws://localhost:* http://localhost:*' : ''),
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.openstreetmap.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

/**
 * Build Content-Security-Policy-Report-Only header.
 * Stricter than the enforcing CSP — used to discover violations before tightening.
 * Reports are sent to /api/csp-report for logging and analysis.
 */
function buildCSPReportOnly(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com *.google-analytics.com connect.facebook.net t.contentsquare.net",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "img-src 'self' data: blob: images.unsplash.com *.google-analytics.com *.facebook.com",
    "connect-src 'self' *.supabase.co *.google-analytics.com *.facebook.com",
    "font-src 'self' fonts.gstatic.com",
    "frame-src 'self' *.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'report-uri /api/csp-report',
  ].join('; ')
}

// ---------------------------------------------------------------------------
// Security headers — applied to ALL dynamic responses as defense-in-depth.
// These duplicate next.config.js headers() which are applied at CDN edge;
// the middleware layer ensures coverage for streamed / dynamic responses
// that might bypass the static headers layer.
// ---------------------------------------------------------------------------

function addSecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  nonce: string
): NextResponse {
  const userAgent = request.headers.get('user-agent') || ''
  const isCapacitor =
    userAgent.includes('Capacitor') || userAgent.includes('Android') || userAgent.includes('iPhone')

  // Always set non-CSP security headers (lightweight, no reason to skip)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  )

  // HSTS — only in production (avoid locking localhost into HTTPS)
  if (!IS_DEV) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  // CSP — skip for Capacitor (WebView has its own CSP constraints)
  if (!isCapacitor) {
    response.headers.set('Content-Security-Policy', buildCSP(nonce))
    response.headers.set('x-nonce', nonce)

    // CSP-Report-Only — strict policy for monitoring violations without blocking.
    // This runs in parallel with the enforcing CSP above. Violations are reported
    // to /api/csp-report for analysis before tightening the enforcing policy.
    response.headers.set('Content-Security-Policy-Report-Only', buildCSPReportOnly())
  }

  return response
}

// Legacy redirects — hoisted to module scope to avoid per-request allocation
const LEGACY_REDIRECTS: Record<string, string> = {
  '/issues-courants': '/issues', // legacy French URL redirect
  '/tools/diagnostic-artisan': '/tools/diagnostic', // legacy French URL redirect
  '/tools/calculator-prix': '/tools/calculator', // legacy French URL redirect
}

// URL canonicalization — all fixes combined into a single 301 hop
function getCanonicalRedirect(request: NextRequest): string | null {
  const url = request.nextUrl
  const host = request.headers.get('host') || 'lawtendr.com'

  let canonicalHost = host
  let pathname = url.pathname
  let needsRedirect = false

  // 1. http → https + www → non-www
  if (process.env.NODE_ENV === 'production') {
    if (url.protocol === 'http:' || host.startsWith('www.')) {
      canonicalHost = host.replace(/^www\./, '')
      needsRedirect = true
    }
  }

  // 2. Trailing slash removal
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1)
    needsRedirect = true
  }

  // 3. Strip UTM and tracking parameters to avoid duplicate content
  const trackingParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
  ]
  const hasTracking = trackingParams.some((p) => url.searchParams.has(p))
  let search = url.search
  if (hasTracking) {
    trackingParams.forEach((p) => url.searchParams.delete(p))
    const cleanSearch = url.searchParams.toString()
    search = cleanSearch ? `?${cleanSearch}` : ''
    needsRedirect = true
  }

  // 4. Lowercase normalization — prevent duplicate content from mixed-case URLs
  //    Exclude attorney publicId paths: /practice-areas/{service}/{location}/{publicId}
  //    because stable_id contains mixed-case characters (HMAC-SHA256 base64)
  const isAttorneyPublicIdPath = /^\/practice-areas\/[^/]+\/[^/]+\/[^/]+$/.test(pathname)
  if (!isAttorneyPublicIdPath && pathname !== pathname.toLowerCase()) {
    pathname = pathname.toLowerCase()
    needsRedirect = true
  }

  if (needsRedirect) {
    return `https://${canonicalHost}${pathname}${search}`
  }

  return null
}

export async function middleware(request: NextRequest) {
  const requestStartTime = Date.now()
  const { pathname } = request.nextUrl

  // Redirect legacy pricing URLs → /pricing (301 permanent, cached at CDN edge)
  if (pathname.startsWith('/pricing-artisans') || pathname.startsWith('/pricing-attorneys')) {
    const newPath = pathname
      .replace('/pricing-artisans', '/pricing')
      .replace('/pricing-attorneys', '/pricing')
    const host = request.headers.get('host') || 'lawtendr.com'
    const redirectResponse = NextResponse.redirect(
      `https://${host}${newPath}${request.nextUrl.search}`,
      301
    )
    redirectResponse.headers.set(
      'Cache-Control',
      'public, s-maxage=31536000, stale-while-revalidate=31536000'
    )
    redirectResponse.headers.set(
      'CDN-Cache-Control',
      'public, s-maxage=31536000, stale-while-revalidate=31536000'
    )
    return redirectResponse
  }

  // Redirect legacy/mistyped URLs → correct paths (301 permanent, cached at CDN edge)
  if (LEGACY_REDIRECTS[pathname]) {
    const host = request.headers.get('host') || 'lawtendr.com'
    const legacyRedirect = NextResponse.redirect(
      `https://${host}${LEGACY_REDIRECTS[pathname]}${request.nextUrl.search}`,
      301
    )
    legacyRedirect.headers.set(
      'Cache-Control',
      'public, s-maxage=31536000, stale-while-revalidate=31536000'
    )
    legacyRedirect.headers.set(
      'CDN-Cache-Control',
      'public, s-maxage=31536000, stale-while-revalidate=31536000'
    )
    return legacyRedirect
  }

  // URL canonicalization
  const canonicalUrl = getCanonicalRedirect(request)
  if (canonicalUrl && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(canonicalUrl, 301)
  }

  // Generate nonce AFTER early redirects to avoid wasting crypto on redirected requests
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Auth guard for private spaces
  if (
    pathname.startsWith('/client-dashboard') ||
    pathname.startsWith('/attorney-dashboard') ||
    (pathname.startsWith('/admin') && pathname !== '/admin/login')
  ) {
    try {
      const { createServerClient } = await import('@supabase/ssr')

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set() {},
            remove() {},
          },
        }
      )

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        const redirectUrl = encodeURIComponent(pathname)
        return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url))
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single()

      // Admin routes: verify user has admin role (authentication alone is not enough)
      if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (!profile?.is_admin) {
          logger.warn('Non-admin user attempted to access admin route', {
            userId: user.id,
            pathname,
          })
          return NextResponse.redirect(new URL('/', request.url))
        }
      }

      if (profile) {
        if (pathname.startsWith('/attorney-dashboard') && profile.role !== 'attorney') {
          return NextResponse.redirect(new URL('/client-dashboard', request.url))
        }
        if (pathname.startsWith('/client-dashboard') && profile.role === 'attorney') {
          return NextResponse.redirect(new URL('/attorney-dashboard', request.url))
        }
      }
    } catch (error: unknown) {
      logger.error('Middleware auth error:', error)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Rate limiting for API routes and heavy page routes
  // Skip health check (must always respond fast) and csp-report (has its own rate limiting)
  if (
    (pathname.startsWith('/api/') &&
      pathname !== '/api/health' &&
      pathname !== '/api/csp-report') ||
    pathname.startsWith('/find/')
  ) {
    const clientIp = getClientIp(request.headers)
    const rateLimitConfig = getRateLimitConfig(pathname, request.method)
    const rateLimitKey = getRateLimitKey(clientIp, pathname)

    try {
      const result = await checkRateLimit(rateLimitKey, rateLimitConfig)

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(result.resetTime),
            },
          }
        )
      }
    } catch (error: unknown) {
      // Fail open: if rate limiter errors, allow the request through
      logger.error('Rate limiter error:', error)
    }
  }

  // ---------------------------------------------------------------------------
  // CSRF Origin Check — block cross-origin state-changing requests.
  // Runs BEFORE the double-submit cookie check for defense-in-depth.
  // Exempt: GET/HEAD/OPTIONS, Bearer-authenticated requests (cron jobs),
  // and webhook endpoints (Stripe, Resend, Vapi) which use signature auth.
  // ---------------------------------------------------------------------------
  const CSRF_ORIGIN_EXEMPT_PREFIXES = [
    '/api/stripe/webhook',
    '/api/admin/prospection/webhooks/',
    '/api/vapi/webhook',
  ]
  const stateChangingMethods = new Set(['POST', 'PUT', 'DELETE', 'PATCH'])

  if (stateChangingMethods.has(request.method)) {
    const authHeader = request.headers.get('authorization') || ''
    const hasBearerToken = authHeader.startsWith('Bearer ')
    const isWebhookRoute = CSRF_ORIGIN_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))

    if (!hasBearerToken && !isWebhookRoute) {
      const origin = request.headers.get('origin')
      const referer = request.headers.get('referer')
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

      let originAllowed = false

      if (origin) {
        // Origin header present — validate it matches our domain
        try {
          const originHost = new URL(origin).origin
          const siteHost = siteUrl ? new URL(siteUrl).origin : null
          const requestHost = request.headers.get('host') || ''
          originAllowed =
            (siteHost && originHost === siteHost) ||
            originHost === `https://${requestHost}` ||
            originHost === `http://${requestHost}`
        } catch {
          originAllowed = false
        }
      } else if (referer) {
        // No Origin header — use Referer as fallback (same-origin check)
        try {
          const refererHost = new URL(referer).origin
          const siteHost = siteUrl ? new URL(siteUrl).origin : null
          const requestHost = request.headers.get('host') || ''
          originAllowed =
            (siteHost && refererHost === siteHost) ||
            refererHost === `https://${requestHost}` ||
            refererHost === `http://${requestHost}`
        } catch {
          originAllowed = false
        }
      } else {
        // Neither Origin nor Referer — reject (cross-origin requests always send Origin)
        originAllowed = false
      }

      if (!originAllowed) {
        logger.warn('CSRF origin check failed', {
          action: 'csrf_origin_block',
          pathname,
          method: request.method,
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer'),
        })
        return new NextResponse(JSON.stringify({ error: 'Forbidden: origin not allowed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // CSRF double-submit cookie validation
  // Mutating requests (POST/PUT/DELETE/PATCH) to API routes must include an
  // X-CSRF-Token header matching the __csrf cookie. Webhooks and cron jobs
  // are exempt (they use their own authentication: signatures, API keys, secrets).
  // ---------------------------------------------------------------------------
  if (requiresCsrfValidation(request)) {
    if (!validateCsrfToken(request)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid or missing CSRF token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // Refresh session — only for routes that need auth (skip Supabase call for public pages)
  let response: NextResponse
  const needsAuth = pathname.startsWith('/admin') || pathname.startsWith('/booking')
  if (needsAuth) {
    try {
      response = await updateSession(request)
    } catch {
      response = NextResponse.next()
    }
  } else {
    response = NextResponse.next()
  }

  response.headers.set('x-pathname', pathname)

  // X-Robots-Tag + Cache-Control for all private and admin routes
  if (
    pathname.startsWith('/attorney-dashboard') ||
    pathname.startsWith('/client-dashboard') ||
    pathname.startsWith('/admin')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  }

  // CDN cache headers for public pages.
  // Vercel CDN does NOT cache 4xx/5xx responses regardless of Cache-Control,
  // so these headers only affect successful (2xx) responses.
  //
  // Strategy: prefix-match covers all dynamic/nested routes, exact-match covers leaf pages.
  // Any public route that starts with one of these prefixes gets CDN caching.
  const publicCachePrefixes = [
    // English routes
    '/practice-areas/',
    '/quotes/',
    '/pricing/',
    '/reviews/',
    '/cities/',
    '/states/',
    '/regions/',
    '/issues/',
    '/emergency/',
    '/guides/',
    '/faq/',
    '/blog/',
    '/compare/',
    '/tools/',
    // English intent routes
    '/attorneys/',
    '/hire/',
    '/cost/',
    '/best/',
    '/free-consultation/',
    '/affordable/',
    '/pro-bono/',
    '/situations/',
    '/find/',
    '/counties/',
    '/legal-questions/',
    '/industry/',
    // Spanish mirror routes
    '/abogados/',
    '/contratar/',
    '/costo/',
    '/opiniones/',
    '/emergencia/',
  ]
  // Exact-match pages (no sub-routes, or the index page of a prefix group)
  const publicCacheExact = new Set([
    '/',
    '/blog',
    '/faq',
    '/contact',
    '/how-it-works',
    '/compare',
    '/attorneys',
    '/attorney-map',
    '/about',
    '/guarantee',
    '/terms',
    '/privacy',
    '/accessibility',
    '/attorney-badge',
    '/careers',
    '/glossary',
    '/guides',
    '/faq',
    '/reviews',
    '/issues',
    '/states',
    '/regions',
    '/cities',
    '/regulations',
    '/tools',
    '/attorney-statistics',
    '/press',
    '/partners',
    '/mediation',
    '/legal',
    '/review-policy',
    '/sitemap-page',
    '/verify-attorney',
    '/verification-process',
    '/quotes',
    '/pricing',
    '/search',
  ])
  if (publicCacheExact.has(pathname) || publicCachePrefixes.some((p) => pathname.startsWith(p))) {
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    response.headers.set(
      'CDN-Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    )
  }

  // hreflang header injection for bilingual pages
  // Maps English route prefixes to their Spanish counterparts
  const spanishPrefixes = ['/abogados/', '/contratar/', '/costo/', '/opiniones/', '/emergencia/']
  const englishPrefixes = [
    '/attorneys/',
    '/practice-areas/',
    '/hire/',
    '/cost/',
    '/reviews/',
    '/emergency/',
  ]
  const spanishToEnglish: Record<string, string> = {
    '/abogados/': '/attorneys/',
    '/contratar/': '/hire/',
    '/costo/': '/cost/',
    '/opiniones/': '/reviews/',
    '/emergencia/': '/emergency/',
  }
  const englishToSpanish: Record<string, string> = {
    '/attorneys/': '/abogados/',
    '/practice-areas/': '/abogados/',
    '/hire/': '/contratar/',
    '/cost/': '/costo/',
    '/reviews/': '/opiniones/',
    '/emergency/': '/emergencia/',
  }

  // Full 259-entry practice area slug maps imported from hreflang.ts
  const enToEsPA = SPANISH_PA_SLUGS
  const esToEnPA = ENGLISH_PA_SLUGS

  /** Translate path segments between English and Spanish PA slugs */
  function translatePathSegments(restOfPath: string, paMap: Record<string, string>): string {
    return restOfPath
      .split('/')
      .map((seg) => paMap[seg] || seg)
      .join('/')
  }

  const matchedSpanish = spanishPrefixes.find((p) => pathname.startsWith(p))
  const matchedEnglish = englishPrefixes.find((p) => pathname.startsWith(p))

  const host = request.headers.get('host') || 'lawtendr.com'

  if (matchedSpanish) {
    // Spanish page — set Content-Language and add hreflang Link headers
    response.headers.set('Content-Language', 'es')
    const englishPrefix = spanishToEnglish[matchedSpanish]
    const restOfPath = pathname.slice(matchedSpanish.length)
    const translatedPath = translatePathSegments(restOfPath, esToEnPA)
    const englishUrl = `https://${host}${englishPrefix}${translatedPath}`
    const selfUrl = `https://${host}${pathname}`
    response.headers.set(
      'Link',
      `<${selfUrl}>; rel="alternate"; hreflang="es", <${englishUrl}>; rel="alternate"; hreflang="en", <${englishUrl}>; rel="alternate"; hreflang="x-default"`
    )
  } else if (matchedEnglish) {
    // English page with Spanish mirror — add hreflang Link headers
    const spanishPrefix = englishToSpanish[matchedEnglish]
    const restOfPath = pathname.slice(matchedEnglish.length)
    const translatedPath = translatePathSegments(restOfPath, enToEsPA)
    const spanishUrl = `https://${host}${spanishPrefix}${translatedPath}`
    const selfUrl = `https://${host}${pathname}`
    response.headers.set(
      'Link',
      `<${selfUrl}>; rel="alternate"; hreflang="en", <${spanishUrl}>; rel="alternate"; hreflang="es", <${selfUrl}>; rel="alternate"; hreflang="x-default"`
    )
  }

  // Set CSRF cookie if not already present.
  // The cookie is NOT HttpOnly so client-side JS can read it and send it
  // as an X-CSRF-Token header (double-submit cookie pattern).
  if (!request.cookies.get(CSRF_COOKIE_NAME)) {
    response.cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), {
      httpOnly: false, // Must be readable by JavaScript
      secure: !IS_DEV,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  // ---------------------------------------------------------------------------
  // Graceful degradation — lightweight Supabase health probe.
  // Pings the Supabase REST endpoint (HEAD request, 2s timeout).
  // On failure, sets X-Degraded-Mode header so pages can serve cached content.
  //
  // Rate-limited to avoid hammering Supabase: only probes once per ~30s per
  // Edge isolate (in-memory timestamp). Public GET pages only (skip API routes,
  // auth routes, etc. which have their own error handling).
  // ---------------------------------------------------------------------------
  const isPublicPage =
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/client-dashboard') &&
    !pathname.startsWith('/attorney-dashboard') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/register')

  if (isPublicPage) {
    const degraded = await checkSupabaseHealth()
    if (degraded) {
      response.headers.set('X-Degraded-Mode', 'true')
      response.headers.set('X-Degraded-Reason', 'supabase-unreachable')
    }
  }

  // Response time tracking — set header on all responses, warn on slow requests (>2s)
  const responseTimeMs = Date.now() - requestStartTime
  response.headers.set('X-Response-Time', `${responseTimeMs}ms`)

  if (responseTimeMs > 2000) {
    logger.warn(`Slow middleware response: ${responseTimeMs}ms`, {
      action: 'slow_request',
      pathname,
      responseTimeMs,
    })
  }

  return addSecurityHeaders(response, request, nonce)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|sitemap/|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|css|js|woff2?)$).*)',
  ],
}
