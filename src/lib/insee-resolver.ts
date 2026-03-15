/**
 * STUB — French INSEE resolver removed. All functions return empty values.
 * Kept as no-ops to prevent import errors during migration.
 * TODO: Remove all usages and delete this file.
 */

export function resolveProviderCity(_inseeCode: string): string {
  return ''
}

export function resolveProviderCities(_inseeCodes: string[]): string[] {
  return []
}

export function getCityValues(cityName: string): string[] {
  // Return the city name itself so .in() queries still work
  return cityName ? [cityName] : []
}
