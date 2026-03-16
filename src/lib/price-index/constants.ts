/**
 * Constants for the Attorney Barometer
 * Practice areas, regions, states -- mapping for clean URLs
 */

// ---------------------------------------------------------------------------
// Main practice areas (top entries for generateStaticParams)
// ---------------------------------------------------------------------------

export interface BarometreMetier {
  slug: string
  label: string
  icon: string
}

export const BAROMETRE_METIERS: BarometreMetier[] = []

export function getBarometreMetierBySlug(slug: string): BarometreMetier | undefined {
  return BAROMETRE_METIERS.find((m) => m.slug === slug)
}

// ---------------------------------------------------------------------------
// US regions / states
// ---------------------------------------------------------------------------

export interface BarometreRegion {
  slug: string
  name: string
  states: { code: string; nom: string }[]
}

export const BAROMETRE_REGIONS: BarometreRegion[] = []

export function getBarometreRegionBySlug(slug: string): BarometreRegion | undefined {
  return BAROMETRE_REGIONS.find((r) => r.slug === slug)
}

// ---------------------------------------------------------------------------
// Top cities for the practice area pages table
// ---------------------------------------------------------------------------

export const TOP_VILLES: string[] = []
