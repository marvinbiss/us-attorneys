/**
 * Blog category utilities -- slug <-> label mapping for crawlable category pages.
 */

export interface BlogCategory {
  slug: string
  label: string
  description: string
  metaTitle: string
  metaDescription: string
}

/** All blog categories with SEO metadata */
export const blogCategories: BlogCategory[] = []

/** Slugify a category label for URL usage */
export function categoryToSlug(label: string): string {
  const found = blogCategories.find(c => c.label === label)
  if (found) return found.slug
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Find a category by its URL slug */
export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return blogCategories.find(c => c.slug === slug)
}

/** Map a category label to its normalized form (handles accent variants) */
const categoryNormalize: Record<string, string> = {
  'Securite': 'Securite',
  'Energie': 'Energie',
}

export function normalizeCategory(category: string): string {
  return categoryNormalize[category] || category
}
