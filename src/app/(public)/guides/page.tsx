import { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Euro, BarChart3, HelpCircle, ArrowRight, Newspaper, Scale, Zap, FileText, ShieldCheck, Building2, Hammer, Users } from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"

export const metadata: Metadata = {
  title: "Guides Pratiques pour vos Travaux | ServicesArtisans",
  description:
    "Guides complets pour vos travaux : aides financières, rénovation énergétique, MaPrimeRénov 2026, conseils artisans. Informations fiables et à jour.",
  alternates: {
    canonical: `${SITE_URL}/guides`,
  },
  openGraph: {
    title: "Guides Pratiques pour vos Travaux",
    description:
      "Guides complets pour vos travaux : aides financières, rénovation énergétique, MaPrimeRénov 2026, conseils artisans.",
    url: `${SITE_URL}/guides`,
    type: "website",
  },
}

const guides = [
  {
    title: "MaPrimeRénov 2026 : Guide Complet",
    description:
      "Tout savoir sur MaPrimeRénov en 2026 : montants, conditions, parcours accompagné et par geste, barèmes de revenus et démarches.",
    href: "/guides/maprimerenov-2026",
    icon: Euro,
    badge: "Populaire",
    badgeColor: "bg-green-100 text-green-800",
  },
  {
    title: "Aides Rénovation Énergétique 2026",
    description:
      "Toutes les aides financières pour vos travaux de rénovation énergétique : MaPrimeRénov, CEE, éco-PTZ, TVA réduite et aides locales.",
    href: "/guides/aides-renovation-2026",
    icon: Building2,
    badge: undefined,
    badgeColor: "",
  },
  {
    title: "Artisan RGE : Vérifier et Trouver un Certifié",
    description:
      "Comment vérifier la certification RGE, pourquoi choisir un artisan RGE et où trouver un professionnel certifié près de chez vous.",
    href: "/guides/artisan-rge",
    icon: ShieldCheck,
    badge: undefined,
    badgeColor: "",
  },
  {
    title: "Permis de Construire 2026",
    description:
      "Quand le permis de construire est obligatoire (>20 m², >40 m² en zone PLU), documents requis, délais et cas spéciaux.",
    href: "/guides/permis-construire",
    icon: Scale,
    badge: "Nouveau",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Normes Électriques NF C 15-100",
    description:
      "Guide de la norme NF C 15-100 : nombre de prises par pièce, protection des circuits, zones salle de bain et mise aux normes.",
    href: "/guides/normes-electriques",
    icon: Zap,
    badge: "Nouveau",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Déclaration Préalable de Travaux",
    description:
      "Quand la déclaration préalable est nécessaire, formulaire Cerfa 13703, délai d\"instruction d\"un mois et accord tacite.",
    href: "/guides/declaration-prealable-travaux",
    icon: FileText,
    badge: "Nouveau",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Garantie Décennale : Tout Comprendre",
    description:
      "Définition, durée de 10 ans, travaux couverts, exclusions, vérification de l'attestation et démarches en cas de sinistre.",
    href: "/guides/garantie-decennale",
    icon: ShieldCheck,
    badge: "Nouveau",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Devis Travaux : Guide pour Bien Comparer",
    description:
      "Mentions obligatoires, combien de devis demander, comment comparer, négocier et éviter les pièges.",
    href: "/guides/devis-travaux",
    icon: Hammer,
    badge: "Nouveau",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Travaux en Copropriété : Règles et Démarches",
    description:
      "Parties communes vs privatives, vote en AG, majorités requises, autorisations et gros travaux obligatoires.",
    href: "/guides/travaux-copropriete",
    icon: Users,
    badge: "Nouveau",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Assurance Dommage-Ouvrage : Est-ce Obligatoire ?",
    description:
      "Définition, obligation légale, coût (1 à 5 % du chantier), souscription et conséquences en cas d'absence.",
    href: "/guides/assurance-dommage-ouvrage",
    icon: ShieldCheck,
    badge: "Nouveau",
    badgeColor: "bg-blue-100 text-blue-800",
  },
]

const relatedPages = [
  {
    title: "Questions fréquentes",
    description: "Réponses aux questions les plus posées sur les travaux et les artisans.",
    href: "/questions",
    icon: HelpCircle,
  },
  {
    title: "Blog",
    description: "Actualités, conseils et tendances du secteur de l'artisanat.",
    href: "/blog",
    icon: Newspaper,
  },
  {
    title: "Baromètre des prix",
    description: "Tarifs moyens, indices régionaux et tendances pour les métiers du bâtiment.",
    href: "/barometre-prix",
    icon: BarChart3,
  },
]

export default function GuidesPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Guides", url: "/guides" },
  ])

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
                Guides Pratiques
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              {"Retrouvez nos guides complets pour vous accompagner dans vos projets de travaux : aides financières, rénovation énergétique, choix d'un artisan et bien plus."}
            </p>
          </div>
        </div>

        {/* Guides list */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Nos guides</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide) => (
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
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {guide.title}
                      </h3>
                      {guide.badge && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${guide.badgeColor}`}>
                          {guide.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{guide.description}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                      Lire le guide <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Related pages */}
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{"Ressources complémentaires"}</h2>
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
