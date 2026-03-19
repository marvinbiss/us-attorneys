import { createClient } from '@/lib/supabase/server'
import { getCachedData, generateCacheKey, CACHE_TTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

export interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  category: string | null
  is_active: boolean
}

export interface Attorney {
  id: string
  name: string
  specialty: { slug: string; name: string } | null
  address_city: string
  address_zip: string
  rating_average: number
  review_count: number
  is_verified: boolean
  is_active: boolean
}

/**
 * Get all services
 */
export async function getSpecialties(): Promise<Service[]> {
  return getCachedData(
    'services:all',
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('specialties')
        .select('id, name, slug, description, icon, category, is_active')
        .eq('is_active', true)
        .order('name')

      if (error) {
        logger.error('Error fetching services', error)
        return []
      }

      return data || []
    },
    CACHE_TTL.services
  )
}

/**
 * Get service by slug
 */
export async function getSpecialtyBySlug(slug: string): Promise<Service | null> {
  return getCachedData(
    `service:${slug}`,
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('specialties')
        .select('id, name, slug, description, icon, category, is_active')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        logger.error('Error fetching service', error)
        return null
      }

      return data
    },
    CACHE_TTL.services
  )
}

/**
 * Get attorneys by service and location
 */
export async function getAttorneys(params: {
  service?: string
  city?: string
  postalCode?: string
  limit?: number
  offset?: number
}): Promise<{ attorneys: Attorney[]; total: number }> {
  const cacheKey = generateCacheKey('attorneys', params)

  return getCachedData(
    cacheKey,
    async () => {
      const supabase = await createClient()
      let query = supabase
        .from('attorneys')
        .select(
          'id, name, slug, primary_specialty_id, address_city, address_zip, rating_average, review_count, is_verified, is_active, specialty:specialties!primary_specialty_id(slug,name)',
          { count: 'exact' }
        )
        .eq('is_active', true)
        .eq('is_verified', true)

      if (params.service) {
        // Resolve specialty slug to ID for filtering
        const { data: specData } = await supabase
          .from('specialties')
          .select('id')
          .eq('slug', params.service)
          .single()
        if (specData) {
          query = query.eq('primary_specialty_id', specData.id)
        }
      }

      if (params.city) {
        query = query.in('address_city', [params.city])
      }

      if (params.postalCode) {
        query = query.like('address_zip', `${params.postalCode.substring(0, 2)}%`)
      }

      // Order by rating
      query = query.order('rating_average', { ascending: false, nullsFirst: false })

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        logger.error('Error fetching attorneys', error)
        return { attorneys: [], total: 0 }
      }

      return {
        attorneys: (data || []).map((a) => ({
          id: a.id,
          name: a.name || 'Attorney',
          // Supabase embedded join returns array type but resolves to single object at runtime
          specialty: (Array.isArray(a.specialty) ? (a.specialty[0] ?? null) : a.specialty) as {
            slug: string
            name: string
          } | null,
          address_city: a.address_city || '',
          address_zip: a.address_zip || '',
          rating_average: a.rating_average || 0,
          review_count: a.review_count || 0,
          is_verified: a.is_verified || false,
          is_active: a.is_active || false,
        })),
        total: count || 0,
      }
    },
    CACHE_TTL.attorneys
  )
}

/**
 * Get attorney by ID
 */
export async function getAttorneyById(id: string): Promise<Attorney | null> {
  return getCachedData(
    `attorney:${id}`,
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('attorneys')
        .select(
          'id, name, slug, primary_specialty_id, address_city, address_zip, rating_average, review_count, is_verified, is_active, specialty:specialties!primary_specialty_id(slug,name)'
        )
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        logger.error('Error fetching attorney', error)
        return null
      }

      return {
        id: data.id,
        name: data.name || 'Attorney',
        // Supabase embedded join returns array type but resolves to single object at runtime
        specialty: (Array.isArray(data.specialty)
          ? (data.specialty[0] ?? null)
          : data.specialty) as { slug: string; name: string } | null,
        address_city: data.address_city || '',
        address_zip: data.address_zip || '',
        rating_average: data.rating_average || 0,
        review_count: data.review_count || 0,
        is_verified: data.is_verified || false,
        is_active: data.is_active || false,
      }
    },
    CACHE_TTL.attorneys
  )
}

/**
 * Get reviews for an attorney
 */
export async function getAttorneyReviews(attorneyId: string, limit = 10) {
  return getCachedData(
    `reviews:${attorneyId}:${limit}`,
    async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `
          id, attorney_id, rating, comment, client_name, would_recommend, status, attorney_response, attorney_responded_at, helpful_count, created_at
        `
        )
        .eq('attorney_id', attorneyId)
        // REMOVED: .eq('is_verified', true) to show ALL real reviews
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Error fetching reviews', error)
        return []
      }

      return data || []
    },
    CACHE_TTL.reviews
  )
}

/**
 * Get platform stats
 *
 * Uses the v_public_stats SQL view (migration 109) which computes all
 * aggregates server-side in a single query instead of fetching rows to JS.
 */
export async function getPlatformStats() {
  return getCachedData(
    'stats:platform',
    async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('v_public_stats')
        .select('total_verified, total_reviews, avg_rating, total_cities')
        .single()

      if (error) {
        logger.error('Error fetching platform stats', error)
        return {
          totalAttorneys: 0,
          totalReviews: 0,
          averageRating: 0,
          totalCities: 0,
        }
      }

      return {
        totalAttorneys: data.total_verified || 0,
        totalReviews: data.total_reviews || 0,
        averageRating: data.avg_rating || 0,
        totalCities: data.total_cities || 0,
      }
    },
    CACHE_TTL.stats
  )
}
