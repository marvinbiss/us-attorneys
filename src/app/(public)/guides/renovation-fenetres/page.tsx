import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
  Search,
  HelpCircle,
  ArrowRight,
  Building2,
  Hammer,
  Euro,
  Home,
  Wind,
  Thermometer,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/renovation-fenetres`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Changer ses Fenêtres : Matériaux, Prix et Aides 2026",
  description:
    "Guide complet remplacement de fenêtres 2026 : matériaux (PVC, bois, alu), types d'ouverture, vitrage, prix (300-1500€), aides MaPrimeRénov et CEE.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Changer ses Fenêtres : Matériaux, Prix et Aides 2026",
    description:
      "Tout savoir pour changer vos fenêtres : matériaux, types d'ouverture, vitrage, prix et aides financières disponibles en 2026.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Changer ses Fenêtres : Matériaux, Prix et Aides 2026",
    description:
      "Tout savoir pour changer vos fenêtres : matériaux, types d'ouverture, vitrage, prix et aides financières disponibles en 2026.",
  },
}

const signesRemplacement = [
  {
    name: "Coefficient Uw > 1,8 W/m².K",
    icon: Thermometer,
    description:
      "Les fenêtres anciennes (simple vitrage, double vitrage avant 2000) ont un coefficient thermique médiocre. Un Uw > 1,8 signifie des déperditions importantes. Les fenêtres modernes atteignent Uw ≤ 1,3 (double vitrage) voire ≤ 0,8 (triple vitrage).",
  },
  {
    name: "Condensation entre les vitres",
    icon: Wind,
    description:
      "De la buée entre les deux vitres d'un double vitrage indique que le joint hermétique est rompu. Le gaz isolant (argon) s'est échappé et la fenêtre a perdu ses propriétés isolantes. Le remplacement du vitrage ou de la fenêtre complète est nécessaire.",
  },
  {
    name: "Courants d'air et bruit",
    icon: Home,
    description:
      "Des courants d'air froid autour du cadre, des sifflements par vent fort ou un bruit extérieur excessif sont des signes de joints usés ou de menuiseries déformées. L'isolation acoustique et thermique est compromise.",
  },
  {
    name: "Cadres abîmés ou difficiles à manœuvrer",
    icon: AlertTriangle,
    description:
      "Des cadres en bois pourris, des ferrures grippées ou des fenêtres qui ne ferment plus correctement compromettent la sécurité et l'étanchéité. La réparation n'est souvent plus rentable au-delà de 25 ans.",
  },
]

const materiaux = [
  {
    name: "PVC",
    prix: "300 – 800 €",
    dureeVie: "30 – 40 ans",
    isolation: "Uw ≈ 1,2 – 1,4",
    avantages: "Excellent rapport qualité/prix, aucun entretien, bonne isolation thermique, large choix de coloris",
    inconvenients: "Esthétique standard, recyclabilité en progrès, dilatation thermique",
  },
  {
    name: "Bois",
    prix: "500 – 1 200 €",
    dureeVie: "40 – 60 ans",
    isolation: "Uw ≈ 1,2 – 1,5",
    avantages: "Esthétique noble et chaleureuse, excellent isolant naturel, écologique, réparable",
    inconvenients: "Entretien régulier (lasure ou peinture tous les 5-8 ans), prix élevé",
  },
  {
    name: "Aluminium",
    prix: "600 – 1 500 €",
    dureeVie: "40 – 50 ans",
    isolation: "Uw ≈ 1,4 – 1,8 (avec rupture de pont thermique)",
    avantages: "Design fin et contemporain, grandes surfaces vitrées, aucun entretien, recyclable à 100 %",
    inconvenients: "Conducteur thermique (rupture de pont thermique indispensable), prix élevé",
  },
  {
    name: "Mixte bois-aluminium",
    prix: "800 – 1 500 €",
    dureeVie: "50+ ans",
    isolation: "Uw ≈ 1,0 – 1,3",
    avantages: "Bois côté intérieur (chaleur), aluminium côté extérieur (résistance), excellente isolation",
    inconvenients: "Prix le plus élevé, disponibilité limitée chez certains fabricants",
  },
]

const typesOuverture = [
  {
    name: "Battante (à la française)",
    description: "Ouverture vers l'intérieur sur un axe vertical. Le classique en France. Permet une ventilation maximale et un entretien facile du vitrage extérieur.",
  },
  {
    name: "Oscillo-battante",
    description: "Double mode : ouverture classique à la française + entrebâillement par le haut (oscillo). Idéale pour ventiler en toute sécurité, recommandée pour les chambres d'enfants et les étages.",
  },
  {
    name: "Coulissante",
    description: "Le vantail glisse horizontalement sur un rail. N'empiète pas sur l'espace intérieur. Idéale pour les baies vitrées et les accès terrasse. Version à galandage (le vantail disparaît dans le mur) pour un maximum de dégagement.",
  },
  {
    name: "À soufflet",
    description: "Ouverture par le haut uniquement, vers l'intérieur. Parfaite pour les petites fenêtres de salle de bain ou de cuisine au-dessus de l'évier, où l'espace est limité.",
  },
]

const services = [
  { label: "Menuisier", href: "/services/menuisier", icon: Hammer },
  { label: "Vitrier", href: "/services/vitrier", icon: Home },
  { label: "Isolation", href: "/services/isolation", icon: Building2 },
  { label: "Peintre", href: "/services/peintre", icon: Hammer },
  { label: "Maçon", href: "/services/macon", icon: Building2 },
]

const faqItems = [
  {
    question: "Quel est le prix moyen pour changer une fenêtre ?",
    answer:
      "Le prix d'une fenêtre standard (120 × 135 cm) varie selon le matériau : PVC 300 à 800 €, bois 500 à 1 200 €, aluminium 600 à 1 500 €, mixte bois-alu 800 à 1 500 €. Ajoutez 150 à 400 € de pose par fenêtre. Pour une maison avec 10 fenêtres en PVC, comptez 5 000 à 12 000 € tout compris, hors aides.",
  },
  {
    question: "Double ou triple vitrage : que choisir ?",
    answer:
      "Le double vitrage (Ug ≈ 1,1 W/m².K) est suffisant dans la majorité des cas en France métropolitaine. Le triple vitrage (Ug ≈ 0,5-0,7 W/m².K) est recommandé pour les façades nord en zones froides (altitude, nord-est), les maisons passives ou BBC. Le triple vitrage est plus lourd, plus épais et réduit légèrement les apports solaires gratuits.",
  },
  {
    question: "Pose en rénovation ou dépose totale ?",
    answer:
      "La pose en rénovation conserve l'ancien dormant (cadre fixe) et pose la nouvelle fenêtre par-dessus. Plus rapide (2h par fenêtre), moins cher, pas de travaux de maçonnerie, mais réduit la surface vitrée de 10-15 %. La dépose totale retire tout l'ancien bâti. Plus coûteux (reprise des enduits, étanchéité), mais meilleure isolation et surface vitrée maximale. Recommandée si le dormant est abîmé.",
  },
  {
    question: "Quelles aides pour changer ses fenêtres en 2026 ?",
    answer:
      "MaPrimeRénov : 40 à 100 € par fenêtre selon vos revenus (passage simple vitrage vers double/triple vitrage). CEE : prime énergie de 30 à 80 € par fenêtre. TVA à 5,5 % au lieu de 20 % (économie significative sur la main-d'œuvre et les fournitures). Éco-PTZ : prêt à taux zéro jusqu'à 50 000 €. Condition : artisan RGE obligatoire.",
  },
  {
    question: "Faut-il une autorisation pour changer ses fenêtres ?",
    answer:
      "Si vous remplacez à l'identique (même matériau, même couleur, même dimension), aucune autorisation n'est nécessaire. Si vous changez l'aspect extérieur (couleur, matériau, taille), une déclaration préalable de travaux est obligatoire. En copropriété, le règlement peut imposer un modèle et une couleur. En secteur protégé, l'avis de l'ABF est requis.",
  },
  {
    question: "Quelle est la durée de vie d'une fenêtre ?",
    answer:
      "Une fenêtre PVC dure 30 à 40 ans, une fenêtre bois 40 à 60 ans (avec entretien), une fenêtre aluminium 40 à 50 ans et une fenêtre mixte 50 ans et plus. Le vitrage lui-même peut durer plus longtemps que le cadre. Les joints d'étanchéité doivent être remplacés tous les 10-15 ans pour maintenir les performances.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Changer ses fenêtres" },
]

export default function RenovationFenetresPage() {
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
        name: "Changer ses fenêtres",
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
            <Home className="w-4 h-4" />
            Guide remplacement fenêtres
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Changer ses fenêtres : guide des matériaux, prix et aides 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Vos fenêtres laissent passer le froid et le bruit ? Découvrez les matériaux, les types de vitrage, les prix et les aides financières pour les remplacer."}
          </p>
        </section>

        {/* Quand changer */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Quand faut-il changer ses fenêtres ?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {signesRemplacement.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-amber-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{s.name}</h3>
                  </div>
                  <p className="text-gray-600">{s.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Matériaux */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Comparatif des matériaux et prix
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {materiaux.map((m) => (
              <div key={m.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{m.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm mb-3">
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <Euro className="w-3 h-3" /> {m.prix}
                  </span>
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" /> {m.dureeVie}
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    <Thermometer className="w-3 h-3" /> {m.isolation}
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
            ))}
          </div>
        </section>

        {/* Types d'ouverture */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Types d{"'"}ouverture
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {typesOuverture.map((t) => (
              <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t.name}</h3>
                <p className="text-gray-600">{t.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vitrage */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Guide du vitrage
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Double vitrage</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"4/16/4 avec argon : Ug ≈ 1,1 W/m².K"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Standard en France depuis 2005"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Suffisant pour 90 % des situations"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Triple vitrage</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"4/12/4/12/4 avec argon : Ug ≈ 0,5-0,7"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Idéal façades nord, zones froides"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Réduit les apports solaires gratuits"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Vitrage phonique</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Verres asymétriques (10/6/4) : -37 dB"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Idéal rues passantes, proximité voies"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Feuilleté acoustique pour plus de confort"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pose en rénovation vs dépose totale */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Pose en rénovation vs dépose totale
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pose en rénovation</h3>
              <p className="text-sm font-medium text-blue-600 mb-3">150 – 250 € / fenêtre</p>
              <p className="text-gray-600 mb-3">
                {"La nouvelle fenêtre est posée sur l'ancien dormant (cadre fixe). Pas de travaux de maçonnerie, pose rapide (1 à 2h par fenêtre), pas de dégradation des finitions intérieures."}
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Rapide et économique</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Pas de reprise des enduits</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>Réduit la surface vitrée de 10-15 %</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dépose totale</h3>
              <p className="text-sm font-medium text-blue-600 mb-3">250 – 400 € / fenêtre</p>
              <p className="text-gray-600 mb-3">
                {"L'ancien cadre est entièrement retiré. La nouvelle fenêtre est fixée directement dans la maçonnerie. Meilleure isolation et étanchéité, surface vitrée maximale."}
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Meilleure isolation thermique</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Surface vitrée maximale</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>Reprise des enduits et peinture</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Aides financières */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Aides financières pour changer vos fenêtres
            </h2>
            <p className="text-green-50 mb-6 text-lg">
              {"Le remplacement de fenêtres simple vitrage par du double ou triple vitrage est éligible à plusieurs aides (artisan RGE obligatoire) :"}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">MaPrimeRénov{"'"}</h3>
                <p className="text-green-50 text-sm">{"40 à 100 € par fenêtre selon vos revenus. Réservée au remplacement de simple vitrage. Non cumulable avec le parcours accompagné pour les fenêtres seules."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">CEE (Prime énergie)</h3>
                <p className="text-green-50 text-sm">{"Prime versée par les fournisseurs d'énergie : 30 à 80 € par fenêtre. Cumulable avec MaPrimeRénov. Demande à faire avant la signature du devis."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">TVA à 5,5 %</h3>
                <p className="text-green-50 text-sm">{"TVA réduite à 5,5 % sur les fenêtres et la pose (au lieu de 20 % en neuf ou 10 % en rénovation classique). Appliquée directement par l'artisan sur la facture."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">Éco-PTZ</h3>
                <p className="text-green-50 text-sm">{"Prêt à taux zéro jusqu'à 50 000 € pour un bouquet de travaux. Le changement de fenêtres peut être combiné avec l'isolation des murs ou de la toiture."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un menuisier qualifié
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Faites poser vos fenêtres par un professionnel certifié RGE pour bénéficier des aides."}
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
              <p className="text-sm text-gray-500">{"Toutes les aides pour financer vos fenêtres."}</p>
            </Link>
            <Link href="/guides/artisan-rge" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Artisan RGE"}</h3>
              <p className="text-sm text-gray-500">{"Obligatoire pour bénéficier des aides financières."}</p>
            </Link>
            <Link href="/guides/diagnostics-immobiliers" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Diagnostics immobiliers"}</h3>
              <p className="text-sm text-gray-500">{"Le DPE classe votre logement selon ses performances."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur le changement de fenêtres
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
              {"Prêt à changer vos fenêtres ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez un menuisier RGE près de chez vous et recevez des devis gratuits pour le remplacement de vos fenêtres."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/menuisier"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un menuisier"}
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
