import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getSpecialtyBySlug,
  getLocationBySlug,
  getAttorneysByServiceAndLocation,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import ServiceLocationPageClient from './PageClient'
import SeoContent from './_components/SeoContent'
import TradeSections from './_components/TradeSections'
import FaqAndBlogSection from './_components/FaqAndBlogSection'
import CrossLinks from './_components/CrossLinks'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import type { LocationData } from '@/lib/data/commune-data'

import { getBreadcrumbSchema, getItemListSchema, getSpeakableSchema } from '@/lib/seo/jsonld'
import { popularServices, relatedServices } from '@/lib/constants/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { getAttorneyUrl } from '@/lib/utils'
import { getServiceImage } from '@/lib/data/images'
import { practiceAreas as staticPracticeAreas, cities, getCityBySlug, getNearbyCities, getCitiesByState, getStateByCode } from '@/lib/data/usa'
import { getTradeContent } from '@/lib/data/trade-content'
import { getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { generateLocationContent, hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { getNaturalTerm } from '@/lib/seo/natural-terms'
import { getPageContent } from '@/lib/cms'
import { logger } from '@/lib/logger'
import { CmsContent } from '@/components/CmsContent'
import { SpeakableAnswerBox } from '@/components/SpeakableAnswerBox'
import StickyMobileCTA from '@/components/StickyMobileCTA'
import SearchRecorder from '@/components/SearchRecorder'
import DemandIndicator from '@/components/DemandIndicator'
import TrustGuarantee from '@/components/TrustGuarantee'
import dynamic from 'next/dynamic'
import type { Service, Location as LocationType, Provider } from '@/types'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

const MicroConversions = dynamic(
  () => import('@/components/MicroConversions'),
  { ssr: false }
)

const ProactiveChatPrompt = dynamic(
  () => import('@/components/ProactiveChatPrompt'),
  { ssr: false }
)

const CallbackRequest = dynamic(
  () => import('@/components/CallbackRequest'),
  { ssr: false }
)

// Safely escape JSON for script tags to prevent XSS
function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

// ISR: revalidate every 24h — stale cache served on DB outage
export const revalidate = 86400
// Allow on-demand ISR for cities not pre-rendered at build time
export const dynamicParams = true

// Pre-render top 50 cities (46 × 50 = 2300 pages)
// Remaining cities are generated on-demand via ISR
const TOP_CITIES_COUNT = 50
export function generateStaticParams() {
  const topCities = cities.slice(0, TOP_CITIES_COUNT)
  return staticPracticeAreas.flatMap(s =>
    topCities.map(v => ({ service: s.slug, location: v.slug }))
  )
}

/** Resolve a ville from static data to Location shape (fallback when DB is down) */
function villeToLocation(slug: string): LocationType | null {
  const ville = getCityBySlug(slug)
  if (!ville) return null
  return {
    id: '',
    name: ville.name,
    slug: ville.slug,
    postal_code: ville.zipCode,
    region_name: getStateByCode(ville.stateCode)?.region || '',
    department_name: ville.stateName,
    department_code: ville.stateCode,
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
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: specialtySlug, location: locationSlug } = await params

  let specialtyName = ''
  let locationName = ''
  let departmentCode = ''
  let departmentName = ''
  // Fail open: default to indexed. ISR will correct if truly 0 providers.
  let attorneyCount = 1

  try {
    const [service, location, count] = await Promise.all([
      getSpecialtyBySlug(specialtySlug),
      getLocationBySlug(locationSlug) as Promise<import('@/types').Location | null>,
      // Lightweight count-only check — avoids fetching all provider rows
      getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug),
    ])

    if (service) specialtyName = service.name
    if (location) {
      locationName = location.name
      departmentCode = location.department_code || ''
      departmentName = location.department_name || ''
    }

    attorneyCount = count
  } catch {
    // DB down — fallback to static data
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    const ville = getCityBySlug(locationSlug)
    if (staticSvc) specialtyName = staticSvc.name
    if (ville) {
      locationName = ville.name
      departmentCode = ville.stateCode
      departmentName = ville.stateName
    }
    attorneyCount = 1 // Fail open: default to indexed. ISR will correct if truly 0 providers.
  }

  if (!specialtyName || !locationName) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const hasProviders = attorneyCount > 0
  const svcLower = specialtyName.toLowerCase()
  const naturalTerm = getNaturalTerm(specialtySlug)

  // Unified SEO seed for title + H1 coherence (same seed used in both generateMetadata and page render)
  const seoHash = Math.abs(hashCode(`seo-${specialtySlug}-${locationSlug}`))

  const seoPairs = hasProviders
    ? [
        { title: `${specialtyName} ${locationName} — ${attorneyCount} attorneys`, h1: `${specialtyName} in ${locationName}` },
        { title: `${specialtyName} in ${locationName} — Free Consultation`, h1: `Find ${naturalTerm.article} in ${locationName}` },
        { title: `${specialtyName} ${locationName}${departmentCode ? ` (${departmentCode})` : ''} — Consultation`, h1: `${specialtyName} in ${locationName} — ${attorneyCount} verified pros` },
        { title: `${specialtyName} in ${locationName} — Compare`, h1: `${specialtyName} in ${locationName}${departmentCode ? ` (${departmentCode})` : ''}` },
        { title: `${specialtyName} ${locationName}: reviews and consultation`, h1: `Best ${naturalTerm.plural} in ${locationName}` },
      ]
    : [
        { title: `${specialtyName} ${locationName} — Directory`, h1: `${specialtyName} in ${locationName}` },
        { title: `${specialtyName} in ${locationName} — Free Consultation`, h1: `Find ${naturalTerm.article} in ${locationName}` },
        { title: `${specialtyName} ${locationName}${departmentCode ? ` (${departmentCode})` : ''}`, h1: `${specialtyName} in ${locationName} — Qualified Attorneys` },
        { title: `${specialtyName} in ${locationName} — Attorneys`, h1: `${specialtyName} in ${locationName}${departmentCode ? ` (${departmentCode})` : ''}` },
        { title: `${specialtyName} ${locationName}: directory`, h1: `Best ${naturalTerm.plural} in ${locationName}` },
      ]

  const title = truncateTitle(seoPairs[seoHash % seoPairs.length].title)

  // Unique meta descriptions with provider count, department and regional context
  const descHash = Math.abs(hashCode(`desc-${specialtySlug}-${locationSlug}`))
  const deptLabel = departmentName || departmentCode
  const descTemplates = hasProviders
    ? [
        `${attorneyCount} bar-verified ${svcLower}s in ${locationName}${deptLabel ? ` (${deptLabel})` : ''}. Compare profiles, fees and reviews. Free consultation.`,
        `${specialtyName} in ${locationName}: ${attorneyCount} verified attorneys. Compare and request a free consultation, no obligation.`,
        `Find the best ${svcLower} in ${locationName} among ${attorneyCount} verified pros. Fees, reviews and free consultation.`,
        `${locationName}${departmentCode ? ` (${departmentCode})` : ''}: ${attorneyCount} bar-verified ${svcLower}s. Fees, reviews and free consultation.`,
        `Need a ${svcLower} in ${locationName}? ${attorneyCount} verified attorneys. Free consultation and fast response.`,
      ]
    : [
        `Find a qualified ${svcLower} in ${locationName}${deptLabel ? ` (${deptLabel})` : ''}. Bar-verified attorneys. Free consultation.`,
        `${specialtyName} in ${locationName}${departmentCode ? ` (${departmentCode})` : ''}: verified attorneys. Free consultation, no obligation.`,
        `Need a ${svcLower} in ${locationName}? Directory of verified attorneys. Free consultation.`,
        `${specialtyName} in ${locationName}. Bar-verified professionals. Free and immediate consultation.`,
        `${locationName}${deptLabel ? ` (${deptLabel})` : ''}: find a trusted ${svcLower}. Bar-verified attorneys. Free consultation.`,
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
      images: [{ url: getServiceImage(specialtySlug).src, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getServiceImage(specialtySlug).src],
    },
    alternates: {
      // Always self-referencing: if noindex, canonical is irrelevant; if indexed, it must point to self
      canonical: `${SITE_URL}/practice-areas/${specialtySlug}/${locationSlug}`,
    },
  }
}

// JSON-LD structured data for SEO
function generateJsonLd(
  service: Service,
  location: LocationType,
  _providers: unknown[],
  specialtySlug: string,
  locationSlug: string,
  locationData: Awaited<ReturnType<typeof getLocationBySlug>> | null
) {
  const svcLower = service.name.toLowerCase()
  const trade = getTradeContent(specialtySlug)

  const localBusinessSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${service.name} in ${location.name}`,
    description: `Find a qualified ${svcLower} in ${location.name}. Bar-verified attorneys, free consultation and client reviews.`,
    image: getServiceImage(specialtySlug).src,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.name,
      ...(location.region_name ? { addressRegion: location.region_name } : {}),
      addressCountry: 'US',
      ...(location.postal_code ? { postalCode: location.postal_code } : {}),
    },
    ...('latitude' in (locationData ?? {}) && 'longitude' in (locationData ?? {}) ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: (locationData as Record<string, unknown>).latitude,
        longitude: (locationData as Record<string, unknown>).longitude,
      },
    } : {}),
    areaServed: {
      '@type': 'City',
      name: location.name,
      ...(location.department_name ? {
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: location.department_name,
        },
      } : {}),
    },
    ...(trade ? { priceRange: `${trade.priceRange.min}€–${trade.priceRange.max}€` } : {}),
    url: `${SITE_URL}/practice-areas/${specialtySlug}/${locationSlug}`,
    dateModified: new Date().toISOString().split('T')[0],
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} in ${location.name}`,
    description: `Find the best ${svcLower}s in ${location.name}`,
    image: getServiceImage(specialtySlug).src,
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
    dateModified: new Date().toISOString().split('T')[0],
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Practice Areas', url: '/services' },
    { name: service.name, url: `/practice-areas/${specialtySlug}` },
    { name: location.name, url: `/practice-areas/${specialtySlug}/${locationSlug}` },
  ])

  return [localBusinessSchema, serviceSchema, breadcrumbSchema]
}

export default async function ServiceLocationPage({ params }: PageProps) {
  const { service: specialtySlug, location: locationSlug } = await params

  // CMS override — if admin published content for this specific service+city page
  let cmsPage = null
  try {
    cmsPage = await getPageContent(`${specialtySlug}-${locationSlug}`, 'location', { specialtySlug, locationSlug })
  } catch (err) {
    logger.error('[CMS] Error fetching page content for', { slug: `${specialtySlug}-${locationSlug}`, error: err })
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
    service = await getSpecialtyBySlug(specialtySlug)
    if (!service) {
      const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
      if (!staticSvc) notFound()
      service = { id: '', name: staticSvc.name, slug: staticSvc.slug, is_active: true, created_at: '' }
    }
  } catch {
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
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
  const [providers, totalAttorneyCount] = await Promise.all([
    getAttorneysByServiceAndLocation(specialtySlug, locationSlug),
    getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug).catch(() => 0),
  ])

  const trade = getTradeContent(specialtySlug)

  // 4. Fetch commune enrichment data (best-effort, never crash)
  let locationData: Awaited<ReturnType<typeof getLocationBySlug>> = null
  try {
    locationData = await getLocationBySlug(locationSlug)
  } catch {
    // Commune table may not exist yet — continue without data
  }

  const baseSchemas = generateJsonLd(service, location, providers || [], specialtySlug, locationSlug, locationData)

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
  const ville = getCityBySlug(locationSlug)
  const locationContent = ville
    ? generateLocationContent(specialtySlug, service.name, ville, providers.length, locationData)
    : null

  // Regional pricing multiplier for localized tariffs
  const pricingMultiplier = ville ? getRegionalMultiplier(getStateByCode(ville.stateCode)?.region || '') : 1.0

  // FAQ: combine 2 trade FAQ (hash-selected) + 4 location-specific FAQ
  const combinedFaq: { question: string; answer: string }[] = []
  if (trade && trade.faq.length > 0) {
    const tradeFaqHash = Math.abs(hashCode(`trade-faq-${specialtySlug}-${locationSlug}`))
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
        name: `${service.name} in ${location.name}`,
        description: `List of verified ${service.name.toLowerCase()}s in ${location.name}`,
        url: `/practice-areas/${specialtySlug}/${locationSlug}`,
        items: providers.slice(0, 20).map((p, i) => ({
          name: p.name,
          url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty, city: p.address_city }),
          position: i + 1,
          image: getServiceImage(specialtySlug).src,
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
  const relatedSlugs = relatedServices[specialtySlug] || []
  const otherServices = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 6).map(slug => {
        const svc = staticPracticeAreas.find(s => s.slug === slug)
        return svc ? { slug: svc.slug, name: svc.name, icon: svc.icon } : null
      }).filter(Boolean) as { slug: string; name: string; icon: string }[]
    : popularServices.filter(s => s.slug !== specialtySlug).slice(0, 6)
  const nearbyCities = getNearbyCities(locationSlug, 12)
  const deptCities = location.department_code
    ? getCitiesByState(location.department_code).filter(v => v.slug !== locationSlug).slice(0, 10)
    : []

  // H1 uses same seed as title for coherence (seo- prefix)
  const attorneyCount = totalAttorneyCount
  const seoHashH1 = Math.abs(hashCode(`seo-${specialtySlug}-${locationSlug}`))
  const naturalTermH1 = getNaturalTerm(specialtySlug)
  const hasProvidersH1 = attorneyCount > 0
  const h1Variants = hasProvidersH1
    ? [
        `${service.name} in ${location.name}`,
        `Find ${naturalTermH1.article} in ${location.name}`,
        `${service.name} in ${location.name} — ${attorneyCount} verified pros`,
        `${service.name} in ${location.name}${location.department_code ? ` (${location.department_code})` : ''}`,
        `Best ${naturalTermH1.plural} in ${location.name}`,
      ]
    : [
        `${service.name} in ${location.name}`,
        `Find ${naturalTermH1.article} in ${location.name}`,
        `${service.name} in ${location.name} — Qualified Attorneys`,
        `${service.name} in ${location.name}${location.department_code ? ` (${location.department_code})` : ''}`,
        `Best ${naturalTermH1.plural} in ${location.name}`,
      ]
  const h1Text = h1Variants[seoHashH1 % h1Variants.length]

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/practice-areas/${specialtySlug}/${locationSlug}`,
    title: h1Text,
  })
  jsonLdSchemas.push(speakableSchema)

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
            { label: service.name, href: `/practice-areas/${specialtySlug}` },
            { label: location.name },
          ]} />
        </div>
      </div>

      <SearchRecorder
        type="service-ville"
        label={`${service.name} in ${location.name}`}
        href={`/practice-areas/${specialtySlug}/${locationSlug}`}
      />

      {/* Demand indicator — urgency/scarcity signal */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <DemandIndicator specialtySlug={specialtySlug} cityName={location.name} variant="banner" />
      </div>

      {/* Trust elements — above the provider listing for credibility */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <TrustGuarantee variant="compact" />
      </div>

      {/* Page Content */}
      <ServiceLocationPageClient
        service={service}
        location={location}
        providers={(providers || []) as unknown as Provider[]}
        h1Text={h1Text}
        totalCount={totalAttorneyCount}
        specialtySlug={specialtySlug}
        locationSlug={locationSlug}
        recentDevisCount={recentDevisCount}
      />

      {trade && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <SpeakableAnswerBox
            answer={`${trade.name} in ${location.name}: ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. ${totalAttorneyCount} bar-verified attorneys available in ${location.department_code}. Average response time: ${trade.averageResponseTime}.${trade.emergencyInfo ? ' Emergency services available 24/7.' : ''}`}
          />
        </div>
      )}

      <SeoContent
        locationContent={locationContent}
        locationData={locationData as LocationData | null}
        service={service}
        location={location}
        locationSlug={locationSlug}
        attorneyCount={providers.length}
        trade={trade || null}
        pricingMultiplier={pricingMultiplier}
      />

      {trade && (
        <TradeSections
          trade={trade}
          service={service}
          location={location}
          specialtySlug={specialtySlug}
          locationSlug={locationSlug}
          pricingMultiplier={pricingMultiplier}
        />
      )}

      <FaqAndBlogSection
        combinedFaq={combinedFaq}
        service={service}
        location={location}
        specialtySlug={specialtySlug}
      />

      <CrossLinks
        service={service}
        location={location}
        specialtySlug={specialtySlug}
        locationSlug={locationSlug}
        otherServices={otherServices}
        nearbyCities={nearbyCities}
        deptCities={deptCities}
        locationContent={locationContent}
        locationData={locationData as LocationData | null}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <CallbackRequest specialtySlug={specialtySlug} cityName={location.name} />
      </div>

      <CrossIntentLinks
        service={specialtySlug}
        specialtyName={service.name}
        ville={locationSlug}
        villeName={location.name}
        currentIntent="services"
      />

      <StickyMobileCTA specialtySlug={specialtySlug} citySlug={locationSlug} attorneyCount={totalAttorneyCount} />

      <EstimationWidget context={{
        metier: service.name,
        metierSlug: specialtySlug,
        ville: location.name,
        departement: location.department_code || '',
        pageUrl: `/practice-areas/${specialtySlug}/${locationSlug}`,
      }} />

      <MicroConversions pageType="service-ville" specialtySlug={specialtySlug} cityName={location.name} />

      <ProactiveChatPrompt specialtySlug={specialtySlug} citySlug={locationSlug} />
    </>
  )
}

