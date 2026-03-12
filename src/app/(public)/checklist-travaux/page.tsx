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
  title: "Checklist Avant Travaux 2026 : 60 Points Clés",
  description:
    "Checklist complète avant de commencer vos travaux : budget, devis, autorisations, préparation chantier, suivi, réception. 60 points de contrôle essentiels.",
  alternates: {
    canonical: `${SITE_URL}/checklist-travaux`,
  },
  openGraph: {
    title: "Checklist Avant Travaux 2026 : 60 Points de Contrôle",
    description:
      "La checklist ultime pour préparer vos travaux de A à Z. Budget, artisans, chantier, réception : ne laissez rien au hasard.",
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
        text: "Définir le budget global (travaux + imprévu 10-15 %)",
        detail:
          "Prévoyez toujours une marge de 10 à 15 % pour les imprévus. Un budget de 30 000 EUR doit prévoir 3 000 à 4 500 EUR supplémentaires.",
      },
      {
        text: "Lister toutes les aides financières disponibles",
        detail:
          "MaPrimeRénov' 2026, CEE, éco-PTZ, aides locales (région, département, commune). Consultez france-renov.gouv.fr.",
      },
      {
        text: "Vérifier les autorisations d'urbanisme nécessaires",
        detail:
          "Déclaration préalable (< 20 m\u00B2), permis de construire (> 20 m\u00B2 ou > 40 m\u00B2 en zone PLU). Délai : 1 à 3 mois.",
      },
      {
        text: "Consulter le PLU de votre commune",
        detail:
          "Le Plan Local d'Urbanisme définit les règles : hauteur, emprise au sol, couleurs, matériaux, distances aux limites.",
      },
      {
        text: "Établir un planning réaliste avec les délais administratifs",
        detail:
          "Autorisations (1-3 mois) + délai de commande matériaux (2-6 semaines) + durée des travaux. Prévoyez large.",
      },
      {
        text: "Vérifier votre assurance habitation (couverture travaux)",
        detail:
          "Informez votre assureur des travaux prévus. Certaines polices excluent les dommages liés aux travaux non déclarés.",
      },
      {
        text: "Prendre des photos détaillées de l'existant",
        detail:
          "Photographiez chaque pièce, chaque mur, chaque détail avant les travaux. Ces photos servent de référence en cas de litige.",
      },
      {
        text: "Vérifier les contraintes techniques (structure, réseaux, amiante)",
        detail:
          "Diagnostic amiante obligatoire avant travaux pour les bâtiments construits avant 1997. Vérifier la structure porteuse avant tout abattement de mur.",
      },
      {
        text: "Définir vos priorités et vos non-négociables",
        detail:
          "Classez vos souhaits en 3 catégories : indispensable, souhaitable, optionnel. Cela guidera les arbitrages budgétaires.",
      },
      {
        text: "Consulter un architecte si la surface dépasse 150 m\u00B2",
        detail:
          "Le recours à un architecte est obligatoire si la surface de plancher totale après travaux dépasse 150 m\u00B2.",
      },
    ],
  },
  {
    id: "choisir-artisans",
    title: "2. Choisir ses artisans",
    description:
      "Devis, vérifications et contrat : sécuriser le choix de vos professionnels.",
    icon: Users,
    iconColor: "text-emerald-600 bg-emerald-50",
    items: [
      {
        text: "Demander minimum 3 devis détaillés pour chaque lot",
        detail:
          "Comparez les devis ligne par ligne : matériaux, main-d'œuvre, TVA, délais. Méfiez-vous du devis le moins cher.",
      },
      {
        text: "Vérifier le numéro SIRET sur societe.com ou infogreffe.fr",
        detail:
          "Un SIRET valide garantit que l'entreprise est enregistrée. Vérifiez aussi qu'elle n'est pas en liquidation judiciaire.",
      },
      {
        text: "Contrôler l'assurance décennale (attestation en cours de validité)",
        detail:
          "Exigez une copie de l'attestation d'assurance décennale datée de l'année en cours. Vérifiez que les activités déclarées couvrent vos travaux.",
      },
      {
        text: "Vérifier les qualifications et certifications (RGE, Qualibat)",
        detail:
          "Le label RGE est obligatoire pour bénéficier des aides MaPrimeRénov' et CEE. Vérifiez sur france-renov.gouv.fr.",
      },
      {
        text: "Consulter les avis clients (Google, Pages Jaunes, ServicesArtisans)",
        detail:
          "Lisez au moins 10 avis récents. Attention aux avis trop élogieux ou trop négatifs, privilégiez les avis détaillés.",
      },
      {
        text: "Demander des références et visiter des chantiers réalisés",
        detail:
          "Un bon artisan sera fier de vous montrer ses réalisations. Contactez d'anciens clients pour avoir leur retour.",
      },
      {
        text: "Signer un devis détaillé avec planning et conditions de paiement",
        detail:
          "Le devis signé vaut contrat. Il doit mentionner : descriptif précis, matériaux, prix unitaires, TVA, délai, conditions de paiement, pénalités de retard.",
      },
      {
        text: "Ne jamais verser plus de 30 % d'acompte à la signature",
        detail:
          "Échelonnez les paiements : 30 % à la commande, 30 % en cours de travaux, 30 % à l'achèvement, 10 % à la réception (solde de retenue).",
      },
      {
        text: "Vérifier les pénalités de retard prévues au contrat",
        detail:
          "Négociez des pénalités de retard (0,5 à 1 % du montant par semaine de retard) pour vous protéger. Sans clause, vous n'avez aucun levier.",
      },
      {
        text: "Conserver tous les documents (devis, contrats, factures, échanges)",
        detail:
          "Créez un dossier dédié (physique et numérique). Conservez les documents pendant 10 ans minimum (durée de la garantie décennale).",
      },
    ],
  },
  {
    id: "preparer-chantier",
    title: "3. Préparer le chantier",
    description:
      "Protection, accès et voisinage : anticiper pour éviter les mauvaises surprises.",
    icon: Sofa,
    iconColor: "text-amber-600 bg-amber-50",
    items: [
      {
        text: "Protéger les meubles et sols (bâches, cartons, films plastique)",
        detail:
          "Déplacez les meubles si possible. Sinon, regroupez-les au centre de la pièce et couvrez-les de bâches épaisses.",
      },
      {
        text: "Déplacer les objets fragiles et de valeur",
        detail:
          "Tableaux, bibelots, électronique : stockez-les dans une pièce non concernée par les travaux ou chez un proche.",
      },
      {
        text: "Prévoir l'accès chantier (stationnement, livraison matériaux)",
        detail:
          "Réservez une place de stationnement pour la camionnette de l'artisan. Prévoyez l'accès pour les livraisons volumineuses (benne, palette).",
      },
      {
        text: "Informer les voisins (bruit, poussi\u00E8re, stationnement)",
        detail:
          "Un courrier ou un mot dans la boîte aux lettres des voisins évite les conflits. Mentionnez la durée prévue et les horaires.",
      },
      {
        text: "Couper les alimentations si nécessaire (eau, électricité, gaz)",
        detail:
          "Repérer les vannes et disjoncteurs avant le début des travaux. Prévenir l'artisan si des réseaux doivent être coupés.",
      },
      {
        text: "Prévoir un point d'eau et d'électricité pour les artisans",
        detail:
          "Les artisans ont besoin d'eau (gâchage, nettoyage) et d'électricité (outillage). Prévoyez une rallonge et un accès WC.",
      },
      {
        text: "Mettre en place une zone de stockage matériaux",
        detail:
          "Définissez avec l'artisan un espace de stockage (garage, terrasse, pièce vide). Les matériaux doivent être protégés de la pluie.",
      },
      {
        text: "Organiser le quotidien (cuisine, douche, accès aux pièces)",
        detail:
          "Si la cuisine ou la salle de bains sont impactées, prévoyez des solutions alternatives : micro-ondes, douche chez un voisin, etc.",
      },
      {
        text: "Afficher les plans et le cahier des charges sur le chantier",
        detail:
          "Imprimez les plans, les références de matériaux et les spécifications. Affichez-les dans une zone visible du chantier.",
      },
      {
        text: "Prendre des photos du chantier avant le premier jour",
        detail:
          "Documentez l'état de toutes les surfaces (sols, murs, plafonds, menuiseries) pour avoir un point de référence en cas de dégradation.",
      },
    ],
  },
  {
    id: "pendant-travaux",
    title: "4. Pendant les travaux",
    description:
      "Suivi, points de contrôle et communication : rester maître de votre chantier.",
    icon: Eye,
    iconColor: "text-purple-600 bg-purple-50",
    items: [
      {
        text: "Faire des visites régulières de chantier (hebdomadaires minimum)",
        detail:
          "Même si vous faites confiance à votre artisan, visitez le chantier chaque semaine. Prenez des photos à chaque visite.",
      },
      {
        text: "Tenir un journal de chantier (dates, constats, décisions)",
        detail:
          "Notez chaque visite, chaque décision, chaque problème rencontré. Ce document a valeur de preuve en cas de litige.",
      },
      {
        text: "Vérifier la conformité des matériaux livrés (références, quantités)",
        detail:
          "Comparez les matériaux livrés avec ceux spécifiés dans le devis. Refusez tout matériau de substitution non validé par écrit.",
      },
      {
        text: "Valider chaque étape avant de passer à la suivante",
        detail:
          "Demandez à voir le travail fini à chaque étape clé : gros œuvre, électricité, plomberie, isolation, finitions. Ne validez pas si vous avez un doute.",
      },
      {
        text: "Communiquer par écrit (email, SMS) pour les décisions importantes",
        detail:
          "Les accords verbaux n'ont aucune valeur. Confirmez par email toute modification, tout choix de matériau, tout accord de prix supplémentaire.",
      },
      {
        text: "Gérer les imprévus et modifications par avenant écrit",
        detail:
          "Toute modification par rapport au devis initial doit faire l'objet d'un avenant signé par les deux parties, avec le coût supplémentaire détaillé.",
      },
      {
        text: "Vérifier le respect du planning et signaler les retards",
        detail:
          "Comparez l'avancement réel au planning prévu. En cas de retard, envoyez un courrier recommandé rappelant les pénalités prévues au contrat.",
      },
      {
        text: "S'assurer du nettoyage quotidien du chantier",
        detail:
          "Un chantier propre est un signe de professionnalisme. L'artisan doit évacuer ses déchets et nettoyer en fin de journée.",
      },
      {
        text: "Ne jamais payer d'avance des travaux non réalisés",
        detail:
          "Respectez l'échéancier de paiement prévu. Ne cédez jamais à une demande de paiement anticipé, même pour 'acheter du matériel'.",
      },
      {
        text: "Documenter les travaux cachés (avant fermeture murs, plafonds)",
        detail:
          "Photographiez les réseaux électriques, la plomberie et l'isolation AVANT la fermeture des cloisons. Ces photos valent de l'or en cas de problème futur.",
      },
    ],
  },
  {
    id: "reception-travaux",
    title: "5. Réception des travaux",
    description:
      "Procès-verbal, réserves et garanties : le moment le plus important du chantier.",
    icon: CheckCircle2,
    iconColor: "text-teal-600 bg-teal-50",
    items: [
      {
        text: "Planifier une visite de réception avec l'artisan",
        detail:
          "La réception est un acte juridique majeur. Elle marque le point de départ des garanties. Prenez votre temps, ne la bâclez pas.",
      },
      {
        text: "Inspecter chaque détail : finitions, fonctionnement, conformité",
        detail:
          "Vérifiez chaque prise, chaque interrupteur, chaque joint, chaque porte. Testez tout ce qui s'ouvre, se ferme, s'allume ou coule.",
      },
      {
        text: "Rédiger un procès-verbal (PV) de réception détaillé",
        detail:
          "Le PV doit lister tous les travaux, être daté et signé par les deux parties. Il peut être avec ou sans réserves.",
      },
      {
        text: "Émettre des réserves précises pour les défauts constatés",
        detail:
          "Soyez précis : 'rayure de 15 cm sur le parquet chambre 2' plutôt que 'défaut parquet'. Les réserves vagues sont inexploitables.",
      },
      {
        text: "Fixer un délai de levée des réserves (30 jours en général)",
        detail:
          "L'artisan dispose d'un délai raisonnable (souvent 30 jours) pour corriger les défauts signalés en réserve. Mentionnez ce délai dans le PV.",
      },
      {
        text: "Retenir 5 à 10 % du montant jusqu'à levée des réserves",
        detail:
          "La retenue de garantie (maximum 5 %) est légale et incite l'artisan à revenir corriger les réserves. Ne payez le solde qu'après correction.",
      },
      {
        text: "Conserver le PV signé par les deux parties (10 ans minimum)",
        detail:
          "Le PV de réception est le document le plus important de vos travaux. Conservez-le avec les factures et l'attestation d'assurance décennale.",
      },
      {
        text: "Exiger les notices d'utilisation et d'entretien des équipements",
        detail:
          "Chaudière, VMC, volets : l'artisan doit vous remettre les notices, les certificats de conformité et les conditions de garantie fabricant.",
      },
      {
        text: "Vérifier la conformité électrique (attestation Consuel si applicable)",
        detail:
          "Pour une installation électrique neuve ou une rénovation lourde, l'attestation Consuel est obligatoire avant la mise en service par Enedis.",
      },
      {
        text: "Connaître vos 3 garanties : parfait achèvement (1 an), biennale (2 ans), décennale (10 ans)",
        detail:
          "Garantie de parfait achèvement : 1 an (tous défauts). Biennale : 2 ans (équipements). Décennale : 10 ans (structure et étanchéité). Ces délais courent à partir de la réception.",
      },
    ],
  },
  {
    id: "apres-travaux",
    title: "6. Après les travaux",
    description:
      "Déclarations, assurances et entretien : sécuriser votre investissement sur le long terme.",
    icon: FileText,
    iconColor: "text-rose-600 bg-rose-50",
    items: [
      {
        text: "Déclarer l'achèvement des travaux en mairie (DAACT)",
        detail:
          "La Déclaration Attestant l'Achèvement et la Conformité des Travaux doit être déposée en mairie dans les 90 jours suivant la fin des travaux.",
      },
      {
        text: "Mettre à jour votre assurance habitation",
        detail:
          "Informez votre assureur de la nouvelle surface, des nouveaux équipements et de la valeur ajoutée par les travaux. Votre prime sera ajustée.",
      },
      {
        text: "Déclarer les travaux aux impôts (taxe foncière, taxe d'aménagement)",
        detail:
          "Les travaux augmentant la surface habitable doivent être déclarés (formulaire H1/H2). Votre taxe foncière sera recalculée. Exonération possible de 2 ans pour les travaux d'amélioration énergétique.",
      },
      {
        text: "Mettre à jour le DPE si les travaux impactent la performance énergétique",
        detail:
          "Isolation, changement de chauffage, fenêtres : faites refaire votre DPE pour valoriser votre investissement (obligatoire en cas de vente ou location).",
      },
      {
        text: "Constituer un dossier d'entretien (planning, contacts, notices)",
        detail:
          "Créez un carnet d'entretien : dates de maintenance, contacts des artisans, références des matériaux et équipements. Transmissible au futur acheteur.",
      },
      {
        text: "Planifier l'entretien régulier des nouveaux équipements",
        detail:
          "Chaudière (annuel), VMC (filtres tous les 6 mois), pompe à chaleur (tous les 2 ans), ramonage (1-2 fois/an). Programmez les rendez-vous à l'avance.",
      },
      {
        text: "Archiver tous les documents (factures, PV, garanties, plans)",
        detail:
          "Conservez tout pendant 10 ans minimum (durée de la garantie décennale). Scannez les documents papier pour un archivage numérique sécurisé.",
      },
      {
        text: "Laisser un avis sur l'artisan (Google, ServicesArtisans)",
        detail:
          "Votre retour d'expérience aide les autres propriétaires. Soyez factuel et précis : qualité du travail, respect des délais, propreté, communication.",
      },
      {
        text: "Vérifier les travaux après le premier hiver/été (test grandeur nature)",
        detail:
          "Les premiers mois d'utilisation révèlent les défauts cachés : infiltrations, condensation, bruit. Signalez tout problème dans le délai de garantie de parfait achèvement (1 an).",
      },
      {
        text: "Préparer un dossier technique en cas de revente future",
        detail:
          "Regroupez : factures, PV de réception, garanties, DPE, photos avant/après. Ce dossier valorise votre bien et rassure les acheteurs potentiels.",
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
      name: "Checklist complète avant travaux : les 6 étapes essentielles",
      description:
        "Guide étape par étape pour préparer, suivre et réceptionner vos travaux de rénovation ou construction. 60 points de contrôle pour ne rien oublier.",
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
                "60 points de contrôle essentiels pour préparer, suivre et réceptionner vos travaux en toute sérénité. De la définition du budget à l'entretien post-chantier, ne laissez rien au hasard."
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
                                Point de contrôle
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
                      <strong>Ne pas prévoir de marge budgétaire</strong> : 80 %
                      des chantiers dépassent le budget initial. Prévoyez 10 à 15 %
                      de marge.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">2.</span>
                    <span>
                      <strong>Choisir le devis le moins cher</strong> : le prix
                      le plus bas cache souvent des matériaux de moindre qualité ou
                      des prestations non incluses.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">3.</span>
                    <span>
                      <strong>Ne pas vérifier l'assurance décennale</strong> :
                      sans attestation valide, vous n'avez aucun recours en cas de
                      malfaçon structurelle.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">4.</span>
                    <span>
                      <strong>Payer avant la réception</strong> : ne réglez
                      jamais le solde avant d'avoir effectué une réception formelle
                      avec PV signé.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">5.</span>
                    <span>
                      <strong>Valider des modifications à l'oral</strong> : toute
                      modification doit faire l'objet d'un avenant écrit et signé.
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
                30 comparatifs détaillés pour choisir les bons matériaux et
                équipements.
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
                Recevez jusqu'à 3 devis gratuits d'artisans qualifiés près de
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
                Parcourez nos 47 catégories de services pour trouver l'artisan
                qu'il vous faut.
              </p>
            </Link>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Prêt à lancer vos travaux ?"}
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              {
                "Trouvez des artisans qualifiés et certifiés près de chez vous. Devis gratuit et sans engagement."
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
