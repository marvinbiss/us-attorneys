/**
 * Fetches commune demographic & enrichment data from Supabase.
 * Used by service+location pages for data-driven unique SEO content.
 *
 * Data is cached in-memory for 24 hours (communes data changes infrequently).
 * Gracefully returns null when the table is empty or DB is unavailable.
 */

import { getCachedData, CACHE_TTL } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommuneData {
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

  // Socio-economic (INSEE + DVF)
  revenu_median: number | null
  prix_m2_moyen: number | null
  nb_logements: number | null
  part_maisons_pct: number | null

  // Local enrichment
  climat_zone: string | null
  nb_entreprises_artisanales: number | null
  gentile: string | null
  description: string | null

  // Platform data
  provider_count: number

  // SIRENE enrichment
  nb_artisans_btp: number | null

  // RGE enrichment
  nb_artisans_rge: number | null

  // DPE enrichment
  pct_passoires_dpe: number | null
  nb_dpe_total: number | null

  // Climate enrichment
  jours_gel_annuels: number | null
  precipitation_annuelle: number | null
  mois_travaux_ext_debut: number | null
  mois_travaux_ext_fin: number | null
  temperature_moyenne_hiver: number | null
  temperature_moyenne_ete: number | null

  // DVF enrichment
  nb_transactions_annuelles: number | null
  prix_m2_maison: number | null
  prix_m2_appartement: number | null

  // MaPrimeRénov
  nb_maprimerenov_annuel: number | null

  // Géorisques
  risque_inondation?: boolean
  risque_argile?: string | null  // 'fort' | 'moyen' | 'faible'
  zone_sismique?: number | null  // 1-5
  risque_radon?: number | null   // 1-3
  nb_catnat?: number
  risques_principaux?: string[]

  enriched_at: string | null
}

// ---------------------------------------------------------------------------
// Select columns — explicit to avoid SELECT * and catch schema drift
// ---------------------------------------------------------------------------

const COMMUNE_COLUMNS = [
  'code_insee', 'name', 'slug', 'code_postal',
  'departement_code', 'departement_name', 'region_name',
  'latitude', 'longitude', 'altitude_moyenne', 'superficie_km2',
  'population', 'densite_population',
  'revenu_median', 'prix_m2_moyen', 'nb_logements', 'part_maisons_pct',
  'climat_zone', 'nb_entreprises_artisanales', 'gentile', 'description',
  'provider_count',
  'nb_artisans_btp', 'nb_artisans_rge',
  'pct_passoires_dpe', 'nb_dpe_total',
  'jours_gel_annuels', 'precipitation_annuelle',
  'mois_travaux_ext_debut', 'mois_travaux_ext_fin',
  'temperature_moyenne_hiver', 'temperature_moyenne_ete',
  'nb_transactions_annuelles', 'prix_m2_maison', 'prix_m2_appartement',
  'nb_maprimerenov_annuel',
  'risque_inondation', 'risque_argile', 'zone_sismique', 'risque_radon',
  'nb_catnat', 'risques_principaux',
  'enriched_at',
].join(',')

// ---------------------------------------------------------------------------
// Fetch commune data by slug (cached 24h)
// ---------------------------------------------------------------------------

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

export async function getCommuneBySlug(slug: string): Promise<CommuneData | null> {
  if (IS_BUILD) return null // Skip DB during build — ISR will populate on first visit
  return getCachedData<CommuneData | null>(
    `commune:${slug}`,
    async () => {
      try {
        // Lazy import to avoid crashes when env vars are missing (build time)
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        const { data, error } = await supabase
          .from('communes')
          .select(COMMUNE_COLUMNS)
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (error || !data) return null
        return data as unknown as CommuneData
      } catch {
        // DB unavailable or table doesn't exist yet — graceful fallback
        return null
      }
    },
    CACHE_TTL.locations, // 24 hours
    { skipNull: true }
  )
}

// ---------------------------------------------------------------------------
// Helper: check if commune has enrichment data (beyond basic demographics)
// ---------------------------------------------------------------------------

export function hasEnrichmentData(commune: CommuneData): boolean {
  return !!(
    commune.nb_artisans_btp ||
    commune.nb_artisans_rge ||
    commune.pct_passoires_dpe ||
    commune.jours_gel_annuels ||
    commune.nb_transactions_annuelles ||
    commune.nb_maprimerenov_annuel
  )
}

/** Check if commune has Géorisques risk data */
export function hasGeorisquesData(commune: CommuneData): boolean {
  return !!(
    commune.risque_inondation ||
    commune.risque_argile ||
    commune.zone_sismique ||
    commune.risque_radon ||
    commune.nb_catnat
  )
}

/** Check if commune has at least basic demographic data */
export function hasDemographicData(commune: CommuneData): boolean {
  return !!(
    commune.revenu_median ||
    commune.prix_m2_moyen ||
    commune.nb_logements ||
    commune.part_maisons_pct
  )
}

// ---------------------------------------------------------------------------
// Helper: format number with French thousands separator
// ---------------------------------------------------------------------------

export function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

export function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR') + ' \u20AC'
}

const MONTH_NAMES = [
  '', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export function monthName(m: number): string {
  return MONTH_NAMES[m] || ''
}
