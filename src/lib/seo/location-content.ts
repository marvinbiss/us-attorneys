/**
 * Location content generator.
 *
 * Delegates to location-content-us.ts for real content generation.
 * All exported types, interfaces, and function signatures are preserved.
 */

import { type DataDrivenContent } from '@/lib/seo/data-driven-content'
import {
  getRegionalPricingMultiplier,
  classifyCitySize,
  getCitySizeLabel,
  generateLocationFAQ,
  generateLocationIntro,
  generateLocationPricingNote,
  getRegionalTips,
  type FAQParams,
} from '@/lib/seo/location-content-us'

// Re-export US-specific functions for direct access
export {
  getRegionalPricingMultiplier,
  classifyCitySize,
  getCitySizeLabel,
  generateLocationFAQ,
  generateLocationIntro,
  generateLocationPricingNote,
  getRegionalTips,
  getStateBarVerificationUrl,
  STATE_BAR_URLS,
  type FAQParams,
  type FAQItem,
  type CitySize,
} from '@/lib/seo/location-content-us'

// ---------------------------------------------------------------------------
// Regional pricing multipliers
// ---------------------------------------------------------------------------

export function getRegionalMultiplier(region: string): number {
  return getRegionalPricingMultiplier(region)
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
  specialtySlug: string,
  specialtyName: string,
  cityRaw: unknown,
  attorneyCount: number = 0,
  _locationData?: unknown | null | undefined,
): LocationContent {
  // Extract city data from the raw object (shape: { name, slug, state, stateAbbr, population, county })
  const city = cityRaw as { name?: string; slug?: string; state?: string; stateAbbr?: string; population?: number; county?: string } | null
  if (!city?.name || !city?.state) {
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

  const stateAbbr = city.stateAbbr || city.state?.substring(0, 2).toUpperCase() || ''
  const population = city.population || 0
  const avgCost = Math.round(250 * getRegionalPricingMultiplier(stateAbbr))
  const citySize = classifyCitySize(population)

  const params: FAQParams = {
    city: city.name,
    state: city.state,
    stateAbbr,
    specialty: specialtySlug,
    specialtyName,
    avgCost,
    winRate: 52,
    attorneyCount,
    population,
    countyName: city.county || '',
  }

  const faqItems = generateLocationFAQ(params)
  const introText = generateLocationIntro(params)
  const pricingNote = generateLocationPricingNote(params)
  const localTips = getRegionalTips(stateAbbr, 4)
  const citySizeLabel = getCitySizeLabel(citySize)

  return {
    introText,
    pricingNote,
    localTips,
    neighborhoodText: '',
    conclusion: `Whether you need a ${specialtyName.toLowerCase()} attorney for a complex case or a simple consultation, ${city.name} has qualified legal professionals ready to help. Use our directory to compare attorneys, read reviews, and find the right fit for your needs.`,
    climateLabel: '',
    citySizeLabel,
    climateTip: localTips[0] || '',
    faqItems,
    dataDriven: null,
  }
}

// ---------------------------------------------------------------------------
// Neighborhood content
// ---------------------------------------------------------------------------

export interface NeighborhoodProfile {
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
  profile: NeighborhoodProfile
  intro: string
  buildingContext: string
  demandedServices: string
  advice: string
  proximity: string
  faqItems: { question: string; answer: string }[]
  dataDriven: NeighborhoodDataDrivenContent | null
}

export function generateNeighborhoodContent(_cityRaw: unknown, _neighborhoodName: string, _specialtySlug?: string): NeighborhoodContent {
  return {
    profile: {
      era: 'mixed',
      eraLabel: '',
      density: 'residential',
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
// State content
// ---------------------------------------------------------------------------

export interface StateProfile {
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
  profile: StateProfile
  intro: string
  housingContext: string
  priorityServices: string
  stateAdvice: string
  faqItems: { question: string; answer: string }[]
}

export function generateStateContent(_deptRaw: unknown): StateContent {
  return {
    profile: {
      climate: 'semi-oceanic',
      climateLabel: '',
      economy: 'mixed',
      economyLabel: '',
      housing: 'mixed-urban',
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
      climate: 'semi-oceanic',
      climateLabel: '',
      geoType: 'plain',
      geoLabel: '',
      economy: 'diversified-economy',
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
// City content
// ---------------------------------------------------------------------------

export interface CityProfile {
  climate: string
  climateLabel: string
  citySize: string
  citySizeLabel: string
  topServiceSlugs: string[]
  climaticIssues: string[]
  habitatDescription: string
}

export interface CityContent {
  profile: CityProfile
  intro: string
  urbanContext: string
  priorityServices: string
  cityAdvice: string
  faqItems: { question: string; answer: string }[]
}

export function generateCityContent(_cityRaw: unknown): CityContent {
  return {
    profile: {
      climate: 'semi-oceanic',
      climateLabel: '',
      citySize: 'small-town',
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
