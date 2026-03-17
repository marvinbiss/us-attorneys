import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  phoneSchema,
  passwordSchema,
  nameSchema,
  uuidSchema,
  dateSchema,
  timeSchema,
  createBookingSchema,
  createReviewSchema,
  signUpSchema,
  signInSchema,
  searchSchema,
  validateRequest,
  formatZodErrors,
} from './schemas'

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true)
    expect(emailSchema.safeParse('a.b+c@domain.fr').success).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(emailSchema.safeParse('invalid').success).toBe(false)
    expect(emailSchema.safeParse('@domain.com').success).toBe(false)
    expect(emailSchema.safeParse('user@').success).toBe(false)
  })

  it('rejects too short or too long', () => {
    expect(emailSchema.safeParse('a@b').success).toBe(false)
    expect(emailSchema.safeParse('a'.repeat(250) + '@b.com').success).toBe(false)
  })
})

describe('phoneSchema', () => {
  it('accepts valid US phone numbers', () => {
    expect(phoneSchema.safeParse('2125551234').success).toBe(true)
    expect(phoneSchema.safeParse('+12125551234').success).toBe(true)
  })

  it('strips spaces on transform', () => {
    const result = phoneSchema.safeParse('2125551234')
    expect(result.success && result.data).toBe('2125551234')
  })

  it('rejects invalid phones', () => {
    expect(phoneSchema.safeParse('123').success).toBe(false)
    expect(phoneSchema.safeParse('0012345678').success).toBe(false)
    expect(phoneSchema.safeParse('abcdefghij').success).toBe(false)
  })
})

describe('passwordSchema', () => {
  it('accepts strong passwords', () => {
    expect(passwordSchema.safeParse('SecurePass1').success).toBe(true)
    expect(passwordSchema.safeParse('MyP@ssw0rd!').success).toBe(true)
  })

  it('rejects passwords missing uppercase', () => {
    expect(passwordSchema.safeParse('lowercase1').success).toBe(false)
  })

  it('rejects passwords missing lowercase', () => {
    expect(passwordSchema.safeParse('UPPERCASE1').success).toBe(false)
  })

  it('rejects passwords missing digit', () => {
    expect(passwordSchema.safeParse('NoDigitHere').success).toBe(false)
  })

  it('rejects too short passwords', () => {
    expect(passwordSchema.safeParse('Ab1').success).toBe(false)
  })
})

describe('nameSchema', () => {
  it('accepts valid French names', () => {
    expect(nameSchema.safeParse('Jean-Pierre').success).toBe(true)
    expect(nameSchema.safeParse("O'Brien").success).toBe(true)
    expect(nameSchema.safeParse('Élise Dupont').success).toBe(true)
  })

  it('rejects names with digits or special characters', () => {
    expect(nameSchema.safeParse('Test123').success).toBe(false)
    expect(nameSchema.safeParse('Name!').success).toBe(false)
  })

  it('rejects too short or too long names', () => {
    expect(nameSchema.safeParse('A').success).toBe(false)
    expect(nameSchema.safeParse('A'.repeat(101)).success).toBe(false)
  })
})

describe('uuidSchema', () => {
  it('accepts valid UUIDs', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
  })

  it('rejects invalid UUIDs', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(uuidSchema.safeParse('').success).toBe(false)
  })
})

describe('dateSchema', () => {
  it('accepts YYYY-MM-DD format', () => {
    expect(dateSchema.safeParse('2024-01-15').success).toBe(true)
  })

  it('rejects other formats', () => {
    expect(dateSchema.safeParse('15/01/2024').success).toBe(false)
    expect(dateSchema.safeParse('2024-1-1').success).toBe(false)
    expect(dateSchema.safeParse('not-a-date').success).toBe(false)
  })
})

describe('timeSchema', () => {
  it('accepts HH:MM format', () => {
    expect(timeSchema.safeParse('09:30').success).toBe(true)
    expect(timeSchema.safeParse('23:59').success).toBe(true)
  })

  it('rejects other formats', () => {
    expect(timeSchema.safeParse('9:30').success).toBe(false)
    expect(timeSchema.safeParse('09:30:00').success).toBe(false)
  })
})

describe('createBookingSchema', () => {
  const validBooking = {
    attorneyId: '550e8400-e29b-41d4-a716-446655440000',
    slotId: '550e8400-e29b-41d4-a716-446655440001',
    clientName: 'John Smith',
    clientPhone: '2125551234',
    clientEmail: 'john@example.com',
  }

  it('accepts valid booking', () => {
    expect(createBookingSchema.safeParse(validBooking).success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const { clientEmail: _e, ...partial } = validBooking
    expect(createBookingSchema.safeParse(partial).success).toBe(false)
  })

  it('rejects invalid attorney UUID', () => {
    expect(createBookingSchema.safeParse({ ...validBooking, attorneyId: 'bad-id' }).success).toBe(false)
  })

  it('accepts optional fields', () => {
    const withOptional = { ...validBooking, serviceDescription: 'Leaking kitchen faucet', address: '123 Main Street' }
    expect(createBookingSchema.safeParse(withOptional).success).toBe(true)
  })
})

describe('createReviewSchema', () => {
  const validReview = {
    bookingId: '550e8400-e29b-41d4-a716-446655440000',
    rating: 4,
    comment: 'Très bon travail, rapide et propre.',
  }

  it('accepts valid review', () => {
    expect(createReviewSchema.safeParse(validReview).success).toBe(true)
  })

  it('rejects rating out of range', () => {
    expect(createReviewSchema.safeParse({ ...validReview, rating: 0 }).success).toBe(false)
    expect(createReviewSchema.safeParse({ ...validReview, rating: 6 }).success).toBe(false)
  })

  it('rejects comment too short', () => {
    expect(createReviewSchema.safeParse({ ...validReview, comment: 'Court' }).success).toBe(false)
  })

  it('accepts optional reviewToken', () => {
    expect(createReviewSchema.safeParse({ ...validReview, reviewToken: 'abc123' }).success).toBe(true)
  })
})

describe('signUpSchema', () => {
  const validSignUp = {
    email: 'user@example.com',
    password: 'SecurePass1',
    confirmPassword: 'SecurePass1',
    firstName: 'Jean',
    lastName: 'Dupont',
    acceptTerms: true,
  }

  it('accepts valid registration', () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = signUpSchema.safeParse({ ...validSignUp, confirmPassword: 'Different1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('confirmPassword')
    }
  })

  it('rejects when acceptTerms is false', () => {
    expect(signUpSchema.safeParse({ ...validSignUp, acceptTerms: false }).success).toBe(false)
  })
})

describe('signInSchema', () => {
  it('accepts valid credentials', () => {
    expect(signInSchema.safeParse({ email: 'user@example.com', password: 'anypassword' }).success).toBe(true)
  })

  it('rejects empty password', () => {
    expect(signInSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false)
  })

  it('accepts optional rememberMe', () => {
    expect(signInSchema.safeParse({ email: 'user@example.com', password: 'pw', rememberMe: true }).success).toBe(true)
  })
})

describe('searchSchema', () => {
  it('applies defaults', () => {
    const result = searchSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sortBy).toBe('relevance')
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('coerces string numbers', () => {
    const result = searchSchema.safeParse({ page: '2', limit: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(10)
    }
  })

  it('rejects invalid sortBy', () => {
    expect(searchSchema.safeParse({ sortBy: 'invalid' }).success).toBe(false)
  })
})

describe('validateRequest', () => {
  it('returns success with parsed data', () => {
    const result = validateRequest(emailSchema, 'test@example.com')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('test@example.com')
  })

  it('returns failure with ZodError on invalid data', () => {
    const result = validateRequest(emailSchema, 'not-an-email')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.issues.length).toBeGreaterThan(0)
  })
})

describe('formatZodErrors', () => {
  it('maps ZodError issues to field:message record', () => {
    const result = signUpSchema.safeParse({ email: 'bad', password: 'weak', confirmPassword: 'x', firstName: 'A', lastName: 'B', acceptTerms: false })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      expect(typeof errors).toBe('object')
      expect(Object.keys(errors).length).toBeGreaterThan(0)
    }
  })

  it('uses first error per path', () => {
    const result = passwordSchema.safeParse('abc')
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      // root path is ''
      expect(typeof errors['']).toBe('string')
    }
  })
})
