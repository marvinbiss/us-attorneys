/**
 * Données des questions fréquentes pour les pages /questions/
 * 65 questions avec réponses optimisées pour les featured snippets Google.
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

  // ============================================================
  // ÉNERGIE / RÉNOVATION — High volume gaps (5 questions)
  // ============================================================
  {
    slug: "aide-pompe-chaleur-2026",
    question: "Quelles aides pour une pompe à chaleur en 2026 ?",
    shortAnswer: "En 2026, MaPrimeRénov couvre jusqu'à 5 000 € pour une PAC air-eau et les CEE ajoutent 2 500 à 4 000 €. Le cumul peut atteindre 9 000 € selon vos revenus et la zone climatique.",
    detailedAnswer: [
      "MaPrimeRénov reste le dispositif principal pour financer une pompe à chaleur en 2026. Le montant dépend de vos revenus : les ménages très modestes peuvent obtenir jusqu'à 5 000 € pour une PAC air-eau et jusqu'à 11 000 € pour une PAC géothermique. Les ménages aux revenus intermédiaires reçoivent entre 3 000 et 5 000 €.",
      "Les Certificats d'Économies d'Énergie (CEE) complètent MaPrimeRénov. Les primes CEE pour une pompe à chaleur varient de 2 500 à 4 000 € selon le fournisseur d'énergie et la zone climatique. Comparez les offres sur le site officiel avant de vous engager.",
      "Pour bénéficier de ces aides, le logement doit avoir plus de 15 ans et les travaux doivent être réalisés par un artisan certifié RGE. Faites réaliser un audit énergétique au préalable pour maximiser les aides en cas de rénovation globale.",
      "D'autres aides locales peuvent s'ajouter : éco-PTZ (jusqu'à 50 000 € à taux zéro), TVA réduite à 5,5 %, et aides des collectivités locales. Renseignez-vous auprès de votre ADIL ou sur France Rénov pour un accompagnement personnalisé."
    ],
    category: "reglementation",
    relatedService: "pompe-a-chaleur",
    tags: ["pompe à chaleur", "aides", "MaPrimeRénov", "CEE", "2026"],
  },
  {
    slug: "maprimerenov-conditions-2026",
    question: "Quelles sont les conditions pour bénéficier de MaPrimeRénov en 2026 ?",
    shortAnswer: "MaPrimeRénov 2026 est accessible à tous les propriétaires occupants ou bailleurs d'un logement de plus de 15 ans. Les travaux doivent être réalisés par un artisan RGE et la demande se fait avant le début des travaux.",
    detailedAnswer: [
      "MaPrimeRénov 2026 s'adresse à tous les propriétaires, qu'ils occupent le logement ou le mettent en location. Le logement doit avoir été construit il y a plus de 15 ans (contre 2 ans auparavant). Les copropriétés peuvent aussi en bénéficier via MaPrimeRénov Copropriétés.",
      "Le montant de la prime dépend de vos revenus (classés en 4 catégories : très modestes, modestes, intermédiaires, supérieurs) et du gain énergétique apporté par les travaux. Un parcours accompagné (rénovation globale) offre des montants plus élevés qu'un parcours par geste.",
      "Les travaux éligibles incluent l'isolation (murs, toiture, planchers), le chauffage (PAC, chaudière biomasse, solaire), la ventilation et l'audit énergétique. Un artisan certifié RGE est obligatoire pour chaque poste de travaux.",
      "La demande se fait en ligne sur maprimerenov.gouv.fr AVANT le début des travaux. Rassemblez vos devis, votre avis d'imposition et les attestations RGE des artisans. Le versement intervient après la fin des travaux, sur présentation des factures."
    ],
    category: "reglementation",
    relatedService: "renovation-energetique",
    tags: ["MaPrimeRénov", "conditions", "éligibilité", "rénovation", "2026"],
  },
  {
    slug: "dpe-obligatoire-vente-location",
    question: "Le DPE est-il obligatoire pour vendre ou louer en 2026 ?",
    shortAnswer: "Oui, le DPE est obligatoire pour toute vente ou location depuis 2006. En 2026, les logements classés G sont interdits à la location. Le DPE doit être réalisé par un diagnostiqueur certifié et est valable 10 ans.",
    detailedAnswer: [
      "Le Diagnostic de Performance Énergétique est obligatoire pour toute mise en vente ou en location d'un logement. Il doit figurer dans l'annonce immobilière et être annexé au contrat (compromis de vente ou bail). Son absence expose à des sanctions.",
      "Depuis le 1er janvier 2025, les logements classés G au DPE sont considérés comme indécents et ne peuvent plus être mis en location. En 2028, cette interdiction s'étendra aux logements classés F, puis aux E en 2034. Les propriétaires bailleurs doivent anticiper ces échéances.",
      "Le DPE doit être réalisé par un diagnostiqueur certifié par un organisme accrédité COFRAC. Le coût moyen se situe entre 100 et 250 € selon la surface et la localisation. Il est valable 10 ans, sauf en cas de travaux modifiant la performance énergétique.",
      "Au-delà de l'obligation légale, le DPE influence directement la valeur du bien. Un logement classé A ou B se vend 6 à 15 % plus cher qu'un logement classé D ou E. Investir dans la rénovation énergétique avant la vente peut donc être financièrement rentable."
    ],
    category: "reglementation",
    relatedService: "diagnostiqueur",
    tags: ["DPE", "diagnostic", "vente", "location", "obligation"],
  },
  {
    slug: "artisan-rge-obligatoire",
    question: "Est-il obligatoire de choisir un artisan RGE ?",
    shortAnswer: "Un artisan RGE (Reconnu Garant de l'Environnement) est obligatoire pour bénéficier des aides publiques comme MaPrimeRénov, les CEE ou l'éco-PTZ. Sans certification RGE, vous ne percevrez aucune aide financière.",
    detailedAnswer: [
      "La certification RGE est obligatoire pour que vos travaux de rénovation énergétique ouvrent droit aux aides publiques : MaPrimeRénov, Certificats d'Économies d'Énergie (CEE), éco-prêt à taux zéro, TVA réduite à 5,5 %. Sans artisan RGE, vous devrez financer l'intégralité des travaux.",
      "RGE signifie Reconnu Garant de l'Environnement. Cette certification, délivrée par des organismes comme Qualibat, Qualifelec ou Qualit'EnR, garantit que l'artisan a suivi une formation spécifique et respecte des critères de qualité pour les travaux d'efficacité énergétique.",
      "Pour vérifier qu'un artisan est bien RGE, consultez l'annuaire officiel sur france-renov.gouv.fr. Vérifiez que la certification couvre bien le type de travaux envisagé (isolation, chauffage, ENR) et qu'elle est en cours de validité. Demandez aussi une copie du certificat.",
      "Même sans obligation d'aides, choisir un artisan RGE est un gage de qualité. En cas de litige, la certification offre des recours via l'organisme certificateur. De plus, l'assurance décennale de l'artisan RGE couvre spécifiquement les travaux de rénovation énergétique."
    ],
    category: "choix",
    relatedService: "renovation-energetique",
    tags: ["RGE", "certification", "artisan", "aides", "obligation"],
  },
  {
    slug: "passoire-thermique-que-faire",
    question: "Mon logement est une passoire thermique, que faire ?",
    shortAnswer: "Un logement classé F ou G au DPE est une passoire thermique. Commencez par un audit énergétique (obligatoire pour la vente), puis priorisez l'isolation et le chauffage. Les aides couvrent jusqu'à 90 % des travaux pour les ménages modestes.",
    detailedAnswer: [
      "Une passoire thermique est un logement classé F ou G au DPE, soit une consommation supérieure à 330 kWh/m²/an. En France, 5,2 millions de logements sont concernés. Ces logements sont progressivement interdits à la location : les G depuis 2025, les F à partir de 2028.",
      "La première étape est de réaliser un audit énergétique (300 à 800 €). Cet audit, obligatoire pour vendre un logement classé F ou G, propose un parcours de travaux chiffré pour atteindre au minimum la classe C. Il identifie les déperditions majeures et priorise les interventions.",
      "Les travaux prioritaires sont généralement dans cet ordre : isolation de la toiture (30 % des pertes), isolation des murs (25 %), remplacement des fenêtres (15 %), puis changement du système de chauffage. Une rénovation globale est plus efficace que des travaux par geste.",
      "Le parcours accompagné MaPrimeRénov offre les aides les plus importantes : jusqu'à 63 000 € pour une rénovation globale atteignant 2 classes de gain. Les ménages très modestes peuvent voir 90 % des travaux financés. Un accompagnateur Rénov (Mon Accompagnateur Rénov) est obligatoire pour ce parcours."
    ],
    category: "urgence",
    relatedService: "isolation-thermique",
    tags: ["passoire thermique", "DPE", "rénovation", "isolation", "aides"],
  },

  // ============================================================
  // PRIX / TARIFS — High volume (5 questions)
  // ============================================================
  {
    slug: "prix-renovation-maison-m2",
    question: "Quel est le prix de rénovation d'une maison au m² ?",
    shortAnswer: "Le prix de rénovation d'une maison varie de 250 à 600 €/m² pour un rafraîchissement, 600 à 1 200 €/m² pour une rénovation complète et 1 200 à 2 000 €/m² pour une rénovation lourde avec restructuration.",
    detailedAnswer: [
      "Le coût de rénovation dépend de l'ampleur des travaux. Un rafraîchissement (peinture, sols, petite électricité) coûte 250 à 600 €/m². Une rénovation complète (salle de bain, cuisine, électricité, plomberie) revient à 600 à 1 200 €/m². Une rénovation lourde avec restructuration atteint 1 200 à 2 000 €/m².",
      "Pour une maison de 100 m², comptez donc entre 25 000 et 60 000 € pour un rafraîchissement, 60 000 à 120 000 € pour une rénovation complète et 120 000 à 200 000 € pour une rénovation intégrale. Les prix varient de 20 à 40 % selon la région.",
      "Les postes les plus coûteux sont la charpente/toiture (15 000 à 30 000 €), la mise aux normes électriques (8 000 à 15 000 €), la plomberie complète (10 000 à 20 000 €) et l'isolation globale (15 000 à 30 000 €). Demandez des devis détaillés poste par poste.",
      "Pour maîtriser le budget, faites réaliser un diagnostic complet avant de chiffrer. Prévoyez une marge de 10 à 15 % pour les imprévus (problèmes structurels, amiante, mises aux normes). Comparez au moins 3 devis et vérifiez les assurances décennales des artisans."
    ],
    category: "prix",
    relatedService: "macon",
    tags: ["rénovation", "maison", "prix au m²", "budget", "travaux"],
  },
  {
    slug: "prix-extension-maison-m2",
    question: "Combien coûte une extension de maison au m² ?",
    shortAnswer: "Une extension de maison coûte entre 1 200 et 2 500 €/m² pour une construction traditionnelle, 1 000 à 1 800 €/m² en ossature bois et 2 000 à 3 500 €/m² pour une surélévation. Les prix incluent le gros œuvre et le second œuvre.",
    detailedAnswer: [
      "Le prix d'une extension dépend du type de construction. Une extension en parpaing ou brique coûte 1 200 à 2 500 €/m², une extension à ossature bois 1 000 à 1 800 €/m² et une véranda 800 à 2 500 €/m². La surélévation, plus complexe, atteint 2 000 à 3 500 €/m².",
      "Pour une extension de 20 m² (la plus courante), le budget se situe entre 24 000 et 50 000 € en construction traditionnelle. Ce prix comprend les fondations, le gros œuvre, la toiture, l'isolation, les menuiseries, l'électricité et la plomberie. La finition intérieure peut être réalisée soi-même pour économiser.",
      "Les démarches administratives varient selon la surface : une déclaration préalable suffit pour moins de 20 m² (40 m² en zone urbaine avec PLU). Au-delà, un permis de construire est requis. Si la surface totale dépasse 150 m² après extension, le recours à un architecte est obligatoire.",
      "Pour optimiser le budget, choisissez une extension de plain-pied (moins chère que la surélévation), privilégiez l'ossature bois (chantier plus rapide, donc moins de main-d'œuvre) et anticipez les raccordements aux réseaux existants. Un architecte peut proposer des solutions créatives à budget maîtrisé."
    ],
    category: "prix",
    relatedService: "macon",
    tags: ["extension", "maison", "prix au m²", "agrandissement", "construction"],
  },
  {
    slug: "prix-veranda-2026",
    question: "Quel est le prix d'une véranda en 2026 ?",
    shortAnswer: "Une véranda coûte entre 15 000 et 50 000 € en 2026, soit 800 à 2 500 €/m². Le prix dépend du matériau (PVC, aluminium, bois), de la surface et du vitrage. Une véranda en aluminium de 15 m² revient à 20 000-35 000 €.",
    detailedAnswer: [
      "Le prix d'une véranda varie selon le matériau : le PVC est le moins cher (800 à 1 200 €/m²) mais limité en dimensions, l'aluminium offre le meilleur rapport qualité-prix (1 200 à 2 000 €/m²), le bois est chaleureux mais demande de l'entretien (1 500 à 2 500 €/m²) et l'acier/fer forgé est le plus coûteux (2 000 à 3 500 €/m²).",
      "Pour une véranda standard de 15 m² en aluminium avec double vitrage, comptez 20 000 à 35 000 € tout compris (dalle, structure, vitrage, électricité). Le triple vitrage et les stores intégrés ajoutent 15 à 25 % au budget mais améliorent considérablement le confort thermique.",
      "La forme du toit influence aussi le prix : un toit plat est 10 à 15 % moins cher qu'un toit à pentes. La véranda bioclimatique, avec lames orientables et ventilation naturelle, représente un surcoût de 30 % mais offre un confort optimal en toutes saisons.",
      "Une déclaration préalable de travaux est nécessaire pour une véranda de moins de 20 m² (40 m² en zone PLU). Au-delà, un permis de construire est requis. Attention : une véranda augmente la surface habitable et donc la taxe foncière. Demandez au moins 3 devis avec visite technique obligatoire."
    ],
    category: "prix",
    relatedService: "menuisier",
    tags: ["véranda", "prix", "aluminium", "vitrage", "2026"],
  },
  {
    slug: "prix-salle-de-bain-complete",
    question: "Combien coûte une rénovation complète de salle de bain ?",
    shortAnswer: "Une rénovation complète de salle de bain coûte entre 5 000 et 15 000 € pour une salle de bain standard (4-6 m²). Le budget monte à 15 000-25 000 € pour une salle de bain haut de gamme avec douche à l'italienne et meuble sur mesure.",
    detailedAnswer: [
      "Le budget d'une rénovation de salle de bain dépend de la surface et du niveau de finition. Pour une salle de bain de 4 à 6 m² : comptez 5 000 à 8 000 € en entrée de gamme (baignoire acrylique, meuble vasque basique, carrelage standard), 8 000 à 15 000 € en milieu de gamme et 15 000 à 25 000 € en haut de gamme.",
      "Les postes principaux sont : la plomberie et l'évacuation (1 500 à 3 000 €), le carrelage murs et sol avec pose (2 000 à 5 000 €), la douche ou baignoire (500 à 3 000 €), le meuble vasque (300 à 2 000 €) et la robinetterie (200 à 1 000 €). La dépose de l'ancienne salle de bain ajoute 500 à 1 500 €.",
      "La douche à l'italienne est la tendance forte mais coûte plus cher : 2 500 à 5 000 € avec receveur extra-plat et paroi en verre. Elle nécessite un sol parfaitement étanché (système d'étanchéité SPEC). Alternative économique : le receveur de douche posé au sol, 30 % moins cher.",
      "Pour économiser sans sacrifier la qualité, conservez les arrivées d'eau au même emplacement (déplacer la plomberie coûte 1 000 à 3 000 € de plus). Posez le carrelage vous-même si vous êtes bricoleur et confiez la plomberie et l'électricité à des professionnels certifiés."
    ],
    category: "prix",
    relatedService: "salle-de-bain",
    tags: ["salle de bain", "rénovation", "prix", "douche italienne", "budget"],
  },
  {
    slug: "prix-cuisine-equipee-pose",
    question: "Quel budget pour une cuisine équipée avec pose ?",
    shortAnswer: "Une cuisine équipée avec pose coûte entre 5 000 et 12 000 € en entrée de gamme, 12 000 à 25 000 € en milieu de gamme et 25 000 à 50 000 € en haut de gamme. La pose représente 15 à 25 % du budget total.",
    detailedAnswer: [
      "Le budget total dépend de la gamme choisie. En entrée de gamme (grandes surfaces de bricolage) : 5 000 à 12 000 € pour une cuisine de 6 à 8 mètres linéaires avec électroménager basique. En milieu de gamme (cuisinistes) : 12 000 à 25 000 €. En haut de gamme (sur mesure) : 25 000 à 50 000 € et plus.",
      "La pose professionnelle coûte entre 1 500 et 5 000 € selon la complexité : installation des meubles, raccordements électriques et plomberie, pose du plan de travail et de la crédence. Comptez 1 à 3 jours de pose pour une cuisine standard, 3 à 5 jours pour une cuisine avec îlot central.",
      "Les postes de dépense principaux sont : les meubles et façades (40 % du budget), le plan de travail (10 à 20 %, de 200 €/ml en stratifié à 800 €/ml en granit), l'électroménager (15 à 30 %) et la pose (15 à 25 %). Le plan de travail en quartz ou Dekton offre un excellent rapport durabilité/prix.",
      "Pour optimiser votre budget : commandez pendant les promotions saisonnières (janvier et septembre), comparez cuisinistes indépendants et grandes enseignes, et négociez la pose incluse dans le devis global. Vérifiez que le devis inclut bien les finitions (plinthes, joints silicone, raccords) pour éviter les surcoûts."
    ],
    category: "prix",
    relatedService: "cuisiniste",
    tags: ["cuisine équipée", "pose", "prix", "budget", "cuisiniste"],
  },

  // ============================================================
  // CHOIX / PRATIQUE (2 questions)
  // ============================================================
  {
    slug: "comment-choisir-artisan-rge",
    question: "Comment choisir un artisan RGE fiable ?",
    shortAnswer: "Vérifiez la certification RGE sur france-renov.gouv.fr, contrôlez l'assurance décennale et les avis clients, puis comparez au moins 3 devis détaillés. Privilégiez les artisans locaux avec des chantiers de référence visitables.",
    detailedAnswer: [
      "Commencez par vérifier la certification RGE sur l'annuaire officiel france-renov.gouv.fr. Assurez-vous que la certification couvre bien le type de travaux souhaité (il existe différentes qualifications : QualiPAC pour les pompes à chaleur, QualiSol pour le solaire, etc.) et qu'elle est en cours de validité.",
      "Contrôlez les documents obligatoires : assurance responsabilité civile professionnelle, assurance décennale (couvrant les 10 ans après travaux), immatriculation au registre des métiers et numéro SIRET actif. Demandez des copies et vérifiez-les auprès des assureurs si nécessaire.",
      "Consultez les avis clients sur plusieurs plateformes (Google, Pages Jaunes, forums spécialisés) et demandez des références de chantiers similaires. Un artisan sérieux acceptera de vous montrer des réalisations récentes ou de vous mettre en contact avec d'anciens clients satisfaits.",
      "Comparez au moins 3 devis détaillés ligne par ligne : marques et références des matériaux, coûts de main-d'œuvre, délais de réalisation, conditions de paiement. Méfiez-vous des prix anormalement bas et des demandes d'acompte supérieures à 30 %. Un artisan fiable ne vous pressera jamais de signer."
    ],
    category: "choix",
    relatedService: "renovation-energetique",
    tags: ["artisan RGE", "choisir", "vérification", "confiance", "devis"],
  },
  {
    slug: "devis-travaux-que-verifier",
    question: "Que vérifier sur un devis de travaux avant de signer ?",
    shortAnswer: "Vérifiez les mentions légales obligatoires (SIRET, assurance), le détail des prestations, les matériaux avec références précises, le prix TTC, les délais et les conditions de paiement. Un devis flou est un signal d'alerte.",
    detailedAnswer: [
      "Un devis conforme doit comporter les mentions légales obligatoires : nom et adresse de l'entreprise, numéro SIRET, assurance décennale avec nom de l'assureur et numéro de police, date de validité du devis, et la mention manuscrite \"Devis reçu avant l'exécution des travaux\".",
      "Le détail des prestations doit être exhaustif : chaque poste de travaux décrit précisément, quantités et surfaces, marques et références exactes des matériaux, prix unitaires et prix global. Méfiez-vous des lignes vagues comme \"travaux divers\" ou \"fournitures\" sans précision.",
      "Vérifiez les conditions financières : le prix TTC final (avec taux de TVA applicable : 10 % pour la rénovation, 5,5 % pour la rénovation énergétique, 20 % pour le neuf), l'échéancier de paiement (jamais plus de 30 % d'acompte), et les pénalités de retard éventuelles.",
      "Contrôlez les délais : date de début et durée prévisionnelle des travaux, conditions de report, et clause de réception des travaux. Comparez le devis avec les prix moyens du marché et n'hésitez pas à demander des clarifications avant de signer. Un artisan sérieux expliquera chaque ligne sans hésiter."
    ],
    category: "choix",
    relatedService: "macon",
    tags: ["devis", "vérification", "travaux", "mentions légales", "prix"],
  },

  // ============================================================
  // DIY (2 questions)
  // ============================================================
  {
    slug: "installer-borne-recharge-soi-meme",
    question: "Peut-on installer une borne de recharge soi-même ?",
    shortAnswer: "Non, l'installation d'une borne de recharge de plus de 3,7 kW doit obligatoirement être réalisée par un électricien qualifié IRVE (Infrastructure de Recharge pour Véhicule Électrique). Seule une prise renforcée peut être installée soi-même.",
    detailedAnswer: [
      "La réglementation française impose qu'une borne de recharge (wallbox) de plus de 3,7 kW soit installée par un électricien qualifié IRVE. Cette obligation, inscrite dans le décret n°2017-26, vise à garantir la sécurité électrique et la conformité de l'installation. En cas de non-respect, votre assurance pourrait refuser de couvrir un sinistre.",
      "Seule alternative en autoconstruction : la prise renforcée de type Green'Up, limitée à 3,7 kW (soit environ 20 km d'autonomie par heure de charge). Elle se branche sur un circuit dédié en 2,5 mm² avec un disjoncteur 20A. C'est une solution suffisante pour un usage quotidien de moins de 50 km.",
      "Une wallbox 7,4 kW (monophasé) ou 22 kW (triphasé) installée par un professionnel IRVE coûte entre 1 200 et 2 500 € tout compris. Le crédit d'impôt couvre 75 % du coût dans la limite de 300 € par point de charge. En copropriété, le droit à la prise permet de faire installer une borne à ses frais.",
      "Pour choisir votre installateur IRVE, consultez le site qualifelec.fr ou l'annuaire ADVENIR. Vérifiez que la qualification IRVE est en cours de validité et que l'installateur propose bien une mise en service avec attestation de conformité Consuel."
    ],
    category: "diy",
    relatedService: "borne-recharge",
    tags: ["borne recharge", "voiture électrique", "IRVE", "installation", "réglementation"],
  },
  {
    slug: "isoler-combles-soi-meme",
    question: "Peut-on isoler ses combles soi-même ?",
    shortAnswer: "Oui, l'isolation des combles perdus par soufflage ou déroulage de laine minérale est accessible aux bricoleurs. Comptez 10-20 €/m² en matériaux. Attention : vous perdez le droit aux aides MaPrimeRénov et CEE sans artisan RGE.",
    detailedAnswer: [
      "L'isolation des combles perdus est l'un des travaux les plus accessibles en autoconstruction. Le déroulage de laine de verre ou laine de roche en rouleaux est simple : il suffit de poser deux couches croisées (minimum 30 cm d'épaisseur, R ≥ 7) sur le plancher des combles. Le coût des matériaux seuls est de 10 à 20 €/m².",
      "Les précautions indispensables : portez un masque FFP2, des lunettes et des gants car les fibres de laine minérale sont irritantes. Vérifiez que le plancher des combles supporte le poids de l'isolant. Ne comprimez jamais l'isolant (cela réduit son efficacité). Laissez une lame d'air de 2 cm sous la couverture pour la ventilation.",
      "Attention aux points techniques : traitez les ponts thermiques autour des gaines et des trappes d'accès. Maintenez un écart de 5 cm autour des conduits de cheminée (avec un écran pare-feu). Posez un pare-vapeur côté chauffé si le plancher n'est pas étanche à l'air.",
      "Le principal inconvénient du DIY est la perte des aides financières. MaPrimeRénov et les CEE exigent un artisan RGE. Or, une isolation des combles par un professionnel RGE coûte 20 à 50 €/m², largement couverte par les aides (parfois à 100 % pour les ménages modestes). Faites le calcul avant de vous lancer."
    ],
    category: "diy",
    relatedService: "isolation-thermique",
    tags: ["isolation", "combles", "DIY", "laine de verre", "autoconstruction"],
  },

  // ============================================================
  // URGENCE (1 question)
  // ============================================================
  {
    slug: "fuite-gaz-que-faire",
    question: "Fuite de gaz : que faire en urgence ?",
    shortAnswer: "En cas de fuite de gaz : n'actionnez aucun interrupteur, ouvrez les fenêtres, fermez le robinet de gaz, évacuez le logement et appelez le numéro d'urgence GrDF au 0 800 47 33 33 (gratuit, 24h/24) depuis l'extérieur.",
    detailedAnswer: [
      "Si vous sentez une odeur de gaz (le gaz naturel est volontairement odorisé au mercaptan), réagissez immédiatement sans paniquer. Règle n°1 : ne provoquez aucune étincelle. N'allumez pas la lumière, n'utilisez pas d'interrupteur, ne branchez et ne débranchez rien, n'utilisez pas votre téléphone à l'intérieur.",
      "Aérez immédiatement en ouvrant en grand les fenêtres et les portes pour créer un courant d'air. Si vous pouvez accéder au compteur de gaz en toute sécurité, fermez le robinet d'arrêt (tournez-le perpendiculairement au tuyau). Évacuez tous les occupants du logement, y compris les animaux.",
      "Une fois à l'extérieur et à distance du bâtiment, appelez le numéro d'urgence GrDF : 0 800 47 33 33 (gratuit, disponible 24h/24). Un technicien interviendra dans l'heure pour sécuriser l'installation. En cas de malaise ou si la fuite est importante, appelez aussi les pompiers (18) ou le SAMU (15).",
      "Après l'intervention d'urgence, faites contrôler l'intégralité de votre installation par un chauffagiste certifié PG (Professionnel du Gaz). Un entretien annuel de la chaudière gaz est obligatoire et permet de détecter les fuites avant qu'elles ne deviennent dangereuses. Le coût d'un contrôle complet est de 100 à 200 €."
    ],
    category: "urgence",
    relatedService: "chauffagiste",
    tags: ["fuite de gaz", "urgence", "sécurité", "GrDF", "évacuation"],
  },

  // ============================================================
  // AJOUT 10 QUESTIONS — Keyword gaps (mars 2026)
  // ============================================================
  {
    slug: "permis-construire-quand-necessaire",
    question: "Quand faut-il un permis de construire ?",
    shortAnswer: "Un permis de construire est obligatoire pour toute construction de plus de 20 m² de surface de plancher (ou 40 m² en zone urbaine avec PLU). Les extensions, surélévations et changements de destination importants sont également concernés.",
    detailedAnswer: [
      "Le permis de construire est exigé dès que la surface de plancher créée dépasse 20 m². En zone urbaine couverte par un Plan Local d\"Urbanisme (PLU), ce seuil est relevé à 40 m² pour les extensions d\"un bâtiment existant, à condition que la surface totale après travaux ne dépasse pas 150 m².",
      "Au-delà de 150 m² de surface totale, le recours à un architecte est obligatoire. Cela concerne aussi les constructions neuves dès le premier mètre carré de surface de plancher. Les travaux modifiant la structure porteuse ou la façade d\"un bâtiment classé nécessitent également un permis.",
      "Les délais d\"instruction sont de 2 mois pour une maison individuelle et de 3 mois pour les autres projets. En secteur protégé (ABF, monuments historiques), ajoutez 1 mois supplémentaire. Le permis est valable 3 ans, prorogeable deux fois 1 an.",
      "Commencer des travaux sans permis expose à une amende de 1 200 à 6 000 €/m² construit et à une obligation de démolition. Faites vérifier votre projet par un maçon ou un architecte avant de déposer le dossier en mairie. La consultation du PLU est gratuite et accessible en ligne sur le géoportail de l\"urbanisme."
    ],
    category: "reglementation",
    relatedService: "macon",
    tags: ["permis de construire", "urbanisme", "réglementation", "PLU", "surface"],
  },
  {
    slug: "declaration-prealable-travaux-quand",
    question: "Quand faut-il une déclaration préalable de travaux ?",
    shortAnswer: "Une déclaration préalable (DP) est requise pour les travaux créant entre 5 et 20 m² de surface (40 m² en zone PLU), les modifications de façade, les changements de fenêtres, les ravalement et les clôtures. Le délai d\"instruction est d\"un mois.",
    detailedAnswer: [
      "La déclaration préalable de travaux est une autorisation d\"urbanisme simplifiée, nécessaire pour les travaux de petite envergure. Elle concerne les constructions nouvelles créant entre 5 et 20 m² de surface de plancher (ou 40 m² en zone PLU), les modifications de l\"aspect extérieur (ravalement, changement de fenêtres, volets, toiture) et les changements de destination sans modification de structure.",
      "Le formulaire Cerfa n°13703 est à déposer en mairie en 2 exemplaires (4 en secteur protégé). Les pièces obligatoires incluent un plan de situation, un plan de masse, un plan en coupe, une notice descriptive et des photos. La mairie dispose d\"un mois pour instruire la demande (2 mois en secteur ABF).",
      "L\"absence de réponse dans le délai vaut accord tacite (non-opposition). Cependant, demandez toujours un certificat de non-opposition pour sécuriser votre situation. Affichez la déclaration sur le terrain pendant toute la durée des travaux et au minimum 2 mois après achèvement.",
      "Les travaux dispensés de toute formalité sont ceux créant moins de 5 m² de surface, les constructions temporaires de moins de 3 mois et les piscines de moins de 10 m². En copropriété, la DP ne dispense pas de l\"accord du syndic. Consultez un maçon ou un architecte en cas de doute sur la démarche applicable."
    ],
    category: "reglementation",
    relatedService: "macon",
    tags: ["déclaration préalable", "urbanisme", "travaux", "mairie", "Cerfa"],
  },
  {
    slug: "comment-deboucher-wc-sans-ventouse",
    question: "Comment déboucher un WC sans ventouse ?",
    shortAnswer: "Sans ventouse, versez un mélange d\"eau bouillante et de liquide vaisselle dans la cuvette, laissez agir 15 min puis tirez la chasse. Alternatives : bicarbonate + vinaigre blanc, cintre métallique déplié, ou bouteille en plastique découpée comme piston.",
    detailedAnswer: [
      "La méthode la plus simple consiste à verser un demi-flacon de liquide vaisselle dans la cuvette, puis à ajouter lentement 2 à 3 litres d\"eau très chaude (pas bouillante pour ne pas fissurer la porcelaine). Le liquide vaisselle lubrifie le bouchon tandis que la chaleur dissout les graisses. Attendez 15 à 20 minutes puis tirez la chasse d\"eau.",
      "Le mélange bicarbonate de soude et vinaigre blanc est une alternative efficace. Versez un demi-verre de bicarbonate dans la cuvette, ajoutez un verre de vinaigre blanc et laissez la réaction chimique agir pendant 30 minutes. La mousse effervescente décompose les matières organiques. Complétez avec de l\"eau chaude et tirez la chasse.",
      "Pour un bouchon plus tenace, fabriquez un piston de fortune avec une bouteille en plastique de 1,5 L : découpez le fond, gardez le bouchon vissé, et utilisez-la comme une ventouse en effectuant des mouvements de va-et-vient énergiques dans la cuvette. Un cintre métallique déplié peut aussi servir à casser un bouchon solide, mais procédez avec précaution pour ne pas rayer l\"émail.",
      "Si le bouchon résiste à toutes ces méthodes, il se situe probablement dans la canalisation principale et nécessite l\"intervention d\"un plombier avec un furet professionnel ou un hydrocureur. Comptez 100 à 300 € pour un débouchage mécanique. Pour prévenir les bouchons, ne jetez jamais de lingettes, cotons-tiges ou serviettes hygiéniques dans les WC."
    ],
    category: "diy",
    relatedService: "plombier",
    tags: ["WC", "débouchage", "DIY", "astuces", "plomberie"],
  },
  {
    slug: "prix-renovation-electrique-appartement",
    question: "Combien coûte une rénovation électrique complète ?",
    shortAnswer: "Une rénovation électrique complète coûte entre 80 et 150 €/m² selon l\"état de l\"installation existante. Pour un appartement de 70 m², comptez 6 000 à 12 000 € TTC, incluant tableau, câblage, prises, interrupteurs et mise aux normes NF C 15-100.",
    detailedAnswer: [
      "Le coût d\"une rénovation électrique complète dépend de la surface du logement, de l\"état de l\"installation existante et du niveau de prestation souhaité. En moyenne, comptez 80 à 120 €/m² pour une mise aux normes standard et 120 à 150 €/m² si l\"installation est vétuste (câbles en tissu, absence de terre, tableau à fusibles porcelaine).",
      "Les principaux postes de dépense sont : le tableau électrique (800 à 2 500 € selon le nombre de rangées), le câblage complet (30 à 50 €/m²), les prises et interrupteurs (15 à 40 € pièce posée) et la mise à la terre (500 à 1 500 €). Ajoutez 500 à 1 000 € pour le passage Consuel obligatoire en rénovation lourde.",
      "La norme NF C 15-100 impose un nombre minimum de prises par pièce (5 dans le séjour, 3 dans les chambres), des circuits dédiés pour les gros appareils (four, lave-linge, plaques), un dispositif différentiel 30 mA et un ETEL (Espace Technique Électrique du Logement). Le non-respect de cette norme rend l\"installation non-conforme et peut poser des problèmes à la revente.",
      "La TVA est à 10 % pour les logements de plus de 2 ans. Pour réduire la facture, regroupez la rénovation électrique avec d\"autres travaux (peinture, plomberie). Choisissez un électricien certifié Qualifelec et demandez l\"attestation de conformité Consuel en fin de chantier. Comparez au moins 3 devis détaillés poste par poste."
    ],
    category: "prix",
    relatedService: "electricien",
    tags: ["rénovation électrique", "prix", "NF C 15-100", "mise aux normes", "électricien"],
  },
  {
    slug: "chauffe-eau-thermodynamique-ou-electrique",
    question: "Chauffe-eau thermodynamique ou électrique : lequel choisir ?",
    shortAnswer: "Le chauffe-eau thermodynamique consomme 3 fois moins d\"énergie qu\"un cumulus électrique classique, mais coûte 2 500 à 4 500 € contre 500 à 1 500 €. Il est rentabilisé en 4 à 6 ans grâce aux économies sur la facture et aux aides MaPrimeRénov\".",
    detailedAnswer: [
      "Le chauffe-eau électrique à accumulation (cumulus) reste le choix le plus répandu grâce à son prix d\"achat bas (500 à 1 500 € posé) et sa simplicité d\"installation. Il chauffe l\"eau par une résistance électrique et fonctionne généralement en heures creuses pour limiter le coût. Sa durée de vie est de 10 à 15 ans.",
      "Le chauffe-eau thermodynamique (CET) utilise une pompe à chaleur intégrée pour capter les calories de l\"air ambiant. Son COP (coefficient de performance) de 2,5 à 3,5 signifie qu\"il produit 2,5 à 3,5 kWh de chaleur pour 1 kWh d\"électricité consommé. Résultat : une facture d\"eau chaude divisée par 3, soit 100 à 150 € d\"économie par an pour un foyer de 4 personnes.",
      "Le CET nécessite une pièce non chauffée d\"au moins 10 m³ (garage, cellier, buanderie) car il refroidit l\"air ambiant de 3 à 5°C. Il est légèrement plus bruyant qu\"un cumulus classique (40 à 50 dB). Son coût d\"achat (2 500 à 4 500 € posé) est partiellement compensé par MaPrimeRénov\" (jusqu\"à 1 200 €) et les CEE (100 à 300 €).",
      "Pour un logement neuf (RE2020), le CET est quasiment obligatoire pour respecter les exigences énergétiques. En rénovation, il est pertinent si vous avez une pièce adaptée et une consommation d\"eau chaude suffisante (3+ personnes). Pour un studio ou un T2 avec 1-2 occupants, le cumulus classique reste souvent plus rentable."
    ],
    category: "choix",
    relatedService: "plombier",
    tags: ["chauffe-eau", "thermodynamique", "cumulus", "économie énergie", "MaPrimeRénov"],
  },
  {
    slug: "pompe-chaleur-air-eau-ou-air-air",
    question: "PAC air-eau ou air-air : quelle différence ?",
    shortAnswer: "La PAC air-eau chauffe un circuit d\"eau (radiateurs, plancher chauffant) et produit l\"eau chaude sanitaire. La PAC air-air diffuse de l\"air chaud via des splits et sert aussi de climatisation. La PAC air-eau est éligible aux aides MaPrimeRénov\", pas la PAC air-air.",
    detailedAnswer: [
      "La pompe à chaleur air-eau capte les calories de l\"air extérieur et les transfère à un circuit d\"eau. Elle alimente les radiateurs existants (basse température de préférence), un plancher chauffant et peut produire l\"eau chaude sanitaire. Son coût installé va de 10 000 à 18 000 € et elle est éligible à MaPrimeRénov\" (jusqu\"à 5 000 €) et aux CEE.",
      "La pompe à chaleur air-air (aussi appelée climatisation réversible) capte les calories de l\"air extérieur et les diffuse directement sous forme d\"air chaud via des unités intérieures (splits muraux ou gainable). En été, elle inverse le cycle pour rafraîchir. Son coût est de 3 000 à 8 000 € pour un système multi-split. Elle n\"est pas éligible à MaPrimeRénov\".",
      "En termes de performance, les deux technologies ont un COP similaire (3 à 4). Cependant, la PAC air-eau offre un confort thermique supérieur grâce à la chaleur douce et homogène du plancher chauffant ou des radiateurs basse température. La PAC air-air peut créer des courants d\"air et des écarts de température entre les pièces.",
      "Le choix dépend de votre situation. Si vous avez des radiateurs à eau ou un plancher chauffant, la PAC air-eau est le choix logique. Si vous êtes en tout-électrique avec des convecteurs et que vous souhaitez aussi la climatisation, la PAC air-air est plus économique à installer. Dans tous les cas, faites appel à un installateur certifié RGE QualiPAC."
    ],
    category: "choix",
    relatedService: "pompe-a-chaleur",
    tags: ["pompe à chaleur", "PAC air-eau", "PAC air-air", "chauffage", "climatisation"],
  },
  {
    slug: "depannage-plomberie-nuit-weekend",
    question: "Dépannage plomberie nuit et week-end : quel tarif ?",
    shortAnswer: "Un dépannage plomberie de nuit ou le week-end coûte 150 à 500 € selon l\"intervention. Les majorations sont de 50 à 100 % par rapport au tarif normal. Exigez un devis écrit avant toute intervention et méfiez-vous des tarifs excessifs pratiqués par certains dépanneurs.",
    detailedAnswer: [
      "Les plombiers appliquent des majorations légales en dehors des heures ouvrables. Le soir (après 19h) et le samedi après-midi, la majoration est généralement de 25 à 50 %. La nuit (après 22h), le dimanche et les jours fériés, elle atteint 50 à 100 %. Un déplacement d\"urgence de nuit coûte 80 à 150 € avant même le début de l\"intervention.",
      "Les tarifs courants en urgence : débouchage de canalisation (200 à 450 €), réparation de fuite (150 à 400 €), remplacement de robinet d\"arrêt (180 à 350 €), dégorgement de WC (150 à 350 €). Ces prix incluent le déplacement et la main-d\"œuvre mais pas toujours les pièces détachées.",
      "Attention aux arnaques fréquentes dans le dépannage d\"urgence. Méfiez-vous des numéros surtaxés, des tarifs annoncés par téléphone sans rapport avec la facture finale, et des « forfaits recherche de panne » facturés plusieurs centaines d\"euros. Un plombier sérieux vous fournit un devis écrit avant de commencer et ne vous pousse jamais à signer sous pression.",
      "En cas d\"urgence la nuit, commencez par couper l\"arrivée d\"eau au robinet général (sous l\"évier ou au compteur) pour limiter les dégâts. Si la fuite est maîtrisée, vous pouvez attendre le lendemain pour appeler un plombier aux tarifs normaux. Gardez le numéro d\"un plombier de confiance recommandé par votre entourage plutôt que de chercher en urgence sur Internet."
    ],
    category: "prix",
    relatedService: "plombier",
    tags: ["dépannage", "urgence", "plombier", "tarif nuit", "week-end"],
  },
  {
    slug: "renovation-cuisine-combien-temps",
    question: "Combien de temps dure une rénovation de cuisine ?",
    shortAnswer: "Une rénovation de cuisine complète dure 3 à 6 semaines en moyenne. Un simple remplacement de meubles prend 1 à 2 semaines. Les délais les plus longs concernent la commande des meubles sur mesure (4 à 8 semaines) et les travaux de plomberie/électricité.",
    detailedAnswer: [
      "La durée d\"une rénovation de cuisine dépend de l\"ampleur des travaux. Un rafraîchissement simple (peinture, crédence, remplacement de l\"électroménager) prend 3 à 5 jours. Le remplacement complet des meubles avec réutilisation des arrivées d\"eau et prises existantes nécessite 1 à 2 semaines de pose.",
      "Pour une rénovation complète incluant la modification des réseaux (déplacement de l\"évier, ajout d\"un lave-vaisselle, création de prises supplémentaires), comptez 3 à 6 semaines de travaux. Le planning type : 1 semaine de démolition et préparation, 1 semaine de plomberie et électricité, 1 semaine de carrelage et peinture, puis 1 à 2 semaines de pose des meubles et finitions.",
      "Le délai le plus long est souvent la fabrication des meubles. Les cuisines sur mesure nécessitent 4 à 8 semaines de fabrication après la commande. Les cuisines en kit (Ikea, Leroy Merlin) sont disponibles sous 1 à 2 semaines. Prévoyez la commande bien en avance et validez les mesures avec le cuisiniste avant le lancement.",
      "Pour minimiser la gêne, installez un coin cuisine provisoire (plaque portable, micro-ondes, réfrigérateur) dans une autre pièce. Coordonnez les différents corps de métier (plombier, électricien, carreleur, cuisiniste) en amont pour éviter les temps morts. Un maître d\"œuvre ou un cuisiniste sérieux gère cette coordination pour vous."
    ],
    category: "prix",
    relatedService: "cuisiniste",
    tags: ["rénovation cuisine", "durée travaux", "planning", "cuisiniste", "délai"],
  },
  {
    slug: "difference-devis-facture",
    question: "Quelle différence entre un devis et une facture ?",
    shortAnswer: "Le devis est un document précontractuel décrivant les travaux et leur prix avant exécution. La facture est le document comptable émis après réalisation des travaux. Le devis signé vaut contrat et engage les deux parties sur le prix et les prestations.",
    detailedAnswer: [
      "Le devis est une proposition commerciale détaillée qui engage l\"artisan sur un prix et des prestations. Il doit mentionner obligatoirement : la date, l\"identité de l\"entreprise (SIRET, assurance), la description détaillée des travaux, le prix unitaire et total HT et TTC, le taux de TVA, la durée de validité de l\"offre et les conditions de paiement. Un devis signé par le client vaut contrat.",
      "La facture est un document comptable émis après l\"exécution des travaux. Elle reprend les éléments du devis et ajoute la date d\"exécution, le numéro de facture et les éventuels acomptes déjà versés. La facture doit correspondre au devis signé : l\"artisan ne peut pas facturer plus que le montant du devis sauf si un avenant a été signé pour des travaux supplémentaires.",
      "Un devis est obligatoire pour les travaux de dépannage, réparation et entretien dans le bâtiment dès que le montant estimé dépasse 150 € TTC (arrêté du 24 janvier 2017). En dessous de ce seuil, l\"artisan doit quand même informer le client du prix avant intervention. Les devis sont gratuits sauf mention préalable du contraire (visite technique facturée par exemple).",
      "Conservez vos devis signés et factures pendant au moins 10 ans (garantie décennale). En cas de litige, le devis signé fait foi : si l\"artisan a facturé plus que le devis sans avenant, vous pouvez contester. En cas de désaccord, saisissez le médiateur de la consommation dont les coordonnées doivent figurer sur la facture."
    ],
    category: "reglementation",
    relatedService: "macon",
    tags: ["devis", "facture", "réglementation", "contrat", "artisan"],
  },
  {
    slug: "climatisation-reversible-avantages",
    question: "Quels sont les avantages d\"une climatisation réversible ?",
    shortAnswer: "La climatisation réversible chauffe en hiver et rafraîchit en été avec un seul appareil. Son COP de 3 à 4 signifie qu\"elle produit 3 à 4 kWh de chaleur pour 1 kWh d\"électricité consommé, soit 60 à 70 % d\"économies par rapport à un radiateur électrique.",
    detailedAnswer: [
      "La climatisation réversible (pompe à chaleur air-air) est un système 2-en-1 qui assure le chauffage en hiver et la climatisation en été. En mode chauffage, elle capte les calories de l\"air extérieur (même par 0°C) et les restitue à l\"intérieur. En mode froid, elle inverse le cycle pour évacuer la chaleur intérieure vers l\"extérieur.",
      "L\"avantage économique est majeur : avec un COP de 3 à 4, la clim réversible consomme 3 à 4 fois moins d\"électricité qu\"un convecteur pour la même quantité de chaleur produite. Pour un logement de 80 m² chauffé par des radiateurs électriques classiques (2 000 €/an), le passage à une PAC air-air réduit la facture à 600-800 €/an.",
      "L\"installation d\"un système multi-split (une unité extérieure + 3 à 5 unités intérieures) coûte 4 000 à 10 000 € selon la puissance et le nombre de pièces. Les modèles gainables (invisibles, intégrés dans les faux plafonds) sont plus esthétiques mais plus chers (8 000 à 15 000 €). L\"entretien annuel obligatoire coûte 120 à 200 €.",
      "Les inconvénients à connaître : un léger bruit du groupe extérieur (à éloigner des chambres et des voisins), une baisse de performance sous -7°C (un chauffage d\"appoint peut être nécessaire), et l\"utilisation de fluides frigorigènes réglementés. Le confort est excellent avec les modèles Inverter récents qui ajustent la puissance en continu et filtrent l\"air (anti-allergènes, déshumidification)."
    ],
    category: "choix",
    relatedService: "climaticien",
    tags: ["climatisation réversible", "PAC air-air", "chauffage", "économies", "confort"],
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
