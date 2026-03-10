import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
  Search,
  HelpCircle,
  ArrowRight,
  Building2,
  Hammer,
  Home,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/garantie-decennale`

export const metadata: Metadata = {
  title: "Garantie Décennale : Tout Comprendre en 2026",
  description:
    "Tout savoir sur la garantie décennale : définition, durée de 10 ans, travaux couverts, exclusions, comment vérifier l'attestation d'un artisan et que faire en cas de sinistre.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Garantie Décennale : Tout Comprendre en 2026",
    description:
      "Guide complet sur la garantie décennale : définition, durée, travaux couverts, exclusions et démarches en cas de sinistre.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
}

const travauxCouverts = [
  {
    name: "Gros œuvre",
    icon: Building2,
    description:
      "Fondations, murs porteurs, charpente, toiture, dalles et planchers. Tous les éléments structurels qui assurent la solidité du bâtiment.",
  },
  {
    name: "Étanchéité",
    icon: Home,
    description:
      "Étanchéité de la toiture, des terrasses, des façades et des sous-sols. Les infiltrations compromettant l'habitabilité sont couvertes.",
  },
  {
    name: "Second œuvre indissociable",
    icon: Hammer,
    description:
      "Canalisations encastrées, installation électrique intégrée, chauffage central et isolation solidaire du bâti. Éléments dont le retrait endommagerait la structure.",
  },
]

const services = [
  { label: "Maçon", href: "/services/macon", icon: Building2 },
  { label: "Couvreur", href: "/services/couvreur", icon: Home },
  { label: "Charpentier", href: "/services/charpentier", icon: Hammer },
  { label: "Plombier", href: "/services/plombier", icon: Hammer },
  { label: "Électricien", href: "/services/electricien", icon: Hammer },
  { label: "Rénovation intérieure", href: "/services/renovation-interieure", icon: Home },
]

const faqItems = [
  {
    question: "Quelle est la durée de la garantie décennale ?",
    answer:
      "La garantie décennale court pendant 10 ans à compter de la réception des travaux (procès-verbal de réception signé entre le maître d'ouvrage et l'entreprise). Elle couvre les dommages qui compromettent la solidité de l'ouvrage ou le rendent impropre à sa destination.",
  },
  {
    question: "La garantie décennale est-elle obligatoire ?",
    answer:
      "Oui, l'article L241-1 du Code des assurances impose à tout constructeur (artisan, entrepreneur, architecte, promoteur) de souscrire une assurance de responsabilité civile décennale avant l'ouverture du chantier. Le défaut d'assurance est passible de 75 000 € d'amende et de 6 mois d'emprisonnement.",
  },
  {
    question: "Comment vérifier l'attestation décennale d'un artisan ?",
    answer:
      "Demandez à l'artisan son attestation d'assurance décennale avant de signer le devis. Vérifiez que le document mentionne : le nom de l'assureur, le numéro de contrat, la période de validité, les activités garanties et la zone géographique couverte. Vous pouvez contacter l'assureur pour confirmer la validité du contrat.",
  },
  {
    question: "Que faire en cas de sinistre couvert par la décennale ?",
    answer:
      "Envoyez une lettre recommandée avec accusé de réception à l'artisan en décrivant précisément les désordres constatés. Si l'artisan ne répond pas ou a cessé son activité, contactez directement son assureur décennal dont les coordonnées figurent sur l'attestation. L'assureur doit désigner un expert sous 60 jours.",
  },
  {
    question: "Quels dommages ne sont pas couverts par la garantie décennale ?",
    answer:
      "La garantie décennale ne couvre pas : les dommages purement esthétiques (fissures superficielles, défauts de peinture), les désordres dus à un usage anormal du bâtiment, l'usure normale des matériaux, les dommages causés par un événement extérieur (catastrophe naturelle) et les travaux réalisés par le propriétaire lui-même.",
  },
  {
    question: "Quelle différence entre garantie décennale et dommage-ouvrage ?",
    answer:
      "La garantie décennale est l'assurance de l'artisan : elle le protège en cas de mise en cause. L'assurance dommage-ouvrage est souscrite par le maître d'ouvrage (le client) : elle permet d'être indemnisé rapidement sans attendre la recherche de responsabilité. Les deux sont complémentaires.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Garantie décennale" },
]

export default function GarantieDecennalePage() {
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
        name: "Garantie décennale",
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
            <ShieldCheck className="w-4 h-4" />
            Guide garantie décennale
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Garantie décennale : tout comprendre en 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"La garantie décennale protège votre construction pendant 10 ans. Découvrez ce qu'elle couvre, comment vérifier l'attestation d'un artisan et que faire en cas de sinistre."}
          </p>
        </section>

        {/* Définition */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              {"Qu'est-ce que la garantie décennale ?"}
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"La garantie décennale (articles 1792 et suivants du Code civil) est une responsabilité légale qui pèse sur tout constructeur pendant 10 ans après la réception des travaux. Elle couvre les dommages qui compromettent la solidité de l'ouvrage ou le rendent impropre à sa destination (inhabitable, inutilisable)."}
              </p>
              <p>
                {"Cette garantie est d'ordre public : elle s'applique automatiquement, même si le contrat ne la mentionne pas. L'artisan ne peut pas s'en exonérer, sauf à prouver une cause étrangère (force majeure, fait du maître d'ouvrage)."}
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Durée</strong> — 10 ans à compter de la réception des travaux</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Obligation</strong> — imposée par la loi à tout constructeur (artisan, architecte, promoteur)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Assurance</strong> — l{"'"}artisan doit souscrire une assurance RC décennale avant le chantier</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Durée et point de départ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Durée et point de départ
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">10 ans ferme</h3>
              <p className="text-gray-600">
                {"La garantie court pendant exactement 10 ans. Elle ne peut être ni réduite ni supprimée par contrat. Passé ce délai, l'artisan n'est plus responsable au titre de la décennale."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Réception des travaux</h3>
              <p className="text-gray-600">
                {"Le point de départ est la date de réception des travaux, formalisée par un procès-verbal signé. Les réserves éventuelles doivent y figurer. Sans PV, la date de prise de possession vaut réception tacite."}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Autres garanties</h3>
              <p className="text-gray-600">
                {"Avant la décennale, deux autres garanties s'appliquent : la garantie de parfait achèvement (1 an) et la garantie biennale de bon fonctionnement (2 ans) pour les équipements dissociables."}
              </p>
            </div>
          </div>
        </section>

        {/* Travaux couverts */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Quels travaux sont couverts ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {travauxCouverts.map((t) => {
              const Icon = t.icon
              return (
                <div key={t.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                  </div>
                  <p className="text-gray-600">{t.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Exclusions */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              {"Ce que la décennale ne couvre pas"}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Exclusions classiques</h3>
                <ul className="space-y-3 text-red-50">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Dommages purement esthétiques (fissures superficielles, défauts de peinture)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Usure normale des matériaux et vieillissement naturel"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Dommages causés par le maître d'ouvrage lui-même ou un tiers"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Cas particuliers</h3>
                <ul className="space-y-3 text-red-50">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Travaux réalisés sans déclaration ni permis (risque de nullité)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Catastrophes naturelles (couvertes par l'assurance habitation)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Équipements dissociables (chaudière, volets) → garantie biennale"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Comment vérifier */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              {"Comment vérifier l'attestation décennale ?"}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Les mentions à vérifier</h3>
                <ol className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                    <span>{"Nom et coordonnées de l'assureur"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                    <span>{"Numéro du contrat et période de validité"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                    <span>{"Activités garanties (doivent correspondre aux travaux prévus)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                    <span>{"Zone géographique couverte"}</span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Vérifiez sur ServicesArtisans</h3>
                <p className="text-blue-50 mb-4">
                  {"Consultez le profil détaillé d'un artisan sur notre annuaire : SIRET, assurances, avis clients et coordonnées vérifiées."}
                </p>
                <Link
                  href="/verifier-artisan"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  {"Vérifier un artisan"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Que faire en cas de sinistre */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Que faire en cas de sinistre ?
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <div>
                    <strong>Constatez et documentez</strong>
                    <p className="mt-1">{"Prenez des photos, notez les dates d'apparition des désordres et conservez tous les documents (devis, factures, PV de réception)."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <div>
                    <strong>Mettez en demeure l{"'"}artisan</strong>
                    <p className="mt-1">{"Envoyez une lettre recommandée AR décrivant les désordres et demandant la réparation dans un délai raisonnable (15 à 30 jours)."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <div>
                    <strong>Contactez l{"'"}assureur décennal</strong>
                    <p className="mt-1">{"Si l'artisan ne répond pas ou a cessé son activité, contactez directement son assureur. Les coordonnées figurent sur l'attestation décennale."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                  <div>
                    <strong>Expertise et indemnisation</strong>
                    <p className="mt-1">{"L'assureur désigne un expert sous 60 jours. Si la responsabilité décennale est engagée, l'indemnisation couvre les travaux de réparation."}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan assuré en décennale
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Tous les artisans de notre annuaire sont des professionnels enregistrés. Vérifiez leur attestation décennale avant de signer."}
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
            <Link href="/guides/assurance-dommage-ouvrage" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Assurance dommage-ouvrage"}</h3>
              <p className="text-sm text-gray-500">{"Le complément indispensable de la décennale côté client."}</p>
            </Link>
            <Link href="/guides/devis-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Comment comparer les devis et vérifier les assurances."}</p>
            </Link>
            <Link href="/guides/artisan-rge" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Artisan RGE"}</h3>
              <p className="text-sm text-gray-500">{"Certification et vérification des professionnels."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes sur la garantie décennale
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
              {"Besoin d'un artisan assuré pour vos travaux ?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des professionnels assurés en décennale près de chez vous et demandez un devis gratuit."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verifier-artisan"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Vérifier un artisan"}
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
