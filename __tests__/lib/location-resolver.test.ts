import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  isZipSlug,
  extractZipCode,
  buildZipSlug,
} from '@/lib/location-resolver'

// ---------------------------------------------------------------------------
// isZipSlug
// ---------------------------------------------------------------------------
describe('isZipSlug', () => {
  it('returns true for valid ZIP slug format', () => {
    expect(isZipSlug('10001-new-york-ny')).toBe(true)
    expect(isZipSlug('90210-beverly-hills-ca')).toBe(true)
    expect(isZipSlug('00501-holtsville-ny')).toBe(true)
  })

  it('returns false for city slugs', () => {
    expect(isZipSlug('new-york')).toBe(false)
    expect(isZipSlug('los-angeles')).toBe(false)
    expect(isZipSlug('chicago')).toBe(false)
  })

  it('returns false for partial ZIP codes (less than 5 digits)', () => {
    expect(isZipSlug('1234-city-st')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isZipSlug('')).toBe(false)
  })

  it('returns false for string starting with letters', () => {
    expect(isZipSlug('abc-12345')).toBe(false)
  })

  it('returns true when slug starts with 5 digits followed by hyphen', () => {
    expect(isZipSlug('12345-')).toBe(true)
    expect(isZipSlug('12345-a')).toBe(true)
  })

  it('returns false for 5+ digit numbers without hyphen', () => {
    expect(isZipSlug('12345')).toBe(false)
  })

  it('returns false for 6-digit prefix with hyphen', () => {
    // The 6th char must be a hyphen for isZipSlug to match
    expect(isZipSlug('123456-city-st')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// extractZipCode
// ---------------------------------------------------------------------------
describe('extractZipCode', () => {
  it('extracts 5-digit ZIP code from slug', () => {
    expect(extractZipCode('10001-new-york-ny')).toBe('10001')
    expect(extractZipCode('90210-beverly-hills-ca')).toBe('90210')
  })

  it('extracts first 5 characters regardless of format', () => {
    expect(extractZipCode('12345')).toBe('12345')
  })

  it('handles ZIP codes starting with zero', () => {
    expect(extractZipCode('00501-holtsville-ny')).toBe('00501')
    expect(extractZipCode('02176-melrose-ma')).toBe('02176')
  })
})

// ---------------------------------------------------------------------------
// buildZipSlug
// ---------------------------------------------------------------------------
describe('buildZipSlug', () => {
  it('builds slug from standard components', () => {
    expect(buildZipSlug('10001', 'New York', 'NY')).toBe('10001-new-york-ny')
  })

  it('handles city names with special characters', () => {
    expect(buildZipSlug('63101', "St. Louis", 'MO')).toBe('63101-st-louis-mo')
  })

  it('handles city names with multiple spaces', () => {
    expect(buildZipSlug('90210', 'Beverly Hills', 'CA')).toBe('90210-beverly-hills-ca')
  })

  it('lowercases state code', () => {
    const result = buildZipSlug('10001', 'New York', 'NY')
    expect(result).toMatch(/-ny$/)
  })

  it('strips leading/trailing hyphens from city part', () => {
    expect(buildZipSlug('12345', '-Test-', 'TX')).toBe('12345-test-tx')
  })

  it('handles apostrophes in city names', () => {
    expect(buildZipSlug('02176', "O'Brien", 'MA')).toBe('02176-o-brien-ma')
  })

  it('handles single-word city names', () => {
    expect(buildZipSlug('60601', 'Chicago', 'IL')).toBe('60601-chicago-il')
  })

  it('handles uppercase city names', () => {
    expect(buildZipSlug('77001', 'HOUSTON', 'TX')).toBe('77001-houston-tx')
  })

  it('handles empty city name', () => {
    expect(buildZipSlug('12345', '', 'TX')).toBe('12345--tx')
  })

  it('roundtrips with extractZipCode + isZipSlug', () => {
    const slug = buildZipSlug('10001', 'New York', 'NY')
    expect(isZipSlug(slug)).toBe(true)
    expect(extractZipCode(slug)).toBe('10001')
  })

  it('roundtrips for multiple cities', () => {
    const cities = [
      { zip: '90210', city: 'Beverly Hills', state: 'CA' },
      { zip: '60601', city: 'Chicago', state: 'IL' },
      { zip: '02101', city: 'Boston', state: 'MA' },
      { zip: '33101', city: 'Miami', state: 'FL' },
    ]
    for (const { zip, city, state } of cities) {
      const slug = buildZipSlug(zip, city, state)
      expect(isZipSlug(slug)).toBe(true)
      expect(extractZipCode(slug)).toBe(zip)
    }
  })
})

// ---------------------------------------------------------------------------
// resolveZipToCity — slug guard + IS_BUILD guard
// The DB integration (lazy require) is tested via supabase-zip.test.ts.
// Here we test the function's guard clauses.
// ---------------------------------------------------------------------------
describe('resolveZipToCity', () => {
  it('returns null for non-ZIP slugs (guard clause)', async () => {
    const { resolveZipToCity } = await import('@/lib/location-resolver')
    const result = await resolveZipToCity('new-york')
    expect(result).toBeNull()
  })

  it('returns null for city-style slugs', async () => {
    const { resolveZipToCity } = await import('@/lib/location-resolver')
    const result = await resolveZipToCity('los-angeles')
    expect(result).toBeNull()
  })

  it('returns null for empty string', async () => {
    const { resolveZipToCity } = await import('@/lib/location-resolver')
    const result = await resolveZipToCity('')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// resolveZipToCity — IS_BUILD guard
// ---------------------------------------------------------------------------
describe('resolveZipToCity with IS_BUILD', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns null during build phase', async () => {
    process.env.NEXT_BUILD_SKIP_DB = '1'
    vi.doMock('@/lib/cache', () => ({
      getCachedData: vi.fn((_k: string, fn: () => Promise<unknown>) => fn()),
      CACHE_TTL: { locations: 604800 },
    }))
    vi.doMock('@/lib/logger', () => {
      const stub = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }
      return {
        logger: { ...stub, child: vi.fn(() => stub) },
        dbLogger: stub,
      }
    })

    const mod = await import('@/lib/location-resolver')
    const result = await mod.resolveZipToCity('10001-new-york-ny')
    expect(result).toBeNull()

    delete process.env.NEXT_BUILD_SKIP_DB
  })
})
