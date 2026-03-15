/**
 * FAQ data for /faq/ pages.
 * TODO: Populate with US attorney-specific FAQ content.
 */

export type QuestionCategory = "pricing" | "choosing" | "emergency" | "regulations" | "diy"

export interface Question {
  slug: string
  question: string
  shortAnswer: string
  detailedAnswer: string[]
  category: QuestionCategory
  relatedService: string
  tags: string[]
  relatedQuestions?: string[]
}

export const categoryLabels: Record<QuestionCategory, string> = {
  pricing: "Pricing & Fees",
  choosing: "Choosing an Attorney",
  emergency: "Emergencies",
  regulations: "Regulations",
  diy: "Do It Yourself",
}

export const questions: Question[] = []

/** Get all question slugs for static generation */
export function getQuestionSlugs(): string[] {
  return questions.map(q => q.slug)
}

/** Get a single question by slug */
export function getQuestionBySlug(slug: string): Question | undefined {
  return questions.find(q => q.slug === slug)
}
