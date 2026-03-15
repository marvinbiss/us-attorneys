/**
 * Client API SIRENE Open Data (sans authentification)
 * Utilise l'API de recherche-entreprises.fabrique.social.gouv.fr
 */

import { SIRENE_OPEN_CONFIG, TRANCHES_EFFECTIFS } from './config'
import { logger } from '@/lib/logger'

interface SearchResult {
  siren: string
  nom_complet: string
  nom_raison_sociale: string
  siege: {
    siret: string
    adresse: string
    code_postal: string
    libelle_commune: string
    departement: string
    region: string
    latitude: string
    longitude: string
  }
  activite_principale: string
  nature_juridique: string
  tranche_effectif_salarie: string
  date_creation: string
  etat_administratif: string
  nombre_etablissements: number
  nombre_etablissements_ouverts: number
}

interface ApiResponse {
  results: SearchResult[]
  total_results: number
  page: number
  per_page: number
  total_pages: number
}

/**
 * Rechercher des entreprises par activite et localisation
 */
export async function searchEntreprisesOpen(
  activite: string,
  departement: string,
  page: number = 1
): Promise<{ results: SearchResult[]; total: number; hasMore: boolean }> {

  const params = new URLSearchParams({
    activite_principale: activite,
    departement,
    etat_administratif: 'A', // Actif seulement
    page: page.toString(),
    per_page: SIRENE_OPEN_CONFIG.pageSize.toString(),
  })

  const url = `${SIRENE_OPEN_CONFIG.baseUrl}/search?${params.toString()}`

  let retries = 0
  while (retries < SIRENE_OPEN_CONFIG.maxRetries) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (response.status === 429) {
        logger.info('Rate limit, attente...')
        await new Promise(resolve => setTimeout(resolve, 60000))
        retries++
        continue
      }

      if (!response.ok) {
        if (response.status === 404) {
          return { results: [], total: 0, hasMore: false }
        }
        const error = await response.text()
        throw new Error(`Erreur API: ${response.status} - ${error}`)
      }

      const data: ApiResponse = await response.json()

      return {
        results: data.results || [],
        total: data.total_results || 0,
        hasMore: page < data.total_pages,
      }

    } catch (error) {
      retries++
      if (retries >= SIRENE_OPEN_CONFIG.maxRetries) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, SIRENE_OPEN_CONFIG.retryDelay * retries))
    }
  }

  return { results: [], total: 0, hasMore: false }
}

/**
 * Rechercher par terme libre (nom, ville, etc.)
 */
export async function searchByTermOpen(
  term: string,
  departement?: string,
  page: number = 1
): Promise<{ results: SearchResult[]; total: number; hasMore: boolean }> {

  const params = new URLSearchParams({
    q: term,
    etat_administratif: 'A',
    page: page.toString(),
    per_page: SIRENE_OPEN_CONFIG.pageSize.toString(),
  })

  if (departement) {
    params.set('departement', departement)
  }

  // Filter sur les activites du batiment (codes NAF 41, 42, 43)
  params.set('section_activite_principale', 'F') // Section F = Construction

  const url = `${SIRENE_OPEN_CONFIG.baseUrl}/search?${params.toString()}`

  logger.debug('Calling API', { url })

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })

    logger.debug('API Response status', { status: response.status })

    if (!response.ok) {
      if (response.status === 404) {
        return { results: [], total: 0, hasMore: false }
      }
      const errorText = await response.text()
      logger.error('API Error', new Error(errorText))
      throw new Error(`Erreur API: ${response.status} - ${errorText}`)
    }

    const data: ApiResponse = await response.json()
    logger.debug('API returned results', { total: data.total_results })

    return {
      results: data.results || [],
      total: data.total_results || 0,
      hasMore: page < data.total_pages,
    }

  } catch (error) {
    logger.error('Search error', error as Error)
    return { results: [], total: 0, hasMore: false }
  }
}

/**
 * Transformer un resultat en Provider
 */
export function transformOpenResultToProvider(result: SearchResult): {
  siret: string
  siren: string
  name: string
  slug: string
  address_street: string | null
  address_city: string | null
  address_postal_code: string | null
  address_department: string | null
  address_region: string | null
  latitude: number | null
  longitude: number | null
  legal_form: string | null
  creation_date: string | null
  employee_count: number | null
  naf_code: string | null
  is_verified: boolean
  is_active: boolean
  is_premium: boolean
  source: string
  source_id: string
} {
  const name = result.nom_complet || result.nom_raison_sociale || 'Entreprise'

  // Creer le slug
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)

  // Obtenir le nombre d'employes
  const tranche = result.tranche_effectif_salarie
  const effectif = tranche && TRANCHES_EFFECTIFS[tranche]
    ? Math.round((TRANCHES_EFFECTIFS[tranche].min + TRANCHES_EFFECTIFS[tranche].max) / 2)
    : null

  // Parse latitude/longitude as numbers
  const latitude = result.siege?.latitude ? parseFloat(result.siege.latitude) : null
  const longitude = result.siege?.longitude ? parseFloat(result.siege.longitude) : null

  return {
    siret: result.siege?.siret || result.siren + '00000',
    siren: result.siren,
    name: name.substring(0, 255),
    slug: `${slug}-${result.siren}`,
    address_street: result.siege?.adresse || null,
    address_city: result.siege?.libelle_commune || null,
    address_postal_code: result.siege?.code_postal || null,
    address_department: result.siege?.departement || null,
    address_region: result.siege?.region || null,
    latitude: latitude && !isNaN(latitude) ? latitude : null,
    longitude: longitude && !isNaN(longitude) ? longitude : null,
    legal_form: result.nature_juridique || null,
    creation_date: result.date_creation || null,
    employee_count: effectif,
    naf_code: result.activite_principale || null,
    is_verified: false,
    is_active: true,
    is_premium: false,
    source: 'sirene-open',
    source_id: result.siege?.siret || result.siren,
  }
}
