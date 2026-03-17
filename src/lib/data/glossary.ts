/**
 * Legal glossary — 150+ technical terms explained for the general public.
 * Used on the /glossary pillar page for SEO and client education.
 */

export interface GlossaryTerm {
  term: string
  slug: string
  definition: string
  category: string
  relatedService?: string
}

export const glossaryCategories = [
  'Civil Litigation',
  'Criminal Law',
  'Family Law',
  'Corporate Law',
  'Real Estate & Property',
  'Employment Law',
  'Immigration',
  'Administrative & Regulatory',
] as const

export type GlossaryCategory = (typeof glossaryCategories)[number]

export const glossaryTerms: GlossaryTerm[] = []
