/**
 * Verification Service
 * Combines multiple APIs for comprehensive business verification
 */

import { getEntrepriseParSiret, verifierSanteEntreprise, getBadgeConfiance, validateSiret, validateSiren } from '../api/pappers'
import { verifierSiret as verifierSiretSirene } from '../api/sirene'
import { geocoder } from '../api/adresse'
import { apiLogger } from '@/lib/logger'
import type { EntrepriseComplete } from '../api/pappers'

export interface VerificationResult {
  // Basic validation
  siretValid: boolean
  siretExists: boolean

  // Enterprise data
  entreprise: EntrepriseComplete | null

  // Health check
  sante: {
    saine: boolean
    score: number
    raisons: string[]
  }

  // Trust badge
  badge: {
    niveau: 'gold' | 'silver' | 'bronze' | 'none'
    label: string
    description: string
  }

  // Geolocation (if address available)
  geolocation?: {
    coordinates: [number, number]
    label: string
  }

  // Verification metadata
  verifiedAt: string
  sources: string[]
}

export interface QuickVerificationResult {
  valid: boolean
  active: boolean
  message: string
  companyName?: string
}

/**
 * Complete verification of a SIRET number
 * Combines Pappers, SIRENE, and geocoding data
 */
export async function verifyEntreprise(siret: string): Promise<VerificationResult> {
  const logger = apiLogger.child({ service: 'verification' })
  const start = Date.now()
  const sources: string[] = []

  logger.info('Starting enterprise verification', { siret })

  // Step 1: Validate SIRET format
  const siretValid = validateSiret(siret)
  if (!siretValid) {
    return {
      siretValid: false,
      siretExists: false,
      entreprise: null,
      sante: { saine: false, score: 0, raisons: ['SIRET invalide'] },
      badge: { niveau: 'none', label: 'Not registered', description: 'SIRET invalide' },
      verifiedAt: new Date().toISOString(),
      sources: [],
    }
  }

  // Step 2: Fetch data from Pappers
  let entreprise: EntrepriseComplete | null = null
  try {
    entreprise = await getEntrepriseParSiret(siret)
    if (entreprise) {
      sources.push('pappers')
    }
  } catch (error) {
    logger.warn('Pappers lookup failed', { siret, error })
  }

  // Step 3: Verify with SIRENE (fallback/additional data)
  let sireneData = null
  try {
    sireneData = await verifierSiretSirene(siret)
    if (sireneData.valide) {
      sources.push('sirene')
    }
  } catch (error) {
    logger.warn('SIRENE lookup failed', { siret, error })
  }

  // If no data found anywhere
  if (!entreprise && !sireneData?.valide) {
    return {
      siretValid: true,
      siretExists: false,
      entreprise: null,
      sante: { saine: false, score: 0, raisons: ['Company not found'] },
      badge: { niveau: 'none', label: 'Not registered', description: 'Entreprise introuvable' },
      verifiedAt: new Date().toISOString(),
      sources,
    }
  }

  // Step 4: Get health score
  const sante = entreprise
    ? await verifierSanteEntreprise(siret)
    : {
        saine: sireneData?.actif || false,
        score: sireneData?.actif ? 70 : 0,
        raisons: sireneData?.actif ? ['Contrôlé via SIRENE'] : ['Établissement fermé'],
      }

  // Step 5: Calculate trust badge
  const badge = entreprise
    ? getBadgeConfiance(entreprise)
    : { niveau: 'none' as const, label: 'Not registered', description: 'Données insuffisantes' }

  // Step 6: Geocode address if available
  let geolocation: VerificationResult['geolocation'] = undefined
  if (entreprise?.siege.adresse) {
    try {
      const fullAddress = `${entreprise.siege.adresse}, ${entreprise.siege.codePostal} ${entreprise.siege.ville}`
      const geo = await geocoder(fullAddress)
      if (geo) {
        geolocation = {
          coordinates: geo.coordinates,
          label: geo.label,
        }
        sources.push('adresse.data.gouv')
      }
    } catch (error) {
      logger.warn('Geocoding failed', { error })
    }
  }

  const duration = Date.now() - start
  logger.info('Verification complete', { siret, duration, sources })

  return {
    siretValid: true,
    siretExists: true,
    entreprise,
    sante,
    badge,
    geolocation,
    verifiedAt: new Date().toISOString(),
    sources,
  }
}

/**
 * Quick verification for form validation
 */
export async function quickVerify(siret: string): Promise<QuickVerificationResult> {
  // Format check
  if (!validateSiret(siret)) {
    return {
      valid: false,
      active: false,
      message: 'Format SIRET invalide (14 chiffres requis)',
    }
  }

  // Try SIRENE first (official source)
  try {
    const result = await verifierSiretSirene(siret)
    if (result.valide) {
      const companyName = result.etablissement?.adresseEtablissement.libelleCommuneEtablissement

      return {
        valid: true,
        active: result.actif,
        message: result.message,
        companyName,
      }
    }
  } catch {
    // Fall through to Pappers
  }

  // Try Pappers as fallback
  try {
    const entreprise = await getEntrepriseParSiret(siret)
    if (entreprise) {
      return {
        valid: true,
        active: entreprise.actif,
        message: entreprise.actif ? 'Entreprise active' : 'Entreprise inactive',
        companyName: entreprise.nom,
      }
    }
  } catch {
    // Not found
  }

  return {
    valid: false,
    active: false,
    message: 'SIRET non trouvé',
  }
}

/**
 * Validate SIREN and return basic info
 */
export async function verifySiren(siren: string): Promise<{
  valid: boolean
  message: string
  entreprise?: { nom: string; siren: string; siret: string }
}> {
  if (!validateSiren(siren)) {
    return { valid: false, message: 'Format SIREN invalide (9 chiffres requis)' }
  }

  try {
    const { getEntrepriseParSiren } = await import('../api/pappers')
    const entreprise = await getEntrepriseParSiren(siren)

    if (entreprise) {
      return {
        valid: true,
        message: 'SIREN valide',
        entreprise: {
          nom: entreprise.nom,
          siren: entreprise.siren,
          siret: entreprise.siret,
        },
      }
    }
  } catch {
    // Not found
  }

  return { valid: false, message: 'SIREN non trouvé' }
}

/**
 * Batch verify multiple SIRETs
 */
export async function batchVerify(
  sirets: string[],
  options: { concurrency?: number } = {}
): Promise<Map<string, VerificationResult>> {
  const { concurrency = 3 } = options
  const results = new Map<string, VerificationResult>()

  // Process in batches
  for (let i = 0; i < sirets.length; i += concurrency) {
    const batch = sirets.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (siret) => {
        try {
          return { siret, result: await verifyEntreprise(siret) }
        } catch (_error) {
          return {
            siret,
            result: {
              siretValid: false,
              siretExists: false,
              entreprise: null,
              sante: { saine: false, score: 0, raisons: ['Verification error'] },
              badge: { niveau: 'none' as const, label: 'Erreur', description: 'Verification error' },
              verifiedAt: new Date().toISOString(),
              sources: [],
            },
          }
        }
      })
    )

    batchResults.forEach(({ siret, result }) => {
      results.set(siret, result)
    })

    // Small delay between batches to avoid rate limiting
    if (i + concurrency < sirets.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return results
}

/**
 * Calculate overall trust score for an artisan
 */
export function calculateTrustScore(verification: VerificationResult): {
  score: number
  factors: Array<{ name: string; points: number; met: boolean }>
} {
  const factors: Array<{ name: string; points: number; met: boolean }> = []

  // SIRET verified
  factors.push({
    name: 'SIRET contrôlé',
    points: 20,
    met: verification.siretExists,
  })

  // Company active
  factors.push({
    name: 'Entreprise active',
    points: 20,
    met: verification.entreprise?.actif ?? false,
  })

  // No legal proceedings
  factors.push({
    name: 'Aucune procédure collective',
    points: 15,
    met: !verification.entreprise?.procedureCollective,
  })

  // More than 2 years old
  const years = verification.entreprise?.dateCreation
    ? (Date.now() - new Date(verification.entreprise.dateCreation).getTime()) /
      (1000 * 60 * 60 * 24 * 365)
    : 0
  factors.push({
    name: 'Plus de 2 ans d\'ancienneté',
    points: 15,
    met: years >= 2,
  })

  // More than 5 years old
  factors.push({
    name: 'Plus de 5 ans d\'ancienneté',
    points: 10,
    met: years >= 5,
  })

  // Revenue > 50k
  factors.push({
    name: 'CA > 50 000$',
    points: 10,
    met: (verification.entreprise?.dernierCA ?? 0) >= 50000,
  })

  // Identified manager
  factors.push({
    name: 'Dirigeant identifié',
    points: 10,
    met: (verification.entreprise?.dirigeants.length ?? 0) > 0,
  })

  const score = factors.reduce((sum, f) => sum + (f.met ? f.points : 0), 0)

  return { score, factors }
}

/**
 * Get verification summary for display
 */
export function getVerificationSummary(verification: VerificationResult): {
  status: 'verified' | 'warning' | 'error'
  title: string
  description: string
  details: string[]
} {
  if (!verification.siretValid) {
    return {
      status: 'error',
      title: 'SIRET invalide',
      description: 'Le numéro SIRET fourni n\'est pas valide',
      details: ['Vérifiez le format du numéro (14 chiffres)'],
    }
  }

  if (!verification.siretExists) {
    return {
      status: 'error',
      title: 'Entreprise introuvable',
      description: 'Ce SIRET n\'existe pas dans les registres officiels',
      details: ['Vérifiez le numéro SIRET auprès de l\'attorney'],
    }
  }

  if (!verification.entreprise?.actif) {
    return {
      status: 'warning',
      title: 'Entreprise inactive',
      description: 'Cette entreprise n\'est plus en activité',
      details: verification.sante.raisons,
    }
  }

  if (verification.entreprise?.procedureCollective) {
    return {
      status: 'warning',
      title: 'Procédure en cours',
      description: 'Cette entreprise fait l\'objet d\'une procédure collective',
      details: [verification.entreprise.procedureEnCours || 'Procédure en cours'],
    }
  }

  if (verification.sante.score >= 80) {
    return {
      status: 'verified',
      title: 'Registered company',
      description: 'Toutes les vérifications ont été passées avec succès',
      details: [
        `Score de santé: ${verification.sante.score}/100`,
        `Badge: ${verification.badge.label}`,
      ],
    }
  }

  return {
    status: 'verified',
    title: 'Registered company',
    description: 'Entreprise active mais avec quelques points d\'attention',
    details: verification.sante.raisons,
  }
}
