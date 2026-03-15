import { z } from 'zod'

/** UUID v4 regex for route parameter validation */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Strip HTML tags from text-only fields (defense against XSS in meta tags) */
export function stripHtml(str: string | null | undefined): string | null | undefined {
  if (!str) return str
  return str.replace(/<[^>]*>/g, '')
}

/** Base CMS page schema — shared fields between create and update */
const baseCmsFields = {
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
  page_type: z.enum(['static', 'blog', 'service', 'location', 'homepage', 'faq']),
  title: z.string().min(1).max(500),
  content_json: z.record(z.string(), z.unknown()).nullable().optional(),
  content_html: z.string().max(500000).nullable().optional(),
  structured_data: z.record(z.string(), z.unknown()).nullable().optional(),
  meta_title: z.string().max(70).nullable().optional(),
  meta_description: z.string().max(170).nullable().optional(),
  og_image_url: z.string().url().max(2048).nullable().optional(),
  canonical_url: z.string().url().max(2048).nullable().optional(),
  excerpt: z.string().max(1000).nullable().optional(),
  author: z.string().max(200).nullable().optional(),
  author_bio: z.string().max(2000).nullable().optional(),
  category: z.string().max(200).nullable().optional(),
  tags: z.array(z.string().min(1).max(100)).max(50).optional(),
  read_time: z.string().max(50).nullable().optional(),
  featured_image: z.string().url().max(2048).nullable().optional(),
  service_slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable().optional(),
  location_slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
}

/** Schema for creating a CMS page (all fields required that are required) */
export const createPageSchema = z.object(baseCmsFields).refine(
  (data) => {
    if (data.page_type === 'service' && !data.service_slug) return false
    if (data.page_type === 'location' && (!data.service_slug || !data.location_slug)) return false
    return true
  },
  { message: 'Required slugs are missing for this page type', path: ['page_type'] }
)

/** Schema for updating a CMS page (all fields optional) */
export const updatePageSchema = z.object(baseCmsFields).partial()

/** Apply stripHtml to all text-only fields on a validated CMS payload */
export function sanitizeTextFields<T extends Record<string, unknown>>(data: T): T {
  const textFields = ['title', 'meta_title', 'meta_description', 'excerpt', 'author', 'author_bio', 'category'] as const
  for (const field of textFields) {
    if (field in data && data[field] !== undefined) {
      (data as Record<string, unknown>)[field] = stripHtml(data[field] as string | null | undefined)
    }
  }
  return data
}
