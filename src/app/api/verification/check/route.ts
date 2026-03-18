/**
 * Bar License Verification API
 *
 * GET  /api/verification/check?bar_number=123&state_code=NY
 * POST /api/verification/check  { bar_number, state_code, attorney_id? }
 *
 * Public endpoint (no auth required).
 * Rate limited: 10 checks per minute per IP.
 * Returns verification result with attorney details when available.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { verifyBarLicense } from '@/lib/verification/bar-verification'
import { z } from 'zod'

const verifySchema = z.object({
  bar_number: z.string().min(1, 'Bar number is required').max(50),
  state_code: z.string().length(2, 'State code must be 2 characters'),
  attorney_id: z.string().uuid().optional(),
})

// ─── Shared handler ─────────────────────────────────────────────────

async function handleVerification(
  barNumber: string,
  stateCode: string,
  attorneyId: string | undefined,
  ip: string
) {
  // Run verification
  const result = await verifyBarLicense(barNumber, stateCode)

  // Log the verification attempt to the database (non-blocking)
  try {
    const adminClient = createAdminClient()
    await adminClient
      .from('verification_logs')
      .insert({
        attorney_id: attorneyId || null,
        bar_number: barNumber.replace(/[\s\-\.]/g, '').trim(),
        state_code: stateCode.toUpperCase(),
        status: result.status,
        response_data: {
          attorney_name: result.attorney_name,
          admission_date: result.admission_date,
          practice_status: result.practice_status,
          source: result.source,
        },
        verified_at: result.verified ? new Date().toISOString() : null,
        source: result.source || 'api_lookup',
        error_message: result.error_message || null,
        ip_address: ip,
      })
  } catch (logError) {
    logger.error('[Verification API] Failed to log verification', {
      error: logError instanceof Error ? logError.message : 'Unknown',
      barNumber,
      stateCode,
    })
  }

  logger.info('[Verification API] Check completed', {
    stateCode,
    status: result.status,
    source: result.source,
    ip,
  })

  return {
    success: true,
    verification: {
      verified: result.verified,
      status: result.status,
      attorney_name: result.attorney_name,
      admission_date: result.admission_date,
      practice_status: result.practice_status,
      source: result.source,
      automated: !['manual_review', 'error'].includes(result.status),
    },
  }
}

// ─── Rate limit check ───────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

function checkAndApplyRateLimit(request: NextRequest): { blocked: boolean; headers: Record<string, string> } {
  const ip = getClientIp(request)
  const rl = rateLimit(`verification:${ip}`, 10, 60_000) // 10 per minute

  return {
    blocked: !rl.success,
    headers: getRateLimitHeaders(rl),
  }
}

// ─── GET handler ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { blocked, headers } = checkAndApplyRateLimit(request)
  if (blocked) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. You can perform up to 10 verification checks per minute.' },
      { status: 429, headers }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const bar_number = searchParams.get('bar_number')
  const state_code = searchParams.get('state_code')

  const validation = verifySchema.safeParse({ bar_number, state_code })
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: validation.error.flatten() },
      { status: 400, headers }
    )
  }

  try {
    const ip = getClientIp(request)
    const data = await handleVerification(
      validation.data.bar_number,
      validation.data.state_code,
      undefined,
      ip
    )
    return NextResponse.json(data, { headers })
  } catch (error) {
    logger.error('[Verification API] GET error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

// ─── POST handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { blocked, headers } = checkAndApplyRateLimit(request)
  if (blocked) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. You can perform up to 10 verification checks per minute.' },
      { status: 429, headers }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers })
  }

  const validation = verifySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: validation.error.flatten() },
      { status: 400, headers }
    )
  }

  const { bar_number, state_code, attorney_id } = validation.data

  try {
    const ip = getClientIp(request)
    const data = await handleVerification(bar_number, state_code, attorney_id, ip)
    return NextResponse.json(data, { headers })
  } catch (error) {
    logger.error('[Verification API] POST error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
