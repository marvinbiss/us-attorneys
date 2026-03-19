import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Euro,
  TrendingUp,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { services, cities } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation

export const metadata: Metadata = {
  title: 'Attorney Fees 2026 — Pricing Guide',
  description:
    'Attorney fees 2026: rates for personal injury, family law, criminal defense, estate planning, and all practice areas. Complete fee schedule to estimate your legal costs.',
  alternates: {
    canonical: `${SITE_URL}/pricing`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Attorney Fees 2026 — Pricing Guide',
    description:
      'Attorney fees 2026: rates by practice area. Complete fee schedule for all legal services.',
    url: `${SITE_URL}/pricing`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'USAttorneys — Attorney Fees',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attorney Fees 2026 — Pricing Guide',
    description:
      'Attorney fees 2026: rates by practice area. Complete fee schedule for all legal services.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const tradeFaqs = [
  {
    question: 'How are the displayed prices calculated?',
    answer:
      "The prices shown are average ranges observed across the United States. They include attorney fees and vary by region, case complexity, urgency, and the attorney's level of experience. Always get multiple consultations to find the best rate.",
  },
  {
    question: 'Why do fees vary so much from one attorney to another?',
    answer:
      "Several factors explain fee differences: geographic location (fees are higher in major metropolitan areas like New York and Los Angeles), the attorney's experience and specializations, case complexity, the type of fee arrangement (hourly vs. flat fee vs. contingency), and market demand.",
  },
  {
    question: 'How can I get a free consultation?',
    answer:
      'On USAttorneys, you can request a free consultation by filling out our online form. You can also contact listed attorneys directly through our platform. We recommend getting at least 3 consultations to compare.',
  },
  {
    question: 'What types of fee arrangements are common?',
    answer:
      'The most common fee arrangements are: hourly rates (typical for most legal work), flat fees (common for simple matters like wills or uncontested divorces), contingency fees (attorney takes a percentage of the settlement, common in personal injury cases), and retainer fees (upfront deposit against future hourly work).',
  },
]

const tradeEmojis: Record<string, string> = {
  'personal-injury': '🔧',
  'criminal-defense': '⚡',
  'family-law': '🔑',
  'employment-law': '🔥',
  'intellectual-property': '🎨',
  'estate-planning': '🪚',
  'immigration-law': '🧱',
  'real-estate-law': '🏠',
  'business-law': '🏗️',
  bankruptcy: '🌳',
  'dui-dwi': '🪟',
  'workers-compensation': '❄️',
  'medical-malpractice': '🍳',
  'tax-law': '🛋️',
  'civil-rights': '✨',
}

export default async function PricingPage() {
  const cmsPage = await getPageContent('pricing', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900">{cmsPage.title}</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Attorney Fees', url: '/pricing' },
  ])

  const faqSchema = getFAQSchema(tradeFaqs)

  const trades = Object.values(tradeContent)

  const serviceSchemas = trades.map((trade) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: trade.name,
    provider: { '@type': 'Organization', name: 'USAttorneys', url: SITE_URL },
    areaServed: { '@type': 'Country', name: 'United States' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: trade.priceRange.min,
      highPrice: trade.priceRange.max,
      offerCount: trade.commonTasks.length,
    },
  }))

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema, ...serviceSchemas]} />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
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
          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-10 md:pb-36 md:pt-14 lg:px-8">
            <Breadcrumb
              items={[{ label: 'Attorney Fees' }]}
              className="mb-6 text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
            <div className="text-center">
              <h1 className="mb-4 font-heading text-3xl font-extrabold tracking-[-0.025em] sm:mb-6 sm:text-4xl md:text-5xl">
                Attorney Fee Guide 2026
              </h1>
              <p className="mx-auto mb-4 max-w-3xl text-base text-slate-400 sm:text-xl">
                Average fees by practice area across the United States. Compare rates for{' '}
                {trades.length} practice areas to estimate your legal budget before requesting a
                consultation.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                  <Euro className="h-4 w-4 text-amber-400" />
                  <span>Updated rates 2026</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <span>{trades.length} practice areas</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                  <CheckCircle className="h-4 w-4 text-amber-400" />
                  <span>Verified data</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick nav */}
        <section className="sticky top-0 z-10 border-b bg-white py-3 sm:py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
              {trades.map((trade) => (
                <a
                  key={trade.slug}
                  href={`#${trade.slug}`}
                  className="shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-100 hover:text-blue-700 sm:shrink"
                >
                  {trade.name}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Trade cards */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">Fees by practice area</h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Average rates observed across the United States, attorney fees included
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {trades.map((trade) => {
                const topTasks = trade.commonTasks.slice(0, 3)
                const emoji = tradeEmojis[trade.slug] || '🔧'

                return (
                  <div
                    key={trade.slug}
                    id={trade.slug}
                    className="scroll-mt-24 overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="text-3xl">{emoji}</span>
                        <h3 className="text-xl font-bold text-gray-900">{trade.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-blue-600">
                          {trade.priceRange.min} - {trade.priceRange.max}
                        </span>
                        <span className="text-sm text-gray-600">{trade.priceRange.unit}</span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Common services
                      </h4>
                      <ul className="mb-6 space-y-2">
                        {topTasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>

                      {trade.certifications.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {trade.certifications.slice(0, 2).map((cert, i) => (
                              <span
                                key={i}
                                className="inline-block rounded bg-blue-50 px-2 py-1 text-xs text-blue-700"
                              >
                                {cert}
                              </span>
                            ))}
                            {trade.certifications.length > 2 && (
                              <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                +{trade.certifications.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/pricing/${trade.slug}`}
                        className="flex w-full items-center justify-between rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        <span>View detailed fees</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How to save money */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">How to get the best rate?</h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Our tips for managing your legal costs without sacrificing quality
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  n: 1,
                  title: 'Compare at least 3 quotes',
                  text: 'Never settle for a single quote. Comparing allows you to identify fair pricing and negotiate.',
                },
                {
                  n: 2,
                  title: 'Plan ahead',
                  text: 'Emergency legal services cost 50 to 100% more. Plan ahead for routine legal matters when possible.',
                },
                {
                  n: 3,
                  title: 'Ask about fee structures',
                  text: 'Flat fees, contingency arrangements, and payment plans can significantly reduce your upfront costs.',
                },
                {
                  n: 4,
                  title: 'Verify the attorney',
                  text: 'A bar-verified attorney with malpractice insurance and proper credentials protects you against incompetence and fraud.',
                },
              ].map(({ n, title, text }) => (
                <div key={n} className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                    <span className="text-2xl font-bold text-blue-600">{n}</span>
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Frequently asked questions about attorney fees
              </h2>
            </div>

            <div className="space-y-4">
              {tradeFaqs.map((faq, index) => (
                <details key={index} className="group rounded-xl border border-gray-200 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                    <h3 className="pr-4 text-lg font-semibold text-gray-900">{faq.question}</h3>
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-6 leading-relaxed text-gray-600">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Get an accurate quote for your legal matter
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              Fees vary depending on your case. Request a free consultation to find out the exact
              cost.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/quotes"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-blue-600 transition-colors hover:bg-blue-50 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                Request a free consultation
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/practice-areas"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400 bg-blue-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-400 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                <Search className="h-5 w-5" />
                Find an attorney
              </Link>
            </div>
          </div>
        </section>

        {/* Section A: Fees by practice area and city */}
        <section className="border-t py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 font-heading text-2xl font-bold text-gray-900">
              Fees by practice area and city
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {services.slice(0, 8).map((service) => (
                <div key={service.slug}>
                  <h3 className="mb-3 font-semibold text-gray-900">{service.name} fees</h3>
                  <div className="space-y-1.5">
                    {cities.slice(0, 6).map((city) => (
                      <Link
                        key={city.slug}
                        href={`/pricing/${service.slug}/${city.slug}`}
                        className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                      >
                        <ChevronRight className="h-3 w-3" /> {city.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section B: See also */}
        <section className="border-t bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 font-heading text-2xl font-bold text-gray-900">See also</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* Consultations */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">Request a consultation</h3>
                <div className="space-y-1.5">
                  {services.slice(0, 10).map((s) => (
                    <Link
                      key={s.slug}
                      href={`/quotes/${s.slug}`}
                      className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                    >
                      <ChevronRight className="h-3 w-3" /> {s.name} consultation
                    </Link>
                  ))}
                </div>
              </div>
              {/* Reviews */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">Client reviews</h3>
                <div className="space-y-1.5">
                  {services.slice(0, 10).map((s) => (
                    <Link
                      key={s.slug}
                      href={`/reviews/${s.slug}`}
                      className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                    >
                      <ChevronRight className="h-3 w-3" /> {s.name} reviews
                    </Link>
                  ))}
                </div>
              </div>
              {/* Emergency */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">Emergency attorney</h3>
                <div className="space-y-1.5">
                  {services.slice(0, 10).map((s) => (
                    <Link
                      key={s.slug}
                      href={`/emergency/${s.slug}`}
                      className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                    >
                      <ChevronRight className="h-3 w-3" /> Emergency {s.name.toLowerCase()}
                    </Link>
                  ))}
                </div>
              </div>
              {/* Navigation */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">Navigation</h3>
                <div className="space-y-1.5">
                  <Link
                    href="/practice-areas"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> All services
                  </Link>
                  <Link
                    href="/cities"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> All cities
                  </Link>
                  <Link
                    href="/states"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> All states
                  </Link>
                  <Link
                    href="/regions"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> All regions
                  </Link>
                  <Link
                    href="/blog"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> Blog
                  </Link>
                  <Link
                    href="/quotes"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> Request a consultation
                  </Link>
                  <Link
                    href="/emergency"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> Emergency attorney
                  </Link>
                  <Link
                    href="/reviews"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> Client reviews
                  </Link>
                  <Link
                    href="/tools/cost-estimator"
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> Fee calculator
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="border-t bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Find an attorney near you</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <PopularServicesLinks />
              <PopularCitiesLinks />
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
