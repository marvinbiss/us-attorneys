import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * GET /api/v1/pricing?metier=plombier&ville=paris
 *
 * Returns aggregated barometer statistics for a practice area,
 * optionally filtered by city, state, or region.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const specialty = searchParams.get('metier')
    const city = searchParams.get('ville')
    const state = searchParams.get('departement')
    const region = searchParams.get('region')

    if (!specialty) {
      return NextResponse.json(
        { error: 'The "metier" parameter is required. Example: ?metier=plumber' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('barometre_stats')
      .select('metier, metier_slug, ville, ville_slug, departement, departement_code, region, region_slug, nb_artisans, note_moyenne, nb_avis, taux_verification, updated_at')
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
      return NextResponse.json(
        { error: 'Internal error retrieving data.' },
        { status: 500, headers: CORS_HEADERS },
      )
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
  } catch {
    return NextResponse.json(
      { error: 'Unexpected server error.' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
