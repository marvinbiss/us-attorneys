/**
 * Constants for the Attorney Barometer
 * Practice areas, regions, states -- mapping for clean URLs
 */

// ---------------------------------------------------------------------------
// Main practice areas (top entries for generateStaticParams)
// ---------------------------------------------------------------------------

export interface BarometerSpecialty {
  slug: string
  label: string
  icon: string
}

export const BAROMETER_SPECIALTIES: BarometerSpecialty[] = []

export function getBarometerSpecialtyBySlug(slug: string): BarometerSpecialty | undefined {
  return BAROMETER_SPECIALTIES.find((m) => m.slug === slug)
}

// ---------------------------------------------------------------------------
// US regions / states
// ---------------------------------------------------------------------------

export interface BarometerRegion {
  slug: string
  name: string
  states: { code: string; name: string }[]
}

export const BAROMETER_REGIONS: BarometerRegion[] = []

export function getBarometerRegionBySlug(slug: string): BarometerRegion | undefined {
  return BAROMETER_REGIONS.find((r) => r.slug === slug)
}

// ---------------------------------------------------------------------------
// Top cities for the practice area pages table
// ---------------------------------------------------------------------------

export const TOP_CITIES: string[] = []
