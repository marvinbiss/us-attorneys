/**
 * STUB -- US legal fee data placeholder.
 * TODO: Replace with US legal fee data or remove all usages.
 */

export interface InterventionPricing {
  name: string
  minPrice: number
  maxPrice: number
  unit: string
  trend: 'up' | 'stable' | 'down'
  variation: number
}

export interface ServicePricing {
  service: string
  specialtyName: string
  interventions: InterventionPricing[]
}

export interface RegionalIndex {
  region: string
  regionSlug: string
  index: number
  trend: 'up' | 'stable' | 'down'
}

export const servicePricings: ServicePricing[] = []
export const regionalIndices: RegionalIndex[] = []

export function getNationalAverageFee(): number { return 0 }
export function getAverageVariation(): number { return 0 }
export function getPracticeAreaCount(): number { return 0 }
export function getStateCount(): number { return 0 }
