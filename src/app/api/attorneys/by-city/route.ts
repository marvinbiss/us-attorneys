/**
 * GET /api/attorneys/by-city
 * Returns attorneys for a given city, used by CityMap component.
 *
 * Query params:
 *   - city (string, required): city name (case-insensitive match)
 *   - limit (number, optional): max results, default 20, max 50
 *
 * Response shape matches CityMap expectations:
 *   { success: true, providers: [...] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const querySchema = z.object({
  city: z.string().min(1, 'city is required').max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting (search category — scraping prevention)
    const rl = await rateLimit(request, RATE_LIMITS.search)
    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        },
        { status: 429 }
      )
    }

    // Parse and validate query params
    const url = new URL(request.url)
    const parseResult = querySchema.safeParse({
      city: url.searchParams.get('city'),
      limit: url.searchParams.get('limit') ?? undefined,
    })

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: parseResult.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { city, limit } = parseResult.data

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('attorneys')
      .select(
        'id, name, slug, latitude, longitude, address_city, address_state, primary_specialty_id, rating_average, review_count'
      )
      .ilike('address_city', city)
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('rating_average', { ascending: false, nullsFirst: false })
      .order('name')
      .limit(limit)

    if (error) {
      logger.error('[api/attorneys/by-city] Supabase query failed', { error: error.message, city })
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch attorneys' } },
        { status: 500 }
      )
    }

    // Response uses "providers" key to match CityMap component expectations
    return NextResponse.json(
      { success: true, providers: data ?? [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (err: unknown) {
    logger.error('[api/attorneys/by-city] Unexpected error', err)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
