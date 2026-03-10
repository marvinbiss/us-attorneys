import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import { comparisons } from "@/lib/data/comparisons"
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale,
  ArrowRight,
  Trophy,
  ListChecks,
  Clock,
  Euro,
  Target,
} from "lucide-react"

export const dynamicParams = false

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }))
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const comparison = comparisons.find((c) => c.slug === slug)
  if (!comparison) return {}

  const pageUrl = `${SITE_URL}/comparaison/${comparison.slug}`

  return {
    title: comparison.title,
    description: comparison.metaDescription,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: comparison.title,
      description: comparison.metaDescription,
      url: pageUrl,
      type: "article",
      siteName: SITE_NAME,
    },
  }
}

export default async function ComparaisonSlugPage({ params }: PageProps) {
  const { slug } = await params
  const comparison = comparisons.find((c) => c.slug === slug)
  if (!comparison) notFound()

  const pageUrl = `${SITE_URL}/comparaison/${comparison.slug}`

  const breadcrumbItems = [
    { label: "Comparatifs", href: "/comparaison" },
    { label: comparison.title },
  ]

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Comparatifs",
        item: `${SITE_URL}/comparaison`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: comparison.title,
        item: pageUrl,
      },
    ],
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: comparison.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  // Related comparisons (same category, excluding current)
  const relatedComparisons = comparisons
    .filter((c) => c.category === comparison.category && c.slug !== comparison.slug)
    .slice(0, 3)

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-blue-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Scale className="w-4 h-4" />
            Comparatif {comparison.category}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {comparison.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {comparison.intro}
          </p>
        </section>

        {/* Comparison table (responsive) */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Tableau comparatif
          </h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-500 text-sm min-w-[120px]">
                    Critère
                  </th>
                  {comparison.options.map((option) => (
                    <th
                      key={option.name}
                      className="text-left p-4 font-bold text-gray-900 min-w-[180px]"
                    >
                      {option.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-4 font-medium text-gray-700 flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-400" />
                    Prix moyen
                  </td>
                  {comparison.options.map((option) => (
                    <td key={option.name} className="p-4 text-gray-900 font-semibold">
                      {option.prixMoyen}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Durée de vie
                  </td>
                  {comparison.options.map((option) => (
                    <td key={option.name} className="p-4 text-gray-900">
                      {option.dureeVie}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    Idéal pour
                  </td>
                  {comparison.options.map((option) => (
                    <td key={option.name} className="p-4 text-gray-600 text-sm">
                      {option.idealPour}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Options detail */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Analyse détaillée
          </h2>
          <div className="space-y-8">
            {comparison.options.map((option) => (
              <div
                key={option.name}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
              >
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                  {option.name}
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Avantages */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Avantages
                    </h4>
                    <ul className="space-y-2">
                      {option.avantages.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Inconvénients */}
                  <div>
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Inconvénients
                    </h4>
                    <ul className="space-y-2">
                      {option.inconvenients.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Prix moyen</span>
                    <p className="font-bold text-gray-900 mt-1">{option.prixMoyen}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Durée de vie</span>
                    <p className="font-bold text-gray-900 mt-1">{option.dureeVie}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Idéal pour</span>
                    <p className="text-sm text-gray-700 mt-1">{option.idealPour}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Verdict */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              Notre verdict
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              {comparison.verdict}
            </p>
          </div>
        </section>

        {/* Critères de choix */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <ListChecks className="w-8 h-8 text-blue-600" />
            Critères de choix
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <p className="text-gray-600 mb-6">
              {"Voici les critères essentiels à évaluer avant de faire votre choix :"}
            </p>
            <ul className="grid md:grid-cols-2 gap-4">
              {comparison.criteresChoix.map((critere, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 bg-gray-50 rounded-lg p-4"
                >
                  <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{critere}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {comparison.faq.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-blue-700 transition-colors">
                  {item.question}
                  <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform text-2xl">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Related comparisons */}
        {relatedComparisons.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
              Comparatifs similaires
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedComparisons.map((related) => (
                <Link
                  key={related.slug}
                  href={`/comparaison/${related.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {related.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {related.metaDescription}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                    Voir le comparatif <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Besoin d'un artisan pour vos travaux ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des professionnels qualifiés près de chez vous et demandez un devis gratuit pour concrétiser votre projet."}
            </p>
            <Link
              href="/devis"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              Demander un devis gratuit
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
