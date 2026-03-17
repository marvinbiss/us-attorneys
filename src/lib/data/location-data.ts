/**
 * Fetches location demographic & enrichment data from Supabase.
 * Used by service+location pages for data-driven unique SEO content.
 *
 * Data is cached in-memory for 24 hours (location data changes infrequently).
 * Gracefully returns null when the table is empty or DB is unavailable.
 */

import { getCachedData, CACHE_TTL } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationData {
  // Identity
  code_insee: string
  name: string
  slug: string
  code_postal: string | null
  departement_code: string
  departement_name: string | null
  region_name: string | null

  // Geography
  latitude: number | null
  longitude: number | null
  altitude_moyenne: number | null
  superficie_km2: number | null

  // Demographics
  population: number
  densite_population: number | null

  // Socio-economic
  revenu_median: number | null
  prix_m2_moyen: number | null
  nb_logements: number | null
  part_maisons_pct: number | null

  // Local enrichment
  climat_zone: string | null
  nb_law_firms: number | null
  gentile: string | null
  description: string | null

  // Platform data
  attorney_count: number

  // Business enrichment
  nb_attorneys_licensed: number | null

  // Certification enrichment
  nb_attorneys_verified: number | null

  // Energy performance enrichment
  pct_passoires_dpe: number | null
  nb_dpe_total: number | null

  // Climate enrichment
  jours_gel_annuels: number | null
  precipitation_annuelle: number | null
  mois_travaux_ext_debut: number | null
  mois_travaux_ext_fin: number | null
  temperature_moyenne_hiver: number | null
  temperature_moyenne_ete: number | null

  // Real estate transaction enrichment
  nb_transactions_annuelles: number | null
  prix_m2_maison: number | null
  prix_m2_appartement: number | null

  // Renovation subsidy data
  nb_maprimerenov_annuel: number | null

  // Natural risk data
  risque_inondation?: boolean
  risque_argile?: string | null  // 'fort' | 'moyen' | 'faible'
  zone_sismique?: number | null  // 1-5
  risque_radon?: number | null   // 1-3
  nb_catnat?: number
  risques_principaux?: string[]

  // Census data (JSONB from ACS)
  census_data?: {
    population?: number | null
    median_household_income?: number | null
    unemployment_rate?: number | null
    spanish_speakers?: number | null
    median_age?: number | null
    poverty_rate?: number | null
    total_households?: number | null
    owner_occupied_pct?: number | null
    bachelor_degree_pct?: number | null
    acs_year?: number
  } | null

  enriched_at: string | null
}

// ---------------------------------------------------------------------------
// Select columns -- explicit to avoid SELECT * and catch schema drift
// ---------------------------------------------------------------------------

const LOCATION_COLUMNS = [
  'code_insee', 'name', 'slug', 'code_postal',
  'departement_code', 'departement_name', 'region_name',
  'latitude', 'longitude', 'altitude_moyenne', 'superficie_km2',
  'population', 'densite_population',
  'revenu_median', 'prix_m2_moyen', 'nb_logements', 'part_maisons_pct',
  'climat_zone', 'nb_law_firms', 'gentile', 'description',
  'attorney_count',
  'nb_attorneys_licensed', 'nb_attorneys_verified',
  'pct_passoires_dpe', 'nb_dpe_total',
  'jours_gel_annuels', 'precipitation_annuelle',
  'mois_travaux_ext_debut', 'mois_travaux_ext_fin',
  'temperature_moyenne_hiver', 'temperature_moyenne_ete',
  'nb_transactions_annuelles', 'prix_m2_maison', 'prix_m2_appartement',
  'nb_maprimerenov_annuel',
  'risque_inondation', 'risque_argile', 'zone_sismique', 'risque_radon',
  'nb_catnat', 'risques_principaux',
  'census_data',
  'enriched_at',
].join(',')

// ---------------------------------------------------------------------------
// Fetch location data by slug (cached 24h)
// ---------------------------------------------------------------------------

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

export async function getLocationBySlug(slug: string): Promise<LocationData | null> {
  if (IS_BUILD) return null // Skip DB during build -- ISR will populate on first visit
  return getCachedData<LocationData | null>(
    `location:${slug}`,
    async () => {
      try {
        // Lazy import to avoid crashes when env vars are missing (build time)
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        const { data, error } = await supabase
          .from('locations_us')
          .select(LOCATION_COLUMNS)
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (error || !data) return null
        return data as unknown as LocationData
      } catch {
        // DB unavailable or table does not exist yet -- graceful fallback
        return null
      }
    },
    CACHE_TTL.locations, // 24 hours
    { skipNull: true }
  )
}

// ---------------------------------------------------------------------------
// Helper: check if location has enrichment data (beyond basic demographics)
// ---------------------------------------------------------------------------

export function hasEnrichmentData(location: LocationData): boolean {
  return !!(
    location.nb_attorneys_licensed ||
    location.nb_attorneys_verified ||
    location.pct_passoires_dpe ||
    location.jours_gel_annuels ||
    location.nb_transactions_annuelles ||
    location.nb_maprimerenov_annuel
  )
}

/** Check if location has natural risk data */
export function hasGeorisquesData(location: LocationData): boolean {
  return !!(
    location.risque_inondation ||
    location.risque_argile ||
    location.zone_sismique ||
    location.risque_radon ||
    location.nb_catnat
  )
}

/** Check if location has at least basic demographic data */
export function hasDemographicData(location: LocationData): boolean {
  return !!(
    location.revenu_median ||
    location.prix_m2_moyen ||
    location.nb_logements ||
    location.part_maisons_pct
  )
}

/** Check if location has Census ACS data */
export function hasCensusData(location: LocationData): boolean {
  return !!(
    location.census_data &&
    (location.census_data.population ||
     location.census_data.median_household_income ||
     location.census_data.median_age ||
     location.census_data.unemployment_rate)
  )
}

// ---------------------------------------------------------------------------
// Helper: format number with US thousands separator
// ---------------------------------------------------------------------------

export function formatNumber(n: number): string {
  return (n ?? 0).toLocaleString('en-US')
}

export function formatUSD(n: number): string {
  return '$' + (n ?? 0).toLocaleString('en-US')
}

export function formatDollarSign(n: number): string {
  return '$' + (n ?? 0).toLocaleString('en-US')
}

// formatEuro removed — was a deprecated alias for formatDollarSign (French legacy)

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function monthName(m: number): string {
  return MONTH_NAMES[m] || ''
}
