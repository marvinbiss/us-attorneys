import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Search,
  Ban,
  Eye,
  UserX,
  CircleDollarSign,
  FileWarning,
  BadgeAlert,
  Building2,
  MessageCircle,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/eviter-arnaques-artisan`

export const metadata: Metadata = {
  title: "Arnaques Artisans : Comment les Repérer et s'en Protéger",
  description:
    "Les 10 arnaques les plus fréquentes avec les artisans du bâtiment : démarchage abusif, faux RGE, devis gonflés. Signaux d'alerte, vérifications et recours en cas de fraude.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Arnaques Artisans : Comment les Repérer et s'en Protéger",
    description:
      "Guide complet pour identifier et éviter les arnaques artisans. Signaux d'alerte, vérifications et recours.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
}

const arnaquesCourantes = [
  {
    numero: 1,
    titre: "Démarchage abusif à domicile",
    icon: Ban,
    description:
      "Un individu sonne à votre porte en prétextant être « de passage dans le quartier » ou avoir repéré un problème sur votre toiture. Il propose une intervention immédiate à prix réduit. En réalité, les travaux sont inutiles, bâclés ou surfacturés.",
    conseil:
      "Depuis la loi du 24 juillet 2020, le démarchage téléphonique en rénovation énergétique est interdit. Pour le démarchage à domicile, vous disposez de 14 jours de rétractation et aucun paiement ne peut être exigé avant 7 jours.",
  },
  {
    numero: 2,
    titre: "Devis gonflés et surfacturation",
    icon: CircleDollarSign,
    description:
      "Le devis initial est raisonnable, mais la facture finale explose : travaux supplémentaires non prévus, matériaux « de meilleure qualité » imposés sans accord, heures majorées. L'artisan profite du chantier en cours pour imposer des surcoûts.",
    conseil:
      "Exigez un devis détaillé avec prix unitaires. Tout travail supplémentaire doit faire l'objet d'un avenant écrit et signé. Sans avenant, vous n'êtes pas tenu de payer les travaux non prévus.",
  },
  {
    numero: 3,
    titre: "Faux artisans RGE",
    icon: BadgeAlert,
    description:
      "L'artisan se prétend certifié RGE pour vous faire bénéficier des aides publiques (MaPrimeRénov', CEE). En réalité, sa certification est expirée, suspendue ou n'a jamais existé. Les aides vous sont refusées après travaux.",
    conseil:
      "Vérifiez systématiquement sur france-renov.gouv.fr avant de signer. La certification RGE est nominative, limitée dans le temps et à certaines activités.",
  },
  {
    numero: 4,
    titre: "Travaux fantômes ou inachevés",
    icon: UserX,
    description:
      "L'artisan encaisse un acompte important puis disparaît, ou commence les travaux avant de les abandonner sous prétexte d'un autre chantier urgent. Le numéro de téléphone ne répond plus, l'entreprise est parfois déjà en liquidation.",
    conseil:
      "Limitez l'acompte à 30 % maximum. Prévoyez un échéancier de paiement lié à l'avancement réel. Vérifiez l'ancienneté de l'entreprise sur societe.com ou infogreffe.fr.",
  },
  {
    numero: 5,
    titre: "Malfaçons volontaires",
    icon: FileWarning,
    description:
      "Les travaux sont réalisés avec des matériaux de qualité inférieure à ceux facturés, des techniques non conformes aux règles de l'art ou des finitions bâclées. Les problèmes apparaissent quelques semaines ou mois après la fin du chantier.",
    conseil:
      "Établissez un procès-verbal de réception avec réserves. La garantie de parfait achèvement (1 an) et la garantie décennale (10 ans) vous protègent.",
  },
  {
    numero: 6,
    titre: "Entreprises éphémères",
    icon: Building2,
    description:
      "L'entreprise est créée quelques mois avant votre chantier et sera liquidée peu après. Impossible de faire jouer les garanties puisque la société n'existe plus. Ce schéma est fréquent avec les « sociétés-écran ».",
    conseil:
      "Vérifiez la date de création de l'entreprise sur le RNE (Registre National des Entreprises). Méfiez-vous des entreprises de moins de 2 ans sans références vérifiables.",
  },
  {
    numero: 7,
    titre: "Sous-traitance non déclarée",
    icon: MessageCircle,
    description:
      "L'artisan que vous avez choisi n'effectue pas les travaux lui-même. Il sous-traite à des équipes non qualifiées, sans vous en informer. La qualité des travaux en pâtit et les responsabilités deviennent floues.",
    conseil:
      "Demandez avant signature si l'artisan fait appel à des sous-traitants. Le Code civil impose que le sous-traitant soit agréé par le maître d'ouvrage (vous). En cas de sous-traitance non déclarée, la responsabilité reste celle de l'artisan principal.",
  },
  {
    numero: 8,
    titre: "Faux avis en ligne",
    icon: Eye,
    description:
      "L'artisan gonfle artificiellement sa réputation avec de faux avis positifs achetés en ligne, ou publie de faux avis négatifs sur ses concurrents. Les profils à 5 étoiles avec des avis très courts et génériques sont suspects.",
    conseil:
      "Croisez les avis sur plusieurs plateformes. Privilégiez les avis détaillés mentionnant le type de travaux, les délais et les montants. Utilisez des annuaires qui vérifient les avis.",
  },
  {
    numero: 9,
    titre: "Surfacturation en cas d'urgence",
    icon: CircleDollarSign,
    description:
      "En cas de fuite d'eau, de panne de chauffage ou de serrure bloquée, certains profitent de votre détresse pour facturer 3 à 10 fois le prix normal. Les forfaits « déplacement nuit » ou « urgence week-end » peuvent atteindre plusieurs centaines d'euros.",
    conseil:
      "Même en urgence, demandez un devis avant intervention. Les tarifs d'intervention doivent être affichés. En cas d'abus, signalez sur SignalConso. Gardez dans vos contacts un plombier et un serrurier de confiance pour éviter de chercher dans l'urgence.",
  },
  {
    numero: 10,
    titre: "Acompte excessif",
    icon: CircleDollarSign,
    description:
      "L'artisan exige 50 %, 70 % voire la totalité du montant avant même d'avoir posé un outil. Une fois l'argent encaissé, le rapport de force bascule et vous n'avez plus de levier en cas de problème.",
    conseil:
      "Ne versez jamais plus de 30 % d'acompte à la commande. Privilégiez un échéancier en 3 à 4 versements liés à l'avancement du chantier. Le solde final (10 à 20 %) ne doit être versé qu'après réception sans réserves.",
  },
]

const signauxAvantSignature = [
  "L'artisan refuse de fournir un devis écrit ou son numéro SIRET",
  "Il insiste pour signer immédiatement (« tarif valable aujourd'hui seulement »)",
  "Il n'a pas de local professionnel, pas de site web, pas de véhicule identifié",
  "Le devis est manuscrit, sans en-tête, incomplet ou illisible",
  "Il demande un paiement en espèces ou « sans facture » pour un tarif réduit",
  "L'entreprise a moins de 6 mois d'existence et aucune référence",
  "Il ne peut pas produire d'attestation d'assurance décennale en cours de validité",
  "Les avis en ligne sont exclusivement des 5 étoiles avec des textes très courts",
  "Il vous démarche à domicile sans que vous ayez sollicité quoi que ce soit",
  "Il propose un prix anormalement bas (plus de 40 % sous la moyenne du marché)",
]

const signauxPendantChantier = [
  "L'artisan change les matériaux prévus sans vous consulter",
  "Il demande des paiements supplémentaires non prévus au devis, sans avenant écrit",
  "Les travaux prennent un retard important sans explication valable",
  "L'équipe sur le chantier n'est pas celle présentée lors du devis",
  "L'artisan est injoignable ou ne répond plus à vos messages",
  "Le chantier est laissé à l'abandon pendant des jours sans prévenir",
  "Les travaux réalisés ne correspondent pas à ce qui a été convenu",
  "L'artisan exige le paiement du solde avant la fin des travaux",
]

const recours = [
  {
    titre: "DGCCRF (Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes)",
    description:
      "Signalez les pratiques frauduleuses sur SignalConso (signal.conso.gouv.fr). La DGCCRF peut mener des enquêtes, infliger des amendes et engager des poursuites pénales. Vous pouvez aussi contacter la DDPP (Direction Départementale de la Protection des Populations) de votre département.",
    action: "signal.conso.gouv.fr",
  },
  {
    titre: "Médiateur de la consommation",
    description:
      "La médiation est gratuite, rapide (90 jours maximum) et obligatoire avant toute action en justice pour les litiges de consommation. L'artisan doit mentionner son médiateur sur ses documents commerciaux. Si ce n'est pas le cas, il est en infraction (amende de 3 000 € pour un artisan individuel).",
    action: "Coordonnées sur le devis ou la facture",
  },
  {
    titre: "Tribunal judiciaire",
    description:
      "Pour les litiges supérieurs à 10 000 €, saisissez le tribunal judiciaire (avocat obligatoire). Pour les litiges inférieurs à 10 000 €, le tribunal de proximité (pas d'avocat obligatoire). La procédure simplifiée de règlement des petits litiges (< 5 000 €) est accessible en ligne sur justice.fr.",
    action: "justice.fr",
  },
  {
    titre: "Assurance protection juridique",
    description:
      "Si vous disposez d'une assurance habitation, vérifiez si elle inclut une protection juridique. Celle-ci peut prendre en charge les frais d'avocat et vous accompagner dans vos démarches. Déclarez le sinistre dès les premiers problèmes.",
    action: "Contactez votre assureur habitation",
  },
]

const organismes = [
  {
    nom: "DGCCRF / SignalConso",
    role: "Signalement des fraudes et pratiques commerciales trompeuses",
    site: "signal.conso.gouv.fr",
  },
  {
    nom: "UFC-Que Choisir",
    role: "Association de consommateurs. Conseils juridiques, accompagnement dans les litiges, actions de groupe",
    site: "quechoisir.org",
  },
  {
    nom: "CLCV",
    role: "Consommation, Logement et Cadre de Vie. Accompagnement gratuit pour les litiges liés au logement",
    site: "clcv.org",
  },
  {
    nom: "ADIL (Agence Départementale d'Information sur le Logement)",
    role: "Conseil juridique gratuit sur le logement, les travaux et les aides financières. Présente dans chaque département",
    site: "anil.org",
  },
  {
    nom: "Médiateur national de l'énergie",
    role: "Litiges liés à l'énergie (chauffage, isolation). Médiation gratuite en cas de différend avec un installateur",
    site: "energie-mediateur.fr",
  },
]

const temoignages = [
  {
    titre: "Toiture refaite... à moitié",
    description:
      "« Un homme a sonné chez nous en disant avoir vu des tuiles cassées depuis la route. Il a proposé une réparation à 3 500 €, payable immédiatement en espèces. Mon mari a accepté. L'artisan a remplacé quelques tuiles en surface mais n'a pas touché à l'étanchéité. Deux mois plus tard, infiltrations dans les combles. Impossible de le recontacter, numéro coupé. » — Marie, 67 ans, Eure",
    lecon: "Ne jamais accepter un démarchage à domicile sans vérification préalable. Toujours demander un devis écrit et vérifier le SIRET.",
  },
  {
    titre: "Isolation à 1 euro... qui coûte cher",
    description:
      "« On nous a promis une isolation des combles pour 1 € grâce aux CEE. L'artisan se disait RGE. En réalité, la laine soufflée était de mauvaise qualité, mal posée, et l'épaisseur insuffisante. Quand on a voulu faire jouer la garantie, on a découvert que sa certification RGE était expirée depuis 8 mois. Les aides ont été refusées. » — Karim et Sophie, Hauts-de-Seine",
    lecon: "Toujours vérifier la validité de la certification RGE sur france-renov.gouv.fr au moment de la signature du devis.",
  },
  {
    titre: "Le devis qui triple",
    description:
      "« Devis signé à 8 000 € pour une rénovation de salle de bain. Dès le premier jour, l'artisan a « découvert » des problèmes cachés : tuyauterie à refaire, mur porteur à renforcer. La facture finale : 22 000 €. Aucun avenant n'avait été signé pour les travaux supplémentaires. » — Isabelle, Loire-Atlantique",
    lecon: "Tout travail supplémentaire doit faire l'objet d'un avenant écrit et signé avant exécution. Sans avenant, refusez de payer les surcoûts.",
  },
]

const faqItems = [
  {
    question: "Comment signaler un artisan malhonnête ?",
    answer:
      "Signalez sur SignalConso (signal.conso.gouv.fr), la plateforme officielle de la DGCCRF. Vous pouvez aussi déposer un signalement auprès de la DDPP de votre département. En cas de préjudice financier important, portez plainte au commissariat ou à la gendarmerie.",
  },
  {
    question: "Peut-on annuler un devis signé suite à un démarchage ?",
    answer:
      "Oui, vous disposez de 14 jours de rétractation pour tout contrat signé hors établissement (à domicile, en foire, par téléphone). L'artisan ne peut exiger aucun paiement avant l'expiration d'un délai de 7 jours suivant la conclusion du contrat. Envoyez votre rétractation par courrier recommandé AR.",
  },
  {
    question: "Que faire si l'artisan a disparu avec l'acompte ?",
    answer:
      "Portez plainte pour escroquerie (article 313-1 du Code pénal). Contactez votre assurance protection juridique si vous en avez une. Si l'entreprise est en liquidation judiciaire, déclarez votre créance auprès du mandataire liquidateur dans les 2 mois suivant la publication au BODACC.",
  },
  {
    question: "Un artisan peut-il exiger un paiement en espèces ?",
    answer:
      "Depuis 2016, les paiements en espèces entre un professionnel et un particulier sont limités à 1 000 € (article D112-3 du Code monétaire et financier). Tout paiement au-delà doit se faire par chèque, virement ou carte bancaire. Un artisan qui refuse les paiements traçables est suspect.",
  },
  {
    question: "Les avis en ligne sur les artisans sont-ils fiables ?",
    answer:
      "Pas toujours. La loi pour une République numérique (2016) impose aux plateformes de préciser si les avis sont vérifiés et comment. Privilégiez les plateformes qui certifient les avis (achat vérifié). Croisez les sources : Google, annuaires spécialisés, Pages Jaunes. Les avis trop parfaits ou trop uniformes sont suspects.",
  },
  {
    question: "Quels travaux nécessitent obligatoirement un artisan qualifié ?",
    answer:
      "Les travaux touchant à la structure du bâtiment (gros œuvre), les installations électriques (norme NF C 15-100), les installations gaz (qualification PGN/PGP) et les travaux de rénovation énergétique ouvrant droit aux aides (certification RGE obligatoire). Pour la plomberie et le chauffage, pas d'obligation légale mais une qualification est fortement recommandée.",
  },
]

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Éviter les arnaques artisans" },
]

export default function EviterArnaquesArtisanPage() {
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
        name: "Éviter les arnaques artisans",
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

      <div className="min-h-screen bg-gradient-to-b from-red-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ShieldAlert className="w-4 h-4" />
            Guide protection
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Arnaques artisans : comment les repérer et s'en protéger"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Démarchage abusif, faux RGE, devis gonflés, travaux inachevés : les 10 arnaques les plus fréquentes et les réflexes pour s'en protéger."}
          </p>
        </section>

        {/* 1. Les 10 arnaques les plus fréquentes */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les 10 arnaques les plus fréquentes
          </h2>
          <div className="space-y-6">
            {arnaquesCourantes.map((arnaque) => {
              const Icon = arnaque.icon
              return (
                <div key={arnaque.numero} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-red-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {arnaque.numero}. {arnaque.titre}
                      </h3>
                      <p className="text-gray-600 mb-3">{arnaque.description}</p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                          <p className="text-green-800 text-sm font-medium">{arnaque.conseil}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 2. Signaux d'alerte avant signature */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              {"Signaux d'alerte avant signature"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {signauxAvantSignature.map((signal, index) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  <span className="text-amber-50">{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Signaux d'alerte pendant le chantier */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              {"Signaux d'alerte pendant le chantier"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {signauxPendantChantier.map((signal, index) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  <span className="text-red-50">{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Comment vérifier un artisan */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 font-heading">
              Comment vérifier un artisan
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Vérifications essentielles</h3>
                <ol className="space-y-3 text-blue-50">
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                    <span>{"SIRET : vérifiez sur sirene.fr ou annuaire-entreprises.data.gouv.fr que l'entreprise est active"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                    <span>{"Décennale : demandez l'attestation en cours de validité et contactez l'assureur si nécessaire"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                    <span>{"RGE : vérifiez sur france-renov.gouv.fr si la certification est valide et couvre les travaux prévus"}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                    <span>{"Ancienneté : consultez la date de création sur societe.com ou infogreffe.fr"}</span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Outils ServicesArtisans</h3>
                <p className="text-blue-50 mb-6">
                  {"Consultez les profils détaillés des artisans de notre annuaire : SIRET vérifié, coordonnées, avis clients. Nos données proviennent des registres officiels (SIRENE)."}
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/verifier-artisan"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    {"Vérifier un artisan"}
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {"Parcourir l'annuaire"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Recours en cas d'arnaque */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            {"Vos recours en cas d'arnaque"}
          </h2>
          <div className="space-y-4">
            {recours.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.titre}</h3>
                    <p className="text-gray-600 mb-2">{item.description}</p>
                    <p className="text-sm text-blue-600 font-medium">{item.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Organismes de protection */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            Les organismes qui vous protègent
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {organismes.map((org) => (
              <div key={org.nom} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{org.nom}</h3>
                <p className="text-gray-600 mb-2">{org.role}</p>
                <p className="text-sm text-blue-600 font-medium">{org.site}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Témoignages types */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            {"Témoignages : des cas concrets"}
          </h2>
          <div className="space-y-6">
            {temoignages.map((temoignage, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{temoignage.titre}</h3>
                <blockquote className="text-gray-600 italic mb-4 border-l-4 border-gray-200 pl-4">
                  {temoignage.description}
                </blockquote>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-blue-800 text-sm font-medium">{"La leçon : "}{temoignage.lecon}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guides liés */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Guides complémentaires
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/trouver-artisan" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Trouver un artisan de confiance"}</h3>
              <p className="text-sm text-gray-500">{"Toutes les vérifications à faire avant de signer."}</p>
            </Link>
            <Link href="/guides/devis-travaux" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Devis travaux"}</h3>
              <p className="text-sm text-gray-500">{"Les mentions obligatoires pour un devis conforme."}</p>
            </Link>
            <Link href="/guides/garantie-decennale" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Garantie décennale"}</h3>
              <p className="text-sm text-gray-500">{"Votre protection pendant 10 ans après les travaux."}</p>
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
              {"Trouvez un artisan vérifié, évitez les mauvaises surprises"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Tous les artisans de notre annuaire sont référencés via les données SIRENE officielles. Vérifiez leur SIRET et consultez leur profil en toute transparence."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verifier-artisan"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
                {"Vérifier un artisan"}
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                <Search className="w-5 h-5" />
                {"Parcourir l'annuaire"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
