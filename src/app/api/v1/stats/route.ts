/**
 * GET /api/v1/stats — Regional or state statistics
 *
 * Uses centralized error handling via withErrorHandler.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { withErrorHandler, ValidationError, ApiError } from '@/lib/api/errors'
import { z } from 'zod'
import { validateQuery } from '@/lib/api/validation'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

const statsQuerySchema = z
  .object({
    region: z.string().max(100).optional(),
    state: z.string().max(10).optional(),
  })
  .transform((data) => ({
    region: data.region,
    stateCode: data.state,
  }))

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { region, stateCode } = validateQuery(request, statsQuerySchema)

  if (!region && !stateCode) {
    throw new ValidationError(
      'Parameter "region" or "state" is required. Example: ?region=california or ?state=CA'
    )
  }

  const supabase = await createClient()

  let query = supabase
    .from('barometre_stats')
    .select(
      'specialty, specialty_slug, city, city_slug, state_name, state_code, region, region_slug, attorney_count, average_rating, review_count, verification_rate, updated_at'
    )
    .is('city', null)

  if (region) {
    query = query.eq('region_slug', region).is('state_name', null)
  } else if (stateCode) {
    query = query.eq('state_code', stateCode)
  }

  const { data, error } = await query.order('attorney_count', { ascending: false }).limit(100)

  if (error) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Internal error retrieving data.')
  }

  // Calculate totals
  const rows = data ?? []
  const totalAttorneys = rows.reduce((s, r) => s + (r.attorney_count ?? 0), 0)
  const totalReviews = rows.reduce((s, r) => s + (r.review_count ?? 0), 0)
  const ratedRows = rows.filter((r) => r.average_rating !== null)
  const avgRating =
    ratedRows.length > 0
      ? Math.round(
          (ratedRows.reduce(
            (s, r) => s + (r.average_rating as number) * (r.attorney_count ?? 1),
            0
          ) /
            ratedRows.reduce((s, r) => s + (r.attorney_count ?? 1), 0)) *
            100
        ) / 100
      : null

  return NextResponse.json(
    {
      success: true,
      summary: {
        zone: region || stateCode,
        type: region ? 'region' : 'state',
        total_attorneys: totalAttorneys,
        average_rating: avgRating,
        total_reviews: totalReviews,
        specialty_count: rows.length,
      },
      data: rows,
      attribution: {
        text: `Source: ${SITE_NAME} — Attorney Barometer`,
        url: `${SITE_URL}/attorney-statistics`,
        licence: 'Attribution required with link to source.',
      },
    },
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
})
