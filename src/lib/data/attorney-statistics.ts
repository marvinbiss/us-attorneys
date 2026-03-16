// Stub file for attorney statistics data
// TODO: populate with real data

export interface ServicePricing {
  service: string
  specialtyName: string
  interventions: {
    name: string
    minPrice: number
    maxPrice: number
    unit: string
    trend: 'up' | 'down' | 'stable'
    variation?: number
  }[]
}

export interface RegionalIndex {
  region: string
  regionSlug: string
  index: number
  trend: 'up' | 'down' | 'stable'
}

export const servicePricings: ServicePricing[] = []

export const regionalIndices: RegionalIndex[] = []

export function getNationalAverageFee(): number {
  return 0
}

export function getAverageVariation(): number {
  return 0
}
