import { Metadata } from 'next'
import Link from 'next/link'
import { practiceAreas } from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation

export function generateMetadata(): Metadata {
  const title = 'Pro Bono Legal Services — Free Attorney Help'
  const description =
    'Find pro bono attorneys across the United States. Free legal representation for qualifying individuals in all practice areas including family law, criminal defense, immigration, and more.'

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
      canonical: `${SITE_URL}/pro-bono`,
    },
  }
}

// Group practice areas by category for display
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

export default function ProBonoIndexPage() {
  const paMap = new Map(practiceAreas.map((pa) => [pa.slug, pa]))

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-purple-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl">
            Pro Bono Legal Services
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Many attorneys across the United States dedicate their time to pro bono work, providing
            free legal representation to individuals who cannot afford an attorney. Browse practice
            areas below to find pro bono services near you.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Eligibility summary */}
          <div className="mb-10 rounded-xl border border-purple-200 bg-purple-50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-purple-900">Do You Qualify?</h2>
            <p className="text-sm text-purple-800">
              Most pro bono programs serve individuals at or below 200% of the federal poverty
              level. Contact your local legal aid society or bar association for eligibility
              details.
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
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-purple-300 hover:text-purple-700 hover:shadow-sm"
                    >
                      {pa.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Remaining practice areas not in categories */}
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
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-purple-300 hover:text-purple-700 hover:shadow-sm"
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
