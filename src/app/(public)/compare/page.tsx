import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Scale, Flame, DoorOpen, PaintBucket, TreePine, Building2, ShieldCheck } from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"
import { comparisons } from "@/lib/data/comparisons"

export const revalidate = false

export const metadata: Metadata = {
  title: "Service Comparisons 2026: 30 Guides to Choose",
  description:
    "30 detailed comparisons for your legal and home service needs: heat pumps, insulation, carpentry, flooring. 2026 prices, pros, cons, and expert verdict for each solution.",
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  openGraph: {
    title: "Service Comparisons 2026: 30 Guides to Choose Wisely",
    description:
      "30 detailed comparisons for your projects: heat pumps, insulation, carpentry, flooring. 2026 prices, pros, and expert verdict.",
    url: `${SITE_URL}/compare`,
    type: "website",
  },
}

const categories = [
  {
    name: "Heating / Energy",
    icon: Flame,
    color: "bg-orange-100 text-orange-700",
    iconBg: "bg-orange-50",
  },
  {
    name: "Carpentry",
    icon: DoorOpen,
    color: "bg-amber-100 text-amber-700",
    iconBg: "bg-amber-50",
  },
  {
    name: "Flooring",
    icon: PaintBucket,
    color: "bg-violet-100 text-violet-700",
    iconBg: "bg-violet-50",
  },
  {
    name: "Exterior",
    icon: TreePine,
    color: "bg-green-100 text-green-700",
    iconBg: "bg-green-50",
  },
  {
    name: "Structure",
    icon: Building2,
    color: "bg-blue-100 text-blue-700",
    iconBg: "bg-blue-50",
  },
  {
    name: "Insulation",
    icon: ShieldCheck,
    color: "bg-cyan-100 text-cyan-700",
    iconBg: "bg-cyan-50",
  },
]

export default function ComparaisonPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Comparisons", url: "/compare" },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb items={[{ label: "Comparisons" }]} />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading">
                Service Comparisons
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              {"30 detailed comparisons to help you choose the best solutions for your projects. 2026 prices, pros, cons, and expert verdicts."}
            </p>
          </div>
        </div>

        {/* Comparisons by category */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {categories.map((category) => {
            const categoryComparisons = comparisons.filter(
              (c) => c.category === category.name
            )
            if (categoryComparisons.length === 0) return null
            const Icon = category.icon

            return (
              <section key={category.name} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.iconBg}`}
                  >
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {category.name}
                  </h2>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${category.color}`}
                  >
                    {categoryComparisons.length} comparison{categoryComparisons.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {categoryComparisons.map((comparison) => (
                    <Link
                      key={comparison.slug}
                      href={`/compare/${comparison.slug}`}
                      className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                        {comparison.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {comparison.metaDescription}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {comparison.options.length} options compared
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                          View comparison <ArrowRight className="w-4 h-4" />
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Need an attorney for your case?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Find qualified professionals near you and request a free consultation."}
            </p>
            <Link
              href="/quotes"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              Request a free consultation
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
