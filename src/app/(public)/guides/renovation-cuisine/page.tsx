import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ChefHat,
  AlertTriangle,
  Search,
  HelpCircle,
  ArrowRight,
  Hammer,
  Home,
  Wrench,
  FileCheck,
  Zap,
  TrendingUp,
  LayoutGrid,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/renovation-cuisine`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Rénovation Cuisine : Guide Complet des Étapes et Prix 2026",
  description:
    "Guide complet rénovation cuisine 2026 : étapes de conception à la pose, prix par poste (meubles, plan de travail, électroménager), budget total et erreurs à éviter.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Rénovation Cuisine : Guide Complet des Étapes et Prix 2026",
    description:
      "Toutes les étapes pour rénover votre cuisine, les prix détaillés 2026 et les conseils d'artisans pour un résultat professionnel.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rénovation Cuisine : Guide Complet des Étapes et Prix 2026",
    description:
      "Toutes les étapes pour rénover votre cuisine, les prix détaillés 2026 et les conseils d'artisans pour un résultat professionnel.",
  },
}

const etapes = [
  {
    num: 1,
    title: "Conception et plans",
    description:
      "Mesurez précisément la pièce, repérez les arrivées d'eau, d'électricité et de gaz. Dessinez le triangle d'activité (évier – plaque – réfrigérateur) pour optimiser les déplacements. C'est l'étape la plus importante : un mauvais plan se paie pendant 20 ans.",
  },
  {
    num: 2,
    title: "Démolition et dépose",
    description:
      "Retrait de l'ancienne cuisine : meubles, crédence, revêtement de sol. Protégez les pièces adjacentes. Vérifiez l'état des murs et du sol avant de continuer — c'est le moment de traiter les problèmes cachés (humidité, fissures).",
  },
  {
    num: 3,
    title: "Plomberie et électricité",
    description:
      "Déplacement ou création des arrivées d'eau (évier, lave-vaisselle), pose du circuit électrique dédié (four, plaques, hotte). Minimum 6 prises sur le plan de travail (norme NF C 15-100). Prévoyez un circuit 32A pour la plaque de cuisson.",
  },
  {
    num: 4,
    title: "Revêtement de sol",
    description:
      "Posé AVANT les meubles pour un résultat propre et pour faciliter un futur changement de cuisine. Carrelage, LVT (vinyle clipsable) ou béton ciré selon votre budget et usage. Privilégiez un sol antidérapant R10 minimum.",
  },
  {
    num: 5,
    title: "Pose des meubles",
    description:
      "Meubles hauts d'abord (à 140 cm du sol), puis bas. Vérifiez les niveaux : un décalage de 2 mm se voit sur un plan de travail de 3 mètres. Renforcez les fixations murales dans les murs en placo avec des chevilles adaptées.",
  },
  {
    num: 6,
    title: "Plan de travail et crédence",
    description:
      "Le plan de travail est posé sur les meubles bas et découpé pour l'évier et la plaque. La crédence protège le mur entre le plan de travail et les meubles hauts (minimum 60 cm de hauteur).",
  },
  {
    num: 7,
    title: "Électroménager et raccordements",
    description:
      "Installation de la hotte (évacuation extérieure si possible), branchement du four, du lave-vaisselle et du réfrigérateur. Test de tous les circuits et vérification de l'absence de fuites.",
  },
  {
    num: 8,
    title: "Finitions",
    description:
      "Joints silicone entre plan de travail et mur, plinthes, éclairage sous meubles hauts (réglettes LED), poignées. Dernier contrôle de l'alignement des façades et du fonctionnement des tiroirs.",
  },
]

const prixParPoste = [
  {
    poste: "Meubles de cuisine",
    fourchette: "2 000 – 15 000 €",
    detail: "Entrée de gamme (mélaminé, caissons 16 mm) : 2 000-4 000 €. Milieu de gamme (laqué, soft-close) : 4 000-8 000 €. Premium (bois massif, veinage apparent) : 8 000-15 000 €.",
    icon: LayoutGrid,
  },
  {
    poste: "Plan de travail",
    fourchette: "500 – 5 000 €",
    detail: "Stratifié (500-1 000 €), quartz (1 500-3 000 €), granit (2 000-4 000 €), céramique grand format (2 500-5 000 €). Prix pour 3 mètres linéaires, fourni posé.",
    icon: Hammer,
  },
  {
    poste: "Électroménager",
    fourchette: "1 000 – 8 000 €",
    detail: "Pack essentiel (four + plaque + hotte) : 1 000-2 500 €. Milieu de gamme + lave-vaisselle + réfrigérateur : 3 000-5 000 €. Premium (induction, pyrolyse, tiroir chauffant) : 5 000-8 000 €.",
    icon: Zap,
  },
  {
    poste: "Plomberie",
    fourchette: "800 – 2 000 €",
    detail: "Raccordement évier et lave-vaisselle, robinetterie avec douchette extractible. Plus cher si déplacement de l'évier ou création d'un îlot avec arrivée d'eau.",
    icon: Wrench,
  },
  {
    poste: "Électricité",
    fourchette: "500 – 2 000 €",
    detail: "Mise aux normes, circuit 32A dédié plaque, prises plan de travail, éclairage LED. Ajoutez 300-500 € pour une hotte en évacuation extérieure (gaine + percement).",
    icon: Zap,
  },
  {
    poste: "Crédence",
    fourchette: "200 – 2 000 €",
    detail: "Verre laqué (200-600 €), carrelage métro (300-800 €), inox brossé (400-1 000 €), pierre naturelle (800-2 000 €). Prix pour environ 2 m².",
    icon: Home,
  },
]

const budgetTotal = [
  {
    gamme: "Rafraîchissement",
    prix: "3 000 – 6 000 €",
    description: "Repeindre les façades, changer les poignées, nouvelle crédence, remplacement de la robinetterie et de l'éclairage. Pas de changement de meubles.",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    gamme: "Rénovation complète",
    prix: "8 000 – 20 000 €",
    description: "Nouveaux meubles, plan de travail, électroménager, plomberie/électricité aux normes, crédence, sol. La fourchette la plus courante en France.",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    gamme: "Premium / sur-mesure",
    prix: "20 000 – 50 000 €",
    description: "Cuisine sur-mesure en bois massif, électroménager haut de gamme, îlot central avec cuisson et rangement, domotique, éclairage architectural.",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
]

const typesImplantation = [
  {
    type: "Linéaire (I)",
    description: "Tous les éléments sur un seul mur. Idéal pour les petites cuisines ou cuisines ouvertes. Longueur recommandée : 2,5 à 4 m.",
    ideal: "Studios, petits appartements",
  },
  {
    type: "En L",
    description: "Deux murs adjacents. L'implantation la plus polyvalente, qui respecte naturellement le triangle d'activité. Convient aux cuisines de 8-15 m².",
    ideal: "Maisons, grands appartements",
  },
  {
    type: "En U",
    description: "Trois murs utilisés. Maximum de rangement et de plan de travail. Nécessite une largeur de pièce d'au moins 2,4 m entre les deux rangées.",
    ideal: "Cuisines fermées 10 m²+",
  },
  {
    type: "Îlot central",
    description: "Un bloc central en plus des meubles muraux. Permet de cuisiner face aux invités. Nécessite au moins 12 m² et 90 cm de passage autour de l'îlot.",
    ideal: "Grandes pièces de vie ouvertes",
  },
  {
    type: "Parallèle (II)",
    description: "Deux rangées de meubles face à face. Très efficace pour le triangle d'activité. L'allée centrale doit mesurer 120 cm minimum.",
    ideal: "Cuisines en longueur, professionnels",
  },
]

const materiauxPlanDeTravail = [
  { materiau: "Stratifié", prix: "50–150 €/ml", resistance: "Moyenne", entretien: "Facile", duree: "10-15 ans", note: "Le plus économique. Large choix de décors. Sensible aux brûlures et aux rayures profondes." },
  { materiau: "Quartz (Silestone, Caesarstone)", prix: "200–500 €/ml", resistance: "Très élevée", entretien: "Très facile", duree: "25 ans+", note: "Surface non poreuse, résistant aux taches. Le meilleur rapport qualité-prix en milieu de gamme." },
  { materiau: "Granit", prix: "250–600 €/ml", resistance: "Très élevée", entretien: "Facile (à traiter)", duree: "30 ans+", note: "Pierre naturelle, chaque plan est unique. Nécessite un traitement hydrofuge tous les 2-3 ans." },
  { materiau: "Bois massif", prix: "150–400 €/ml", resistance: "Moyenne", entretien: "Exigeant", duree: "15-20 ans", note: "Chêne, hêtre ou noyer. Chaleureux mais sensible à l'eau. Huilage régulier obligatoire." },
  { materiau: "Inox", prix: "300–700 €/ml", resistance: "Élevée", entretien: "Moyen", duree: "25 ans+", note: "Hygiénique et professionnel. Se raye facilement mais les rayures font partie du cachet." },
  { materiau: "Céramique (Dekton, Neolith)", prix: "350–800 €/ml", resistance: "Extrême", entretien: "Très facile", duree: "30 ans+", note: "Résiste à la chaleur, aux UV, aux taches. Peut se poser en fine épaisseur (12 mm). Le plus résistant du marché." },
]

const erreurs = [
  {
    title: "Triangle d'activité ignoré",
    description:
      "Évier, plaque de cuisson et réfrigérateur doivent former un triangle dont chaque côté mesure entre 1,2 et 2,7 m. Un triangle trop grand (plus de 7 m de périmètre) ou trop petit fatigue et ralentit la préparation des repas.",
  },
  {
    title: "Rangement sous-dimensionné",
    description:
      "Prévoyez au minimum 12 mètres linéaires de rangement (meubles hauts + bas) pour une cuisine fonctionnelle. Les tiroirs à sortie totale remplacent avantageusement les portes battantes pour les meubles bas.",
  },
  {
    title: "Éclairage mal pensé",
    description:
      "Trois niveaux d'éclairage sont nécessaires : général (plafonnier), fonctionnel (réglettes LED sous meubles hauts) et d'ambiance (spots orientables). Le plan de travail doit être éclairé à 500 lux pour cuisiner confortablement.",
  },
  {
    title: "Prises insuffisantes",
    description:
      "La norme impose au moins 6 prises sur le plan de travail. En pratique, prévoyez-en 8 à 10 pour le grille-pain, la bouilloire, le robot, le chargeur, etc. Ajoutez un plan USB intégré.",
  },
]

const tendances2026 = [
  {
    title: "Cuisine ouverte avec verrière",
    description: "La verrière d'atelier permet de cloisonner visuellement sans fermer l'espace. Elle bloque les odeurs et le bruit tout en laissant passer la lumière.",
  },
  {
    title: "Façades sans poignées",
    description: "Ouverture push-to-open ou gorge intégrée. Lignes épurées et nettoyage facilité. Associées aux couleurs mates (vert sauge, bleu nuit, terracotta).",
  },
  {
    title: "Îlot multifonction",
    description: "Îlot avec cuisson, évier de préparation, rangement et coin repas intégré. Le cœur de la pièce de vie dans les maisons modernes.",
  },
  {
    title: "Électroménager encastré invisible",
    description: "Réfrigérateur, lave-vaisselle et four intégrés derrière des façades identiques aux meubles. L'effet « tout intégré » pour une esthétique cohérente.",
  },
  {
    title: "Matériaux naturels",
    description: "Bois, pierre, terrazzo, laiton brossé. Retour au naturel et aux matériaux durables, en opposition au tout-laqué des années précédentes.",
  },
]

const services = [
  { label: "Cuisiniste", href: "/practice-areas/cuisiniste", icon: ChefHat },
  { label: "Plombier", href: "/practice-areas/plombier", icon: Wrench },
  { label: "Électricien", href: "/practice-areas/electricien", icon: Zap },
  { label: "Carreleur", href: "/practice-areas/carreleur", icon: Hammer },
  { label: "Peintre", href: "/practice-areas/peintre", icon: Home },
]

const faqItems = [
  {
    question: "Combien coûte une rénovation complète de cuisine ?",
    answer:
      "Pour une cuisine de 10-12 m², comptez entre 8 000 et 20 000 € en rénovation complète (meubles neufs, plan de travail, électroménager, plomberie et électricité). Un rafraîchissement (peinture des façades, nouvelle crédence, poignées) revient à 3 000-6 000 €. Une cuisine premium sur-mesure peut atteindre 30 000-50 000 €.",
  },
  {
    question: "Combien de temps faut-il pour rénover une cuisine ?",
    answer:
      "Un rafraîchissement prend 3 à 5 jours. Une rénovation complète nécessite 2 à 3 semaines (incluant la plomberie, l'électricité, le sol et la pose des meubles). Ajoutez 4 à 8 semaines de délai de fabrication pour les meubles sur-mesure. Prévoyez un coin cuisine provisoire (micro-ondes, bouilloire) pendant les travaux.",
  },
  {
    question: "Quel est le meilleur matériau pour un plan de travail ?",
    answer:
      "Le quartz offre le meilleur rapport qualité-prix : non poreux, résistant aux taches et aux rayures, facile d'entretien, 25 ans de durée de vie. Le granit est idéal si vous recherchez un matériau naturel unique. La céramique (Dekton, Neolith) est la plus résistante mais aussi la plus chère. Le stratifié reste pertinent pour les petits budgets.",
  },
  {
    question: "Peut-on rénover sa cuisine sans tout casser ?",
    answer:
      "Oui, un « resurfaçage » permet de transformer l'aspect sans dépose : peinture spéciale meubles (après ponçage et primaire), remplacement des portes sur les caissons existants, nouvelle crédence adhésive ou à coller, et nouveau plan de travail posé par-dessus l'ancien (si l'épaisseur le permet). Budget : 2 000-5 000 €.",
  },
  {
    question: "Faut-il poser le sol avant ou après les meubles de cuisine ?",
    answer:
      "Avant. Poser le sol sous les meubles facilite un futur changement de cuisine (pas besoin de refaire le sol) et évite les problèmes de niveau. Seule exception : le parquet massif, parfois posé après pour limiter les coupes. Pour le carrelage, le LVT ou le béton ciré, posez toujours avant.",
  },
  {
    question: "Quelles aides pour la rénovation de cuisine ?",
    answer:
      "Il n'existe pas d'aide spécifique pour la rénovation de cuisine. En revanche, vous bénéficiez de la TVA à 10 % (au lieu de 20 %) sur la main-d'œuvre si votre logement a plus de 2 ans. Si les travaux incluent un volet énergétique (isolation d'un mur extérieur adjacent, changement de fenêtre), ces postes peuvent bénéficier de MaPrimeRénov et de la TVA à 5,5 %.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Rénovation cuisine" },
]

export default function RenovationCuisinePage() {
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
        name: "Rénovation cuisine",
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
            <ChefHat className="w-4 h-4" />
            Guide rénovation cuisine
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Rénovation cuisine : guide complet des étapes et prix 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"De la conception à l'installation, découvrez toutes les étapes pour rénover votre cuisine, les prix détaillés par poste et les erreurs qui coûtent cher."}
          </p>
        </section>

        {/* Étapes */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les 8 étapes d{"'"}une rénovation de cuisine
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
            Budget total par gamme
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
            {"* Prix indicatifs pour une cuisine de 10-12 m² en Île-de-France. Comptez 10-20 % de moins en province."}
          </p>
        </section>

        {/* Types d'implantation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-blue-600" />
            Les 5 types d{"'"}implantation
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {typesImplantation.map((t) => (
              <div key={t.type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t.type}</h3>
                <p className="text-gray-600 text-sm mb-3">{t.description}</p>
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                  {t.ideal}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Matériaux plan de travail */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Comparatif des matériaux de plan de travail
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900">Matériau</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Prix / ml</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Résistance</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Entretien</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Durée de vie</th>
                </tr>
              </thead>
              <tbody>
                {materiauxPlanDeTravail.map((m, i) => (
                  <tr key={m.materiau} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="p-4">
                      <span className="font-semibold text-gray-900">{m.materiau}</span>
                      <p className="text-xs text-gray-500 mt-1">{m.note}</p>
                    </td>
                    <td className="p-4 text-blue-700 font-semibold text-sm">{m.prix}</td>
                    <td className="p-4 text-sm text-gray-600">{m.resistance}</td>
                    <td className="p-4 text-sm text-gray-600">{m.entretien}</td>
                    <td className="p-4 text-sm text-gray-600">{m.duree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Erreurs à éviter */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Les erreurs fréquentes à éviter
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
            Tendances cuisine 2026
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tendances2026.map((t) => (
              <div key={t.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-gray-600 text-sm">{t.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Artisans pour votre cuisine
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Les professionnels dont vous aurez besoin pour votre rénovation de cuisine."}
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
            <Link href="/guides/renovation-salle-de-bain" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Rénovation salle de bain"}</h3>
              <p className="text-sm text-gray-500">{"Étapes, prix et conseils pour votre salle de bain."}</p>
            </Link>
            <Link href="/guides/renovation-energetique-complete" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Rénovation énergétique"}</h3>
              <p className="text-sm text-gray-500">{"Guide complet : isolation, chauffage, aides 2026."}</p>
            </Link>
            <Link href="/guides/quotes-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Comment comparer les devis et éviter les pièges."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur la rénovation de cuisine
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
              {"Prêt à rénover votre cuisine ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des cuisinistes et artisans qualifiés près de chez vous et comparez les devis gratuitement."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                Trouver un artisan
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
