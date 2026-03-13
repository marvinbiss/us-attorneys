import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Search,
  FileCheck,
  Flame,
  Zap,
  Sun,
  Wind,
  TreePine,
  Building2,
  ArrowRight,
  HelpCircle,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/artisan-rge`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Artisan RGE : Trouver un Pro Certifié (2026)",
  description:
    "Tout savoir sur la certification RGE (Reconnu Garant de l'Environnement) : comment vérifier un artisan RGE, les qualifications Qualibat, QualiPAC, QualiSol et comment bénéficier des aides MaPrimeRénov'.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Artisan RGE : Vérifier et Trouver un Professionnel Certifié",
    description:
      "Guide complet sur la certification RGE : vérification, qualifications et aides financières accessibles.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Artisan RGE : Vérifier et Trouver un Professionnel Certifié",
    description:
      "Guide complet sur la certification RGE : vérification, qualifications et aides financières accessibles.",
  },
}

const qualifications = [
  {
    name: "RGE Qualibat",
    icon: Building2,
    description:
      "Qualification pour les travaux du bâtiment : isolation, menuiseries, toiture. Délivrée par l'organisme Qualibat pour les entreprises du gros et second œuvre.",
    travaux: "Isolation thermique, menuiseries, toiture, façade",
  },
  {
    name: "RGE QualiPAC",
    icon: Wind,
    description:
      "Certification spécifique aux pompes à chaleur (PAC) aérothermiques et géothermiques. Garantit la maîtrise de l'installation et de la mise en service.",
    travaux: "Pompes à chaleur air/eau, air/air, géothermiques",
  },
  {
    name: "RGE QualiSol",
    icon: Sun,
    description:
      "Qualification pour l'installation de systèmes solaires thermiques : chauffe-eau solaires individuels (CESI) et systèmes solaires combinés (SSC).",
    travaux: "Chauffe-eau solaire, chauffage solaire combiné",
  },
  {
    name: "RGE QualiPV",
    icon: Zap,
    description:
      "Certification pour l'installation de panneaux photovoltaïques. Couvre la pose, le raccordement et la mise en service des installations solaires électriques.",
    travaux: "Panneaux solaires photovoltaïques, onduleurs",
  },
  {
    name: "RGE Qualifelec",
    icon: Zap,
    description:
      "Qualification délivrée par Qualifelec pour les travaux d'efficacité énergétique liés aux installations électriques, bornes de recharge et domotique.",
    travaux: "Installations électriques, bornes de recharge, domotique",
  },
  {
    name: "RGE Qualibois",
    icon: TreePine,
    description:
      "Certification pour l'installation d'appareils de chauffage au bois : poêles à bois, poêles à granulés, chaudières biomasse et inserts.",
    travaux: "Poêles à bois/granulés, chaudières bois, inserts",
  },
]

const services = [
  { label: "Chauffagiste", href: "/services/chauffagiste", icon: Flame },
  { label: "Électricien", href: "/services/electricien", icon: Zap },
  { label: "Isolation thermique", href: "/services/isolation-thermique", icon: Building2 },
  { label: "Pompe à chaleur", href: "/services/pompe-a-chaleur", icon: Wind },
  { label: "Panneaux solaires", href: "/services/panneaux-solaires", icon: Sun },
  { label: "Rénovation énergétique", href: "/services/renovation-energetique", icon: ShieldCheck },
]

const faqItems = [
  {
    question: "Qu'est-ce qu'un artisan RGE ?",
    answer:
      "Un artisan RGE (Reconnu Garant de l'Environnement) est un professionnel du bâtiment dont les compétences en matière de rénovation énergétique ont été validées par un organisme accrédité (Qualibat, QualiENR, Qualifelec). Cette certification est renouvelée tous les 4 ans avec un audit de chantier.",
  },
  {
    question: "Est-il obligatoire de choisir un artisan RGE ?",
    answer:
      "Oui, faire appel à un artisan RGE est obligatoire pour bénéficier des aides financières à la rénovation énergétique : MaPrimeRénov', les Certificats d'Économie d'Énergie (CEE), l'éco-prêt à taux zéro et la TVA réduite à 5,5 % sur les travaux de rénovation énergétique.",
  },
  {
    question: "Comment vérifier qu'un artisan est bien RGE ?",
    answer:
      "Vous pouvez vérifier la certification RGE d'un artisan sur le site officiel France Rénov' (france-renov.gouv.fr) en entrant son nom ou son numéro SIRET. Vous pouvez également demander à l'artisan de vous présenter son certificat, qui mentionne la date de validité et le domaine de qualification.",
  },
  {
    question: "Combien coûte un artisan RGE par rapport à un artisan classique ?",
    answer:
      "Les tarifs d'un artisan RGE sont généralement comparables à ceux d'un artisan non certifié, avec un écart de 5 à 15 % selon les travaux. Cet éventuel surcoût est largement compensé par les aides financières accessibles uniquement avec un professionnel RGE.",
  },
  {
    question: "Quelle est la durée de validité de la certification RGE ?",
    answer:
      "La certification RGE est valide pour une durée de 4 ans. Pendant cette période, l'artisan fait l'objet d'un audit de suivi (contrôle de chantier) pour vérifier que les travaux réalisés respectent les normes de qualité requises.",
  },
  {
    question: "Un artisan peut-il perdre sa certification RGE ?",
    answer:
      "Oui, un artisan peut perdre sa certification RGE en cas de non-conformité lors d'un audit de chantier, de non-renouvellement à l'échéance des 4 ans, ou de manquements graves aux règles de l'art. Il est donc important de vérifier la validité de la certification avant de signer un devis.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Artisan RGE" },
]

export default function ArtisanRGEPage() {
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
        name: "Artisan RGE",
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

      <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Guide certification RGE
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Artisan RGE : Comment Vérifier et Trouver un Professionnel Certifié"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"La certification RGE est indispensable pour bénéficier des aides à la rénovation énergétique. Découvrez comment vérifier qu'un artisan est RGE et trouvez le bon professionnel pour vos travaux."}
          </p>
        </section>

        {/* Qu'est-ce que la certification RGE */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              {"Qu'est-ce que la certification RGE ?"}
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"La mention RGE (Reconnu Garant de l'Environnement) est une certification délivrée aux professionnels du bâtiment qui justifient de compétences reconnues en matière de rénovation énergétique et d'installation d'équipements utilisant les énergies renouvelables."}
              </p>
              <p>
                {"Cette certification est délivrée par des organismes accrédités par le COFRAC (Comité français d'accréditation) :"}
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Qualibat</strong> — pour les entreprises du bâtiment (isolation, menuiseries, toiture)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>QualiENR / Qualit{"'"}ENR</strong> — pour les installateurs d{"'"}énergies renouvelables (solaire, bois, PAC)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <span><strong>Qualifelec</strong> — pour les entreprises d{"'"}installations électriques</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pourquoi choisir un artisan RGE */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            {"Pourquoi choisir un artisan RGE ?"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Accès aux aides financières</h3>
              <p className="text-gray-600">
                {"Obligatoire pour bénéficier de MaPrimeRénov', des Certificats d'Économie d'Énergie (CEE), de l'éco-prêt à taux zéro (éco-PTZ) et de la TVA à 5,5 %."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Garantie de compétence</h3>
              <p className="text-gray-600">
                {"L'artisan RGE a suivi des formations spécifiques et ses chantiers sont audités régulièrement. Vous avez l'assurance de travaux réalisés dans les règles de l'art."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Performance garantie</h3>
              <p className="text-gray-600">
                {"Les travaux réalisés par un artisan RGE permettent d'atteindre les niveaux de performance énergétique exigés par les réglementations en vigueur."}
              </p>
            </div>
          </div>
        </section>

        {/* Les différentes qualifications RGE */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les différentes qualifications RGE
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {qualifications.map((q) => {
              const Icon = q.icon
              return (
                <div key={q.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-green-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{q.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{q.description}</p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Travaux couverts :</span> {q.travaux}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Comment vérifier un artisan RGE */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              {"Comment vérifier qu'un artisan est RGE ?"}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Sur le site officiel France Rénov{"'"}</h3>
                <ol className="space-y-3 text-green-50">
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                    <span>{"Rendez-vous sur france-renov.gouv.fr/annuaire-rge"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                    <span>{"Entrez le nom de l'entreprise ou son numéro SIRET"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                    <span>{"Vérifiez la date de validité et le domaine de qualification"}</span>
                  </li>
                </ol>
                <a
                  href="https://france-renov.gouv.fr/annuaire-rge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 bg-white text-green-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {"Annuaire officiel France Rénov'"}
                </a>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Sur ServicesArtisans</h3>
                <p className="text-green-50 mb-4">
                  {"Utilisez notre outil de vérification pour consulter le profil détaillé d'un artisan : SIRET, qualification RGE, avis clients et coordonnées."}
                </p>
                <Link
                  href="/verifier-artisan"
                  className="inline-flex items-center gap-2 bg-white text-green-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  {"Vérifier un artisan"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trouver un artisan RGE par métier */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan RGE par métier
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Consultez notre annuaire pour trouver un professionnel certifié RGE dans votre domaine de travaux."}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-300 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    {s.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
                </Link>
              )
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-green-600" />
            Questions fréquentes sur les artisans RGE
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-green-700 transition-colors">
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
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Besoin d'un artisan RGE pour vos travaux ?"}
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des professionnels certifiés près de chez vous et demandez un devis gratuit pour vos travaux de rénovation énergétique."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verifier-artisan"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-8 py-3.5 rounded-xl font-bold hover:bg-green-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Vérifier un artisan"}
              </Link>
              <Link
                href="/devis"
                className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-green-400 transition-colors border border-green-400"
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
