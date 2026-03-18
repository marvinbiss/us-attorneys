import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, MapPin, Scale, BookOpen } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import { practiceAreas, states } from '@/lib/data/usa'
import { isLegalGuidePASlug, getPANameBySlug, LEGAL_GUIDE_PA_SLUGS } from '@/lib/data/legal-guides'
import { getGuideHubFAQs } from '@/lib/data/legal-guides'
import { getStatuteOfLimitations, STATE_AVG_HOURLY_RATE, STATE_NAMES } from '@/lib/data/state-legal-data'
import { getServiceImage } from '@/lib/data/images'

export const revalidate = REVALIDATE.staticPages
export const dynamicParams = true

// Seed top 15 practice areas for generateStaticParams
export function generateStaticParams() {
  return LEGAL_GUIDE_PA_SLUGS.slice(0, 15).map(slug => ({ type: slug }))
}

interface PageProps { params: Promise<{ type: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type: typeSlug } = await params

  if (!isLegalGuidePASlug(typeSlug)) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const paName = getPANameBySlug(typeSlug)!
  const year = new Date().getFullYear()
  const title = `${paName} Law Guide — All 50 States (${year})`
  const description = `Comprehensive ${paName.toLowerCase()} legal guide covering all 50 states. Find attorneys, compare costs, understand statutes of limitations, and know your rights.`

  return {
    title,
    description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
      images: [{ url: getServiceImage(typeSlug).src, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `${SITE_URL}/guides/${typeSlug}` },
  }
}

// Group states by region for organized display
const STATE_REGIONS: { label: string; region: string }[] = [
  { label: 'Northeast', region: 'Northeast' },
  { label: 'South', region: 'South' },
  { label: 'Midwest', region: 'Midwest' },
  { label: 'West', region: 'West' },
  { label: 'Territories', region: 'Territory' },
]

// Top 10 states by population for featured cards
const TOP_STATE_SLUGS = ['california', 'texas', 'florida', 'new-york', 'pennsylvania', 'illinois', 'ohio', 'georgia', 'north-carolina', 'michigan']

export default async function GuideSpecialtyHubPage({ params }: PageProps) {
  const { type: typeSlug } = await params

  if (!isLegalGuidePASlug(typeSlug)) notFound()

  const paName = getPANameBySlug(typeSlug)!
  const year = new Date().getFullYear()

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: paName, url: `/guides/${typeSlug}` },
  ])

  // Generate FAQ data for this practice area
  const faqs = getGuideHubFAQs(typeSlug, paName)
  const faqSchema = getFAQSchema(faqs)

  // Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${paName} Law Guide — All 50 States`,
    description: `Comprehensive ${paName.toLowerCase()} legal guide covering all 50 states and territories.`,
    url: `${SITE_URL}/guides/${typeSlug}`,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: states.filter(s => s.code !== 'UM').length,
      itemListElement: states.filter(s => s.code !== 'UM').slice(0, 10).map((st, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/guides/${typeSlug}/${st.slug}`,
        name: `${paName} Law in ${st.name}`,
      })),
    },
  }

  const topStates = TOP_STATE_SLUGS
    .map(slug => states.find(s => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => s != null)

  // Related practice areas (same category or adjacent)
  const relatedPAs = practiceAreas
    .filter(p => p.slug !== typeSlug)
    .slice(0, 12)

  // SOL overview: get range across states
  const solValues = Object.keys(STATE_NAMES).map(code => getStatuteOfLimitations(typeSlug, code))
  const solMin = Math.min(...solValues)
  const solMax = Math.max(...solValues)

  // Cost overview
  const costValues = Object.values(STATE_AVG_HOURLY_RATE)
  const costMin = Math.min(...costValues)
  const costMax = Math.max(...costValues)

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumb items={[{ label: 'Guides', href: '/guides' }, { label: paName }]} />
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">{year} Legal Guide</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading">
              {paName} Law Guide — All 50 States
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl">
              Comprehensive state-by-state guide to {paName.toLowerCase()} law. Understand statutes of limitations, average attorney costs, your legal rights, and how to find a qualified {paName.toLowerCase()} attorney in your state.
            </p>

            {/* Quick stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <p className="text-2xl font-bold text-blue-600">{states.filter(s => s.code !== 'UM').length}</p>
                <p className="text-sm text-gray-500">State Guides</p>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <p className="text-2xl font-bold text-blue-600">{solMin === solMax ? `${solMin} yr` : `${solMin}-${solMax} yr`}</p>
                <p className="text-sm text-gray-500">Statute of Limitations</p>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <p className="text-2xl font-bold text-blue-600">${costMin}-${costMax}</p>
                <p className="text-sm text-gray-500">Avg. Hourly Rate</p>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <p className="text-2xl font-bold text-blue-600">75</p>
                <p className="text-sm text-gray-500">Practice Areas</p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* National overview */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Understanding {paName} Law Across the United States</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {paName} law varies significantly from state to state. Each state has its own statutes, case law precedents, court procedures, and filing deadlines that govern how {paName.toLowerCase()} cases are handled. The statute of limitations for {paName.toLowerCase()} cases ranges from {solMin} to {solMax} years depending on the state and the specific nature of the claim. Attorney costs also vary widely, with average hourly rates ranging from ${costMin} in states like Mississippi and West Virginia to ${costMax} in major legal markets like New York and California.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Understanding your state&apos;s specific laws is critical to protecting your rights and building a strong case. Select your state below to access a detailed guide covering local laws, filing procedures, average attorney costs, and how to find the right {paName.toLowerCase()} lawyer for your situation.
              </p>
            </div>
          </section>

          {/* Featured states — top 10 with cards */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured State Guides</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {topStates.map(st => {
                const sol = getStatuteOfLimitations(typeSlug, st.code)
                const rate = STATE_AVG_HOURLY_RATE[st.code] ?? 275
                return (
                  <Link
                    key={st.slug}
                    href={`/guides/${typeSlug}/${st.slug}`}
                    className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{st.name}</h3>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p>SOL: <span className="font-medium text-gray-700">{sol} {sol === 1 ? 'year' : 'years'}</span></p>
                      <p>Avg. rate: <span className="font-medium text-gray-700">${rate}/hr</span></p>
                      <p>Est. attorneys: <span className="font-medium text-gray-700">{st.attorneysEstimate.toLocaleString()}</span></p>
                    </div>
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                      Read guide <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* All states by region */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{paName} Guides by Region</h2>
            <div className="space-y-6">
              {STATE_REGIONS.map(({ label, region }) => {
                const regionStates = states.filter(s => s.region === region && s.code !== 'UM')
                if (regionStates.length === 0) return null
                return (
                  <div key={region} className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {regionStates.map(st => {
                        const sol = getStatuteOfLimitations(typeSlug, st.code)
                        return (
                          <Link
                            key={st.slug}
                            href={`/guides/${typeSlug}/${st.slug}`}
                            className="group flex flex-col px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{st.name}</span>
                            <span className="text-xs text-gray-400">{sol} yr SOL</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* SOL comparison table */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Statute of Limitations Comparison</h2>
            <p className="text-gray-600 mb-6">How long you have to file a {paName.toLowerCase()} claim varies by state. Here is a quick reference table.</p>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Limit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Hourly Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guide</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {states.filter(s => s.code !== 'UM' && s.region !== 'Territory').map(st => {
                      const sol = getStatuteOfLimitations(typeSlug, st.code)
                      const rate = STATE_AVG_HOURLY_RATE[st.code] ?? 275
                      return (
                        <tr key={st.code} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{st.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{sol} {sol === 1 ? 'year' : 'years'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">${rate}/hr</td>
                          <td className="px-4 py-2">
                            <Link href={`/guides/${typeSlug}/${st.slug}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                              Read guide
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions About {paName}</h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <details key={idx} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                    <h3 className="text-base font-medium text-gray-900 pr-4">{faq.question}</h3>
                    <Scale className="w-5 h-5 text-gray-400 group-open:rotate-45 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA: Find an attorney */}
          <section className="mb-16 bg-blue-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-2xl font-bold mb-4">Find a {paName} Attorney Today</h2>
            <p className="text-blue-100 mb-6 max-w-2xl">
              Connect with a verified, bar-licensed {paName.toLowerCase()} attorney in your area. Compare profiles, read reviews, and request a free consultation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/practice-areas/${typeSlug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Browse {paName} Attorneys <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/free-consultation/${typeSlug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                Free Consultation
              </Link>
            </div>
          </section>

          {/* Related practice areas */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Legal Guides</h2>
            <div className="flex flex-wrap gap-2">
              {relatedPAs.map(pa => (
                <Link
                  key={pa.slug}
                  href={`/guides/${pa.slug}`}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {pa.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
