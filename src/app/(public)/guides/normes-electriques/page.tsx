import { Metadata } from "next"
import Link from "next/link"
import {
  Zap,
  ShieldCheck,
  Euro,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Home,
  HelpCircle,
  Droplets,
  Plug,
  CircuitBoard,
  Search,
} from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getFAQSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Norme NF C 15-100 : Guide Électricité Maison",
  description:
    "Guide complet norme NF C 15-100 : nombre de prises par pièce, protection des circuits, zones salle de bain, mise aux normes obligatoire, coûts de rénovation électrique et diagnostic.",
  keywords: [
    "norme NF C 15-100",
    "normes électriques",
    "mise aux normes électriques",
    "norme électrique 2026",
    "nombre prises par pièce",
    "diagnostic électrique obligatoire",
    "rénovation électrique coût",
    "zone salle de bain électricité",
    "tableau électrique aux normes",
  ],
  alternates: {
    canonical: `${SITE_URL}/guides/normes-electriques`,
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  openGraph: {
    title: "Normes Électriques NF C 15-100 : Guide pour les Particuliers",
    description:
      "Tout savoir sur la norme NF C 15-100 : exigences par pièce, mise aux normes obligatoire, coûts et diagnostic électrique.",
    url: `${SITE_URL}/guides/normes-electriques`,
    type: "article",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Normes Électriques NF C 15-100 — Guide | ServicesArtisans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Normes Électriques NF C 15-100 : Guide Particuliers",
    description:
      "Nombre de prises, circuits, zones salle de bain, mise aux normes et coûts. Le guide complet NF C 15-100.",
    images: [`${SITE_URL}/opengraph-image`],
  },
}

// ---------------------------------------------------------------------------
// FAQ Data
// ---------------------------------------------------------------------------

const faqItems = [
  {
    question: "Est-il obligatoire de mettre aux normes une ancienne installation électrique ?",
    answer:
      "La mise aux normes n\"est pas obligatoire pour un logement que vous occupez vous-même, sauf si l\"installation présente un danger avéré. En revanche, elle devient obligatoire dans trois cas : lors d\"une rénovation lourde avec intervention sur le tableau électrique, lors de la vente d\"un logement (le diagnostic électrique est obligatoire pour les installations de plus de 15 ans), et lors de la mise en location (l\"installation doit répondre aux critères de décence). L\"objectif est d\"assurer la sécurité des personnes.",
  },
  {
    question: "Combien coûte une mise aux normes électriques complète ?",
    answer:
      "Le coût d\"une mise aux normes électriques complète dépend de la surface du logement et de l\"état de l\"installation existante. En moyenne, comptez entre 80 et 120 € par m² pour une rénovation complète (remplacement du tableau, nouveau câblage, prises et interrupteurs). Pour un appartement de 60 m², le budget se situe entre 4 800 et 7 200 €. Pour une maison de 100 m², entre 8 000 et 12 000 €. Une mise aux normes partielle (tableau seul) coûte entre 1 500 et 3 000 €.",
  },
  {
    question: "Puis-je faire les travaux électriques moi-même ?",
    answer:
      "Oui, un particulier peut réaliser les travaux électriques de son propre logement. Il n\"est pas obligatoire de faire appel à un électricien professionnel. Cependant, l\"installation doit impérativement respecter la norme NF C 15-100. En cas de sinistre (incendie, électrocution), votre assurance pourra refuser de vous indemniser si l\"installation n\"est pas conforme. Pour une construction neuve, un Consuel (Comité National pour la Sécurité des Usagers de l\"Électricité) est obligatoire avant la mise en service. Nous recommandons fortement de faire appel à un électricien qualifié.",
  },
  {
    question: "Quelle est la durée de validité du diagnostic électrique ?",
    answer:
      "Le diagnostic électrique (état de l\"installation intérieure d\"électricité) a une durée de validité de 3 ans pour une vente et de 6 ans pour une location. Il est obligatoire pour toute installation de plus de 15 ans. Le diagnostic doit être réalisé par un diagnostiqueur certifié. Son coût varie entre 100 et 200 € selon la taille du logement. Il porte sur 87 points de contrôle couvrant le tableau électrique, les dispositifs de protection, les prises de terre et les zones humides.",
  },
  {
    question: "Quels sont les risques d\"une installation électrique non conforme ?",
    answer:
      "Une installation non conforme présente des risques majeurs : électrocution (environ 100 décès par an en France), incendie d\"origine électrique (environ 50 000 par an, soit 25 % des incendies domestiques), et dommages matériels. En cas de sinistre, l\"assurance peut refuser l\"indemnisation si l\"installation est non conforme. En cas de location, le propriétaire engage sa responsabilité civile et pénale. Les signes d\"alerte sont : disjoncteurs qui sautent fréquemment, prises qui chauffent, odeur de brûlé, absence de prise de terre.",
  },
]

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const keyFigures = [
  {
    icon: Zap,
    value: "NF C 15-100",
    label: "Norme de référence en France",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: ShieldCheck,
    value: "87 points",
    label: "Contrôlés lors du diagnostic",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: AlertTriangle,
    value: "50 000",
    label: "Incendies électriques par an",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Euro,
    value: "80-120 €/m²",
    label: "Coût moyen de rénovation",
    color: "text-green-600",
    bg: "bg-green-50",
  },
]

const exigencesParPiece = [
  {
    piece: "Séjour (> 28 m²)",
    prises: "7 prises minimum",
    eclairage: "1 point lumineux au plafond",
    comm: "2 prises RJ45",
    icon: Home,
  },
  {
    piece: "Séjour (< 28 m²)",
    prises: "5 prises minimum",
    eclairage: "1 point lumineux au plafond",
    comm: "2 prises RJ45",
    icon: Home,
  },
  {
    piece: "Chambre",
    prises: "3 prises minimum",
    eclairage: "1 point lumineux au plafond",
    comm: "1 prise RJ45",
    icon: Home,
  },
  {
    piece: "Cuisine",
    prises: "6 prises dont 4 au-dessus du plan de travail",
    eclairage: "1 point lumineux au plafond",
    comm: "1 prise RJ45",
    icon: Home,
  },
  {
    piece: "Salle de bain",
    prises: "1 prise (hors volume 0, 1, 2)",
    eclairage: "1 point lumineux au plafond",
    comm: "—",
    icon: Droplets,
  },
  {
    piece: "Couloir / Entrée",
    prises: "1 prise minimum",
    eclairage: "1 point lumineux commandé",
    comm: "—",
    icon: Home,
  },
]

const zonesVolumesBain = [
  {
    volume: "Volume 0",
    zone: "Intérieur de la baignoire ou du receveur de douche",
    appareils: "Aucun appareil électrique autorisé",
    protection: "IPX7 (immersion)",
    color: "bg-red-50 border-red-200",
  },
  {
    volume: "Volume 1",
    zone: "Au-dessus de la baignoire/douche, jusqu\"à 2,25 m de hauteur",
    appareils: "Chauffe-eau instantané TBTS 12V uniquement",
    protection: "IPX5 (jets d\"eau)",
    color: "bg-orange-50 border-orange-200",
  },
  {
    volume: "Volume 2",
    zone: "60 cm autour de la baignoire/douche, jusqu\"à 2,25 m",
    appareils: "Luminaires, chauffages classe II + 30 mA",
    protection: "IPX4 (éclaboussures)",
    color: "bg-amber-50 border-amber-200",
  },
  {
    volume: "Hors volume",
    zone: "Au-delà de 60 cm de la baignoire/douche",
    appareils: "Prises, appareils avec protection 30 mA",
    protection: "IPX1 (gouttes)",
    color: "bg-green-50 border-green-200",
  },
]

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function NormesElectriquesPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: "Normes Électriques NF C 15-100", url: "/guides/normes-electriques" },
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
                { label: "Normes Électriques NF C 15-100" },
              ]}
            />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-amber-50 to-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-2 text-sm text-amber-600 font-medium mb-4">
              <Zap className="w-4 h-4" />
              <span>{"Réglementation & Sécurité"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-heading">
              {"Normes Électriques NF C 15-100 : Guide pour les Particuliers"}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              {"La norme NF C 15-100 définit les règles de sécurité des installations électriques basse tension en France. Ce guide vous explique les exigences essentielles pour votre logement, les cas de mise aux normes obligatoire et les coûts à prévoir."}
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
                "Qu\"est-ce que la norme NF C 15-100 ?",
                "Exigences par pièce : prises, éclairage et communication",
                "Protection des circuits : disjoncteurs et différentiels",
                "Zones de sécurité en salle de bain",
                "Quand la mise aux normes est-elle obligatoire ?",
                "Coût d\"une rénovation électrique",
                "Diagnostic électrique obligatoire",
                "Questions fréquentes",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600 hover:text-amber-600">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Section 1: What is NF C 15-100 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
                <CircuitBoard className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Qu\"est-ce que la norme NF C 15-100 ?"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"La norme NF C 15-100 est la norme française qui régit la conception, la réalisation et l\"entretien des installations électriques basse tension (jusqu\"à 1 000 V en courant alternatif). Elle s\"applique à tous les bâtiments d\"habitation, neufs et rénovés, et définit les règles minimales de sécurité pour protéger les personnes et les biens."}
              </p>
              <p className="text-gray-700 mb-4">
                {"Régulièrement mise à jour (dernière révision majeure en décembre 2024), elle couvre notamment :"}
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "Le nombre minimal de prises et points lumineux par pièce",
                  "La protection des circuits (disjoncteurs, différentiels)",
                  "Les volumes de sécurité dans les pièces humides",
                  "Le dimensionnement des câbles et la mise à la terre",
                  "La gaine technique de logement (GTL)",
                  "Les prises de communication (RJ45) et multimédia",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Requirements per room */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <Plug className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Exigences par pièce : prises, éclairage et communication"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Pièce"}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Prises 16A"}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Éclairage"}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Communication"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {exigencesParPiece.map((row) => (
                      <tr key={row.piece} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{row.piece}</td>
                        <td className="py-3 px-4 text-gray-700">{row.prises}</td>
                        <td className="py-3 px-4 text-gray-700">{row.eclairage}</td>
                        <td className="py-3 px-4 text-gray-700">{row.comm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-amber-50 border-t border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>{"Note :"}</strong>{" ces chiffres sont des minimums réglementaires. Pour un confort optimal, prévoyez davantage de prises, surtout dans la cuisine et le séjour. Les prises USB intégrées ne comptent pas comme prises de courant 16A."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Circuit protection */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50">
                <ShieldCheck className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Protection des circuits : disjoncteurs et différentiels"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"Le tableau électrique doit comporter des dispositifs de protection adaptés à chaque circuit :"}
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{"Interrupteurs différentiels 30 mA"}</h3>
                  <p className="text-sm text-gray-600">
                    {"Tous les circuits doivent être protégés par des interrupteurs différentiels 30 mA. La norme impose au minimum 2 interrupteurs différentiels de type AC (pour l\"éclairage et les prises) et 1 de type A (pour les circuits spécialisés : plaque de cuisson, lave-linge, borne de recharge VE). Chaque interrupteur différentiel protège au maximum 8 circuits."}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{"Disjoncteurs divisionnaires"}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {"Chaque circuit doit être protégé individuellement par un disjoncteur adapté :"}
                  </p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {[
                      { circuit: "Éclairage", protection: "Disjoncteur 10A ou 16A, câble 1,5 mm²" },
                      { circuit: "Prises de courant", protection: "Disjoncteur 16A ou 20A, câble 2,5 mm²" },
                      { circuit: "Plaque de cuisson", protection: "Disjoncteur 32A, câble 6 mm²" },
                      { circuit: "Four, lave-linge", protection: "Disjoncteur 20A, câble 2,5 mm²" },
                      { circuit: "Chauffage électrique", protection: "Disjoncteur 10A à 20A selon puissance" },
                      { circuit: "Chauffe-eau", protection: "Disjoncteur 20A, contacteur heures creuses" },
                    ].map((item) => (
                      <div key={item.circuit} className="flex items-start gap-2 text-xs">
                        <Zap className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700"><strong>{item.circuit}</strong>{" : "}{item.protection}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{"Prise de terre obligatoire"}</h3>
                  <p className="text-sm text-gray-600">
                    {"Toute installation électrique doit disposer d\"une prise de terre dont la résistance ne dépasse pas 100 ohms. La prise de terre assure l\"évacuation des courants de défaut et le fonctionnement correct des dispositifs différentiels. Sans prise de terre, les interrupteurs différentiels ne peuvent pas assurer la protection des personnes."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Bathroom zones */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-50">
                <Droplets className="w-5 h-5 text-cyan-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Zones de sécurité en salle de bain"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"La salle de bain est divisée en volumes de sécurité qui déterminent quels appareils électriques peuvent y être installés :"}
              </p>
              <div className="space-y-4">
                {zonesVolumesBain.map((zone) => (
                  <div key={zone.volume} className={`p-4 ${zone.color} rounded-lg border`}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{zone.volume}</h3>
                      <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-medium text-gray-700">
                        {zone.protection}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1"><strong>{"Zone :"}</strong>{" "}{zone.zone}</p>
                    <p className="text-sm text-gray-600"><strong>{"Appareils :"}</strong>{" "}{zone.appareils}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5: When mandatory */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Quand la mise aux normes est-elle obligatoire ?"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-4">
                {[
                  {
                    title: "Construction neuve",
                    desc: "Toute construction neuve doit respecter intégralement la norme NF C 15-100 en vigueur. Le Consuel (certificat de conformité) est obligatoire avant la mise en service de l\"installation par Enedis.",
                    color: "bg-red-50",
                  },
                  {
                    title: "Rénovation lourde",
                    desc: "Lors d\"une rénovation complète de l\"installation électrique (remplacement du tableau, modification du câblage), la nouvelle installation doit être conforme à la norme en vigueur. Un Consuel peut être demandé.",
                    color: "bg-red-50",
                  },
                  {
                    title: "Vente d\"un logement (installation > 15 ans)",
                    desc: "Le vendeur doit fournir un diagnostic de l\"état de l\"installation électrique. Si des anomalies sont détectées, l\"acheteur est informé mais les travaux de mise aux normes ne sont pas obligatoires pour conclure la vente.",
                    color: "bg-amber-50",
                  },
                  {
                    title: "Mise en location",
                    desc: "Le logement loué doit disposer d\"une installation électrique conforme aux critères de décence (loi Alur). Un diagnostic électrique est obligatoire pour les installations de plus de 15 ans. Le propriétaire doit garantir la sécurité de l\"installation.",
                    color: "bg-amber-50",
                  },
                ].map((item) => (
                  <div key={item.title} className={`p-4 ${item.color} rounded-lg`}>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Cost */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Coût d\"une rénovation électrique"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Type de travaux"}</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">{"Coût moyen"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { travaux: "Remplacement du tableau électrique", cout: "1 500 € à 3 000 €" },
                      { travaux: "Mise aux normes partielle (tableau + différentiels)", cout: "2 000 € à 4 000 €" },
                      { travaux: "Rénovation complète appartement 60 m²", cout: "4 800 € à 7 200 €" },
                      { travaux: "Rénovation complète maison 100 m²", cout: "8 000 € à 12 000 €" },
                      { travaux: "Ajout d\"un circuit spécialisé", cout: "200 € à 500 €" },
                      { travaux: "Pose d\"une prise de terre", cout: "500 € à 1 500 €" },
                      { travaux: "Diagnostic électrique (obligatoire)", cout: "100 € à 200 €" },
                    ].map((row) => (
                      <tr key={row.travaux}>
                        <td className="py-3 px-4 text-gray-700">{row.travaux}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">{row.cout}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>{"Bon à savoir :"}</strong>{" la TVA est réduite à 10 % (au lieu de 20 %) pour les travaux de rénovation électrique dans les logements de plus de 2 ans, si les travaux sont réalisés par un professionnel."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Diagnostic */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50">
                <Search className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Diagnostic électrique obligatoire"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"Le diagnostic de l\"état de l\"installation intérieure d\"électricité est un document obligatoire qui informe l\"acheteur ou le locataire sur la sécurité de l\"installation :"}
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{"En cas de vente"}</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>{"• Obligatoire si installation > 15 ans"}</li>
                    <li>{"• Validité : 3 ans"}</li>
                    <li>{"• Doit figurer dans le DDT (Dossier de Diagnostic Technique)"}</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{"En cas de location"}</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>{"• Obligatoire si installation > 15 ans"}</li>
                    <li>{"• Validité : 6 ans"}</li>
                    <li>{"• Doit être annexé au bail de location"}</li>
                  </ul>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>{"Important :"}</strong>{" le diagnostic doit être réalisé par un diagnostiqueur certifié par un organisme accrédité COFRAC. Un diagnostic réalisé par un non-certifié est nul et peut entraîner l\"annulation de la vente."}
                </p>
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
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-3">
                {"Besoin d\"un électricien ou d\"un diagnostiqueur ?"}
              </h2>
              <p className="text-amber-100 mb-6 max-w-2xl">
                {"Trouvez un électricien qualifié pour votre mise aux normes ou un diagnostiqueur certifié pour votre diagnostic électrique obligatoire."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/services/electricien"
                  className="inline-flex items-center gap-2 bg-white text-amber-700 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
                >
                  {"Trouver un électricien"} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/services/diagnostiqueur"
                  className="inline-flex items-center gap-2 bg-amber-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors"
                >
                  {"Trouver un diagnostiqueur"} <ArrowRight className="w-4 h-4" />
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
                href="/guides/maprimerenov-2026"
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                  {"MaPrimeRénov 2026"}
                </h3>
                <p className="text-sm text-gray-500">{"Aides financières pour la rénovation énergétique."}</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
