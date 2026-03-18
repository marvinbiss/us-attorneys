/**
 * zip-pages.ts — Data layer for ZIP code pages.
 *
 * Provides all data needed for /practice-areas/[service]/zip/[code] pages:
 * - Attorney lookup by ZIP (exact match + radius fallback)
 * - Nearby ZIP codes (PostGIS ST_DWithin or lat/lon range)
 * - ZIP metadata (city name, state, county, census data, coordinates)
 */

import { getCachedData, CACHE_TTL } from '@/lib/cache'
import { dbLogger } from '@/lib/logger'
import type { City } from '@/lib/data/usa'
import { buildZipSlug } from '@/lib/location-resolver'

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

// ─── Slug helpers (Doctolib pattern: city-zip) ──────────────────────────────

/** Detect ZIP page slug format: "new-york-10001" (city slug ending with -XXXXX) */
export function isZipPageSlug(slug: string): boolean {
  return /^.+-\d{5}$/.test(slug)
}

/** Generate a URL-friendly slug: "new-york" + "10001" -> "new-york-10001" */
export function zipToSlug(zipCode: string, citySlug: string): string {
  return `${citySlug}-${zipCode}`
}

/** Parse a ZIP page slug: "new-york-10001" -> { citySlug: "new-york", zipCode: "10001" } */
export function parseZipPageSlug(slug: string): { citySlug: string; zipCode: string } | null {
  const match = slug.match(/^(.+)-(\d{5})$/)
  if (!match) return null
  return { citySlug: match[1], zipCode: match[2] }
}

/** Convert ZipMetadata to City-compatible object for content generation */
export function zipMetadataToCity(meta: ZipMetadata): City {
  return {
    slug: zipToSlug(meta.code, meta.citySlug),
    name: `${meta.cityName} ${meta.code}`,
    stateCode: meta.stateCode,
    stateName: meta.stateName,
    county: meta.countyName,
    population: meta.population ? meta.population.toLocaleString() : '0',
    zipCode: meta.code,
    description: `Legal services near ZIP code ${meta.code} in ${meta.cityName}, ${meta.stateCode}.`,
    neighborhoods: [],
    latitude: meta.latitude,
    longitude: meta.longitude,
    metroArea: '',
  }
}

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

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ZipMetadata {
  code: string
  cityName: string
  citySlug: string
  stateCode: string
  stateName: string
  stateSlug: string
  countyName: string
  countySlug: string
  population: number | null
  latitude: number
  longitude: number
  /** Census ACS data from locations_us.census_data (JSONB) */
  censusData: CensusData | null
}

export interface CensusData {
  median_household_income?: number | null
  unemployment_rate?: number | null
  median_age?: number | null
  population?: number | null
  spanish_speakers?: number | null
  poverty_rate?: number | null
  total_households?: number | null
  owner_occupied_pct?: number | null
  bachelor_degree_pct?: number | null
}

export interface NearbyZip {
  code: string
  cityName: string
  citySlug: string
  stateCode: string
  distanceMiles: number | null
  population: number | null
}

export interface ZipPageData {
  zip: ZipMetadata
  nearbyZips: NearbyZip[]
  /** Total attorney count within the exact ZIP */
  attorneyCount: number
}

// ─── getZipMetadata ──────────────────────────────────────────────────────────

/**
 * Fetch ZIP code metadata: city, state, county, coordinates, census data.
 * Cached for 7 days (ZIP geography is static).
 */
export async function getZipMetadata(zipCode: string): Promise<ZipMetadata | null> {
  if (IS_BUILD) return null

  return getCachedData(
    `zip-meta:${zipCode}`,
    async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) return null

        const { data, error } = await supabase
          .from('zip_codes')
          .select(`
            code, latitude, longitude, population,
            location:location_id(name, slug, census_data),
            state:state_id(name, abbreviation, slug),
            county:county_id(name, slug)
          `)
          .eq('code', zipCode)
          .limit(1)
          .single()

        if (error || !data) return null

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = data as any

        return {
          code: row.code,
          cityName: row.location?.name || 'Unknown',
          citySlug: row.location?.slug || '',
          stateCode: row.state?.abbreviation || '',
          stateName: row.state?.name || '',
          stateSlug: row.state?.slug || '',
          countyName: row.county?.name || '',
          countySlug: row.county?.slug || '',
          population: row.population,
          latitude: row.latitude || 0,
          longitude: row.longitude || 0,
          censusData: row.location?.census_data || null,
        } satisfies ZipMetadata
      } catch (err: unknown) {
        dbLogger.warn('[getZipMetadata] Failed', { zipCode, error: err instanceof Error ? err.message : err })
        return null
      }
    },
    CACHE_TTL.locations, // 7 days
  )
}

// ─── getNearbyZips ───────────────────────────────────────────────────────────

/**
 * Find ZIP codes within a radius of the given ZIP code.
 * Uses lat/lon bounding box query (fast, no PostGIS RPC dependency).
 * Returns up to `limit` results sorted by approximate distance.
 */
export async function getNearbyZips(
  zipCode: string,
  radiusMiles: number = 10,
  limit: number = 12,
): Promise<NearbyZip[]> {
  if (IS_BUILD) return []

  return getCachedData(
    `nearby-zips-v2:${zipCode}:${radiusMiles}:${limit}`,
    async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) return []

        // Get reference point
        const { data: refData } = await supabase
          .from('zip_codes')
          .select('latitude, longitude')
          .eq('code', zipCode)
          .single()

        const ref = refData as { latitude: number; longitude: number } | null
        if (!ref?.latitude || !ref?.longitude) return []

        // ~1 degree latitude = 69 miles
        const latDelta = radiusMiles / 69
        // ~1 degree longitude varies by latitude; cos(lat) factor
        const lonDelta = radiusMiles / (69 * Math.cos((ref.latitude * Math.PI) / 180))

        const { data } = await supabase
          .from('zip_codes')
          .select('code, latitude, longitude, population, location:location_id(name, slug), state:state_id(abbreviation)')
          .neq('code', zipCode)
          .gte('latitude', ref.latitude - latDelta)
          .lte('latitude', ref.latitude + latDelta)
          .gte('longitude', ref.longitude - lonDelta)
          .lte('longitude', ref.longitude + lonDelta)
          .limit(limit * 2) // Fetch extra, then sort by distance

        if (!data) return []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = data as any[]

        // Calculate approximate distance and sort
        const withDistance = rows
          .map(row => {
            const dLat = (row.latitude - ref.latitude) * 69
            const dLon = (row.longitude - ref.longitude) * 69 * Math.cos((ref.latitude * Math.PI) / 180)
            const distMiles = Math.sqrt(dLat * dLat + dLon * dLon)
            return {
              code: row.code as string,
              cityName: row.location?.name || 'Unknown',
              citySlug: row.location?.slug || '',
              stateCode: row.state?.abbreviation || '',
              distanceMiles: Math.round(distMiles * 10) / 10,
              population: row.population as number | null,
            } satisfies NearbyZip
          })
          .filter(z => z.distanceMiles <= radiusMiles)
          .sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999))
          .slice(0, limit)

        return withDistance
      } catch (err: unknown) {
        dbLogger.warn('[getNearbyZips] Failed', { zipCode, error: err instanceof Error ? err.message : err })
        return []
      }
    },
    CACHE_TTL.locations,
  )
}

// ─── getZipPageData ──────────────────────────────────────────────────────────

/**
 * Fetch all data needed for a ZIP code page in parallel:
 * - ZIP metadata (city, state, county, census)
 * - Nearby ZIP codes
 * - Attorney count in the ZIP
 */
export async function getZipPageData(
  serviceSlug: string,
  zipCode: string,
): Promise<ZipPageData | null> {
  if (IS_BUILD) return null

  const [zip, nearbyZips, attorneyCount] = await Promise.all([
    getZipMetadata(zipCode),
    getNearbyZips(zipCode, 10, 12),
    getZipAttorneyCount(serviceSlug, zipCode),
  ])

  if (!zip) return null

  return { zip, nearbyZips, attorneyCount }
}

// ─── getZipAttorneyCount ─────────────────────────────────────────────────────

/**
 * Count attorneys for a practice area in a specific ZIP code.
 * Lightweight head-only query.
 */
async function getZipAttorneyCount(serviceSlug: string, zipCode: string): Promise<number> {
  if (IS_BUILD) return 1 // Fail open

  return getCachedData(
    `zip-atty-count:${serviceSlug}:${zipCode}`,
    async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) return 0

        // Resolve specialty IDs
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { SPECIALTY_TO_BAR_CATEGORIES, resolveSpecialtyIds } = require('@/lib/supabase')
        const specialties = SPECIALTY_TO_BAR_CATEGORIES[serviceSlug]
        if (!specialties || specialties.length === 0) return 0

        const specialtyIds = await resolveSpecialtyIds(specialties)
        if (specialtyIds.length === 0) return 0

        const { count, error } = await supabase
          .from('attorneys')
          .select('id', { count: 'exact', head: true })
          .in('primary_specialty_id', specialtyIds)
          .eq('address_zip', zipCode)
          .eq('is_active', true)
          .is('canonical_attorney_id', null)

        if (error) return 0
        return count ?? 0
      } catch {
        return 0
      }
    },
    CACHE_TTL.attorneys,
  )
}

// ─── getZipAttorneyCountByRadius ─────────────────────────────────────────────

/**
 * Count attorneys within a radius of a ZIP centroid.
 * Falls back to city-level count if PostGIS is unavailable.
 */
export async function getZipAttorneyCountByRadius(
  serviceSlug: string,
  zipCode: string,
  radiusMiles: number = 25,
): Promise<number> {
  if (IS_BUILD) return 1

  return getCachedData(
    `zip-atty-radius:${serviceSlug}:${zipCode}:${radiusMiles}`,
    async () => {
      try {
        const supabase = getSupabase()
        if (!supabase) return 0

        // Get ZIP centroid
        const meta = await getZipMetadata(zipCode)
        if (!meta) return 0

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { SPECIALTY_TO_BAR_CATEGORIES, resolveSpecialtyIds } = require('@/lib/supabase')
        const specialties = SPECIALTY_TO_BAR_CATEGORIES[serviceSlug]
        if (!specialties || specialties.length === 0) return 0

        const specialtyIds = await resolveSpecialtyIds(specialties)
        if (specialtyIds.length === 0) return 0

        // Bounding box approach (fast, no PostGIS RPC)
        const latDelta = radiusMiles / 69
        const lonDelta = radiusMiles / (69 * Math.cos((meta.latitude * Math.PI) / 180))

        // Count attorneys in bounding box that match ZIP codes in the radius
        const { data: nearbyZipCodes } = await supabase
          .from('zip_codes')
          .select('code')
          .gte('latitude', meta.latitude - latDelta)
          .lte('latitude', meta.latitude + latDelta)
          .gte('longitude', meta.longitude - lonDelta)
          .lte('longitude', meta.longitude + lonDelta)
          .limit(200)

        if (!nearbyZipCodes || nearbyZipCodes.length === 0) return 0

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const zips = (nearbyZipCodes as any[]).map(z => z.code as string)

        const { count, error } = await supabase
          .from('attorneys')
          .select('id', { count: 'exact', head: true })
          .in('primary_specialty_id', specialtyIds)
          .in('address_zip', zips)
          .eq('is_active', true)
          .is('canonical_attorney_id', null)

        if (error) return 0
        return count ?? 0
      } catch {
        return 0
      }
    },
    CACHE_TTL.attorneys,
  )
}

// ─── Helper: build nearby ZIP links as City-compatible objects ────────────────

export function nearbyZipsToCities(nearbyZips: NearbyZip[]): City[] {
  return nearbyZips.map(z => ({
    slug: buildZipSlug(z.code, z.cityName, z.stateCode),
    name: `${z.cityName} ${z.code}`,
    stateCode: z.stateCode,
    stateName: '',
    county: '',
    population: z.population ? z.population.toLocaleString() : '0',
    zipCode: z.code,
    description: '',
    neighborhoods: [],
    latitude: 0,
    longitude: 0,
    metroArea: '',
  }))
}

/** Build nearby ZIP links with the new city-zip slug format */
export function nearbyZipsToPageLinks(nearbyZips: NearbyZip[]): { slug: string; name: string; stateCode: string; distance: number | null }[] {
  return nearbyZips.map(z => ({
    slug: zipToSlug(z.code, z.citySlug),
    name: `${z.cityName} ${z.code}`,
    stateCode: z.stateCode,
    distance: z.distanceMiles,
  }))
}

// ─── Top ZIP codes for static generation (major metro areas) ────────────────

/** Top ~500 ZIPs across 15 largest metros for generateStaticParams */
export const TOP_ZIP_CODES: { zip: string; citySlug: string }[] = [
  // New York City
  ...['10001','10002','10003','10004','10005','10006','10007','10009','10010','10011',
     '10012','10013','10014','10016','10017','10018','10019','10020','10021','10022',
     '10023','10024','10025','10026','10027','10028','10029','10036','10038','10040',
     '11201','11205','11211','11215','11217','11220','11225','11230','11235','11238',
  ].map(zip => ({ zip, citySlug: 'new-york' })),
  // Los Angeles
  ...['90001','90002','90003','90004','90005','90006','90007','90010','90012','90013',
     '90014','90015','90016','90017','90019','90020','90024','90025','90026','90027',
     '90028','90034','90035','90036','90038','90039','90041','90042','90045','90046',
     '90048','90049','90064','90065','90066','90067','90068','90069','90071','90077',
  ].map(zip => ({ zip, citySlug: 'los-angeles' })),
  // Chicago
  ...['60601','60602','60603','60605','60606','60607','60608','60610','60611','60612',
     '60613','60614','60615','60616','60618','60622','60623','60625','60626','60628',
     '60629','60632','60634','60637','60639','60640','60641','60647','60651','60657',
  ].map(zip => ({ zip, citySlug: 'chicago' })),
  // Houston
  ...['77001','77002','77003','77004','77005','77006','77007','77008','77009','77010',
     '77011','77012','77019','77020','77021','77023','77024','77025','77027','77030',
     '77035','77036','77040','77042','77055','77056','77057','77063','77077','77079',
  ].map(zip => ({ zip, citySlug: 'houston' })),
  // Phoenix
  ...['85003','85004','85006','85007','85008','85009','85012','85013','85014','85015',
     '85016','85017','85018','85019','85020','85021','85022','85023','85028','85032',
     '85034','85040','85041','85042','85044','85048','85050','85051','85053','85054',
  ].map(zip => ({ zip, citySlug: 'phoenix' })),
  // Philadelphia
  ...['19102','19103','19104','19106','19107','19109','19111','19120','19121','19122',
     '19123','19124','19125','19126','19128','19130','19131','19132','19134','19135',
     '19136','19139','19140','19141','19143','19145','19146','19147','19148','19149',
  ].map(zip => ({ zip, citySlug: 'philadelphia' })),
  // San Antonio
  ...['78201','78202','78204','78205','78207','78209','78210','78212','78213','78215',
     '78216','78217','78218','78220','78221','78223','78224','78227','78228','78229',
  ].map(zip => ({ zip, citySlug: 'san-antonio' })),
  // San Diego
  ...['92101','92102','92103','92104','92105','92106','92107','92108','92109','92110',
     '92111','92113','92114','92115','92116','92117','92120','92121','92122','92123',
  ].map(zip => ({ zip, citySlug: 'san-diego' })),
  // Dallas
  ...['75201','75202','75203','75204','75205','75206','75207','75208','75209','75210',
     '75211','75214','75215','75216','75217','75219','75220','75225','75228','75230',
  ].map(zip => ({ zip, citySlug: 'dallas' })),
  // San Francisco
  ...['94102','94103','94104','94105','94107','94108','94109','94110','94111','94112',
     '94114','94115','94116','94117','94118','94121','94122','94123','94124','94133',
  ].map(zip => ({ zip, citySlug: 'san-francisco' })),
  // Austin
  ...['78701','78702','78703','78704','78705','78721','78722','78723','78727','78731',
     '78741','78745','78748','78749','78751','78752','78753','78757','78758','78759',
  ].map(zip => ({ zip, citySlug: 'austin' })),
  // Denver
  ...['80202','80203','80204','80205','80206','80209','80210','80211','80212','80218',
     '80219','80220','80222','80223','80224','80230','80237','80239','80246','80249',
  ].map(zip => ({ zip, citySlug: 'denver' })),
  // Miami
  ...['33101','33125','33126','33127','33128','33129','33130','33131','33132','33133',
     '33134','33135','33136','33137','33138','33139','33140','33142','33145','33155',
  ].map(zip => ({ zip, citySlug: 'miami' })),
  // Seattle
  ...['98101','98102','98103','98104','98105','98106','98107','98109','98112','98115',
     '98116','98117','98118','98119','98121','98122','98125','98126','98144','98199',
  ].map(zip => ({ zip, citySlug: 'seattle' })),
  // Boston
  ...['02101','02108','02109','02110','02111','02113','02114','02115','02116','02118',
     '02119','02120','02121','02124','02125','02127','02128','02129','02130','02132',
  ].map(zip => ({ zip, citySlug: 'boston' })),
  // Washington DC
  ...['20001','20002','20003','20004','20005','20006','20007','20008','20009','20010',
     '20011','20012','20015','20016','20017','20018','20019','20020','20024','20036',
  ].map(zip => ({ zip, citySlug: 'washington' })),
  // Atlanta
  ...['30301','30303','30305','30306','30307','30308','30309','30310','30311','30312',
     '30313','30314','30316','30318','30319','30324','30326','30327','30331','30342',
  ].map(zip => ({ zip, citySlug: 'atlanta' })),
  // Detroit
  ...['48201','48202','48204','48205','48207','48208','48209','48210','48213','48214',
     '48215','48216','48226','48227','48228','48234','48235','48238','48219','48221',
  ].map(zip => ({ zip, citySlug: 'detroit' })),
  // Minneapolis
  ...['55401','55402','55403','55404','55405','55406','55407','55408','55409','55410',
     '55411','55412','55413','55414','55415','55416','55417','55418','55419','55455',
  ].map(zip => ({ zip, citySlug: 'minneapolis' })),
  // Portland
  ...['97201','97202','97203','97204','97205','97206','97209','97210','97211','97212',
     '97213','97214','97215','97217','97218','97219','97220','97227','97232','97239',
  ].map(zip => ({ zip, citySlug: 'portland' })),
]
