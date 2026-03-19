/**
 * Email Unsubscribe — One-Click Unsubscribe
 *
 * GET /api/email/unsubscribe?aid=<attorney_id>&token=<hmac_token>
 *
 * Verifies the signed token to prevent abuse, then:
 *   - Updates email_preferences.unsubscribed_at
 *   - Returns an HTML confirmation page
 *
 * Also supports POST for List-Unsubscribe-Post header (RFC 8058).
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://lawtendr.com'

// ── Token verification ───────────────────────────────────────────────────────

function verifyToken(attorneyId: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) {
    logger.warn('[Unsubscribe] UNSUBSCRIBE_SECRET not set')
    return false
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(attorneyId)
    .digest('hex')

  // Timing-safe comparison
  if (token.length !== expected.length) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'utf-8'),
      Buffer.from(expected, 'utf-8'),
    )
  } catch {
    return false
  }
}

// ── Unsubscribe logic ────────────────────────────────────────────────────────

async function processUnsubscribe(attorneyId: string): Promise<{ success: boolean; error?: string }> {
  // adminClient justified: no user session — HMAC-verified unsubscribe link, needs direct DB write
  const supabase = createAdminClient()

  // Upsert email preferences — set unsubscribed_at
  const { error } = await supabase
    .from('email_preferences')
    .upsert(
      {
        attorney_id: attorneyId,
        marketing_emails: false,
        product_updates: false,
        weekly_stats: false,
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'attorney_id' },
    )

  if (error) {
    logger.error('[Unsubscribe] Failed to update preferences', { attorneyId, error })
    return { success: false, error: 'Database error' }
  }

  logger.info('[Unsubscribe] Attorney unsubscribed', { attorneyId })
  return { success: true }
}

// ── HTML response ────────────────────────────────────────────────────────────

function unsubscribeHtml(success: boolean, error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} - US Attorneys</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      color: #333;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 { font-size: 24px; margin: 0 0 12px; }
    p { color: #666; line-height: 1.6; }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 20px;
      font-weight: 500;
    }
    .button:hover { background: #1d4ed8; }
    .subtle { font-size: 13px; color: #999; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    ${success ? `
      <div class="icon">&#9993;</div>
      <h1>You have been unsubscribed</h1>
      <p>You will no longer receive marketing emails from US Attorneys. This may take up to 24 hours to take effect.</p>
      <p>If you change your mind, you can re-enable emails from your dashboard.</p>
      <a href="${APP_URL}/attorney-dashboard/subscription" class="button">Go to Dashboard</a>
      <p class="subtle">You will still receive essential transactional emails (booking confirmations, security alerts).</p>
    ` : `
      <div class="icon">&#9888;</div>
      <h1>Something went wrong</h1>
      <p>${error || 'We could not process your unsubscribe request. The link may be invalid or expired.'}</p>
      <a href="${APP_URL}" class="button">Go to Homepage</a>
    `}
  </div>
</body>
</html>`
}

// ── GET handler (one-click unsubscribe via link) ────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const attorneyId = searchParams.get('aid')
  const token = searchParams.get('token')

  if (!attorneyId || !token) {
    return new NextResponse(
      unsubscribeHtml(false, 'Missing required parameters.'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(attorneyId)) {
    return new NextResponse(
      unsubscribeHtml(false, 'Invalid request.'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  // Verify token
  if (!verifyToken(attorneyId, token)) {
    return new NextResponse(
      unsubscribeHtml(false, 'Invalid or expired unsubscribe link.'),
      { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  // Process unsubscribe
  const result = await processUnsubscribe(attorneyId)

  return new NextResponse(
    unsubscribeHtml(result.success, result.error),
    {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  )
}

// ── POST handler (RFC 8058 List-Unsubscribe-Post) ───────────────────────────

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const attorneyId = searchParams.get('aid')
  const token = searchParams.get('token')

  if (!attorneyId || !token) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  if (!verifyToken(attorneyId, token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  const result = await processUnsubscribe(attorneyId)

  return NextResponse.json(
    { success: result.success, error: result.error },
    { status: result.success ? 200 : 500 },
  )
}
