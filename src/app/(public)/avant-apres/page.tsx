import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ArrowRight,
  Clock,
  Euro,
  Users,
  Sparkles,
  FileCheck,
  Search,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/avant-apres`

export const revalidate = false

export const metadata: Metadata = {
  title: "Avant/Après Travaux : Galeries de Rénovation",
  description:
    "Découvrez 12 transformations de rénovation avant/après : salle de bain, cuisine, isolation, toiture, parquet, extension, électricité et plus. Budget et durée inclus.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Avant/Après Travaux : Galeries de Rénovation",
    description:
      "12 projets de rénovation avant/après avec budgets, durées et artisans impliqués. Inspirez-vous pour vos travaux.",
    url: PAGE_URL,
    type: "website",
    siteName: SITE_NAME,
  },
}

const transformations = [
  {
    title: "Salle de bain modernisée",
    avant: "Salle de bain de 5 m² vieillissante avec baignoire en fonte, faïence jaunie des années 80, robinetterie qui fuit et joints de silicone noircis. Sol en carrelage fissuré.",
    apres: "Douche à l'italienne avec paroi vitrée, carrelage grand format gris clair, meuble vasque suspendu, sèche-serviettes chromé, éclairage LED encastré et VMC hygroréglable.",
    budget: "8 000 – 15 000 €",
    duree: "2 – 3 semaines",
    artisans: ["Plombier", "Carreleur", "Électricien"],
    services: ["/services/plombier", "/services/carreleur", "/services/electricien"],
  },
  {
    title: "Cuisine ouverte sur séjour",
    avant: "Cuisine fermée de 10 m² séparée du salon par un mur porteur. Espace sombre, meubles des années 90, plan de travail en stratifié abîmé, électroménager vétuste.",
    apres: "Cuisine ouverte avec îlot central en quartz, mur porteur remplacé par une poutre IPN, façades blanc mat sans poignée, électroménager encastré, crédence carreaux de ciment.",
    budget: "15 000 – 30 000 €",
    duree: "4 – 6 semaines",
    artisans: ["Maçon", "Cuisiniste", "Plombier", "Électricien"],
    services: ["/services/macon", "/services/cuisiniste", "/services/plombier", "/services/electricien"],
  },
  {
    title: "Isolation extérieure + ravalement",
    avant: "Façade crépi des années 70 fissurée, aucune isolation (murs en parpaing de 20 cm). DPE classé E, facture chauffage 2 400 €/an, sensation de paroi froide en hiver.",
    apres: "ITE en polystyrène expansé (14 cm, R = 3,7), enduit gratté ton pierre. DPE amélioré à B, facture chauffage réduite à 900 €/an, confort thermique été comme hiver.",
    budget: "12 000 – 25 000 €",
    duree: "3 – 5 semaines",
    artisans: ["Façadier", "Isolation RGE"],
    services: ["/services/facade", "/services/isolation"],
  },
  {
    title: "Toiture rénovée intégralement",
    avant: "Toiture en tuiles mécaniques de 40 ans, plusieurs tuiles cassées, mousse abondante, gouttières PVC percées. Fuites visibles dans les combles après chaque orage.",
    apres: "Couverture neuve en tuiles terre cuite, écran sous-toiture HPV, liteaux et contre-liteaux neufs, gouttières zinc, faîtage scellé. Charpente traitée et renforcée.",
    budget: "15 000 – 30 000 €",
    duree: "2 – 4 semaines",
    artisans: ["Couvreur", "Charpentier", "Zingueur"],
    services: ["/services/couvreur", "/services/charpentier", "/services/zingueur"],
  },
  {
    title: "Salon peinture complète",
    avant: "Salon de 25 m² avec papier peint fleuri des années 80, peinture écaillée au plafond, murs tachés et jaunis par la nicotine. Plinthes en bois verni abîmées.",
    apres: "Murs en peinture mate blanc cassé, mur d'accent en vert sauge, plafond blanc satiné, plinthes poncées et repeintes en blanc, finition soignée.",
    budget: "2 000 – 4 000 €",
    duree: "3 – 5 jours",
    artisans: ["Peintre"],
    services: ["/services/peintre"],
  },
  {
    title: "Parquet rénové",
    avant: "Moquette grise élimée dans tout l'étage (50 m²), tachée et allergène. En dessous, un plancher en chêne massif d'origine en bon état mais gris et abîmé en surface.",
    apres: "Parquet chêne massif mis à nu, poncé en 3 passes (36, 60, 100), teinté chêne naturel et vitrifié mat. Plinthes assorties. Sol chaleureux et facile d'entretien.",
    budget: "3 000 – 6 000 €",
    duree: "4 – 7 jours",
    artisans: ["Parqueteur", "Peintre"],
    services: ["/services/parqueteur", "/services/peintre"],
  },
  {
    title: "Extension bois 15 m²",
    avant: "Maison de 80 m² devenue trop petite pour la famille. Terrain de 400 m² avec possibilité d'extension latérale. Besoin d'un bureau et d'une chambre supplémentaire.",
    apres: "Extension ossature bois de 15 m² avec bardage douglas, baie vitrée coulissante, isolation biosourcée (fibre de bois), plancher chauffant et raccordement au réseau existant.",
    budget: "25 000 – 40 000 €",
    duree: "2 – 3 mois",
    artisans: ["Charpentier bois", "Maçon", "Plombier", "Électricien"],
    services: ["/services/charpentier", "/services/macon", "/services/plombier", "/services/electricien"],
  },
  {
    title: "Électricité mise aux normes",
    avant: "Tableau électrique des années 1970 avec fusibles à broche, pas de différentiel 30 mA, fils en tissu, prises sans terre, aucune protection des circuits. Installation dangereuse.",
    apres: "Tableau neuf NF C 15-100 avec disjoncteurs divisionnaires et interrupteurs différentiels 30 mA type A et AC, câblage en gaine ICTA, prises avec terre, circuits spécialisés cuisine et salle de bain.",
    budget: "5 000 – 10 000 €",
    duree: "1 – 2 semaines",
    artisans: ["Électricien"],
    services: ["/services/electricien"],
  },
  {
    title: "Jardin paysager",
    avant: "Terrain vague de 200 m² en friche : herbes hautes, terre nue par endroits, clôture grillagée rouillée, aucun aménagement extérieur. Inutilisable en l'état.",
    apres: "Terrasse en dalles sur plots (20 m²), pelouse semée, massifs arbustifs, haie de photinia, éclairage LED extérieur, arrosage automatique enterré. Clôture aluminium anthracite.",
    budget: "8 000 – 20 000 €",
    duree: "2 – 4 semaines",
    artisans: ["Paysagiste", "Maçon", "Électricien"],
    services: ["/services/paysagiste", "/services/macon", "/services/electricien"],
  },
  {
    title: "Salle de bain PMR",
    avant: "Salle de bain standard avec baignoire haute (60 cm de rebord), porte de 63 cm, absence de barres d'appui. Inaccessible pour une personne à mobilité réduite.",
    apres: "Douche de plain-pied avec siège rabattable et barre de maintien, porte élargie à 90 cm, lavabo à hauteur réglable, sol antidérapant, WC rehaussé. Conforme PMR.",
    budget: "10 000 – 18 000 €",
    duree: "2 – 3 semaines",
    artisans: ["Plombier", "Carreleur", "Menuisier", "Électricien"],
    services: ["/services/plombier", "/services/carreleur", "/services/menuisier", "/services/electricien"],
  },
  {
    title: "Fenêtres remplacées",
    avant: "10 fenêtres en bois simple vitrage des années 60, peinture écaillée, bois pourri par endroits, courants d'air permanents. Uw > 5 W/m².K, facture chauffage excessive.",
    apres: "10 fenêtres PVC double vitrage 4/16/4 argon (Uw = 1,3), oscillo-battantes, volets roulants motorisés. Réduction du bruit de 50 % et de la facture chauffage de 25 %.",
    budget: "8 000 – 15 000 €",
    duree: "2 – 3 jours",
    artisans: ["Menuisier", "Vitrier"],
    services: ["/services/menuisier", "/services/vitrier"],
  },
  {
    title: "Combles aménagés",
    avant: "Grenier de 35 m² sous charpente fermette, non isolé, servant de débarras. Hauteur sous faîtage de 3,50 m. Accès par une trappe avec échelle escamotable.",
    apres: "Chambre parentale (18 m²) + salle de bain (8 m²) sous rampants. Charpente modifiée (fermette en W remplacée par charpente traditionnelle), 2 velux, parquet, isolation fibre de bois 24 cm.",
    budget: "30 000 – 50 000 €",
    duree: "6 – 10 semaines",
    artisans: ["Charpentier", "Plaquiste", "Plombier", "Électricien", "Couvreur"],
    services: ["/services/charpentier", "/services/plaquiste", "/services/plombier", "/services/electricien", "/services/couvreur"],
  },
]

const breadcrumbItems = [{ label: "Avant / Après travaux" }]

export default function AvantApresPage() {
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
        name: "Avant / Après travaux",
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
            <Sparkles className="w-4 h-4" />
            Avant / Après travaux
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Avant / Après travaux : galeries de rénovation"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Découvrez 12 projets de rénovation avec le détail des transformations, les budgets indicatifs, les durées de chantier et les artisans impliqués. De l'inspiration pour vos propres travaux."}
          </p>
        </section>

        {/* Transformations */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="space-y-8">
            {transformations.map((t, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                      {index + 1}
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-heading">
                      {t.title}
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Avant */}
                    <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-red-200 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Avant</span>
                      </div>
                      <p className="text-gray-700">{t.avant}</p>
                    </div>

                    {/* Après */}
                    <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-green-200 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Après</span>
                      </div>
                      <p className="text-gray-700">{t.apres}</p>
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Euro className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{t.budget}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{t.duree}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{t.artisans.join(", ")}</span>
                    </div>
                  </div>

                  {/* Services links */}
                  <div className="flex flex-wrap gap-2">
                    {t.artisans.map((artisan, i) => (
                      <Link
                        key={i}
                        href={t.services[i] || "/services"}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {artisan}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guides liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Guides pour préparer vos travaux
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/devis-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Comment demander, comparer et négocier vos devis."}</p>
            </Link>
            <Link href="/guides/aides-renovation-2026" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Aides rénovation 2026"}</h3>
              <p className="text-sm text-gray-500">{"Toutes les aides pour financer vos rénovations."}</p>
            </Link>
            <Link href="/guides/garantie-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Protégez vos travaux pendant 10 ans."}</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Inspiré par ces rénovations ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez les artisans qualifiés pour réaliser votre propre transformation. Devis gratuit et sans engagement."}
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
