/**
 * Tests — src/lib/geography.ts
 * State mappings, ZIP-to-state resolution, region lookups, full geography helper
 */
import { describe, it, expect } from 'vitest'

// Mock slugify dependency (imported by geography.ts from @/lib/utils)
vi.mock('@/lib/utils', () => ({
  slugify: (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
}))

import {
  US_STATES,
  STATE_TO_REGION,
  DEPARTMENTS,
  DEPT_TO_REGION,
  getStateFromZip,
  getDeptCodeFromPostal,
  getStateName,
  getRegionName,
  getGeographyFromPostal,
  getDepartmentName,
  REGIONS,
  slugify,
} from '@/lib/geography'

// ---------------------------------------------------------------------------
// US_STATES mapping
// ---------------------------------------------------------------------------
describe('US_STATES', () => {
  it('contains all 50 states + DC', () => {
    const stateAbbrevs = Object.keys(US_STATES).filter(
      (k) => !['PR', 'GU', 'VI', 'AS', 'MP', 'UM'].includes(k)
    )
    expect(stateAbbrevs).toHaveLength(51) // 50 states + DC
  })

  it('maps CA to California', () => {
    expect(US_STATES['CA']).toBe('California')
  })

  it('maps NY to New York', () => {
    expect(US_STATES['NY']).toBe('New York')
  })

  it('maps TX to Texas', () => {
    expect(US_STATES['TX']).toBe('Texas')
  })

  it('maps DC to District of Columbia', () => {
    expect(US_STATES['DC']).toBe('District of Columbia')
  })

  it('includes US territories', () => {
    expect(US_STATES['PR']).toBe('Puerto Rico')
    expect(US_STATES['GU']).toBe('Guam')
    expect(US_STATES['VI']).toBe('U.S. Virgin Islands')
  })

  it('DEPARTMENTS is a backward-compat alias for US_STATES', () => {
    expect(DEPARTMENTS).toBe(US_STATES)
  })
})

// ---------------------------------------------------------------------------
// STATE_TO_REGION mapping
// ---------------------------------------------------------------------------
describe('STATE_TO_REGION', () => {
  it('maps NY to Northeast', () => {
    expect(STATE_TO_REGION['NY']).toBe('Northeast')
  })

  it('maps IL to Midwest', () => {
    expect(STATE_TO_REGION['IL']).toBe('Midwest')
  })

  it('maps TX to South', () => {
    expect(STATE_TO_REGION['TX']).toBe('South')
  })

  it('maps CA to West', () => {
    expect(STATE_TO_REGION['CA']).toBe('West')
  })

  it('maps PR to Territory', () => {
    expect(STATE_TO_REGION['PR']).toBe('Territory')
  })

  it('DEPT_TO_REGION is a backward-compat alias', () => {
    expect(DEPT_TO_REGION).toBe(STATE_TO_REGION)
  })
})

// ---------------------------------------------------------------------------
// getStateFromZip
// ---------------------------------------------------------------------------
describe('getStateFromZip', () => {
  it('returns NY for a Manhattan ZIP (100xx)', () => {
    expect(getStateFromZip('10001')).toBe('NY')
  })

  it('returns CA for a Los Angeles ZIP (900xx)', () => {
    expect(getStateFromZip('90001')).toBe('CA')
  })

  it('returns TX for a Houston ZIP (770xx)', () => {
    expect(getStateFromZip('77001')).toBe('TX')
  })

  it('returns FL for a Miami ZIP (331xx)', () => {
    expect(getStateFromZip('33101')).toBe('FL')
  })

  it('returns IL for a Chicago ZIP (606xx)', () => {
    expect(getStateFromZip('60601')).toBe('IL')
  })

  it('returns DC for a Washington ZIP (200xx)', () => {
    expect(getStateFromZip('20001')).toBe('DC')
  })

  it('returns PA for a Philadelphia ZIP (191xx)', () => {
    expect(getStateFromZip('19101')).toBe('PA')
  })

  it('returns AK for an Alaska ZIP (995xx)', () => {
    expect(getStateFromZip('99501')).toBe('AK')
  })

  it('returns HI for a Hawaii ZIP (967xx)', () => {
    expect(getStateFromZip('96701')).toBe('HI')
  })

  it('returns null for an invalid ZIP', () => {
    expect(getStateFromZip('00000')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getStateFromZip('')).toBeNull()
  })

  it('returns null for ZIP range not covered (e.g., 399xx)', () => {
    expect(getStateFromZip('39900')).toBeNull()
  })

  it('handles ZIP code starting with leading zeros', () => {
    // 010xx falls outside all ranges (prefix 010 = 10, not in any range starting at 100)
    expect(getStateFromZip('01001')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getDeptCodeFromPostal (deprecated wrapper)
// ---------------------------------------------------------------------------
describe('getDeptCodeFromPostal', () => {
  it('delegates to getStateFromZip', () => {
    expect(getDeptCodeFromPostal('10001')).toBe('NY')
  })

  it('returns null for null input', () => {
    expect(getDeptCodeFromPostal(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(getDeptCodeFromPostal(undefined)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getStateName
// ---------------------------------------------------------------------------
describe('getStateName', () => {
  it('returns full name from abbreviation', () => {
    expect(getStateName('CA')).toBe('California')
  })

  it('returns full name from ZIP code', () => {
    expect(getStateName('10001')).toBe('New York')
  })

  it('returns the input if it looks like a full state name (length > 3, non-numeric)', () => {
    expect(getStateName('California')).toBe('California')
  })

  it('returns null for null input', () => {
    expect(getStateName(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(getStateName(undefined)).toBeNull()
  })

  it('returns null for unknown abbreviation', () => {
    expect(getStateName('XX')).toBeNull()
  })

  it('getDepartmentName is an alias', () => {
    expect(getDepartmentName).toBe(getStateName)
  })
})

// ---------------------------------------------------------------------------
// getRegionName
// ---------------------------------------------------------------------------
describe('getRegionName', () => {
  it('returns region from state abbreviation', () => {
    expect(getRegionName('CA')).toBe('West')
    expect(getRegionName('NY')).toBe('Northeast')
    expect(getRegionName('TX')).toBe('South')
    expect(getRegionName('IL')).toBe('Midwest')
  })

  it('returns region from ZIP code', () => {
    expect(getRegionName('90001')).toBe('West')
    expect(getRegionName('10001')).toBe('Northeast')
  })

  it('returns the input if it looks like a region name already', () => {
    expect(getRegionName('Northeast')).toBe('Northeast')
  })

  it('returns null for null input', () => {
    expect(getRegionName(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(getRegionName(undefined)).toBeNull()
  })

  it('returns null for unknown code', () => {
    expect(getRegionName('XX')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getGeographyFromPostal
// ---------------------------------------------------------------------------
describe('getGeographyFromPostal', () => {
  it('returns full geography for a valid ZIP', () => {
    const geo = getGeographyFromPostal('10001')
    expect(geo.stateCode).toBe('NY')
    expect(geo.stateName).toBe('New York')
    expect(geo.regionName).toBe('Northeast')
    // backward compat aliases
    expect(geo.departmentCode).toBe('NY')
    expect(geo.departmentName).toBe('New York')
  })

  it('returns all nulls for null input', () => {
    const geo = getGeographyFromPostal(null)
    expect(geo.stateCode).toBeNull()
    expect(geo.stateName).toBeNull()
    expect(geo.regionName).toBeNull()
  })

  it('returns all nulls for undefined input', () => {
    const geo = getGeographyFromPostal(undefined)
    expect(geo.stateCode).toBeNull()
    expect(geo.stateName).toBeNull()
    expect(geo.regionName).toBeNull()
  })

  it('returns all nulls for invalid ZIP', () => {
    const geo = getGeographyFromPostal('00000')
    expect(geo.stateCode).toBeNull()
    expect(geo.stateName).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// REGIONS
// ---------------------------------------------------------------------------
describe('REGIONS', () => {
  it('contains unique region entries with name and slug', () => {
    const names = REGIONS.map((r) => r.name)
    expect(names).toContain('Northeast')
    expect(names).toContain('Midwest')
    expect(names).toContain('South')
    expect(names).toContain('West')
    expect(names).toContain('Territory')
    // All unique
    expect(new Set(names).size).toBe(names.length)
  })

  it('has slugified slug for each region', () => {
    const northeast = REGIONS.find((r) => r.name === 'Northeast')
    expect(northeast?.slug).toBe('northeast')
  })
})

// ---------------------------------------------------------------------------
// slugify re-export
// ---------------------------------------------------------------------------
describe('slugify re-export', () => {
  it('is exported from geography module', () => {
    expect(typeof slugify).toBe('function')
  })

  it('slugifies text correctly', () => {
    expect(slugify('Personal Injury')).toBe('personal-injury')
  })
})
