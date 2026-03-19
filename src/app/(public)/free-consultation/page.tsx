import { Metadata } from 'next'
import Link from 'next/link'
import { practiceAreas } from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'

export const revalidate = REVALIDATE.staticPages

const PAGE_TITLE = 'Free Consultation — Talk to a Lawyer for Free by Practice Area'
const PAGE_DESCRIPTION =
  'Get a free legal consultation with verified attorneys across 75+ practice areas. No obligation, no upfront cost. Find lawyers offering free initial consultations in personal injury, family law, criminal defense, and more.'

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
      canonical: `${SITE_URL}/free-consultation`,
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

export default function FreeConsultationIndexPage() {
  const paMap = new Map(practiceAreas.map((pa) => [pa.slug, pa]))

  const breadcrumbItems = [{ label: 'Free Consultation' }]
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Free Consultation', url: '/free-consultation' },
  ])

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumbItems} className="mb-4" />
          <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl">
            Free Legal Consultation
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Many attorneys offer a free initial consultation to discuss your case with no
            obligation. This is your chance to understand your legal options, get a case evaluation,
            and determine if you need representation — all at no cost.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 rounded-xl border border-teal-200 bg-teal-50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-teal-900">What to Expect</h2>
            <p className="text-sm text-teal-800">
              A free consultation typically lasts 15-30 minutes. The attorney will review your
              situation, explain your legal options, discuss potential outcomes, and outline their
              fees if you decide to proceed. There is no obligation to hire the attorney after the
              consultation.
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
                      href={`/free-consultation/${pa.slug}/new-york`}
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-teal-300 hover:text-teal-700 hover:shadow-sm"
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
                      href={`/free-consultation/${pa.slug}/new-york`}
                      className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-teal-300 hover:text-teal-700 hover:shadow-sm"
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
