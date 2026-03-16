/**
 * Centralized image bank — US Attorneys
 * Source: Unsplash (free license, commercial use allowed)
 */

// ── Helper ───────────────────────────────────────────────────────
function unsplash(id: string, w = 800, h = 600): string {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`
}

/** Generic blur placeholder (neutral gray) — usable everywhere */
export const BLUR_PLACEHOLDER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAFAAgDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAABv/EAB0QAAICAgMBAAAAAAAAAAAAAAECAxEABBIhMUH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAEDAAIRIf/aAAwDAQACEQMRAD8AoNnYig1IYkjJZgLdj2fueYsXExif/9k='

// ── 1. HERO HOMEPAGE ─────────────────────────────────────────────
export const heroImage = {
  src: unsplash('photo-1589829545856-d10d557cf95f', 1920, 1080),
  alt: 'Professional attorney in a modern law office',
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAFAAgDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABwQAAICAgMAAAAAAAAAAAAAAAABAgMEBREhMf/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAWEQEBAQAAAAAAAAAAAAAAAAABAAL/2gAMAwEAAhEDEQA/AKmTl1dEIVRXdbJLt+gA0Jdl/9k=',
}

// ── 2. IMAGES BY PRACTICE AREA (service) — legal images ─────────
export const serviceImages: Record<string, { src: string; alt: string }> = {}

// Default image for unlisted practice areas
export const defaultServiceImage = {
  src: unsplash('photo-1589829545856-d10d557cf95f'),
  alt: 'Professional attorney at work',
}

/** Get the image for a practice area by its slug */
export function getServiceImage(slug: string) {
  return serviceImages[slug] || defaultServiceImage
}

// ── 3. ATTORNEY FACES (trust) ────────────────────────────────────
export const artisanFaces: { src: string; alt: string; name: string; specialty: string }[] = []

// ── 4. CLIENT TESTIMONIALS ───────────────────────────────────────
export const testimonialImages: { name: string; text: string; city: string; rating: number }[] = []

// ── 5. BEFORE / AFTER — Case Results Showcase ────────────────────
export const beforeAfterPairs: { before: string; after: string; alt: string; category: string }[] = []

// ── 6. IMAGES FOR TOP 20 US CITIES ──────────────────────────────
export const cityImages: Record<string, { src: string; alt: string }> = {}

/** Get the image for a city by its slug */
export function getCityImage(slug: string) {
  return cityImages[slug] || null
}

// ── STATE → image via capital/largest city ────────────────────────
const deptCodeToCitySlug: Record<string, string> = {}

/** Image for a state (capital → cityImage, otherwise hero) */
export function getDepartmentImage(deptCode: string): { src: string; alt: string } {
  const citySlug = deptCodeToCitySlug[deptCode]
  if (citySlug && cityImages[citySlug]) return cityImages[citySlug]
  return heroImage
}

// ── REGION → image via main city ─────────────────────────────────
const regionSlugToCitySlug: Record<string, string> = {}

/** Image for a region (main city → cityImage, otherwise hero) */
export function getRegionImage(regionSlug: string): { src: string; alt: string } {
  const citySlug = regionSlugToCitySlug[regionSlug]
  if (citySlug && cityImages[citySlug]) return cityImages[citySlug]
  return heroImage
}

// ── 7. STATIC PAGES ──────────────────────────────────────────────
export const pageImages: Record<string, { src: string; alt: string }[]> = {}

// ── 8. AMBIANCE IMAGES ───────────────────────────────────────────
export const ambianceImages: Record<string, string> = {}

// ── 9. BLOG — Unique images per article ──────────────────────────

/** Deterministic hash for variant selection */
function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const blogPools: Record<string, { src: string; alt: string }[]> = {}

const blogCategoryFallbacks: Record<string, string> = {}

const defaultBlogImage = {
  src: unsplash('photo-1589829545856-d10d557cf962', 1200, 630),
  alt: 'Legal services and attorney consultation',
}

/**
 * Get the image for a blog article.
 * Priority: slug → pool (hash variant) → category pool → default.
 * Each article gets a unique image via deterministic hash.
 */
export function getBlogImage(
  slug: string,
  category?: string,
): { src: string; alt: string } {
  const lower = slug.toLowerCase()
  const hash = slugHash(lower)

  // 1. Match by keyword in slug → pool + variant
  for (const [, poolKey] of Object.entries(blogPools)) {
    if (typeof poolKey === 'string') break // blogPools is empty, this is a no-op
  }

  // 2. Fallback by category → pool + variant
  if (category) {
    const poolKey = blogCategoryFallbacks[category]
    if (poolKey) {
      const pool = blogPools[poolKey]
      if (pool && pool.length > 0) {
        return pool[hash % pool.length]
      }
    }
  }

  // 3. Default
  return defaultBlogImage
}
