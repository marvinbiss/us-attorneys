/**
 * Données pour les pages de comparaison.
 * 30 comparatifs détaillés pour aider les propriétaires français à choisir.
 */

export interface ComparisonOption {
  name: string
  avantages: string[]
  inconvenients: string[]
  prixMoyen: string
  dureeVie: string
  idealPour: string
}

export interface Comparison {
  slug: string
  title: string
  metaDescription: string
  intro: string
  options: ComparisonOption[]
  verdict: string
  criteresChoix: string[]
  faq: { question: string; answer: string }[]
  category: string
}

export const comparisons: Comparison[] = [
  {
    slug: 'pompe-a-chaleur-vs-chaudiere-gaz',
    title: 'Pompe à chaleur vs Chaudière gaz : quel chauffage choisir ?',
    metaDescription:
      'Comparatif complet pompe à chaleur vs chaudière gaz en 2026 : prix, rendement, aides, durée de vie. Découvrez quelle solution de chauffage est la plus adaptée à votre logement.',
    intro:
      "Le choix du système de chauffage est l'une des décisions les plus importantes lors d'une rénovation ou d'une construction. La pompe à chaleur (PAC) et la chaudière gaz restent les deux solutions les plus installées en France. Chacune présente des atouts spécifiques selon votre logement, votre budget et vos objectifs énergétiques.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'Pompe à chaleur air/eau',
        avantages: [
          'COP moyen de 3 à 4 : pour 1 kWh consommé, 3 à 4 kWh de chaleur produits',
          'Éligible à MaPrimeRénov\' 2026 (jusqu\'à 5 000 €) et CEE',
          'Peut assurer le chauffage ET la production d\'eau chaude sanitaire',
          'Fonctionne à l\'électricité décarbonée (nucléaire + renouvelable en France)',
          'Réversible en climatisation pour les modèles air/air',
          'Aucune émission de CO₂ directe sur site',
        ],
        inconvenients: [
          'Investissement initial élevé (8 000 à 18 000 € pose comprise)',
          'Performance réduite en dessous de -7 °C (appoint électrique nécessaire)',
          'Unité extérieure parfois bruyante (40-55 dB selon les modèles)',
          'Nécessite une bonne isolation du logement pour être rentable',
          'Entretien obligatoire tous les 2 ans par un professionnel certifié',
        ],
        prixMoyen: '8 000 € - 18 000 €',
        dureeVie: '15-20 ans',
        idealPour: 'Maisons bien isolées, climat tempéré, propriétaires éligibles aux aides',
      },
      {
        name: 'Chaudière gaz à condensation',
        avantages: [
          'Coût d\'installation modéré (3 000 à 7 000 € pose comprise)',
          'Rendement élevé (jusqu\'à 109 % sur PCI grâce à la condensation)',
          'Fonctionne par tous les temps, y compris grand froid',
          'Technologie éprouvée et maîtrisée par tous les chauffagistes',
          'Compatible avec les radiateurs existants sans modification',
          'Montée en température rapide',
        ],
        inconvenients: [
          'Énergie fossile : émissions de CO₂ (environ 230 g/kWh)',
          'Prix du gaz en hausse constante (+50 % entre 2021 et 2025)',
          'Interdite dans les constructions neuves depuis la RE2020 (2022)',
          'Entretien annuel obligatoire (150 à 250 €/an)',
          'Non éligible à MaPrimeRénov\' depuis 2023',
          'Raccordement au réseau de gaz nécessaire',
        ],
        prixMoyen: '3 000 € - 7 000 €',
        dureeVie: '15-25 ans',
        idealPour: 'Logements anciens raccordés au gaz, budget limité, zones très froides',
      },
    ],
    verdict:
      "En 2026, la pompe à chaleur est le choix le plus pertinent pour la majorité des propriétaires français grâce aux aides financières et au coût d'exploitation réduit. Son surcoût initial est amorti en 5 à 8 ans par les économies d'énergie. La chaudière gaz reste pertinente uniquement pour les logements mal isolés en zone froide ou lorsque le budget initial est très contraint. À long terme, le renchérissement du gaz et la fiscalité carbone rendent la PAC systématiquement plus avantageuse.",
    criteresChoix: [
      'Niveau d\'isolation de votre logement (DPE)',
      'Zone climatique (températures hivernales moyennes)',
      'Budget initial disponible et éligibilité aux aides',
      'Présence ou non d\'un raccordement gaz existant',
      'Type d\'émetteurs existants (radiateurs haute ou basse température)',
      'Objectif de revente du bien (valorisation DPE)',
    ],
    faq: [
      {
        question: 'Peut-on remplacer une chaudière gaz par une pompe à chaleur ?',
        answer:
          'Oui, c\'est même l\'un des remplacements les plus courants en rénovation. La PAC air/eau se raccorde directement sur le circuit de chauffage existant (radiateurs ou plancher chauffant). Il faut prévoir l\'installation d\'une unité extérieure et vérifier que l\'installation électrique supporte la puissance requise. Le chantier dure 2 à 4 jours en moyenne.',
      },
      {
        question: 'Quelles aides pour remplacer une chaudière gaz en 2026 ?',
        answer:
          'MaPrimeRénov\' 2026 accorde jusqu\'à 5 000 € pour l\'installation d\'une PAC air/eau en remplacement d\'une chaudière gaz, selon vos revenus. Les CEE (Certificats d\'Économie d\'Énergie) apportent 2 500 à 4 000 € supplémentaires. Le montant total des aides peut couvrir 50 à 70 % du coût pour les ménages modestes.',
      },
      {
        question: 'Une pompe à chaleur fonctionne-t-elle quand il fait très froid ?',
        answer:
          'Les PAC récentes fonctionnent jusqu\'à -15 °C voire -25 °C pour les modèles haut de gamme. Cependant, le COP diminue avec la température : il passe de 4 à 15 °C à environ 2 à -7 °C. En dessous de -10 °C, un appoint électrique intégré prend le relais. En zone de montagne, une PAC géothermique ou un système hybride PAC + chaudière peut être préférable.',
      },
      {
        question: 'Quel est le coût annuel de chauffage PAC vs gaz ?',
        answer:
          'Pour une maison de 120 m² moyennement isolée, le coût annuel de chauffage est d\'environ 900 à 1 200 € avec une PAC air/eau contre 1 500 à 2 200 € avec une chaudière gaz à condensation (tarifs 2026). L\'écart se creuse chaque année avec l\'augmentation du prix du gaz.',
      },
    ],
  },
  {
    slug: 'fenetre-pvc-vs-aluminium-vs-bois',
    title: 'Fenêtre PVC vs Aluminium vs Bois : quel matériau choisir ?',
    metaDescription:
      'Comparatif fenêtres PVC, aluminium et bois en 2026 : prix, isolation, entretien, esthétique. Guide complet pour bien choisir vos menuiseries.',
    intro:
      "Le choix du matériau de vos fenêtres impacte directement l'isolation thermique, l'esthétique et la valeur de votre logement. PVC, aluminium et bois ont chacun leurs points forts. Ce comparatif vous aide à trancher en fonction de votre budget, de votre style architectural et de vos exigences de performance.",
    category: 'Menuiserie',
    options: [
      {
        name: 'Fenêtre PVC',
        avantages: [
          'Meilleur rapport qualité/prix du marché',
          'Excellente isolation thermique (Uw jusqu\'à 0,9 W/m².K)',
          'Aucun entretien : ne se peint pas, ne rouille pas, ne pourrit pas',
          'Large choix de coloris et de finitions (imitation bois incluse)',
          'Très bon isolant acoustique',
          'Recyclable à 100 % en fin de vie',
        ],
        inconvenients: [
          'Profilés plus épais qui réduisent la surface vitrée',
          'Aspect parfois jugé moins noble que le bois ou l\'alu',
          'Interdit en secteur classé Monuments Historiques (certains ABF)',
          'Dilatation légère en cas de forte chaleur',
          'Choix de couleurs foncées limité (risque de déformation thermique)',
        ],
        prixMoyen: '300 € - 800 € / fenêtre',
        dureeVie: '30-40 ans',
        idealPour: 'Budget maîtrisé, rénovation, maisons contemporaines',
      },
      {
        name: 'Fenêtre aluminium',
        avantages: [
          'Profilés très fins : maximum de luminosité et de surface vitrée',
          'Esthétique moderne et haut de gamme',
          'Extrêmement résistant à la corrosion et aux intempéries',
          'Idéal pour les grandes baies vitrées et les formes sur mesure',
          'Aucun entretien (nettoyage à l\'eau savonneuse)',
          'Recyclable à l\'infini sans perte de qualité',
        ],
        inconvenients: [
          'Prix 30 à 50 % plus élevé que le PVC',
          'Isolation thermique inférieure si absence de rupture de pont thermique',
          'Conducteur thermique naturel (nécessite RPT de qualité)',
          'Condensation possible sur les modèles entrée de gamme',
        ],
        prixMoyen: '500 € - 1 200 € / fenêtre',
        dureeVie: '30-50 ans',
        idealPour: 'Maisons contemporaines, grandes ouvertures, bord de mer',
      },
      {
        name: 'Fenêtre bois',
        avantages: [
          'Matériau noble et chaleureux, esthétique traditionnelle',
          'Excellente isolation thermique naturelle',
          'Accepté par les ABF en secteur classé et monuments historiques',
          'Matériau renouvelable et biosourcé (bilan carbone positif)',
          'Réparable et personnalisable (peinture, lasure)',
          'Très bonne performance acoustique',
        ],
        inconvenients: [
          'Entretien régulier obligatoire (lasure ou peinture tous les 5 à 10 ans)',
          'Prix élevé, surtout en bois exotique ou sur mesure',
          'Sensible à l\'humidité, aux insectes xylophages et aux champignons',
          'Plus lourd que le PVC ou l\'alu (contrainte de pose)',
        ],
        prixMoyen: '600 € - 1 500 € / fenêtre',
        dureeVie: '40-60 ans (avec entretien)',
        idealPour: 'Maisons anciennes, secteurs protégés, amateurs de matériaux naturels',
      },
    ],
    verdict:
      "Le PVC reste le choix le plus rationnel pour la majorité des rénovations : excellent rapport qualité/prix et zéro entretien. L'aluminium s'impose pour les projets contemporains nécessitant de grandes surfaces vitrées. Le bois est incontournable en secteur classé et pour les amateurs de matériaux nobles, à condition d'accepter un entretien régulier. Le mixte bois/alu combine le meilleur des deux mondes mais à un prix premium (800 à 1 800 € par fenêtre).",
    criteresChoix: [
      'Budget global (fourniture + pose)',
      'Style architectural de votre maison',
      'Contraintes urbanistiques (ABF, secteur classé)',
      'Niveau d\'isolation thermique recherché',
      'Volonté ou non d\'entretenir les menuiseries',
      'Exposition au vent, à la pluie ou au sel marin',
    ],
    faq: [
      {
        question: 'Quelle fenêtre isole le mieux du froid ?',
        answer:
          'En termes d\'isolation thermique pure, le bois et le PVC sont quasiment équivalents (Uw de 0,9 à 1,3 W/m².K pour du double vitrage). L\'aluminium est légèrement moins performant sauf avec une rupture de pont thermique (RPT) de qualité. Le triple vitrage améliore les performances de 15 à 20 % quel que soit le matériau, mais son surcoût n\'est rentable qu\'en zone climatique froide (H1).',
      },
      {
        question: 'Peut-on poser des fenêtres PVC en copropriété ?',
        answer:
          'Oui, à condition de respecter le règlement de copropriété et les exigences de l\'ABF si le bâtiment est en secteur protégé. En pratique, la plupart des copropriétés imposent une couleur extérieure uniforme (souvent blanc ou gris) mais autorisent le PVC. Vérifiez auprès de votre syndic avant de commander.',
      },
      {
        question: 'Combien de temps dure le remplacement de fenêtres ?',
        answer:
          'Le remplacement d\'une fenêtre standard prend 2 à 4 heures par ouverture en rénovation (pose en applique sur dormant existant) et 4 à 6 heures en dépose totale. Pour une maison de 10 fenêtres, comptez 2 à 3 jours de chantier. La pose en dépose totale offre de meilleures performances mais coûte 20 à 30 % de plus.',
      },
    ],
  },
  {
    slug: 'isolation-interieure-vs-exterieure',
    title: 'Isolation par l\'intérieur vs par l\'extérieur : que choisir ?',
    metaDescription:
      'ITI vs ITE : comparatif complet isolation intérieure et extérieure en 2026. Prix au m², performance thermique, avantages et inconvénients de chaque méthode.',
    intro:
      "L'isolation thermique est le premier levier pour réduire vos factures d'énergie et améliorer votre DPE. Deux grandes méthodes s'affrontent : l'isolation par l'intérieur (ITI) et l'isolation par l'extérieur (ITE). Le choix dépend de votre budget, de l'architecture de votre maison et de vos objectifs de performance.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'Isolation par l\'intérieur (ITI)',
        avantages: [
          'Coût 2 à 3 fois inférieur à l\'ITE (30 à 80 €/m²)',
          'Pas besoin d\'autorisation d\'urbanisme',
          'Réalisable pièce par pièce (travaux progressifs)',
          'Préserve l\'aspect extérieur de la façade (patrimoine)',
          'Compatible avec tous les types de bâtiments',
          'Chantier plus rapide (1 à 2 semaines pour un logement)',
        ],
        inconvenients: [
          'Perte de surface habitable (5 à 7 % en moyenne)',
          'Ne traite pas les ponts thermiques structurels (planchers, murs de refend)',
          'Nécessite de déplacer les prises, interrupteurs et radiateurs',
          'Perturbation de l\'inertie thermique du bâtiment',
          'Travaux intérieurs : logement difficilement habitable pendant le chantier',
        ],
        prixMoyen: '30 € - 80 € / m²',
        dureeVie: '25-40 ans',
        idealPour: 'Appartements, budgets serrés, bâtiments classés',
      },
      {
        name: 'Isolation par l\'extérieur (ITE)',
        avantages: [
          'Traitement efficace de tous les ponts thermiques',
          'Aucune perte de surface habitable',
          'Conservation de l\'inertie thermique des murs (confort été comme hiver)',
          'Ravalement de façade inclus (deux travaux en un)',
          'Performance thermique supérieure (gain de 2 classes DPE possible)',
          'Logement habitable pendant les travaux',
        ],
        inconvenients: [
          'Coût élevé (100 à 200 €/m² en enduit, 150 à 300 €/m² en bardage)',
          'Déclaration préalable de travaux obligatoire (modification de façade)',
          'Impossible ou très complexe en copropriété mixte',
          'Modifie l\'aspect extérieur (interdit dans certains secteurs ABF)',
          'Nécessite un échafaudage et un accès périphérique complet',
          'Traitement spécifique des appuis de fenêtres et volets',
        ],
        prixMoyen: '100 € - 250 € / m²',
        dureeVie: '30-50 ans',
        idealPour: 'Maisons individuelles, rénovations globales, objectif DPE A ou B',
      },
    ],
    verdict:
      "L'ITE est la solution la plus performante sur le plan thermique et la meilleure pour valoriser votre bien, mais son coût élevé la réserve aux rénovations globales ou aux maisons individuelles éligibles aux aides. L'ITI reste le choix pragmatique pour les appartements, les budgets limités et les bâtiments dont la façade ne peut être modifiée. Dans l'idéal, combinez ITI (murs de refend) et ITE (façades exposées) pour un résultat optimal.",
    criteresChoix: [
      'Budget total disponible pour l\'isolation',
      'Type de logement (maison individuelle ou copropriété)',
      'Contraintes architecturales et urbanistiques (ABF, PLU)',
      'Surface habitable actuelle (marge de perte acceptable ?)',
      'Objectif DPE visé (passage de F à D vs passage de D à B)',
      'Travaux de façade déjà prévus (ravalement obligatoire)',
    ],
    faq: [
      {
        question: 'Quelle épaisseur d\'isolant faut-il prévoir ?',
        answer:
          'En ITI, 12 à 16 cm de laine de verre ou de roche (R ≥ 3,7 m².K/W pour bénéficier des aides). En ITE, 14 à 20 cm de polystyrène expansé ou de laine de roche (R ≥ 3,7). Pour viser la RE2020 en rénovation, il faut atteindre R ≥ 4,5 soit 18 à 22 cm d\'isolant performant.',
      },
      {
        question: 'L\'ITE est-elle éligible à MaPrimeRénov\' en 2026 ?',
        answer:
          'Oui, l\'ITE des murs est éligible à MaPrimeRénov\' 2026 avec un montant de 40 à 75 €/m² selon vos revenus (plafonné à 100 m²). L\'ITI est également éligible mais à un montant inférieur (15 à 25 €/m²). Dans les deux cas, les travaux doivent être réalisés par un artisan RGE.',
      },
      {
        question: 'Peut-on isoler par l\'extérieur un mur en pierre ?',
        answer:
          'C\'est possible mais déconseillé dans certains cas. Les murs en pierre anciens \"respirent\" grâce à leur perméabilité à la vapeur d\'eau. Une ITE mal conçue peut piéger l\'humidité et provoquer des désordres. Il faut utiliser des isolants perspirants (fibre de bois, laine de chanvre) et non du polystyrène. Un diagnostic humidité préalable est indispensable.',
      },
    ],
  },
  {
    slug: 'carrelage-vs-parquet-vs-vinyle',
    title: 'Carrelage vs Parquet vs Vinyle : quel revêtement de sol choisir ?',
    metaDescription:
      'Comparatif carrelage, parquet et sol vinyle en 2026 : prix, durabilité, entretien, pièces adaptées. Guide pour choisir votre revêtement de sol.',
    intro:
      "Le choix du revêtement de sol influence le confort, l'esthétique et la valeur de votre logement. Carrelage, parquet massif ou contrecollé, et sol vinyle (LVT) couvrent 90 % du marché résidentiel français. Ce comparatif vous aide à déterminer la meilleure option pièce par pièce.",
    category: 'Revêtements',
    options: [
      {
        name: 'Carrelage (grès cérame)',
        avantages: [
          'Durabilité exceptionnelle : résiste aux rayures, à l\'eau et à l\'usure',
          'Compatible avec le chauffage au sol (meilleure conductivité)',
          'Entretien minimal (eau + produit neutre)',
          'Très large choix de formats, couleurs et effets (bois, pierre, béton)',
          'Résistant à l\'humidité : idéal salle de bain et cuisine',
          'Ne se décolore pas à la lumière UV',
        ],
        inconvenients: [
          'Froid au toucher (sauf avec chauffage au sol)',
          'Pose complexe et coûteuse (ragréage, colle, joints)',
          'Dur sous les pieds : inconfort en position debout prolongée',
          'Bruyant (transmission des bruits d\'impact)',
          'Difficile à remplacer en cas de casse (nécessité de stock)',
        ],
        prixMoyen: '25 € - 100 € / m² (fourniture + pose)',
        dureeVie: '30-50 ans',
        idealPour: 'Pièces humides, rez-de-chaussée, maisons avec chauffage au sol',
      },
      {
        name: 'Parquet (massif ou contrecollé)',
        avantages: [
          'Chaleur et noblesse du bois naturel',
          'Parquet massif ponçable 5 à 8 fois (durée de vie de 50 à 100 ans)',
          'Bon isolant thermique et acoustique naturel',
          'Valorise fortement le bien immobilier (+5 à 10 % de valeur estimée)',
          'Vieillissement esthétique (patine naturelle)',
          'Contrecollé compatible chauffage au sol basse température',
        ],
        inconvenients: [
          'Sensible à l\'eau : inadapté aux pièces humides sans traitement spécifique',
          'Entretien régulier (huile ou vitrification tous les 5 à 10 ans)',
          'Prix élevé en massif (60 à 150 €/m² posé)',
          'Sensible aux rayures (griffes d\'animaux, talons)',
          'Variations dimensionnelles selon l\'hygrométrie (joints de dilatation)',
        ],
        prixMoyen: '40 € - 150 € / m² (fourniture + pose)',
        dureeVie: '25-100 ans (selon type)',
        idealPour: 'Séjour, chambres, pièces de vie, logements haut de gamme',
      },
      {
        name: 'Sol vinyle / LVT (Luxury Vinyl Tile)',
        avantages: [
          'Prix très accessible (15 à 50 €/m² posé)',
          'Pose rapide en clipsable (pas de colle, pas de ragréage si sol plan)',
          'Confortable sous les pieds (souple et silencieux)',
          'Résistant à l\'eau : convient à toutes les pièces y compris salle de bain',
          'Grand choix de décors réalistes (imitation bois, pierre, béton)',
          'Facile à remplacer (lame par lame en clipsable)',
        ],
        inconvenients: [
          'Durée de vie limitée (10 à 25 ans selon la gamme)',
          'Non ponçable : impossible à rénover, il faut remplacer',
          'Qualité très variable selon le fabricant et le prix',
          'Peut se décolorer sous exposition UV prolongée',
          'Empreinte environnementale (matière PVC, recyclage limité)',
          'Ne valorise pas le bien autant qu\'un vrai parquet',
        ],
        prixMoyen: '15 € - 50 € / m² (fourniture + pose)',
        dureeVie: '10-25 ans',
        idealPour: 'Locations, budget serré, rénovations rapides, toutes pièces',
      },
    ],
    verdict:
      "Le carrelage grès cérame est le choix roi pour les pièces humides et le rez-de-chaussée, surtout avec un chauffage au sol. Le parquet contrecollé offre le meilleur compromis chaleur/prix pour le séjour et les chambres. Le vinyle LVT est imbattable pour les petits budgets et les locations. La tendance 2026 : combiner carrelage (cuisine/SdB) et parquet contrecollé (séjour/chambres) pour un résultat élégant et fonctionnel.",
    criteresChoix: [
      'Pièce de destination (humide ou sèche)',
      'Présence d\'un chauffage au sol',
      'Budget fourniture + pose',
      'Usage (famille avec enfants, animaux, location)',
      'Durée de détention prévue du logement',
      'Exigence esthétique et valorisation immobilière',
    ],
    faq: [
      {
        question: 'Peut-on poser du parquet dans une salle de bain ?',
        answer:
          'C\'est possible avec un parquet massif en bois exotique (teck, ipé) naturellement résistant à l\'eau, ou un parquet contrecollé avec couche d\'usure en bois exotique et joints pontés. Cependant, le carrelage ou le vinyle LVT restent plus adaptés et moins risqués pour les pièces humides. En cas de parquet en SdB, une ventilation efficace (VMC) est indispensable.',
      },
      {
        question: 'Le carrelage effet bois est-il une bonne alternative au parquet ?',
        answer:
          'Oui, le grès cérame effet bois est devenu très réaliste (texture, veines, format lame). Il combine la durabilité du carrelage et l\'esthétique du bois. Son défaut reste le toucher froid et la dureté sous les pieds. Comptez 30 à 80 €/m² posé pour un résultat convaincant, contre 50 à 100 €/m² pour un vrai parquet contrecollé.',
      },
      {
        question: 'Quel sol choisir avec des animaux de compagnie ?',
        answer:
          'Le carrelage grès cérame est le plus résistant aux griffures. Le vinyle LVT de classe 33 ou 34 offre un bon compromis (souple, résistant, silencieux). Le parquet vitrifié résiste mieux que le parquet huilé mais se raye inévitablement avec de gros chiens. Évitez le parquet massif huilé en finition claire si vous avez des animaux.',
      },
    ],
  },
  {
    slug: 'chaudiere-gaz-vs-electrique-vs-pac',
    title: 'Chaudière gaz vs Électrique vs PAC : comparatif chauffage 2026',
    metaDescription:
      'Comparatif chaudière gaz, chauffage électrique et pompe à chaleur en 2026 : coûts, consommation, aides, avantages. Quel système de chauffage choisir ?',
    intro:
      "En 2026, trois grandes familles de chauffage dominent le marché résidentiel français : la chaudière gaz, le chauffage électrique (radiateurs à inertie, plancher chauffant) et la pompe à chaleur. Chaque technologie a ses forces et ses limites selon la taille du logement, son isolation et votre budget.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'Chaudière gaz à condensation',
        avantages: [
          'Installation rapide sur réseau existant',
          'Rendement excellent (jusqu\'à 109 % sur PCI)',
          'Confort thermique élevé avec montée en température rapide',
          'Compatible tous types d\'émetteurs (radiateurs, plancher chauffant)',
          'Technologie mature et fiable',
        ],
        inconvenients: [
          'Interdite dans le neuf depuis la RE2020',
          'Prix du gaz en hausse constante',
          'Émissions de CO₂ significatives',
          'Entretien annuel obligatoire (150-250 €)',
          'Non éligible aux aides depuis 2023',
        ],
        prixMoyen: '3 000 € - 7 000 €',
        dureeVie: '15-25 ans',
        idealPour: 'Rénovation avec réseau gaz existant, grands volumes',
      },
      {
        name: 'Chauffage électrique (radiateurs à inertie)',
        avantages: [
          'Investissement initial le plus faible (200-800 € par radiateur posé)',
          'Aucun entretien ni contrat de maintenance',
          'Installation simple sans réseau de tuyauterie',
          'Pilotage précis pièce par pièce (programmation, détection de fenêtre ouverte)',
          'Aucune émission sur site, pas de risque de fuite de gaz',
        ],
        inconvenients: [
          'Coût d\'exploitation élevé (prix du kWh électrique : ~0,27 €)',
          'Facture annuelle la plus élevée pour les grandes surfaces',
          'Confort moindre que l\'eau chaude (chaleur sèche)',
          'Nécessite une très bonne isolation pour être viable',
          'Réseau électrique à dimensionner (puissance suffisante)',
        ],
        prixMoyen: '1 500 € - 5 000 € (logement complet)',
        dureeVie: '15-20 ans',
        idealPour: 'Petits logements bien isolés, résidences secondaires, budgets d\'installation serrés',
      },
      {
        name: 'Pompe à chaleur air/eau',
        avantages: [
          'Coût d\'exploitation le plus bas (COP 3 à 4)',
          'Éligible aux aides MaPrimeRénov\' + CEE (jusqu\'à 9 000 € au total)',
          'Chauffage + eau chaude sanitaire en un seul appareil',
          'Énergie décarbonée',
          'Valorise le DPE du logement (gain de 1 à 2 classes)',
        ],
        inconvenients: [
          'Investissement initial le plus élevé',
          'Bruit de l\'unité extérieure (nuisances possibles en mitoyenneté)',
          'Performance réduite sous -7 °C',
          'Entretien bisannuel obligatoire',
          'Nécessite un logement correctement isolé pour être rentable',
        ],
        prixMoyen: '8 000 € - 18 000 €',
        dureeVie: '15-20 ans',
        idealPour: 'Maisons individuelles, rénovations globales, propriétaires éligibles aux aides',
      },
    ],
    verdict:
      "La PAC air/eau est la solution la plus économique à long terme pour les maisons individuelles bien isolées, avec un retour sur investissement en 5 à 8 ans grâce aux aides. Le chauffage électrique à inertie convient aux petits logements (studios, T2) et aux résidences secondaires. La chaudière gaz reste compétitive en rénovation lorsqu'un réseau gaz existe et que le budget initial est limité, mais sa pertinence diminue d'année en année face à la hausse du gaz.",
    criteresChoix: [
      'Surface du logement et nombre de pièces',
      'Niveau d\'isolation (classe DPE actuelle)',
      'Raccordement gaz existant ou non',
      'Budget d\'investissement initial',
      'Éligibilité aux aides (revenus du foyer)',
      'Type de logement (maison individuelle, copropriété)',
    ],
    faq: [
      {
        question: 'Quel chauffage consomme le moins ?',
        answer:
          'La pompe à chaleur air/eau consomme 2 à 3 fois moins d\'énergie qu\'une chaudière gaz et 3 à 4 fois moins qu\'un chauffage électrique direct, grâce à son COP de 3 à 4. Pour 10 000 kWh de chaleur produite, une PAC consomme ~2 800 kWh d\'électricité (soit ~750 €), contre ~10 000 kWh de gaz (~1 100 €) ou ~10 000 kWh d\'électricité (~2 700 €).',
      },
      {
        question: 'Peut-on combiner PAC et chauffage électrique ?',
        answer:
          'Oui, c\'est même courant en rénovation. La PAC assure le chauffage central (eau chaude dans les radiateurs) et des radiateurs électriques d\'appoint complètent dans les pièces éloignées du circuit hydraulique. Certaines PAC intègrent une résistance électrique d\'appoint qui s\'active automatiquement en cas de grand froid.',
      },
      {
        question: 'Faut-il changer les radiateurs en passant au gaz ou à la PAC ?',
        answer:
          'Pas nécessairement. Les radiateurs en fonte ou en acier existants sont compatibles avec une chaudière gaz ou une PAC haute température (65-80 °C). Pour une PAC basse température (35-45 °C), plus économique, il peut être nécessaire de remplacer les radiateurs par des modèles basse température ou d\'installer un plancher chauffant.',
      },
    ],
  },
  {
    slug: 'toiture-tuiles-vs-ardoise-vs-zinc',
    title: 'Toiture tuiles vs ardoise vs zinc : quel matériau de couverture choisir ?',
    metaDescription:
      'Comparatif couverture toiture tuiles, ardoise et zinc en 2026 : prix au m², durée de vie, entretien, esthétique. Guide pour choisir votre couverture.',
    intro:
      "La couverture de toiture protège votre maison pendant des décennies. Tuiles (terre cuite ou béton), ardoise naturelle et zinc sont les trois matériaux dominants en France, chacun associé à des traditions régionales et architecturales spécifiques. Ce comparatif vous aide à choisir en connaissance de cause.",
    category: 'Structure',
    options: [
      {
        name: 'Tuiles (terre cuite ou béton)',
        avantages: [
          'Matériau le plus répandu en France (70 % des toitures)',
          'Large gamme de formes (canal, plate, romane, mécanique) et couleurs',
          'Bonne résistance aux intempéries et au gel',
          'Prix accessible (40 à 80 €/m² posé en terre cuite)',
          'Remplacement unitaire facile en cas de casse',
          'Terre cuite recyclable et naturelle',
        ],
        inconvenients: [
          'Poids important (40 à 70 kg/m²) nécessitant une charpente solide',
          'Mousse et lichen : nettoyage nécessaire tous les 5 à 10 ans',
          'Pente minimale requise (selon le type de tuile)',
          'Fragile en cas de grêle ou de chocs',
          'Variations de teinte entre lots et dans le temps',
        ],
        prixMoyen: '40 € - 100 € / m² (fourniture + pose)',
        dureeVie: '30-50 ans (béton) / 50-100 ans (terre cuite)',
        idealPour: 'Majorité des régions françaises, budgets modérés, toitures en pente',
      },
      {
        name: 'Ardoise naturelle',
        avantages: [
          'Durée de vie exceptionnelle (80 à 150 ans pour l\'ardoise d\'Angers)',
          'Esthétique haut de gamme, élégante et intemporelle',
          'Résistante au feu (classement A1, incombustible)',
          'Ne mousse pas et ne se décolore pratiquement pas',
          'Légère par rapport à la tuile (25 à 35 kg/m²)',
          'Valorise fortement le patrimoine immobilier',
        ],
        inconvenients: [
          'Prix élevé (80 à 150 €/m² posé en ardoise naturelle)',
          'Pose spécialisée : peu de couvreurs maîtrisent la technique du crochet',
          'Fragile aux chocs directs (remplacement unitaire délicat)',
          'Ardoises d\'importation (Espagne, Brésil) de qualité variable',
          'Non adaptée aux toitures à faible pente (< 40 %)',
        ],
        prixMoyen: '80 € - 150 € / m² (fourniture + pose)',
        dureeVie: '80-150 ans',
        idealPour: 'Bretagne, Normandie, Val de Loire, bâtiments patrimoniaux, haut de gamme',
      },
      {
        name: 'Zinc (joint debout ou tasseaux)',
        avantages: [
          'Parfaitement étanche : idéal pour les toitures à faible pente (≥ 5 %)',
          'Durée de vie élevée (50 à 100 ans)',
          'Esthétique contemporaine, patine grise naturelle avec le temps',
          'Très léger (5 à 7 kg/m²) — pas de contrainte sur la charpente',
          'Pas d\'entretien (auto-nettoyant grâce à la patine)',
          '100 % recyclable',
        ],
        inconvenients: [
          'Coût élevé (80 à 160 €/m² posé en joint debout)',
          'Pose par un zingueur qualifié (soudure et façonnage sur mesure)',
          'Sensible à la corrosion en environnement acide ou salin',
          'Bruyant par temps de pluie (sans isolation acoustique adaptée)',
          'Dilatation importante nécessitant des joints de dilatation',
        ],
        prixMoyen: '80 € - 160 € / m² (fourniture + pose)',
        dureeVie: '50-100 ans',
        idealPour: 'Toitures plates ou faible pente, architecture contemporaine, extensions, Paris/Haussmann',
      },
    ],
    verdict:
      "La tuile terre cuite reste le choix standard et économique pour la majorité des maisons en France. L'ardoise naturelle est le choix patrimonial par excellence, avec une durée de vie inégalée qui justifie son surcoût. Le zinc s'impose pour les toitures à faible pente et l'architecture contemporaine. Le choix doit aussi respecter les règles d'urbanisme locales (PLU) qui imposent souvent un type de couverture selon la région.",
    criteresChoix: [
      'Règles d\'urbanisme locales (PLU, ABF)',
      'Pente de la toiture existante ou projetée',
      'Budget disponible',
      'Style architectural souhaité',
      'Capacité portante de la charpente',
      'Zone climatique et exposition au vent',
    ],
    faq: [
      {
        question: 'Peut-on changer de type de couverture lors d\'une réfection ?',
        answer:
          'Techniquement oui, mais il faut vérifier que la charpente supporte le nouveau poids (passage du zinc à la tuile = multiplication du poids par 8). Il faut aussi respecter le PLU : dans de nombreuses communes, le type de couverture est imposé. Une déclaration préalable de travaux est obligatoire pour tout changement d\'aspect extérieur.',
      },
      {
        question: 'Quelle est la durée des travaux de toiture ?',
        answer:
          'Pour une maison de 100 m² de toiture : 1 à 2 semaines en tuiles, 2 à 3 semaines en ardoise (pose plus technique), 1 à 2 semaines en zinc. Ces délais incluent la dépose de l\'ancienne couverture, la vérification de la charpente, la pose de l\'écran sous-toiture et la mise en œuvre de la nouvelle couverture.',
      },
      {
        question: 'Faut-il un permis de construire pour refaire sa toiture ?',
        answer:
          'Non, une simple déclaration préalable de travaux suffit si vous ne modifiez pas la structure (même pente, même hauteur). Un permis de construire est nécessaire si vous surélevez la toiture, créez une terrasse sur toit ou modifiez la pente. En secteur protégé (ABF), l\'avis de l\'Architecte des Bâtiments de France est requis dans tous les cas.',
      },
    ],
  },
  {
    slug: 'volet-roulant-vs-battant-vs-persienne',
    title: 'Volet roulant vs battant vs persienne : lequel choisir ?',
    metaDescription:
      'Comparatif volets roulants, battants et persiennes en 2026 : prix, isolation, sécurité, esthétique. Guide complet pour choisir vos volets.',
    intro:
      "Les volets protègent votre logement du soleil, du froid et des intrusions. Volets roulants (électriques ou manuels), volets battants traditionnels et persiennes ont chacun des usages et des esthétiques bien distincts. Votre choix dépendra de vos priorités : confort, sécurité, style ou budget.",
    category: 'Menuiserie',
    options: [
      {
        name: 'Volet roulant (électrique)',
        avantages: [
          'Confort d\'utilisation maximal (commande murale, télécommande, domotique)',
          'Excellente isolation thermique (coffre isolé + lames remplies de mousse)',
          'Sécurité renforcée (blocage anti-relevage, verrou automatique)',
          'Discret : disparaît dans le coffre quand ouvert',
          'Programmation horaire et simulation de présence',
          'Compatible avec la domotique et les assistants vocaux',
        ],
        inconvenients: [
          'Prix élevé (400 à 1 200 € par fenêtre posé, motorisé)',
          'Installation du coffre parfois complexe en rénovation',
          'Panne moteur possible (remplacement 150-300 €)',
          'Entretien des lames et du mécanisme nécessaire',
          'Esthétique standardisée, peu adaptée aux maisons anciennes',
        ],
        prixMoyen: '400 € - 1 200 € / fenêtre (motorisé, posé)',
        dureeVie: '15-25 ans (moteur 10-15 ans)',
        idealPour: 'Maisons modernes, confort quotidien, sécurité renforcée, domotique',
      },
      {
        name: 'Volet battant (bois, alu ou PVC)',
        avantages: [
          'Esthétique traditionnelle et charme authentique',
          'Prix accessible (150 à 500 € par fenêtre posé)',
          'Pas de moteur : zéro risque de panne électrique',
          'Isolation correcte (surtout en bois massif)',
          'Accepté en secteur protégé et par les ABF',
          'Grande variété de matériaux et de finitions',
        ],
        inconvenients: [
          'Manipulation manuelle (ouvrir la fenêtre pour fermer les volets)',
          'Encombrement extérieur (débattement nécessaire)',
          'Volets bois : entretien régulier (peinture/lasure tous les 3-5 ans)',
          'Fixation murale parfois fragile sur isolation extérieure',
          'Isolation thermique inférieure aux roulants',
        ],
        prixMoyen: '150 € - 500 € / fenêtre (posé)',
        dureeVie: '20-40 ans (bois), 30-50 ans (alu)',
        idealPour: 'Maisons anciennes, secteurs classés, budgets modérés',
      },
      {
        name: 'Persienne (bois ou aluminium)',
        avantages: [
          'Ventilation naturelle même volets fermés (lames inclinées)',
          'Protection solaire efficace tout en laissant passer la lumière',
          'Esthétique méditerranéenne et provençale très recherchée',
          'Bonne protection contre les regards extérieurs',
          'Faible encombrement (repliables ou coulissantes)',
        ],
        inconvenients: [
          'Isolation thermique faible (lames non jointives)',
          'Sécurité limitée (faciles à forcer)',
          'Entretien des lames complexe (peinture, nettoyage)',
          'Prix élevé en bois massif (300 à 800 € la paire)',
          'Peu adaptées aux régions froides (isolation insuffisante)',
        ],
        prixMoyen: '300 € - 800 € / fenêtre (posé)',
        dureeVie: '25-40 ans',
        idealPour: 'Régions méditerranéennes, maisons de caractère, façades sud',
      },
    ],
    verdict:
      "Le volet roulant motorisé est le choix le plus confortable et le plus performant pour l'isolation et la sécurité, idéal pour les constructions neuves et les rénovations modernes. Le volet battant reste incontournable pour les maisons de caractère et les secteurs protégés. La persienne convient aux régions chaudes où la ventilation naturelle prime sur l'isolation thermique. En 2026, les volets roulants solaires (sans câblage électrique) offrent un excellent compromis en rénovation.",
    criteresChoix: [
      'Style architectural de la maison',
      'Contraintes urbanistiques (PLU, ABF)',
      'Budget par ouverture',
      'Priorité isolation vs ventilation',
      'Souhait de motorisation et domotique',
      'Zone climatique (froid vs chaud)',
    ],
    faq: [
      {
        question: 'Les volets roulants sont-ils éligibles aux aides en 2026 ?',
        answer:
          'Les volets roulants isolants peuvent être éligibles aux CEE (Certificats d\'Économie d\'Énergie) s\'ils respectent une résistance thermique minimale (R ≥ 0,22 m².K/W). Ils ne sont pas éligibles à MaPrimeRénov\' en tant que tels, sauf dans le cadre d\'un parcours de rénovation accompagnée. Comptez 15 à 30 € de prime CEE par volet.',
      },
      {
        question: 'Volet roulant manuel ou électrique ?',
        answer:
          'L\'écart de prix est de 100 à 250 € par volet. Le motorisé est vivement recommandé pour les fenêtres difficiles d\'accès, les personnes à mobilité réduite et pour profiter de la programmation horaire. Le volet roulant solaire est une alternative sans câblage électrique, idéale en rénovation (surcoût de 50 à 150 € vs filaire).',
      },
      {
        question: 'Peut-on motoriser des volets battants existants ?',
        answer:
          'Oui, des systèmes de motorisation pour volets battants existent (bras articulés motorisés). Comptez 500 à 1 000 € par fenêtre (fourniture + pose). Cependant, ces systèmes sont moins fiables et plus encombrants qu\'un volet roulant motorisé. Si votre budget le permet et que le PLU l\'autorise, le remplacement par des volets roulants est souvent plus pertinent.',
      },
    ],
  },
  {
    slug: 'peinture-mate-vs-satinee-vs-brillante',
    title: 'Peinture mate vs satinée vs brillante : quelle finition choisir ?',
    metaDescription:
      'Comparatif peinture mate, satinée et brillante en 2026 : rendu, entretien, pièces adaptées, prix. Guide pour choisir la bonne finition de peinture.',
    intro:
      "La finition de peinture détermine l'aspect final de vos murs et plafonds, mais aussi leur résistance et leur facilité d'entretien. Mate, satinée ou brillante : chaque finition a ses pièces de prédilection et ses contraintes. Voici comment choisir.",
    category: 'Revêtements',
    options: [
      {
        name: 'Peinture mate',
        avantages: [
          'Rendu velouté et élégant, haut de gamme',
          'Masque les imperfections du support (fissures, bosses)',
          'Pas de reflets lumineux : idéale pour les plafonds',
          'Ambiance feutrée et chaleureuse',
          'Disponible dans toutes les teintes y compris les couleurs sombres',
        ],
        inconvenients: [
          'Peu lessivable : les taches sont difficiles à nettoyer',
          'Marque facilement au toucher (traces de doigts visibles)',
          'Déconseillée dans les pièces humides (cuisine, SdB)',
          'Retouches visibles si la peinture a vieilli',
          'Durabilité moindre en zone de passage',
        ],
        prixMoyen: '3 € - 12 € / m² (peinture seule)',
        dureeVie: '5-8 ans',
        idealPour: 'Plafonds, chambres, salons, murs non exposés aux salissures',
      },
      {
        name: 'Peinture satinée',
        avantages: [
          'Polyvalente : convient à toutes les pièces de la maison',
          'Lessivable : les taches s\'effacent facilement à l\'éponge',
          'Léger reflet soyeux sans être brillant',
          'Résistante à l\'humidité (adaptée cuisine et SdB)',
          'Bon compromis esthétique/praticité',
          'Retouches plus discrètes qu\'en brillant',
        ],
        inconvenients: [
          'Met légèrement en évidence les défauts du support',
          'Nécessite une préparation soignée du mur (enduit, ponçage)',
          'Reflets visibles sous éclairage rasant',
          'Prix légèrement supérieur à la mate',
        ],
        prixMoyen: '4 € - 15 € / m² (peinture seule)',
        dureeVie: '8-12 ans',
        idealPour: 'Toutes pièces, familles avec enfants, pièces humides',
      },
      {
        name: 'Peinture brillante (laquée)',
        avantages: [
          'Ultra-lessivable : résiste aux nettoyages fréquents',
          'Effet miroir lumineux et contemporain',
          'Très résistante à l\'humidité et aux projections',
          'Idéale pour les boiseries, portes et moulures',
          'Amplifie la luminosité d\'une pièce',
        ],
        inconvenients: [
          'Met en évidence tous les défauts du support',
          'Application délicate (traces de rouleau visibles)',
          'Reflets éblouissants sous lumière directe',
          'Rendu jugé trop clinique pour de grandes surfaces murales',
          'Préparation du support irréprochable indispensable',
        ],
        prixMoyen: '5 € - 18 € / m² (peinture seule)',
        dureeVie: '10-15 ans',
        idealPour: 'Boiseries, portes, moulures, cuisines professionnelles, accents décoratifs',
      },
    ],
    verdict:
      "La satinée est le choix le plus polyvalent et le plus recommandé pour 80 % des surfaces de la maison. Optez pour la mate uniquement sur les plafonds et les murs de chambre/salon non exposés aux salissures. Réservez la brillante aux boiseries, portes et éléments décoratifs. En 2026, les peintures acryliques (phase aqueuse) sont à privilégier : faible teneur en COV, séchage rapide et nettoyage à l'eau.",
    criteresChoix: [
      'Pièce de destination (sèche ou humide)',
      'Présence d\'enfants ou d\'animaux',
      'État du support (lisse ou imparfait)',
      'Effet décoratif recherché',
      'Fréquence de nettoyage souhaitée',
    ],
    faq: [
      {
        question: 'Peut-on mélanger mate et satinée dans la même pièce ?',
        answer:
          'Oui, c\'est même la recommandation des décorateurs : mate au plafond pour éviter les reflets et satinée sur les murs pour la facilité d\'entretien. Dans les chambres d\'enfants, la satinée sur le bas du mur (1,20 m) et la mate au-dessus est un excellent compromis.',
      },
      {
        question: 'Combien de couches de peinture faut-il appliquer ?',
        answer:
          'En règle générale, 2 couches sont nécessaires après une sous-couche (primaire d\'accrochage). La brillante nécessite parfois 3 couches fines pour un rendu parfait. Sur un mur déjà peint de couleur similaire, 2 couches sans sous-couche peuvent suffire. Respectez toujours le temps de séchage entre couches indiqué par le fabricant.',
      },
      {
        question: 'Quel est le prix d\'un peintre professionnel en 2026 ?',
        answer:
          'Un peintre professionnel facture 25 à 45 €/m² (fourniture + pose, 2 couches) selon la région et la complexité. Soit 2 500 à 4 500 € pour repeindre un appartement de 70 m² (murs + plafonds). Demandez toujours un devis détaillé précisant le nombre de couches, la marque de peinture et la préparation du support incluse.',
      },
    ],
  },
  {
    slug: 'cloison-placo-vs-brique-vs-carreau-platre',
    title: 'Cloison placo vs brique vs carreau de plâtre : que choisir ?',
    metaDescription:
      'Comparatif cloisons placo (BA13), brique plâtrière et carreau de plâtre en 2026 : prix, isolation phonique, solidité, pose. Guide pour cloisonner vos pièces.',
    intro:
      "Créer ou déplacer une cloison intérieure est l'un des travaux les plus courants en rénovation. Plaque de plâtre (placo BA13), brique plâtrière et carreau de plâtre offrent des performances très différentes en termes d'isolation phonique, de solidité et de facilité de mise en œuvre.",
    category: 'Structure',
    options: [
      {
        name: 'Placo (BA13 sur ossature)',
        avantages: [
          'Mise en œuvre rapide (un plaquiste monte 15-25 m²/jour)',
          'Légèreté : 25 kg/m² (compatible tous planchers)',
          'Passage des gaines électriques dans l\'ossature, sans saignée',
          'Large gamme : hydrofuge (H1), phonique, coupe-feu',
          'Prix compétitif (25 à 50 €/m² posé avec isolant)',
          'Surface parfaitement plane pour la finition',
        ],
        inconvenients: [
          'Fragilité aux chocs (se perce facilement)',
          'Isolation phonique limitée en simple BA13 (31 dB)',
          'Fixation de charges lourdes nécessitant des chevilles spéciales',
          'Sensation de creux au toucher / résonance',
          'Joint peut fissurer avec le temps si mal réalisé',
        ],
        prixMoyen: '25 € - 50 € / m² (posé avec isolant)',
        dureeVie: '30-50 ans',
        idealPour: 'Rénovations rapides, budgets serrés, passage de gaines, cloisons légères',
      },
      {
        name: 'Brique plâtrière',
        avantages: [
          'Excellente isolation phonique naturelle (40-45 dB en 7 cm)',
          'Bonne résistance mécanique : supporte les charges lourdes',
          'Régulation hygrométrique (absorbe et restitue l\'humidité)',
          'Inertie thermique (stocke la chaleur en hiver)',
          'Sensation de solidité au toucher',
          'Durabilité exceptionnelle',
        ],
        inconvenients: [
          'Poids important (65-80 kg/m²) : vérifier la capacité du plancher',
          'Mise en œuvre plus lente et plus technique',
          'Saignées nécessaires pour les gaines électriques',
          'Surface irrégulière nécessitant un enduit de finition',
          'Prix plus élevé que le placo (40-70 €/m² posé)',
          'Salissante à mettre en œuvre (poussière, mortier)',
        ],
        prixMoyen: '40 € - 70 € / m² (posé)',
        dureeVie: '50-100 ans',
        idealPour: 'Pièces humides, isolation phonique exigée, murs devant supporter des charges',
      },
      {
        name: 'Carreau de plâtre',
        avantages: [
          'Bonne isolation phonique (35-40 dB en 7 cm)',
          'Surface lisse prête à peindre (pas d\'enduit nécessaire)',
          'Résistance mécanique correcte',
          'Montage à la colle (pas de mortier)',
          'Versions hydrofuges disponibles (carreaux verts)',
          'Bon rapport performance/prix',
        ],
        inconvenients: [
          'Poids conséquent (50-70 kg/m²)',
          'Saignées nécessaires pour les gaines',
          'Fragile aux chocs violents (éclats)',
          'Moins répandu que le placo (disponibilité variable)',
          'Nécessite un sol parfaitement plan',
        ],
        prixMoyen: '35 € - 60 € / m² (posé)',
        dureeVie: '40-60 ans',
        idealPour: 'Compromis phonique/prix, surface prête à peindre, rénovation résidentielle',
      },
    ],
    verdict:
      "Le placo BA13 doublé d'un isolant acoustique (laine de roche 45 mm) reste le choix standard en rénovation : rapide, léger et économique. Pour une isolation phonique optimale (chambres, bureaux), la brique plâtrière est imbattable. Le carreau de plâtre offre un bon compromis avec une finition immédiate. En 2026, le placo phonique (Placo Phonique ou Rigidur) permet d'atteindre 50 dB d'affaiblissement sans le poids de la brique.",
    criteresChoix: [
      'Exigence d\'isolation phonique (chambre, bureau, salon)',
      'Capacité portante du plancher',
      'Charges à fixer sur la cloison (meubles, TV, étagères)',
      'Budget main d\'œuvre + matériaux',
      'Rapidité de chantier souhaitée',
    ],
    faq: [
      {
        question: 'Peut-on accrocher une TV sur du placo ?',
        answer:
          'Oui, avec les fixations adaptées. Pour une TV de moins de 20 kg, des chevilles à expansion Molly suffisent. Au-delà de 20 kg, il faut poser un renfort en bois ou en métal dans l\'ossature avant la pose du placo, ou utiliser des chevilles de type Snap Toggle. Pour un meuble de 40 kg+, une plaque de renfort en contreplaqué 18 mm fixée à l\'ossature est recommandée.',
      },
      {
        question: 'Quelle cloison pour une salle de bain ?',
        answer:
          'Le placo hydrofuge (H1, reconnaissable à sa couleur verte) est le standard en salle de bain. La brique plâtrière est aussi adaptée grâce à ses propriétés hygrométriques. Dans les deux cas, appliquez un système de protection à l\'eau (SPEC) dans les zones de projection directe (douche, baignoire). Évitez le carreau de plâtre standard (non hydrofuge) dans les pièces humides.',
      },
      {
        question: 'Faut-il un artisan pour monter une cloison ?',
        answer:
          'Le montage d\'une cloison placo est accessible à un bon bricoleur (ossature métallique + vissage des plaques). La brique et le carreau de plâtre nécessitent plus de savoir-faire (alignement, collage, découpe). Dans tous les cas, l\'intervention d\'un électricien est requise pour le passage des gaines et le respect de la norme NF C 15-100. Comptez 300 à 600 € de main d\'œuvre pour une cloison de 10 m².',
      },
    ],
  },
  {
    slug: 'porte-entree-bois-vs-alu-vs-pvc',
    title: 'Porte d\'entrée bois vs aluminium vs PVC : laquelle choisir ?',
    metaDescription:
      'Comparatif porte d\'entrée bois, aluminium et PVC en 2026 : prix, sécurité, isolation, esthétique. Guide pour bien choisir votre porte d\'entrée.',
    intro:
      "La porte d'entrée est la première impression de votre maison. Au-delà de l'esthétique, elle doit assurer isolation thermique, isolation acoustique et sécurité anti-effraction. Bois, aluminium et PVC sont les trois matériaux dominants, chacun avec ses atouts.",
    category: 'Menuiserie',
    options: [
      {
        name: 'Porte d\'entrée bois',
        avantages: [
          'Esthétique noble et chaleureuse, personnalisable à l\'infini',
          'Excellent isolant thermique naturel (Ud jusqu\'à 1,0 W/m².K)',
          'Très bonne isolation acoustique',
          'Acceptée en secteur classé (ABF)',
          'Réparable et modifiable (ajout de vitrage, changement de couleur)',
          'Matériau écologique et renouvelable',
        ],
        inconvenients: [
          'Entretien régulier indispensable (lasure ou peinture tous les 3-5 ans)',
          'Sensible aux variations d\'humidité (gonflement/rétraction)',
          'Poids important (mise en œuvre et gonds renforcés)',
          'Sécurité à renforcer (serrure multipoints indispensable)',
          'Prix élevé en bois massif exotique ou sur mesure',
        ],
        prixMoyen: '1 000 € - 4 000 € (posée)',
        dureeVie: '30-50 ans (avec entretien)',
        idealPour: 'Maisons de caractère, secteurs protégés, amateurs de tradition',
      },
      {
        name: 'Porte d\'entrée aluminium',
        avantages: [
          'Design contemporain, lignes fines et épurées',
          'Extrêmement résistante et rigide (pas de déformation)',
          'Sécurité renforcée de série (structure alu + serrure multipoints)',
          'Aucun entretien (nettoyage à l\'eau savonneuse)',
          'Large choix de coloris RAL et de finitions (texturée, brossée)',
          'Excellente étanchéité à l\'air et à l\'eau',
        ],
        inconvenients: [
          'Prix le plus élevé des trois matériaux (2 000-6 000 €)',
          'Isolation thermique nécessitant une rupture de pont thermique (RPT)',
          'Condensation possible sur les modèles entrée de gamme',
          'Réparation difficile en cas de rayure profonde',
          'Esthétique parfois jugée froide pour les maisons traditionnelles',
        ],
        prixMoyen: '2 000 € - 6 000 € (posée)',
        dureeVie: '30-50 ans',
        idealPour: 'Maisons contemporaines, sécurité maximale, zéro entretien',
      },
      {
        name: 'Porte d\'entrée PVC',
        avantages: [
          'Meilleur rapport qualité/prix du marché',
          'Très bonne isolation thermique (Ud jusqu\'à 0,9 W/m².K)',
          'Aucun entretien (imputrescible, ne rouille pas)',
          'Résistante à l\'humidité et aux UV',
          'Bonne isolation acoustique',
          'Large choix de coloris et d\'imitations (bois, veinage)',
        ],
        inconvenients: [
          'Rigidité moindre que l\'alu (renforts acier nécessaires)',
          'Aspect moins noble que le bois ou l\'aluminium',
          'Choix de designs limité par rapport à l\'alu',
          'Peut jaunir avec le temps sur les modèles blancs bas de gamme',
          'Sécurité inférieure de base (à renforcer avec serrure multipoints)',
        ],
        prixMoyen: '800 € - 2 500 € (posée)',
        dureeVie: '25-35 ans',
        idealPour: 'Budget maîtrisé, isolation maximale, maisons modernes ou pavillonnaires',
      },
    ],
    verdict:
      "L'aluminium s'impose comme le choix premium en 2026 : sécurité, design et zéro entretien. Le PVC offre le meilleur rapport qualité/prix avec d'excellentes performances d'isolation. Le bois reste le choix patrimonial et écologique, à condition d'accepter l'entretien. Pour combiner le meilleur des deux mondes, les portes mixtes bois/alu (bois intérieur, alu extérieur) séduisent de plus en plus mais à un prix supérieur (3 000 à 7 000 €).",
    criteresChoix: [
      'Budget total (fourniture + pose)',
      'Style architectural de la maison',
      'Niveau de sécurité souhaité (serrure, certification A2P)',
      'Contraintes d\'entretien acceptées',
      'Performance d\'isolation thermique et acoustique requise',
      'Contraintes urbanistiques (ABF)',
    ],
    faq: [
      {
        question: 'Quel niveau de sécurité choisir pour une porte d\'entrée ?',
        answer:
          'Optez au minimum pour une serrure multipoints (3 ou 5 points) certifiée A2P* (résistance 5 minutes à l\'effraction). Pour une sécurité renforcée, choisissez A2P** (10 minutes) ou A2P*** (15 minutes). Les portes aluminium offrent souvent la meilleure résistance structurelle. Un cylindre de haute sécurité (Vachette, Bricard, Mul-T-Lock) coûte 80 à 200 € et renforce significativement la sécurité.',
      },
      {
        question: 'Combien de temps pour remplacer une porte d\'entrée ?',
        answer:
          'La dépose de l\'ancienne porte et la pose de la nouvelle prennent une demi-journée à une journée selon la complexité (modification du bâti, ajustement des finitions). La porte est commandée 3 à 6 semaines à l\'avance (fabrication sur mesure). Pendant l\'intervention, votre maison reste ouverte quelques heures : planifiez le chantier en journée.',
      },
      {
        question: 'La porte d\'entrée est-elle éligible aux aides en 2026 ?',
        answer:
          'Les portes d\'entrée peuvent bénéficier des CEE si elles respectent un coefficient Ud ≤ 1,7 W/m².K. Elles ne sont pas éligibles à MaPrimeRénov\' sauf dans le cadre d\'un parcours de rénovation globale. La TVA réduite à 5,5 % s\'applique si les travaux améliorent la performance énergétique d\'un logement de plus de 2 ans.',
      },
    ],
  },
  {
    slug: 'chauffe-eau-electrique-vs-thermodynamique-vs-solaire',
    title: 'Chauffe-eau électrique vs thermodynamique vs solaire : lequel choisir ?',
    metaDescription:
      'Comparatif chauffe-eau électrique, thermodynamique et solaire en 2026 : prix, économies, aides, installation. Guide pour choisir votre production d\'eau chaude.',
    intro:
      "La production d'eau chaude sanitaire (ECS) représente 10 à 15 % de la facture énergétique d'un ménage français. Chauffe-eau électrique classique, thermodynamique (CET) et solaire individuel (CESI) sont les trois technologies principales. Le choix impacte durablement votre budget énergie.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'Chauffe-eau électrique (cumulus)',
        avantages: [
          'Prix d\'achat très bas (300 à 800 € posé pour 200 L)',
          'Installation simple et rapide (demi-journée)',
          'Aucun entretien obligatoire (détartrage recommandé tous les 2 ans)',
          'Compact : s\'installe dans un placard ou sous un évier',
          'Fonctionne partout (pas de contrainte d\'installation)',
          'Fiabilité éprouvée, pièces de rechange disponibles partout',
        ],
        inconvenients: [
          'Consommation élevée (1 500 à 2 000 kWh/an pour 3-4 personnes)',
          'Facture annuelle 2 à 3 fois supérieure au thermodynamique',
          'Aucune aide financière disponible',
          'Classe énergétique C ou D (étiquette énergie)',
          'Temps de chauffe long (6 à 8 heures pour 200 L)',
        ],
        prixMoyen: '300 € - 800 € (posé, 200 L)',
        dureeVie: '10-15 ans',
        idealPour: 'Budgets très serrés, petits logements, remplacement urgent',
      },
      {
        name: 'Chauffe-eau thermodynamique (CET)',
        avantages: [
          'Consomme 2 à 3 fois moins qu\'un cumulus électrique (COP de 2,5 à 3,5)',
          'Éligible à MaPrimeRénov\' 2026 (jusqu\'à 1 200 €) et aux CEE',
          'Facture eau chaude divisée par 2 à 3',
          'Classe énergétique A ou A+',
          'Peut rafraîchir le local où il est installé (sous-produit de la pompe à chaleur)',
          'Fonctionnement en heures pleines sans surcoût (indépendant du tarif HP/HC)',
        ],
        inconvenients: [
          'Prix d\'achat plus élevé (2 000 à 4 000 € posé)',
          'Nécessite un local non chauffé de 10 m³ minimum (garage, cellier)',
          'Bruit de fonctionnement (35-50 dB, comparable à un réfrigérateur)',
          'Performance réduite si température ambiante < 5 °C',
          'Entretien recommandé tous les 2 ans (fluide frigorigène)',
        ],
        prixMoyen: '2 000 € - 4 000 € (posé)',
        dureeVie: '15-20 ans',
        idealPour: 'Maisons avec garage/cellier, familles de 3-5 personnes, recherche d\'économies',
      },
      {
        name: 'Chauffe-eau solaire individuel (CESI)',
        avantages: [
          'Couvre 50 à 70 % des besoins en eau chaude gratuitement (énergie solaire)',
          'Éligible MaPrimeRénov\' (jusqu\'à 4 000 €) et CEE',
          'Énergie 100 % renouvelable et gratuite',
          'Durée de vie des capteurs solaires : 25 à 30 ans',
          'Valorise fortement le DPE du logement',
          'Indépendance énergétique partielle',
        ],
        inconvenients: [
          'Investissement initial élevé (4 000 à 7 000 € posé)',
          'Appoint nécessaire (électrique ou gaz) en hiver et par temps couvert',
          'Surface de toiture orientée sud requise (4 à 6 m² de capteurs)',
          'Installation complexe (circuit hydraulique, capteurs, ballon)',
          'Rentabilité variable selon l\'ensoleillement régional',
          'Entretien du circuit caloporteur (pression, antigel)',
        ],
        prixMoyen: '4 000 € - 7 000 € (posé)',
        dureeVie: '20-25 ans (ballon) / 25-30 ans (capteurs)',
        idealPour: 'Régions ensoleillées (Sud, Ouest), maisons avec toiture sud, démarche écologique',
      },
    ],
    verdict:
      "Le chauffe-eau thermodynamique offre le meilleur rapport économies/investissement en 2026, avec un retour sur investissement de 4 à 6 ans grâce aux aides. Le solaire est le plus écologique mais sa rentabilité dépend fortement de votre localisation. Le cumulus électrique ne se justifie qu'en remplacement urgent ou pour les très petits logements. Pour une famille de 4 personnes, le CET fait économiser 200 à 350 €/an par rapport au cumulus.",
    criteresChoix: [
      'Budget d\'investissement initial',
      'Espace disponible pour l\'installation (local de 10 m³ pour CET)',
      'Orientation et surface de toiture (pour le solaire)',
      'Zone géographique et ensoleillement',
      'Nombre de personnes dans le foyer',
      'Éligibilité aux aides financières',
    ],
    faq: [
      {
        question: 'Un chauffe-eau thermodynamique fait-il du bruit ?',
        answer:
          'Oui, le compresseur produit 35 à 50 dB selon les modèles (niveau d\'un réfrigérateur à une conversation normale). C\'est pourquoi il doit être installé dans un local non habité (garage, cellier, buanderie) et non dans une chambre ou un salon. Les modèles split (unité extérieure) réduisent le bruit intérieur à moins de 30 dB.',
      },
      {
        question: 'Peut-on installer un chauffe-eau solaire en copropriété ?',
        answer:
          'C\'est techniquement possible mais complexe : il faut l\'accord de la copropriété pour l\'installation des capteurs sur le toit, et le circuit hydraulique doit descendre jusqu\'à votre appartement. En pratique, le chauffe-eau thermodynamique est souvent plus adapté en copropriété (installation intérieure, pas de modification de la toiture).',
      },
      {
        question: 'Combien économise-t-on avec un chauffe-eau thermodynamique ?',
        answer:
          'Pour une famille de 4 personnes, le cumulus électrique coûte ~450 €/an en électricité. Le CET réduit cette facture à 150-200 €/an, soit une économie de 250 à 300 €/an. Avec un coût d\'installation de 2 500 à 3 500 € (après aides), le retour sur investissement est de 4 à 6 ans.',
      },
    ],
  },
  {
    slug: 'climatisation-split-vs-gainable-vs-monobloc',
    title: 'Climatisation split vs gainable vs monobloc : laquelle choisir ?',
    metaDescription:
      'Comparatif climatisation split, gainable et monobloc en 2026 : prix, performance, bruit, installation. Guide pour choisir votre système de climatisation.',
    intro:
      "Avec les étés de plus en plus chauds en France, la climatisation devient un investissement courant. Split mural, système gainable et monobloc mobile sont les trois grandes familles. Le choix dépend de votre budget, du nombre de pièces à climatiser et de vos contraintes d'installation.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'Climatisation split (mono ou multi)',
        avantages: [
          'Excellent rapport performance/prix',
          'Réversible : chauffage + climatisation en un seul appareil',
          'Pilotage pièce par pièce (multi-split)',
          'Performance élevée (SEER 6 à 8 pour les modèles récents)',
          'Installation relativement simple (1-2 jours)',
          'Silencieux en intérieur (20-30 dB pour les unités murales)',
        ],
        inconvenients: [
          'Unité extérieure visible et bruyante (45-55 dB)',
          'Unités intérieures murales visibles (impact esthétique)',
          'Autorisation de copropriété nécessaire pour l\'unité extérieure',
          'Entretien annuel recommandé (nettoyage des filtres, recharge)',
          'Distance limitée entre unités intérieure et extérieure (15-25 m)',
        ],
        prixMoyen: '1 500 € - 3 500 € (mono-split posé) / 4 000 € - 10 000 € (multi-split)',
        dureeVie: '12-20 ans',
        idealPour: 'Maisons et appartements, 1 à 5 pièces, meilleur rapport qualité/prix',
      },
      {
        name: 'Climatisation gainable',
        avantages: [
          'Totalement invisible : diffusion par bouches au plafond',
          'Climatise toute la maison via un réseau de gaines',
          'Esthétique préservée (pas d\'unité murale visible)',
          'Zonage possible (régulation pièce par pièce avec volets motorisés)',
          'Réversible pour le chauffage',
          'Confort acoustique supérieur (unité cachée dans les combles ou faux plafond)',
        ],
        inconvenients: [
          'Prix élevé (7 000 à 15 000 € pour une maison de 100 m²)',
          'Installation lourde : faux plafond ou combles accessibles obligatoires',
          'Difficile à installer en rénovation sans faux plafond existant',
          'Maintenance plus complexe (accès aux gaines, nettoyage)',
          'Perte de hauteur sous plafond (15-25 cm pour le faux plafond)',
        ],
        prixMoyen: '7 000 € - 15 000 € (maison 100 m², posé)',
        dureeVie: '15-20 ans',
        idealPour: 'Constructions neuves, maisons avec combles, esthétique premium, hôtellerie',
      },
      {
        name: 'Climatisation monobloc (mobile)',
        avantages: [
          'Aucune installation fixe requise (brancher et utiliser)',
          'Prix d\'achat très bas (300 à 1 000 €)',
          'Déplaçable d\'une pièce à l\'autre',
          'Pas besoin d\'autorisation (copropriété, location)',
          'Solution temporaire ou d\'appoint idéale',
        ],
        inconvenients: [
          'Performance faible (EER 2 à 3 vs SEER 6-8 pour un split)',
          'Bruyant (50-65 dB, comparable à une conversation animée)',
          'Gaine d\'évacuation par la fenêtre (entrée d\'air chaud)',
          'Consommation élevée pour un résultat médiocre',
          'Refroidit une seule pièce de 15-25 m² maximum',
          'Bac à condensats à vider régulièrement',
        ],
        prixMoyen: '300 € - 1 000 € (sans installation)',
        dureeVie: '5-10 ans',
        idealPour: 'Solution temporaire, locataires, appoint ponctuel, petit budget',
      },
    ],
    verdict:
      "Le split mural (mono ou multi) est la solution optimale pour 80 % des foyers : excellent rapport performance/prix et installation simple. Le gainable est le choix haut de gamme pour les constructions neuves ou les rénovations lourdes où l'esthétique prime. Le monobloc n'est qu'un dépannage temporaire dont le coût d'exploitation dépasse rapidement celui d'un split fixe. En 2026, privilégiez les modèles avec fluide R32 (moins polluant) et un SEER supérieur à 6.",
    criteresChoix: [
      'Nombre de pièces à climatiser',
      'Budget d\'investissement',
      'Possibilité d\'installer une unité extérieure',
      'Présence de faux plafond ou combles (pour le gainable)',
      'Propriétaire ou locataire',
      'Exigence esthétique (visibilité des unités)',
    ],
    faq: [
      {
        question: 'Faut-il une autorisation pour installer une climatisation ?',
        answer:
          'En copropriété, l\'accord de l\'assemblée générale est nécessaire pour fixer une unité extérieure sur la façade ou le balcon. En maison individuelle, une déclaration préalable de travaux peut être exigée si l\'unité extérieure est visible depuis la voie publique. Certaines communes imposent des contraintes d\'intégration (cache, couleur). Vérifiez le PLU et le règlement de copropriété avant toute installation.',
      },
      {
        question: 'La climatisation réversible remplace-t-elle le chauffage ?',
        answer:
          'En zones tempérées (Sud de la France, façade atlantique), une PAC air/air réversible peut assurer le chauffage principal. En zones froides (Nord, montagne), elle sert d\'appoint mais ne remplace pas un chauffage central (la performance chute sous 0 °C). Un split de 3,5 kW chauffe efficacement une pièce de 25-35 m² jusqu\'à 5 °C extérieur.',
      },
      {
        question: 'Combien consomme une climatisation split ?',
        answer:
          'Un split de 2,5 kW (pièce de 20 m²) consomme environ 0,4 à 0,7 kWh d\'électricité par heure de fonctionnement. Pour un usage estival typique (6h/jour pendant 3 mois), cela représente 200 à 400 kWh soit 55 à 110 €/an. Un monobloc consomme 2 à 3 fois plus pour un résultat inférieur.',
      },
    ],
  },
  {
    slug: 'portail-coulissant-vs-battant',
    title: 'Portail coulissant vs battant : lequel choisir ?',
    metaDescription:
      'Comparatif portail coulissant et battant en 2026 : prix, motorisation, espace requis, matériaux. Guide pour choisir votre portail.',
    intro:
      "Le portail est à la fois un élément de sécurité, de praticité et d'esthétique pour votre propriété. Coulissant ou battant, chacun a ses contraintes d'installation et ses avantages. Le choix dépend essentiellement de la configuration de votre entrée.",
    category: 'Extérieur',
    options: [
      {
        name: 'Portail coulissant',
        avantages: [
          'Aucun débattement : ne mord pas sur la voie publique ni sur l\'allée',
          'Idéal pour les entrées en pente (pas de contrainte de dénivelé)',
          'Motorisation simple et fiable (rail au sol ou autoportant)',
          'Ouverture possible même avec un véhicule garé devant',
          'Plus résistant au vent (pas de prise au vent en position ouverte)',
          'Sécurité renforcée (plus difficile à forcer qu\'un battant)',
        ],
        inconvenients: [
          'Nécessite un dégagement latéral égal à la largeur du portail',
          'Rail au sol : entretien régulier (nettoyage, graissage)',
          'Autoportant : plus cher et plus lourd (structure renforcée)',
          'Installation plus technique (longrine béton, rail)',
          'Prix supérieur de 20-40 % au battant à matériau équivalent',
        ],
        prixMoyen: '1 500 € - 5 000 € (posé, motorisé, alu)',
        dureeVie: '20-40 ans',
        idealPour: 'Terrains en pente, entrées étroites, accès sur voie passante',
      },
      {
        name: 'Portail battant (2 vantaux)',
        avantages: [
          'Prix plus accessible que le coulissant',
          'Installation simple (scellement des gonds, pas de rail)',
          'Esthétique classique et élégante (2 vantaux symétriques)',
          'Grand choix de styles et de matériaux',
          'Motorisation à bras ou à vérins disponible',
          'Pas besoin de dégagement latéral',
        ],
        inconvenients: [
          'Débattement important (intérieur ou extérieur)',
          'Ouverture sur la voie publique généralement interdite',
          'Inutilisable en terrain pentu (les vantaux frottent)',
          'Prise au vent importante (blocage possible par vent fort)',
          'Nécessite un espace libre devant ou derrière le portail',
        ],
        prixMoyen: '1 000 € - 4 000 € (posé, motorisé, alu)',
        dureeVie: '20-40 ans',
        idealPour: 'Terrains plats, entrées avec recul, style traditionnel',
      },
    ],
    verdict:
      "Le portail coulissant est le choix le plus pratique et le plus sûr pour la majorité des configurations en 2026 : pas de débattement, résistant au vent et facilement motorisable. Le battant reste pertinent pour les terrains plats avec un recul suffisant et lorsque le budget est limité. En aluminium thermolaqué, les deux types offrent une durabilité et une esthétique excellentes sans entretien.",
    criteresChoix: [
      'Configuration du terrain (plat ou en pente)',
      'Espace disponible (dégagement latéral ou débattement)',
      'Accès direct sur voie publique ou recul disponible',
      'Budget total (portail + motorisation + maçonnerie)',
      'Exposition au vent',
      'Style souhaité (moderne ou traditionnel)',
    ],
    faq: [
      {
        question: 'Faut-il un permis pour installer un portail ?',
        answer:
          'En général, une déclaration préalable de travaux suffit si le portail modifie l\'aspect extérieur de la propriété (nouveau portail ou changement de matériau/couleur). Aucune formalité n\'est requise pour un remplacement à l\'identique. En secteur protégé, l\'avis de l\'ABF est nécessaire. Vérifiez le PLU de votre commune pour les hauteurs maximales autorisées (généralement 2 m).',
      },
      {
        question: 'Quel matériau choisir pour un portail ?',
        answer:
          'L\'aluminium thermolaqué est le choix n°1 en 2026 : léger (facile à motoriser), résistant à la corrosion, zéro entretien et large choix de couleurs RAL. Le fer forgé est esthétique mais nécessite un traitement antirouille. Le bois est chaleureux mais demande un entretien régulier. Le PVC est économique mais manque de rigidité au-delà de 3 m de largeur.',
      },
      {
        question: 'Combien coûte la motorisation d\'un portail ?',
        answer:
          'La motorisation seule coûte 300 à 800 € (kit) + 300 à 600 € de pose. Les moteurs à bras (battant) coûtent 400 à 1 000 € posés. Les moteurs coulissants 350 à 800 € posés. Ajoutez 100 à 300 € pour les accessoires (télécommande, photocellules, feu clignotant, batterie de secours). Un électricien doit tirer une alimentation 230V jusqu\'au portail.',
      },
    ],
  },
  {
    slug: 'terrasse-bois-vs-composite-vs-carrelage',
    title: 'Terrasse bois vs composite vs carrelage : quel revêtement choisir ?',
    metaDescription:
      'Comparatif terrasse bois naturel, composite et carrelage extérieur en 2026 : prix au m², entretien, durabilité, esthétique. Guide pour choisir votre terrasse.',
    intro:
      "La terrasse est un espace de vie extérieur qui doit résister aux intempéries tout en restant esthétique et agréable au toucher. Bois naturel, composite (bois-polymère) et carrelage extérieur sont les trois solutions dominantes, avec des philosophies et des budgets très différents.",
    category: 'Extérieur',
    options: [
      {
        name: 'Terrasse bois naturel',
        avantages: [
          'Esthétique chaleureuse et naturelle inégalée',
          'Agréable au toucher pieds nus (ne chauffe pas autant que le composite)',
          'Pin traité autoclave : solution économique (30-60 €/m² posé)',
          'Bois exotique (ipé, cumaru) : durabilité exceptionnelle sans traitement',
          'Matériau écologique et renouvelable (si certifié FSC/PEFC)',
          'Réparable lame par lame',
        ],
        inconvenients: [
          'Entretien annuel nécessaire (dégriseur + saturateur ou huile)',
          'Grisaillement naturel si non traité (aspect argenté)',
          'Pin traité : durée de vie limitée (10-15 ans, échardes possibles)',
          'Bois exotique : prix élevé (80-150 €/m² posé) et enjeux environnementaux',
          'Sensible aux champignons, insectes et fentes de séchage',
          'Glissant quand mouillé (sans traitement antidérapant)',
        ],
        prixMoyen: '30 € - 150 € / m² (posé selon essence)',
        dureeVie: '10-15 ans (pin) / 25-40 ans (exotique)',
        idealPour: 'Amateurs d\'authenticité, budgets variés, jardins paysagers',
      },
      {
        name: 'Terrasse composite',
        avantages: [
          'Aucun entretien (ni huile, ni lasure, ni ponçage)',
          'Imitation bois très réaliste (coextrudé de dernière génération)',
          'Résistant aux UV, à l\'humidité, aux insectes et aux taches',
          'Pas d\'échardes, surface régulière et sécurisée',
          'Antidérapant de série',
          'Garantie fabricant souvent 20 à 25 ans',
        ],
        inconvenients: [
          'Chauffe fortement au soleil (jusqu\'à 60-70 °C en plein été)',
          'Aspect parfois artificiel (surtout les gammes entrée de gamme)',
          'Prix moyen à élevé (50-120 €/m² posé)',
          'Dilatation importante (joints de dilatation obligatoires)',
          'Non réparable localement (remplacement de lame complet)',
          'Bilan environnemental discutable (plastique + bois broyé)',
        ],
        prixMoyen: '50 € - 120 € / m² (posé)',
        dureeVie: '20-30 ans',
        idealPour: 'Familles avec enfants, zéro entretien souhaité, piscine',
      },
      {
        name: 'Terrasse carrelage extérieur (grès cérame 20 mm)',
        avantages: [
          'Durabilité extrême (résiste au gel, aux UV, aux taches)',
          'Aucun entretien (nettoyage au jet d\'eau)',
          'Ne chauffe pas autant que le composite',
          'Grand choix de formats et d\'aspects (pierre, bois, béton, marbre)',
          'Pose sur plots : démontable et réglable (rattrapage de niveau)',
          'Antidérapant certifié (R11/R12 pour l\'extérieur)',
        ],
        inconvenients: [
          'Prix élevé en grès cérame 20 mm (60-130 €/m² posé sur plots)',
          'Sensation froide et dure sous les pieds',
          'Casse possible en cas de choc violent (remplacement unitaire)',
          'Pose sur plots : sol parfaitement stable requis (dalle béton ou terrain compacté)',
          'Joints entre dalles (aspect moins homogène que le bois)',
        ],
        prixMoyen: '60 € - 130 € / m² (posé sur plots)',
        dureeVie: '30-50 ans',
        idealPour: 'Terrasses contemporaines, bord de piscine, durabilité maximale',
      },
    ],
    verdict:
      "Le composite s'est imposé comme le choix n°1 en 2026 grâce à son absence totale d'entretien et sa durabilité. Le bois naturel reste le plus esthétique pour les puristes prêts à l'entretenir. Le carrelage grès cérame 20 mm sur plots offre la meilleure durabilité et un style contemporain. Attention : le composite chauffe beaucoup au soleil — pieds nus autour d'une piscine plein sud, le carrelage antidérapant ou le bois exotique sont préférables.",
    criteresChoix: [
      'Budget total (fourniture + pose)',
      'Volonté d\'entretenir ou non',
      'Exposition au soleil (le composite chauffe)',
      'Usage (terrasse de vie, bord de piscine, passage fréquent)',
      'Style architectural de la maison',
      'Sensibilité écologique',
    ],
    faq: [
      {
        question: 'Faut-il une dalle béton sous une terrasse ?',
        answer:
          'Pas obligatoirement. Le bois et le composite se posent sur lambourdes, elles-mêmes posées sur des plots réglables ou des dés béton. Le carrelage 20 mm se pose sur plots directement sur une surface stable (dalle existante, sol compacté). Une dalle béton est nécessaire uniquement si le sol est instable ou pour une terrasse sur terre-plein en carrelage collé.',
      },
      {
        question: 'Quelle terrasse autour d\'une piscine ?',
        answer:
          'Le carrelage grès cérame antidérapant (R11 minimum, R12 recommandé) est le plus adapté : résistant au chlore, facile à nettoyer, ne chauffe pas excessivement. Le bois exotique (ipé) est aussi excellent. Le composite dernière génération avec traitement anti-chauffe convient aussi. Évitez le pin traité (échardes + glissance) et le composite bas de gamme (brûlant au soleil).',
      },
      {
        question: 'Faut-il une déclaration de travaux pour une terrasse ?',
        answer:
          'Oui si la terrasse est surélevée de plus de 60 cm par rapport au sol (déclaration préalable) ou si elle fait plus de 20 m² et dépasse la hauteur de 60 cm (permis de construire). Une terrasse de plain-pied (posée au sol, sans fondation) de moins de 20 m² ne nécessite aucune formalité dans la plupart des communes. Vérifiez votre PLU.',
      },
    ],
  },
  {
    slug: 'piscine-coque-vs-beton-vs-hors-sol',
    title: 'Piscine coque vs béton vs hors-sol : laquelle choisir ?',
    metaDescription:
      'Comparatif piscine coque, béton et hors-sol en 2026 : prix, durée de vie, délais, entretien. Guide complet pour choisir votre piscine.',
    intro:
      "Installer une piscine est un projet important qui impacte votre cadre de vie et la valeur de votre bien. Piscine coque polyester, béton (maçonnée ou projetée) et hors-sol (bois ou acier) correspondent à des budgets, des délais et des usages très différents.",
    category: 'Extérieur',
    options: [
      {
        name: 'Piscine coque polyester',
        avantages: [
          'Installation rapide : 1 à 3 semaines (coque livrée prête à poser)',
          'Surface lisse, douce au toucher, non abrasive',
          'Étanchéité garantie (coque monobloc)',
          'Entretien facilité (surface gelcoat anti-algues)',
          'Large choix de formes et de coloris',
          'Bon rapport qualité/prix pour les dimensions standard',
        ],
        inconvenients: [
          'Formes et dimensions limitées au catalogue du fabricant',
          'Largeur maximale ~5 m (contrainte de transport routier)',
          'Accès au terrain nécessaire pour la grue (passage de 3 m minimum)',
          'Gelcoat à rénover après 10-15 ans (2 000-4 000 €)',
          'Risque de déformation si la nappe phréatique est haute',
          'Moins durable que le béton à très long terme',
        ],
        prixMoyen: '15 000 € - 35 000 € (posée, 8x4 m)',
        dureeVie: '20-30 ans',
        idealPour: 'Installation rapide, formes standard, budget intermédiaire',
      },
      {
        name: 'Piscine béton (maçonnée ou gunite)',
        avantages: [
          'Sur mesure : toutes formes, dimensions et profondeurs possibles',
          'Durabilité exceptionnelle (40-60 ans avec entretien)',
          'Revêtement au choix : liner, carrelage, PVC armé, enduit',
          'Résiste à tous les terrains (nappe phréatique, sol rocheux)',
          'Valorise fortement le bien immobilier',
          'Possibilité d\'intégrer escaliers, plage immergée, débordement',
        ],
        inconvenients: [
          'Prix élevé (30 000 à 80 000 € pour une 8x4 m, équipée)',
          'Délai de construction long (2 à 4 mois)',
          'Entretien régulier du revêtement (liner tous les 10-12 ans)',
          'Permis de construire obligatoire au-delà de 100 m²',
          'Risque de fissuration si le terrain bouge',
          'Consommation d\'eau et de produits chimiques importante',
        ],
        prixMoyen: '30 000 € - 80 000 € (posée, 8x4 m)',
        dureeVie: '40-60 ans',
        idealPour: 'Projets sur mesure, grandes dimensions, piscines à débordement, haut de gamme',
      },
      {
        name: 'Piscine hors-sol (bois ou acier)',
        avantages: [
          'Prix très accessible (2 000 à 10 000 € selon qualité)',
          'Installation rapide : quelques jours',
          'Pas de permis de construire (< 10 m² au sol et < 1 m de hauteur)',
          'Démontable (pas de modification permanente du terrain)',
          'Idéale pour tester l\'usage avant d\'investir dans un bassin enterré',
          'Fiscalité avantageuse (pas de taxe d\'aménagement dans la plupart des cas)',
        ],
        inconvenients: [
          'Esthétique limitée (sauf modèles bois haut de gamme)',
          'Durée de vie réduite (5-15 ans)',
          'Profondeur limitée (1,20-1,40 m en général)',
          'Baignade moins confortable (accès par échelle)',
          'Hivernage délicat (risque de dégradation par le gel)',
          'Ne valorise pas le bien immobilier',
        ],
        prixMoyen: '2 000 € - 10 000 € (kit + installation)',
        dureeVie: '5-15 ans',
        idealPour: 'Petits budgets, premiers achats, terrains non constructibles, locataires',
      },
    ],
    verdict:
      "La piscine coque offre le meilleur compromis rapidité/qualité/prix pour 80 % des projets résidentiels. Le béton se justifie pour les projets sur mesure, les grandes dimensions ou les piscines à débordement. La hors-sol est une excellente porte d'entrée pour tester l'usage sans engagement financier lourd. En 2026, les piscines naturelles (baignade biologique) gagnent du terrain pour les propriétaires soucieux de l'environnement.",
    criteresChoix: [
      'Budget total (bassin + terrassement + équipements + local technique)',
      'Dimensions et forme souhaitées',
      'Accessibilité du terrain pour les engins',
      'Type de sol et nappe phréatique',
      'Délai souhaité pour la mise en eau',
      'Projet à long terme ou temporaire',
    ],
    faq: [
      {
        question: 'Faut-il un permis de construire pour une piscine ?',
        answer:
          'Déclaration préalable de travaux pour les piscines de 10 à 100 m² sans abri ou avec abri de moins de 1,80 m de hauteur. Permis de construire obligatoire au-delà de 100 m² ou avec un abri de plus de 1,80 m. Les piscines hors-sol de moins de 10 m² installées moins de 3 mois/an ne nécessitent aucune formalité.',
      },
      {
        question: 'Quel est le coût annuel d\'entretien d\'une piscine ?',
        answer:
          'Comptez 800 à 1 500 €/an pour une piscine enterrée de 8x4 m : produits de traitement (200-400 €), électricité de la filtration (300-500 €), eau de remplissage (100-200 €), hivernage/remise en route (100-300 €). Un contrat d\'entretien avec un pisciniste coûte 100 à 200 €/mois.',
      },
      {
        question: 'Une piscine augmente-t-elle la taxe foncière ?',
        answer:
          'Oui, une piscine enterrée augmente la valeur locative cadastrale et donc la taxe foncière. L\'impact varie de 200 à 800 €/an selon les communes. Les piscines hors-sol démontables ne sont généralement pas soumises à cette majoration. Vous devez déclarer votre piscine au centre des impôts dans les 90 jours suivant l\'achèvement des travaux.',
      },
    ],
  },
  {
    slug: 'store-banne-vs-pergola-vs-voile-ombrage',
    title: 'Store banne vs pergola vs voile d\'ombrage : que choisir ?',
    metaDescription:
      'Comparatif store banne, pergola bioclimatique et voile d\'ombrage en 2026 : prix, résistance au vent, esthétique, protection solaire. Guide pour ombrager votre terrasse.',
    intro:
      "Protéger votre terrasse du soleil et de la pluie fine améliore considérablement votre confort extérieur. Store banne, pergola (bioclimatique ou classique) et voile d'ombrage répondent à des besoins et des budgets très différents.",
    category: 'Extérieur',
    options: [
      {
        name: 'Store banne (motorisé)',
        avantages: [
          'Rétractable : disparaît quand on n\'en a pas besoin',
          'Installation simple sur façade (demi-journée)',
          'Prix accessible (1 000 à 3 500 € posé, motorisé)',
          'Large choix de toiles (couleurs, anti-UV, déperlantes)',
          'Motorisation avec capteur vent/soleil automatique',
          'Aucune emprise au sol',
        ],
        inconvenients: [
          'Résistance au vent limitée (à replier au-delà de 40-50 km/h)',
          'Ne protège pas de la pluie battante',
          'Toile à remplacer tous les 8-12 ans (300-800 €)',
          'Pas d\'éclairage ni de chauffage intégrés',
          'Avancée limitée (3,5 m maximum en général)',
          'Support mural porteur nécessaire',
        ],
        prixMoyen: '1 000 € - 3 500 € (posé, motorisé)',
        dureeVie: '10-15 ans (toile 8-12 ans)',
        idealPour: 'Terrasses adossées, budgets modérés, usage saisonnier',
      },
      {
        name: 'Pergola bioclimatique',
        avantages: [
          'Lames orientables : gère soleil, ombre et ventilation',
          'Résistante au vent (jusqu\'à 120 km/h fermée)',
          'Protège de la pluie en position fermée',
          'Structure durable en aluminium (aucun entretien)',
          'Éclairage LED, chauffage et brumisateur intégrables',
          'Valorise fortement le bien immobilier',
        ],
        inconvenients: [
          'Prix élevé (5 000 à 15 000 € posée pour 3x4 m)',
          'Installation complexe (fondations, fixation murale ou autoportée)',
          'Déclaration préalable de travaux souvent nécessaire',
          'Structure permanente et visible',
          'Motorisation des lames : coût de maintenance',
          'Emprise au sol importante',
        ],
        prixMoyen: '5 000 € - 15 000 € (posée, 3x4 m)',
        dureeVie: '25-40 ans',
        idealPour: 'Terrasses de vie, usage 4 saisons, investissement durable, maisons contemporaines',
      },
      {
        name: 'Voile d\'ombrage',
        avantages: [
          'Prix très accessible (100 à 800 € pour une voile de qualité)',
          'Esthétique moderne et aérienne',
          'Installation simple (mâts, façade, arbres)',
          'Démontable et remplaçable facilement',
          'Large choix de formes (triangle, rectangle, trapèze)',
          'Légère et facile à stocker en hiver',
        ],
        inconvenients: [
          'Protection solaire limitée (pas étanche, UV partiellement filtrés)',
          'Résistance au vent faible (à retirer en cas de tempête)',
          'Durée de vie limitée (3-7 ans pour la toile)',
          'Fixations à vérifier régulièrement (tension)',
          'Ne protège pas de la pluie',
          'Ombre partielle (ne couvre pas toute la terrasse)',
        ],
        prixMoyen: '100 € - 800 € (fournie, hors fixations)',
        dureeVie: '3-7 ans (toile)',
        idealPour: 'Petits budgets, ombrage d\'appoint, esthétique contemporaine, jardins',
      },
    ],
    verdict:
      "La pergola bioclimatique est l'investissement le plus complet : 4 saisons, résistante, durable et valorisante pour votre bien. Le store banne reste le meilleur rapport qualité/prix pour un ombrage saisonnier classique. La voile d'ombrage est une solution d'appoint élégante et économique, mais temporaire. En 2026, les pergolas bioclimatiques solaires (panneaux photovoltaïques intégrés aux lames) commencent à se démocratiser.",
    criteresChoix: [
      'Budget disponible',
      'Usage saisonnier ou 4 saisons',
      'Résistance au vent souhaitée',
      'Protection pluie nécessaire ou non',
      'Esthétique et style de la maison',
      'Contraintes d\'urbanisme (déclaration préalable)',
    ],
    faq: [
      {
        question: 'Faut-il une déclaration de travaux pour une pergola ?',
        answer:
          'Oui, une déclaration préalable est requise pour les pergolas de 5 à 20 m² d\'emprise au sol (40 m² en zone PLU). Au-delà de 20 m² (ou 40 m²), un permis de construire est nécessaire. Les stores bannes et voiles d\'ombrage ne nécessitent généralement aucune formalité car ils sont rétractables/démontables.',
      },
      {
        question: 'Un store banne résiste-t-il à la pluie ?',
        answer:
          'Les toiles acryliques traitées déperlantes résistent à la pluie fine et aux averses légères. En revanche, il faut replier le store en cas de forte pluie pour éviter la formation de poches d\'eau (risque de déformation de la structure). Certains stores coffre intégraux protègent la toile repliée de la pluie et prolongent sa durée de vie.',
      },
      {
        question: 'Combien coûte le remplacement de la toile d\'un store banne ?',
        answer:
          'Le remplacement de la toile coûte 300 à 800 € selon la dimension et la qualité (acrylique Dickson, Sauleda). Il est recommandé de la remplacer tous les 8 à 12 ans ou dès que les couleurs sont délavées (perte de protection UV). Un storiste professionnel facture 150 à 250 € de main d\'œuvre pour le remplacement.',
      },
    ],
  },
  {
    slug: 'escalier-bois-vs-metal-vs-beton',
    title: 'Escalier bois vs métal vs béton : lequel choisir ?',
    metaDescription:
      'Comparatif escalier bois, métal et béton en 2026 : prix, esthétique, solidité, entretien. Guide pour choisir votre escalier intérieur ou extérieur.',
    intro:
      "L'escalier est à la fois un élément fonctionnel et un élément décoratif majeur de votre intérieur. Bois, métal et béton offrent des rendus esthétiques très différents et répondent à des contraintes techniques spécifiques. Ce comparatif vous aide à faire le bon choix.",
    category: 'Structure',
    options: [
      {
        name: 'Escalier bois',
        avantages: [
          'Chaleur et élégance du matériau naturel',
          'Large choix d\'essences (chêne, hêtre, frêne, sapin)',
          'Sur mesure : toutes formes et configurations possibles',
          'Bon isolant phonique (moins de transmission de bruit que le métal)',
          'Réparable et personnalisable (peinture, vitrification)',
          'Compatible avec tous les styles de décoration',
        ],
        inconvenients: [
          'Craquements possibles avec le temps (surtout en chêne)',
          'Entretien périodique (vitrification tous les 10 ans)',
          'Sensible à l\'humidité (déconseillé en extérieur sans traitement)',
          'Risque de glissance (nécessite bandes antidérapantes ou nez de marche)',
          'Prix variable selon l\'essence (chêne massif = premium)',
        ],
        prixMoyen: '3 000 € - 12 000 € (posé, sur mesure)',
        dureeVie: '30-80 ans',
        idealPour: 'Intérieurs classiques et contemporains, maisons à étage, confort acoustique',
      },
      {
        name: 'Escalier métal (acier ou inox)',
        avantages: [
          'Design industriel et contemporain',
          'Structure fine et légère visuellement (marches suspendues possibles)',
          'Extrêmement solide et durable',
          'Combinable avec d\'autres matériaux (marches bois, verre)',
          'Ne craque pas et ne se déforme pas',
          'Adapté intérieur et extérieur (acier galvanisé ou inox)',
        ],
        inconvenients: [
          'Bruyant (transmission des vibrations et bruits de pas)',
          'Froid au toucher (surtout pieds nus)',
          'Rouille possible si non traité (acier brut)',
          'Prix élevé en sur mesure (soudure, métallerie artisanale)',
          'Condensation possible en environnement humide',
        ],
        prixMoyen: '4 000 € - 15 000 € (posé, sur mesure)',
        dureeVie: '50-100 ans',
        idealPour: 'Lofts, intérieurs industriels, escaliers extérieurs, architecture contemporaine',
      },
      {
        name: 'Escalier béton',
        avantages: [
          'Solidité et longévité maximales',
          'Isolation phonique excellente (masse importante)',
          'Incombustible (sécurité incendie)',
          'Revêtement au choix : bois, carrelage, pierre, béton ciré, moquette',
          'Pas de vibration ni de craquement',
          'Coût compétitif pour les formes droites',
        ],
        inconvenients: [
          'Poids très important (nécessite des fondations adaptées)',
          'Coffrage complexe pour les formes hélicoïdales',
          'Impossible à modifier une fois coulé',
          'Aspect brut nécessitant un habillage (sauf béton ciré)',
          'Temps de séchage long (28 jours avant habillage)',
        ],
        prixMoyen: '2 000 € - 8 000 € (coulé, hors habillage)',
        dureeVie: '50-100 ans',
        idealPour: 'Constructions neuves, escaliers droits, habillage personnalisé, collectifs',
      },
    ],
    verdict:
      "Le bois reste le choix favori pour les escaliers intérieurs résidentiels : chaleureux, silencieux et personnalisable. Le métal s'impose pour les designs contemporains et les escaliers extérieurs. Le béton est le plus économique et le plus solide pour les formes droites en construction neuve, avec la possibilité d'un habillage bois ou pierre pour le rendu final. La combinaison limon métal + marches bois est la tendance 2026 la plus populaire.",
    criteresChoix: [
      'Style de décoration intérieure',
      'Budget total (structure + habillage + pose)',
      'Usage intérieur ou extérieur',
      'Sensibilité au bruit (craquements, résonance)',
      'Forme souhaitée (droit, quart tournant, hélicoïdal)',
      'Capacité portante du plancher',
    ],
    faq: [
      {
        question: 'Quel escalier pour un petit espace ?',
        answer:
          'L\'escalier hélicoïdal (colimaçon) est le plus compact avec une emprise au sol de 1,5 à 2 m². En métal, il est léger et aérien. En bois, il est plus chaleureux. L\'escalier à pas japonais (marches alternées) est encore plus compact mais moins confortable. Prévoyez une trémie d\'au moins 130 cm de diamètre pour un hélicoïdal confortable.',
      },
      {
        question: 'Combien de temps pour installer un escalier ?',
        answer:
          'Un escalier bois sur mesure nécessite 4 à 8 semaines de fabrication + 1 à 3 jours de pose. Un escalier métal sur mesure : 6 à 10 semaines de fabrication + 1 à 2 jours de pose. Un escalier béton : 1 à 2 jours de coffrage/coulage + 28 jours de séchage + l\'habillage (1 à 3 jours). Les escaliers en kit (bois ou métal) se posent en 1 journée.',
      },
      {
        question: 'Quelles normes pour un escalier résidentiel ?',
        answer:
          'La norme NF P 01-012 recommande : hauteur de marche de 17 à 21 cm, giron (profondeur) de 21 à 28 cm, largeur minimale de 80 cm (90 cm recommandé), main courante obligatoire à 90 cm de hauteur, garde-corps de 100 cm en étage. La formule de Blondel (2h + g = 60 à 64 cm) garantit un escalier confortable.',
      },
    ],
  },
  {
    slug: 'radiateur-fonte-vs-acier-vs-aluminium',
    title: 'Radiateur fonte vs acier vs aluminium : lequel choisir ?',
    metaDescription:
      'Comparatif radiateur fonte, acier et aluminium en 2026 : prix, inertie, montée en température, design. Guide pour choisir vos radiateurs.',
    intro:
      "Le choix du radiateur impacte directement votre confort thermique et votre facture de chauffage. Fonte, acier et aluminium sont les trois matériaux principaux pour les radiateurs à eau chaude. Chacun a ses caractéristiques de chauffe, son esthétique et sa gamme de prix.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'Radiateur fonte',
        avantages: [
          'Inertie thermique exceptionnelle (continue de chauffer après extinction)',
          'Chaleur douce et homogène (rayonnement)',
          'Durabilité quasi illimitée (certains radiateurs fonte ont 100 ans)',
          'Fonctionne avec tous les systèmes (gaz, fioul, PAC haute température)',
          'Rétro ou classique : valorise les intérieurs patrimoniaux',
          'Silencieux (pas de bruits de dilatation)',
        ],
        inconvenients: [
          'Poids très élevé (15 à 30 kg par élément)',
          'Montée en température lente (30 à 60 minutes)',
          'Prix élevé, surtout en modèles neufs design',
          'Encombrant (profondeur de 10 à 20 cm)',
          'Non compatible PAC basse température (< 50 °C) sans surdimensionnement',
          'Difficile à déplacer en rénovation',
        ],
        prixMoyen: '200 € - 800 € / élément (neuf, posé)',
        dureeVie: '50-100 ans',
        idealPour: 'Chauffage central gaz/fioul, inertie maximale, intérieurs classiques',
      },
      {
        name: 'Radiateur acier',
        avantages: [
          'Montée en température rapide (10 à 20 minutes)',
          'Design moderne et fin (panneaux plats)',
          'Poids modéré (plus léger que la fonte)',
          'Large gamme de dimensions et de puissances',
          'Prix accessible',
          'Compatible PAC basse température (grande surface d\'échange)',
        ],
        inconvenients: [
          'Inertie faible : refroidit vite après extinction',
          'Sensible à la corrosion (qualité de l\'eau du circuit)',
          'Bruits de dilatation possibles (claquements au démarrage)',
          'Durée de vie inférieure à la fonte (20-30 ans)',
          'Surface de chauffe limitée par la compacité',
        ],
        prixMoyen: '100 € - 500 € / radiateur (posé)',
        dureeVie: '20-30 ans',
        idealPour: 'Rénovation, PAC basse température, intérieurs modernes, budgets moyens',
      },
      {
        name: 'Radiateur aluminium',
        avantages: [
          'Montée en température la plus rapide (5 à 15 minutes)',
          'Très léger (facile à poser et à transporter)',
          'Excellent rapport puissance/poids',
          'Design contemporain et compact',
          'Compatible PAC basse température',
          'Bonne réactivité pour la régulation pièce par pièce',
        ],
        inconvenients: [
          'Inertie faible : refroidit très vite',
          'Sensible à la corrosion électrolytique (ne pas mixer avec des éléments en acier)',
          'Qualité très variable selon les fabricants',
          'Durée de vie inférieure (15-25 ans)',
          'Bruits de dilatation fréquents',
          'Nécessite un inhibiteur de corrosion dans le circuit',
        ],
        prixMoyen: '80 € - 400 € / radiateur (posé)',
        dureeVie: '15-25 ans',
        idealPour: 'Rénovation rapide, PAC basse température, régulation réactive, petits budgets',
      },
    ],
    verdict:
      "L'acier est le choix polyvalent par excellence en 2026 : bon compromis entre inertie, réactivité et prix, compatible avec les PAC basse température qui se généralisent. La fonte reste imbattable pour le confort de chauffe dans les maisons anciennes avec chaudière gaz ou fioul. L'aluminium convient aux rénovations rapides et aux budgets serrés, à condition de bien traiter le circuit d'eau. Pour une PAC basse température, surdimensionnez vos radiateurs de 30 à 50 % pour compenser la température d'eau plus basse.",
    criteresChoix: [
      'Type de chaudière ou PAC (haute ou basse température)',
      'Inertie souhaitée vs réactivité',
      'Poids supportable par les murs',
      'Budget par radiateur',
      'Style de décoration intérieure',
      'Qualité de l\'eau du circuit de chauffage',
    ],
    faq: [
      {
        question: 'Peut-on garder ses vieux radiateurs fonte avec une PAC ?',
        answer:
          'Oui, à condition d\'installer une PAC haute température (65-80 °C) qui fournit une eau assez chaude pour les radiateurs fonte dimensionnés pour du 70/50 °C. Avec une PAC basse température (35-45 °C), les radiateurs fonte ne fourniront que 50 à 60 % de leur puissance nominale. Il faudra alors ajouter des éléments ou les compléter avec d\'autres radiateurs.',
      },
      {
        question: 'Comment désembouer un circuit de radiateurs ?',
        answer:
          'Le désembouage consiste à nettoyer le circuit de chauffage des boues (oxydes de fer) qui réduisent les performances. Un chauffagiste injecte un produit désembouant, laisse circuler 24 à 48h, puis rince le circuit à grande eau. Comptez 500 à 1 500 € selon le nombre de radiateurs. C\'est recommandé tous les 5 à 10 ans ou lors du remplacement de la chaudière.',
      },
      {
        question: 'Combien de radiateurs faut-il par pièce ?',
        answer:
          'La règle de base est 100 W/m² pour une maison bien isolée et 130-150 W/m² pour une maison ancienne. Un radiateur de 1 500 W chauffe donc 10 à 15 m². Pour une pièce de 20 m², prévoyez 1 à 2 radiateurs de 1 500 W. Privilégiez 2 radiateurs plus petits plutôt qu\'un seul gros pour une meilleure répartition de la chaleur.',
      },
    ],
  },
  {
    slug: 'gouttiere-zinc-vs-alu-vs-pvc',
    title: 'Gouttière zinc vs aluminium vs PVC : laquelle choisir ?',
    metaDescription:
      'Comparatif gouttières zinc, aluminium et PVC en 2026 : prix au mètre linéaire, durée de vie, entretien, esthétique. Guide pour choisir vos gouttières.',
    intro:
      "Les gouttières assurent l'évacuation des eaux pluviales et protègent vos fondations et vos façades. Zinc, aluminium et PVC sont les trois matériaux les plus utilisés, avec des différences notables de durabilité, d'esthétique et de prix.",
    category: 'Structure',
    options: [
      {
        name: 'Gouttière zinc',
        avantages: [
          'Durée de vie exceptionnelle (30 à 50 ans, jusqu\'à 80 ans en zinc-titane)',
          'Esthétique traditionnelle, patine grise naturelle élégante',
          'Soudable : étanchéité parfaite aux joints',
          'Résistante au gel et aux UV',
          'Recyclable à 100 %',
          'Matériau de référence en France pour les bâtiments historiques',
        ],
        inconvenients: [
          'Prix le plus élevé (30-60 €/ml posé en demi-ronde)',
          'Pose par un zingueur qualifié (soudure à l\'étain)',
          'Sensible à la corrosion en milieu acide (proximité de chênes, bois résineux)',
          'Dilatation thermique importante (joints de dilatation nécessaires)',
          'Pas de choix de couleur (gris naturel uniquement, sauf zinc prélaqué)',
        ],
        prixMoyen: '30 € - 60 € / ml (posé)',
        dureeVie: '30-80 ans',
        idealPour: 'Maisons anciennes, patrimoine, durabilité maximale, régions tempérées',
      },
      {
        name: 'Gouttière aluminium (laqué)',
        avantages: [
          'Très léger et facile à poser',
          'Large choix de couleurs RAL (s\'accorde à la façade)',
          'Résistante à la corrosion (anodisation ou laquage)',
          'Fabrication en continu : pas de joint sur la longueur (moins de fuites)',
          'Entretien minimal',
          'Bon rapport qualité/prix/durabilité',
        ],
        inconvenients: [
          'Prix intermédiaire (20-45 €/ml posé)',
          'Non soudable sur chantier (assemblage par collage ou rivetage)',
          'Dilatation thermique (clips de dilatation nécessaires)',
          'Sensible aux chocs (déformation possible)',
          'Moins noble que le zinc en esthétique traditionnelle',
        ],
        prixMoyen: '20 € - 45 € / ml (posé)',
        dureeVie: '25-40 ans',
        idealPour: 'Maisons modernes, choix de couleur souhaité, bon compromis prix/durabilité',
      },
      {
        name: 'Gouttière PVC',
        avantages: [
          'Prix le plus bas (10-25 €/ml posé)',
          'Installation facile (collage, pas de soudure)',
          'Résistante à la corrosion et aux produits chimiques',
          'Légère et facile à manipuler',
          'Plusieurs coloris disponibles (gris, sable, blanc, noir)',
          'Accessible aux bricoleurs',
        ],
        inconvenients: [
          'Durée de vie limitée (15-25 ans)',
          'Se décolore et devient cassant avec le temps (UV)',
          'Joints collés qui peuvent fuir avec la dilatation',
          'Esthétique basique, aspect plastique visible',
          'Non recyclable en fin de vie (incinération)',
          'Résistance mécanique faible (casse sous le poids de la neige)',
        ],
        prixMoyen: '10 € - 25 € / ml (posé)',
        dureeVie: '15-25 ans',
        idealPour: 'Petits budgets, dépendances, garages, abris de jardin',
      },
    ],
    verdict:
      "L'aluminium laqué est le meilleur choix en 2026 pour la majorité des maisons : bon rapport qualité/prix, large palette de couleurs et durabilité correcte. Le zinc reste le choix premium pour les bâtiments patrimoniaux et lorsque la durabilité est la priorité. Le PVC ne se justifie que pour les petits budgets et les bâtiments secondaires (garage, abri). Investir dans du zinc ou de l'alu évite 2 à 3 remplacements de PVC sur la durée de vie d'une maison.",
    criteresChoix: [
      'Budget par mètre linéaire',
      'Style de la maison (patrimoine ou contemporain)',
      'Durée de vie souhaitée',
      'Couleur souhaitée (ou patine naturelle)',
      'Zone climatique (gel, neige, vent)',
      'Capacité à trouver un zingueur qualifié (pour le zinc)',
    ],
    faq: [
      {
        question: 'À quelle fréquence faut-il nettoyer les gouttières ?',
        answer:
          'Au minimum 2 fois par an : à l\'automne après la chute des feuilles et au printemps. En zone boisée, 3 à 4 nettoyages par an sont recommandés. Un crapaudine (grille) à l\'entrée de la descente et des grilles pare-feuilles sur les gouttières réduisent l\'encrassement. Le nettoyage coûte 5 à 10 €/ml par un professionnel.',
      },
      {
        question: 'Gouttière demi-ronde ou carrée ?',
        answer:
          'La demi-ronde (profil arrondi) est le format traditionnel, adapté aux maisons anciennes et aux toitures en tuiles ou ardoise. La gouttière carrée (ou havraise) est plus contemporaine, avec un débit supérieur à section égale. Le choix est principalement esthétique. En zone de forte pluviométrie, la gouttière carrée offre un meilleur débit d\'évacuation.',
      },
      {
        question: 'Peut-on remplacer ses gouttières soi-même ?',
        answer:
          'Le PVC est accessible aux bons bricoleurs (collage, pas de soudure). L\'aluminium nécessite des outils spécifiques (riveteuse, cisaille aviation). Le zinc exige un savoir-faire de zingueur (soudure à l\'étain, façonnage). Attention : le travail en hauteur nécessite un échafaudage sécurisé. Un professionnel facture 15 à 30 €/ml de pose selon le matériau.',
      },
    ],
  },
  {
    slug: 'enduit-facade-vs-bardage-vs-peinture',
    title: 'Enduit de façade vs bardage vs peinture : quel revêtement extérieur choisir ?',
    metaDescription:
      'Comparatif enduit de façade, bardage (bois, composite, PVC) et peinture extérieure en 2026 : prix, durabilité, entretien, isolation. Guide pour rénover votre façade.',
    intro:
      "Le revêtement de façade protège votre maison des intempéries et définit son identité visuelle. Enduit (monocouche ou traditionnel), bardage (bois, composite, PVC) et peinture de façade sont les trois grandes options pour la rénovation ou la construction. Chacune a ses contraintes de mise en œuvre et de durabilité.",
    category: 'Structure',
    options: [
      {
        name: 'Enduit de façade (monocouche ou traditionnel)',
        avantages: [
          'Finition la plus courante en France (80 % des façades)',
          'Large choix de teintes et de textures (gratté, taloché, ribbé, écrasé)',
          'Protection durable contre les intempéries',
          'Compatible avec l\'isolation par l\'extérieur (ITE sous enduit)',
          'Prix compétitif (30-80 €/m² posé selon finition)',
          'Pas de structure porteuse supplémentaire',
        ],
        inconvenients: [
          'Fissuration possible avec le temps (retrait, mouvements du bâti)',
          'Encrassement et verdissement en façade nord (nettoyage tous les 5-10 ans)',
          'Application par temps sec uniquement (pas de gel, pas de pluie)',
          'Réparation visible si la teinte a évolué',
          'Enduit traditionnel (3 couches) : coût et temps de mise en œuvre élevés',
        ],
        prixMoyen: '30 € - 80 € / m² (posé)',
        dureeVie: '20-40 ans',
        idealPour: 'Constructions neuves, ravalements, ITE, la plupart des régions françaises',
      },
      {
        name: 'Bardage (bois, composite ou PVC)',
        avantages: [
          'Pose sèche et rapide (pas de temps de séchage)',
          'Excellente protection contre les intempéries (ventilation derrière le bardage)',
          'Esthétique contemporaine ou naturelle selon le matériau',
          'Isolation par l\'extérieur intégrée (ITE sous bardage rapporté)',
          'Masque les imperfections de la façade existante',
          'Remplacement unitaire des lames possible',
        ],
        inconvenients: [
          'Prix plus élevé que l\'enduit (60-150 €/m² posé selon matériau)',
          'Bardage bois : entretien régulier (lasure tous les 3-5 ans) ou grisaillement accepté',
          'Modification importante de l\'aspect extérieur (déclaration préalable obligatoire)',
          'Épaisseur ajoutée à la façade (débord de toit, appuis de fenêtre à adapter)',
          'Risque incendie : réglementation stricte en zone urbaine dense',
        ],
        prixMoyen: '60 € - 150 € / m² (posé)',
        dureeVie: '25-50 ans (selon matériau)',
        idealPour: 'Rénovation de façades dégradées, ITE, esthétique contemporaine, extensions',
      },
      {
        name: 'Peinture de façade',
        avantages: [
          'Prix le plus accessible (15-35 €/m² posé, 2 couches)',
          'Application rapide (une maison en 3-5 jours)',
          'Large choix de coloris',
          'Rafraîchissement facile sans gros travaux',
          'Compatible avec tous les supports (enduit, béton, brique, pierre)',
          'Peintures techniques : anti-mousse, hydrofuge, élastique (anti-fissures)',
        ],
        inconvenients: [
          'Durée de vie limitée (5-10 ans avant rafraîchissement)',
          'Ne masque pas les fissures structurelles',
          'Préparation du support indispensable (nettoyage HP, traitement anti-mousse)',
          'Pas d\'isolation thermique ajoutée',
          'Décoloration possible (façades exposées sud)',
          'Écaillage si le support n\'est pas sain',
        ],
        prixMoyen: '15 € - 35 € / m² (posé, 2 couches)',
        dureeVie: '5-10 ans',
        idealPour: 'Rafraîchissement rapide, budgets limités, façades en bon état',
      },
    ],
    verdict:
      "L'enduit reste la solution standard et durable pour les constructions neuves et les ravalements complets. Le bardage est le choix idéal en rénovation, surtout couplé à une ITE pour améliorer le DPE — c'est un investissement qui se rentabilise en confort et en valeur immobilière. La peinture de façade est le rafraîchissement économique pour les façades en bon état structurel. En 2026, le bardage fibro-ciment (Eternit, Cedral) gagne du terrain : zéro entretien, ininflammable et aspect bois réaliste.",
    criteresChoix: [
      'État actuel de la façade (saine ou dégradée)',
      'Souhait d\'isolation par l\'extérieur (ITE) ou non',
      'Budget par m² de façade',
      'Contraintes urbanistiques (PLU, ABF)',
      'Fréquence d\'entretien acceptée',
      'Style architectural souhaité',
    ],
    faq: [
      {
        question: 'Le ravalement de façade est-il obligatoire ?',
        answer:
          'Oui, dans certaines communes, le ravalement de façade est obligatoire tous les 10 ans (Paris, Lyon, et communes ayant pris un arrêté spécifique). En copropriété, le ravalement est voté en assemblée générale. Vous pouvez être mis en demeure par la mairie si votre façade est dégradée. Le ravalement est aussi obligatoire avant la vente dans certains cas.',
      },
      {
        question: 'Peut-on changer la couleur de sa façade ?',
        answer:
          'Oui, mais il faut déposer une déclaration préalable de travaux en mairie. Le PLU impose souvent une palette de couleurs autorisées (nuancier communal). En secteur protégé, l\'avis de l\'ABF est obligatoire. En copropriété, le changement de couleur nécessite un vote en assemblée générale. Renseignez-vous en mairie avant de choisir votre teinte.',
      },
      {
        question: 'Combien coûte un ravalement de façade complet ?',
        answer:
          'Pour une maison de 100 m² de façade : peinture seule (1 500-3 500 €), enduit monocouche (3 000-8 000 €), bardage bois/composite (6 000-15 000 €). Ajoutez 1 500 à 3 000 € pour l\'échafaudage. En copropriété, le coût est réparti selon les tantièmes. Demandez plusieurs devis et vérifiez que l\'artisan est assuré en garantie décennale.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 10 NOUVEAUX COMPARATIFS (ajoutés mars 2026)
  // ═══════════════════════════════════════════════════════════════

  {
    slug: 'pac-air-air-vs-air-eau',
    title: 'PAC air/air vs air/eau : laquelle choisir ?',
    metaDescription:
      'Comparatif PAC air/air vs PAC air/eau en 2026 : prix, rendement, aides financières, confort. Découvrez quelle pompe à chaleur correspond le mieux à votre logement.',
    intro:
      "Vous hésitez entre une pompe à chaleur air/air et une pompe à chaleur air/eau ? Ces deux systèmes fonctionnent sur le même principe (capter les calories de l'air extérieur) mais diffèrent radicalement dans leur mode de diffusion de la chaleur. La PAC air/air souffle de l'air chaud via des splits muraux, tandis que la PAC air/eau alimente un circuit hydraulique (radiateurs ou plancher chauffant). Ce choix impacte directement votre confort, vos économies d'énergie et les aides auxquelles vous pouvez prétendre.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'PAC air/air (climatisation réversible)',
        avantages: [
          'Prix d\'installation le plus bas des PAC (2 500 à 6 000 € pour un multi-split)',
          'Chauffage ET climatisation intégrés dans un seul système',
          'Installation rapide (1 à 2 jours) sans modification du réseau de chauffage',
          'Réglage pièce par pièce grâce aux unités intérieures indépendantes',
          'COP de 3,5 à 4,5 selon les modèles récents (2026)',
          'Filtration de l\'air intégré (pollen, poussières)',
        ],
        inconvenients: [
          'Non éligible à MaPrimeRénov\' (considérée comme climatisation)',
          'Ne produit pas d\'eau chaude sanitaire',
          'Assèche l\'air ambiant en mode chauffage',
          'Brassage d\'air parfois inconfortable (courants d\'air)',
          'Splits muraux visibles, impact esthétique dans les pièces',
          'Performance en chute sous -10 °C',
        ],
        prixMoyen: '2 500 € - 6 000 €',
        dureeVie: '12-18 ans',
        idealPour: 'Appartements, petites surfaces, régions à climat doux, besoin de clim en été',
      },
      {
        name: 'PAC air/eau',
        avantages: [
          'Éligible à MaPrimeRénov\' 2026 (jusqu\'à 5 000 €) et CEE (prime coup de pouce)',
          'Compatible avec le chauffage central existant (radiateurs, plancher chauffant)',
          'Produit le chauffage ET l\'eau chaude sanitaire',
          'Chaleur douce et homogène, sans brassage d\'air',
          'COP de 3 à 4,2 selon la température extérieure',
          'Aucun split visible à l\'intérieur (seulement l\'unité extérieure)',
        ],
        inconvenients: [
          'Investissement plus élevé (8 000 à 18 000 € pose comprise)',
          'Installation plus complexe (2 à 4 jours, raccordement hydraulique)',
          'Nécessite un réseau de chauffage central existant ou à créer',
          'Pas de fonction climatisation (sauf modèles réversibles sur plancher)',
          'Performance dégradée en dessous de -7 °C (appoint électrique)',
          'Entretien obligatoire tous les 2 ans (200 à 350 €)',
        ],
        prixMoyen: '8 000 € - 18 000 €',
        dureeVie: '15-20 ans',
        idealPour: 'Maisons avec chauffage central, projets de rénovation globale, éligibles aux aides',
      },
    ],
    verdict:
      'La PAC air/air est idéale pour un budget serré ou un besoin de climatisation en été, notamment en appartement. La PAC air/eau est le choix de référence pour une rénovation énergétique complète : elle assure chauffage et eau chaude, et bénéficie d\'aides financières substantielles. Si vous avez déjà des radiateurs ou un plancher chauffant, la PAC air/eau s\'impose. Si vous partez de zéro dans un logement sans chauffage central, la PAC air/air sera moins coûteuse à installer.',
    criteresChoix: [
      'Type de logement : appartement (air/air) vs maison (air/eau)',
      'Réseau de chauffage existant : si radiateurs déjà en place → air/eau',
      'Besoin de climatisation en été : oui → air/air',
      'Budget travaux disponible : < 6 000 € → air/air, > 8 000 € → air/eau',
      'Éligibilité aux aides : seule la PAC air/eau ouvre droit à MaPrimeRénov\'',
      'Production d\'eau chaude : uniquement possible avec la PAC air/eau',
    ],
    faq: [
      {
        question: 'Peut-on combiner une PAC air/air et une PAC air/eau ?',
        answer:
          'Oui, c\'est même une solution pertinente dans certains cas : la PAC air/eau assure le chauffage central et l\'eau chaude, tandis que la PAC air/air climatise les pièces en été. Cependant, cela représente un double investissement. Il est souvent plus économique de choisir une PAC air/eau réversible sur plancher chauffant si vous souhaitez un rafraîchissement estival.',
      },
      {
        question: 'Quelle PAC consomme le moins d\'électricité ?',
        answer:
          'À surface équivalente, la PAC air/air consomme légèrement moins car elle ne chauffe pas d\'eau. En moyenne, comptez 800 à 1 200 €/an d\'électricité pour une PAC air/air (100 m²) contre 1 000 à 1 500 €/an pour une PAC air/eau (chauffage + ECS). Le COP des deux systèmes est comparable (3 à 4,5).',
      },
      {
        question: 'La PAC air/air est-elle vraiment exclue de MaPrimeRénov\' ?',
        answer:
          'Oui, depuis 2020, la PAC air/air est exclue de MaPrimeRénov\' car elle est assimilée à un système de climatisation. Seuls les systèmes à eau (PAC air/eau, géothermie) et le solaire thermique sont éligibles. Vous pouvez toutefois bénéficier du taux de TVA réduit à 10 % si le logement a plus de 2 ans.',
      },
      {
        question: 'Quel entretien pour chaque type de PAC ?',
        answer:
          'La PAC air/air nécessite un nettoyage régulier des filtres (tous les 15 jours en utilisation intensive) et une vérification annuelle recommandée (100-200 €). La PAC air/eau impose un entretien obligatoire tous les 2 ans par un professionnel certifié (200-350 €), incluant le contrôle du circuit frigorifique et hydraulique.',
      },
    ],
  },

  {
    slug: 'chaudiere-gaz-vs-bois-granules',
    title: 'Chaudière gaz vs bois/granulés : quel combustible choisir ?',
    metaDescription:
      'Comparatif chaudière gaz condensation vs chaudière bois à granulés en 2026 : prix, rendement, écologie, aides. Guide complet pour choisir votre système de chauffage.',
    intro:
      "Face à la hausse du prix du gaz et aux nouvelles réglementations environnementales, de nombreux propriétaires envisagent de remplacer leur chaudière gaz par un système bois à granulés (pellets). Si la chaudière gaz à condensation reste performante et abordable, la chaudière à granulés séduit par son bilan carbone quasi neutre et un coût de combustible stable. Voici un comparatif complet pour vous aider à trancher.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'Chaudière gaz à condensation',
        avantages: [
          'Coût d\'installation modéré (3 500 à 7 500 € pose comprise)',
          'Rendement élevé jusqu\'à 109 % sur PCI',
          'Encombrement réduit (murale ou au sol compacte)',
          'Montée en température très rapide',
          'Technologie maîtrisée par tous les chauffagistes',
          'Pas de stockage de combustible nécessaire',
        ],
        inconvenients: [
          'Énergie fossile : émissions de CO₂ (230 g/kWh)',
          'Prix du gaz en hausse constante (+60 % entre 2021 et 2026)',
          'Interdite en construction neuve (RE2020)',
          'Non éligible à MaPrimeRénov\' depuis 2023',
          'Entretien annuel obligatoire (150-250 €)',
          'Dépendance au réseau de gaz naturel',
        ],
        prixMoyen: '3 500 € - 7 500 €',
        dureeVie: '15-25 ans',
        idealPour: 'Logements déjà raccordés au gaz, budget limité, espace restreint',
      },
      {
        name: 'Chaudière bois à granulés (pellets)',
        avantages: [
          'Énergie renouvelable : bilan carbone quasi neutre',
          'Éligible à MaPrimeRénov\' 2026 (jusqu\'à 7 000 € pour les ménages modestes)',
          'Coût du combustible stable et compétitif (350-400 €/tonne en 2026)',
          'Rendement de 90 à 95 % sur les modèles récents',
          'Alimentation automatique par vis sans fin (confort d\'utilisation)',
          'Valorise la filière bois française (emplois locaux)',
        ],
        inconvenients: [
          'Investissement initial élevé (12 000 à 22 000 € pose comprise)',
          'Nécessite un espace de stockage pour le silo à granulés (1 à 3 m²)',
          'Livraison de granulés à organiser (1 à 2 fois/an)',
          'Entretien plus contraignant : décendrage, ramonage 2 fois/an',
          'Bruit du système d\'alimentation (vis sans fin)',
          'Poids important : installation au sol uniquement',
        ],
        prixMoyen: '12 000 € - 22 000 €',
        dureeVie: '20-30 ans',
        idealPour: 'Maisons rurales ou péri-urbaines avec espace de stockage, démarche écologique',
      },
    ],
    verdict:
      'La chaudière gaz reste pertinente si vous êtes déjà raccordé et disposez d\'un budget limité, mais son avenir est incertain face aux réglementations. La chaudière à granulés est l\'investissement d\'avenir : écologique, subventionnée et économique à l\'usage (coût annuel de combustible 30 à 40 % inférieur au gaz). Si vous avez l\'espace pour un silo et un budget initial conséquent, les granulés sont le choix le plus rationnel en 2026.',
    criteresChoix: [
      'Raccordement au gaz existant : si oui, le remplacement gaz-gaz est moins cher',
      'Espace disponible pour un silo de stockage (1 à 3 m² au sol)',
      'Budget initial : 3 500-7 500 € (gaz) vs 12 000-22 000 € (granulés)',
      'Sensibilité écologique et objectif de réduction CO₂',
      'Accès livraison granulés (facilité en zone rurale/péri-urbaine)',
      'Éligibilité aux aides : seule la chaudière granulés est aidée par MaPrimeRénov\'',
    ],
    faq: [
      {
        question: 'Combien coûte le chauffage annuel en gaz vs granulés ?',
        answer:
          'Pour une maison de 120 m² bien isolée : gaz naturel environ 1 600 à 2 200 €/an (prix 2026), granulés environ 1 000 à 1 400 €/an (4 à 5 tonnes). Les granulés reviennent 30 à 40 % moins cher, mais l\'écart se réduit si le logement est très bien isolé. Le prix du gaz est plus volatile que celui des granulés.',
      },
      {
        question: 'Les chaudières gaz vont-elles être interdites en rénovation ?',
        answer:
          'En 2026, seules les constructions neuves sont concernées par l\'interdiction (RE2020). En rénovation, vous pouvez toujours installer une chaudière gaz à condensation. Cependant, l\'Union européenne prévoit des restrictions progressives d\'ici 2030-2035. Anticiper le passage aux granulés ou à une PAC est une stratégie prudente.',
      },
      {
        question: 'Les granulés sont-ils vraiment écologiques ?',
        answer:
          'Oui, à condition d\'utiliser des granulés certifiés (DINplus, ENplus A1) issus de forêts gérées durablement. Le bilan carbone est quasi neutre car le CO₂ émis lors de la combustion a été absorbé par l\'arbre durant sa croissance. La filière française produit environ 2,5 millions de tonnes/an, couvrant la demande nationale sans déforestation.',
      },
      {
        question: 'Peut-on passer du gaz aux granulés facilement ?',
        answer:
          'Le remplacement nécessite 2 à 4 jours de travaux. Il faut retirer l\'ancienne chaudière, installer la chaudière à granulés et son silo, raccorder au circuit hydraulique existant (compatible) et créer un conduit de fumées adapté. Le tubage du conduit existant est souvent possible. Prévoyez un budget global de 15 000 à 25 000 € avant aides.',
      },
    ],
  },

  {
    slug: 'isolation-laine-vs-ouate-vs-polyurethane',
    title: 'Isolants : laine de verre, ouate de cellulose ou polyuréthane ?',
    metaDescription:
      'Comparatif des isolants en 2026 : laine de verre, ouate de cellulose et polyuréthane. Prix au m², performance thermique, écologie et mise en œuvre. Guide complet.',
    intro:
      "Le choix de l'isolant est une étape cruciale de tout projet de rénovation énergétique. Laine de verre, ouate de cellulose et polyuréthane offrent des performances thermiques comparables mais se distinguent par leur prix, leur impact écologique, leur comportement au feu et leur facilité de mise en œuvre. Ce comparatif vous aide à identifier l'isolant le plus adapté à votre projet.",
    category: 'Isolation',
    options: [
      {
        name: 'Laine de verre',
        avantages: [
          'Prix le plus bas du marché (5 à 12 €/m² en 100 mm)',
          'Excellente résistance au feu (classement A1, incombustible)',
          'Bonne performance thermique (lambda 0,032 à 0,040 W/m.K)',
          'Disponible en rouleaux, panneaux et vrac (soufflage combles)',
          'Légère et facile à poser',
          'Produit le plus courant, disponible partout',
        ],
        inconvenients: [
          'Irritante à la pose (port d\'EPI obligatoire)',
          'Sensible à l\'humidité : perd ses propriétés si mouillée',
          'Tassement possible dans le temps (perte de 10-15 % en 20 ans)',
          'Bilan carbone moyen (fusion du verre à haute température)',
          'Isolation acoustique moyenne comparée à la ouate',
          'Durée de vie plus courte que les alternatives',
        ],
        prixMoyen: '5 € - 12 €/m² (100 mm)',
        dureeVie: '20-30 ans',
        idealPour: 'Budgets serrés, combles perdus en soufflage, projets standard',
      },
      {
        name: 'Ouate de cellulose',
        avantages: [
          'Matériau écologique (papier journal recyclé, 90 % de contenu recyclé)',
          'Excellente isolation acoustique (affaiblissement de 40 à 50 dB)',
          'Bonne régulation hygrométrique (absorbe et restitue l\'humidité)',
          'Performance thermique élevée (lambda 0,038 à 0,042 W/m.K)',
          'Très bon confort d\'été grâce à son inertie thermique',
          'Bilan carbone très faible (10 fois moins que le polyuréthane)',
        ],
        inconvenients: [
          'Prix intermédiaire (15 à 25 €/m² en 100 mm posé)',
          'Mise en œuvre spécialisée (soufflage ou insufflation par un pro)',
          'Tassement possible de 15-20 % si mal posée (surdosage nécessaire)',
          'Traitement ignifuge au sel de bore (réglementation variable)',
          'Peu adaptée aux parois verticales sans caisson fermé',
          'Sensibilité aux rongeurs si non protégée',
        ],
        prixMoyen: '15 € - 25 €/m² (100 mm posé)',
        dureeVie: '30-40 ans',
        idealPour: 'Démarche écologique, isolation des combles, rénovation de maisons anciennes',
      },
      {
        name: 'Polyuréthane (PUR/PIR)',
        avantages: [
          'Meilleure performance thermique du marché (lambda 0,022 à 0,028 W/m.K)',
          'Épaisseur réduite pour une résistance thermique donnée (-40 % vs laine)',
          'Totalement insensible à l\'humidité (cellules fermées)',
          'Excellente résistance mécanique en compression',
          'Pas de tassement dans le temps',
          'Idéal pour les espaces contraints (ITE, sous-sol, toiture terrasse)',
        ],
        inconvenients: [
          'Prix le plus élevé (25 à 50 €/m² en 100 mm)',
          'Produit issu de la pétrochimie (mauvais bilan carbone)',
          'Dégage des fumées toxiques en cas d\'incendie (classement B-s2,d0)',
          'Non recyclable en fin de vie',
          'Rigide : peu adapté aux surfaces irrégulières',
          'Mauvaise isolation acoustique (ne coupe pas les bruits d\'impact)',
        ],
        prixMoyen: '25 € - 50 €/m² (100 mm)',
        dureeVie: '40-50 ans',
        idealPour: 'ITE en faible épaisseur, toitures terrasses, sols, espaces réduits',
      },
    ],
    verdict:
      'La laine de verre reste le choix économique par excellence pour les combles perdus et les projets à budget limité. La ouate de cellulose est le meilleur compromis performance/écologie, idéale en rénovation de maisons anciennes. Le polyuréthane s\'impose quand l\'espace est compté (isolation par l\'extérieur fine, sols, toitures terrasses) malgré son coût et son impact environnemental. Pour les combles aménageables, la ouate insufflée dans les rampants est souvent la meilleure option.',
    criteresChoix: [
      'Budget disponible : laine de verre (économique) vs polyuréthane (premium)',
      'Sensibilité écologique : ouate de cellulose (biosourcé) vs polyuréthane (pétrochimie)',
      'Épaisseur disponible : si espace limité → polyuréthane',
      'Type de mise en œuvre : combles perdus (soufflage laine ou ouate), murs (panneaux)',
      'Besoin acoustique : ouate de cellulose > laine de verre > polyuréthane',
      'Risque d\'humidité : polyuréthane (insensible) > ouate > laine de verre',
    ],
    faq: [
      {
        question: 'Quelle épaisseur d\'isolant pour la RT2020/RE2020 ?',
        answer:
          'En combles : R ≥ 7 m².K/W, soit environ 280 mm de laine de verre, 300 mm de ouate, ou 180 mm de polyuréthane. En murs : R ≥ 3,7, soit environ 140 mm de laine, 150 mm de ouate, ou 100 mm de polyuréthane. Ces valeurs sont les minimums pour bénéficier des aides MaPrimeRénov\' 2026.',
      },
      {
        question: 'La ouate de cellulose attire-t-elle les rongeurs ?',
        answer:
          'Non, les sels de bore utilisés comme traitement ignifuge repoussent les rongeurs et insectes. Cependant, si l\'isolant est accessible (combles perdus ouverts), il est recommandé de protéger les accès avec des grilles anti-rongeurs. Une pose professionnelle avec la bonne densité (28-30 kg/m³ en soufflage) limite aussi les risques.',
      },
      {
        question: 'Le polyuréthane est-il dangereux en cas d\'incendie ?',
        answer:
          'Le polyuréthane dégage des fumées toxiques (isocyanates) en cas de combustion. C\'est pourquoi il doit toujours être recouvert d\'un parement coupe-feu (plaque de plâtre BA13 minimum). Les panneaux PIR (polyisocyanurate) offrent une meilleure résistance au feu que le PUR classique. En ERP, des restrictions spécifiques s\'appliquent.',
      },
      {
        question: 'Peut-on mélanger différents isolants dans une même maison ?',
        answer:
          'Oui, c\'est même recommandé dans certains cas. Par exemple : ouate de cellulose en combles (pour le confort d\'été et l\'acoustique), polyuréthane en ITE (pour minimiser l\'épaisseur) et laine de verre en cloisons intérieures (pour le rapport qualité-prix). L\'important est de traiter les jonctions entre isolants pour éviter les ponts thermiques.',
      },
    ],
  },

  {
    slug: 'plafond-tendu-vs-faux-plafond',
    title: 'Plafond tendu vs faux plafond : lequel choisir ?',
    metaDescription:
      'Comparatif plafond tendu vs faux plafond en plaques de plâtre en 2026 : prix au m², pose, isolation, esthétique. Guide complet pour rénover votre plafond.',
    intro:
      "Lors d'une rénovation, le plafond est souvent le parent pauvre des travaux. Pourtant, deux solutions permettent de transformer radicalement une pièce : le plafond tendu (toile PVC ou polyester tendue sur profilés) et le faux plafond en plaques de plâtre (BA13 sur ossature métallique). Chacun a ses atouts en termes de prix, de mise en œuvre et de résultat esthétique.",
    category: 'Structure',
    options: [
      {
        name: 'Plafond tendu',
        avantages: [
          'Pose rapide sans poussière (1 jour pour une pièce de 20 m²)',
          'Finition parfaite : surface lisse, sans joint ni fissure',
          'Large choix de finitions : mat, satiné, laqué, imprimé, lumineux',
          'Imperméable : protège en cas de fuite d\'eau (retient jusqu\'à 100 L/m²)',
          'Perte de hauteur minimale (3 à 5 cm seulement)',
          'Aucun entretien, ne jaunit pas et ne se fissure pas',
        ],
        inconvenients: [
          'Prix plus élevé (40 à 90 €/m² posé)',
          'Non réparable en cas de perforation (remplacement de la toile)',
          'Pas d\'isolation thermique ou phonique intrinsèque',
          'Nécessite un professionnel spécialisé (technique de chauffe pour PVC)',
          'Résonance possible dans les grandes pièces',
          'Sens interdit pour les perforations (spots à prévoir avant la pose)',
        ],
        prixMoyen: '40 € - 90 €/m² posé',
        dureeVie: '15-25 ans (garantie 10 ans)',
        idealPour: 'Rénovation rapide, pièces humides, plafonds abîmés ou irréguliers, design contemporain',
      },
      {
        name: 'Faux plafond en plaques de plâtre (BA13)',
        avantages: [
          'Prix plus accessible (25 à 55 €/m² posé)',
          'Excellente isolation phonique et thermique (avec laine minérale)',
          'Résistant aux chocs et perforations',
          'Permet de dissimuler gaines, câbles et conduits',
          'Réparable facilement (enduit, rebouchage)',
          'Peut être peint, enduit, tapissé selon vos envies',
        ],
        inconvenients: [
          'Pose longue et salissante (2 à 4 jours pour 20 m² avec finitions)',
          'Joints visibles si mal réalisés (bande à joint obligatoire)',
          'Perte de hauteur importante (8 à 15 cm minimum)',
          'Risque de fissures aux joints dans le temps',
          'Sensible à l\'humidité (gonflement en pièce mal ventilée)',
          'Nécessite peinture après pose (coût supplémentaire)',
        ],
        prixMoyen: '25 € - 55 €/m² posé',
        dureeVie: '20-40 ans',
        idealPour: 'Isolation thermique/phonique, intégration de spots, passage de gaines, budget maîtrisé',
      },
    ],
    verdict:
      'Le plafond tendu est idéal pour une rénovation rapide et propre, avec un résultat esthétique impeccable. Il excelle dans les pièces humides et les plafonds très abîmés. Le faux plafond BA13 reste le choix rationnel quand vous avez besoin d\'isolation thermique ou phonique, ou quand le budget est limité. Pour une cuisine ou salle de bains, le plafond tendu PVC est imbattable. Pour les chambres à l\'étage (bruit du dessus), le faux plafond avec laine minérale est préférable.',
    criteresChoix: [
      'Budget : faux plafond BA13 (25-55 €/m²) vs plafond tendu (40-90 €/m²)',
      'Besoin d\'isolation phonique ou thermique : faux plafond BA13 + laine',
      'Hauteur sous plafond disponible : tendu (-3 cm) vs BA13 (-10 cm)',
      'Type de pièce : humide → tendu PVC, chambre → BA13 isolé',
      'Délai souhaité : tendu (1 jour) vs BA13 (3-4 jours)',
      'Finition souhaitée : tendu (laqué, design) vs BA13 (peint classique)',
    ],
    faq: [
      {
        question: 'Le plafond tendu est-il adapté aux pièces humides ?',
        answer:
          'Oui, le plafond tendu PVC est parfaitement imperméable et anti-condensation. C\'est même la solution idéale pour les salles de bains, cuisines et piscines intérieures. Il résiste à l\'humidité sans gonfler ni moisir. En cas de fuite d\'eau de l\'étage supérieur, il forme une poche (jusqu\'à 100 L/m²) et protège vos meubles. Un technicien peut ensuite vider l\'eau et retendre la toile.',
      },
      {
        question: 'Peut-on installer des spots dans un plafond tendu ?',
        answer:
          'Oui, mais ils doivent être prévus AVANT la pose de la toile. Le poseur installe des plateformes de support au plafond, puis perce la toile avec des renforts thermocollants. Utilisez exclusivement des spots LED (pas de halogènes qui dégageraient trop de chaleur). Le coût des spots est généralement en supplément (15-30 € par spot posé).',
      },
      {
        question: 'Le faux plafond BA13 peut-il se fissurer ?',
        answer:
          'Oui, les fissures aux joints sont le défaut principal du faux plafond BA13. Elles apparaissent généralement dans les 2-3 premières années, surtout dans les maisons neuves (tassement). Pour les limiter, exigez un calicot (bande à joint) en fibre de verre, un enduit de qualité et un temps de séchage suffisant entre les couches. Les fissures se réparent facilement avec un enduit souple.',
      },
    ],
  },

  {
    slug: 'porte-blindee-vs-renforcee',
    title: 'Porte blindée vs porte renforcée : laquelle pour votre sécurité ?',
    metaDescription:
      'Comparatif porte blindée vs porte renforcée en 2026 : prix, niveau de sécurité, certification A2P, installation. Guide pour protéger votre logement.',
    intro:
      "La sécurité de votre logement commence par la porte d'entrée. Deux solutions s'offrent à vous : la porte blindée (bloc-porte complet en acier) ou la porte renforcée (porte standard avec blindage ajouté). Le niveau de protection, le prix et l'impact sur votre habitat diffèrent sensiblement entre ces deux options.",
    category: 'Menuiserie',
    options: [
      {
        name: 'Porte blindée (bloc-porte)',
        avantages: [
          'Niveau de sécurité maximal : certification A2P BP1, BP2 ou BP3',
          'Résistance à l\'effraction de 5 à 15 minutes selon la certification',
          'Isolation thermique et phonique intégrée (jusqu\'à 40 dB)',
          'Serrure multipoints intégrée (3, 5 ou 7 points)',
          'Esthétique soignée avec large choix de finitions',
          'Garantie longue (10 à 20 ans selon les fabricants)',
        ],
        inconvenients: [
          'Prix très élevé (1 500 à 5 000 € pose comprise)',
          'Poids important (80 à 120 kg) : nécessite un bâti adapté',
          'Installation par un professionnel spécialisé obligatoire',
          'Changement complet du bâti (huisserie) souvent nécessaire',
          'Délai de fabrication (2 à 4 semaines sur mesure)',
          'En copropriété, la face palière doit respecter l\'harmonie de l\'immeuble',
        ],
        prixMoyen: '1 500 € - 5 000 €',
        dureeVie: '30-50 ans',
        idealPour: 'Rez-de-chaussée, zones à risque, besoin de sécurité maximale, construction neuve',
      },
      {
        name: 'Porte renforcée (blindage de porte existante)',
        avantages: [
          'Prix modéré (600 à 1 800 € pose comprise)',
          'Conservation de la porte existante (face intérieure inchangée)',
          'Installation rapide (demi-journée à une journée)',
          'Pas de modification du bâti dans la plupart des cas',
          'Dissuasif pour 80 % des cambriolages (les voleurs passent à la porte suivante)',
          'Compatible avec toutes les portes en bois standard',
        ],
        inconvenients: [
          'Sécurité inférieure à un bloc-porte blindé (pas de certification A2P BP)',
          'Résistance limitée à 3-5 minutes d\'effraction',
          'Poids ajouté sur les gonds (50-70 kg) : risque d\'affaissement',
          'Isolation thermique et phonique limitée',
          'Esthétique parfois médiocre côté palier (tôle d\'acier visible)',
          'Serrure à remplacer séparément (supplément 200-500 €)',
        ],
        prixMoyen: '600 € - 1 800 €',
        dureeVie: '20-30 ans',
        idealPour: 'Budget limité, appartement en étage, amélioration de la sécurité existante',
      },
    ],
    verdict:
      'La porte blindée (bloc-porte) est le choix sécuritaire par excellence pour un rez-de-chaussée, une maison individuelle ou une zone à risque. Elle offre la meilleure résistance à l\'effraction et une isolation performante. Le blindage de porte existante est un excellent compromis pour les appartements en étage ou les budgets limités : il dissuade la majorité des cambrioleurs à moindre coût. Dans les deux cas, investissez dans une serrure A2P certifiée.',
    criteresChoix: [
      'Niveau de risque : rez-de-chaussée/maison → blindée, étage → renforcée',
      'Budget : 600-1 800 € (renforcée) vs 1 500-5 000 € (blindée)',
      'État de la porte actuelle : bonne → blindage, vétuste → bloc-porte',
      'Copropriété : vérifier le règlement (face palière imposée)',
      'Isolation souhaitée : bloc-porte blindé intègre une isolation performante',
      'Certification A2P : seul le bloc-porte peut être certifié A2P BP',
    ],
    faq: [
      {
        question: 'Que signifie la certification A2P pour une porte blindée ?',
        answer:
          'A2P est une certification délivrée par le CNPP (Centre National de Prévention et de Protection). Elle garantit une résistance testée à l\'effraction : A2P BP1 (5 minutes), A2P BP2 (10 minutes), A2P BP3 (15 minutes). Ces durées paraissent courtes mais 83 % des cambrioleurs abandonnent après 3 minutes. Une porte certifiée A2P est la meilleure garantie de protection.',
      },
      {
        question: 'L\'assurance habitation impose-t-elle une porte blindée ?',
        answer:
          'Non, aucune assurance n\'impose une porte blindée. Cependant, certains contrats offrent une réduction de prime (5 à 15 %) si vous installez une porte certifiée A2P. En cas de cambriolage, l\'assurance ne peut pas refuser l\'indemnisation au motif que la porte n\'était pas blindée, sauf si le contrat stipule des mesures de protection spécifiques (rare).',
      },
      {
        question: 'Peut-on blinder une porte d\'appartement en copropriété ?',
        answer:
          'Oui, mais avec des contraintes. La face palière (côté couloir) doit respecter l\'harmonie de l\'immeuble. Le règlement de copropriété peut imposer une couleur, un matériau ou un style spécifique. Certaines copropriétés exigent un vote en AG. Le blindage de porte existante est souvent plus facile car la face palière reste inchangée (seule la face intérieure est modifiée).',
      },
      {
        question: 'Combien de temps dure l\'installation ?',
        answer:
          'Le blindage d\'une porte existante prend une demi-journée à une journée (3 à 6 heures). L\'installation d\'un bloc-porte blindé nécessite une journée complète (6 à 8 heures) car il faut déposer l\'ancienne porte, adapter ou remplacer le bâti, poser le bloc-porte et régler la serrure multipoints. Votre logement reste accessible pendant toute l\'intervention.',
      },
    ],
  },

  {
    slug: 'parquet-massif-vs-contrecolle-vs-stratifie',
    title: 'Parquet : massif, contrecollé ou stratifié ?',
    metaDescription:
      'Comparatif parquet massif vs contrecollé vs stratifié en 2026 : prix au m², durabilité, pose, entretien. Guide complet pour choisir votre revêtement de sol.',
    intro:
      "Le parquet est le revêtement de sol préféré des Français pour sa chaleur et son élégance. Mais derrière le terme « parquet » se cachent trois produits très différents : le parquet massif (bois noble sur toute l'épaisseur), le parquet contrecollé (couche de bois noble sur support) et le sol stratifié (décor imprimé sur panneau HDF). Prix, durabilité et entretien varient considérablement.",
    category: 'Revêtements',
    options: [
      {
        name: 'Parquet massif',
        avantages: [
          'Noblesse et authenticité : bois noble sur toute l\'épaisseur (14 à 23 mm)',
          'Durée de vie exceptionnelle (50 à 100 ans avec entretien)',
          'Peut être poncé et rénové 5 à 8 fois au cours de sa vie',
          'Valorise le bien immobilier (+3 à 5 % selon les notaires)',
          'Large choix d\'essences : chêne, hêtre, noyer, merbau, teck',
          'Patine naturelle qui s\'embellit avec le temps',
        ],
        inconvenients: [
          'Prix le plus élevé (50 à 150 €/m² hors pose)',
          'Pose collée ou clouée par un professionnel (long et coûteux)',
          'Sensible aux variations hygrométriques (gonflement/retrait)',
          'Entretien régulier nécessaire (huile ou vitrification)',
          'Incompatible avec le chauffage au sol (sauf certaines essences)',
          'Délai d\'acclimatation de 48h avant pose (stockage dans la pièce)',
        ],
        prixMoyen: '50 € - 150 €/m² (hors pose)',
        dureeVie: '50-100 ans',
        idealPour: 'Belles demeures, investissement patrimonial, amoureux du bois authentique',
      },
      {
        name: 'Parquet contrecollé',
        avantages: [
          'Aspect identique au massif (couche de bois noble de 2,5 à 6 mm)',
          'Pose flottante possible (clipsable, rapide, économique)',
          'Compatible avec le chauffage au sol (structure stable)',
          'Moins sensible aux variations hygrométriques que le massif',
          'Peut être poncé 1 à 3 fois (si couche noble ≥ 3,5 mm)',
          'Prix intermédiaire, bon rapport qualité-prix',
        ],
        inconvenients: [
          'Durée de vie inférieure au massif (25 à 50 ans)',
          'Nombre de rénovations limité (1 à 3 ponçages selon épaisseur)',
          'Couche de bois noble parfois fine (2,5 mm entrée de gamme)',
          'Qualité très variable selon les fabricants',
          'Résonance possible en pose flottante (sous-couche indispensable)',
          'Moins valorisant qu\'un massif pour la revente',
        ],
        prixMoyen: '25 € - 80 €/m² (hors pose)',
        dureeVie: '25-50 ans',
        idealPour: 'Rénovation avec chauffage au sol, bon compromis qualité/prix, pose rapide souhaitée',
      },
      {
        name: 'Sol stratifié',
        avantages: [
          'Prix le plus bas (8 à 30 €/m² hors pose)',
          'Pose flottante clipsable très rapide (20 m²/jour en DIY)',
          'Résistance aux taches, rayures et UV (classement AC3 à AC5)',
          'Aucun entretien spécifique (serpillère humide suffit)',
          'Grand choix de décors : bois, béton, carreaux de ciment',
          'Compatible chauffage au sol sans restriction',
        ],
        inconvenients: [
          'Ce n\'est PAS du vrai bois (décor photographique imprimé)',
          'Impossible à poncer ou à rénover (remplacement total)',
          'Sensation au toucher moins agréable que le bois',
          'Sensible à l\'eau stagnante (gonflement irréversible des joints)',
          'Sonorité « plastique » à la marche sans bonne sous-couche',
          'Ne valorise pas le bien immobilier à la revente',
        ],
        prixMoyen: '8 € - 30 €/m² (hors pose)',
        dureeVie: '10-25 ans',
        idealPour: 'Budget limité, locataires, pièces à fort passage, changement fréquent de déco',
      },
    ],
    verdict:
      'Le parquet massif est un investissement patrimonial pour les amoureux du bois authentique, avec une durée de vie inégalée. Le parquet contrecollé offre le meilleur compromis en 2026 : aspect bois noble, compatibilité chauffage au sol et pose facile. Le stratifié est la solution économique pour les budgets serrés ou les pièces à fort passage, mais ne prétend pas être du bois. Conseil : pour un salon, investissez dans du contrecollé chêne (couche noble ≥ 4 mm). Pour les chambres d\'enfants ou un investissement locatif, le stratifié AC4 est suffisant.',
    criteresChoix: [
      'Budget : stratifié (8-30 €/m²) vs contrecollé (25-80 €/m²) vs massif (50-150 €/m²)',
      'Chauffage au sol : contrecollé ou stratifié (pas de massif sauf exception)',
      'Durée de vie souhaitée : massif (50-100 ans) vs contrecollé (25-50 ans) vs stratifié (10-25 ans)',
      'Pose DIY ou pro : stratifié et contrecollé clipsable en DIY, massif collé/cloué par un pro',
      'Pièce humide : aucun parquet bois (préférer carrelage ou vinyle)',
      'Valorisation immobilière : massif > contrecollé > stratifié',
    ],
    faq: [
      {
        question: 'Le parquet contrecollé est-il du vrai parquet ?',
        answer:
          'Oui ! Juridiquement, un parquet doit avoir une couche d\'usure en bois noble d\'au moins 2,5 mm (norme NF EN 13756). Le parquet contrecollé remplit ce critère. Le stratifié, en revanche, n\'est pas du parquet car il n\'a aucune couche de bois noble : c\'est un décor photographique sur panneau HDF.',
      },
      {
        question: 'Peut-on poser du parquet dans une cuisine ou une salle de bains ?',
        answer:
          'En cuisine, un parquet contrecollé vitrifié ou un stratifié AC4/AC5 hydrofuge est possible avec précaution (essuyer immédiatement les projections d\'eau). En salle de bains, seul le parquet massif en bois exotique (teck, merbau) résiste à l\'humidité, mais le carrelage ou le vinyle LVT restent préférables. Le stratifié classique est déconseillé dans les pièces humides.',
      },
      {
        question: 'Combien coûte la pose d\'un parquet par un professionnel ?',
        answer:
          'Pose flottante clipsable (stratifié ou contrecollé) : 15 à 25 €/m². Pose collée en plein (contrecollé ou massif) : 25 à 40 €/m². Pose clouée sur lambourdes (massif) : 35 à 55 €/m². Ajoutez 5 à 10 €/m² pour la sous-couche et les finitions (plinthes, barres de seuil). Total pour 40 m² : 1 200 à 3 600 € selon la méthode.',
      },
      {
        question: 'Quelle sous-couche choisir sous un parquet ?',
        answer:
          'Sous un stratifié ou contrecollé flottant : sous-couche en mousse PE (2 €/m², basique), en liège (5-8 €/m², acoustique), ou en fibre de bois (6-10 €/m², isolation thermique). Épaisseur minimale : 2 mm. Sur chauffage au sol, choisissez une sous-couche fine (2 mm) avec une résistance thermique faible (< 0,04 m².K/W). Le pare-vapeur est obligatoire sur dalle béton.',
      },
    ],
  },

  {
    slug: 'volet-electrique-vs-manuel',
    title: 'Volet électrique vs manuel : que choisir ?',
    metaDescription:
      'Comparatif volet roulant électrique vs manuel en 2026 : prix, confort, durabilité, domotique. Guide pour choisir la motorisation adaptée à vos volets.',
    intro:
      "Lors de l'installation ou du remplacement de vos volets roulants, la question de la motorisation se pose inévitablement. Le volet électrique offre un confort incomparable au quotidien, tandis que le volet manuel reste une solution fiable et économique. Ce comparatif vous aide à choisir en fonction de votre budget, de vos habitudes et de votre projet.",
    category: 'Menuiserie',
    options: [
      {
        name: 'Volet roulant électrique (filaire ou radio)',
        avantages: [
          'Confort d\'utilisation maximal (un bouton ou une télécommande)',
          'Programmation horaire possible (simulation de présence, économies d\'énergie)',
          'Compatible domotique : pilotage smartphone, scénarios automatiques',
          'Idéal pour les grandes baies vitrées (manœuvre sans effort)',
          'Accessibilité PMR (obligation dans les logements neufs)',
          'Détection d\'obstacles intégrée (sécurité enfants)',
        ],
        inconvenients: [
          'Prix plus élevé : +150 à 300 € par volet vs manuel',
          'Nécessite une alimentation électrique (travaux d\'électricité)',
          'Panne moteur possible (remplacement : 200 à 400 €)',
          'Inutilisable en cas de coupure de courant (sauf secours manuel)',
          'Entretien du moteur (graissage, vérification tous les 5 ans)',
          'Motorisation radio : risque de panne de pile de la télécommande',
        ],
        prixMoyen: '300 € - 800 € par volet posé',
        dureeVie: '15-20 ans (moteur)',
        idealPour: 'Grandes ouvertures, personnes âgées ou PMR, projet domotique, confort au quotidien',
      },
      {
        name: 'Volet roulant manuel (sangle ou manivelle)',
        avantages: [
          'Prix d\'installation réduit (150 à 400 € par volet posé)',
          'Aucune alimentation électrique nécessaire',
          'Fiabilité mécanique : pas de panne moteur possible',
          'Fonctionne même en cas de coupure de courant',
          'Entretien quasi nul (graissage occasionnel)',
          'Remplacement de la sangle ou manivelle peu coûteux (20-50 €)',
        ],
        inconvenients: [
          'Effort physique nécessaire (problématique pour les personnes âgées)',
          'Impossible à programmer ou à piloter à distance',
          'Usure de la sangle dans le temps (remplacement tous les 5-10 ans)',
          'Manivelle encombrante sur le mur',
          'Non compatible avec la domotique',
          'Moins pratique pour les grandes baies vitrées (volet lourd)',
        ],
        prixMoyen: '150 € - 400 € par volet posé',
        dureeVie: '20-30 ans (mécanisme)',
        idealPour: 'Petites fenêtres, budget limité, résidence secondaire, simplicité recherchée',
      },
    ],
    verdict:
      'Le volet électrique est devenu le standard en 2026 pour le confort, la sécurité et la compatibilité domotique. Son surcoût de 150 à 300 € par volet est rapidement amorti par les économies d\'énergie (programmation) et le confort quotidien. Le volet manuel reste pertinent pour les petites fenêtres, les résidences secondaires ou les budgets très limités. Conseil : si vous rénovez, motorisez au minimum les volets des pièces de vie (salon, chambre principale) et gardez les manuels pour les pièces secondaires.',
    criteresChoix: [
      'Budget par volet : manuel (150-400 €) vs électrique (300-800 €)',
      'Taille des ouvertures : grandes baies → électrique impératif',
      'Projet domotique : oui → électrique radio ou filaire',
      'Accessibilité PMR : électrique obligatoire en logement neuf',
      'Fiabilité recherchée : manuel (aucune panne moteur possible)',
      'Nombre de volets à équiper : motoriser au moins les pièces de vie',
    ],
    faq: [
      {
        question: 'Peut-on motoriser un volet roulant manuel existant ?',
        answer:
          'Oui, la motorisation d\'un volet existant est une opération courante. Un moteur tubulaire se glisse dans l\'axe du volet (remplacement de l\'axe d\'enroulement). Comptez 250 à 500 € par volet (moteur + pose). La motorisation radio est idéale en rénovation car elle ne nécessite pas de câblage électrique dans le mur (fonctionne sur pile ou solaire).',
      },
      {
        question: 'Volet filaire ou radio : quelle différence ?',
        answer:
          'Le volet filaire est relié par un câble électrique à un interrupteur mural (fiable, pas de pile, moins cher). Le volet radio fonctionne avec une télécommande sans fil (plus pratique, pas de saignée dans le mur, mais télécommande et pile à gérer). En construction neuve, préférez le filaire (câblage prévu). En rénovation, le radio évite les travaux d\'électricité.',
      },
      {
        question: 'Les volets électriques consomment-ils beaucoup d\'électricité ?',
        answer:
          'Non, la consommation est négligeable. Un moteur de volet consomme environ 100 à 200 W pendant 15 à 30 secondes d\'utilisation. Avec 2 manœuvres par jour (matin et soir), un volet consomme environ 1 à 2 kWh par an, soit moins de 0,50 €/an. Pour 10 volets, comptez moins de 5 €/an d\'électricité.',
      },
    ],
  },

  {
    slug: 'vmc-simple-flux-vs-double-flux',
    title: 'VMC simple flux vs double flux : quel système de ventilation ?',
    metaDescription:
      'Comparatif VMC simple flux vs double flux en 2026 : prix, économies d\'énergie, qualité de l\'air, entretien. Guide pour choisir votre ventilation mécanique.',
    intro:
      "La ventilation mécanique contrôlée (VMC) est obligatoire dans tout logement depuis 1982. Elle assure le renouvellement de l'air intérieur et évacue l'humidité. Deux technologies coexistent : la VMC simple flux (extraction d'air uniquement) et la VMC double flux (extraction + récupération de chaleur). Le choix impacte directement votre facture de chauffage et la qualité de l'air que vous respirez.",
    category: 'Chauffage / Énergie',
    options: [
      {
        name: 'VMC simple flux (autoréglable ou hygroréglable)',
        avantages: [
          'Prix d\'installation très accessible (500 à 1 500 € pose comprise)',
          'Installation simple et rapide (1 journée)',
          'Entretien minimal (nettoyage bouches + changement courroie)',
          'Faible consommation électrique (15 à 30 W en continu)',
          'Modèle hygroréglable B : adapte le débit à l\'humidité (économie de 12 à 15 %)',
          'Technologie éprouvée, pièces détachées faciles à trouver',
        ],
        inconvenients: [
          'Pas de récupération de chaleur : l\'air chaud est expulsé dehors',
          'Pertes de chaleur importantes (jusqu\'à 25 % des déperditions thermiques)',
          'Air entrant non filtré (poussières, pollens, pollution)',
          'Courants d\'air froid en hiver au niveau des entrées d\'air',
          'Bruit possible au niveau des bouches d\'extraction',
          'Pas de préchauffage de l\'air neuf entrant',
        ],
        prixMoyen: '500 € - 1 500 €',
        dureeVie: '10-20 ans',
        idealPour: 'Budgets limités, logements peu isolés, rénovation légère, maisons anciennes',
      },
      {
        name: 'VMC double flux avec échangeur thermique',
        avantages: [
          'Récupère 70 à 92 % de la chaleur de l\'air extrait',
          'Économies de chauffage de 15 à 25 % sur la facture annuelle',
          'Air entrant filtré (pollen, poussières fines PM2.5, pollution)',
          'Pas de courant d\'air froid : l\'air neuf est préchauffé',
          'Confort acoustique : pas d\'entrées d\'air dans les fenêtres',
          'Indispensable dans les maisons passives et BBC (RT2012/RE2020)',
        ],
        inconvenients: [
          'Investissement important (4 000 à 8 000 € pose comprise)',
          'Installation complexe (réseau de gaines dans les combles ou faux plafonds)',
          'Entretien régulier des filtres (tous les 3 à 6 mois, 30-50 €/filtre)',
          'Consommation électrique plus élevée (40 à 80 W en continu)',
          'Encombrement du caisson échangeur (combles ou local technique)',
          'Risque de condensation dans les gaines si mal isolées',
        ],
        prixMoyen: '4 000 € - 8 000 €',
        dureeVie: '15-25 ans',
        idealPour: 'Maisons bien isolées, construction neuve RE2020, allergiques, zones froides',
      },
    ],
    verdict:
      'La VMC simple flux hygroréglable B reste le choix le plus courant en rénovation pour son rapport coût/efficacité. Elle suffit pour un logement correctement isolé mais pas ultra-performant. La VMC double flux est indispensable dans les maisons très bien isolées (BBC, passives, RE2020) où les pertes de chaleur par ventilation deviennent le poste principal. Si vous rénovez une maison ancienne, commencez par l\'isolation avant d\'investir dans une double flux. Dans une construction neuve RE2020, la double flux est presque systématique.',
    criteresChoix: [
      'Niveau d\'isolation du logement : maison passoire → simple flux, BBC/RE2020 → double flux',
      'Budget : 500-1 500 € (simple) vs 4 000-8 000 € (double)',
      'Qualité de l\'air : allergies, zone polluée → double flux filtrée',
      'Type de projet : rénovation légère → simple flux, construction neuve → double flux',
      'Espace disponible : double flux nécessite combles ou local technique',
      'Zone climatique : hiver rigoureux → double flux plus rentable',
    ],
    faq: [
      {
        question: 'La VMC double flux est-elle rentable ?',
        answer:
          'Dans une maison bien isolée (déperditions < 50 kWh/m²/an), la double flux économise 200 à 500 €/an de chauffage. Le retour sur investissement se situe entre 10 et 20 ans. Elle devient rentable plus rapidement dans les régions froides (Nord, Est, montagne) et les maisons très étanches. Dans une passoire thermique, l\'investissement est rarement rentable.',
      },
      {
        question: 'Peut-on installer une VMC double flux en rénovation ?',
        answer:
          'Oui, mais c\'est plus complexe qu\'en neuf. Il faut passer un réseau de gaines (aller + retour) dans les combles ou les faux plafonds. Comptez 6 000 à 10 000 € en rénovation vs 4 000-8 000 € en neuf. Une alternative : la VMC double flux décentralisée (un appareil par pièce, pas de gaines) pour 300 à 600 € par unité.',
      },
      {
        question: 'Quelle VMC simple flux choisir : autoréglable ou hygroréglable ?',
        answer:
          'L\'hygroréglable B est le standard recommandé en 2026. Elle adapte les débits d\'extraction ET d\'entrée d\'air en fonction de l\'humidité, limitant les pertes de chaleur. L\'autoréglable maintient un débit constant quelle que soit l\'humidité (moins efficace). La différence de prix est faible (100-200 € de plus pour l\'hygro B), l\'investissement est toujours rentable.',
      },
      {
        question: 'À quelle fréquence faut-il nettoyer les filtres de la VMC double flux ?',
        answer:
          'Les filtres d\'une VMC double flux doivent être vérifiés tous les 3 mois et changés tous les 6 à 12 mois selon l\'environnement (plus fréquent en ville polluée ou zone agricole). Un jeu de filtres coûte 30 à 80 € selon le modèle. Des filtres encrassés réduisent le débit d\'air de 30 à 50 % et augmentent la consommation électrique du moteur.',
      },
    ],
  },

  {
    slug: 'fosse-septique-vs-micro-station',
    title: "Fosse septique vs micro-station d'épuration : quel assainissement ?",
    metaDescription:
      'Comparatif fosse septique vs micro-station d\'épuration en 2026 : prix, entretien, réglementation, surface nécessaire. Guide pour votre assainissement non collectif.',
    intro:
      "En France, 5 millions de logements ne sont pas raccordés au tout-à-l'égout et doivent disposer d'un assainissement non collectif (ANC). Deux solutions dominent : la fosse septique toutes eaux (filière traditionnelle avec épandage) et la micro-station d'épuration (traitement biologique compact). Le choix dépend de la surface de votre terrain, de votre budget et de la réglementation locale.",
    category: 'Extérieur',
    options: [
      {
        name: 'Fosse septique toutes eaux + épandage',
        avantages: [
          'Technologie éprouvée et fiable (des décennies de recul)',
          'Coût d\'installation modéré (4 000 à 8 000 € pour 4-5 pièces)',
          'Pas de consommation électrique (fonctionnement gravitaire)',
          'Vidange espacée (tous les 3 à 4 ans en moyenne)',
          'Fonctionne même en cas d\'absence prolongée (pas de bactéries à nourrir)',
          'Durée de vie très longue (30 à 50 ans pour la fosse béton)',
        ],
        inconvenients: [
          'Surface de terrain importante nécessaire (100 à 400 m² pour l\'épandage)',
          'Étude de sol obligatoire (étude pédologique : 500 à 1 000 €)',
          'Tranchées d\'épandage non constructibles et non plantables (arbres)',
          'Odeurs possibles si mauvais entretien ou défaut de ventilation',
          'Vidange coûteuse (200 à 400 € par intervention)',
          'Non adapté aux sols argileux ou imperméables (nappe phréatique haute)',
        ],
        prixMoyen: '4 000 € - 8 000 €',
        dureeVie: '30-50 ans',
        idealPour: 'Grands terrains en zone rurale, sol perméable, résidences secondaires',
      },
      {
        name: 'Micro-station d\'épuration',
        avantages: [
          'Emprise au sol très réduite (5 à 10 m² suffisent)',
          'Qualité de rejet supérieure (eau traitée rejetable en fossé ou milieu naturel)',
          'Installation rapide (2 à 3 jours de terrassement)',
          'Pas de tranchées d\'épandage (terrain libre pour d\'autres usages)',
          'Sans odeur grâce au traitement biologique aérobie',
          'Éligible aux aides de l\'ANAH et des agences de l\'eau (jusqu\'à 3 000 €)',
        ],
        inconvenients: [
          'Investissement plus élevé (7 000 à 15 000 € pose comprise)',
          'Consommation électrique permanente (50 à 100 €/an)',
          'Sensible aux variations de charge (résidences secondaires déconseillées)',
          'Entretien régulier par le fabricant (contrat annuel 150 à 250 €/an)',
          'Durée de vie plus courte que la fosse béton (15 à 25 ans)',
          'Les bactéries meurent en cas d\'absence prolongée (> 3-4 mois)',
        ],
        prixMoyen: '7 000 € - 15 000 €',
        dureeVie: '15-25 ans',
        idealPour: 'Petits terrains, résidences principales, sols non perméables, zones littorales',
      },
    ],
    verdict:
      'La fosse septique reste la solution de référence pour les grands terrains avec un sol perméable, notamment en résidence secondaire (fonctionne sans électricité ni bactéries à entretenir). La micro-station est idéale pour les terrains réduits et les sols difficiles (argileux, nappe haute), mais elle nécessite une utilisation régulière pour maintenir les bactéries actives. Pour une résidence principale sur petit terrain, la micro-station est souvent le seul choix possible. Vérifiez toujours le zonage d\'assainissement de votre commune avant de choisir.',
    criteresChoix: [
      'Surface du terrain : > 200 m² disponibles → fosse + épandage, < 100 m² → micro-station',
      'Type de sol : perméable → fosse, argileux/imperméable → micro-station',
      'Usage : résidence principale → micro-station OK, secondaire → fosse préférable',
      'Budget installation : fosse (4 000-8 000 €) vs micro-station (7 000-15 000 €)',
      'Coût de fonctionnement : fosse (vidange 200 €/3-4 ans) vs micro-station (150-250 €/an)',
      'Réglementation locale : zonage d\'assainissement et SPANC de votre commune',
    ],
    faq: [
      {
        question: 'Quelle est la différence entre une fosse septique et une fosse toutes eaux ?',
        answer:
          'La fosse septique ne traite que les eaux-vannes (WC). La fosse toutes eaux traite les eaux-vannes ET les eaux ménagères (cuisine, salle de bains). Depuis 2009, seules les fosses toutes eaux sont autorisées en installation neuve. Si vous avez une ancienne fosse septique, vous devrez la mettre aux normes lors d\'une vente ou d\'un contrôle SPANC.',
      },
      {
        question: 'Combien coûte la vidange d\'une fosse septique ?',
        answer:
          'La vidange d\'une fosse toutes eaux coûte 200 à 400 € selon la contenance (3 000 à 5 000 litres) et votre localisation. Elle doit être réalisée quand les boues atteignent 50 % du volume de la fosse, soit en moyenne tous les 3 à 4 ans pour une famille de 4 personnes. Conservez le bordereau de vidange (document obligatoire pour le SPANC).',
      },
      {
        question: 'La micro-station fonctionne-t-elle en résidence secondaire ?',
        answer:
          'Difficilement. Les bactéries aérobies qui traitent les eaux usées ont besoin d\'un apport régulier de matière organique. En cas d\'absence de plus de 3-4 mois, les bactéries meurent et il faut 4 à 6 semaines pour reconstituer la flore bactérienne au retour. Certains fabricants proposent des modèles « vacances » avec mode veille, mais la fosse septique reste préférable pour les résidences secondaires.',
      },
      {
        question: 'Quelles aides financières pour l\'assainissement non collectif ?',
        answer:
          'En 2026 : subventions des agences de l\'eau (jusqu\'à 3 000 €), aides ANAH pour les ménages modestes (jusqu\'à 50 % du montant), éco-prêt à taux zéro (jusqu\'à 10 000 €) pour les installations de plus de 20 ans, et TVA à 10 % pour les travaux de réhabilitation. Certaines communes ou départements proposent des aides complémentaires. Contactez votre SPANC pour connaître les dispositifs locaux.',
      },
    ],
  },

  {
    slug: 'veranda-alu-vs-bois-vs-pvc',
    title: 'Véranda : aluminium, bois ou PVC ?',
    metaDescription:
      'Comparatif véranda aluminium vs bois vs PVC en 2026 : prix au m², isolation, entretien, esthétique. Guide complet pour choisir le matériau de votre véranda.',
    intro:
      "La véranda est une extension de vie très prisée des Français, qui permet de gagner 10 à 40 m² de surface habitable. Le choix du matériau de la structure (aluminium, bois ou PVC) conditionne l'esthétique, l'isolation, la durabilité et le budget de votre projet. Ce comparatif vous aide à identifier le matériau le plus adapté à vos besoins et à votre maison.",
    category: 'Extérieur',
    options: [
      {
        name: 'Véranda en aluminium',
        avantages: [
          'Matériau le plus populaire (70 % des vérandas vendues en France)',
          'Profilés fins permettant de maximiser les surfaces vitrées',
          'Entretien minimal (nettoyage à l\'eau savonneuse)',
          'Ne rouille pas, ne se déforme pas, ne pourrit pas',
          'Large gamme de coloris (laquage RAL, imitation bois)',
          'Compatible avec les grandes portées sans poteau intermédiaire',
        ],
        inconvenients: [
          'Prix intermédiaire à élevé (1 200 à 2 500 €/m² posé)',
          'Conductivité thermique élevée (nécessite une rupture de pont thermique)',
          'Sensation froide au toucher en hiver',
          'Dilatation thermique (claquements en cas de forte chaleur)',
          'Rayures possibles sur le laquage (retouche difficile)',
          'Fabrication énergivore (empreinte carbone élevée)',
        ],
        prixMoyen: '1 200 € - 2 500 €/m²',
        dureeVie: '30-50 ans',
        idealPour: 'Style contemporain, grandes surfaces vitrées, entretien minimal, toutes régions',
      },
      {
        name: 'Véranda en bois',
        avantages: [
          'Esthétique chaleureuse et naturelle (charme du bois massif)',
          'Excellent isolant thermique naturel (pas de pont thermique)',
          'Matériau écologique et renouvelable (bilan carbone favorable)',
          'S\'intègre parfaitement aux maisons traditionnelles et de caractère',
          'Sensation de chaleur au toucher, même en hiver',
          'Possibilité de personnalisation (sculpture, moulurations)',
        ],
        inconvenients: [
          'Prix le plus élevé (1 800 à 3 500 €/m² posé)',
          'Entretien régulier obligatoire (lasure ou peinture tous les 3-5 ans)',
          'Sensible aux insectes xylophages et aux champignons',
          'Profilés plus épais que l\'aluminium (surface vitrée réduite)',
          'Nécessite un traitement autoclave ou des essences résistantes (chêne, méranti)',
          'Délais de fabrication plus longs (4 à 8 semaines)',
        ],
        prixMoyen: '1 800 € - 3 500 €/m²',
        dureeVie: '25-40 ans (avec entretien)',
        idealPour: 'Maisons de caractère, style traditionnel, sensibilité écologique, bel investissement',
      },
      {
        name: 'Véranda en PVC',
        avantages: [
          'Prix le plus bas du marché (800 à 1 500 €/m² posé)',
          'Excellente isolation thermique (Uw jusqu\'à 1,1 W/m².K)',
          'Aucun entretien (ne pourrit pas, ne rouille pas, ne se peint pas)',
          'Très bonne résistance à l\'humidité et au sel (zones littorales)',
          'Recyclable à 100 % en fin de vie',
          'Installation rapide (profilés préfabriqués en usine)',
        ],
        inconvenients: [
          'Choix de coloris limité (blanc majoritaire, quelques teintes)',
          'Esthétique moins raffinée que l\'aluminium ou le bois',
          'Profilés épais qui réduisent la luminosité',
          'Portée limitée : nécessite des poteaux intermédiaires au-delà de 4 m',
          'Jaunissement possible dans le temps (UV, entrée de gamme)',
          'Image bas de gamme auprès de certains acheteurs (revente)',
        ],
        prixMoyen: '800 € - 1 500 €/m²',
        dureeVie: '20-30 ans',
        idealPour: 'Budget limité, petites vérandas (< 20 m²), zones littorales, maisons récentes',
      },
    ],
    verdict:
      'L\'aluminium domine le marché pour de bonnes raisons : profilés fins, entretien nul et longévité exceptionnelle. C\'est le choix par défaut en 2026. Le bois séduit pour les maisons de caractère et les amoureux de matériaux nobles, mais demande un budget conséquent et un entretien régulier. Le PVC est la solution économique pour les petites vérandas (< 20 m²) et les budgets serrés, avec une isolation imbattable. Conseil : pour une véranda habitable toute l\'année, l\'aluminium à rupture de pont thermique avec double vitrage 4/20/4 est le meilleur choix.',
    criteresChoix: [
      'Budget au m² : PVC (800-1 500 €) vs alu (1 200-2 500 €) vs bois (1 800-3 500 €)',
      'Entretien accepté : bois (tous les 3-5 ans) vs alu/PVC (aucun)',
      'Esthétique de la maison : traditionnelle → bois, contemporaine → alu, standard → PVC',
      'Surface de la véranda : grande (> 20 m²) → alu ou bois, petite → PVC possible',
      'Zone géographique : littoral → PVC ou alu, montagne → bois ou alu RPT',
      'Valeur de revente : alu > bois > PVC en termes de valorisation immobilière',
    ],
    faq: [
      {
        question: 'Faut-il un permis de construire pour une véranda ?',
        answer:
          'Pour une véranda de moins de 20 m² (40 m² en zone PLU avec commune > 2 000 habitants) : une déclaration préalable de travaux suffit. Au-delà, un permis de construire est obligatoire. Si la surface totale du logement (existant + véranda) dépasse 150 m², le recours à un architecte est obligatoire. Vérifiez toujours le PLU de votre commune et les règles de prospect (distance aux limites).',
      },
      {
        question: 'Une véranda est-elle habitable toute l\'année ?',
        answer:
          'Oui, à condition de prévoir une isolation performante : double ou triple vitrage à contrôle solaire, toiture isolée (panneaux sandwich ou polycarbonate 32 mm), rupture de pont thermique (alu), stores intérieurs ou extérieurs. Un chauffage d\'appoint (radiateur électrique, plancher chauffant) est souvent nécessaire en hiver. Les vérandas bioclimatiques orientées sud avec protections solaires offrent le meilleur confort.',
      },
      {
        question: 'Quelle est la meilleure orientation pour une véranda ?',
        answer:
          'L\'orientation sud ou sud-est est idéale : ensoleillement maximal en hiver, protections solaires efficaces en été (brise-soleil, casquette). L\'ouest est à éviter (surchauffe en été difficile à gérer). Le nord convient pour un bureau ou un atelier (lumière constante sans surchauffe). Prévoyez toujours des protections solaires (stores, volets) quelle que soit l\'orientation.',
      },
      {
        question: 'Combien coûte une véranda de 20 m² ?',
        answer:
          'En 2026, comptez : PVC (16 000 à 30 000 €), aluminium (24 000 à 50 000 €), bois (36 000 à 70 000 €). Ces prix incluent la structure, le vitrage, la toiture, la dalle béton et la pose. Ajoutez 2 000 à 5 000 € pour les options (stores, éclairage, chauffage au sol). La TVA applicable est de 20 % (construction neuve) ou 10 % (extension d\'un logement > 2 ans).',
      },
    ],
  },
]
