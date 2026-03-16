import { z } from 'zod'

export const quoteRequestSchema = z.object({
  attorney_id: z.string().uuid('Invalid attorney ID'),
  service_slug: z.string().min(1, 'Service required'),
  client_name: z
    .string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .transform((v) => v.trim()),
  client_email: z
    .string()
    .email('Invalid email')
    .transform((v) => v.toLowerCase().trim()),
  client_phone: z
    .string()
    .regex(/^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/, 'Invalid phone number')
    .transform((v) => {
      const cleaned = v.replace(/\s/g, '')
      if (!cleaned.startsWith('+1')) {
        return `+1${cleaned}`
      }
      return cleaned
    }),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description too long'),
  urgency: z.enum(['normal', 'urgent', 'very_urgent']).optional().default('normal'),
  city: z.string().max(100).optional(),
  postal_code: z.string().regex(/^\d{5}$/, 'Invalid ZIP code').optional(),
  budget_min: z.number().int().positive().optional(),
  budget_max: z.number().int().positive().optional(),
  preferred_date: z.string().datetime().optional(),
})

export const quoteUpdateSchema = z.object({
  status: z.enum(['pending', 'accepted', 'refused', 'expired']),
  estimated_amount: z.number().int().positive().optional(),
  internal_notes: z.string().max(1000).optional(),
})

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>
