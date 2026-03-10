import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileCheck,
  HelpCircle,
  ArrowRight,
  Euro,
  Clock,
  Building2,
  Hammer,
  Home,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/assurance-dommage-ouvrage`

export const metadata: Metadata = {
  title: "Assurance Dommage-Ouvrage : Est-ce Obligatoire ? (2026)",
  description:
    "Tout savoir sur l'assurance dommage-ouvrage : obligation légale, coût moyen (1 à 5 % du chantier), comment souscrire, délais d'indemnisation et conséquences en cas d'absence.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Assurance Dommage-Ouvrage : Est-ce Obligatoire ?",
    description:
      "Guide complet de l'assurance dommage-ouvrage : obligation, coût, souscription et sinistre.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
}

const avantages = [
  {
    name: "Indemnisation rapide",
    icon: Clock,
    description:
      "L'assureur DO doit proposer une indemnisation dans les 90 jours suivant la déclaration de sinistre. Sans DO, il faut attendre la fin d'une procédure judiciaire (2 à 5 ans).",
  },
  {
    name: "Pas de recherche de responsabilité",
    icon: ShieldCheck,
    description:
      "L'assurance DO indemnise sans attendre qu'un tribunal désigne le responsable. L'assureur se retourne ensuite contre l'assurance décennale de l'artisan fautif.",
  },
  {
    name: "Revente facilitée",
    icon: Euro,
    description:
      "L'assurance DO est transférable au nouvel acquéreur pendant les 10 ans de garantie. Un bien sans DO est plus difficile à vendre : le notaire signale l'absence dans l'acte de vente.",
  },
]

const services = [
  { label: "Maçon", href: "/services/macon", icon: Building2 },
  { label: "Couvreur", href: "/services/couvreur", icon: Home },
  { label: "Charpentier", href: "/services/charpentier", icon: Hammer },
  { label: "Plombier", href: "/services/plombier", icon: Hammer },
  { label: "Rénovation intérieure", href: "/services/renovation-interieure", icon: Home },
  { label: "Extension maison", href: "/services/extension-maison", icon: Building2 },
]

const faqItems = [
  {
    question: "L'assurance dommage-ouvrage est-elle obligatoire ?",
    answer:
      "Oui, l'article L242-1 du Code des assurances impose à tout maître d'ouvrage (particulier, promoteur, SCI) de souscrire une assurance dommage-ouvrage avant l'ouverture du chantier. En pratique, aucune sanction pénale ne s'applique aux particuliers, mais l'absence de DO expose à des délais d'indemnisation très longs en cas de sinistre.",
  },
  {
    question: "Combien coûte l'assurance dommage-ouvrage ?",
    answer:
      "Le coût se situe entre 1 et 5 % du montant total des travaux TTC. Pour une construction neuve à 200 000 €, comptez 3 000 à 10 000 €. Pour une rénovation lourde à 50 000 €, entre 1 500 et 3 000 €. Le tarif dépend de la nature des travaux, de la zone géographique et du profil de l'assuré.",
  },
  {
    question: "Quand souscrire l'assurance dommage-ouvrage ?",
    answer:
      "L'assurance DO doit être souscrite avant le début des travaux. C'est une condition de validité du contrat. En pratique, souscrivez-la dès l'obtention du permis de construire ou de la déclaration préalable, et dans tous les cas avant le premier coup de pelle.",
  },
  {
    question: "Que se passe-t-il si je n'ai pas de dommage-ouvrage ?",
    answer:
      "Sans assurance DO, vous pouvez quand même faire jouer la garantie décennale de l'artisan, mais vous devrez engager une procédure judiciaire pour obtenir réparation. La procédure dure 2 à 5 ans en moyenne. De plus, en cas de revente, le notaire mentionnera l'absence de DO dans l'acte, ce qui peut dissuader les acheteurs.",
  },
  {
    question: "Quelle différence entre dommage-ouvrage et garantie décennale ?",
    answer:
      "La garantie décennale est l'assurance de l'artisan : elle couvre sa responsabilité. L'assurance dommage-ouvrage est l'assurance du client : elle préfinance les réparations sans attendre la recherche de responsabilité. L'assureur DO avance l'indemnisation puis se retourne contre l'assurance décennale du constructeur responsable.",
  },
  {
    question: "Quels travaux nécessitent une dommage-ouvrage ?",
    answer:
      "Tous les travaux soumis à la garantie décennale : construction neuve, extension, surélévation, rénovation lourde touchant la structure (murs porteurs, charpente, fondations), réfection de toiture. Les travaux de simple entretien ou d'embellissement (peinture, papier peint) ne nécessitent pas de DO.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Assurance dommage-ouvrage" },
]

export default function AssuranceDommageOuvragePage() {
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
        name: "Assurance dommage-ouvrage",
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

      <div className="min-h-screen bg-gradient-to-b from-teal-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Guide assurance construction
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Assurance dommage-ouvrage : est-ce obligatoire ?"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"L'assurance dommage-ouvrage (DO) est la protection essentielle du maître d'ouvrage. Découvrez son fonctionnement, son coût et pourquoi ne pas s'en passer."}
          </p>
        </section>

        {/* Définition */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              {"Qu'est-ce que l'assurance dommage-ouvrage ?"}
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"L'assurance dommage-ouvrage (DO), créée par la loi Spinetta du 4 janvier 1978, est une assurance souscrite par le maître d'ouvrage (le client qui fait construire ou rénover). Elle garantit le préfinancement des réparations des dommages relevant de la garantie décennale, sans attendre qu'un tribunal détermine les responsabilités."}
              </p>
              <p>
                {"Concrètement, en cas de fissure structurelle, d'infiltration par la toiture ou d'affaissement des fondations, l'assureur DO indemnise dans les 90 jours. Il se retourne ensuite contre l'assurance décennale du ou des constructeurs responsables."}
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <span><strong>Qui souscrit ?</strong> — le maître d{"'"}ouvrage (particulier, promoteur, SCI)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <span><strong>Quand ?</strong> — avant l{"'"}ouverture du chantier, obligatoirement</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <span><strong>Durée</strong> — 10 ans à compter de la réception des travaux</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Obligation légale */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              {"Obligation légale : que dit la loi ?"}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Ce que dit le Code des assurances</h3>
                <p className="text-teal-50 mb-4">
                  {"L'article L242-1 impose la souscription d'une assurance DO à toute personne physique ou morale qui fait réaliser des travaux de construction. Cette obligation vise à protéger le propriétaire en lui garantissant une indemnisation rapide."}
                </p>
                <p className="text-teal-50">
                  {"En pratique, les particuliers ne sont pas sanctionnés pénalement en cas d'absence de DO (contrairement aux professionnels). Cependant, les conséquences financières peuvent être lourdes en cas de sinistre."}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Qui est concerné ?</h3>
                <ul className="space-y-3 text-teal-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Particulier faisant construire sa maison"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Particulier réalisant une extension ou surélévation"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Rénovation lourde touchant la structure du bâtiment"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Promoteur immobilier, SCI, marchand de biens"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Coût */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Combien coûte l{"'"}assurance dommage-ouvrage ?
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-teal-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-teal-700 mb-1">1 à 5 %</div>
                <div className="text-sm text-teal-800 font-medium">Du montant des travaux TTC</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-blue-700 mb-1">3 000 - 10 000 €</div>
                <div className="text-sm text-blue-800 font-medium">Construction neuve (200 000 €)</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-bold text-amber-700 mb-1">1 500 - 3 000 €</div>
                <div className="text-sm text-amber-800 font-medium">Rénovation (50 000 €)</div>
              </div>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"Le tarif varie selon la nature des travaux, le montant du chantier, la zone géographique et le profil du maître d'ouvrage. Les assureurs spécialisés en construction (SMA BTP, SMABTP, Allianz, AXA) proposent des tarifs compétitifs. Comparez au moins 3 devis d'assurance."}
              </p>
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Pourquoi souscrire une dommage-ouvrage ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {avantages.map((a) => {
              const Icon = a.icon
              return (
                <div key={a.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-teal-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{a.name}</h3>
                  <p className="text-gray-600">{a.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Comment souscrire */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Comment souscrire ?
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="bg-teal-100 text-teal-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <div>
                    <strong>Préparez votre dossier</strong>
                    <p className="mt-1">{"Permis de construire ou déclaration préalable, plans, devis détaillés des entreprises, attestations d'assurance décennale des artisans."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-teal-100 text-teal-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <div>
                    <strong>Comparez les offres</strong>
                    <p className="mt-1">{"Demandez au moins 3 devis auprès d'assureurs spécialisés en construction. Les courtiers en assurance construction peuvent vous aider à trouver les meilleures offres."}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-teal-100 text-teal-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <div>
                    <strong>Souscrivez avant le chantier</strong>
                    <p className="mt-1">{"Le contrat doit être signé avant le début des travaux. Conservez l'attestation avec les documents du chantier — vous en aurez besoin en cas de sinistre ou de revente."}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Sinistre sans DO */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              {"Sinistre sans assurance dommage-ouvrage"}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Les conséquences</h3>
                <ul className="space-y-3 text-red-50">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Procédure judiciaire longue (2 à 5 ans) pour obtenir réparation"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Frais d'avocat et d'expertise judiciaire à votre charge"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Travaux de réparation à financer en attendant le jugement"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Difficulté à revendre le bien (mention dans l'acte notarié)"}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">La solution</h3>
                <p className="text-red-50 mb-4">
                  {"Vous pouvez toujours faire jouer la garantie décennale de l'artisan, mais la procédure est longue et coûteuse. Il faut prouver la faute, obtenir une expertise judiciaire et attendre le jugement."}
                </p>
                <p className="text-red-50">
                  {"La DO aurait permis une indemnisation sous 90 jours. C'est pourquoi elle est systématiquement recommandée, même si la sanction pénale ne s'applique pas aux particuliers."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trouver un artisan pour vos travaux
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {"Avant de souscrire votre DO, trouvez les artisans qui réaliseront vos travaux et récupérez leurs attestations décennales."}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-teal-300 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <Icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                    {s.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-teal-600 transition-colors" />
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
            <Link href="/guides/garantie-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-teal-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"L'assurance côté artisan, complémentaire de la DO."}</p>
            </Link>
            <Link href="/guides/devis-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-teal-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Obtenez les devis nécessaires pour votre dossier DO."}</p>
            </Link>
            <Link href="/guides/permis-construire" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-teal-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors mb-1">{"Permis de construire"}</h3>
              <p className="text-sm text-gray-500">{"Étape préalable pour les travaux nécessitant une DO."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-teal-600" />
            Questions fréquentes sur la dommage-ouvrage
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-teal-700 transition-colors">
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
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Prêt à lancer votre chantier ?"}
            </h2>
            <p className="text-teal-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Trouvez des artisans qualifiés, récupérez leurs attestations décennales et souscrivez votre dommage-ouvrage en toute sérénité."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verifier-artisan"
                className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 px-8 py-3.5 rounded-xl font-bold hover:bg-teal-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Trouver un artisan"}
              </Link>
              <Link
                href="/devis"
                className="inline-flex items-center justify-center gap-2 bg-teal-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-teal-400 transition-colors border border-teal-400"
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
