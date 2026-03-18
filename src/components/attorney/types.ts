// Types for attorney profile components

export interface ServicePrice {
  name: string
  description: string
  price: string
  duration?: string
}

export type MediaType = 'image' | 'video' | 'before_after'

export interface PortfolioItem {
  id: string
  title: string
  description: string
  imageUrl: string
  category: string
  mediaType?: MediaType
  videoUrl?: string
  beforeImageUrl?: string
  afterImageUrl?: string
  thumbnailUrl?: string
}

/** @deprecated Use AttorneyProfile instead. Kept for backward compatibility. */
export interface Artisan {
  id: string
  stable_id?: string
  slug?: string
  business_name: string | null
  first_name: string | null
  last_name: string | null
  city: string
  city_slug?: string
  postal_code: string
  address?: string
  department?: string
  department_code?: string
  region?: string
  specialty: string
  specialty_slug?: string
  description?: string
  average_rating: number
  review_count: number
  is_verified: boolean
  is_center?: boolean
  team_size?: number
  services: string[]
  service_prices: ServicePrice[]
  accepts_new_clients?: boolean
  member_since?: string
  portfolio?: PortfolioItem[]
  faq?: Array<{ question: string; answer: string }>
  bar_number?: string
  ein?: string
  legal_form?: string
  creation_date?: string
  phone?: string
  phone_secondary?: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  prices_are_estimated?: boolean
  available_24h?: boolean
  // DB-bound: keys from database (ouvert/debut/fin stored in Supabase JSONB -- legacy column names, do not rename without migration)
  opening_hours?: Record<string, { ouvert: boolean; debut: string; fin: string }>
  free_quote?: boolean
  intervention_radius_km?: number
  bio?: string
  updated_at?: string
  // GUARD: Do NOT add is_premium, hourly_rate, response_time, avatar_url,
  // certifications, insurance, payment_methods, languages, emergency_available,
  // experience_years, employee_count, hourly_rate_min/max here.
  // Legacy fields live in src/types/legacy/ (LegacyAttorney).
}

export interface Review {
  id: string
  author: string
  rating: number
  rating_communication?: number
  rating_result?: number
  rating_responsiveness?: number
  date: string
  dateISO?: string
  comment: string
  service: string
  hasPhoto?: boolean
  photoUrl?: string
  verified?: boolean
  helpful_count?: number
  attorney_response?: string
  attorney_responded_at?: string
}

export function getDisplayName(attorney: Artisan): string {
  if (attorney.is_center && attorney.business_name) {
    return attorney.business_name
  }
  if (attorney.business_name) {
    return attorney.business_name
  }
  return `${attorney.first_name || ''} ${attorney.last_name || ''}`.trim() || 'Attorney'
}

/** Preferred alias for Artisan interface */
export type AttorneyProfile = Artisan
