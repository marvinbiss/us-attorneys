import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import { services, cities, states, usRegions } from '@/lib/data/usa'
import { tradeContent, getTradesSlugs, parseTask } from '@/lib/data/trade-content'
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
  // ALL intent pages (devis, avis, tarifs, urgence, problemes) also use Phase 1 cities.
  // Quartier-level sitemaps are removed entirely (800K+ thin URLs = crawl budget waste).
  const serviceCitiesPhase1BatchCount = Math.ceil(services.length * TOP_CITIES_PHASE1 / LARGE_BATCH)

  const emergencySlugs = Object.keys(tradeContent)
  const avisServiceSlugs = Object.keys(tradeContent)
  const problemSlugs = getProblemSlugs()

  // Count total task×city combinations for tarifs-task-cities sitemaps
  const totalTaskCount = Object.values(tradeContent).reduce((sum, t) => sum + t.commonTasks.length, 0)
  const tarifsTaskCitiesBatchCount = Math.ceil(totalTaskCount * TOP_CITIES_PHASE1 / LARGE_BATCH)

  const sitemaps: { id: string }[] = [
    { id: 'static' },
    ...Array.from({ length: serviceCitiesPhase1BatchCount }, (_, i) => ({ id: `service-cities-${i}` })),
    { id: 'cities' },
    { id: 'geo' },
    // Quartier & service-quartier sitemaps REMOVED — too granular for new domain
    { id: 'devis-services' },
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `devis-service-cities-${i}` })),
    ...Array.from({ length: Math.ceil(emergencySlugs.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `urgence-service-cities-${i}` })),
    ...Array.from({ length: Math.ceil(services.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `tarifs-service-cities-${i}` })),
    ...Array.from({ length: tarifsTaskCitiesBatchCount }, (_, i) => ({ id: `tarifs-task-cities-${i}` })),
    { id: 'avis-services' },
    ...Array.from({ length: Math.ceil(avisServiceSlugs.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `avis-service-cities-${i}` })),
    { id: 'problemes' },
    ...Array.from({ length: Math.ceil(problemSlugs.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `problemes-cities-${i}` })),
    ...Array.from(
      { length: Math.ceil(states.length * getTradesSlugs().length / LARGE_BATCH) },
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
      { url: `${SITE_URL}/tools/calculator-prix`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/tools/diagnostic`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorney-map`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorneys`, lastModified: BUILD_DATE },
      // Pages outils & contenu
      { url: `${SITE_URL}/guides`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/before-after`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/project-planner`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/project-checklist`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/compare`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/glossary`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/regulations`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorney-statistics`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/attorney-badge`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/verify-attorney`, lastModified: BUILD_DATE },
      // /price-index-prix removed — 301 redirects to /price-index (cannibalization fix)
      { url: `${SITE_URL}/faq`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/reviews`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/price-index`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/price-index/regions`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/price-index/pricing`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/widget-prix`, lastModified: BUILD_DATE },
    ]

    // Guide pages
    const guideSlugs = [
      'aides-renovation-2026',
      'artisan-rge',
      'assurance-dommage-ouvrage',
      'budget-renovation',
      'declaration-prealable-travaux',
      'devis-travaux',
      'diagnostics-immobiliers',
      'eviter-arnaques-artisan',
      'extension-maison',
      'garantie-decennale',
      'isolation-combles',
      'isolation-thermique',
      'maprimerenov-2026',
      'normes-electriques',
      'permis-construire',
      'pompe-a-chaleur',
      'renovation-cuisine',
      'renovation-energetique-complete',
      'renovation-fenetres',
      'renovation-salle-de-bain',
      'renovation-toiture',
      'travaux-copropriete',
      'trouver-artisan',
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

    // Blog articles — lastModified réel (seul contenu avec vraie date vérifiable)
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
    const urgencePages: MetadataRoute.Sitemap = emergencySlugs.map((slug) => ({
      url: `${SITE_URL}/emergency/${slug}`,
      lastModified: BUILD_DATE,
    }))

    const tarifsPages: MetadataRoute.Sitemap = Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/pricing/${slug}`,
      lastModified: BUILD_DATE,
    }))

    // Blog category pages — lastModified = date du dernier article de la catégorie
    const blogCategoryPages: MetadataRoute.Sitemap = blogCategories
      .filter(c => allArticlesMeta.some(a => categoryToSlug(normalizeCategory(a.category)) === c.slug))
      .map(c => {
        const categoryArticles = allArticlesMeta.filter(a => categoryToSlug(normalizeCategory(a.category)) === c.slug)
        const latestDate = categoryArticles.length > 0
          ? new Date(Math.max(...categoryArticles.map(a => new Date(a.date).getTime())))
          : undefined
        return {
          url: `${SITE_URL}/blog/categorie/${c.slug}`,
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
      // Trouver la date du dernier article ayant ce tag
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

    return [...homepage, ...staticPages, ...guidePages, ...questionPages, ...comparisonPages, ...blogArticlePages, ...blogCategoryPages, ...blogTagPages, ...servicesIndex, ...servicePages, ...urgencePages, ...tarifsPages]
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
      for (const ville of mergedCities) {
        allUrls.push({ url: `${SITE_URL}/practice-areas/${service.slug}/${ville.slug}` })
      }
    }

    return allUrls.slice(offset, offset + BATCH)
  }


  // ── City pages ──────────────────────────────────────────────────────
  if (id === 'cities') {
    const villesIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/cities` },
    ]

    const villePages: MetadataRoute.Sitemap = cities.map((ville) => ({
      url: `${SITE_URL}/cities/${ville.slug}`,
    }))

    return [...villesIndex, ...villePages]
  }

  // ── Geo pages (départements + régions) ──────────────────────────────
  if (id === 'geo') {
    const departementsIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/states` },
    ]

    const departementPages: MetadataRoute.Sitemap = states.map((dept) => ({
      url: `${SITE_URL}/states/${dept.slug}`,
    }))

    const regionsIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/regions` },
    ]

    const regionPages: MetadataRoute.Sitemap = usRegions.map((region) => ({
      url: `${SITE_URL}/regions/${region.slug}`,
    }))

    return [...departementsIndex, ...departementPages, ...regionsIndex, ...regionPages]
  }


  // ── Devis service hub pages ─────────────────────────────────────────
  if (id === 'devis-services') {
    return Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/quotes/${slug}`,
      lastModified: BUILD_DATE,
    }))
  }

  // ── Devis service×city pages (Phase 1: top 300 cities only) ─────────
  if (id.startsWith('devis-service-cities-')) {
    const batchIndex = parseInt(id.replace('devis-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const ville of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/quotes/${svc.slug}/${ville.slug}` })
        count++
      }
    }

    return result
  }

  // ── Urgence service×city pages (Phase 1: top 300 cities only) ───────
  if (id.startsWith('urgence-service-cities-')) {
    const batchIndex = parseInt(id.replace('urgence-service-cities-', ''), 10)
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

  // ── Tarifs service×city pages (Phase 1: top 300 cities only) ────────
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

  // ── Tarifs task×city pages (Phase 1: top 300 cities only) ───────────
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

  // ── Avis service hub pages ──────────────────────────────────────────
  if (id === 'avis-services') {
    const tradeSlugs = Object.keys(tradeContent)
    return [
      { url: `${SITE_URL}/reviews`, lastModified: BUILD_DATE },
      ...tradeSlugs.map(slug => ({ url: `${SITE_URL}/reviews/${slug}`, lastModified: BUILD_DATE })),
    ]
  }

  // ── Avis service×city pages (Phase 1: top 300 cities only) ──────────
  if (id.startsWith('avis-service-cities-')) {
    const batchIndex = parseInt(id.replace('avis-service-cities-', ''), 10)
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

  // ── Problemes hub + individual pages ────────────────────────────────
  if (id === 'problemes') {
    const problemSlugs = getProblemSlugs()
    return [
      { url: `${SITE_URL}/issues`, lastModified: BUILD_DATE },
      ...problemSlugs.map(slug => ({ url: `${SITE_URL}/issues/${slug}`, lastModified: BUILD_DATE })),
    ]
  }

  // ── Problemes × city pages (Phase 1: top 300 cities only) ───────────
  if (id.startsWith('problemes-cities-')) {
    const batchIndex = parseInt(id.split('-').pop()!)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const problemSlugs = getProblemSlugs()
    const phase1Cities = cities.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const problem of problemSlugs) {
      for (const ville of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/issues/${problem}/${ville.slug}` })
        count++
      }
    }

    return result
  }

  // ── Dept × service pages ────────────────────────────────────────────
  if (id.startsWith('dept-services-')) {
    const batchIndex = parseInt(id.split('-').pop()!)
    const tradeSlugs = getTradesSlugs()
    const allUrls: MetadataRoute.Sitemap = []
    for (const dept of states) {
      for (const service of tradeSlugs) {
        allUrls.push({ url: `${SITE_URL}/states/${dept.slug}/${service}` })
      }
    }
    return allUrls.slice(batchIndex * LARGE_BATCH, (batchIndex + 1) * LARGE_BATCH)
  }

  // ── Region × service pages ──────────────────────────────────────────
  if (id === 'region-services') {
    const tradeSlugs = getTradesSlugs()
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
