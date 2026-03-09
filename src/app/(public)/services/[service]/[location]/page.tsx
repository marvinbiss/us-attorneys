import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getServiceBySlug,
  getLocationBySlug,
  getProvidersByServiceAndLocation,
  getProviderCountByServiceAndLocation,
} from '@/lib/supabase'
import ServiceLocationPageClient from './PageClient'
import SeoContent from './_components/SeoContent'
import TradeSections from './_components/TradeSections'
import FaqAndBlogSection from './_components/FaqAndBlogSection'
import CrossLinks from './_components/CrossLinks'

import { getBreadcrumbSchema, getItemListSchema } from '@/lib/seo/jsonld'
import { popularServices, relatedServices } from '@/lib/constants/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { REVALIDATE } from '@/lib/cache'
import { getArtisanUrl } from '@/lib/utils'
import { getServiceImage } from '@/lib/data/images'
import { services as staticServicesList, villes, getVilleBySlug, getNearbyCities, getVillesByDepartement } from '@/lib/data/france'
import { getTradeContent } from '@/lib/data/trade-content'
import { getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { generateLocationContent, hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { getNaturalTerm } from '@/lib/seo/natural-terms'
import { getPageContent } from '@/lib/cms'
import { logger } from '@/lib/logger'
import { CmsContent } from '@/components/CmsContent'
import { getCommuneBySlug } from '@/lib/data/commune-data'
import type { Service, Location as LocationType, Provider } from '@/types'

// Safely escape JSON for script tags to prevent XSS
function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

// ISR: revalidate every 60s — stale cache served on DB outage
export const revalidate = REVALIDATE.serviceLocation
// Allow on-demand ISR for cities not pre-rendered at build time
export const dynamicParams = true

// Pre-render top 5 cities (46 × 5 = 230 pages)
// Remaining cities are generated on-demand via ISR
const TOP_CITIES_COUNT = 5
export function generateStaticParams() {
  const topCities = villes.slice(0, TOP_CITIES_COUNT)
  return staticServicesList.flatMap(s =>
    topCities.map(v => ({ service: s.slug, location: v.slug }))
  )
}

/** Resolve a ville from static data to Location shape (fallback when DB is down) */
function villeToLocation(slug: string): LocationType | null {
  const ville = getVilleBySlug(slug)
  if (!ville) return null
  return {
    id: '',
    name: ville.name,
    slug: ville.slug,
    postal_code: ville.codePostal,
    region_name: ville.region,
    department_name: ville.departement,
    department_code: ville.departementCode,
    is_active: true,
    created_at: '',
  }
}

// slugify imported from '@/lib/utils'

interface PageProps {
  params: Promise<{
    service: string
    location: string
  }>
}

/** Truncate title to ~42 chars to leave room for " | ServicesArtisans" suffix (18 chars → total ~60, Google's display limit) */
function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '\u2026'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: serviceSlug, location: locationSlug } = await params

  let serviceName = ''
  let locationName = ''
  let departmentCode = ''
  let departmentName = ''
  // Fail open: default to indexed. ISR will correct if truly 0 providers.
  let providerCount = 1

  try {
    const [service, location, count] = await Promise.all([
      getServiceBySlug(serviceSlug),
      getLocationBySlug(locationSlug) as Promise<import('@/types').Location | null>,
      // Lightweight count-only check — avoids fetching all provider rows
      getProviderCountByServiceAndLocation(serviceSlug, locationSlug),
    ])

    if (service) serviceName = service.name
    if (location) {
      locationName = location.name
      departmentCode = location.department_code || ''
      departmentName = location.department_name || ''
    }

    providerCount = count
  } catch {
    // DB down — fallback to static data
    const staticSvc = staticServicesList.find(s => s.slug === serviceSlug)
    const ville = getVilleBySlug(locationSlug)
    if (staticSvc) serviceName = staticSvc.name
    if (ville) {
      locationName = ville.name
      departmentCode = ville.departementCode
      departmentName = ville.departement
    }
    providerCount = 1 // Fail open: default to indexed. ISR will correct if truly 0 providers.
  }

  if (!serviceName || !locationName) {
    return { title: 'Non trouvé', robots: { index: false, follow: false } }
  }

  const hasProviders = providerCount > 0
  const svcLower = serviceName.toLowerCase()
  const naturalTerm = getNaturalTerm(serviceSlug)

  // Unified SEO seed for title + H1 coherence (same seed used in both generateMetadata and page render)
  const seoHash = Math.abs(hashCode(`seo-${serviceSlug}-${locationSlug}`))

  const seoPairs = hasProviders
    ? [
        { title: `${serviceName} ${locationName} — ${providerCount} artisans`, h1: `${serviceName} à ${locationName}` },
        { title: `${serviceName} à ${locationName} — Devis Gratuit`, h1: `Trouvez ${naturalTerm.article} à ${locationName}` },
        { title: `${serviceName} ${locationName}${departmentCode ? ` (${departmentCode})` : ''} — Devis`, h1: `${serviceName} à ${locationName} — ${providerCount} pros référencés` },
        { title: `${serviceName} à ${locationName} — Comparez`, h1: `${serviceName} à ${locationName}${departmentCode ? ` (${departmentCode})` : ''}` },
        { title: `${serviceName} ${locationName} : avis et devis`, h1: `Les meilleurs ${naturalTerm.plural} à ${locationName}` },
      ]
    : [
        { title: `${serviceName} ${locationName} — Annuaire`, h1: `${serviceName} à ${locationName}` },
        { title: `${serviceName} à ${locationName} — Devis Gratuit`, h1: `Trouvez ${naturalTerm.article} à ${locationName}` },
        { title: `${serviceName} ${locationName}${departmentCode ? ` (${departmentCode})` : ''}`, h1: `${serviceName} à ${locationName} — Artisans qualifiés` },
        { title: `${serviceName} à ${locationName} — Artisans`, h1: `${serviceName} à ${locationName}${departmentCode ? ` (${departmentCode})` : ''}` },
        { title: `${serviceName} ${locationName} : annuaire`, h1: `Les meilleurs ${naturalTerm.plural} à ${locationName}` },
      ]

  const title = truncateTitle(seoPairs[seoHash % seoPairs.length].title)

  // Unique meta descriptions with provider count, department and regional context
  const descHash = Math.abs(hashCode(`desc-${serviceSlug}-${locationSlug}`))
  const deptLabel = departmentName || departmentCode
  const descTemplates = hasProviders
    ? [
        `${providerCount} ${svcLower}s vérifiés SIREN à ${locationName}${deptLabel ? ` (${deptLabel})` : ''}. Comparez les profils, tarifs et avis. Devis gratuit.`,
        `${serviceName} à ${locationName} : ${providerCount} artisans référencés. Comparez et demandez un devis gratuit, sans engagement.`,
        `Trouvez le meilleur ${svcLower} à ${locationName} parmi ${providerCount} pros vérifiés. Tarifs, avis et devis gratuit.`,
        `${locationName}${departmentCode ? ` (${departmentCode})` : ''} : ${providerCount} ${svcLower}s vérifiés SIREN. Tarifs, avis et devis gratuit.`,
        `Besoin d'un ${svcLower} à ${locationName} ? ${providerCount} artisans vérifiés. Devis gratuit et réponse rapide.`,
      ]
    : [
        `Trouvez un ${svcLower} qualifié à ${locationName}${deptLabel ? ` (${deptLabel})` : ''}. Artisans vérifiés SIREN. Devis gratuit.`,
        `${serviceName} à ${locationName}${departmentCode ? ` (${departmentCode})` : ''} : artisans référencés. Devis gratuit, sans engagement.`,
        `Besoin d'un ${svcLower} à ${locationName} ? Annuaire d'artisans vérifiés. Devis gratuit.`,
        `${serviceName} à ${locationName}. Professionnels vérifiés SIREN. Devis gratuit et immédiat.`,
        `${locationName}${deptLabel ? ` (${deptLabel})` : ''} : trouvez un ${svcLower} de confiance. Artisans référencés SIREN. Devis gratuit.`,
      ]
  const description = descTemplates[descHash % descTemplates.length]

  return {
    title,
    description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'fr_FR',
      images: [{ url: getServiceImage(serviceSlug).src, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getServiceImage(serviceSlug).src],
    },
    alternates: {
      // Always self-referencing: if noindex, canonical is irrelevant; if indexed, it must point to self
      canonical: `${SITE_URL}/services/${serviceSlug}/${locationSlug}`,
    },
  }
}

// JSON-LD structured data for SEO
function generateJsonLd(service: Service, location: LocationType, _providers: unknown[], serviceSlug: string, locationSlug: string) {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} à ${location.name}`,
    description: `Trouvez les meilleurs ${service.name.toLowerCase()}s à ${location.name}`,
    image: getServiceImage(serviceSlug).src,
    areaServed: {
      '@type': 'City',
      name: location.name,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: location.department_name || '',
      },
    },
    provider: {
      '@id': `${SITE_URL}#organization`,
    },
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Services', url: '/services' },
    { name: service.name, url: `/services/${serviceSlug}` },
    { name: location.name, url: `/services/${serviceSlug}/${locationSlug}` },
  ])

  return [serviceSchema, breadcrumbSchema]
}

export default async function ServiceLocationPage({ params }: PageProps) {
  const { service: serviceSlug, location: locationSlug } = await params

  // CMS override — if admin published content for this specific service+city page
  let cmsPage = null
  try {
    cmsPage = await getPageContent(`${serviceSlug}-${locationSlug}`, 'location', { serviceSlug, locationSlug })
  } catch (err) {
    logger.error('[CMS] Error fetching page content for', { slug: `${serviceSlug}-${locationSlug}`, error: err })
  }

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-sand-100">
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <CmsContent html={cmsPage.content_html} />
          </div>
        </section>
      </div>
    )
  }

  // 1. Resolve service (DB → static fallback)
  let service: Service
  try {
    service = await getServiceBySlug(serviceSlug)
    if (!service) {
      const staticSvc = staticServicesList.find(s => s.slug === serviceSlug)
      if (!staticSvc) notFound()
      service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
    }
  } catch {
    const staticSvc = staticServicesList.find(s => s.slug === serviceSlug)
    if (!staticSvc) notFound()
    service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
  }

  // 2. Resolve location (DB → france.ts fallback)
  let location: LocationType
  try {
    const dbLocation = await getLocationBySlug(locationSlug)
    if (!dbLocation) {
      const fallback = villeToLocation(locationSlug)
      if (!fallback) notFound()
      location = fallback
    } else {
      location = { ...dbLocation, id: (dbLocation as Record<string, unknown>).code_insee as string || '' }
    }
  } catch {
    const fallback = villeToLocation(locationSlug)
    if (!fallback) notFound()
    location = fallback
  }

  // 3. Fetch providers + total count in parallel
  // (throw on providers failure so ISR keeps stale cache)
  const [providers, totalProviderCount] = await Promise.all([
    getProvidersByServiceAndLocation(serviceSlug, locationSlug),
    getProviderCountByServiceAndLocation(serviceSlug, locationSlug).catch(() => 0),
  ])

  const trade = getTradeContent(serviceSlug)
  const baseSchemas = generateJsonLd(service, location, providers || [], serviceSlug, locationSlug)

  // 4. Fetch commune enrichment data (best-effort, never crash)
  let communeData: Awaited<ReturnType<typeof getCommuneBySlug>> = null
  try {
    communeData = await getCommuneBySlug(locationSlug)
  } catch {
    // Commune table may not exist yet — continue without data
  }

  // Count recent devis requests for freshness signal
  let recentDevisCount = 0
  if (process.env.NEXT_BUILD_SKIP_DB !== '1') {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { count } = await supabase
        .from('devis_requests')
        .select('*', { count: 'exact', head: true })
        .ilike('city', location.name)
        .gte('created_at', thirtyDaysAgo.toISOString())
      recentDevisCount = count ?? 0
    } catch {
      recentDevisCount = 0
    }
  }

  // Generate unique SEO content per service+location combo (doorway-page mitigation)
  const ville = getVilleBySlug(locationSlug)
  const locationContent = ville
    ? generateLocationContent(serviceSlug, service.name, ville, providers.length, communeData)
    : null

  // Regional pricing multiplier for localized tariffs
  const pricingMultiplier = ville ? getRegionalMultiplier(ville.region) : 1.0

  // FAQ: combine 2 trade FAQ (hash-selected) + 4 location-specific FAQ
  const combinedFaq: { question: string; answer: string }[] = []
  if (trade && trade.faq.length > 0) {
    const tradeFaqHash = Math.abs(hashCode(`trade-faq-${serviceSlug}-${locationSlug}`))
    const idx1 = tradeFaqHash % trade.faq.length
    const idx2 = (tradeFaqHash + 3) % trade.faq.length
    combinedFaq.push({ question: trade.faq[idx1].q, answer: trade.faq[idx1].a })
    if (idx2 !== idx1) combinedFaq.push({ question: trade.faq[idx2].q, answer: trade.faq[idx2].a })
  }
  if (locationContent) combinedFaq.push(...locationContent.faqItems)
  const faqSchema = combinedFaq.length > 0 ? getFAQSchema(combinedFaq) : null

  // Task 2: ItemList JSON-LD for provider listings
  const itemListSchema = providers.length > 0
    ? getItemListSchema({
        name: `${service.name} à ${location.name}`,
        description: `Liste des ${service.name.toLowerCase()}s référencés à ${location.name}`,
        url: `/services/${serviceSlug}/${locationSlug}`,
        items: providers.slice(0, 20).map((p, i) => ({
          name: p.name,
          url: getArtisanUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city }),
          position: i + 1,
          image: getServiceImage(serviceSlug).src,
          rating: p.rating_average ?? undefined,
          reviewCount: p.review_count ?? undefined,
        })),
      })
    : null

  const jsonLdSchemas: Record<string, unknown>[] = [
    ...baseSchemas,
    ...(faqSchema ? [faqSchema] : []),
    ...(itemListSchema ? [itemListSchema] : []),
  ]

  // Cross-link to semantically related services (with fallback to popular)
  const relatedSlugs = relatedServices[serviceSlug] || []
  const otherServices = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 6).map(slug => {
        const svc = staticServicesList.find(s => s.slug === slug)
        return svc ? { slug: svc.slug, name: svc.name, icon: svc.icon } : null
      }).filter(Boolean) as { slug: string; name: string; icon: string }[]
    : popularServices.filter(s => s.slug !== serviceSlug).slice(0, 6)
  const nearbyCities = getNearbyCities(locationSlug, 12)
  const deptCities = location.department_code
    ? getVillesByDepartement(location.department_code).filter(v => v.slug !== locationSlug).slice(0, 10)
    : []

  // H1 uses same seed as title for coherence (seo- prefix)
  const providerCount = totalProviderCount
  const seoHashH1 = Math.abs(hashCode(`seo-${serviceSlug}-${locationSlug}`))
  const naturalTermH1 = getNaturalTerm(serviceSlug)
  const hasProvidersH1 = providerCount > 0
  const h1Variants = hasProvidersH1
    ? [
        `${service.name} à ${location.name}`,
        `Trouvez ${naturalTermH1.article} à ${location.name}`,
        `${service.name} à ${location.name} — ${providerCount} pros référencés`,
        `${service.name} à ${location.name}${location.department_code ? ` (${location.department_code})` : ''}`,
        `Les meilleurs ${naturalTermH1.plural} à ${location.name}`,
      ]
    : [
        `${service.name} à ${location.name}`,
        `Trouvez ${naturalTermH1.article} à ${location.name}`,
        `${service.name} à ${location.name} — Artisans qualifiés`,
        `${service.name} à ${location.name}${location.department_code ? ` (${location.department_code})` : ''}`,
        `Les meilleurs ${naturalTermH1.plural} à ${location.name}`,
      ]
  const h1Text = h1Variants[seoHashH1 % h1Variants.length]

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLdSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(schema) }}
        />
      ))}

      {/* Visual breadcrumb for navigation and SEO */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[
            { label: 'Services', href: '/services' },
            { label: service.name, href: `/services/${serviceSlug}` },
            { label: location.name },
          ]} />
        </div>
      </div>

      {/* Page Content */}
      <ServiceLocationPageClient
        service={service}
        location={location}
        providers={(providers || []) as unknown as Provider[]}
        h1Text={h1Text}
        totalCount={totalProviderCount}
        serviceSlug={serviceSlug}
        locationSlug={locationSlug}
        recentDevisCount={recentDevisCount}
      />

      <SeoContent
        locationContent={locationContent}
        communeData={communeData}
        service={service}
        location={location}
        locationSlug={locationSlug}
        providerCount={providers.length}
        trade={trade || null}
        pricingMultiplier={pricingMultiplier}
      />

      {trade && (
        <TradeSections
          trade={trade}
          service={service}
          location={location}
          serviceSlug={serviceSlug}
          locationSlug={locationSlug}
          pricingMultiplier={pricingMultiplier}
        />
      )}

      <FaqAndBlogSection
        combinedFaq={combinedFaq}
        service={service}
        location={location}
        serviceSlug={serviceSlug}
      />

      <CrossLinks
        service={service}
        location={location}
        serviceSlug={serviceSlug}
        locationSlug={locationSlug}
        otherServices={otherServices}
        nearbyCities={nearbyCities}
        deptCities={deptCities}
        locationContent={locationContent}
        communeData={communeData}
      />
    </>
  )
}

