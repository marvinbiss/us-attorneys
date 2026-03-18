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
import { getAdjustedFees, FEE_STRUCTURES, GENERAL_COST_FACTORS } from '@/lib/data/attorney-costs'

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

// Pre-render 1 seed city x all practice areas — ISR 24h handles the rest
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
    // Noindex thin-content pages (0 attorneys) — fail-open: attorneyCount defaults to 1 if DB is down
    robots: attorneyCount > 0
      ? { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const }
      : { index: false, follow: true },
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

  const serviceSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} Attorney Services`,
    serviceType: `${service.name} Legal Services`,
    provider: {
      '@type': 'Organization',
      name: 'US Attorneys',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'City',
      name: location.name,
    },
    description: `Professional ${svcLower} legal services in ${location.name}. Compare fees from verified attorneys.`,
    url: `${SITE_URL}/cost/${specialtySlug}/${locationSlug}`,
    priceRange: `$${minPrice}–$${maxPrice}`,
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

  return [productSchema, serviceSchema, collectionPageSchema, breadcrumbSchema]
}

// ── Inline sub-components for cost page sections ────────────────────

function CostFeeStructureBreakdown({
  service,
  location,
  specialtySlug,
  stateCode,
}: {
  service: Service
  location: LocationType
  specialtySlug: string
  stateCode: string
}) {
  const fees = getAdjustedFees(specialtySlug, stateCode)
  const structures = Object.values(FEE_STRUCTURES)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
        Fee Structures for {service.name} Attorneys in {location.name}
      </h2>
      <p className="text-gray-600 mb-6">
        {service.name} attorneys typically offer several payment options. Understanding these structures helps you choose
        the right arrangement for your case and budget.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {structures.map((structure) => {
          const isRelevant =
            structure.type === fees.category.primaryFeeType ||
            (structure.type === 'contingency' && fees.contingency) ||
            (structure.type === 'flat_fee' && fees.flatFee) ||
            (structure.type === 'retainer' && fees.retainer) ||
            structure.type === 'hourly'

          return (
            <div
              key={structure.type}
              className={`rounded-xl border p-5 ${
                structure.type === fees.category.primaryFeeType
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{structure.label}</h3>
                {structure.type === fees.category.primaryFeeType && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Most Common</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{structure.description}</p>
              {isRelevant && (
                <div className="text-sm font-medium text-gray-900">
                  {structure.type === 'hourly' && (
                    <span>${fees.hourly.low}–${fees.hourly.high}/hr in {location.name}</span>
                  )}
                  {structure.type === 'flat_fee' && fees.flatFee && (
                    <span>${fees.flatFee.low.toLocaleString()}–${fees.flatFee.high.toLocaleString()}</span>
                  )}
                  {structure.type === 'contingency' && fees.contingency && (
                    <span>{fees.contingency.low}%–{fees.contingency.high}% of recovery</span>
                  )}
                  {structure.type === 'retainer' && fees.retainer && (
                    <span>${fees.retainer.low.toLocaleString()}–${fees.retainer.high.toLocaleString()} initial deposit</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CostComparisonTable({
  service,
  location,
  specialtySlug,
  stateCode,
}: {
  service: Service
  location: LocationType
  specialtySlug: string
  stateCode: string
}) {
  const fees = getAdjustedFees(specialtySlug, stateCode)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
        {service.name} Attorney Cost Comparison — {location.name}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left p-4 font-semibold">Cost Level</th>
              <th className="text-left p-4 font-semibold">Hourly Rate</th>
              {fees.flatFee && <th className="text-left p-4 font-semibold">Flat Fee</th>}
              {fees.contingency && <th className="text-left p-4 font-semibold">Contingency</th>}
              <th className="text-left p-4 font-semibold">Typical Profile</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50 border-b border-green-100">
              <td className="p-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="font-medium text-green-800">Budget</span>
                </span>
              </td>
              <td className="p-4 font-semibold text-gray-900">${fees.hourly.low}/hr</td>
              {fees.flatFee && <td className="p-4 text-gray-900">${fees.flatFee.low.toLocaleString()}</td>}
              {fees.contingency && <td className="p-4 text-gray-900">{fees.contingency.low}%</td>}
              <td className="p-4 text-sm text-gray-600">Solo practitioner, 1–5 years experience</td>
            </tr>
            <tr className="bg-yellow-50 border-b border-yellow-100">
              <td className="p-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="font-medium text-yellow-800">Mid-Range</span>
                </span>
              </td>
              <td className="p-4 font-semibold text-gray-900">${fees.hourly.mid}/hr</td>
              {fees.flatFee && (
                <td className="p-4 text-gray-900">
                  ${Math.round((fees.flatFee.low + fees.flatFee.high) / 2).toLocaleString()}
                </td>
              )}
              {fees.contingency && (
                <td className="p-4 text-gray-900">
                  {Math.round((fees.contingency.low + fees.contingency.high) / 2)}%
                </td>
              )}
              <td className="p-4 text-sm text-gray-600">Small/mid-size firm, 5–15 years experience</td>
            </tr>
            <tr className="bg-red-50">
              <td className="p-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="font-medium text-red-800">Premium</span>
                </span>
              </td>
              <td className="p-4 font-semibold text-gray-900">${fees.hourly.high}/hr</td>
              {fees.flatFee && <td className="p-4 text-gray-900">${fees.flatFee.high.toLocaleString()}</td>}
              {fees.contingency && <td className="p-4 text-gray-900">{fees.contingency.high}%</td>}
              <td className="p-4 text-sm text-gray-600">Large firm / specialist, 15+ years experience</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        * Rates adjusted for {fees.adjustment.label.toLowerCase()} ({location.department_name || location.name}). Actual fees depend on case specifics.
      </p>
    </div>
  )
}

function CostFactorsSection({
  service,
  location,
  specialtySlug,
}: {
  service: Service
  location: LocationType
  specialtySlug: string
}) {
  const fees = getAdjustedFees(specialtySlug, location.department_code || '')
  const categoryFactors = fees.category.costFactors
  const generalFactors = GENERAL_COST_FACTORS

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
        Factors Affecting {service.name} Attorney Costs in {location.name}
      </h2>

      {/* Category-specific factors */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          {service.name}-Specific Cost Factors
        </h3>
        <ul className="space-y-2">
          {categoryFactors.map((factor, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">&#9679;</span>
              {factor}
            </li>
          ))}
        </ul>
      </div>

      {/* General factors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {generalFactors.map((item) => (
          <div key={item.factor} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">{item.factor}</h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  item.impact === 'high'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {item.impact === 'high' ? 'High Impact' : 'Medium Impact'}
              </span>
            </div>
            <p className="text-xs text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 bg-blue-600 rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Get a Free Quote from {service.name} Attorneys in {location.name}
        </h3>
        <p className="text-blue-100 mb-4 text-sm">
          Compare fees from verified attorneys. No obligation, no cost for the initial consultation.
        </p>
        <a
          href={`/practice-areas/${specialtySlug}/${location.slug || ''}`}
          className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Find {service.name} Attorneys Near You
        </a>
      </div>
    </div>
  )
}

export default async function CostGuidePage({ params }: PageProps) {
  const { specialty: specialtySlug, location: locationSlug } = await params

  // CMS override
  let cmsPage = null
  try {
    cmsPage = await getPageContent(`cost-${specialtySlug}-${locationSlug}`, 'location', { specialtySlug, locationSlug })
  } catch (err: unknown) {
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
  const cityData = getCityBySlug(locationSlug) || await resolveZipToCity(locationSlug)
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

  // Cross-links
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

      {/* Fee Structure Breakdown */}
      <CostFeeStructureBreakdown
        service={service}
        location={location}
        specialtySlug={specialtySlug}
        stateCode={location.department_code || ''}
      />

      {/* Cost Comparison Table: Low / Mid / High */}
      <CostComparisonTable
        service={service}
        location={location}
        specialtySlug={specialtySlug}
        stateCode={location.department_code || ''}
      />

      {/* Factors Affecting Cost */}
      <CostFactorsSection
        service={service}
        location={location}
        specialtySlug={specialtySlug}
      />

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
        providers={(providers || []) as Provider[]}
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
