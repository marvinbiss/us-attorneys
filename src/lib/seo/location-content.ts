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
  neighborhoodText: string
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
    neighborhoodText: '',
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

export interface NeighborhoodDataDrivenContent {
  realEstateNeighborhood: string
  legalMarketNeighborhood: string
  legalAidNeighborhood: string
  climateNeighborhood: string
  statCards: {
    pricePerSqFtNeighborhood: number
    nearbyAttorneys: number
    legalProfessionals: number
    complianceGaps: number
    frostDays: number | null
    peakSeason: string | null
  }
  dataSources: string[]
}

export interface NeighborhoodContent {
  profile: QuartierProfile
  intro: string
  buildingContext: string
  demandedServices: string
  advice: string
  proximity: string
  faqItems: { question: string; answer: string }[]
  dataDriven: NeighborhoodDataDrivenContent | null
}

/** @deprecated Use NeighborhoodContent instead */
export type QuartierContent = NeighborhoodContent

export function generateQuartierContent(_villeRaw: unknown, _quartierName: string, _specialtySlug?: string): NeighborhoodContent {
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
    buildingContext: '',
    demandedServices: '',
    advice: '',
    proximity: '',
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

export interface StateContent {
  profile: DepartementProfile
  intro: string
  housingContext: string
  priorityServices: string
  stateAdvice: string
  faqItems: { question: string; answer: string }[]
}

/** @deprecated Use StateContent instead */
export type DepartementContent = StateContent

export function generateDepartementContent(_deptRaw: unknown): StateContent {
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
    housingContext: '',
    priorityServices: '',
    stateAdvice: '',
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
  regionalContext: string
  priorityServices: string
  regionAdvice: string
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
    regionalContext: '',
    priorityServices: '',
    regionAdvice: '',
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

export interface CityContent {
  profile: VilleProfile
  intro: string
  urbanContext: string
  priorityServices: string
  cityAdvice: string
  faqItems: { question: string; answer: string }[]
}

/** @deprecated Use CityContent instead */
export type VilleContent = CityContent

export function generateVilleContent(_villeRaw: unknown): CityContent {
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
    urbanContext: '',
    priorityServices: '',
    cityAdvice: '',
    faqItems: [],
  }
}
