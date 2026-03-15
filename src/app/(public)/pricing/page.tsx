import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Euro, TrendingUp, CheckCircle, Search, ChevronDown, ChevronRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { services, cities } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Attorney Fees 2026 — Pricing Guide',
  description: 'Attorney fees 2026: rates for personal injury, family law, criminal defense, estate planning, and all practice areas. Complete fee schedule to estimate your legal costs.',
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
    description: 'Attorney fees 2026: rates by practice area. Complete fee schedule for all legal services.',
    url: `${SITE_URL}/pricing`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'USAttorneys — Attorney Fees' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attorney Fees 2026 — Pricing Guide',
    description: 'Attorney fees 2026: rates by practice area. Complete fee schedule for all legal services.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const tradeFaqs = [
  {
    question: 'How are the displayed prices calculated?',
    answer: 'The prices shown are average ranges observed across the United States. They include attorney fees and vary by region, case complexity, urgency, and the attorney\'s level of experience. Always get multiple consultations to find the best rate.',
  },
  {
    question: 'Why do fees vary so much from one attorney to another?',
    answer: 'Several factors explain fee differences: geographic location (fees are higher in major metropolitan areas like New York and Los Angeles), the attorney\'s experience and specializations, case complexity, the type of fee arrangement (hourly vs. flat fee vs. contingency), and market demand.',
  },
  {
    question: 'How can I get a free consultation?',
    answer: 'On USAttorneys, you can request a free consultation by filling out our online form. You can also contact listed attorneys directly through our platform. We recommend getting at least 3 consultations to compare.',
  },
  {
    question: 'What types of fee arrangements are common?',
    answer: 'The most common fee arrangements are: hourly rates (typical for most legal work), flat fees (common for simple matters like wills or uncontested divorces), contingency fees (attorney takes a percentage of the settlement, common in personal injury cases), and retainer fees (upfront deposit against future hourly work).',
  },
]

const tradeEmojis: Record<string, string> = {
  plombier: '🔧',
  electricien: '⚡',
  serrurier: '🔑',
  chauffagiste: '🔥',
  'peintre-en-batiment': '🎨',
  menuisier: '🪚',
  carreleur: '🧱',
  couvreur: '🏠',
  macon: '🏗️',
  jardinier: '🌳',
  vitrier: '🪟',
  climaticien: '❄️',
  cuisiniste: '🍳',
  solier: '🛋️',
  nettoyage: '✨',
}

export default async function TarifsPage() {
  const cmsPage = await getPageContent('pricing', 'static')

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
        <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
            }} />
            <div className="absolute inset-0 opacity-[0.025]" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }} />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 sm:pt-10 sm:pb-28 md:pt-14 md:pb-36">
            <Breadcrumb
              items={[{ label: 'Attorney Fees' }]}
              className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
            <div className="text-center">
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 tracking-[-0.025em]">
                Attorney Fee Guide 2026
              </h1>
              <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto mb-4">
                Average fees by practice area across the United States. Compare rates for {trades.length} practice
                areas to estimate your legal budget before requesting a consultation.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                  <Euro className="w-4 h-4 text-amber-400" />
                  <span>Updated rates 2026</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>{trades.length} practice areas</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-sm">
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                  <span>Verified data</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick nav */}
        <section className="py-3 sm:py-8 bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto sm:overflow-x-visible sm:flex-wrap pb-1 sm:pb-0">
              {trades.map((trade) => (
                <a
                  key={trade.slug}
                  href={`#${trade.slug}`}
                  className="shrink-0 sm:shrink px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  {trade.name}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Trade cards */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Fees by practice area
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Average rates observed across the United States, attorney fees included
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trades.map((trade) => {
                const topTasks = trade.commonTasks.slice(0, 3)
                const emoji = tradeEmojis[trade.slug] || '🔧'

                return (
                  <div
                    key={trade.slug}
                    id={trade.slug}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow scroll-mt-24"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{emoji}</span>
                        <h3 className="text-xl font-bold text-gray-900">
                          {trade.name}
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-blue-600">
                          {trade.priceRange.min} - {trade.priceRange.max}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {trade.priceRange.unit}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Common services
                      </h4>
                      <ul className="space-y-2 mb-6">
                        {topTasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>

                      {trade.certifications.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {trade.certifications.slice(0, 2).map((cert, i) => (
                              <span key={i} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                                {cert}
                              </span>
                            ))}
                            {trade.certifications.length > 2 && (
                              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                +{trade.certifications.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/pricing/${trade.slug}`}
                        className="flex items-center justify-between w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                      >
                        <span>View detailed fees</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How to save money */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How to get the best rate?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our tips for managing your legal costs without sacrificing quality
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { n: 1, title: 'Compare at least 3 quotes', text: 'Never settle for a single quote. Comparing allows you to identify fair pricing and negotiate.' },
                { n: 2, title: 'Plan ahead', text: 'Emergency legal services cost 50 to 100% more. Plan ahead for routine legal matters when possible.' },
                { n: 3, title: 'Ask about fee structures', text: 'Flat fees, contingency arrangements, and payment plans can significantly reduce your upfront costs.' },
                { n: 4, title: 'Verify the attorney', text: 'A bar-verified attorney with malpractice insurance and proper credentials protects you against incompetence and fraud.' },
              ].map(({ n, title, text }) => (
                <div key={n} className="text-center p-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">{n}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently asked questions about attorney fees
              </h2>
            </div>

            <div className="space-y-4">
              {tradeFaqs.map((faq, index) => (
                <details key={index} className="bg-white rounded-xl border border-gray-200 group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Get an accurate quote for your legal matter
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Fees vary depending on your case. Request a free consultation to find out the exact cost.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-base sm:text-lg w-full sm:w-auto"
              >
                Request a free consultation
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-base sm:text-lg border border-blue-400 w-full sm:w-auto"
              >
                <Search className="w-5 h-5" />
                Find an attorney
              </Link>
            </div>
          </div>
        </section>

        {/* Section A: Fees by practice area and city */}
        <section className="py-12 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8">Fees by practice area and city</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.slice(0, 8).map((service) => (
                <div key={service.slug}>
                  <h3 className="font-semibold text-gray-900 mb-3">{service.name} fees</h3>
                  <div className="space-y-1.5">
                    {cities.slice(0, 6).map((ville) => (
                      <Link key={ville.slug} href={`/pricing/${service.slug}/${ville.slug}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                        <ChevronRight className="w-3 h-3" /> {ville.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section B: See also */}
        <section className="py-12 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8">See also</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Consultations */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Request a consultation</h3>
                <div className="space-y-1.5">
                  {services.slice(0, 10).map((s) => (
                    <Link key={s.slug} href={`/quotes/${s.slug}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" /> {s.name} consultation
                    </Link>
                  ))}
                </div>
              </div>
              {/* Reviews */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Client reviews</h3>
                <div className="space-y-1.5">
                  {services.slice(0, 10).map((s) => (
                    <Link key={s.slug} href={`/reviews/${s.slug}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" /> {s.name} reviews
                    </Link>
                  ))}
                </div>
              </div>
              {/* Emergency */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Emergency attorney</h3>
                <div className="space-y-1.5">
                  {services.slice(0, 10).map((s) => (
                    <Link key={s.slug} href={`/emergency/${s.slug}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" /> Emergency {s.name.toLowerCase()}
                    </Link>
                  ))}
                </div>
              </div>
              {/* Navigation */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Navigation</h3>
                <div className="space-y-1.5">
                  <Link href="/services" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> All services
                  </Link>
                  <Link href="/cities" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> All cities
                  </Link>
                  <Link href="/states" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> All states
                  </Link>
                  <Link href="/regions" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> All regions
                  </Link>
                  <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> Blog
                  </Link>
                  <Link href="/quotes" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> Request a consultation
                  </Link>
                  <Link href="/emergency" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> Emergency attorney
                  </Link>
                  <Link href="/reviews" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> Client reviews
                  </Link>
                  <Link href="/tools/calculator-prix" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" /> Fee calculator
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="bg-gray-50 py-12 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Find an attorney near you
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <PopularServicesLinks />
              <PopularCitiesLinks />
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
