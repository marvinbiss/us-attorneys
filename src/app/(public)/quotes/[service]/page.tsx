import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle, Euro, Shield, Clock, ChevronDown, Users, Search, FileText } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { tradeContent, getPracticeAreaSlugs } from '@/lib/data/trade-content'
import { cities } from '@/lib/data/usa'
import { getServiceImage } from '@/lib/data/images'
import { relatedServices } from '@/lib/constants/navigation'
import dynamic from 'next/dynamic'

const EstimationWidget = dynamic(
  () => import('@/components/estimation/EstimationWidget'),
  { ssr: false }
)

export const revalidate = false

const tradeSlugs = getPracticeAreaSlugs()

export function generateStaticParams() {
  return tradeSlugs.map((service) => ({ service }))
}

export const dynamicParams = false

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) return {}

  const tradeLower = trade.name.toLowerCase()

  const titleHash = Math.abs(hashCode(`devis-title-${service}`))
  const titleTemplates = [
    `Free ${tradeLower} consultation 2026 — Compare`,
    `${tradeLower} consultation online — Free 2026`,
    `Free ${tradeLower} consultation — Verified attorneys`,
    `${tradeLower} consultation 2026: compare rates`,
    `${tradeLower} consultation: free, no obligation`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`devis-desc-${service}`))
  const descTemplates = [
    `Request a free ${tradeLower} consultation. Compare up to 3 verified attorneys. Rates: ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. 100% free.`,
    `${tradeLower} consultation online: ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}. Compare offers from qualified professionals. 100% free.`,
    `Get a free consultation for ${tradeLower}. ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. Verified attorneys, no obligation.`,
    `Free ${tradeLower} consultation: ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}. Up to 3 proposals from qualified attorneys.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(service)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/quotes/${service}` },
    openGraph: {
      locale: 'en_US',
      title,
      description,
      url: `${SITE_URL}/quotes/${service}`,
      type: 'website',
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `${trade.name} consultation` }],
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

const trustBadges = [
  { icon: Shield, label: 'Free', sublabel: 'No hidden fees' },
  { icon: Clock, label: 'No obligation', sublabel: 'Response within 24h' },
  { icon: Users, label: 'Verified attorneys', sublabel: 'Bar-verified' },
]

const howSteps = [
  {
    number: '1',
    icon: Search,
    title: 'Describe your case',
    description: 'Select the type of service, enter your city, and describe your legal needs in a few lines.',
  },
  {
    number: '2',
    icon: FileText,
    title: 'Receive your quotes',
    description: 'Your request is sent to qualified attorneys near you. You receive up to 3 detailed quotes.',
  },
  {
    number: '3',
    icon: CheckCircle,
    title: 'Choose freely',
    description: 'Compare rates, review profiles, and choose the attorney that suits you. No obligation.',
  },
]

export default async function DevisServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params

  const trade = tradeContent[service]
  if (!trade) notFound()

  const tradeLower = trade.name.toLowerCase()

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Consultations', url: '/quotes' },
    { name: `${trade.name} consultation`, url: `/quotes/${service}` },
  ])

  const faqSchema = getFAQSchema(
    trade.faq.map((f) => ({ question: f.q, answer: f.a }))
  )

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${trade.name} consultation in the US`,
    description: `Request a free consultation for ${tradeLower}. ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}. Verified attorneys.`,
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
      offerCount: undefined,
    },
  }

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${trade.name} consultation by city`,
    description: `Request a free ${tradeLower} consultation. Compare verified attorneys by city. ${trade.priceRange.min} to ${trade.priceRange.max} ${trade.priceRange.unit}.`,
    url: `${SITE_URL}/quotes/${service}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: topCities.map((ville, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${trade.name} consultation in ${ville.name}`,
        url: `${SITE_URL}/quotes/${service}/${ville.slug}`,
      })),
    },
  }

  const relatedSlugs = relatedServices[service] || []
  const otherTrades = relatedSlugs.length > 0
    ? relatedSlugs.slice(0, 8).filter((s) => tradeContent[s])
    : tradeSlugs.filter((s) => s !== service).slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema, collectionPageSchema]} />

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
              { label: 'Consultations', href: '/quotes' },
              { label: `${trade.name} consultation` },
            ]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              {(() => {
                const h1Hash = Math.abs(hashCode(`devis-h1-${service}`))
                const h1Templates = [
                  `Free ${tradeLower} consultation — Compare attorneys`,
                  `Request a ${tradeLower} consultation online`,
                  `${tradeLower} consultation: compare up to 3 attorneys`,
                  `Free ${tradeLower} consultation — No obligation`,
                  `${trade.name}: get your free consultation`,
                ]
                return h1Templates[h1Hash % h1Templates.length]
              })()}
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Receive up to 3 free consultations from verified {tradeLower} attorneys.
              Indicative rate: {trade.priceRange.min} to {trade.priceRange.max} {trade.priceRange.unit}.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {trustBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div key={badge.label} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{badge.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Price range overview */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center mb-12">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Indicative rate</h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {trade.priceRange.min} — {trade.priceRange.max}
              </span>
              <span className="text-gray-600 text-lg">{trade.priceRange.unit}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Average rate observed across the United States, attorney fees included
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Common services
          </h2>
          <div className="space-y-4">
            {trade.commonTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl border border-gray-200 p-5 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Euro className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-800">{task}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white border-t">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Simple and fast</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              How to get a {tradeLower} consultation
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Three steps are all it takes to receive personalized quotes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%]">
              <div className="h-px border-t-2 border-dashed border-gray-200" />
            </div>
            {howSteps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.number} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-slate-700">{item.number}</span>
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Find by city */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {trade.name} consultation by city
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {topCities.map((ville) => (
              <Link
                key={ville.slug}
                href={`/quotes/${service}/${ville.slug}`}
                className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group text-center"
              >
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  {trade.name} consultation in {ville.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href={`/practice-areas/${service}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
              View all {tradeLower} attorneys in the US
              <ArrowRight className="w-4 h-4" />
            </Link>
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
              Verify that your {tradeLower} has the certifications suited to your case.
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
            FAQ — {trade.name} Consultation
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

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get your {tradeLower} consultation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start by choosing your city for a consultation tailored to local rates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/quotes/${service}/new-york`}
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              {trade.name} consultation in New York
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/practice-areas/${service}`}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Find a {tradeLower}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related consultations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Consultations for other practice areas</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              if (!t) return null
              return (
                <Link
                  key={slug}
                  href={`/quotes/${slug}`}
                  className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                    {t.name} consultation
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

      {/* See also */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">See also</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">This service</h3>
              <div className="space-y-2">
                <Link href={`/practice-areas/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} — all attorneys</Link>
                <Link href={`/pricing/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} fees</Link>
                {trade.emergencyInfo && (
                  <Link href={`/emergency/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} emergency</Link>
                )}
                {topCities.slice(0, 4).map((v) => (
                  <Link key={v.slug} href={`/quotes/${service}/${v.slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    {trade.name} consultation in {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Related consultations</h3>
              <div className="space-y-2">
                {otherTrades.slice(0, 6).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link key={slug} href={`/quotes/${slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                      {t.name} consultation
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Useful information</h3>
              <div className="space-y-2">
                <Link href="/quotes" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Request a consultation</Link>
                <Link href="/pricing" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Complete fee guide</Link>
                <Link href="/how-it-works" className="block text-sm text-gray-600 hover:text-blue-600 py-1">How it works</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
                <Link href="/verification-process" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Verification process</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Links (E-E-A-T) */}
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

      {/* Editorial credibility */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Fee transparency</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The prices shown are indicative ranges based on averages observed across the United States. They vary by region, case complexity, and urgency. Only a personalized quote is binding. USAttorneys is an independent directory.
            </p>
          </div>
        </div>
      </section>

      <EstimationWidget context={{
        metier: trade.name,
        metierSlug: service,
        ville: 'United States',
        departement: '',
        pageUrl: `/quotes/${service}`,
      }} />
    </div>
  )
}
