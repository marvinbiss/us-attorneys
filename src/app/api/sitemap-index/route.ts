import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'
import { services, states } from '@/lib/data/usa'
import { tradeContent, getPracticeAreaSlugs } from '@/lib/data/trade-content'
import { getProblemSlugs } from '@/lib/data/problems'

// Must match the BATCH constants used in sitemap.ts sitemap() handlers
const BATCH_SIZE = 10_000
const LARGE_BATCH = 45_000
const ATTORNEY_BATCH_SIZE = 5_000
// Max provider sitemaps to avoid declaring hundreds of broken sitemaps
const MAX_ATTORNEY_SITEMAPS = 20

/**
 * Sitemap index generator — workaround for Next.js 14.2 not auto-generating
 * the sitemap index at /sitemap.xml when using generateSitemaps().
 *
 * This route is rewritten from /sitemap.xml via next.config.js.
 * Keep in sync with generateSitemaps() in src/app/sitemap.ts.
 *
 * IMPORTANT: All intent pages (quotes, reviews, pricing, emergency, issues) use
 * Phase 1 (top 300 cities) to avoid declaring sitemaps that can't be served.
 * Neighborhood-level sitemaps are removed entirely.
 */
export async function GET() {
  const emergencySlugs = Object.keys(tradeContent)
  const tradeSlugs = getPracticeAreaSlugs()
  const reviewServiceSlugs = Object.keys(tradeContent)
  const problemSlugs = getProblemSlugs()

  // Phase 1: top-300 cities only (conservative crawl budget for new domain).
  // Must match TOP_CITIES_PHASE1 in sitemap.ts.
  const TOP_CITIES_PHASE1 = 300

  const ids: string[] = [
    'static',
    // service × city pages — uses LARGE_BATCH (45000) in sitemap()
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / LARGE_BATCH) }, (_, i) => `service-cities-${i}`),
    'cities',
    'geo',
    // Neighborhood & service-neighborhood sitemaps REMOVED — too granular for new domain
    'quotes-services',
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `quotes-service-cities-${i}`),
    ...Array.from({ length: Math.ceil(emergencySlugs.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `emergency-service-cities-${i}`),
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `tarifs-service-cities-${i}`),
    // tarifs task×city pages — uses LARGE_BATCH (45000) in sitemap()
    ...(() => {
      const totalTaskCount = Object.values(tradeContent).reduce((sum, t) => sum + t.commonTasks.length, 0)
      return Array.from({ length: Math.ceil(totalTaskCount * TOP_CITIES_PHASE1 / LARGE_BATCH) }, (_, i) => `tarifs-task-cities-${i}`)
    })(),
    'reviews-services',
    ...Array.from({ length: Math.ceil(reviewServiceSlugs.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `reviews-service-cities-${i}`),
    'issues',
    ...Array.from({ length: Math.ceil(problemSlugs.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `issues-cities-${i}`),
    // dept-services uses LARGE_BATCH (45000) in sitemap()
    ...Array.from({ length: Math.ceil(states.length * tradeSlugs.length / LARGE_BATCH) }, (_, i) => `dept-services-${i}`),
    'region-services',
  ]

  // Provider sitemaps (DB-dependent, served via /api/sitemap-providers)
  // Capped to MAX_ATTORNEY_SITEMAPS to avoid declaring hundreds of broken sitemaps
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('noindex', false)

    if (!error && count && count > 0) {
      const batchCount = Math.min(Math.ceil(count / ATTORNEY_BATCH_SIZE), MAX_ATTORNEY_SITEMAPS)
      for (let i = 0; i < batchCount; i++) {
        ids.push(`providers-${i}`)
      }
    }
  } catch {
    // DB unavailable — omit provider sitemaps from index
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ids.map(id => `  <sitemap><loc>${SITE_URL}/sitemap/${id}.xml</loc></sitemap>`),
    '</sitemapindex>',
  ].join('\n')

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
