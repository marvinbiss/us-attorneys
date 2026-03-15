/**
 * Données pour les pages de comparaison.
 * 30 comparatifs détaillés pour aider les propriétaires français à choisir.
 */

export interface ComparisonOption {
  name: string
  avantages: string[]
  inconvenients: string[]
  prixMoyen: string
  dureeVie: string
  idealPour: string
}

export interface Comparison {
  slug: string
  title: string
  metaDescription: string
  intro: string
  options: ComparisonOption[]
  verdict: string
  criteresChoix: string[]
  faq: { question: string; answer: string }[]
  category: string
}

export const comparisons: Comparison[] = []
