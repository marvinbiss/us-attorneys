import { Metadata } from 'next'
import Link from 'next/link'
import { practiceAreas } from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'

export const revalidate = REVALIDATE.staticPages

const PAGE_TITLE = 'Best Attorneys — Top-Rated Lawyers by Practice Area'
const PAGE_DESCRIPTION =
  'Find the best attorneys across 75+ practice areas. Compare top-rated lawyers by reviews, win rates, and experience in personal injury, criminal defense, family law, business law, and more.'

export function generateMetadata(): Metadata {
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      type: 'website',
      locale: 'en_US',
    },
    alternates: {
      canonical: `${SITE_URL}/best`,
    },
    robots: { index: true, follow: true },
  }
}

const categories: Record<string, string[]> = {
  'Personal Injury': [
    'personal-injury',
    'car-accidents',
    'truck-accidents',
    'motorcycle-accidents',
    'slip-and-fall',
    'medical-malpractice',
    'wrongful-death',
    'product-liability',
    'workers-compensation',
    'nursing-home-abuse',
  ],
  'Criminal Defense': [
    'criminal-defense',
    'dui-dwi',
    'drug-crimes',
    'white-collar-crime',
    'federal-crimes',
    'juvenile-crimes',
    'sex-crimes',
    'theft-robbery',
    'violent-crimes',
    'traffic-violations',
  ],
  'Family Law': [
    'divorce',
    'child-custody',
    'child-support',
    'adoption',
    'alimony-spousal-support',
    'domestic-violence',
    'prenuptial-agreements',
    'paternity',
  ],
  'Business & Corporate': [
    'business-law',
    'corporate-law',
    'mergers-acquisitions',
    'contract-law',
    'business-litigation',
    'intellectual-property',
    'trademark',
    'patent',
    'copyright',
  ],
}

export default function BestIndexPage() {
  const paMap = new Map(practiceAreas.map((pa) => [pa.slug, pa]))

  const breadcrumbItems = [{ label: 'Best Attorneys' }]
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Best Attorneys', url: '/best' },
  ])

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-gradient-to-b from-amber-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} className="mb-4" />
          <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl">
            Best Attorneys
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Find the highest-rated attorneys in every practice area. Our rankings are based on
            verified client reviews, case outcomes, years of experience, and bar standing. Select a
            specialty to see top-rated lawyers near you.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-amber-900">How We Rank Attorneys</h2>
            <p className="text-sm text-amber-800">
              Our rankings consider multiple factors: client reviews, case results, years of
              practice, bar certifications, peer endorsements, and responsiveness. Every attorney in
              our directory is bar-verified.
            </p>
          </div>

          {Object.entries(categories).map(([category, slugs]) => {
            const areas = slugs.map((slug) => paMap.get(slug)).filter(Boolean) as {
              slug: string
              name: string
            }[]
            if (areas.length === 0) return null

            return (
              <div key={category} className="mb-10">
                <h2 className="mb-4 text-xl font-bold text-gray-900">{category}</h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {areas.map((pa) => (
                    <Link
                      key={pa.slug}
                      href={`/best/${pa.slug}/new-york`}
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-amber-300 hover:text-amber-700 hover:shadow-sm"
                    >
                      {pa.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}

          {(() => {
            const categorized = new Set(Object.values(categories).flat())
            const remaining = practiceAreas.filter((pa) => !categorized.has(pa.slug))
            if (remaining.length === 0) return null

            return (
              <div className="mb-10">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Other Practice Areas</h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {remaining.map((pa) => (
                    <Link
                      key={pa.slug}
                      href={`/best/${pa.slug}/new-york`}
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-amber-300 hover:text-amber-700 hover:shadow-sm"
                    >
                      {pa.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </section>
    </div>
  )
}
