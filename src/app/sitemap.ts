import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import { services, cities, states, usRegions, practiceAreas } from '@/lib/data/usa'
import { tradeContent, getPracticeAreaSlugs, parseTask } from '@/lib/data/trade-content'
import { getProblemSlugs } from '@/lib/data/problems'
import { getQuestionSlugs } from '@/lib/data/faq'
import { comparisons } from '@/lib/data/comparisons'
import { GSC_PRIORITY_CITIES } from '@/lib/seo/gsc-priority-cities'
import { articleSlugs } from '@/lib/data/blog/articles'
import { allArticles } from '@/lib/data/blog/articles'
import { blogCategories, categoryToSlug, normalizeCategory } from '@/lib/data/blog/categories'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'
import { SPANISH_PA_SLUGS } from '@/lib/seo/hreflang'

// Return 404 for sitemap IDs not in generateSitemaps() — prevents ghost sitemaps
// from returning empty-but-valid XML that Google keeps crawling forever.
export const dynamicParams = false

// Use build date as lastModified for static hub pages — signals freshness to Google
const BUILD_DATE = new Date().toISOString().split('T')[0]

// Batch sizes — must match the BATCH used in sitemap() slicing
// Max 5,000 URLs per sitemap file (Doctolib pattern — better crawl efficiency)
const BATCH_SIZE = 5_000

// Phase 1: submit only top-300 cities for new domain (conservative crawl budget).
const TOP_CITIES_PHASE1 = 300

// Phase 1 Spanish: top 200 Hispanic-population cities
const TOP_HISPANIC_CITIES = 200

// Total US counties
const TOTAL_COUNTIES = 3_144

// Phase 1 ZIP codes: top 500 per state batch (PA × ZIP batched by state)
// We emit ZIPs grouped by state to keep sitemap files manageable.
// 57 states × 10 top PAs × ~800 avg ZIPs/state ≈ batched at 5K per file.
const TOP_PA_FOR_ZIPS = 10
// Approximate total ZIP codes for sitemap sizing (Phase 1: top 500 ZIPs by population)
const ZIP_PHASE1_COUNT = 500

// ─── English intent prefixes ────────────────────────────────────────────────
// URL prefix for each English intent
const EN_INTENTS = ['attorneys', 'hire', 'cost', 'reviews', 'emergency'] as const
// Hub path prefix for service hubs per intent
const EN_INTENT_HUB_PREFIX: Record<string, string> = {
  attorneys: '/practice-areas',
  hire: '/hire',
  cost: '/pricing',
  reviews: '/reviews',
  emergency: '/emergency',
}
// City page path prefix for intent × city pages
const EN_INTENT_CITY_PREFIX: Record<string, string> = {
  attorneys: '/practice-areas',
  hire: '/hire',
  cost: '/pricing',
  reviews: '/reviews',
  emergency: '/emergency',
}

// ─── Spanish intent prefixes ────────────────────────────────────────────────
const ES_INTENTS = ['abogados', 'contratar', 'costo', 'opiniones', 'emergencia'] as const

// ─── Demographic modifiers (Type H) ────────────────────────────────────────
const DEMOGRAPHIC_MODIFIERS = [
  'spanish-speaking',
  'female',
  'black',
  'asian',
  'lgbtq-friendly',
  'veteran',
  'senior',
  'young-professional',
] as const

// ─── Guide types (Type M: state guides) ────────────────────────────────────
const GUIDE_TYPES = [
  'licensing-requirements',
  'bar-exam-guide',
  'legal-aid-resources',
  'court-system-overview',
  'statute-of-limitations',
  'fee-schedules',
] as const

// ─── Industries (Type Q) ───────────────────────────────────────────────────
const INDUSTRIES = [
  'healthcare',
  'technology',
  'construction',
  'finance',
  'real-estate',
  'manufacturing',
  'retail',
  'transportation',
  'energy',
  'agriculture',
  'hospitality',
  'education',
  'government',
  'nonprofit',
  'entertainment',
  'cannabis',
  'cryptocurrency',
  'ecommerce',
  'startups',
  'franchise',
] as const

// ─── Situation slugs (Type G: ~300 legal situations) ───────────────────────
// Situations are cross-referenced from problems + practice-area-specific scenarios
const SITUATION_SLUGS_COUNT = 300

// ─── Helper: merge phase 1 cities with GSC priority cities ─────────────────
function getPhase1Cities() {
  const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
  const phase1Slugs = new Set(phase1Cities.map((v) => v.slug))
  const gscExtras = GSC_PRIORITY_CITIES.filter((slug) => !phase1Slugs.has(slug))
    .map((slug) => cities.find((v) => v.slug === slug))
    .filter((v): v is NonNullable<typeof v> => v != null)
  return [...phase1Cities, ...gscExtras]
}

// ─── Helper: batch count calculator ────────────────────────────────────────
function batchCount(totalUrls: number, batchSize: number): number {
  return Math.max(1, Math.ceil(totalUrls / batchSize))
}

// ─── Helper: generate batch IDs ────────────────────────────────────────────
function batchIds(prefix: string, total: number, batch: number): { id: string }[] {
  return Array.from({ length: batchCount(total, batch) }, (_, i) => ({ id: `${prefix}-${i}` }))
}

/**
 * Generate sitemap index entries.
 * Next.js 14 calls this to produce /sitemap/[id].xml and a sitemap index.
 */
export async function generateSitemaps() {
  const pa = practiceAreas.length // ~75 practice areas
  const phase1 = TOP_CITIES_PHASE1 // 300 cities
  const hispanicCities = TOP_HISPANIC_CITIES // 200

  const emergencySlugs = Object.keys(tradeContent)

  const sitemaps: { id: string }[] = [
    // ── Static ──────────────────────────────────────────────────────────
    { id: 'static' },
    { id: 'blog' },

    // ── LEGACY sitemaps (backward compat with Google Search Console) ───
    ...batchIds('service-cities', pa * phase1, BATCH_SIZE),
    { id: 'cities' },
    { id: 'geo' },
    { id: 'quotes-services' },
    // quotes-service-cities removed — /quotes/[service]/[location] pages have noindex
    ...batchIds('emergency-service-cities', emergencySlugs.length * phase1, BATCH_SIZE),
    // tarifs-service-cities removed — /pricing/[service]/[city] pages have noindex
    // tarifs-task-cities removed — /pricing/[service]/[city]/[task] pages have noindex
    // reviews-services removed — /reviews/[service] pages have noindex
    // reviews-service-cities removed — /reviews/[service]/[city] pages have noindex
    // issues removed — /issues/[issue] pages have noindex
    // issues-cities removed — /issues/[issue]/[city] pages have noindex
    // dept-services removed — /states/[state]/[service] pages have noindex
    // region-services removed — /regions/[region]/[service] pages have noindex

    // ── NEW English intent sitemaps ─────────────────────────────────────
    // Intent service hubs (one sitemap per intent, ~75 PA each = small)
    ...EN_INTENTS.map((intent) => ({ id: `${intent}-service-hubs` })),
    // Intent × city sitemaps (batched)
    ...EN_INTENTS.flatMap((intent) => batchIds(`${intent}-cities`, pa * phase1, BATCH_SIZE)),

    // ── NEW Spanish intent sitemaps ─────────────────────────────────────
    ...ES_INTENTS.flatMap((intent) =>
      batchIds(`es-${intent}-cities`, pa * hispanicCities, BATCH_SIZE)
    ),

    // ── Type C: Best/top rated × cities ─────────────────────────────────
    ...batchIds('best-cities', pa * phase1, BATCH_SIZE),

    // ── Type D: Free consultation × cities ──────────────────────────────
    ...batchIds('free-consultation-cities', pa * phase1, BATCH_SIZE),

    // ── Type E: Affordable × cities ─────────────────────────────────────
    ...batchIds('affordable-cities', pa * phase1, BATCH_SIZE),

    // ── Type E: Pro bono × cities ───────────────────────────────────────
    ...batchIds('pro-bono-cities', pa * phase1, BATCH_SIZE),

    // ── Type G: Situations × cities ─────────────────────────────────────
    ...batchIds('situations', SITUATION_SLUGS_COUNT * phase1, BATCH_SIZE),

    // ── Type H: Demographic × PA × cities ───────────────────────────────
    ...batchIds('demographic', DEMOGRAPHIC_MODIFIERS.length * pa * phase1, BATCH_SIZE),

    // ── Type J: PA × counties ───────────────────────────────────────────
    ...batchIds('counties', pa * TOTAL_COUNTIES, BATCH_SIZE),

    // ── Type K: Neighborhoods (deferred Phase 2 — 0 sitemaps for now) ──
    // Uncomment when neighborhood data is ready:
    // ...batchIds('neighborhoods', pa * neighborhoodCount, BATCH_SIZE),

    // ── Type L: FAQ × states ────────────────────────────────────────────
    { id: 'faq-states' },

    // ── Type M: State guides ────────────────────────────────────────────
    { id: 'state-guides' },

    // ── Type M2: PA × State legal guides (75 PAs × 57 states = 4,275) ──
    ...batchIds('legal-guides', pa * states.length, BATCH_SIZE),

    // comparisons removed — /compare/[slug] pages have noindex

    // ── Type Q: Industry × cities ───────────────────────────────────────
    ...batchIds('industry', INDUSTRIES.length * phase1, BATCH_SIZE),

    // ── Geographic hub sitemaps ─────────────────────────────────────────
    { id: 'counties-hub' },

    // ── Type Z: ZIP code pages (PA × top ZIPs by population) ─────────
    // Phase 1: top 10 PAs × top 500 ZIPs = 5,000 URLs per batch
    ...batchIds('zip-pages', TOP_PA_FOR_ZIPS * ZIP_PHASE1_COUNT, BATCH_SIZE),
  ]

  // Provider/attorney sitemaps are served dynamically via /api/sitemap-attorneys
  // (DB-dependent, can't reliably pre-render at build time).
  // They are referenced in the sitemap index (/api/sitemap-index) and
  // rewritten via next.config.js: /sitemap/attorneys-*.xml → /api/sitemap-attorneys?id=*

  return sitemaps
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  // ── Static pages + services ─────────────────────────────────────────────
  if (id === 'static') {
    const homepage: MetadataRoute.Sitemap = [{ url: SITE_URL, lastModified: BUILD_DATE }]

    const staticPages: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/about`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/contact`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/blog`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/faq`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/how-it-works`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/pricing`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/quotes`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/tools/diagnostic`, lastModified: BUILD_DATE },
      // /attorney-map removed — page has noindex
      { url: `${SITE_URL}/attorneys`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/guides`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/compare`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/glossary`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/regulations`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorney-statistics`, lastModified: BUILD_DATE },
      // /attorney-badge removed — page has noindex
      { url: `${SITE_URL}/verify-attorney`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/reviews`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/hire`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/best`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/free-consultation`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/affordable`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/pro-bono`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/situations`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/counties`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/industries`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/issues`, lastModified: BUILD_DATE },
      // Spanish hub pages (routes live at /{intent-es}/ — no /es/ prefix)
      { url: `${SITE_URL}/abogados`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/contratar`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/costo`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/opiniones`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/emergencia`, lastModified: BUILD_DATE },
    ]

    // Spanish state hub pages (/abogados/{state})
    const spanishStatePages: MetadataRoute.Sitemap = states.map((state) => ({
      url: `${SITE_URL}/abogados/${state.slug}`,
      lastModified: BUILD_DATE,
    }))

    // Guide pages (editorial)
    const guideSlugs = ['certified-attorney', 'avoid-scams', 'legal-quotes', 'find-attorney']
    const guidePages: MetadataRoute.Sitemap = guideSlugs.map((slug) => ({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: BUILD_DATE,
    }))

    // Guide specialty hub pages (75 practice areas)
    const guideHubPages: MetadataRoute.Sitemap = practiceAreas.map((pa) => ({
      url: `${SITE_URL}/guides/${pa.slug}`,
      lastModified: BUILD_DATE,
    }))

    // Question pages
    const questionPages: MetadataRoute.Sitemap = getQuestionSlugs().map((slug) => ({
      url: `${SITE_URL}/faq/${slug}`,
      lastModified: BUILD_DATE,
    }))

    const servicesIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/practice-areas`, lastModified: BUILD_DATE },
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

    return [
      ...homepage,
      ...staticPages,
      ...spanishStatePages,
      ...guidePages,
      ...guideHubPages,
      ...questionPages,
      ...servicesIndex,
      ...servicePages,
      ...emergencyPages,
      ...pricingPages,
    ]
  }

  // ── Blog sitemap (articles, categories, tags) ───────────────────────────
  if (id === 'blog') {
    // Blog articles — real lastModified (only content with verifiable dates)
    const blogArticlePages: MetadataRoute.Sitemap = articleSlugs.map((slug) => {
      const article = allArticles[slug]
      return {
        url: `${SITE_URL}/blog/${slug}`,
        lastModified: article ? new Date(article.updatedDate || article.date) : undefined,
      }
    })

    // Blog category pages — lastModified = date of the latest article in the category
    const blogCategoryPages: MetadataRoute.Sitemap = blogCategories
      .filter((c) =>
        allArticlesMeta.some((a) => categoryToSlug(normalizeCategory(a.category)) === c.slug)
      )
      .map((c) => {
        const categoryArticles = allArticlesMeta.filter(
          (a) => categoryToSlug(normalizeCategory(a.category)) === c.slug
        )
        const latestDate =
          categoryArticles.length > 0
            ? new Date(Math.max(...categoryArticles.map((a) => new Date(a.date).getTime())))
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
        const slug = t
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        if (!tagSet.has(slug)) tagSet.set(slug, t)
      }
    }
    const blogTagPages: MetadataRoute.Sitemap = Array.from(tagSet.keys()).map((tagSlug) => {
      const tagArticles = allArticlesMeta.filter((a) =>
        a.tags.some(
          (t) =>
            t
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') === tagSlug
        )
      )
      const latestDate =
        tagArticles.length > 0
          ? new Date(Math.max(...tagArticles.map((a) => new Date(a.date).getTime())))
          : undefined
      return {
        url: `${SITE_URL}/blog/tag/${tagSlug}`,
        lastModified: latestDate || BUILD_DATE,
      }
    })

    return [...blogArticlePages, ...blogCategoryPages, ...blogTagPages]
  }

  // ════════════════════════════════════════════════════════════════════════
  // LEGACY sitemaps — backward compatible with Google Search Console
  // ════════════════════════════════════════════════════════════════════════

  // ── Service + city — Phase 1: top 300 cities (LEGACY) ──────────────────
  if (id.startsWith('service-cities-') && !id.startsWith('service-cities-extended-')) {
    const batchIndex = parseInt(id.replace('service-cities-', ''), 10)
    const offset = batchIndex * BATCH_SIZE
    const mergedCities = getPhase1Cities()

    const allUrls: MetadataRoute.Sitemap = []
    for (const service of services) {
      for (const city of mergedCities) {
        allUrls.push({ url: `${SITE_URL}/practice-areas/${service.slug}/${city.slug}` })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── City pages (LEGACY) ────────────────────────────────────────────────
  if (id === 'cities') {
    return [
      { url: `${SITE_URL}/cities` },
      ...cities.map((city) => ({ url: `${SITE_URL}/cities/${city.slug}` })),
    ]
  }

  // ── Geo pages — states + regions (LEGACY) ──────────────────────────────
  if (id === 'geo') {
    return [
      { url: `${SITE_URL}/states` },
      ...states.map((state) => ({ url: `${SITE_URL}/states/${state.slug}` })),
      { url: `${SITE_URL}/regions` },
      ...usRegions.map((region) => ({ url: `${SITE_URL}/regions/${region.slug}` })),
    ]
  }

  // ── Quotes service hub pages (LEGACY) ──────────────────────────────────
  if (id === 'quotes-services') {
    return Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/quotes/${slug}`,
      lastModified: BUILD_DATE,
    }))
  }

  // ── Quotes service×city pages (LEGACY) ─────────────────────────────────
  if (id.startsWith('quotes-service-cities-')) {
    const batchIndex = parseInt(id.replace('quotes-service-cities-', ''), 10)
    const start = batchIndex * BATCH_SIZE
    const end = start + BATCH_SIZE
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

  // ── Emergency service×city pages (LEGACY) ──────────────────────────────
  if (id.startsWith('emergency-service-cities-')) {
    const batchIndex = parseInt(id.replace('emergency-service-cities-', ''), 10)
    const start = batchIndex * BATCH_SIZE
    const end = start + BATCH_SIZE
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

  // ── Pricing service×city pages (LEGACY — tarifs prefix) ────────────────
  if (id.startsWith('tarifs-service-cities-')) {
    const batchIndex = parseInt(id.replace('tarifs-service-cities-', ''), 10)
    const start = batchIndex * BATCH_SIZE
    const end = start + BATCH_SIZE
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

  // ── Pricing task×city pages (LEGACY — tarifs prefix) ───────────────────
  if (id.startsWith('tarifs-task-cities-')) {
    const batchIndex = parseInt(id.replace('tarifs-task-cities-', ''), 10)
    const start = batchIndex * BATCH_SIZE
    const end = start + BATCH_SIZE
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const [specialtySlug, trade] of Object.entries(tradeContent)) {
      for (const task of trade.commonTasks) {
        const { slug: taskSlug } = parseTask(task)
        for (const v of phase1Cities) {
          if (count >= end) break outer
          if (count >= start)
            result.push({
              url: `${SITE_URL}/pricing/${specialtySlug}/${v.slug}/${taskSlug}`,
              lastModified: BUILD_DATE,
            })
          count++
        }
      }
    }
    return result
  }

  // ── Reviews service hub pages (LEGACY) ─────────────────────────────────
  if (id === 'reviews-services') {
    const tradeSlugs = Object.keys(tradeContent)
    return [
      { url: `${SITE_URL}/reviews`, lastModified: BUILD_DATE },
      ...tradeSlugs.map((slug) => ({
        url: `${SITE_URL}/reviews/${slug}`,
        lastModified: BUILD_DATE,
      })),
    ]
  }

  // ── Reviews service×city pages (LEGACY) ────────────────────────────────
  if (id.startsWith('reviews-service-cities-')) {
    const batchIndex = parseInt(id.replace('reviews-service-cities-', ''), 10)
    const start = batchIndex * BATCH_SIZE
    const end = start + BATCH_SIZE
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

  // ── Issues hub (LEGACY) — individual /issues/[slug] pages removed (noindex)
  if (id === 'issues') {
    return [{ url: `${SITE_URL}/issues`, lastModified: BUILD_DATE }]
  }

  // ── Issues × city pages (LEGACY) ──────────────────────────────────────
  if (id.startsWith('issues-cities-')) {
    const batchIndex = parseInt(id.split('-').pop() ?? '0')
    const start = batchIndex * BATCH_SIZE
    const end = start + BATCH_SIZE
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

  // ── State × service pages (LEGACY) ────────────────────────────────────
  if (id.startsWith('dept-services-')) {
    const batchIndex = parseInt(id.split('-').pop() ?? '0')
    const tradeSlugs = getPracticeAreaSlugs()
    const allUrls: MetadataRoute.Sitemap = []
    for (const state of states) {
      for (const service of tradeSlugs) {
        allUrls.push({ url: `${SITE_URL}/states/${state.slug}/${service}` })
      }
    }
    return allUrls.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE)
  }

  // ── Region × service pages (LEGACY) ───────────────────────────────────
  if (id === 'region-services') {
    const tradeSlugs = getPracticeAreaSlugs()
    return usRegions.flatMap((region) =>
      tradeSlugs.map((service) => ({
        url: `${SITE_URL}/regions/${region.slug}/${service}`,
      }))
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // NEW English intent sitemaps
  // ════════════════════════════════════════════════════════════════════════

  // ── Intent service hubs (~75 URLs each) ────────────────────────────────
  for (const intent of EN_INTENTS) {
    if (id === `${intent}-service-hubs`) {
      const prefix = EN_INTENT_HUB_PREFIX[intent]
      return practiceAreas.map((pa) => ({
        url: `${SITE_URL}${prefix}/${pa.slug}`,
        lastModified: BUILD_DATE,
      }))
    }
  }

  // ── Intent × city sitemaps (batched at 45K) ────────────────────────────
  for (const intent of EN_INTENTS) {
    if (id.startsWith(`${intent}-cities-`)) {
      const batchIndex = parseInt(id.slice(`${intent}-cities-`.length), 10)
      if (isNaN(batchIndex)) break
      const offset = batchIndex * BATCH_SIZE
      const prefix = EN_INTENT_CITY_PREFIX[intent]
      const mergedCities = getPhase1Cities()

      const allUrls: MetadataRoute.Sitemap = []
      for (const pa of practiceAreas) {
        for (const city of mergedCities) {
          allUrls.push({ url: `${SITE_URL}${prefix}/${pa.slug}/${city.slug}` })
        }
      }
      return allUrls.slice(offset, offset + BATCH_SIZE)
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // NEW Spanish intent sitemaps
  // ════════════════════════════════════════════════════════════════════════

  for (const intent of ES_INTENTS) {
    if (id.startsWith(`es-${intent}-cities-`)) {
      const batchIndex = parseInt(id.slice(`es-${intent}-cities-`.length), 10)
      if (isNaN(batchIndex)) break
      const offset = batchIndex * BATCH_SIZE
      // Use top Hispanic cities (sorted by Hispanic population — cities array is by total pop)
      const hispanicCities = cities.slice(0, TOP_HISPANIC_CITIES)

      const allUrls: MetadataRoute.Sitemap = []
      for (const pa of practiceAreas) {
        // Translate English PA slug to Spanish (e.g. personal-injury -> lesiones-personales)
        const esPaSlug = SPANISH_PA_SLUGS[pa.slug] || pa.slug
        for (const city of hispanicCities) {
          // Spanish routes live at /{intent}/{esPaSlug}/{city} — no /es/ prefix
          allUrls.push({ url: `${SITE_URL}/${intent}/${esPaSlug}/${city.slug}` })
        }
      }
      return allUrls.slice(offset, offset + BATCH_SIZE)
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // NEW page type sitemaps
  // ════════════════════════════════════════════════════════════════════════

  // ── Type C: Best/top rated × cities ───────────────────────────────────
  if (id.startsWith('best-cities-')) {
    const batchIndex = parseInt(id.slice('best-cities-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)

    const allUrls: MetadataRoute.Sitemap = []
    for (const pa of practiceAreas) {
      for (const city of phase1Cities) {
        allUrls.push({ url: `${SITE_URL}/best/${pa.slug}/${city.slug}` })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Type D: Free consultation × cities ────────────────────────────────
  if (id.startsWith('free-consultation-cities-')) {
    const batchIndex = parseInt(id.slice('free-consultation-cities-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)

    const allUrls: MetadataRoute.Sitemap = []
    for (const pa of practiceAreas) {
      for (const city of phase1Cities) {
        allUrls.push({ url: `${SITE_URL}/free-consultation/${pa.slug}/${city.slug}` })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Type E: Affordable × cities ──────────────────────────────────────
  if (id.startsWith('affordable-cities-')) {
    const batchIndex = parseInt(id.slice('affordable-cities-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)

    const allUrls: MetadataRoute.Sitemap = []
    for (const pa of practiceAreas) {
      for (const city of phase1Cities) {
        allUrls.push({ url: `${SITE_URL}/affordable/${pa.slug}/${city.slug}` })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Type E: Pro bono × cities ────────────────────────────────────────
  if (id.startsWith('pro-bono-cities-')) {
    const batchIndex = parseInt(id.slice('pro-bono-cities-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)

    const allUrls: MetadataRoute.Sitemap = []
    for (const pa of practiceAreas) {
      for (const city of phase1Cities) {
        allUrls.push({ url: `${SITE_URL}/pro-bono/${pa.slug}/${city.slug}` })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Type G: Situations × cities ──────────────────────────────────────
  if (id.startsWith('situations-')) {
    const batchIndex = parseInt(id.slice('situations-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    // Situations are derived from problems + extended scenario slugs
    const situationSlugs = getProblemSlugs()
    // Pad with generated situation slugs up to SITUATION_SLUGS_COUNT
    // (additional situations will come from the situations data module when populated)
    const effectiveSlugs = situationSlugs.slice(0, SITUATION_SLUGS_COUNT)

    const allUrls: MetadataRoute.Sitemap = []
    for (const situation of effectiveSlugs) {
      for (const city of phase1Cities) {
        allUrls.push({ url: `${SITE_URL}/situations/${situation}/${city.slug}` })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Type H: Demographic modifier × PA × cities ──────────────────────
  if (id.startsWith('demographic-')) {
    const batchIndex = parseInt(id.slice('demographic-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)

    const allUrls: MetadataRoute.Sitemap = []
    for (const modifier of DEMOGRAPHIC_MODIFIERS) {
      for (const pa of practiceAreas) {
        for (const city of phase1Cities) {
          allUrls.push({ url: `${SITE_URL}/${modifier}/${pa.slug}/${city.slug}` })
        }
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Type J: PA × counties ───────────────────────────────────────────
  if (id.startsWith('counties-') && id !== 'counties-hub') {
    const batchIndex = parseInt(id.slice('counties-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    // Counties are derived from state data — each state has counties
    // Generate county slugs from states (state-slug/county-index pattern)
    // In production, this will be replaced by actual county data from the DB
    // For now, generate placeholder URLs using the ~3,144 US counties
    // Counties are structured as /counties/[state]/[county]/[practice-area]
    const allUrls: MetadataRoute.Sitemap = []
    for (const state of states) {
      // Generate county slugs for each state based on estimated county count
      // Average ~62 counties per state (3,144 / 51)
      // This will be replaced by actual county data when the counties table is populated
      for (const pa of practiceAreas) {
        allUrls.push({ url: `${SITE_URL}/states/${state.slug}/counties/${pa.slug}` })
      }
    }
    // Note: Full county × PA URLs will expand to ~235K when county data module is ready
    // For now, emit state/county/PA hub pages only
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Type L: FAQ × states ─────────────────────────────────────────────
  if (id === 'faq-states') {
    const allUrls: MetadataRoute.Sitemap = []
    for (const pa of practiceAreas) {
      for (const state of states) {
        allUrls.push({
          url: `${SITE_URL}/faq/${pa.slug}/${state.slug}`,
          lastModified: BUILD_DATE,
        })
      }
    }
    return allUrls
  }

  // ── Type M: State guides ─────────────────────────────────────────────
  if (id === 'state-guides') {
    const allUrls: MetadataRoute.Sitemap = []
    for (const guideType of GUIDE_TYPES) {
      for (const state of states) {
        allUrls.push({
          url: `${SITE_URL}/guides/${guideType}/${state.slug}`,
          lastModified: BUILD_DATE,
        })
      }
    }
    return allUrls
  }

  // ── Type M2: PA × State legal guides ─────────────────────────────────
  if (id.startsWith('legal-guides-')) {
    const batchIndex = parseInt(id.slice('legal-guides-'.length), 10)
    const offset = batchIndex * BATCH_SIZE

    const allUrls: MetadataRoute.Sitemap = []
    for (const pa of practiceAreas) {
      for (const state of states) {
        allUrls.push({
          url: `${SITE_URL}/guides/${pa.slug}/${state.slug}`,
          lastModified: BUILD_DATE,
        })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Type N: Comparisons ──────────────────────────────────────────────
  if (id === 'comparisons') {
    return comparisons.map((c) => ({
      url: `${SITE_URL}/compare/${c.slug}`,
      lastModified: BUILD_DATE,
    }))
  }

  // ── Type Q: Industry × cities ────────────────────────────────────────
  if (id.startsWith('industry-')) {
    const batchIndex = parseInt(id.slice('industry-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)

    const allUrls: MetadataRoute.Sitemap = []
    for (const industry of INDUSTRIES) {
      for (const city of phase1Cities) {
        allUrls.push({ url: `${SITE_URL}/industries/${industry}/${city.slug}` })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ── Counties hub pages ───────────────────────────────────────────────
  if (id === 'counties-hub') {
    const allUrls: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/counties`, lastModified: BUILD_DATE },
    ]
    // County hub per state
    for (const state of states) {
      allUrls.push({
        url: `${SITE_URL}/counties/${state.slug}`,
        lastModified: BUILD_DATE,
      })
    }
    return allUrls
  }

  // ── Type Z: ZIP code pages (PA × top ZIPs, Doctolib pattern) ─────
  if (id.startsWith('zip-pages-')) {
    const batchIndex = parseInt(id.slice('zip-pages-'.length), 10)
    const offset = batchIndex * BATCH_SIZE
    const topPAs = practiceAreas.slice(0, TOP_PA_FOR_ZIPS)

    // Use TOP_ZIP_CODES from zip-pages module (curated major metro ZIPs)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TOP_ZIP_CODES } = require('@/lib/zip-pages')
    const zipCodes = (TOP_ZIP_CODES as { zip: string; citySlug: string }[]).slice(
      0,
      ZIP_PHASE1_COUNT
    )

    const allUrls: MetadataRoute.Sitemap = []
    for (const pa of topPAs) {
      for (const { zip, citySlug } of zipCodes) {
        // Doctolib pattern: /practice-areas/personal-injury/new-york-10001
        allUrls.push({
          url: `${SITE_URL}/practice-areas/${pa.slug}/${citySlug}-${zip}`,
          priority: 0.5,
        })
      }
    }
    return allUrls.slice(offset, offset + BATCH_SIZE)
  }

  // ─── Fallback ─────────────────────────────────────────────────────────
  // Provider/attorney sitemaps are served via /api/sitemap-attorneys (dynamic API route).
  // Requests to /sitemap/attorneys-*.xml are rewritten by next.config.js.
  return []
}
