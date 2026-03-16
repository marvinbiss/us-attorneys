import { z } from 'zod'

export const providerUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .transform((v) => v.trim())
    .optional(),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description too long')
    .optional()
    .nullable(),
  specialties: z.string().max(500).optional().nullable(),
  phone: z
    .string()
    .regex(/^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/, 'Invalid phone number')
    .transform((v) => v.replace(/\s/g, ''))
    .optional(),
  phone_secondary: z
    .string()
    .regex(/^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/, 'Invalid phone number')
    .optional()
    .nullable()
    .transform((v) => v?.replace(/\s/g, '')),
  email: z.string().email('Invalid email').optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable(),
  address_street: z.string().max(200).optional().nullable(),
  address_postal_code: z.string().regex(/^\d{5}$/, 'Invalid ZIP code').optional().nullable(),
  address_city: z.string().max(100).optional().nullable(),
  intervention_radius_km: z.number().int().min(1).max(200).optional().default(30),
  free_quote: z.boolean().optional().default(true),
  available_24h: z.boolean().optional().default(false),
})

// ============================================================
// Sub-schemas for attorney profile editor
// ============================================================
export const dayScheduleSchema = z.object({
  open: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')),
  end: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')),
})

export const openingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
})

export const servicePriceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().default(''),
  price: z.string().min(1).max(100),
  duration: z.string().max(50).optional().default(''),
})

export const faqItemSchema = z.object({
  question: z.string().min(5, 'Question too short').max(500),
  answer: z.string().min(10, 'Answer too short').max(2000),
})

// ============================================================
// Artisan self-service update schema (PUT /api/attorney/provider)
// Excludes admin-only fields: is_verified, noindex, is_active,
// rating_average, review_count.
// ============================================================
export const providerArtisanUpdateSchema = z.object({
  // Identity
  name: z.string().min(2).max(100).transform(v => v.trim()).optional(),
  siret: z.string().regex(/^\d{14}$/, 'Bar number is required').optional().nullable(),
  team_size: z.number().int().min(1).max(1000).optional().nullable(),

  // Contact — preprocess strips spaces/dots/dashes before validation so "06 12 34 56 78" passes
  phone: z.preprocess(
    (v) => typeof v === 'string' ? v.replace(/[-\s.]/g, '') : v,
    z.string().regex(/^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/, 'Invalid phone number')
  ).optional(),
  phone_secondary: z.preprocess(
    (v) => typeof v === 'string' ? v.replace(/[-\s.]/g, '') : v,
    z.string().regex(/^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/, 'Invalid phone number')
  ).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable(),

  // Location — address_department, latitude, longitude exist in providers (migrations 009, 007)
  address_street: z.string().max(200).optional().nullable(),
  address_city: z.string().max(100).optional().nullable(),
  address_postal_code: z.string().regex(/^\d{5}$/, 'Invalid ZIP code').optional().nullable(),
  address_region: z.string().max(50).optional().nullable(),
  address_department: z.string().max(50).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  intervention_radius_km: z.number().int().min(1).max(200).optional(),

  // Presentation
  description: z.string().max(5000).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  specialty: z.string().max(200).optional().nullable(),

  // Services & Pricing
  services_offered: z.array(z.string().min(1).max(100)).max(30).optional(),
  service_prices: z.array(servicePriceSchema).max(20).optional(),
  free_quote: z.boolean().optional(),

  // Availability
  opening_hours: openingHoursSchema.optional(),
  available_24h: z.boolean().optional(),
  accepts_new_clients: z.boolean().optional(),

  // FAQ
  faq: z.array(faqItemSchema).max(15, 'Maximum 15 questions').optional(),

  // Qualifications
  certifications: z.array(z.string().min(1).max(200)).max(20).optional(),
})

export type ProviderArtisanUpdateInput = z.infer<typeof providerArtisanUpdateSchema>

export const providerSearchSchema = z.object({
  q: z.string().optional(),
  service: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  region: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius_km: z.coerce.number().int().min(1).max(100).optional().default(30),
  verified_only: z.coerce.boolean().optional().default(false),
  min_rating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export const photoUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/, 'Unsupported file type'),
  size: z.number().max(5 * 1024 * 1024, 'File must not exceed 5MB'),
})

export type ProviderUpdateInput = z.infer<typeof providerUpdateSchema>
export type AttorneySearchInput = z.infer<typeof providerSearchSchema>
export type PhotoUploadInput = z.infer<typeof photoUploadSchema>
