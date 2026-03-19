/**
 * Tests for USA static data module
 * Covers data integrity of states, cities, regions, practice areas,
 * and all exported helper functions.
 */

import { describe, it, expect } from 'vitest'
import {
  states,
  cities,
  usRegions,
  practiceAreas,
  services,
  getCityBySlug,
  getStateBySlug,
  getStateByCode,
  getCitiesByState,
  getNearbyCities,
  getRegionBySlug,
  getRegionSlugByName,
  getNeighborhoodsByCity,
  getNeighborhoodBySlug,
} from '@/lib/data/usa'

// ============================================================================
// States array integrity
// ============================================================================

describe('states', () => {
  it('contains 50 US states + DC + territories', () => {
    // 50 states + DC + 6 territories (PR, GU, VI, AS, MP, UM) = 57
    expect(states.length).toBe(57)
  })

  it('contains all 50 US states by code', () => {
    const stateCodes = states.map((s) => s.code)
    const expected50 = [
      'AL',
      'AK',
      'AZ',
      'AR',
      'CA',
      'CO',
      'CT',
      'DE',
      'FL',
      'GA',
      'HI',
      'ID',
      'IL',
      'IN',
      'IA',
      'KS',
      'KY',
      'LA',
      'ME',
      'MD',
      'MA',
      'MI',
      'MN',
      'MS',
      'MO',
      'MT',
      'NE',
      'NV',
      'NH',
      'NJ',
      'NM',
      'NY',
      'NC',
      'ND',
      'OH',
      'OK',
      'OR',
      'PA',
      'RI',
      'SC',
      'SD',
      'TN',
      'TX',
      'UT',
      'VT',
      'VA',
      'WA',
      'WV',
      'WI',
      'WY',
    ]
    for (const code of expected50) {
      expect(stateCodes).toContain(code)
    }
  })

  it('includes DC', () => {
    const dc = states.find((s) => s.code === 'DC')
    expect(dc).toBeDefined()
    expect(dc!.name).toBe('District of Columbia')
  })

  it('has unique state codes', () => {
    const codes = states.map((s) => s.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('has unique slugs', () => {
    const slugs = states.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every state has required fields', () => {
    for (const state of states) {
      expect(state.code).toBeTruthy()
      expect(state.code.length).toBe(2)
      expect(state.slug).toBeTruthy()
      expect(state.name).toBeTruthy()
      expect(state.region).toBeTruthy()
      expect(state.population).toBeTruthy()
      expect(state.description).toBeTruthy()
      expect(typeof state.attorneysEstimate).toBe('number')
      expect(state.attorneysEstimate).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(state.cities)).toBe(true)
    }
  })

  it('regions are one of the expected values', () => {
    const validRegions = ['Northeast', 'Midwest', 'South', 'West', 'Territory']
    for (const state of states) {
      expect(validRegions).toContain(state.region)
    }
  })

  it('California has the expected attorney estimate', () => {
    const ca = states.find((s) => s.code === 'CA')
    expect(ca).toBeDefined()
    expect(ca!.attorneysEstimate).toBe(170000)
  })

  it('New York has the largest bar', () => {
    const ny = states.find((s) => s.code === 'NY')
    expect(ny).toBeDefined()
    expect(ny!.attorneysEstimate).toBe(188000)
    // NY should have the max estimate
    const maxEstimate = Math.max(...states.map((s) => s.attorneysEstimate))
    expect(ny!.attorneysEstimate).toBe(maxEstimate)
  })
})

// ============================================================================
// Cities array integrity
// ============================================================================

describe('cities', () => {
  it('contains a large number of cities (100+)', () => {
    expect(cities.length).toBeGreaterThanOrEqual(100)
  })

  it('has unique slugs', () => {
    const slugs = cities.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every city has required fields', () => {
    for (const city of cities) {
      expect(city.slug).toBeTruthy()
      expect(city.name).toBeTruthy()
      expect(city.stateCode).toBeTruthy()
      expect(city.stateCode.length).toBe(2)
      expect(city.stateName).toBeTruthy()
      expect(city.county).toBeTruthy()
      expect(city.population).toBeTruthy()
      expect(city.zipCode).toBeTruthy()
      expect(city.description).toBeTruthy()
      expect(Array.isArray(city.neighborhoods)).toBe(true)
      expect(typeof city.latitude).toBe('number')
      expect(typeof city.longitude).toBe('number')
      expect(city.metroArea).toBeDefined()
    }
  })

  it('every city stateCode references a valid state', () => {
    const stateCodes = new Set(states.map((s) => s.code))
    for (const city of cities) {
      expect(stateCodes.has(city.stateCode)).toBe(true)
    }
  })

  it('coordinates are within continental US + territories bounds', () => {
    for (const city of cities) {
      // Latitude: -15 (American Samoa) to 72 (Alaska)
      expect(city.latitude).toBeGreaterThan(-16)
      expect(city.latitude).toBeLessThan(72)
      // Longitude: -180 (Alaska/territories) to 180
      expect(city.longitude).toBeGreaterThan(-180)
      expect(city.longitude).toBeLessThan(180)
    }
  })

  it('ZIP codes are 5 digits', () => {
    for (const city of cities) {
      expect(city.zipCode).toMatch(/^\d{5}$/)
    }
  })

  it('contains major US cities', () => {
    const slugs = new Set(cities.map((c) => c.slug))
    const majorCities = [
      'new-york',
      'los-angeles',
      'chicago',
      'houston',
      'phoenix',
      'philadelphia',
      'san-antonio',
      'san-diego',
      'dallas',
    ]
    for (const slug of majorCities) {
      expect(slugs.has(slug)).toBe(true)
    }
  })

  it('New York is in the correct state', () => {
    const ny = cities.find((c) => c.slug === 'new-york')
    expect(ny).toBeDefined()
    expect(ny!.stateCode).toBe('NY')
    expect(ny!.stateName).toBe('New York')
  })
})

// ============================================================================
// US Regions
// ============================================================================

describe('usRegions', () => {
  it('contains exactly 4 regions', () => {
    expect(usRegions.length).toBe(4)
  })

  it('has the expected region slugs', () => {
    const slugs = usRegions.map((r) => r.slug)
    expect(slugs).toContain('northeast')
    expect(slugs).toContain('midwest')
    expect(slugs).toContain('south')
    expect(slugs).toContain('west')
  })

  it('every region has states', () => {
    for (const region of usRegions) {
      expect(region.slug).toBeTruthy()
      expect(region.name).toBeTruthy()
      expect(region.description).toBeTruthy()
      expect(region.states.length).toBeGreaterThan(0)
    }
  })

  it('every region state has code, name, slug, and cities', () => {
    for (const region of usRegions) {
      for (const state of region.states) {
        expect(state.code).toBeTruthy()
        expect(state.name).toBeTruthy()
        expect(state.slug).toBeTruthy()
        expect(Array.isArray(state.cities)).toBe(true)
        expect(state.cities.length).toBeGreaterThan(0)
        for (const city of state.cities) {
          expect(city.name).toBeTruthy()
          expect(city.slug).toBeTruthy()
        }
      }
    }
  })
})

// ============================================================================
// Practice Areas
// ============================================================================

describe('practiceAreas', () => {
  it('contains 78 practice areas', () => {
    expect(practiceAreas.length).toBe(78)
  })

  it('has unique slugs', () => {
    const slugs = practiceAreas.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every practice area has required fields', () => {
    for (const pa of practiceAreas) {
      expect(pa.slug).toBeTruthy()
      expect(pa.name).toBeTruthy()
      expect(pa.icon).toBeTruthy()
      expect(pa.color).toBeTruthy()
    }
  })

  it('contains key practice areas', () => {
    const slugs = new Set(practiceAreas.map((p) => p.slug))
    const expected = [
      'personal-injury',
      'criminal-defense',
      'immigration-law',
      'bankruptcy',
      'real-estate-law',
    ]
    for (const slug of expected) {
      expect(slugs.has(slug)).toBe(true)
    }
  })

  it('services is an alias for practiceAreas', () => {
    expect(services).toBe(practiceAreas)
  })
})

// ============================================================================
// getCityBySlug
// ============================================================================

describe('getCityBySlug', () => {
  it('returns city for a valid slug', () => {
    const city = getCityBySlug('new-york')
    expect(city).toBeDefined()
    expect(city!.name).toBe('New York')
    expect(city!.stateCode).toBe('NY')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getCityBySlug('nonexistent-city')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(getCityBySlug('')).toBeUndefined()
  })
})

// ============================================================================
// getStateBySlug
// ============================================================================

describe('getStateBySlug', () => {
  it('returns state for a valid slug', () => {
    const state = getStateBySlug('california')
    expect(state).toBeDefined()
    expect(state!.code).toBe('CA')
    expect(state!.name).toBe('California')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getStateBySlug('atlantis')).toBeUndefined()
  })
})

// ============================================================================
// getStateByCode
// ============================================================================

describe('getStateByCode', () => {
  it('returns state for a valid code', () => {
    const state = getStateByCode('TX')
    expect(state).toBeDefined()
    expect(state!.name).toBe('Texas')
    expect(state!.slug).toBe('texas')
  })

  it('returns undefined for an invalid code', () => {
    expect(getStateByCode('ZZ')).toBeUndefined()
  })

  it('is case-sensitive', () => {
    expect(getStateByCode('tx')).toBeUndefined()
  })
})

// ============================================================================
// getCitiesByState
// ============================================================================

describe('getCitiesByState', () => {
  it('returns cities for a valid state code', () => {
    const caCities = getCitiesByState('CA')
    expect(caCities.length).toBeGreaterThan(0)
    for (const city of caCities) {
      expect(city.stateCode).toBe('CA')
    }
  })

  it('returns empty array for unknown state code', () => {
    expect(getCitiesByState('ZZ')).toEqual([])
  })

  it('returns multiple cities for populous states', () => {
    const txCities = getCitiesByState('TX')
    expect(txCities.length).toBeGreaterThan(5)
  })
})

// ============================================================================
// getNearbyCities
// ============================================================================

describe('getNearbyCities', () => {
  it('returns nearby cities for a valid city slug', () => {
    const nearby = getNearbyCities('houston')
    expect(nearby.length).toBeGreaterThan(0)
    expect(nearby.length).toBeLessThanOrEqual(5)
    // Should not include the city itself
    expect(nearby.find((c) => c.slug === 'houston')).toBeUndefined()
  })

  it('respects the limit parameter', () => {
    const nearby = getNearbyCities('los-angeles', 3)
    expect(nearby.length).toBeLessThanOrEqual(3)
  })

  it('returns empty array for unknown city slug', () => {
    expect(getNearbyCities('nonexistent')).toEqual([])
  })

  it('prioritizes cities in the same state', () => {
    const nearby = getNearbyCities('houston')
    // Houston is in TX; there are many TX cities in the dataset
    const txCities = nearby.filter((c) => c.stateCode === 'TX')
    expect(txCities.length).toBeGreaterThan(0)
  })

  it('defaults to limit of 5', () => {
    const nearby = getNearbyCities('new-york')
    expect(nearby.length).toBeLessThanOrEqual(5)
  })
})

// ============================================================================
// getRegionBySlug
// ============================================================================

describe('getRegionBySlug', () => {
  it('returns region for a valid slug', () => {
    const region = getRegionBySlug('northeast')
    expect(region).toBeDefined()
    expect(region!.name).toBe('Northeast')
  })

  it('returns undefined for unknown slug', () => {
    expect(getRegionBySlug('oceania')).toBeUndefined()
  })
})

// ============================================================================
// getRegionSlugByName
// ============================================================================

describe('getRegionSlugByName', () => {
  it('returns slug for a valid region name', () => {
    expect(getRegionSlugByName('South')).toBe('south')
    expect(getRegionSlugByName('West')).toBe('west')
  })

  it('returns undefined for unknown name', () => {
    expect(getRegionSlugByName('Arctic')).toBeUndefined()
  })

  it('is case-sensitive', () => {
    expect(getRegionSlugByName('south')).toBeUndefined()
  })
})

// ============================================================================
// getNeighborhoodsByCity
// ============================================================================

describe('getNeighborhoodsByCity', () => {
  it('returns neighborhoods for a city with neighborhoods', () => {
    const neighborhoods = getNeighborhoodsByCity('new-york')
    expect(neighborhoods.length).toBeGreaterThan(0)
    for (const n of neighborhoods) {
      expect(n.name).toBeTruthy()
      expect(n.slug).toBeTruthy()
      // Slug should be lowercase with dashes
      expect(n.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('returns empty array for unknown city', () => {
    expect(getNeighborhoodsByCity('nonexistent')).toEqual([])
  })

  it('generates correct slugs for neighborhoods', () => {
    const neighborhoods = getNeighborhoodsByCity('new-york')
    const manhattan = neighborhoods.find((n) => n.name === 'Manhattan')
    expect(manhattan).toBeDefined()
    expect(manhattan!.slug).toBe('manhattan')
  })
})

// ============================================================================
// getNeighborhoodBySlug
// ============================================================================

describe('getNeighborhoodBySlug', () => {
  it('returns city and neighborhood name for valid slugs', () => {
    const result = getNeighborhoodBySlug('new-york', 'manhattan')
    expect(result).not.toBeNull()
    expect(result!.city.slug).toBe('new-york')
    expect(result!.neighborhoodName).toBe('Manhattan')
  })

  it('returns null for unknown city slug', () => {
    expect(getNeighborhoodBySlug('nonexistent', 'manhattan')).toBeNull()
  })

  it('returns null for unknown neighborhood slug', () => {
    expect(getNeighborhoodBySlug('new-york', 'nonexistent-hood')).toBeNull()
  })

  it('returns null when both are unknown', () => {
    expect(getNeighborhoodBySlug('fake-city', 'fake-hood')).toBeNull()
  })
})
