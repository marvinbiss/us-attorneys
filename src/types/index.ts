export interface Service {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  icon?: string
  meta_title?: string
  meta_description?: string
  is_active: boolean
  created_at?: string
}

export interface Location {
  id: string
  name: string
  slug: string
  postal_code?: string
  insee_code?: string
  department_code?: string
  department_name?: string
  region_code?: string
  region_name?: string
  latitude?: number
  longitude?: number
  population?: number
  is_active?: boolean
  created_at?: string
}

export interface Provider {
  id: string
  stable_id?: string | null
  name: string
  slug: string
  siren?: string
  siret?: string
  bar_number?: string
  email?: string
  phone?: string
  website?: string
  address_street?: string
  address_city?: string
  address_postal_code?: string
  address_department?: string
  address_region?: string
  latitude?: number
  longitude?: number
  legal_form?: string
  creation_date?: string
  is_verified: boolean
  is_active: boolean
  noindex: boolean
  meta_description?: string
  description?: string
  specialty?: string
  created_at: string
  updated_at: string
  source?: string
  source_id?: string
  rating_average?: number
  review_count?: number
  available_24h?: boolean
  phone_secondary?: string
  // DB-bound: French keys from database (ouvert/debut/fin stored in Supabase JSONB)
  opening_hours?: Record<string, { ouvert: boolean; debut: string; fin: string }>
  accepts_new_clients?: boolean
  free_quote?: boolean
  intervention_radius_km?: number
  service_prices?: Array<{ name: string; description?: string; price: string; duration?: string }>
  faq?: Array<{ question: string; answer: string }>
  team_size?: number
  services_offered?: string[]
  bio?: string
  certifications?: string[]
  avatar_url?: string | null
  // GUARD: Do NOT add is_premium, trust_badge, trust_score here.
  // Legacy fields live in src/types/legacy/ (LegacyProvider).
  // Relations
  provider_services?: ProviderService[]
  provider_locations?: ProviderLocation[]
}

export interface ProviderService {
  id: string
  attorney_id: string
  service_id: string
  experience_years?: number
  is_primary: boolean
  price_min?: number
  price_max?: number
  price_unit?: string
  created_at: string
  // Relations
  service?: Service
}

export interface ProviderLocation {
  id: string
  attorney_id: string
  location_id: string
  radius_km?: number
  is_primary: boolean
  travel_fee?: number
  created_at: string
  // Relations
  location?: Location
}

export interface Review {
  id: string
  attorney_id: string
  author_name?: string
  rating: number
  comment?: string
  source?: string
  source_id?: string
  review_date?: string
  is_verified: boolean
  is_visible: boolean
  created_at: string
}

// Component props
export interface AttorneyCardProps {
  provider: Provider
  specialtySlug: string
  locationSlug: string
}

export interface MapProps {
  providers: Provider[]
  center: [number, number]
  zoom?: number
  onMarkerClick?: (provider: Provider) => void
}

export interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  verified?: boolean
  minRating?: number
  sortBy?: 'name' | 'rating' | 'distance'
}

// Supabase Client Type (for function parameters)
import type { SupabaseClient } from '@supabase/supabase-js'
export type SupabaseClientType = SupabaseClient

// Booking types
export interface BookingSlot {
  id: string
  start_time: string
  end_time: string
  is_available: boolean
  attorney_id?: string
}

export interface Booking {
  id: string
  attorney_id: string
  client_id?: string
  client_email: string
  client_name: string
  client_phone?: string
  service: string
  booking_date: string
  slot_id?: string
  slot?: BookingSlot
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  amount?: number
  created_at: string
  updated_at?: string
  provider?: Provider
  client?: {
    id: string
    email: string
    full_name: string
    phone?: string
  }
}

// City data for service pages
export interface CityData {
  city: string
  name?: string
  postal_code?: string
  attorney_count?: number
  latitude?: number
  longitude?: number
}

// Analytics gtag type
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// Portfolio types
export * from './portfolio'
