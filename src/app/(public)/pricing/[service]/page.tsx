import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, DollarSign, Shield, ChevronDown, TrendingUp, Clock, MapPin } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema, getServicePricingSchema, getSpeakableSchema, getHowToSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { tradeContent, getTradesSlugs, slugifyTask } from '@/lib/data/trade-content'
import { cities } from '@/lib/data/usa'
import { getServiceImage } from '@/lib/data/images'
import { getDefaultAuthor } from '@/lib/data/team'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { SpeakableAnswerBox } from '@/components/SpeakableAnswerBox'
import PriceTableHTML from '@/components/seo/PriceTableHTML'
import LastUpdated from '@/components/seo/LastUpdated'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import StickyMobileCTA from '@/components/StickyMobileCTA'
import dynamic from 'next/dynamic'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

const ExitIntentPopup = dynamic(
  () => import('@/components/ExitIntentPopup'),
  { ssr: false }
)

const tradeSlugs = getTradesSlugs()

const REGIONAL_PRICING = [
  { region: 'Northeast', multiplier: 1.25, label: 'New York, Boston, DC' },
  { region: 'West Coast', multiplier: 1.20, label: 'Los Angeles, San Francisco, Seattle' },
  { region: 'Southeast', multiplier: 0.95, label: 'Atlanta, Miami, Charlotte' },
  { region: 'Midwest', multiplier: 0.90, label: 'Chicago, Detroit, Minneapolis' },
  { region: 'Southwest', multiplier: 1.00, label: 'Dallas, Houston, Phoenix' },
  { region: 'Mountain', multiplier: 0.95, label: 'Denver, Salt Lake City' },
  { region: 'Pacific NW', multiplier: 1.05, label: 'Portland, Seattle' },
  { region: 'South Central', multiplier: 0.90, label: 'Nashville, New Orleans' },
]

export function generateStaticParams() {
  return tradeSlugs.map((service) => ({ service }))
}

export const dynamicParams = true
export const revalidate = 86400

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) return {}

  const tradeLower = trade.name.toLowerCase()

  const titleHash = Math.abs(hashCode(`tarif-title-${service}`))
  const titleTemplates = [
    `${tradeLower} fees 2026 — Detailed rates`,
    `${tradeLower} fees 2026: complete guide`,
    `${tradeLower} rates 2026: fee schedule`,
    `${tradeLower} fees: how much does it cost?`,
    `${tradeLower} rates 2026 — Schedule and quotes`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`tarif-desc-${service}`))
  const descTemplates = [
    `${tradeLower} fees 2026: ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}. Detailed rates by service, regional comparison. Free consultation.`,
    `${tradeLower} rates in 2026: ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}. Complete fee schedule and online consultation.`,
    `How much does a ${tradeLower} cost? ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit} in 2026. Rates by region and free consultation.`,
    `${tradeLower} fee guide 2026: ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}. Compare rates and request a consultation.`,
    `${tradeLower} fees: ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}. Rates by service, regional variations. Free consultation.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(service)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/pricing/${service}` },
    openGraph: {
      locale: 'en_US',
      title,
      description,
      url: `${SITE_URL}/pricing/${service}`,
      type: 'website',
      siteName: 'USAttorneys',
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `${trade.name} fees` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [serviceImage.src],
    },
  }
}

const topCities = cities.slice(0, 6)

export default async function TarifsServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params

  const cmsPage = await getPageContent(service + '-tarifs', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  const trade = tradeContent[service]
  if (!trade) notFound()

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Attorney Fees', url: '/pricing' },
    { name: `${trade.name} fees`, url: `/pricing/${service}` },
  ])

  const faqSchema = getFAQSchema(
    trade.faq.map((f) => ({ question: f.q, answer: f.a }))
  )

  const author = getDefaultAuthor()

  const dateModified = new Date().toISOString().split('T')[0]
  const priceValidUntil = `${new Date().getFullYear()}-12-31`

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${trade.name} in the United States`,
    description: `${trade.name} fee guide 2026. Hourly rates, fees by service, and regional variations.`,
    dateModified,
    provider: {
      '@type': 'Organization',
      name: 'USAttorneys',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: trade.priceRange.min,
      highPrice: trade.priceRange.max,
      offerCount: trade.commonTasks.length,
      priceValidUntil,
    },
    ...(author ? {
      author: {
        '@type': 'Person',
        name: author.name,
        url: `${SITE_URL}/about`,
      },
    } : {}),
  }

  const pricingItemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${trade.name} Fees in the United States`,
    description: `List of services and indicative rates for ${trade.name}`,
    numberOfItems: trade.commonTasks.length,
    itemListElement: trade.commonTasks.map((task, i) => {
      const parts = task.split(':')
      const name = parts[0].trim()
      const priceStr = parts.slice(1).join(':').trim()
      const priceMatch = priceStr.match(/(\d+)/)
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Offer',
          name,
          ...(priceMatch ? {
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: priceMatch[1],
              priceCurrency: 'USD',
            }
          } : {}),
          description: task,
          availability: 'https://schema.org/InStock',
          priceValidUntil,
        }
      }
    })
  }

  const pricingSchema = getServicePricingSchema({
    specialtyName: trade.name,
    specialtySlug: service,
    description: `${trade.name} fees in the United States: ${trade.priceRange.min}-${trade.priceRange.max} ${trade.priceRange.unit}. Complete fee schedule and common service rates.`,
    lowPrice: trade.priceRange.min,
    highPrice: trade.priceRange.max,
    priceCurrency: 'USD',
    priceUnit: trade.priceRange.unit,
    offerCount: trade.commonTasks.length,
    url: `${SITE_URL}/pricing/${service}`,
  })

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${trade.name} Fees by City`,
    description: `${trade.name} fee guide 2026 by city. Hourly rate: ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}.`,
    url: `${SITE_URL}/pricing/${service}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: topCities.map((ville, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${trade.name} fees in ${ville.name}`,
        url: `${SITE_URL}/practice-areas/${service}/${ville.slug}`,
      })),
    },
  }

  const speakableSchema = getSpeakableSchema({
    url: `${SITE_URL}/pricing/${service}`,
    title: `${trade.name} fees in the United States`,
  })

  const tradeLowerHowTo = trade.name.toLowerCase()
  const howToSchema = getHowToSchema(
    [
      {
        name: 'Compare average fees',
        text: `Review our fee schedule to learn the average rates for a ${tradeLowerHowTo} in the United States: ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}.`,
      },
      {
        name: 'Verify qualifications',
        text: `Make sure the ${tradeLowerHowTo} has a valid bar number and the required certifications${trade.certifications.length > 0 ? ` (${trade.certifications[0]})` : ''}.`,
      },
      {
        name: 'Request multiple consultations',
        text: `Compare at least 3 detailed quotes from different ${tradeLowerHowTo}s. Verify that each quote includes a breakdown of services, hourly rates, and any additional fees.`,
      },
      {
        name: 'Choose the best value',
        text: `Don't just pick the cheapest option. Look for a ${tradeLowerHowTo} with good client reviews, up-to-date malpractice insurance, and a clear, detailed fee agreement.`,
      },
    ],
    {
      name: `How to find a ${tradeLowerHowTo} at the best rate`,
      description: `Step-by-step guide to comparing fees and choosing a qualified ${tradeLowerHowTo} with the best value in the United States.`,
    }
  )

  const otherTrades = tradeSlugs.filter((s) => s !== service).slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema, pricingSchema, pricingItemListSchema, collectionPageSchema, speakableSchema, howToSchema]} />

      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb
            items={[
              { label: 'Attorney Fees', href: '/pricing' },
              { label: `${trade.name} fees` },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`tarif-h1-${service}`))
                const tradeLower = trade.name.toLowerCase()
                const h1Templates = [
                  `${tradeLower} fees 2026`,
                  `${tradeLower} rates: complete guide 2026`,
                  `How much does a ${tradeLower} cost?`,
                  `${tradeLower} fee guide 2026`,
                  `${tradeLower} rates and pricing`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Complete {trade.name.toLowerCase()} fee guide in the United States.
              Hourly rate: {trade.priceRange.min} to {trade.priceRange.max} {trade.priceRange.unit}.
            </p>
            <LastUpdated label="Fees verified and updated on" className="justify-center text-slate-500 mb-4" />
            <p className="text-sm text-slate-500">
              Fees verified by{' '}
              <Link href="/about" className="underline hover:text-white transition-colors">
                {author?.name}
              </Link>
              , {author?.role.toLowerCase()}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Updated 2026 rates</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>{trade.commonTasks.length} services detailed</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{trade.averageResponseTime}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CrossIntentLinks service={service} specialtyName={trade.name} currentIntent="tarifs" />

      {/* Price range */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Average hourly rate</h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {trade.priceRange.min} — {trade.priceRange.max}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Average rate observed across the United States, service fees included
            </p>
          </div>

          <SpeakableAnswerBox
            answer={`${trade.name} fees in the United States: ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. ${trade.commonTasks.slice(0, 3).map(t => t.split(':')[0].trim()).join('. ')}. Rates verified across 1,300,000+ licensed attorneys.`}
          />

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Common service details
          </h2>
          <PriceTableHTML
            tasks={trade.commonTasks}
            specialtyName={trade.name}
            specialtySlug={service}
            unit={trade.priceRange.unit}
          />
        </div>
      </section>

      {/* Frequently asked — PAA optimized */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-xl font-heading font-semibold text-gray-900">
            How much does a {trade.name.toLowerCase()} cost in the United States?
          </h2>
          <p className="text-gray-700 leading-relaxed">
            The average hourly rate for a {trade.name.toLowerCase()} in the United States ranges from {trade.priceRange.min} to {trade.priceRange.max} {trade.priceRange.unit}.
            This rate varies by region, case complexity, and the attorney&apos;s experience level.
            In major metro areas like New York and Los Angeles, expect rates 20 to 25% above the national average.
          </p>

          <h2 className="text-xl font-heading font-semibold text-gray-900">
            How to choose your {trade.name.toLowerCase()}?
          </h2>
          <p className="text-gray-700 leading-relaxed">
            To choose the right {trade.name.toLowerCase()}, verify their bar number with the state bar association,
            request proof of malpractice insurance, and compare at least 3 detailed fee agreements.
            Look for attorneys with relevant certifications{trade.certifications.length > 0 ? ` (${trade.certifications[0]})` : ''} and check client reviews online.
          </p>

          <h2 className="text-xl font-heading font-semibold text-gray-900">
            What are the average fees for a {trade.name.toLowerCase()}?
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Fees for a {trade.name.toLowerCase()} depend on the type of service.
            Common services include: {trade.commonTasks.slice(0, 2).map(t => t.split(':')[0].trim().toLowerCase()).join(', ')}.
            The base hourly rate is {trade.priceRange.min} to {trade.priceRange.max} {trade.priceRange.unit}, excluding court fees and filing costs.
          </p>
        </div>
      </section>

      {/* Links to service and city pages */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Detailed rates by service and city
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Discover precise rates for each type of service in major cities across the United States.
          </p>
          <div className="space-y-6">
            {trade.commonTasks.slice(0, 8).map((task) => {
              const taskName = task.split(':')[0].trim()
              const taskSlug = slugifyTask(taskName)
              return (
                <div key={taskSlug} className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">{taskName}</h3>
                  <div className="flex flex-wrap gap-2">
                    {topCities.slice(0, 8).map((ville) => (
                      <Link
                        key={ville.slug}
                        href={`/pricing/${service}/${ville.slug}/${taskSlug}`}
                        className="text-xs text-blue-700 hover:text-blue-900 hover:underline bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        {taskName} in {ville.name} →
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Regional pricing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Fee variations by region
          </h3>
          <p className="text-gray-500 text-sm text-center mb-8">
            {trade.name} rates vary by region. Here is an adjusted estimate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REGIONAL_PRICING.map((r) => {
              const adjustedMin = Math.round(trade.priceRange.min * r.multiplier)
              const adjustedMax = Math.round(trade.priceRange.max * r.multiplier)
              const accentColor =
                r.multiplier > 1.0
                  ? 'border-amber-200 bg-amber-50'
                  : r.multiplier < 1.0
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
              const badgeColor =
                r.multiplier > 1.0
                  ? 'bg-amber-100 text-amber-700'
                  : r.multiplier < 1.0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
              const sign = r.multiplier > 1.0 ? '+' : r.multiplier < 1.0 ? '' : ''
              const pct = Math.round((r.multiplier - 1) * 100)
              return (
                <div key={r.region} className={`rounded-xl border shadow-sm p-4 ${accentColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 text-sm">{r.region}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{r.label}</p>
                  <div className="text-lg font-bold text-gray-900">
                    {adjustedMin} — {adjustedMax} <span className="text-sm font-normal text-gray-500">{trade.priceRange.unit}</span>
                  </div>
                  <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                    {pct === 0 ? 'National average' : `${sign}${pct}% vs average`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Tips for choosing a {trade.name.toLowerCase()}
          </h2>
          <div className="space-y-4">
            {trade.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      {trade.certifications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Certifications and qualifications
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Verify that your {trade.name.toLowerCase()} holds the certifications relevant to your case.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {trade.certifications.map((cert) => (
                <div key={cert} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm font-medium">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions — {trade.name}
          </h2>
          <div className="space-y-4">
            {trade.faq.map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">{item.q}</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Find a {trade.name.toLowerCase()} near you
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {topCities.map((ville) => (
              <Link
                key={ville.slug}
                href={`/practice-areas/${service}/${ville.slug}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  {trade.name} in {ville.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href={`/practice-areas/${service}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
              View all {trade.name.toLowerCase()} attorneys
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Emergency */}
      {trade.emergencyInfo && (
        <section className="py-16 bg-red-50 border-y border-red-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Need an emergency {trade.name.toLowerCase()}?
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto text-sm leading-relaxed">
              {trade.emergencyInfo}
            </p>
            <Link
              href={`/emergency/${service}`}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Emergency {trade.name.toLowerCase()} — 24/7
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Other trades */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Fees for other practice areas</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              return (
                <Link
                  key={slug}
                  href={`/pricing/${slug}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t.priceRange.min} — {t.priceRange.max} {t.priceRange.unit}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get a precise quote for your case
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Fees vary depending on your situation. Request a free consultation from a verified {trade.name.toLowerCase()}.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/quotes/${service}`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Get my exact rate
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/practice-areas/${service}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Find a {trade.name.toLowerCase()}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Fee methodology</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The fees displayed are indicative ranges based on averages observed across the United States. They vary by region, case complexity, and urgency. Only a personalized consultation provides a binding quote. USAttorneys is an independent directory.
            </p>
          </div>
        </div>
      </section>

      {/* See also */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">See also</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">This service</h3>
              <div className="space-y-2">
                <Link href={`/practice-areas/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} — all attorneys</Link>
                {trade.emergencyInfo && (
                  <Link href={`/emergency/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} emergency</Link>
                )}
                {topCities.slice(0, 4).map((v) => (
                  <Link key={v.slug} href={`/practice-areas/${service}/${v.slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    {trade.name} in {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Related fees</h3>
              <div className="space-y-2">
                {otherTrades.slice(0, 6).map((slug) => (
                  <Link key={slug} href={`/pricing/${slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    {tradeContent[slug].name} fees
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Helpful information</h3>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Complete fee guide</Link>
                <Link href="/how-it-works" className="block text-sm text-gray-600 hover:text-blue-600 py-1">How it works</Link>
                <Link href="/quotes" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Request a consultation</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
                <Link href="/verification-process" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Verification process</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Trust &amp; Safety
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/verification-process" className="text-blue-600 hover:text-blue-800">
              How we verify attorneys
            </Link>
            <Link href="/review-policy" className="text-blue-600 hover:text-blue-800">
              Our review policy
            </Link>
            <Link href="/mediation" className="text-blue-600 hover:text-blue-800">
              Mediation service
            </Link>
          </nav>
        </div>
      </section>

      <StickyMobileCTA specialtySlug={service} />

      <EstimationWidget context={{
        metier: trade.name,
        metierSlug: service,
        ville: 'United States',
        departement: '',
        pageUrl: `/pricing/${service}`,
      }} />

      <ExitIntentPopup
        sessionKey="sa:exit-tarifs"
        description="Get the exact rate for your case — compare up to 3 free consultations."
        ctaHref={`/quotes/${service}`}
      />
    </div>
  )
}
