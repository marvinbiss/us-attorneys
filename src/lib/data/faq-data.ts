export const faqCategories: { name: string; questions: { q: string; a: string }[] }[] = []

// Flat array of all FAQ items for the FAQPage structured data schema
export const faqItems: { question: string; answer: string }[] = faqCategories.flatMap(
  (category) =>
    category.questions.map((q) => ({
      question: q.q,
      answer: q.a,
    }))
)
