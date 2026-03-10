import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Calculator,
  CheckCircle2,
  HelpCircle,
  Search,
  Home,
  Hammer,
  Zap,
  Droplets,
  Flame,
  Euro,
  PiggyBank,
  Building2,
  FileCheck,
  Lightbulb,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/budget-renovation`

export const metadata: Metadata = {
  title: "Budget Rénovation : Combien Coûtent vos Travaux en 2026 ?",
  description:
    "Prix au m² par type de rénovation, budget par pièce, aides financières (MaPrimeRénov', CEE, éco-PTZ), conseils pour établir un budget réaliste et financer vos travaux en 2026.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Budget Rénovation : Combien Coûtent vos Travaux en 2026 ?",
    description:
      "Guide complet des prix de rénovation en 2026 : fourchettes par type de travaux, aides financières et conseils budget.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
}

const fourchettesRenovation = [
  {
    type: "Rafraîchissement",
    fourchette: "200 — 500 €/m²",
    couleur: "bg-green-100 text-green-700 border-green-200",
    icon: Home,
    description:
      "Peinture, papier peint, revêtements de sol (parquet flottant, carrelage standard), remplacement des interrupteurs et prises, petites retouches de plomberie. Pas de modification des cloisons ni des réseaux.",
    exemples: "Appartement 60 m² : 12 000 à 30 000 € | Maison 100 m² : 20 000 à 50 000 €",
  },
  {
    type: "Rénovation moyenne",
    fourchette: "500 — 1 000 €/m²",
    couleur: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Hammer,
    description:
      "Rénovation de salle de bain et cuisine (hors déplacement de cloisons porteurs), mise aux normes électriques partielle, remplacement de fenêtres, isolation par l'intérieur, création ou suppression de cloisons légères.",
    exemples: "Appartement 60 m² : 30 000 à 60 000 € | Maison 100 m² : 50 000 à 100 000 €",
  },
  {
    type: "Rénovation lourde / complète",
    fourchette: "1 000 — 2 000 €/m²",
    couleur: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Building2,
    description:
      "Rénovation intégrale avec modification des réseaux (électricité, plomberie, chauffage), ouverture ou création de murs porteurs (avec étude structure), isolation complète, remplacement de toiture, extension. Nécessite souvent un architecte pour les surfaces > 150 m².",
    exemples: "Appartement 60 m² : 60 000 à 120 000 € | Maison 100 m² : 100 000 à 200 000 €",
  },
]

const budgetParPiece = [
  {
    piece: "Salle de bain",
    fourchette: "5 000 — 20 000 €",
    icon: Droplets,
    details: [
      "Rafraîchissement (peinture, robinetterie) : 2 000 — 5 000 €",
      "Rénovation standard (douche italienne, meuble vasque, carrelage) : 5 000 — 12 000 €",
      "Rénovation haut de gamme (baignoire balnéo, double vasque, chauffage au sol) : 12 000 — 20 000 €",
      "Création complète (plomberie neuve) : 8 000 — 25 000 €",
    ],
  },
  {
    piece: "Cuisine",
    fourchette: "5 000 — 25 000 €",
    icon: Flame,
    details: [
      "Rafraîchissement (peinture, crédence, plan de travail) : 2 000 — 5 000 €",
      "Rénovation standard (meubles, électroménager moyen de gamme) : 5 000 — 15 000 €",
      "Cuisine équipée complète (sur mesure, électroménager haut de gamme) : 15 000 — 25 000 €",
      "Cuisine avec ouverture sur salon (IPN si mur porteur) : 20 000 — 35 000 €",
    ],
  },
  {
    piece: "Chambre",
    fourchette: "2 000 — 8 000 €",
    icon: Home,
    details: [
      "Rafraîchissement (peinture, sol) : 1 000 — 3 000 €",
      "Rénovation avec placard intégré et isolation : 3 000 — 6 000 €",
      "Rénovation complète avec création de dressing et électricité : 5 000 — 8 000 €",
    ],
  },
  {
    piece: "Salon / Séjour (30 m²)",
    fourchette: "3 000 — 15 000 €",
    icon: Home,
    details: [
      "Rafraîchissement (peinture, sol) : 2 000 — 5 000 €",
      "Avec cheminée ou poêle : 5 000 — 10 000 €",
      "Avec ouverture mur porteur (IPN) : 8 000 — 15 000 €",
    ],
  },
]

const budgetParTravaux = [
  {
    travaux: "Isolation",
    icon: Home,
    lignes: [
      { description: "Combles perdus (laine soufflée)", prix: "20 — 50 €/m²" },
      { description: "Murs par l'intérieur (doublage + isolant)", prix: "50 — 90 €/m²" },
      { description: "Murs par l'extérieur (ITE)", prix: "120 — 200 €/m²" },
      { description: "Plancher bas (sous-face)", prix: "30 — 60 €/m²" },
      { description: "Fenêtres double vitrage (fourni posé)", prix: "400 — 900 € / fenêtre" },
    ],
  },
  {
    travaux: "Chauffage",
    icon: Flame,
    lignes: [
      { description: "Pompe à chaleur air-eau", prix: "8 000 — 18 000 €" },
      { description: "Pompe à chaleur air-air (climatisation réversible)", prix: "3 000 — 8 000 €" },
      { description: "Chaudière gaz condensation (THPE)", prix: "3 000 — 7 000 €" },
      { description: "Poêle à granulés", prix: "3 000 — 7 000 €" },
      { description: "Chauffe-eau thermodynamique", prix: "2 500 — 5 000 €" },
      { description: "Radiateurs électriques (par pièce)", prix: "300 — 1 500 €" },
    ],
  },
  {
    travaux: "Électricité",
    icon: Zap,
    lignes: [
      { description: "Mise aux normes complète (NF C 15-100)", prix: "80 — 120 €/m²" },
      { description: "Tableau électrique neuf", prix: "800 — 2 000 €" },
      { description: "Ajout de prises / interrupteurs (par point)", prix: "80 — 150 €" },
      { description: "Installation domotique de base", prix: "2 000 — 5 000 €" },
    ],
  },
  {
    travaux: "Plomberie",
    icon: Droplets,
    lignes: [
      { description: "Remplacement colonne d'eau", prix: "1 500 — 4 000 €" },
      { description: "Création point d'eau (cuisine, SDB)", prix: "800 — 2 500 €" },
      { description: "Remplacement chauffe-eau (200L)", prix: "800 — 2 000 €" },
      { description: "Réseau complet maison 100 m²", prix: "5 000 — 12 000 €" },
    ],
  },
  {
    travaux: "Toiture",
    icon: Building2,
    lignes: [
      { description: "Réfection couverture tuiles (dépose + repose)", prix: "100 — 200 €/m²" },
      { description: "Charpente (réparation partielle)", prix: "5 000 — 15 000 €" },
      { description: "Zinguerie (gouttières, noues)", prix: "30 — 80 €/ml" },
      { description: "Traitement charpente (anti-termites, fongicide)", prix: "20 — 50 €/m²" },
    ],
  },
]

const aides = [
  {
    nom: "MaPrimeRénov'",
    description:
      "Aide de l'ANAH pour les travaux de rénovation énergétique (isolation, chauffage, ventilation). Montant variable selon les revenus du foyer et le gain énergétique. Cumulable avec les CEE. Accessible à tous les propriétaires (occupants et bailleurs) pour les logements de plus de 15 ans.",
    montant: "Jusqu'à 90 % du montant des travaux pour les ménages très modestes (MaPrimeRénov' Sérénité)",
    condition: "Artisan RGE obligatoire, logement de plus de 15 ans, résidence principale",
  },
  {
    nom: "Certificats d'Économie d'Énergie (CEE)",
    description:
      "Primes versées par les fournisseurs d'énergie (EDF, Engie, TotalEnergies) pour financer des travaux d'économie d'énergie. Montant variable selon le type de travaux et la zone géographique. Démarches simplifiées : l'artisan RGE peut s'en charger.",
    montant: "Variable : 200 à 4 000 € selon les travaux (isolation, chauffage, fenêtres)",
    condition: "Artisan RGE obligatoire, demande AVANT signature du devis",
  },
  {
    nom: "Éco-prêt à taux zéro (éco-PTZ)",
    description:
      "Prêt sans intérêts pour financer des travaux de rénovation énergétique. Disponible dans toutes les banques ayant signé une convention avec l'État. Pas de conditions de revenus. Durée de remboursement jusqu'à 20 ans.",
    montant: "Jusqu'à 50 000 € pour un bouquet de travaux (performance énergétique globale)",
    condition: "Logement de plus de 2 ans, résidence principale, artisan RGE",
  },
  {
    nom: "TVA réduite",
    description:
      "Taux de TVA réduit applicable directement sur la facture de l'artisan. 5,5 % pour les travaux d'amélioration de la performance énergétique, 10 % pour les travaux de rénovation standard (hors amélioration énergétique). Pas de démarche à effectuer.",
    montant: "5,5 % au lieu de 20 % (économie de 14,5 % sur le montant TTC)",
    condition: "Logement de plus de 2 ans, travaux réalisés par un professionnel",
  },
]

const conseilsBudget = [
  {
    titre: "Prévoyez une marge de 10 à 15 %",
    description:
      "Les imprévus sont quasi systématiques en rénovation : canalisations vétustes découvertes en ouvrant un mur, amiante nécessitant un désamiantage, problème de structure non visible. Ajoutez 10 à 15 % de marge à votre budget total.",
  },
  {
    titre: "Hiérarchisez les priorités",
    description:
      "Si votre budget est limité, commencez par les travaux structurels (toiture, isolation, mise aux normes électriques) avant les travaux esthétiques. Un logement sain et sûr vaut mieux qu'un logement beau mais énergivore.",
  },
  {
    titre: "Demandez 3 à 5 devis",
    description:
      "Les écarts de prix entre artisans peuvent atteindre 30 à 50 % pour des prestations équivalentes. Comparez les devis ligne par ligne : matériaux, main-d'œuvre, délais. Le moins cher n'est pas toujours le meilleur choix.",
  },
  {
    titre: "Planifiez en basse saison",
    description:
      "Les artisans sont moins demandés de novembre à février. Vous obtiendrez souvent de meilleurs tarifs et des délais plus courts. En été, les carnets de commandes sont pleins et les prix s'ajustent à la hausse.",
  },
  {
    titre: "Cumulez les aides",
    description:
      "MaPrimeRénov', CEE, éco-PTZ et TVA réduite sont cumulables. Pour un projet d'isolation + chauffage, le reste à charge peut descendre à 10-30 % du coût total pour les ménages modestes. Faites une simulation sur france-renov.gouv.fr.",
  },
]

const simulateurLignes = [
  { poste: "Isolation combles (50 m²)", estimation: "1 000 — 2 500 €", aide: "500 — 1 500 €" },
  { poste: "Isolation murs ITE (80 m²)", estimation: "9 600 — 16 000 €", aide: "3 000 — 7 500 €" },
  { poste: "Fenêtres double vitrage (6 unités)", estimation: "2 400 — 5 400 €", aide: "240 — 600 €" },
  { poste: "Pompe à chaleur air-eau", estimation: "8 000 — 18 000 €", aide: "4 000 — 11 000 €" },
  { poste: "Chauffe-eau thermodynamique", estimation: "2 500 — 5 000 €", aide: "800 — 1 200 €" },
  { poste: "Ventilation VMC double flux", estimation: "3 000 — 7 000 €", aide: "1 500 — 3 000 €" },
  { poste: "Salle de bain (rénovation standard)", estimation: "5 000 — 12 000 €", aide: "—" },
  { poste: "Cuisine équipée", estimation: "5 000 — 15 000 €", aide: "—" },
  { poste: "Électricité (mise aux normes, 80 m²)", estimation: "6 400 — 9 600 €", aide: "—" },
]

const financements = [
  {
    titre: "Éco-PTZ (éco-prêt à taux zéro)",
    description:
      "Jusqu'à 50 000 € à taux zéro, remboursable sur 20 ans. Pas de conditions de revenus. Cumulable avec MaPrimeRénov'. Demande auprès de votre banque avec le devis de l'artisan RGE.",
  },
  {
    titre: "Prêt travaux classique",
    description:
      "Crédit affecté aux travaux, généralement entre 2 % et 6 % selon les taux 2026. Montant jusqu'à 75 000 € sur 10 à 15 ans. Comparez les offres de plusieurs banques et courtiers.",
  },
  {
    titre: "Prêt d'accession sociale (PAS)",
    description:
      "Pour les ménages modestes. Taux plafonné par l'État, donne droit à l'APL. Financement possible à 100 % du coût des travaux. Éligibilité selon les revenus et la zone géographique.",
  },
  {
    titre: "Aides locales",
    description:
      "De nombreuses collectivités (communes, départements, régions) proposent des aides complémentaires pour la rénovation. Consultez le site de l'ANAH et celui de votre collectivité. Certaines régions offrent jusqu'à 5 000 € supplémentaires pour la rénovation énergétique.",
  },
]

const faqItems = [
  {
    question: "Quel budget prévoir pour rénover un appartement de 60 m² ?",
    answer:
      "Pour un rafraîchissement (peinture, sols) : 12 000 à 30 000 €. Pour une rénovation standard (cuisine, salle de bain, sols, peinture) : 30 000 à 60 000 €. Pour une rénovation complète (réseaux, isolation, cloisons) : 60 000 à 120 000 €. Ces fourchettes incluent la main-d'œuvre et les matériaux.",
  },
  {
    question: "Quelles aides pour rénover ma maison en 2026 ?",
    answer:
      "Les principales aides sont MaPrimeRénov' (jusqu'à 90 % pour les ménages très modestes), les CEE (primes énergie), l'éco-PTZ (jusqu'à 50 000 € à taux zéro), et la TVA à 5,5 % pour les travaux énergétiques. Toutes nécessitent un artisan RGE. Simulez vos aides sur france-renov.gouv.fr.",
  },
  {
    question: "Combien coûte une rénovation énergétique complète ?",
    answer:
      "Pour une maison de 100 m² : l'isolation complète (combles + murs + fenêtres) coûte entre 20 000 et 45 000 €, le remplacement du chauffage (pompe à chaleur) entre 8 000 et 18 000 €, la VMC entre 3 000 et 7 000 €. Total : 30 000 à 70 000 € avant aides. Après aides, le reste à charge peut descendre à 10 000 — 30 000 € selon vos revenus.",
  },
  {
    question: "Faut-il un architecte pour des travaux de rénovation ?",
    answer:
      "Un architecte est obligatoire si la surface de plancher après travaux dépasse 150 m² (article R431-2 du Code de l'urbanisme). En dessous, ce n'est pas obligatoire mais fortement recommandé pour les rénovations lourdes (modification de structure, extension). Honoraires : 8 à 15 % du montant des travaux.",
  },
  {
    question: "Comment réduire le coût de ses travaux ?",
    answer:
      "Planifiez en basse saison (novembre-février) pour de meilleurs tarifs. Cumulez les aides (MaPrimeRénov' + CEE + éco-PTZ + TVA réduite). Demandez 3 à 5 devis comparatifs. Groupez les travaux pour négocier. Certains travaux simples (peinture, pose de parquet flottant) peuvent être faits soi-même pour économiser la main-d'œuvre.",
  },
  {
    question: "Quel est le délai moyen pour une rénovation complète ?",
    answer:
      "Comptez 2 à 4 semaines pour un rafraîchissement, 1 à 3 mois pour une rénovation moyenne, 3 à 6 mois pour une rénovation lourde. Ajoutez 1 à 2 mois de préparation (devis, choix des artisans, éventuelles autorisations). Les délais sont souvent plus longs en période estivale.",
  },
  {
    question: "MaPrimeRénov' est-elle cumulable avec les CEE ?",
    answer:
      "Oui, MaPrimeRénov' est cumulable avec les certificats d'économie d'énergie (CEE), l'éco-PTZ et la TVA réduite. Le cumul des aides est plafonné à 90 % du coût total des travaux pour les ménages très modestes, 75 % pour les ménages modestes, 60 % pour les revenus intermédiaires et 40 % pour les ménages aisés.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Budget rénovation" },
]

export default function BudgetRenovationPage() {
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
        name: "Budget rénovation",
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
            <Calculator className="w-4 h-4" />
            Guide budget
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Budget rénovation : combien coûtent vos travaux en 2026 ?"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Prix au m², budget par pièce, aides financières, conseils pour maîtriser votre budget. Tous les chiffres actualisés pour planifier sereinement votre rénovation."}
          </p>
        </section>

        {/* 1. Fourchettes par type de rénovation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les grandes fourchettes par type de rénovation
          </h2>
          <div className="space-y-6">
            {fourchettesRenovation.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.type} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-4 md:w-1/3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.couleur.split(' ')[0]}`}>
                        <Icon className={`w-6 h-6 ${item.couleur.split(' ')[1]}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{item.type}</h3>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold border ${item.couleur}`}>
                          {item.fourchette}
                        </span>
                      </div>
                    </div>
                    <div className="md:w-2/3">
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <p className="text-sm text-gray-500 font-medium">{item.exemples}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-blue-800 text-sm">
                {"Ces prix s'entendent fournitures et main-d'œuvre TTC en Île-de-France. En province, déduisez 10 à 20 %. Les prix varient aussi selon l'accessibilité du chantier, l'ancienneté du bâtiment et la qualité des matériaux choisis."}
              </p>
            </div>
          </div>
        </section>

        {/* 2. Budget par pièce */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Budget par pièce
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {budgetParPiece.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.piece} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{item.piece}</h3>
                      <span className="text-sm font-semibold text-blue-600">{item.fourchette}</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {item.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                        <span className="text-gray-600 text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* 3. Budget par type de travaux */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Budget par type de travaux
          </h2>
          <div className="space-y-6">
            {budgetParTravaux.map((categorie) => {
              const Icon = categorie.icon
              return (
                <div key={categorie.travaux} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 p-6 pb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{categorie.travaux}</h3>
                  </div>
                  <div className="px-6 pb-6">
                    <table className="w-full">
                      <tbody>
                        {categorie.lignes.map((ligne, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                            <td className="py-2.5 px-3 text-gray-700 text-sm rounded-l-lg">{ligne.description}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-gray-900 text-sm whitespace-nowrap rounded-r-lg">{ligne.prix}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 4. Aides financières */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 md:p-10 text-white">
            <div className="flex items-center gap-3 mb-6">
              <PiggyBank className="w-8 h-8" />
              <h2 className="text-2xl md:text-3xl font-bold font-heading">
                Les aides qui réduisent la facture
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {aides.map((aide) => (
                <div key={aide.nom} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-bold mb-2">{aide.nom}</h3>
                  <p className="text-green-50 text-sm mb-3">{aide.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold text-white">Montant :</span>{" "}
                      <span className="text-green-100">{aide.montant}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-white">Condition :</span>{" "}
                      <span className="text-green-100">{aide.condition}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-green-100 text-sm mb-4">
                {"Simulez vos aides sur le site officiel France Rénov' (france-renov.gouv.fr). Un conseiller France Rénov' peut vous accompagner gratuitement dans vos démarches."}
              </p>
            </div>
          </div>
        </section>

        {/* 5. Comment établir un budget réaliste */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Comment établir un budget réaliste
          </h2>
          <div className="space-y-4">
            {conseilsBudget.map((conseil, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start gap-4">
                  <span className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{conseil.titre}</h3>
                    <p className="text-gray-600">{conseil.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Simulateur / Tableau récapitulatif */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Tableau récapitulatif des coûts et aides
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Estimations pour une maison individuelle de 100 m². Les montants d'aides correspondent aux ménages aux revenus intermédiaires (barème MaPrimeRénov' 2026)."}
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Poste de travaux</th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-gray-700">Estimation TTC</th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-gray-700">Aides estimées</th>
                  </tr>
                </thead>
                <tbody>
                  {simulateurLignes.map((ligne, index) => (
                    <tr key={index} className={`border-b border-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="py-3.5 px-6 text-gray-700 text-sm">{ligne.poste}</td>
                      <td className="py-3.5 px-6 text-right text-sm font-medium text-gray-900">{ligne.estimation}</td>
                      <td className="py-3.5 px-6 text-right text-sm font-medium text-green-600">{ligne.aide}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-blue-50 border-t border-blue-100">
              <p className="text-blue-800 text-sm">
                {"Les montants d'aides sont indicatifs et dépendent de vos revenus, de votre zone géographique et des travaux réalisés. Consultez france-renov.gouv.fr pour une simulation personnalisée."}
              </p>
            </div>
          </div>
        </section>

        {/* 7. Financement */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Euro className="w-8 h-8" />
              <h2 className="text-2xl md:text-3xl font-bold font-heading">
                Financement : comment payer ses travaux
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {financements.map((item) => (
                <div key={item.titre} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-bold mb-2">{item.titre}</h3>
                  <p className="text-blue-100 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guides liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Guides complémentaires
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/aides-renovation-2026" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Aides à la rénovation 2026"}</h3>
              <p className="text-sm text-gray-500">{"MaPrimeRénov', CEE, éco-PTZ : le guide complet."}</p>
            </Link>
            <Link href="/guides/devis-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Comment comparer et négocier les devis."}</p>
            </Link>
            <Link href="/guides/trouver-artisan" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Trouver un artisan de confiance"}</h3>
              <p className="text-sm text-gray-500">{"Les vérifications à faire avant de signer."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur le budget rénovation
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
              {"Prêt à chiffrer votre projet de rénovation ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans qualifiés près de chez vous et demandez des devis gratuits pour comparer les prix."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un artisan"}
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
