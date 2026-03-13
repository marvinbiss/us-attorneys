import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  HelpCircle,
  ArrowRight,
  Building2,
  Hammer,
  Home,
  Zap,
  Flame,
  Shield,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/diagnostics-immobiliers`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Diagnostics Immobiliers Obligatoires : Le Guide Complet",
  description:
    "Liste des 10 diagnostics immobiliers obligatoires en 2026 : DPE, amiante, plomb, termites, électricité, gaz. Quand les réaliser, durée de validité et prix.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Diagnostics Immobiliers Obligatoires : Le Guide Complet",
    description:
      "Tous les diagnostics immobiliers obligatoires pour la vente ou la location : DPE, amiante, plomb, termites, gaz, électricité.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Diagnostics Immobiliers Obligatoires : Le Guide Complet",
    description:
      "Tous les diagnostics immobiliers obligatoires pour la vente ou la location : DPE, amiante, plomb, termites, gaz, électricité.",
  },
}

const diagnostics = [
  {
    name: "DPE (Diagnostic de Performance Énergétique)",
    icon: Flame,
    obligatoire: "Vente et location",
    validite: "10 ans",
    prix: "100 – 250 €",
    description:
      "Classe le logement de A à G selon sa consommation énergétique et ses émissions de CO₂. Depuis 2025, les logements classés G sont interdits à la location. Les logements F seront interdits en 2028.",
  },
  {
    name: "Diagnostic amiante",
    icon: AlertTriangle,
    obligatoire: "Vente (permis avant 01/07/1997)",
    validite: "Illimitée si absence, 3 ans si présence",
    prix: "80 – 150 €",
    description:
      "Recherche de matériaux contenant de l'amiante (flocages, faux plafonds, dalles de sol, canalisations). Obligatoire pour les bâtiments dont le permis de construire date d'avant le 1er juillet 1997.",
  },
  {
    name: "Diagnostic plomb (CREP)",
    icon: Shield,
    obligatoire: "Vente et location (avant 01/01/1949)",
    validite: "Illimitée si absence, 1 an (vente) / 6 ans (location)",
    prix: "100 – 250 €",
    description:
      "Constat de Risque d'Exposition au Plomb dans les peintures. Obligatoire pour les logements construits avant le 1er janvier 1949. En cas de présence supérieure au seuil (1 mg/cm²), des travaux de suppression sont recommandés.",
  },
  {
    name: "Diagnostic termites",
    icon: AlertTriangle,
    obligatoire: "Vente (zones à risque arrêté préfectoral)",
    validite: "6 mois",
    prix: "100 – 200 €",
    description:
      "Recherche de la présence de termites et insectes xylophages dans le bâtiment. Obligatoire dans les zones délimitées par arrêté préfectoral (Sud-Ouest, littoral atlantique, DOM-TOM notamment).",
  },
  {
    name: "Diagnostic électricité",
    icon: Zap,
    obligatoire: "Vente et location (installation > 15 ans)",
    validite: "3 ans (vente) / 6 ans (location)",
    prix: "100 – 200 €",
    description:
      "Évalue l'état de l'installation électrique intérieure. Vérifie l'appareil de coupure générale, la prise de terre, les protections (disjoncteurs, différentiels) et l'absence de matériels vétustes.",
  },
  {
    name: "Diagnostic gaz",
    icon: Flame,
    obligatoire: "Vente et location (installation > 15 ans)",
    validite: "3 ans (vente) / 6 ans (location)",
    prix: "100 – 200 €",
    description:
      "Évalue l'état de l'installation intérieure de gaz. Contrôle la tuyauterie fixe, le raccordement des appareils, la ventilation des locaux et la combustion. Les anomalies DGI (Danger Grave et Immédiat) entraînent une coupure de gaz.",
  },
  {
    name: "ERP (État des Risques et Pollutions)",
    icon: AlertTriangle,
    obligatoire: "Vente et location",
    validite: "6 mois",
    prix: "Gratuit (formulaire en ligne sur Géorisques)",
    description:
      "Informe l'acquéreur ou le locataire des risques naturels (inondation, sismicité), miniers, technologiques et de pollution des sols auxquels le bien est exposé. À remplir sur le site gouvernemental Géorisques.",
  },
  {
    name: "Diagnostic assainissement non collectif",
    icon: Home,
    obligatoire: "Vente (assainissement individuel)",
    validite: "3 ans",
    prix: "100 – 200 €",
    description:
      "Contrôle du bon fonctionnement de l'installation d'assainissement non collectif (fosse septique, micro-station). Réalisé par le SPANC (Service Public d'Assainissement Non Collectif) de la commune.",
  },
  {
    name: "Diagnostic bruit",
    icon: Building2,
    obligatoire: "Vente et location (zones exposées aéroport)",
    validite: "Pas de durée (information)",
    prix: "Gratuit (formulaire en ligne)",
    description:
      "Obligatoire si le bien est situé dans une zone d'exposition au bruit d'un aérodrome définie par un Plan d'Exposition au Bruit (PEB). Il s'agit d'un simple document d'information, pas d'un diagnostic technique.",
  },
  {
    name: "Diagnostic mérule",
    icon: AlertTriangle,
    obligatoire: "Vente (zones à risque arrêté préfectoral)",
    validite: "6 mois",
    prix: "200 – 400 €",
    description:
      "Recherche de la présence du champignon mérule qui dégrade le bois. Obligatoire dans les zones délimitées par arrêté préfectoral (Bretagne, Normandie, Nord principalement). Information obligatoire dans le compromis de vente.",
  },
]

const services = [
  { label: "Diagnostiqueur immobilier", href: "/services/diagnostiqueur-immobilier", icon: FileCheck },
  { label: "Électricien", href: "/services/electricien", icon: Zap },
  { label: "Plombier chauffagiste", href: "/services/plombier", icon: Flame },
  { label: "Couvreur", href: "/services/couvreur", icon: Home },
  { label: "Rénovation intérieure", href: "/services/renovation-interieure", icon: Hammer },
]

const faqItems = [
  {
    question: "Quels diagnostics sont obligatoires pour une vente en 2026 ?",
    answer:
      "Pour une vente en 2026, les diagnostics obligatoires sont : le DPE, le diagnostic électricité (si > 15 ans), le diagnostic gaz (si > 15 ans), l'ERP, le diagnostic amiante (si permis avant 07/1997), le CREP plomb (si construit avant 1949), les termites (si zone à risque), l'assainissement non collectif (si fosse septique), le bruit (si zone PEB aéroport) et la mérule (si zone à risque). Le nombre varie selon l'âge et la localisation du bien.",
  },
  {
    question: "Quels diagnostics sont obligatoires pour une location ?",
    answer:
      "Pour une mise en location, le Dossier de Diagnostic Technique (DDT) comprend : le DPE, l'ERP, le diagnostic électricité (si > 15 ans), le diagnostic gaz (si > 15 ans), le CREP plomb (si avant 1949) et le diagnostic bruit (si zone PEB). L'amiante des parties privatives doit être tenu à disposition du locataire.",
  },
  {
    question: "Combien coûte un pack diagnostics complet ?",
    answer:
      "Un pack diagnostics complet pour une vente (DPE + amiante + plomb + électricité + gaz + ERP + termites) coûte entre 400 et 800 € pour un appartement, et 500 à 1 000 € pour une maison. Les prix varient selon la surface, l'ancienneté du bien et la région. Demandez toujours plusieurs devis.",
  },
  {
    question: "Qui peut réaliser les diagnostics immobiliers ?",
    answer:
      "Les diagnostics immobiliers doivent être réalisés par un diagnostiqueur certifié par un organisme accrédité COFRAC. La certification est spécifique à chaque diagnostic (DPE, amiante, plomb, etc.) et doit être renouvelée tous les 7 ans. Le diagnostiqueur doit également disposer d'une assurance responsabilité civile professionnelle.",
  },
  {
    question: "Que se passe-t-il si un diagnostic est manquant ou périmé lors de la vente ?",
    answer:
      "Si un diagnostic obligatoire est absent ou périmé au moment de la signature du compromis, l'acquéreur peut demander l'annulation de la vente ou une réduction du prix. Le vendeur ne pourra pas se prévaloir de la clause d'exonération des vices cachés. En cas de DPE mensonger, le vendeur risque 300 000 € d'amende et 2 ans de prison.",
  },
  {
    question: "Le DPE est-il opposable ?",
    answer:
      "Oui, depuis le 1er juillet 2021, le DPE est opposable juridiquement. Si la classe énergétique indiquée est erronée, l'acquéreur ou le locataire peut engager la responsabilité du vendeur/bailleur et du diagnostiqueur. Le DPE est devenu un document contractuel avec des conséquences juridiques réelles, notamment pour les passoires thermiques (F et G).",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Diagnostics immobiliers" },
]

export default function DiagnosticsImmobiliersPage() {
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
        name: "Diagnostics immobiliers",
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
            <FileCheck className="w-4 h-4" />
            Guide diagnostics immobiliers
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Diagnostics immobiliers obligatoires : le guide complet"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Vente, location ou travaux : découvrez les 10 diagnostics immobiliers obligatoires, leur durée de validité, leur coût et qui peut les réaliser."}
          </p>
        </section>

        {/* Tableau récapitulatif */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Tableau récapitulatif des 10 diagnostics
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Diagnostic</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Obligatoire</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Validité</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Prix moyen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {diagnostics.map((d) => (
                    <tr key={d.name}>
                      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{d.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{d.obligatoire}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{d.validite}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{d.prix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Détail de chaque diagnostic */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Détail de chaque diagnostic
          </h2>
          <div className="space-y-6">
            {diagnostics.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{d.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm mb-3">
                        <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" /> {d.validite}
                        </span>
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                          {d.prix}
                        </span>
                      </div>
                      <p className="text-gray-600">{d.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Quand réaliser les diagnostics */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Quand réaliser vos diagnostics ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Vente</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Avant la publication de l'annonce (le DPE doit figurer sur l'annonce)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Annexés au compromis de vente"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"À charge du vendeur"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Avant la mise en location (DPE sur l'annonce obligatoire)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Annexés au bail de location"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"À charge du bailleur"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Travaux</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Diagnostic amiante avant travaux (DAT) obligatoire si permis avant 07/1997"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Diagnostic plomb avant travaux si construit avant 1949"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Responsabilité du maître d'ouvrage (propriétaire)"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Qui peut réaliser */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              Qui peut réaliser les diagnostics ?
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"Les diagnostics immobiliers doivent être réalisés par un diagnostiqueur certifié, à l'exception de l'ERP et du diagnostic bruit qui sont des formulaires à remplir par le propriétaire."}
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Certification COFRAC</strong> — chaque diagnostic requiert une certification spécifique, renouvelée tous les 7 ans</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Assurance RC professionnelle</strong> — le diagnostiqueur doit être assuré pour sa responsabilité civile</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Indépendance</strong> — le diagnostiqueur ne doit avoir aucun lien avec le vendeur, l{"'"}agent immobilier ou l{"'"}artisan qui réalisera les travaux</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Vérification</strong> — consultez l{"'"}annuaire officiel des diagnostiqueurs certifiés sur le site du ministère de la Transition écologique</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un professionnel
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Diagnostiqueurs certifiés et artisans pour les travaux de mise en conformité."}
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
            <Link href="/guides/aides-renovation-2026" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Aides rénovation 2026"}</h3>
              <p className="text-sm text-gray-500">{"Toutes les aides pour financer vos travaux de mise aux normes."}</p>
            </Link>
            <Link href="/guides/normes-electriques" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Normes électriques NF C 15-100"}</h3>
              <p className="text-sm text-gray-500">{"Guide complet de la norme électrique pour la mise aux normes."}</p>
            </Link>
            <Link href="/guides/devis-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Comment comparer les devis des diagnostiqueurs."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur les diagnostics immobiliers
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
              {"Besoin de diagnostics immobiliers ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez un diagnostiqueur certifié près de chez vous et recevez un devis pour l'ensemble de vos diagnostics."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/diagnostiqueur-immobilier"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un diagnostiqueur"}
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
