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

/** Explicit column list for barometre_stats — avoids SELECT * */
const BAROMETRE_COLS =
  'id, specialty, specialty_slug, city, city_slug, state_name, state_code, region, region_slug, attorney_count, average_rating, review_count, verification_rate, quarterly_variation, updated_at' as const

/** Default cache TTL: 24h (aligned with barometer page revalidate) */
const CACHE_TTL = 86400

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Row shape for the barometre_stats table in Supabase */
export interface BarometerStatRow {
  id: number
  specialty: string
  specialty_slug: string
  city: string | null
  city_slug: string | null
  state_name: string | null
  state_code: string | null
  region: string | null
  region_slug: string | null
  attorney_count: number
  average_rating: number | null
  review_count: number
  verification_rate: number
  quarterly_variation: number | null
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

/** National stats by specialty (city=null, state=null, region=null) */
async function _getStatsBySpecialty(specialtySlug: string): Promise<BarometerStatRow | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select(BAROMETRE_COLS)
      .eq('specialty_slug', specialtySlug)
      .is('city', null)
      .is('state_name', null)
      .is('region', null)
      .single()
    return data as BarometerStatRow | null
  } catch {
    return null
  }
}

export async function getStatsBySpecialty(specialtySlug: string): Promise<BarometerStatRow | null> {
  if (IS_BUILD) return null
  return unstable_cache(_getStatsBySpecialty, ['barometer-stats-specialty', specialtySlug], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(specialtySlug)
}

/** Stats by specialty in a city */
async function _getStatsBySpecialtyCity(
  specialtySlug: string,
  citySlug: string
): Promise<BarometerStatRow | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select(BAROMETRE_COLS)
      .eq('specialty_slug', specialtySlug)
      .eq('city_slug', citySlug)
      .single()
    return data as BarometerStatRow | null
  } catch {
    return null
  }
}

export async function getStatsBySpecialtyCity(
  specialtySlug: string,
  citySlug: string
): Promise<BarometerStatRow | null> {
  if (IS_BUILD) return null
  return unstable_cache(
    _getStatsBySpecialtyCity,
    ['barometer-stats-specialty-city', specialtySlug, citySlug],
    {
      revalidate: CACHE_TTL,
      tags: ['barometre'],
    }
  )(specialtySlug, citySlug)
}

/** All specialties in a region */
async function _getStatsByRegion(regionSlug: string): Promise<BarometerStatRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select(BAROMETRE_COLS)
      .eq('region_slug', regionSlug)
      .is('city', null)
      .is('state_name', null)
      .order('attorney_count', { ascending: false })
    return (data ?? []) as BarometerStatRow[]
  } catch {
    return []
  }
}

export async function getStatsByRegion(regionSlug: string): Promise<BarometerStatRow[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getStatsByRegion, ['barometre-stats-region', regionSlug], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(regionSlug)
}

/** All specialties in a state */
async function _getStatsByState(stateCode: string): Promise<BarometerStatRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select(BAROMETRE_COLS)
      .eq('state_code', stateCode)
      .is('city', null)
      .order('attorney_count', { ascending: false })
    return (data ?? []) as BarometerStatRow[]
  } catch {
    return []
  }
}

export async function getStatsByState(stateCode: string): Promise<BarometerStatRow[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getStatsByState, ['barometre-stats-dept', stateCode], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(stateCode)
}

/** National-level aggregate stats (sum of all specialties at national level) */
async function _getNationalStats(): Promise<NationalStats> {
  try {
    const supabase = createAdminClient()

    // Specialties at national level
    const { data: national } = await supabase
      .from('barometre_stats')
      .select('attorney_count, review_count, average_rating, verification_rate')
      .is('city', null)
      .is('state_name', null)
      .is('region', null)

    const rows = (national ?? []) as Pick<
      BarometerStatRow,
      'attorney_count' | 'review_count' | 'average_rating' | 'verification_rate'
    >[]

    const totalAttorneys = rows.reduce((s, r) => s + r.attorney_count, 0)
    const totalReviews = rows.reduce((s, r) => s + r.review_count, 0)
    const ratedRows = rows.filter((r) => r.average_rating !== null)
    const globalRating =
      ratedRows.length > 0
        ? Math.round(
            (ratedRows.reduce((s, r) => s + (r.average_rating ?? 0) * r.attorney_count, 0) /
              ratedRows.reduce((s, r) => s + r.attorney_count, 0)) *
              100
          ) / 100
        : 4.2
    const globalVerificationRate =
      totalAttorneys > 0
        ? Math.round(
            (rows.reduce((s, r) => s + r.verification_rate * r.attorney_count, 0) /
              totalAttorneys) *
              10000
          ) / 10000
        : 0

    // Count distinct cities
    const { count: cityCount } = await supabase
      .from('barometre_stats')
      .select('id', { count: 'exact', head: true })
      .not('city', 'is', null)

    return {
      totalAttorneys,
      globalRating,
      totalReviews,
      globalVerificationRate,
      specialtyCount: rows.length,
      cityCount: cityCount ?? 0,
    }
  } catch {
    return {
      totalAttorneys: 940000,
      globalRating: 4.2,
      totalReviews: 0,
      globalVerificationRate: 0,
      specialtyCount: 0,
      cityCount: 0,
    }
  }
}

export async function getNationalStats(): Promise<NationalStats> {
  if (IS_BUILD) {
    return {
      totalAttorneys: 940000,
      globalRating: 4.2,
      totalReviews: 0,
      globalVerificationRate: 0,
      specialtyCount: 0,
      cityCount: 0,
    }
  }
  return unstable_cache(_getNationalStats, ['barometre-national-stats'], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })()
}

/** Top N practice areas by attorney count (national level) */
async function _getTopSpecialties(limit: number): Promise<BarometerStatRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select(BAROMETRE_COLS)
      .is('city', null)
      .is('state_name', null)
      .is('region', null)
      .order('attorney_count', { ascending: false })
      .limit(limit)
    return (data ?? []) as BarometerStatRow[]
  } catch {
    return []
  }
}

export async function getTopSpecialties(limit = 10): Promise<BarometerStatRow[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getTopSpecialties, ['barometer-top-specialties', String(limit)], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(limit)
}

/** Top N cities by attorney count (all practice areas combined) */
async function _getTopCities(
  limit: number
): Promise<{ city: string; city_slug: string; total: number }[]> {
  try {
    const supabase = createAdminClient()
    // Fetch cities and aggregate client-side
    const { data } = await supabase
      .from('barometre_stats')
      .select('city, city_slug, attorney_count')
      .not('city', 'is', null)
      .order('attorney_count', { ascending: false })
      .limit(5000)

    if (!data) return []

    // Aggregate by city
    const cityMap = new Map<string, { city: string; city_slug: string; total: number }>()
    for (const row of data) {
      if (!row.city || !row.city_slug) continue
      const existing = cityMap.get(row.city_slug)
      if (existing) {
        existing.total += row.attorney_count
      } else {
        cityMap.set(row.city_slug, {
          city: row.city,
          city_slug: row.city_slug,
          total: row.attorney_count,
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

export async function getTopCities(
  limit = 10
): Promise<{ city: string; city_slug: string; total: number }[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getTopCities, ['barometre-top-cities', String(limit)], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(limit)
}

/** Stats for a specialty in the top 20 cities */
async function _getSpecialtyTopCities(
  specialtySlug: string,
  cityNames: string[]
): Promise<BarometerStatRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('barometre_stats')
      .select(BAROMETRE_COLS)
      .eq('specialty_slug', specialtySlug)
      .in('city', cityNames)
      .order('attorney_count', { ascending: false })
    return (data ?? []) as BarometerStatRow[]
  } catch {
    return []
  }
}

export async function getSpecialtyTopCities(
  specialtySlug: string,
  cityNames: string[]
): Promise<BarometerStatRow[]> {
  if (IS_BUILD) return []
  return unstable_cache(_getSpecialtyTopCities, ['barometer-specialty-top-cities', specialtySlug], {
    revalidate: CACHE_TTL,
    tags: ['barometre'],
  })(specialtySlug, cityNames)
}
