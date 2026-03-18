/**
 * GET /api/attorneys/[id]/availability
 *
 * Returns available time slots for video booking.
 * Uses shared getAvailableSlots() from @/lib/availability.
 *
 * Query params:
 *   - date: YYYY-MM-DD start date (default: today)
 *   - days: number of days to look ahead (default: 14, max: 60)
 *   - duration: slot duration in minutes (30 | 60, default: 30)
 *
 * Response: { attorney_id, timezone, slots[], next_available, generated_at }
 * Cache: 5 min TTL via getAvailableSlots cache + CDN headers
 * Rate limit: 30 req/min (search tier)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/availability'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid attorney ID format' },
        { status: 400 }
      )
    }

    // Rate limit: 30 req/min (search tier — public, unauthenticated)
    const rl = await rateLimit(request, RATE_LIMITS.search)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(rl.remaining),
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse days param (default 14, clamp 1-60)
    const daysParam = parseInt(searchParams.get('days') || '14', 10)
    const days = Math.min(Math.max(isNaN(daysParam) ? 14 : daysParam, 1), 60)

    // Parse duration param (30 or 60 min)
    const durationParam = parseInt(searchParams.get('duration') || '30', 10)
    const duration: 30 | 60 = durationParam === 60 ? 60 : 30

    // Parse start date param (default: today)
    let startDate: Date
    const dateParam = searchParams.get('date')
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      startDate = new Date(dateParam + 'T00:00:00')
    } else {
      startDate = new Date()
    }

    // Calculate end date
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days - 1)

    // Get availability via shared helper (cached 5 min)
    const result = await getAvailableSlots(id, startDate, endDate, duration)

    const response = NextResponse.json(result)

    // CDN cache: 5 min, stale-while-revalidate 10 min
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
    response.headers.set('X-RateLimit-Remaining', String(rl.remaining))

    return response
  } catch (error: unknown) {
    logger.error('Availability API error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
