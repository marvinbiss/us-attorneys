import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ShowerHead,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  HelpCircle,
  ArrowRight,
  Hammer,
  Home,
  Droplets,
  Sparkles,
  Wrench,
  FileCheck,
  Zap,
  TrendingUp,
  Accessibility,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/renovation-salle-de-bain`

export const metadata: Metadata = {
  title: "Rénovation Salle de Bain : Étapes, Prix et Conseils 2026",
  description:
    "Guide complet rénovation salle de bain 2026 : étapes clés, prix par poste (douche italienne, carrelage, plomberie), budget total, erreurs à éviter et aides financières.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Rénovation Salle de Bain : Étapes, Prix et Conseils 2026",
    description:
      "Toutes les étapes d'une rénovation de salle de bain, les prix détaillés par poste et les conseils d'artisans pour réussir votre projet.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rénovation Salle de Bain : Étapes, Prix et Conseils 2026",
    description:
      "Toutes les étapes d'une rénovation de salle de bain, les prix détaillés par poste et les conseils d'artisans pour réussir votre projet.",
  },
}

const etapes = [
  {
    num: 1,
    title: "Démolition et dépose",
    description:
      "Retrait de l'ancien carrelage, dépose de la baignoire ou du receveur, évacuation des gravats. Protégez les pièces adjacentes avec des bâches et du ruban.",
  },
  {
    num: 2,
    title: "Plomberie",
    description:
      "Déplacement ou création des arrivées d'eau (chaude/froide) et des évacuations. C'est le moment de passer au PER multicouche si votre installation est en cuivre ancien.",
  },
  {
    num: 3,
    title: "Électricité",
    description:
      "Mise aux normes NF C 15-100 : volumes de sécurité, prises à distance de la douche, éclairage IP44 minimum. Un point souvent sous-estimé mais obligatoire.",
  },
  {
    num: 4,
    title: "Étanchéité (SPEC)",
    description:
      "Application du système d'étanchéité liquide (SEL) sous le carrelage : bandes de renfort dans les angles, deux couches croisées, remontées de 10 cm minimum. Étape critique souvent bâclée.",
  },
  {
    num: 5,
    title: "Revêtements",
    description:
      "Pose du carrelage mural et au sol, joints époxy pour les zones humides. Pensez aux grandes dalles (60×120 cm) pour limiter les joints et faciliter l'entretien.",
  },
  {
    num: 6,
    title: "Sanitaires et robinetterie",
    description:
      "Installation de la douche ou baignoire, du meuble vasque, du WC et de la robinetterie. Vérifiez les raccordements avant de poser les finitions.",
  },
  {
    num: 7,
    title: "Finitions",
    description:
      "Peinture anti-humidité au plafond, pose des accessoires (miroir, porte-serviette, paroi de douche), joints silicone sanitaire et test d'étanchéité final.",
  },
]

const prixParPoste = [
  {
    poste: "Douche à l'italienne",
    fourchette: "1 500 – 5 000 €",
    detail: "Receveur extra-plat + paroi verre 8 mm + robinetterie encastrée. Le prix varie selon la taille et le type de colonne (thermostatique, effet pluie).",
    icon: Droplets,
  },
  {
    poste: "Baignoire",
    fourchette: "800 – 3 000 €",
    detail: "Baignoire acrylique standard (800 €) à îlot en Solid Surface (3 000 €+). Ajoutez 300-600 € pour un tablier carrelé sur mesure.",
    icon: Home,
  },
  {
    poste: "Meuble vasque",
    fourchette: "300 – 2 000 €",
    detail: "Meuble suspendu 60 cm avec vasque intégrée dès 300 €. Double vasque 120 cm en chêne massif + plan céramique : 1 200-2 000 €.",
    icon: Home,
  },
  {
    poste: "Carrelage (fourni posé)",
    fourchette: "30 – 120 €/m²",
    detail: "Grès cérame standard 30-50 €/m², imitation bois 50-80 €/m², zellige ou pierre naturelle 80-120 €/m². Main-d'œuvre incluse.",
    icon: Hammer,
  },
  {
    poste: "Plomberie complète",
    fourchette: "1 500 – 4 000 €",
    detail: "Déplacement des arrivées et évacuations, remplacement des canalisations. Plus cher si modification du réseau principal.",
    icon: Wrench,
  },
  {
    poste: "Électricité",
    fourchette: "500 – 1 500 €",
    detail: "Mise aux normes, spots LED encastrés IP44, prise rasoir, sèche-serviette électrique.",
    icon: Zap,
  },
]

const budgetTotal = [
  {
    gamme: "Rafraîchissement",
    prix: "3 000 – 5 000 €",
    description: "Peinture, remplacement robinetterie, nouveau meuble vasque, accessoires. Pas de modification de plomberie.",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    gamme: "Rénovation complète",
    prix: "8 000 – 15 000 €",
    description: "Dépose totale, nouvelle plomberie, carrelage sol et murs, douche italienne, meuble vasque, électricité aux normes.",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    gamme: "Haut de gamme",
    prix: "15 000 – 30 000 €",
    description: "Matériaux premium (pierre naturelle, robinetterie design), douche XXL, double vasque, chauffage au sol, domotique.",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
]

const erreurs = [
  {
    title: "Étanchéité bâclée",
    description:
      "L'absence ou la mauvaise application du système d'étanchéité sous le carrelage provoque des infiltrations invisibles. Les dégâts apparaissent des mois plus tard : moisissures, plancher endommagé, plafond de l'étage inférieur abîmé. Exigez un SEL (système d'étanchéité liquide) certifié.",
  },
  {
    title: "Ventilation oubliée",
    description:
      "Une salle de bain sans VMC efficace, c'est l'assurance de problèmes d'humidité. La VMC doit extraire au minimum 15 m³/h en continu (30 m³/h en boost). Vérifiez que la bouche d'extraction n'est pas obstruée.",
  },
  {
    title: "Prises mal placées",
    description:
      "La norme NF C 15-100 impose des volumes de sécurité stricts. Aucune prise dans le volume 0 (dans la douche/baignoire), volume 1 réservé aux équipements très basse tension. Anticipez l'emplacement du sèche-cheveux et du rasoir.",
  },
  {
    title: "Pente d'évacuation insuffisante",
    description:
      "Pour une douche à l'italienne, la pente vers le siphon doit être de 1 à 2 cm par mètre. Trop faible : l'eau stagne. Trop forte : inconfort et risque de glissade. Faites poser par un professionnel expérimenté.",
  },
]

const tendances = [
  {
    title: "Douche à l'italienne XXL",
    description: "Receveurs de 120×90 cm minimum, voire walk-in sans porte avec paroi fixe en verre 10 mm. Le confort hôtelier à domicile.",
  },
  {
    title: "Meuble vasque suspendu",
    description: "Facilite le nettoyage du sol, agrandit visuellement l'espace. Les tiroirs à sortie totale avec amortisseur sont devenus le standard.",
  },
  {
    title: "Robinetterie noire mate",
    description: "Mitigeurs, douchettes et accessoires en noir mat ou gunmetal. Associés au carrelage clair, ils créent un contraste élégant et intemporel.",
  },
  {
    title: "Carreaux grand format",
    description: "Dalles 60×120 ou 120×120 cm : moins de joints, aspect épuré, nettoyage facilité. Nécessitent un sol parfaitement plan (ragréage).",
  },
  {
    title: "Niche encastrée",
    description: "Étagère intégrée dans le mur de la douche pour ranger shampoings et gels sans encombrer. Prévoir le renfort du mur à la construction.",
  },
]

const services = [
  { label: "Plombier", href: "/services/plombier", icon: Wrench },
  { label: "Carreleur", href: "/services/carreleur", icon: Hammer },
  { label: "Électricien", href: "/services/electricien", icon: Zap },
  { label: "Rénovation intérieure", href: "/services/renovation-interieure", icon: Home },
  { label: "Peintre", href: "/services/peintre", icon: Sparkles },
]

const faqItems = [
  {
    question: "Combien coûte une rénovation complète de salle de bain ?",
    answer:
      "Pour une salle de bain de 5 à 8 m², comptez entre 8 000 et 15 000 € en rénovation complète (dépose, plomberie, électricité, carrelage, sanitaires). Un simple rafraîchissement (peinture, robinetterie, meuble) revient à 3 000-5 000 €. Le haut de gamme avec matériaux premium peut atteindre 20 000-30 000 €.",
  },
  {
    question: "Combien de temps durent les travaux de rénovation SDB ?",
    answer:
      "Un rafraîchissement prend 3 à 5 jours. Une rénovation complète nécessite 1 à 2 semaines. Pour une salle de bain haut de gamme avec modification de cloisons ou déplacement de plomberie important, prévoyez 2 à 3 semaines. L'idéal est d'avoir un deuxième point d'eau pendant les travaux.",
  },
  {
    question: "Douche italienne ou baignoire : que choisir ?",
    answer:
      "La douche à l'italienne est le choix le plus populaire en 2026 : gain de place, accessibilité, esthétique. La baignoire reste pertinente si vous avez de jeunes enfants ou si vous disposez de deux salles de bain (une avec baignoire, une avec douche). Pour la revente, la présence d'au moins une baignoire est un plus.",
  },
  {
    question: "Faut-il un permis pour rénover une salle de bain ?",
    answer:
      "Non, la rénovation de salle de bain ne nécessite pas de permis de construire ni de déclaration préalable tant que vous ne modifiez pas la façade extérieure. En revanche, en copropriété, prévenez le syndic si vous intervenez sur les colonnes d'eau communes. Un diagnostic amiante peut être obligatoire dans les immeubles d'avant 1997.",
  },
  {
    question: "Quelles aides financières pour une rénovation de salle de bain ?",
    answer:
      "Pour une rénovation classique, pas d'aide spécifique. En revanche, si les travaux visent l'adaptation PMR (douche accessible, barres d'appui, siège de douche), vous pouvez bénéficier de MaPrimeAdapt' (jusqu'à 70 % du montant), du crédit d'impôt autonomie (25 % plafonné à 5 000 €) et de la TVA à 5,5 %. Hors PMR, la TVA est à 10 % pour les travaux dans un logement de plus de 2 ans.",
  },
  {
    question: "Comment choisir le bon artisan pour ma salle de bain ?",
    answer:
      "Demandez au moins 3 devis détaillés. Vérifiez le SIRET, l'assurance décennale et les avis clients. Privilégiez un artisan qui a déjà réalisé des salles de bain similaires et qui peut montrer des photos de chantiers terminés. Méfiez-vous des prix anormalement bas : ils cachent souvent des économies sur l'étanchéité ou l'électricité.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Rénovation salle de bain" },
]

export default function RenovationSalleDeBainPage() {
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
        name: "Rénovation salle de bain",
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
            <ShowerHead className="w-4 h-4" />
            Guide rénovation salle de bain
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Rénovation salle de bain : étapes, prix et conseils 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"De la démolition aux finitions, découvrez toutes les étapes d'une rénovation de salle de bain réussie, les prix détaillés par poste et les pièges à éviter."}
          </p>
        </section>

        {/* Étapes */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les 7 étapes d{"'"}une rénovation de salle de bain
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <ol className="space-y-6">
              {etapes.map((e) => (
                <li key={e.num} className="flex items-start gap-4">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shrink-0">
                    {e.num}
                  </span>
                  <div>
                    <strong className="text-gray-900 text-lg">{e.title}</strong>
                    <p className="mt-1 text-gray-600">{e.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Prix par poste */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Prix par poste en 2026
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {prixParPoste.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.poste} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{p.poste}</h3>
                      <span className="text-blue-700 font-semibold text-sm">{p.fourchette}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{p.detail}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Budget total */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Quel budget total prévoir ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {budgetTotal.map((b) => (
              <div key={b.gamme} className={`rounded-xl border-2 p-6 ${b.color}`}>
                <h3 className="text-lg font-bold mb-2">{b.gamme}</h3>
                <p className="text-2xl font-extrabold mb-3">{b.prix}</p>
                <p className="text-sm opacity-80">{b.description}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-4 text-center">
            {"* Prix indicatifs pour une salle de bain de 5 à 8 m² en Île-de-France. Comptez 10-20 % de moins en province."}
          </p>
        </section>

        {/* Erreurs à éviter */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Les erreurs à éviter absolument
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {erreurs.map((e) => (
                <div key={e.title} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{e.title}</h3>
                    <p className="text-red-50 text-sm">{e.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tendances 2026 */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Tendances salle de bain 2026
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tendances.map((t) => (
              <div key={t.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-gray-600 text-sm">{t.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Aides financières */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading flex items-center gap-3">
              <Accessibility className="w-8 h-8" />
              Aides financières disponibles
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Adaptation PMR (personnes à mobilité réduite)</h3>
                <ul className="space-y-3 text-green-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span><strong>MaPrimeAdapt{"'"}</strong> — Jusqu{"'"}à 70 % des travaux (sous conditions de revenus et d{"'"}âge/handicap)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span><strong>Crédit d{"'"}impôt autonomie</strong> — 25 % plafonné à 5 000 € (personne seule) ou 10 000 € (couple)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span><strong>TVA à 5,5 %</strong> — Sur les équipements spécialement conçus pour les personnes handicapées</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Rénovation classique</h3>
                <ul className="space-y-3 text-green-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span><strong>TVA à 10 %</strong> — Pour tout logement achevé depuis plus de 2 ans (au lieu de 20 %)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span><strong>Éco-PTZ</strong> — Si les travaux incluent un volet énergétique (isolation, chauffe-eau thermodynamique)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span><strong>Aides locales</strong> — Certaines communes ou départements proposent des subventions pour la rénovation de l{"'"}habitat</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Durée des travaux */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Durée des travaux selon l{"'"}ampleur
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Rafraîchissement</h3>
              <p className="text-2xl font-extrabold text-green-700 mb-2">3 à 5 jours</p>
              <p className="text-gray-600 text-sm">
                {"Peinture, changement de robinetterie et accessoires, nouveau meuble vasque. Pas d'intervention sur la plomberie."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Rénovation complète</h3>
              <p className="text-2xl font-extrabold text-blue-700 mb-2">1 à 2 semaines</p>
              <p className="text-gray-600 text-sm">
                {"Dépose totale, plomberie, électricité, carrelage, pose des sanitaires. Prévoyez un deuxième point d'eau."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-purple-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Haut de gamme</h3>
              <p className="text-2xl font-extrabold text-purple-700 mb-2">2 à 3 semaines</p>
              <p className="text-gray-600 text-sm">
                {"Modification de cloisons, déplacement de plomberie, matériaux sur-mesure, domotique intégrée."}
              </p>
            </div>
          </div>
        </section>

        {/* Comment choisir ses artisans */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Comment choisir ses artisans ?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Les bons réflexes</h3>
                <ol className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                    <span>{"Demandez au moins 3 devis détaillés (prix unitaires, pas un montant global)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                    <span>{"Vérifiez le SIRET, l'assurance décennale et la RC pro"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                    <span>{"Demandez des photos de chantiers précédents similaires"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                    <span>{"Privilégiez un artisan qui se déplace pour voir les lieux avant de chiffrer"}</span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Trouvez un pro sur ServicesArtisans</h3>
                <p className="text-blue-50 mb-4">
                  {"Consultez les profils détaillés des artisans de votre région : SIRET vérifié, assurances, avis clients et spécialités."}
                </p>
                <Link
                  href="/recherche"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Trouver un artisan
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Artisans pour votre salle de bain
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Les professionnels dont vous aurez besoin pour votre rénovation de salle de bain."}
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
            <Link href="/guides/renovation-cuisine" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Rénovation cuisine"}</h3>
              <p className="text-sm text-gray-500">{"Étapes, prix et conseils pour rénover votre cuisine."}</p>
            </Link>
            <Link href="/guides/renovation-energetique-complete" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Rénovation énergétique"}</h3>
              <p className="text-sm text-gray-500">{"Guide complet : isolation, chauffage, aides 2026."}</p>
            </Link>
            <Link href="/guides/devis-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Comment comparer les devis et éviter les pièges."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur la rénovation de salle de bain
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
              {"Prêt à rénover votre salle de bain ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans qualifiés près de chez vous et comparez les devis gratuitement."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/recherche"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                Trouver un artisan
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
