/**
 * Lightweight article metadata for the blog index page.
 * This avoids importing the full article content into the client bundle.
 */

import { allArticles } from './articles'

export interface BlogArticleMeta {
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  date: string
  readTime: string
  image: string
}

/** Map category to a default emoji for the blog listing grid */
export const categoryEmoji: Record<string, string> = {}

/** Normalize non-accented category names to their accented equivalents */
const categoryNormalize: Record<string, string> = {}

function normalizeCategory(category: string): string {
  return categoryNormalize[category] || category
}

function getEmoji(_slug: string, category: string): string {
  return categoryEmoji[category] || categoryEmoji[normalizeCategory(category)] || ''
}

/** All articles as lightweight metadata, sorted by date (newest first) */
export const allArticlesMeta: BlogArticleMeta[] = Object.entries(allArticles)
  .map(([slug, a]) => ({
    slug,
    title: a.title,
    excerpt: a.excerpt,
    category: normalizeCategory(a.category),
    tags: a.tags || [],
    date: a.date,
    readTime: a.readTime,
    image: getEmoji(slug, a.category),
  }))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

/** All unique categories across every article */
export const allCategories: string[] = [
  'Tous',
  ...Array.from(new Set(allArticlesMeta.map((a) => a.category))).sort(),
]
