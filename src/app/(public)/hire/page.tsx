import { Metadata } from 'next'
import Link from 'next/link'
import { practiceAreas } from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation

export function generateMetadata(): Metadata {
  const title = 'Hire an Attorney — Find Verified Lawyers by Practice Area'
  const description =
    'Hire a verified attorney in any practice area. Browse 75+ specialties including personal injury, criminal defense, family law, business law, and immigration. Free initial consultation available.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
    },
    alternates: {
      canonical: `${SITE_URL}/hire`,
    },
  }
}

// Group practice areas by category
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

export default function HireIndexPage() {
  const paMap = new Map(practiceAreas.map((pa) => [pa.slug, pa]))

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl">
            Hire an Attorney
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Browse practice areas to find and hire a verified attorney in your area. All lawyers in
            our directory are bar-verified. Free initial consultation available for most practice
            areas.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Free consultation banner */}
          <div className="mb-10 rounded-xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-blue-900">Free Initial Consultation</h2>
            <p className="text-sm text-blue-800">
              Most attorneys in our directory offer a free initial consultation. Select a practice
              area and your location to get started.
            </p>
          </div>

          {/* Practice areas by category */}
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
                      href={`/practice-areas/${pa.slug}`}
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-blue-300 hover:text-blue-700 hover:shadow-sm"
                    >
                      {pa.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Remaining practice areas */}
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
                      href={`/practice-areas/${pa.slug}`}
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-blue-300 hover:text-blue-700 hover:shadow-sm"
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
