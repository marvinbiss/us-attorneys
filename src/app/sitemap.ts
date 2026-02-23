import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import { services, villes, departements, regions, getQuartiersByVille } from '@/lib/data/france'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { getProblemSlugs } from '@/lib/data/problems'
import { getGuideSlugs } from '@/lib/data/guides'
import { articleSlugs } from '@/lib/data/blog/articles'
import { allArticles } from '@/lib/data/blog/articles'
import inseeCommunes from '@/lib/data/insee-communes.json'

// Provider batch size — small enough to avoid Vercel function timeout (5 DB queries of 1k each)
const PROVIDER_BATCH_SIZE = 5_000

// Batch size for static (non-DB) sitemaps — must match the BATCH used in sitemap() slicing
const STATIC_BATCH = 10_000

// Phase 1: submit only top-300 cities for new domain (conservative crawl budget).
// Phase 2 (service-cities-extended) is handled below but NOT registered in generateSitemaps yet.
// Uncomment the Phase 2 line in generateSitemaps() once domain authority grows (month 2-3).
const TOP_CITIES_PHASE1 = 300

/**
 * Generate sitemap index entries.
 * Next.js 14 calls this to produce /sitemap/[id].xml and a sitemap index.
 */
export async function generateSitemaps() {
  // Count total service×quartier URLs to determine batch count
  let totalServiceQuartierUrls = 0
  for (const v of villes) {
    totalServiceQuartierUrls += (v.quartiers?.length || 0) * services.length
  }
  const sqBatchCount = Math.ceil(totalServiceQuartierUrls / STATIC_BATCH)

  // Phase 1: top 300 cities only — focused crawl budget on high-traffic cities for new domain.
  const serviceCitiesPhase1BatchCount = Math.ceil(services.length * TOP_CITIES_PHASE1 / 45000)

  const sitemaps: { id: string }[] = [
    { id: 'static' },
    ...Array.from({ length: serviceCitiesPhase1BatchCount }, (_, i) => ({ id: `service-cities-${i}` })),
    // Phase 2: uncomment when domain authority grows (month 2-3):
    // ...Array.from({ length: Math.ceil(services.length * (villes.length - TOP_CITIES_PHASE1) / 45000) }, (_, i) => ({ id: `service-cities-extended-${i}` })),
    { id: 'cities' },
    { id: 'geo' },
    { id: 'quartiers' },
    ...Array.from({ length: sqBatchCount }, (_, i) => ({ id: `service-quartiers-${i}` })),
    { id: 'devis-services' },
    ...Array.from({ length: Math.ceil(services.length * villes.length / STATIC_BATCH) }, (_, i) => ({ id: `devis-service-cities-${i}` })),
    ...(() => {
      let totalDevisQuartierUrls = 0
      for (const v of villes) {
        totalDevisQuartierUrls += (v.quartiers?.length || 0) * services.length
      }
      const dqBatchCount = Math.ceil(totalDevisQuartierUrls / STATIC_BATCH)
      return Array.from({ length: dqBatchCount }, (_, i) => ({ id: `devis-quartiers-${i}` }))
    })(),
    ...(() => {
      const emergencySlugs = Object.keys(tradeContent).filter(s => tradeContent[s].emergencyInfo)
      const ucBatchCount = Math.ceil(emergencySlugs.length * villes.length / STATIC_BATCH)
      return Array.from({ length: ucBatchCount }, (_, i) => ({ id: `urgence-service-cities-${i}` }))
    })(),
    ...Array.from(
      { length: Math.ceil(services.length * villes.length / STATIC_BATCH) },
      (_, i) => ({ id: `tarifs-service-cities-${i}` })
    ),
    { id: 'avis-services' },
    ...Array.from(
      { length: Math.ceil(Object.keys(tradeContent).length * villes.length / STATIC_BATCH) },
      (_, i) => ({ id: `avis-service-cities-${i}` })
    ),
    { id: 'problemes' },
    ...Array.from(
      { length: Math.ceil(getProblemSlugs().length * villes.length / STATIC_BATCH) },
      (_, i) => ({ id: `problemes-cities-${i}` })
    ),
    ...Array.from(
      { length: Math.ceil(departements.length * getTradesSlugs().length / 45000) },
      (_, i) => ({ id: `dept-services-${i}` })
    ),
    { id: 'region-services' },
    { id: 'guides' },
  ]

  // Determine how many provider batches we need
  let providerCount = 0
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { count, error } = await supabase
      .from('providers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('noindex', false)

    if (!error && count) {
      providerCount = count
    }
  } catch {
    // DB unavailable at build time — no provider sitemaps
  }

  if (providerCount > 0) {
    const batchCount = Math.ceil(providerCount / PROVIDER_BATCH_SIZE)
    for (let i = 0; i < batchCount; i++) {
      sitemaps.push({ id: `providers-${i}` })
    }
  }

  return sitemaps
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {

  // ── Static pages + services ─────────────────────────────────────────
  if (id === 'static') {
    const homepage: MetadataRoute.Sitemap = [
      { url: SITE_URL },
    ]

    const staticPages: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/a-propos` },
      { url: `${SITE_URL}/contact` },
      { url: `${SITE_URL}/blog` },
      { url: `${SITE_URL}/faq` },
      { url: `${SITE_URL}/comment-ca-marche` },
      { url: `${SITE_URL}/tarifs` },
      { url: `${SITE_URL}/urgence` },
      { url: `${SITE_URL}/devis` },
      { url: `${SITE_URL}/mentions-legales` },
      { url: `${SITE_URL}/confidentialite` },
      { url: `${SITE_URL}/cgv` },
      { url: `${SITE_URL}/accessibilite` },
      { url: `${SITE_URL}/notre-processus-de-verification` },
      { url: `${SITE_URL}/politique-avis` },
      { url: `${SITE_URL}/mediation` },
      { url: `${SITE_URL}/plan-du-site` },
      { url: `${SITE_URL}/outils/calculateur-prix` },
      { url: `${SITE_URL}/outils/diagnostic` },
      { url: `${SITE_URL}/carte-artisans` },
      { url: `${SITE_URL}/artisans` },
    ]

    // Blog articles — lastModified réel (seul contenu avec vraie date vérifiable)
    const blogArticlePages: MetadataRoute.Sitemap = articleSlugs.map((slug) => {
      const article = allArticles[slug]
      return {
        url: `${SITE_URL}/blog/${slug}`,
        lastModified: article ? new Date(article.updatedDate || article.date) : undefined,
      }
    })

    const servicesIndex: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/services` },
    ]

    const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
      url: `${SITE_URL}/services/${service.slug}`,
    }))

    const emergencySlugs = Object.keys(tradeContent).filter((s) => tradeContent[s].emergencyInfo)
    const urgencePages: MetadataRoute.Sitemap = emergencySlugs.map((slug) => ({
      url: `${SITE_URL}/urgence/${slug}`,
    }))

    const tarifsPages: MetadataRoute.Sitemap = Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/tarifs/${slug}`,
    }))

    return [...homepage, ...staticPages, ...blogArticlePages, ...servicesIndex, ...servicePages, ...urgencePages, ...tarifsPages]
  }

  // ── Service + city — Phase 1: top 300 cities ────────────────────────
  if (id.startsWith('service-cities-') && !id.startsWith('service-cities-extended-')) {
    const batchIndex = parseInt(id.replace('service-cities-', ''), 10)
    const BATCH = 45000
    const offset = batchIndex * BATCH

    const phase1Cities = villes.slice(0, TOP_CITIES_PHASE1)
    const allUrls: MetadataRoute.Sitemap = []
    for (const service of services) {
      for (const ville of phase1Cities) {
        allUrls.push({ url: `${SITE_URL}/services/${service.slug}/${ville.slug}` })
      }
    }

    return allUrls.slice(offset, offset + BATCH)
  }

  // ── Service + city — Phase 2: remaining cities (not registered yet) ──
  if (id.startsWith('service-cities-extended-')) {
    const batchIndex = parseInt(id.replace('service-cities-extended-', ''), 10)
    const BATCH = 45000
    const offset = batchIndex * BATCH

    const phase2Cities = villes.slice(TOP_CITIES_PHASE1)
    const allUrls: MetadataRoute.Sitemap = []
    for (const service of services) {
      for (const ville of phase2Cities) {
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

  // ── Quartier pages ─────────────────────────────────────────────────
  if (id === 'quartiers') {
    return villes.flatMap(ville =>
      getQuartiersByVille(ville.slug).map(q => ({
        url: `${SITE_URL}/villes/${ville.slug}/${q.slug}`,
      }))
    )
  }

  // ── Service × Quartier pages ────────────────────────────────────────
  if (id.startsWith('service-quartiers-')) {
    const batchIndex = parseInt(id.replace('service-quartiers-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const ville of villes) {
        const quartiers = getQuartiersByVille(ville.slug)
        for (const q of quartiers) {
          if (count >= end) break outer
          if (count >= start) result.push({ url: `${SITE_URL}/services/${svc.slug}/${ville.slug}/${q.slug}` })
          count++
        }
      }
    }

    return result
  }

  // ── Devis service hub pages ─────────────────────────────────────────
  if (id === 'devis-services') {
    return Object.keys(tradeContent).map((slug) => ({
      url: `${SITE_URL}/devis/${slug}`,
    }))
  }

  // ── Devis service×city pages ────────────────────────────────────────
  if (id.startsWith('devis-service-cities-')) {
    const batchIndex = parseInt(id.replace('devis-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const ville of villes) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/devis/${svc.slug}/${ville.slug}` })
        count++
      }
    }

    return result
  }

  // ── Devis × Quartier pages ──────────────────────────────────────────
  if (id.startsWith('devis-quartiers-')) {
    const batchIndex = parseInt(id.replace('devis-quartiers-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const ville of villes) {
        const quartiers = getQuartiersByVille(ville.slug)
        for (const q of quartiers) {
          if (count >= end) break outer
          if (count >= start) result.push({ url: `${SITE_URL}/devis/${svc.slug}/${ville.slug}/${q.slug}` })
          count++
        }
      }
    }

    return result
  }

  // ── Urgence service×city pages ──────────────────────────────────────
  if (id.startsWith('urgence-service-cities-')) {
    const batchIndex = parseInt(id.replace('urgence-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const emergencySlugs = Object.keys(tradeContent).filter(s => tradeContent[s].emergencyInfo)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of emergencySlugs) {
      for (const v of villes) {
        if (count >= end) break outer
        if (count >= start) result.push({ url: `${SITE_URL}/urgence/${svc}/${v.slug}` })
        count++
      }
    }

    return result
  }

  // ── Tarifs service×city pages ───────────────────────────────────────
  if (id.startsWith('tarifs-service-cities-')) {
    const batchIndex = parseInt(id.replace('tarifs-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of services) {
      for (const v of villes) {
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
      { url: `${SITE_URL}/avis` },
      ...tradeSlugs.map(slug => ({ url: `${SITE_URL}/avis/${slug}` })),
    ]
  }

  // ── Avis service×city pages ─────────────────────────────────────────
  if (id.startsWith('avis-service-cities-')) {
    const batchIndex = parseInt(id.replace('avis-service-cities-', ''), 10)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const tradeSlugs = Object.keys(tradeContent)
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const svc of tradeSlugs) {
      for (const v of villes) {
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
      { url: `${SITE_URL}/problemes` },
      ...problemSlugs.map(slug => ({ url: `${SITE_URL}/problemes/${slug}` })),
    ]
  }

  // ── Problemes × city pages ──────────────────────────────────────────
  if (id.startsWith('problemes-cities-')) {
    const batchIndex = parseInt(id.split('-').pop()!)
    const BATCH = STATIC_BATCH
    const start = batchIndex * BATCH
    const end = start + BATCH
    const problemSlugs = getProblemSlugs()
    const result: MetadataRoute.Sitemap = []
    let count = 0

    outer: for (const problem of problemSlugs) {
      for (const ville of villes) {
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
    return allUrls.slice(batchIndex * 45000, (batchIndex + 1) * 45000)
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

  // ── Guides hub + individual pages ───────────────────────────────────
  if (id === 'guides') {
    const guideSlugs = getGuideSlugs()
    return [
      { url: `${SITE_URL}/guides` },
      ...guideSlugs.map(slug => ({ url: `${SITE_URL}/guides/${slug}` })),
    ]
  }

  // ── Provider pages — lastModified réel depuis updated_at ────────────
  if (id.startsWith('providers-')) {
    const batchIndex = parseInt(id.replace('providers-', ''), 10)
    const offset = batchIndex * PROVIDER_BATCH_SIZE

    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const serviceMap = new Map<string, string>()
      for (const s of services) {
        serviceMap.set(
          s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
          s.slug
        )
      }

      const villeMap = new Map<string, string>()
      for (const v of villes) {
        villeMap.set(
          v.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
          v.slug
        )
      }

      // Arrondissement INSEE codes → main city slug
      // Paris 75101-75120, Marseille 13201-13216, Lyon 69381-69389
      const arrondissementMap: Record<string, string> = {}
      for (let i = 1; i <= 20; i++) arrondissementMap[`751${String(i).padStart(2, '0')}`] = 'paris'
      for (let i = 1; i <= 16; i++) arrondissementMap[`132${String(i).padStart(2, '0')}`] = 'marseille'
      for (let i = 81; i <= 89; i++) arrondissementMap[`693${String(i)}`] = 'lyon'

      const specialtyToSlug: Record<string, string> = {
        'plombier': 'plombier',
        'electricien': 'electricien',
        'chauffagiste': 'chauffagiste',
        'menuisier': 'menuisier',
        'menuisier-metallique': 'serrurier',
        'carreleur': 'carreleur',
        'couvreur': 'couvreur',
        'macon': 'macon',
        'peintre': 'peintre-en-batiment',
        'charpentier': 'charpentier',
        'isolation': 'isolation-thermique',
        'platrier': 'platrier',
        'finition': 'peintre-en-batiment',
        'serrurier': 'serrurier',
        'jardinier': 'jardinier',
        'paysagiste': 'paysagiste',
        'vitrier': 'vitrier',
        'miroitier': 'miroitier',
        'cuisiniste': 'cuisiniste',
        'installateur-de-cuisine': 'cuisiniste',
        'solier': 'solier',
        'poseur-de-parquet': 'poseur-de-parquet',
        'parqueteur': 'poseur-de-parquet',
        'moquettiste': 'solier',
        'nettoyage': 'nettoyage',
        'nettoyage-professionnel': 'nettoyage',
        'terrassier': 'terrassier',
        'terrassement': 'terrassier',
        'zingueur': 'zingueur',
        'couvreur-zingueur': 'zingueur',
        'etancheiste': 'etancheiste',
        'etancheite': 'etancheiste',
        'facadier': 'facadier',
        'facade': 'facadier',
        'ravalement': 'facadier',
        'plaquiste': 'platrier',
        'platrerie': 'platrier',
        'metallier': 'metallier',
        'metallerie': 'metallier',
        'ferronnier': 'ferronnier',
        'ferronnerie': 'ferronnier',
        'storiste': 'storiste',
        'store': 'storiste',
        'volet': 'storiste',
        'salle-de-bain': 'salle-de-bain',
        'installateur-de-salle-de-bain': 'salle-de-bain',
        'architecte-interieur': 'architecte-interieur',
        'architecte-d-interieur': 'architecte-interieur',
        'decoration': 'decorateur',
        'decorateur': 'decorateur',
        'peintre-decorateur': 'decorateur',
        'domoticien': 'domoticien',
        'domotique': 'domoticien',
        'pompe-a-chaleur': 'pompe-a-chaleur',
        'pac': 'pompe-a-chaleur',
        'panneaux-solaires': 'panneaux-solaires',
        'photovoltaique': 'panneaux-solaires',
        'solaire': 'panneaux-solaires',
        'isolation-thermique': 'isolation-thermique',
        'ite': 'isolation-thermique',
        'iti': 'isolation-thermique',
        'renovation-energetique': 'renovation-energetique',
        'rge': 'renovation-energetique',
        'borne-recharge': 'borne-recharge',
        'borne-electrique': 'borne-recharge',
        'ramoneur': 'ramoneur',
        'ramonage': 'ramoneur',
        'amenagement-exterieur': 'paysagiste',
        'pisciniste': 'pisciniste',
        'piscine': 'pisciniste',
        'alarme': 'alarme-securite',
        'securite': 'alarme-securite',
        'videosurveillance': 'alarme-securite',
        'alarme-securite': 'alarme-securite',
        'antenniste': 'antenniste',
        'antenne': 'antenniste',
        'ascensoriste': 'ascensoriste',
        'ascenseur': 'ascensoriste',
        'diagnostiqueur': 'diagnostiqueur',
        'diagnostic': 'diagnostiqueur',
        'dpe': 'diagnostiqueur',
        'geometre': 'geometre',
        'geometre-expert': 'geometre',
        'desinsectisation': 'desinsectisation',
        'desinsectiseur': 'desinsectisation',
        'nuisibles': 'desinsectisation',
        'deratisation': 'deratisation',
        'deratiseur': 'deratisation',
        'demenageur': 'demenageur',
        'demenagement': 'demenageur',
        'climaticien': 'climaticien',
      }

      type ProviderRow = {
        id: string
        name: string | null
        slug: string | null
        stable_id: string | null
        specialty: string | null
        address_city: string | null
        updated_at: string | null
      }

      const inseeMap = inseeCommunes as Record<string, { n: string }>

      // Extend villeMap with all inseeCommunes for 100% coverage (small communes)
      // Generated slugs match the locations table exactly (verified against DB)
      const slugify = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      for (const entry of Object.values(inseeMap)) {
        const norm = entry.n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        if (!villeMap.has(norm)) {
          villeMap.set(norm, slugify(entry.n))
        }
      }

      let allProviders: ProviderRow[] = []
      let from = offset
      const PAGE_SIZE = 1000
      const limit = offset + PROVIDER_BATCH_SIZE

      while (from < limit) {
        const { data, error } = await supabase
          .from('providers')
          .select('id, name, slug, stable_id, specialty, address_city, updated_at')
          .eq('is_active', true)
          .eq('noindex', false)
          .order('updated_at', { ascending: false })
          .range(from, Math.min(from + PAGE_SIZE - 1, limit - 1))

        if (error || !data || data.length === 0) break
        allProviders = allProviders.concat(data)
        if (data.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }

      const providerEntries: MetadataRoute.Sitemap = allProviders
        .filter((p) => p.name && p.specialty && p.address_city)
        .map((p) => {
          const normalizedSpecialty = p.specialty!.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          const serviceSlug = serviceMap.get(normalizedSpecialty) || specialtyToSlug[p.specialty!.toLowerCase()]
          const rawCity = p.address_city!
          const isInsee = /^\d{4,5}$/.test(rawCity) || /^[0-9][A-Z0-9]\d{3}$/.test(rawCity)
          // Try arrondissement map first (Paris 75101-75120, Marseille 13201-13216, Lyon 69381-69389)
          const arrondissementSlug = isInsee ? arrondissementMap[rawCity] : undefined
          const cityName = isInsee ? (inseeMap[rawCity]?.n || rawCity) : rawCity
          const normalizedCity = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          const locationSlug = arrondissementSlug || villeMap.get(normalizedCity)
          // MUST match getArtisanUrl() priority: slug first, then stable_id
          // Previous: stable_id || slug caused canonical mismatch → isWrongUrl → noindex
          const publicId = p.slug || p.stable_id || p.id

          if (!serviceSlug || !locationSlug || !publicId) return null

          return {
            url: `${SITE_URL}/services/${serviceSlug}/${locationSlug}/${publicId}`,
            // lastModified réel — seul cas où la date est vérifiable par Google
            lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

      return providerEntries
    } catch {
      return []
    }
  }

  return []
}
