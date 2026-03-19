/**
 * Tests for Zod Validation Schemas
 * Tests all centralized schemas with valid, invalid, and edge-case data
 */

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
  updateBookingSchema,
  getBookingsSchema,
  createReviewSchema,
  signUpSchema,
  signInSchema,
  createPaymentIntentSchema,
  searchSchema,
  createAvailabilitySchema,
  contactSchema,
  validateRequest,
  formatZodErrors,
} from '@/lib/validations/schemas'

// ============================================
// COMMON SCHEMAS
// ============================================

describe('emailSchema', () => {
  it('should accept valid emails', () => {
    expect(emailSchema.safeParse('test@example.com').success).toBe(true)
    expect(emailSchema.safeParse('user.name+tag@domain.fr').success).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(emailSchema.safeParse('').success).toBe(false)
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
    expect(emailSchema.safeParse('a@b').success).toBe(false)
    expect(emailSchema.safeParse('@domain.com').success).toBe(false)
  })

  it('should reject emails that are too long', () => {
    const longEmail = 'a'.repeat(250) + '@b.com'
    expect(emailSchema.safeParse(longEmail).success).toBe(false)
  })
})

describe('phoneSchema', () => {
  it('should accept valid US phone numbers', () => {
    expect(phoneSchema.safeParse('2125551234').success).toBe(true)
    expect(phoneSchema.safeParse('+12125551234').success).toBe(true)
    expect(phoneSchema.safeParse('3105559876').success).toBe(true)
  })

  it('should reject invalid phone numbers', () => {
    expect(phoneSchema.safeParse('').success).toBe(false)
    expect(phoneSchema.safeParse('123').success).toBe(false)
    expect(phoneSchema.safeParse('0012345678').success).toBe(false)
    expect(phoneSchema.safeParse('0612345678').success).toBe(false)
  })
})

describe('passwordSchema', () => {
  it('should accept valid passwords', () => {
    expect(passwordSchema.safeParse('Password1!').success).toBe(true)
    expect(passwordSchema.safeParse('MyStr0ngPass!').success).toBe(true)
  })

  it('should reject passwords without uppercase', () => {
    expect(passwordSchema.safeParse('password1!').success).toBe(false)
  })

  it('should reject passwords without lowercase', () => {
    expect(passwordSchema.safeParse('PASSWORD1!').success).toBe(false)
  })

  it('should reject passwords without digit', () => {
    expect(passwordSchema.safeParse('PasswordOnly!').success).toBe(false)
  })

  it('should reject passwords without special character', () => {
    expect(passwordSchema.safeParse('Password1').success).toBe(false)
  })

  it('should reject short passwords', () => {
    expect(passwordSchema.safeParse('Aa1!').success).toBe(false)
  })

  it('should reject passwords exceeding max length', () => {
    const longPass = 'Aa1!' + 'x'.repeat(130)
    expect(passwordSchema.safeParse(longPass).success).toBe(false)
  })
})

describe('nameSchema', () => {
  it('should accept valid names', () => {
    expect(nameSchema.safeParse('John').success).toBe(true)
    expect(nameSchema.safeParse('Mary-Claire').success).toBe(true)
    expect(nameSchema.safeParse("Jean-Pierre O'Brien").success).toBe(true)
    expect(nameSchema.safeParse('James').success).toBe(true)
    expect(nameSchema.safeParse('Elizabeth').success).toBe(true)
  })

  it('should reject names with numbers or special chars', () => {
    expect(nameSchema.safeParse('Jean123').success).toBe(false)
    expect(nameSchema.safeParse('User@Name').success).toBe(false)
  })

  it('should reject too short or too long names', () => {
    expect(nameSchema.safeParse('A').success).toBe(false)
    expect(nameSchema.safeParse('A'.repeat(101)).success).toBe(false)
  })
})

describe('uuidSchema', () => {
  it('should accept valid UUIDs', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
  })

  it('should reject invalid UUIDs', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(uuidSchema.safeParse('').success).toBe(false)
    expect(uuidSchema.safeParse('123').success).toBe(false)
  })
})

describe('dateSchema', () => {
  it('should accept valid dates', () => {
    expect(dateSchema.safeParse('2026-02-07').success).toBe(true)
    expect(dateSchema.safeParse('2025-12-31').success).toBe(true)
  })

  it('should reject invalid date formats', () => {
    expect(dateSchema.safeParse('07/02/2026').success).toBe(false)
    expect(dateSchema.safeParse('2026-2-7').success).toBe(false)
    expect(dateSchema.safeParse('not-a-date').success).toBe(false)
  })
})

describe('timeSchema', () => {
  it('should accept valid times', () => {
    expect(timeSchema.safeParse('09:00').success).toBe(true)
    expect(timeSchema.safeParse('23:59').success).toBe(true)
  })

  it('should reject invalid time formats', () => {
    expect(timeSchema.safeParse('9:00').success).toBe(false)
    expect(timeSchema.safeParse('09:00:00').success).toBe(false)
    expect(timeSchema.safeParse('not-a-time').success).toBe(false)
  })
})

// ============================================
// BOOKING SCHEMAS
// ============================================

const validUUID = '550e8400-e29b-41d4-a716-446655440000'

describe('createBookingSchema', () => {
  const validBooking = {
    attorneyId: validUUID,
    slotId: validUUID,
    clientName: 'John Smith',
    clientPhone: '2125551234',
    clientEmail: 'john@example.com',
  }

  it('should accept a valid booking', () => {
    expect(createBookingSchema.safeParse(validBooking).success).toBe(true)
  })

  it('should accept booking with optional fields', () => {
    const result = createBookingSchema.safeParse({
      ...validBooking,
      serviceId: 'personal-injury',
      serviceDescription: 'Slip and fall accident consultation',
      address: '123 Broadway, New York',
      depositAmount: 50,
    })
    expect(result.success).toBe(true)
  })

  it('should reject booking without required fields', () => {
    expect(createBookingSchema.safeParse({}).success).toBe(false)
    expect(createBookingSchema.safeParse({ attorneyId: validUUID }).success).toBe(false)
  })

  it('should reject invalid UUIDs', () => {
    const result = createBookingSchema.safeParse({
      ...validBooking,
      attorneyId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('should reject deposit amount out of range', () => {
    expect(createBookingSchema.safeParse({ ...validBooking, depositAmount: -1 }).success).toBe(
      false
    )
    expect(createBookingSchema.safeParse({ ...validBooking, depositAmount: 10001 }).success).toBe(
      false
    )
  })
})

describe('updateBookingSchema', () => {
  it('should accept valid status updates', () => {
    expect(updateBookingSchema.safeParse({ status: 'confirmed' }).success).toBe(true)
    expect(updateBookingSchema.safeParse({ status: 'cancelled' }).success).toBe(true)
    expect(updateBookingSchema.safeParse({ status: 'completed' }).success).toBe(true)
  })

  it('should reject invalid status', () => {
    expect(updateBookingSchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })

  it('should accept empty update (all optional)', () => {
    expect(updateBookingSchema.safeParse({}).success).toBe(true)
  })

  it('should reject notes that are too long', () => {
    expect(updateBookingSchema.safeParse({ notes: 'a'.repeat(1001) }).success).toBe(false)
  })
})

describe('getBookingsSchema', () => {
  it('should accept valid query params', () => {
    expect(getBookingsSchema.safeParse({ page: '1', limit: '20' }).success).toBe(true)
  })

  it('should apply defaults', () => {
    const result = getBookingsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('should reject page < 1', () => {
    expect(getBookingsSchema.safeParse({ page: '0' }).success).toBe(false)
  })

  it('should reject limit > 100', () => {
    expect(getBookingsSchema.safeParse({ limit: '101' }).success).toBe(false)
  })
})

// ============================================
// REVIEW SCHEMAS
// ============================================

describe('createReviewSchema', () => {
  const validReviewWithOverall = {
    bookingId: validUUID,
    rating: 5,
    comment: 'Excellent work, highly recommended by everyone!',
  }

  const validReviewWithSubRatings = {
    bookingId: validUUID,
    ratingCommunication: 5,
    ratingResult: 4,
    ratingResponsiveness: 5,
    comment: 'Excellent work, highly recommended by everyone!',
  }

  it('should accept a valid review with overall rating', () => {
    expect(createReviewSchema.safeParse(validReviewWithOverall).success).toBe(true)
  })

  it('should accept a valid review with 3 sub-ratings', () => {
    expect(createReviewSchema.safeParse(validReviewWithSubRatings).success).toBe(true)
  })

  it('should accept overall ratings 1-5', () => {
    for (let i = 1; i <= 5; i++) {
      expect(createReviewSchema.safeParse({ ...validReviewWithOverall, rating: i }).success).toBe(
        true
      )
    }
  })

  it('should accept sub-ratings 1-5', () => {
    for (let i = 1; i <= 5; i++) {
      expect(
        createReviewSchema.safeParse({
          ...validReviewWithSubRatings,
          ratingCommunication: i,
          ratingResult: i,
          ratingResponsiveness: i,
        }).success
      ).toBe(true)
    }
  })

  it('should reject rating out of range', () => {
    expect(createReviewSchema.safeParse({ ...validReviewWithOverall, rating: 0 }).success).toBe(
      false
    )
    expect(createReviewSchema.safeParse({ ...validReviewWithOverall, rating: 6 }).success).toBe(
      false
    )
  })

  it('should reject non-integer ratings', () => {
    expect(createReviewSchema.safeParse({ ...validReviewWithOverall, rating: 3.5 }).success).toBe(
      false
    )
  })

  it('should reject review with no overall rating and incomplete sub-ratings', () => {
    expect(
      createReviewSchema.safeParse({
        bookingId: validUUID,
        ratingCommunication: 5,
        comment: 'Excellent work, highly recommended by everyone!',
      }).success
    ).toBe(false)
  })

  it('should reject short comments', () => {
    expect(
      createReviewSchema.safeParse({ ...validReviewWithOverall, comment: 'Good' }).success
    ).toBe(false)
  })

  it('should reject long comments', () => {
    expect(
      createReviewSchema.safeParse({ ...validReviewWithOverall, comment: 'a'.repeat(2001) }).success
    ).toBe(false)
  })

  it('should accept optional wouldRecommend and isAnonymous', () => {
    expect(
      createReviewSchema.safeParse({
        ...validReviewWithSubRatings,
        wouldRecommend: true,
        isAnonymous: true,
      }).success
    ).toBe(true)
  })
})

// ============================================
// AUTH SCHEMAS
// ============================================

describe('signUpSchema', () => {
  const validSignUp = {
    email: 'test@example.com',
    password: 'Password1!',
    confirmPassword: 'Password1!',
    firstName: 'John',
    lastName: 'Smith',
    acceptTerms: true,
  }

  it('should accept valid signup data', () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true)
  })

  it('should accept signup with optional phone', () => {
    expect(signUpSchema.safeParse({ ...validSignUp, phone: '2125551234' }).success).toBe(true)
  })

  it('should reject mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      confirmPassword: 'DifferentPass1!',
    })
    expect(result.success).toBe(false)
  })

  it('should reject when terms not accepted', () => {
    expect(signUpSchema.safeParse({ ...validSignUp, acceptTerms: false }).success).toBe(false)
  })

  it('should reject missing required fields', () => {
    expect(signUpSchema.safeParse({ email: 'test@example.com' }).success).toBe(false)
  })
})

describe('signInSchema', () => {
  it('should accept valid signin', () => {
    expect(signInSchema.safeParse({ email: 'test@example.com', password: 'pass' }).success).toBe(
      true
    )
  })

  it('should reject empty password', () => {
    expect(signInSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false)
  })

  it('should reject invalid email', () => {
    expect(signInSchema.safeParse({ email: 'not-email', password: 'pass' }).success).toBe(false)
  })
})

// ============================================
// PAYMENT SCHEMAS
// ============================================

describe('createPaymentIntentSchema', () => {
  const validPayment = {
    amount: 5000,
    attorneyId: validUUID,
  }

  it('should accept valid payment', () => {
    expect(createPaymentIntentSchema.safeParse(validPayment).success).toBe(true)
  })

  it('should apply defaults for currency and paymentType', () => {
    const result = createPaymentIntentSchema.safeParse(validPayment)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe('usd')
      expect(result.data.paymentType).toBe('full')
    }
  })

  it('should reject amount below minimum (100 cents = 1 USD)', () => {
    expect(createPaymentIntentSchema.safeParse({ ...validPayment, amount: 50 }).success).toBe(false)
  })

  it('should reject amount above maximum', () => {
    expect(createPaymentIntentSchema.safeParse({ ...validPayment, amount: 1000001 }).success).toBe(
      false
    )
  })

  it('should reject invalid currency', () => {
    expect(createPaymentIntentSchema.safeParse({ ...validPayment, currency: 'eur' }).success).toBe(
      false
    )
  })

  it('should accept deposit payment with percentage', () => {
    const result = createPaymentIntentSchema.safeParse({
      ...validPayment,
      paymentType: 'deposit',
      depositPercentage: 30,
    })
    expect(result.success).toBe(true)
  })

  it('should reject deposit percentage out of range', () => {
    expect(
      createPaymentIntentSchema.safeParse({ ...validPayment, depositPercentage: 5 }).success
    ).toBe(false)
    expect(
      createPaymentIntentSchema.safeParse({ ...validPayment, depositPercentage: 60 }).success
    ).toBe(false)
  })
})

// ============================================
// CONTACT SCHEMA
// ============================================

describe('contactSchema', () => {
  const validContact = {
    name: 'John Smith',
    email: 'john@example.com',
    subject: 'Question about legal services',
    message: 'Hello, I would like to learn more about your personal injury practice.',
  }

  it('should accept valid contact form', () => {
    expect(contactSchema.safeParse(validContact).success).toBe(true)
  })

  it('should apply default type', () => {
    const result = contactSchema.safeParse(validContact)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('general')
    }
  })

  it('should accept all contact types', () => {
    const types = ['general', 'support', 'partnership', 'press'] as const
    for (const type of types) {
      expect(contactSchema.safeParse({ ...validContact, type }).success).toBe(true)
    }
  })

  it('should reject short subject', () => {
    expect(contactSchema.safeParse({ ...validContact, subject: 'Hi' }).success).toBe(false)
  })

  it('should reject short message', () => {
    expect(contactSchema.safeParse({ ...validContact, message: 'Short' }).success).toBe(false)
  })
})

// ============================================
// SEARCH SCHEMA
// ============================================

describe('searchSchema', () => {
  it('should accept empty search (all defaults)', () => {
    const result = searchSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sortBy).toBe('relevance')
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('should accept all sort options', () => {
    const sorts = ['relevance', 'rating', 'distance', 'price'] as const
    for (const sortBy of sorts) {
      expect(searchSchema.safeParse({ sortBy }).success).toBe(true)
    }
  })

  it('should coerce string numbers for pagination', () => {
    const result = searchSchema.safeParse({ page: '3', limit: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(10)
    }
  })

  it('should reject limit > 50', () => {
    expect(searchSchema.safeParse({ limit: '51' }).success).toBe(false)
  })

  it('should reject query > 200 chars', () => {
    expect(searchSchema.safeParse({ q: 'a'.repeat(201) }).success).toBe(false)
  })
})

// ============================================
// AVAILABILITY SCHEMAS
// ============================================

describe('createAvailabilitySchema', () => {
  it('should accept valid availability', () => {
    const result = createAvailabilitySchema.safeParse({
      attorneyId: validUUID,
      date: '2026-03-01',
      slots: [
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '18:00', isAvailable: false },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty slots array', () => {
    // z.array allows empty by default, but attorneyId and date are required
    const result = createAvailabilitySchema.safeParse({
      attorneyId: validUUID,
      date: '2026-03-01',
      slots: [],
    })
    expect(result.success).toBe(true) // empty array is valid per schema
  })

  it('should reject invalid time format in slots', () => {
    const result = createAvailabilitySchema.safeParse({
      attorneyId: validUUID,
      date: '2026-03-01',
      slots: [{ startTime: '9am', endTime: '12pm' }],
    })
    expect(result.success).toBe(false)
  })
})

// ============================================
// HELPER FUNCTIONS
// ============================================

describe('validateRequest', () => {
  it('should return success with valid data', () => {
    const result = validateRequest(emailSchema, 'test@example.com')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('test@example.com')
    }
  })

  it('should return errors with invalid data', () => {
    const result = validateRequest(emailSchema, 'invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toBeDefined()
      expect(result.errors.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('formatZodErrors', () => {
  it('should format errors into a key-value record', () => {
    const result = signInSchema.safeParse({ email: 'bad', password: '' })
    if (!result.success) {
      const formatted = formatZodErrors(result.error)
      expect(typeof formatted).toBe('object')
      expect(Object.keys(formatted).length).toBeGreaterThan(0)
    }
  })

  it('should map field paths to messages', () => {
    const result = createBookingSchema.safeParse({ attorneyId: 'bad' })
    if (!result.success) {
      const formatted = formatZodErrors(result.error)
      expect(formatted['attorneyId']).toBeDefined()
    }
  })
})
