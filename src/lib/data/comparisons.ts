/**
 * Data for comparison pages.
 * Detailed comparisons to help users choose between options.
 */

export interface ComparisonOption {
  name: string
  pros: string[]
  cons: string[]
  averagePrice: string
  lifespan: string
  idealFor: string
}

export interface Comparison {
  slug: string
  title: string
  metaDescription: string
  intro: string
  options: ComparisonOption[]
  verdict: string
  selectionCriteria: string[]
  faq: { question: string; answer: string }[]
  category: string
}

export const comparisons: Comparison[] = []
