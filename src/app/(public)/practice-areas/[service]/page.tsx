import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  ArrowRight,
  Star,
  Shield,
  ChevronDown,
  BadgeCheck,
  Clock,
  Wrench,
  FileText,
} from 'lucide-react'
import {
  getSpecialtyBySlug,
  getLocationsByService,
  getAttorneysByService,
  getAttorneyCountByService,
} from '@/lib/supabase'
import JsonLd from '@/components/JsonLd'
import {
  getServiceSchema,
  getFAQSchema,
  getSpeakableSchema,
  getServicePricingSchema,
  getPracticeAreaFAQItems,
} from '@/lib/seo/jsonld'
import { hashCode } from '@/lib/seo/location-content'
import { SITE_URL } from '@/lib/seo/config'
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { logger } from '@/lib/logger'
import PriceTable from '@/components/seo/PriceTable'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import { PopularCitiesLinks } from '@/components/InternalLinks'
import { popularServices, relatedServices } from '@/lib/constants/navigation'
import { practiceAreas as staticPracticeAreas, states, getCitiesByState } from '@/lib/data/usa'
import { getTradeContent } from '@/lib/data/trade-content'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'
import { getServiceImage, BLUR_PLACEHOLDER } from '@/lib/data/images'
import { getPageContent, getTradeContentOverride } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { SpeakableAnswerBox } from '@/components/SpeakableAnswerBox'
import { SocialProofBanner } from '@/components/SocialProofBanner'
import LastUpdated from '@/components/seo/LastUpdated'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import StickyMobileCTA from '@/components/StickyMobileCTA'
import DemandIndicator from '@/components/DemandIndicator'
import TrustGuarantee from '@/components/TrustGuarantee'
import dynamic from 'next/dynamic'
import { REVALIDATE } from '@/lib/cache'

const EstimationWidget = dynamic(() => import('@/components/estimation/EstimationWidget'), {
  ssr: false,
})

const ExitIntentPopup = dynamic(() => import('@/components/ExitIntentPopup'), { ssr: false })

const MicroConversions = dynamic(() => import('@/components/MicroConversions'), { ssr: false })

const FAQTracker = dynamic(() => import('@/components/FAQTracker'), { ssr: false })

const ProactiveChatPrompt = dynamic(() => import('@/components/ProactiveChatPrompt'), {
  ssr: false,
})

/** Shape returned by getLocationsByService / getStaticCities */
interface CityInfo {
  id: string
  name: string
  slug: string
  state_code?: string
  region_name?: string
}

/** Shape returned by getAttorneysByService (provider with joined location) */
interface ServiceProvider {
  id: string
  name: string
  slug: string
  stable_id?: string
  address_city?: string
  address_zip?: string
  provider_locations?: Array<{
    location?: { name: string; slug: string } | null
  }>
}

// ISR: Revalidate every 24h
export const revalidate = REVALIDATE.serviceDetail
export const dynamicParams = false

// Pre-render all 15 service pages at build time
export function generateStaticParams() {
  return staticPracticeAreas.map((s) => ({ service: s.slug }))
}

interface PageProps {
  params: Promise<{ service: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '\u2026'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: specialtySlug } = await params

  let specialtyName = ''

  try {
    const service = await getSpecialtyBySlug(specialtySlug)
    if (service) specialtyName = service.name
  } catch {
    // DB down — fallback to static data
  }

  if (!specialtyName) {
    const staticSvc = staticPracticeAreas.find((s) => s.slug === specialtySlug)
    if (!staticSvc) notFound()
    specialtyName = staticSvc.name
  }

  const svcLower = specialtyName.toLowerCase()

  const titleHash = Math.abs(hashCode(`hub-title-${specialtySlug}`))
  const titleTemplates = [
    `${specialtyName} Nationwide \u2014 Free Consultation 2026`,
    `${specialtyName} : fees and free consultation 2026`,
    `${specialtyName} Nationwide \u2014 Verified Attorneys`,
    `${specialtyName} \u2014 Compare Attorneys 2026`,
    `${specialtyName} Nationwide \u2014 Qualified Attorneys`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`hub-desc-${specialtySlug}`))
  const descTemplates = [
    `Find a qualified ${svcLower} among our bar-verified attorneys. Fees, reviews and free consultation in ${states.length} states.`,
    `Compare ${svcLower}s nationwide: fees, reviews and certifications. Free consultation, no obligation.`,
    `Directory of bar-verified ${svcLower}s nationwide. Pricing, expert advice and free consultation.`,
    `Need a ${svcLower}? National directory: indicative fees, verified attorneys, free consultation online.`,
    `${specialtyName} Nationwide 2026: pricing, advice, certifications. Compare attorneys and request a free consultation.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(specialtySlug)

  return {
    title,
    description,
    openGraph: {
      locale: 'en_US',
      title,
      description,
      url: `${SITE_URL}/practice-areas/${specialtySlug}`,
      type: 'website',
      siteName: 'US Attorneys',
      images: [{ url: serviceImage.src, width: 1200, height: 630, alt: serviceImage.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [serviceImage.src],
    },
    alternates: {
      canonical: `${SITE_URL}/practice-areas/${specialtySlug}`,
      languages: getAlternateLanguages(`/practice-areas/${specialtySlug}`),
    },
  }
}

/** Top 20 largest US cities -- always shown first on service hub pages */
const MAJOR_CITIES = [
  { name: 'New York', slug: 'new-york', state_code: 'NY', region_name: 'Northeast' },
  { name: 'Los Angeles', slug: 'los-angeles', state_code: 'CA', region_name: 'West' },
  { name: 'Chicago', slug: 'chicago', state_code: 'IL', region_name: 'Midwest' },
  { name: 'Houston', slug: 'houston', state_code: 'TX', region_name: 'South' },
  { name: 'Phoenix', slug: 'phoenix', state_code: 'AZ', region_name: 'West' },
  { name: 'Philadelphia', slug: 'philadelphia', state_code: 'PA', region_name: 'Northeast' },
  { name: 'San Antonio', slug: 'san-antonio', state_code: 'TX', region_name: 'South' },
  { name: 'San Diego', slug: 'san-diego', state_code: 'CA', region_name: 'West' },
  { name: 'Dallas', slug: 'dallas', state_code: 'TX', region_name: 'South' },
  { name: 'Austin', slug: 'austin', state_code: 'TX', region_name: 'South' },
  { name: 'Jacksonville', slug: 'jacksonville', state_code: 'FL', region_name: 'South' },
  { name: 'San Jose', slug: 'san-jose', state_code: 'CA', region_name: 'West' },
  { name: 'Fort Worth', slug: 'fort-worth', state_code: 'TX', region_name: 'South' },
  { name: 'Columbus', slug: 'columbus', state_code: 'OH', region_name: 'Midwest' },
  { name: 'Charlotte', slug: 'charlotte', state_code: 'NC', region_name: 'South' },
  { name: 'Indianapolis', slug: 'indianapolis', state_code: 'IN', region_name: 'Midwest' },
  { name: 'San Francisco', slug: 'san-francisco', state_code: 'CA', region_name: 'West' },
  { name: 'Seattle', slug: 'seattle', state_code: 'WA', region_name: 'West' },
  { name: 'Denver', slug: 'denver', state_code: 'CO', region_name: 'West' },
  { name: 'Washington DC', slug: 'washington-dc', state_code: 'DC', region_name: 'Northeast' },
].map((c) => ({ ...c, id: c.slug }))

/** Merge major cities (always first) with DB cities (deduplicated) */
function mergeCitiesWithMajor(dbCities: CityInfo[]): CityInfo[] {
  const majorSlugs = new Set(MAJOR_CITIES.map((c) => c.slug))
  const extraCities = dbCities.filter((c) => !majorSlugs.has(c.slug))
  return [...MAJOR_CITIES, ...extraCities]
}

export default async function ServicePage({ params }: PageProps) {
  const { service: specialtySlug } = await params

  // Full CMS page override
  const cmsPage = await getPageContent(specialtySlug, 'service', { specialtySlug })
  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900">{cmsPage.title}</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4">
            <CmsContent html={cmsPage.content_html} />
          </div>
        </section>
      </div>
    )
  }

  let service: { name: string; slug: string; description?: string; category?: string } | null = null
  let topCities: CityInfo[] = []
  let recentProviders: ServiceProvider[] = []
  let totalAttorneyCount = 0
  try {
    service = await getSpecialtyBySlug(specialtySlug)
  } catch (error: unknown) {
    logger.error('Service page DB error (service):', error)
  }

  // Fetch cities, providers and total count independently — failure in one should not block the other
  const [citiesResult, providersResult, countResult] = await Promise.allSettled([
    getLocationsByService(specialtySlug),
    getAttorneysByService(specialtySlug, 12),
    getAttorneyCountByService(specialtySlug),
  ])
  if (citiesResult.status === 'fulfilled') {
    topCities = citiesResult.value || []
  } else {
    logger.error('Service page DB error (locations):', citiesResult.reason)
  }
  if (providersResult.status === 'fulfilled') {
    recentProviders = (providersResult.value || []) as ServiceProvider[]
  } else {
    logger.error('Service page DB error (providers):', providersResult.reason)
  }
  if (countResult.status === 'fulfilled') {
    totalAttorneyCount = countResult.value
  }

  // Fallback to static data if DB failed
  if (!service) {
    const staticSvc = staticPracticeAreas.find((s) => s.slug === specialtySlug)
    if (!staticSvc) notFound()
    service = { name: staticSvc.name, slug: staticSvc.slug }
  }

  // Always show major cities first, then DB cities
  topCities = mergeCitiesWithMajor(topCities || [])

  // Group cities by region
  const citiesByRegion =
    topCities?.reduce(
      (acc: Record<string, CityInfo[]>, city: CityInfo) => {
        const region = city.region_name || 'Other'
        if (!acc[region]) acc[region] = []
        acc[region].push(city)
        return acc
      },
      {} as Record<string, CityInfo[]>
    ) || {}

  // Trade-specific rich content (prices, FAQ, tips, certifications)
  const tradeBase = getTradeContent(specialtySlug)
  const cmsTradeOverride = await getTradeContentOverride(specialtySlug)
  const trade =
    tradeBase && cmsTradeOverride
      ? ({ ...tradeBase, ...cmsTradeOverride } as typeof tradeBase)
      : tradeBase

  // H1 variation for SEO
  const h1Hash = Math.abs(hashCode(`hub-h1-${specialtySlug}`))
  const h1Templates = [
    `${service.name} Nationwide`,
    `Find a ${service.name.toLowerCase()} Nationwide`,
    `${service.name} \u2014 National Directory`,
    `${service.name.toLowerCase()} Attorneys Nationwide`,
    `${service.name}: Compare Professionals`,
  ]
  const h1Text = h1Templates[h1Hash % h1Templates.length]

  // JSON-LD structured data
  const serviceSchema = getServiceSchema({
    name: service.name,
    description: service.description || `${service.name.toLowerCase()} legal services nationwide`,
    category: service.category || service.name,
    image: getServiceImage(specialtySlug).src,
  })

  // Merge editorial FAQs (from trade-content) with programmatic SEO FAQs
  const programmaticFaqs = getPracticeAreaFAQItems(service.name, {
    priceRange: trade?.priceRange,
    attorneyCount: totalAttorneyCount || undefined,
    cityCount: topCities?.length || undefined,
  })
  const allFaqs = [
    ...(trade ? trade.faq.map((f) => ({ question: f.q, answer: f.a })) : []),
    ...programmaticFaqs,
  ]
  const faqSchema = getFAQSchema(allFaqs)

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/practice-areas/${specialtySlug}`,
    title: h1Text,
  })

  const pricingSchema = trade
    ? getServicePricingSchema({
        specialtyName: service.name,
        specialtySlug: specialtySlug,
        description:
          service.description || `${service.name.toLowerCase()} legal services nationwide`,
        lowPrice: trade.priceRange.min,
        highPrice: trade.priceRange.max,
        priceCurrency: 'USD',
        priceUnit: trade.priceRange.unit,
        offerCount: totalAttorneyCount || trade.commonTasks.length,
        url: `${SITE_URL}/practice-areas/${specialtySlug}`,
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD */}
      <JsonLd
        data={[
          serviceSchema,
          speakableSchema,
          ...(faqSchema ? [faqSchema] : []),
          ...(pricingSchema ? [pricingSchema] : []),
        ]}
      />

      {/* Breadcrumbs (visual + JSON-LD) */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Practice Areas', href: '/practice-areas', semanticType: 'CollectionPage' },
              { label: service.name, semanticType: 'LegalService' },
            ]}
          />
        </div>
      </div>

      {/* Hero — Premium gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Service photo background */}
        <Image
          src={getServiceImage(specialtySlug).src}
          alt={getServiceImage(specialtySlug).alt}
          fill
          className="object-cover opacity-15"
          sizes="100vw"
          priority
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />
        <div className="absolute inset-0 bg-gray-900/75" />
        {/* Ambient glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(245,158,11,0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 20%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            {h1Text}
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-400 md:text-xl">
            {service.description ||
              `Find the best ${service.name.toLowerCase()}s near you. Compare reviews, fees and get free consultations.`}
          </p>
          <LastUpdated label="Attorney data updated on" className="mt-3 text-slate-500" />

          {/* Stats — Large gradient numbers */}
          <div className="mt-10 flex flex-wrap gap-6 md:gap-10">
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text font-heading text-3xl font-extrabold text-transparent md:text-4xl">
                {totalAttorneyCount > 0 ? totalAttorneyCount.toLocaleString('en-US') : '\u2014'}
              </span>
              <span className="mt-1 text-sm text-slate-400">verified attorneys</span>
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text font-heading text-3xl font-extrabold text-transparent md:text-4xl">
                {topCities?.length || 0}+
              </span>
              <span className="mt-1 text-sm text-slate-400">cities covered</span>
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text font-heading text-3xl font-extrabold text-transparent md:text-4xl">
                100%
              </span>
              <span className="mt-1 text-sm text-slate-400">bar-verified data</span>
            </div>
            {trade && (
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text font-heading text-3xl font-extrabold text-transparent md:text-4xl">
                  {trade.priceRange.min}\u2013{trade.priceRange.max}
                </span>
                <span className="mt-1 text-sm text-slate-400">{trade.priceRange.unit}</span>
              </div>
            )}
          </div>

          {/* Badges row */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 backdrop-blur-sm">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Verified Attorneys</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 backdrop-blur-sm">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Quality Controlled</span>
            </div>
            {trade && (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">
                  {trade.averageResponseTime.split(',')[0]}
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href={`/quotes/${specialtySlug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700 hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.5)] active:scale-[0.98]"
            >
              Compare attorneys near me
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <CrossIntentLinks
        service={specialtySlug}
        specialtyName={service.name}
        currentIntent="services"
      />

      {/* Speakable Answer Box */}
      {trade && (
        <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <SpeakableAnswerBox
            answer={`${trade.name} nationwide: ${trade.priceRange.min}\u2013${trade.priceRange.max} ${trade.priceRange.unit}. ${totalAttorneyCount.toLocaleString('en-US')} verified attorneys in ${topCities?.length || 0}+ cities. Free consultation, official data.`}
          />
        </div>
      )}

      {/* Trust Guarantee */}
      <section className="my-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TrustGuarantee variant="banner" />
        </div>
      </section>

      {/* CTA Principal + Social Proof */}
      <section className="my-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <DemandIndicator specialtySlug={specialtySlug} />
          </div>
          <SocialProofBanner metier={service.name} variant="card" />

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-clay-500 to-clay-600 p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">
              Need a {service.name.toLowerCase()}?
            </h2>
            <p className="mb-6 text-clay-100">Get up to 3 free consultations in 2 minutes</p>
            <Link
              href={`/quotes/${specialtySlug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-clay-600 shadow-lg transition-colors hover:bg-clay-50"
            >
              <FileText className="h-5 w-5" />
              Compare attorneys near me
            </Link>
          </div>
        </div>
      </section>

      {/* Search by city */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-heading text-2xl font-bold tracking-tight text-gray-900">
            Find a {service.name.toLowerCase()} by city
          </h2>

          {/* Popular cities grid */}
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {topCities?.slice(0, 12).map((city) => (
              <Link
                key={city.id}
                href={`/practice-areas/${specialtySlug}/${city.slug}`}
                className="group rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                  <span className="truncate font-medium text-gray-900 group-hover:text-blue-600">
                    {city.name}
                  </span>
                </div>
                {city.state_code && (
                  <span className="mt-1 block text-xs text-gray-500">({city.state_code})</span>
                )}
              </Link>
            ))}
          </div>

          {/* Cities by region */}
          {Object.keys(citiesByRegion).length > 0 && (
            <div className="space-y-8">
              {Object.entries(citiesByRegion).map(([region, cities]) => (
                <div key={region}>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    {service.name} in {region}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cities.slice(0, 10).map((city) => (
                      <Link
                        key={city.id}
                        href={`/practice-areas/${specialtySlug}/${city.slug}`}
                        className="rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        {city.name}
                      </Link>
                    ))}
                    {cities.length > 10 && (
                      <span className="px-3 py-1.5 text-sm text-gray-500">
                        +{cities.length - 10} cities
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* By state — SEO internal links to service+city pages */}
      <section className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-heading text-2xl font-bold tracking-tight text-gray-900">
            {service.name} by State
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {states.map((dept) => {
              const stateCities = getCitiesByState(dept.code)
              if (stateCities.length === 0) return null
              return (
                <div key={dept.code} className="rounded-xl bg-gray-50 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    <Link
                      href={`/states/${dept.slug}`}
                      className="transition-colors hover:text-blue-600"
                    >
                      {dept.name} ({dept.code})
                    </Link>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {stateCities.slice(0, 5).map((city) => (
                      <Link
                        key={city.slug}
                        href={`/practice-areas/${specialtySlug}/${city.slug}`}
                        className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                      >
                        {city.name}
                      </Link>
                    ))}
                    {stateCities.length > 5 && (
                      <Link
                        href={`/states/${dept.slug}`}
                        className="px-2.5 py-1 text-xs text-blue-600"
                      >
                        +{stateCities.length - 5} cities
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/states" className="text-blue-600 hover:underline">
              All states &rarr;
            </Link>
            <Link href="/regions" className="text-blue-600 hover:underline">
              All regions &rarr;
            </Link>
            <Link href="/cities" className="text-blue-600 hover:underline">
              All cities &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Recent providers */}
      {recentProviders && recentProviders.length > 0 && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 font-heading text-2xl font-bold tracking-tight text-gray-900">
              Recently Added {service.name}s
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentProviders.slice(0, 6).map((provider) => {
                const location = provider.provider_locations?.[0]?.location
                return (
                  <Link
                    key={provider.id}
                    href={`/practice-areas/${specialtySlug}/${location?.slug || 'nationwide'}/${provider.stable_id || provider.slug}`}
                    className="group rounded-lg bg-gray-50 p-4 transition-colors hover:bg-blue-50"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {provider.name}
                    </h3>
                    {provider.address_city && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {provider.address_zip} {provider.address_city}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Price Guide — unique per trade */}
      {trade && (
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <PriceTable
                tasks={trade.commonTasks}
                tradeName={service.name}
                priceRange={trade.priceRange}
              />
            </div>
          </div>
        </section>
      )}

      {/* Tips + Certifications */}
      {trade && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Practical tips */}
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tips for Choosing Your {service.name.toLowerCase()}
                  </h2>
                </div>
                <div className="space-y-4">
                  {trade.tips.map((tip, i) => (
                    <div key={i} className="flex gap-3 rounded-lg bg-blue-50 p-4">
                      <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <p className="text-sm leading-relaxed text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications + Emergency */}
              <div className="space-y-6">
                <div className="rounded-xl bg-gray-50 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Certifications to Verify</h3>
                  </div>
                  <ul className="space-y-2">
                    {trade.certifications.map((cert, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1 text-green-500">{'\u2713'}</span>
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>

                {trade.emergencyInfo && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">
                        Emergency {service.name.toLowerCase()}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-red-800">{trade.emergencyInfo}</p>
                  </div>
                )}

                <div className="rounded-xl bg-blue-50 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Response Time</h3>
                  </div>
                  <p className="text-sm text-gray-700">{trade.averageResponseTime}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ — rich content for SEO (editorial + programmatic) */}
      {allFaqs.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">
                Frequently Asked Questions {'\u2014'} {service.name}
              </h2>
            </div>
            <div className="space-y-4">
              {allFaqs.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                    <h3 className="pr-4 font-semibold text-gray-900">{item.question}</h3>
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-6 pt-0">
                    <p className="leading-relaxed text-gray-600">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* See also - Other services */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-heading text-2xl font-bold tracking-tight text-gray-900">
            See Also
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-semibold text-gray-900">Related Services</h3>
              <div className="flex flex-wrap gap-2">
                {(
                  relatedServices[specialtySlug] ||
                  popularServices.filter((s) => s.slug !== specialtySlug).map((s) => s.slug)
                )
                  .slice(0, 6)
                  .map((slug) => {
                    const svc = staticPracticeAreas.find((s) => s.slug === slug)
                    if (!svc) return null
                    return (
                      <Link
                        key={slug}
                        href={`/practice-areas/${slug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      >
                        {svc.name}
                      </Link>
                    )
                  })}
              </div>
              <h3 className="mb-4 mt-6 font-semibold text-gray-900">Practical Tools & Guides</h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/guides/${specialtySlug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
                >
                  {service.name} Legal Guide
                </Link>
                <Link
                  href="/tools/cost-estimator"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-blue-100 hover:text-blue-700"
                >
                  Fee Calculator
                </Link>
                <Link
                  href="/tools/diagnostic"
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-blue-100 hover:text-blue-700"
                >
                  Attorney Diagnostic
                </Link>
              </div>
            </div>
            <div>
              <PopularCitiesLinks showTitle={true} limit={8} />
            </div>
            {/* Blog articles related to this practice area */}
            {(() => {
              const svcLower = service.name.toLowerCase()
              const relatedArticles = allArticlesMeta
                .filter(
                  (a) =>
                    a.tags.some(
                      (tag) =>
                        tag.toLowerCase().includes(svcLower) || svcLower.includes(tag.toLowerCase())
                    ) ||
                    (a.category === 'Practice Areas' &&
                      (a.title.toLowerCase().includes(svcLower) || a.slug.includes(specialtySlug)))
                )
                .slice(0, 4)
              if (relatedArticles.length === 0) return null
              return (
                <div className="mt-8">
                  <h3 className="mb-4 font-semibold text-gray-900">
                    Articles on this practice area
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {relatedArticles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/blog/${article.slug}`}
                        className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
                      >
                        <span className="flex-shrink-0 text-2xl">{article.image}</span>
                        <div>
                          <div className="text-sm font-medium leading-snug text-gray-900 group-hover:text-blue-600">
                            {article.title}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {article.readTime} · {article.category}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
          {/* Intent variants -- quotes, reviews, pricing by city */}
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 font-semibold text-gray-900">
                {service.name.toLowerCase()} Consultation by City
              </h3>
              <div className="flex flex-wrap gap-2">
                {topCities?.slice(0, 12).map((city) => (
                  <Link
                    key={`quote-${city.slug}`}
                    href={`/quotes/${specialtySlug}/${city.slug}`}
                    className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-gray-900">
                {service.name.toLowerCase()} Reviews by City
              </h3>
              <div className="flex flex-wrap gap-2">
                {topCities?.slice(0, 12).map((city) => (
                  <Link
                    key={`review-${city.slug}`}
                    href={`/reviews/${specialtySlug}/${city.slug}`}
                    className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-gray-900">
                {service.name.toLowerCase()} Fees by City
              </h3>
              <div className="flex flex-wrap gap-2">
                {topCities?.slice(0, 12).map((city) => (
                  <Link
                    key={`pricing-${city.slug}`}
                    href={`/pricing/${specialtySlug}/${city.slug}`}
                    className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Links Footer */}

      <StickyMobileCTA specialtySlug={specialtySlug} />

      <EstimationWidget
        context={{
          metier: service.name,
          metierSlug: specialtySlug,
          ville: 'Nationwide',
          departement: '',
          pageUrl: `/practice-areas/${specialtySlug}`,
        }}
      />

      <ExitIntentPopup
        sessionKey="sa:exit-services"
        description="Compare quotes from multiple qualified attorneys, free and with no obligation."
        ctaHref={`/quotes/${specialtySlug}`}
      />

      <MicroConversions pageType="service" specialtySlug={specialtySlug} />
      <FAQTracker pageType="service" specialtySlug={specialtySlug} />

      <ProactiveChatPrompt specialtySlug={specialtySlug} />
    </div>
  )
}
