import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  FileCheck,
  Search,
  HelpCircle,
  ArrowRight,
  Building2,
  Hammer,
  Euro,
  Shield,
  Home,
  Thermometer,
  Leaf,
  Ban,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/isolation-thermique`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Isolation Thermique : Prix, Matériaux et Aides 2026",
  description:
    "Guide isolation thermique 2026 : ITE (120-280€/m²), ITI (40-130€/m²), combles (20-75€/m²), matériaux, aides MaPrimeRénov' jusqu'à 80% et artisans RGE.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Isolation Thermique : Prix, Matériaux et Aides 2026",
    description:
      "Tout savoir sur l'isolation thermique : ITE, ITI, combles, matériaux isolants, prix au m² et aides financières MaPrimeRénov' 2026.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Isolation Thermique : Prix, Matériaux et Aides 2026",
    description:
      "Tout savoir sur l'isolation thermique : ITE, ITI, combles, matériaux isolants, prix au m² et aides financières MaPrimeRénov' 2026.",
  },
}

const typesIsolation = [
  {
    name: "ITE sous enduit",
    prix: "120 – 200 €/m²",
    resistance: "R ≥ 3,7 m².K/W",
    avantages: "Supprime les ponts thermiques, pas de perte de surface habitable, ravalement simultané",
    inconvenients: "Coût élevé, échafaudage nécessaire, modifie l'aspect extérieur (déclaration préalable)",
  },
  {
    name: "ITE sous bardage",
    prix: "150 – 280 €/m²",
    resistance: "R ≥ 3,7 m².K/W",
    avantages: "Large choix esthétique (bois, composite, métal), ventilation naturelle, très durable",
    inconvenients: "Plus onéreux que l'enduit, épaisseur importante, modification architecturale",
  },
  {
    name: "ITI murs",
    prix: "40 – 130 €/m²",
    resistance: "R ≥ 3,7 m².K/W",
    avantages: "Économique, travaux réalisables pièce par pièce, pas d'échafaudage",
    inconvenients: "Perte de surface habitable (5-7 cm par mur), ponts thermiques résiduels, déménagement du mobilier",
  },
  {
    name: "Combles perdus",
    prix: "20 – 45 €/m²",
    resistance: "R ≥ 7 m².K/W",
    avantages: "Meilleur rapport coût/efficacité, soufflage rapide (1 journée), gains immédiats sur la facture",
    inconvenients: "Combles inaccessibles après isolation, tassement possible de l'isolant en vrac",
  },
  {
    name: "Combles aménagés",
    prix: "45 – 75 €/m²",
    resistance: "R ≥ 6 m².K/W",
    avantages: "Conserve l'espace habitable, isolation sous rampants performante",
    inconvenients: "Plus complexe à poser, légère perte de hauteur sous plafond, pare-vapeur indispensable",
  },
  {
    name: "Plancher bas",
    prix: "25 – 55 €/m²",
    resistance: "R ≥ 3 m².K/W",
    avantages: "Élimine la sensation de sol froid, gains de confort immédiats, pose par le dessous (cave/vide sanitaire)",
    inconvenients: "Accès parfois difficile (vide sanitaire bas), réduction de la hauteur en cave",
  },
]

const materiauxIsolants = [
  {
    name: "Laine de verre",
    lambda: "0,030 – 0,040",
    prix: "5 – 15 €/m²",
    avantages: "Très économique, excellent rapport performance/prix, incombustible (A1), bon isolant acoustique",
    inconvenients: "Irritante à la pose, sensible à l'humidité, origine minérale (non biosourcée)",
  },
  {
    name: "Laine de roche",
    lambda: "0,033 – 0,042",
    prix: "8 – 20 €/m²",
    avantages: "Résistance au feu excellente (A1), bonne tenue mécanique, isolant phonique performant",
    inconvenients: "Irritante à la pose, légèrement plus chère que la laine de verre, énergie grise élevée",
  },
  {
    name: "Ouate de cellulose",
    lambda: "0,038 – 0,042",
    prix: "10 – 25 €/m²",
    avantages: "Biosourcée (papier recyclé), très bon déphasage thermique (confort d'été), bon isolant phonique",
    inconvenients: "Traitement au sel de bore, tassement possible en vrac, sensible à l'humidité prolongée",
  },
  {
    name: "Fibre de bois",
    lambda: "0,036 – 0,046",
    prix: "15 – 40 €/m²",
    avantages: "Excellent déphasage thermique, biosourcée, bilan carbone favorable, confort été comme hiver",
    inconvenients: "Prix élevé, épaisseur nécessaire supérieure, sensible à l'humidité sans protection",
  },
  {
    name: "Polystyrène expansé (PSE)",
    lambda: "0,030 – 0,038",
    prix: "8 – 18 €/m²",
    avantages: "Léger, insensible à l'humidité, très bon marché, facile à découper et poser",
    inconvenients: "Isolant acoustique médiocre, inflammable (classement E), non biosourcé, dégage des fumées toxiques",
  },
  {
    name: "Polyuréthane (PUR)",
    lambda: "0,022 – 0,028",
    prix: "15 – 35 €/m²",
    avantages: "Meilleur lambda du marché (faible épaisseur nécessaire), insensible à l'humidité, rigide",
    inconvenients: "Prix élevé, inflammable, non recyclable, issu de la pétrochimie, mauvais déphasage thermique",
  },
]

const prixParTravaux = [
  {
    categorie: "Isolation des murs par l'extérieur (ITE)",
    lignes: [
      { travaux: "ITE sous enduit (PSE 140 mm)", prix: "120 – 200 €/m²" },
      { travaux: "ITE sous bardage bois", prix: "150 – 250 €/m²" },
      { travaux: "ITE sous bardage composite", prix: "180 – 280 €/m²" },
    ],
  },
  {
    categorie: "Isolation des murs par l'intérieur (ITI)",
    lignes: [
      { travaux: "Doublage collé (PSE + plaque de plâtre)", prix: "40 – 70 €/m²" },
      { travaux: "Ossature métallique + laine minérale", prix: "55 – 100 €/m²" },
      { travaux: "Panneau fibre de bois + finition", prix: "70 – 130 €/m²" },
    ],
  },
  {
    categorie: "Isolation des combles",
    lignes: [
      { travaux: "Combles perdus — soufflage laine", prix: "20 – 35 €/m²" },
      { travaux: "Combles perdus — soufflage ouate", prix: "25 – 45 €/m²" },
      { travaux: "Sous rampants — laine de verre", prix: "45 – 65 €/m²" },
      { travaux: "Sous rampants — fibre de bois", prix: "55 – 75 €/m²" },
      { travaux: "Sarking (par l'extérieur)", prix: "100 – 250 €/m²" },
    ],
  },
  {
    categorie: "Isolation du plancher bas",
    lignes: [
      { travaux: "Flocage sous plancher (cave)", prix: "25 – 40 €/m²" },
      { travaux: "Panneau rigide sous plancher", prix: "30 – 55 €/m²" },
    ],
  },
]

const services = [
  { label: "Isolation thermique", href: "/practice-areas/isolation-thermique", icon: Shield },
  { label: "Façadier", href: "/practice-areas/facadier", icon: Building2 },
  { label: "Couvreur", href: "/practice-areas/couvreur", icon: Home },
  { label: "Plâtrier", href: "/practice-areas/platrier", icon: Hammer },
  { label: "Rénovation énergétique", href: "/practice-areas/renovation-energetique", icon: Leaf },
]

const faqItems = [
  {
    question: "Quel isolant offre le meilleur rapport qualité/prix ?",
    answer:
      "La laine de verre reste l'isolant au meilleur rapport qualité/prix pour la plupart des applications : 5 à 15 €/m² pour un lambda de 0,032 à 0,040. Pour les combles perdus, la ouate de cellulose soufflée (25-45 €/m² posée) offre un excellent compromis avec un meilleur confort d'été grâce à son déphasage thermique. Si le budget le permet, la fibre de bois est le choix premium biosourcé.",
  },
  {
    question: "ITE ou ITI : quelle isolation choisir pour ses murs ?",
    answer:
      "L'ITE (Isolation Thermique par l'Extérieur) est plus performante : elle supprime les ponts thermiques et ne réduit pas la surface habitable. En revanche, elle coûte 2 à 3 fois plus cher (120-280 €/m² vs 40-130 €/m²) et nécessite une déclaration préalable de travaux. L'ITI est préférable en copropriété, en secteur classé, ou avec un budget serré. L'idéal est de combiner ITE + isolation des combles pour un maximum d'efficacité.",
  },
  {
    question: "Quelles aides pour l'isolation thermique en 2026 ?",
    answer:
      "MaPrimeRénov' Parcours ampleur finance jusqu'à 80 % du coût pour les ménages très modestes (plafond de 70 000 € HT). Les CEE (Certificats d'Économies d'Énergie) sont cumulables et représentent 8 milliards d'euros sur la période 2022-2025 prolongée. L'éco-PTZ permet d'emprunter jusqu'à 50 000 € à taux zéro sur 20 ans. La TVA est réduite à 5,5 % sur les travaux d'isolation. Condition obligatoire : faire appel à un artisan RGE.",
  },
  {
    question: "Combien de temps durent les travaux d'isolation ?",
    answer:
      "Pour des combles perdus par soufflage : 1 journée. Pour une ITI pièce par pièce : 2 à 5 jours par pièce. Pour une ITE sous enduit d'une maison de 100 m² : 2 à 4 semaines. Pour une ITE sous bardage : 3 à 6 semaines. Le sarking (isolation toiture par l'extérieur) nécessite 1 à 3 semaines. Ces délais incluent la préparation, la pose et les finitions.",
  },
  {
    question: "L'isolation à 1 euro existe-t-elle encore ?",
    answer:
      "Non, l'isolation à 1 euro n'existe plus depuis juillet 2021. Ce dispositif reposait sur les CEE (Certificats d'Économies d'Énergie) avec un reste à charge symbolique. Il a été supprimé en raison de fraudes massives et de travaux de mauvaise qualité. En 2026, les aides restent très généreuses (MaPrimeRénov' + CEE peuvent couvrir jusqu'à 90 % du coût pour les ménages très modestes), mais il y a toujours un reste à charge réel. Méfiez-vous des démarchages promettant une isolation gratuite.",
  },
  {
    question: "Comment trouver un artisan RGE fiable pour l'isolation ?",
    answer:
      "Vérifiez la certification RGE de l'artisan sur le site officiel france-renov.gouv.fr (annuaire des professionnels RGE). Exigez l'attestation d'assurance décennale en cours de validité. Demandez au moins 3 devis détaillés et comparez les matériaux proposés, les épaisseurs et les résistances thermiques (R). Consultez les avis clients et demandez des références de chantiers similaires. La qualification RGE est obligatoire pour bénéficier de toutes les aides financières.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Isolation thermique" },
]

export default function IsolationThermiquePage() {
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
        name: "Isolation thermique",
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
            Guide isolation thermique
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Isolation thermique : guide complet prix, matériaux et aides 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"ITE, ITI, combles, plancher bas : comparez les techniques d'isolation, les matériaux, les prix au m² et les aides financières pour réduire votre facture énergétique."}
          </p>
        </section>

        {/* Types d'isolation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Types d{"'"}isolation et performances
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {typesIsolation.map((t) => (
              <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm mb-3">
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <Euro className="w-3 h-3" /> {t.prix}
                  </span>
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    <Shield className="w-3 h-3" /> {t.resistance}
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

        {/* Matériaux isolants */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Matériaux isolants : caractéristiques et prix
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {materiauxIsolants.map((m) => (
              <div key={m.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{m.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm mb-3">
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <Euro className="w-3 h-3" /> {m.prix}
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    <Thermometer className="w-3 h-3" /> λ = {m.lambda}
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

        {/* Prix par type de travaux */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Prix détaillés par type de travaux
          </h2>
          <div className="space-y-6">
            {prixParTravaux.map((cat) => (
              <div key={cat.categorie} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">{cat.categorie}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.lignes.map((l) => (
                    <div key={l.travaux} className="flex items-center justify-between px-6 py-4">
                      <span className="text-gray-700">{l.travaux}</span>
                      <span className="text-blue-700 font-semibold whitespace-nowrap ml-4">{l.prix}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {"* Prix TTC fourniture et pose, constatés sur le marché français en 2026. Ils varient selon la région, l'accessibilité du chantier et les finitions choisies."}
          </p>
        </section>

        {/* Aides financières 2026 */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Aides financières isolation 2026
            </h2>
            <p className="text-green-50 mb-6 text-lg">
              {"Les aides à la rénovation énergétique sont renforcées en 2026. Condition obligatoire : faire appel à un artisan certifié RGE."}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">MaPrimeRénov{"'"} Parcours ampleur</h3>
                <p className="text-green-50 text-sm">{"Finance jusqu'à 80 % du coût des travaux pour les ménages très modestes (plafond 70 000 € HT). Obligation d'un gain énergétique de 2 classes DPE minimum. Accompagnement par un Accompagnateur Rénov' obligatoire pour les projets > 5 000 €."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">CEE — 8 milliards d{"'"}euros</h3>
                <p className="text-green-50 text-sm">{"Les Certificats d'Économies d'Énergie représentent une enveloppe de 8 milliards d'euros. Primes versées par les fournisseurs d'énergie (EDF, Engie, TotalEnergies). Cumulables avec MaPrimeRénov'. Montant : 10 à 25 €/m² selon le type d'isolation et la zone climatique."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">Éco-PTZ</h3>
                <p className="text-green-50 text-sm">{"Prêt à taux zéro jusqu'à 50 000 € pour un bouquet de travaux de rénovation énergétique, remboursable sur 20 ans. Accessible sans condition de revenus. Cumulable avec toutes les autres aides."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">TVA à 5,5 %</h3>
                <p className="text-green-50 text-sm">{"TVA réduite à 5,5 % (au lieu de 20 %) sur les travaux d'isolation thermique et la fourniture des matériaux. Applicable automatiquement par l'artisan pour les logements de plus de 2 ans."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Passoires thermiques — calendrier */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading flex items-center gap-3">
              <Ban className="w-8 h-8" />
              Passoires thermiques : calendrier d{"'"}interdiction
            </h2>
            <p className="text-red-50 mb-6 text-lg">
              {"La loi Climat et Résilience interdit progressivement la mise en location des logements les plus énergivores (métropole)."}
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-xl p-5 text-center">
                <p className="text-4xl font-extrabold mb-2">2025</p>
                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-bold mb-3">
                  Classe G
                </div>
                <p className="text-red-50 text-sm">{"Interdiction de location des logements classés G au DPE depuis le 1er janvier 2025. Environ 600 000 logements concernés."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5 text-center">
                <p className="text-4xl font-extrabold mb-2">2028</p>
                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-bold mb-3">
                  Classe F
                </div>
                <p className="text-red-50 text-sm">{"Les logements classés F seront également interdits à la location à partir du 1er janvier 2028. Environ 1,2 million de logements supplémentaires."}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-5 text-center">
                <p className="text-4xl font-extrabold mb-2">2034</p>
                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-bold mb-3">
                  Classe E
                </div>
                <p className="text-red-50 text-sm">{"Les logements classés E seront interdits à la location au 1er janvier 2034. Environ 2,6 millions de logements concernés en plus."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Comment choisir son isolation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Comment choisir son isolation ?
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <div>
                    <strong>Réaliser un diagnostic DPE</strong>
                    <p className="mt-1">{"Faites réaliser un Diagnostic de Performance Énergétique (DPE) par un diagnostiqueur certifié. Il identifiera les déperditions thermiques de votre logement : toiture (25-30 %), murs (20-25 %), fenêtres (10-15 %), plancher bas (7-10 %), ventilation (20-25 %). Ce diagnostic est la base de tout projet d'isolation."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <div>
                    <strong>Prioriser les travaux</strong>
                    <p className="mt-1">{"Commencez par la toiture et les combles (plus grande source de déperdition), puis les murs, et enfin le plancher bas. Pour un maximum d'efficacité, traitez aussi la ventilation (VMC double flux) après avoir isolé. Un parcours de rénovation globale est plus efficace que des gestes isolés."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <div>
                    <strong>Adapter au budget</strong>
                    <p className="mt-1">{"Budget serré (2 000-5 000 €) : isolez les combles perdus par soufflage, retour sur investissement en 3-5 ans. Budget moyen (8 000-15 000 €) : ajoutez l'ITI des murs ou le plancher bas. Budget confortable (20 000-50 000 €) : optez pour une ITE complète + combles + plancher pour une rénovation globale performante."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                  <div>
                    <strong>Choisir le bon matériau</strong>
                    <p className="mt-1">{"Laine de verre ou laine de roche pour le meilleur rapport qualité/prix. Fibre de bois ou ouate de cellulose pour un confort d'été optimal (déphasage thermique). Polyuréthane pour les espaces contraints nécessitant une faible épaisseur. Pensez à la résistance thermique visée (R) plutôt qu'au seul prix."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">5</span>
                  <div>
                    <strong>Comparer les devis et vérifier les certifications</strong>
                    <p className="mt-1">{"Demandez au minimum 3 devis à des artisans certifiés RGE. Vérifiez que le devis précise : le matériau, l'épaisseur, la résistance thermique (R), la technique de pose et le traitement des ponts thermiques. Un artisan RGE est obligatoire pour bénéficier des aides MaPrimeRénov' et CEE."}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan pour votre isolation
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Faites appel à des professionnels certifiés RGE et assurés en décennale pour vos travaux d'isolation."}
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
              <p className="text-sm text-gray-500">{"Toutes les aides pour financer votre isolation thermique."}</p>
            </Link>
            <Link href="/guides/renovation-toiture" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Rénovation de toiture"}</h3>
              <p className="text-sm text-gray-500">{"Profitez de la rénovation de toiture pour isoler vos combles."}</p>
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
            Questions fréquentes sur l{"'"}isolation thermique
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
              {"Besoin d'un artisan pour votre isolation ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des professionnels certifiés RGE près de chez vous. Devis gratuit et sans engagement."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/practice-areas/isolation-thermique"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un artisan RGE"}
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
