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
export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

// Pre-render top 30 cities x all practice areas (lower priority)
const TOP_CITIES_COUNT = 30
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

  const svcLower = specialtyName.toLowerCase()
  const stateLabel = departmentCode ? `, ${departmentCode}` : ''
  const hasProviders = attorneyCount > 0
  const currentYear = new Date().getFullYear()

  // Deterministic SEO seed
  const seoHash = Math.abs(hashCode(`cost-seo-${specialtySlug}-${locationSlug}`))

  const seoPairs = hasProviders
    ? [
        { title: `${specialtyName} Attorney Cost in ${locationName}`, h1: `How Much Does a ${specialtyName} Lawyer Cost in ${locationName}?` },
        { title: `${specialtyName} Lawyer Fees — ${locationName} ${currentYear}`, h1: `${specialtyName} Attorney Fees in ${locationName}${stateLabel} (${currentYear})` },
        { title: `${specialtyName} Cost ${locationName} — Fee Guide`, h1: `${specialtyName} Lawyer Cost in ${locationName} — Complete Fee Guide` },
        { title: `How Much for ${specialtyName} in ${locationName}?`, h1: `${specialtyName} Attorney Cost in ${locationName}${stateLabel}` },
        { title: `${specialtyName} Fees ${locationName}${stateLabel}`, h1: `${currentYear} ${specialtyName} Attorney Fee Guide — ${locationName}` },
      ]
    : [
        { title: `${specialtyName} Attorney Cost in ${locationName}`, h1: `How Much Does a ${specialtyName} Lawyer Cost in ${locationName}?` },
        { title: `${specialtyName} Lawyer Fees — ${locationName}`, h1: `${specialtyName} Attorney Fees in ${locationName}${stateLabel}` },
        { title: `${specialtyName} Cost ${locationName} — Guide`, h1: `${specialtyName} Lawyer Cost in ${locationName} — Fee Guide` },
        { title: `How Much for ${specialtyName} in ${locationName}?`, h1: `${specialtyName} Attorney Cost in ${locationName}${stateLabel}` },
        { title: `${specialtyName} Fees ${locationName}${stateLabel}`, h1: `${specialtyName} Attorney Fee Guide — ${locationName}` },
      ]

  const title = truncateTitle(seoPairs[seoHash % seoPairs.length].title)

  const descHash = Math.abs(hashCode(`cost-desc-${specialtySlug}-${locationSlug}`))
  const deptLabel = departmentName || departmentCode
  const descTemplates = hasProviders
    ? [
        `How much does a ${svcLower} attorney cost in ${locationName}${deptLabel ? ` (${deptLabel})` : ''}? ${currentYear} fee guide. Hourly rates, contingency fees, and flat fees from ${attorneyCount} verified lawyers.`,
        `${specialtyName} attorney fees in ${locationName}: compare costs from ${attorneyCount} verified lawyers. Contingency, hourly, and flat fee options. Free consultation.`,
        `${currentYear} ${svcLower} lawyer costs in ${locationName}. Average fees, payment options, and free consultation with ${attorneyCount} verified attorneys.`,
        `${locationName}${departmentCode ? ` (${departmentCode})` : ''}: ${svcLower} attorney costs and fees. Compare ${attorneyCount} verified lawyers. Free consultation available.`,
        `What does a ${svcLower} attorney charge in ${locationName}? ${currentYear} pricing guide. ${attorneyCount} attorneys. Free initial consultation.`,
      ]
    : [
        `How much does a ${svcLower} attorney cost in ${locationName}${deptLabel ? ` (${deptLabel})` : ''}? ${currentYear} fee guide with hourly rates, contingency fees, and flat fees.`,
        `${specialtyName} attorney fees in ${locationName}. Understand costs: contingency, hourly, and flat fee structures. Free consultation available.`,
        `${currentYear} ${svcLower} lawyer costs in ${locationName}. Average fees, payment structures, and what to expect. Free consultation.`,
        `${locationName}${deptLabel ? ` (${deptLabel})` : ''}: ${svcLower} attorney fee guide. Costs, payment options, and free consultation.`,
        `What does a ${svcLower} attorney charge in ${locationName}? Complete ${currentYear} pricing guide. Free initial consultation.`,
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
      canonical: `${SITE_URL}/cost/${specialtySlug}/${locationSlug}`,
      languages: getAlternateLanguages(`/cost/${specialtySlug}/${locationSlug}`),
    },
  }
}

// JSON-LD structured data — Product + AggregateOffer for price rich snippets
function generateJsonLd(
  service: Service,
  location: LocationType,
  _providers: unknown[],
  specialtySlug: string,
  locationSlug: string,
  trade: ReturnType<typeof getTradeContent>,
  pricingMultiplier: number,
) {
  const svcLower = service.name.toLowerCase()
  const currentYear = new Date().getFullYear()

  // Price range from trade content, adjusted by regional multiplier
  const minPrice = trade ? Math.round(trade.priceRange.min * pricingMultiplier) : 150
  const maxPrice = trade ? Math.round(trade.priceRange.max * pricingMultiplier) : 500

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${service.name} Attorney Services in ${location.name}`,
    description: `${service.name} legal services in ${location.name}. Compare fees from verified attorneys.`,
    url: `${SITE_URL}/cost/${specialtySlug}/${locationSlug}`,
    image: getServiceImage(specialtySlug).src,
    brand: {
      '@type': 'Organization',
      name: 'US Attorneys',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: minPrice,
      highPrice: maxPrice,
      priceCurrency: 'USD',
      offerCount: _providers.length || 1,
      availability: 'https://schema.org/InStock',
      priceValidUntil: `${currentYear}-12-31`,
      url: `${SITE_URL}/cost/${specialtySlug}/${locationSlug}`,
    },
    dateModified: new Date().toISOString().split('T')[0],
  }

  const collectionPageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${service.name} Attorney Cost in ${location.name}`,
    description: `How much does a ${svcLower} attorney cost in ${location.name}? Compare fees and pricing from verified lawyers.`,
    url: `${SITE_URL}/cost/${specialtySlug}/${locationSlug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'US Attorneys',
      url: SITE_URL,
    },
    dateModified: new Date().toISOString().split('T')[0],
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Attorney Costs', url: '/cost' },
    { name: service.name, url: `/cost/${specialtySlug}` },
    { name: location.name, url: `/cost/${specialtySlug}/${locationSlug}` },
  ])

  return [productSchema, collectionPageSchema, breadcrumbSchema]
}

export default async function CostGuidePage({ params }: PageProps) {
  const { specialty: specialtySlug, location: locationSlug } = await params

  // CMS override
  let cmsPage = null
  try {
    cmsPage = await getPageContent(`cost-${specialtySlug}-${locationSlug}`, 'location', { specialtySlug, locationSlug })
  } catch (err) {
    logger.error('[CMS] Error fetching page content for', { slug: `cost-${specialtySlug}-${locationSlug}`, error: err })
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

  // 1. Resolve service
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

  // 2. Resolve location
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

  // 3. Fetch providers + total count
  const [providers, totalAttorneyCount] = await Promise.all([
    getAttorneysByServiceAndLocation(specialtySlug, locationSlug),
    getAttorneyCountByServiceAndLocation(specialtySlug, locationSlug).catch(() => 0),
  ])

  const trade = getTradeContent(specialtySlug)

  // 4. Location enrichment
  let locationData: Awaited<ReturnType<typeof getLocationBySlug>> = null
  try {
    locationData = await getLocationBySlug(locationSlug)
  } catch {
    // Continue without data
  }

  // Regional pricing multiplier
  const cityData = getCityBySlug(locationSlug)
  const pricingMultiplier = cityData ? getRegionalMultiplier(getStateByCode(cityData.stateCode)?.region || '') : 1.0

  const baseSchemas = generateJsonLd(service, location, providers || [], specialtySlug, locationSlug, trade, pricingMultiplier)

  // Recent consultation requests
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

  // Generate unique SEO content
  const locationContent = cityData
    ? generateLocationContent(specialtySlug, service.name, cityData, providers.length, locationData)
    : null

  // FAQ — cost-specific + trade + location
  const combinedFaq: { question: string; answer: string }[] = []

  // Add cost-specific FAQ items
  const svcLower = service.name.toLowerCase()
  const currentYear = new Date().getFullYear()
  const minPrice = trade ? Math.round(trade.priceRange.min * pricingMultiplier) : 150
  const maxPrice = trade ? Math.round(trade.priceRange.max * pricingMultiplier) : 500

  combinedFaq.push({
    question: `How much does a ${svcLower} attorney cost in ${location.name}?`,
    answer: `${service.name} attorney fees in ${location.name} typically range from $${minPrice} to $${maxPrice} ${trade?.priceRange.unit || 'per hour'} in ${currentYear}. Costs vary based on case complexity, attorney experience, and fee structure (hourly, contingency, or flat fee). Many attorneys offer free initial consultations.`,
  })
  combinedFaq.push({
    question: `Do ${svcLower} attorneys in ${location.name} offer free consultations?`,
    answer: `Yes, many ${svcLower} attorneys in ${location.name} offer free initial consultations. This allows you to discuss your case, understand your options, and get a fee estimate before committing. Use our directory to find attorneys who offer free consultations.`,
  })
  combinedFaq.push({
    question: `What fee structures do ${svcLower} lawyers in ${location.name} use?`,
    answer: `${service.name} attorneys in ${location.name} typically use one of three fee structures: hourly rates ($${minPrice}–$${maxPrice}/hr), contingency fees (25–40% of settlement, common in injury cases), or flat fees for straightforward matters. The best structure depends on your case type and budget.`,
  })

  if (trade && trade.faq.length > 0) {
    const tradeFaqHash = Math.abs(hashCode(`trade-faq-${specialtySlug}-${locationSlug}`))
    const idx1 = tradeFaqHash % trade.faq.length
    const idx2 = (tradeFaqHash + 3) % trade.faq.length
    combinedFaq.push({ question: trade.faq[idx1].q, answer: trade.faq[idx1].a })
    if (idx2 !== idx1) combinedFaq.push({ question: trade.faq[idx2].q, answer: trade.faq[idx2].a })
  }
  if (locationContent) combinedFaq.push(...locationContent.faqItems)
  const faqSchema = combinedFaq.length > 0 ? getFAQSchema(combinedFaq) : null

  // ItemList JSON-LD
  const itemListSchema = providers.length > 0
    ? getItemListSchema({
        name: `${service.name} Attorney Costs in ${location.name}`,
        description: `Compare ${service.name.toLowerCase()} attorney fees in ${location.name}`,
        url: `/cost/${specialtySlug}/${locationSlug}`,
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

  // Cross-links
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

  // H1
  const attorneyCount = totalAttorneyCount
  const seoHashH1 = Math.abs(hashCode(`cost-seo-${specialtySlug}-${locationSlug}`))
  const stateLabel = location.department_code ? `, ${location.department_code}` : ''
  const h1Variants = attorneyCount > 0
    ? [
        `How Much Does a ${service.name} Lawyer Cost in ${location.name}?`,
        `${service.name} Attorney Fees in ${location.name}${stateLabel} (${currentYear})`,
        `${service.name} Lawyer Cost in ${location.name} — Complete Fee Guide`,
        `${service.name} Attorney Cost in ${location.name}${stateLabel}`,
        `${currentYear} ${service.name} Attorney Fee Guide — ${location.name}`,
      ]
    : [
        `How Much Does a ${service.name} Lawyer Cost in ${location.name}?`,
        `${service.name} Attorney Fees in ${location.name}${stateLabel}`,
        `${service.name} Lawyer Cost in ${location.name} — Fee Guide`,
        `${service.name} Attorney Cost in ${location.name}${stateLabel}`,
        `${service.name} Attorney Fee Guide — ${location.name}`,
      ]
  const h1Text = h1Variants[seoHashH1 % h1Variants.length]

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/cost/${specialtySlug}/${locationSlug}`,
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
            { label: 'Attorney Costs', href: '/cost' },
            { label: service.name, href: `/cost/${specialtySlug}` },
            { label: location.name },
          ]} />
        </div>
      </div>

      <SearchRecorder
        type="service-city"
        label={`${service.name} Cost in ${location.name}`}
        href={`/cost/${specialtySlug}/${locationSlug}`}
      />

      {/* Cost summary banner */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">
            {service.name} Attorney Fee Overview — {location.name}{stateLabel}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 border border-amber-100">
              <p className="text-amber-600 font-medium mb-1">Hourly Rate</p>
              <p className="text-2xl font-bold text-gray-900">${minPrice}–${maxPrice}</p>
              <p className="text-gray-500 text-xs mt-1">{trade?.priceRange.unit || 'per hour'}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-amber-100">
              <p className="text-amber-600 font-medium mb-1">Contingency Fee</p>
              <p className="text-2xl font-bold text-gray-900">25–40%</p>
              <p className="text-gray-500 text-xs mt-1">of settlement amount</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-amber-100">
              <p className="text-amber-600 font-medium mb-1">Free Consultation</p>
              <p className="text-2xl font-bold text-green-700">$0</p>
              <p className="text-gray-500 text-xs mt-1">initial case review</p>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-3">
            * Fees based on {currentYear} {location.department_name || location.name} market data. Actual costs vary by case complexity and attorney experience.
          </p>
        </div>
      </div>

      {/* Demand indicator */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <DemandIndicator specialtySlug={specialtySlug} cityName={location.name} variant="banner" />
      </div>

      {/* Trust elements */}
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
        recentQuoteCount={recentQuoteCount}
      />

      {trade && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <SpeakableAnswerBox
            answer={`${trade.name} attorney cost in ${location.name}: $${minPrice}–$${maxPrice} ${trade.priceRange.unit}. Fee structures include hourly rates, contingency fees (25–40%), and flat fees. ${totalAttorneyCount} verified attorneys available. Many offer free initial consultations.`}
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
        city={locationSlug}
        cityName={location.name}
        currentIntent="pricing"
      />

      <StickyMobileCTA specialtySlug={specialtySlug} citySlug={locationSlug} attorneyCount={totalAttorneyCount} />

      <EstimationWidget context={{
        metier: service.name,
        metierSlug: specialtySlug,
        ville: location.name,
        departement: location.department_code || '',
        pageUrl: `/cost/${specialtySlug}/${locationSlug}`,
      }} />

      <MicroConversions pageType="service-city" specialtySlug={specialtySlug} cityName={location.name} />

      <ProactiveChatPrompt specialtySlug={specialtySlug} citySlug={locationSlug} />
    </>
  )
}
