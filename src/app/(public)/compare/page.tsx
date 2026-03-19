import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Scale,
  Shield,
  Users,
  Briefcase,
  Globe,
  FileText,
  DollarSign,
  Home,
  Brain,
  BookOpen,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { comparisons } from '@/lib/data/comparisons'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Attorney & Legal Service Comparisons 2026',
  description:
    'Detailed comparisons to help you choose the right attorney or legal service: criminal defense, family law, personal injury, immigration, and more. Costs, pros, cons, and expert verdicts.',
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  openGraph: {
    title: 'Attorney & Legal Service Comparisons 2026',
    description:
      'Side-by-side comparisons of attorneys and legal services: costs, pros, cons, and expert verdicts to help you make the right choice.',
    url: `${SITE_URL}/compare`,
    type: 'website',
  },
}

const categories = [
  {
    name: 'Criminal Defense',
    icon: Shield,
    color: 'bg-red-100 text-red-700',
    iconBg: 'bg-red-50',
  },
  {
    name: 'Family Law',
    icon: Users,
    color: 'bg-pink-100 text-pink-700',
    iconBg: 'bg-pink-50',
  },
  {
    name: 'Personal Injury',
    icon: Scale,
    color: 'bg-orange-100 text-orange-700',
    iconBg: 'bg-orange-50',
  },
  {
    name: 'Business Law',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-50',
  },
  {
    name: 'Immigration',
    icon: Globe,
    color: 'bg-green-100 text-green-700',
    iconBg: 'bg-green-50',
  },
  {
    name: 'Estate Planning',
    icon: FileText,
    color: 'bg-violet-100 text-violet-700',
    iconBg: 'bg-violet-50',
  },
  {
    name: 'Tax & Finance',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-700',
    iconBg: 'bg-emerald-50',
  },
  {
    name: 'Real Estate',
    icon: Home,
    color: 'bg-amber-100 text-amber-700',
    iconBg: 'bg-amber-50',
  },
  {
    name: 'Bankruptcy & Debt',
    icon: DollarSign,
    color: 'bg-slate-100 text-slate-700',
    iconBg: 'bg-slate-50',
  },
  {
    name: 'Intellectual Property',
    icon: Brain,
    color: 'bg-cyan-100 text-cyan-700',
    iconBg: 'bg-cyan-50',
  },
  {
    name: 'Elder Law',
    icon: BookOpen,
    color: 'bg-teal-100 text-teal-700',
    iconBg: 'bg-teal-50',
  },
]

export default function ComparaisonPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Comparisons', url: '/compare' },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Comparisons' }]} />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
            <div className="mb-4 flex items-center gap-3">
              <Scale className="h-8 w-8 text-blue-600" />
              <h1 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
                Service Comparisons
              </h1>
            </div>
            <p className="max-w-2xl text-lg text-gray-600">
              {
                'Detailed side-by-side comparisons to help you choose the right attorney or legal service. Costs, pros, cons, and expert verdicts.'
              }
            </p>
          </div>
        </div>

        {/* Comparisons by category */}
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          {categories.map((category) => {
            const categoryComparisons = comparisons.filter((c) => c.category === category.name)
            if (categoryComparisons.length === 0) return null
            const Icon = category.icon

            return (
              <section key={category.name} className="mb-12">
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.iconBg}`}
                  >
                    <Icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${category.color}`}
                  >
                    {categoryComparisons.length} comparison
                    {categoryComparisons.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {categoryComparisons.map((comparison) => (
                    <Link
                      key={comparison.slug}
                      href={`/compare/${comparison.slug}`}
                      className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg"
                    >
                      <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                        {comparison.title}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                        {comparison.metaDescription}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {comparison.options.length} options compared
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-all group-hover:gap-2">
                          View comparison <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white md:p-12">
            <h2 className="mb-4 font-heading text-2xl font-bold md:text-3xl">
              {'Need an attorney for your case?'}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
              {'Find qualified professionals near you and request a free consultation.'}
            </p>
            <Link
              href="/quotes"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-blue-700 transition-colors hover:bg-blue-50"
            >
              Request a free consultation
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
