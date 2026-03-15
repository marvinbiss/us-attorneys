/**
 * Zod Validation Schemas - ServicesArtisans
 * Centralized input validation for all API routes
 */

import { z } from 'zod'

// ============================================
// COMMON SCHEMAS
// ============================================

export const emailSchema = z
  .string()
  .email('Adresse email invalide')
  .min(5, 'Email trop court')
  .max(255, 'Email trop long')

export const phoneSchema = z
  .string()
  .regex(/^(?:\+33|0)[1-9](?:[0-9]{8})$/, 'Numero de telephone invalide')
  .transform((val) => val.replace(/\s/g, ''))

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
  .max(128, 'Le mot de passe est trop long')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')

export const nameSchema = z
  .string()
  .min(2, 'Nom trop court')
  .max(100, 'Nom trop long')
  .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Nom invalide')

export const uuidSchema = z.string().uuid('ID invalide')

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')

export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Format d\'heure invalide (HH:MM)')

// ============================================
// BOOKING SCHEMAS
// ============================================

export const createBookingSchema = z.object({
  attorneyId: uuidSchema,
  slotId: uuidSchema,
  specialtyId: z.string().optional(),
  clientName: nameSchema,
  clientPhone: phoneSchema,
  clientEmail: emailSchema,
  serviceDescription: z.string().max(1000, 'Description trop longue').optional(),
  address: z.string().max(500, 'Adresse trop longue').optional(),
  paymentIntentId: z.string().optional(),
  depositAmount: z.number().min(0).max(10000).optional(),
})

export const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  notes: z.string().max(1000).optional(),
})

export const getBookingsSchema = z.object({
  attorneyId: uuidSchema.optional(),
  clientEmail: emailSchema.optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// ============================================
// REVIEW SCHEMAS
// ============================================

export const createReviewSchema = z.object({
  bookingId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Commentaire trop court').max(500, 'Commentaire trop long'),
  reviewToken: z.string().optional(),
})

export const getReviewsSchema = z.object({
  attorneyId: uuidSchema.optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  status: z.enum(['pending', 'published', 'rejected']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

// ============================================
// USER SCHEMAS
// ============================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().optional(),
})

export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide').optional(),
  bio: z.string().max(1000).optional(),
})

// ============================================
// ARTISAN SCHEMAS
// ============================================

export const artisanRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  businessName: z.string().min(2).max(200),
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  specialty: z.string().min(2).max(100),
  siret: z.string().regex(/^\d{14}$/, 'SIRET invalide'),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide'),
  description: z.string().max(2000).optional(),
  acceptTerms: z.literal(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const createPaymentIntentSchema = z.object({
  amount: z.number().min(100).max(1000000), // centimes
  currency: z.enum(['eur']).default('eur'),
  bookingId: uuidSchema.optional(),
  attorneyId: uuidSchema,
  paymentType: z.enum(['full', 'deposit']).default('full'),
  depositPercentage: z.number().min(10).max(50).optional(),
})

// ============================================
// SEARCH SCHEMAS
// ============================================

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  service: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  availability: z.enum(['today', 'tomorrow', 'week']).optional(),
  sortBy: z.enum(['relevance', 'rating', 'distance', 'price']).default('relevance'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

// ============================================
// AVAILABILITY SCHEMAS
// ============================================

export const createAvailabilitySchema = z.object({
  attorneyId: uuidSchema,
  date: dateSchema,
  slots: z.array(z.object({
    startTime: timeSchema,
    endTime: timeSchema,
    isAvailable: z.boolean().default(true),
  })),
})

export const getAvailabilitySchema = z.object({
  attorneyIds: z.string().transform((val) => val.split(',')),
  startDate: dateSchema.optional(),
  days: z.coerce.number().min(1).max(30).default(5),
})

// ============================================
// CONTACT SCHEMAS
// ============================================

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(5).max(200),
  message: z.string().min(20).max(5000),
  type: z.enum(['general', 'support', 'partnership', 'press']).default('general'),
})

// ============================================
// HELPER FUNCTION
// ============================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

export function formatZodErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  errors.issues.forEach((err) => {
    const path = err.path.join('.')
    if (!formatted[path]) {
      formatted[path] = err.message
    }
  })
  return formatted
}
