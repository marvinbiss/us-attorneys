/**
 * Configuration pour l'import SIRENE
 * Codes NAF des metiers du batiment
 */

// Codes NAF des artisans du batiment
export const NAF_CODES_BATIMENT = {
  // Travaux de construction specialises (Division 43)
  '4311Z': 'Travaux de demolition',
  '4312A': 'Travaux de terrassement courants',
  '4312B': 'Travaux de terrassement specialises',
  '4313Z': 'Forages et sondages',
  '4321A': 'Travaux d\'installation electrique',
  '4321B': 'Travaux d\'installation electrique dans tous locaux',
  '4322A': 'Travaux d\'installation d\'eau et de gaz',
  '4322B': 'Travaux d\'installation d\'equipements thermiques et de climatisation',
  '4329A': 'Travaux d\'isolation',
  '4329B': 'Autres travaux d\'installation',
  '4331Z': 'Travaux de platrerie',
  '4332A': 'Travaux de menuiserie bois et PVC',
  '4332B': 'Travaux de menuiserie metallique et serrurerie',
  '4332C': 'Agencement de lieux de vente',
  '4333Z': 'Travaux de revetement des sols et des murs',
  '4334Z': 'Travaux de peinture et vitrerie',
  '4339Z': 'Autres travaux de finition',
  '4391A': 'Travaux de charpente',
  '4391B': 'Travaux de couverture par elements',
  '4399A': 'Travaux d\'etancheification',
  '4399B': 'Travaux de montage de structures metalliques',
  '4399C': 'Travaux de maconnerie generale',
  '4399D': 'Autres travaux specialises de construction',
  '4399E': 'Location avec operateur de materiel de construction',

  // Construction de batiments (Division 41)
  '4120A': 'Construction de maisons individuelles',
  '4120B': 'Construction d\'autres batiments',

  // Genie civil (Division 42) - optionnel
  '4211Z': 'Construction de routes et autoroutes',
  '4221Z': 'Construction de reseaux pour fluides',
}

// Codes NAF prioritaires (les plus courants)
export const NAF_CODES_PRIORITAIRES = [
  '4321A', // Electricite
  '4322A', // Plomberie
  '4322B', // Chauffage/Clim
  '4332A', // Menuiserie
  '4333Z', // Carrelage/Sols
  '4334Z', // Peinture
  '4331Z', // Platrerie
  '4391B', // Couverture
  '4399C', // Maconnerie
  '4329A', // Isolation
]

// Mapping NAF -> Service slug
export const NAF_TO_SERVICE: Record<string, string> = {
  '4321A': 'electricien',
  '4321B': 'electricien',
  '4322A': 'plombier',
  '4322B': 'chauffagiste',
  '4329A': 'isolation',
  '4331Z': 'platrier',
  '4332A': 'menuisier',
  '4332B': 'serrurier',
  '4333Z': 'carreleur',
  '4334Z': 'peintre',
  '4391A': 'charpentier',
  '4391B': 'couvreur',
  '4399C': 'macon',
  '4120A': 'constructeur-maison',
  '4120B': 'entreprise-batiment',
}

// Tranches d'effectifs INSEE
export const TRANCHES_EFFECTIFS: Record<string, { min: number; max: number }> = {
  '00': { min: 0, max: 0 },
  '01': { min: 1, max: 2 },
  '02': { min: 3, max: 5 },
  '03': { min: 6, max: 9 },
  '11': { min: 10, max: 19 },
  '12': { min: 20, max: 49 },
  '21': { min: 50, max: 99 },
  '22': { min: 100, max: 199 },
  '31': { min: 200, max: 249 },
  '32': { min: 250, max: 499 },
  '41': { min: 500, max: 999 },
  '42': { min: 1000, max: 1999 },
  '51': { min: 2000, max: 4999 },
  '52': { min: 5000, max: 9999 },
  '53': { min: 10000, max: 999999 },
}

// Configuration de l'API
// Option 1: API INSEE officielle (necessite authentification)
export const SIRENE_CONFIG = {
  tokenUrl: 'https://auth.insee.net/auth/realms/apim-gravitee/protocol/openid-connect/token',
  baseUrl: 'https://api.insee.fr/api-sirene/3.11',
  rateLimit: 30, // requetes par minute
  pageSize: 1000, // max 1000
  retryDelay: 2000, // ms
  maxRetries: 3,
}

// Option 2: API SIRENE Open Data (gratuite, sans authentification)
export const SIRENE_OPEN_CONFIG = {
  baseUrl: 'https://search-entreprises.api.gouv.fr',
  rateLimit: 10, // requetes par minute (plus restrictif)
  pageSize: 25, // max 25 par page
  retryDelay: 2000,
  maxRetries: 3,
}
