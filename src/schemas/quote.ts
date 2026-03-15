import { z } from 'zod'

export const quoteRequestSchema = z.object({
  attorney_id: z.string().uuid('ID artisan invalide'),
  service_slug: z.string().min(1, 'Service requis'),
  client_name: z
    .string()
    .min(2, 'Nom trop court')
    .max(100, 'Nom trop long')
    .transform((v) => v.trim()),
  client_email: z
    .string()
    .email('Email invalide')
    .transform((v) => v.toLowerCase().trim()),
  client_phone: z
    .string()
    .regex(/^(\+33|0)[1-9](\d{8})$/, 'Numéro de téléphone invalide')
    .transform((v) => {
      const cleaned = v.replace(/\s/g, '')
      if (cleaned.startsWith('0')) {
        return `+33${cleaned.slice(1)}`
      }
      return cleaned
    }),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000, 'Description trop longue'),
  urgency: z.enum(['normal', 'urgent', 'tres_urgent']).optional().default('normal'),
  city: z.string().max(100).optional(),
  postal_code: z.string().regex(/^\d{5}$/, 'Code postal invalide').optional(),
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
