import { Metadata } from "next"
import Link from "next/link"
import {
  Euro,
  Users,
  Clock,
  ShieldCheck,
  Flame,
  Droplets,
  Wind,
  Home,
  Sun,
  FileSearch,
  ClipboardList,
  Search,
  UserCheck,
  FileText,
  Hammer,
  Receipt,
  ArrowRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  Zap,
  Building2,
  PiggyBank,
  BadgePercent,
  Landmark,
  CreditCard,
  HelpCircle,
} from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getFAQSchema } from "@/lib/seo/jsonld"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const revalidate = 86400

export const metadata: Metadata = {
  title: "MaPrimeRénov 2026 : Montants, Conditions et Guide",
  description:
    "Guide complet MaPrimeRénov 2026 : montants jusqu'à 70 000 €, conditions d'éligibilité, barèmes de revenus, parcours accompagné et par geste. Tout pour obtenir votre aide à la rénovation énergétique.",
  keywords: [
    "MaPrimeRénov 2026",
    "aide rénovation énergétique",
    "montant MaPrimeRénov",
    "prime rénovation énergétique",
    "MaPrimeRénov conditions",
    "MaPrimeRénov barème",
    "artisan RGE",
    "parcours accompagné",
    "rénovation globale",
  ],
  alternates: {
    canonical: `${SITE_URL}/guides/maprimerenov-2026`,
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  openGraph: {
    title: "MaPrimeRénov 2026 : Guide Complet, Montants et Conditions",
    description:
      "Tout savoir sur MaPrimeRénov en 2026 : montants, barèmes, conditions et démarches pour obtenir votre aide à la rénovation énergétique.",
    url: `${SITE_URL}/guides/maprimerenov-2026`,
    type: "article",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "MaPrimeRénov 2026 — Guide Complet | ServicesArtisans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MaPrimeRénov 2026 : Guide Complet",
    description:
      "Montants, conditions, barèmes et démarches MaPrimeRénov 2026. Le guide le plus complet.",
    images: [`${SITE_URL}/opengraph-image`],
  },
}

// ---------------------------------------------------------------------------
// FAQ Data
// ---------------------------------------------------------------------------

const faqItems = [
  {
    question: "MaPrimeRénov est-elle accessible à tous ?",
    answer:
      "Oui, depuis 2021, MaPrimeRénov est ouverte à tous les propriétaires, quels que soient leurs revenus. Cependant, le montant de l'aide varie selon la catégorie de revenus du foyer (très modestes, modestes, intermédiaires, supérieurs). Les propriétaires bailleurs sont également éligibles, dans la limite de 3 logements mis en location. Le logement doit être construit depuis au moins 15 ans (ou 2 ans pour un remplacement de chaudière fioul).",
  },
  {
    question: "Faut-il un artisan RGE ?",
    answer:
      "Oui, le recours à un artisan certifié RGE (Reconnu Garant de l'Environnement) est obligatoire pour bénéficier de MaPrimeRénov. Cette certification garantit les compétences de l'artisan en matière de rénovation énergétique. Vous pouvez vérifier la qualification RGE d'un artisan sur le site france-renov.gouv.fr ou sur ServicesArtisans. Attention : le devis doit être signé avec un artisan RGE AVANT le dépôt de votre dossier.",
  },
  {
    question: "Peut-on isoler ses murs avec MaPrimeRénov en 2026 ?",
    answer:
      "Depuis le 1er janvier 2025, les travaux d'isolation seuls (murs, toiture, plancher) ne sont plus éligibles au parcours par geste de MaPrimeRénov. L'isolation reste cependant finançable dans le cadre du parcours accompagné (rénovation globale avec un gain minimum de 2 classes DPE). Cette mesure vise à encourager les rénovations d'ampleur plutôt que les gestes isolés. Les Certificats d'Économie d'Énergie (CEE) restent disponibles pour financer l'isolation seule.",
  },
  {
    question: "Quel est le délai pour recevoir la prime ?",
    answer:
      "Le délai moyen pour recevoir MaPrimeRénov est de 4 à 6 mois après la fin des travaux. Ce délai comprend : l'instruction du dossier (environ 1 mois), la réalisation des travaux, puis le versement après envoi de la facture. Pour le parcours accompagné, une avance de 70 % peut être accordée aux ménages très modestes. Le virement est effectué directement sur votre compte bancaire par l'ANAH.",
  },
  {
    question: "Peut-on cumuler MaPrimeRénov avec les CEE ?",
    answer:
      "Oui, MaPrimeRénov est cumulable avec les Certificats d'Économie d'Énergie (CEE), aussi appelés « prime énergie ». Ce cumul permet de couvrir une part encore plus importante du coût des travaux. MaPrimeRénov est également cumulable avec l'éco-prêt à taux zéro (éco-PTZ), la TVA réduite à 5,5 %, les aides des collectivités locales et le chèque énergie. En revanche, le montant total des aides ne peut pas dépasser 100 % du coût des travaux.",
  },
  {
    question: "MaPrimeRénov est-elle disponible pour les copropriétés ?",
    answer:
      "Oui, MaPrimeRénov Copropriétés permet de financer les travaux de rénovation énergétique des parties communes. L'aide est versée directement au syndicat de copropriétaires. Elle peut couvrir jusqu'à 25 % du montant des travaux HT, avec un plafond de 25 000 € par logement. Un gain énergétique d'au moins 35 % est requis. Un bonus de 10 % est accordé pour les copropriétés « fragiles » ou en difficulté.",
  },
  {
    question: "Que faire si mon DPE est F ou G ?",
    answer:
      "Si votre logement est classé F ou G au DPE (passoire thermique), vous bénéficiez de conditions avantageuses. Depuis 2023, les logements F et G ont l'obligation de rénover pour pouvoir être loués. Le parcours accompagné de MaPrimeRénov offre un bonus « sortie de passoire » de +10 % pour atteindre au minimum la classe D. Les ménages très modestes peuvent ainsi obtenir jusqu'à 90 % de financement. L'audit énergétique est obligatoire avant la vente d'un logement F ou G.",
  },
  {
    question: "Comment trouver un artisan RGE près de chez moi ?",
    answer:
      "Pour trouver un artisan RGE qualifié, vous pouvez utiliser l'annuaire ServicesArtisans qui référence des milliers de professionnels certifiés dans toute la France. Vous pouvez également consulter l'annuaire officiel sur france-renov.gouv.fr. Pensez à demander plusieurs devis (au moins 3) pour comparer les offres. Vérifiez que la mention RGE figure bien sur le devis et que la certification est en cours de validité pour le type de travaux envisagé.",
  },
]

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const keyFigures = [
  {
    icon: Euro,
    value: "70 000 €",
    label: "Montant max (parcours accompagné)",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Users,
    value: "Tous les ménages",
    label: "Éligibles (sans condition de revenus pour certains travaux)",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Clock,
    value: "4-6 mois",
    label: "Délai moyen de versement",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: ShieldCheck,
    value: "Artisan RGE",
    label: "Requis pour toutes les demandes",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
]

const parcoursAccompagne = [
  { categorie: "Très modestes", taux: "80 %", plafond: "56 000 €", couleur: "bg-green-100 text-green-800" },
  { categorie: "Modestes", taux: "60 %", plafond: "42 000 €", couleur: "bg-blue-100 text-blue-800" },
  { categorie: "Intermédiaires", taux: "45 %", plafond: "31 500 €", couleur: "bg-amber-100 text-amber-800" },
  { categorie: "Supérieurs", taux: "30 %", plafond: "21 000 €", couleur: "bg-gray-100 text-gray-800" },
]

const parcoursGeste = [
  { travaux: "PAC air-eau", montant: "3 000 - 5 000 €", icon: Flame },
  { travaux: "PAC géothermique", montant: "5 000 - 11 000 €", icon: Zap },
  { travaux: "Chauffe-eau solaire", montant: "2 000 - 4 000 €", icon: Sun },
  { travaux: "Poêle à bois", montant: "1 000 - 1 800 €", icon: Flame },
  { travaux: "VMC double flux", montant: "2 500 €", icon: Wind },
]

const baremesIDF = [
  { personnes: "1 personne", tresModestes: "23 541 €", modestes: "28 657 €", intermediaires: "40 018 €" },
  { personnes: "2 personnes", tresModestes: "34 551 €", modestes: "42 058 €", intermediaires: "58 827 €" },
  { personnes: "3 personnes", tresModestes: "41 493 €", modestes: "50 513 €", intermediaires: "70 382 €" },
  { personnes: "4 personnes", tresModestes: "48 447 €", modestes: "58 981 €", intermediaires: "81 472 €" },
  { personnes: "5 personnes", tresModestes: "55 427 €", modestes: "67 473 €", intermediaires: "92 953 €" },
  { personnes: "Par pers. supp.", tresModestes: "+6 970 €", modestes: "+8 486 €", intermediaires: "+11 455 €" },
]

const baremesProvince = [
  { personnes: "1 personne", tresModestes: "17 009 €", modestes: "21 805 €", intermediaires: "30 549 €" },
  { personnes: "2 personnes", tresModestes: "24 875 €", modestes: "31 889 €", intermediaires: "44 907 €" },
  { personnes: "3 personnes", tresModestes: "29 917 €", modestes: "38 349 €", intermediaires: "54 071 €" },
  { personnes: "4 personnes", tresModestes: "34 948 €", modestes: "44 802 €", intermediaires: "63 235 €" },
  { personnes: "5 personnes", tresModestes: "40 002 €", modestes: "51 281 €", intermediaires: "72 400 €" },
  { personnes: "Par pers. supp.", tresModestes: "+5 045 €", modestes: "+6 462 €", intermediaires: "+9 165 €" },
]

const travauxEligibles = [
  {
    title: "Chauffage",
    description: "PAC air-eau, PAC géothermique, chaudière biomasse, poêle à granulés, poêle à bois",
    icon: Flame,
    parcours: "Geste & Accompagné",
  },
  {
    title: "Eau chaude",
    description: "Chauffe-eau solaire individuel, chauffe-eau thermodynamique",
    icon: Droplets,
    parcours: "Geste & Accompagné",
  },
  {
    title: "Ventilation",
    description: "VMC double flux",
    icon: Wind,
    parcours: "Geste & Accompagné",
  },
  {
    title: "Isolation",
    description: "Murs, toiture, planchers, combles",
    icon: Home,
    parcours: "Accompagné uniquement",
    warning: true,
  },
  {
    title: "Fenêtres",
    description: "Remplacement de fenêtres, portes-fenêtres",
    icon: Building2,
    parcours: "Accompagné uniquement",
    warning: true,
  },
  {
    title: "Audit énergétique",
    description: "Audit réglementaire pour le parcours accompagné",
    icon: FileSearch,
    parcours: "Accompagné",
  },
]

const etapesDemande = [
  {
    numero: 1,
    title: "Vérifier votre éligibilité",
    description: "Utilisez le simulateur sur maprimerenov.gouv.fr pour connaître vos droits selon vos revenus et votre projet.",
    icon: Search,
  },
  {
    numero: 2,
    title: "Trouver un artisan RGE",
    description: "Recherchez un professionnel certifié RGE sur ServicesArtisans ou sur france-renov.gouv.fr.",
    icon: UserCheck,
  },
  {
    numero: 3,
    title: "Créer un compte",
    description: "Inscrivez-vous sur maprimerenov.gouv.fr avec votre numéro fiscal et vos informations personnelles.",
    icon: ClipboardList,
  },
  {
    numero: 4,
    title: "Obtenir des devis",
    description: "Demandez au minimum 2 à 3 devis détaillés. Le devis doit mentionner la certification RGE de l'artisan.",
    icon: FileText,
  },
  {
    numero: 5,
    title: "Déposer le dossier AVANT les travaux",
    description: "Soumettez votre demande en ligne avec les devis. Attendez l'accord de l'ANAH avant de commencer les travaux.",
    icon: Hammer,
  },
  {
    numero: 6,
    title: "Réaliser les travaux et envoyer la facture",
    description: "Une fois les travaux terminés, téléversez la facture sur votre espace. Le versement intervient sous 4 à 6 mois.",
    icon: Receipt,
  },
]

const aidesCumulables = [
  {
    title: "CEE (Certificats d'Économie d'Énergie)",
    description: "Prime versée par les fournisseurs d'énergie. Cumulable avec MaPrimeRénov pour réduire davantage le reste à charge.",
    icon: Zap,
  },
  {
    title: "Éco-PTZ (prêt à taux zéro)",
    description: "Jusqu'à 50 000 € de prêt sans intérêt pour financer le reste à charge de vos travaux de rénovation.",
    icon: PiggyBank,
  },
  {
    title: "TVA réduite 5,5 %",
    description: "Taux réduit automatiquement appliqué par l'artisan pour les travaux d'amélioration énergétique.",
    icon: BadgePercent,
  },
  {
    title: "Aides locales",
    description: "Régions, départements et communes proposent souvent des aides complémentaires. Consultez votre mairie ou l'ADIL.",
    icon: Landmark,
  },
  {
    title: "Chèque énergie",
    description: "Aide annuelle de 48 à 277 € pour les ménages modestes, utilisable pour payer les travaux de rénovation.",
    icon: CreditCard,
  },
]

// ---------------------------------------------------------------------------
// Table of contents
// ---------------------------------------------------------------------------

const tocItems = [
  { id: "quest-ce-que", label: "Qu'est-ce que MaPrimeRénov' ?" },
  { id: "parcours", label: "Les deux parcours 2026" },
  { id: "baremes", label: "Barèmes de revenus 2026" },
  { id: "travaux", label: "Travaux éligibles" },
  { id: "demarches", label: "Comment faire sa demande ?" },
  { id: "cumul", label: "Cumul avec d'autres aides" },
  { id: "faq", label: "Questions fréquentes" },
]

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MaPrimeRenov2026Page() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: "MaPrimeRénov 2026", url: "/guides/maprimerenov-2026" },
  ])

  const faqSchema = getFAQSchema(faqItems)

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "MaPrimeRénov 2026 : Guide Complet des Aides à la Rénovation Énergétique",
    description:
      "Guide complet MaPrimeRénov 2026 : montants, conditions, barèmes de revenus, parcours accompagné et par geste, démarches.",
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
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/guides/maprimerenov-2026`,
    },
    image: `${SITE_URL}/opengraph-image`,
    inLanguage: "fr-FR",
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema, articleSchema]} />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb
              items={[
                { label: "Guides", href: "/guides" },
                { label: "MaPrimeRénov 2026" },
              ]}
            />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-green-50 via-emerald-50/30 to-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Mis à jour mars 2026
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-heading leading-tight">
              {"MaPrimeRénov' 2026 : Guide Complet des Aides à la Rénovation Énergétique"}
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl">
              {"Jusqu'à "}
              <span className="font-semibold text-green-700">90 % de vos travaux financés</span>
              {". Découvrez les montants, conditions et démarches pour obtenir MaPrimeRénov en 2026."}
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Key figures */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-6 mb-12">
            {keyFigures.map((fig) => (
              <div
                key={fig.label}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${fig.bg} mb-3`}>
                  <fig.icon className={`w-5 h-5 ${fig.color}`} />
                </div>
                <div className={`text-xl md:text-2xl font-bold ${fig.color}`}>{fig.value}</div>
                <div className="text-xs text-gray-500 mt-1">{fig.label}</div>
              </div>
            ))}
          </div>

          {/* Table of contents */}
          <nav className="bg-white rounded-xl border border-gray-200 p-6 mb-12">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sommaire</h2>
            <ol className="grid md:grid-cols-2 gap-2">
              {tocItems.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-2 text-gray-700 hover:text-green-700 transition-colors py-1"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-50 text-green-700 text-xs font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Section: Qu'est-ce que MaPrimeRénov' ? */}
          <section id="quest-ce-que" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-6">
              {"Qu'est-ce que MaPrimeRénov' ?"}
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                {"MaPrimeRénov' est la principale aide de l'État français pour la rénovation énergétique des logements. Gérée par l'Agence nationale de l'habitat (ANAH), elle a remplacé le crédit d'impôt pour la transition énergétique (CITE) et les aides « Habiter Mieux » de l'ANAH depuis le 1er janvier 2020."}
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                {"En 2026, MaPrimeRénov' poursuit sa montée en puissance avec deux parcours distincts : le parcours accompagné pour les rénovations globales, et le parcours par geste pour les interventions ciblées sur le chauffage, l'eau chaude et la ventilation. L'objectif est d'accélérer la rénovation du parc immobilier français et de lutter contre les passoires thermiques (logements classés F et G au DPE)."}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {"Tous les propriétaires sont éligibles, qu'ils soient occupants ou bailleurs, sans condition de revenus pour certains travaux. Le montant de l'aide varie en fonction de la catégorie de revenus du foyer, du type de travaux et du parcours choisi."}
              </p>
            </div>
          </section>

          {/* Section: Les deux parcours */}
          <section id="parcours" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-6">
              Les deux parcours en 2026
            </h2>

            {/* Parcours accompagné */}
            <div className="bg-white rounded-xl border-2 border-green-200 p-6 md:p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Parcours accompagné</h3>
                  <p className="text-sm text-green-700 font-medium">Rénovation globale</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    {"Le parcours accompagné est le plus avantageux. Il permet de financer l'ensemble des travaux de rénovation (isolation, chauffage, ventilation, fenêtres) en une seule opération avec un accompagnateur Rénov' (MAR) obligatoire."}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Gain minimum de 2 classes DPE exigé</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Accompagnateur Rénov' (MAR) obligatoire</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{"Plafond de travaux : 70 000 € HT"}</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{"Bonus sortie de passoire thermique : +10 %"}</span>
                </li>
              </ul>

              {/* Tableau parcours accompagné */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border border-green-100">Catégorie de revenus</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700 border border-green-100">Taux de financement</th>
                      <th className="text-center p-3 text-sm font-semibold text-gray-700 border border-green-100">Plafond aide</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcoursAccompagne.map((row) => (
                      <tr key={row.categorie} className="hover:bg-gray-50">
                        <td className="p-3 border border-gray-100">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.couleur}`}>
                            {row.categorie}
                          </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-gray-900 border border-gray-100">{row.taux}</td>
                        <td className="p-3 text-center font-semibold text-green-700 border border-gray-100">{row.plafond}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 bg-amber-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Bonus sortie de passoire :</strong> +10 % supplémentaires si le logement passe de F ou G à au minimum la classe D. Les ménages très modestes peuvent ainsi atteindre 90 % de financement.
                  </p>
                </div>
              </div>
            </div>

            {/* Parcours par geste */}
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Hammer className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Parcours par geste</h3>
                  <p className="text-sm text-blue-700 font-medium">Mono-geste ciblé</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    <strong>Changement majeur depuis 2025 :</strong> {"l'isolation seule (murs, toiture, plancher) n'est plus éligible au parcours par geste. Seuls les travaux de chauffage, eau chaude sanitaire et ventilation sont concernés."}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                {"Le parcours par geste permet de financer un équipement spécifique via des montants forfaitaires, sans obligation de rénovation globale. L'aide est versée sous forme d'un montant fixe qui varie selon le type d'équipement et la catégorie de revenus."}
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {parcoursGeste.map((item) => (
                  <div
                    key={item.travaux}
                    className="flex items-center gap-3 bg-blue-50/50 rounded-lg p-4 border border-blue-100"
                  >
                    <item.icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{item.travaux}</div>
                      <div className="text-blue-700 font-semibold text-sm">{item.montant}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section: Barèmes de revenus */}
          <section id="baremes" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-6">
              Barèmes de revenus 2026
            </h2>
            <p className="text-gray-600 mb-6">
              {"Les plafonds de revenus déterminent votre catégorie (très modestes, modestes, intermédiaires, supérieurs) et donc le montant de votre aide. Les revenus pris en compte sont le revenu fiscal de référence (RFR) de l'année N-1."}
            </p>

            {/* Île-de-France */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Île-de-France
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700 border border-gray-100">Composition du foyer</th>
                      <th className="text-center p-3 font-semibold text-gray-700 border border-gray-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">Très modestes</span>
                      </th>
                      <th className="text-center p-3 font-semibold text-gray-700 border border-gray-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">Modestes</span>
                      </th>
                      <th className="text-center p-3 font-semibold text-gray-700 border border-gray-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">Intermédiaires</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {baremesIDF.map((row) => (
                      <tr key={row.personnes} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900 border border-gray-100">{row.personnes}</td>
                        <td className="p-3 text-center text-gray-700 border border-gray-100">{row.tresModestes}</td>
                        <td className="p-3 text-center text-gray-700 border border-gray-100">{row.modestes}</td>
                        <td className="p-3 text-center text-gray-700 border border-gray-100">{row.intermediaires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Province */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-green-600" />
                Autres régions (Province)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700 border border-gray-100">Composition du foyer</th>
                      <th className="text-center p-3 font-semibold text-gray-700 border border-gray-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">Très modestes</span>
                      </th>
                      <th className="text-center p-3 font-semibold text-gray-700 border border-gray-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">Modestes</span>
                      </th>
                      <th className="text-center p-3 font-semibold text-gray-700 border border-gray-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">Intermédiaires</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {baremesProvince.map((row) => (
                      <tr key={row.personnes} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900 border border-gray-100">{row.personnes}</td>
                        <td className="p-3 text-center text-gray-700 border border-gray-100">{row.tresModestes}</td>
                        <td className="p-3 text-center text-gray-700 border border-gray-100">{row.modestes}</td>
                        <td className="p-3 text-center text-gray-700 border border-gray-100">{row.intermediaires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  {"Au-delà des plafonds « intermédiaires », vous êtes dans la catégorie « revenus supérieurs ». Vous restez éligible au parcours accompagné (30 % de financement) et à certains gestes du parcours par geste."}
                </p>
              </div>
            </div>
          </section>

          {/* Section: Travaux éligibles */}
          <section id="travaux" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-6">
              Travaux éligibles
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {travauxEligibles.map((travail) => (
                <div
                  key={travail.title}
                  className={`bg-white rounded-xl border p-5 ${
                    travail.warning ? "border-amber-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      travail.warning ? "bg-amber-50" : "bg-green-50"
                    }`}>
                      <travail.icon className={`w-5 h-5 ${travail.warning ? "text-amber-600" : "text-green-600"}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{travail.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{travail.description}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    travail.warning
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {travail.parcours}
                  </span>
                  {travail.warning && (
                    <div className="mt-3 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Non éligible en mono-geste depuis 2025
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section: Démarches */}
          <section id="demarches" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-6">
              Comment faire sa demande ?
            </h2>
            <div className="space-y-4">
              {etapesDemande.map((etape) => (
                <div
                  key={etape.numero}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {etape.numero}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <etape.icon className="w-4 h-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900">{etape.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{etape.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-red-50 rounded-xl border border-red-200 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Attention : ne commencez pas les travaux avant accord</h4>
                  <p className="text-sm text-red-800">
                    {"Vous devez impérativement attendre l'accusé de réception de votre dossier par l'ANAH avant de signer le devis définitif et de commencer les travaux. Tout chantier démarré avant le dépôt du dossier sera refusé."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Cumul */}
          <section id="cumul" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-6">
              Cumul avec d'autres aides
            </h2>
            <p className="text-gray-600 mb-6">
              {"MaPrimeRénov' est cumulable avec plusieurs autres dispositifs, ce qui permet de réduire considérablement votre reste à charge. Voici les principales aides complémentaires :"}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aidesCumulables.map((aide) => (
                <div
                  key={aide.title}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <aide.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{aide.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{aide.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-green-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  <strong>Règle importante :</strong> le cumul de toutes les aides ne peut pas dépasser 100 % du montant TTC des travaux. Pour les ménages très modestes en parcours accompagné, le reste à charge minimum est de 10 %.
                </p>
              </div>
            </div>
          </section>

          {/* Section: FAQ */}
          <section id="faq" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-6">
              Questions fréquentes
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <details
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 group"
                >
                  <summary className="flex items-center gap-3 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <HelpCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 flex-1">{faq.question}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-5 pl-13">
                    <p className="text-gray-600 leading-relaxed pl-8">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-heading mb-4">
              {"Trouvez un artisan RGE certifié"}
            </h2>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              {"Pour bénéficier de MaPrimeRénov', vous devez faire appel à un artisan certifié RGE. Trouvez un professionnel qualifié près de chez vous sur ServicesArtisans."}
            </p>
            <Link
              href="/services/renovation-energetique"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-6 py-3 rounded-lg hover:bg-green-50 transition-colors shadow-lg"
            >
              Rechercher un artisan RGE
              <ArrowRight className="w-5 h-5" />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
