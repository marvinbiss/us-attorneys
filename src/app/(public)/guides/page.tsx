import { Metadata } from "next"
import Link from "next/link"
import { BookOpen, HelpCircle, ArrowRight, Newspaper, Scale, Search, ShieldAlert, ShieldCheck } from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"
import { REVALIDATE } from '@/lib/cache'
import { practiceAreas, states } from '@/lib/data/usa'

export const revalidate = REVALIDATE.staticPages

export const metadata: Metadata = {
  title: "Legal Guides by Practice Area & State | Lawtendr",
  description:
    "Comprehensive legal guides covering 75 practice areas across all 50 states. Find attorneys, understand costs, know your rights, and navigate the legal process.",
  alternates: {
    canonical: `${SITE_URL}/guides`,
  },
  openGraph: {
    title: "Legal Guides by Practice Area & State",
    description:
      "Comprehensive legal guides covering 75 practice areas across all 50 states. Find attorneys, understand costs, and navigate the legal process.",
    url: `${SITE_URL}/guides`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal Guides by Practice Area & State",
    description:
      "Comprehensive legal guides covering 75 practice areas across all 50 states.",
  },
}

// Group practice areas by category for cleaner display
const PA_CATEGORIES: { label: string; slugs: string[] }[] = [
  { label: 'Personal Injury', slugs: ['personal-injury', 'car-accidents', 'truck-accidents', 'motorcycle-accidents', 'slip-and-fall', 'medical-malpractice', 'wrongful-death', 'product-liability', 'workers-compensation', 'nursing-home-abuse'] },
  { label: 'Criminal Defense', slugs: ['criminal-defense', 'dui-dwi', 'drug-crimes', 'white-collar-crime', 'federal-crimes', 'juvenile-crimes', 'sex-crimes', 'theft-robbery', 'violent-crimes', 'traffic-violations'] },
  { label: 'Family Law', slugs: ['divorce', 'child-custody', 'child-support', 'adoption', 'alimony-spousal-support', 'domestic-violence', 'prenuptial-agreements', 'paternity'] },
  { label: 'Business & Corporate', slugs: ['business-law', 'corporate-law', 'mergers-acquisitions', 'contract-law', 'business-litigation', 'intellectual-property', 'trademark', 'patent', 'copyright'] },
  { label: 'Real Estate & Property', slugs: ['real-estate-law', 'landlord-tenant', 'foreclosure', 'zoning-land-use', 'construction-law'] },
  { label: 'Immigration', slugs: ['immigration-law', 'green-cards', 'visa-applications', 'deportation-defense', 'asylum', 'citizenship-naturalization'] },
  { label: 'Estate Planning & Probate', slugs: ['estate-planning', 'wills-trusts', 'probate', 'elder-law', 'guardianship'] },
  { label: 'Employment & Labor', slugs: ['employment-law', 'wrongful-termination', 'workplace-discrimination', 'sexual-harassment', 'wage-hour-claims'] },
  { label: 'Bankruptcy & Debt', slugs: ['bankruptcy', 'chapter-7-bankruptcy', 'chapter-13-bankruptcy', 'debt-relief'] },
  { label: 'Tax & Finance', slugs: ['tax-law', 'irs-disputes', 'tax-planning'] },
  { label: 'Other Practice Areas', slugs: ['entertainment-law', 'environmental-law', 'health-care-law', 'insurance-law', 'civil-rights', 'consumer-protection', 'social-security-disability', 'veterans-benefits', 'class-action', 'appeals', 'mediation-arbitration'] },
]

const editorialGuides = [
  {
    title: "RGE Certified Contractor: Verify and Find One",
    description: "How to verify RGE certification, why choose an RGE contractor, and where to find a certified professional near you.",
    href: "/guides/certified-attorney",
    icon: ShieldCheck,
  },
  {
    title: "How to Find a Trusted Attorney in 2026",
    description: "Bar verification, malpractice insurance, certifications, comparing quotes, credentials, client rights, and recourse.",
    href: "/guides/find-attorney",
    icon: Search,
  },
  {
    title: "Legal Scams: How to Spot and Protect Yourself",
    description: "The 10 most common scams, warning signs, verifications, and recourse in case of fraud.",
    href: "/guides/avoid-scams",
    icon: ShieldAlert,
  },
  {
    title: "Work Quotes: How to Compare Properly",
    description: "Required information, how many quotes to request, how to compare, negotiate, and avoid pitfalls.",
    href: "/guides/legal-quotes",
    icon: Scale,
  },
]

const relatedPages = [
  {
    title: "Frequently Asked Questions",
    description: "Answers to the most commonly asked questions about legal services and attorneys.",
    href: "/faq",
    icon: HelpCircle,
  },
  {
    title: "Blog",
    description: "News, tips, and trends in the legal industry.",
    href: "/blog",
    icon: Newspaper,
  },
]

// Top 10 states by population for featured links
const TOP_STATE_SLUGS = ['california', 'texas', 'florida', 'new-york', 'pennsylvania', 'illinois', 'ohio', 'georgia', 'north-carolina', 'michigan']

export default function GuidesPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
  ])

  const topStates = TOP_STATE_SLUGS
    .map(slug => states.find(s => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => s != null)

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb items={[{ label: "Guides" }]} />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading">
                Legal Guides
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              Comprehensive guides for 75 practice areas across all 50 states. Understand your rights, find attorneys, compare costs, and navigate the legal process with confidence.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {practiceAreas.length} practice areas &times; {states.length} states = {practiceAreas.length * states.length} state-specific guides
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* PA x State Legal Guides — grouped by category */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal Guides by Practice Area</h2>
          <p className="text-gray-600 mb-8">Select a practice area to explore state-specific legal guides with costs, timelines, and attorney recommendations.</p>

          <div className="space-y-8 mb-16">
            {PA_CATEGORIES.map(category => {
              const categoryPAs = category.slugs
                .map(slug => practiceAreas.find(p => p.slug === slug))
                .filter((p): p is NonNullable<typeof p> => p != null)

              if (categoryPAs.length === 0) return null

              return (
                <div key={category.label} className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.label}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryPAs.map(pa => (
                      <div key={pa.slug} className="group">
                        <p className="font-medium text-gray-900 text-sm mb-1">{pa.name}</p>
                        <div className="flex flex-wrap gap-1">
                          {topStates.slice(0, 5).map(st => (
                            <Link
                              key={st.slug}
                              href={`/guides/${pa.slug}/${st.slug}`}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {st.code}
                            </Link>
                          ))}
                          <span className="text-xs text-gray-400">+{states.length - 5} states</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Browse by State */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Guides by State</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-16">
            <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {states.filter(s => s.code !== 'UM').map(st => (
                <Link
                  key={st.slug}
                  href={`/guides/personal-injury/${st.slug}`}
                  className="text-sm text-gray-700 hover:text-blue-700 hover:underline py-1"
                  title={`Legal guides for ${st.name}`}
                >
                  {st.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Editorial guides */}
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Featured Guides</h2>
          <div className="grid gap-6 md:grid-cols-2 mb-16">
            {editorialGuides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <guide.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{guide.description}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                      Read the guide <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Related pages */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Resources</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <page.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {page.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">{page.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
