import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  Users,
  Building2,
  BadgeCheck,
  Scale,
  Globe,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/trouver-artisan`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Comment Trouver un Artisan de Confiance en 2026",
  description:
    "Guide complet pour trouver un artisan fiable : vérifications SIRET, décennale, RGE, comparaison de devis, labels et certifications, droits du client et recours en cas de problème.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Comment Trouver un Artisan de Confiance en 2026",
    description:
      "Guide complet pour trouver un artisan fiable en France : vérifications, devis, labels et recours.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Comment Trouver un Artisan de Confiance en 2026",
    description:
      "Guide complet pour trouver un artisan fiable en France : vérifications, devis, labels et recours.",
  },
}

const ouChercher = [
  {
    name: "Annuaires en ligne spécialisés",
    icon: Globe,
    description:
      "Les annuaires comme ServicesArtisans référencent des professionnels avec leur numéro SIRET vérifié. Vous pouvez consulter les avis, les coordonnées et demander un devis directement. Privilégiez les plateformes qui vérifient les données via les registres officiels (SIRENE, répertoire des métiers).",
  },
  {
    name: "Bouche-à-oreille et recommandations",
    icon: Users,
    description:
      "Demandez à vos proches, voisins ou collègues. Une recommandation personnelle reste l'un des meilleurs indicateurs de fiabilité. Les groupes locaux sur les réseaux sociaux peuvent aussi être utiles, mais restez vigilant face aux faux avis.",
  },
  {
    name: "Fédérations professionnelles",
    icon: Building2,
    description:
      "La FFB (Fédération Française du Bâtiment), la CAPEB (Confédération de l'Artisanat et des Petites Entreprises du Bâtiment) et les chambres des métiers tiennent des annuaires de leurs adhérents. L'adhésion implique le respect d'une charte de qualité.",
  },
]

const verificationsIndispensables = [
  {
    title: "Numéro SIRET",
    description:
      "Vérifiez que l'entreprise est bien immatriculée sur le site de l'INSEE (sirene.fr) ou sur le Registre National des Entreprises (RNE). Un artisan sans SIRET valide exerce illégalement. Le SIRET vous permet aussi de vérifier l'ancienneté de l'entreprise et son activité déclarée.",
  },
  {
    title: "Assurance décennale",
    description:
      "Demandez l'attestation d'assurance décennale en cours de validité AVANT de signer le devis. Vérifiez que les activités garanties correspondent aux travaux prévus. Vous pouvez contacter l'assureur pour confirmer la validité du contrat.",
  },
  {
    title: "Qualification RGE",
    description:
      "Pour les travaux de rénovation énergétique (isolation, chauffage, fenêtres), la certification RGE (Reconnu Garant de l'Environnement) est indispensable pour bénéficier des aides publiques (MaPrimeRénov', CEE). Vérifiez sur france-renov.gouv.fr.",
  },
  {
    title: "Avis clients vérifiés",
    description:
      "Consultez les avis sur plusieurs plateformes (Google, annuaires spécialisés). Méfiez-vous des profils avec uniquement des avis 5 étoiles récents ou des formulations très similaires. Les avis détaillés mentionnant des travaux précis sont plus fiables.",
  },
]

const mentionsDevis = [
  "Date du devis et durée de validité (généralement 30 jours)",
  "Nom, adresse, SIRET et numéro d'inscription au répertoire des métiers de l'artisan",
  "Description détaillée de chaque prestation avec quantités et prix unitaires",
  "Coût de la main-d'œuvre et des matériaux séparés",
  "Taux de TVA applicable (10 % pour la rénovation, 5,5 % pour les travaux d'amélioration énergétique, 20 % pour le neuf)",
  "Montant total HT et TTC",
  "Conditions de paiement (échéancier, acompte maximum 30 % à la commande)",
  "Date de début et durée estimée des travaux",
  "Mention des assurances (décennale, RC professionnelle)",
]

const redFlags = [
  "Devis oral ou griffonné sur un bout de papier",
  "Prix anormalement bas par rapport aux autres devis (plus de 30 % d'écart)",
  "Absence de détail : un montant global sans décomposition",
  "Demande d'acompte supérieur à 30 % avant le début des travaux",
  "Pression pour signer immédiatement (« prix valable aujourd'hui seulement »)",
  "Refus de fournir l'attestation décennale ou le numéro SIRET",
]

const questionsAvantSignature = [
  "Avez-vous déjà réalisé ce type de travaux ? Pouvez-vous me montrer des exemples ?",
  "Qui interviendra sur le chantier ? Faites-vous appel à des sous-traitants ?",
  "Quel est le planning précis : date de début, étapes, durée totale ?",
  "Comment gérez-vous les imprévus et les surcoûts éventuels ?",
  "Quelles garanties offrez-vous après la fin des travaux ?",
  "Pouvez-vous me fournir les coordonnées d'anciens clients pour référence ?",
  "Le devis inclut-il le nettoyage du chantier et l'évacuation des gravats ?",
]

const signesFiable = [
  { label: "Répond rapidement et précisément à vos questions", fiable: true },
  { label: "Fournit spontanément son SIRET et son attestation décennale", fiable: true },
  { label: "Propose un devis détaillé et écrit avant tout engagement", fiable: true },
  { label: "Accepte un calendrier de paiement lié à l'avancement des travaux", fiable: true },
  { label: "Dispose d'un local professionnel identifiable", fiable: true },
  { label: "Peut fournir des références clients vérifiables", fiable: true },
  { label: "Se déplace pour évaluer les travaux avant de chiffrer", fiable: true },
  { label: "Refuse de fournir un devis écrit ou son numéro SIRET", fiable: false },
  { label: "Demande un paiement intégral avant le début des travaux", fiable: false },
  { label: "Fait du démarchage agressif à domicile", fiable: false },
  { label: "Propose des prix « cash » sans facture", fiable: false },
  { label: "N'a aucune présence en ligne ni référence vérifiable", fiable: false },
  { label: "Change le prix après signature sans avenant écrit", fiable: false },
]

const labels = [
  {
    name: "Qualibat",
    description:
      "Certification de qualification et de compétence des entreprises du bâtiment. Couvre tous les corps de métier (gros œuvre, second œuvre, finitions). Délivrée après audit du savoir-faire, des moyens et des références.",
  },
  {
    name: "QualiEnR",
    description:
      "Certification spécifique aux installateurs d'énergies renouvelables : panneaux solaires (QualiPV), pompes à chaleur (QualiPAC), bois énergie (Qualibois). Obligatoire pour les aides à la rénovation énergétique.",
  },
  {
    name: "RGE (Reconnu Garant de l'Environnement)",
    description:
      "Label délivré par des organismes accrédités (Qualibat, QualiEnR, Qualifelec) aux professionnels formés aux travaux de performance énergétique. Condition sine qua non pour que le client accède à MaPrimeRénov', aux CEE et à l'éco-PTZ.",
  },
  {
    name: "Handibat",
    description:
      "Label attestant la compétence d'un artisan pour les travaux d'accessibilité et d'adaptation du logement aux personnes en situation de handicap ou de perte d'autonomie. Délivré par la CAPEB après formation spécifique.",
  },
  {
    name: "Qualifelec",
    description:
      "Qualification des entreprises du génie électrique et énergétique. Atteste de la compétence technique pour les installations électriques, la domotique, les bornes de recharge et les panneaux photovoltaïques.",
  },
  {
    name: "NF Habitat / NF Habitat HQE",
    description:
      "Certification délivrée par CERQUAL (filiale de Qualitel) pour les logements neufs ou rénovés. Garantit un niveau de qualité supérieur en termes de performance énergétique, confort acoustique et qualité de l'air.",
  },
]

const faqItems = [
  {
    question: "Comment trouver un bon artisan près de chez moi ?",
    answer:
      "Utilisez un annuaire en ligne vérifié comme ServicesArtisans pour rechercher par métier et localisation. Demandez aussi des recommandations à votre entourage. Vérifiez systématiquement le SIRET, l'attestation décennale et les avis clients avant de contacter l'artisan.",
  },
  {
    question: "Combien de devis faut-il demander pour des travaux ?",
    answer:
      "Demandez au minimum 3 devis pour pouvoir comparer. Pour des travaux importants (plus de 10 000 €), 4 à 5 devis sont recommandés. Comparez non seulement les prix, mais aussi le détail des prestations, les matériaux proposés et les délais annoncés.",
  },
  {
    question: "Est-il obligatoire de signer un devis ?",
    answer:
      "Oui, pour tout travaux dépassant 150 € TTC, un devis écrit est obligatoire avant le début des travaux (article L111-3 du Code de la consommation). Le devis signé vaut contrat et engage les deux parties. Sans devis signé, il sera très difficile de faire valoir vos droits en cas de litige.",
  },
  {
    question: "Un artisan peut-il demander un acompte avant les travaux ?",
    answer:
      "Oui, un acompte est courant et légitime. Cependant, il ne devrait pas dépasser 30 % du montant total. Méfiez-vous des artisans qui exigent plus de 50 % avant même de commencer. Privilégiez un échéancier lié à l'avancement : 30 % au démarrage, 30 % à mi-parcours, 40 % à la réception.",
  },
  {
    question: "Comment vérifier si un artisan est bien assuré en décennale ?",
    answer:
      "Demandez l'attestation d'assurance décennale en cours de validité. Vérifiez qu'elle mentionne : le nom de l'assureur, le numéro de contrat, la période de validité, les activités couvertes. En cas de doute, contactez directement l'assureur mentionné sur l'attestation pour confirmer sa validité.",
  },
  {
    question: "Que faire si un artisan ne termine pas les travaux ?",
    answer:
      "Envoyez d'abord une mise en demeure par courrier recommandé avec AR, en fixant un délai raisonnable (15 jours). Si l'artisan ne réagit pas, saisissez le médiateur de la consommation (ses coordonnées doivent figurer sur le devis). En dernier recours, saisissez le tribunal judiciaire. Conservez toutes les preuves (photos, échanges, devis signé).",
  },
  {
    question: "La certification RGE est-elle vraiment importante ?",
    answer:
      "Oui, la certification RGE est indispensable si vous souhaitez bénéficier des aides financières pour la rénovation énergétique : MaPrimeRénov', certificats d'économie d'énergie (CEE), éco-prêt à taux zéro, TVA réduite à 5,5 %. Sans RGE, vous payez plein tarif. Vérifiez sur france-renov.gouv.fr.",
  },
  {
    question: "Peut-on faire confiance aux avis en ligne sur les artisans ?",
    answer:
      "Les avis en ligne sont un bon indicateur, à condition de les analyser avec recul. Privilégiez les plateformes qui vérifient les avis (achat ou prestation réelle). Méfiez-vous des profils avec uniquement des 5 étoiles ou des avis très courts. Les avis détaillés, mentionnant le type de travaux et les délais, sont plus fiables.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Trouver un artisan" },
]

export default function TrouverArtisanPage() {
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
        name: "Trouver un artisan",
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
            <Search className="w-4 h-4" />
            Guide pratique
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Comment trouver un artisan de confiance en 2026"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"SIRET, décennale, RGE, devis, labels : toutes les vérifications à faire avant de confier vos travaux à un professionnel. Le guide complet pour éviter les mauvaises surprises."}
          </p>
        </section>

        {/* 1. Où chercher */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            {"Où chercher un artisan ?"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {ouChercher.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  </div>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* 2. Les vérifications indispensables */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les vérifications indispensables
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="space-y-6">
              {verificationsIndispensables.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4" />
                {"Vérifier un artisan sur ServicesArtisans"}
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Comment comparer les devis */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Comment comparer les devis
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Mentions obligatoires du devis</h3>
              </div>
              <ul className="space-y-3">
                {mentionsDevis.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Signaux d{"'"}alerte (red flags)</h3>
              </div>
              <ul className="space-y-3">
                {redFlags.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Questions à poser */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Les questions à poser avant de signer
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {questionsAvantSignature.map((question, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-blue-50">{question}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Signes artisan fiable vs arnaqueur */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Artisan fiable vs arnaqueur : les signes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-green-700" />
                </div>
                <h3 className="text-lg font-bold text-green-800">Artisan fiable</h3>
              </div>
              <ul className="space-y-3">
                {signesFiable.filter(s => s.fiable).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 text-red-700" />
                </div>
                <h3 className="text-lg font-bold text-red-800">Signaux d{"'"}arnaque</h3>
              </div>
              <ul className="space-y-3">
                {signesFiable.filter(s => !s.fiable).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Labels et certifications */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les labels et certifications à connaître
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {labels.map((label) => (
              <div key={label.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{label.name}</h3>
                </div>
                <p className="text-gray-600">{label.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Vos droits en tant que client */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-8 h-8" />
              <h2 className="text-2xl md:text-3xl font-bold font-heading">
                Vos droits en tant que client
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Droit de rétractation</h3>
                <ul className="space-y-3 text-indigo-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"14 jours de rétractation pour tout contrat signé hors établissement (à domicile, en ligne, par téléphone) — article L221-18 du Code de la consommation"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Ce délai court à compter de la signature du devis. L'artisan ne peut pas commencer les travaux avant l'expiration du délai, sauf renonciation expresse et écrite de votre part."}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Attention : pas de droit de rétractation si vous avez sollicité l'artisan et signé le devis dans ses locaux professionnels."}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Garanties légales</h3>
                <ul className="space-y-3 text-indigo-50">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Garantie de parfait achèvement : 1 an — l'artisan doit réparer tous les désordres signalés à la réception ou dans l'année qui suit"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Garantie biennale : 2 ans — couvre les équipements dissociables (chaudière, volets, robinetterie)"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>{"Garantie décennale : 10 ans — couvre les dommages compromettant la solidité ou l'habitabilité"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Que faire en cas de problème */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Que faire en cas de problème ?
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Dialogue direct</h3>
                  <p className="text-gray-600">{"Contactez l'artisan par écrit (email ou courrier) pour expliquer le problème et demander une solution. Conservez une copie de tous les échanges."}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Mise en demeure</h3>
                  <p className="text-gray-600">{"Envoyez un courrier recommandé avec AR détaillant les manquements constatés et fixant un délai de 15 jours pour y remédier. Ce courrier constitue une preuve juridique."}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Médiation</h3>
                  <p className="text-gray-600">{"Saisissez le médiateur de la consommation. Depuis 2016, tout professionnel doit mentionner un médiateur sur ses documents (devis, factures, site web). La médiation est gratuite pour le consommateur."}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Signalement à la DGCCRF</h3>
                  <p className="text-gray-600">{"En cas de pratique frauduleuse, signalez sur SignalConso (signal.conso.gouv.fr) ou contactez la DGCCRF de votre département. Pour les litiges importants, un avocat ou une association de consommateurs (UFC-Que Choisir, CLCV) peut vous accompagner."}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">5</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Action en justice</h3>
                  <p className="text-gray-600">{"En dernier recours, saisissez le tribunal judiciaire (litige > 10 000 €) ou le tribunal de proximité (litige < 10 000 €). Pour les litiges inférieurs à 5 000 €, la procédure simplifiée ne nécessite pas d'avocat."}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guides liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Guides complémentaires
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/quotes-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Les mentions obligatoires et comment bien comparer."}</p>
            </Link>
            <Link href="/guides/guarantee-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Tout comprendre sur cette protection essentielle."}</p>
            </Link>
            <Link href="/guides/eviter-arnaques-artisan" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Arnaques artisans"}</h3>
              <p className="text-sm text-gray-500">{"Comment repérer et éviter les arnaques."}</p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Questions fréquentes
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
              {"Trouvez un artisan de confiance près de chez vous"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Des milliers de professionnels référencés avec leur SIRET vérifié. Comparez les profils et demandez un devis gratuit."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Parcourir l'annuaire"}
              </Link>
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                <ShieldCheck className="w-5 h-5" />
                {"Vérifier un artisan"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
