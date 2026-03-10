import { Metadata } from "next"
import Link from "next/link"
import {
  ClipboardCheck,
  Wallet,
  Users,
  Sofa,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema, getHowToSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"

export const metadata: Metadata = {
  title: "Checklist Avant Travaux 2026 : 60 Points de Controle | ServicesArtisans",
  description:
    "Checklist complete avant de commencer vos travaux : budget, devis, autorisations, preparation chantier, suivi, reception. 60 points de controle essentiels.",
  alternates: {
    canonical: `${SITE_URL}/checklist-travaux`,
  },
  openGraph: {
    title: "Checklist Avant Travaux 2026 : 60 Points de Controle",
    description:
      "La checklist ultime pour preparer vos travaux de A a Z. Budget, artisans, chantier, reception : ne laissez rien au hasard.",
    url: `${SITE_URL}/checklist-travaux`,
    type: "website",
  },
}

interface ChecklistItem {
  text: string
  detail?: string
}

interface ChecklistSection {
  id: string
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
  items: ChecklistItem[]
}

const sections: ChecklistSection[] = [
  {
    id: "avant-de-commencer",
    title: "1. Avant de commencer",
    description:
      "Budget, planning et autorisations : les fondations de votre projet.",
    icon: Wallet,
    iconColor: "text-blue-600 bg-blue-50",
    items: [
      {
        text: "Definir le budget global (travaux + imprevu 10-15 %)",
        detail:
          "Prevoyez toujours une marge de 10 a 15 % pour les imprevu. Un budget de 30 000 EUR doit prevoir 3 000 a 4 500 EUR supplementaires.",
      },
      {
        text: "Lister toutes les aides financieres disponibles",
        detail:
          "MaPrimeRenov' 2026, CEE, eco-PTZ, aides locales (region, departement, commune). Consultez france-renov.gouv.fr.",
      },
      {
        text: "Verifier les autorisations d'urbanisme necessaires",
        detail:
          "Declaration prealable (< 20 m\u00B2), permis de construire (> 20 m\u00B2 ou > 40 m\u00B2 en zone PLU). Delai : 1 a 3 mois.",
      },
      {
        text: "Consulter le PLU de votre commune",
        detail:
          "Le Plan Local d'Urbanisme definit les regles : hauteur, emprise au sol, couleurs, materiaux, distances aux limites.",
      },
      {
        text: "Etablir un planning realiste avec les delais administratifs",
        detail:
          "Autorisations (1-3 mois) + delai de commande materiaux (2-6 semaines) + duree des travaux. Prevoyez large.",
      },
      {
        text: "Verifier votre assurance habitation (couverture travaux)",
        detail:
          "Informez votre assureur des travaux prevus. Certaines polices excluent les dommages lies aux travaux non declares.",
      },
      {
        text: "Prendre des photos detaillees de l'existant",
        detail:
          "Photographiez chaque piece, chaque mur, chaque detail avant les travaux. Ces photos servent de reference en cas de litige.",
      },
      {
        text: "Verifier les contraintes techniques (structure, reseaux, amiante)",
        detail:
          "Diagnostic amiante obligatoire avant travaux pour les batiments construits avant 1997. Verifier la structure porteuse avant tout abattement de mur.",
      },
      {
        text: "Definir vos priorites et vos non-negociables",
        detail:
          "Classez vos souhaits en 3 categories : indispensable, souhaitable, optionnel. Cela guidera les arbitrages budgetaires.",
      },
      {
        text: "Consulter un architecte si la surface depasse 150 m\u00B2",
        detail:
          "Le recours a un architecte est obligatoire si la surface de plancher totale apres travaux depasse 150 m\u00B2.",
      },
    ],
  },
  {
    id: "choisir-artisans",
    title: "2. Choisir ses artisans",
    description:
      "Devis, verifications et contrat : securiser le choix de vos professionnels.",
    icon: Users,
    iconColor: "text-emerald-600 bg-emerald-50",
    items: [
      {
        text: "Demander minimum 3 devis detailles pour chaque lot",
        detail:
          "Comparez les devis ligne par ligne : materiaux, main-d'oeuvre, TVA, delais. Mefiez-vous du devis le moins cher.",
      },
      {
        text: "Verifier le numero SIRET sur societe.com ou infogreffe.fr",
        detail:
          "Un SIRET valide garantit que l'entreprise est enregistree. Verifiez aussi qu'elle n'est pas en liquidation judiciaire.",
      },
      {
        text: "Controler l'assurance decennale (attestation en cours de validite)",
        detail:
          "Exigez une copie de l'attestation d'assurance decennale datee de l'annee en cours. Verifiez que les activites declarees couvrent vos travaux.",
      },
      {
        text: "Verifier les qualifications et certifications (RGE, Qualibat)",
        detail:
          "Le label RGE est obligatoire pour beneficier des aides MaPrimeRenov' et CEE. Verifiez sur france-renov.gouv.fr.",
      },
      {
        text: "Consulter les avis clients (Google, Pages Jaunes, ServicesArtisans)",
        detail:
          "Lisez au moins 10 avis recents. Attention aux avis trop elogieux ou trop negatifs, privilegiez les avis detailles.",
      },
      {
        text: "Demander des references et visiter des chantiers realises",
        detail:
          "Un bon artisan sera fier de vous montrer ses realisations. Contactez d'anciens clients pour avoir leur retour.",
      },
      {
        text: "Signer un devis detaille avec planning et conditions de paiement",
        detail:
          "Le devis signe vaut contrat. Il doit mentionner : descriptif precis, materiaux, prix unitaires, TVA, delai, conditions de paiement, penalites de retard.",
      },
      {
        text: "Ne jamais verser plus de 30 % d'acompte a la signature",
        detail:
          "Echelonnez les paiements : 30 % a la commande, 30 % en cours de travaux, 30 % a l'achevement, 10 % a la reception (solde de retenue).",
      },
      {
        text: "Verifier les penalites de retard prevues au contrat",
        detail:
          "Negociez des penalites de retard (0,5 a 1 % du montant par semaine de retard) pour vous proteger. Sans clause, vous n'avez aucun levier.",
      },
      {
        text: "Conserver tous les documents (devis, contrats, factures, echanges)",
        detail:
          "Creez un dossier dedie (physique et numerique). Conservez les documents pendant 10 ans minimum (duree de la garantie decennale).",
      },
    ],
  },
  {
    id: "preparer-chantier",
    title: "3. Preparer le chantier",
    description:
      "Protection, acces et voisinage : anticiper pour eviter les mauvaises surprises.",
    icon: Sofa,
    iconColor: "text-amber-600 bg-amber-50",
    items: [
      {
        text: "Proteger les meubles et sols (baches, cartons, films plastique)",
        detail:
          "Deplacez les meubles si possible. Sinon, regroupez-les au centre de la piece et couvrez-les de baches epaisses.",
      },
      {
        text: "Deplacer les objets fragiles et de valeur",
        detail:
          "Tableaux, bibelots, electronique : stockez-les dans une piece non concernee par les travaux ou chez un proche.",
      },
      {
        text: "Prevoir l'acces chantier (stationnement, livraison materiaux)",
        detail:
          "Reservez une place de stationnement pour la camionnette de l'artisan. Prevoyez l'acces pour les livraisons volumineuses (benne, palette).",
      },
      {
        text: "Informer les voisins (bruit, poussi\u00E8re, stationnement)",
        detail:
          "Un courrier ou un mot dans la boite aux lettres des voisins evite les conflits. Mentionnez la duree prevue et les horaires.",
      },
      {
        text: "Couper les alimentations si necessaire (eau, electricite, gaz)",
        detail:
          "Reperer les vannes et disjoncteurs avant le debut des travaux. Prevenir l'artisan si des reseaux doivent etre coupes.",
      },
      {
        text: "Prevoir un point d'eau et d'electricite pour les artisans",
        detail:
          "Les artisans ont besoin d'eau (gachage, nettoyage) et d'electricite (outillage). Prevoyez une rallonge et un acces WC.",
      },
      {
        text: "Mettre en place une zone de stockage materiaux",
        detail:
          "Definissez avec l'artisan un espace de stockage (garage, terrasse, piece vide). Les materiaux doivent etre proteges de la pluie.",
      },
      {
        text: "Organiser le quotidien (cuisine, douche, acces aux pieces)",
        detail:
          "Si la cuisine ou la salle de bains sont impactees, prevoyez des solutions alternatives : micro-ondes, douche chez un voisin, etc.",
      },
      {
        text: "Afficher les plans et le cahier des charges sur le chantier",
        detail:
          "Imprimez les plans, les references de materiaux et les specifications. Affichez-les dans une zone visible du chantier.",
      },
      {
        text: "Prendre des photos du chantier avant le premier jour",
        detail:
          "Documentez l'etat de toutes les surfaces (sols, murs, plafonds, menuiseries) pour avoir un point de reference en cas de degradation.",
      },
    ],
  },
  {
    id: "pendant-travaux",
    title: "4. Pendant les travaux",
    description:
      "Suivi, points de controle et communication : rester maitre de votre chantier.",
    icon: Eye,
    iconColor: "text-purple-600 bg-purple-50",
    items: [
      {
        text: "Faire des visites regulieres de chantier (hebdomadaires minimum)",
        detail:
          "Meme si vous faites confiance a votre artisan, visitez le chantier chaque semaine. Prenez des photos a chaque visite.",
      },
      {
        text: "Tenir un journal de chantier (dates, constats, decisions)",
        detail:
          "Notez chaque visite, chaque decision, chaque probleme rencontre. Ce document a valeur de preuve en cas de litige.",
      },
      {
        text: "Verifier la conformite des materiaux livres (references, quantites)",
        detail:
          "Comparez les materiaux livres avec ceux specifies dans le devis. Refusez tout materiau de substitution non valide par ecrit.",
      },
      {
        text: "Valider chaque etape avant de passer a la suivante",
        detail:
          "Demandez a voir le travail fini a chaque etape cle : gros oeuvre, electricite, plomberie, isolation, finitions. Ne validez pas si vous avez un doute.",
      },
      {
        text: "Communiquer par ecrit (email, SMS) pour les decisions importantes",
        detail:
          "Les accords verbaux n'ont aucune valeur. Confirmez par email toute modification, tout choix de materiau, tout accord de prix supplementaire.",
      },
      {
        text: "Gerer les imprevu et modifications par avenant ecrit",
        detail:
          "Toute modification par rapport au devis initial doit faire l'objet d'un avenant signe par les deux parties, avec le cout supplementaire detaille.",
      },
      {
        text: "Verifier le respect du planning et signaler les retards",
        detail:
          "Comparez l'avancement reel au planning prevu. En cas de retard, envoyez un courrier recommande rappelant les penalites prevues au contrat.",
      },
      {
        text: "S'assurer du nettoyage quotidien du chantier",
        detail:
          "Un chantier propre est un signe de professionnalisme. L'artisan doit evacuer ses dechets et nettoyer en fin de journee.",
      },
      {
        text: "Ne jamais payer d'avance des travaux non realises",
        detail:
          "Respectez l'echeancier de paiement prevu. Ne cedez jamais a une demande de paiement anticipe, meme pour 'acheter du materiel'.",
      },
      {
        text: "Documenter les travaux caches (avant fermeture murs, plafonds)",
        detail:
          "Photographiez les reseaux electriques, la plomberie et l'isolation AVANT la fermeture des cloisons. Ces photos valent de l'or en cas de probleme futur.",
      },
    ],
  },
  {
    id: "reception-travaux",
    title: "5. Reception des travaux",
    description:
      "Proces-verbal, reserves et garanties : le moment le plus important du chantier.",
    icon: CheckCircle2,
    iconColor: "text-teal-600 bg-teal-50",
    items: [
      {
        text: "Planifier une visite de reception avec l'artisan",
        detail:
          "La reception est un acte juridique majeur. Elle marque le point de depart des garanties. Prenez votre temps, ne la baclez pas.",
      },
      {
        text: "Inspecter chaque detail : finitions, fonctionnement, conformite",
        detail:
          "Verifiez chaque prise, chaque interrupteur, chaque joint, chaque porte. Testez tout ce qui s'ouvre, se ferme, s'allume ou coule.",
      },
      {
        text: "Rediger un proces-verbal (PV) de reception detaille",
        detail:
          "Le PV doit lister tous les travaux, etre date et signe par les deux parties. Il peut etre avec ou sans reserves.",
      },
      {
        text: "Emettre des reserves precises pour les defauts constates",
        detail:
          "Soyez precis : 'rayure de 15 cm sur le parquet chambre 2' plutot que 'defaut parquet'. Les reserves vagues sont inexploitables.",
      },
      {
        text: "Fixer un delai de levee des reserves (30 jours en general)",
        detail:
          "L'artisan dispose d'un delai raisonnable (souvent 30 jours) pour corriger les defauts signales en reserve. Mentionnez ce delai dans le PV.",
      },
      {
        text: "Retenir 5 a 10 % du montant jusqu'a levee des reserves",
        detail:
          "La retenue de garantie (maximum 5 %) est legale et incite l'artisan a revenir corriger les reserves. Ne payez le solde qu'apres correction.",
      },
      {
        text: "Conserver le PV signe par les deux parties (10 ans minimum)",
        detail:
          "Le PV de reception est le document le plus important de vos travaux. Conservez-le avec les factures et l'attestation d'assurance decennale.",
      },
      {
        text: "Exiger les notices d'utilisation et d'entretien des equipements",
        detail:
          "Chaudiere, VMC, volets : l'artisan doit vous remettre les notices, les certificats de conformite et les conditions de garantie fabricant.",
      },
      {
        text: "Verifier la conformite electrique (attestation Consuel si applicable)",
        detail:
          "Pour une installation electrique neuve ou une renovation lourde, l'attestation Consuel est obligatoire avant la mise en service par Enedis.",
      },
      {
        text: "Connaitre vos 3 garanties : parfait achevement (1 an), biennale (2 ans), decennale (10 ans)",
        detail:
          "Garantie de parfait achevement : 1 an (tous defauts). Biennale : 2 ans (equipements). Decennale : 10 ans (structure et etancheite). Ces delais courent a partir de la reception.",
      },
    ],
  },
  {
    id: "apres-travaux",
    title: "6. Apres les travaux",
    description:
      "Declarations, assurances et entretien : securiser votre investissement sur le long terme.",
    icon: FileText,
    iconColor: "text-rose-600 bg-rose-50",
    items: [
      {
        text: "Declarer l'achevement des travaux en mairie (DAACT)",
        detail:
          "La Declaration Attestant l'Achevement et la Conformite des Travaux doit etre deposee en mairie dans les 90 jours suivant la fin des travaux.",
      },
      {
        text: "Mettre a jour votre assurance habitation",
        detail:
          "Informez votre assureur de la nouvelle surface, des nouveaux equipements et de la valeur ajoutee par les travaux. Votre prime sera ajustee.",
      },
      {
        text: "Declarer les travaux aux impots (taxe fonciere, taxe d'amenagement)",
        detail:
          "Les travaux augmentant la surface habitable doivent etre declares (formulaire H1/H2). Votre taxe fonciere sera recalculee. Exoneration possible de 2 ans pour les travaux d'amelioration energetique.",
      },
      {
        text: "Mettre a jour le DPE si les travaux impactent la performance energetique",
        detail:
          "Isolation, changement de chauffage, fenetres : faites refaire votre DPE pour valoriser votre investissement (obligatoire en cas de vente ou location).",
      },
      {
        text: "Constituer un dossier d'entretien (planning, contacts, notices)",
        detail:
          "Creez un carnet d'entretien : dates de maintenance, contacts des artisans, references des materiaux et equipements. Transmissible au futur acheteur.",
      },
      {
        text: "Planifier l'entretien regulier des nouveaux equipements",
        detail:
          "Chaudiere (annuel), VMC (filtres tous les 6 mois), pompe a chaleur (tous les 2 ans), ramonage (1-2 fois/an). Programmez les rendez-vous a l'avance.",
      },
      {
        text: "Archiver tous les documents (factures, PV, garanties, plans)",
        detail:
          "Conservez tout pendant 10 ans minimum (duree de la garantie decennale). Scannez les documents papier pour un archivage numerique securise.",
      },
      {
        text: "Laisser un avis sur l'artisan (Google, ServicesArtisans)",
        detail:
          "Votre retour d'experience aide les autres proprietaires. Soyez factuel et precis : qualite du travail, respect des delais, proprete, communication.",
      },
      {
        text: "Verifier les travaux apres le premier hiver/ete (test grandeur nature)",
        detail:
          "Les premiers mois d'utilisation revelent les defauts caches : infiltrations, condensation, bruit. Signalez tout probleme dans le delai de garantie de parfait achevement (1 an).",
      },
      {
        text: "Preparer un dossier technique en cas de revente future",
        detail:
          "Regroupez : factures, PV de reception, garanties, DPE, photos avant/apres. Ce dossier valorise votre bien et rassure les acheteurs potentiels.",
      },
    ],
  },
]

export default function ChecklistTravauxPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: "Checklist travaux", url: "/checklist-travaux" },
  ])

  const howToSchema = getHowToSchema(
    sections.map((section) => ({
      name: section.title,
      text: section.description,
    })),
    {
      name: "Checklist complete avant travaux : les 6 etapes essentielles",
      description:
        "Guide etape par etape pour preparer, suivre et receptionner vos travaux de renovation ou construction. 60 points de controle pour ne rien oublier.",
    }
  )

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={howToSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb
              items={[{ label: "Checklist travaux" }]}
            />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-indigo-50 to-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardCheck className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading">
                Checklist avant travaux
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mb-6">
              {
                "60 points de controle essentiels pour preparer, suivre et receptionner vos travaux en toute serenite. De la definition du budget a l'entretien post-chantier, ne laissez rien au hasard."
              }
            </p>
            <div className="flex flex-wrap gap-3">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  <section.icon className="w-4 h-4" />
                  {section.title.replace(/^\d+\.\s/, "")}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Checklist sections */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-20"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${section.iconColor}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 font-heading">
                        {section.title}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className="px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center">
                              <span className="sr-only">
                                Point de controle
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.text}
                            </p>
                            {item.detail && (
                              <p className="text-sm text-gray-500 mt-1">
                                {item.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          {/* Tips section */}
          <div className="mt-16 bg-amber-50 border border-amber-200 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-heading">
                  Les erreurs les plus courantes
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">1.</span>
                    <span>
                      <strong>Ne pas prevoir de marge budgetaire</strong> : 80 %
                      des chantiers depassent le budget initial. Prevoyez 10 a 15 %
                      de marge.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">2.</span>
                    <span>
                      <strong>Choisir le devis le moins cher</strong> : le prix
                      le plus bas cache souvent des materiaux de moindre qualite ou
                      des prestations non incluses.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">3.</span>
                    <span>
                      <strong>Ne pas verifier l'assurance decennale</strong> :
                      sans attestation valide, vous n'avez aucun recours en cas de
                      malfacon structurelle.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">4.</span>
                    <span>
                      <strong>Payer avant la reception</strong> : ne reglez
                      jamais le solde avant d'avoir effectue une reception formelle
                      avec PV signe.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">5.</span>
                    <span>
                      <strong>Valider des modifications a l'oral</strong> : toute
                      modification doit faire l'objet d'un avenant ecrit et signe.
                      Les accords verbaux n'ont aucune valeur juridique.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cross-links */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/comparaison"
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                Comparatifs travaux
              </h3>
              <p className="text-sm text-gray-600">
                30 comparatifs detailles pour choisir les bons materiaux et
                equipements.
              </p>
            </Link>
            <Link
              href="/devis"
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                Demander un devis
              </h3>
              <p className="text-sm text-gray-600">
                Recevez jusqu'a 3 devis gratuits d'artisans qualifies pres de
                chez vous.
              </p>
            </Link>
            <Link
              href="/services"
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                Tous les services
              </h3>
              <p className="text-sm text-gray-600">
                Parcourez nos 47 categories de services pour trouver l'artisan
                qu'il vous faut.
              </p>
            </Link>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Pret a lancer vos travaux ?"}
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              {
                "Trouvez des artisans qualifies et certifies pres de chez vous. Devis gratuit et sans engagement."
              }
            </p>
            <Link
              href="/devis"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
            >
              Demander un devis gratuit
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
