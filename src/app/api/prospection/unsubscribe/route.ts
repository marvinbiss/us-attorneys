import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyUnsubscribeToken } from '@/lib/prospection/template-renderer'

export const dynamic = 'force-dynamic'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10 // max requests per window
const RATE_WINDOW = 60_000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

const securityHeaders = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

/**
 * Public GDPR unsubscribe endpoint
 * Accessible without authentication via signed token
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too many requests. Please try again later.', {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return new NextResponse(unsubscribePage('Missing token', false), {
        status: 400,
        headers: securityHeaders,
      })
    }

    // Verify HMAC-signed token using the same key derivation as generation
    const payload = verifyUnsubscribeToken(token)

    if (!payload) {
      return new NextResponse(unsubscribePage('Invalid or expired link', false), {
        status: 400,
        headers: securityHeaders,
      })
    }

    const supabase = createAdminClient()

    // Marquer le contact comme opted_out
    const { error } = await supabase
      .from('prospection_contacts')
      .update({
        consent_status: 'opted_out',
        opted_out_at: new Date().toISOString(),
      })
      .eq('id', payload.cid)

    if (error) {
      logger.error('Unsubscribe error', error)
      return new NextResponse(unsubscribePage('Erreur technique', false), {
        status: 500,
        headers: securityHeaders,
      })
    }

    logger.info('Contact unsubscribed', { contactId: payload.cid, channel: payload.ch })

    return new NextResponse(unsubscribePage('Unsubscription confirmed', true), {
      status: 200,
      headers: securityHeaders,
    })
  } catch (error) {
    logger.error('Unsubscribe endpoint error', error as Error)
    return new NextResponse(unsubscribePage('Erreur technique', false), {
      status: 500,
      headers: securityHeaders,
    })
  }
}

function unsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe - US Attorneys</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 40px; max-width: 400px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; color: #333; margin: 0 0 8px; }
    p { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '&#10003;' : '&#10007;'}</div>
    <h1>${escapeHtml(message)}</h1>
    <p>${success
      ? 'Vous ne recevrez plus de communications de notre part.'
      : 'Please try again or contact support@us-attorneys.com'
    }</p>
  </div>
</body>
</html>`
}
