import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { CheckCircle, ArrowRight, ArrowLeft, BookOpen, Euro, Calculator } from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getFAQSchema } from "@/lib/seo/jsonld"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import { getQuestionBySlug, getQuestionSlugs, getQuestionsByCategory } from "@/lib/data/questions"

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return getQuestionSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false
export const revalidate = 86400

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  const question = getQuestionBySlug(params.slug)
  if (!question) return {}

  const title = `${question.question} | ${SITE_NAME}`
  const description = question.shortAnswer

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/questions/${question.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/questions/${question.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuestionPage({
  params,
}: {
  params: { slug: string }
}) {
  const question = getQuestionBySlug(params.slug)
  if (!question) notFound()

  const relatedQuestions = getQuestionsByCategory(question.category)
    .filter((q) => q.slug !== question.slug)
    .slice(0, 5)

  const breadcrumbItems = [
    { label: "Questions", href: "/questions" },
    { label: question.question },
  ]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Questions", url: "/questions" },
    { name: question.question, url: `/questions/${question.slug}` },
  ])

  const faqSchema = getFAQSchema([
    { question: question.question, answer: question.shortAnswer },
  ])

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/questions"
            className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Toutes les questions
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading leading-tight">
            {question.question}
          </h1>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Main content */}
          <article className="flex-1 max-w-3xl">
            {/* Featured snippet box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-10">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">
                    Réponse rapide
                  </p>
                  <p className="text-blue-800 leading-relaxed">
                    {question.shortAnswer}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed answer */}
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold font-heading text-gray-900 mb-6">
                Réponse détaillée
              </h2>
              {question.detailedAnswer.map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Cross-links */}
            <div className="mt-10 pt-8 border-t">
              <h2 className="text-xl font-bold font-heading text-gray-900 mb-4">
                En savoir plus
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <Link
                  href={`/services/${question.relatedService}`}
                  className="flex items-center gap-3 p-4 bg-white border rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      Services
                    </p>
                    <p className="text-sm text-gray-500">
                      Trouver un professionnel
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/tarifs/${question.relatedService}`}
                  className="flex items-center gap-3 p-4 bg-white border rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <Euro className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      Tarifs
                    </p>
                    <p className="text-sm text-gray-500">
                      Grille de prix détaillée
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/devis/${question.relatedService}`}
                  className="flex items-center gap-3 p-4 bg-white border rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <Calculator className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      Devis gratuit
                    </p>
                    <p className="text-sm text-gray-500">
                      Demander une estimation
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar: related questions */}
          {relatedQuestions.length > 0 && (
            <aside className="lg:w-80 shrink-0">
              <div className="bg-gray-50 rounded-xl p-6 lg:sticky lg:top-24">
                <h2 className="text-lg font-bold font-heading text-gray-900 mb-4">
                  Questions similaires
                </h2>
                <div className="space-y-3">
                  {relatedQuestions.map((q) => (
                    <Link
                      key={q.slug}
                      href={`/questions/${q.slug}`}
                      className="flex items-start gap-2 p-3 bg-white rounded-lg border hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <ArrowRight className="w-4 h-4 text-blue-500 mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <span className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors leading-snug">
                        {q.question}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
