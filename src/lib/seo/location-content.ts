/**
 * Location content generator — stub.
 *
 * All exported types, interfaces, and function signatures are preserved.
 * Functions return minimal/empty content.
 */

import { type DataDrivenContent } from '@/lib/seo/data-driven-content'

// ---------------------------------------------------------------------------
// Regional pricing multipliers
// ---------------------------------------------------------------------------

export function getRegionalMultiplier(_region: string): number {
  return 1.0
}

// ---------------------------------------------------------------------------
// Deterministic "random" seed from string — for variation without randomness
// ---------------------------------------------------------------------------

export function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// ---------------------------------------------------------------------------
// Main exported types & interfaces
// ---------------------------------------------------------------------------

export interface LocationContent {
  introText: string
  pricingNote: string
  localTips: string[]
  quartierText: string
  conclusion: string
  climateLabel: string
  citySizeLabel: string
  climateTip: string
  faqItems: { question: string; answer: string }[]
  /** Data-driven content sections (null when location data unavailable) */
  dataDriven: DataDrivenContent | null
}

export function generateLocationContent(
  _specialtySlug: string,
  _specialtyName: string,
  _villeRaw: unknown,
  _attorneyCount: number = 0,
  _locationData?: unknown | null | undefined,
): LocationContent {
  return {
    introText: '',
    pricingNote: '',
    localTips: [],
    quartierText: '',
    conclusion: '',
    climateLabel: '',
    citySizeLabel: '',
    climateTip: '',
    faqItems: [],
    dataDriven: null,
  }
}

// ---------------------------------------------------------------------------
// Quartier content
// ---------------------------------------------------------------------------

export interface QuartierProfile {
  era: string
  eraLabel: string
  density: string
  densityLabel: string
  commonIssues: string[]
  topServiceSlugs: string[]
  architecturalNote: string
}

export interface QuartierDataDrivenContent {
  immobilierQuartier: string
  legalMarketQuartier: string
  energetiqueQuartier: string
  climatQuartier: string
  statCards: {
    prixM2Quartier: number
    artisansProximite: number
    artisansBtp: number
    passoiresDpe: number
    joursGel: number | null
    periodeTravaux: string | null
  }
  dataSources: string[]
}

export interface QuartierContent {
  profile: QuartierProfile
  intro: string
  batimentContext: string
  servicesDemandes: string
  conseils: string
  proximite: string
  faqItems: { question: string; answer: string }[]
  dataDriven: QuartierDataDrivenContent | null
}

export function generateQuartierContent(_villeRaw: unknown, _quartierName: string, _specialtySlug?: string): QuartierContent {
  return {
    profile: {
      era: 'mixte',
      eraLabel: '',
      density: 'residentiel',
      densityLabel: '',
      commonIssues: [],
      topServiceSlugs: [],
      architecturalNote: '',
    },
    intro: '',
    batimentContext: '',
    servicesDemandes: '',
    conseils: '',
    proximite: '',
    faqItems: [],
    dataDriven: null,
  }
}

// ---------------------------------------------------------------------------
// Departement content
// ---------------------------------------------------------------------------

export interface DepartementProfile {
  climate: string
  climateLabel: string
  economy: string
  economyLabel: string
  housing: string
  housingLabel: string
  topServiceSlugs: string[]
  climaticIssues: string[]
}

export interface DepartementContent {
  profile: DepartementProfile
  intro: string
  contexteHabitat: string
  servicesPrioritaires: string
  conseilsDepartement: string
  faqItems: { question: string; answer: string }[]
}

export function generateDepartementContent(_deptRaw: unknown): DepartementContent {
  return {
    profile: {
      climate: 'semi-oceanique',
      climateLabel: '',
      economy: 'mixte',
      economyLabel: '',
      housing: 'mixte-urbain',
      housingLabel: '',
      topServiceSlugs: [],
      climaticIssues: [],
    },
    intro: '',
    contexteHabitat: '',
    servicesPrioritaires: '',
    conseilsDepartement: '',
    faqItems: [],
  }
}

// ---------------------------------------------------------------------------
// Region content
// ---------------------------------------------------------------------------

export interface RegionProfile {
  climate: string
  climateLabel: string
  geoType: string
  geoLabel: string
  economy: string
  economyLabel: string
  topServiceSlugs: string[]
  keyFacts: string[]
}

export interface RegionContent {
  profile: RegionProfile
  intro: string
  contexteRegional: string
  servicesPrioritaires: string
  conseilsRegion: string
  faqItems: { question: string; answer: string }[]
}

export function generateRegionContent(_regionRaw: unknown, _cityCountOverride?: number): RegionContent {
  return {
    profile: {
      climate: 'semi-oceanique',
      climateLabel: '',
      geoType: 'plaine',
      geoLabel: '',
      economy: 'economie-diversifiee',
      economyLabel: '',
      topServiceSlugs: [],
      keyFacts: [],
    },
    intro: '',
    contexteRegional: '',
    servicesPrioritaires: '',
    conseilsRegion: '',
    faqItems: [],
  }
}

// ---------------------------------------------------------------------------
// Ville (City) content
// ---------------------------------------------------------------------------

export interface VilleProfile {
  climate: string
  climateLabel: string
  citySize: string
  citySizeLabel: string
  topServiceSlugs: string[]
  climaticIssues: string[]
  habitatDescription: string
}

export interface VilleContent {
  profile: VilleProfile
  intro: string
  contexteUrbain: string
  servicesPrioritaires: string
  conseilsVille: string
  faqItems: { question: string; answer: string }[]
}

export function generateVilleContent(_villeRaw: unknown): VilleContent {
  return {
    profile: {
      climate: 'semi-oceanique',
      climateLabel: '',
      citySize: 'petite-ville',
      citySizeLabel: '',
      topServiceSlugs: [],
      climaticIssues: [],
      habitatDescription: '',
    },
    intro: '',
    contexteUrbain: '',
    servicesPrioritaires: '',
    conseilsVille: '',
    faqItems: [],
  }
}
