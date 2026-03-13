import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Home,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  HelpCircle,
  ArrowRight,
  Building2,
  Hammer,
  Ruler,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/extension-maison`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Extension de Maison : Démarches, Prix et Conseils 2026",
  description:
    "Guide complet extension de maison 2026 : types d'extensions (latérale, surélévation, véranda), démarches administratives, prix au m² (800-2500€), matériaux et artisans.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Extension de Maison : Démarches, Prix et Conseils 2026",
    description:
      "Tout savoir pour agrandir votre maison : types d'extensions, démarches DP ou permis, prix par type et matériaux recommandés.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Extension de Maison : Démarches, Prix et Conseils 2026",
    description:
      "Tout savoir pour agrandir votre maison : types d'extensions, démarches DP ou permis, prix par type et matériaux recommandés.",
  },
}

const typesExtension = [
  {
    name: "Extension latérale",
    icon: Building2,
    prix: "1 200 – 2 200 €/m²",
    description:
      "Construction accolée au bâtiment existant, de plain-pied. Solution la plus courante quand le terrain le permet. Nécessite une ouverture dans le mur porteur existant.",
  },
  {
    name: "Surélévation",
    icon: Home,
    prix: "1 500 – 2 500 €/m²",
    description:
      "Ajout d'un étage complet ou partiel. Idéal en zone urbaine avec terrain limité. Requiert une étude de structure (charpente et fondations) et un architecte si la surface totale dépasse 150 m².",
  },
  {
    name: "Véranda",
    icon: Home,
    prix: "800 – 2 000 €/m²",
    description:
      "Extension vitrée, souvent en aluminium ou PVC. Apporte de la lumière naturelle. Attention à l'isolation thermique (double vitrage à contrôle solaire obligatoire pour le confort été/hiver).",
  },
  {
    name: "Aménagement sous-sol",
    icon: Hammer,
    prix: "800 – 1 500 €/m²",
    description:
      "Transformation d'un sous-sol existant en pièce habitable. Travaux d'étanchéité, ventilation, isolation et mise aux normes électriques indispensables. Hauteur minimale 2,20 m sous plafond.",
  },
]

const materiaux = [
  {
    name: "Parpaing",
    avantages: "Économique, solide, bonne inertie thermique",
    inconvenients: "Isolation complémentaire obligatoire, délais plus longs",
    prix: "1 000 – 1 800 €/m²",
  },
  {
    name: "Ossature bois",
    avantages: "Léger, rapide à monter, excellent bilan carbone, bon isolant naturel",
    inconvenients: "Entretien régulier du bardage, traitement anti-insectes",
    prix: "1 200 – 2 200 €/m²",
  },
  {
    name: "Métal / acier",
    avantages: "Design contemporain, grande portée sans poteau, rapidité",
    inconvenients: "Isolation acoustique et thermique à soigner, coût élevé",
    prix: "1 500 – 2 500 €/m²",
  },
]

const services = [
  { label: "Maçon", href: "/services/macon", icon: Building2 },
  { label: "Charpentier", href: "/services/charpentier", icon: Hammer },
  { label: "Architecte", href: "/services/architecte", icon: Ruler },
  { label: "Électricien", href: "/services/electricien", icon: Hammer },
  { label: "Plombier", href: "/services/plombier", icon: Hammer },
  { label: "Couvreur", href: "/services/couvreur", icon: Home },
]

const faqItems = [
  {
    question: "Faut-il un permis de construire pour une extension de maison ?",
    answer:
      "Cela dépend de la surface créée et de la zone. En zone PLU : déclaration préalable (DP) si l'extension fait entre 5 et 40 m² de surface de plancher, permis de construire au-delà de 40 m². Hors zone PLU : DP entre 5 et 20 m², permis au-delà. Dans tous les cas, si la surface totale après travaux dépasse 150 m², le recours à un architecte est obligatoire.",
  },
  {
    question: "Quel est le prix moyen d'une extension de maison ?",
    answer:
      "Le prix varie de 800 à 2 500 €/m² selon le type d'extension et les matériaux. Une véranda coûte 800 à 2 000 €/m², une extension maçonnée 1 200 à 2 200 €/m², et une surélévation 1 500 à 2 500 €/m². Ces prix incluent le gros œuvre, l'isolation, l'électricité et la plomberie, mais pas les finitions intérieures haut de gamme.",
  },
  {
    question: "Combien de temps durent les travaux d'extension ?",
    answer:
      "Comptez 3 à 6 mois pour une extension classique de 20 à 40 m². La surélévation prend généralement 4 à 8 mois. Une véranda peut être posée en 2 à 4 semaines. Ajoutez 2 à 3 mois pour les démarches administratives (instruction du permis ou de la DP) avant le démarrage des travaux.",
  },
  {
    question: "Quels artisans interviennent sur une extension de maison ?",
    answer:
      "Une extension mobilise plusieurs corps de métier : maçon (fondations, murs), charpentier (toiture), couvreur, électricien, plombier, plaquiste et peintre. Pour les projets importants, un maître d'œuvre ou un architecte coordonne l'ensemble du chantier et assure la conformité des travaux.",
  },
  {
    question: "L'extension de maison est-elle soumise à la RE2020 ?",
    answer:
      "Oui, depuis le 1er janvier 2022, toute extension de plus de 50 m² de surface de plancher sur un bâtiment existant doit respecter la RE2020 (réglementation environnementale). Pour les extensions de moins de 50 m², la réglementation thermique existant par élément (RT existant) s'applique : chaque composant (mur, vitrage, toiture) doit atteindre une performance minimale.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Extension de maison" },
]

export default function ExtensionMaisonPage() {
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
        name: "Guides",
        item: `${SITE_URL}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Extension de maison",
        item: PAGE_URL,
      },
    ],
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

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
            <Building2 className="w-4 h-4" />
            Guide extension de maison
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Extension de maison : démarches, prix et conseils 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Agrandir sa maison est un projet majeur. Découvrez les types d'extensions possibles, les démarches administratives, les prix au m² et les artisans à contacter."}
          </p>
        </section>

        {/* Types d'extensions */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            {"Les types d'extensions de maison"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {typesExtension.map((t) => {
              const Icon = t.icon
              return (
                <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                      <span className="text-sm font-medium text-blue-600">{t.prix}</span>
                    </div>
                  </div>
                  <p className="text-gray-600">{t.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Démarches administratives */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Démarches administratives
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Déclaration préalable (DP)</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Extension de 5 à 40 m² en zone PLU (5 à 20 m² hors PLU)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Formulaire Cerfa n°13703*09 à déposer en mairie"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Délai d'instruction : 1 mois (2 mois en secteur protégé)"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Permis de construire</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Extension > 40 m² en zone PLU (> 20 m² hors PLU)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Architecte obligatoire si surface totale > 150 m²"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Délai d'instruction : 2 mois (3 mois en secteur protégé)"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Prix par m² */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Prix au m² selon le type d{"'"}extension
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Prix / m²</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Pour 20 m²</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Délai moyen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Véranda aluminium</td>
                    <td className="px-6 py-4 text-gray-600">800 – 2 000 €</td>
                    <td className="px-6 py-4 text-gray-600">16 000 – 40 000 €</td>
                    <td className="px-6 py-4 text-gray-600">2 – 4 semaines</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Extension parpaing</td>
                    <td className="px-6 py-4 text-gray-600">1 200 – 1 800 €</td>
                    <td className="px-6 py-4 text-gray-600">24 000 – 36 000 €</td>
                    <td className="px-6 py-4 text-gray-600">3 – 5 mois</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Extension ossature bois</td>
                    <td className="px-6 py-4 text-gray-600">1 200 – 2 200 €</td>
                    <td className="px-6 py-4 text-gray-600">24 000 – 44 000 €</td>
                    <td className="px-6 py-4 text-gray-600">2 – 4 mois</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Surélévation</td>
                    <td className="px-6 py-4 text-gray-600">1 500 – 2 500 €</td>
                    <td className="px-6 py-4 text-gray-600">30 000 – 50 000 €</td>
                    <td className="px-6 py-4 text-gray-600">4 – 8 mois</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Sous-sol aménagé</td>
                    <td className="px-6 py-4 text-gray-600">800 – 1 500 €</td>
                    <td className="px-6 py-4 text-gray-600">16 000 – 30 000 €</td>
                    <td className="px-6 py-4 text-gray-600">2 – 4 mois</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Matériaux */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Comparatif des matériaux
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {materiaux.map((m) => (
              <div key={m.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{m.name}</h3>
                <p className="text-sm font-medium text-blue-600 mb-4">{m.prix}</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">Avantages</p>
                    <p className="text-sm text-gray-600">{m.avantages}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-700 mb-1">Inconvénients</p>
                    <p className="text-sm text-gray-600">{m.inconvenients}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Étapes du projet */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les étapes de votre projet d{"'"}extension
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <div>
                    <strong>Étude de faisabilité</strong>
                    <p className="mt-1">{"Consultez le PLU de votre commune pour connaître les règles d'urbanisme (COS, emprise au sol, hauteur maximale, recul par rapport aux limites séparatives). Faites réaliser une étude de sol si nécessaire."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <div>
                    <strong>Conception et devis</strong>
                    <p className="mt-1">{"Faites réaliser au minimum 3 devis détaillés par des professionnels différents. L'architecte est obligatoire si la surface totale après extension dépasse 150 m²."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <div>
                    <strong>Démarches administratives</strong>
                    <p className="mt-1">{"Déposez votre déclaration préalable ou permis de construire en mairie. Attendez l'autorisation avant de démarrer les travaux (1 à 3 mois)."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                  <div>
                    <strong>Travaux</strong>
                    <p className="mt-1">{"Gros œuvre (fondations, murs, toiture), puis second œuvre (isolation, électricité, plomberie) et finitions (revêtements, peinture). Durée typique : 3 à 6 mois."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">5</span>
                  <div>
                    <strong>Réception et déclaration</strong>
                    <p className="mt-1">{"Réceptionnez les travaux avec un procès-verbal. Déposez une déclaration d'achèvement des travaux (DAACT) en mairie dans les 90 jours. Pensez à mettre à jour votre assurance habitation et déclarer la nouvelle surface aux impôts."}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan pour votre extension
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Une extension mobilise plusieurs corps de métier. Trouvez les bons professionnels pour votre projet."}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {s.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
                </Link>
              )
            })}
          </div>
        </section>

        {/* Guides liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Guides complémentaires
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/permis-construire" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Permis de construire 2026"}</h3>
              <p className="text-sm text-gray-500">{"Quand le permis est obligatoire et comment l'obtenir."}</p>
            </Link>
            <Link href="/guides/declaration-prealable-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Déclaration préalable de travaux"}</h3>
              <p className="text-sm text-gray-500">{"Formulaire, délai et cas d'application."}</p>
            </Link>
            <Link href="/guides/garantie-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Vérifiez l'assurance décennale de vos artisans."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur l{"'"}extension de maison
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-blue-700 transition-colors">
                  {item.question}
                  <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform text-2xl">+</span>
                </summary>
                <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Prêt à agrandir votre maison ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans qualifiés près de chez vous et recevez des devis gratuits pour votre projet d'extension."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/macon"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un maçon"}
              </Link>
              <Link
                href="/devis"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                <FileCheck className="w-5 h-5" />
                Demander un devis gratuit
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
