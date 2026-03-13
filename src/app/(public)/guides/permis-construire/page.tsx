import { Metadata } from "next"
import Link from "next/link"
import {
  FileText,
  Clock,
  Euro,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  ChevronRight,
  MapPin,
  Ruler,
  ClipboardList,
  HelpCircle,
  Scale,
  Landmark,
} from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getFAQSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Permis de Construire : Quand est-il Obligatoire ?",
  description:
    "Guide complet permis de construire 2026 : quand est-il obligatoire (>20m², >40m² en zone PLU), documents requis, délais, coûts et cas spéciaux. Toutes les informations pour vos travaux.",
  keywords: [
    "permis de construire",
    "permis de construire 2026",
    "permis de construire obligatoire",
    "demande permis de construire",
    "documents permis de construire",
    "délai permis de construire",
    "déclaration préalable ou permis de construire",
    "surface plancher permis de construire",
    "zone PLU permis de construire",
  ],
  alternates: {
    canonical: `${SITE_URL}/guides/permis-construire`,
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  openGraph: {
    title: "Permis de Construire 2026 : Quand est-il Obligatoire ?",
    description:
      "Guide complet : quand le permis de construire est obligatoire, documents, délais et coûts. Tout pour vos projets de construction et agrandissement.",
    url: `${SITE_URL}/guides/permis-construire`,
    type: "article",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Permis de Construire 2026 — Guide Complet | ServicesArtisans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Permis de Construire 2026 : Quand est-il Obligatoire ?",
    description:
      "Quand le permis de construire est obligatoire, documents requis, délais et coûts. Guide complet 2026.",
    images: [`${SITE_URL}/opengraph-image`],
  },
}

// ---------------------------------------------------------------------------
// FAQ Data
// ---------------------------------------------------------------------------

const faqItems = [
  {
    question: "Quelle est la différence entre un permis de construire et une déclaration préalable ?",
    answer:
      "Le permis de construire est obligatoire pour les travaux importants : construction neuve de plus de 20 m² (ou 40 m² en zone PLU avec document d\"urbanisme), changement de destination avec modification de structure. La déclaration préalable suffit pour les travaux de moindre ampleur : entre 5 et 20 m² de surface de plancher, modification de façade, pose de clôture. La déclaration préalable est plus simple et plus rapide (délai d\"instruction d\"un mois contre deux à trois mois pour le permis).",
  },
  {
    question: "Combien de temps est valable un permis de construire ?",
    answer:
      "Un permis de construire est valable 3 ans à compter de sa notification. Ce délai peut être prolongé deux fois pour une durée d\"un an chacune, soit 5 ans au total. La demande de prolongation doit être adressée à la mairie au moins 2 mois avant l\"expiration du délai. Attention : les travaux doivent avoir commencé dans ce délai et ne doivent pas être interrompus pendant plus d\"un an.",
  },
  {
    question: "Peut-on commencer les travaux dès l\"obtention du permis ?",
    answer:
      "Non, il faut attendre l\"expiration du délai de recours des tiers, soit 2 mois après l\"affichage du permis sur le terrain. Cet affichage est obligatoire et doit être visible depuis la voie publique pendant toute la durée du chantier. Il est fortement recommandé de faire constater l\"affichage par un huissier pour se prémunir contre d\"éventuels recours.",
  },
  {
    question: "Faut-il un architecte pour déposer un permis de construire ?",
    answer:
      "Le recours à un architecte est obligatoire lorsque la surface de plancher totale après travaux dépasse 150 m² pour les particuliers. En dessous de ce seuil, vous pouvez déposer la demande vous-même. Pour les personnes morales (sociétés, SCI), le recours à un architecte est toujours obligatoire, quelle que soit la surface. Un architecte facture généralement entre 5 % et 12 % du montant total des travaux.",
  },
  {
    question: "Que faire en cas de refus du permis de construire ?",
    answer:
      "En cas de refus, vous disposez de 2 mois pour contester la décision. Vous pouvez d\"abord tenter un recours gracieux auprès du maire, en demandant un réexamen de votre dossier. Si le refus est maintenu, vous pouvez saisir le tribunal administratif dans les 2 mois suivant la notification du refus (ou du rejet du recours gracieux). Il est souvent plus efficace de modifier le projet pour le rendre conforme au PLU avant de redéposer une nouvelle demande.",
  },
  {
    question: "Quelles sont les sanctions en cas de travaux sans permis de construire ?",
    answer:
      "Construire sans permis de construire est un délit passible d\"une amende de 1 200 à 6 000 € par m² de surface construite illégalement, soit jusqu\"à 300 000 € pour les cas les plus graves. Le tribunal peut également ordonner la démolition de la construction et la remise en état du terrain. Le délai de prescription est de 6 ans pour les poursuites pénales, mais l\"action civile en démolition peut être engagée jusqu\"à 10 ans après l\"achèvement des travaux.",
  },
]

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const keyFigures = [
  {
    icon: Ruler,
    value: "> 20 m²",
    label: "Surface de plancher ou emprise au sol",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Clock,
    value: "2-3 mois",
    label: "Délai moyen d\"instruction",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: FileText,
    value: "3 ans",
    label: "Durée de validité du permis",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Euro,
    value: "Gratuit",
    label: "Dépôt de la demande en mairie",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
]

const documentsRequis = [
  { code: "PCMI1", label: "Plan de situation du terrain" },
  { code: "PCMI2", label: "Plan de masse des constructions" },
  { code: "PCMI3", label: "Plan en coupe du terrain et de la construction" },
  { code: "PCMI4", label: "Notice décrivant le terrain et le projet" },
  { code: "PCMI5", label: "Plan des façades et des toitures" },
  { code: "PCMI6", label: "Document graphique d\"insertion dans l\"environnement" },
  { code: "PCMI7", label: "Photographie situant le terrain dans l\"environnement proche" },
  { code: "PCMI8", label: "Photographie situant le terrain dans le paysage lointain" },
]

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function PermisConstruirePage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: "Permis de Construire", url: "/guides/permis-construire" },
  ])
  const faqSchema = getFAQSchema(faqItems)

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb
              items={[
                { label: "Guides", href: "/guides" },
                { label: "Permis de Construire" },
              ]}
            />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-4">
              <Scale className="w-4 h-4" />
              <span>{"Réglementation & Urbanisme"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-heading">
              {"Permis de Construire 2026 : Quand est-il Obligatoire ?"}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              {"Tout savoir sur le permis de construire : seuils de surface, documents à fournir, délais d\"instruction et cas particuliers. Guide complet pour éviter les erreurs et les sanctions."}
            </p>
            <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
              <span>{"Mis à jour : mars 2026"}</span>
              <span>{"•"}</span>
              <span>{"Temps de lecture : 12 min"}</span>
            </div>
          </div>
        </div>

        {/* Key figures */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {keyFigures.map((fig) => (
              <div key={fig.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${fig.bg} mb-2`}>
                  <fig.icon className={`w-5 h-5 ${fig.color}`} />
                </div>
                <div className={`text-xl font-bold ${fig.color}`}>{fig.value}</div>
                <div className="text-xs text-gray-500 mt-1">{fig.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Table of contents */}
          <nav className="bg-white rounded-xl border border-gray-200 p-6 mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{"Sommaire"}</h2>
            <ol className="space-y-2 text-sm">
              {[
                "Quand le permis de construire est-il obligatoire ?",
                "Quand la déclaration préalable suffit-elle ?",
                "Quand aucune autorisation n\"est nécessaire",
                "Documents requis pour le permis de construire",
                "Délais et procédure",
                "Coût du permis de construire",
                "Cas spéciaux : zones protégées et ABF",
                "Questions fréquentes",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Section 1: When PC is mandatory */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Quand le permis de construire est-il obligatoire ?"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <p className="text-gray-700 mb-4">
                {"Le permis de construire est exigé pour tout projet de construction ou d\"agrandissement dépassant certains seuils de surface. Voici les cas les plus fréquents :"}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{"Construction neuve : plus de 20 m²"}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {"Toute construction nouvelle créant plus de 20 m² de surface de plancher ou d\"emprise au sol nécessite un permis de construire. Cela inclut les maisons individuelles, garages, abris de jardin de grande taille, extensions, etc."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{"En zone PLU : plus de 40 m² (extension)"}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {"En zone urbaine couverte par un Plan Local d\"Urbanisme (PLU), le seuil est relevé à 40 m² pour les extensions de bâtiments existants. Au-delà de 40 m² de surface créée, le permis est obligatoire. Attention : si la surface totale après travaux dépasse 150 m², le recours à un architecte est obligatoire."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <Landmark className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{"Changement de destination avec modification de structure"}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {"Transformer un local commercial en habitation (ou inversement) avec modification de la structure porteuse ou de la façade nécessite un permis de construire. Un simple changement de destination sans travaux de structure relève de la déclaration préalable."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                {"La surface de plancher correspond à la somme des surfaces de chaque niveau clos et couvert, calculée à partir du nu intérieur des façades, après déduction des surfaces sous une hauteur de plafond inférieure ou égale à 1,80 m, des trémies d\"escaliers et d\"ascenseurs, et des surfaces de stationnement."}
              </p>
            </div>
          </section>

          {/* Section 2: Declaration prealable */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Quand la déclaration préalable suffit-elle ?"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"La déclaration préalable de travaux est une autorisation d\"urbanisme simplifiée, suffisante pour les projets de moindre envergure :"}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "Extension de 5 à 20 m²", desc: "En zone sans PLU, ou de 5 à 40 m² en zone PLU (si surface totale < 150 m²)" },
                  { title: "Modification de façade", desc: "Changement de fenêtres, de matériaux, de couleur de façade ou de toiture" },
                  { title: "Construction légère", desc: "Piscine de 10 à 100 m², mur de plus de 2 m, clôture en secteur protégé" },
                  { title: "Changement de destination", desc: "Sans modification de structure porteuse ni de façade (ex : bureau en chambre)" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                <Link href="/guides/declaration-prealable-travaux" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  {"Consultez notre guide complet sur la déclaration préalable de travaux"} <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </section>

          {/* Section 3: No authorization */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Quand aucune autorisation n\"est nécessaire"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"Certains travaux sont dispensés de toute formalité d\"urbanisme :"}
              </p>
              <div className="space-y-3">
                {[
                  "Constructions de moins de 5 m² de surface de plancher et de moins de 12 m de hauteur",
                  "Terrasses de plain-pied (non couvertes, non surélevées)",
                  "Piscines de moins de 10 m² (hors secteur protégé)",
                  "Murs de soutènement et clôtures de moins de 2 m (hors secteur protégé)",
                  "Travaux d\"entretien et de réparation ordinaires (remplacement à l\"identique de toiture, fenêtres, etc.)",
                  "Aménagements intérieurs sans changement de destination ni modification de la structure",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>{"Attention :"}</strong>{" en secteur protégé (site classé, abords de monument historique, secteur sauvegardé), même les travaux dispensés de formalités en zone ordinaire peuvent nécessiter une autorisation. Renseignez-vous auprès de votre mairie."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Required documents */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Documents requis pour le permis de construire"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"Le dossier de demande de permis de construire (formulaire Cerfa n° 13406*12 pour une maison individuelle, ou Cerfa n° 13409*12 pour les autres constructions) doit comprendre les pièces obligatoires suivantes :"}
              </p>
              <div className="space-y-3">
                {documentsRequis.map((doc) => (
                  <div key={doc.code} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="inline-flex items-center justify-center min-w-[60px] h-7 bg-blue-100 text-blue-700 text-xs font-mono font-semibold rounded">
                      {doc.code}
                    </span>
                    <span className="text-sm text-gray-700">{doc.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {"Des pièces complémentaires peuvent être demandées selon la localisation du projet (zone inondable, secteur protégé, lotissement, etc.). Renseignez-vous auprès du service d\"urbanisme de votre mairie."}
              </p>
            </div>
          </section>

          {/* Section 5: Timeline */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Délais et procédure"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Dépôt du dossier en mairie",
                    desc: "En 4 exemplaires minimum (5 pour les projets en zone ABF). Le dossier peut être déposé en personne, envoyé par courrier recommandé ou déposé en ligne sur le portail d\"urbanisme de votre commune.",
                    delay: "Jour J",
                  },
                  {
                    step: "2",
                    title: "Accusé de réception et instruction",
                    desc: "La mairie délivre un récépissé indiquant le délai d\"instruction. Elle dispose d\"un mois pour demander des pièces complémentaires. Le délai d\"instruction est de 2 mois pour une maison individuelle, 3 mois pour les autres projets.",
                    delay: "2-3 mois",
                  },
                  {
                    step: "3",
                    title: "Décision et affichage",
                    desc: "La mairie notifie sa décision par lettre recommandée. En l\"absence de réponse dans le délai d\"instruction, le permis est réputé accordé (permis tacite). L\"affichage sur le terrain est obligatoire pendant toute la durée du chantier.",
                    delay: "J + 2-3 mois",
                  },
                  {
                    step: "4",
                    title: "Purge du recours des tiers",
                    desc: "Un délai de 2 mois après affichage permet aux tiers (voisins) de contester le permis. Il est recommandé de ne commencer les travaux qu\"après l\"expiration de ce délai.",
                    delay: "J + 4-5 mois",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{item.delay}</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Cost */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Coût du permis de construire"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{"Dépôt de la demande : gratuit"}</h3>
                  <p className="text-sm text-gray-600">
                    {"Le dépôt du dossier en mairie est totalement gratuit. Aucune taxe n\"est perçue au moment du dépôt."}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">{"Poste de dépense"}</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">{"Coût estimé"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { poste: "Architecte (si obligatoire, > 150 m²)", cout: "5 % à 12 % des travaux" },
                        { poste: "Plans par un dessinateur/projeteur", cout: "1 500 € à 4 000 €" },
                        { poste: "Étude de sol (zone argileuse)", cout: "1 500 € à 2 500 €" },
                        { poste: "Étude thermique RE 2020", cout: "800 € à 2 000 €" },
                        { poste: "Taxe d\"aménagement (après obtention)", cout: "Variable selon commune" },
                      ].map((row) => (
                        <tr key={row.poste}>
                          <td className="py-3 px-4 text-gray-700">{row.poste}</td>
                          <td className="py-3 px-4 text-right font-medium text-gray-900">{row.cout}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500">
                  {"La taxe d\"aménagement est calculée après obtention du permis. Son montant dépend de la surface créée et du taux fixé par la commune. Elle est payable en deux fractions (à 12 et 24 mois après délivrance du permis)."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Special cases */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {"Cas spéciaux : zones protégées et ABF"}
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-gray-700 mb-4">
                {"En secteur protégé, les règles sont plus strictes et les délais plus longs. L\"avis de l\"Architecte des Bâtiments de France (ABF) est souvent requis :"}
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "Abords de monument historique (500 m)",
                    desc: "Avis conforme de l\"ABF obligatoire. Le délai d\"instruction passe à 3 mois minimum. Les matériaux, couleurs et volumes doivent respecter l\"harmonie du site.",
                    color: "bg-purple-50",
                  },
                  {
                    title: "Sites classés et inscrits",
                    desc: "Autorisation spéciale du préfet de région requise en plus du permis de construire. Délai d\"instruction de 6 mois minimum en site classé.",
                    color: "bg-purple-50",
                  },
                  {
                    title: "Sites patrimoniaux remarquables (SPR)",
                    desc: "L\"ABF rend un avis conforme. Le Plan de Sauvegarde et de Mise en Valeur (PSMV) ou le Plan de Valorisation de l\"Architecture et du Patrimoine (PVAP) fixe les règles architecturales à respecter.",
                    color: "bg-purple-50",
                  },
                  {
                    title: "Zones naturelles et Natura 2000",
                    desc: "Une étude d\"impact environnemental peut être exigée. Les constructions sont généralement très limitées voire interdites dans les espaces naturels protégés.",
                    color: "bg-purple-50",
                  },
                ].map((item) => (
                  <div key={item.title} className={`p-4 ${item.color} rounded-lg`}>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{"Questions fréquentes"}</h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <summary className="flex items-center gap-3 p-5 cursor-pointer select-none hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                    <span className="font-medium text-gray-900">{faq.question}</span>
                  </summary>
                  <div className="px-5 pb-5 pl-13 text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-3">
                {"Besoin d\"un professionnel pour votre projet ?"}
              </h2>
              <p className="text-blue-100 mb-6 max-w-2xl">
                {"Trouvez un architecte ou un maçon qualifié près de chez vous pour vous accompagner dans vos démarches de permis de construire et la réalisation de vos travaux."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/services/architecte-interieur"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  {"Trouver un architecte"} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/services/macon"
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors"
                >
                  {"Trouver un maçon"} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Related guides */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{"Guides connexes"}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/guides/declaration-prealable-travaux"
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                  {"Déclaration Préalable de Travaux"}
                </h3>
                <p className="text-sm text-gray-500">{"Guide et formulaire pour les travaux de 5 à 20 m²."}</p>
              </Link>
              <Link
                href="/guides/maprimerenov-2026"
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                  {"MaPrimeRénov 2026"}
                </h3>
                <p className="text-sm text-gray-500">{"Aides financières pour la rénovation énergétique."}</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
