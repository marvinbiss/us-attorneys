import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Home,
  Clock,
  FileCheck,
  Search,
  HelpCircle,
  ArrowRight,
  Euro,
  Shield,
  Hammer,
  Thermometer,
  Layers,
  Leaf,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/isolation-combles`

export const metadata: Metadata = {
  title: "Isolation des Combles : Guide Prix, Techniques et Aides 2026",
  description:
    "Guide isolation combles 2026 : combles perdus (20-75\u202F\u20AC/m\u00B2), combles am\u00E9nag\u00E9s (48-265\u202F\u20AC/m\u00B2), techniques (soufflage, rouleau, sarking), aides et artisans RGE.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Isolation des Combles : Guide Prix, Techniques et Aides 2026",
    description:
      "Guide complet isolation des combles : combles perdus vs am\u00E9nag\u00E9s, techniques, mat\u00E9riaux, prix d\u00E9taill\u00E9s et aides financi\u00E8res 2026.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Isolation des Combles : Guide Prix, Techniques et Aides 2026",
    description:
      "Guide complet isolation des combles : combles perdus vs am\u00E9nag\u00E9s, techniques, mat\u00E9riaux, prix d\u00E9taill\u00E9s et aides financi\u00E8res 2026.",
  },
}

const comparaisonCombles = [
  {
    type: "Combles perdus",
    icon: Layers,
    description:
      "Espace sous toiture non habitable (hauteur insuffisante, charpente fermette). L\u2019isolation se pose directement sur le plancher des combles.",
    quandChoisir:
      "Quand les combles ne sont pas am\u00E9nageables : hauteur sous fa\u00EEtage inf\u00E9rieure \u00E0 1,80\u202Fm, charpente industrielle (fermettes en W), ou absence de projet d\u2019am\u00E9nagement.",
    prix: "20 \u2013 75\u202F\u20AC/m\u00B2",
    performance: "R \u2265 7 m\u00B2.K/W (recommand\u00E9)",
    avantages: "Tr\u00E8s \u00E9conomique, rapide (1 journ\u00E9e), excellente performance thermique",
    inconvenients: "Combles inaccessibles apr\u00E8s soufflage, ne convient pas si on veut am\u00E9nager",
  },
  {
    type: "Combles am\u00E9nag\u00E9s",
    icon: Home,
    description:
      "Espace sous toiture habitable ou destin\u00E9 \u00E0 l\u2019\u00EAtre. L\u2019isolation se pose sous les rampants de toiture (par l\u2019int\u00E9rieur ou l\u2019ext\u00E9rieur).",
    quandChoisir:
      "Quand les combles sont d\u00E9j\u00E0 am\u00E9nag\u00E9s ou quand vous pr\u00E9voyez de les am\u00E9nager : hauteur suffisante, charpente traditionnelle, acc\u00E8s existant.",
    prix: "48 \u2013 265\u202F\u20AC/m\u00B2",
    performance: "R \u2265 6 m\u00B2.K/W (recommand\u00E9)",
    avantages: "Conserve l\u2019espace habitable, plusieurs techniques possibles, confort \u00E9t\u00E9 comme hiver",
    inconvenients: "Plus co\u00FBteux, travaux plus longs, l\u00E9g\u00E8re perte de volume (isolation int\u00E9rieure)",
  },
]

const techniques = [
  {
    name: "Soufflage (combles perdus)",
    prix: "20 \u2013 40\u202F\u20AC/m\u00B2",
    performance: "R = 7 \u00E0 10 m\u00B2.K/W",
    duree: "1 journ\u00E9e (100\u202Fm\u00B2)",
    avantages: "Le plus \u00E9conomique, couvre parfaitement les recoins, supprime les ponts thermiques, \u00E9ligible \u00E0 toutes les aides",
    ideal: "Combles perdus non am\u00E9nageables",
  },
  {
    name: "Rouleaux / Panneaux (combles perdus)",
    prix: "25 \u2013 75\u202F\u20AC/m\u00B2",
    performance: "R = 7 \u00E0 8 m\u00B2.K/W",
    duree: "1 \u00E0 2 jours (100\u202Fm\u00B2)",
    avantages: "Acc\u00E8s aux combles conserv\u00E9 (avec rehausse), pose en double couche crois\u00E9e pour supprimer les ponts thermiques",
    ideal: "Combles perdus avec acc\u00E8s occasionnel souhait\u00E9",
  },
  {
    name: "Panneaux sous rampants (int\u00E9rieur)",
    prix: "48 \u2013 90\u202F\u20AC/m\u00B2",
    performance: "R = 6 \u00E0 8 m\u00B2.K/W",
    duree: "3 \u00E0 5 jours (100\u202Fm\u00B2)",
    avantages: "Conserve la couverture en place, bonne performance, co\u00FBt mod\u00E9r\u00E9 pour des combles am\u00E9nag\u00E9s",
    ideal: "Combles am\u00E9nag\u00E9s, r\u00E9novation sans d\u00E9pose de couverture",
  },
  {
    name: "Sarking (ext\u00E9rieur)",
    prix: "120 \u2013 265\u202F\u20AC/m\u00B2",
    performance: "R = 6 \u00E0 10 m\u00B2.K/W",
    duree: "5 \u00E0 10 jours (100\u202Fm\u00B2)",
    avantages: "Supprime tous les ponts thermiques, aucune perte de volume int\u00E9rieur, id\u00E9al lors d\u2019une r\u00E9fection de toiture",
    ideal: "Combles am\u00E9nag\u00E9s + r\u00E9novation compl\u00E8te de la couverture",
  },
]

const materiaux = [
  {
    name: "Laine de verre souffl\u00E9e",
    icon: Layers,
    lambda: "0,040 \u2013 0,045 W/m.K",
    prix: "3 \u2013 8\u202F\u20AC/m\u00B2 (fourniture)",
    avantages: "Tr\u00E8s \u00E9conomique, l\u00E9g\u00E8re, incombustible (classe A1), excellent rapport performance/prix",
    inconvenients: "Irritante \u00E0 la pose, tassement possible \u00E0 long terme (5-10\u202F%), sensible \u00E0 l\u2019humidit\u00E9",
  },
  {
    name: "Ouate de cellulose",
    icon: Leaf,
    lambda: "0,038 \u2013 0,042 W/m.K",
    prix: "6 \u2013 14\u202F\u20AC/m\u00B2 (fourniture)",
    avantages: "\u00C9cologique (papier recycl\u00E9), excellent d\u00E9phasage thermique (\u00E9t\u00E9), bon isolant acoustique, l\u00E9g\u00E8rement meilleur lambda",
    inconvenients: "Traitement au sel de bore n\u00E9cessaire (ignifuge), tassement possible (jusqu\u2019\u00E0 20\u202F% si mal pos\u00E9e)",
  },
  {
    name: "Laine de roche",
    icon: Shield,
    lambda: "0,034 \u2013 0,040 W/m.K",
    prix: "8 \u2013 18\u202F\u20AC/m\u00B2 (fourniture)",
    avantages: "Excellente r\u00E9sistance au feu (classe A1), tr\u00E8s bon isolant acoustique, imputrescible, ne craint pas l\u2019humidit\u00E9",
    inconvenients: "Plus lourde que la laine de verre, irritante \u00E0 la pose, bilan carbone plus \u00E9lev\u00E9",
  },
  {
    name: "Fibre de bois",
    icon: Leaf,
    lambda: "0,036 \u2013 0,046 W/m.K",
    prix: "15 \u2013 30\u202F\u20AC/m\u00B2 (fourniture)",
    avantages: "\u00C9cologique (bois r\u00E9sineux), meilleur d\u00E9phasage thermique du march\u00E9 (confort d\u2019\u00E9t\u00E9 sup\u00E9rieur), r\u00E9gulation hygrothermique naturelle",
    inconvenients: "Prix \u00E9lev\u00E9, plus lourde (n\u00E9cessite structure adapt\u00E9e), sensible aux insectes si non trait\u00E9e",
  },
]

const prixDetailles = [
  {
    technique: "Soufflage combles perdus (laine de verre)",
    surface50: "1 000 \u2013 2 000\u202F\u20AC",
    surface100: "2 000 \u2013 4 000\u202F\u20AC",
    surface150: "3 000 \u2013 6 000\u202F\u20AC",
    prixM2: "20 \u2013 40\u202F\u20AC/m\u00B2",
  },
  {
    technique: "Soufflage combles perdus (ouate de cellulose)",
    surface50: "1 500 \u2013 2 750\u202F\u20AC",
    surface100: "3 000 \u2013 5 500\u202F\u20AC",
    surface150: "4 500 \u2013 8 250\u202F\u20AC",
    prixM2: "30 \u2013 55\u202F\u20AC/m\u00B2",
  },
  {
    technique: "Rouleaux sur plancher (double couche)",
    surface50: "1 250 \u2013 3 750\u202F\u20AC",
    surface100: "2 500 \u2013 7 500\u202F\u20AC",
    surface150: "3 750 \u2013 11 250\u202F\u20AC",
    prixM2: "25 \u2013 75\u202F\u20AC/m\u00B2",
  },
  {
    technique: "Panneaux sous rampants (int\u00E9rieur)",
    surface50: "2 400 \u2013 4 500\u202F\u20AC",
    surface100: "4 800 \u2013 9 000\u202F\u20AC",
    surface150: "7 200 \u2013 13 500\u202F\u20AC",
    prixM2: "48 \u2013 90\u202F\u20AC/m\u00B2",
  },
  {
    technique: "Sarking (ext\u00E9rieur)",
    surface50: "6 000 \u2013 13 250\u202F\u20AC",
    surface100: "12 000 \u2013 26 500\u202F\u20AC",
    surface150: "18 000 \u2013 39 750\u202F\u20AC",
    prixM2: "120 \u2013 265\u202F\u20AC/m\u00B2",
  },
]

const etapesChantier = [
  {
    titre: "Diagnostic thermique et devis",
    description:
      "Un artisan RGE inspecte vos combles : type de charpente, \u00E9tat de l\u2019existant, pr\u00E9sence de VMC, acc\u00E8s. Il recommande la technique adapt\u00E9e et \u00E9tablit un devis d\u00E9taill\u00E9. Demandez au moins 3 devis.",
  },
  {
    titre: "Pr\u00E9paration du chantier",
    description:
      "D\u00E9gagement des combles (stockage, ancienne isolation d\u00E9grad\u00E9e), v\u00E9rification de l\u2019\u00E9tanch\u00E9it\u00E9 de la toiture, rep\u00E9rage des bo\u00EEtiers \u00E9lectriques et spots encastr\u00E9s (mise en s\u00E9curit\u00E9 avec capots coupe-feu).",
  },
  {
    titre: "Traitement de la ventilation",
    description:
      "V\u00E9rification ou installation de la VMC. Une bonne ventilation est indispensable apr\u00E8s isolation pour \u00E9viter la condensation. Pose de d\u00E9flecteurs au niveau des entr\u00E9es d\u2019air en rive de toit.",
  },
  {
    titre: "Pose du pare-vapeur (si n\u00E9cessaire)",
    description:
      "Mise en place d\u2019une membrane pare-vapeur c\u00F4t\u00E9 chaud (obligatoire pour les isolants sensibles \u00E0 l\u2019humidit\u00E9). Les joints sont scotch\u00E9s pour garantir la continuit\u00E9 de l\u2019\u00E9tanch\u00E9it\u00E9 \u00E0 l\u2019air.",
  },
  {
    titre: "Pose de l\u2019isolant",
    description:
      "Soufflage m\u00E9canique (combles perdus) ou pose de panneaux/rouleaux (sous rampants ou sur plancher). L\u2019\u00E9paisseur est contr\u00F4l\u00E9e par des piges gradu\u00E9es. En sarking, l\u2019isolant rigide est fix\u00E9 sur les chevrons.",
  },
  {
    titre: "Finitions et r\u00E9ception",
    description:
      "Pose du parement int\u00E9rieur (BA13) pour les combles am\u00E9nag\u00E9s, mise en place de la trappe d\u2019acc\u00E8s isol\u00E9e, nettoyage du chantier. L\u2019artisan remet l\u2019attestation sur l\u2019honneur (n\u00E9cessaire pour les aides).",
  },
]

const services = [
  { label: "Isolation thermique", href: "/services/isolation-thermique", icon: Thermometer },
  { label: "Couvreur", href: "/services/couvreur", icon: Home },
  { label: "Charpentier", href: "/services/charpentier", icon: Hammer },
]

const faqItems = [
  {
    question: "Combien co\u00FBte l\u2019isolation des combles perdus ?",
    answer:
      "L\u2019isolation des combles perdus par soufflage co\u00FBte entre 20 et 40\u202F\u20AC/m\u00B2 pose comprise (laine de verre) et 30 \u00E0 55\u202F\u20AC/m\u00B2 (ouate de cellulose). Pour une maison de 100\u202Fm\u00B2 de combles, comptez entre 2\u202F000 et 5\u202F500\u202F\u20AC avant aides. Apr\u00E8s d\u00E9duction de MaPrimeR\u00E9nov\u2019 et des CEE, le reste \u00E0 charge peut descendre \u00E0 quelques centaines d\u2019euros pour les m\u00E9nages modestes.",
  },
  {
    question: "Quelle \u00E9paisseur d\u2019isolant est recommand\u00E9e pour les combles ?",
    answer:
      "Pour atteindre la r\u00E9sistance thermique R\u202F=\u202F7\u202Fm\u00B2.K/W recommand\u00E9e en combles perdus, il faut environ 30 \u00E0 35\u202Fcm de laine de verre souffl\u00E9e, 28 \u00E0 33\u202Fcm de ouate de cellulose, ou 25 \u00E0 30\u202Fcm de laine de roche. Pour les combles am\u00E9nag\u00E9s (R\u202F\u2265\u202F6), l\u2019\u00E9paisseur varie de 22 \u00E0 28\u202Fcm selon le mat\u00E9riau. Ne l\u00E9sinez pas sur l\u2019\u00E9paisseur\u202F: le surco\u00FBt est minime et les \u00E9conomies d\u2019\u00E9nergie sont proportionnelles.",
  },
  {
    question: "Quelle est la dur\u00E9e de vie de l\u2019isolation des combles ?",
    answer:
      "Une isolation correctement pos\u00E9e dure 25 \u00E0 40 ans en moyenne. La laine de verre et la laine de roche conservent leurs performances 30 \u00E0 40 ans. La ouate de cellulose dure 25 \u00E0 35 ans (l\u00E9ger tassement possible). La fibre de bois offre une excellente durabilit\u00E9 (35 \u00E0 40 ans). Les signes de remplacement\u202F: augmentation des factures \u00E9nerg\u00E9tiques, sensation de froid, pr\u00E9sence d\u2019humidit\u00E9 ou de moisissures dans les combles.",
  },
  {
    question: "L\u2019isolation des combles est-elle efficace en \u00E9t\u00E9 comme en hiver ?",
    answer:
      "Oui, mais avec des nuances. En hiver, tous les isolants limitent les pertes de chaleur (jusqu\u2019\u00E0 30\u202F% d\u2019\u00E9conomies sur la facture de chauffage). En \u00E9t\u00E9, c\u2019est le d\u00E9phasage thermique qui compte\u202F: il retarde la p\u00E9n\u00E9tration de la chaleur. La fibre de bois (d\u00E9phasage 10-12h) et la ouate de cellulose (8-10h) sont sup\u00E9rieures \u00E0 la laine de verre (4-6h). Pour un confort d\u2019\u00E9t\u00E9 optimal, privil\u00E9giez ces isolants biosourc\u00E9s.",
  },
  {
    question: "Pourquoi choisir un artisan RGE pour l\u2019isolation des combles ?",
    answer:
      "La certification RGE (Reconnu Garant de l\u2019Environnement) est obligatoire pour b\u00E9n\u00E9ficier de MaPrimeR\u00E9nov\u2019, des CEE, de l\u2019\u00E9co-PTZ et de la TVA \u00E0 5,5\u202F%. Au-del\u00E0 des aides, un artisan RGE garantit une pose conforme aux DTU (r\u00E8gles de l\u2019art)\u202F: \u00E9paisseur correcte, traitement des ponts thermiques, pare-vapeur bien pos\u00E9, ventilation v\u00E9rifi\u00E9e. V\u00E9rifiez la certification sur le site france-renov.gouv.fr avant de signer.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Isolation des combles" },
]

export default function IsolationComblesPage() {
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
        name: "Isolation des combles",
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
            Guide isolation combles
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Isolation des combles : guide prix, techniques et aides 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Les combles repr\u00E9sentent jusqu\u2019\u00E0 30\u202F% des pertes de chaleur d\u2019une maison. D\u00E9couvrez les techniques d\u2019isolation, les prix d\u00E9taill\u00E9s et les aides disponibles en 2026 pour r\u00E9duire votre facture \u00E9nerg\u00E9tique."}
          </p>
        </section>

        {/* Combles perdus vs am\u00E9nag\u00E9s */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Combles perdus vs combles am\u00E9nag\u00E9s
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {comparaisonCombles.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{c.type}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{c.description}</p>
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Quand choisir ?</p>
                    <p className="text-sm text-blue-700">{c.quandChoisir}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm mb-3">
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      <Euro className="w-3 h-3" /> {c.prix}
                    </span>
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      <Shield className="w-3 h-3" /> {c.performance}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">Avantages</p>
                      <p className="text-sm text-gray-600">{c.avantages}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700 mb-1">Inconv\u00E9nients</p>
                      <p className="text-sm text-gray-600">{c.inconvenients}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Techniques d'isolation */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Techniques d{"'"}isolation des combles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {techniques.map((t) => (
              <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm mb-3">
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <Euro className="w-3 h-3" /> {t.prix}
                  </span>
                  <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    <Shield className="w-3 h-3" /> {t.performance}
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" /> {t.duree}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{t.avantages}</p>
                <p className="text-sm font-medium text-blue-600">Id\u00E9al pour : {t.ideal}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mat\u00E9riaux */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Mat\u00E9riaux isolants : comparatif
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {materiaux.map((m) => {
              const Icon = m.icon
              return (
                <div key={m.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                      <p className="text-xs text-gray-500">\u03BB = {m.lambda}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm mb-3">
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      <Euro className="w-3 h-3" /> {m.prix}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">Avantages</p>
                      <p className="text-sm text-gray-600">{m.avantages}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700 mb-1">Inconv\u00E9nients</p>
                      <p className="text-sm text-gray-600">{m.inconvenients}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Prix d\u00E9taill\u00E9s */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Prix d\u00E9taill\u00E9s par technique et surface
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-900">Technique</th>
                    <th className="text-center p-4 font-semibold text-gray-900">50 m\u00B2</th>
                    <th className="text-center p-4 font-semibold text-gray-900">100 m\u00B2</th>
                    <th className="text-center p-4 font-semibold text-gray-900">150 m\u00B2</th>
                    <th className="text-center p-4 font-semibold text-gray-900">Prix/m\u00B2</th>
                  </tr>
                </thead>
                <tbody>
                  {prixDetailles.map((p, index) => (
                    <tr key={p.technique} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="p-4 font-medium text-gray-900">{p.technique}</td>
                      <td className="p-4 text-center text-gray-600">{p.surface50}</td>
                      <td className="p-4 text-center text-gray-600">{p.surface100}</td>
                      <td className="p-4 text-center text-gray-600">{p.surface150}</td>
                      <td className="p-4 text-center font-semibold text-blue-700">{p.prixM2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-blue-50 border-t border-blue-100">
              <p className="text-sm text-blue-800">
                {"Prix TTC pose comprise, indicatifs pour 2026. Incluent la fourniture de l\u2019isolant, la main-d\u2019\u0153uvre et le pare-vapeur. Hors d\u00E9pose de l\u2019ancien isolant (+5 \u00E0 15\u202F\u20AC/m\u00B2) et hors parement int\u00E9rieur (BA13)."}
              </p>
            </div>
          </div>
        </section>

        {/* Aides 2026 */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Aides financi\u00E8res 2026 pour l{"'"}isolation des combles
            </h2>
            <p className="text-green-50 mb-6 text-lg">
              {"L\u2019isolation des combles est l\u2019un des travaux les mieux subventionn\u00E9s. Artisan RGE obligatoire pour toutes les aides."}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">MaPrimeR\u00E9nov{"'"}</h3>
                <p className="text-green-50 text-sm">
                  {"Jusqu\u2019\u00E0 25\u202F\u20AC/m\u00B2 pour les m\u00E9nages tr\u00E8s modestes (combles perdus) et jusqu\u2019\u00E0 75\u202F\u20AC/m\u00B2 pour l\u2019isolation des rampants. Le montant d\u00E9pend de vos revenus et de la zone g\u00E9ographique. Cumulable avec les CEE."}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">CEE (Certificats d{"'"}\u00C9conomies d{"'"}\u00C9nergie)</h3>
                <p className="text-green-50 text-sm">
                  {"Prime \u00E9nergie vers\u00E9e par les fournisseurs d\u2019\u00E9nergie (EDF, TotalEnergies, etc.). De 10 \u00E0 22\u202F\u20AC/m\u00B2 selon la surface, la zone climatique et vos revenus. \u00C0 demander AVANT de signer le devis."}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">TVA \u00E0 5,5 %</h3>
                <p className="text-green-50 text-sm">
                  {"TVA r\u00E9duite \u00E0 5,5\u202F% (au lieu de 20\u202F%) appliqu\u00E9e directement sur la facture par l\u2019artisan RGE. Valable pour les logements de plus de 2 ans (r\u00E9sidence principale ou secondaire)."}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-lg mb-2">\u00C9co-PTZ et aides locales</h3>
                <p className="text-green-50 text-sm">
                  {"Pr\u00EAt \u00E0 taux z\u00E9ro jusqu\u2019\u00E0 50\u202F000\u202F\u20AC pour un bouquet de travaux, remboursable sur 20 ans. Certaines r\u00E9gions et collectivit\u00E9s proposent des compl\u00E9ments (ex : \u00CEle-de-France, Auvergne-Rh\u00F4ne-Alpes)."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* \u00C9tapes du chantier */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            \u00C9tapes du chantier et dur\u00E9e
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-4">
                {etapesChantier.map((etape, index) => (
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
            </div>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium mb-1">Combles perdus (soufflage)</p>
                <p className="text-2xl font-bold text-blue-800">1 jour</p>
                <p className="text-xs text-blue-600">pour 100 m\u00B2</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium mb-1">Sous rampants (int\u00E9rieur)</p>
                <p className="text-2xl font-bold text-blue-800">3 \u00E0 5 jours</p>
                <p className="text-xs text-blue-600">pour 100 m\u00B2</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium mb-1">Sarking (ext\u00E9rieur)</p>
                <p className="text-2xl font-bold text-blue-800">5 \u00E0 10 jours</p>
                <p className="text-xs text-blue-600">pour 100 m\u00B2</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services li\u00E9s */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan RGE pour vos combles
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Confiez l\u2019isolation de vos combles \u00E0 des professionnels certifi\u00E9s RGE et assur\u00E9s en d\u00E9cennale."}
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

        {/* Guides li\u00E9s */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Guides compl\u00E9mentaires
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/renovation-toiture" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"R\u00E9novation de toiture"}</h3>
              <p className="text-sm text-gray-500">{"Profitez d\u2019une r\u00E9fection de toiture pour isoler par sarking."}</p>
            </Link>
            <Link href="/guides/aides-renovation-2026" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Aides r\u00E9novation 2026"}</h3>
              <p className="text-sm text-gray-500">{"Toutes les aides pour financer votre isolation."}</p>
            </Link>
            <Link href="/guides/artisan-rge" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Artisan RGE"}</h3>
              <p className="text-sm text-gray-500">{"Obligatoire pour b\u00E9n\u00E9ficier des aides \u00E0 l\u2019isolation."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fr\u00E9quentes sur l{"'"}isolation des combles
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
              {"Besoin d\u2019un artisan pour isoler vos combles ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans RGE certifi\u00E9s pr\u00E8s de chez vous. Devis gratuit et sans engagement."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/isolation-thermique"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un artisan RGE"}
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
