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
 * GET /api/v1/stats?region=new-york
 * GET /api/v1/stats?departement=75
 *
 * Returns regional or state statistics.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const region = searchParams.get('region')
    const departement = searchParams.get('departement')

    if (!region && !departement) {
      return NextResponse.json(
        { error: 'Parameter "region" or "state" is required. Example: ?region=california or ?state=CA' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('barometre_stats')
      .select('metier, metier_slug, ville, ville_slug, departement, departement_code, region, region_slug, nb_artisans, note_moyenne, nb_avis, taux_verification, updated_at')
      .is('ville', null)

    if (region) {
      query = query.eq('region_slug', region).is('departement', null)
    } else if (departement) {
      query = query.eq('departement_code', departement)
    }

    const { data, error } = await query
      .order('nb_artisans', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json(
        { error: 'Internal error retrieving data.' },
        { status: 500, headers: CORS_HEADERS },
      )
    }

    // Calculate totals
    const rows = data ?? []
    const totalAttorneys = rows.reduce((s, r) => s + (r.nb_artisans ?? 0), 0)
    const totalReviews = rows.reduce((s, r) => s + (r.nb_avis ?? 0), 0)
    const ratedRows = rows.filter((r) => r.note_moyenne !== null)
    const avgRating = ratedRows.length > 0
      ? Math.round(
          (ratedRows.reduce((s, r) => s + (r.note_moyenne as number) * (r.nb_artisans ?? 1), 0) /
            ratedRows.reduce((s, r) => s + (r.nb_artisans ?? 1), 0)) * 100,
        ) / 100
      : null

    return NextResponse.json(
      {
        success: true,
        summary: {
          zone: region || departement,
          type: region ? 'region' : 'departement',
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
  } catch {
    return NextResponse.json(
      { error: 'Unexpected server error.' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
