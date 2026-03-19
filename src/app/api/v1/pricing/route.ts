/**
 * GET /api/v1/pricing — Practice area statistics by location
 *
 * Uses centralized error handling via withErrorHandler.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { withErrorHandler, ValidationError, ApiError } from '@/lib/api/errors'
import { validateQuery } from '@/lib/api/validation'
import { z } from 'zod'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

const pricingQuerySchema = z
  .object({
    specialty: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(10).optional(),
    region: z.string().max(100).optional(),
  })
  .transform((data) => ({
    specialty: data.specialty,
    city: data.city,
    state: data.state,
    region: data.region,
  }))

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { specialty, city, state, region } = validateQuery(request, pricingQuerySchema)

  if (!specialty) {
    throw new ValidationError(
      'The "specialty" parameter is required. Example: ?specialty=personal-injury'
    )
  }

  const supabase = await createClient()

  let query = supabase
    .from('barometre_stats')
    .select(
      'specialty, specialty_slug, city, city_slug, state_name, state_code, region, region_slug, attorney_count, average_rating, review_count, verification_rate, updated_at'
    )
    .eq('specialty_slug', specialty)

  if (city) {
    query = query.eq('city_slug', city)
  } else if (state) {
    query = query.eq('state_code', state).is('city', null)
  } else if (region) {
    query = query.eq('region_slug', region).is('city', null).is('state_name', null)
  } else {
    query = query.is('city', null).is('state_name', null).is('region', null)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Internal error retrieving data.')
  }

  return NextResponse.json(
    {
      success: true,
      data: data ?? [],
      meta: {
        source: SITE_NAME,
        url: SITE_URL,
        updated_at: data?.[0]?.updated_at ?? null,
      },
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
