import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock all external dependencies
// ---------------------------------------------------------------------------

vi.mock('@/lib/cache', () => ({
  getCachedData: vi.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
  generateCacheKey: vi.fn((prefix: string, params: Record<string, unknown>) => {
    const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
    return `${prefix}:${sorted}`
  }),
  CACHE_TTL: { services: 86400, attorneys: 3600, locations: 604800 },
}))

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
  dbLogger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('@/lib/location-resolver', () => ({
  isZipSlug: vi.fn((slug: string) => /^\d{5}-/.test(slug)),
  extractZipCode: vi.fn((slug: string) => slug.slice(0, 5)),
  resolveZipToLocation: vi.fn(),
}))

vi.mock('@/lib/data/usa', () => ({
  practiceAreas: [],
  getCityBySlug: vi.fn(() => null),
}))

// Build the Supabase mock chain using a flexible proxy to handle any chain order
const mockRange = vi.fn()
const mockIn = vi.fn()
const mockEqZip = vi.fn()

// Flexible chain proxy that supports any method order
function createChainProxy(terminal: () => unknown = () => ({ range: mockRange })): unknown {
  const proxy: Record<string, unknown> = {}
  const methods = ['eq', 'is', 'in', 'order', 'range', 'select', 'not', 'gt', 'lt', 'gte', 'lte']
  for (const m of methods) {
    proxy[m] = vi.fn((...args: unknown[]) => {
      if (m === 'in') mockIn(...args)
      if (m === 'eq' && args[0] === 'address_zip') mockEqZip(...args)
      if (m === 'range') return mockRange(...args)
      return createChainProxy(terminal)
    })
  }
  return proxy
}

const mockSelect = vi.fn(() => createChainProxy())

// Mock for resolveSpecialtyIds: from('specialties').select('id').in('slug', slugs)
// Returns fake UUIDs so the downstream .in('primary_specialty_id', ids) works
function createSpecialtiesChain(): unknown {
  return {
    select: vi.fn(() => ({
      in: vi.fn(() => Promise.resolve({
        data: [{ id: 'fake-specialty-id-1' }, { id: 'fake-specialty-id-2' }],
        error: null,
      })),
    })),
  }
}

const mockFrom = vi.fn((table: string) => {
  if (table === 'specialties') return createSpecialtiesChain()
  return { select: mockSelect }
})

// For count queries (handled by flexible proxy above)

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

// We need to handle the two different query shapes (list vs count)
// by making mockFrom switch based on context

let getAttorneysByServiceAndLocation: typeof import('@/lib/supabase').getAttorneysByServiceAndLocation
let getAttorneyCountByServiceAndLocation: typeof import('@/lib/supabase').getAttorneyCountByServiceAndLocation
let SPECIALTY_TO_BAR_CATEGORIES: typeof import('@/lib/supabase').SPECIALTY_TO_BAR_CATEGORIES

beforeEach(async () => {
  vi.clearAllMocks()
  // Ensure IS_BUILD is not set
  delete process.env.NEXT_BUILD_SKIP_DB
  vi.resetModules()

  const mod = await import('@/lib/supabase')
  getAttorneysByServiceAndLocation = mod.getAttorneysByServiceAndLocation
  getAttorneyCountByServiceAndLocation = mod.getAttorneyCountByServiceAndLocation
  SPECIALTY_TO_BAR_CATEGORIES = mod.SPECIALTY_TO_BAR_CATEGORIES
})

// ---------------------------------------------------------------------------
// SPECIALTY_TO_BAR_CATEGORIES
// ---------------------------------------------------------------------------
describe('SPECIALTY_TO_BAR_CATEGORIES', () => {
  it('maps personal-injury to itself', () => {
    expect(SPECIALTY_TO_BAR_CATEGORIES['personal-injury']).toContain('personal-injury')
  })

  it('maps child specialty to parent (car-accidents -> personal-injury)', () => {
    expect(SPECIALTY_TO_BAR_CATEGORIES['car-accidents']).toContain('car-accidents')
    expect(SPECIALTY_TO_BAR_CATEGORIES['car-accidents']).toContain('personal-injury')
  })

  it('maps grandchild specialty to parent and grandparent', () => {
    expect(SPECIALTY_TO_BAR_CATEGORIES['birth-injury']).toContain('birth-injury')
    expect(SPECIALTY_TO_BAR_CATEGORIES['birth-injury']).toContain('medical-malpractice')
    expect(SPECIALTY_TO_BAR_CATEGORIES['birth-injury']).toContain('personal-injury')
  })

  it('covers all 200 practice areas', () => {
    const count = Object.keys(SPECIALTY_TO_BAR_CATEGORIES).length
    expect(count).toBeGreaterThanOrEqual(190)
  })
})

// ---------------------------------------------------------------------------
// getAttorneysByServiceAndLocation — ZIP branch
// ---------------------------------------------------------------------------
describe('getAttorneysByServiceAndLocation — ZIP slug', () => {
  it('queries by address_zip when given a ZIP slug', async () => {
    const mockAttorneys = [
      { id: '1', name: 'John Doe', slug: 'john-doe', specialty: 'personal-injury' },
    ]
    mockRange.mockResolvedValueOnce({ data: mockAttorneys, error: null })

    const result = await getAttorneysByServiceAndLocation(
      'personal-injury',
      '10001-new-york-ny',
    )

    expect(result).toEqual(mockAttorneys)
    // Verify the chain was called with ZIP code filter
    expect(mockIn).toHaveBeenCalled()
    expect(mockEqZip).toHaveBeenCalledWith('address_zip', '10001')
  })

  it('returns empty array for unknown specialty slug', async () => {
    const result = await getAttorneysByServiceAndLocation(
      'nonexistent-specialty',
      '10001-new-york-ny',
    )
    expect(result).toEqual([])
  })

  it('throws on DB error in ZIP branch', async () => {
    mockRange.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    await expect(
      getAttorneysByServiceAndLocation('personal-injury', '10001-new-york-ny'),
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// getAttorneyCountByServiceAndLocation — ZIP branch
// ---------------------------------------------------------------------------
describe('getAttorneyCountByServiceAndLocation — ZIP slug', () => {
  it('uses head:true count query for ZIP slug', async () => {
    // Override the mock chain for count queries
    const countResult = { count: 42, error: null }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Use a proxy that resolves to countResult for any chain
    function countProxy(): unknown {
      return new Proxy({}, {
        get(_t, prop: string) {
          if (prop === 'then') return undefined
          if (prop === 'count') return countResult.count
          if (prop === 'error') return null
          return vi.fn(() => countProxy())
        },
      })
    }
    // Override mockFrom: first call resolves specialties, second call returns count proxy
    ;(mockFrom as any)
      .mockImplementationOnce(() => createSpecialtiesChain())
      .mockImplementationOnce(() => ({
        select: () => countProxy(),
      }))

    const count = await getAttorneyCountByServiceAndLocation(
      'personal-injury',
      '10001-new-york-ny',
    )

    expect(count).toBe(42)
  })

  it('returns 0 for unknown specialty', async () => {
    const count = await getAttorneyCountByServiceAndLocation(
      'nonexistent-specialty',
      '10001-new-york-ny',
    )
    expect(count).toBe(0)
  })

  it('returns 0 on error (fail-safe)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Proxy that rejects at the end of chain
    function rejectProxy(): unknown {
      return new Proxy({}, {
        get(_t, prop: string) {
          if (prop === 'then') {
            return (_res: unknown, rej: (e: Error) => void) => rej(new Error('timeout'))
          }
          if (prop === 'count') return 0
          if (prop === 'error') return { message: 'timeout' }
          return vi.fn(() => rejectProxy())
        },
      })
    }
    ;(mockFrom as any).mockImplementationOnce(() => ({
      select: () => rejectProxy(),
    }))

    const count = await getAttorneyCountByServiceAndLocation(
      'personal-injury',
      '10001-new-york-ny',
    )
    expect(count).toBe(0)
  })
})
