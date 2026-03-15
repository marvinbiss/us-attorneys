/**
 * Legal glossary — 150+ technical terms explained for the general public.
 * Used on the /glossary pillar page for SEO and client education.
 */

export interface GlossaireTerm {
  term: string
  slug: string
  definition: string
  category: string
  relatedService?: string
}

export const glossaireCategories = [
  'Civil Litigation',
  'Criminal Law',
  'Family Law',
  'Corporate Law',
  'Real Estate & Property',
  'Employment Law',
  'Immigration',
  'Administrative & Regulatory',
] as const

export type GlossaireCategory = (typeof glossaireCategories)[number]

export const glossaireTerms: GlossaireTerm[] = []
