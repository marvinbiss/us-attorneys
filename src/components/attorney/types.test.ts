import { describe, it, expect } from 'vitest'
import { getDisplayName, Artisan } from './types'

// Helper function to create a minimal valid Attorney object for testing
function createTestAttorney(overrides: Partial<Artisan> = {}): Artisan {
  return {
    id: 'test-id',
    business_name: null,
    first_name: null,
    last_name: null,
    city: 'New York',
    postal_code: '10001',
    specialty: 'Personal Injury',
    average_rating: 4.5,
    review_count: 10,
    is_verified: false,
    services: [],
    service_prices: [],
    ...overrides
  }
}

describe('getDisplayName', () => {
  it('should return business_name when is_center is true and business_name exists', () => {
    const attorney = createTestAttorney({
      is_center: true,
      business_name: 'Smith & Associates Law Firm',
      first_name: 'John',
      last_name: 'Smith'
    })
    expect(getDisplayName(attorney)).toBe('Smith & Associates Law Firm')
  })

  it('should return business_name when it exists (not a center)', () => {
    const attorney = createTestAttorney({
      is_center: false,
      business_name: 'Smith Legal Services',
      first_name: 'John',
      last_name: 'Smith'
    })
    expect(getDisplayName(attorney)).toBe('Smith Legal Services')
  })

  it('should return full name when no business_name', () => {
    const attorney = createTestAttorney({
      business_name: null,
      first_name: 'John',
      last_name: 'Smith'
    })
    expect(getDisplayName(attorney)).toBe('John Smith')
  })

  it('should return first_name only when last_name is null', () => {
    const attorney = createTestAttorney({
      business_name: null,
      first_name: 'John',
      last_name: null
    })
    expect(getDisplayName(attorney)).toBe('John')
  })

  it('should return last_name only when first_name is null', () => {
    const attorney = createTestAttorney({
      business_name: null,
      first_name: null,
      last_name: 'Smith'
    })
    expect(getDisplayName(attorney)).toBe('Smith')
  })

  it('should return "Attorney" as fallback when no names are available', () => {
    const attorney = createTestAttorney({
      business_name: null,
      first_name: null,
      last_name: null
    })
    expect(getDisplayName(attorney)).toBe('Attorney')
  })

  it('should return "Attorney" when names are empty strings', () => {
    const attorney = createTestAttorney({
      business_name: null,
      first_name: '',
      last_name: ''
    })
    expect(getDisplayName(attorney)).toBe('Attorney')
  })

  it('should trim whitespace from name', () => {
    const attorney = createTestAttorney({
      business_name: null,
      first_name: '  John  ',
      last_name: '  Smith  '
    })
    // The function concatenates and trims the outer whitespace
    const result = getDisplayName(attorney)
    expect(result.startsWith('John')).toBe(true)
    expect(result.endsWith('Smith')).toBe(true)
  })

  it('should prefer business_name over personal names for centers', () => {
    const attorney = createTestAttorney({
      is_center: true,
      business_name: 'My Law Firm',
      first_name: 'John',
      last_name: 'Smith'
    })
    expect(getDisplayName(attorney)).toBe('My Law Firm')
  })

  it('should handle is_center true but no business_name', () => {
    const attorney = createTestAttorney({
      is_center: true,
      business_name: null,
      first_name: 'John',
      last_name: 'Smith'
    })
    expect(getDisplayName(attorney)).toBe('John Smith')
  })
})
