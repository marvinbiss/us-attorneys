import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Euro, Search, AlertTriangle, FileText, Wrench, HelpCircle } from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getCollectionPageSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"
import { questions, categoryLabels, type QuestionCategory } from "@/lib/data/faq"

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

export const revalidate = 86400

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Questions Travaux et Artisanat — FAQ`,
  description:
    "Trouvez les réponses à toutes vos questions sur les travaux, les tarifs des artisans, la réglementation et les urgences. Guides pratiques et conseils d'experts.",
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: `Questions Travaux et Artisanat — FAQ`,
    description:
      "Trouvez les réponses à toutes vos questions sur les travaux, les tarifs des artisans, la réglementation et les urgences.",
    type: "website",
    url: `${SITE_URL}/faq`,
  },
}

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const categoryConfig: Record<
  QuestionCategory,
  { icon: typeof Euro; color: string; bgColor: string; borderColor: string }
> = {
  prix: {
    icon: Euro,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  choix: {
    icon: Search,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  urgence: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  reglementation: {
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  diy: {
    icon: Wrench,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuestionsHubPage() {
  const breadcrumbItems = [{ label: "Questions" }]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Questions", url: "/faq" },
  ])

  const collectionSchema = getCollectionPageSchema({
    name: "Questions fréquentes sur les travaux et l'artisanat",
    description:
      "Réponses aux questions les plus posées sur les artisans, les tarifs, la réglementation et les travaux.",
    url: "/faq",
    itemCount: questions.length,
  })

  // Group questions by category
  const groupedQuestions = (Object.keys(categoryLabels) as QuestionCategory[]).reduce(
    (acc, cat) => {
      const catQuestions = questions.filter((q) => q.category === cat)
      if (catQuestions.length > 0) {
        acc.push({ category: cat, questions: catQuestions })
      }
      return acc
    },
    [] as { category: QuestionCategory; questions: typeof questions }[]
  )

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading mb-4">
            Questions fréquentes
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Toutes les réponses à vos questions sur les travaux, les tarifs, le
            choix d'un artisan et la réglementation.
          </p>
        </div>
      </section>

      {/* Category sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="space-y-12">
          {groupedQuestions.map(({ category, questions: catQuestions }) => {
            const config = categoryConfig[category]
            const Icon = config.icon

            return (
              <section key={category}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor}`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <h2 className="text-2xl font-bold font-heading text-gray-900">
                    {categoryLabels[category]}
                  </h2>
                  <span className="text-sm text-gray-400">
                    {catQuestions.length} question{catQuestions.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Question cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catQuestions.map((q) => (
                    <Link
                      key={q.slug}
                      href={`/faq/${q.slug}`}
                      className={`group flex items-start gap-3 p-5 bg-white border rounded-xl hover:shadow-md hover:${config.borderColor} transition-all`}
                    >
                      <ArrowRight
                        className={`w-5 h-5 mt-0.5 shrink-0 ${config.color} group-hover:translate-x-0.5 transition-transform`}
                      />
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">
                          {q.question}
                        </p>
                        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                          {q.shortAnswer}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Empty state (in case no questions yet) */}
        {groupedQuestions.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Aucune question disponible pour le moment.</p>
          </div>
        )}
      </div>
    </>
  )
}
