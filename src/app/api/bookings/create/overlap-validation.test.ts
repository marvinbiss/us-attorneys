/**
 * Overlap Validation — Unit Tests
 *
 * Tests the temporal overlap detection logic used in POST /api/bookings/create.
 * The core check is:  requestedStart < existingEnd && requestedEnd > existingStart
 */

import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Extract the pure overlap-detection function from the route logic
// (lines 89-92 of route.ts) so we can test it without HTTP / Supabase.
// ---------------------------------------------------------------------------

interface Booking {
  scheduled_at: string
  duration_minutes: number | null
}

/**
 * Determines whether a requested time slot overlaps with ANY existing booking.
 * Mirrors the logic in route.ts exactly.
 */
function hasTemporalOverlap(
  requestedStart: Date,
  requestedDurationMinutes: number,
  existingBookings: Booking[],
): boolean {
  const requestedEnd = new Date(
    requestedStart.getTime() + requestedDurationMinutes * 60 * 1000,
  )

  return existingBookings.some((existing) => {
    const existingStart = new Date(existing.scheduled_at)
    const existingEnd = new Date(
      existingStart.getTime() + (existing.duration_minutes || 30) * 60 * 1000,
    )
    return requestedStart < existingEnd && requestedEnd > existingStart
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Booking overlap validation', () => {
  // ── Basic overlap scenarios ─────────────────────────────────────────

  it('detects two overlapping bookings', () => {
    // Existing: 10:00 – 10:30
    // Requested: 10:15 – 10:45  → overlaps
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: 30 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T10:15:00Z'),
      30,
      existing,
    )
    expect(result).toBe(true)
  })

  it('does NOT conflict for adjacent bookings (end === start)', () => {
    // Existing: 10:00 – 10:30
    // Requested: 10:30 – 11:00  → adjacent, NOT overlapping
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: 30 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T10:30:00Z'),
      30,
      existing,
    )
    expect(result).toBe(false)
  })

  it('does NOT conflict for bookings on different days', () => {
    // Existing: Apr 1 10:00 – 10:30
    // Requested: Apr 2 10:00 – 10:30
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: 30 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-02T10:00:00Z'),
      30,
      existing,
    )
    expect(result).toBe(false)
  })

  it('detects a booking entirely within another', () => {
    // Existing: 10:00 – 11:00 (60 min)
    // Requested: 10:15 – 10:45 (30 min)  → contained
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: 60 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T10:15:00Z'),
      30,
      existing,
    )
    expect(result).toBe(true)
  })

  it('detects conflict for exact same time slot', () => {
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T14:00:00Z', duration_minutes: 30 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T14:00:00Z'),
      30,
      existing,
    )
    expect(result).toBe(true)
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  it('returns false when there are no existing bookings', () => {
    const result = hasTemporalOverlap(
      new Date('2026-04-01T10:00:00Z'),
      30,
      [],
    )
    expect(result).toBe(false)
  })

  it('uses default 30-min duration when existing booking has null duration', () => {
    // Existing: 10:00 – 10:30 (null → defaults to 30)
    // Requested: 10:20 – 10:50  → overlaps
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: null },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T10:20:00Z'),
      30,
      existing,
    )
    expect(result).toBe(true)
  })

  it('detects overlap when requested booking wraps around an existing one', () => {
    // Existing: 10:15 – 10:45 (30 min)
    // Requested: 10:00 – 11:00 (60 min)  → wraps the existing
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:15:00Z', duration_minutes: 30 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T10:00:00Z'),
      60,
      existing,
    )
    expect(result).toBe(true)
  })

  it('detects overlap with at least one of multiple existing bookings', () => {
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T09:00:00Z', duration_minutes: 30 },
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: 30 },
      { scheduled_at: '2026-04-01T11:00:00Z', duration_minutes: 30 },
    ]
    // Requested 10:15 – 10:45 → overlaps the 10:00 booking
    const result = hasTemporalOverlap(
      new Date('2026-04-01T10:15:00Z'),
      30,
      existing,
    )
    expect(result).toBe(true)
  })

  it('does NOT conflict when requested is entirely before existing', () => {
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T14:00:00Z', duration_minutes: 30 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T13:00:00Z'),
      30,
      existing,
    )
    expect(result).toBe(false)
  })

  it('does NOT conflict when requested is entirely after existing', () => {
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: 30 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T11:00:00Z'),
      30,
      existing,
    )
    expect(result).toBe(false)
  })

  it('handles long-duration bookings (120 min)', () => {
    // Existing: 10:00 – 12:00 (120 min)
    // Requested: 11:30 – 12:00  → overlaps
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: 120 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T11:30:00Z'),
      30,
      existing,
    )
    expect(result).toBe(true)
  })

  it('adjacent in reverse (requested ends exactly when existing starts)', () => {
    // Requested: 09:30 – 10:00
    // Existing:  10:00 – 10:30  → adjacent, NOT overlapping
    const existing: Booking[] = [
      { scheduled_at: '2026-04-01T10:00:00Z', duration_minutes: 30 },
    ]
    const result = hasTemporalOverlap(
      new Date('2026-04-01T09:30:00Z'),
      30,
      existing,
    )
    expect(result).toBe(false)
  })
})
