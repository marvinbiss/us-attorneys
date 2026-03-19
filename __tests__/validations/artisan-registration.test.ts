/**
 * Tests for Attorney Registration Schema
 * Schema with bar number, password confirmation, and US-specific validation
 */

import { describe, it, expect } from 'vitest'
import { attorneyRegistrationSchema } from '@/lib/validations/schemas'

const validRegistration = {
  email: 'attorney@example.com',
  password: 'SecurePass1!',
  confirmPassword: 'SecurePass1!',
  businessName: 'Smith & Associates',
  firstName: 'John',
  lastName: 'Smith',
  phone: '2125551234',
  specialty: 'Personal Injury',
  barNumber: 'NY12345678',
  address: '123 Main Street',
  city: 'New York',
  postalCode: '10001',
  acceptTerms: true as const,
}

describe('attorneyRegistrationSchema', () => {
  it('should accept valid registration', () => {
    expect(attorneyRegistrationSchema.safeParse(validRegistration).success).toBe(true)
  })

  it('should accept registration with optional description', () => {
    const result = attorneyRegistrationSchema.safeParse({
      ...validRegistration,
      description: 'Experienced trial attorney with 10 years of practice',
    })
    expect(result.success).toBe(true)
  })

  it('should reject mismatched passwords', () => {
    const result = attorneyRegistrationSchema.safeParse({
      ...validRegistration,
      confirmPassword: 'DifferentPass1!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordError = result.error.issues.find((i) => i.path.includes('confirmPassword'))
      expect(passwordError).toBeDefined()
    }
  })

  it('should reject invalid bar number', () => {
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, barNumber: 'AB' }).success
    ).toBe(false)
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, barNumber: 'A'.repeat(21) })
        .success
    ).toBe(false)
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, barNumber: 'NY-123!@#' }).success
    ).toBe(false)
  })

  it('should accept valid bar numbers of various formats', () => {
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, barNumber: 'NY1234' }).success
    ).toBe(true)
    expect(
      attorneyRegistrationSchema.safeParse({
        ...validRegistration,
        barNumber: '12345678901234567890',
      }).success
    ).toBe(true)
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, barNumber: 'CA98765' }).success
    ).toBe(true)
  })

  it('should reject invalid postal code', () => {
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, postalCode: '7500' }).success
    ).toBe(false)
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, postalCode: '750011' }).success
    ).toBe(false)
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, postalCode: 'ABCDE' }).success
    ).toBe(false)
  })

  it('should reject when acceptTerms is not true', () => {
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, acceptTerms: false }).success
    ).toBe(false)
  })

  it('should reject too short business name', () => {
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, businessName: 'A' }).success
    ).toBe(false)
  })

  it('should reject too short address', () => {
    expect(
      attorneyRegistrationSchema.safeParse({ ...validRegistration, address: '12' }).success
    ).toBe(false)
  })

  it('should reject description exceeding max length', () => {
    expect(
      attorneyRegistrationSchema.safeParse({
        ...validRegistration,
        description: 'a'.repeat(2001),
      }).success
    ).toBe(false)
  })

  it('should reject missing required fields', () => {
    const { email: _e, ...withoutEmail } = validRegistration
    expect(attorneyRegistrationSchema.safeParse(withoutEmail).success).toBe(false)

    const { phone: _p, ...withoutPhone } = validRegistration
    expect(attorneyRegistrationSchema.safeParse(withoutPhone).success).toBe(false)

    const { barNumber: _s, ...withoutBarNumber } = validRegistration
    expect(attorneyRegistrationSchema.safeParse(withoutBarNumber).success).toBe(false)
  })
})
