import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import { services, cities, states, usRegions } from '@/lib/data/usa'
import { tradeContent, getPracticeAreaSlugs, parseTask } from '@/lib/data/trade-content'
import { getProblemSlugs } from '@/lib/data/problems'
import { getQuestionSlugs } from '@/lib/data/faq'
import { comparisons } from '@/lib/data/comparisons'
import { GSC_PRIORITY_CITIES } from '@/lib/seo/gsc-priority-cities'
import { articleSlugs } from '@/lib/data/blog/articles'
import { allArticles } from '@/lib/data/blog/articles'
import { blogCategories, categoryToSlug, normalizeCategory } from '@/lib/data/blog/categories'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'
// Return 404 for sitemap IDs not in generateSitemaps() — prevents ghost sitemaps
// from returning empty-but-valid XML that Google keeps crawling forever.
export const dynamicParams = false

// Use build date as lastModified for static hub pages — signals freshness to Google
const BUILD_DATE = new Date().toISOString().split('T')[0]

// Batch size for static (non-DB) sitemaps — must match the BATCH used in sitemap() slicing
const STATIC_BATCH = 10_000
const LARGE_BATCH = 45_000

// Phase 1: submit only top-300 cities for new domain (conservative crawl budget).
// Phase 2 (service-cities-extended) is handled below but NOT registered in generateSitemaps yet.
// Uncomment the Phase 2 line in generateSitemaps() once domain authority grows (month 2-3).
const TOP_CITIES_PHASE1 = 300

/**
 * Generate sitemap index entries.
 * Next.js 14 calls this to produce /sitemap/[id].xml and a sitemap index.
 */
export async function generateSitemaps() {
  // Phase 1: top 300 cities only — focused crawl budget on high-traffic cities for new domain.
  // ALL intent pages (quotes, reviews, pricing, emergency, issues) also use Phase 1 cities.
  // Neighborhood-level sitemaps are removed entirely (800K+ thin URLs = crawl budget waste).
  const serviceCitiesPhase1BatchCount = Math.ceil(services.length * TOP_CITIES_PHASE1 / LARGE_BATCH)

  const emergencySlugs = Object.keys(tradeContent)
  const reviewServiceSlugs = Object.keys(tradeContent)
  const problemSlugs = getProblemSlugs()

  // Count total task×city combinations for pricing-task-cities sitemaps
  // Note: sitemap IDs 'tarifs-*' are legacy — do not rename without updating Google Search Console
  const totalTaskCount = Object.values(tradeContent).reduce((sum, t) => sum + t.commonTasks.length, 0)
  const pricingTaskCitiesBatchCount = Math.ceil(totalTaskCount * TOP_CITIES_PHASE1 / LARGE_BATCH)

  const sitemaps: { id: string }[] = [
    { id: 'static' },
    ...Array.from({ length: serviceCitiesPhase1BatchCount }, (_, i) => ({ id: `service-cities-${i}` })),
    { id: 'cities' },
    { id: 'geo' },
    // Neighborhood & service-neighborhood sitemaps REMOVED — too granular for new domain
    { id: 'quotes-services' },
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `quotes-service-cities-${i}` })),
    ...Array.from({ length: Math.ceil(emergencySlugs.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `emergency-service-cities-${i}` })),
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `tarifs-service-cities-${i}` })),
    ...Array.from({ length: pricingTaskCitiesBatchCount }, (_, i) => ({ id: `tarifs-task-cities-${i}` })),
    { id: 'reviews-services' },
    ...Array.from({ length: Math.ceil(reviewServiceSlugs.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `reviews-service-cities-${i}` })),
    { id: 'issues' },
    ...Array.from({ length: Math.ceil(problemSlugs.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `issues-cities-${i}` })),
    ...Array.from(
      { length: Math.ceil(states.length * getPracticeAreaSlugs().length / LARGE_BATCH) },
      (_, i) => ({ id: `dept-services-${i}` })
    ),
    { id: 'region-services' },
  ]

  // Provider sitemaps are served dynamically via /api/sitemap-providers
  // (DB-dependent, can't reliably pre-render at build time).
  // They are referenced in the sitemap index (/api/sitemap-index) and
  // rewritten via next.config.js: /sitemap/providers-*.xml → /api/sitemap-providers?id=*

  return sitemaps
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {

  // ── Static pages + services ─────────────────────────────────────────
  if (id === 'static') {
    const homepage: MetadataRoute.Sitemap = [
      { url: SITE_URL, lastModified: BUILD_DATE },
    ]

    const staticPages: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/about`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/contact`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/blog`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/faq`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/how-it-works`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/pricing`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/emergency`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/quotes`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/verification-process`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/review-policy`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/mediation`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/guarantee`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/tools/diagnostic`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorney-map`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorneys`, lastModified: BUILD_DATE },
      // Tools & content pages
      { url: `${SITE_URL}/guides`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/compare`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/glossary`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/regulations`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorney-statistics`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorney-badge`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/verify-attorney`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/faq`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/reviews`, lastModified: BUILD_DATE },
    ]

    // Guide pages
    const guideSlugs = [
      'certified-attorney',
      'avoid-scams',
      'legal-quotes',
      'find-attorney',
    ]
    const guidePages: MetadataRoute.Sitemap = guideSlugs.map(slug => ({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: BUILD_DATE,
    }))

    // Question pages
    const questionPages: MetadataRoute.Sitemap = getQuestionSlugs().map(slug => ({
      url: `${SITE_URL}/faq/${slug}`,
      lastModified: BUILD_DATE,
    }))

    // Comparison pages
    const comparisonPages: MetadataRoute.Sitemap = comparisons.map(c => ({
      url: `${SITE_URL}/compare/${c.slug}`,
      lastModified: BUILD_DATE,
    }))

    // Blog articles — real lastModified (only content with verifiable dates)
    const blogArticlePages: MetadataRoute.Sitemap = articleSlugs.map((slug) => {
      const article = allArticles[slug]
      return {
        url: `${SITE_URL}/blog/${slug}`,
        lastModified: article ? new Date(article.updatedDate || article.date) : undefined,
      }
    })

    const servicesIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/services`, lastModified: BUILD_DATE },
    ]

    const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
      url: `${SITE_URL}/practice-areas/${service.slug}`,
      lastModified: BUILD_DATE,
    }))

    const emergencySlugs = Object.keys(tradeContent)
    const emergencyPages: MetadataRoute.Sitemap = emergencySlugs.map((slug) => ({
      url: `${SITE_URL}/emergency/${slug}`,
      lastModified: BUILD_DATE,
    }))

    const pricingPages: MetadataRoute.Sitemap = Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/pricing/${slug}`,
      lastModified: BUILD_DATE,
    }))

    // Blog category pages — lastModified = date of the latest article in the category
    const blogCategoryPages: MetadataRoute.Sitemap = blogCategories
      .filter(c => allArticlesMeta.some(a => categoryToSlug(normalizeCategory(a.category)) === c.slug))
      .map(c => {
        const categoryArticles = allArticlesMeta.filter(a => categoryToSlug(normalizeCategory(a.category)) === c.slug)
        const latestDate = categoryArticles.length > 0
          ? new Date(Math.max(...categoryArticles.map(a => new Date(a.date).getTime())))
          : undefined
        return {
          url: `${SITE_URL}/blog/category/${c.slug}`,
          lastModified: latestDate || BUILD_DATE,
        }
      })

    // Blog tag pages — all unique tags
    const tagSet = new Map<string, string>()
    for (const a of allArticlesMeta) {
      for (const t of a.tags) {
        const slug = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        if (!tagSet.has(slug)) tagSet.set(slug, t)
      }
    }
    const blogTagPages: MetadataRoute.Sitemap = Array.from(tagSet.keys()).map(tagSlug => {
      // Find the date of the latest article with this tag
      const tagArticles = allArticlesMeta.filter(a =>
        a.tags.some(t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === tagSlug)
      )
      const latestDate = tagArticles.length > 0
        ? new Date(Math.max(...tagArticles.map(a => new Date(a.date).getTime())))
        : undefined
      return {
        url: `${SITE_URL}/blog/tag/${tagSlug}`,
        lastModified: latestDate || BUILD_DATE,
      }
    })

    return [...homepage, ...staticPages, ...guidePages, ...questionPages, ...comparisonPages, ...blogArticlePages, ...blogCategoryPages, ...blogTagPages, ...servicesIndex, ...servicePages, ...emergencyPages, ...pricingPages]
  }

  // ── Service + city — Phase 1: top 300 cities ────────────────────────
  if (id.startsWith('service-cities-') && !id.startsWith('service-cities-extended-')) {
    const batchIndex = parseInt(id.replace('service-cities-', ''), 10)
    const BATCH = LARGE_BATCH
    const offset = batchIndex * BATCH

    // Merge top cities by population + GSC priority cities (deduplicated)
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const phase1Slugs = new Set(phase1Cities.map(v => v.slug))
    const gscExtras = GSC_PRIORITY_CITIES
      .filter(slug => !phase1Slugs.has(slug))
      .map(slug => cities.find(v => v.slug === slug))
      .filter((v): v is NonNullable<typeof v> => v != null)
    const mergedCities = [...phase1Cities, ...gscExtras]

    const allUrls: MetadataRoute.Sitemap = []
    for (const service of services) {
      for (const city of mergedCities) {
        allUrls.push({ url: `${SITE_URL}/practice-areas/${service.slug}/${city.slug}` })
      }
    }

    return allUrls.slice(offset, offset + BATCH)
  }


  // ── City pages ──────────────────────────────────────────────────────
  if (id === 'cities') {
    const citiesIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/cities` },
    ]

    const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
      url: `${SITE_URL}/cities/${city.slug}`,
    }))

    return [...citiesIndex, ...cityPages]
  }

  // ── Geo pages (states + regions) ────────────────────────────────────
  if (id === 'geo') {
    const statesIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/states` },
    ]

    const statePages: MetadataRoute.Sitemap = states.map((state) => ({
      url: `${SITE_URL}/states/${state.slug}`,
    }))

    const regionsIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/regions` },
    ]

    const regionPages: MetadataRoute.Sitemap = usRegions.map((region) => ({
      url: `${SITE_URL}/regions/${region.slug}`,
    }))

    return [...statesIndex, ...statePages, ...regionsIndex, ...regionPages]
  }


  // ── Quotes service hub pages ────────────────────────────────────────
  if (id === 'quotes-services') {
    return Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/quotes/${slug}`,
      lastModified: BUILD_DATE,
    }))
  }

  // ── Quotes service×city pages (Phase 1: top 300 cities only) ────────
  if (id.startsWith('quotes-service-cities-')) {
    const batchIndex = parseInt(id.replace('quotes-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const city of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/quotes/${svc.slug}/${city.slug}` })
        count++
      }
    }

    return result
  }

  // ── Emergency service×city pages (Phase 1: top 300 cities only) ─────
  if (id.startsWith('emergency-service-cities-')) {
    const batchIndex = parseInt(id.replace('emergency-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const emergencySlugs = Object.keys(tradeContent)
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of emergencySlugs) {
      for (const v of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/emergency/${svc}/${v.slug}` })
        count++
      }
    }

    return result
  }

  // ── Pricing service×city pages (Phase 1: top 300 cities only) ───────
  if (id.startsWith('tarifs-service-cities-')) {
    const batchIndex = parseInt(id.replace('tarifs-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const v of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/pricing/${svc.slug}/${v.slug}` })
        count++
      }
    }

    return result
  }

  // ── Pricing task×city pages (Phase 1: top 300 cities only) ──────────
  if (id.startsWith('tarifs-task-cities-')) {
    const batchIndex = parseInt(id.replace('tarifs-task-cities-', ''), 10)
    const BATCH = LARGE_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const [specialtySlug, trade] of Object.entries(tradeContent)) {
      for (const task of trade.commonTasks) {
        const { slug: taskSlug } = parseTask(task)
        for (const v of phase1Cities) {
          if (count >= end) break outer
          if (count >= start) result.push({ url: `${SITE_URL}/pricing/${specialtySlug}/${v.slug}/${taskSlug}`, lastModified: BUILD_DATE })
          count++
        }
      }
    }

    return result
  }

  // ── Reviews service hub pages ──────────────────────────────────────
  if (id === 'reviews-services') {
    const tradeSlugs = Object.keys(tradeContent)
    return [
      { url: `${SITE_URL}/reviews`, lastModified: BUILD_DATE },
      ...tradeSlugs.map(slug => ({ url: `${SITE_URL}/reviews/${slug}`, lastModified: BUILD_DATE })),
    ]
  }

  // ── Reviews service×city pages (Phase 1: top 300 cities only) ───────
  if (id.startsWith('reviews-service-cities-')) {
    const batchIndex = parseInt(id.replace('reviews-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const tradeSlugs = Object.keys(tradeContent)
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of tradeSlugs) {
      for (const v of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/reviews/${svc}/${v.slug}` })
        count++
      }
    }

    return result
  }

  // ── Issues hub + individual pages ──────────────────────────────────
  if (id === 'issues') {
    const problemSlugs = getProblemSlugs()
    return [
      { url: `${SITE_URL}/issues`, lastModified: BUILD_DATE },
      ...problemSlugs.map(slug => ({ url: `${SITE_URL}/issues/${slug}`, lastModified: BUILD_DATE })),
    ]
  }

  // ── Issues × city pages (Phase 1: top 300 cities only) ─────────────
  if (id.startsWith('issues-cities-')) {
    const batchIndex = parseInt(id.split('-').pop()!)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const problemSlugs = getProblemSlugs()
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const problem of problemSlugs) {
      for (const city of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/issues/${problem}/${city.slug}` })
        count++
      }
    }

    return result
  }

  // ── State × service pages ──────────────────────────────────────────
  if (id.startsWith('dept-services-')) {
    const batchIndex = parseInt(id.split('-').pop()!)
    const tradeSlugs = getPracticeAreaSlugs()
    const allUrls: MetadataRoute.Sitemap = []
    for (const state of states) {
      for (const service of tradeSlugs) {
        allUrls.push({ url: `${SITE_URL}/states/${state.slug}/${service}` })
      }
    }
    return allUrls.slice(batchIndex * LARGE_BATCH, (batchIndex + 1) * LARGE_BATCH)
  }

  // ── Region × service pages ──────────────────────────────────────────
  if (id === 'region-services') {
    const tradeSlugs = getPracticeAreaSlugs()
    return usRegions.flatMap(region =>
      tradeSlugs.map(service => ({
        url: `${SITE_URL}/regions/${region.slug}/${service}`,
      }))
    )
  }


  // Provider sitemaps are served via /api/sitemap-providers (dynamic API route).
  // Requests to /sitemap/providers-*.xml are rewritten by next.config.js.

  return []
}
