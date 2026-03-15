/**
 * Client API SIRENE INSEE
 * Gere l'authentification et les requetes
 */

import { SIRENE_CONFIG, TRANCHES_EFFECTIFS } from './config'
import { logger } from '@/lib/logger'

interface SireneToken {
  access_token: string
  expires_at: number
}

interface SireneEtablissement {
  siret: string
  siren: string
  uniteLegale: {
    denominationUniteLegale?: string
    denominationUsuelle1UniteLegale?: string
    nomUniteLegale?: string
    prenomUsuelUniteLegale?: string
    categorieJuridiqueUniteLegale?: string
    activitePrincipaleUniteLegale?: string
    trancheEffectifsUniteLegale?: string
    dateCreationUniteLegale?: string
    etatAdministratifUniteLegale?: string
  }
  adresseEtablissement: {
    numeroVoieEtablissement?: string
    typeVoieEtablissement?: string
    libelleVoieEtablissement?: string
    codePostalEtablissement?: string
    libelleCommuneEtablissement?: string
    codeCommuneEtablissement?: string
  }
  periodesEtablissement?: Array<{
    activitePrincipaleEtablissement?: string
    etatAdministratifEtablissement?: string
    enseigne1Etablissement?: string
    enseigne2Etablissement?: string
    enseigne3Etablissement?: string
    denominationUsuelleEtablissement?: string
  }>
}

interface SireneResponse {
  header: {
    total: number
    debut: number
    nombre: number
  }
  etablissements: SireneEtablissement[]
}

let cachedToken: SireneToken | null = null

/**
 * Obtenir un token OAuth2 pour l'API SIRENE
 * Nouvelle API INSEE utilise OpenID Connect
 */
export async function getToken(): Promise<string> {
  // Verifier si le token en cache est encore valide
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token
  }

  const consumerKey = process.env.INSEE_CONSUMER_KEY
  const consumerSecret = process.env.INSEE_CONSUMER_SECRET

  if (!consumerKey || !consumerSecret) {
    throw new Error('INSEE_CONSUMER_KEY et INSEE_CONSUMER_SECRET doivent etre definis dans .env')
  }

  // Nouvelle methode d'authentification INSEE (OpenID Connect)
  const response = await fetch(SIRENE_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: consumerKey,
      client_secret: consumerSecret,
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erreur authentification INSEE: ${response.status} - ${error}`)
  }

  const data = await response.json()

  // Cache le token (utilise expires_in si disponible, sinon 1h par defaut)
  const expiresIn = data.expires_in ? (data.expires_in - 60) * 1000 : 3500 * 1000
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + expiresIn,
  }

  return cachedToken.access_token
}

/**
 * Rechercher des etablissements par code NAF et departement
 */
export async function searchEtablissements(
  nafCodes: string[],
  departement?: string,
  page: number = 0
): Promise<{ etablissements: SireneEtablissement[]; total: number; hasMore: boolean }> {
  const token = await getToken()

  // Construire la requete
  const queries: string[] = [
    'etatAdministratifEtablissement:A', // Actif seulement
    'statutDiffusionEtablissement:O', // Diffusable
  ]

  // Filter par codes NAF
  if (nafCodes.length === 1) {
    queries.push(`activitePrincipaleEtablissement:${nafCodes[0]}`)
  } else {
    queries.push(`(${nafCodes.map(c => `activitePrincipaleEtablissement:${c}`).join(' OR ')})`)
  }

  // Filter par departement si specifie
  if (departement) {
    queries.push(`codePostalEtablissement:${departement}*`)
  }

  const queryString = queries.join(' AND ')
  const debut = page * SIRENE_CONFIG.pageSize

  const url = new URL(`${SIRENE_CONFIG.baseUrl}/siret`)
  url.searchParams.set('q', queryString)
  url.searchParams.set('nombre', SIRENE_CONFIG.pageSize.toString())
  url.searchParams.set('debut', debut.toString())

  let retries = 0
  while (retries < SIRENE_CONFIG.maxRetries) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })

      if (response.status === 429) {
        // Rate limit - attendre et reessayer
        logger.info('Rate limit atteint, attente...')
        await new Promise(resolve => setTimeout(resolve, 60000))
        retries++
        continue
      }

      if (response.status === 404) {
        // Pas de resultats
        return { etablissements: [], total: 0, hasMore: false }
      }

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Erreur SIRENE: ${response.status} - ${error}`)
      }

      const data: SireneResponse = await response.json()

      return {
        etablissements: data.etablissements || [],
        total: data.header?.total || 0,
        hasMore: debut + SIRENE_CONFIG.pageSize < (data.header?.total || 0),
      }

    } catch (error) {
      retries++
      if (retries >= SIRENE_CONFIG.maxRetries) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, SIRENE_CONFIG.retryDelay * retries))
    }
  }

  return { etablissements: [], total: 0, hasMore: false }
}

/**
 * Transformer un etablissement SIRENE en Provider
 */
export function transformToProvider(etab: SireneEtablissement): {
  siret: string
  siren: string
  name: string
  slug: string
  address_street: string | null
  address_city: string | null
  address_postal_code: string | null
  address_department: string | null
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
  const ul = etab.uniteLegale
  const addr = etab.adresseEtablissement
  const periode = etab.periodesEtablissement?.[0]

  // Construire le nom
  const name = ul.denominationUniteLegale
    || ul.denominationUsuelle1UniteLegale
    || periode?.denominationUsuelleEtablissement
    || periode?.enseigne1Etablissement
    || `${ul.prenomUsuelUniteLegale || ''} ${ul.nomUniteLegale || ''}`.trim()
    || 'Entreprise'

  // Construire l'adresse
  const streetParts = [
    addr.numeroVoieEtablissement,
    addr.typeVoieEtablissement,
    addr.libelleVoieEtablissement,
  ].filter(Boolean)

  // Obtenir le nombre d'employes
  const tranche = ul.trancheEffectifsUniteLegale
  const effectif = tranche && TRANCHES_EFFECTIFS[tranche]
    ? Math.round((TRANCHES_EFFECTIFS[tranche].min + TRANCHES_EFFECTIFS[tranche].max) / 2)
    : null

  // Creer le slug
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)

  return {
    siret: etab.siret,
    siren: etab.siren,
    name: name.substring(0, 255),
    slug: `${slug}-${etab.siret.substring(0, 9)}`,
    address_street: streetParts.length > 0 ? streetParts.join(' ') : null,
    address_city: addr.libelleCommuneEtablissement || null,
    address_postal_code: addr.codePostalEtablissement || null,
    address_department: addr.codePostalEtablissement?.substring(0, 2) || null,
    legal_form: ul.categorieJuridiqueUniteLegale || null,
    creation_date: ul.dateCreationUniteLegale || null,
    employee_count: effectif,
    naf_code: periode?.activitePrincipaleEtablissement || ul.activitePrincipaleUniteLegale || null,
    is_verified: false,
    is_active: true,
    is_premium: false,
    source: 'sirene',
    source_id: etab.siret,
  }
}
