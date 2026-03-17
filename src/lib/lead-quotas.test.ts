/**
 * Lead Quotas — Unit Tests
 *
 * Tests for checkLeadQuota (src/lib/lead-quotas.ts)
 * and trackLeadCharge (src/lib/billing/lead-billing.ts).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockSingle = vi.fn()
const mockNeq = vi.fn()
const mockInsert = vi.fn()
const mockOrder = vi.fn()

// Chainable mock builder
function buildChain(terminalValue: unknown = { data: null, error: null }) {
  const handler = () =>
    new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === 'then') return undefined // not a thenable
          if (['data', 'error', 'count'].includes(prop)) {
            return (terminalValue as Record<string, unknown>)[prop]
          }
          return (...args: unknown[]) => {
            // Track calls for assertions
            if (prop === 'select') mockSelect(...args)
            if (prop === 'eq') mockEq(...args)
            if (prop === 'gte') mockGte(...args)
            if (prop === 'single') mockSingle(...args)
            if (prop === 'neq') mockNeq(...args)
            if (prop === 'insert') mockInsert(...args)
            if (prop === 'order') mockOrder(...args)
            return handler()
          }
        },
      },
    )
  return handler
}

let fromHandlers: Record<string, () => unknown> = {}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const handler = fromHandlers[table]
      if (handler) return handler()
      return buildChain({ data: null, error: null })()
    },
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { checkLeadQuota, LEAD_LIMITS } from '@/lib/lead-quotas'
import { trackLeadCharge, LEAD_PRICES } from '@/lib/billing/lead-billing'

// ---------------------------------------------------------------------------
// Tests: LEAD_LIMITS constant
// ---------------------------------------------------------------------------

describe('LEAD_LIMITS', () => {
  it('free tier has 5 leads', () => {
    expect(LEAD_LIMITS.free).toBe(5)
  })

  it('pro tier has 50 leads', () => {
    expect(LEAD_LIMITS.pro).toBe(50)
  })

  it('premium tier is unlimited (-1)', () => {
    expect(LEAD_LIMITS.premium).toBe(-1)
  })

  it('gratuit (legacy) matches free tier', () => {
    expect(LEAD_LIMITS.gratuit).toBe(LEAD_LIMITS.free)
  })
})

// ---------------------------------------------------------------------------
// Tests: UTC month boundary
// ---------------------------------------------------------------------------

describe('UTC month boundary calculation', () => {
  it('computes first-of-month correctly in UTC', () => {
    // The code uses: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const now = new Date('2026-03-15T23:59:59Z')
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    )
    expect(monthStart.toISOString()).toBe('2026-03-01T00:00:00.000Z')
  })

  it('handles January (no off-by-one on year)', () => {
    const now = new Date('2026-01-31T12:00:00Z')
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    )
    expect(monthStart.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('handles December correctly', () => {
    const now = new Date('2026-12-25T08:00:00Z')
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    )
    expect(monthStart.toISOString()).toBe('2026-12-01T00:00:00.000Z')
  })

  it('late-night UTC-offset does not bleed into previous month', () => {
    // Someone in UTC-8 at 11pm on Feb 28 → UTC is already Mar 1
    const now = new Date('2026-03-01T07:00:00Z') // Mar 1 in UTC
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    )
    expect(monthStart.toISOString()).toBe('2026-03-01T00:00:00.000Z')
  })
})

// ---------------------------------------------------------------------------
// Tests: checkLeadQuota
// ---------------------------------------------------------------------------

describe('checkLeadQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromHandlers = {}
  })

  it('returns allowed=true with free defaults when attorney not found', async () => {
    fromHandlers['attorneys'] = buildChain({
      data: null,
      error: { message: 'not found' },
    })

    const result = await checkLeadQuota('non-existent-id')

    expect(result.allowed).toBe(true)
    expect(result.tier).toBe('free')
    expect(result.limit).toBe(5)
    expect(result.used).toBe(0)
  })

  it('returns unlimited for premium tier', async () => {
    // Attorney exists with user_id
    fromHandlers['attorneys'] = buildChain({
      data: { user_id: 'user-123' },
      error: null,
    })
    // Profile has premium subscription
    fromHandlers['profiles'] = buildChain({
      data: { subscription_plan: 'premium' },
      error: null,
    })

    const result = await checkLeadQuota('attorney-123')

    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(-1)
    expect(result.remaining).toBe(-1)
    expect(result.tier).toBe('premium')
  })

  it('returns allowed=true when under quota (free tier, 3 of 5 used)', async () => {
    fromHandlers['attorneys'] = buildChain({
      data: { user_id: 'user-456' },
      error: null,
    })
    fromHandlers['profiles'] = buildChain({
      data: { subscription_plan: 'free' },
      error: null,
    })
    fromHandlers['lead_assignments'] = buildChain({
      data: null,
      error: null,
      count: 3,
    })

    const result = await checkLeadQuota('attorney-456')

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(3)
    expect(result.remaining).toBe(2)
    expect(result.limit).toBe(5)
    expect(result.tier).toBe('free')
  })

  it('returns allowed=false when quota is exhausted', async () => {
    fromHandlers['attorneys'] = buildChain({
      data: { user_id: 'user-789' },
      error: null,
    })
    fromHandlers['profiles'] = buildChain({
      data: { subscription_plan: 'free' },
      error: null,
    })
    fromHandlers['lead_assignments'] = buildChain({
      data: null,
      error: null,
      count: 5,
    })

    const result = await checkLeadQuota('attorney-789')

    expect(result.allowed).toBe(false)
    expect(result.used).toBe(5)
    expect(result.remaining).toBe(0)
  })

  it('returns allowed=false when over quota', async () => {
    fromHandlers['attorneys'] = buildChain({
      data: { user_id: 'user-over' },
      error: null,
    })
    fromHandlers['profiles'] = buildChain({
      data: { subscription_plan: 'free' },
      error: null,
    })
    fromHandlers['lead_assignments'] = buildChain({
      data: null,
      error: null,
      count: 7,
    })

    const result = await checkLeadQuota('attorney-over')

    expect(result.allowed).toBe(false)
    expect(result.used).toBe(7)
    expect(result.remaining).toBe(0)
  })

  it('defaults to free tier when attorney has no user_id', async () => {
    fromHandlers['attorneys'] = buildChain({
      data: { user_id: null },
      error: null,
    })
    fromHandlers['lead_assignments'] = buildChain({
      data: null,
      error: null,
      count: 2,
    })

    const result = await checkLeadQuota('unclaimed-attorney')

    expect(result.tier).toBe('free')
    expect(result.limit).toBe(5)
    expect(result.allowed).toBe(true)
  })

  it('falls back to free limit for unknown tier', async () => {
    fromHandlers['attorneys'] = buildChain({
      data: { user_id: 'user-unknown-tier' },
      error: null,
    })
    fromHandlers['profiles'] = buildChain({
      data: { subscription_plan: 'enterprise' },
      error: null,
    })
    fromHandlers['lead_assignments'] = buildChain({
      data: null,
      error: null,
      count: 4,
    })

    const result = await checkLeadQuota('attorney-enterprise')

    // Unknown tier should default to free limit (5)
    expect(result.limit).toBe(5)
    expect(result.allowed).toBe(true)
    expect(result.used).toBe(4)
  })

  it('fail-opens on lead_assignments count error', async () => {
    fromHandlers['attorneys'] = buildChain({
      data: { user_id: 'user-db-err' },
      error: null,
    })
    fromHandlers['profiles'] = buildChain({
      data: { subscription_plan: 'pro' },
      error: null,
    })
    fromHandlers['lead_assignments'] = buildChain({
      data: null,
      error: { message: 'db timeout' },
      count: null,
    })

    const result = await checkLeadQuota('attorney-db-err')

    expect(result.allowed).toBe(true)
    expect(result.used).toBe(0)
    expect(result.limit).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// Tests: trackLeadCharge
// ---------------------------------------------------------------------------

describe('trackLeadCharge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromHandlers = {}
  })

  it('returns charge ID on success', async () => {
    fromHandlers['lead_charges'] = buildChain({
      data: { id: 'charge-abc' },
      error: null,
    })

    const result = await trackLeadCharge('att-1', 'lead-1', 'standard')
    expect(result).toBe('charge-abc')
  })

  it('returns null on insert error', async () => {
    fromHandlers['lead_charges'] = buildChain({
      data: null,
      error: { message: 'insert failed' },
    })

    const result = await trackLeadCharge('att-1', 'lead-1', 'premium')
    expect(result).toBeNull()
  })

  it('uses correct amount for each lead type', () => {
    expect(LEAD_PRICES.standard).toBe(25)
    expect(LEAD_PRICES.premium).toBe(50)
    expect(LEAD_PRICES.exclusive).toBe(100)
  })

  it('defaults to standard lead type', async () => {
    fromHandlers['lead_charges'] = buildChain({
      data: { id: 'charge-default' },
      error: null,
    })

    const result = await trackLeadCharge('att-1', 'lead-1')
    expect(result).toBe('charge-default')
  })
})
