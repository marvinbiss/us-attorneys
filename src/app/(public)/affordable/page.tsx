import { Metadata } from 'next'
import Link from 'next/link'
import { practiceAreas } from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'

export const revalidate = REVALIDATE.staticPages

const PAGE_TITLE = 'Affordable Attorneys — Budget-Friendly Legal Help by Practice Area'
const PAGE_DESCRIPTION =
  'Find affordable attorneys across 75+ practice areas. Compare costs, payment plans, and sliding-scale fees for personal injury, family law, criminal defense, immigration, and more.'

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
      canonical: `${SITE_URL}/affordable`,
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

export default function AffordableIndexPage() {
  const paMap = new Map(practiceAreas.map((pa) => [pa.slug, pa]))

  const breadcrumbItems = [{ label: 'Affordable Attorneys' }]
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Affordable Attorneys', url: '/affordable' },
  ])

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} className="mb-4" />
          <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl">
            Affordable Attorneys
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Legal representation should not break the bank. Browse affordable attorneys across all
            practice areas. Many offer payment plans, sliding-scale fees, and contingency
            arrangements so you can get the help you need within your budget.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 rounded-xl border border-green-200 bg-green-50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-green-900">Budget-Friendly Options</h2>
            <p className="text-sm text-green-800">
              Many attorneys offer flexible payment structures including flat fees, payment plans,
              contingency fees (no win, no fee), and reduced rates for qualifying clients. Select a
              practice area to compare affordable options in your area.
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
                      href={`/affordable/${pa.slug}/new-york`}
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-green-300 hover:text-green-700 hover:shadow-sm"
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
                      href={`/affordable/${pa.slug}/new-york`}
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-green-300 hover:text-green-700 hover:shadow-sm"
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
