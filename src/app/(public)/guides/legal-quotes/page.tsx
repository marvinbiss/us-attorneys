import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  FileText,
  AlertTriangle,
  Search,
  FileCheck,
  HelpCircle,
  ArrowRight,
  Scale,
  Euro,
  ClipboardList,
  ShieldCheck,
  Building2,
  Hammer,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/quotes-travaux`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Devis Travaux : Guide Complet pour Bien Comparer (2026)",
  description:
    "Comment obtenir et comparer des devis travaux : mentions obligatoires, nombre de devis à demander, négociation, pièges à éviter et conseils pour choisir le bon artisan.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Devis Travaux : Guide Complet pour Bien Comparer",
    description:
      "Guide complet pour obtenir, comparer et négocier vos devis travaux en 2026.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Devis Travaux : Guide Complet pour Bien Comparer",
    description:
      "Guide complet pour obtenir, comparer et négocier vos devis travaux en 2026.",
  },
}

const mentionsObligatoires = [
  {
    name: "Identité de l'entreprise",
    icon: Building2,
    description:
      "Nom, adresse, SIRET, numéro de TVA intracommunautaire, assurance décennale (nom de l'assureur et numéro de contrat). Ces informations doivent figurer en en-tête du devis.",
  },
  {
    name: "Description détaillée des travaux",
    icon: ClipboardList,
    description:
      "Nature et quantité de chaque prestation, marques et références des matériaux, surfaces ou métrés concernés. Plus le détail est précis, moins il y aura de litiges.",
  },
  {
    name: "Prix et conditions",
    icon: Euro,
    description:
      "Prix unitaire HT et TTC, taux de TVA appliqué (10 % ou 5,5 % selon les travaux), montant total, conditions de paiement (acompte, échéancier), durée de validité du devis.",
  },
  {
    name: "Délais et garanties",
    icon: Scale,
    description:
      "Date de début et durée prévisionnelle des travaux, pénalités de retard éventuelles, garanties applicables (décennale, biennale, parfait achèvement).",
  },
]

const services = [
  { label: "Plombier", href: "/practice-areas/plombier", icon: Hammer },
  { label: "Électricien", href: "/practice-areas/electricien", icon: Hammer },
  { label: "Maçon", href: "/practice-areas/macon", icon: Building2 },
  { label: "Peintre", href: "/practice-areas/peintre", icon: Hammer },
  { label: "Menuisier", href: "/practice-areas/menuisier", icon: Hammer },
  { label: "Rénovation intérieure", href: "/practice-areas/renovation-interieure", icon: Building2 },
]

const faqItems = [
  {
    question: "Combien de devis faut-il demander ?",
    answer:
      "Il est recommandé de demander au minimum 3 devis pour pouvoir comparer efficacement. Pour des travaux importants (rénovation complète, extension), 4 à 5 devis permettent d'avoir une vision plus juste du marché. Attention : au-delà de 5 devis, la comparaison devient difficile et vous risquez de perdre du temps.",
  },
  {
    question: "Un devis est-il payant ?",
    answer:
      "Le devis est généralement gratuit pour les travaux courants (plomberie, électricité, peinture). En revanche, un devis peut être facturé si l'artisan doit se déplacer loin, réaliser une étude technique approfondie ou produire des plans. Dans ce cas, le montant doit être annoncé avant le déplacement.",
  },
  {
    question: "Un devis signé engage-t-il ?",
    answer:
      "Oui, un devis signé par les deux parties vaut contrat. Il engage l'artisan à réaliser les travaux décrits au prix convenu, et le client à payer ce prix. Vous disposez d'un délai de rétractation de 14 jours uniquement si le devis a été signé à domicile suite à un démarchage.",
  },
  {
    question: "Quelle est la durée de validité d'un devis ?",
    answer:
      "La durée de validité est fixée par l'artisan sur le document (généralement 1 à 3 mois). Passé ce délai, l'artisan peut modifier ses prix. Si aucune durée n'est mentionnée, le devis reste valable un temps raisonnable (environ 3 mois selon la jurisprudence).",
  },
  {
    question: "Comment négocier un devis ?",
    answer:
      "Comparez les devis ligne par ligne, pas uniquement le total. Identifiez les écarts de prix sur les matériaux et la main-d'œuvre. Mentionnez les devis concurrents sans les montrer. Proposez un calendrier flexible (les artisans font de meilleurs prix en période creuse). Ne négociez jamais sur la qualité des matériaux.",
  },
  {
    question: "Quels sont les pièges à éviter sur un devis ?",
    answer:
      "Méfiez-vous des devis trop vagues (\"travaux de plomberie : forfait X €\"), des prix anormalement bas (risque de travaux bâclés ou de suppléments), de l'absence d'assurance décennale, des acomptes supérieurs à 30 % et des artisans qui refusent de fournir un devis écrit.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Devis travaux" },
]

export default function DevisTravauxPage() {
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
        name: "Devis travaux",
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

      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Guide devis travaux
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Devis travaux : guide complet pour bien comparer"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Obtenir plusieurs devis est la clé pour faire les bons choix. Découvrez les mentions obligatoires, comment comparer efficacement et les pièges à éviter."}
          </p>
        </section>

        {/* Mentions obligatoires */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les mentions obligatoires d{"'"}un devis
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {mentionsObligatoires.map((m) => {
              const Icon = m.icon
              return (
                <div key={m.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-amber-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                  </div>
                  <p className="text-gray-600">{m.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Combien de devis demander */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              {"Combien de devis demander ?"}
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"La règle d'or est de demander au minimum 3 devis. Cela vous permet de comparer les prix, les délais et les approches techniques de chaque artisan. Pour des chantiers importants (plus de 10 000 €), demandez 4 à 5 devis."}
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6 not-prose">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-700 mb-1">3</div>
                  <div className="text-sm text-green-800 font-medium">Minimum recommandé</div>
                  <div className="text-xs text-green-600 mt-1">Travaux courants</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-1">4-5</div>
                  <div className="text-sm text-blue-800 font-medium">Idéal</div>
                  <div className="text-xs text-blue-600 mt-1">{"Travaux > 10 000 €"}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-amber-700 mb-1">{"≤ 5"}</div>
                  <div className="text-sm text-amber-800 font-medium">Maximum utile</div>
                  <div className="text-xs text-amber-600 mt-1">Au-delà, trop complexe</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comment comparer */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Comment comparer les devis efficacement
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Méthode de comparaison</h3>
                <ol className="space-y-3 text-amber-50">
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                    <span>{"Vérifiez que les devis couvrent exactement le même périmètre de travaux"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                    <span>{"Comparez ligne par ligne : main-d'œuvre, matériaux, fournitures"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                    <span>{"Vérifiez les marques et références des matériaux proposés"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                    <span>{"Comparez les délais de réalisation et les conditions de paiement"}</span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">{"Pièges à éviter"}</h3>
                <ul className="space-y-3 text-amber-50">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Ne comparez jamais uniquement le prix total"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Méfiez-vous des prix anormalement bas (travaux bâclés)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Refusez les acomptes supérieurs à 30 %"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Vérifiez toujours l'assurance décennale"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Négociation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Conseils pour négocier un devis
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Jouez sur le calendrier</h3>
              <p className="text-gray-600">
                {"Les artisans sont plus enclins à négocier en période creuse (janvier-février, août). Proposer une date flexible peut vous faire économiser 5 à 15 %."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Groupez les travaux</h3>
              <p className="text-gray-600">
                {"Confier plusieurs travaux au même artisan permet souvent de négocier un prix global plus avantageux. La logistique est simplifiée pour lui, ce qui justifie une remise."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ne sacrifiez pas la qualité</h3>
              <p className="text-gray-600">
                {"Ne négociez jamais sur la qualité des matériaux ou la suppression de prestations essentielles. Économiser 500 € sur l'isolation peut coûter des milliers en chauffage."}
              </p>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Demander des devis par métier
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Trouvez des artisans qualifiés sur notre annuaire et demandez vos devis gratuitement."}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                    {s.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-amber-600 transition-colors" />
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
            <Link href="/guides/guarantee-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-amber-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Vérifiez que l'artisan est bien assuré avant de signer."}</p>
            </Link>
            <Link href="/guides/artisan-rge" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-amber-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors mb-1">{"Artisan RGE"}</h3>
              <p className="text-sm text-gray-500">{"Certification obligatoire pour les aides à la rénovation."}</p>
            </Link>
            <Link href="/guides/aides-renovation-2026" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-amber-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors mb-1">{"Aides rénovation 2026"}</h3>
              <p className="text-sm text-gray-500">{"Toutes les aides pour réduire le coût de vos travaux."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-amber-600" />
            Questions fréquentes sur les devis travaux
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-amber-700 transition-colors">
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
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Prêt à demander vos devis ?"}
            </h2>
            <p className="text-amber-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans qualifiés près de chez vous et comparez gratuitement leurs devis."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 bg-white text-amber-700 px-8 py-3.5 rounded-xl font-bold hover:bg-amber-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un artisan"}
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-400 transition-colors border border-amber-400"
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
