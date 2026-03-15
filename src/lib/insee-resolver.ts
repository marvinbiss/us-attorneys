/**
 * INSEE commune code resolver
 *
 * 91% of providers have INSEE codes (e.g., "69123") instead of city names
 * (e.g., "Lyon") in address_city. This module provides:
 *
 * 1. resolveProviderCity() — post-process a provider to fix address_city
 * 2. getInseeCodesForCity() — get INSEE codes matching a city name (for queries)
 */

import locationData from '@/lib/data/insee-communes.json'

type CommuneEntry = { n: string; r: string; d: string }
const communes = locationData as Record<string, CommuneEntry>

// Paris, Marseille, Lyon have arrondissement codes not in the main communes JSON.
// Map them to the parent commune so resolveProviderCity works for all 743K+ providers.
const ARRONDISSEMENT_MAP: Record<string, CommuneEntry> = {}
// Paris: 75101–75120 → Paris (75056)
for (let i = 75101; i <= 75120; i++) {
  ARRONDISSEMENT_MAP[String(i)] = { n: 'Paris', r: 'Île-de-France', d: '75' }
}
// Marseille: 13201–13216 → Marseille (13055)
for (let i = 13201; i <= 13216; i++) {
  ARRONDISSEMENT_MAP[String(i)] = { n: 'Marseille', r: "Provence-Alpes-Côte d'Azur", d: '13' }
}
// Lyon: 69381–69389 → Lyon (69123)
for (let i = 69381; i <= 69389; i++) {
  ARRONDISSEMENT_MAP[String(i)] = { n: 'Lyon', r: 'Auvergne-Rhône-Alpes', d: '69' }
}

// Merged lookup: communes JSON + arrondissement overrides
function getLocation(code: string): CommuneEntry | undefined {
  return communes[code] || ARRONDISSEMENT_MAP[code]
}

const INSEE_CODE_RE = /^\d{4,5}$/
const CORSE_CODE_RE = /^[0-9][A-Z0-9]\d{3}$/

function isInseeCode(city: string): boolean {
  return INSEE_CODE_RE.test(city) || CORSE_CODE_RE.test(city)
}

// ─── Forward map: INSEE code → city name (for display) ──────────────

/**
 * If provider.address_city is an INSEE code, replace it with the real city name.
 * Also fills in address_region if missing.
 * Returns the same object reference if no change needed (no copy).
 */
export function resolveProviderCity<T extends { address_city?: string | null; address_region?: string | null }>(
  provider: T,
): T {
  const city = provider.address_city
  if (!city || !isInseeCode(city)) return provider

  const commune = getLocation(city)
  if (!commune) return provider

  return {
    ...provider,
    address_city: commune.n,
    ...((!provider.address_region && commune.r) ? { address_region: commune.r } : {}),
  }
}

/**
 * Resolve INSEE codes for an array of providers (batch).
 */
export function resolveProviderCities<T extends { address_city?: string | null; address_region?: string | null }>(
  providers: T[],
): T[] {
  return providers.map(resolveProviderCity)
}

// ─── Reverse map: city name → INSEE codes (for queries) ─────────────

const _normalize = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

// Build reverse map lazily (only on first use)
let _reverseMap: Map<string, string[]> | null = null

function getReverseMap(): Map<string, string[]> {
  if (_reverseMap) return _reverseMap

  _reverseMap = new Map()
  for (const [code, info] of Object.entries(communes)) {
    const key = _normalize(info.n)
    const existing = _reverseMap.get(key)
    if (existing) {
      existing.push(code)
    } else {
      _reverseMap.set(key, [code])
    }
  }
  return _reverseMap
}

/**
 * Get all INSEE codes that match a given city name.
 * Returns empty array if no match.
 */
export function getInseeCodesForCity(cityName: string): string[] {
  return getReverseMap().get(_normalize(cityName)) || []
}

/**
 * Get all possible address_city values for a given city name.
 * Returns the city name itself plus all matching INSEE codes.
 * Use with `.in('address_city', getCityValues(...))` for index-friendly queries.
 */
export function getCityValues(cityName: string): string[] {
  const codes = getInseeCodesForCity(cityName)
  const normalized = _normalize(cityName)

  // Include arrondissement codes for Paris, Marseille, Lyon
  const arrondissementCodes: string[] = []
  if (normalized === 'paris') {
    for (let i = 75101; i <= 75120; i++) arrondissementCodes.push(String(i))
  } else if (normalized === 'marseille') {
    for (let i = 13201; i <= 13216; i++) arrondissementCodes.push(String(i))
  } else if (normalized === 'lyon') {
    for (let i = 69381; i <= 69389; i++) arrondissementCodes.push(String(i))
  }

  return [cityName, ...codes, ...arrondissementCodes]
}

/**
 * Build a PostgREST OR filter that matches BOTH the city name AND its INSEE codes.
 * Uses `in` instead of `ilike` to avoid sequential scans on 743K+ rows.
 */
export function buildCityFilter(cityName: string): string {
  const values = getCityValues(cityName)
  return `address_city.in.(${values.join(',')})`
}
