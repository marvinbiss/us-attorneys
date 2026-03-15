/**
 * Enriched quartier-level data for ALL quartiers in france.ts.
 *
 * Computed deterministically at module load time from the cities array.
 * Uses hashCode for reproducible pseudo-random variation.
 *
 * ~8 200 entries covering every ville/quartier combination.
 */

import { cities, type City } from './france'
import { QUARTIER_PRIX_REEL } from './quartier-real-data'

// ---------------------------------------------------------------------------
// QuartierProfile interface
// ---------------------------------------------------------------------------

export interface QuartierProfile {
  // Identity
  name: string
  slug: string
  villeSlug: string

  // Geographic
  codePostal: string
  altitude: 'plaine' | 'colline' | 'littoral' | 'montagne'

  // Building
  epoque: 'medieval' | 'haussmannien' | '1945-1970' | '1970-2000' | 'post-2000'
  typeLogement: 'appartement' | 'maison' | 'mixte' | 'hlm'
  typeQuartier: 'historique' | 'résidentiel' | 'commercial' | 'populaire' | 'pavillonnaire' | 'mixte'
  densite: 'haute' | 'moyenne' | 'faible'

  // Real estate
  prixM2: number
  loyerM2: number
  tauxProprietaires: number

  // Energy
  dpeMedian: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  tauxPassoires: number

  // Natural risks
  risques: ('inondation' | 'sismique' | 'argile' | 'radon' | 'littoral')[]

  // Transport
  transport: ('metro' | 'tram' | 'rer' | 'bus' | 'gare' | 'aucun')[]

  // Demographics
  populationEstimee: number

  // Unique content
  description: string
  atout: string
}

// ---------------------------------------------------------------------------
// Deterministic hash function (same as location-content.ts)
// ---------------------------------------------------------------------------

function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// ---------------------------------------------------------------------------
// Slug helper (inline to avoid circular dependency with utils.ts)
// ---------------------------------------------------------------------------

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Parse population string e.g. '156 000' => 156000
// ---------------------------------------------------------------------------

function parsePop(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

// ---------------------------------------------------------------------------
// Postal code logic
// ---------------------------------------------------------------------------

function computeCodePostal(
  ville: City,
  quartierName: string,
  quartierIndex: number,
  quartierCount: number,
): string {
  const { slug, codePostal, departementCode } = ville

  // Paris arrondissements
  if (slug === 'paris') {
    const match = quartierName.match(/^(\d+)/)
    if (match) {
      const arrNum = parseInt(match[1], 10)
      return `750${arrNum.toString().padStart(2, '0')}`
    }
    return '75001'
  }

  // Lyon arrondissements
  if (slug === 'lyon') {
    const lyonMap: Record<string, string> = {
      "presqu'ile": '69001',
      'presquile': '69001',
      'vieux lyon': '69005',
      'part-dieu': '69003',
      'confluence': '69002',
      'croix-rousse': '69004',
      'gerland': '69007',
      'villeurbanne': '69100',
    }
    const lower = quartierName.toLowerCase()
    for (const [key, val] of Object.entries(lyonMap)) {
      if (lower.includes(key)) return val
    }
    // Fallback by index
    const lyonCodes = ['69001', '69002', '69003', '69004', '69005', '69006', '69007', '69008', '69009']
    return lyonCodes[quartierIndex % lyonCodes.length]
  }

  // Marseille arrondissements
  if (slug === 'marseille') {
    const marseilleMap: Record<string, string> = {
      'vieux-port': '13001',
      'le panier': '13002',
      'la joliette': '13002',
      'castellane': '13004',
      'la canebiere': '13001',
      'canebière': '13001',
      'prado': '13008',
      'bonneveine': '13008',
      'les calanques': '13009',
    }
    const lower = quartierName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    for (const [key, val] of Object.entries(marseilleMap)) {
      if (lower.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) return val
    }
    const marsIdx = Math.min(quartierIndex, 15)
    return `130${(marsIdx + 1).toString().padStart(2, '0')}`
  }

  // Other cities: if 5+ quartiers, create variants
  if (quartierCount >= 5) {
    const baseNum = parseInt(codePostal, 10)
    if (!isNaN(baseNum)) {
      // Increment by 100 for each quartier beyond the first
      const variant = baseNum + quartierIndex * 100
      // Keep within same department prefix
      const deptPrefix = departementCode.length <= 2
        ? codePostal.substring(0, 2)
        : codePostal.substring(0, 3)
      const variantStr = variant.toString().padStart(5, '0')
      // Make sure department prefix stays the same
      if (variantStr.startsWith(deptPrefix)) {
        return variantStr
      }
    }
  }

  return codePostal
}

// ---------------------------------------------------------------------------
// Region base price
// ---------------------------------------------------------------------------

const REGION_BASE_PRICE: Record<string, number> = {
  'Île-de-France': 4500,
  "Provence-Alpes-Côte d'Azur": 3500,
  'Auvergne-Rhône-Alpes': 3000,
  'Occitanie': 2500,
  'Nouvelle-Aquitaine': 2300,
  'Bretagne': 2200,
  'Pays de la Loire': 2200,
  'Normandie': 2000,
  'Hauts-de-France': 2000,
  'Grand Est': 2100,
  'Bourgogne-Franche-Comté': 2000,
  'Centre-Val de Loire': 2000,
  'Corse': 2800,
  'Guadeloupe': 2200,
  'Martinique': 2300,
  'Guyane': 1800,
  'La Réunion': 2400,
  'Mayotte': 1600,
  'Nouvelle-Calédonie': 2500,
  'Polynésie française': 2300,
}

function getRegionBasePrice(region: string): number {
  return REGION_BASE_PRICE[region] || 2200
}

// ---------------------------------------------------------------------------
// Type de quartier determination
// ---------------------------------------------------------------------------

const TYPE_QUARTIER_KEYWORDS: [RegExp, QuartierProfile['typeQuartier']][] = [
  [/centre|vieux|vieil|vieille|historique|intra-muros|ecusson|écusson|cathédrale|cathedrale/i, 'historique'],
  [/zone|commercial|marché|marche|halles|gare|forum/i, 'commercial'],
  [/cité|cite|hlm|grand.?ensemble|quartier(?:\s|$)/i, 'populaire'],
  [/parc |résiden|residen|colline|coteau|bois|jardin|pavillon/i, 'pavillonnaire'],
]

function computeTypeQuartier(
  quartierName: string,
  quartierIndex: number,
  quartierCount: number,
  _population: number,
): QuartierProfile['typeQuartier'] {
  const normalized = quartierName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [regex, type] of TYPE_QUARTIER_KEYWORDS) {
    if (regex.test(normalized) || regex.test(quartierName)) return type
  }
  // Position-based defaults
  if (quartierCount <= 2) return 'mixte'
  const relPos = quartierIndex / (quartierCount - 1)
  if (relPos < 0.25) return 'mixte'
  if (relPos < 0.6) return 'résidentiel'
  return 'résidentiel'
}

// ---------------------------------------------------------------------------
// Building era determination
// ---------------------------------------------------------------------------

const ERA_KEYWORDS: [RegExp, QuartierProfile['epoque']][] = [
  [/centre|vieux|vieil|vieille|historique|château|chateau|cathédrale|cathedrale|intra-muros|ecusson|écusson|terra.?vecchia|panier|médiéval/i, 'medieval'],
  [/gare|république|republique|haussmann|boulevar|faubourg|opera|opéra|presqu|halles/i, 'haussmannien'],
  [/zone|zac|technopole|sophia|port-marianne|confluence|euroméditerranée|euromediterranee|eco-quartier|écoquartier|atlantis/i, 'post-2000'],
  [/hlm|grand.?ensemble|cité|cite|minguettes|courneuve|4000|3000|quartiers nord/i, '1945-1970'],
]

function computeEpoque(
  quartierName: string,
  quartierIndex: number,
  quartierCount: number,
  population: number,
): QuartierProfile['epoque'] {
  const normalized = quartierName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [regex, era] of ERA_KEYWORDS) {
    if (regex.test(normalized) || regex.test(quartierName)) return era
  }

  // Position-based: first quartiers tend to be older, last tend to be newer
  const relPos = quartierCount > 1 ? quartierIndex / (quartierCount - 1) : 0.5

  if (relPos <= 0.15) {
    return population > 200000 ? 'haussmannien' : 'medieval'
  }
  if (relPos <= 0.35) return 'haussmannien'
  if (relPos <= 0.6) return '1945-1970'
  if (relPos <= 0.85) return '1970-2000'
  return 'post-2000'
}

// ---------------------------------------------------------------------------
// Altitude determination
// ---------------------------------------------------------------------------

const MOUNTAIN_DEPTS = new Set(['04', '05', '06', '09', '15', '31', '38', '39', '43', '48', '63', '64', '65', '66', '73', '74', '2A', '2B', '974'])
const COASTAL_DEPTS = new Set(['06', '13', '14', '17', '22', '29', '30', '33', '34', '40', '44', '50', '56', '59', '62', '64', '66', '76', '80', '83', '85', '971', '972', '974', '976', '988', '2A', '2B'])
const HILL_KEYWORDS = /colline|coteau|bellevue|haut|mont(?:agne|redon|martre|ferrand|reynaud)|plateau|butte|cimiez|croix-rousse/i

// Large cities in mountain departments that are actually in valleys/plains
const VALLEY_CITIES = new Set([
  'toulouse', 'perpignan', 'pau', 'bayonne', 'grenoble', 'clermont-ferrand',
  'nice', 'cannes', 'antibes', 'grasse', 'cagnes-sur-mer',
  'ajaccio', 'bastia', 'foix', 'aurillac',
])

function computeAltitude(
  quartierName: string,
  deptCode: string,
  villeSlug: string,
  population: number,
): QuartierProfile['altitude'] {
  const nameLower = quartierName.toLowerCase()
  if (/plage|port|littoral|maritime|bord.?de.?mer|sablettes|calanques|promenade|corniche|giens|capte|salins/i.test(nameLower)) {
    return 'littoral'
  }
  if (HILL_KEYWORDS.test(nameLower)) return 'colline'
  if (COASTAL_DEPTS.has(deptCode) && /mer|marine|océan|ocean/i.test(nameLower)) return 'littoral'
  if (MOUNTAIN_DEPTS.has(deptCode)) {
    // Large cities in mountain depts are typically in valleys/plains
    if (population > 50000 || VALLEY_CITIES.has(villeSlug)) return 'plaine'
    if (/centre|ville|bourg|vieux/i.test(nameLower)) return 'colline'
    return 'montagne'
  }
  if (COASTAL_DEPTS.has(deptCode)) return 'plaine'
  return 'plaine'
}

// ---------------------------------------------------------------------------
// Type de logement
// ---------------------------------------------------------------------------

function computeTypeLogement(
  typeQuartier: QuartierProfile['typeQuartier'],
  epoque: QuartierProfile['epoque'],
  population: number,
  densite: QuartierProfile['densite'],
): QuartierProfile['typeLogement'] {
  if (typeQuartier === 'populaire' && epoque === '1945-1970') return 'hlm'
  if (typeQuartier === 'pavillonnaire') return 'maison'
  if (densite === 'haute' || population > 200000) return 'appartement'
  if (typeQuartier === 'historique' && population > 100000) return 'appartement'
  return 'mixte'
}

// ---------------------------------------------------------------------------
// Densité
// ---------------------------------------------------------------------------

function computeDensite(
  typeQuartier: QuartierProfile['typeQuartier'],
  population: number,
): QuartierProfile['densite'] {
  if (population > 200000) {
    if (typeQuartier === 'pavillonnaire') return 'moyenne'
    return 'haute'
  }
  if (population > 50000) {
    if (typeQuartier === 'historique' || typeQuartier === 'commercial') return 'haute'
    if (typeQuartier === 'pavillonnaire') return 'faible'
    return 'moyenne'
  }
  if (typeQuartier === 'historique') return 'moyenne'
  if (typeQuartier === 'pavillonnaire') return 'faible'
  return 'faible'
}

// ---------------------------------------------------------------------------
// Prix au m²
// ---------------------------------------------------------------------------

const TYPE_QUARTIER_PRICE_MULT: Record<QuartierProfile['typeQuartier'], number> = {
  'historique': 1.30,
  'commercial': 1.10,
  'populaire': 0.80,
  'pavillonnaire': 1.15,
  'résidentiel': 1.05,
  'mixte': 1.00,
}

function computePrixM2(
  ville: City,
  quartierName: string,
  typeQuartier: QuartierProfile['typeQuartier'],
  population: number,
): number {
  // Check for real data first
  const realKey = `${ville.slug}::${quartierName}`
  const realData = QUARTIER_PRIX_REEL[realKey]
  if (realData) return realData.prixM2

  let base = getRegionBasePrice(ville.region)

  // Adjust by population (bigger city = higher price)
  if (population > 1000000) base *= 1.8
  else if (population > 500000) base *= 1.5
  else if (population > 200000) base *= 1.3
  else if (population > 100000) base *= 1.15
  else if (population > 50000) base *= 1.05

  // Quartier type multiplier
  base *= TYPE_QUARTIER_PRICE_MULT[typeQuartier]

  // Deterministic variation ±15%
  const h = hashCode(`${ville.slug}-${quartierName}`)
  const variation = 0.85 + (h % 31) / 100 // 0.85 to 1.15
  base *= variation

  return Math.round(base)
}

// ---------------------------------------------------------------------------
// Loyer au m²
// ---------------------------------------------------------------------------

function computeLoyerM2(prixM2: number, region: string): number {
  // Rental yield varies by region: IDF ~3.5%, PACA ~4%, province ~5-6%
  let yieldPct: number
  if (region === 'Île-de-France') yieldPct = 3.5
  else if (region === "Provence-Alpes-Côte d'Azur") yieldPct = 4.0
  else if (region === 'Auvergne-Rhône-Alpes') yieldPct = 4.2
  else yieldPct = 5.0

  // Monthly rent = (prix * yield%) / 12
  return Math.round((prixM2 * yieldPct) / (12 * 100))
}

// ---------------------------------------------------------------------------
// Taux de propriétaires
// ---------------------------------------------------------------------------

function computeTauxProprietaires(
  typeQuartier: QuartierProfile['typeQuartier'],
  typeLogement: QuartierProfile['typeLogement'],
  population: number,
  h: number,
): number {
  let base: number
  if (typeLogement === 'hlm') base = 15
  else if (typeLogement === 'appartement') base = 35
  else if (typeLogement === 'maison') base = 70
  else base = 50

  // Big cities = lower ownership
  if (population > 500000) base -= 10
  else if (population > 200000) base -= 5

  // Quartier type adjustments
  if (typeQuartier === 'pavillonnaire') base += 15
  if (typeQuartier === 'populaire') base -= 10

  // Variation
  base += (h % 11) - 5

  return Math.max(10, Math.min(85, Math.round(base)))
}

// ---------------------------------------------------------------------------
// DPE and passoires
// ---------------------------------------------------------------------------

type DPELetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

function computeDPE(epoque: QuartierProfile['epoque'], h: number): { dpeMedian: DPELetter; tauxPassoires: number } {
  switch (epoque) {
    case 'medieval':
      return { dpeMedian: 'E', tauxPassoires: 25 + (h % 11) }
    case 'haussmannien':
      return { dpeMedian: 'E', tauxPassoires: 25 + (h % 11) }
    case '1945-1970':
      return { dpeMedian: 'D', tauxPassoires: 15 + (h % 11) }
    case '1970-2000':
      return { dpeMedian: 'C', tauxPassoires: 8 + (h % 8) }
    case 'post-2000':
      return { dpeMedian: 'B', tauxPassoires: 2 + (h % 4) }
  }
}

// ---------------------------------------------------------------------------
// Natural risks
// ---------------------------------------------------------------------------

const SEISMIC_DEPTS = new Set(['06', '64', '65', '66', '31', '09', '73', '74', '38', '971', '972', '976'])
const CLAY_DEPTS = new Set(['75', '77', '78', '91', '92', '93', '94', '95', '33', '47', '31', '81'])
const RADON_DEPTS = new Set(['03', '15', '19', '23', '43', '48', '63', '87', '29', '22', '56'])
const COASTAL_RISK_DEPTS = new Set(['06', '13', '17', '29', '33', '34', '40', '44', '56', '59', '62', '64', '66', '76', '80', '83', '85', '971', '972', '974', '976'])

function computeRisques(
  quartierName: string,
  deptCode: string,
): QuartierProfile['risques'] {
  const risques: QuartierProfile['risques'] = []
  const nameLower = quartierName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Littoral risk
  if (COASTAL_RISK_DEPTS.has(deptCode)) {
    if (/plage|port(?!e)|mer |maritime|littoral|corniche|sablettes|calanques|giens|capte|promenade.?des.?anglais|croisette|bord.?de|ocean/i.test(nameLower)) {
      risques.push('littoral')
    }
  }

  // Seismic
  if (SEISMIC_DEPTS.has(deptCode)) {
    risques.push('sismique')
  }

  // Clay
  if (CLAY_DEPTS.has(deptCode)) {
    risques.push('argile')
  }

  // Flooding
  if (/riviere|fleuve|pont(?:-| |$)|port(?:-| |$)|berge|quai|ile |île |confluence|estuaire|bord.?de|val.?de/i.test(nameLower)) {
    risques.push('inondation')
  }

  // Radon
  if (RADON_DEPTS.has(deptCode)) {
    risques.push('radon')
  }

  return risques
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

const METRO_CITIES = new Set(['paris', 'lyon', 'marseille', 'toulouse', 'lille', 'rennes'])
const TRAM_CITIES = new Set([
  'bordeaux', 'strasbourg', 'nantes', 'montpellier', 'nice', 'grenoble',
  'saint-etienne', 'dijon', 'tours', 'orleans', 'le-mans', 'angers',
  'brest', 'caen', 'rouen', 'le-havre', 'clermont-ferrand', 'mulhouse',
  'nancy', 'besancon',
])
const IDF_DEPTS = new Set(['75', '77', '78', '91', '92', '93', '94', '95'])

function computeTransport(
  ville: City,
  quartierName: string,
  population: number,
): QuartierProfile['transport'] {
  const transport: QuartierProfile['transport'] = []
  const villeSlug = ville.slug
  const deptCode = ville.departementCode
  const nameLower = quartierName.toLowerCase()

  // Metro
  if (METRO_CITIES.has(villeSlug)) {
    transport.push('metro')
  }

  // Tram
  if (TRAM_CITIES.has(villeSlug)) {
    transport.push('tram')
  }

  // RER (Île-de-France only)
  if (IDF_DEPTS.has(deptCode)) {
    transport.push('rer')
  }

  // Gare
  if (/gare|station/i.test(nameLower) || (population > 30000 && nameLower.includes('centre'))) {
    transport.push('gare')
  }

  // Bus: always for cities > 10K
  if (population > 10000) {
    transport.push('bus')
  }

  // Aucun: very small cities < 5K with peripheral quartiers
  if (transport.length === 0) {
    if (population < 5000) {
      transport.push('aucun')
    } else {
      transport.push('bus')
    }
  }

  return transport
}

// ---------------------------------------------------------------------------
// Population estimée per quartier
// ---------------------------------------------------------------------------

function computePopulationEstimee(
  population: number,
  quartierIndex: number,
  quartierCount: number,
  h: number,
): number {
  if (quartierCount === 0) return population
  // Base: even distribution with variation
  const baseShare = population / quartierCount
  // Center quartiers (index 0) tend to be denser
  let multiplier = 1.0
  if (quartierIndex === 0) multiplier = 1.3
  else if (quartierIndex === 1) multiplier = 1.15
  else multiplier = 0.85 + (h % 31) / 100 // 0.85 to 1.15

  return Math.round(baseShare * multiplier)
}

// ---------------------------------------------------------------------------
// Description templates
// ---------------------------------------------------------------------------

const DESC_TEMPLATES = [
  (q: string, v: string, era: string, type: string) =>
    `${q} est un quartier ${type} de ${v}, caractérisé par son architecture ${era}. Un secteur prisé pour son cadre de vie agréable.`,
  (q: string, v: string, era: string, type: string) =>
    `Situé à ${v}, le quartier ${q} se distingue par son ambiance ${type} et ses bâtiments ${era}. Les résidents apprécient la qualité de vie du secteur.`,
  (q: string, v: string, era: string, _type: string) =>
    `Le quartier ${q} à ${v} offre un environnement de vie ${_type} avec un patrimoine bâti ${era}. Un lieu de vie recherché par les familles et les professionnels.`,
  (q: string, v: string, era: string, type: string) =>
    `Au cœur de ${v}, ${q} est un secteur ${type} apprécié pour ses constructions ${era} et sa proximité avec les commodités.`,
  (q: string, v: string, era: string, type: string) =>
    `${q}, quartier ${type} de ${v}, allie bâti ${era} et vie de quartier animée. Un secteur dynamique aux multiples atouts.`,
  (q: string, v: string, _era: string, type: string) =>
    `Niché à ${v}, ${q} est un quartier ${type} offrant un cadre résidentiel de qualité. Son architecture ${_era} témoigne de l'histoire locale.`,
  (q: string, v: string, era: string, type: string) =>
    `Le quartier ${q} de ${v} conjugue ambiance ${type} et patrimoine ${era}. Ses habitants bénéficient d'un environnement agréable et bien desservi.`,
  (q: string, v: string, era: string, type: string) =>
    `À ${v}, le quartier ${q} se caractérise par son tissu urbain ${type} et son héritage architectural ${era}. Un lieu de vie attractif et convivial.`,
  (q: string, v: string, era: string, type: string) =>
    `Quartier ${type} emblématique de ${v}, ${q} séduit par son bâti ${era} et son atmosphère authentique.`,
  (q: string, v: string, era: string, type: string) =>
    `${q} à ${v} est un secteur ${type} où l'architecture ${era} côtoie les espaces de vie modernes. Un quartier en pleine évolution.`,
  (q: string, v: string, era: string, type: string) =>
    `Dans ${v}, ${q} incarne le quartier ${type} par excellence, avec un bâti ${era} bien préservé et une vie de quartier animée.`,
  (q: string, v: string, era: string, type: string) =>
    `Le quartier ${q}, au sein de ${v}, est reconnu pour son atmosphère ${type}. Ses constructions ${era} lui confèrent un charme distinctif.`,
]

const ERA_ADJECTIVES: Record<QuartierProfile['epoque'], string[]> = {
  'medieval': ['d\'époque médiévale', 'du centre ancien', 'à caractère historique', 'du vieux centre'],
  'haussmannien': ['de style haussmannien', 'de facture classique', 'du XIXe siècle', 'de l\'ère Haussmann'],
  '1945-1970': ['d\'après-guerre', 'des années 50-60', 'de la reconstruction', 'des Trente Glorieuses'],
  '1970-2000': ['des années 80-90', 'de facture contemporaine', 'de la fin du XXe siècle', 'de l\'ère moderne'],
  'post-2000': ['de construction récente', 'du XXIe siècle', 'aux normes actuelles', 'de dernière génération'],
}

const TYPE_ADJECTIVES: Record<QuartierProfile['typeQuartier'], string[]> = {
  'historique': ['historique', 'au riche patrimoine', 'chargé d\'histoire', 'de caractère'],
  'résidentiel': ['résidentiel', 'calme et résidentiel', 'paisible', 'résidentiel et verdoyant'],
  'commercial': ['commerçant', 'dynamique', 'animé', 'au cœur commercial'],
  'populaire': ['populaire', 'vivant', 'cosmopolite', 'animé et populaire'],
  'pavillonnaire': ['pavillonnaire', 'verdoyant', 'résidentiel et arboré', 'calme et arboré'],
  'mixte': ['mixte', 'polyvalent', 'diversifié', 'aux multiples facettes'],
}

function generateDescription(
  quartierName: string,
  villeName: string,
  epoque: QuartierProfile['epoque'],
  typeQuartier: QuartierProfile['typeQuartier'],
  h: number,
): string {
  const templateIdx = h % DESC_TEMPLATES.length
  const eraAdj = ERA_ADJECTIVES[epoque][h % ERA_ADJECTIVES[epoque].length]
  const typeAdj = TYPE_ADJECTIVES[typeQuartier][(h >> 3) % TYPE_ADJECTIVES[typeQuartier].length]

  return DESC_TEMPLATES[templateIdx](quartierName, villeName, eraAdj, typeAdj)
}

// ---------------------------------------------------------------------------
// Atout templates
// ---------------------------------------------------------------------------

const ATOUT_HISTORIQUE = [
  'Patrimoine architectural préservé et rues chargées d\'histoire',
  'Charme du centre ancien avec commerces de proximité',
  'Héritage historique exceptionnel et vie culturelle riche',
  'Architecture remarquable et ambiance pittoresque',
  'Patrimoine bâti classé et art de vivre à la française',
  'Richesse architecturale et animation culturelle',
]

const ATOUT_RESIDENTIEL = [
  'Cadre de vie paisible et environnement verdoyant',
  'Quartier calme idéal pour les familles',
  'Tranquillité résidentielle et proximité des services',
  'Qualité de vie reconnue et espaces verts',
  'Environnement résidentiel prisé des propriétaires',
  'Secteur résidentiel recherché au calme',
]

const ATOUT_COMMERCIAL = [
  'Dynamisme commercial et proximité des commodités',
  'Commerces variés et vie de quartier animée',
  'Accessibilité et offre commerciale diversifiée',
  'Cœur commerçant avec tous les services à proximité',
  'Vie économique dynamique et accès facilité',
  'Pôle commercial attractif au cœur de la ville',
]

const ATOUT_POPULAIRE = [
  'Quartier vivant et multiculturel, loyers accessibles',
  'Mixité sociale et dynamisme associatif',
  'Accessibilité des prix et transports bien desservis',
  'Diversité culturelle et solidarité de quartier',
  'Loyers modérés et vie de quartier conviviale',
  'Tissu associatif riche et proximité des transports',
]

const ATOUT_PAVILLONNAIRE = [
  'Cadre de vie verdoyant et calme',
  'Maisons individuelles avec jardins privatifs',
  'Quartier familial arboré et tranquille',
  'Environnement pavillonnaire aéré et agréable',
  'Espaces verts et habitat individuel de qualité',
  'Secteur résidentiel prisé pour sa verdure',
]

const ATOUT_MIXTE = [
  'Quartier polyvalent alliant habitat et activité',
  'Diversité du tissu urbain et bonne desserte',
  'Secteur en plein développement aux multiples atouts',
  'Mixité fonctionnelle et cadre de vie agréable',
  'Quartier équilibré entre résidentiel et commercial',
  'Ambiance urbaine variée et accès facilité',
]

const ATOUT_RECENT_BBC = [
  'Quartier récent aux normes BBC, faibles charges énergétiques',
  'Constructions neuves performantes et espaces aménagés',
  'Habitat récent à haute performance énergétique',
  'Bâtiments modernes et faible empreinte énergétique',
  'Quartier neuf alliant confort et économies d\'énergie',
  'Éco-quartier aux standards énergétiques élevés',
]

const ATOUT_METRO = [
  'Excellente desserte en transports en commun',
  'Métro à proximité et mobilité facilitée',
  'Accès direct au réseau de métro',
]

function generateAtout(
  typeQuartier: QuartierProfile['typeQuartier'],
  epoque: QuartierProfile['epoque'],
  transport: QuartierProfile['transport'],
  h: number,
): string {
  // Special cases
  if (epoque === 'post-2000' && (typeQuartier === 'résidentiel' || typeQuartier === 'mixte')) {
    return ATOUT_RECENT_BBC[h % ATOUT_RECENT_BBC.length]
  }
  if (typeQuartier === 'populaire' && transport.includes('metro')) {
    return ATOUT_METRO[h % ATOUT_METRO.length]
  }

  switch (typeQuartier) {
    case 'historique': return ATOUT_HISTORIQUE[h % ATOUT_HISTORIQUE.length]
    case 'résidentiel': return ATOUT_RESIDENTIEL[h % ATOUT_RESIDENTIEL.length]
    case 'commercial': return ATOUT_COMMERCIAL[h % ATOUT_COMMERCIAL.length]
    case 'populaire': return ATOUT_POPULAIRE[h % ATOUT_POPULAIRE.length]
    case 'pavillonnaire': return ATOUT_PAVILLONNAIRE[h % ATOUT_PAVILLONNAIRE.length]
    case 'mixte': return ATOUT_MIXTE[h % ATOUT_MIXTE.length]
  }
}

// ---------------------------------------------------------------------------
// Main profile computation
// ---------------------------------------------------------------------------

function computeProfile(
  ville: City,
  quartierName: string,
  quartierIndex: number,
): QuartierProfile {
  const population = parsePop(ville.population)
  const quartierCount = ville.quartiers.length
  const slug = toSlug(quartierName)
  const h = hashCode(`${ville.slug}-${quartierName}`)
  const h2 = hashCode(`${quartierName}-${ville.slug}`)

  const typeQuartier = computeTypeQuartier(quartierName, quartierIndex, quartierCount, population)
  const epoque = computeEpoque(quartierName, quartierIndex, quartierCount, population)
  const densite = computeDensite(typeQuartier, population)
  const typeLogement = computeTypeLogement(typeQuartier, epoque, population, densite)
  const altitude = computeAltitude(quartierName, ville.departementCode, ville.slug, population)
  const codePostal = computeCodePostal(ville, quartierName, quartierIndex, quartierCount)
  const prixM2 = computePrixM2(ville, quartierName, typeQuartier, population)
  const loyerM2 = computeLoyerM2(prixM2, ville.region)
  const tauxProprietaires = computeTauxProprietaires(typeQuartier, typeLogement, population, h2)
  const { dpeMedian, tauxPassoires } = computeDPE(epoque, h)
  const risques = computeRisques(quartierName, ville.departementCode)
  const transport = computeTransport(ville, quartierName, population)
  const populationEstimee = computePopulationEstimee(population, quartierIndex, quartierCount, h)
  const description = generateDescription(quartierName, ville.name, epoque, typeQuartier, h)
  const atout = generateAtout(typeQuartier, epoque, transport, h2)

  return {
    name: quartierName,
    slug,
    villeSlug: ville.slug,
    codePostal,
    altitude,
    epoque,
    typeLogement,
    typeQuartier,
    densite,
    prixM2,
    loyerM2,
    tauxProprietaires,
    dpeMedian,
    tauxPassoires,
    risques,
    transport,
    populationEstimee,
    description,
    atout,
  }
}

// ---------------------------------------------------------------------------
// Generate all profiles
// ---------------------------------------------------------------------------

function generateAllProfiles(): Record<string, QuartierProfile> {
  const profiles: Record<string, QuartierProfile> = {}
  for (const ville of cities) {
    for (let i = 0; i < ville.quartiers.length; i++) {
      const quartierName = ville.quartiers[i]
      const slug = toSlug(quartierName)
      const key = `${ville.slug}/${slug}`
      profiles[key] = computeProfile(ville, quartierName, i)
    }
  }
  return profiles
}

// ---------------------------------------------------------------------------
// Exported data and lookup
// ---------------------------------------------------------------------------

/** All quartier profiles, keyed by `${villeSlug}/${quartierSlug}` */
export const QUARTIER_PROFILES: Record<string, QuartierProfile> = generateAllProfiles()

/** Look up a single quartier profile by ville and quartier slugs */
export function getQuartierData(villeSlug: string, quartierSlug: string): QuartierProfile | null {
  return QUARTIER_PROFILES[`${villeSlug}/${quartierSlug}`] || null
}

/** Get all quartier profiles for a given ville */
export function getQuartierProfilesByVille(villeSlug: string): QuartierProfile[] {
  const prefix = `${villeSlug}/`
  return Object.entries(QUARTIER_PROFILES)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, profile]) => profile)
}

/** Get total number of quartier profiles */
export function getQuartierCount(): number {
  return Object.keys(QUARTIER_PROFILES).length
}
