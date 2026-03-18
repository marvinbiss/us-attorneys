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

const statsQuerySchema = z.object({
  region: z.string().max(100).optional(),
  state: z.string().max(10).optional(),
  departement: z.string().max(10).optional(), // legacy compat
}).transform((data) => ({
  region: data.region,
  stateCode: data.state || data.departement,
}))

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { region, stateCode } = validateQuery(request, statsQuerySchema)

  if (!region && !stateCode) {
    throw new ValidationError(
      'Parameter "region" or "state" is required. Example: ?region=california or ?state=CA',
    )
  }

  const supabase = await createClient()

  let query = supabase
    .from('barometre_stats')
    .select('metier, metier_slug, ville, ville_slug, departement, departement_code, region, region_slug, nb_attorneys, note_moyenne, nb_avis, taux_verification, updated_at')
    .is('ville', null)

  if (region) {
    query = query.eq('region_slug', region).is('departement', null)
  } else if (stateCode) {
    query = query.eq('departement_code', stateCode) // DB column name 'departement_code' is legacy
  }

  const { data, error } = await query
    .order('nb_attorneys', { ascending: false })
    .limit(100)

  if (error) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Internal error retrieving data.')
  }

  // Calculate totals
  const rows = data ?? []
  const totalAttorneys = rows.reduce((s, r) => s + (r.nb_attorneys ?? 0), 0)
  const totalReviews = rows.reduce((s, r) => s + (r.nb_avis ?? 0), 0)
  const ratedRows = rows.filter((r) => r.note_moyenne !== null)
  const avgRating = ratedRows.length > 0
    ? Math.round(
        (ratedRows.reduce((s, r) => s + (r.note_moyenne as number) * (r.nb_attorneys ?? 1), 0) /
          ratedRows.reduce((s, r) => s + (r.nb_attorneys ?? 1), 0)) * 100,
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
    },
  )
})
