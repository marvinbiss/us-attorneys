import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Scale, Flame, DoorOpen, PaintBucket, TreePine, Building2 } from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"
import { comparisons } from "@/lib/data/comparisons"

export const metadata: Metadata = {
  title: "Comparatifs Travaux 2026 : 20 Guides pour Bien Choisir | ServicesArtisans",
  description:
    "Comparatifs détaillés pour vos travaux : pompe à chaleur vs gaz, PVC vs alu, isolation intérieure vs extérieure. Prix, avantages, inconvénients et verdict pour chaque solution.",
  alternates: {
    canonical: `${SITE_URL}/comparaison`,
  },
  openGraph: {
    title: "Comparatifs Travaux 2026 : 20 Guides pour Bien Choisir",
    description:
      "Comparatifs détaillés pour vos travaux : pompe à chaleur vs gaz, PVC vs alu, isolation intérieure vs extérieure. Prix, avantages et verdict.",
    url: `${SITE_URL}/comparaison`,
    type: "website",
  },
}

const categories = [
  {
    name: "Chauffage / Énergie",
    icon: Flame,
    color: "bg-orange-100 text-orange-700",
    iconBg: "bg-orange-50",
  },
  {
    name: "Menuiserie",
    icon: DoorOpen,
    color: "bg-amber-100 text-amber-700",
    iconBg: "bg-amber-50",
  },
  {
    name: "Revêtements",
    icon: PaintBucket,
    color: "bg-violet-100 text-violet-700",
    iconBg: "bg-violet-50",
  },
  {
    name: "Extérieur",
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
]

export default function ComparaisonPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Comparatifs", url: "/comparaison" },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb items={[{ label: "Comparatifs" }]} />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading">
                Comparatifs Travaux
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              {"20 comparatifs détaillés pour vous aider à choisir les meilleures solutions pour vos travaux. Prix 2026, avantages, inconvénients et verdict d'experts."}
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
                    {categoryComparisons.length} comparatif{categoryComparisons.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {categoryComparisons.map((comparison) => (
                    <Link
                      key={comparison.slug}
                      href={`/comparaison/${comparison.slug}`}
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
                          {comparison.options.length} options comparées
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                          Voir le comparatif <ArrowRight className="w-4 h-4" />
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
              {"Besoin d'un artisan pour vos travaux ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des professionnels qualifiés près de chez vous et demandez un devis gratuit."}
            </p>
            <Link
              href="/devis"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              Demander un devis gratuit
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
