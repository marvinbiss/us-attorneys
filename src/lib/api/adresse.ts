/**
 * API Adresse data.gouv.fr
 * Documentation: https://adresse.data.gouv.fr/api-doc/adresse
 *
 * API officielle du gouvernement français
 * 100% GRATUIT - Pas de limite - Pas de clé API
 *
 * Upgraded with world-class error handling, caching, and retry logic
 */

import { retry } from '../utils/retry'
import { searchCache, geocodeCache } from '../utils/cache'
import { APIError, ValidationError } from '../utils/errors'
import { apiLogger } from '@/lib/logger'

const API_BASE = 'https://api-adresse.data.gouv.fr'

// Types
export interface AdresseSuggestion {
  id: string
  label: string
  name: string
  city: string
  postcode: string
  citycode: string
  context: string // "75, Paris, Île-de-France"
  type: 'housenumber' | 'street' | 'locality' | 'municipality'
  coordinates: [number, number] // [longitude, latitude]
  importance: number
  score: number
}

export interface GeocodageResult {
  coordinates: [number, number] // [longitude, latitude]
  label: string
  city: string
  postcode: string
  context: string
  confidence: number
}

interface APIFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    id: string
    label: string
    name: string
    city: string
    postcode: string
    citycode: string
    context: string
    type: 'housenumber' | 'street' | 'locality' | 'municipality'
    importance: number
    score: number
  }
}

interface APIResponse {
  type: 'FeatureCollection'
  features: APIFeature[]
  version: string
  attribution: string
  licence: string
  query: string
  limit: number
}

/**
 * Make request to API Adresse
 */
async function adresseRequest<T>(
  endpoint: string,
  params: Record<string, string>,
  options: {
    cacheKey?: string
    cacheTtl?: number
    useSearchCache?: boolean
  } = {}
): Promise<T> {
  const logger = apiLogger.child({ api: 'adresse.data.gouv' })
  const start = Date.now()

  // Check cache
  const cache = options.useSearchCache ? searchCache : geocodeCache
  if (options.cacheKey) {
    const cached = cache.get(options.cacheKey)
    if (cached !== undefined) {
      logger.debug('Cache hit', { cacheKey: options.cacheKey })
      return cached as T
    }
  }

  try {
    return await retry(
      async () => {
        const url = new URL(`${API_BASE}${endpoint}`)
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value)
        })

        const response = await fetch(url.toString(), {
          headers: { 'Accept': 'application/json' },
        })

        const duration = Date.now() - start

        if (!response.ok) {
          throw new APIError('Adresse', `API error: ${response.status}`, {
            statusCode: response.status,
            retryable: response.status >= 500,
            endpoint,
          })
        }

        const data = await response.json()
        logger.api.request(endpoint, 'GET', { statusCode: response.status, duration })

        // Cache successful response
        if (options.cacheKey) {
          cache.set(
            options.cacheKey,
            data,
            options.cacheTtl || (options.useSearchCache ? 60000 : 86400000)
          )
        }

        return data as T
      },
      {
        maxAttempts: 3,
        initialDelay: 300,
        maxDelay: 2000,
        onRetry: (error, attempt) => {
          logger.warn(`Retry attempt ${attempt}`, { error, endpoint })
        },
      }
    )
  } catch (error) {
    logger.error('Request failed', error as Error, { endpoint })
    throw error
  }
}

// ============================================
// AUTOCOMPLETE ADRESSES
// ============================================

/**
 * Autocomplete pour recherche d'adresses complètes
 * @param query - Texte de recherche (ex: "12 rue de la")
 * @param options - Options de filtrage
 */
export async function autocompleteAdresse(
  query: string,
  options?: {
    limit?: number
    type?: 'housenumber' | 'street' | 'locality' | 'municipality'
    postcode?: string
    citycode?: string
    lat?: number
    lon?: number
  }
): Promise<AdresseSuggestion[]> {
  if (!query || query.length < 2) return []

  const params: Record<string, string> = {
    q: query,
    limit: String(options?.limit || 5),
    autocomplete: '1',
  }

  if (options?.type) params.type = options.type
  if (options?.postcode) params.postcode = options.postcode
  if (options?.citycode) params.citycode = options.citycode
  if (options?.lat && options?.lon) {
    params.lat = String(options.lat)
    params.lon = String(options.lon)
  }

  try {
    const cacheKey = `autocomplete:${query}:${JSON.stringify(options)}`
    const data = await adresseRequest<APIResponse>('/search/', params, {
      cacheKey,
      useSearchCache: true,
    })

    return data.features.map(mapFeatureToSuggestion)
  } catch (error) {
    // Graceful degradation - return empty on error
    apiLogger.error('Autocomplete failed', error as Error, { query })
    return []
  }
}

// ============================================
// AUTOCOMPLETE VILLES UNIQUEMENT
// ============================================

/**
 * Autocomplete pour recherche de cities uniquement
 * @param query - Nom de ville ou code postal
 */
export async function autocompleteVille(
  query: string,
  limit = 10
): Promise<AdresseSuggestion[]> {
  if (!query || query.length < 2) return []

  const params: Record<string, string> = {
    q: query,
    limit: String(limit),
    type: 'municipality',
    autocomplete: '1',
  }

  try {
    const cacheKey = `ville:${query}:${limit}`
    const data = await adresseRequest<APIResponse>('/search/', params, {
      cacheKey,
      useSearchCache: true,
    })

    return data.features.map(f => ({
      ...mapFeatureToSuggestion(f),
      label: f.properties.city || f.properties.label,
    }))
  } catch (error) {
    apiLogger.error('City autocomplete failed', error as Error, { query })
    return []
  }
}

// ============================================
// GEOCODAGE (Adresse → Coordonnées GPS)
// ============================================

/**
 * Convertit une adresse en coordonnées GPS
 * @param adresse - Adresse complète (ex: "12 rue de Rivoli, Paris")
 */
export async function geocoder(adresse: string): Promise<GeocodageResult | null> {
  if (!adresse || adresse.length < 3) {
    throw new ValidationError('Adresse trop courte', { field: 'adresse', value: adresse })
  }

  const cacheKey = `geocode:${adresse.toLowerCase().trim()}`

  try {
    const data = await adresseRequest<APIResponse>('/search/', {
      q: adresse,
      limit: '1',
    }, { cacheKey })

    if (!data.features || data.features.length === 0) {
      return null
    }

    const feature = data.features[0]
    return {
      coordinates: feature.geometry.coordinates,
      label: feature.properties.label,
      city: feature.properties.city,
      postcode: feature.properties.postcode,
      context: feature.properties.context,
      confidence: feature.properties.score,
    }
  } catch (error) {
    apiLogger.error('Geocoding failed', error as Error, { adresse })
    return null
  }
}

// ============================================
// REVERSE GEOCODING (GPS → Adresse)
// ============================================

/**
 * Convertit des coordonnées GPS en adresse
 * @param lon - Longitude
 * @param lat - Latitude
 */
export async function reverseGeocode(
  lon: number,
  lat: number
): Promise<GeocodageResult | null> {
  // Validate coordinates
  if (typeof lon !== 'number' || typeof lat !== 'number') {
    throw new ValidationError('Coordonnées invalides')
  }

  // Basic France bounds check
  if (lon < -5 || lon > 10 || lat < 41 || lat > 51) {
    apiLogger.warn('Coordinates outside France bounds', { lon, lat })
  }

  const cacheKey = `reverse:${lon.toFixed(5)}:${lat.toFixed(5)}`

  try {
    const data = await adresseRequest<APIResponse>('/reverse/', {
      lon: String(lon),
      lat: String(lat),
    }, { cacheKey })

    if (!data.features || data.features.length === 0) {
      return null
    }

    const feature = data.features[0]
    return {
      coordinates: feature.geometry.coordinates,
      label: feature.properties.label,
      city: feature.properties.city,
      postcode: feature.properties.postcode,
      context: feature.properties.context,
      confidence: feature.properties.score,
    }
  } catch (error) {
    apiLogger.error('Reverse geocoding failed', error as Error, { lon, lat })
    return null
  }
}

// ============================================
// RECHERCHE PAR CODE POSTAL
// ============================================

/**
 * Récupère toutes les communes d'un code postal
 * @param codePostal - Code postal (ex: "75001")
 */
export async function getLocationsByCodePostal(
  codePostal: string
): Promise<AdresseSuggestion[]> {
  if (!isValidCodePostal(codePostal)) {
    throw new ValidationError('Code postal invalide', {
      field: 'codePostal',
      value: codePostal,
    })
  }

  const cacheKey = `communes:${codePostal}`

  try {
    const data = await adresseRequest<APIResponse>('/search/', {
      q: codePostal,
      type: 'municipality',
      limit: '20',
    }, { cacheKey })

    return data.features
      .filter(f => f.properties.postcode === codePostal)
      .map(mapFeatureToSuggestion)
  } catch (error) {
    apiLogger.error('Get communes failed', error as Error, { codePostal })
    return []
  }
}

/**
 * Recherche CSV batch (pour imports massifs)
 */
export async function geocodeBatch(
  addresses: string[]
): Promise<Array<GeocodageResult | null>> {
  // Process in smaller batches to avoid rate limiting
  const batchSize = 10
  const results: Array<GeocodageResult | null> = []

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(addr => geocoder(addr).catch(() => null))
    )
    results.push(...batchResults)

    // Small delay between batches
    if (i + batchSize < addresses.length) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  return results
}

// ============================================
// CALCUL DE DISTANCE
// ============================================

/**
 * Calcule la distance entre deux points GPS (formule Haversine)
 * @returns Distance en kilomètres
 */
export function calculerDistance(
  coord1: [number, number], // [lon, lat]
  coord2: [number, number]  // [lon, lat]
): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = toRad(coord2[1] - coord1[1])
  const dLon = toRad(coord2[0] - coord1[0])
  const lat1 = toRad(coord1[1])
  const lat2 = toRad(coord2[1])

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c * 10) / 10 // Arrondi à 0.1 km
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Trouve les adresses dans un rayon donné
 */
export function filterByRadius<T extends { coordinates: [number, number] }>(
  items: T[],
  center: [number, number],
  radiusKm: number
): T[] {
  return items.filter(item =>
    calculerDistance(item.coordinates, center) <= radiusKm
  )
}

/**
 * Trie les résultats par distance
 */
export function sortByDistance<T extends { coordinates: [number, number] }>(
  items: T[],
  center: [number, number]
): T[] {
  return [...items].sort((a, b) =>
    calculerDistance(a.coordinates, center) - calculerDistance(b.coordinates, center)
  )
}

// ============================================
// VALIDATION
// ============================================

/**
 * Valide un code postal français
 */
export function isValidCodePostal(codePostal: string): boolean {
  if (!codePostal || typeof codePostal !== 'string') return false

  // 5 chiffres, commence par 01-95 ou 97 (DOM) ou 98 (Monaco, etc.)
  const regex = /^(?:0[1-9]|[1-8]\d|9[0-5]|97[1-6]|98[4-9])\d{3}$/
  return regex.test(codePostal)
}

/**
 * Extrait le département d'un code postal
 */
export function getDepartementFromCodePostal(codePostal: string): string | null {
  if (!isValidCodePostal(codePostal)) return null

  // DOM-TOM: 97x et 98x
  if (codePostal.startsWith('97') || codePostal.startsWith('98')) {
    return codePostal.substring(0, 3)
  }

  // Corse: 2A et 2B
  if (codePostal.startsWith('20')) {
    const num = parseInt(codePostal.substring(2, 4))
    return num < 20 ? '2A' : '2B'
  }

  return codePostal.substring(0, 2)
}

// ============================================
// FORMATTAGE
// ============================================

/**
 * Formate une adresse proprement
 */
export function formaterAdresse(components: {
  numero?: string
  rue?: string
  codePostal?: string
  ville?: string
}): string {
  const parts: string[] = []

  if (components.numero && components.rue) {
    parts.push(`${components.numero} ${components.rue}`)
  } else if (components.rue) {
    parts.push(components.rue)
  }

  if (components.codePostal && components.ville) {
    parts.push(`${components.codePostal} ${components.ville}`)
  } else if (components.ville) {
    parts.push(components.ville)
  }

  return parts.join(', ')
}

/**
 * Parse une adresse en composants
 */
export function parseAdresse(adresse: string): {
  numero?: string
  rue?: string
  codePostal?: string
  ville?: string
} {
  const result: {
    numero?: string
    rue?: string
    codePostal?: string
    ville?: string
  } = {}

  // Try to extract postal code
  const cpMatch = adresse.match(/\b(\d{5})\b/)
  if (cpMatch) {
    result.codePostal = cpMatch[1]
    // City is usually after postal code
    const afterCp = adresse.substring(adresse.indexOf(cpMatch[1]) + 5).trim()
    if (afterCp) {
      result.ville = afterCp.replace(/^[,\s]+/, '').split(/[,\n]/)[0].trim()
    }
  }

  // Try to extract number
  const numMatch = adresse.match(/^(\d+(?:\s*(?:bis|ter|quater))?)\s+/i)
  if (numMatch) {
    result.numero = numMatch[1]
  }

  // Extract street (between number and postal code)
  if (result.numero && result.codePostal) {
    const start = adresse.indexOf(result.numero) + result.numero.length
    const end = adresse.indexOf(result.codePostal)
    const rue = adresse.substring(start, end).replace(/^[,\s]+|[,\s]+$/g, '')
    if (rue) result.rue = rue
  }

  return result
}

// ============================================
// HELPERS
// ============================================

function mapFeatureToSuggestion(f: APIFeature): AdresseSuggestion {
  return {
    id: f.properties.id,
    label: f.properties.label,
    name: f.properties.name,
    city: f.properties.city,
    postcode: f.properties.postcode,
    citycode: f.properties.citycode,
    context: f.properties.context,
    type: f.properties.type,
    coordinates: f.geometry.coordinates,
    importance: f.properties.importance,
    score: f.properties.score,
  }
}

/**
 * Départements français avec noms
 */
export const DEPARTEMENTS: Record<string, string> = {
  '01': 'Ain',
  '02': 'Aisne',
  '03': 'Allier',
  '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes',
  '07': 'Ardèche',
  '08': 'Ardennes',
  '09': 'Ariège',
  '10': 'Aube',
  '11': 'Aude',
  '12': 'Aveyron',
  '13': 'Bouches-du-Rhône',
  '14': 'Calvados',
  '15': 'Cantal',
  '16': 'Charente',
  '17': 'Charente-Maritime',
  '18': 'Cher',
  '19': 'Corrèze',
  '21': 'Côte-d\'Or',
  '22': 'Côtes-d\'Armor',
  '23': 'Creuse',
  '24': 'Dordogne',
  '25': 'Doubs',
  '26': 'Drôme',
  '27': 'Eure',
  '28': 'Eure-et-Loir',
  '29': 'Finistère',
  '2A': 'Corse-du-Sud',
  '2B': 'Haute-Corse',
  '30': 'Gard',
  '31': 'Haute-Garonne',
  '32': 'Gers',
  '33': 'Gironde',
  '34': 'Hérault',
  '35': 'Ille-et-Vilaine',
  '36': 'Indre',
  '37': 'Indre-et-Loire',
  '38': 'Isère',
  '39': 'Jura',
  '40': 'Landes',
  '41': 'Loir-et-Cher',
  '42': 'Loire',
  '43': 'Haute-Loire',
  '44': 'Loire-Atlantique',
  '45': 'Loiret',
  '46': 'Lot',
  '47': 'Lot-et-Garonne',
  '48': 'Lozère',
  '49': 'Maine-et-Loire',
  '50': 'Manche',
  '51': 'Marne',
  '52': 'Haute-Marne',
  '53': 'Mayenne',
  '54': 'Meurthe-et-Moselle',
  '55': 'Meuse',
  '56': 'Morbihan',
  '57': 'Moselle',
  '58': 'Nièvre',
  '59': 'Nord',
  '60': 'Oise',
  '61': 'Orne',
  '62': 'Pas-de-Calais',
  '63': 'Puy-de-Dôme',
  '64': 'Pyrénées-Atlantiques',
  '65': 'Hautes-Pyrénées',
  '66': 'Pyrénées-Orientales',
  '67': 'Bas-Rhin',
  '68': 'Haut-Rhin',
  '69': 'Rhône',
  '70': 'Haute-Saône',
  '71': 'Saône-et-Loire',
  '72': 'Sarthe',
  '73': 'Savoie',
  '74': 'Haute-Savoie',
  '75': 'Paris',
  '76': 'Seine-Maritime',
  '77': 'Seine-et-Marne',
  '78': 'Yvelines',
  '79': 'Deux-Sèvres',
  '80': 'Somme',
  '81': 'Tarn',
  '82': 'Tarn-et-Garonne',
  '83': 'Var',
  '84': 'Vaucluse',
  '85': 'Vendée',
  '86': 'Vienne',
  '87': 'Haute-Vienne',
  '88': 'Vosges',
  '89': 'Yonne',
  '90': 'Territoire de Belfort',
  '91': 'Essonne',
  '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne',
  '95': 'Val-d\'Oise',
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
  '974': 'La Réunion',
  '976': 'Mayotte',
}
