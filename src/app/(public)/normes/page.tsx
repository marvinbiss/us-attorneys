import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  BookOpen,
  Zap,
  Droplets,
  Flame,
  Home,
  Shield,
  ArrowRight,
  Building2,
  FileCheck,
  Search,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/normes`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Normes du Bâtiment : DTU, NF et Réglementations Essentielles",
  description:
    "Guide complet des normes du bâtiment en France : NF C 15-100 (électricité), DTU plomberie, chauffage, isolation RE2020, toiture, fenêtres et accessibilité PMR.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Normes du Bâtiment : DTU, NF et Réglementations Essentielles",
    description:
      "Toutes les normes du bâtiment expliquées en français clair : DTU, NF, RE2020 et réglementations par corps de métier.",
    url: PAGE_URL,
    type: "website",
    siteName: SITE_NAME,
  },
}

const categories = [
  {
    title: "Électricité",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-700",
    normes: [
      {
        name: "NF C 15-100",
        scope: "Installation électrique basse tension",
        requirements:
          "Nombre minimum de prises par pièce, protection différentielle 30 mA obligatoire, tableau divisionnaire, volumes de sécurité en salle de bain (zones 0-1-2), circuits spécialisés (four, plaque, lave-linge).",
        link: "/guides/normes-electriques",
        linkLabel: "Guide NF C 15-100",
        service: "/services/electricien",
        serviceLabel: "Trouver un électricien",
      },
    ],
  },
  {
    title: "Plomberie",
    icon: Droplets,
    color: "bg-blue-100 text-blue-700",
    normes: [
      {
        name: "DTU 60.1",
        scope: "Plomberie sanitaire pour bâtiments",
        requirements:
          "Diamètres des canalisations d'alimentation (12 mm pour un lavabo, 16 mm pour une baignoire), pression de service (1 à 3 bars), protection anti-retour (disconnecteur), matériaux autorisés (cuivre, PER, multicouche).",
        service: "/services/plombier",
        serviceLabel: "Trouver un plombier",
      },
      {
        name: "DTU 60.11",
        scope: "Évacuation des eaux usées et pluviales",
        requirements:
          "Pentes minimales des évacuations (1 à 3 cm/m selon le diamètre), raccordement au réseau collectif ou à l'assainissement individuel, ventilation primaire obligatoire, diamètres des colonnes de chute (100 mm minimum pour les WC).",
        service: "/services/plombier",
        serviceLabel: "Trouver un plombier",
      },
    ],
  },
  {
    title: "Chauffage",
    icon: Flame,
    color: "bg-orange-100 text-orange-700",
    normes: [
      {
        name: "DTU 65.11",
        scope: "Installations de chauffage central à eau chaude (chaudières gaz)",
        requirements:
          "Ventilation du local chaudière (amenée d'air basse + sortie haute), conduit de fumée conforme, thermostat d'ambiance obligatoire depuis 2018, entretien annuel obligatoire, rendement minimal selon la puissance.",
        service: "/services/chauffagiste",
        serviceLabel: "Trouver un chauffagiste",
      },
      {
        name: "DTU 65.14",
        scope: "Pompes à chaleur (PAC) air/eau et eau/eau",
        requirements:
          "Distance minimale par rapport aux limites de propriété (respect des émissions sonores), dimensionnement selon l'étude thermique, fluides frigorigènes autorisés, COP minimal, entretien tous les 2 ans obligatoire pour les PAC > 4 kW.",
        service: "/services/chauffagiste",
        serviceLabel: "Trouver un installateur PAC",
      },
    ],
  },
  {
    title: "Isolation et énergie",
    icon: Home,
    color: "bg-green-100 text-green-700",
    normes: [
      {
        name: "RE2020 (Réglementation Environnementale)",
        scope: "Construction neuve depuis janvier 2022",
        requirements:
          "Bbio max (besoin bioclimatique) réduit de 30 % vs RT2012, Cep max (consommation énergie primaire) abaissé, indicateur carbone IC (prise en compte du cycle de vie des matériaux), confort d'été (indicateur DH). Remplace la RT2012 pour le neuf.",
        service: "/services/isolation",
        serviceLabel: "Trouver un isolateur",
      },
      {
        name: "DTU 45.10",
        scope: "Isolation des combles par soufflage",
        requirements:
          "Résistance thermique minimale R ≥ 7 m².K/W en combles perdus (8 recommandé pour MaPrimeRénov), épaisseur selon le matériau (30-35 cm en laine de verre), pare-vapeur côté chaud, repérage des boîtiers électriques, protection des spots encastrés.",
        service: "/services/isolation",
        serviceLabel: "Trouver un isolateur",
      },
      {
        name: "DTU 45.11",
        scope: "Isolation thermique par l'extérieur (ITE)",
        requirements:
          "Préparation du support (ravalement préalable si nécessaire), fixation mécanique + collage, résistance thermique R ≥ 3,7 m².K/W (murs), traitement des ponts thermiques (tableaux, appuis de fenêtre), pare-pluie, finition enduit ou bardage ventilé.",
        service: "/services/isolation",
        serviceLabel: "Trouver un façadier",
      },
    ],
  },
  {
    title: "Toiture",
    icon: Building2,
    color: "bg-slate-100 text-slate-700",
    normes: [
      {
        name: "DTU 40.11 / 40.21 / 40.24 / 40.41",
        scope: "Couverture selon le type de matériau",
        requirements:
          "DTU 40.11 : ardoises naturelles (recouvrement selon la pente et l'exposition). DTU 40.21 : tuiles de terre cuite (pureau, liteaunage, ventilation sous-toiture). DTU 40.24 : tuiles en béton. DTU 40.41 : couverture zinc (épaisseur 0,65 mm mini, joints debout, pente ≥ 5 %).",
        service: "/services/couvreur",
        serviceLabel: "Trouver un couvreur",
      },
      {
        name: "DTU 43.1 / 43.4",
        scope: "Étanchéité des toitures terrasses",
        requirements:
          "DTU 43.1 : toitures terrasses non accessibles (membrane bitumineuse ou synthétique, isolant, pare-vapeur, protection lourde ou autoprotégée). DTU 43.4 : toitures terrasses avec revêtement d'étanchéité apparente. Pente minimale 1 à 3 %.",
        service: "/services/etancheur",
        serviceLabel: "Trouver un étancheur",
      },
    ],
  },
  {
    title: "Sécurité et accessibilité",
    icon: Shield,
    color: "bg-red-100 text-red-700",
    normes: [
      {
        name: "Normes parasismiques (Eurocode 8)",
        scope: "Construction en zones sismiques (1 à 5)",
        requirements:
          "La France est divisée en 5 zones de sismicité. En zones 2 à 5, les règles parasismiques s'appliquent : fondations renforcées, chaînages horizontaux et verticaux, liaisons murs-planchers, limitations des porte-à-faux. Les maisons individuelles suivent les règles PS-MI (simplifiées).",
        service: "/services/macon",
        serviceLabel: "Trouver un maçon",
      },
      {
        name: "Accessibilité PMR (loi du 11 février 2005)",
        scope: "Logements neufs et ERP",
        requirements:
          "Largeur des portes ≥ 83 cm (90 cm pour la porte d'entrée), salle de bain adaptable (espace de rotation Ø 150 cm), WC accessible, douche de plain-pied, interrupteurs à hauteur (90-130 cm), absence de ressaut > 2 cm. Les ERP existants devaient être mis en conformité (Ad'AP).",
        service: "/services/renovation-interieure",
        serviceLabel: "Trouver un artisan",
      },
    ],
  },
  {
    title: "Fenêtres et menuiseries",
    icon: Home,
    color: "bg-indigo-100 text-indigo-700",
    normes: [
      {
        name: "DTU 36.5 (NF DTU 36.5)",
        scope: "Mise en œuvre des fenêtres et portes extérieures",
        requirements:
          "Calage et fixation du dormant (calles d'assise, de serrage, de jeu), étanchéité à l'air et à l'eau (joints compribande, mastic, membrane), classement AEV (Air, Eau, Vent) minimal selon la zone climatique et l'exposition, pose en applique, en feuillure ou en tunnel.",
        service: "/services/menuisier",
        serviceLabel: "Trouver un menuisier",
      },
      {
        name: "NF P 24-351",
        scope: "Classification des fenêtres selon leurs performances",
        requirements:
          "Classement AEV : A (perméabilité à l'air, A*1 à A*4), E (étanchéité à l'eau, E*1A à E*9A), V (résistance au vent, V*A1 à V*A5). Le classement minimal exigé dépend de la zone géographique, de la hauteur et de l'exposition du bâtiment.",
        link: "/guides/renovation-fenetres",
        linkLabel: "Guide fenêtres",
        service: "/services/menuisier",
        serviceLabel: "Trouver un menuisier",
      },
    ],
  },
]

const breadcrumbItems = [{ label: "Normes du bâtiment" }]

export default function NormesPage() {
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
        name: "Normes du bâtiment",
        item: PAGE_URL,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gradient-to-b from-blue-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            Normes et réglementations
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Normes du bâtiment : DTU, NF et réglementations essentielles"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Les normes du bâtiment garantissent la sécurité, la durabilité et la performance des constructions. Retrouvez les principales réglementations par corps de métier, expliquées en français clair."}
          </p>
        </section>

        {/* Introduction */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              Comprendre les normes du bâtiment
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"Les normes du bâtiment en France se répartissent en trois grandes familles :"}
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>DTU (Documents Techniques Unifiés)</strong> — règles de l{"'"}art pour chaque corps de métier. Ils définissent les matériaux, les mises en œuvre et les contrôles. Contractuellement opposables (si cités dans le marché de travaux).</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Normes NF</strong> — normes françaises homologuées par l{"'"}AFNOR. Elles définissent les caractéristiques des produits et des installations (NF C 15-100 pour l{"'"}électricité, NF P pour la construction).</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Réglementations</strong> — textes à valeur légale (lois, décrets, arrêtés). La RE2020, les règles parasismiques et l{"'"}accessibilité PMR sont des obligations réglementaires, pas de simples recommandations.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Normes par catégorie */}
        {categories.map((cat) => {
          const CatIcon = cat.icon
          return (
            <section key={cat.title} className="max-w-5xl mx-auto px-4 py-10">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color}`}>
                  <CatIcon className="w-5 h-5" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading">
                  {cat.title}
                </h2>
              </div>
              <div className="space-y-4">
                {cat.normes.map((norme) => (
                  <div key={norme.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{norme.name}</h3>
                        <p className="text-sm text-blue-600 font-medium mb-3">{norme.scope}</p>
                        <p className="text-gray-600 mb-4">{norme.requirements}</p>
                        <div className="flex flex-wrap gap-3">
                          {norme.link && (
                            <Link
                              href={norme.link}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <BookOpen className="w-4 h-4" />
                              {norme.linkLabel}
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                          <Link
                            href={norme.service}
                            className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                          >
                            <Search className="w-4 h-4" />
                            {norme.serviceLabel}
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* Guides liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Guides complémentaires
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/normes-electriques" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Normes électriques NF C 15-100"}</h3>
              <p className="text-sm text-gray-500">{"Guide détaillé de la norme électrique avec les obligations par pièce."}</p>
            </Link>
            <Link href="/guides/garantie-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Les travaux non conformes aux normes peuvent affecter la décennale."}</p>
            </Link>
            <Link href="/guides/renovation-toiture" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Rénovation toiture"}</h3>
              <p className="text-sm text-gray-500">{"DTU couverture et isolation appliqués à votre projet."}</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Besoin d'un artisan qui respecte les normes ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des professionnels qualifiés et certifiés près de chez vous. Ils connaissent et appliquent les DTU et normes en vigueur."}
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
