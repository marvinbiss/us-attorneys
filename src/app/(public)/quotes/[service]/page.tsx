import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle,
  Euro,
  Shield,
  Clock,
  ChevronDown,
  Users,
  Search,
  FileText,
} from 'lucide-react'
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

const EstimationWidget = dynamic(() => import('@/components/estimation/EstimationWidget'), {
  ssr: false,
})

export const revalidate = 86400 // 24h ISR — matches REVALIDATE.services standard

const tradeSlugs = getPracticeAreaSlugs()

export function generateStaticParams() {
  return tradeSlugs.map((service) => ({ service }))
}

export const dynamicParams = false

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>
}): Promise<Metadata> {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) return {}

  const tradeLower = trade.name.toLowerCase()

  const titleHash = Math.abs(hashCode(`quote-title-${service}`))
  const titleTemplates = [
    `Free ${tradeLower} consultation 2026 — Compare`,
    `${tradeLower} consultation online — Free 2026`,
    `Free ${tradeLower} consultation — Verified attorneys`,
    `${tradeLower} consultation 2026: compare rates`,
    `${tradeLower} consultation: free, no obligation`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`quote-desc-${service}`))
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
      images: [
        { url: serviceImage.src, width: 800, height: 600, alt: `${trade.name} consultation` },
      ],
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
    description:
      'Select the type of service, enter your city, and describe your legal needs in a few lines.',
  },
  {
    number: '2',
    icon: FileText,
    title: 'Receive your quotes',
    description:
      'Your request is sent to qualified attorneys near you. You receive up to 3 detailed quotes.',
  },
  {
    number: '3',
    icon: CheckCircle,
    title: 'Choose freely',
    description:
      'Compare rates, review profiles, and choose the attorney that suits you. No obligation.',
  },
]

export default async function DevisServicePage({
  params,
}: {
  params: Promise<{ service: string }>
}) {
  const { service } = await params

  const trade = tradeContent[service]
  if (!trade) notFound()

  const tradeLower = trade.name.toLowerCase()

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Consultations', url: '/quotes' },
    { name: `${trade.name} consultation`, url: `/quotes/${service}` },
  ])

  const faqSchema = getFAQSchema(trade.faq.map((f) => ({ question: f.q, answer: f.a })))

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
      itemListElement: topCities.map((city, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${trade.name} consultation in ${city.name}`,
        url: `${SITE_URL}/quotes/${service}/${city.slug}`,
      })),
    },
  }

  const relatedSlugs = relatedServices[service] || []
  const otherTrades =
    relatedSlugs.length > 0
      ? relatedSlugs.slice(0, 8).filter((s) => tradeContent[s])
      : tradeSlugs.filter((s) => s !== service).slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema, collectionPageSchema]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 md:pb-36 md:pt-14 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Consultations', href: '/quotes' },
              { label: `${trade.name} consultation` },
            ]}
            className="mb-6 text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="mb-6 font-heading text-4xl font-extrabold tracking-[-0.025em] md:text-5xl">
              {(() => {
                const h1Hash = Math.abs(hashCode(`quote-h1-${service}`))
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
            <p className="mx-auto mb-4 max-w-3xl text-xl text-slate-400">
              Receive up to 3 free consultations from verified {tradeLower} attorneys. Indicative
              rate: {trade.priceRange.min} to {trade.priceRange.max} {trade.priceRange.unit}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {trustBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur"
                  >
                    <Icon className="h-4 w-4 text-amber-400" />
                    <span>{badge.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Price range overview */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 p-8 text-center">
            <h2 className="mb-2 text-lg font-semibold text-gray-700">Indicative rate</h2>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-blue-600">
                {trade.priceRange.min} — {trade.priceRange.max}
              </span>
              <span className="text-lg text-gray-600">{trade.priceRange.unit}</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Average rate observed across the United States, attorney fees included
            </p>
          </div>

          <h2 className="mb-6 text-2xl font-bold text-gray-900">Common services</h2>
          <div className="space-y-4">
            {trade.commonTasks.map((task, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 transition-colors hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <Euro className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-gray-800">{task}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Simple and fast
            </p>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              How to get a {tradeLower} consultation
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Three steps are all it takes to receive personalized quotes.
            </p>
          </div>
          <div className="relative grid gap-10 md:grid-cols-3">
            <div className="absolute left-[20%] right-[20%] top-14 hidden md:block">
              <div className="h-px border-t-2 border-dashed border-gray-200" />
            </div>
            {howSteps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.number} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm">
                      <span className="text-xs font-bold text-slate-700">{item.number}</span>
                    </div>
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Find by city */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            {trade.name} consultation by city
          </h2>
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-3">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/quotes/${service}/${city.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  {trade.name} consultation in {city.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href={`/practice-areas/${service}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all {tradeLower} attorneys in the US
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Certifications */}
      {trade.certifications.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Certifications and qualifications
            </h2>
            <p className="mb-8 text-center text-gray-600">
              Verify that your {tradeLower} has the certifications suited to your case.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {trade.certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            FAQ — {trade.name} Consultation
          </h2>
          <div className="space-y-4">
            {trade.faq.map((item, i) => (
              <details key={i} className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <h3 className="pr-4 text-base font-semibold text-gray-900">{item.q}</h3>
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6 text-sm leading-relaxed text-gray-600">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to get your {tradeLower} consultation?
          </h2>
          <p className="mb-8 text-xl text-blue-100">
            Start by choosing your city for a consultation tailored to local rates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/quotes/${service}/new-york`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              {trade.name} consultation in New York
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href={`/practice-areas/${service}`}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400 bg-blue-500 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-400"
            >
              Find a {tradeLower}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related consultations */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Consultations for other practice areas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {otherTrades.map((slug) => {
              const t = tradeContent[slug]
              if (!t) return null
              return (
                <Link
                  key={slug}
                  href={`/quotes/${slug}`}
                  className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                    {t.name} consultation
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {t.priceRange.min} — {t.priceRange.max} {t.priceRange.unit}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* See also */}
      <section className="border-t bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold text-gray-900">See also</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">This service</h3>
              <div className="space-y-2">
                <Link
                  href={`/practice-areas/${service}`}
                  className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  {trade.name} — all attorneys
                </Link>
                <Link
                  href={`/pricing/${service}`}
                  className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  {trade.name} fees
                </Link>
                {trade.emergencyInfo && (
                  <Link
                    href={`/emergency/${service}`}
                    className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                  >
                    {trade.name} emergency
                  </Link>
                )}
                {topCities.slice(0, 4).map((v) => (
                  <Link
                    key={v.slug}
                    href={`/quotes/${service}/${v.slug}`}
                    className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                  >
                    {trade.name} consultation in {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Related consultations</h3>
              <div className="space-y-2">
                {otherTrades.slice(0, 6).map((slug) => {
                  const t = tradeContent[slug]
                  if (!t) return null
                  return (
                    <Link
                      key={slug}
                      href={`/quotes/${slug}`}
                      className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                    >
                      {t.name} consultation
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Useful information</h3>
              <div className="space-y-2">
                <Link
                  href="/quotes"
                  className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  Request a consultation
                </Link>
                <Link
                  href="/pricing"
                  className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  Complete fee guide
                </Link>
                <Link
                  href="/how-it-works"
                  className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  How it works
                </Link>
                <Link href="/faq" className="block py-1 text-sm text-gray-600 hover:text-blue-600">
                  FAQ
                </Link>
                <Link
                  href="/verification-process"
                  className="block py-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  Verification process
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Links (E-E-A-T) */}
      <section className="border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Fee transparency</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              The prices shown are indicative ranges based on averages observed across the United
              States. They vary by region, case complexity, and urgency. Only a personalized quote
              is binding. USAttorneys is an independent directory.
            </p>
          </div>
        </div>
      </section>

      <EstimationWidget
        context={{
          metier: trade.name,
          metierSlug: service,
          ville: 'United States',
          departement: '',
          pageUrl: `/quotes/${service}`,
        }}
      />
    </div>
  )
}
