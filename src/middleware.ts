import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit, getRateLimitConfig, getRateLimitKey, getClientIp } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

/**
 * Middleware v2 — simplified
 * - Session refresh
 * - Auth guard for private routes
 * - URL canonicalization
 * - Security headers
 * - Rate limiting for API routes (Upstash Redis in production, in-memory fallback in dev)
 */

// Security headers
function addSecurityHeaders(response: NextResponse, request: NextRequest, nonce: string): NextResponse {
  const userAgent = request.headers.get('user-agent') || ''
  const isCapacitor = userAgent.includes('Capacitor') || userAgent.includes('Android') || userAgent.includes('iPhone')
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev || isCapacitor) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    return response
  }

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://api-adresse.data.gouv.fr https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.openstreetmap.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  const cspHeader = cspDirectives.join('; ')
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('x-nonce', nonce)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  return response
}

// URL canonicalization
function getCanonicalRedirect(request: NextRequest): string | null {
  const url = request.nextUrl
  const host = request.headers.get('host') || 'servicesartisans.fr'

  if (process.env.NODE_ENV === 'production') {
    if (url.protocol === 'http:' || host.startsWith('www.')) {
      const canonicalHost = host.replace(/^www\./, '')
      return `https://${canonicalHost}${url.pathname}${url.search}`
    }
  }

  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    return `https://${host}${url.pathname.slice(0, -1)}${url.search}`
  }

  // Strip UTM and tracking parameters to avoid duplicate content
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
  const hasTracking = trackingParams.some(p => url.searchParams.has(p))
  if (hasTracking) {
    trackingParams.forEach(p => url.searchParams.delete(p))
    const cleanSearch = url.searchParams.toString()
    return `https://${host}${url.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Redirect /tarifs-artisans → /tarifs (301 permanent)
  if (pathname.startsWith('/tarifs-artisans')) {
    const newPath = pathname.replace('/tarifs-artisans', '/tarifs')
    const host = request.headers.get('host') || 'servicesartisans.fr'
    return NextResponse.redirect(`https://${host}${newPath}${request.nextUrl.search}`, 301)
  }

  // Redirect legacy/mistyped URLs → correct paths (301 permanent)
  const legacyRedirects: Record<string, string> = {
    '/problemes-courants': '/problemes',
    '/outils/diagnostic-artisan': '/outils/diagnostic',
  }
  if (legacyRedirects[pathname]) {
    const host = request.headers.get('host') || 'servicesartisans.fr'
    return NextResponse.redirect(`https://${host}${legacyRedirects[pathname]}${request.nextUrl.search}`, 301)
  }

  // URL canonicalization
  const canonicalUrl = getCanonicalRedirect(request)
  if (canonicalUrl && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(canonicalUrl, 301)
  }

  // Auth guard for private spaces
  if (pathname.startsWith('/espace-client') || pathname.startsWith('/espace-artisan') || (pathname.startsWith('/admin') && pathname !== '/admin/connexion')) {
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
        return NextResponse.redirect(new URL(`/connexion?redirect=${redirectUrl}`, request.url))
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (pathname.startsWith('/espace-artisan') && profile.role !== 'artisan') {
          return NextResponse.redirect(new URL('/espace-client', request.url))
        }
        if (pathname.startsWith('/espace-client') && profile.role === 'artisan') {
          return NextResponse.redirect(new URL('/espace-artisan', request.url))
        }
      }
    } catch (error) {
      logger.error('Middleware auth error:', error)
      const loginUrl = new URL('/connexion', request.url)
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

  // Refresh session
  let response: NextResponse
  try {
    response = await updateSession(request)
  } catch {
    response = NextResponse.next()
  }

  response.headers.set('x-pathname', pathname)

  // X-Robots-Tag + Cache-Control for all private and admin routes
  if (
    pathname.startsWith('/espace-artisan') ||
    pathname.startsWith('/espace-client') ||
    pathname.startsWith('/admin')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  }

  return addSecurityHeaders(response, request, nonce)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|sitemap/|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml)$).*)',
  ],
}
