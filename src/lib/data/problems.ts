/**
 * Common legal issues data for /issues/ pages
 * 46 problems with complete metadata for diagnostic SEO.
 */

import problemsExtra from './problems-extra'

export interface Problem {
  slug: string
  name: string
  description: string
  relatedServices: string[]
  primaryService: string
  urgencyLevel: 'high' | 'medium' | 'low'
  symptoms: string[]
  immediateActions: string[]
  preventiveTips: string[]
  estimatedCost: { min: number; max: number }
  averageResponseTime: string
  seasonality?: string
  faq: { q: string; a: string }[]
}

const problems: Problem[] = []

// Merge the extra problems
const allProblems: Problem[] = [...problems, ...problemsExtra]

// ---------------------------------------------------------------------------
// Export functions
// ---------------------------------------------------------------------------

export function getProblemBySlug(slug: string): Problem | undefined {
  return allProblems.find((p) => p.slug === slug)
}

export function getProblemSlugs(): string[] {
  return allProblems.map((p) => p.slug)
}

export function getProblemsByService(specialtySlug: string): Problem[] {
  return allProblems.filter(
    (p) => p.primaryService === specialtySlug || p.relatedServices.includes(specialtySlug)
  )
}

export default allProblems
