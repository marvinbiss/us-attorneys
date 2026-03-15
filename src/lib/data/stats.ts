/**
 * Fonctions serveur pour récupérer les vraies statistiques depuis Supabase
 * Utilisées dans les pages SSR/ISR — NE PAS importer dans des composants client
 *
 * Les fonctions sont wrappées avec unstable_cache pour garantir le CDN caching.
 * Sans ce wrapper, les appels Supabase (fetch tiers) contournent le cache Next.js
 * et forcent un rendu dynamique sur chaque requête.
 */

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

/** Nombre total d'artisans actifs dans la base */
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
  revalidate: 3600, // 1h — aligné sur le revalidate du root layout
  tags: ['providers'],
})

/** Nombre d'artisans actifs dans une région (par nom de région) */
export async function getAttorneyCountByRegion(regionName: string): Promise<number> {
  // Fail open at build: default to indexed. ISR will correct with real DB data.
  if (IS_BUILD) return 1
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
}

/** Nombre d'artisans actifs dans un département (par nom de département) */
export async function getAttorneyCountByDepartment(deptName: string): Promise<number> {
  // Fail open at build: default to indexed. ISR will correct with real DB data.
  if (IS_BUILD) return 1
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
}

/** Formate un nombre d'artisans pour l'affichage (ex: 12 450) */
export function formatAttorneyCount(count: number): string {
  return count.toLocaleString('fr-FR')
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
  specialty: string | null
  address_city: string | null
  address_postal_code: string | null
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

/** Toutes les stats du site en un seul appel (pour la homepage) */
export async function getSiteStats(): Promise<SiteStats> {
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
}

const HOMEPAGE_SERVICE_SLUGS = [
  'plombier', 'electricien', 'serrurier', 'chauffagiste',
  'peintre-en-batiment', 'menuisier', 'macon', 'jardinier',
]

/** Données complètes pour la homepage : stats + providers + avis + compteurs */
export async function getHomepageData(): Promise<HomepageData> {
  const stats = await getSiteStats()

  if (IS_BUILD) {
    return { ...stats, specialtyCounts: {}, topProviders: [], recentReviews: [] }
  }

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
        .select('name, slug, specialty, address_city, address_postal_code, is_verified, rating_average, review_count, stable_id')
        .eq('is_active', true)
        .eq('is_verified', true)
        .not('rating_average', 'is', null)
        .not('address_city', 'is', null)
        .not('specialty', 'is', null)
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
      topProviders: (providersRes.data ?? []) as HomepageProvider[],
      recentReviews: (reviewsRes.data ?? []) as HomepageReview[],
    }
  } catch {
    return { ...stats, specialtyCounts: {}, topProviders: [], recentReviews: [] }
  }
}
