import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Leaf,
  CheckCircle2,
  Euro,
  Search,
  HelpCircle,
  ArrowRight,
  Hammer,
  Home,
  Wrench,
  FileCheck,
  Zap,
  Thermometer,
  Wind,
  BarChart3,
  Clock,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/renovation-energetique-complete`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Rénovation Énergétique : Guide Complet pour Votre Maison",
  description:
    "Guide complet rénovation énergétique 2026 : isolation, chauffage, ventilation, fenêtres. Toutes les aides (MaPrimeRénov, CEE, éco-PTZ) et l'ordre optimal des travaux.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Rénovation Énergétique : Guide Complet pour Votre Maison",
    description:
      "Les 4 piliers de la rénovation énergétique, l'ordre des travaux, les aides 2026 et le retour sur investissement détaillé.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rénovation Énergétique : Guide Complet pour Votre Maison",
    description:
      "Les 4 piliers de la rénovation énergétique, l'ordre des travaux, les aides 2026 et le retour sur investissement détaillé.",
  },
}

const parOuCommencer = [
  {
    num: 1,
    title: "Audit énergétique",
    description:
      "L'audit énergétique analyse votre logement en détail : thermographie infrarouge, test d'étanchéité à l'air, analyse des factures. Il identifie les déperditions et propose un plan de travaux chiffré par ordre de priorité. Coût : 800-1 500 € (partiellement aidé par MaPrimeRénov). Obligatoire pour la vente d'une passoire énergétique (F ou G) depuis 2025.",
    icon: BarChart3,
  },
  {
    num: 2,
    title: "DPE (Diagnostic de Performance Énergétique)",
    description:
      "Le DPE classe votre logement de A (excellent) à G (passoire thermique). Depuis 2025, les logements classés G sont interdits à la location. Les F suivront en 2028 et les E en 2034. Le DPE est une photo ; l'audit est la prescription médicale.",
    icon: Thermometer,
  },
  {
    num: 3,
    title: "Définir les priorités",
    description:
      "Règle d'or : traitez d'abord l'enveloppe (isolation), puis le chauffage, puis la ventilation. Un chauffage performant dans une maison mal isolée, c'est chauffer dehors. L'audit vous indique par où commencer selon VOTRE maison.",
    icon: CheckCircle2,
  },
]

const quatrePiliers = [
  {
    pilier: "Isolation",
    perte: "25-30 % par le toit, 20-25 % par les murs, 7-10 % par le plancher",
    description: "Premier poste de déperdition. L'isolation est TOUJOURS le premier chantier à réaliser, peu importe l'état du chauffage.",
    icon: Home,
    color: "bg-orange-100 text-orange-800",
  },
  {
    pilier: "Chauffage",
    perte: "60-75 % de la facture énergétique",
    description: "Une fois la maison isolée, le besoin de chauffage baisse drastiquement. Un système performant (PAC, granulés) sur une maison isolée divise la facture par 3 à 4.",
    icon: Thermometer,
    color: "bg-red-100 text-red-800",
  },
  {
    pilier: "Ventilation",
    perte: "20-25 % des déperditions si mal gérée",
    description: "Une maison bien isolée sans ventilation efficace = problèmes d'humidité et de qualité de l'air. La VMC double flux récupère 90 % de la chaleur de l'air sortant.",
    icon: Wind,
    color: "bg-blue-100 text-blue-800",
  },
  {
    pilier: "Fenêtres",
    perte: "10-15 % des déperditions",
    description: "Les fenêtres sont souvent le dernier poste à traiter (sauf si simple vitrage). Le double vitrage moderne suffit dans la majorité des cas.",
    icon: Home,
    color: "bg-green-100 text-green-800",
  },
]

const isolationDetails = [
  {
    zone: "Combles perdus",
    techniques: "Soufflage de laine de verre ou ouate de cellulose",
    epaisseur: "30-40 cm (R ≥ 7 m².K/W)",
    prix: "20-50 €/m²",
    roi: "2-4 ans",
    note: "Le geste le plus rentable. Jusqu'à 30 % d'économies si combles non isolés.",
  },
  {
    zone: "Combles aménagés",
    techniques: "Panneaux rigides sous rampants ou sarking (par l'extérieur)",
    epaisseur: "22-30 cm (R ≥ 6 m².K/W)",
    prix: "50-120 €/m²",
    roi: "5-8 ans",
    note: "Plus complexe que les combles perdus. Le sarking est plus performant mais 2x plus cher.",
  },
  {
    zone: "Murs par l'intérieur (ITI)",
    techniques: "Doublage collé (PSE+plâtre) ou ossature + laine",
    epaisseur: "12-16 cm (R ≥ 3.7 m².K/W)",
    prix: "50-90 €/m²",
    roi: "8-12 ans",
    note: "Réduit la surface habitable de 3-5 %. Attention aux ponts thermiques aux jonctions mur/plancher.",
  },
  {
    zone: "Murs par l'extérieur (ITE)",
    techniques: "PSE collé-chevillé + enduit ou bardage ventilé",
    epaisseur: "14-20 cm (R ≥ 3.7 m².K/W)",
    prix: "120-250 €/m²",
    roi: "10-15 ans",
    note: "La plus performante (supprime les ponts thermiques). Modifie l'aspect extérieur → déclaration de travaux.",
  },
  {
    zone: "Plancher bas",
    techniques: "Flocage ou panneaux rigides sous dalle (si vide sanitaire/cave)",
    epaisseur: "10-12 cm (R ≥ 3 m².K/W)",
    prix: "25-60 €/m²",
    roi: "5-8 ans",
    note: "Souvent oublié mais facile si accès au sous-sol. Supprime la sensation de sol froid.",
  },
]

const chauffageComparatif = [
  {
    systeme: "Pompe à chaleur air/eau",
    cout: "10 000 – 18 000 €",
    coutAnnuel: "800 – 1 200 €/an",
    cop: "COP 3-4 (3-4 kWh produits pour 1 consommé)",
    avantages: "Très économique, réversible (clim), éligible aux aides max",
    inconvenients: "Performances réduites sous -7°C, bruit extérieur, entretien annuel obligatoire",
  },
  {
    systeme: "Poêle/chaudière à granulés",
    cout: "8 000 – 20 000 €",
    coutAnnuel: "1 000 – 1 500 €/an",
    cop: "Rendement 90-95 %",
    avantages: "Énergie renouvelable, confort (chaleur douce), stockage facile",
    inconvenients: "Silo de stockage nécessaire, approvisionnement, entretien fréquent (ramonage 2x/an)",
  },
  {
    systeme: "Système solaire combiné (SSC)",
    cout: "15 000 – 25 000 €",
    coutAnnuel: "400 – 800 €/an",
    cop: "Couvre 40-60 % des besoins",
    avantages: "Énergie gratuite, eau chaude + chauffage, valorise le bien",
    inconvenients: "Investissement élevé, appoint nécessaire, toiture orientée sud requise",
  },
  {
    systeme: "PAC hybride (PAC + chaudière gaz)",
    cout: "12 000 – 20 000 €",
    coutAnnuel: "900 – 1 300 €/an",
    cop: "COP moyen 3.5",
    avantages: "Bascule automatique selon la température extérieure, idéal en climat froid",
    inconvenients: "Reste dépendant du gaz (fossile), double entretien",
  },
]

const ventilationComparatif = [
  {
    type: "VMC simple flux hygro B",
    prix: "500 – 1 500 €",
    description: "Bouches hygroréglables qui ajustent le débit selon l'humidité. Le standard actuel pour la rénovation. Extraction dans cuisine, SDB et WC.",
    economie: "Référence",
    note: "Suffisante dans la plupart des rénovations. Facile à installer.",
  },
  {
    type: "VMC double flux",
    prix: "4 000 – 8 000 €",
    description: "Échangeur thermique qui récupère 85-92 % de la chaleur de l'air sortant pour préchauffer l'air entrant. Filtration de l'air (pollens, poussières).",
    economie: "15-25 % sur le chauffage",
    note: "Justifiée uniquement dans les maisons très bien isolées (BBC/RT2012+). Nécessite un réseau de gaines.",
  },
]

const fenetresComparatif = [
  {
    type: "Double vitrage standard (4/16/4)",
    uw: "Uw ≈ 1.4 W/m².K",
    prix: "300 – 700 €/fenêtre",
    note: "Suffisant dans 80 % des cas en rénovation. Le meilleur rapport qualité-prix.",
  },
  {
    type: "Double vitrage renforcé (4/20/4 argon)",
    uw: "Uw ≈ 1.1 W/m².K",
    prix: "400 – 900 €/fenêtre",
    note: "20 % plus isolant que le standard. Recommandé en zones froides ou exposées au vent.",
  },
  {
    type: "Triple vitrage",
    uw: "Uw ≈ 0.8 W/m².K",
    prix: "600 – 1 200 €/fenêtre",
    note: "Justifié uniquement en construction neuve BBC ou en façade nord en zone très froide. Réduit les apports solaires gratuits.",
  },
]

const ordreOptimal = [
  {
    num: 1,
    titre: "Isolation (enveloppe)",
    explication: "Traitez d'abord le toit (30 % des pertes), puis les murs (25 %), puis le plancher. Réduisez le besoin de chauffage AVANT de changer le système.",
  },
  {
    num: 2,
    titre: "Ventilation",
    explication: "Une maison isolée doit respirer. Installez la VMC après l'isolation pour garantir la qualité de l'air et éviter la condensation.",
  },
  {
    num: 3,
    titre: "Fenêtres",
    explication: "Remplacez les fenêtres après l'isolation des murs (l'ITE modifie les tableaux). Le double vitrage argon suffit dans la plupart des cas.",
  },
  {
    num: 4,
    titre: "Chauffage",
    explication: "En dernier : une fois la maison isolée, le besoin de chauffage a baissé de 40-60 %. Vous pouvez dimensionner un système plus petit et moins cher.",
  },
]

const aides2026 = [
  {
    aide: "MaPrimeRénov' Parcours accompagné",
    montant: "Jusqu'à 63 000 € (très modestes) pour une rénovation d'ampleur",
    conditions: "Gain de 2 classes DPE minimum, accompagnement par un MAR (Mon Accompagnateur Rénov'), logement de + de 15 ans",
    detail: "Le parcours le plus avantageux : 80 % de prise en charge pour les très modestes, 60 % pour les modestes, 40 % pour les intermédiaires, 10-15 % bonus sortie de passoire (F/G).",
  },
  {
    aide: "MaPrimeRénov' Par geste",
    montant: "1 000 à 11 000 € par geste selon revenus",
    conditions: "Logement de + de 15 ans (2 ans pour les chaudières fossiles), revenus sous plafonds",
    detail: "Isolation des murs, remplacement de chauffage, VMC. Cumulable avec les CEE. Moins avantageux que le parcours accompagné pour les rénovations globales.",
  },
  {
    aide: "CEE (Certificats d'Économies d'Énergie)",
    montant: "500 à 5 000 € selon travaux et zone",
    conditions: "Travaux réalisés par un artisan RGE, matériaux conformes",
    detail: "Financés par les énergéticiens (EDF, Total, Engie). Cumulables avec MaPrimeRénov'. Pensez à vous inscrire AVANT de signer le devis.",
  },
  {
    aide: "Éco-PTZ (prêt à taux zéro)",
    montant: "Jusqu'à 50 000 € sur 20 ans (rénovation globale)",
    conditions: "Logement de + de 2 ans, travaux éligibles, artisan RGE",
    detail: "Sans conditions de revenus. 15 000 € pour un geste, 25 000 € pour deux gestes, 30 000 € pour trois gestes, 50 000 € pour une rénovation globale (performance énergétique).",
  },
  {
    aide: "TVA à 5,5 %",
    montant: "Économie de 14,5 points vs le taux normal (20 %)",
    conditions: "Logement achevé depuis + de 2 ans, travaux d'amélioration énergétique",
    detail: "Appliquée automatiquement sur la facture par l'artisan pour les travaux d'isolation, de chauffage performant et de régulation. La main-d'œuvre et les matériaux en bénéficient.",
  },
]

const roiParPoste = [
  { poste: "Isolation combles perdus", investissement: "1 500 – 3 000 €", economieAn: "400 – 800 €/an", roi: "3-5 ans" },
  { poste: "Isolation murs (ITE)", investissement: "8 000 – 20 000 €", economieAn: "600 – 1 200 €/an", roi: "10-15 ans" },
  { poste: "PAC air/eau", investissement: "10 000 – 18 000 €", economieAn: "1 000 – 2 000 €/an", roi: "7-12 ans" },
  { poste: "VMC double flux", investissement: "4 000 – 8 000 €", economieAn: "200 – 500 €/an", roi: "12-20 ans" },
  { poste: "Fenêtres double vitrage (10 unités)", investissement: "5 000 – 10 000 €", economieAn: "200 – 500 €/an", roi: "12-20 ans" },
  { poste: "Rénovation globale (passoire → C)", investissement: "30 000 – 60 000 €", economieAn: "2 000 – 4 000 €/an", roi: "10-15 ans" },
]

const services = [
  { label: "Isolation", href: "/practice-areas/isolation", icon: Home },
  { label: "Chauffagiste", href: "/practice-areas/chauffagiste", icon: Thermometer },
  { label: "Plombier", href: "/practice-areas/plombier", icon: Wrench },
  { label: "Menuisier", href: "/practice-areas/menuisier", icon: Hammer },
  { label: "Électricien", href: "/practice-areas/electricien", icon: Zap },
  { label: "Couvreur", href: "/practice-areas/couvreur", icon: Home },
]

const faqItems = [
  {
    question: "Par où commencer une rénovation énergétique ?",
    answer:
      "Commencez par un audit énergétique (800-1 500 €) qui identifie les déperditions de votre logement et propose un plan de travaux priorisé. Ensuite, suivez l'ordre : isolation (toit → murs → plancher), ventilation, fenêtres, puis chauffage. En isolant d'abord, vous réduisez le besoin de chauffage et pouvez dimensionner un système plus petit.",
  },
  {
    question: "Combien coûte une rénovation énergétique complète ?",
    answer:
      "Pour une maison de 100 m² classée F ou G, comptez 30 000 à 60 000 € HT pour atteindre la classe C ou B (isolation complète + nouveau chauffage + VMC + fenêtres). Après les aides (MaPrimeRénov Parcours accompagné + CEE + TVA 5,5 %), le reste à charge varie de 10 000 à 30 000 € selon vos revenus. L'éco-PTZ peut financer ce reste sans intérêts.",
  },
  {
    question: "Quelles sont les aides pour la rénovation énergétique en 2026 ?",
    answer:
      "Les principales aides sont : MaPrimeRénov' Parcours accompagné (jusqu'à 63 000 € pour une rénovation globale), MaPrimeRénov' Par geste (1 000-11 000 € par poste), les CEE (500-5 000 €), l'éco-PTZ (jusqu'à 50 000 € à taux zéro) et la TVA à 5,5 %. Ces aides sont cumulables. Un accompagnateur France Rénov' gratuit vous aide à monter le dossier.",
  },
  {
    question: "Faut-il isoler avant de changer le chauffage ?",
    answer:
      "Oui, toujours. En isolant d'abord (toit, murs, plancher), vous réduisez le besoin de chauffage de 40 à 60 %. Vous pouvez alors installer une PAC plus petite (et moins chère), qui sera correctement dimensionnée pour la maison isolée. Changer le chauffage avant d'isoler, c'est surdimensionner un équipement coûteux.",
  },
  {
    question: "Une pompe à chaleur fonctionne-t-elle par grand froid ?",
    answer:
      "Les PAC air/eau modernes fonctionnent jusqu'à -15°C voire -25°C. Leur rendement baisse avec le froid : COP de 4 à +7°C, COP de 2-2.5 à -7°C. En dessous de -10°C, un appoint électrique prend le relais. En France métropolitaine, une PAC bien dimensionnée couvre 90-95 % des besoins sans appoint. En montagne, privilégiez une PAC géothermique ou hybride.",
  },
  {
    question: "Combien d'années pour rentabiliser une rénovation énergétique ?",
    answer:
      "L'isolation des combles perdus est le geste le plus rapide (3-5 ans). L'isolation des murs par l'extérieur se rentabilise en 10-15 ans, une PAC en 7-12 ans. Une rénovation globale (passoire → classe C) se rentabilise en 10-15 ans, en comptant les aides. Au-delà de la rentabilité, la valorisation du bien immobilier est immédiate : une maison C vaut 10-15 % de plus qu'une maison F.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Rénovation énergétique" },
]

export default function RenovationEnergetiqueCompletePage() {
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
        name: "Rénovation énergétique complète",
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
            <Leaf className="w-4 h-4" />
            Guide rénovation énergétique
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Rénovation énergétique : guide complet pour votre maison"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Isolation, chauffage, ventilation, fenêtres : les 4 piliers pour transformer une passoire thermique en maison économe. Toutes les aides 2026 et l'ordre optimal des travaux."}
          </p>
        </section>

        {/* Par où commencer */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Par où commencer ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {parOuCommencer.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.num} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-green-100 text-green-700 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shrink-0">
                      {item.num}
                    </span>
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-green-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Les 4 piliers */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les 4 piliers de la rénovation énergétique
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {quatrePiliers.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.pilier} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.color.split(" ")[0]}`}>
                      <Icon className={`w-5 h-5 ${p.color.split(" ")[1]}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{p.pilier}</h3>
                      <span className="text-sm text-gray-500">{p.perte}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{p.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Isolation détail */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Isolation : murs, combles, plancher
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900">Zone</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Technique</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Prix / m²</th>
                  <th className="text-left p-4 font-semibold text-gray-900">ROI</th>
                </tr>
              </thead>
              <tbody>
                {isolationDetails.map((item, i) => (
                  <tr key={item.zone} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="p-4">
                      <span className="font-semibold text-gray-900">{item.zone}</span>
                      <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {item.techniques}
                      <br />
                      <span className="text-xs text-gray-400">Épaisseur : {item.epaisseur}</span>
                    </td>
                    <td className="p-4 text-green-700 font-semibold text-sm">{item.prix}</td>
                    <td className="p-4 text-sm text-gray-600">{item.roi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Chauffage comparatif */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <Thermometer className="w-8 h-8 text-red-600" />
            Chauffage : comparatif des systèmes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {chauffageComparatif.map((c) => (
              <div key={c.systeme} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{c.systeme}</h3>
                <div className="flex flex-wrap gap-3 mb-3">
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{c.cout}</span>
                  <span className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full">{c.coutAnnuel}</span>
                  <span className="bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1 rounded-full">{c.cop}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600"><span className="font-semibold text-green-700">+</span> {c.avantages}</p>
                  <p className="text-gray-600"><span className="font-semibold text-red-600">−</span> {c.inconvenients}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ventilation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <Wind className="w-8 h-8 text-blue-600" />
            Ventilation : VMC simple vs double flux
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {ventilationComparatif.map((v) => (
              <div key={v.type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{v.type}</h3>
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-3">{v.prix}</span>
                <p className="text-gray-600 text-sm mb-3">{v.description}</p>
                <p className="text-sm"><span className="font-semibold text-green-700">Économie chauffage :</span> {v.economie}</p>
                <p className="text-xs text-gray-400 mt-2">{v.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fenêtres */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Fenêtres : double vs triple vitrage
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {fenetresComparatif.map((f) => (
              <div key={f.type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.type}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{f.uw}</span>
                  <span className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full">{f.prix}</span>
                </div>
                <p className="text-gray-600 text-sm">{f.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ordre optimal */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              L{"'"}ordre optimal des travaux
            </h2>
            <p className="text-green-50 mb-8 text-lg">
              {"Respecter cet ordre maximise l'efficacité et minimise le budget total. C'est la recommandation de l'ADEME et de tous les bureaux d'études thermiques."}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {ordreOptimal.map((item) => (
                <div key={item.num} className="flex items-start gap-4">
                  <span className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shrink-0">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.titre}</h3>
                    <p className="text-green-50 text-sm">{item.explication}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Aides 2026 */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <Euro className="w-8 h-8 text-green-600" />
            Toutes les aides 2026
          </h2>
          <div className="space-y-6">
            {aides2026.map((a) => (
              <div key={a.aide} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{a.aide}</h3>
                    <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mb-3">{a.montant}</span>
                    <p className="text-gray-600 text-sm mb-2">{a.detail}</p>
                    <p className="text-xs text-gray-400"><strong>Conditions :</strong> {a.conditions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-green-800 text-sm font-medium flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <span>{"Toutes ces aides sont cumulables entre elles. Un accompagnateur France Rénov' (gratuit) vous aide à monter le dossier et à maximiser les aides. Appelez le 0 808 800 700."}</span>
            </p>
          </div>
        </section>

        {/* ROI */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            ROI : en combien de temps c{"'"}est rentable ?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900">Poste</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Investissement</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Économie / an</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Retour sur investissement</th>
                </tr>
              </thead>
              <tbody>
                {roiParPoste.map((item, i) => (
                  <tr key={item.poste} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="p-4 font-semibold text-gray-900 text-sm">{item.poste}</td>
                    <td className="p-4 text-sm text-gray-600">{item.investissement}</td>
                    <td className="p-4 text-green-700 font-semibold text-sm">{item.economieAn}</td>
                    <td className="p-4 text-blue-700 font-semibold text-sm">{item.roi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 text-sm mt-4 text-center">
            {"* ROI calculé AVANT aides. Avec MaPrimeRénov + CEE, le retour est 30-50 % plus rapide. La valorisation immobilière (non comptée ici) est un bonus supplémentaire."}
          </p>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan RGE pour votre rénovation
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Un artisan RGE (Reconnu Garant de l'Environnement) est obligatoire pour bénéficier des aides publiques."}
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

        {/* Guides liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Guides complémentaires
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/maprimerenov-2026" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-green-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors mb-1">{"MaPrimeRénov' 2026"}</h3>
              <p className="text-sm text-gray-500">{"Montants, conditions et démarches détaillées."}</p>
            </Link>
            <Link href="/guides/artisan-rge" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-green-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors mb-1">{"Artisan RGE"}</h3>
              <p className="text-sm text-gray-500">{"Comment vérifier la certification et trouver un pro."}</p>
            </Link>
            <Link href="/guides/aides-renovation-2026" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-green-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors mb-1">{"Aides rénovation 2026"}</h3>
              <p className="text-sm text-gray-500">{"Toutes les aides cumulables pour vos travaux."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-green-600" />
            Questions fréquentes sur la rénovation énergétique
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
              {"Prêt à lancer votre rénovation énergétique ?"}
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans RGE près de chez vous et comparez les devis pour votre projet d'isolation, chauffage ou ventilation."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-8 py-3.5 rounded-xl font-bold hover:bg-green-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                Trouver un artisan RGE
              </Link>
              <Link
                href="/quotes"
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
