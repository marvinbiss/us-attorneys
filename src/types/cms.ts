// CMS Types for US Attorneys

export type CmsPageType = 'static' | 'blog' | 'service' | 'location' | 'homepage' | 'faq'
export type CmsStatus = 'draft' | 'published' | 'archived'

export interface CmsPage {
  id: string
  slug: string
  page_type: CmsPageType
  title: string
  content_json: Record<string, unknown> | null
  content_html: string | null
  structured_data: Record<string, unknown> | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  canonical_url: string | null
  excerpt: string | null
  author: string | null
  author_bio: string | null
  category: string | null
  tags: string[]
  read_time: string | null
  featured_image: string | null
  service_slug: string | null
  location_slug: string | null
  status: CmsStatus
  published_at: string | null
  published_by: string | null
  sort_order: number
  is_active: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface CmsPageVersion {
  id: string
  page_id: string
  version_number: number
  title: string
  content_json: Record<string, unknown> | null
  content_html: string | null
  structured_data: Record<string, unknown> | null
  meta_title: string | null
  meta_description: string | null
  status: CmsStatus
  created_by: string | null
  created_at: string
  change_summary: string | null
}

// Structured data types per page_type
export interface ServiceStructuredData {
  priceRange?: { min: number; max: number; unit: string }
  commonTasks?: Array<{ name: string; priceMin: number; priceMax: number }>
  tips?: string[]
  faq?: Array<{ question: string; answer: string }>
  certifications?: string[]
  emergencyInfo?: string
  averageResponseTime?: string
}

export interface HomepageStructuredData {
  heroTitle?: string
  heroSubtitle?: string
  heroCtaText?: string
  heroCtaUrl?: string
  sections?: Array<{ id: string; title: string; subtitle?: string }>
}

export interface FaqStructuredData {
  categoryName: string
  items: Array<{ question: string; answer: string }>
}

// API request/response types
export interface CmsPageCreateInput {
  slug: string
  page_type: CmsPageType
  title: string
  content_json?: Record<string, unknown> | null
  content_html?: string | null
  structured_data?: Record<string, unknown> | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  canonical_url?: string | null
  excerpt?: string | null
  author?: string | null
  author_bio?: string | null
  category?: string | null
  tags?: string[]
  read_time?: string | null
  featured_image?: string | null
  service_slug?: string | null
  location_slug?: string | null
  sort_order?: number
}

// Note: status is NOT included — use the /publish endpoint to change status
export type CmsPageUpdateInput = Partial<CmsPageCreateInput>

export interface CmsPageListParams {
  page?: number
  pageSize?: number
  page_type?: CmsPageType
  status?: CmsStatus
  search?: string
  sortBy?: 'title' | 'updated_at' | 'published_at' | 'created_at' | 'status' | 'page_type'
  sortOrder?: 'asc' | 'desc'
}
