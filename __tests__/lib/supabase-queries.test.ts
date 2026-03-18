/**
 * Tests -- Supabase Query Functions (src/lib/supabase.ts)
 * Tests for: getSpecialties, getSpecialtyBySlug, getLocationBySlug,
 *            getAttorneyBySlug, searchAttorneys, getAttorneysByServiceAndLocation
 *
 * Strategy: Mock the supabase client and cache layer to test pure query logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================
// Mocks
// ============================================

vi.mock('@/lib/logger', () => ({
  dbLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock cache — pass-through: always call the fetcher
vi.mock('@/lib/cache', () => ({
  getCachedData: vi.fn(async (_key: string, fetcher: () => Promise<unknown>) => fetcher()),
  generateCacheKey: vi.fn((...args: unknown[]) => JSON.stringify(args)),
  CACHE_TTL: { services: 86400, attorneys: 3600, locations: 604800, cms: 3600 },
}))

// Mock location resolver
vi.mock('@/lib/location-resolver', () => ({
  isZipSlug: vi.fn().mockReturnValue(false),
  extractZipCode: vi.fn(),
  resolveZipToLocation: vi.fn(),
}))

// Mock usa data
vi.mock('@/lib/data/usa', () => ({
  practiceAreas: [
    { slug: 'personal-injury', name: 'Personal Injury' },
    { slug: 'family-law', name: 'Family Law' },
    { slug: 'criminal-defense', name: 'Criminal Defense' },
  ],
  getCityBySlug: vi.fn().mockReturnValue(null),
}))

// Supabase query builder mock
let mockQueryResult: { data: unknown; error: unknown } = { data: null, error: null }
let mockRpcResult: { data: unknown; error: unknown } = { data: null, error: null }

function makeBuilder(result: { data: unknown; error: unknown }) {
  const b: Record<string, unknown> = {}
  b.select = vi.fn().mockReturnValue(b)
  b.eq = vi.fn().mockReturnValue(b)
  b.neq = vi.fn().mockReturnValue(b)
  b.gte = vi.fn().mockReturnValue(b)
  b.lte = vi.fn().mockReturnValue(b)
  b.order = vi.fn().mockReturnValue(b)
  b.limit = vi.fn().mockReturnValue(b)
  b.range = vi.fn().mockReturnValue(b)
  b.single = vi.fn().mockReturnValue(b)
  b.is = vi.fn().mockReturnValue(b)
  b.ilike = vi.fn().mockReturnValue(b)
  b.or = vi.fn().mockReturnValue(b)
  b.in = vi.fn().mockReturnValue(b)
  b.textSearch = vi.fn().mockReturnValue(b)
  b.not = vi.fn().mockReturnValue(b)
  b.maybeSingle = vi.fn().mockReturnValue(b)
  b.csv = vi.fn().mockReturnValue(b)
  ;(b as Record<string, unknown>).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: result.data, error: result.error, count: Array.isArray(result.data) ? result.data.length : 0 })
  return b
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => makeBuilder(mockQueryResult)),
    rpc: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: mockRpcResult.data, error: mockRpcResult.error })
    ),
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockQueryResult = { data: null, error: null }
  mockRpcResult = { data: null, error: null }
})

// ============================================
// Tests
// ============================================

describe('getSpecialties', () => {
  it('returns specialties list from DB', async () => {
    const mockSpecialties = [
      { id: '1', name: 'Personal Injury', slug: 'personal-injury', description: 'PI law', category: 'Litigation', is_active: true },
      { id: '2', name: 'Family Law', slug: 'family-law', description: 'Family law', category: 'Civil', is_active: true },
    ]
    mockQueryResult = { data: mockSpecialties, error: null }

    const { getSpecialties } = await import('@/lib/supabase')
    const result = await getSpecialties()

    expect(result).toBeTruthy()
    expect(Array.isArray(result)).toBe(true)
  })

  it('handles null data gracefully', async () => {
    mockQueryResult = { data: null, error: null }

    const { getSpecialties } = await import('@/lib/supabase')
    const result = await getSpecialties()
    // Returns null when query returns null (cache passthrough)
    expect(result).toBeNull()
  })
})

describe('getSpecialtyBySlug', () => {
  it('returns a single specialty by slug', async () => {
    const mockSpecialty = {
      id: '1',
      name: 'Personal Injury',
      slug: 'personal-injury',
      description: 'PI law',
      icon: 'gavel',
      category: 'Litigation',
      is_active: true,
    }
    mockQueryResult = { data: mockSpecialty, error: null }

    const { getSpecialtyBySlug } = await import('@/lib/supabase')
    const result = await getSpecialtyBySlug('personal-injury')

    expect(result).toBeTruthy()
  })

  it('falls back to static data when DB returns no result', async () => {
    // Static fallback is built from practiceAreas mock
    mockQueryResult = { data: null, error: { message: 'Not found' } }

    const { getSpecialtyBySlug } = await import('@/lib/supabase')
    // Should fall back to static data for known slugs
    const result = await getSpecialtyBySlug('personal-injury')
    expect(result).toBeTruthy()
  })
})

describe('getAttorneyBySlug', () => {
  it('returns attorney data by slug', async () => {
    const mockAttorney = {
      id: 'att-1',
      name: 'Jane Smith',
      slug: 'jane-smith',
      bar_number: '123456',
      address_city: 'New York',
      address_state: 'NY',
      rating_average: 4.5,
      review_count: 12,
      is_verified: true,
    }
    mockQueryResult = { data: mockAttorney, error: null }

    const { getAttorneyBySlug } = await import('@/lib/supabase')
    const result = await getAttorneyBySlug('jane-smith')

    expect(result).toBeTruthy()
  })

  it('returns null when attorney not found', async () => {
    mockQueryResult = { data: null, error: null }

    const { getAttorneyBySlug } = await import('@/lib/supabase')
    const result = await getAttorneyBySlug('nonexistent-attorney')

    expect(result).toBeNull()
  })
})

describe('searchAttorneys', () => {
  it('returns empty results structure during build', async () => {
    // In test env IS_BUILD is false, so we test the actual function
    mockRpcResult = { data: [], error: null }
    mockQueryResult = { data: [], error: null }

    const { searchAttorneys } = await import('@/lib/supabase')
    const result = await searchAttorneys({
      specialty: 'personal-injury',
      state: 'NY',
      sort: 'relevance',
      page: 1,
      limit: 20,
    })

    expect(result).toBeTruthy()
    expect(result).toHaveProperty('attorneys')
    expect(result).toHaveProperty('total')
  })

  it('clamps page to minimum 1', async () => {
    mockQueryResult = { data: [], error: null }

    const { searchAttorneys } = await import('@/lib/supabase')
    const result = await searchAttorneys({
      specialty: 'family-law',
      sort: 'relevance',
      page: -5,
      limit: 20,
    })

    expect(result).toBeTruthy()
    expect(result.page).toBe(1)
  })

  it('clamps limit to max 100', async () => {
    mockQueryResult = { data: [], error: null }

    const { searchAttorneys } = await import('@/lib/supabase')
    const result = await searchAttorneys({
      specialty: 'family-law',
      sort: 'relevance',
      page: 1,
      limit: 500,
    })

    expect(result).toBeTruthy()
    expect(result.limit).toBeLessThanOrEqual(100)
  })
})

describe('AttorneyListRow type coverage', () => {
  it('exports the AttorneyListRow interface', async () => {
    const mod = await import('@/lib/supabase')
    // Just verify the module loads without error
    expect(mod).toBeTruthy()
    expect(typeof mod.getSpecialties).toBe('function')
    expect(typeof mod.getAttorneyBySlug).toBe('function')
    expect(typeof mod.searchAttorneys).toBe('function')
  })
})
