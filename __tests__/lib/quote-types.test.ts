/**
 * Tests for src/components/quote/types.ts
 *
 * Covers:
 * - isValidUSPhone: various phone formats
 * - initialFormData defaults
 * - STORAGE_KEY constant
 */

import { describe, it, expect } from 'vitest'
import {
  isValidUSPhone,
  initialFormData,
  STORAGE_KEY,
  urgencyOptions,
  budgetOptions,
} from '@/components/quote/types'

describe('isValidUSPhone', () => {
  it('accepts 10-digit phone number', () => {
    expect(isValidUSPhone('5551234567')).toBe(true)
  })

  it('accepts 10-digit with dashes', () => {
    expect(isValidUSPhone('555-123-4567')).toBe(true)
  })

  it('accepts 10-digit with dots', () => {
    expect(isValidUSPhone('555.123.4567')).toBe(true)
  })

  it('accepts 10-digit with parentheses', () => {
    expect(isValidUSPhone('(555) 123-4567')).toBe(true)
  })

  it('accepts +1 prefix', () => {
    expect(isValidUSPhone('+15551234567')).toBe(true)
  })

  it('accepts 1 prefix without +', () => {
    expect(isValidUSPhone('15551234567')).toBe(true)
  })

  it('accepts +1 with spaces', () => {
    expect(isValidUSPhone('+1 555 123 4567')).toBe(true)
  })

  it('rejects too short number', () => {
    expect(isValidUSPhone('55512345')).toBe(false)
  })

  it('rejects too long number', () => {
    expect(isValidUSPhone('555123456789')).toBe(false)
  })

  it('rejects letters', () => {
    expect(isValidUSPhone('555-ABC-4567')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidUSPhone('')).toBe(false)
  })
})

describe('initialFormData', () => {
  it('has all fields empty/false by default', () => {
    expect(initialFormData.service).toBe('')
    expect(initialFormData.city).toBe('')
    expect(initialFormData.description).toBe('')
    expect(initialFormData.urgency).toBe('')
    expect(initialFormData.budget).toBe('')
    expect(initialFormData.name).toBe('')
    expect(initialFormData.phone).toBe('')
    expect(initialFormData.email).toBe('')
    expect(initialFormData.consent).toBe(false)
  })
})

describe('STORAGE_KEY', () => {
  it('is the expected value', () => {
    expect(STORAGE_KEY).toBe('sa:quote-draft')
  })
})

describe('urgencyOptions', () => {
  it('has 4 options', () => {
    expect(urgencyOptions).toHaveLength(4)
  })

  it('includes urgent option', () => {
    expect(urgencyOptions.find(o => o.value === 'urgent')).toBeTruthy()
  })
})

describe('budgetOptions', () => {
  it('has 5 options', () => {
    expect(budgetOptions).toHaveLength(5)
  })

  it('includes "I don\'t know" option', () => {
    expect(budgetOptions.find(o => o.value === 'unknown')).toBeTruthy()
  })
})
