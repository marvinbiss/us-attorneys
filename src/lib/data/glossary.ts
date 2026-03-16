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

/** @deprecated Use GlossaryTerm instead */
export type GlossaireTerm = GlossaryTerm

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

/** @deprecated Use glossaryCategories instead */
export const glossaireCategories = glossaryCategories

export type GlossaryCategory = (typeof glossaryCategories)[number]

/** @deprecated Use GlossaryCategory instead */
export type GlossaireCategory = GlossaryCategory

export const glossaryTerms: GlossaryTerm[] = []

/** @deprecated Use glossaryTerms instead */
export const glossaireTerms = glossaryTerms
