/**
 * API Pappers - Données légales et financières des entreprises
 * Documentation: https://www.pappers.fr/api
 *
 * Enrichissement des fiches artisans avec :
 * - Financial info (revenue, profit)
 * - Dirigeants
 * - Insolvency proceedings
 * - Legal announcements
 *
 * Upgraded with world-class error handling, caching, and retry logic
 */

import { retry, CircuitBreaker } from '../utils/retry'
import { apiCache } from '../utils/cache'
import { APIError, ValidationError, NotFoundError, ErrorCode } from '../utils/errors'
import { apiLogger } from '@/lib/logger'

const PAPPERS_API_BASE = 'https://api.pappers.fr/v2'

// API Key from environment
const PAPPERS_API_KEY = process.env.PAPPERS_API_KEY

// Circuit breaker for Pappers API
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
  halfOpenRequests: 1,
})

// Types
interface Dirigeant {
  nom: string
  prenom: string
  fonction: string
  dateNaissance?: string
  nationalite?: string
}

interface InfosFinancieres {
  annee: number
  chiffreAffaires: number | null
  resultat: number | null
  effectif: string | null
}

export interface EntrepriseComplete {
  // Identifiants
  siren: string
  siret: string

  // General information
  nom: string
  nomCommercial: string | null
  formeJuridique: string
  formeJuridiqueCode: string
  dateCreation: string
  dateCreationFormate: string

  // Activity
  codeNAF: string
  libelleNAF: string
  domaine: string

  // Adresse
  siege: {
    adresse: string
    codePostal: string
    ville: string
    pays: string
    latitude?: number
    longitude?: number
  }

  // Dirigeants
  dirigeants: Dirigeant[]

  // Financier
  capital: number | null
  capitalFormate: string | null
  finances: InfosFinancieres[]
  dernierCA: number | null
  dernierResultat: number | null

  // Effectif
  effectif: string | null
  trancheEffectif: string | null

  // Status
  actif: boolean
  radiee: boolean
  dateRadiation?: string

  // Procedures
  procedureCollective: boolean
  procedureEnCours: string | null

  // Badges de confiance
  badges: {
    entrepriseSaine: boolean
    plusDe5Ans: boolean
    caSuperieur100k: boolean
    dirigeantIdentifie: boolean
  }
}

export interface RechercheResultat {
  siren: string
  siret: string
  nom: string
  codePostal: string
  ville: string
  codeNAF: string
  libelleNAF: string
  actif: boolean
}

/**
 * Make Pappers API request with retry and caching
 */
async function pappersRequest<T>(
  endpoint: string,
  params: Record<string, string>,
  options: {
    cacheKey?: string
    cacheTtl?: number
  } = {}
): Promise<T> {
  const logger = apiLogger.child({ api: 'pappers' })
  const start = Date.now()

  // Check cache first
  if (options.cacheKey) {
    const cached = apiCache.get(options.cacheKey)
    if (cached !== undefined) {
      logger.debug('Cache hit', { cacheKey: options.cacheKey })
      return cached as T
    }
  }

  if (!PAPPERS_API_KEY) {
    throw new APIError('Pappers', 'API key not configured', {
      code: ErrorCode.API_UNAUTHORIZED,
    })
  }

  try {
    return await circuitBreaker.execute(async () => {
      return await retry(
        async () => {
          const url = new URL(`${PAPPERS_API_BASE}${endpoint}`)
          url.searchParams.append('api_token', PAPPERS_API_KEY)
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value)
          })

          const response = await fetch(url.toString(), {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
          })

          const duration = Date.now() - start

          if (!response.ok) {
            if (response.status === 404) {
              throw new NotFoundError('Entreprise')
            }
            if (response.status === 429) {
              throw new APIError('Pappers', 'Rate limit exceeded', {
                code: ErrorCode.API_RATE_LIMIT,
                statusCode: 429,
                retryable: true,
              })
            }
            if (response.status === 401 || response.status === 403) {
              throw new APIError('Pappers', 'Invalid API key', {
                code: ErrorCode.API_UNAUTHORIZED,
                statusCode: response.status,
                retryable: false,
              })
            }
            throw new APIError('Pappers', `API error: ${response.status}`, {
              statusCode: response.status,
              retryable: response.status >= 500,
              context: { endpoint },
            })
          }

          const data = await response.json()
          logger.api.request(endpoint, 'GET', { statusCode: response.status, duration })

          // Cache successful response
          if (options.cacheKey) {
            apiCache.set(options.cacheKey, data, options.cacheTtl || 24 * 60 * 60 * 1000)
          }

          return data as T
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          onRetry: (error, attempt) => {
            logger.warn(`Retry attempt ${attempt}`, { error, endpoint })
          },
        }
      )
    })
  } catch (error) {
    logger.error('Pappers request failed', error as Error, { endpoint })
    throw error
  }
}

// ============================================
// RECHERCHE ENTREPRISE PAR SIRET
// ============================================

/**
 * Retrieves complete company information by SIRET
 */
export async function getEntrepriseParSiret(siret: string): Promise<EntrepriseComplete | null> {
  // Validate and clean SIRET
  const siretClean = siret.replace(/\s/g, '')
  if (siretClean.length !== 14 || !/^\d{14}$/.test(siretClean)) {
    throw new ValidationError('SIRET invalide', { field: 'siret', value: siret })
  }

  // Validate SIRET checksum (Luhn algorithm)
  if (!validateSiretChecksum(siretClean)) {
    throw new ValidationError('SIRET invalide (checksum incorrect)', { field: 'siret', value: siret })
  }

  try {
    const data = await pappersRequest<Record<string, unknown>>(
      '/entreprise',
      { siret: siretClean },
      {
        cacheKey: `pappers:siret:${siretClean}`,
        cacheTtl: 24 * 60 * 60 * 1000, // 24h
      }
    )

    return transformerDonneesPappers(data)
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null
    }
    throw error
  }
}

/**
 * Retrieves information by SIREN
 */
export async function getEntrepriseParSiren(siren: string): Promise<EntrepriseComplete | null> {
  // Validate and clean SIREN
  const sirenClean = siren.replace(/\s/g, '')
  if (sirenClean.length !== 9 || !/^\d{9}$/.test(sirenClean)) {
    throw new ValidationError('SIREN invalide', { field: 'siren', value: siren })
  }

  try {
    const data = await pappersRequest<Record<string, unknown>>(
      '/entreprise',
      { siren: sirenClean },
      {
        cacheKey: `pappers:siren:${sirenClean}`,
        cacheTtl: 24 * 60 * 60 * 1000,
      }
    )

    return transformerDonneesPappers(data)
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null
    }
    throw error
  }
}

// ============================================
// RECHERCHE PAR NOM
// ============================================

/**
 * Recherche des entreprises par nom et/ou code postal
 */
export async function rechercherEntreprises(
  query: string,
  options?: {
    codePostal?: string
    codeNAF?: string
    formeJuridique?: string
    limit?: number
  }
): Promise<RechercheResultat[]> {
  if (!query || query.length < 2) {
    throw new ValidationError('Query too short (minimum 2 characters)', { field: 'query' })
  }

  const params: Record<string, string> = {
    q: query,
    par_page: String(options?.limit || 10),
  }

  if (options?.codePostal) params.code_postal = options.codePostal
  if (options?.codeNAF) params.code_naf = options.codeNAF
  if (options?.formeJuridique) params.forme_juridique = options.formeJuridique

  try {
    interface SearchResponse {
      resultats?: Array<{
        siren: string
        siege?: { siret?: string; code_postal?: string; ville?: string }
        nom_entreprise: string
        code_naf?: string
        libelle_code_naf?: string
        entreprise_cessee?: boolean
      }>
    }

    const data = await pappersRequest<SearchResponse>('/search', params)

    return (data.resultats || []).map(r => ({
      siren: r.siren,
      siret: r.siege?.siret || r.siren + '00000',
      nom: r.nom_entreprise,
      codePostal: r.siege?.code_postal || '',
      ville: r.siege?.ville || '',
      codeNAF: r.code_naf || '',
      libelleNAF: r.libelle_code_naf || '',
      actif: !r.entreprise_cessee,
    }))
  } catch (error) {
    apiLogger.error('Search failed', error as Error, { query })
    return []
  }
}

// ============================================
// VERIFICATION SANTE ENTREPRISE
// ============================================

/**
 * Quickly checks if a company is "healthy"
 * (active, no insolvency proceedings, exists > 1 year)
 */
export async function verifierSanteEntreprise(siret: string): Promise<{
  saine: boolean
  raisons: string[]
  score: number // 0-100
}> {
  const entreprise = await getEntrepriseParSiret(siret)

  if (!entreprise) {
    return {
      saine: false,
      raisons: ['Company not found'],
      score: 0,
    }
  }

  const raisons: string[] = []
  let score = 100

  // Verify si active
  if (!entreprise.actif || entreprise.radiee) {
    raisons.push('Company inactive or deregistered')
    score -= 100
  }

  // Check insolvency proceedings
  if (entreprise.procedureCollective) {
    raisons.push(`Proceedings in progress: ${entreprise.procedureEnCours}`)
    score -= 50
  }

  // Check age (less than 1 year = risk)
  const dateCreation = new Date(entreprise.dateCreation)
  const anciennete = (Date.now() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365)
  if (anciennete < 1) {
    raisons.push("Company created less than a year ago")
    score -= 20
  } else if (anciennete >= 5) {
    score += 10 // Bonus for established companies
  }

  // Verify le CA (si disponible)
  if (entreprise.dernierCA !== null && entreprise.dernierCA < 10000) {
    raisons.push("Very low revenue")
    score -= 10
  } else if (entreprise.dernierCA !== null && entreprise.dernierCA >= 100000) {
    score += 5 // Bonus for healthy revenue
  }

  // Check negative result
  if (entreprise.dernierResultat !== null && entreprise.dernierResultat < 0) {
    raisons.push('Loss-making result')
    score -= 15
  }

  // Director identified
  if (entreprise.dirigeants.length > 0) {
    score += 5
  } else {
    raisons.push('No director identified')
    score -= 5
  }

  return {
    saine: score >= 70,
    raisons: raisons.length > 0 ? raisons : ['No issues detected'],
    score: Math.max(0, Math.min(100, score)),
  }
}

// ============================================
// TRANSFORMATION DONNEES
// ============================================

function transformerDonneesPappers(data: Record<string, unknown>): EntrepriseComplete {
  const siege = (data.siege || {}) as Record<string, unknown>
  const representants = (data.representants || []) as Array<Record<string, unknown>>
  const financesData = (data.finances || []) as Array<Record<string, unknown>>

  const dirigeants: Dirigeant[] = representants.map(r => ({
    nom: String(r.nom || ''),
    prenom: String(r.prenom || ''),
    fonction: String(r.qualite || ''),
    dateNaissance: r.date_de_naissance as string | undefined,
    nationalite: r.nationalite as string | undefined,
  }))

  const finances: InfosFinancieres[] = financesData.map(f => ({
    annee: Number(f.annee) || 0,
    chiffreAffaires: f.chiffre_affaires as number | null,
    resultat: f.resultat as number | null,
    effectif: f.effectif as string | null,
  }))

  const dernierBilan = finances[0] || {}
  const dateCreation = new Date(String(data.date_creation) || Date.now())
  const ancienneteAnnees = Math.floor(
    (Date.now() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365)
  )

  // Calcul des badges
  const badges = {
    entrepriseSaine: !data.entreprise_cessee && !data.procedure_collective_en_cours,
    plusDe5Ans: ancienneteAnnees >= 5,
    caSuperieur100k: (dernierBilan.chiffreAffaires || 0) >= 100000,
    dirigeantIdentifie: dirigeants.length > 0,
  }

  return {
    siren: String(data.siren || ''),
    siret: String(siege.siret || data.siren) + '00000'.substring(0, 14 - String(siege.siret || data.siren).length),

    nom: String(data.nom_entreprise || ''),
    nomCommercial: data.nom_commercial as string | null,
    formeJuridique: String(data.forme_juridique || ''),
    formeJuridiqueCode: String(data.categorie_juridique || ''),
    dateCreation: String(data.date_creation || ''),
    dateCreationFormate: data.date_creation
      ? new Date(String(data.date_creation)).toLocaleDateString('en-US')
      : '',

    codeNAF: String(data.code_naf || ''),
    libelleNAF: String(data.libelle_code_naf || ''),
    domaine: String(data.domaine_activite || ''),

    siege: {
      adresse: String(siege.adresse_ligne_1 || ''),
      codePostal: String(siege.code_postal || ''),
      ville: String(siege.ville || ''),
      pays: String(siege.pays || 'France'),
      latitude: siege.latitude as number | undefined,
      longitude: siege.longitude as number | undefined,
    },

    dirigeants,
    finances,

    capital: data.capital as number | null,
    capitalFormate: data.capital
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(Number(data.capital))
      : null,
    dernierCA: dernierBilan.chiffreAffaires ?? null,
    dernierResultat: dernierBilan.resultat ?? null,

    effectif: data.effectif as string | null,
    trancheEffectif: data.tranche_effectif as string | null,

    actif: !data.entreprise_cessee,
    radiee: !!data.entreprise_cessee,
    dateRadiation: data.date_cessation as string | undefined,

    procedureCollective: !!data.procedure_collective_en_cours,
    procedureEnCours: data.procedure_collective_en_cours as string | null,

    badges,
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate SIRET using Luhn algorithm
 */
function validateSiretChecksum(siret: string): boolean {
  if (siret.length !== 14) return false

  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }

  return sum % 10 === 0
}

/**
 * Validate SIREN checksum
 */
export function validateSiren(siren: string): boolean {
  const sirenClean = siren.replace(/\s/g, '')
  if (sirenClean.length !== 9 || !/^\d{9}$/.test(sirenClean)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(sirenClean[i], 10)
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }

  return sum % 10 === 0
}

/**
 * Validate SIRET format and checksum
 */
export function validateSiret(siret: string): boolean {
  const siretClean = siret.replace(/\s/g, '')
  if (siretClean.length !== 14 || !/^\d{14}$/.test(siretClean)) {
    return false
  }
  return validateSiretChecksum(siretClean)
}

// ============================================
// FORMATAGE
// ============================================

/**
 * Formate un montant en euros
 */
export function formaterMontant(montant: number | null): string {
  if (montant === null) return 'N/C'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(montant)
}

/**
 * Formats the company age
 */
export function formaterAnciennete(dateCreation: string): string {
  const date = new Date(dateCreation)
  const annees = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365))

  if (annees < 1) return "Moins d'un an"
  if (annees === 1) return '1 an'
  return `${annees} ans`
}

/**
 * Formate un SIRET avec espaces
 */
export function formaterSiret(siret: string): string {
  const clean = siret.replace(/\s/g, '')
  if (clean.length !== 14) return siret
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9, 14)}`
}

/**
 * Formate un SIREN avec espaces
 */
export function formaterSiren(siren: string): string {
  const clean = siren.replace(/\s/g, '')
  if (clean.length !== 9) return siren
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`
}

/**
 * Gets the appropriate trust badge
 */
export function getBadgeConfiance(entreprise: EntrepriseComplete): {
  niveau: 'gold' | 'silver' | 'bronze' | 'none'
  label: string
  description: string
} {
  const { badges } = entreprise

  if (badges.entrepriseSaine && badges.plusDe5Ans && badges.caSuperieur100k) {
    return {
      niveau: 'gold',
      label: 'Established company',
      description: "Over 5 years of activity, revenue > $100k, no issues",
    }
  }

  if (badges.entrepriseSaine && badges.plusDe5Ans) {
    return {
      niveau: 'silver',
      label: 'Confirmed company',
      description: "Over 5 years of activity, healthy status",
    }
  }

  if (badges.entrepriseSaine) {
    return {
      niveau: 'bronze',
      label: 'Registered company',
      description: 'Legal status compliant',
    }
  }

  return {
    niveau: 'none',
    label: 'Not registered',
    description: 'Informations insuffisantes',
  }
}

/**
 * Codes NAF courants pour the attorneys
 */
export const CODES_NAF_ARTISANS: Record<string, string> = {
  '4321A': 'Travaux d\'installation électrique',
  '4322A': 'Travaux d\'installation d\'eau et de gaz',
  '4322B': 'Travaux d\'installation d\'équipements thermiques',
  '4329A': 'Travaux d\'isolation',
  '4331Z': 'Travaux de plâtrerie',
  '4332A': 'Travaux de menuiserie bois et PVC',
  '4332B': 'Travaux de menuiserie métallique',
  '4333Z': 'Travaux de revêtement des sols et des murs',
  '4334Z': 'Travaux de peinture et vitrerie',
  '4339Z': 'Autres travaux de finition',
  '4391A': 'Travaux de charpente',
  '4391B': 'Travaux de couverture',
  '4399C': 'Travaux de maçonnerie générale',
  '4520A': 'Entretien et réparation de véhicules automobiles',
  '9524Z': 'Réparation de meubles et d\'équipements du foyer',
  '9529Z': 'Réparation d\'autres biens personnels et domestiques',
}
