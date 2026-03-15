import { Metadata } from "next"
import Link from "next/link"
import {
  FileText,
  Clock,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  Scale,
  Building2,
  AlertTriangle,
  Ruler,
  Euro,
  Paintbrush,
} from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getFAQSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Déclaration Préalable de Travaux : Guide 2026",
  description:
    "Guide complet déclaration préalable de travaux 2026 : quand est-elle nécessaire (5-20m², façade, clôture, piscine), formulaire Cerfa 13703, délai d\"instruction d\"un mois et accord tacite.",
  keywords: [
    "déclaration préalable de travaux",
    "déclaration préalable travaux 2026",
    "formulaire déclaration préalable",
    "Cerfa 13703",
    "déclaration préalable piscine",
    "déclaration préalable clôture",
    "déclaration préalable façade",
    "autorisation urbanisme",
    "accord tacite déclaration préalable",
  ],
  alternates: {
    canonical: `${SITE_URL}/guides/declaration-prealable-travaux`,
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  openGraph: {
    title: "Déclaration Préalable de Travaux : Guide et Formulaire 2026",
    description:
      "Tout savoir sur la déclaration préalable : cas concernés, formulaire Cerfa, délai d\"instruction et accord tacite.",
    url: `${SITE_URL}/guides/declaration-prealable-travaux`,
    type: "article",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Déclaration Préalable de Travaux — Guide 2026 | ServicesArtisans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Déclaration Préalable de Travaux 2026",
    description:
      "Quand déposer une déclaration préalable, formulaire Cerfa, délais et accord tacite. Guide complet.",
    images: [`${SITE_URL}/opengraph-image`],
  },
}

// ---------------------------------------------------------------------------
// FAQ Data
// ---------------------------------------------------------------------------

const faqItems = [
  {
    question: "Quelle est la différence entre une déclaration préalable et un permis de construire ?",
    answer:
      "La déclaration préalable concerne les travaux de faible à moyenne importance : entre 5 et 20 m² de surface créée (ou 40 m² en zone PLU), modification de façade, pose de clôture, piscine de moins de 100 m². Le permis de construire est exigé pour les projets plus importants : construction neuve de plus de 20 m², extension de plus de 40 m² en zone PLU, changement de destination avec modification de structure. La déclaration préalable a un délai d\"instruction d\"un mois (contre 2-3 mois pour le permis) et un dossier simplifié.",
  },
  {
    question: "Que se passe-t-il si je ne fais pas de déclaration préalable ?",
    answer:
      "Réaliser des travaux sans déclaration préalable constitue une infraction au Code de l\"urbanisme. Vous risquez une amende de 1 200 à 6 000 € par m² de surface construite ou aménagée irrégulièrement. La mairie peut exiger la mise en conformité ou la remise en état des lieux. Le délai de prescription est de 6 ans pour les poursuites pénales. De plus, en cas de revente, l\"absence de déclaration peut poser des problèmes avec le notaire et l\"acheteur.",
  },
  {
    question: "Comment savoir si ma commune est couverte par un PLU ?",
    answer:
      "La très grande majorité des communes françaises (environ 87 %) sont couvertes par un Plan Local d\"Urbanisme (PLU ou PLUi intercommunal). Pour le vérifier, consultez le site du Géoportail de l\"urbanisme (www.geoportail-urbanisme.gouv.fr) ou contactez le service urbanisme de votre mairie. Le PLU détermine les règles de constructibilité (hauteur, emprise au sol, implantation, aspect extérieur) et influe sur les seuils de surface applicables.",
  },
  {
    question: "La déclaration préalable est-elle gratuite ?",
    answer:
      "Oui, le dépôt de la déclaration préalable en mairie est totalement gratuit. Aucun frais de dossier n\"est perçu. Cependant, vous devrez peut-être payer la taxe d\"aménagement si vos travaux créent de la surface de plancher (le taux varie selon la commune). Si vous faites appel à un professionnel pour constituer le dossier (plans, notice descriptive), comptez entre 500 et 2 000 € selon la complexité du projet.",
  },
  {
    question: "Peut-on déposer une déclaration préalable en ligne ?",
    answer:
      "Oui, depuis le 1er janvier 2022, toutes les communes doivent permettre le dépôt en ligne des demandes d\"autorisation d\"urbanisme, y compris la déclaration préalable. Vous pouvez utiliser le portail national www.service-public.fr ou le portail d\"urbanisme de votre commune si elle en dispose. Le dépôt en ligne simplifie le suivi de votre dossier et vous recevez un accusé de réception électronique immédiat. Le dépôt papier en mairie reste toutefois possible.",
  },
]

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const keyFigures = [
  {
    icon: Ruler,
    value: "5-20 m²",
    label: "Surface de plancher (ou 5-40 m² en zone PLU)",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Clock,
    value: "1 mois",
    label: "Délai d\"instruction",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: FileText,
    value: "Cerfa 13703",
    label: "Formulaire de demande",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Euro,
    value: "Gratuit",
    label: "Dépôt de la déclaration",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
]

const casConcernes = [
  {
    title: "Extension de 5 à 20 m² (ou 5 à 40 m² en zone PLU)",
    desc: "Agrandissement, véranda, abri de jardin, garage : si la surface créée est comprise entre 5 et 20 m² (ou 40 m² en zone PLU), une déclaration préalable suffit, à condition que la surface totale après travaux ne dépasse pas 150 m².",
    icon: Building2,
    color: "bg-blue-50",
  },
  {
    title: "Modification de façade ou de toiture",
    desc: "Changement de fenêtres, de volets, de matériaux de façade, de couleur de ravalement, remplacement de la toiture par un matériau différent, création d\"une ouverture (fenêtre, porte). Ces travaux modifient l\"aspect extérieur du bâtiment.",
    icon: Paintbrush,
    color: "bg-amber-50",
  },
  {
    title: "Pose de clôture",
    desc: "En secteur protégé (abords de monument historique, site classé, secteur sauvegardé), toute clôture nécessite une déclaration préalable. Hors secteur protégé, vérifiez le PLU de votre commune car certaines imposent également cette formalité.",
    icon: Scale,
    color: "bg-green-50",
  },
  {
    title: "Piscine de 10 à 100 m²",
    desc: "Les piscines dont le bassin a une superficie comprise entre 10 et 100 m² nécessitent une déclaration préalable. Au-delà de 100 m², un permis de construire est obligatoire. Les piscines de moins de 10 m² sont dispensées de formalités (hors secteur protégé).",
    icon: Ruler,
    color: "bg-cyan-50",
  },
  {
    title: "Changement de destination sans modification de structure",
    desc: "Transformer un commerce en habitation, un garage en chambre, un bureau en logement, sans toucher à la structure porteuse ni à la façade. Si des modifications de structure sont nécessaires, un permis de construire sera exigé.",
    icon: Building2,
    color: "bg-purple-50",
  },
  {
    title: "Construction légère (5-20 m²)",
    desc: "Abri de jardin, pergola, carport, serre de jardin : si la surface est comprise entre 5 et 20 m² et la hauteur ne dépasse pas 12 m, la déclaration préalable est suffisante.",
    icon: ClipboardList,
    color: "bg-orange-50",
  },
]

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function DeclarationPrealablePage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: "Déclaration Préalable de Travaux", url: "/guides/declaration-prealable-travaux" },
  ])
  const faqSchema = getFAQSchema(faqItems)

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb
              items={[
                { label: "Guides", href: "/guides" },
                { label: "Déclaration Préalable de Travaux" },
              ]}
            />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-green-50 to-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-4">
              <Scale className="w-4 h-4" />
              <span>{"Réglementation & Urbanisme"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-heading">
              {"Déclaration Préalable de Travaux : Guide et Formulaire 2026"}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              {"La déclaration préalable de travaux est une autorisation d\"urbanisme simplifiée, obligatoire pour de nombreux projets : extension, modification de façade, clôture, piscine. Ce guide vous explique quand elle est nécessaire, comment remplir le formulaire et les délais à respecter."}
            </p>
            <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
              <span>{"Mis à jour : mars 2026"}</span>
              <span>{"•"}</span>
              <span>{"Temps de lecture : 10 min"}</span>
            </div>
          </div>
        </div>

        {/* Key figures */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {keyFigures.map((fig) => (
              <div key={fig.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${fig.bg} mb-2`}>
                  <fig.icon className={`w-5 h-5 ${fig.color}`} />
                </div>
                <div className={`text-xl font-bold ${fig.color}`}>{fig.value}</div>
                <div className="text-xs text-gray-500 mt-1">{fig.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Table of contents */}
          <nav className="bg-white rounded-xl border border-gray-200 p-6 mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{"Sommaire"}</h2>
            <ol className="space-y-2 text-sm">
              {[
                "Quand la déclaration préalable est-elle nécessaire ?",
                "Différence avec le permis de construire",
                "Comment remplir le formulaire (Cerfa 13703*10)",
                "Pièces à joindre au dossier",
                "Délai d\"instruction et accord tacite",
                "Questions fréquentes",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Section 1: When required */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Quand la déclaration préalable est-elle nécessaire ?"}
              </h2>
            </div>

            <div className="space-y-4">
              {casConcernes.map((cas) => (
                <div key={cas.title} className={`bg-white rounded-xl border border-gray-200 p-5`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 ${cas.color} rounded-lg flex items-center justify-center`}>
                      <cas.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{cas.title}</h3>
                      <p className="text-sm text-gray-600">{cas.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Difference with permis */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
                <Scale className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Différence avec le permis de construire"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Critère"}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Déclaration préalable"}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Permis de construire"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { critere: "Surface créée", dp: "5 à 20 m² (40 m² en zone PLU)", pc: "> 20 m² (> 40 m² en zone PLU)" },
                      { critere: "Délai d\"instruction", dp: "1 mois", pc: "2 à 3 mois" },
                      { critere: "Formulaire", dp: "Cerfa 13703*10", pc: "Cerfa 13406*12 ou 13409*12" },
                      { critere: "Accord tacite", dp: "Oui, après 1 mois sans réponse", pc: "Oui, après 2-3 mois sans réponse" },
                      { critere: "Architecte obligatoire", dp: "Non", pc: "Oui si surface totale > 150 m²" },
                      { critere: "Affichage sur le terrain", dp: "Oui, pendant 2 mois", pc: "Oui, pendant toute la durée du chantier" },
                      { critere: "Recours des tiers", dp: "2 mois après affichage", pc: "2 mois après affichage" },
                    ].map((row) => (
                      <tr key={row.critere} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{row.critere}</td>
                        <td className="py-3 px-4 text-gray-700">{row.dp}</td>
                        <td className="py-3 px-4 text-gray-700">{row.pc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-blue-50 border-t border-blue-200">
                <p className="text-sm text-blue-800">
                  <Link href="/guides/permis-construire" className="inline-flex items-center gap-1 font-medium hover:underline">
                    {"Consultez notre guide complet sur le permis de construire"} <ArrowRight className="w-3 h-3" />
                  </Link>
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: How to fill out */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Comment remplir le formulaire (Cerfa 13703*10)"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"Le formulaire Cerfa n° 13703*10 est le document officiel pour déposer une déclaration préalable de travaux (hors maison individuelle). Pour une maison individuelle ou ses annexes, utilisez le Cerfa n° 13703*10. Voici les rubriques à remplir :"}
              </p>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Identité du demandeur",
                    desc: "Nom, prénom, adresse, téléphone. Si plusieurs demandeurs (copropriétaires), tous doivent être mentionnés. En cas de recours à un mandataire, joindre la procuration.",
                  },
                  {
                    step: "2",
                    title: "Localisation du terrain",
                    desc: "Adresse complète, références cadastrales (section et numéro de parcelle). Ces informations sont disponibles sur cadastre.gouv.fr. Indiquer la superficie totale du terrain.",
                  },
                  {
                    step: "3",
                    title: "Description du projet",
                    desc: "Nature des travaux (extension, clôture, modification de façade, etc.), surface de plancher créée ou modifiée, matériaux utilisés, hauteur de la construction. Cocher les cases correspondantes dans le formulaire.",
                  },
                  {
                    step: "4",
                    title: "Surface de plancher et emprise au sol",
                    desc: "Indiquer les surfaces existantes avant travaux et les surfaces projetées après travaux. La différence détermine si vous êtes dans le cadre de la déclaration préalable (< 20 ou 40 m²) ou si un permis de construire est nécessaire.",
                  },
                  {
                    step: "5",
                    title: "Date et signature",
                    desc: "Signer et dater le formulaire. Joindre les pièces obligatoires. Le dossier doit être déposé en 2 exemplaires minimum (3 en secteur protégé). Conserver un exemplaire tamponné par la mairie comme preuve de dépôt.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>{"Téléchargement :"}</strong>{" le formulaire Cerfa 13703*10 est téléchargeable gratuitement sur service-public.fr. Vous pouvez également le retirer en mairie ou le remplir directement en ligne sur le portail d\"urbanisme de votre commune."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Required documents */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Pièces à joindre au dossier"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"Le dossier de déclaration préalable doit comprendre les pièces suivantes (selon la nature des travaux) :"}
              </p>
              <div className="space-y-3">
                {[
                  { code: "DP1", label: "Plan de situation du terrain (toujours obligatoire)", obligatoire: true },
                  { code: "DP2", label: "Plan de masse coté dans les 3 dimensions (si création de surface ou modification d\"emprise)", obligatoire: true },
                  { code: "DP3", label: "Plan en coupe du terrain et de la construction (si création de surface)", obligatoire: false },
                  { code: "DP4", label: "Plan des façades et des toitures (si modification de l\"aspect extérieur)", obligatoire: true },
                  { code: "DP5", label: "Représentation de l\"aspect extérieur (photo ou dessin du projet)", obligatoire: false },
                  { code: "DP6", label: "Document graphique d\"insertion paysagère", obligatoire: false },
                  { code: "DP7", label: "Photographie de l\"environnement proche", obligatoire: true },
                  { code: "DP8", label: "Photographie de l\"environnement lointain", obligatoire: true },
                ].map((doc) => (
                  <div key={doc.code} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="inline-flex items-center justify-center min-w-[48px] h-7 bg-green-100 text-green-700 text-xs font-mono font-semibold rounded">
                      {doc.code}
                    </span>
                    <span className="text-sm text-gray-700 flex-1">{doc.label}</span>
                    {doc.obligatoire && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        {"Obligatoire"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>{"Conseil :"}</strong>{" des pièces complémentaires peuvent être demandées en secteur protégé (avis de l\"ABF). Renseignez-vous auprès du service urbanisme de votre mairie pour connaître les pièces spécifiques à votre commune."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Timeline and tacit approval */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Délai d\"instruction et accord tacite"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{"Délais selon la situation"}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">{"1 mois"}</div>
                      <p className="text-sm text-gray-600">{"Délai standard en zone ordinaire"}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">{"2 mois"}</div>
                      <p className="text-sm text-gray-600">{"En secteur protégé (abords de monument historique)"}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">{"+ 1 mois"}</div>
                      <p className="text-sm text-gray-600">{"Si pièces complémentaires demandées"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{"Accord tacite : un droit fondamental"}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {"Si la mairie ne vous a pas répondu dans le délai d\"instruction (1 ou 2 mois), votre déclaration préalable est réputée acceptée. C\"est l\"accord tacite (ou « non-opposition »). Pour en obtenir la preuve :"}
                  </p>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600">{"1."}</span>
                      <span>{"Envoyez une lettre recommandée à la mairie demandant une attestation de non-opposition."}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600">{"2."}</span>
                      <span>{"La mairie doit vous répondre sous 15 jours. Sans réponse, l\"accord tacite est définitivement acquis."}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600">{"3."}</span>
                      <span>{"Affichez la décision (ou l\"attestation de non-opposition) sur votre terrain pendant 2 mois."}</span>
                    </li>
                  </ol>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{"Attention : le retrait de la décision"}</h3>
                    <p className="text-sm text-gray-600">
                      {"La mairie peut retirer une décision de non-opposition (y compris tacite) dans les 3 mois suivant la date de la décision, si elle estime que celle-ci a été obtenue par fraude ou qu\"elle est illégale. C\"est pourquoi il est important de constituer un dossier complet et conforme au PLU."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{"Questions fréquentes"}</h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <summary className="flex items-center gap-3 p-5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                    <span className="font-medium text-gray-900">{faq.question}</span>
                  </summary>
                  <div className="px-5 pb-5 pl-13 text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-3">
                {"Besoin d\"un professionnel pour vos travaux ?"}
              </h2>
              <p className="text-green-100 mb-6 max-w-2xl">
                {"Trouvez un maçon ou un façadier qualifié près de chez vous pour réaliser vos travaux de construction, extension ou rénovation de façade."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/practice-areas/macon"
                  className="inline-flex items-center gap-2 bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  {"Trouver un maçon"} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/practice-areas/facades"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-400 transition-colors"
                >
                  {"Trouver un façadier"} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Related guides */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{"Guides connexes"}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/guides/permis-construire"
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                  {"Permis de Construire 2026"}
                </h3>
                <p className="text-sm text-gray-500">{"Quand est-il obligatoire ? Documents, délais et coûts."}</p>
              </Link>
              <Link
                href="/guides/regulations-electriques"
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                  {"Normes Électriques NF C 15-100"}
                </h3>
                <p className="text-sm text-gray-500">{"Guide des normes électriques pour les particuliers."}</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
