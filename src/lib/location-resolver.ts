// Location resolver — supports both city slugs ("new-york") and ZIP slugs ("10001-new-york-ny")
// ZIP slugs unlock 41K+ locations vs 110 static cities = 372x page multiplier

import type { City } from '@/lib/data/usa'
import type { Location } from '@/types'
import { getCachedData, CACHE_TTL } from '@/lib/cache'
import { dbLogger } from '@/lib/logger'

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

// Lazy supabase import to avoid circular dependencies
let _supabase: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null
function getSupabase() {
  if (IS_BUILD) return null
  if (!_supabase) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabase } = require('@/lib/supabase')
    _supabase = supabase
  }
  return _supabase
}

/** Detect ZIP slug format: "10001-new-york-ny" */
export function isZipSlug(slug: string): boolean {
  return /^\d{5}-/.test(slug)
}

/** Extract 5-digit ZIP code from slug */
export function extractZipCode(slug: string): string {
  return slug.slice(0, 5)
}

/** Build a ZIP slug from components: "10001" + "New York" + "NY" → "10001-new-york-ny" */
export function buildZipSlug(zipCode: string, cityName: string, stateCode: string): string {
  const cityPart = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${zipCode}-${cityPart}-${stateCode.toLowerCase()}`
}

interface ZipRow {
  code: string
  latitude: number | null
  longitude: number | null
  population: number | null
  location: { name: string; slug: string } | null
  state: { name: string; abbreviation: string; slug: string } | null
  county: { name: string; slug: string } | null
}

/**
 * Resolve a ZIP slug to a City-compatible object.
 * Returns null during build (no DB) or if ZIP not found.
 * Cached for 7 days (ZIP codes never change).
 */
export async function resolveZipToCity(slug: string): Promise<City | null> {
  if (IS_BUILD) return null
  if (!isZipSlug(slug)) return null

  const zipCode = extractZipCode(slug)

  return getCachedData(
    `zip-city:${zipCode}`,
    async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) return null

        const { data, error } = await supabase
          .from('zip_codes')
          .select('code, latitude, longitude, population, location:location_id(name, slug), state:state_id(name, abbreviation, slug), county:county_id(name, slug)')
          .eq('code', zipCode)
          .limit(1)
          .single()

        if (error || !data) return null

        const row = data as unknown as ZipRow
        const cityName = row.location?.name || 'Unknown'
        const stateCode = row.state?.abbreviation || ''
        const stateName = row.state?.name || ''
        const countyName = row.county?.name || ''

        return {
          slug,
          name: `${cityName} ${zipCode}`,
          stateCode,
          stateName,
          county: countyName,
          population: row.population ? row.population.toLocaleString() : '0',
          zipCode: row.code,
          description: `Legal services near ZIP code ${zipCode} in ${cityName}, ${stateCode}.`,
          neighborhoods: [],
          latitude: row.latitude || 0,
          longitude: row.longitude || 0,
          metroArea: '',
        } satisfies City
      } catch (err) {
        dbLogger.warn('[resolveZipToCity] Failed for', { slug, error: err instanceof Error ? err.message : err })
        return null
      }
    },
    CACHE_TTL.locations, // 7 days
  )
}

/**
 * Resolve a ZIP slug to a Location type (for supabase.ts compatibility).
 * Returns the same shape as getLocationBySlug.
 */
export async function resolveZipToLocation(slug: string): Promise<Location | null> {
  const city = await resolveZipToCity(slug)
  if (!city) return null

  return {
    id: '',
    name: city.name,
    slug: city.slug,
    postal_code: city.zipCode,
    department_code: city.stateCode,
    department_name: city.stateName,
    latitude: city.latitude,
    longitude: city.longitude,
    is_active: true,
    created_at: '',
  }
}

/**
 * Get nearby ZIP codes by geographic proximity.
 * Returns City-compatible objects for cross-linking.
 */
export async function getNearbyZipCodes(slug: string, limit: number = 8): Promise<City[]> {
  if (IS_BUILD) return []

  const zipCode = isZipSlug(slug) ? extractZipCode(slug) : null
  if (!zipCode) return []

  return getCachedData(
    `nearby-zips:${zipCode}:${limit}`,
    async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) return []

        // Get the reference point
        const { data: refData } = await supabase
          .from('zip_codes')
          .select('latitude, longitude')
          .eq('code', zipCode)
          .single()

        const ref = refData as { latitude: number; longitude: number } | null
        if (!ref?.latitude || !ref?.longitude) return []

        // Fallback: simple lat/lon range query (no RPC dependency)
        const { data: fallback } = await supabase
          .from('zip_codes')
          .select('code, latitude, longitude, population, location:location_id(name, slug), state:state_id(name, abbreviation)')
          .neq('code', zipCode)
          .gte('latitude', ref.latitude - 0.3)
          .lte('latitude', ref.latitude + 0.3)
          .gte('longitude', ref.longitude - 0.3)
          .lte('longitude', ref.longitude + 0.3)
          .limit(limit)

        if (!fallback) return []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (fallback as any[])
          .filter((z: { code: string }) => z.code !== zipCode)
          .slice(0, limit)
          .map((z: ZipRow) => ({
            slug: buildZipSlug(z.code, (z.location as { name: string })?.name || '', (z.state as { abbreviation: string })?.abbreviation || ''),
            name: `${(z.location as { name: string })?.name || 'Unknown'} ${z.code}`,
            stateCode: (z.state as { abbreviation: string })?.abbreviation || '',
            stateName: (z.state as { name: string })?.name || '',
            county: '',
            population: z.population ? z.population.toLocaleString() : '0',
            zipCode: z.code,
            description: '',
            neighborhoods: [],
            latitude: z.latitude || 0,
            longitude: z.longitude || 0,
            metroArea: '',
          })) satisfies City[]
      } catch (err) {
        dbLogger.warn('[getNearbyZipCodes] Failed', { error: err instanceof Error ? err.message : err })
        return []
      }
    },
    CACHE_TTL.locations,
  )
}
