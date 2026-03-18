/**
 * Tests for Attorney Claim API
 * Validates bar number schema, claim request validation, and edge cases
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Replicate the claim schema from the API route for isolated testing
// Matches src/app/api/attorney/claim/route.ts claimSchema
const claimSchema = z.object({
  attorneyId: z.string().uuid('Invalid attorney ID'),
  bar_number: z.string().min(1, 'Bar number is required'),
  fullName: z.string().min(2, 'Name is required (min. 2 characters)'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  position: z.string().min(2, 'Position is required'),
})

const validClaim = {
  attorneyId: '550e8400-e29b-41d4-a716-446655440000',
  bar_number: 'TX12345',
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '2125551234',
  position: 'Partner',
}

// ============================================
// CLAIM SCHEMA VALIDATION
// ============================================

describe('claimSchema (attorney claim)', () => {
  describe('attorneyId', () => {
    it('should accept a valid UUID', () => {
      const result = claimSchema.safeParse(validClaim)
      expect(result.success).toBe(true)
    })

    it('should reject an invalid UUID', () => {
      const result = claimSchema.safeParse({
        ...validClaim,
        attorneyId: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject an empty string', () => {
      const result = claimSchema.safeParse({
        ...validClaim,
        attorneyId: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('bar_number', () => {
    it('should accept a valid bar number', () => {
      const result = claimSchema.safeParse(validClaim)
      expect(result.success).toBe(true)
    })

    it('should accept various bar number formats', () => {
      const formats = ['TX12345', '1234567', 'CA 298765', 'NY-2023-0001']
      for (const bn of formats) {
        const result = claimSchema.safeParse({ ...validClaim, bar_number: bn })
        expect(result.success).toBe(true)
      }
    })

    it('should reject empty bar number', () => {
      const result = claimSchema.safeParse({
        ...validClaim,
        bar_number: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('contact fields', () => {
    it('should reject short fullName', () => {
      const result = claimSchema.safeParse({ ...validClaim, fullName: 'J' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const result = claimSchema.safeParse({ ...validClaim, email: 'not-email' })
      expect(result.success).toBe(false)
    })

    it('should reject short phone', () => {
      const result = claimSchema.safeParse({ ...validClaim, phone: '123' })
      expect(result.success).toBe(false)
    })

    it('should reject short position', () => {
      const result = claimSchema.safeParse({ ...validClaim, position: 'P' })
      expect(result.success).toBe(false)
    })
  })

  describe('missing fields', () => {
    it('should reject missing attorneyId', () => {
      const { attorneyId: _, ...rest } = validClaim
      const result = claimSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('should reject missing bar_number', () => {
      const { bar_number: _, ...rest } = validClaim
      const result = claimSchema.safeParse(rest)
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
  // Matches normalization in claim/route.ts
  const normalizeBarNumber = (input: string) => input.replace(/\s/g, '').toLowerCase()

  it('should strip spaces from bar number', () => {
    expect(normalizeBarNumber('TX 12345')).toBe('tx12345')
  })

  it('should lowercase bar number', () => {
    expect(normalizeBarNumber('CA298765')).toBe('ca298765')
  })

  it('should handle bar number without spaces', () => {
    expect(normalizeBarNumber('12345678')).toBe('12345678')
  })

  it('should correctly compare matching bar numbers', () => {
    const input = 'TX 12345'
    const stored = 'tx12345'
    expect(normalizeBarNumber(input)).toBe(normalizeBarNumber(stored))
  })

  it('should correctly detect mismatching bar numbers', () => {
    const input = 'TX12345'
    const stored = 'CA98765'
    expect(normalizeBarNumber(input)).not.toBe(normalizeBarNumber(stored))
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
