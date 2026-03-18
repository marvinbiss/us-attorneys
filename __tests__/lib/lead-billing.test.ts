/**
 * Tests for src/lib/billing/lead-billing.ts
 *
 * Covers:
 * - LEAD_PRICES constants
 * - trackLeadCharge: success, failure, amount override
 * - getMonthlyLeadCharges: aggregation, breakdown by type, error handling
 * - markChargesBilled: update, empty array, error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mocks
const { mockInsert, mockSelect, mockEq, mockGte, mockOrder, mockSingle, mockUpdate, mockIn } =
  vi.hoisted(() => ({
    mockInsert: vi.fn(),
    mockSelect: vi.fn(),
    mockEq: vi.fn(),
    mockGte: vi.fn(),
    mockOrder: vi.fn(),
    mockSingle: vi.fn(),
    mockUpdate: vi.fn(),
    mockIn: vi.fn(),
  }))

// Build chainable mock — use a proxy-like approach to avoid circular reference at init
const chainMock: Record<string, any> = {}
chainMock.insert = mockInsert.mockImplementation(() => chainMock)
chainMock.select = mockSelect.mockImplementation(() => chainMock)
chainMock.eq = mockEq.mockImplementation(() => chainMock)
chainMock.gte = mockGte.mockImplementation(() => chainMock)
chainMock.order = mockOrder
chainMock.single = mockSingle
chainMock.update = mockUpdate.mockImplementation(() => chainMock)
chainMock.in = mockIn

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => chainMock,
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import {
  LEAD_PRICES,
  trackLeadCharge,
  getMonthlyLeadCharges,
  markChargesBilled,
} from '@/lib/billing/lead-billing'

// ---------------------------------------------------------------------------
// LEAD_PRICES
// ---------------------------------------------------------------------------

describe('LEAD_PRICES', () => {
  it('has correct prices for all lead types', () => {
    expect(LEAD_PRICES.standard).toBe(25)
    expect(LEAD_PRICES.premium).toBe(50)
    expect(LEAD_PRICES.voice).toBe(75)
    expect(LEAD_PRICES.exclusive).toBe(100)
  })

  it('has exactly 4 lead types', () => {
    expect(Object.keys(LEAD_PRICES)).toHaveLength(4)
  })
})

// ---------------------------------------------------------------------------
// trackLeadCharge
// ---------------------------------------------------------------------------

describe('trackLeadCharge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts a pending charge and returns charge ID', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'charge-1' }, error: null })

    const result = await trackLeadCharge('att-1', 'lead-1', 'standard')
    expect(result).toBe('charge-1')
    expect(mockInsert).toHaveBeenCalledWith({
      attorney_id: 'att-1',
      lead_id: 'lead-1',
      lead_type: 'standard',
      amount_cents: 2500,
      status: 'pending',
    })
  })

  it('uses correct price for premium leads', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'charge-2' }, error: null })

    await trackLeadCharge('att-1', 'lead-2', 'premium')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ amount_cents: 5000, lead_type: 'premium' })
    )
  })

  it('uses correct price for exclusive leads', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'charge-3' }, error: null })

    await trackLeadCharge('att-1', 'lead-3', 'exclusive')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ amount_cents: 10000 })
    )
  })

  it('uses correct price for voice leads', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'charge-4' }, error: null })

    await trackLeadCharge('att-1', 'lead-4', 'voice')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ amount_cents: 7500 })
    )
  })

  it('respects amountCentsOverride', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'charge-5' }, error: null })

    await trackLeadCharge('att-1', 'lead-5', 'standard', 999)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ amount_cents: 999 })
    )
  })

  it('defaults to standard lead type', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'charge-6' }, error: null })

    await trackLeadCharge('att-1', 'lead-6')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ lead_type: 'standard', amount_cents: 2500 })
    )
  })

  it('returns null on database error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const result = await trackLeadCharge('att-1', 'lead-err')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getMonthlyLeadCharges
// ---------------------------------------------------------------------------

describe('getMonthlyLeadCharges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates charges correctly', async () => {
    const charges = [
      { id: '1', lead_type: 'standard', amount_cents: 2500, status: 'pending' },
      { id: '2', lead_type: 'standard', amount_cents: 2500, status: 'pending' },
      { id: '3', lead_type: 'premium', amount_cents: 5000, status: 'billed' },
      { id: '4', lead_type: 'exclusive', amount_cents: 10000, status: 'pending' },
    ]
    mockOrder.mockResolvedValue({ data: charges, error: null })

    const result = await getMonthlyLeadCharges('att-1')
    expect(result.totalCents).toBe(20000)
    expect(result.totalUsd).toBe(200)
    expect(result.chargeCount).toBe(4)
    expect(result.byType.standard).toEqual({ count: 2, totalCents: 5000 })
    expect(result.byType.premium).toEqual({ count: 1, totalCents: 5000 })
    expect(result.byType.exclusive).toEqual({ count: 1, totalCents: 10000 })
    expect(result.byType.voice).toEqual({ count: 0, totalCents: 0 })
  })

  it('returns zeroes when no charges exist', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const result = await getMonthlyLeadCharges('att-new')
    expect(result.totalCents).toBe(0)
    expect(result.totalUsd).toBe(0)
    expect(result.chargeCount).toBe(0)
  })

  it('returns zeroes on database error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'timeout' } })

    const result = await getMonthlyLeadCharges('att-err')
    expect(result.totalCents).toBe(0)
    expect(result.chargeCount).toBe(0)
    expect(result.byType.standard).toEqual({ count: 0, totalCents: 0 })
  })

  it('handles null charges array gracefully', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })

    const result = await getMonthlyLeadCharges('att-null')
    // charges || [] handles this
    expect(result.chargeCount).toBe(0)
  })

  it('defaults unknown lead_type to standard', async () => {
    const charges = [
      { id: '1', lead_type: null, amount_cents: 2500, status: 'pending' },
    ]
    mockOrder.mockResolvedValue({ data: charges, error: null })

    const result = await getMonthlyLeadCharges('att-1')
    expect(result.byType.standard.count).toBe(1)
  })

  it('filters by current month start date', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    await getMonthlyLeadCharges('att-1')
    // Verify gte was called (for month filtering)
    expect(mockGte).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// markChargesBilled
// ---------------------------------------------------------------------------

describe('markChargesBilled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing for empty charge array', async () => {
    await markChargesBilled([], 'inv-1')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('updates charges with billed status and invoice ID', async () => {
    mockIn.mockResolvedValue({ error: null })

    await markChargesBilled(['c1', 'c2'], 'inv-123')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'billed',
        stripe_invoice_id: 'inv-123',
      })
    )
    expect(mockIn).toHaveBeenCalledWith('id', ['c1', 'c2'])
  })

  it('does not throw on database error', async () => {
    mockIn.mockResolvedValue({ error: { message: 'DB error' } })

    // Should not throw
    await expect(
      markChargesBilled(['c1'], 'inv-err')
    ).resolves.toBeUndefined()
  })
})
