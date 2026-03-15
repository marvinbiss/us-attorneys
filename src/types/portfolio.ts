/**
 * Portfolio types for artisan media gallery
 * Supports images, videos, and before/after comparisons
 */

export type MediaType = 'image' | 'video' | 'before_after'

export interface PortfolioItem {
  id: string
  attorney_id: string
  title: string
  description: string | null
  image_url: string
  thumbnail_url: string | null
  video_url: string | null
  before_image_url: string | null
  after_image_url: string | null
  category: string | null
  tags: string[] | null
  media_type: MediaType
  is_featured: boolean
  is_visible: boolean
  display_order: number
  file_size: number | null
  mime_type: string | null
  created_at: string
  updated_at: string
}

export interface PortfolioItemInsert {
  attorney_id: string
  title: string
  description?: string | null
  image_url: string
  thumbnail_url?: string | null
  video_url?: string | null
  before_image_url?: string | null
  after_image_url?: string | null
  category?: string | null
  tags?: string[] | null
  media_type?: MediaType
  is_featured?: boolean
  is_visible?: boolean
  display_order?: number
  file_size?: number | null
  mime_type?: string | null
}

export interface PortfolioItemUpdate {
  title?: string
  description?: string | null
  image_url?: string
  thumbnail_url?: string | null
  video_url?: string | null
  before_image_url?: string | null
  after_image_url?: string | null
  category?: string | null
  tags?: string[] | null
  media_type?: MediaType
  is_featured?: boolean
  is_visible?: boolean
  display_order?: number
}

export interface PortfolioReorderItem {
  id: string
  display_order: number
}

export interface UploadedFile {
  url: string
  thumbnailUrl?: string
  fileName: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  duration?: number // For videos, in seconds
}

export interface UploadProgress {
  fileName: string
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

// Categories for portfolio items
export const PORTFOLIO_CATEGORIES = [
  { value: 'renovation', label: 'Renovation' },
  { value: 'construction', label: 'Construction' },
  { value: 'installation', label: 'Installation' },
  { value: 'reparation', label: 'Repair' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'amenagement', label: 'Development' },
  { value: 'entretien', label: 'Maintenance' },
  { value: 'autre', label: 'Other' },
] as const

export type PortfolioCategory = typeof PORTFOLIO_CATEGORIES[number]['value']

// File validation constants
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
