/**
 * Server functions to query barometre_stats from Supabase.
 * Used in SSR/ISR pages -- DO NOT import in client components.
 *
 * All exported functions are wrapped with unstable_cache (Next.js Data Cache)
 * to ensure results are cached server-side and pages using this data
 * are eligible for CDN caching (ISR).
 * Without this wrapper, Supabase JS calls (third-party fetch) do not go through
 * the Next.js cache, which forces dynamic rendering on every request.
 */

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

/** Default cache TTL: 24h (aligned with barometer page revalidate) */
const CACHE_TTL = 86400

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// DB-bound: French column names from barometre_stats table in Supabase
export interface BarometreStatRow {
  id: number
  metier: string
  metier_slug: string
  ville: string | null
  ville_slug: string | null
  departement: string | null
  departement_code: string | null
  region: string | null
  region_slug: string | null
  nb_artisans: number
  note_moyenne: number | null
  nb_avis: number
  taux_verification: number
  variation_trimestre: number | null
  updated_at: string
}

export interface NationalStats {
  totalAttorneys: number
  globalRating: number
  totalReviews: number
  globalVerificationRate: number
  specialtyCount: number
  cityCount: number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** National stats by specialty (ville=null, dept=null, region=null) */
async function _getStatsBySpecialty(specialtySlug: string): Promise<BarometreStatRow | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('metier_slug', specialtySlug)
      .is('ville', null)
      .is('departement', null)
      .is('region', null)
      .single()
    return data as BarometreStatRow | null
  } catch {
    return null
  }
}

export async function getStatsBySpecialty(specialtySlug: string): Promise<BarometreStatRow | null> {
  if (IS_BUILD) return null
  return unstable_cache(_getStatsBySpecialty, ['barometre-stats-metier', specialtySlug], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(specialtySlug)
}

/** Stats by specialty in a city */
async function _getStatsBySpecialtyCity(specialtySlug: string, citySlug: string): Promise<BarometreStatRow | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('metier_slug', specialtySlug)
      .eq('ville_slug', citySlug)
      .single()
    return data as BarometreStatRow | null
  } catch {
    return null
  }
}

export async function getStatsBySpecialtyCity(specialtySlug: string, citySlug: string): Promise<BarometreStatRow | null> {
  if (IS_BUILD) return null
  return unstable_cache(_getStatsBySpecialtyCity, ['barometre-stats-metier-ville', specialtySlug, citySlug], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(specialtySlug, citySlug)
}

/** All specialties in a region */
async function _getStatsByRegion(regionSlug: string): Promise<BarometreStatRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('region_slug', regionSlug)
      .is('ville', null)
      .is('departement', null)
      .order('nb_artisans', { ascending: false })
    return (data ?? []) as BarometreStatRow[]
  } catch {
    return []
  }
}

export async function getStatsByRegion(regionSlug: string): Promise<BarometreStatRow[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getStatsByRegion, ['barometre-stats-region', regionSlug], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(regionSlug)
}

/** All specialties in a department */
async function _getStatsByDepartement(deptCode: string): Promise<BarometreStatRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('departement_code', deptCode)
      .is('ville', null)
      .order('nb_artisans', { ascending: false })
    return (data ?? []) as BarometreStatRow[]
  } catch {
    return []
  }
}

export async function getStatsByDepartement(deptCode: string): Promise<BarometreStatRow[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getStatsByDepartement, ['barometre-stats-dept', deptCode], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(deptCode)
}

/** National-level aggregate stats (sum of all specialties at national level) */
async function _getNationalStats(): Promise<NationalStats> {
  try {
    const supabase = createAdminClient()

    // Specialties at national level
    const { data: national } = await supabase
      .from('barometre_stats')
      .select('*')
      .is('ville', null)
      .is('departement', null)
      .is('region', null)

    const rows = (national ?? []) as BarometreStatRow[]

    const totalAttorneys = rows.reduce((s, r) => s + r.nb_artisans, 0)
    const totalReviews = rows.reduce((s, r) => s + r.nb_avis, 0)
    const ratedRows = rows.filter((r) => r.note_moyenne !== null)
    const globalRating = ratedRows.length > 0
      ? Math.round((ratedRows.reduce((s, r) => s + (r.note_moyenne ?? 0) * r.nb_artisans, 0) / ratedRows.reduce((s, r) => s + r.nb_artisans, 0)) * 100) / 100
      : 4.2
    const globalVerificationRate = totalAttorneys > 0
      ? Math.round((rows.reduce((s, r) => s + r.taux_verification * r.nb_artisans, 0) / totalAttorneys) * 10000) / 10000
      : 0

    // Count distinct cities
    const { count: cityCount } = await supabase
      .from('barometre_stats')
      .select('*', { count: 'exact', head: true })
      .not('ville', 'is', null)

    return {
      totalAttorneys,
      globalRating,
      totalReviews,
      globalVerificationRate,
      specialtyCount: rows.length,
      cityCount: cityCount ?? 0,
    }
  } catch {
    return { totalAttorneys: 940000, globalRating: 4.2, totalReviews: 0, globalVerificationRate: 0, specialtyCount: 0, cityCount: 0 }
  }
}

export async function getNationalStats(): Promise<NationalStats> {
  if (IS_BUILD) {
    return { totalAttorneys: 940000, globalRating: 4.2, totalReviews: 0, globalVerificationRate: 0, specialtyCount: 0, cityCount: 0 }
  }
  return unstable_cache(_getNationalStats, ['barometre-national-stats'], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })()
}

/** Top N practice areas by nb_artisans (national level) */
async function _getTopSpecialties(limit: number): Promise<BarometreStatRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .is('ville', null)
      .is('departement', null)
      .is('region', null)
      .order('nb_artisans', { ascending: false })
      .limit(limit)
    return (data ?? []) as BarometreStatRow[]
  } catch {
    return []
  }
}

export async function getTopSpecialties(limit = 10): Promise<BarometreStatRow[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getTopSpecialties, ['barometre-top-metiers', String(limit)], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(limit)
}

/** Top N cities by nb_artisans (all practice areas combined) */
async function _getTopCities(limit: number): Promise<{ ville: string; ville_slug: string; total: number }[]> {
  try {
    const supabase = createAdminClient()
    // Fetch cities and aggregate client-side
    const { data } = await supabase
      .from('barometre_stats')
      .select('ville, ville_slug, nb_artisans')
      .not('ville', 'is', null)
      .order('nb_artisans', { ascending: false })
      .limit(5000)

    if (!data) return []

    // Aggregate by city
    const cityMap = new Map<string, { ville: string; ville_slug: string; total: number }>()
    for (const row of data) {
      if (!row.ville || !row.ville_slug) continue
      const existing = cityMap.get(row.ville_slug)
      if (existing) {
        existing.total += row.nb_artisans
      } else {
        cityMap.set(row.ville_slug, {
          ville: row.ville,
          ville_slug: row.ville_slug,
          total: row.nb_artisans,
        })
      }
    }

    return Array.from(cityMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
  } catch {
    return []
  }
}

export async function getTopCities(limit = 10): Promise<{ ville: string; ville_slug: string; total: number }[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getTopCities, ['barometre-top-cities', String(limit)], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(limit)
}

/** Stats for a specialty in the top 20 cities */
async function _getSpecialtyTopCities(
  specialtySlug: string,
  cityNames: string[],
): Promise<BarometreStatRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select('*')
      .eq('metier_slug', specialtySlug)
      .in('ville', cityNames)
      .order('nb_artisans', { ascending: false })
    return (data ?? []) as BarometreStatRow[]
  } catch {
    return []
  }
}

export async function getSpecialtyTopCities(
  specialtySlug: string,
  cityNames: string[],
): Promise<BarometreStatRow[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getSpecialtyTopCities, ['barometre-metier-top-cities', specialtySlug], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(specialtySlug, cityNames)
}
