import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getSpecialtyBySlug,
  getLocationBySlug,
  getAttorneysByServiceAndLocation,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import { getBreadcrumbSchema, getItemListSchema, getSpeakableSchema } from '@/lib/seo/jsonld'
import { popularServices, relatedServices } from '@/lib/constants/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { getAttorneyUrl } from '@/lib/utils'
import { getServiceImage } from '@/lib/data/images'
import { practiceAreas as staticPracticeAreas, cities, getCityBySlug, getNearbyCities, getCitiesByState, getStateByCode } from '@/lib/data/usa'
import { resolveZipToCity, isZipSlug, getNearbyZipCodes } from '@/lib/location-resolver'
import { getTradeContent } from '@/lib/data/trade-content'
import { SITE_URL } from '@/lib/seo/config'
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { generateLocationContent, hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { getPageContent } from '@/lib/cms'
import { logger } from '@/lib/logger'
import { CmsContent } from '@/components/CmsContent'
import { SpeakableAnswerBox } from '@/components/SpeakableAnswerBox'
import StickyMobileCTA from '@/components/StickyMobileCTA'
import SearchRecorder from '@/components/SearchRecorder'
import DemandIndicator from '@/components/DemandIndicator'
import TrustGuarantee from '@/components/TrustGuarantee'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import StatuteOfLimitations from '@/components/seo/StatuteOfLimitations'
import dynamic from 'next/dynamic'
import type { Service, Location as LocationType, Provider } from '@/types'
import type { LocationData } from '@/lib/data/location-data'

import ServiceLocationPageClient from '@/app/(public)/practice-areas/[service]/[location]/PageClient'
import SeoContent from '@/app/(public)/practice-areas/[service]/[location]/_components/SeoContent'
import TradeSections from '@/app/(public)/practice-areas/[service]/[location]/_components/TradeSections'
import FaqAndBlogSection from '@/app/(public)/practice-areas/[service]/[location]/_components/FaqAndBlogSection'
import CrossLinks from '@/app/(public)/practice-areas/[service]/[location]/_components/CrossLinks'
import { getFAQSchema } from '@/lib/seo/jsonld'
import { REVALIDATE } from '@/lib/cache'

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

// ISR: revalidate every 24h
export const revalidate = REVALIDATE.attorneyProfile
// Allow on-demand ISR for cities not pre-rendered at build time
export const dynamicParams = true

// Pre-render 1 seed city per PA (secondary intent, ISR handles rest)
const TOP_CITIES_COUNT = 1
export function generateStaticParams() {
  const topCities = cities.slice(0, TOP_CITIES_COUNT)
  return staticPracticeAreas.flatMap(s =>
    topCities.map(v => ({ specialty: s.slug, location: v.slug }))
  )
}

/** Resolve a city from static data to Location shape (fallback when DB is down) */
function cityToLocation(slug: string): LocationType | null {
  const cityData = getCityBySlug(slug)
  if (!cityData) return null
  return {
    id: '',
    name: cityData.name,
    slug: cityData.slug,
    postal_code: cityData.zipCode,
    region_name: getStateByCode(cityData.stateCode)?.region || '',
    department_name: cityData.stateName,
    department_code: cityData.stateCode,
    is_active: true,
    created_at: '',
  }
}

interface PageProps {
  params: Promise<{
    specialty: string
    location: string
  }>
}

/** Truncate title to ~42 chars to leave room for " | US Attorneys" suffix */
function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '...'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty: specialtySlug, location: locationSlug } = await params

  let specialtyName = ''
  let locationName = ''
  let departmentCode = ''
  let departmentName = ''
  let attorneyCount = 1

  try {
    const [service, location, count] = await Promise.all([
      getSpecialtyBySlug(specialtySlug),
      getLocationBySlug(locationSlug) as Promise<import('@/types').Location | null>,
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
    const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
    const fallbackCity = getCityBySlug(locationSlug)
    if (staticSvc) specialtyName = staticSvc.name
    if (fallbackCity) {
      locationName = fallbackCity.name
      departmentCode = fallbackCity.stateCode
      departmentName = fallbackCity.stateName
    }
    attorneyCount = 1
  }

  if (!specialtyName || !locationName) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const hasProviders = attorneyCount > 0
  const svcLower = specialtyName.toLowerCase()
  const stateLabel = departmentCode ? `, ${departmentCode}` : ''

  // Deterministic SEO seed
  const seoHash = Math.abs(hashCode(`attorneys-seo-${specialtySlug}-${locationSlug}`))

  const seoPairs = hasProviders
    ? [
        { title: `${specialtyName} Attorneys in ${locationName}${stateLabel}`, h1: `${specialtyName} Attorneys in ${locationName}${stateLabel}` },
        { title: `${attorneyCount} ${specialtyName} Attorneys — ${locationName}`, h1: `Find a ${specialtyName} Attorney in ${locationName}${stateLabel}` },
        { title: `${specialtyName} Lawyers in ${locationName} — Directory`, h1: `Top ${specialtyName} Lawyers in ${locationName}${stateLabel}` },
        { title: `Find ${specialtyName} Attorneys — ${locationName}`, h1: `${attorneyCount} Verified ${specialtyName} Attorneys in ${locationName}` },
        { title: `${specialtyName} Attorney ${locationName}${stateLabel}`, h1: `Best ${specialtyName} Attorneys in ${locationName}${stateLabel}` },
      ]
    : [
        { title: `${specialtyName} Attorneys in ${locationName}${stateLabel}`, h1: `${specialtyName} Attorneys in ${locationName}${stateLabel}` },
        { title: `${specialtyName} Attorneys — ${locationName} Directory`, h1: `Find a ${specialtyName} Attorney in ${locationName}${stateLabel}` },
        { title: `${specialtyName} Lawyers in ${locationName}`, h1: `${specialtyName} Lawyers in ${locationName}${stateLabel}` },
        { title: `Find ${specialtyName} Attorneys in ${locationName}`, h1: `${specialtyName} Attorney Directory — ${locationName}` },
        { title: `${specialtyName} Attorney ${locationName}${stateLabel}`, h1: `Qualified ${specialtyName} Attorneys in ${locationName}${stateLabel}` },
      ]

  const title = truncateTitle(seoPairs[seoHash % seoPairs.length].title)

  const descHash = Math.abs(hashCode(`attorneys-desc-${specialtySlug}-${locationSlug}`))
  const deptLabel = departmentName || departmentCode
  const descTemplates = hasProviders
    ? [
        `Find ${attorneyCount} verified ${svcLower} attorneys in ${locationName}${deptLabel ? ` (${deptLabel})` : ''}. Compare ratings, read reviews, and request a free consultation.`,
        `${attorneyCount} bar-verified ${svcLower} attorneys in ${locationName}. Compare profiles, fees, and client reviews. Free consultation available.`,
        `Looking for a ${svcLower} attorney in ${locationName}? Browse ${attorneyCount} verified lawyers. Compare ratings and book a free consultation.`,
        `${locationName}${departmentCode ? ` (${departmentCode})` : ''}: ${attorneyCount} verified ${svcLower} attorneys. Reviews, fees, and free consultations.`,
        `Need a ${svcLower} attorney in ${locationName}? ${attorneyCount} verified lawyers ready to help. Free consultation, no obligation.`,
      ]
    : [
        `Find qualified ${svcLower} attorneys in ${locationName}${deptLabel ? ` (${deptLabel})` : ''}. Bar-verified lawyers. Free consultation available.`,
        `${specialtyName} attorneys in ${locationName}. Licensed, bar-verified professionals. Compare profiles and request a free consultation.`,
        `Looking for a ${svcLower} attorney in ${locationName}? Directory of verified lawyers. Free consultation, no obligation.`,
        `${locationName}${deptLabel ? ` (${deptLabel})` : ''}: find a trusted ${svcLower} attorney. Bar-verified lawyers. Free consultation.`,
        `${specialtyName} attorney directory for ${locationName}. Verified professionals. Free and immediate consultation.`,
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
      locale: 'en_US',
      images: [{ url: getServiceImage(specialtySlug).src, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getServiceImage(specialtySlug).src],
    },
    alternates: {
      canonical: `${SITE_URL}/attorneys/${specialtySlug}/${locationSlug}`,
      languages: getAlternateLanguages(`/attorneys/${specialtySlug}/${locationSlug}`),
    },
  }
}

// JSON-LD structured data — CollectionPage + LegalService
function generateJsonLd(
  service: Service,
  location: LocationType,
  _providers: unknown[],
  specialtySlug: string,
  locationSlug: string,
) {
  const svcLower = service.name.toLowerCase()

  const collectionPageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${service.name} Attorneys in ${location.name}`,
    description: `Find verified ${svcLower} attorneys in ${location.name}. Compare ratings, read reviews, and request a free consultation.`,
    url: `${SITE_URL}/attorneys/${specialtySlug}/${locationSlug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'US Attorneys',
      url: SITE_URL,
    },
    dateModified: new Date().toISOString().split('T')[0],
  }

  const legalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `${service.name} Attorneys in ${location.name}`,
    description: `Find the best ${svcLower} attorneys in ${location.name}`,
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
    serviceType: service.name,
    dateModified: new Date().toISOString().split('T')[0],
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Attorneys', url: '/attorneys' },
    { name: service.name, url: `/attorneys/${specialtySlug}` },
    { name: location.name, url: `/attorneys/${specialtySlug}/${locationSlug}` },
  ])

  return [collectionPageSchema, legalServiceSchema, breadcrumbSchema]
}

export default async function AttorneyDirectoryPage({ params }: PageProps) {
  const { specialty: specialtySlug, location: locationSlug } = await params

  // CMS override
  let cmsPage = null
  try {
    cmsPage = await getPageContent(`attorneys-${specialtySlug}-${locationSlug}`, 'location', { specialtySlug, locationSlug })
  } catch (err: unknown) {
    logger.error('[CMS] Error fetching page content for', { slug: `attorneys-${specialtySlug}-${locationSlug}`, error: err })
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

  // 1. Resolve service (DB then static fallback)
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

  // 2. Resolve location (DB then static fallback)
  let location: LocationType
  try {
    const dbLocation = await getLocationBySlug(locationSlug)
    if (!dbLocation) {
      const fallback = cityToLocation(locationSlug)
      if (!fallback) notFound()
      location = fallback
    } else {
      location = { ...dbLocation, id: (dbLocation as Record<string, unknown>).code_insee as string || '' }
    }
  } catch {
    const fallback = cityToLocation(locationSlug)
    if (!fallback) notFound()
    location = fallback
  }

  // 3. Fetch providers + total count in parallel
  const [providers, totalAttorneyCount] = await Promise.all([
    getAttorneysByServiceAndLocation(specialtySlug, locationSlug),
    getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug).catch(() => 0),
  ])

  const trade = getTradeContent(specialtySlug)

  // 4. Fetch location enrichment data (best-effort)
  let locationData: Awaited<ReturnType<typeof getLocationBySlug>> = null
  try {
    locationData = await getLocationBySlug(locationSlug)
  } catch {
    // Continue without data
  }

  const baseSchemas = generateJsonLd(service, location, providers || [], specialtySlug, locationSlug)

  // Count recent consultation requests for freshness signal
  let recentQuoteCount = 0
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
      recentQuoteCount = count ?? 0
    } catch {
      recentQuoteCount = 0
    }
  }

  // Generate unique SEO content per service+location combo
  const cityData = getCityBySlug(locationSlug) || await resolveZipToCity(locationSlug)
  const locationContent = cityData
    ? generateLocationContent(specialtySlug, service.name, cityData, providers.length, locationData)
    : null

  const pricingMultiplier = cityData ? getRegionalMultiplier(getStateByCode(cityData.stateCode)?.region || '') : 1.0

  // FAQ: combine 2 trade FAQ (hash-selected) + location-specific FAQ
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

  // ItemList JSON-LD for provider listings
  const itemListSchema = providers.length > 0
    ? getItemListSchema({
        name: `${service.name} Attorneys in ${location.name}`,
        description: `List of verified ${service.name.toLowerCase()} attorneys in ${location.name}`,
        url: `/attorneys/${specialtySlug}/${locationSlug}`,
        items: providers.slice(0, 20).map((p, i) => ({
          name: p.name,
          url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty?.name, city: p.address_city }),
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

  // Cross-link to semantically related services
  const relatedSlugs = relatedServices[specialtySlug] || []
  const otherServices = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 6).map(slug => {
        const svc = staticPracticeAreas.find(s => s.slug === slug)
        return svc ? { slug: svc.slug, name: svc.name, icon: svc.icon } : null
      }).filter(Boolean) as { slug: string; name: string; icon: string }[]
    : popularServices.filter(s => s.slug !== specialtySlug).slice(0, 6)
  const nearbyCities = isZipSlug(locationSlug)
    ? await getNearbyZipCodes(locationSlug, 12)
    : getNearbyCities(locationSlug, 12)
  const deptCities = location.department_code
    ? getCitiesByState(location.department_code).filter(v => v.slug !== locationSlug).slice(0, 10)
    : []

  // H1 uses same seed as title for coherence
  const attorneyCount = totalAttorneyCount
  const seoHashH1 = Math.abs(hashCode(`attorneys-seo-${specialtySlug}-${locationSlug}`))
  const stateLabel = location.department_code ? `, ${location.department_code}` : ''
  const h1Variants = attorneyCount > 0
    ? [
        `${service.name} Attorneys in ${location.name}${stateLabel}`,
        `Find a ${service.name} Attorney in ${location.name}${stateLabel}`,
        `Top ${service.name} Lawyers in ${location.name}${stateLabel}`,
        `${attorneyCount} Verified ${service.name} Attorneys in ${location.name}`,
        `Best ${service.name} Attorneys in ${location.name}${stateLabel}`,
      ]
    : [
        `${service.name} Attorneys in ${location.name}${stateLabel}`,
        `Find a ${service.name} Attorney in ${location.name}${stateLabel}`,
        `${service.name} Lawyers in ${location.name}${stateLabel}`,
        `${service.name} Attorney Directory — ${location.name}`,
        `Qualified ${service.name} Attorneys in ${location.name}${stateLabel}`,
      ]
  const h1Text = h1Variants[seoHashH1 % h1Variants.length]

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/attorneys/${specialtySlug}/${locationSlug}`,
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

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[
            { label: 'Attorneys', href: '/attorneys' },
            { label: service.name, href: `/attorneys/${specialtySlug}` },
            { label: location.name },
          ]} />
        </div>
      </div>

      <SearchRecorder
        type="service-city"
        label={`${service.name} Attorney in ${location.name}`}
        href={`/attorneys/${specialtySlug}/${locationSlug}`}
      />

      {/* Demand indicator */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <DemandIndicator specialtySlug={specialtySlug} cityName={location.name} variant="banner" />
      </div>

      {/* Trust elements */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <TrustGuarantee variant="compact" />
      </div>

      {/* Page Content — reuses the practice-areas client component */}
      <ServiceLocationPageClient
        service={service}
        location={location}
        providers={(providers || []) as unknown as Provider[]}
        h1Text={h1Text}
        totalCount={totalAttorneyCount}
        specialtySlug={specialtySlug}
        locationSlug={locationSlug}
        recentQuoteCount={recentQuoteCount}
      />

      {trade && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <SpeakableAnswerBox
            answer={`${trade.name} attorneys in ${location.name}: ${totalAttorneyCount} bar-verified professionals available in ${location.department_code || location.name}. Average response time: ${trade.averageResponseTime}.${trade.emergencyInfo ? ' Emergency services available 24/7.' : ''}`}
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

      <StatuteOfLimitations
        specialtySlug={specialtySlug}
        specialtyName={service.name}
        stateCode={location.department_code || ''}
        stateName={location.department_name || ''}
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
        city={locationSlug}
        cityName={location.name}
        currentIntent="services"
      />

      <StickyMobileCTA specialtySlug={specialtySlug} citySlug={locationSlug} attorneyCount={totalAttorneyCount} />

      <EstimationWidget context={{
        metier: service.name,
        metierSlug: specialtySlug,
        ville: location.name,
        departement: location.department_code || '',
        pageUrl: `/attorneys/${specialtySlug}/${locationSlug}`,
      }} />

      <MicroConversions pageType="service-city" specialtySlug={specialtySlug} cityName={location.name} />

      <ProactiveChatPrompt specialtySlug={specialtySlug} citySlug={locationSlug} />
    </>
  )
}
