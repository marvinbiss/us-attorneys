/**
 * Server functions to fetch real statistics from Supabase
 * Used in SSR/ISR pages — DO NOT import in client components
 *
 * Functions are wrapped with unstable_cache to guarantee CDN caching.
 * Without this wrapper, Supabase calls (third-party fetch) bypass the Next.js cache
 * and force dynamic rendering on each request.
 */

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedData, CACHE_TTL } from '@/lib/cache'

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

/** Total number of active attorneys in the database */
async function _getAttorneyCount(): Promise<number> {
  try {
    const supabase = createAdminClient()
    const { count } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    return count ?? 0
  } catch {
    return 0
  }
}

export const getAttorneyCount = unstable_cache(_getAttorneyCount, ['provider-count'], {
  revalidate: 3600, // 1h — aligned with root layout revalidate
  tags: ['providers'],
})

/** Number of active attorneys in a region (by region name) */
export async function getAttorneyCountByRegion(regionName: string): Promise<number> {
  // Fail open at build: default to indexed. ISR will correct with real DB data.
  if (IS_BUILD) return 1
  return getCachedData(
    `attorney-count:region:${regionName}`,
    async () => {
      try {
        const supabase = createAdminClient()
        const { count } = await supabase
          .from('attorneys')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('address_region', regionName)
        return count ?? 0
      } catch {
        return 1 // Fail open: default to indexed. ISR will correct with real DB data.
      }
    },
    CACHE_TTL.stats,
  )
}

/** Number of active attorneys in a state (by state name) */
export async function getAttorneyCountByDepartment(deptName: string): Promise<number> {
  // Fail open at build: default to indexed. ISR will correct with real DB data.
  if (IS_BUILD) return 1
  return getCachedData(
    `attorney-count:dept:${deptName}`,
    async () => {
      try {
        const supabase = createAdminClient()
        const { count } = await supabase
          .from('attorneys')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('address_department', deptName)
        return count ?? 0
      } catch {
        return 1 // Fail open: default to indexed. ISR will correct with real DB data.
      }
    },
    CACHE_TTL.stats,
  )
}

/** Format an attorney count for display (e.g. 12,450) */
export function formatAttorneyCount(count: number): string {
  return count.toLocaleString('en-US')
}

export interface SiteStats {
  attorneyCount: number
  reviewCount: number
  avgRating: number
  deptCount: number
}

// ── Homepage-specific types ──────────────────────────────────────
export interface HomepageProvider {
  name: string
  slug: string
  specialty: { name: string; slug: string } | null
  address_city: string | null
  address_zip: string | null
  is_verified: boolean
  rating_average: number | null
  review_count: number | null
  stable_id: string | null
}

export interface HomepageReview {
  client_name: string | null
  rating: number
  comment: string | null
  created_at: string
}

export interface HomepageData extends SiteStats {
  specialtyCounts: Record<string, number>
  topProviders: HomepageProvider[]
  recentReviews: HomepageReview[]
}

/** All site stats in a single call (for the homepage) */
export async function getSiteStats(): Promise<SiteStats> {
  return getCachedData(
    'site-stats:all',
    async () => {
      try {
        const supabase = createAdminClient()

        const [providerRes, reviewCountRes, ratingsRes, deptRes] = await Promise.all([
          supabase
            .from('attorneys')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published'),
          supabase
            .from('reviews')
            .select('rating')
            .eq('status', 'published')
            .limit(500),
          supabase
            .from('locations_us')
            .select('departement_code')
            .gt('attorney_count', 0)
            .not('departement_code', 'is', null)
            .limit(10000),
        ])

        const attorneyCount = providerRes.count ?? 0
        const reviewCount = reviewCountRes.count ?? 0

        let avgRating = 4.9
        if (ratingsRes.data && ratingsRes.data.length >= 5) {
          const sum = ratingsRes.data.reduce((acc, r) => acc + (r.rating ?? 0), 0)
          const computed = Math.round((sum / ratingsRes.data.length) * 10) / 10
          if (computed >= 1 && computed <= 5) avgRating = computed
        }

        const depts = new Set(deptRes.data?.map(c => c.departement_code).filter(Boolean))
        const deptCount = depts.size || 96

        return { attorneyCount, reviewCount, avgRating, deptCount }
      } catch {
        return { attorneyCount: 0, reviewCount: 0, avgRating: 4.9, deptCount: 96 }
      }
    },
    CACHE_TTL.stats,
  )
}

const HOMEPAGE_SERVICE_SLUGS = [
  'personal-injury', 'criminal-defense', 'family-law', 'estate-planning',
  'immigration', 'business-law', 'employment-law', 'real-estate-law',
]

/** Complete homepage data: stats + providers + reviews + counters */
export async function getHomepageData(): Promise<HomepageData> {
  const stats = await getSiteStats()

  if (IS_BUILD) {
    return { ...stats, specialtyCounts: {}, topProviders: [], recentReviews: [] }
  }

  return getCachedData(
    'homepage-data:all',
    async () => {
      try {
        const supabase = createAdminClient()
        const { getAttorneyCountByService } = await import('@/lib/supabase')

        const [countsResults, providersRes, reviewsRes] = await Promise.all([
          Promise.all(
            HOMEPAGE_SERVICE_SLUGS.map(async (slug) => {
              const count = await getAttorneyCountByService(slug)
              return [slug, count] as const
            })
          ),
          supabase
            .from('attorneys')
            .select('name, slug, address_city, address_zip, is_verified, rating_average, review_count, stable_id, specialty:specialties!primary_specialty_id(name, slug)')
            .eq('is_active', true)
            .eq('is_verified', true)
            .not('rating_average', 'is', null)
            .not('address_city', 'is', null)
            .not('primary_specialty_id', 'is', null)
            .gt('review_count', 2)
            .lt('review_count', 500)
            .gte('rating_average', 4)
            .order('review_count', { ascending: false })
            .order('rating_average', { ascending: false })
            .limit(3),
          supabase
            .from('reviews')
            .select('client_name, rating, comment, created_at')
            .eq('status', 'published')
            .not('comment', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10),
        ])

        const specialtyCounts: Record<string, number> = {}
        for (const [slug, count] of countsResults) {
          specialtyCounts[slug] = count
        }

        return {
          ...stats,
          specialtyCounts,
          topProviders: (providersRes.data ?? []) as unknown as HomepageProvider[],
          recentReviews: (reviewsRes.data ?? []) as HomepageReview[],
        }
      } catch {
        return { ...stats, specialtyCounts: {}, topProviders: [], recentReviews: [] }
      }
    },
    CACHE_TTL.stats,
    { skipNull: true },
  )
}
