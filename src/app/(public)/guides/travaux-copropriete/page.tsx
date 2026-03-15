import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileCheck,
  HelpCircle,
  ArrowRight,
  Users,
  Vote,
  Home,
  Hammer,
  Scale,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/travaux-copropriete`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Travaux en Copropriété : Règles et Démarches 2026",
  description:
    "Guide complet des travaux en copropriété : parties communes vs privatives, vote en assemblée générale, majorités requises, autorisations et gros travaux obligatoires.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Travaux en Copropriété : Règles et Démarches 2026",
    description:
      "Toutes les règles pour réaliser des travaux en copropriété : parties communes, privatives, votes AG et autorisations.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Travaux en Copropriété : Règles et Démarches 2026",
    description:
      "Toutes les règles pour réaliser des travaux en copropriété : parties communes, privatives, votes AG et autorisations.",
  },
}

const majorites = [
  {
    name: "Majorité simple (art. 24)",
    icon: Vote,
    description:
      "Majorité des voix des copropriétaires présents ou représentés à l'AG. S'applique aux travaux d'entretien courant, petites réparations sur les parties communes, remplacement à l'identique.",
    exemples: "Ravalement simple, réfection de la peinture des couloirs, remplacement de la porte d'entrée à l'identique",
  },
  {
    name: "Majorité absolue (art. 25)",
    icon: Scale,
    description:
      "Majorité des voix de tous les copropriétaires (présents, représentés et absents). Nécessaire pour les travaux d'amélioration ou de transformation des parties communes.",
    exemples: "Installation d'un ascenseur, digicode, vidéosurveillance, ravalement avec changement de couleur",
  },
  {
    name: "Double majorité (art. 26)",
    icon: Users,
    description:
      "Majorité des 2/3 des voix de tous les copropriétaires. Requise pour les travaux modifiant la destination de l'immeuble ou comportant une transformation importante.",
    exemples: "Changement de destination d'un local, suppression d'un service collectif, modification du règlement",
  },
]

const services = [
  { label: "Plombier", href: "/practice-areas/plombier", icon: Hammer },
  { label: "Électricien", href: "/practice-areas/electricien", icon: Hammer },
  { label: "Peintre", href: "/practice-areas/peintre", icon: Hammer },
  { label: "Couvreur", href: "/practice-areas/couvreur", icon: Home },
  { label: "Maçon", href: "/practice-areas/macon", icon: Building2 },
  { label: "Rénovation intérieure", href: "/practice-areas/renovation-interieure", icon: Home },
]

const faqItems = [
  {
    question: "Puis-je faire des travaux dans mon appartement sans autorisation ?",
    answer:
      "Oui, pour les travaux qui n'affectent pas les parties communes ni l'aspect extérieur de l'immeuble : peinture intérieure, changement de revêtement de sol (sous réserve des normes acoustiques du règlement), remplacement de la cuisine ou de la salle de bain. En revanche, abattre une cloison, modifier les canalisations ou changer les fenêtres nécessite une autorisation de la copropriété.",
  },
  {
    question: "Qui paie les travaux sur les parties communes ?",
    answer:
      "Les travaux sur les parties communes sont financés par l'ensemble des copropriétaires selon leur quote-part (tantièmes). Le syndic appelle les fonds selon l'échéancier voté en AG. Depuis la loi ALUR, un fonds travaux obligatoire (au moins 5 % du budget prévisionnel) est alimenté chaque année.",
  },
  {
    question: "Que sont les parties communes et privatives ?",
    answer:
      "Les parties communes appartiennent à tous les copropriétaires : structure de l'immeuble (murs porteurs, toiture, fondations), halls, escaliers, ascenseur, canalisations principales, façades. Les parties privatives sont à usage exclusif : intérieur de l'appartement, cloisons non porteuses, revêtements intérieurs. Le règlement de copropriété précise la répartition.",
  },
  {
    question: "Comment proposer des travaux en assemblée générale ?",
    answer:
      "Envoyez une demande écrite au syndic en recommandé AR, au moins 2 mois avant l'AG, avec la description des travaux, les devis et le mode de financement proposé. Le syndic est tenu d'inscrire votre résolution à l'ordre du jour. Préparez un argumentaire pour convaincre les autres copropriétaires le jour du vote.",
  },
  {
    question: "Peut-on contester une décision de travaux votée en AG ?",
    answer:
      "Oui, un copropriétaire opposant ou absent peut contester une décision d'AG devant le tribunal judiciaire dans un délai de 2 mois à compter de la notification du procès-verbal. La contestation doit porter sur un vice de forme (convocation irrégulière) ou un abus de majorité.",
  },
  {
    question: "Quels gros travaux sont obligatoires en copropriété ?",
    answer:
      "Depuis 2024, les copropriétés de plus de 200 lots doivent avoir réalisé un DPE collectif et un plan pluriannuel de travaux (PPT). Le ravalement de façade est obligatoire tous les 10 ans à Paris. La mise en conformité des ascenseurs, la sécurité incendie et le désamiantage sont également obligatoires selon la réglementation.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Travaux en copropriété" },
]

export default function TravauxCoproprietePage() {
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
        name: "Travaux en copropriété",
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

      <div className="min-h-screen bg-gradient-to-b from-purple-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            Guide copropriété
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Travaux en copropriété : règles et démarches 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Parties communes, votes en AG, majorités requises : maîtrisez toutes les règles pour réaliser vos travaux en copropriété sereinement."}
          </p>
        </section>

        {/* Parties communes vs privatives */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              Parties communes vs parties privatives
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"La distinction entre parties communes et privatives est fondamentale en copropriété. Elle détermine qui décide, qui paie et quelles autorisations sont nécessaires pour réaliser des travaux."}
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6 not-prose">
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">Parties communes</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                      <span>Murs porteurs, fondations, toiture, charpente</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                      <span>Façades, halls, escaliers, ascenseur</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                      <span>Canalisations principales, colonnes montantes</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                      <span>Fenêtres et volets (souvent parties communes)</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-indigo-900 mb-3">Parties privatives</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 shrink-0" />
                      <span>{"Intérieur de l'appartement, sols, plafonds"}</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 shrink-0" />
                      <span>Cloisons non porteuses</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 shrink-0" />
                      <span>Équipements intérieurs (cuisine, salle de bain)</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 shrink-0" />
                      <span>Revêtements intérieurs (peinture, papier peint)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Majorités de vote */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les majorités de vote en AG
          </h2>
          <div className="space-y-6">
            {majorites.map((m) => {
              const Icon = m.icon
              return (
                <div key={m.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-purple-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{m.description}</p>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Exemples :</span> {m.exemples}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Autorisations pour travaux privatifs */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              {"Travaux privatifs nécessitant une autorisation"}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Autorisation requise</h3>
                <ul className="space-y-3 text-purple-50">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Abattre ou déplacer un mur porteur (même à l'intérieur)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Modifier les canalisations communes (colonnes montantes)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Changer les fenêtres (couleur, matériau, forme)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Installer une climatisation visible en façade"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Sans autorisation</h3>
                <ul className="space-y-3 text-purple-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Peinture, papier peint, revêtement intérieur"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Remplacement cuisine ou salle de bain (sans déplacement)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Changement de revêtement de sol (respect normes acoustiques)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Mise aux normes électriques intérieures"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Gros travaux obligatoires */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Gros travaux obligatoires en 2026
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-red-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">DPE collectif et PPT</h3>
              <p className="text-gray-600">
                {"Depuis 2024, les copropriétés de plus de 200 lots doivent avoir un DPE collectif et un plan pluriannuel de travaux. Obligation étendue progressivement à toutes les copropriétés."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-orange-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ravalement de façade</h3>
              <p className="text-gray-600">
                {"Obligatoire tous les 10 ans à Paris (arrêté préfectoral). Dans les autres communes, l'obligation dépend des arrêtés municipaux. Le non-respect expose à des mises en demeure."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fonds travaux obligatoire</h3>
              <p className="text-gray-600">
                {"Depuis la loi ALUR, chaque copropriété doit constituer un fonds travaux alimenté d'au moins 5 % du budget prévisionnel annuel, placé sur un compte séparé."}
              </p>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan pour votre copropriété
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Consultez notre annuaire pour trouver des professionnels expérimentés en travaux de copropriété."}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-purple-300 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {s.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors" />
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
            <Link href="/guides/quotes-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Comparez les devis pour les travaux de copropriété."}</p>
            </Link>
            <Link href="/guides/guarantee-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Protection essentielle pour les gros travaux."}</p>
            </Link>
            <Link href="/guides/permis-construire" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">{"Permis de construire"}</h3>
              <p className="text-sm text-gray-500">{"Quand un permis est nécessaire en copropriété."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-purple-600" />
            Questions fréquentes sur les travaux en copropriété
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-purple-700 transition-colors">
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
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Des travaux à réaliser dans votre copropriété ?"}
            </h2>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans expérimentés en copropriété et demandez un devis gratuit pour vos travaux."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-8 py-3.5 rounded-xl font-bold hover:bg-purple-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un artisan"}
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 bg-purple-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-purple-400 transition-colors border border-purple-400"
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
