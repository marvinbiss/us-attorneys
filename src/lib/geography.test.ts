import { describe, it, expect } from 'vitest'
import {
  getDeptCodeFromPostal,
  getStateFromZip,
  getDepartmentName,
  getRegionName,
  getGeographyFromPostal,
  slugify,
  US_STATES,
  STATE_TO_REGION,
  DEPARTMENTS,
  DEPT_TO_REGION,
  REGIONS,
} from './geography'

describe('getStateFromZip', () => {
  it('should return state abbreviation for valid ZIP codes', () => {
    expect(getStateFromZip('10001')).toBe('NY')  // New York City
    expect(getStateFromZip('90210')).toBe('CA')  // Beverly Hills
    expect(getStateFromZip('60601')).toBe('IL')  // Chicago
    expect(getStateFromZip('77001')).toBe('TX')  // Houston
    expect(getStateFromZip('33101')).toBe('FL')  // Miami
    expect(getStateFromZip('20001')).toBe('DC')  // Washington DC
    expect(getStateFromZip('98101')).toBe('WA')  // Seattle
  })

  it('should return null for out-of-range ZIP codes', () => {
    expect(getStateFromZip('00000')).toBeNull()
    expect(getStateFromZip('00100')).toBeNull()
  })

  it('should handle edge cases', () => {
    expect(getStateFromZip('')).toBeNull()
  })
})

describe('getDeptCodeFromPostal (backward compat)', () => {
  it('should return null for null input', () => {
    expect(getDeptCodeFromPostal(null)).toBeNull()
  })

  it('should return null for undefined input', () => {
    expect(getDeptCodeFromPostal(undefined)).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(getDeptCodeFromPostal('')).toBeNull()
  })

  it('should delegate to getStateFromZip', () => {
    expect(getDeptCodeFromPostal('10001')).toBe('NY')
    expect(getDeptCodeFromPostal('90210')).toBe('CA')
  })
})

describe('getDepartmentName', () => {
  it('should return null for null input', () => {
    expect(getDepartmentName(null)).toBeNull()
  })

  it('should return null for undefined input', () => {
    expect(getDepartmentName(undefined)).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(getDepartmentName('')).toBeNull()
  })

  it('should return state name from ZIP code', () => {
    expect(getDepartmentName('10001')).toBe('New York')
    expect(getDepartmentName('90210')).toBe('California')
    expect(getDepartmentName('60601')).toBe('Illinois')
  })

  it('should return state name from state abbreviation', () => {
    expect(getDepartmentName('NY')).toBe('New York')
    expect(getDepartmentName('CA')).toBe('California')
    expect(getDepartmentName('TX')).toBe('Texas')
    expect(getDepartmentName('DC')).toBe('District of Columbia')
  })

  it('should return the input if it is already a state name', () => {
    expect(getDepartmentName('California')).toBe('California')
    expect(getDepartmentName('New York')).toBe('New York')
  })

  it('should return null for invalid state code', () => {
    expect(getDepartmentName('XX')).toBeNull()
    expect(getDepartmentName('ZZ')).toBeNull()
  })
})

describe('getRegionName', () => {
  it('should return null for null input', () => {
    expect(getRegionName(null)).toBeNull()
  })

  it('should return null for undefined input', () => {
    expect(getRegionName(undefined)).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(getRegionName('')).toBeNull()
  })

  it('should return region name from ZIP code', () => {
    expect(getRegionName('10001')).toBe('Northeast')  // NY
    expect(getRegionName('90210')).toBe('West')        // CA
    expect(getRegionName('60601')).toBe('Midwest')     // IL
    expect(getRegionName('77001')).toBe('South')       // TX
  })

  it('should return region name from state abbreviation', () => {
    expect(getRegionName('NY')).toBe('Northeast')
    expect(getRegionName('CA')).toBe('West')
    expect(getRegionName('IL')).toBe('Midwest')
    expect(getRegionName('TX')).toBe('South')
  })

  it('should return the input if it is already a region name', () => {
    expect(getRegionName('Northeast')).toBe('Northeast')
    expect(getRegionName('Midwest')).toBe('Midwest')
  })

  it('should return null for invalid state code', () => {
    expect(getRegionName('XX')).toBeNull()
    expect(getRegionName('ZZ')).toBeNull()
  })
})

describe('getGeographyFromPostal', () => {
  it('should return null values for null input', () => {
    const result = getGeographyFromPostal(null)
    expect(result.departmentCode).toBeNull()
    expect(result.departmentName).toBeNull()
    expect(result.regionName).toBeNull()
  })

  it('should return full geography info for valid ZIP code', () => {
    const result = getGeographyFromPostal('10001')
    expect(result.departmentCode).toBe('NY')
    expect(result.departmentName).toBe('New York')
    expect(result.regionName).toBe('Northeast')
  })

  it('should handle West Coast ZIP codes', () => {
    const result = getGeographyFromPostal('90210')
    expect(result.departmentCode).toBe('CA')
    expect(result.departmentName).toBe('California')
    expect(result.regionName).toBe('West')
  })

  it('should handle DC ZIP codes', () => {
    const result = getGeographyFromPostal('20001')
    expect(result.departmentCode).toBe('DC')
    expect(result.departmentName).toBe('District of Columbia')
    expect(result.regionName).toBe('South')
  })
})

describe('backward compatibility aliases', () => {
  it('DEPARTMENTS should be same as US_STATES', () => {
    expect(DEPARTMENTS).toBe(US_STATES)
  })

  it('DEPT_TO_REGION should be same as STATE_TO_REGION', () => {
    expect(DEPT_TO_REGION).toBe(STATE_TO_REGION)
  })
})

describe('US_STATES', () => {
  it('should contain 51 entries (50 states + DC)', () => {
    expect(Object.keys(US_STATES).length).toBe(51)
  })

  it('should map abbreviations to full names', () => {
    expect(US_STATES['NY']).toBe('New York')
    expect(US_STATES['CA']).toBe('California')
    expect(US_STATES['DC']).toBe('District of Columbia')
  })
})

describe('STATE_TO_REGION', () => {
  it('should map all 51 entries to regions', () => {
    expect(Object.keys(STATE_TO_REGION).length).toBe(51)
  })

  it('should only contain valid region names', () => {
    const validRegions = new Set(['Northeast', 'Midwest', 'South', 'West'])
    Object.values(STATE_TO_REGION).forEach(region => {
      expect(validRegions.has(region)).toBe(true)
    })
  })
})

describe('REGIONS', () => {
  it('should contain 4 US Census regions', () => {
    expect(REGIONS.length).toBe(4)
  })

  it('should have slugified names', () => {
    const regionNames = REGIONS.map(r => r.name)
    expect(regionNames).toContain('Northeast')
    expect(regionNames).toContain('Midwest')
    expect(regionNames).toContain('South')
    expect(regionNames).toContain('West')
  })
})

describe('slugify', () => {
  it('should convert text to lowercase', () => {
    expect(slugify('California')).toBe('california')
    expect(slugify('NEW YORK')).toBe('new-york')
  })

  it('should replace spaces with hyphens', () => {
    expect(slugify('New York')).toBe('new-york')
    expect(slugify('North Carolina')).toBe('north-carolina')
  })

  it('should handle special characters', () => {
    expect(slugify('District of Columbia')).toBe('district-of-columbia')
  })
})
