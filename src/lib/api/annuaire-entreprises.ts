/**
 * API Annuaire des Entreprises (recherche-entreprises.api.gouv.fr)
 * Documentation: https://search-entreprises.api.gouv.fr/docs
 *
 * API GRATUITE du gouvernement français — pas de clé API requise
 * Rate limit: 7 requêtes/seconde
 *
 * Utilisée pour la collecte massive d'artisans par code NAF + département
 */

import { retry } from '../utils/retry'
import { APIError, ErrorCode } from '../utils/errors'
import { apiLogger } from '@/lib/logger'

const API_BASE = 'https://search-entreprises.api.gouv.fr'

// Rate limit: 7 req/s → 150ms between requests
const MIN_REQUEST_INTERVAL = 150
let lastRequestTime = 0

// ============================================
// TYPES
// ============================================

export interface AnnuaireEtablissement {
  activite_principale: string        // NAF code (e.g., '43.21A')
  adresse: string
  code_postal: string
  commune: string
  date_creation: string
  est_siege: boolean
  etat_administratif: 'A' | 'F'     // A=actif, F=fermé
  geo_adresse: string | null
  latitude: string | null
  longitude: string | null
  liste_enseignes: string[] | null
  liste_finess: string[] | null
  liste_idcc: string[] | null
  liste_rge: string[] | null
  liste_uai: string[] | null
  nom_commercial: string | null
  siret: string
  tranche_effectif_salarie: string | null
}

export interface AnnuaireEntreprise {
  siren: string
  nom_complet: string
  nom_raison_sociale: string | null
  sigle: string | null
  nombre_etablissements: number
  nombre_etablissements_ouverts: number
  siege: AnnuaireEtablissement
  activite_principale: string
  categorie_entreprise: string | null
  categorie_juridique: string
  date_creation: string
  date_mise_a_jour: string | null
  dirigeants: AnnuaireDirigeant[]
  etat_administratif: 'A' | 'C'     // A=actif, C=cessé
  nature_juridique: string
  section_activite_principale: string
  statut_diffusion: 'O' | 'P'       // O=diffusible, P=partiellement
  tranche_effectif_salarie: string | null
  annee_tranche_effectif_salarie: string | null
  caractere_employeur: 'O' | 'N' | null
  // Financial
  complements?: {
    collectivite_territoriale: unknown | null
    convention_collective_renseignee: boolean
    est_association: boolean
    est_bio: boolean
    est_entrepreneur_individuel: boolean
    est_entrepreneur_spectacle: boolean
    est_ess: boolean
    est_finess: boolean
    est_qualiopi: boolean
    est_rge: boolean
    est_service_public: boolean
    est_societe_mission: boolean
    est_uai: boolean
    identifiant_association: string | null
    statut_entrepreneur_spectacle: string | null
  }
  matching_etablissements?: AnnuaireEtablissement[]
}

export interface AnnuaireDirigeant {
  nom: string
  prenoms: string
  annee_de_naissance: string
  qualite: string
  type_dirigeant: 'personne physique' | 'personne morale'
}

export interface AnnuaireSearchResponse {
  results: AnnuaireEntreprise[]
  total_results: number
  page: number
  per_page: number
  total_pages: number
}

export interface AnnuaireSearchOptions {
  /** Code NAF/APE (e.g., '43.21A') */
  activite_principale?: string
  /** Code département (e.g., '75') */
  code_postal?: string
  /** Code commune INSEE */
  location_code?: string
  /** Department code for geo filtering */
  departement?: string
  /** Only active businesses */
  etat_administratif?: 'A' | 'C'
  /** Page number (1-based) */
  page?: number
  /** Results per page (max 25) */
  per_page?: number
  /** Free text query */
  q?: string
  /** Only registered artisans (CMA) */
  est_rge?: boolean
  /** Nature juridique */
  nature_juridique?: string
  /** Minimum number of employees */
  tranche_effectif_salarie_min?: string
}

// ============================================
// RATE LIMITER
// ============================================

async function rateLimitWait(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed))
  }
  lastRequestTime = Date.now()
}

// ============================================
// API REQUEST
// ============================================

async function annuaireRequest<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> {
  const logger = apiLogger.child({ api: 'annuaire-entreprises' })
  const start = Date.now()

  await rateLimitWait()

  return retry(
    async () => {
      const url = new URL(`${API_BASE}${endpoint}`)
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value)
      })

      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' },
      })

      const duration = Date.now() - start

      if (!response.ok) {
        if (response.status === 429) {
          throw new APIError('Annuaire', 'Rate limit exceeded', {
            code: ErrorCode.API_RATE_LIMIT,
            statusCode: 429,
            retryable: true,
          })
        }
        if (response.status === 404) {
          throw new APIError('Annuaire', 'Not found', {
            code: ErrorCode.API_NOT_FOUND,
            statusCode: 404,
            retryable: false,
          })
        }
        throw new APIError('Annuaire', `API error: ${response.status}`, {
          statusCode: response.status,
          retryable: response.status >= 500,
          context: { endpoint },
        })
      }

      const data = await response.json()
      logger.api.request(endpoint, 'GET', { statusCode: response.status, duration })

      return data as T
    },
    {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 15000,
      onRetry: (error, attempt) => {
        logger.warn(`Retry attempt ${attempt}`, { error, endpoint })
      },
    }
  )
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Recherche d'entreprises avec filtres
 * API gratuite, pas de clé requise
 */
export async function searchEntreprises(
  options: AnnuaireSearchOptions
): Promise<AnnuaireSearchResponse> {
  const params: Record<string, string> = {}

  if (options.q) params.q = options.q
  if (options.activite_principale) params.activite_principale = options.activite_principale
  if (options.code_postal) params.code_postal = options.code_postal
  if (options.location_code) params.location_code = options.location_code
  if (options.departement) params.departement = options.departement
  if (options.etat_administratif) params.etat_administratif = options.etat_administratif
  if (options.nature_juridique) params.nature_juridique = options.nature_juridique
  if (options.est_rge) params.est_rge = 'true'
  if (options.page) params.page = String(options.page)
  if (options.per_page) params.per_page = String(Math.min(options.per_page, 25))

  return annuaireRequest<AnnuaireSearchResponse>('/search', params)
}

/**
 * Recherche d'artisans par code NAF et département
 * Utilisée par le script de collecte massive
 */
export async function searchArtisansByNafAndDepartment(
  codeNaf: string,
  departement: string,
  page: number = 1,
  perPage: number = 25
): Promise<AnnuaireSearchResponse> {
  return searchEntreprises({
    activite_principale: codeNaf,
    departement,
    etat_administratif: 'A', // Only active
    page,
    per_page: perPage,
  })
}

/**
 * Récupère une entreprise par SIREN
 */
export async function getEntrepriseBySiren(
  siren: string
): Promise<AnnuaireEntreprise | null> {
  try {
    const response = await searchEntreprises({
      q: siren,
      per_page: 1,
    })

    if (response.results.length > 0 && response.results[0].siren === siren) {
      return response.results[0]
    }

    return null
  } catch {
    return null
  }
}

/**
 * Collecte toutes les pages pour un code NAF + département
 * Gère la pagination automatiquement
 * Yields results page by page for memory efficiency
 */
export async function* collectAllPages(
  codeNaf: string,
  departement: string,
  startPage: number = 1
): AsyncGenerator<{
  entreprises: AnnuaireEntreprise[]
  page: number
  totalPages: number
  totalResults: number
}> {
  let page = startPage
  let totalPages = 1

  while (page <= totalPages) {
    const response = await searchArtisansByNafAndDepartment(
      codeNaf,
      departement,
      page,
      25
    )

    totalPages = response.total_pages

    yield {
      entreprises: response.results,
      page: response.page,
      totalPages: response.total_pages,
      totalResults: response.total_results,
    }

    page++
  }
}

/**
 * Transform an Annuaire entreprise into a partial provider record
 * for upsert into the providers table
 */
export function transformToProviderRecord(entreprise: AnnuaireEntreprise): Record<string, unknown> {
  const siege = entreprise.siege

  return {
    siren: entreprise.siren,
    siret: siege.siret,
    name: entreprise.nom_complet,
    code_naf: entreprise.activite_principale,
    libelle_naf: null, // Will be filled from NAF config
    legal_form: entreprise.nature_juridique || null,
    legal_form_code: entreprise.categorie_juridique || null,
    creation_date: entreprise.date_creation || null,
    employee_count: entreprise.tranche_effectif_salarie || null,
    address_street: siege.adresse || null,
    address_postal_code: siege.code_postal || null,
    address_city: siege.commune || null,
    latitude: siege.latitude ? parseFloat(siege.latitude) : null,
    longitude: siege.longitude ? parseFloat(siege.longitude) : null,
    is_active: entreprise.etat_administratif === 'A',
    is_artisan: true,
    source: 'annuaire_entreprises',
    source_api: 'annuaire_entreprises',
    source_id: entreprise.siren,
    derniere_maj_api: new Date().toISOString(),
  }
}
