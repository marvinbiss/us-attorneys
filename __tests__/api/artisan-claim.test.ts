/**
 * Tests for Attorney Claim API
 * Validates bar number schema, claim request validation, and edge cases
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Replicate the claim schema from the API route for isolated testing
const claimSchema = z.object({
  providerId: z.string().uuid('Invalid attorney ID'),
  siret: z.string().regex(/^\d{14}$/, 'Bar number must contain exactly 14 digits'),
})

// ============================================
// CLAIM SCHEMA VALIDATION
// ============================================

describe('claimSchema (attorney claim)', () => {
  describe('providerId', () => {
    it('should accept a valid UUID', () => {
      const result = claimSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        siret: '12345678901234',
      })
      expect(result.success).toBe(true)
    })

    it('should reject an invalid UUID', () => {
      const result = claimSchema.safeParse({
        providerId: 'not-a-uuid',
        siret: '12345678901234',
      })
      expect(result.success).toBe(false)
    })

    it('should reject an empty string', () => {
      const result = claimSchema.safeParse({
        providerId: '',
        siret: '12345678901234',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('siret (bar number field)', () => {
    it('should accept a valid 14-digit bar number', () => {
      const result = claimSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        siret: '12345678901234',
      })
      expect(result.success).toBe(true)
    })

    it('should reject bar number with less than 14 digits', () => {
      const result = claimSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        siret: '1234567890123', // 13 digits
      })
      expect(result.success).toBe(false)
    })

    it('should reject bar number with more than 14 digits', () => {
      const result = claimSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        siret: '123456789012345', // 15 digits
      })
      expect(result.success).toBe(false)
    })

    it('should reject bar number with letters', () => {
      const result = claimSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        siret: '1234567890123A',
      })
      expect(result.success).toBe(false)
    })

    it('should reject bar number with spaces', () => {
      const result = claimSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        siret: '123 456 789 01234',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty bar number', () => {
      const result = claimSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
        siret: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('missing fields', () => {
    it('should reject missing providerId', () => {
      const result = claimSchema.safeParse({ siret: '12345678901234' })
      expect(result.success).toBe(false)
    })

    it('should reject missing siret', () => {
      const result = claimSchema.safeParse({
        providerId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty object', () => {
      const result = claimSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })
})

// ============================================
// BAR NUMBER NORMALIZATION
// ============================================

describe('Bar number normalization', () => {
  const normalizeSiret = (input: string) => input.replace(/\s/g, '')

  it('should strip spaces from bar number', () => {
    expect(normalizeSiret('123 456 789 01234')).toBe('12345678901234')
  })

  it('should handle bar number without spaces', () => {
    expect(normalizeSiret('12345678901234')).toBe('12345678901234')
  })

  it('should handle multiple spaces', () => {
    expect(normalizeSiret('1 2 3 4 5 6 7 8 9 0 1 2 3 4')).toBe('12345678901234')
  })

  it('should correctly compare matching bar numbers', () => {
    const input = '12345678901234'
    const stored = '12345678901234'
    expect(normalizeSiret(input)).toBe(normalizeSiret(stored))
  })

  it('should correctly detect mismatching bar numbers', () => {
    const input = '12345678901234'
    const stored = '98765432109876'
    expect(normalizeSiret(input)).not.toBe(normalizeSiret(stored))
  })
})

// ============================================
// ADMIN CLAIM ACTION SCHEMA
// ============================================

const claimActionSchema = z.object({
  claimId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
})

describe('claimActionSchema', () => {
  it('should accept approve action', () => {
    const result = claimActionSchema.safeParse({
      claimId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'approve',
    })
    expect(result.success).toBe(true)
  })

  it('should accept reject action with reason', () => {
    const result = claimActionSchema.safeParse({
      claimId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'reject',
      rejectionReason: 'Bar number does not match state bar records',
    })
    expect(result.success).toBe(true)
  })

  it('should accept reject action without reason', () => {
    const result = claimActionSchema.safeParse({
      claimId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'reject',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid action', () => {
    const result = claimActionSchema.safeParse({
      claimId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'delete',
    })
    expect(result.success).toBe(false)
  })

  it('should reject rejection reason over 500 chars', () => {
    const result = claimActionSchema.safeParse({
      claimId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'reject',
      rejectionReason: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid claimId', () => {
    const result = claimActionSchema.safeParse({
      claimId: 'not-a-uuid',
      action: 'approve',
    })
    expect(result.success).toBe(false)
  })
})
