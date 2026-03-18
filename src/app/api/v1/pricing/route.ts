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

const pricingQuerySchema = z.object({
  specialty: z.string().max(100).optional(),
  metier: z.string().max(100).optional(), // legacy compat
  city: z.string().max(100).optional(),
  ville: z.string().max(100).optional(), // legacy compat
  state: z.string().max(10).optional(),
  departement: z.string().max(10).optional(), // legacy compat
  region: z.string().max(100).optional(),
}).transform((data) => ({
  specialty: data.specialty || data.metier,
  city: data.city || data.ville,
  state: data.state || data.departement,
  region: data.region,
}))

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { specialty, city, state, region } = validateQuery(request, pricingQuerySchema)

  if (!specialty) {
    throw new ValidationError(
      'The "specialty" parameter is required. Example: ?specialty=personal-injury',
    )
  }

  const supabase = await createClient()

  let query = supabase
    .from('barometre_stats')
    .select('metier, metier_slug, ville, ville_slug, departement, departement_code, region, region_slug, nb_attorneys, note_moyenne, nb_avis, taux_verification, updated_at')
    .eq('metier_slug', specialty)

  if (city) {
    query = query.eq('ville_slug', city)
  } else if (state) {
    query = query.eq('departement_code', state).is('ville', null)
  } else if (region) {
    query = query.eq('region_slug', region).is('ville', null).is('departement', null)
  } else {
    query = query.is('ville', null).is('departement', null).is('region', null)
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
    },
  )
})
