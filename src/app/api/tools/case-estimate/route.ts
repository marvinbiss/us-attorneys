/**
 * GET /api/tools/case-estimate — Returns case outcome statistics
 *
 * Query params:
 *   - specialty: practice area slug (required)
 *   - state: 2-letter state code (required)
 *
 * Cache: 24h (CACHE_TTL.stats)
 * Rate limit: 20/min per IP
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCaseStatistics, getSimilarCases } from '@/lib/case-estimator'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

const RATE_LIMIT_CONFIG = { maxRequests: 20, windowMs: 60_000, failOpen: true }

export async function GET(request: NextRequest) {
  // Rate limiting
  try {
    const ip = getClientIp(request.headers)
    const key = `case-estimate:${ip}`
    const rl = await checkRateLimit(key, RATE_LIMIT_CONFIG)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(rl.remaining),
          },
        }
      )
    }
  } catch (err) {
    logger.warn('[case-estimate] Rate limit check failed, allowing request', { error: String(err) })
  }

  // Parse params
  const { searchParams } = new URL(request.url)
  const specialty = searchParams.get('specialty')
  const state = searchParams.get('state')

  if (!specialty || !state) {
    return NextResponse.json(
      { error: 'Missing required parameters: specialty and state' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{2}$/i.test(state)) {
    return NextResponse.json(
      { error: 'State must be a 2-letter code (e.g., CA, TX, NY)' },
      { status: 400 }
    )
  }

  try {
    const [statistics, similarCases] = await Promise.all([
      getCaseStatistics(specialty, state.toUpperCase()),
      getSimilarCases(specialty, state.toUpperCase(), 10),
    ])

    return NextResponse.json(
      {
        statistics,
        similarCases,
        meta: {
          specialty,
          state: state.toUpperCase(),
          generatedAt: new Date().toISOString(),
          disclaimer:
            'This data is for informational purposes only and does not constitute legal advice. Every case is unique. Consult a qualified attorney.',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    )
  } catch (err) {
    logger.error('[case-estimate] API error', { error: String(err) })
    return NextResponse.json(
      { error: 'Failed to fetch case statistics. Please try again later.' },
      { status: 500 }
    )
  }
}
