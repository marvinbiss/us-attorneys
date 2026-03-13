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
  Building2,
  Hammer,
  Euro,
  Shield,
  Droplets,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/renovation-toiture`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Rénovation Toiture : Travaux et Prix 2026",
  description:
    "Guide complet rénovation toiture 2026 : signes d'usure, types de couverture (tuile, ardoise, zinc), prix (60-200€/m²), isolation, charpente et aides financières.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Rénovation Toiture : Travaux et Prix 2026",
    description:
      "Tout savoir sur la rénovation de toiture : types de couverture, étapes des travaux, prix au m² et aides MaPrimeRénov.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rénovation Toiture : Travaux et Prix 2026",
    description:
      "Tout savoir sur la rénovation de toiture : types de couverture, étapes des travaux, prix au m² et aides MaPrimeRénov.",
  },
}

const signesUsure = [
  {
    name: "Tuiles cassées ou déplacées",
    icon: AlertTriangle,
    description: "Des tuiles fissurées, décalées ou manquantes exposent la charpente aux infiltrations. Même quelques tuiles endommagées peuvent causer des dégâts importants si elles ne sont pas remplacées rapidement.",
  },
  {
    name: "Infiltrations et taches d'humidité",
    icon: Droplets,
    description: "Des taches brunes au plafond des combles ou des murs périphériques signalent une fuite de toiture. L'humidité prolongée dégrade l'isolant et la charpente (risque de mérule et d'insectes xylophages).",
  },
  {
    name: "Mousse et lichens abondants",
    icon: Home,
    description: "Une couche épaisse de mousse retient l'eau et accélère la dégradation des tuiles. Un démoussage suivi d'un traitement hydrofuge peut prolonger la durée de vie de la couverture de 5 à 10 ans.",
  },
  {
    name: "Charpente qui fléchit",
    icon: Building2,
    description: "Une ligne de faîtage qui ondule ou des pannes qui ploient indiquent un problème structurel. Faites intervenir un charpentier pour évaluer si un renfort ou un remplacement partiel est nécessaire.",
  },
]

const typesCouverture = [
  {
    name: "Tuile terre cuite",
    prix: "60 – 120 €/m²",
    dureeVie: "50 – 100 ans",
    avantages: "Esthétique traditionnelle, très bonne durabilité, large choix de formes et couleurs",
    inconvenients: "Poids important (nécessite charpente robuste), pose technique",
  },
  {
    name: "Ardoise naturelle",
    prix: "100 – 200 €/m²",
    dureeVie: "75 – 150 ans",
    avantages: "Exceptionnelle longévité, esthétique noble, résistance au gel",
    inconvenients: "Prix élevé, pose complexe par un couvreur spécialisé, poids",
  },
  {
    name: "Zinc",
    prix: "80 – 150 €/m²",
    dureeVie: "50 – 100 ans",
    avantages: "Léger, étanche, adaptable à toutes les formes, recyclable, aspect contemporain",
    inconvenients: "Nécessite un zingueur qualifié, dilatation thermique à gérer",
  },
  {
    name: "Bac acier",
    prix: "60 – 100 €/m²",
    dureeVie: "30 – 50 ans",
    avantages: "Économique, léger, pose rapide, idéal pour grandes surfaces et toitures faible pente",
    inconvenients: "Isolation acoustique à soigner (pluie), esthétique industrielle, condensation",
  },
]

const services = [
  { label: "Couvreur", href: "/services/couvreur", icon: Home },
  { label: "Charpentier", href: "/services/charpentier", icon: Hammer },
  { label: "Zingueur", href: "/services/zingueur", icon: Hammer },
  { label: "Isolation", href: "/services/isolation", icon: Shield },
  { label: "Maçon", href: "/services/macon", icon: Building2 },
  { label: "Électricien", href: "/services/electricien", icon: Hammer },
]

const faqItems = [
  {
    question: "Quel est le prix moyen d'une rénovation de toiture ?",
    answer:
      "Le prix varie de 60 à 200 €/m² pose comprise, selon le matériau. Pour une maison de 100 m² de toiture : 6 000 à 12 000 € en tuile terre cuite, 10 000 à 20 000 € en ardoise, 8 000 à 15 000 € en zinc. Ces prix incluent la dépose de l'ancienne couverture, les liteaux et la pose. L'isolation et la charpente sont en supplément.",
  },
  {
    question: "Faut-il un permis de construire pour refaire sa toiture ?",
    answer:
      "Non, un simple remplacement à l'identique ne nécessite aucune autorisation. En revanche, si vous changez de matériau (ex : tuile vers ardoise), de couleur ou si vous modifiez la pente, une déclaration préalable de travaux est obligatoire. En secteur protégé (ABF), l'accord de l'Architecte des Bâtiments de France est nécessaire.",
  },
  {
    question: "Quelle est la durée de vie d'une toiture ?",
    answer:
      "La durée de vie dépend du matériau : 50 à 100 ans pour la tuile terre cuite, 75 à 150 ans pour l'ardoise naturelle, 50 à 100 ans pour le zinc, 30 à 50 ans pour le bac acier. Un entretien régulier (démoussage tous les 5-10 ans, vérification annuelle après tempête) prolonge significativement la durée de vie.",
  },
  {
    question: "Peut-on bénéficier de MaPrimeRénov pour une rénovation de toiture ?",
    answer:
      "MaPrimeRénov ne finance pas le remplacement de la couverture seule. En revanche, si vous profitez de la rénovation pour isoler votre toiture (sarking, isolation sous rampants), les travaux d'isolation sont éligibles à MaPrimeRénov, aux CEE (Certificats d'Économies d'Énergie), à l'éco-PTZ et à la TVA à 5,5 %. L'artisan doit être RGE.",
  },
  {
    question: "Charpente fermette ou traditionnelle : quelle différence ?",
    answer:
      "La charpente traditionnelle utilise des pièces de bois massif assemblées par tenons et mortaises. Elle permet d'aménager les combles. Prix : 70 à 130 €/m². La charpente fermette (industrielle) est faite de bois léger assemblé par des connecteurs métalliques. Plus économique (50 à 80 €/m²) mais elle occupe tout le volume des combles et ne permet pas leur aménagement sans modification.",
  },
  {
    question: "Quelle isolation de toiture choisir ?",
    answer:
      "Deux techniques principales : l'isolation sous rampants (laine de verre, laine de roche ou fibre de bois entre et sous les chevrons, 40 à 80 €/m²) et le sarking (panneau isolant rigide posé sur les chevrons par l'extérieur, 100 à 250 €/m²). Le sarking est plus performant (supprime les ponts thermiques) mais plus coûteux. Pour des combles perdus, le soufflage d'isolant est le plus économique (20 à 40 €/m²).",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Rénovation de toiture" },
]

export default function RenovationToiturePage() {
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
        name: "Rénovation de toiture",
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
            Guide rénovation toiture
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Rénovation de toiture : guide complet des travaux et prix 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Votre toiture montre des signes d'usure ? Découvrez les types de couverture, les étapes des travaux, les prix au m² et les aides financières disponibles."}
          </p>
        </section>

        {/* Signes d'usure */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            {"Signes qu'il faut rénover votre toiture"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {signesUsure.map((s) => {
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

        {/* Types de couverture */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Types de couverture et prix
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {typesCouverture.map((t) => (
              <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm mb-3">
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <Euro className="w-3 h-3" /> {t.prix}
                  </span>
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" /> {t.dureeVie}
                  </span>
                </div>
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

        {/* Étapes des travaux */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Étapes d{"'"}une rénovation de toiture
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <div>
                    <strong>Diagnostic et devis</strong>
                    <p className="mt-1">{"Un couvreur inspecte la toiture : état de la couverture, de la charpente, de l'isolation et des éléments d'étanchéité (faîtage, noues, solins). Il établit un devis détaillé. Demandez au moins 3 devis."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <div>
                    <strong>Démarches administratives</strong>
                    <p className="mt-1">{"Remplacement à l'identique : aucune formalité. Changement de matériau ou de couleur : déclaration préalable de travaux en mairie. En secteur classé : accord de l'ABF."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <div>
                    <strong>Installation de l{"'"}échafaudage</strong>
                    <p className="mt-1">{"Mise en place de l'échafaudage périmétrique et des protections (bâches, filets). Si l'échafaudage empiète sur la voie publique, une autorisation d'occupation est nécessaire en mairie."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                  <div>
                    <strong>Dépose et réparation charpente</strong>
                    <p className="mt-1">{"Dépose de l'ancienne couverture, inspection de la charpente, remplacement des pièces abîmées (pannes, chevrons, liteaux). Traitement fongicide et insecticide de l'ensemble."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">5</span>
                  <div>
                    <strong>Isolation et étanchéité</strong>
                    <p className="mt-1">{"Pose de l'écran sous-toiture (HPV recommandé), installation de l'isolation (sarking ou sous rampants) si prévue au devis. L'écran sous-toiture protège la charpente en cas d'entrée d'eau sous les tuiles."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">6</span>
                  <div>
                    <strong>Pose de la couverture et finitions</strong>
                    <p className="mt-1">{"Pose des liteaux, puis de la couverture (tuiles, ardoises, zinc). Réalisation des points singuliers : faîtage, arêtiers, noues, solins de cheminée. Installation ou remplacement des gouttières."}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Isolation sous toiture */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Isolation sous toiture : profitez de la rénovation
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Sarking (par l{"'"}extérieur)</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Panneau isolant rigide posé sur les chevrons"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Supprime les ponts thermiques au niveau de la charpente"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Prix : 100 à 250 €/m² (isolant + pose)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Idéal quand on refait la couverture complète"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Sous rampants (par l{"'"}intérieur)</h3>
                <ul className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Isolant souple entre et sous les chevrons"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Laine de verre, laine de roche ou fibre de bois"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Prix : 40 à 80 €/m² (isolant + pare-vapeur + pose)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Réduit légèrement le volume habitable des combles"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Charpente */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Charpente : fermette vs traditionnelle
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Charpente traditionnelle</h3>
              <p className="text-sm font-medium text-blue-600 mb-3">70 – 130 €/m²</p>
              <p className="text-gray-600 mb-3">
                {"Bois massif (chêne, douglas, sapin) assemblé par tenons et mortaises. Structure robuste qui laisse les combles libres pour un aménagement futur."}
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Combles aménageables</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Grande durabilité (100+ ans)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Esthétique visible (poutres apparentes)</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Charpente fermette</h3>
              <p className="text-sm font-medium text-blue-600 mb-3">50 – 80 €/m²</p>
              <p className="text-gray-600 mb-3">
                {"Bois léger assemblé par des connecteurs métalliques (fermettes industrielles). Structure en W qui occupe tout le volume des combles."}
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Économique et rapide à poser</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>Combles non aménageables (sauf modification)</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>Durée de vie moindre (50-70 ans)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Aides financières */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Aides financières pour l{"'"}isolation de toiture
            </h2>
            <p className="text-green-50 mb-6 text-lg">
              {"Si vous profitez de la rénovation de votre toiture pour améliorer l'isolation, plusieurs aides sont disponibles (artisan RGE obligatoire) :"}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">MaPrimeRénov{"'"}</h3>
                <p className="text-green-50 text-sm">{"Jusqu'à 75 €/m² pour l'isolation des rampants de toiture, selon vos revenus. Cumulable avec les CEE."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">CEE (Certificats d{"'"}Économies d{"'"}Énergie)</h3>
                <p className="text-green-50 text-sm">{"Prime énergie versée par les fournisseurs d'énergie. Montant variable selon la surface et la zone climatique (10 à 20 €/m²)."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">Éco-PTZ</h3>
                <p className="text-green-50 text-sm">{"Prêt à taux zéro jusqu'à 50 000 € pour un bouquet de travaux de rénovation énergétique, remboursable sur 20 ans."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">TVA à 5,5 %</h3>
                <p className="text-green-50 text-sm">{"TVA réduite à 5,5 % sur les travaux d'isolation (au lieu de 10 % pour les autres travaux de rénovation)."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gouttières */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              Gouttières et évacuation des eaux pluviales
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"La rénovation de toiture est le moment idéal pour remplacer les gouttières. Elles protègent les façades et les fondations en évacuant les eaux de pluie."}
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Gouttière PVC</strong> — 10 à 25 €/ml, durée de vie 15-25 ans, facile à poser, coloris limités</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Gouttière zinc</strong> — 25 à 50 €/ml, durée de vie 30-50 ans, esthétique, soudure nécessaire</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Gouttière aluminium</strong> — 20 à 40 €/ml, durée de vie 25-40 ans, légère, sans entretien</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Gouttière cuivre</strong> — 50 à 100 €/ml, durée de vie 50+ ans, haut de gamme, patine naturelle</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un couvreur qualifié
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Confiez votre toiture à des professionnels expérimentés et assurés en décennale."}
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
              <p className="text-sm text-gray-500">{"Toutes les aides pour financer votre isolation de toiture."}</p>
            </Link>
            <Link href="/guides/garantie-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Vérifiez la décennale de votre couvreur avant travaux."}</p>
            </Link>
            <Link href="/guides/artisan-rge" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Artisan RGE"}</h3>
              <p className="text-sm text-gray-500">{"Obligatoire pour bénéficier des aides à l'isolation."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur la rénovation de toiture
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
              {"Besoin d'un couvreur pour votre toiture ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des couvreurs qualifiés et assurés près de chez vous. Devis gratuit et sans engagement."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/couvreur"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un couvreur"}
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
