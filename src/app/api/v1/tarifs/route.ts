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
 * Retourne les statistiques agrégées du baromètre pour un métier,
 * optionnellement filtré par ville, département ou région.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const metier = searchParams.get('metier')
    const ville = searchParams.get('ville')
    const departement = searchParams.get('departement')
    const region = searchParams.get('region')

    if (!metier) {
      return NextResponse.json(
        { error: 'Le paramètre "metier" est requis. Exemple : ?metier=plombier' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('barometre_stats')
      .select('metier, metier_slug, ville, ville_slug, departement, departement_code, region, region_slug, nb_artisans, note_moyenne, nb_avis, taux_verification, updated_at')
      .eq('metier_slug', metier)

    if (ville) {
      query = query.eq('ville_slug', ville)
    } else if (departement) {
      query = query.eq('departement_code', departement).is('ville', null)
    } else if (region) {
      query = query.eq('region_slug', region).is('ville', null).is('departement', null)
    } else {
      query = query.is('ville', null).is('departement', null).is('region', null)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      return NextResponse.json(
        { error: 'Erreur interne lors de la récupération des données.' },
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
          text: `Source : ${SITE_NAME} — Baromètre des Artisans`,
          url: `${SITE_URL}/price-index`,
          licence: 'Attribution obligatoire avec lien vers la source.',
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
      { error: 'Erreur serveur inattendue.' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
