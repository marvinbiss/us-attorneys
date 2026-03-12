import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Euro,
  CheckCircle2,
  Calculator,
  Home,
  ArrowRight,
  HelpCircle,
  Info,
  TrendingDown,
  Banknote,
  Percent,
  Wallet,
  Building2,
  Accessibility,
  Layers,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/aides-renovation-2026`

export const metadata: Metadata = {
  title: "Aides Rénovation Énergétique 2026 — Guide Complet",
  description:
    "Guide complet des aides à la rénovation énergétique en 2026 : MaPrimeRénov', CEE, éco-PTZ, TVA 5,5 %, chèque énergie, aides locales. Montants, conditions et cumul des aides.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Toutes les Aides à la Rénovation Énergétique en 2026",
    description:
      "Guide exhaustif des aides financières pour rénover votre logement en 2026 : montants, conditions, cumul possible.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Toutes les Aides à la Rénovation Énergétique en 2026",
    description:
      "Guide exhaustif des aides financières pour rénover votre logement en 2026 : montants, conditions, cumul possible.",
  },
}

const aides = [
  {
    nom: "MaPrimeRénov' parcours accompagné",
    icon: Home,
    montant: "Jusqu'à 63 000 €",
    conditions: "Résidence principale > 15 ans, gain de 2 classes DPE minimum, audit énergétique obligatoire",
    cumulable: "CEE, éco-PTZ, chèque énergie",
    lien: "/guides/maprimerenov-2026",
    couleur: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    nom: "MaPrimeRénov' par geste",
    icon: Banknote,
    montant: "300 à 11 000 € par geste",
    conditions: "Résidence principale > 15 ans (2 ans pour les chaudières gaz), artisan RGE obligatoire",
    cumulable: "CEE, éco-PTZ, chèque énergie",
    lien: "/guides/maprimerenov-2026",
    couleur: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    nom: "CEE (Certificats d'Économie d'Énergie)",
    icon: TrendingDown,
    montant: "500 à 4 000 €",
    conditions: "Logement > 2 ans, travaux réalisés par un professionnel RGE, toutes résidences",
    cumulable: "MaPrimeRénov', éco-PTZ, TVA 5,5 %",
    lien: null,
    couleur: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    nom: "Éco-PTZ (prêt à taux zéro)",
    icon: Percent,
    montant: "Jusqu'à 50 000 €",
    conditions: "Logement > 2 ans, résidence principale, sans condition de revenus, durée max 20 ans",
    cumulable: "MaPrimeRénov', CEE, TVA 5,5 %, chèque énergie",
    lien: null,
    couleur: "bg-green-50 text-green-700 border-green-200",
  },
  {
    nom: "TVA réduite à 5,5 %",
    icon: Percent,
    montant: "Réduction automatique",
    conditions: "Logement > 2 ans, travaux de rénovation énergétique, appliquée directement sur la facture",
    cumulable: "Toutes les autres aides",
    lien: null,
    couleur: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    nom: "Chèque énergie",
    icon: Wallet,
    montant: "48 à 277 €/an",
    conditions: "Envoyé automatiquement selon le revenu fiscal de référence, sans démarche nécessaire",
    cumulable: "Toutes les autres aides",
    lien: null,
    couleur: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    nom: "Aides locales (régions, départements)",
    icon: Building2,
    montant: "Variable selon collectivité",
    conditions: "Dépendent de chaque région, département ou commune. Consultez l'ANIL ou votre mairie.",
    cumulable: "MaPrimeRénov', CEE, éco-PTZ",
    lien: null,
    couleur: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    nom: "MaPrimeAdapt'",
    icon: Accessibility,
    montant: "Jusqu'à 22 000 €",
    conditions: "Adaptation du logement pour le maintien à domicile : seniors (60+), handicap, perte d'autonomie",
    cumulable: "Certaines aides locales",
    lien: null,
    couleur: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
]

const faqItems = [
  {
    question: "Quelles sont les principales aides à la rénovation énergétique en 2026 ?",
    answer:
      "En 2026, les principales aides sont MaPrimeRénov' (parcours accompagné et par geste), les Certificats d'Économie d'Énergie (CEE), l'éco-prêt à taux zéro (éco-PTZ) jusqu'à 50 000 €, la TVA réduite à 5,5 %, le chèque énergie et les aides des collectivités locales.",
  },
  {
    question: "Peut-on cumuler les aides à la rénovation ?",
    answer:
      "Oui, la plupart des aides sont cumulables entre elles. Par exemple, vous pouvez bénéficier de MaPrimeRénov' + CEE + éco-PTZ + TVA 5,5 % + chèque énergie pour un même projet de rénovation. Le montant total des aides est plafonné pour ne pas dépasser le coût des travaux.",
  },
  {
    question: "Faut-il un artisan RGE pour bénéficier des aides ?",
    answer:
      "Oui, pour MaPrimeRénov' et les CEE, il est obligatoire de faire appel à un artisan certifié RGE (Reconnu Garant de l'Environnement). Pour l'éco-PTZ et la TVA à 5,5 %, l'entreprise doit également être RGE pour les travaux de rénovation énergétique.",
  },
  {
    question: "Quelles sont les conditions de revenus pour MaPrimeRénov' en 2026 ?",
    answer:
      "MaPrimeRénov' est accessible à tous les propriétaires, sans condition de revenus maximale. Cependant, le montant de l'aide varie selon votre catégorie de revenus (très modestes, modestes, intermédiaires, supérieurs) et le gain énergétique obtenu. Les ménages aux revenus les plus modestes bénéficient des taux de financement les plus élevés.",
  },
  {
    question: "Comment demander l'éco-PTZ en 2026 ?",
    answer:
      "Pour obtenir un éco-PTZ, présentez les devis de vos travaux à votre banque (la liste des banques partenaires est disponible sur le site de la SGFGAS). Le prêt peut atteindre 50 000 € pour une rénovation globale, remboursable sur 20 ans. Aucune condition de revenus n'est requise.",
  },
  {
    question: "Les locataires peuvent-ils bénéficier des aides à la rénovation ?",
    answer:
      "Les locataires bénéficient du chèque énergie et de la TVA à 5,5 % (via le propriétaire). MaPrimeRénov' est réservée aux propriétaires (occupants ou bailleurs). Les CEE sont accessibles aux propriétaires. Le propriétaire bailleur peut bénéficier de MaPrimeRénov' pour un logement qu'il loue.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Aides rénovation 2026" },
]

export default function AidesRenovation2026Page() {
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
        name: "Aides rénovation énergétique 2026",
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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Toutes les Aides à la Rénovation Énergétique en 2026",
    description:
      "Guide complet des aides financières pour la rénovation énergétique en 2026 : MaPrimeRénov', CEE, éco-PTZ, TVA 5,5 %, chèque énergie.",
    url: PAGE_URL,
    datePublished: "2026-01-15",
    dateModified: "2026-03-10",
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icons/icon-512x512.png`,
      },
    },
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema, articleSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-blue-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Euro className="w-4 h-4" />
            Guide mis à jour — Mars 2026
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Toutes les Aides à la Rénovation Énergétique en 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"MaPrimeRénov', CEE, éco-PTZ, TVA à 5,5 %, chèque énergie, aides locales… Retrouvez toutes les aides disponibles, leurs montants, conditions d'éligibilité et comment les cumuler."}
          </p>
        </section>

        {/* Tableau récapitulatif */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Tableau récapitulatif des aides 2026
          </h2>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-bold text-gray-900">Aide</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-900">Montant max</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-900">Conditions principales</th>
                  <th className="text-left px-6 py-4 font-bold text-gray-900">Cumulable avec</th>
                </tr>
              </thead>
              <tbody>
                {aides.map((aide, index) => {
                  const Icon = aide.icon
                  return (
                    <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${aide.couleur.split(" ")[0]}`}>
                            <Icon className={`w-4 h-4 ${aide.couleur.split(" ")[1]}`} />
                          </div>
                          {aide.lien ? (
                            <Link href={aide.lien} className="font-semibold text-blue-700 hover:text-blue-900 transition-colors">
                              {aide.nom}
                            </Link>
                          ) : (
                            <span className="font-semibold text-gray-900">{aide.nom}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{aide.montant}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{aide.conditions}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{aide.cumulable}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-4">
            {aides.map((aide, index) => {
              const Icon = aide.icon
              return (
                <div key={index} className={`rounded-xl border p-5 ${aide.couleur}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5" />
                    {aide.lien ? (
                      <Link href={aide.lien} className="font-bold hover:underline">
                        {aide.nom}
                      </Link>
                    ) : (
                      <span className="font-bold">{aide.nom}</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Montant :</span> {aide.montant}</p>
                    <p><span className="font-semibold">Conditions :</span> {aide.conditions}</p>
                    <p><span className="font-semibold">Cumulable avec :</span> {aide.cumulable}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Comment cumuler les aides */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <Layers className="w-8 h-8 text-blue-600" />
            Comment cumuler les aides ?
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-700">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{"MaPrimeRénov'"}</h3>
                <p className="text-sm text-gray-600">{"Déposez votre dossier sur maprimerenov.gouv.fr avant le début des travaux"}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-amber-700">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Prime CEE</h3>
                <p className="text-sm text-gray-600">{"Signez l'offre CEE avec un fournisseur d'énergie avant d'accepter le devis de l'artisan"}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-green-700">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Éco-PTZ</h3>
                <p className="text-sm text-gray-600">{"Demandez l'éco-PTZ à votre banque pour financer le reste à charge à taux zéro"}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-purple-700">4</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">TVA 5,5 %</h3>
                <p className="text-sm text-gray-600">{"Automatiquement appliquée par l'artisan sur la facture des travaux éligibles"}</p>
              </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Important :</strong> {"La demande de CEE doit être faite avant la signature du devis. La demande MaPrimeRénov' doit être déposée avant le début des travaux. L'éco-PTZ peut être demandé jusqu'à 6 mois après la fin des travaux."}
              </p>
            </div>
          </div>
        </section>

        {/* Exemple chiffré */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            Exemple chiffré : rénovation globale
          </h2>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <p className="text-blue-100 mb-6 text-lg">
              {"Rénovation globale d'une maison individuelle (passage de DPE F à C) pour un ménage aux revenus modestes :"}
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-blue-500/40">
                <span className="text-blue-100 text-lg">{"Coût total des travaux"}</span>
                <span className="text-2xl font-bold">40 000 €</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-blue-500/40">
                <span className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  {"MaPrimeRénov' parcours accompagné"}
                </span>
                <span className="text-xl font-bold text-green-300">- 16 000 €</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-blue-500/40">
                <span className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  {"Prime CEE (fournisseur d'énergie)"}
                </span>
                <span className="text-xl font-bold text-green-300">- 3 000 €</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-blue-500/40">
                <span className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  Éco-PTZ : financement du reste à taux 0 %
                </span>
                <span className="text-xl font-bold text-green-300">21 000 € à 0 %</span>
              </div>
              <div className="flex items-center justify-between py-4 bg-white/10 rounded-xl px-4 mt-2">
                <span className="text-white text-lg font-semibold">Reste à charge effectif</span>
                <div className="text-right">
                  <span className="text-3xl font-extrabold">21 000 €</span>
                  <span className="block text-sm text-blue-200">financé à taux zéro sur 20 ans</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conditions d'éligibilité */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            {"Conditions d'éligibilité communes"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Résidence principale</h3>
              <p className="text-gray-600">
                {"La plupart des aides exigent que le logement soit votre résidence principale, occupé au moins 8 mois par an. Les propriétaires bailleurs peuvent aussi être éligibles à MaPrimeRénov'."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ancienneté du logement</h3>
              <p className="text-gray-600">
                {"Le logement doit être achevé depuis au moins 2 ans pour la TVA 5,5 %, les CEE et l'éco-PTZ. Pour MaPrimeRénov', l'ancienneté requise est de 15 ans (2 ans pour le remplacement d'une chaudière gaz)."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Euro className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Conditions de revenus</h3>
              <p className="text-gray-600">
                {"Les montants de MaPrimeRénov' varient selon vos revenus (4 catégories). L'éco-PTZ et la TVA 5,5 % sont sans conditions de revenus. Le chèque énergie est réservé aux ménages modestes."}
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur les aides 2026
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
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Lancez votre projet de rénovation énergétique"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans RGE qualifiés près de chez vous et obtenez un devis pour estimer le montant de vos aides."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/renovation-energetique"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                Trouver un artisan RGE
              </Link>
              <Link
                href="/outils/calculateur-prix"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                <Calculator className="w-5 h-5" />
                Estimer mes aides
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
