export const PAGE_TYPE_OPTIONS = [
  { value: 'static', label: 'Static page' },
  { value: 'blog', label: 'Blog post' },
  { value: 'service', label: 'Service page' },
  { value: 'location', label: 'Location page' },
  { value: 'homepage', label: 'Homepage' },
  { value: 'faq', label: 'FAQ' },
] as const

export const BLOG_CATEGORIES = [
  'Tips', 'Guides', 'News', 'Testimonials', 'Regulations', 'Trends', 'How-to'
] as const

// Matches DB CHECK and Zod schema constraints
export const FIELD_LIMITS = {
  title: 500,
  slug: 200,
  excerpt: 1000,
  author: 200,
  authorBio: 2000,
  category: 200,
  metaTitle: 70,
  metaDescription: 170,
  readTime: 50,
  ogImageUrl: 2048,
  canonicalUrl: 2048,
  featuredImage: 2048,
  tagsMax: 50,
  tagItemMax: 100,
} as const

export function buildPayload(formData: {
  slug: string
  pageType: string
  title: string
  contentJson: Record<string, unknown> | null
  contentHtml: string
  structuredData: Record<string, unknown> | null
  metaTitle: string
  metaDescription: string
  ogImageUrl: string
  canonicalUrl: string
  excerpt: string
  author: string
  authorBio: string
  category: string
  tags: string[]
  readTime: string
  featuredImage: string
  specialtySlug: string
  locationSlug: string
  sortOrder: number
}) {
  return {
    slug: formData.slug,
    page_type: formData.pageType,
    title: formData.title,
    content_json: formData.contentJson,
    content_html: formData.contentHtml || null,
    structured_data: formData.structuredData,
    meta_title: formData.metaTitle || null,
    meta_description: formData.metaDescription || null,
    og_image_url: formData.ogImageUrl || null,
    canonical_url: formData.canonicalUrl || null,
    excerpt: formData.excerpt || null,
    author: formData.author || null,
    author_bio: formData.authorBio || null,
    category: formData.category || null,
    tags: formData.tags.filter(t => t.trim()),
    read_time: formData.readTime || null,
    featured_image: formData.featuredImage || null,
    service_slug: (formData.pageType === 'service' || formData.pageType === 'location') ? (formData.specialtySlug || null) : null,
    location_slug: formData.pageType === 'location' ? (formData.locationSlug || null) : null,
    sort_order: formData.sortOrder,
  }
}
