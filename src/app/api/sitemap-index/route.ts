import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'
import { services, departements } from '@/lib/data/france'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { getProblemSlugs } from '@/lib/data/problems'

// Must match the BATCH constants used in sitemap.ts sitemap() handlers
const BATCH_SIZE = 10_000
const LARGE_BATCH = 45_000
const PROVIDER_BATCH_SIZE = 5_000
// Max provider sitemaps to avoid declaring hundreds of broken sitemaps
const MAX_PROVIDER_SITEMAPS = 20

/**
 * Sitemap index generator — workaround for Next.js 14.2 not auto-generating
 * the sitemap index at /sitemap.xml when using generateSitemaps().
 *
 * This route is rewritten from /sitemap.xml via next.config.js.
 * Keep in sync with generateSitemaps() in src/app/sitemap.ts.
 *
 * IMPORTANT: All intent pages (devis, avis, tarifs, urgence, problemes) use
 * Phase 1 (top 300 cities) to avoid declaring sitemaps that can't be served.
 * Quartier-level sitemaps are removed entirely.
 */
export async function GET() {
  const emergencySlugs = Object.keys(tradeContent).filter(s => tradeContent[s].emergencyInfo)
  const tradeSlugs = getTradesSlugs()
  const avisServiceSlugs = Object.keys(tradeContent)
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
    // Quartier & service-quartier sitemaps REMOVED — too granular for new domain
    'devis-services',
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `devis-service-cities-${i}`),
    ...Array.from({ length: Math.ceil(emergencySlugs.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `urgence-service-cities-${i}`),
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `tarifs-service-cities-${i}`),
    // tarifs task×city pages — uses LARGE_BATCH (45000) in sitemap()
    ...(() => {
      const totalTaskCount = Object.values(tradeContent).reduce((sum, t) => sum + t.commonTasks.length, 0)
      return Array.from({ length: Math.ceil(totalTaskCount * TOP_CITIES_PHASE1 / LARGE_BATCH) }, (_, i) => `tarifs-task-cities-${i}`)
    })(),
    'avis-services',
    ...Array.from({ length: Math.ceil(avisServiceSlugs.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `avis-service-cities-${i}`),
    'problemes',
    ...Array.from({ length: Math.ceil(problemSlugs.length * TOP_CITIES_PHASE1 / BATCH_SIZE) }, (_, i) => `problemes-cities-${i}`),
    // dept-services uses LARGE_BATCH (45000) in sitemap()
    ...Array.from({ length: Math.ceil(departements.length * tradeSlugs.length / LARGE_BATCH) }, (_, i) => `dept-services-${i}`),
    'region-services',
  ]

  // Provider sitemaps (DB-dependent, served via /api/sitemap-providers)
  // Capped to MAX_PROVIDER_SITEMAPS to avoid declaring hundreds of broken sitemaps
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('noindex', false)

    if (!error && count && count > 0) {
      const batchCount = Math.min(Math.ceil(count / PROVIDER_BATCH_SIZE), MAX_PROVIDER_SITEMAPS)
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
