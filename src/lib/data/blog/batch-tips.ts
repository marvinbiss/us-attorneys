export const conseilsArticles: Record<string, {
  title: string
  excerpt: string
  content: string[]
  image: string
  author: string
  date: string
  readTime: string
  category: string
  tags: string[]
  authorBio?: string
  updatedDate?: string
  faq?: { question: string; answer: string }[]
  keyTakeaways?: string[]
}> = {}
