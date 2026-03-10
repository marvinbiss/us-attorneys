/**
 * Données des questions fréquentes pour les pages /questions/
 * 40 questions avec réponses optimisées pour les featured snippets Google.
 */

export type QuestionCategory = "prix" | "choix" | "urgence" | "reglementation" | "diy"

export interface Question {
  slug: string
  question: string
  shortAnswer: string
  detailedAnswer: string[]
  category: QuestionCategory
  relatedService: string
  tags: string[]
  relatedQuestions?: string[]
}

export const categoryLabels: Record<QuestionCategory, string> = {
  prix: "Prix et tarifs",
  choix: "Choisir un artisan",
  urgence: "Urgences",
  reglementation: "Réglementation",
  diy: "Faire soi-même",
}

export const questions: Question[] = [
  // ============================================================
  // PRIX (12 questions)
  // ============================================================
  {
    slug: "combien-coute-plombier",
    question: "Combien coûte un plombier ?",
    shortAnswer: "Un plombier coûte en moyenne 40 à 70 € de l'heure. Une intervention simple (robinet, joint) revient à 80-200 €, une urgence (fuite, dégât des eaux) coûte 150 à 400 € avec majorations le soir et le week-end.",
    detailedAnswer: [
      "Le tarif horaire d'un plombier se situe entre 40 et 70 € HT en moyenne, mais varie selon la région, l'expérience du professionnel et le type d'intervention. En Île-de-France, comptez 20 à 30 % de plus qu'en province.",
      "Pour les interventions courantes : le changement d'un robinet coûte 80 à 200 €, le débouchage d'une canalisation 100 à 300 €, et la réparation d'une fuite 90 à 250 €. Ces prix incluent généralement le déplacement mais pas les fournitures.",
      "En cas d'urgence (nuit, week-end, jour férié), les majorations vont de 50 à 100 % du tarif normal. Exigez toujours un devis écrit avant intervention, même en urgence. Comparez au moins 3 devis pour les travaux planifiés.",
      "La TVA applicable est de 10 % pour les travaux de rénovation dans un logement de plus de 2 ans, et de 20 % pour les constructions neuves. Pensez à demander si le devis est HT ou TTC avant de comparer."
    ],
    category: "prix",
    relatedService: "plombier",
    tags: ["plombier", "tarif", "prix", "devis"],
  },
  {
    slug: "prix-renovation-salle-de-bain",
    question: "Quel est le prix d'une rénovation de salle de bain ?",
    shortAnswer: "Une rénovation de salle de bain coûte entre 3 000 et 15 000 € selon la surface et les prestations. Pour une rénovation complète (plomberie, carrelage, sanitaires), comptez 800 à 1 500 € par m².",
    detailedAnswer: [
      "Le budget dépend de l'ampleur des travaux. Un simple rafraîchissement (peinture, robinetterie) coûte 1 500 à 3 000 €. Une rénovation partielle (remplacement douche ou baignoire, nouveau carrelage) revient à 3 000 à 8 000 €.",
      "Pour une rénovation complète incluant la plomberie, l'électricité, le carrelage sol et murs, les sanitaires et le mobilier, prévoyez 8 000 à 15 000 € pour une salle de bain de 5 à 8 m². Le poste le plus coûteux est souvent la plomberie.",
      "Les équipements représentent 40 à 60 % du budget total. Une douche à l'italienne coûte 1 200 à 3 500 € posée, une baignoire balnéo 2 000 à 5 000 €. Privilégiez des marques milieu de gamme pour un bon rapport qualité-prix.",
      "Faites intervenir un plombier et un carreleur qualifiés. Demandez des devis détaillés poste par poste. La TVA est à 10 % si le logement a plus de 2 ans. Certains travaux ouvrent droit à MaPrimeRénov' (douche PMR notamment)."
    ],
    category: "prix",
    relatedService: "plombier",
    tags: ["salle de bain", "rénovation", "prix", "carrelage", "plomberie"],
  },
  {
    slug: "tarif-electricien-au-m2",
    question: "Quel est le tarif d'un électricien au m² ?",
    shortAnswer: "Le tarif d'un électricien est de 80 à 120 € par m² pour une installation neuve complète, et de 50 à 80 € par m² pour une rénovation partielle. Le taux horaire moyen se situe entre 40 et 60 € HT.",
    detailedAnswer: [
      "Pour une installation électrique complète dans du neuf, comptez 80 à 120 € par m². Ce prix inclut le tableau électrique, les prises, les interrupteurs, l'éclairage et le câblage conforme à la norme NF C 15-100.",
      "En rénovation, le tarif descend à 50 à 80 € par m² si le réseau existant est partiellement réutilisable. Une mise en conformité du tableau électrique seul coûte 800 à 2 000 €. Le remplacement complet du câblage dans un logement ancien peut atteindre 100 à 150 € par m².",
      "Le taux horaire d'un électricien varie de 40 à 60 € HT. Les interventions ponctuelles (ajout d'une prise, remplacement d'un interrupteur) coûtent 80 à 200 € tout compris. La pose d'un tableau domotique coûte 1 500 à 4 000 €.",
      "Choisissez un électricien certifié Qualifelec ou disposant d'une habilitation électrique à jour. Pour les gros chantiers, demandez une attestation de conformité Consuel en fin de travaux, obligatoire pour le raccordement Enedis."
    ],
    category: "prix",
    relatedService: "electricien",
    tags: ["électricien", "tarif", "prix au m²", "installation électrique"],
  },
  {
    slug: "cout-installation-chaudiere",
    question: "Combien coûte l'installation d'une chaudière ?",
    shortAnswer: "L'installation d'une chaudière coûte entre 3 000 et 12 000 € selon le type. Une chaudière gaz à condensation revient à 3 000-6 000 € posée, une pompe à chaleur air-eau à 8 000-15 000 €. Des aides peuvent couvrir 30 à 50 % du coût.",
    detailedAnswer: [
      "Le prix d'une chaudière dépend du type de combustible et de la technologie. Une chaudière gaz à condensation coûte 2 500 à 5 000 € hors pose, et 3 000 à 7 000 € installée. C'est le choix le plus courant en remplacement d'une ancienne chaudière gaz.",
      "Les pompes à chaleur air-eau, plus écologiques, coûtent 8 000 à 15 000 € tout compris. Elles permettent de réduire la facture de chauffage de 40 à 60 %. Les chaudières à granulés de bois reviennent à 10 000 à 20 000 € posées.",
      "MaPrimeRénov' peut financer 2 000 à 5 000 € selon vos revenus et le type d'équipement. Les Certificats d'Économies d'Énergie (CEE) apportent 500 à 2 500 € supplémentaires. Cumulées, ces aides couvrent souvent 30 à 50 % du coût total.",
      "Faites appel à un chauffagiste certifié RGE : c'est obligatoire pour bénéficier des aides. Prévoyez aussi l'entretien annuel obligatoire (120 à 200 €) pour maintenir la garantie constructeur."
    ],
    category: "prix",
    relatedService: "chauffagiste",
    tags: ["chaudière", "installation", "prix", "chauffagiste", "aides"],
  },
  {
    slug: "prix-peinture-appartement",
    question: "Quel est le prix pour peindre un appartement ?",
    shortAnswer: "Peindre un appartement coûte en moyenne 20 à 40 € par m² de surface murale (murs + plafonds). Pour un appartement de 60 m² au sol, comptez 3 000 à 6 000 € tout compris avec un peintre professionnel.",
    detailedAnswer: [
      "Le prix de la peinture par un professionnel se calcule en m² de surface à peindre (murs + plafonds), pas en m² au sol. Pour un appartement de 60 m² au sol, la surface murale est d'environ 150 à 200 m². Le tarif moyen est de 20 à 40 € par m².",
      "Ce prix inclut la préparation des supports (lessivage, ponçage, rebouchage des fissures), la sous-couche et deux couches de peinture. Les prix varient selon la qualité : entrée de gamme (15-20 €/m²), milieu de gamme (25-35 €/m²), haut de gamme (35-50 €/m²).",
      "Les plafonds sont plus chers à peindre (+5 à 10 €/m²) en raison de la difficulté. Les travaux de préparation lourds (décapage de papier peint, enduit sur murs abîmés) entraînent un surcoût de 5 à 15 €/m².",
      "Demandez au peintre s'il fournit la peinture ou si vous devez l'acheter séparément. Choisir une peinture de qualité (Tollens, Sikkens, Zolpan) assure un meilleur rendu et une meilleure tenue dans le temps. La TVA est de 10 % si le logement a plus de 2 ans."
    ],
    category: "prix",
    relatedService: "peintre",
    tags: ["peinture", "appartement", "prix", "peintre"],
  },
  {
    slug: "tarif-serrurier-urgence",
    question: "Quel est le tarif d'un serrurier en urgence ?",
    shortAnswer: "Un serrurier en urgence coûte entre 100 et 350 € en journée, et 200 à 500 € la nuit ou le week-end. L'ouverture d'une porte claquée revient à 80-150 €, un changement de serrure coûte 150 à 450 € selon le modèle.",
    detailedAnswer: [
      "Le tarif d'un serrurier en urgence comprend le déplacement (30 à 50 €), la main-d'œuvre et éventuellement les fournitures. Une ouverture de porte claquée (sans casse) coûte 80 à 150 € en journée. Si la serrure doit être forcée, le prix monte à 150 à 300 €.",
      "Les majorations en urgence sont conséquentes : +50 % le soir (après 19h), +75 à 100 % la nuit (après 22h), +50 % le week-end et +100 % les jours fériés. Un serrurier peut donc facturer 300 à 500 € pour une intervention de nuit.",
      "Méfiez-vous des arnaques courantes : tarifs annoncés très bas par téléphone puis facture gonflée sur place, remplacement de serrure non nécessaire, faux devis oraux. Exigez toujours un devis écrit et signé avant le début de l'intervention.",
      "Vérifiez le numéro SIRET du serrurier sur societe.com et lisez les avis en ligne. Privilégiez les serruriers recommandés par votre assurance habitation ou votre syndic de copropriété."
    ],
    category: "prix",
    relatedService: "serrurier",
    tags: ["serrurier", "urgence", "tarif", "porte claquée"],
  },
  {
    slug: "cout-refaire-toiture",
    question: "Combien coûte la réfection d'une toiture ?",
    shortAnswer: "Refaire une toiture coûte entre 100 et 250 € par m² selon le matériau (tuiles, ardoise, zinc). Pour une maison de 100 m² de toiture, le budget total se situe entre 10 000 et 25 000 € tout compris.",
    detailedAnswer: [
      "Le prix varie selon le matériau de couverture. Les tuiles en terre cuite coûtent 40 à 60 €/m² posées, les tuiles béton 30 à 50 €/m², l'ardoise naturelle 80 à 150 €/m² et le zinc 60 à 120 €/m². Ajoutez 30 à 50 €/m² pour la charpente si nécessaire.",
      "Le coût total inclut la dépose de l'ancienne couverture (10 à 20 €/m²), l'écran sous-toiture (5 à 15 €/m²), les éléments de zinguerie (gouttières, faîtage) et l'échafaudage (15 à 25 €/m² de façade).",
      "L'isolation de la toiture par l'extérieur (sarking) ajoute 100 à 200 €/m² mais permet de bénéficier d'aides financières (MaPrimeRénov', CEE). C'est l'occasion idéale d'isoler puisque la toiture est ouverte.",
      "Faites appel à un couvreur qualifié (certification Qualibat). Vérifiez sa garantie décennale, obligatoire pour les travaux de toiture. Un permis de construire n'est pas nécessaire sauf si vous changez de matériau ou modifiez la pente."
    ],
    category: "prix",
    relatedService: "couvreur",
    tags: ["toiture", "couvreur", "réfection", "prix", "tuiles"],
  },
  {
    slug: "prix-pose-carrelage-m2",
    question: "Quel est le prix de la pose de carrelage au m² ?",
    shortAnswer: "La pose de carrelage coûte entre 30 et 70 € par m² pour la main-d'œuvre seule, hors fourniture. Le carrelage varie de 15 à 100 €/m². Au total, comptez 50 à 150 €/m² pose et fourniture comprises.",
    detailedAnswer: [
      "Le tarif de pose dépend du format, du type de pose et de la complexité. La pose droite de carreaux standard (30x30 ou 45x45) coûte 30 à 45 €/m². La pose diagonale ou en chevrons ajoute 10 à 15 €/m². Les grands formats (60x60 et plus) coûtent 40 à 70 €/m².",
      "Le prix du carrelage varie fortement : grès cérame basique à 15-25 €/m², imitation bois ou pierre à 25-50 €/m², carreaux de ciment à 60-100 €/m², mosaïque à 50-120 €/m². Prévoyez 10 % de surface supplémentaire pour les coupes.",
      "Les travaux préparatoires (ragréage, dépose ancien carrelage) ajoutent 10 à 25 €/m². La pose murale est plus chère que la pose au sol (+10 à 20 €/m²). Les fournitures annexes (colle, joints, croisillons) représentent 5 à 10 €/m² supplémentaires.",
      "Exigez un carreleur expérimenté pour les grands formats et la pose sans joint apparent. Vérifiez sa garantie décennale. La TVA est de 10 % en rénovation (logement de plus de 2 ans). Un bon carreleur pose 8 à 12 m² par jour."
    ],
    category: "prix",
    relatedService: "carreleur",
    tags: ["carrelage", "pose", "prix au m²", "carreleur"],
  },
  {
    slug: "tarif-menuisier-sur-mesure",
    question: "Quel est le tarif d'un menuisier pour du sur-mesure ?",
    shortAnswer: "Un menuisier sur mesure facture 40 à 70 € de l'heure. Un meuble sur mesure coûte 500 à 5 000 € selon la taille et le matériau. Un dressing sur mesure revient à 1 500 à 6 000 €, une bibliothèque encastrée à 1 000 à 4 000 €.",
    detailedAnswer: [
      "Le taux horaire d'un menuisier varie de 40 à 70 € HT selon sa spécialité et sa région. Un ébéniste ou menuisier-agenceur spécialisé peut facturer jusqu'à 80-100 €/h. Le sur-mesure implique conception, fabrication en atelier et pose sur site.",
      "Réalisations courantes : un placard sur mesure (1 200 à 3 500 €), un dressing (1 500 à 6 000 €), une bibliothèque murale (1 000 à 4 000 €), un plan de travail en bois massif (300 à 1 200 €). Le bois massif coûte 30 à 50 % de plus que le MDF ou le mélaminé.",
      "La menuiserie extérieure a des tarifs différents : une fenêtre bois double vitrage coûte 300 à 800 € posée, une porte d'entrée sur mesure 1 000 à 3 500 €, des volets battants en bois 200 à 600 € par fenêtre.",
      "Pour du mobilier sur mesure, demandez un plan coté et un devis détaillant les matériaux, les quincailleries et les finitions. Un bon menuisier propose un rendez-vous de prise de cotes gratuit. Vérifiez ses réalisations précédentes."
    ],
    category: "prix",
    relatedService: "menuisier",
    tags: ["menuisier", "sur-mesure", "tarif", "meuble"],
  },
  {
    slug: "cout-isolation-combles",
    question: "Combien coûte l'isolation des combles ?",
    shortAnswer: "L'isolation des combles coûte 20 à 50 € par m² pour des combles perdus (soufflage) et 40 à 80 € par m² pour des combles aménagés. Les aides MaPrimeRénov' et CEE peuvent couvrir 50 à 90 % du coût.",
    detailedAnswer: [
      "L'isolation des combles perdus par soufflage de laine minérale ou ouate de cellulose est la solution la plus économique : 20 à 50 €/m² tout compris. Pour 80 m² de combles, cela représente 1 600 à 4 000 €. Le chantier dure une demi-journée à une journée.",
      "L'isolation des combles aménagés (sous rampants) coûte 40 à 80 €/m² avec des panneaux rigides ou semi-rigides. Le sarking (isolation par l'extérieur) revient à 100 à 200 €/m² mais offre les meilleures performances.",
      "Les aides financières sont très avantageuses : MaPrimeRénov' (jusqu'à 25 €/m²), CEE (jusqu'à 12 €/m²), éco-PTZ (prêt à taux zéro jusqu'à 15 000 €). Pour les ménages modestes, le reste à charge peut être inférieur à 5 €/m².",
      "Choisissez un artisan RGE pour bénéficier des aides. Visez une résistance thermique R ≥ 7 m².K/W pour les combles perdus et R ≥ 6 pour les rampants. C'est le geste le plus rentable en rénovation énergétique : jusqu'à 30 % d'économie de chauffage."
    ],
    category: "prix",
    relatedService: "couvreur",
    tags: ["isolation", "combles", "prix", "aides", "rénovation énergétique"],
  },
  {
    slug: "prix-installation-climatisation",
    question: "Quel est le prix d'une installation de climatisation ?",
    shortAnswer: "L'installation d'une climatisation réversible coûte entre 1 500 et 5 000 € pour un split, et 5 000 à 10 000 € pour un multisplit (3-4 unités). Le climatiseur mobile est moins cher (300-800 €) mais moins performant.",
    detailedAnswer: [
      "Un climatiseur monosplit (une unité intérieure + une unité extérieure) coûte 800 à 2 000 € à l'achat et 600 à 1 500 € de pose, soit 1 500 à 3 500 € au total. C'est la solution idéale pour climatiser une pièce de 15 à 30 m².",
      "Un système multisplit (2 à 5 unités intérieures) coûte 3 000 à 8 000 € tout compris. La climatisation gainable (encastrée dans un faux plafond) revient à 5 000 à 12 000 € mais offre un confort optimal et reste invisible.",
      "Les climatisations réversibles (chaud/froid) sont les plus rentables car elles assurent aussi le chauffage en mi-saison. Leur COP de 3 à 4 signifie que pour 1 kWh consommé, elles restituent 3 à 4 kWh de chaleur ou de froid.",
      "L'installation doit être réalisée par un frigoriste certifié (attestation de capacité obligatoire pour la manipulation des fluides frigorigènes). En copropriété, l'accord du syndic est nécessaire pour l'unité extérieure."
    ],
    category: "prix",
    relatedService: "climaticien",
    tags: ["climatisation", "installation", "prix", "split"],
  },
  {
    slug: "cout-ravalement-facade",
    question: "Combien coûte un ravalement de façade ?",
    shortAnswer: "Un ravalement de façade coûte entre 30 et 100 € par m² selon la technique (nettoyage simple, enduit, peinture, ITE). Pour une maison de 100 m² de façade, prévoyez 3 000 à 10 000 €. L'ITE coûte 100 à 200 €/m².",
    detailedAnswer: [
      "Le prix dépend de la technique employée. Un simple nettoyage haute pression coûte 15 à 30 €/m². Un ravalement avec enduit monocouche revient à 40 à 70 €/m². Une peinture de façade coûte 20 à 45 €/m². Ces prix incluent l'échafaudage.",
      "L'isolation thermique par l'extérieur (ITE), souvent couplée au ravalement, coûte 100 à 200 €/m² supplémentaires mais réduit les factures de chauffage de 20 à 25 %. L'ITE ouvre droit à MaPrimeRénov' et aux CEE.",
      "L'échafaudage représente 10 à 25 € par m² de façade. La réparation de fissures ajoute 20 à 50 €/ml. Le traitement anti-mousse et l'hydrofuge protecteur (10 à 20 €/m²) prolongent la durée de vie du ravalement.",
      "Le ravalement est obligatoire tous les 10 ans dans certaines communes (Paris notamment). Vérifiez auprès de votre mairie. Choisissez un façadier qualifié Qualibat avec une garantie décennale. Comparez 3 devis minimum."
    ],
    category: "prix",
    relatedService: "maçon",
    tags: ["ravalement", "façade", "prix", "ITE", "maçon"],
  },

  // ============================================================
  // CHOIX (8 questions)
  // ============================================================
  {
    slug: "comment-choisir-plombier",
    question: "Comment choisir un bon plombier ?",
    shortAnswer: "Pour choisir un plombier fiable, vérifiez son numéro SIRET, son assurance décennale et ses avis en ligne. Demandez 3 devis détaillés, comparez les prix et méfiez-vous des tarifs anormalement bas.",
    detailedAnswer: [
      "La première vérification consiste à contrôler l'existence légale du plombier : numéro SIRET sur societe.com, inscription au registre des métiers (Chambre des Métiers). Un artisan en règle fournit ces informations sans difficulté.",
      "Demandez une copie de son attestation d'assurance responsabilité civile professionnelle et de sa garantie décennale. Ces assurances sont obligatoires et vous protègent en cas de malfaçon. Vérifiez que les dates couvrent la période de vos travaux.",
      "Comparez au moins 3 devis détaillés pour toute intervention supérieure à 500 €. Un devis sérieux mentionne le descriptif précis des travaux, le coût de la main-d'œuvre, le prix des fournitures, le délai et les conditions de paiement.",
      "Consultez les avis en ligne (Google, PagesJaunes) et le bouche-à-oreille de vos voisins ou de votre syndic. Un plombier qui travaille depuis plusieurs années dans votre quartier est souvent un choix sûr. Méfiez-vous des dépanneurs inconnus."
    ],
    category: "choix",
    relatedService: "plombier",
    tags: ["plombier", "choisir", "conseils", "devis"],
  },
  {
    slug: "comment-choisir-electricien",
    question: "Comment choisir un électricien qualifié ?",
    shortAnswer: "Choisissez un électricien certifié Qualifelec ou titulaire d'une habilitation électrique valide. Vérifiez son assurance décennale, demandez 3 devis et exigez une attestation de conformité Consuel pour les gros travaux.",
    detailedAnswer: [
      "Un électricien qualifié doit disposer d'une habilitation électrique (BR, B2V minimum) et idéalement de la certification Qualifelec. La mention RGE est nécessaire si vous souhaitez bénéficier d'aides pour la rénovation énergétique.",
      "Vérifiez son assurance décennale, obligatoire pour tous les travaux touchant à la sécurité du bâtiment. L'installation électrique en fait partie. Demandez une copie de l'attestation et vérifiez les dates de validité.",
      "Pour les travaux importants (mise en conformité, installation neuve), exigez une attestation de conformité Consuel en fin de chantier. Ce document certifie que l'installation respecte la norme NF C 15-100.",
      "Demandez 3 devis détaillés en vérifiant que le descriptif mentionne la norme NF C 15-100, les matériaux utilisés (marques de disjoncteurs, section des câbles) et le nombre de circuits prévus."
    ],
    category: "choix",
    relatedService: "electricien",
    tags: ["électricien", "choisir", "Qualifelec", "certification"],
  },
  {
    slug: "comment-verifier-artisan-fiable",
    question: "Comment vérifier si un artisan est fiable ?",
    shortAnswer: "Vérifiez le SIRET sur societe.com, l'assurance décennale, l'inscription au registre des métiers et les avis Google. Demandez des références de chantiers récents. Un artisan fiable ne demande jamais plus de 30 % d'acompte.",
    detailedAnswer: [
      "Commencez par vérifier le numéro SIRET sur societe.com ou infogreffe.fr. Vous y trouverez la date de création de l'entreprise, son chiffre d'affaires et son activité déclarée. Un artisan en activité depuis plus de 3 ans est généralement fiable.",
      "Demandez une copie de son assurance responsabilité civile professionnelle et de sa garantie décennale. Appelez l'assureur pour confirmer que le contrat est bien en cours. Un artisan qui refuse de fournir ces documents est à éviter.",
      "Consultez les avis en ligne (Google, PagesJaunes, Houzz) en privilégiant les avis détaillés avec photos. Demandez aussi 2 à 3 références de chantiers récents que vous pouvez contacter directement.",
      "Un artisan fiable fournit un devis détaillé avant de commencer, ne demande jamais plus de 30 % d'acompte, respecte les délais annoncés et communique régulièrement sur l'avancement. Fuyez ceux qui veulent commencer sans devis signé."
    ],
    category: "choix",
    relatedService: "plombier",
    tags: ["artisan fiable", "vérifier", "SIRET", "assurance"],
  },
  {
    slug: "quelles-certifications-artisan",
    question: "Quelles certifications doit avoir un artisan ?",
    shortAnswer: "Un artisan doit obligatoirement avoir un numéro SIRET, une assurance RC Pro et une garantie décennale pour les travaux de construction. Les labels RGE, Qualibat, Qualifelec ou QualiBois sont recommandés mais facultatifs.",
    detailedAnswer: [
      "Les obligations légales minimales sont : l'immatriculation au Répertoire des Métiers (SIRET), l'assurance responsabilité civile professionnelle (RC Pro) et, pour les travaux de construction, la garantie décennale. Sans ces documents, il est illégal d'exercer.",
      "Les labels recommandés varient selon le métier : Qualibat (tous corps de métier), Qualifelec (électriciens), QualiBois (chauffage bois), QualiPAC (pompes à chaleur), QualiSol (solaire thermique). La mention RGE est indispensable pour ouvrir droit aux aides.",
      "Pour les travaux touchant au gaz, l'artisan doit être certifié PG (Professionnel du Gaz). Pour la manipulation de fluides frigorigènes (climatisation), une attestation de capacité est obligatoire.",
      "Vous pouvez vérifier les certifications sur faire.gouv.fr (annuaire RGE officiel), qualibat.com ou qualifelec.fr. N'hésitez pas à demander les justificatifs : un artisan certifié les présente volontiers."
    ],
    category: "choix",
    relatedService: "plombier",
    tags: ["certifications", "Qualibat", "RGE", "garantie décennale"],
  },
  {
    slug: "devis-combien-demander",
    question: "Combien de devis faut-il demander pour des travaux ?",
    shortAnswer: "Il est recommandé de demander au minimum 3 devis pour tout projet de travaux. Cela permet de comparer les prix, les prestations et le professionnalisme des artisans. Pour les gros chantiers (plus de 10 000 €), visez 5 devis.",
    detailedAnswer: [
      "La règle de base est de demander au moins 3 devis pour avoir un comparatif fiable. Cela permet d'identifier le prix moyen du marché, d'évaluer le sérieux de chaque artisan et de repérer les devis anormalement bas ou trop élevés.",
      "Un devis doit obligatoirement mentionner : la date, les coordonnées complètes de l'artisan (SIRET, assurance), le descriptif détaillé des travaux, le prix HT et TTC, la TVA applicable, le délai et les conditions de paiement.",
      "Comparez les devis poste par poste, pas uniquement le total. Vérifiez que le même périmètre de travaux est couvert. Un devis moins cher peut omettre des prestations essentielles (préparation du support, nettoyage, évacuation des gravats).",
      "Pour les gros chantiers (rénovation complète, extension), consultez 4 à 5 artisans et envisagez un maître d'œuvre. Le devis est gratuit sauf si l'artisan doit se déplacer pour un diagnostic technique préalable (le montant doit être annoncé)."
    ],
    category: "choix",
    relatedService: "plombier",
    tags: ["devis", "comparer", "travaux", "conseils"],
  },
  {
    slug: "artisan-assurance-obligatoire",
    question: "Quelles assurances sont obligatoires pour un artisan ?",
    shortAnswer: "Un artisan du bâtiment doit obligatoirement avoir une assurance responsabilité civile professionnelle (RC Pro) et une garantie décennale pour les travaux de construction. L'assurance dommages-ouvrage est à la charge du maître d'ouvrage.",
    detailedAnswer: [
      "La responsabilité civile professionnelle (RC Pro) couvre les dommages causés à des tiers pendant l'exécution des travaux. Elle est obligatoire pour tous les artisans sans exception et doit être souscrite avant le début de l'activité.",
      "La garantie décennale est obligatoire pour tout artisan réalisant des travaux de construction, de rénovation ou d'extension. Elle couvre pendant 10 ans les dommages compromettant la solidité de l'ouvrage ou le rendant impropre à sa destination.",
      "L'artisan doit fournir son attestation d'assurance décennale avant le début du chantier. Cette attestation doit mentionner les activités couvertes. Vérifiez que l'activité correspondant à vos travaux y figure expressément.",
      "En complément, l'assurance dommages-ouvrage est à la charge du propriétaire (maître d'ouvrage). Elle permet un remboursement rapide des réparations sans attendre la décision de justice. Son coût représente 2 à 5 % du montant des travaux."
    ],
    category: "choix",
    relatedService: "plombier",
    tags: ["assurance", "décennale", "RC Pro", "obligatoire"],
  },
  {
    slug: "comment-choisir-chauffagiste",
    question: "Comment choisir un chauffagiste ?",
    shortAnswer: "Choisissez un chauffagiste certifié RGE et PG (Professionnel du Gaz). Vérifiez sa décennale, demandez 3 devis et consultez l'annuaire officiel sur faire.gouv.fr. La certification RGE est obligatoire pour les aides MaPrimeRénov'.",
    detailedAnswer: [
      "Un chauffagiste doit être certifié PG (Professionnel du Gaz) pour toute intervention sur une installation gaz. Pour les pompes à chaleur, la certification QualiPAC est recommandée. La mention RGE est obligatoire pour ouvrir droit aux aides publiques.",
      "Vérifiez la certification RGE sur le site officiel faire.gouv.fr (annuaire gouvernemental). Cette certification est renouvelée tous les 4 ans après audit, ce qui garantit un niveau de compétence maintenu.",
      "Demandez 3 devis détaillés incluant la marque et le modèle de la chaudière, la puissance recommandée (basée sur un calcul de déperditions), le coût de la pose, la mise en service et l'entretien annuel.",
      "Privilégiez un chauffagiste établi localement depuis plusieurs années, capable d'assurer le SAV et l'entretien annuel obligatoire. Vérifiez qu'il est agréé par la marque de la chaudière proposée."
    ],
    category: "choix",
    relatedService: "chauffagiste",
    tags: ["chauffagiste", "choisir", "RGE", "PG", "certification"],
  },
  {
    slug: "difference-artisan-entreprise",
    question: "Quelle est la différence entre un artisan et une entreprise de travaux ?",
    shortAnswer: "Un artisan travaille seul ou avec moins de 11 salariés et est inscrit au Répertoire des Métiers. Une entreprise de travaux est plus grande et dispose de plus de moyens mais facture souvent plus cher.",
    detailedAnswer: [
      "Un artisan est inscrit au Répertoire des Métiers, emploie moins de 11 salariés et exerce une activité de production, de transformation ou de réparation. Il détient une qualification professionnelle (CAP, BEP ou 3 ans d'expérience).",
      "Une entreprise du bâtiment peut employer des dizaines de salariés, intervenir sur de gros chantiers et coordonner plusieurs corps de métier. Elle dispose de moyens logistiques plus importants mais ses tarifs sont généralement 15 à 30 % plus élevés.",
      "L'avantage de l'artisan est le contact direct, la réactivité et souvent un meilleur rapport qualité-prix pour les travaux de petite et moyenne envergure. L'entreprise est préférable pour les chantiers complexes nécessitant plusieurs corps de métier.",
      "Dans les deux cas, les obligations légales sont identiques : SIRET, assurance RC Pro, garantie décennale, devis obligatoire. La qualité du travail dépend avant tout du professionnel, pas de la taille de la structure."
    ],
    category: "choix",
    relatedService: "plombier",
    tags: ["artisan", "entreprise", "différence", "choisir"],
  },

  // ============================================================
  // URGENCE (8 questions)
  // ============================================================
  {
    slug: "que-faire-fuite-eau",
    question: "Que faire en cas de fuite d'eau ?",
    shortAnswer: "Coupez immédiatement l'arrivée d'eau au compteur général. Placez des récipients sous la fuite, épongez l'eau et coupez l'électricité si l'eau est proche de prises. Prenez des photos pour l'assurance puis appelez un plombier.",
    detailedAnswer: [
      "Le premier réflexe est de couper l'arrivée d'eau générale au compteur. En appartement, le robinet d'arrêt se trouve souvent sous l'évier ou dans un placard technique. En maison, il est près du compteur d'eau (cave, garage ou regard extérieur).",
      "Coupez l'électricité au tableau si l'eau coule près de prises ou d'appareils électriques : le risque d'électrocution est réel. Placez des bassines et des serpillières pour limiter les dégâts. En étage, prévenez immédiatement les voisins du dessous.",
      "Prenez des photos et vidéos des dégâts avant de nettoyer : elles seront indispensables pour votre déclaration de sinistre. Vous disposez de 5 jours ouvrés pour déclarer un dégât des eaux à votre assureur.",
      "Appelez un plombier d'urgence. En attendant, vous pouvez tenter un colmatage provisoire avec du ruban adhésif étanche ou du mastic époxy. Remplissez le constat amiable dégât des eaux si un voisin est impacté."
    ],
    category: "urgence",
    relatedService: "plombier",
    tags: ["fuite d'eau", "urgence", "dégât des eaux", "plombier"],
  },
  {
    slug: "panne-electricite-qui-appeler",
    question: "Panne d'électricité : qui appeler ?",
    shortAnswer: "Si la panne est générale (tout le quartier), appelez Enedis au 09 72 67 50 + votre numéro de département. Si elle est limitée à votre logement, vérifiez le disjoncteur et le tableau électrique, puis appelez un électricien.",
    detailedAnswer: [
      "Vérifiez d'abord si la panne est générale ou limitée à votre logement. Regardez si vos voisins ont aussi perdu le courant, ou consultez l'application Enedis (enedis.fr/coupure). Si la panne est générale, contactez Enedis au 09 72 67 50 suivi de votre numéro de département.",
      "Si la panne concerne uniquement votre logement, vérifiez le disjoncteur général (position ON/OFF). S'il a disjoncté, débranchez les appareils récemment branchés (possible court-circuit) et réarmez-le. Si le disjoncteur redisjoncte, le problème est plus sérieux.",
      "Vérifiez aussi les disjoncteurs divisionnaires dans le tableau électrique. Si un seul circuit est coupé, le problème est localisé. Réarmez le disjoncteur concerné. Si le problème persiste, vous avez probablement un court-circuit sur ce circuit.",
      "Appelez un électricien si : le disjoncteur redisjoncte à chaque tentative, une odeur de brûlé est perceptible, des étincelles sont visibles, ou si vous ne parvenez pas à identifier la cause. Ne tentez jamais de réparer vous-même."
    ],
    category: "urgence",
    relatedService: "electricien",
    tags: ["panne électricité", "urgence", "Enedis", "disjoncteur"],
  },
  {
    slug: "porte-claquee-que-faire",
    question: "Porte claquée : que faire quand on est enfermé dehors ?",
    shortAnswer: "Si votre porte est claquée (non verrouillée à clé), un serrurier peut l'ouvrir sans casse pour 80 à 150 €. N'essayez pas de forcer la porte. Appelez un serrurier local recommandé, pas un numéro trouvé sur un prospectus.",
    detailedAnswer: [
      "Une porte claquée (simplement tirée, pas verrouillée à clé) se résout souvent par une ouverture fine, sans endommager la serrure. Un serrurier compétent utilise des outils spécifiques (radio, by-pass) qui n'abîment ni la porte ni la serrure. Coût : 80 à 150 € en journée.",
      "Ne tentez pas d'ouvrir la porte avec une carte ou un tournevis : vous risquez d'endommager la serrure et de transformer une intervention simple en remplacement complet (300 à 500 €). N'appelez pas les pompiers sauf en cas d'urgence vitale.",
      "Méfiez-vous des serruriers qui annoncent 39 € au téléphone puis facturent 500 € sur place. Privilégiez un serrurier local recommandé par votre syndic ou un voisin. Votre assurance habitation inclut peut-être un service de dépannage serrurerie.",
      "Prévenez votre propriétaire ou syndic si vous êtes locataire. Demandez au serrurier un devis écrit avant intervention. Conservez la facture : les frais peuvent parfois être pris en charge par votre assurance habitation."
    ],
    category: "urgence",
    relatedService: "serrurier",
    tags: ["porte claquée", "serrurier", "urgence", "ouverture"],
  },
  {
    slug: "chaudiere-en-panne-hiver",
    question: "Chaudière en panne en hiver : que faire ?",
    shortAnswer: "Vérifiez la pression (1 à 1,5 bar), le thermostat et l'alimentation électrique. Relancez la chaudière avec le bouton reset. Si elle ne redémarre pas, appelez un chauffagiste. Utilisez des chauffages d'appoint en attendant.",
    detailedAnswer: [
      "Avant d'appeler un chauffagiste, vérifiez : la pression de la chaudière (manomètre entre 1 et 1,5 bar — ajoutez de l'eau si trop basse), le thermostat (piles, réglage), l'alimentation électrique et gaz, et le code erreur affiché sur la chaudière.",
      "Tentez un redémarrage avec le bouton reset de la chaudière (généralement un bouton rouge ou un symbole flamme). Attendez 30 secondes entre chaque tentative. Ne faites pas plus de 3 tentatives : un redémarrage forcé répété peut aggraver le problème.",
      "Si la chaudière ne redémarre pas, appelez votre chauffagiste habituel ou le SAV de la marque. En hiver, les délais peuvent atteindre 24 à 48 h. Si votre contrat d'entretien inclut le dépannage, l'intervention est souvent gratuite ou à coût réduit.",
      "En attendant le dépannage, utilisez des chauffages d'appoint électriques (radiateurs soufflants, bains d'huile). Évitez les chauffages au gaz d'appoint dans les pièces fermées (risque de monoxyde de carbone). Fermez les volets et calfeutrez les fenêtres."
    ],
    category: "urgence",
    relatedService: "chauffagiste",
    tags: ["chaudière", "panne", "hiver", "chauffagiste", "urgence"],
  },
  {
    slug: "degat-des-eaux-premiers-gestes",
    question: "Dégât des eaux : quels sont les premiers gestes ?",
    shortAnswer: "Coupez l'eau et l'électricité, épongez l'eau stagnante et mettez vos objets de valeur à l'abri. Prenez des photos des dégâts. Déclarez le sinistre à votre assurance sous 5 jours ouvrés et remplissez le constat amiable.",
    detailedAnswer: [
      "Les premières minutes sont cruciales : coupez l'arrivée d'eau et l'électricité si l'eau entre en contact avec des installations électriques. Épongez au maximum et éloignez les meubles et objets de valeur. Ouvrez les fenêtres pour ventiler.",
      "Documentez les dégâts avant de nettoyer : photos des murs, sols, plafonds et objets endommagés, avec horodatage. Conservez les objets abîmés jusqu'au passage de l'expert. Listez les biens endommagés avec leur valeur et les factures d'achat.",
      "Déclarez le sinistre à votre assurance habitation sous 5 jours ouvrés (par lettre recommandée ou en ligne). Si un voisin est impliqué, remplissez ensemble le constat amiable dégât des eaux (formulaire Cerfa disponible auprès de votre assureur).",
      "Faites intervenir un plombier pour identifier et réparer la cause de la fuite. Conservez la facture pour votre dossier d'assurance. L'assureur mandate généralement un expert si les dégâts dépassent 1 600 €."
    ],
    category: "urgence",
    relatedService: "plombier",
    tags: ["dégât des eaux", "assurance", "urgence", "constat"],
  },
  {
    slug: "vitre-cassee-securiser",
    question: "Vitre cassée : comment sécuriser en attendant le vitrier ?",
    shortAnswer: "Portez des gants épais pour ramasser les éclats. Colmatez la fenêtre avec du carton épais ou une bâche fixée avec du ruban adhésif résistant. Appelez un vitrier pour un remplacement sous 24 à 48 h. Coût : 80 à 300 €.",
    detailedAnswer: [
      "Sécurisez immédiatement la zone : enfilez des gants épais et des chaussures fermées. Ramassez les éclats de verre avec un balai et une pelle, puis passez l'aspirateur pour les petits morceaux. Emballez les éclats dans du papier journal avant de les jeter.",
      "Colmatez l'ouverture pour protéger votre intérieur du froid et des intrusions. Utilisez du carton épais ou du contreplaqué pour les grandes ouvertures, fixé avec du ruban adhésif résistant. Pour les petites fissures, du ruban adhésif transparent large peut suffire.",
      "Appelez un vitrier le jour même. Le remplacement d'un simple vitrage coûte 80 à 150 €, un double vitrage 150 à 300 € selon les dimensions. Le vitrier peut généralement intervenir sous 24 à 48 h.",
      "Si la vitre a été cassée par un tiers (cambriolage, vandalisme, intempéries), votre assurance habitation prend en charge le remplacement. Déclarez le sinistre sous 2 jours ouvrés en cas de vol, 5 jours pour les autres cas. Conservez la facture du vitrier."
    ],
    category: "urgence",
    relatedService: "vitrier",
    tags: ["vitre cassée", "vitrier", "urgence", "sécuriser"],
  },
  {
    slug: "canalisation-bouchee-urgence",
    question: "Canalisation bouchée en urgence : que faire ?",
    shortAnswer: "Essayez d'abord la ventouse, puis le mélange bicarbonate + vinaigre blanc. Si le bouchon persiste, utilisez un furet manuel. En cas d'échec ou de remontée d'eaux usées, appelez un plombier. Coût du débouchage pro : 100 à 350 €.",
    detailedAnswer: [
      "Tentez d'abord les solutions simples : la ventouse (créez un effet de succion en pompant énergiquement), puis le mélange de 6 cuillères à soupe de bicarbonate de soude et 25 cl de vinaigre blanc, laissez agir 30 minutes et rincez à l'eau bouillante.",
      "Si le bouchon résiste, utilisez un furet manuel (disponible en grande surface pour 10 à 30 €). Insérez-le dans la canalisation en tournant la manivelle. Évitez les déboucheurs chimiques (soude caustique) qui sont corrosifs pour les canalisations et dangereux.",
      "Appelez un plombier en urgence si : les eaux usées remontent par les sanitaires, plusieurs appareils sont bouchés simultanément (signe d'un bouchon sur la colonne principale), ou si une mauvaise odeur persistante accompagne le bouchage.",
      "Un débouchage professionnel coûte 100 à 250 € au furet mécanique, et 200 à 400 € pour un hydrocurage haute pression. Ce dernier est plus efficace pour les bouchons tenaces et nettoie les parois de la canalisation."
    ],
    category: "urgence",
    relatedService: "plombier",
    tags: ["canalisation bouchée", "débouchage", "urgence", "plombier"],
  },
  {
    slug: "panne-chauffage-locataire-droits",
    question: "Panne de chauffage en tant que locataire : quels sont vos droits ?",
    shortAnswer: "Le propriétaire est obligé de fournir un chauffage en état de fonctionnement. En cas de panne, prévenez-le par écrit (email ou LRAR). S'il ne réagit pas sous 48 h, vous pouvez faire intervenir un chauffagiste à ses frais.",
    detailedAnswer: [
      "Le bailleur a l'obligation légale de fournir un logement décent avec un système de chauffage en état de fonctionnement (article 6 de la loi du 6 juillet 1989). La panne constitue un manquement à cette obligation.",
      "Prévenez immédiatement votre propriétaire ou le gestionnaire par email (avec accusé de réception) ou par lettre recommandée. Décrivez la panne et demandez une intervention urgente. Conservez une copie de tous les échanges.",
      "Si le propriétaire ne réagit pas, vous pouvez : faire intervenir un chauffagiste et lui envoyer la facture, saisir la Commission Départementale de Conciliation, ou en dernier recours, saisir le tribunal judiciaire pour contraindre les réparations.",
      "Attention : l'entretien courant (entretien annuel, purge des radiateurs) est à la charge du locataire. Seules les grosses réparations (remplacement de la chaudière, réparation de la tuyauterie) incombent au propriétaire. Consultez votre bail."
    ],
    category: "urgence",
    relatedService: "chauffagiste",
    tags: ["chauffage", "locataire", "droits", "propriétaire", "panne"],
  },

  // ============================================================
  // RÉGLEMENTATION (6 questions)
  // ============================================================
  {
    slug: "permis-construire-quand-obligatoire",
    question: "Quand le permis de construire est-il obligatoire ?",
    shortAnswer: "Le permis de construire est obligatoire pour toute construction nouvelle de plus de 20 m² et pour les extensions de plus de 40 m² en zone urbaine (PLU). En dessous, une déclaration préalable suffit. Aucune formalité sous 5 m².",
    detailedAnswer: [
      "Le permis de construire est requis pour : toute construction nouvelle de plus de 20 m² de surface de plancher, les extensions de plus de 40 m² en zone couverte par un PLU, ou de plus de 20 m² hors zone PLU.",
      "Une déclaration préalable de travaux suffit pour : les constructions de 5 à 20 m², les modifications de l'aspect extérieur (ravalement, changement de fenêtres), les piscines de 10 à 100 m², et les clôtures dans certaines zones protégées.",
      "Aucune formalité n'est nécessaire pour les constructions de moins de 5 m² de surface de plancher et de moins de 12 m de hauteur, les terrasses de plain-pied, et les piscines de moins de 10 m² non couvertes.",
      "Le recours à un architecte est obligatoire pour les projets portant la surface totale au-delà de 150 m². Le délai d'instruction est de 2 mois pour un permis simple, 3 mois en périmètre protégé. Le permis est valable 3 ans."
    ],
    category: "reglementation",
    relatedService: "maçon",
    tags: ["permis de construire", "déclaration préalable", "urbanisme"],
  },
  {
    slug: "garantie-decennale-definition",
    question: "Qu'est-ce que la garantie décennale ?",
    shortAnswer: "La garantie décennale est une assurance obligatoire qui couvre pendant 10 ans les dommages compromettant la solidité d'un ouvrage ou le rendant impropre à sa destination. Elle s'applique à tous les travaux de construction et de rénovation lourde.",
    detailedAnswer: [
      "La garantie décennale (articles 1792 et suivants du Code civil) oblige tout constructeur à réparer les dommages affectant la solidité de l'ouvrage ou le rendant impropre à sa destination pendant 10 ans à compter de la réception des travaux.",
      "Sont concernés : le gros œuvre (fondations, murs, toiture, charpente), les équipements indissociables (canalisations encastrées, installation électrique, chauffage central) et les éléments dont le dysfonctionnement rend l'ouvrage impropre à sa destination.",
      "Tous les professionnels du bâtiment doivent souscrire cette assurance : maçons, couvreurs, plombiers, électriciens, charpentiers, etc. L'absence de décennale expose l'artisan à des sanctions pénales (amende de 75 000 €, 6 mois d'emprisonnement).",
      "Avant tout chantier, demandez l'attestation de garantie décennale et vérifiez que les activités couvertes correspondent à vos travaux. En cas de sinistre, adressez une lettre recommandée à l'artisan et à son assureur dans les 10 ans suivant la réception."
    ],
    category: "reglementation",
    relatedService: "maçon",
    tags: ["garantie décennale", "assurance", "construction"],
  },
  {
    slug: "norme-electrique-nfc-15-100",
    question: "Qu'est-ce que la norme électrique NF C 15-100 ?",
    shortAnswer: "La norme NF C 15-100 régit les installations électriques dans les logements. Elle impose un nombre minimum de prises, de circuits et de protections. Elle est obligatoire pour les constructions neuves et les rénovations totales.",
    detailedAnswer: [
      "La norme NF C 15-100 définit les règles de conception, de réalisation et d'entretien des installations électriques basse tension. Elle impose un tableau avec protection différentielle 30 mA, un nombre minimum de prises par pièce et des circuits dédiés.",
      "Exigences principales : salon (5 prises minimum + 1 télécom), chambre (3 prises + 1 télécom), cuisine (6 prises dont 4 au-dessus du plan de travail + circuits dédiés four, plaques, lave-vaisselle), salle de bain (zones de sécurité 0 à 3).",
      "La norme impose aussi : un disjoncteur général accessible, un interrupteur différentiel 30 mA par groupe de circuits, des disjoncteurs divisionnaires par circuit, une gaine technique logement (GTL) et un dispositif parafoudre dans les zones à risque.",
      "Elle est obligatoire pour les constructions neuves et les rénovations totales (attestation Consuel requise). Pour les rénovations partielles, la mise aux normes du tableau est fortement recommandée. Un diagnostic électrique est obligatoire pour la vente de logements de plus de 15 ans."
    ],
    category: "reglementation",
    relatedService: "electricien",
    tags: ["NF C 15-100", "norme électrique", "installation", "Consuel"],
  },
  {
    slug: "diagnostic-electrique-obligatoire",
    question: "Quand le diagnostic électrique est-il obligatoire ?",
    shortAnswer: "Le diagnostic électrique est obligatoire pour la vente d'un logement dont l'installation a plus de 15 ans, et pour la mise en location de tout logement. Il est valable 3 ans (vente) ou 6 ans (location). Coût : 100 à 180 €.",
    detailedAnswer: [
      "Le diagnostic de l'installation intérieure d'électricité est obligatoire pour la vente d'un logement dont l'installation a plus de 15 ans (décret du 22 avril 2008). Il est aussi obligatoire pour la mise en location (loi ALUR, 2014).",
      "Le diagnostic doit être réalisé par un diagnostiqueur certifié COFRAC. Il contrôle 87 points : présence et fonctionnement du disjoncteur, protection différentielle, état des conducteurs, respect des zones de sécurité dans la salle de bain, mise à la terre.",
      "Sa durée de validité est de 3 ans pour une vente et de 6 ans pour une location. Son coût est de 100 à 180 € selon la taille du logement. Il ne donne pas lieu à une obligation de mise aux normes, mais il informe l'acquéreur ou le locataire.",
      "Si le diagnostic révèle des anomalies graves (absence de protection différentielle, conducteurs dénudés), le vendeur n'est pas obligé de faire les travaux mais le rapport peut servir d'argument de négociation pour l'acheteur."
    ],
    category: "reglementation",
    relatedService: "electricien",
    tags: ["diagnostic électrique", "obligatoire", "vente", "location"],
  },
  {
    slug: "tva-travaux-renovation-taux",
    question: "Quel taux de TVA s'applique aux travaux de rénovation ?",
    shortAnswer: "La TVA est de 10 % pour les travaux de rénovation et d'entretien dans un logement de plus de 2 ans. Elle passe à 5,5 % pour les travaux de rénovation énergétique. La TVA est de 20 % pour les constructions neuves.",
    detailedAnswer: [
      "Le taux réduit de 10 % s'applique aux travaux de rénovation, d'amélioration et d'entretien dans les logements achevés depuis plus de 2 ans. Il concerne la main-d'œuvre et les matériaux fournis par l'artisan. Le logement doit être une résidence.",
      "Le taux super-réduit de 5,5 % concerne les travaux de rénovation énergétique : isolation thermique (murs, toiture, planchers), remplacement de fenêtres performantes, installation de chaudière à condensation, pompe à chaleur ou chauffe-eau solaire.",
      "Le taux normal de 20 % s'applique aux constructions neuves, aux travaux augmentant la surface de plancher de plus de 10 %, et aux équipements non liés à l'efficacité énergétique (piscine, climatisation, domotique).",
      "Pour bénéficier du taux réduit, le propriétaire doit remettre à l'artisan une attestation simplifiée (Cerfa n° 1301-SD) ou normale (Cerfa n° 1300-SD). L'artisan facture directement au taux réduit. Sans attestation, la TVA est à 20 %."
    ],
    category: "reglementation",
    relatedService: "plombier",
    tags: ["TVA", "travaux", "rénovation", "taux réduit"],
  },
  {
    slug: "assurance-dommages-ouvrage",
    question: "Qu'est-ce que l'assurance dommages-ouvrage ?",
    shortAnswer: "L'assurance dommages-ouvrage (DO) est obligatoire pour tout maître d'ouvrage faisant réaliser des travaux de construction. Elle permet un remboursement rapide des réparations sous 90 jours. Son coût est de 2 à 5 % du montant des travaux.",
    detailedAnswer: [
      "L'assurance dommages-ouvrage (loi Spinetta, 1978) doit être souscrite par le maître d'ouvrage (propriétaire) avant l'ouverture du chantier. Elle couvre les mêmes dommages que la garantie décennale mais offre un préfinancement rapide des réparations.",
      "Son intérêt principal est la rapidité : en cas de sinistre, l'assureur DO doit proposer une indemnisation sous 90 jours. Sans DO, il faut engager une procédure judiciaire contre l'artisan et son assureur décennal, ce qui prend 2 à 5 ans.",
      "L'assurance DO est obligatoire pour les constructions neuves, les extensions et les rénovations lourdes. En pratique, les particuliers la souscrivent rarement pour de petits travaux car son coût (2 à 5 % du montant) est élevé.",
      "L'absence de DO n'est pas pénalement sanctionnée pour les particuliers, mais en cas de revente dans les 10 ans, l'acheteur peut demander une réduction du prix. Pour les travaux de plus de 50 000 €, elle est vivement recommandée."
    ],
    category: "reglementation",
    relatedService: "maçon",
    tags: ["dommages-ouvrage", "assurance", "construction", "loi Spinetta"],
  },

  // ============================================================
  // DIY (6 questions)
  // ============================================================
  {
    slug: "peindre-soi-meme-conseils",
    question: "Comment bien peindre soi-même un mur ?",
    shortAnswer: "Préparez le support (lessivage, ponçage, rebouchage), protégez le sol et les meubles, appliquez une sous-couche puis 2 couches de peinture au rouleau. Peignez en croisant les passes et en lissant de haut en bas.",
    detailedAnswer: [
      "La préparation du support est la clé d'un résultat professionnel. Lessivez les murs à la lessive Saint-Marc, poncez au papier de verre grain 120, rebouchez les trous et fissures à l'enduit, puis poncez à nouveau une fois sec. Posez du ruban de masquage.",
      "Appliquez une sous-couche universelle ou un primaire d'accrochage, surtout sur les supports neufs ou tachés. Laissez sécher le temps indiqué sur le pot (généralement 4 à 6 h). La sous-couche uniformise l'absorption et réduit la consommation de peinture de finition.",
      "Pour la finition, commencez par les angles et les bords au pinceau à réchampir, puis remplissez les grandes surfaces au rouleau. Chargez le rouleau sans excès, appliquez en croisant les passes (vertical puis horizontal) et lissez de haut en bas.",
      "Appliquez toujours 2 couches minimum en respectant le temps de séchage. Utilisez un rouleau adapté (poils courts pour surfaces lisses, poils longs pour surfaces texturées) et une peinture de qualité. Retirez le ruban de masquage avant séchage complet de la dernière couche."
    ],
    category: "diy",
    relatedService: "peintre",
    tags: ["peinture", "DIY", "bricolage", "mur", "conseils"],
  },
  {
    slug: "changer-robinet-soi-meme",
    question: "Comment changer un robinet soi-même ?",
    shortAnswer: "Coupez l'eau, purgez la pression, dévissez les flexibles et le robinet. Posez le nouveau robinet avec un joint d'étanchéité, revissez les flexibles, rétablissez l'eau et vérifiez l'absence de fuite. Durée : 30 à 60 minutes.",
    detailedAnswer: [
      "Coupez l'arrivée d'eau sous l'évier ou au compteur général. Ouvrez le robinet pour purger la pression résiduelle et placez une bassine sous les raccords. Dévissez les flexibles d'alimentation avec une clé à molette, puis dévissez l'écrou de fixation sous le plan de travail.",
      "Nettoyez le trou de fixation et les surfaces de contact. Insérez le nouveau robinet en plaçant le joint d'étanchéité fourni. Serrez l'écrou de fixation par en dessous sans forcer excessivement. Reconnectez les flexibles (rouge à gauche pour l'eau chaude, bleu à droite pour l'eau froide).",
      "Remplacez les flexibles par des neufs s'ils ont plus de 5 ans ou présentent des signes de vétusté. Utilisez du ruban PTFE (téflon) sur les filetages mâles pour garantir l'étanchéité. Serrez fermement à la main puis un quart de tour à la clé.",
      "Rétablissez l'eau progressivement et vérifiez l'absence de fuite sur tous les raccords. Laissez couler l'eau 2 minutes pour purger l'air. Si une fuite apparaît, resserrez légèrement le raccord. Outils nécessaires : clé à molette, clé plate, tournevis, bassine, ruban PTFE."
    ],
    category: "diy",
    relatedService: "plombier",
    tags: ["robinet", "DIY", "plomberie", "changer", "bricolage"],
  },
  {
    slug: "poser-parquet-flottant-diy",
    question: "Comment poser du parquet flottant soi-même ?",
    shortAnswer: "Posez une sous-couche isolante sur le sol propre et sec, puis clipsez les lames rangée par rangée en partant du mur le plus long. Laissez un jeu de dilatation de 8 mm sur tout le pourtour. Un débutant peut poser 10 à 15 m² par jour.",
    detailedAnswer: [
      "Avant la pose, laissez les lames s'acclimater 48 h dans la pièce (emballage ouvert). Vérifiez la planéité du sol (2 mm de tolérance par mètre). Si le sol est irrégulier, effectuez un ragréage. Sur un sol béton, posez un pare-vapeur en polyéthylène avant la sous-couche.",
      "Déroulez la sous-couche (mousse, liège ou fibre de bois) sans chevauchement, bord à bord avec du ruban adhésif. Commencez la pose depuis le mur le plus long et le plus droit, languette côté mur. Placez des cales de 8 mm contre les murs pour le jeu de dilatation.",
      "Clipsez les lames entre elles : emboîtez la languette dans la rainure en inclinant à 20-30° puis abaissez. Pour les coupes en bout de rangée, mesurez et coupez à la scie sauteuse. Décalez les joints d'au moins 30 cm d'une rangée à l'autre.",
      "Autour des tuyaux, percez un trou de diamètre supérieur de 16 mm au tuyau. Pour les passages de porte, découpez le bas du chambranle à la scie japonaise. Terminez par la pose des plinthes qui masqueront le jeu de dilatation."
    ],
    category: "diy",
    relatedService: "menuisier",
    tags: ["parquet flottant", "pose", "DIY", "bricolage", "sol"],
  },
  {
    slug: "installer-prise-electrique-danger",
    question: "Peut-on installer une prise électrique soi-même ?",
    shortAnswer: "Ajouter une prise sur un circuit existant est possible pour un bricoleur averti, mais comporte des risques d'électrocution et d'incendie. Coupez le disjoncteur, vérifiez l'absence de tension et respectez la norme NF C 15-100.",
    detailedAnswer: [
      "Remplacer une prise existante (même emplacement, même circuit) est accessible à un bricoleur soigneux. En revanche, créer un nouveau circuit ou ajouter une prise sur un circuit surchargé nécessite des compétences en électricité et le respect strict de la norme NF C 15-100.",
      "Règles de sécurité absolues : coupez le disjoncteur du circuit concerné (pas seulement l'interrupteur), vérifiez l'absence de tension avec un VAT (Vérificateur d'Absence de Tension). Travaillez avec des outils isolés et ne touchez jamais un fil sans avoir vérifié.",
      "La norme impose : maximum 8 prises par circuit en 2,5 mm² protégé par un disjoncteur 20 A, ou 5 prises en 1,5 mm² protégé par 16 A. Les circuits prises doivent être protégés par un interrupteur différentiel 30 mA. En salle de bain, les prises sont interdites dans les zones 0, 1 et 2.",
      "En cas de doute, faites appel à un électricien. Une prise mal installée peut provoquer un arc électrique et un incendie. Le coût d'installation par un pro (80 à 150 €) est dérisoire comparé aux risques. L'assurance peut refuser un sinistre si l'installation non conforme est en cause."
    ],
    category: "diy",
    relatedService: "electricien",
    tags: ["prise électrique", "DIY", "danger", "norme", "sécurité"],
  },
  {
    slug: "deboucher-canalisation-astuces",
    question: "Comment déboucher une canalisation naturellement ?",
    shortAnswer: "Versez 6 cuillères à soupe de bicarbonate de soude et 25 cl de vinaigre blanc dans la canalisation, laissez agir 30 minutes puis rincez à l'eau bouillante. En cas de bouchon tenace, utilisez une ventouse ou un furet manuel.",
    detailedAnswer: [
      "La méthode la plus efficace et écologique : versez 6 cuillères à soupe de bicarbonate de soude directement dans la bonde, puis ajoutez 25 cl de vinaigre blanc. La réaction effervescente dissout les dépôts de graisse et de savon. Laissez agir 30 minutes à 1 h puis rincez.",
      "La ventouse est très efficace pour les bouchons proches de la bonde. Remplissez l'évier de 5 cm d'eau, bouchez le trop-plein avec un chiffon mouillé et pompez énergiquement avec la ventouse. Répétez 10 à 15 fois si nécessaire.",
      "Le furet manuel (8 à 25 € en magasin de bricolage) atteint les bouchons plus profonds. Insérez-le en tournant la manivelle dans le sens horaire. Quand vous sentez une résistance, continuez à tourner pour traverser le bouchon.",
      "Évitez les déboucheurs chimiques (soude caustique, acide) : ils sont corrosifs pour les canalisations en PVC, dangereux et polluants. En prévention, versez 1 litre d'eau bouillante dans chaque évier une fois par semaine et utilisez des grilles pour retenir les déchets."
    ],
    category: "diy",
    relatedService: "plombier",
    tags: ["déboucher", "canalisation", "naturel", "bicarbonate", "DIY"],
  },
  {
    slug: "monter-meuble-cuisine-soi-meme",
    question: "Comment monter un meuble de cuisine soi-même ?",
    shortAnswer: "Commencez par fixer les meubles hauts sur un rail de suspension vissé au mur (hauteur standard : 140 cm). Assemblez les caissons, fixez-les au rail, puis installez les meubles bas et le plan de travail. Prévoyez 2 à 3 jours.",
    detailedAnswer: [
      "Planifiez l'agencement avant de commencer : tracez les emplacements au mur en tenant compte des arrivées d'eau, d'électricité et de gaz. La hauteur standard du plan de travail est de 85 à 90 cm. Les meubles hauts se fixent à 140 cm du sol.",
      "Commencez par les meubles hauts. Fixez un rail de suspension métallique au mur avec des chevilles adaptées (béton, brique, placo). Vérifiez l'horizontalité au niveau à bulle. Assemblez les caissons, accrochez-les au rail et réglez l'aplomb.",
      "Installez ensuite les meubles bas. Assemblez les caissons, posez-les en place et réglez les pieds pour obtenir une surface parfaitement horizontale. Vissez les caissons entre eux à travers les montants latéraux. Découpez les passages pour la plomberie et l'électricité.",
      "Posez le plan de travail en dernier : découpez les emplacements de l'évier et de la plaque à la scie sauteuse. Appliquez un joint silicone sur les découpes. Fixez les portes et les tiroirs, réglez les charnières. Terminez par la crédence et les joints silicone."
    ],
    category: "diy",
    relatedService: "menuisier",
    tags: ["cuisine", "montage", "meuble", "DIY", "bricolage"],
  },
]

// ============================================================
// Fonctions utilitaires
// ============================================================

export function getQuestionBySlug(slug: string): Question | undefined {
  return questions.find((q) => q.slug === slug)
}

export function getQuestionSlugs(): string[] {
  return questions.map((q) => q.slug)
}

export function getQuestionsByCategory(category: QuestionCategory): Question[] {
  return questions.filter((q) => q.category === category)
}
