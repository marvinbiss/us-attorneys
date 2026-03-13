import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import { services, villes, departements, regions } from '@/lib/data/france'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { getProblemSlugs } from '@/lib/data/problems'
import { getQuestionSlugs } from '@/lib/data/questions'
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

  const emergencySlugs = Object.keys(tradeContent).filter(s => tradeContent[s].emergencyInfo)
  const avisServiceSlugs = Object.keys(tradeContent)
  const problemSlugs = getProblemSlugs()

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
    { id: 'avis-services' },
    ...Array.from({ length: Math.ceil(avisServiceSlugs.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `avis-service-cities-${i}` })),
    { id: 'problemes' },
    ...Array.from({ length: Math.ceil(problemSlugs.length * TOP_CITIES_PHASE1 / STATIC_BATCH) }, (_, i) => ({ id: `problemes-cities-${i}` })),
    ...Array.from(
      { length: Math.ceil(departements.length * getTradesSlugs().length / LARGE_BATCH) },
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
      { url: `${SITE_URL}/a-propos`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/contact`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/blog`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/faq`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/comment-ca-marche`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/tarifs`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/urgence`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/devis`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/notre-processus-de-verification`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/politique-avis`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/mediation`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/outils/calculateur-prix`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/outils/diagnostic`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/carte-artisans`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/artisans`, lastModified: BUILD_DATE },
      // Pages outils & contenu
      { url: `${SITE_URL}/guides`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/avant-apres`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/calendrier-travaux`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/checklist-travaux`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/comparaison`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/glossaire`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/normes`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/statistiques-artisans-france`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/badge-artisan`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/verifier-artisan`, lastModified: BUILD_DATE },
      // /barometre-prix removed — 301 redirects to /barometre (cannibalization fix)
      { url: `${SITE_URL}/questions`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/avis`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/barometre`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/barometre/regions`, lastModified: BUILD_DATE },
      { url: `${SITE_URL}/barometre/tarifs`, lastModified: BUILD_DATE },
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
      url: `${SITE_URL}/questions/${slug}`,
      lastModified: BUILD_DATE,
    }))

    // Comparison pages
    const comparisonPages: MetadataRoute.Sitemap = comparisons.map(c => ({
      url: `${SITE_URL}/comparaison/${c.slug}`,
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
      url: `${SITE_URL}/services/${service.slug}`,
      lastModified: BUILD_DATE,
    }))

    const emergencySlugs = Object.keys(tradeContent).filter((s) => tradeContent[s].emergencyInfo)
    const urgencePages: MetadataRoute.Sitemap = emergencySlugs.map((slug) => ({
      url: `${SITE_URL}/urgence/${slug}`,
      lastModified: BUILD_DATE,
    }))

    const tarifsPages: MetadataRoute.Sitemap = Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/tarifs/${slug}`,
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
    const phase1Cities = villes.slice(0, TOP_CITIES_PHASE1)
    const phase1Slugs = new Set(phase1Cities.map(v => v.slug))
    const gscExtras = GSC_PRIORITY_CITIES
      .filter(slug => !phase1Slugs.has(slug))
      .map(slug => villes.find(v => v.slug === slug))
      .filter((v): v is NonNullable<typeof v> => v != null)
    const mergedCities = [...phase1Cities, ...gscExtras]

    const allUrls: MetadataRoute.Sitemap = []
    for (const service of services) {
      for (const ville of mergedCities) {
        allUrls.push({ url: `${SITE_URL}/services/${service.slug}/${ville.slug}` })
      }
    }

    return allUrls.slice(offset, offset + BATCH)
  }


  // ── City pages ──────────────────────────────────────────────────────
  if (id === 'cities') {
    const villesIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/villes` },
    ]

    const villePages: MetadataRoute.Sitemap = villes.map((ville) => ({
      url: `${SITE_URL}/villes/${ville.slug}`,
    }))

    return [...villesIndex, ...villePages]
  }

  // ── Geo pages (départements + régions) ──────────────────────────────
  if (id === 'geo') {
    const departementsIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/departements` },
    ]

    const departementPages: MetadataRoute.Sitemap = departements.map((dept) => ({
      url: `${SITE_URL}/departements/${dept.slug}`,
    }))

    const regionsIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/regions` },
    ]

    const regionPages: MetadataRoute.Sitemap = regions.map((region) => ({
      url: `${SITE_URL}/regions/${region.slug}`,
    }))

    return [...departementsIndex, ...departementPages, ...regionsIndex, ...regionPages]
  }


  // ── Devis service hub pages ─────────────────────────────────────────
  if (id === 'devis-services') {
    return Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/devis/${slug}`,
      lastModified: BUILD_DATE,
    }))
  }

  // ── Devis service×city pages (Phase 1: top 300 cities only) ─────────
  if (id.startsWith('devis-service-cities-')) {
    const batchIndex = parseInt(id.replace('devis-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const phase1Cities = villes.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const ville of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/devis/${svc.slug}/${ville.slug}` })
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
    const emergencySlugs = Object.keys(tradeContent).filter(s => tradeContent[s].emergencyInfo)
    const phase1Cities = villes.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of emergencySlugs) {
      for (const v of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/urgence/${svc}/${v.slug}` })
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
    const phase1Cities = villes.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const v of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/tarifs/${svc.slug}/${v.slug}` })
        count++
      }
    }

    return result
  }

  // ── Avis service hub pages ──────────────────────────────────────────
  if (id === 'avis-services') {
    const tradeSlugs = Object.keys(tradeContent)
    return [
      { url: `${SITE_URL}/avis`, lastModified: BUILD_DATE },
      ...tradeSlugs.map(slug => ({ url: `${SITE_URL}/avis/${slug}`, lastModified: BUILD_DATE })),
    ]
  }

  // ── Avis service×city pages (Phase 1: top 300 cities only) ──────────
  if (id.startsWith('avis-service-cities-')) {
    const batchIndex = parseInt(id.replace('avis-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const tradeSlugs = Object.keys(tradeContent)
    const phase1Cities = villes.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of tradeSlugs) {
      for (const v of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/avis/${svc}/${v.slug}` })
        count++
      }
    }

    return result
  }

  // ── Problemes hub + individual pages ────────────────────────────────
  if (id === 'problemes') {
    const problemSlugs = getProblemSlugs()
    return [
      { url: `${SITE_URL}/problemes`, lastModified: BUILD_DATE },
      ...problemSlugs.map(slug => ({ url: `${SITE_URL}/problemes/${slug}`, lastModified: BUILD_DATE })),
    ]
  }

  // ── Problemes × city pages (Phase 1: top 300 cities only) ───────────
  if (id.startsWith('problemes-cities-')) {
    const batchIndex = parseInt(id.split('-').pop()!)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const problemSlugs = getProblemSlugs()
    const phase1Cities = villes.slice(0, TOP_CITIES_PHASE1)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const problem of problemSlugs) {
      for (const ville of phase1Cities) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/problemes/${problem}/${ville.slug}` })
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
    for (const dept of departements) {
      for (const service of tradeSlugs) {
        allUrls.push({ url: `${SITE_URL}/departements/${dept.slug}/${service}` })
      }
    }
    return allUrls.slice(batchIndex * LARGE_BATCH, (batchIndex + 1) * LARGE_BATCH)
  }

  // ── Region × service pages ──────────────────────────────────────────
  if (id === 'region-services') {
    const tradeSlugs = getTradesSlugs()
    return regions.flatMap(region =>
      tradeSlugs.map(service => ({
        url: `${SITE_URL}/regions/${region.slug}/${service}`,
      }))
    )
  }


  // Provider sitemaps are served via /api/sitemap-providers (dynamic API route).
  // Requests to /sitemap/providers-*.xml are rewritten by next.config.js.

  return []
}
