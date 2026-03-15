import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit, getRateLimitConfig, getRateLimitKey, getClientIp } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

/**
 * Middleware v3 — performance-optimized
 * - Session refresh (with validation cache)
 * - Auth guard for private routes
 * - URL canonicalization
 * - CSP header with per-request nonce (other security headers in next.config.js)
 * - Rate limiting for API routes (Upstash Redis in production, in-memory fallback in dev)
 */

// Pre-computed CSP parts — only nonce changes per request
const CSP_PREFIX = "default-src 'self'; script-src 'self' 'nonce-"
const CSP_SUFFIX = "' 'strict-dynamic' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "img-src 'self' data: blob: https: http:; " +
  "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://api-adresse.data.gouv.fr https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; " +
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.openstreetmap.org; " +
  "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"

// CSP headers only — other security headers are set in next.config.js (more efficient, handled at CDN edge)
function addCspHeaders(response: NextResponse, request: NextRequest, nonce: string): NextResponse {
  const userAgent = request.headers.get('user-agent') || ''
  const isCapacitor = userAgent.includes('Capacitor') || userAgent.includes('Android') || userAgent.includes('iPhone')
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev || isCapacitor) {
    return response
  }

  response.headers.set('Content-Security-Policy', CSP_PREFIX + nonce + CSP_SUFFIX)
  response.headers.set('x-nonce', nonce)

  return response
}

// Legacy redirects — hoisted to module scope to avoid per-request allocation
const LEGACY_REDIRECTS: Record<string, string> = {
  '/issues-courants': '/issues',
  '/tools/diagnostic-artisan': '/tools/diagnostic',
  '/price-index-prix': '/price-index',
  '/calculator': '/tools/calculator-prix',
}

// URL canonicalization — all fixes combined into a single 301 hop
function getCanonicalRedirect(request: NextRequest): string | null {
  const url = request.nextUrl
  const host = request.headers.get('host') || 'us-attorneys.com'

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
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
  const hasTracking = trackingParams.some(p => url.searchParams.has(p))
  let search = url.search
  if (hasTracking) {
    trackingParams.forEach(p => url.searchParams.delete(p))
    const cleanSearch = url.searchParams.toString()
    search = cleanSearch ? `?${cleanSearch}` : ''
    needsRedirect = true
  }

  // 4. Lowercase normalization — prevent duplicate content from mixed-case URLs
  //    Exclude artisan publicId paths: /practice-areas/{service}/{location}/{publicId}
  //    because stable_id contains mixed-case characters (HMAC-SHA256 base64)
  const isArtisanPublicIdPath = /^\/services\/[^/]+\/[^/]+\/[^/]+$/.test(pathname)
  if (!isArtisanPublicIdPath && pathname !== pathname.toLowerCase()) {
    pathname = pathname.toLowerCase()
    needsRedirect = true
  }

  if (needsRedirect) {
    return `https://${canonicalHost}${pathname}${search}`
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect /pricing-artisans → /pricing (301 permanent, cached at CDN edge)
  if (pathname.startsWith('/pricing-artisans')) {
    const newPath = pathname.replace('/pricing-artisans', '/pricing')
    const host = request.headers.get('host') || 'us-attorneys.com'
    const redirectResponse = NextResponse.redirect(`https://${host}${newPath}${request.nextUrl.search}`, 301)
    redirectResponse.headers.set('Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate=31536000')
    redirectResponse.headers.set('CDN-Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate=31536000')
    return redirectResponse
  }

  // Redirect legacy/mistyped URLs → correct paths (301 permanent, cached at CDN edge)
  if (LEGACY_REDIRECTS[pathname]) {
    const host = request.headers.get('host') || 'us-attorneys.com'
    const legacyRedirect = NextResponse.redirect(`https://${host}${LEGACY_REDIRECTS[pathname]}${request.nextUrl.search}`, 301)
    legacyRedirect.headers.set('Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate=31536000')
    legacyRedirect.headers.set('CDN-Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate=31536000')
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
  if (pathname.startsWith('/client-dashboard') || pathname.startsWith('/attorney-dashboard') || (pathname.startsWith('/admin') && pathname !== '/admin/login')) {
    try {
      const { createServerClient } = await import('@supabase/ssr')

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        const redirectUrl = encodeURIComponent(pathname)
        return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url))
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (pathname.startsWith('/attorney-dashboard') && profile.role !== 'artisan') {
          return NextResponse.redirect(new URL('/client-dashboard', request.url))
        }
        if (pathname.startsWith('/client-dashboard') && profile.role === 'artisan') {
          return NextResponse.redirect(new URL('/attorney-dashboard', request.url))
        }
      }
    } catch (error) {
      logger.error('Middleware auth error:', error)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Rate limiting for API routes (skip health check — must always respond fast)
  if (pathname.startsWith('/api/') && pathname !== '/api/health') {
    const clientIp = getClientIp(request.headers)
    const rateLimitConfig = getRateLimitConfig(pathname)
    const rateLimitKey = getRateLimitKey(clientIp, pathname)

    try {
      const result = await checkRateLimit(rateLimitKey, rateLimitConfig)

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
        return new NextResponse(
          JSON.stringify({ error: 'Trop de requêtes. Veuillez réessayer plus tard.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(rateLimitConfig.max),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(result.resetTime),
            },
          }
        )
      }
    } catch (error) {
      // Fail open: if rate limiter errors, allow the request through
      logger.error('Rate limiter error:', error)
    }
  }

  // Refresh session — only for routes that need auth (skip Supabase call for public pages)
  let response: NextResponse
  const needsAuth = pathname.startsWith('/espace-') || pathname.startsWith('/admin') || pathname.startsWith('/booking')
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
    '/price-index/',
    '/tools/',
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
    '/before-after',
    '/project-planner',
    '/attorney-badge',
    '/careers',
    '/price-index',
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
    '/project-checklist',
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
  if (publicCacheExact.has(pathname) || publicCachePrefixes.some(p => pathname.startsWith(p))) {
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  }

  return addCspHeaders(response, request, nonce)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|sitemap/|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|css|js|woff2?)$).*)',
  ],
}
