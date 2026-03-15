import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Home,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
  Search,
  HelpCircle,
  ArrowRight,
  Euro,
  Shield,
  Thermometer,
  Zap,
  Wind,
  Wrench,
  Snowflake,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/pompe-a-chaleur`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Pompe à Chaleur : Prix, Aides et Installation 2026",
  description:
    "Guide pompe à chaleur 2026 : types (air-eau, air-air, géothermique), prix (3 000-30 000€), aides MaPrimeRénov’ jusqu’à 11 000€, installation et entretien par un artisan RGE.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Pompe à Chaleur : Prix, Aides et Installation 2026",
    description:
      "Tout savoir sur la pompe à chaleur : types, prix, aides financières MaPrimeRénov’, installation et entretien par un artisan RGE.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pompe à Chaleur : Prix, Aides et Installation 2026",
    description:
      "Tout savoir sur la pompe à chaleur : types, prix, aides financières MaPrimeRénov’, installation et entretien par un artisan RGE.",
  },
}

const typesPAC = [
  {
    name: "PAC air-air (climatisation réversible)",
    prix: "3 000 – 8 000 €",
    cop: "3,0 – 4,0",
    usage: "Chauffage + climatisation",
    dureeVie: "15 – 20 ans",
    avantages:
      "Prix accessible, installation rapide, rafraîchissement en été, idéale en rénovation",
    inconvenients:
      "Ne produit pas d’eau chaude sanitaire, non éligible à MaPrimeRénov’, performances réduites sous −5 °C",
  },
  {
    name: "PAC air-eau",
    prix: "8 000 – 16 000 €",
    cop: "3,5 – 4,5",
    usage: "Chauffage + eau chaude sanitaire",
    dureeVie: "15 – 20 ans",
    avantages:
      "Compatible avec radiateurs et plancher chauffant existants, éligible MaPrimeRénov’, COP élevé",
    inconvenients:
      "Unité extérieure parfois bruyante, performances moindres sous −7 °C, nécessite un appoint en zone très froide",
  },
  {
    name: "PAC géothermique (sol-eau)",
    prix: "15 000 – 30 000 €",
    cop: "4,0 – 5,5",
    usage: "Chauffage + eau chaude + rafraîchissement passif",
    dureeVie: "20 – 25 ans",
    avantages:
      "Meilleur rendement toute l’année, insensible aux températures extérieures, très silencieuse, éligible aux aides maximales",
    inconvenients:
      "Coût d’installation élevé, forage ou capteurs horizontaux (terrain nécessaire), travaux importants",
  },
]

const prixInstallation = [
  {
    type: "PAC air-air (monosplit)",
    prixFourniture: "1 500 – 3 000 €",
    prixPose: "1 500 – 3 000 €",
    prixTotal: "3 000 – 6 000 €",
    details: "1 unité intérieure, idéale pour une pièce",
  },
  {
    type: "PAC air-air (multisplit 3–4 unités)",
    prixFourniture: "3 000 – 5 000 €",
    prixPose: "2 000 – 3 000 €",
    prixTotal: "5 000 – 8 000 €",
    details: "3–4 pièces desservies, 1 groupe extérieur",
  },
  {
    type: "PAC air-eau (sans ECS)",
    prixFourniture: "5 000 – 9 000 €",
    prixPose: "3 000 – 5 000 €",
    prixTotal: "8 000 – 14 000 €",
    details: "Raccordement sur circuit de chauffage existant",
  },
  {
    type: "PAC air-eau (avec ECS intégrée)",
    prixFourniture: "7 000 – 11 000 €",
    prixPose: "3 000 – 5 000 €",
    prixTotal: "10 000 – 16 000 €",
    details: "Chauffage + production d’eau chaude sanitaire",
  },
  {
    type: "PAC géothermique (capteurs horizontaux)",
    prixFourniture: "8 000 – 12 000 €",
    prixPose: "7 000 – 12 000 €",
    prixTotal: "15 000 – 24 000 €",
    details: "Terrain décaisssé sur 60 cm, surface ≥ 1,5× surface chauffée",
  },
  {
    type: "PAC géothermique (forage vertical)",
    prixFourniture: "10 000 – 15 000 €",
    prixPose: "10 000 – 15 000 €",
    prixTotal: "20 000 – 30 000 €",
    details: "Forage 80–150 m, peu d’emprise au sol, autorisation préfectorale",
  },
]

const aidesFinancieres = [
  {
    name: "MaPrimeRénov’",
    icon: Euro,
    details: [
      { profil: "Ménages très modestes (Bleu)", montant: "11 000 € (PAC géothermique) / 5 000 € (PAC air-eau)" },
      { profil: "Ménages modestes (Jaune)", montant: "9 000 € (géothermique) / 4 000 € (air-eau)" },
      { profil: "Ménages intermédiaires (Violet)", montant: "6 000 € (géothermique) / 3 000 € (air-eau)" },
      { profil: "Ménages aisés (Rose)", montant: "Non éligible" },
    ],
  },
  {
    name: "CEE (Certificats d’Économies d’Énergie)",
    icon: Zap,
    details: [
      { profil: "Tous les ménages", montant: "2 500 – 5 000 € selon zone et revenus" },
    ],
  },
  {
    name: "Éco-PTZ (Prêt à Taux Zéro)",
    icon: Shield,
    details: [
      { profil: "Tous les propriétaires", montant: "Jusqu’à 50 000 € sur 20 ans, sans condition de revenus" },
    ],
  },
  {
    name: "TVA à 5,5 %",
    icon: Euro,
    details: [
      { profil: "Logements de plus de 2 ans", montant: "TVA réduite au lieu de 20 % sur fourniture et pose" },
    ],
  },
]

const etapesInstallation = [
  {
    titre: "Visite technique et dimensionnement",
    description:
      "Un chauffagiste RGE évalue votre logement : surface, isolation, déperditions thermiques, émetteurs existants (radiateurs, plancher chauffant). Il réalise une étude de dimensionnement pour déterminer la puissance nécessaire.",
  },
  {
    titre: "Choix du modèle et devis",
    description:
      "Sur la base de l’étude, l’artisan propose un modèle adapté et établit un devis détaillé incluant les aides déduites. Demandez au moins 3 devis pour comparer.",
  },
  {
    titre: "Démarches administratives et aides",
    description:
      "Dépôt des dossiers MaPrimeRénov’ et CEE AVANT signature du devis. Déclaration préalable en mairie si unité extérieure visible depuis la rue. Vérification de la qualification RGE de l’artisan.",
  },
  {
    titre: "Installation de la PAC",
    description:
      "Pose de l’unité extérieure (sur silentblocs, à distance des fenêtres des voisins), raccordement hydraulique et électrique, mise sous vide du circuit frigorigène. Durée : 1 à 3 jours selon le type.",
  },
  {
    titre: "Mise en service et réglages",
    description:
      "L’installateur met en service la PAC, paramètre la loi d’eau (courbe de chauffe), vérifie le bon fonctionnement de tous les émetteurs et remet le certificat de conformité frigorifique.",
  },
]

const services = [
  { label: "Chauffagiste", href: "/practice-areas/chauffagiste", icon: Thermometer },
  { label: "Pompe à chaleur", href: "/practice-areas/pompe-a-chaleur", icon: Wind },
  { label: "Climaticien", href: "/practice-areas/climaticien", icon: Snowflake },
  { label: "Plombier", href: "/practice-areas/plombier", icon: Wrench },
]

const faqItems = [
  {
    question: "Quel est le prix moyen d’une pompe à chaleur en 2026 ?",
    answer:
      "Le prix varie selon le type : 3 000 à 8 000 € pour une PAC air-air, 8 000 à 16 000 € pour une PAC air-eau, et 15 000 à 30 000 € pour une PAC géothermique. Ces prix incluent la fourniture et la pose. Après déduction des aides (MaPrimeRénov’ + CEE), le reste à charge pour une PAC air-eau peut descendre à 3 000–7 000 €.",
  },
  {
    question: "Quelles aides pour installer une pompe à chaleur en 2026 ?",
    answer:
      "Les principales aides sont MaPrimeRénov’ (jusqu’à 11 000 € pour une PAC géothermique, 5 000 € pour une air-eau), les CEE (2 500 à 5 000 €), l’éco-PTZ (jusqu’à 50 000 € à taux zéro) et la TVA à 5,5 %. Ces aides sont cumulables. Condition obligatoire : l’installation doit être réalisée par un artisan certifié RGE.",
  },
  {
    question: "Une pompe à chaleur est-elle bruyante ?",
    answer:
      "L’unité extérieure d’une PAC air-eau ou air-air émet entre 45 et 65 dB(A) selon le modèle et le régime. Les modèles récents à compresseur Inverter descendent sous 50 dB(A) en fonctionnement normal. Il est recommandé de l’éloigner des chambres et des limites de propriété. Les PAC géothermiques sont quasiment silencieuses (pas d’unité extérieure).",
  },
  {
    question: "Quelle est la consommation électrique d’une pompe à chaleur ?",
    answer:
      "Une PAC air-eau avec un COP de 4 consomme 1 kWh d’électricité pour produire 4 kWh de chaleur. Pour une maison de 120 m² moyennement isolée, cela représente environ 3 000 à 5 000 kWh/an, soit 700 à 1 200 €/an au tarif réglementé 2026. C’est 2 à 3 fois moins qu’un chauffage électrique direct et souvent moins qu’une chaudière gaz.",
  },
  {
    question: "Peut-on remplacer une chaudière gaz par une pompe à chaleur ?",
    answer:
      "Oui, c’est l’une des installations les plus courantes. La PAC air-eau se raccorde directement sur le circuit de chauffage existant (radiateurs haute température ou plancher chauffant). Si vos radiateurs sont anciens, optez pour une PAC haute température (jusqu’à 65 °C en sortie). L’opération est fortement subventionnée dans le cadre de la décarbonation du chauffage.",
  },
  {
    question: "Quel entretien pour une pompe à chaleur ?",
    answer:
      "Depuis 2020, un entretien obligatoire par un professionnel certifié est requis tous les 2 ans pour les PAC contenant plus de 2 kg de fluide frigorigène (quasiment tous les modèles). L’entretien inclut la vérification du circuit, le contrôle d’étanchéité, le nettoyage des filtres et de l’échangeur extérieur. Coût : 150 à 300 € par intervention, ou 200 à 400 €/an en contrat d’entretien.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Pompe à chaleur" },
]

export default function PompeAChaleurPage() {
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
        name: "Pompe à chaleur",
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
            Guide pompe à chaleur
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Pompe à chaleur : guide complet prix, aides et installation 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Vous envisagez d’installer une pompe à chaleur ? Découvrez les types de PAC, les prix, les aides financières et les conseils pour choisir le bon modèle et le bon artisan RGE."}
          </p>
        </section>

        {/* Types de PAC */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les différents types de pompe à chaleur
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {typesPAC.map((t) => (
              <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t.name}</h3>
                <div className="flex flex-wrap gap-2 text-sm mb-3">
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <Euro className="w-3 h-3" /> {t.prix}
                  </span>
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    <Zap className="w-3 h-3" /> COP {t.cop}
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" /> {t.dureeVie}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{t.usage}</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">Avantages</p>
                    <p className="text-sm text-gray-600">{t.avantages}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-700 mb-1">Inconvénients</p>
                    <p className="text-sm text-gray-600">{t.inconvenients}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prix installation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Prix d{"'"}installation par type de PAC
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-900">Type de PAC</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Fourniture</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Pose</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {prixInstallation.map((p, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{p.type}</span>
                        <br />
                        <span className="text-xs text-gray-500">{p.details}</span>
                      </td>
                      <td className="p-4 text-gray-700">{p.prixFourniture}</td>
                      <td className="p-4 text-gray-700">{p.prixPose}</td>
                      <td className="p-4 font-semibold text-blue-700">{p.prixTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Aides financières */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Aides financières 2026 pour une pompe à chaleur
            </h2>
            <p className="text-green-50 mb-6 text-lg">
              {"Les aides sont cumulables entre elles. Condition obligatoire : installation par un artisan certifié RGE. Les PAC air-air ne sont pas éligibles à MaPrimeRénov’."}
            </p>
            <div className="space-y-6">
              {aidesFinancieres.map((aide) => {
                const Icon = aide.icon
                return (
                  <div key={aide.name} className="bg-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">{aide.name}</h3>
                    </div>
                    <div className="space-y-2">
                      {aide.details.map((d, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                          <span className="text-green-100">{d.profil}</span>
                          <span className="font-semibold text-white">{d.montant}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Comment choisir sa PAC */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Comment choisir sa pompe à chaleur
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Surface et isolation</h3>
              </div>
              <p className="text-gray-600">
                {"Une maison bien isolée de 120 m² nécessite une PAC de 6 à 8 kW. Une maison mal isolée peut exiger 12 à 16 kW. Faites réaliser un bilan thermique pour dimensionner correctement : une PAC surdimensionnée consomme plus et s’use prématurément."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Zone climatique</h3>
              </div>
              <p className="text-gray-600">
                {"En zone H1 (Nord, Est, montagne), privilégiez une PAC air-eau haute température ou géothermique. En zone H3 (Méditerranée), une PAC air-air peut suffire. Le COP diminue avec le froid : vérifiez les performances à −7 °C (norme EN14511)."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wind className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Émetteurs existants</h3>
              </div>
              <p className="text-gray-600">
                {"Plancher chauffant : idéal, fonctionne à basse température (35 °C). Radiateurs basse température : compatibles. Radiateurs haute température (fonte ancienne) : choisissez une PAC haute température (jusqu’à 65 °C). Ventilo-convecteurs : PAC air-air."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Euro className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Budget et rentabilité</h3>
              </div>
              <p className="text-gray-600">
                {"Après aides, une PAC air-eau coûte 3 000 à 10 000 € de reste à charge. L’économie sur la facture énergétique est de 30 à 60 % par rapport à une chaudière gaz. Le retour sur investissement se situe entre 5 et 10 ans selon votre situation."}
              </p>
            </div>
          </div>
        </section>

        {/* Étapes installation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Installation : étapes et délais
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-4">
                {etapesInstallation.map((etape, index) => (
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
              <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                <strong>Délai total :</strong> comptez 2 à 4 semaines entre la visite technique et la mise en service pour une PAC air-eau, et 4 à 8 semaines pour une PAC géothermique (forage inclus).
              </div>
            </div>
          </div>
        </section>

        {/* Entretien et durée de vie */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Entretien et durée de vie
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Entretien obligatoire</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Révision tous les 2 ans par un professionnel certifié (obligatoire depuis 2020)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Contrôle d’étanchéité du circuit frigorifique"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Nettoyage des filtres et de l’échangeur extérieur"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Coût : 150 à 300 € par intervention, ou 200 à 400 €/an en contrat"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Durée de vie par type</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"PAC air-air : 15 à 20 ans"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"PAC air-eau : 15 à 20 ans"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"PAC géothermique : 20 à 25 ans (capteurs enterrés : 40+ ans)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-300" />
                    <span>{"Un entretien régulier peut prolonger la durée de vie de 5 ans"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un installateur qualifié RGE
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Confiez l’installation de votre pompe à chaleur à des professionnels certifiés RGE et assurés en décennale."}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="text-sm text-gray-500">{"Toutes les aides pour financer votre pompe à chaleur."}</p>
            </Link>
            <Link href="/guides/artisan-rge" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Artisan RGE"}</h3>
              <p className="text-sm text-gray-500">{"Obligatoire pour bénéficier des aides à l’installation."}</p>
            </Link>
            <Link href="/guides/guarantee-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Vérifiez la décennale de votre installateur avant travaux."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur la pompe à chaleur
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
              {"Besoin d’un installateur pour votre pompe à chaleur ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des chauffagistes RGE qualifiés près de chez vous. Devis gratuit et sans engagement."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/practice-areas/chauffagiste"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un chauffagiste RGE"}
              </Link>
              <Link
                href="/quotes"
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
