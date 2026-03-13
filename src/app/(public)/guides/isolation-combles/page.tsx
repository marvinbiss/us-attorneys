import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Home,
  Clock,
  FileCheck,
  Search,
  HelpCircle,
  ArrowRight,
  Euro,
  Shield,
  Hammer,
  Thermometer,
  Layers,
  Leaf,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/isolation-combles`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Isolation des Combles : Guide Prix, Techniques et Aides 2026",
  description:
    "Guide isolation combles 2026 : combles perdus (20-75 €/m²), combles aménagés (48-265 €/m²), techniques (soufflage, rouleau, sarking), aides et artisans RGE.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Isolation des Combles : Guide Prix, Techniques et Aides 2026",
    description:
      "Guide complet isolation des combles : combles perdus vs aménagés, techniques, matériaux, prix détaillés et aides financières 2026.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Isolation des Combles : Guide Prix, Techniques et Aides 2026",
    description:
      "Guide complet isolation des combles : combles perdus vs aménagés, techniques, matériaux, prix détaillés et aides financières 2026.",
  },
}

const comparaisonCombles = [
  {
    type: "Combles perdus",
    icon: Layers,
    description:
      "Espace sous toiture non habitable (hauteur insuffisante, charpente fermette). L’isolation se pose directement sur le plancher des combles.",
    quandChoisir:
      "Quand les combles ne sont pas aménageables : hauteur sous faîtage inférieure à 1,80 m, charpente industrielle (fermettes en W), ou absence de projet d’aménagement.",
    prix: "20 – 75 €/m²",
    performance: "R ≥ 7 m².K/W (recommandé)",
    avantages: "Très économique, rapide (1 journée), excellente performance thermique",
    inconvenients: "Combles inaccessibles après soufflage, ne convient pas si on veut aménager",
  },
  {
    type: "Combles aménagés",
    icon: Home,
    description:
      "Espace sous toiture habitable ou destiné à l’être. L’isolation se pose sous les rampants de toiture (par l’intérieur ou l’extérieur).",
    quandChoisir:
      "Quand les combles sont déjà aménagés ou quand vous prévoyez de les aménager : hauteur suffisante, charpente traditionnelle, accès existant.",
    prix: "48 – 265 €/m²",
    performance: "R ≥ 6 m².K/W (recommandé)",
    avantages: "Conserve l’espace habitable, plusieurs techniques possibles, confort été comme hiver",
    inconvenients: "Plus coûteux, travaux plus longs, légère perte de volume (isolation intérieure)",
  },
]

const techniques = [
  {
    name: "Soufflage (combles perdus)",
    prix: "20 – 40 €/m²",
    performance: "R = 7 à 10 m².K/W",
    duree: "1 journée (100 m²)",
    avantages: "Le plus économique, couvre parfaitement les recoins, supprime les ponts thermiques, éligible à toutes les aides",
    ideal: "Combles perdus non aménageables",
  },
  {
    name: "Rouleaux / Panneaux (combles perdus)",
    prix: "25 – 75 €/m²",
    performance: "R = 7 à 8 m².K/W",
    duree: "1 à 2 jours (100 m²)",
    avantages: "Accès aux combles conservé (avec rehausse), pose en double couche croisée pour supprimer les ponts thermiques",
    ideal: "Combles perdus avec accès occasionnel souhaité",
  },
  {
    name: "Panneaux sous rampants (intérieur)",
    prix: "48 – 90 €/m²",
    performance: "R = 6 à 8 m².K/W",
    duree: "3 à 5 jours (100 m²)",
    avantages: "Conserve la couverture en place, bonne performance, coût modéré pour des combles aménagés",
    ideal: "Combles aménagés, rénovation sans dépose de couverture",
  },
  {
    name: "Sarking (extérieur)",
    prix: "120 – 265 €/m²",
    performance: "R = 6 à 10 m².K/W",
    duree: "5 à 10 jours (100 m²)",
    avantages: "Supprime tous les ponts thermiques, aucune perte de volume intérieur, idéal lors d’une réfection de toiture",
    ideal: "Combles aménagés + rénovation complète de la couverture",
  },
]

const materiaux = [
  {
    name: "Laine de verre soufflée",
    icon: Layers,
    lambda: "0,040 – 0,045 W/m.K",
    prix: "3 – 8 €/m² (fourniture)",
    avantages: "Très économique, légère, incombustible (classe A1), excellent rapport performance/prix",
    inconvenients: "Irritante à la pose, tassement possible à long terme (5-10 %), sensible à l’humidité",
  },
  {
    name: "Ouate de cellulose",
    icon: Leaf,
    lambda: "0,038 – 0,042 W/m.K",
    prix: "6 – 14 €/m² (fourniture)",
    avantages: "Écologique (papier recyclé), excellent déphasage thermique (été), bon isolant acoustique, légèrement meilleur lambda",
    inconvenients: "Traitement au sel de bore nécessaire (ignifuge), tassement possible (jusqu’à 20 % si mal posée)",
  },
  {
    name: "Laine de roche",
    icon: Shield,
    lambda: "0,034 – 0,040 W/m.K",
    prix: "8 – 18 €/m² (fourniture)",
    avantages: "Excellente résistance au feu (classe A1), très bon isolant acoustique, imputrescible, ne craint pas l’humidité",
    inconvenients: "Plus lourde que la laine de verre, irritante à la pose, bilan carbone plus élevé",
  },
  {
    name: "Fibre de bois",
    icon: Leaf,
    lambda: "0,036 – 0,046 W/m.K",
    prix: "15 – 30 €/m² (fourniture)",
    avantages: "Écologique (bois résineux), meilleur déphasage thermique du marché (confort d’été supérieur), régulation hygrothermique naturelle",
    inconvenients: "Prix élevé, plus lourde (nécessite structure adaptée), sensible aux insectes si non traitée",
  },
]

const prixDetailles = [
  {
    technique: "Soufflage combles perdus (laine de verre)",
    surface50: "1 000 – 2 000 €",
    surface100: "2 000 – 4 000 €",
    surface150: "3 000 – 6 000 €",
    prixM2: "20 – 40 €/m²",
  },
  {
    technique: "Soufflage combles perdus (ouate de cellulose)",
    surface50: "1 500 – 2 750 €",
    surface100: "3 000 – 5 500 €",
    surface150: "4 500 – 8 250 €",
    prixM2: "30 – 55 €/m²",
  },
  {
    technique: "Rouleaux sur plancher (double couche)",
    surface50: "1 250 – 3 750 €",
    surface100: "2 500 – 7 500 €",
    surface150: "3 750 – 11 250 €",
    prixM2: "25 – 75 €/m²",
  },
  {
    technique: "Panneaux sous rampants (intérieur)",
    surface50: "2 400 – 4 500 €",
    surface100: "4 800 – 9 000 €",
    surface150: "7 200 – 13 500 €",
    prixM2: "48 – 90 €/m²",
  },
  {
    technique: "Sarking (extérieur)",
    surface50: "6 000 – 13 250 €",
    surface100: "12 000 – 26 500 €",
    surface150: "18 000 – 39 750 €",
    prixM2: "120 – 265 €/m²",
  },
]

const etapesChantier = [
  {
    titre: "Diagnostic thermique et devis",
    description:
      "Un artisan RGE inspecte vos combles : type de charpente, état de l’existant, présence de VMC, accès. Il recommande la technique adaptée et établit un devis détaillé. Demandez au moins 3 devis.",
  },
  {
    titre: "Préparation du chantier",
    description:
      "Dégagement des combles (stockage, ancienne isolation dégradée), vérification de l’étanchéité de la toiture, repérage des boîtiers électriques et spots encastrés (mise en sécurité avec capots coupe-feu).",
  },
  {
    titre: "Traitement de la ventilation",
    description:
      "Vérification ou installation de la VMC. Une bonne ventilation est indispensable après isolation pour éviter la condensation. Pose de déflecteurs au niveau des entrées d’air en rive de toit.",
  },
  {
    titre: "Pose du pare-vapeur (si nécessaire)",
    description:
      "Mise en place d’une membrane pare-vapeur côté chaud (obligatoire pour les isolants sensibles à l’humidité). Les joints sont scotchés pour garantir la continuité de l’étanchéité à l’air.",
  },
  {
    titre: "Pose de l’isolant",
    description:
      "Soufflage mécanique (combles perdus) ou pose de panneaux/rouleaux (sous rampants ou sur plancher). L’épaisseur est contrôlée par des piges graduées. En sarking, l’isolant rigide est fixé sur les chevrons.",
  },
  {
    titre: "Finitions et réception",
    description:
      "Pose du parement intérieur (BA13) pour les combles aménagés, mise en place de la trappe d’accès isolée, nettoyage du chantier. L’artisan remet l’attestation sur l’honneur (nécessaire pour les aides).",
  },
]

const services = [
  { label: "Isolation thermique", href: "/services/isolation-thermique", icon: Thermometer },
  { label: "Couvreur", href: "/services/couvreur", icon: Home },
  { label: "Charpentier", href: "/services/charpentier", icon: Hammer },
]

const faqItems = [
  {
    question: "Combien coûte l’isolation des combles perdus ?",
    answer:
      "L’isolation des combles perdus par soufflage coûte entre 20 et 40 €/m² pose comprise (laine de verre) et 30 à 55 €/m² (ouate de cellulose). Pour une maison de 100 m² de combles, comptez entre 2 000 et 5 500 € avant aides. Après déduction de MaPrimeRénov’ et des CEE, le reste à charge peut descendre à quelques centaines d’euros pour les ménages modestes.",
  },
  {
    question: "Quelle épaisseur d’isolant est recommandée pour les combles ?",
    answer:
      "Pour atteindre la résistance thermique R = 7 m².K/W recommandée en combles perdus, il faut environ 30 à 35 cm de laine de verre soufflée, 28 à 33 cm de ouate de cellulose, ou 25 à 30 cm de laine de roche. Pour les combles aménagés (R ≥ 6), l’épaisseur varie de 22 à 28 cm selon le matériau. Ne lésinez pas sur l’épaisseur : le surcoût est minime et les économies d’énergie sont proportionnelles.",
  },
  {
    question: "Quelle est la durée de vie de l’isolation des combles ?",
    answer:
      "Une isolation correctement posée dure 25 à 40 ans en moyenne. La laine de verre et la laine de roche conservent leurs performances 30 à 40 ans. La ouate de cellulose dure 25 à 35 ans (léger tassement possible). La fibre de bois offre une excellente durabilité (35 à 40 ans). Les signes de remplacement : augmentation des factures énergétiques, sensation de froid, présence d’humidité ou de moisissures dans les combles.",
  },
  {
    question: "L’isolation des combles est-elle efficace en été comme en hiver ?",
    answer:
      "Oui, mais avec des nuances. En hiver, tous les isolants limitent les pertes de chaleur (jusqu’à 30 % d’économies sur la facture de chauffage). En été, c’est le déphasage thermique qui compte : il retarde la pénétration de la chaleur. La fibre de bois (déphasage 10-12h) et la ouate de cellulose (8-10h) sont supérieures à la laine de verre (4-6h). Pour un confort d’été optimal, privilégiez ces isolants biosourcés.",
  },
  {
    question: "Pourquoi choisir un artisan RGE pour l’isolation des combles ?",
    answer:
      "La certification RGE (Reconnu Garant de l’Environnement) est obligatoire pour bénéficier de MaPrimeRénov’, des CEE, de l’éco-PTZ et de la TVA à 5,5 %. Au-delà des aides, un artisan RGE garantit une pose conforme aux DTU (règles de l’art) : épaisseur correcte, traitement des ponts thermiques, pare-vapeur bien posé, ventilation vérifiée. Vérifiez la certification sur le site france-renov.gouv.fr avant de signer.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Isolation des combles" },
]

export default function IsolationComblesPage() {
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
        name: "Isolation des combles",
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
            <Thermometer className="w-4 h-4" />
            Guide isolation combles
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Isolation des combles : guide prix, techniques et aides 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Les combles représentent jusqu’à 30 % des pertes de chaleur d’une maison. Découvrez les techniques d’isolation, les prix détaillés et les aides disponibles en 2026 pour réduire votre facture énergétique."}
          </p>
        </section>

        {/* Combles perdus vs aménagés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Combles perdus vs combles aménagés
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {comparaisonCombles.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{c.type}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{c.description}</p>
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Quand choisir ?</p>
                    <p className="text-sm text-blue-700">{c.quandChoisir}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm mb-3">
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      <Euro className="w-3 h-3" /> {c.prix}
                    </span>
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      <Shield className="w-3 h-3" /> {c.performance}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">Avantages</p>
                      <p className="text-sm text-gray-600">{c.avantages}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700 mb-1">Inconvénients</p>
                      <p className="text-sm text-gray-600">{c.inconvenients}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Techniques d'isolation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Techniques d{"'"}isolation des combles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {techniques.map((t) => (
              <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm mb-3">
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <Euro className="w-3 h-3" /> {t.prix}
                  </span>
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    <Shield className="w-3 h-3" /> {t.performance}
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" /> {t.duree}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{t.avantages}</p>
                <p className="text-sm font-medium text-blue-600">Idéal pour : {t.ideal}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Matériaux */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Matériaux isolants : comparatif
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {materiaux.map((m) => {
              const Icon = m.icon
              return (
                <div key={m.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                      <p className="text-xs text-gray-500">λ = {m.lambda}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm mb-3">
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      <Euro className="w-3 h-3" /> {m.prix}
                    </span>
                  </div>
                  <div className="space-y-2">
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
              )
            })}
          </div>
        </section>

        {/* Prix détaillés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Prix détaillés par technique et surface
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-900">Technique</th>
                    <th className="text-center p-4 font-semibold text-gray-900">50 m²</th>
                    <th className="text-center p-4 font-semibold text-gray-900">100 m²</th>
                    <th className="text-center p-4 font-semibold text-gray-900">150 m²</th>
                    <th className="text-center p-4 font-semibold text-gray-900">Prix/m²</th>
                  </tr>
                </thead>
                <tbody>
                  {prixDetailles.map((p, index) => (
                    <tr key={p.technique} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="p-4 font-medium text-gray-900">{p.technique}</td>
                      <td className="p-4 text-center text-gray-600">{p.surface50}</td>
                      <td className="p-4 text-center text-gray-600">{p.surface100}</td>
                      <td className="p-4 text-center text-gray-600">{p.surface150}</td>
                      <td className="p-4 text-center font-semibold text-blue-700">{p.prixM2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-blue-50 border-t border-blue-100">
              <p className="text-sm text-blue-800">
                {"Prix TTC pose comprise, indicatifs pour 2026. Incluent la fourniture de l’isolant, la main-d’œuvre et le pare-vapeur. Hors dépose de l’ancien isolant (+5 à 15 €/m²) et hors parement intérieur (BA13)."}
              </p>
            </div>
          </div>
        </section>

        {/* Aides 2026 */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Aides financières 2026 pour l{"'"}isolation des combles
            </h2>
            <p className="text-green-50 mb-6 text-lg">
              {"L’isolation des combles est l’un des travaux les mieux subventionnés. Artisan RGE obligatoire pour toutes les aides."}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">MaPrimeRénov{"'"}</h3>
                <p className="text-green-50 text-sm">
                  {"Jusqu’à 25 €/m² pour les ménages très modestes (combles perdus) et jusqu’à 75 €/m² pour l’isolation des rampants. Le montant dépend de vos revenus et de la zone géographique. Cumulable avec les CEE."}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">CEE (Certificats d{"'"}Économies d{"'"}Énergie)</h3>
                <p className="text-green-50 text-sm">
                  {"Prime énergie versée par les fournisseurs d’énergie (EDF, TotalEnergies, etc.). De 10 à 22 €/m² selon la surface, la zone climatique et vos revenus. À demander AVANT de signer le devis."}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">TVA à 5,5 %</h3>
                <p className="text-green-50 text-sm">
                  {"TVA réduite à 5,5 % (au lieu de 20 %) appliquée directement sur la facture par l’artisan RGE. Valable pour les logements de plus de 2 ans (résidence principale ou secondaire)."}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">Éco-PTZ et aides locales</h3>
                <p className="text-green-50 text-sm">
                  {"Prêt à taux zéro jusqu’à 50 000 € pour un bouquet de travaux, remboursable sur 20 ans. Certaines régions et collectivités proposent des compléments (ex : Île-de-France, Auvergne-Rhône-Alpes)."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Étapes du chantier */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Étapes du chantier et durée
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-4">
                {etapesChantier.map((etape, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <strong>{etape.titre}</strong>
                      <p className="mt-1">{etape.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium mb-1">Combles perdus (soufflage)</p>
                <p className="text-2xl font-bold text-blue-800">1 jour</p>
                <p className="text-xs text-blue-600">pour 100 m²</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium mb-1">Sous rampants (intérieur)</p>
                <p className="text-2xl font-bold text-blue-800">3 à 5 jours</p>
                <p className="text-xs text-blue-600">pour 100 m²</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium mb-1">Sarking (extérieur)</p>
                <p className="text-2xl font-bold text-blue-800">5 à 10 jours</p>
                <p className="text-xs text-blue-600">pour 100 m²</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan RGE pour vos combles
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Confiez l’isolation de vos combles à des professionnels certifiés RGE et assurés en décennale."}
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
            <Link href="/guides/renovation-toiture" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Rénovation de toiture"}</h3>
              <p className="text-sm text-gray-500">{"Profitez d’une réfection de toiture pour isoler par sarking."}</p>
            </Link>
            <Link href="/guides/aides-renovation-2026" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Aides rénovation 2026"}</h3>
              <p className="text-sm text-gray-500">{"Toutes les aides pour financer votre isolation."}</p>
            </Link>
            <Link href="/guides/artisan-rge" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Artisan RGE"}</h3>
              <p className="text-sm text-gray-500">{"Obligatoire pour bénéficier des aides à l’isolation."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur l{"'"}isolation des combles
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
              {"Besoin d’un artisan pour isoler vos combles ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans RGE certifiés près de chez vous. Devis gratuit et sans engagement."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/isolation-thermique"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un artisan RGE"}
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
