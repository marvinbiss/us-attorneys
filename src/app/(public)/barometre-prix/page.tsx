import { Metadata } from "next"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Euro,
  MapPin,
  BarChart3,
  Users,
  Calendar,
  ArrowRight,
  Shield,
  FileText,
  HelpCircle,
} from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getFAQSchema } from "@/lib/seo/jsonld"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import {
  servicePricings,
  regionalIndices,
  getPrixMoyenNational,
  getVariationMoyenne,
  getNombreMetiers,
  getNombreRegions,
} from "@/lib/data/barometre"
import type { ServicePricing, RegionalIndex, InterventionPricing } from "@/lib/data/barometre"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Baromètre des Prix de l'Artisanat 2026 — Tarifs, Tendances et Indices Régionaux",
  description:
    "Baromètre des prix de l'artisanat en France 2026 : tarifs moyens de 10 métiers du bâtiment, indices régionaux, tendances et évolution des prix. Données actualisées pour plombier, électricien, maçon, couvreur et plus.",
  alternates: {
    canonical: `${SITE_URL}/barometre-prix`,
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  openGraph: {
    title: "Baromètre des Prix de l'Artisanat 2026",
    description:
      "Tarifs moyens, indices régionaux et tendances pour 10 métiers du bâtiment en France. Données complètes et actualisées.",
    url: `${SITE_URL}/barometre-prix`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Baromètre des Prix de l'Artisanat 2026 — ServicesArtisans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baromètre des Prix de l'Artisanat 2026",
    description:
      "Tarifs moyens, indices régionaux et tendances pour 10 métiers du bâtiment en France.",
    images: [`${SITE_URL}/opengraph-image`],
  },
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const faqItems = [
  {
    question: "Comment sont calculés les prix du baromètre ?",
    answer:
      "Les prix affichés sont des fourchettes moyennes observées sur le territoire français en 2026. Ils sont calculés à partir de devis réels collectés auprès de professionnels référencés, pondérés par zone géographique et type de prestation. Ces tarifs incluent la main-d'oeuvre mais pas nécessairement les fournitures, sauf mention contraire.",
  },
  {
    question: "Pourquoi les prix varient-ils selon les régions ?",
    answer:
      "L'indice régional reflète les écarts de coût de la vie, de densité de professionnels et de demande locale. L'Île-de-France affiche un indice de 130 (30 % au-dessus de la moyenne) en raison du coût immobilier et de la forte demande, tandis que des régions comme les Hauts-de-France ou le Centre-Val de Loire se situent à 90 (10 % en dessous). Les DOM-TOM présentent des indices élevés liés aux coûts d'acheminement des matériaux.",
  },
  {
    question: "À quelle fréquence le baromètre est-il mis à jour ?",
    answer:
      "Le baromètre est actualisé chaque trimestre avec les dernières données collectées. Les tendances annuelles sont recalculées en début d'année civile. La dernière mise à jour date de mars 2026.",
  },
  {
    question: "Les prix incluent-ils la TVA et les fournitures ?",
    answer:
      "Les prix affichés sont TTC (toutes taxes comprises). La TVA appliquée est de 10 % pour les travaux de rénovation dans un logement de plus de 2 ans et de 20 % pour les constructions neuves. Les fournitures ne sont pas incluses sauf mention explicite. Le taux réduit de 5,5 % s'applique aux travaux d'amélioration énergétique.",
  },
  {
    question: "Comment obtenir un devis précis pour mes travaux ?",
    answer:
      "Le baromètre fournit des fourchettes indicatives. Pour obtenir un prix précis, demandez au moins 3 devis auprès de professionnels qualifiés. Sur ServicesArtisans, vous pouvez comparer les artisans de votre zone et demander des devis gratuits directement en ligne.",
  },
]

// ---------------------------------------------------------------------------
// Service icons mapping
// ---------------------------------------------------------------------------

const serviceIcons: Record<string, string> = {
  plombier: "\uD83D\uDD27",
  electricien: "\u26A1",
  serrurier: "\uD83D\uDD11",
  chauffagiste: "\uD83D\uDD25",
  "peintre-en-batiment": "\uD83C\uDFA8",
  carreleur: "\uD83E\uDDF1",
  menuisier: "\uD83E\uDE9A",
  couvreur: "\uD83C\uDFE0",
  macon: "\uD83C\uDFD7\uFE0F",
  plaquiste: "\uD83D\uDCD0",
}

// ---------------------------------------------------------------------------
// Helper components (inline, server-compatible)
// ---------------------------------------------------------------------------

function TrendBadge({ tendance, variation }: { tendance: "hausse" | "stable" | "baisse"; variation: number }) {
  const config = {
    hausse: { icon: TrendingUp, color: "text-red-600 bg-red-50", label: "Hausse" },
    stable: { icon: Minus, color: "text-gray-600 bg-gray-100", label: "Stable" },
    baisse: { icon: TrendingDown, color: "text-green-600 bg-green-50", label: "Baisse" },
  }
  const { icon: Icon, color, label } = config[tendance]
  const sign = variation > 0 ? "+" : ""

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {sign}{variation} %
      <span className="sr-only">{label}</span>
    </span>
  )
}

function RegionCard({ region }: { region: RegionalIndex }) {
  let bgColor: string
  let borderColor: string
  let textColor: string

  if (region.index >= 120) {
    bgColor = "bg-red-50"
    borderColor = "border-red-200"
    textColor = "text-red-700"
  } else if (region.index >= 105) {
    bgColor = "bg-orange-50"
    borderColor = "border-orange-200"
    textColor = "text-orange-700"
  } else if (region.index >= 96) {
    bgColor = "bg-yellow-50"
    borderColor = "border-yellow-200"
    textColor = "text-yellow-700"
  } else {
    bgColor = "bg-green-50"
    borderColor = "border-green-200"
    textColor = "text-green-700"
  }

  return (
    <Link
      href={`/regions/${region.regionSlug}`}
      className={`block p-4 rounded-xl border ${borderColor} ${bgColor} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900 truncate">{region.region}</span>
        <TrendBadge tendance={region.tendance} variation={region.index - 100} />
      </div>
      <div className={`text-2xl font-bold ${textColor}`}>{region.index}</div>
      <div className="text-xs text-gray-500 mt-1">
        {region.index > 100
          ? `+${region.index - 100} % vs moyenne`
          : region.index < 100
            ? `${region.index - 100} % vs moyenne`
            : "Moyenne nationale"}
      </div>
    </Link>
  )
}

function ServiceCard({ sp }: { sp: ServicePricing }) {
  const icon = serviceIcons[sp.service] || "\uD83D\uDD27"
  const avgVariation =
    Math.round(
      (sp.interventions.reduce((sum: number, i: InterventionPricing) => sum + i.variation, 0) /
        sp.interventions.length) *
        10
    ) / 10
  const avgTendance: "hausse" | "stable" | "baisse" =
    avgVariation > 2 ? "hausse" : avgVariation < -1 ? "baisse" : "stable"

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
          <h3 className="text-lg font-bold text-gray-900">{sp.serviceName}</h3>
        </div>
        <TrendBadge tendance={avgTendance} variation={avgVariation} />
      </div>

      {/* Pricing table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-3 font-semibold text-gray-700">Intervention</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Prix min</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Prix max</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-center">Unité</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {sp.interventions.map((intervention: InterventionPricing, idx: number) => (
              <tr
                key={intervention.name}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              >
                <td className="px-6 py-3 text-gray-800">{intervention.name}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {intervention.prixMin.toLocaleString("fr-FR")} €
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {intervention.prixMax.toLocaleString("fr-FR")} €
                </td>
                <td className="px-4 py-3 text-center text-gray-500">/{intervention.unite}</td>
                <td className="px-4 py-3 text-right">
                  <TrendBadge tendance={intervention.tendance} variation={intervention.variation} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        <Link
          href={`/tarifs/${sp.service}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
        >
          Voir tous les tarifs {sp.serviceName.toLowerCase()}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BarometrePrixPage() {
  const prixMoyen = getPrixMoyenNational()
  const variationMoyenne = getVariationMoyenne()
  const nombreMetiers = getNombreMetiers()
  const nombreRegions = getNombreRegions()

  const metropolitaines = regionalIndices.filter(
    (r) => !["guadeloupe", "martinique", "guyane", "la-reunion", "mayotte"].includes(r.regionSlug)
  )
  const domTom = regionalIndices.filter((r) =>
    ["guadeloupe", "martinique", "guyane", "la-reunion", "mayotte"].includes(r.regionSlug)
  )

  // Schema.org
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: SITE_URL },
    { name: "Baromètre des prix", url: `${SITE_URL}/barometre-prix` },
  ])

  const faqSchema = getFAQSchema(faqItems)

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Baromètre des prix de l'artisanat en France 2026",
    description:
      "Données de tarification pour 10 métiers du bâtiment en France, incluant les fourchettes de prix par intervention, les indices régionaux et les tendances annuelles. Couvre 18 régions et territoires.",
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    temporalCoverage: "2026",
    spatialCoverage: {
      "@type": "Place",
      name: "France",
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    variableMeasured: [
      { "@type": "PropertyValue", name: "Prix minimum", unitText: "EUR" },
      { "@type": "PropertyValue", name: "Prix maximum", unitText: "EUR" },
      { "@type": "PropertyValue", name: "Indice régional", unitText: "index (base 100)" },
      { "@type": "PropertyValue", name: "Variation annuelle", unitText: "%" },
    ],
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema, datasetSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumb items={[{ label: "Baromètre des prix" }]} />
        </div>

        {/* ================================================================ */}
        {/* HERO */}
        {/* ================================================================ */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              <BarChart3 className="w-4 h-4" />
              Mise à jour : mars 2026
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Baromètre des Prix{" "}
              <span className="text-blue-600">de l&apos;Artisanat 2026</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Analyse complète des tarifs pratiqués par les artisans du bâtiment en France.
              {" "}{nombreMetiers} métiers, {nombreRegions} régions, des milliers de devis analysés.
              Données actualisées pour vous aider à estimer le juste prix de vos travaux.
            </p>
          </div>
        </header>

        {/* ================================================================ */}
        {/* KEY FIGURES */}
        {/* ================================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
                <Euro className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{prixMoyen.toLocaleString("fr-FR")} €</div>
              <div className="text-sm text-gray-500 mt-1">Prix moyen national</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{nombreMetiers}</div>
              <div className="text-sm text-gray-500 mt-1">Métiers analysés</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{nombreRegions}</div>
              <div className="text-sm text-gray-500 mt-1">Régions couvertes</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {variationMoyenne > 0 ? "+" : ""}{variationMoyenne} %
              </div>
              <div className="text-sm text-gray-500 mt-1">Variation annuelle moyenne</div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* PRIX PAR METIER */}
        {/* ================================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Prix par métier</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fourchettes de prix constatées en France métropolitaine pour les interventions
              les plus courantes. Les tarifs sont exprimés TTC et varient selon la région,
              la complexité et les matériaux utilisés.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {servicePricings.map((sp: ServicePricing) => (
              <ServiceCard key={sp.service} sp={sp} />
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/* INDICE REGIONAL */}
        {/* ================================================================ */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Indice régional des prix</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Base 100 = moyenne nationale. Un indice de 130 signifie que les prix sont
                30 % supérieurs à la moyenne. Les écarts reflètent le coût de la vie,
                la densité de professionnels et la demande locale.
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                <span className="text-gray-600">En dessous de la moyenne (&lt; 96)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                <span className="text-gray-600">Proche de la moyenne (96-104)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
                <span className="text-gray-600">Au-dessus (105-119)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                <span className="text-gray-600">Nettement au-dessus (&ge; 120)</span>
              </div>
            </div>

            {/* Metropolitan regions */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">France métropolitaine</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
              {metropolitaines.map((r: RegionalIndex) => (
                <RegionCard key={r.regionSlug} region={r} />
              ))}
            </div>

            {/* DOM-TOM */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Outre-mer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {domTom.map((r: RegionalIndex) => (
                <RegionCard key={r.regionSlug} region={r} />
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* EVOLUTION DES PRIX */}
        {/* ================================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Évolution des prix en 2026</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Analyse des facteurs qui influencent les tarifs des artisans cette année.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Impact de l&apos;inflation</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                L&apos;inflation cumulée depuis 2022 continue de peser sur les tarifs artisanaux.
                Si le rythme de hausse des prix a ralenti en 2025-2026, les niveaux restent
                significativement plus élevés qu&apos;avant la crise inflationniste. Les artisans
                répercutent progressivement la hausse de leurs charges fixes (loyers, assurances,
                carburant) sur leurs devis.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Coût des matériaux</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Les prix des matériaux de construction se sont globalement stabilisés après
                les fortes hausses de 2022-2024. Cependant, certains postes restent sous tension :
                le cuivre (+8 % sur un an), le bois de construction (+5 %) et les isolants
                biosourcés (+6 %). En revanche, les panneaux photovoltaïques et les pompes à
                chaleur poursuivent leur baisse grâce à l&apos;augmentation des capacités de production.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Tensions sur le marché du travail</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Le secteur du bâtiment fait face à une pénurie structurelle de main-d&apos;oeuvre.
                Plus de 80 000 postes restent vacants dans les métiers du bâtiment en France.
                Cette tension soutient les tarifs à la hausse, particulièrement pour les métiers
                qualifiés comme la couverture (+5,5 %), la maçonnerie (+4,6 %) et la menuiserie
                (+4,2 %). Les régions à forte croissance démographique sont les plus touchées.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Variations saisonnières</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Les prix des artisans varient sensiblement selon la saison. Le printemps et
                l&apos;été concentrent la majorité des chantiers de rénovation extérieure
                (couverture, ravalement, terrasses), avec des délais allongés et parfois des
                majorations de 10 à 15 %. L&apos;automne et l&apos;hiver sont plus favorables
                pour les travaux intérieurs (plomberie, électricité, peinture) avec une
                disponibilité accrue et des tarifs plus compétitifs.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* METHODOLOGIE */}
        {/* ================================================================ */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Méthodologie</h2>
              <p className="text-gray-600">
                Transparence sur notre processus de collecte et de traitement des données.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Collecte des données</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Les prix sont issus de devis réels transmis par des artisans référencés
                      sur ServicesArtisans et de données publiques (observatoires régionaux des
                      prix du bâtiment, CAPEB, FFB). Chaque fourchette de prix est validée par
                      croisement de sources multiples.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Échantillon et couverture</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Le baromètre couvre 10 métiers du bâtiment représentant plus de 85 % des
                      interventions artisanales en France. Les données sont collectées sur
                      l&apos;ensemble du territoire, avec une pondération par zone géographique
                      pour garantir la représentativité.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Fréquence de mise à jour</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Le baromètre est actualisé chaque trimestre. Les tendances annuelles sont
                      calculées en comparant les prix moyens du trimestre en cours avec ceux du
                      même trimestre de l&apos;année précédente, afin de neutraliser les effets
                      saisonniers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Avertissement</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Les prix affichés sont des fourchettes indicatives et ne constituent pas
                      un engagement contractuel. Le coût réel d&apos;une intervention dépend de
                      nombreux facteurs spécifiques au chantier (accessibilité, état existant,
                      matériaux choisis, urgence). Seul un devis établi après visite sur site
                      par un professionnel qualifié peut fournir un prix ferme et définitif.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FAQ */}
        {/* ================================================================ */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Questions fréquentes</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <details
                key={index}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <span className="text-gray-400 group-open:rotate-45 transition-transform flex-shrink-0 text-xl font-light">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/* CTA */}
        {/* ================================================================ */}
        <section className="bg-blue-600 py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Obtenez un devis personnalisé
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Les prix du baromètre sont indicatifs. Pour connaître le coût exact de vos
              travaux, comparez les devis de professionnels qualifiés près de chez vous.
            </p>
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* ================================================================ */}
        {/* LICENCE / CITATION */}
        {/* ================================================================ */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500">
              Ce baromètre est publié sous licence{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Creative Commons BY 4.0
              </a>
              . Vous pouvez librement citer et partager ces données en mentionnant la source :
              {" "}&laquo; Baromètre des Prix de l&apos;Artisanat 2026, {SITE_NAME} &raquo;.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
