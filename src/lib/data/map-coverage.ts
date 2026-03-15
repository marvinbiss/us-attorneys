/**
 * STUB — French map coverage data removed.
 * TODO: Replace with US state/city map data or remove all usages.
 */

export interface CityMarker {
  slug: string
  name: string
  lat: number
  lng: number
  attorneyCount: number
  region: string
  departement: string
  population: number
}

export const cityMarkers: CityMarker[] = []

export interface MapRegion {
  name: string
  slug: string
  center: [number, number]
  zoom: number
}

export const mapRegions: MapRegion[] = []

export function getMarkerColor(_region: string): string {
  return '#3B82F6'
}

export function getMarkerRadius(attorneyCount: number): number {
  return Math.max(5, Math.min(20, Math.sqrt(attorneyCount) * 2))
}
