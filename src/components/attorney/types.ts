// Types pour les composants artisan

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
  siret?: string
  siren?: string
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
  opening_hours?: Record<string, { ouvert: boolean; debut: string; fin: string }>
  free_quote?: boolean
  intervention_radius_km?: number
  bio?: string
  updated_at?: string
  // GUARD: Do NOT add is_premium, hourly_rate, response_time, avatar_url,
  // certifications, insurance, payment_methods, languages, emergency_available,
  // experience_years, employee_count, hourly_rate_min/max here.
  // Legacy fields live in src/types/legacy/ (LegacyArtisan).
}

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  dateISO?: string
  comment: string
  service: string
  hasPhoto?: boolean
  photoUrl?: string
  verified?: boolean
}

export function getDisplayName(artisan: Artisan): string {
  if (artisan.is_center && artisan.business_name) {
    return artisan.business_name
  }
  if (artisan.business_name) {
    return artisan.business_name
  }
  return `${artisan.first_name || ''} ${artisan.last_name || ''}`.trim() || 'Artisan'
}
