/**
 * Deadline Tracker API — US Attorneys
 *
 * POST: Calculate statute of limitations deadline (primary method)
 * GET:  Calculate deadline from query params (cacheable, for embeds/links)
 *
 * Public endpoint, rate-limited (30 req/min per IP).
 * Returns deadline, urgency, exceptions, + matching attorney count.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateDeadline } from '@/lib/deadline-tracker'
import { rateLimit } from '@/lib/rate-limiter'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const requestSchema = z.object({
  specialtySlug: z.string().min(1).max(100),
  stateCode: z.string().length(2).transform(s => s.toUpperCase()),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  discoveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * Shared handler for both GET and POST.
 */
async function handleCalculation(
  specialtySlug: string,
  stateCode: string,
  incidentDate: string,
  discoveryDate?: string
) {
  // Validate incident date is not in the future
  const incident = new Date(incidentDate)
  if (incident > new Date()) {
    return NextResponse.json(
      { error: 'Incident date cannot be in the future.' },
      { status: 400 }
    )
  }

  // Calculate deadline
  const result = await calculateDeadline(specialtySlug, stateCode, incidentDate, discoveryDate)

  if (!result) {
    return NextResponse.json(
      { error: 'No statute of limitations data found for this combination of legal issue and state.' },
      { status: 404 }
    )
  }

  // Get matching attorney count (non-blocking, fail-safe)
  let attorneyCount = 0
  try {
    const supabase = createAdminClient()
    const { count: countByState } = await supabase
      .from('attorneys')
      .select('id', { count: 'exact', head: true })
      .eq('address_state', stateCode)
      .eq('is_active', true)

    attorneyCount = countByState || 0
  } catch {
    // Non-critical — proceed without attorney count
    logger.warn('Failed to fetch attorney count for deadline tracker', { stateCode, specialtySlug })
  }

  return NextResponse.json({
    ...result,
    attorneyCount,
  })
}

/**
 * POST /api/deadline-tracker — Primary calculation endpoint
 */
export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute for this public tool
  const rl = await rateLimit(request, { maxRequests: 30, windowMs: 60_000, failOpen: true })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { specialtySlug, stateCode, incidentDate, discoveryDate } = parsed.data
    return handleCalculation(specialtySlug, stateCode, incidentDate, discoveryDate)
  } catch (error) {
    logger.error('Deadline tracker API error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/deadline-tracker?specialty=...&state=...&date=...&discovery=...
 *
 * Cacheable endpoint for link sharing and embeds.
 * Cache-Control: 24h CDN, 7d stale-while-revalidate.
 */
export async function GET(request: NextRequest) {
  const rl = await rateLimit(request, { maxRequests: 30, windowMs: 60_000, failOpen: true })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    const rawParams = {
      specialtySlug: searchParams.get('specialty') || '',
      stateCode: searchParams.get('state') || '',
      incidentDate: searchParams.get('date') || '',
      discoveryDate: searchParams.get('discovery') || undefined,
    }

    const parsed = requestSchema.safeParse(rawParams)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid parameters. Required: specialty (string), state (2-letter code), date (YYYY-MM-DD).',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { specialtySlug, stateCode, incidentDate, discoveryDate } = parsed.data
    const response = await handleCalculation(specialtySlug, stateCode, incidentDate, discoveryDate)

    // Add cache headers for GET requests (24h CDN cache, 7d stale-while-revalidate)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    )

    return response
  } catch (error) {
    logger.error('Deadline tracker GET API error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
