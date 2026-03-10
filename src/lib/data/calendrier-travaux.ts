/**
 * Calendrier des travaux saisonniers — conseils mois par mois pour les propriétaires.
 * Utilisé sur la page pilier /calendrier-travaux.
 */

export interface CalendrierMois {
  mois: string
  slug: string
  travauxRecommandes: { titre: string; description: string; service: string }[]
  travauxAEviter: string[]
  conseilDuMois: string
  climatNote: string
}

export const calendrierTravaux: CalendrierMois[] = [
  {
    mois: 'Janvier',
    slug: 'janvier',
    travauxRecommandes: [
      {
        titre: 'Bilan énergétique du logement',
        description:
          "Profitez des factures de chauffage pour identifier les déperditions. C'est le moment idéal pour faire réaliser un DPE ou un audit énergétique avant de lancer des travaux d'isolation au printemps.",
        service: 'diagnostiqueur-immobilier',
      },
      {
        titre: 'Entretien de la chaudière',
        description:
          "L'entretien annuel obligatoire est souvent oublié. Janvier est idéal pour vérifier le bon fonctionnement de votre chaudière en pleine saison de chauffe et détecter d'éventuels dysfonctionnements.",
        service: 'chauffagiste',
      },
      {
        titre: 'Vérification de la toiture après tempêtes',
        description:
          'Les tempêtes hivernales peuvent endommager les tuiles, solins et faîtages. Faites inspecter votre toiture pour détecter et réparer les dégâts avant que les infiltrations ne causent des dommages intérieurs.',
        service: 'couvreur',
      },
      {
        titre: 'Planification des travaux de printemps',
        description:
          "Demandez vos devis dès maintenant pour les gros travaux prévus au printemps. Les artisans sont moins sollicités en janvier, ce qui vous permet d'obtenir des réponses rapides et de comparer sereinement.",
        service: 'macon',
      },
    ],
    travauxAEviter: [
      'Peinture extérieure (températures trop basses, humidité élevée)',
      'Terrassement et fondations (sol gelé ou gorgé d\'eau)',
      'Pose de carrelage extérieur (risque de gel avant prise complète)',
      'Ravalement de façade (l\'enduit ne sèche pas correctement sous 5 °C)',
    ],
    conseilDuMois:
      "Vérifiez que vos aérations ne sont pas obstruées : une bonne ventilation est essentielle en hiver pour éviter la condensation et les moisissures, même si on est tenté de tout fermer pour garder la chaleur.",
    climatNote:
      'Températures moyennes de 2 à 7 °C. Risque de gel et de neige sur la moitié nord. Ensoleillement faible (8 h de jour). Humidité relative élevée (80-90 %).',
  },
  {
    mois: 'Février',
    slug: 'fevrier',
    travauxRecommandes: [
      {
        titre: 'Élagage des arbres',
        description:
          "Février est le dernier mois idéal pour élaguer les arbres avant la reprise de la sève. Les branches mortes ou dangereuses proches de la maison ou des lignes électriques doivent être coupées par un professionnel.",
        service: 'paysagiste',
      },
      {
        titre: 'Rénovation intérieure (peinture, sols)',
        description:
          "C'est la bonne période pour les travaux d'intérieur : peinture, pose de parquet ou carrelage intérieur, rénovation de salle de bain. Les artisans sont encore disponibles avant le rush du printemps.",
        service: 'peintre',
      },
      {
        titre: 'Isolation des combles',
        description:
          "L'isolation des combles peut se faire toute l'année, mais février vous permet de constater les déperditions en conditions réelles de froid. Le chantier est rapide (1 à 2 jours) et vous profiterez des économies dès cet hiver.",
        service: 'isolation-thermique',
      },
      {
        titre: 'Détection et traitement de l\'humidité',
        description:
          'Les taches d\'humidité et moisissures sont particulièrement visibles en hiver. Faites diagnostiquer l\'origine (infiltration, remontée capillaire, condensation) pour traiter le problème à la source avant le printemps.',
        service: 'macon',
      },
    ],
    travauxAEviter: [
      'Plantation de haies et arbustes (sol encore gelé dans le nord)',
      'Travaux de toiture en zone de montagne (neige, verglas)',
      'Pose d\'enduit extérieur (risque de gel nocturne)',
    ],
    conseilDuMois:
      "Profitez des dernières semaines d'hiver pour purger vos radiateurs : un radiateur qui chauffe mal en haut mais reste froid en bas contient de l'air. La purge est simple et gratuite, et améliore immédiatement le confort.",
    climatNote:
      'Températures moyennes de 3 à 9 °C. Dernières gelées possibles en plaine. Les jours rallongent (+1 h par rapport à janvier). Période encore humide.',
  },
  {
    mois: 'Mars',
    slug: 'mars',
    travauxRecommandes: [
      {
        titre: 'Nettoyage des gouttières et descentes',
        description:
          "Après l'hiver, les gouttières sont souvent obstruées par les feuilles et débris. Un nettoyage complet évite les débordements et infiltrations en façade lors des pluies de printemps.",
        service: 'couvreur',
      },
      {
        titre: 'Ravalement de façade',
        description:
          "Les températures remontent au-dessus de 10 °C : c'est le début de la saison idéale pour le ravalement. L'enduit sèche correctement et le temps sec du printemps offre un créneau optimal de plusieurs mois.",
        service: 'facadier',
      },
      {
        titre: 'Début des travaux de terrassement',
        description:
          "Le sol dégèle et s'assèche progressivement. C'est le moment de lancer les terrassements pour une extension, une piscine ou un assainissement individuel, avant les chaleurs estivales.",
        service: 'terrassier',
      },
      {
        titre: 'Vérification de la climatisation',
        description:
          "Faites réviser votre climatisation avant l'été : nettoyage des filtres, vérification du gaz réfrigérant et contrôle des performances. Un entretien préventif coûte bien moins cher qu'une panne en pleine canicule.",
        service: 'chauffagiste',
      },
    ],
    travauxAEviter: [
      'Pose de gazon en rouleau (sol encore trop froid pour un bon enracinement)',
      'Travaux extérieurs en zone de montagne (fonte des neiges, sol instable)',
    ],
    conseilDuMois:
      "C'est le moment de déposer vos demandes d'aides MaPrimeRénov' et CEE si vous prévoyez des travaux de rénovation énergétique au printemps. Les délais de traitement peuvent atteindre 4 à 6 semaines.",
    climatNote:
      'Températures de 6 à 14 °C. Équinoxe de printemps le 20 mars. Les jours passent à 12 h. Alternance de pluie et d\'éclaircies. Dernières gelées matinales possibles.',
  },
  {
    mois: 'Avril',
    slug: 'avril',
    travauxRecommandes: [
      {
        titre: 'Isolation thermique par l\'extérieur (ITE)',
        description:
          "Avril est idéal pour lancer une ITE : les températures sont douces (10-20 °C), le temps est généralement sec et l'enduit sèche dans de bonnes conditions. Le chantier sera terminé avant l'été.",
        service: 'isolation-thermique',
      },
      {
        titre: 'Remplacement des fenêtres',
        description:
          "Les températures clémentes rendent le remplacement des fenêtres confortable : la maison n'est pas exposée au froid pendant la dépose. Les délais de fabrication sont de 4 à 8 semaines, alors commandez tôt.",
        service: 'menuisier',
      },
      {
        titre: 'Création ou rénovation de terrasse',
        description:
          "C'est le moment de préparer votre terrasse pour l'été : pose de dalles, lames composite ou bois, étanchéité du support. Vous en profiterez dès les premiers beaux jours de mai.",
        service: 'macon',
      },
      {
        titre: 'Traitement anti-termites et anti-capricornes',
        description:
          "Les insectes xylophages reprennent leur activité au printemps. Faites inspecter votre charpente et vos boiseries. Un traitement préventif ou curatif protège la structure pour 10 ans.",
        service: 'charpentier',
      },
    ],
    travauxAEviter: [
      'Travaux de terrassement en cas de fortes pluies printanières (sol boueux)',
      'Peinture extérieure si les nuits sont encore fraîches (< 8 °C)',
    ],
    conseilDuMois:
      "Vérifiez l'état de vos joints de fenêtres et portes-fenêtres. Des joints usés laissent passer l'air et l'eau. Leur remplacement est simple, économique et améliore nettement le confort thermique et acoustique.",
    climatNote:
      'Températures de 9 à 17 °C. Giboulées possibles mais ensoleillement en hausse (13-14 h de jour). Risque de gel quasi nul en plaine. Bonne période pour les travaux extérieurs.',
  },
  {
    mois: 'Mai',
    slug: 'mai',
    travauxRecommandes: [
      {
        titre: 'Peinture extérieure',
        description:
          "Mai offre les conditions idéales pour la peinture extérieure : températures stables (15-22 °C), peu de pluie et jours longs. Rafraîchissez vos volets, portails, clôtures et boiseries extérieures.",
        service: 'peintre',
      },
      {
        titre: 'Installation de panneaux solaires',
        description:
          "L'ensoleillement augmente et les jours sont longs : c'est le moment idéal pour installer des panneaux photovoltaïques et commencer à produire dès l'été. Les aides MaPrimeRénov' et l'obligation d'achat rendent l'investissement rentable.",
        service: 'panneaux-solaires',
      },
      {
        titre: 'Aménagement de jardin et clôture',
        description:
          "La terre est réchauffée et les plantes reprennent. Créez vos massifs, posez votre clôture, installez un portail automatique ou aménagez un espace extérieur avant les réceptions estivales.",
        service: 'paysagiste',
      },
      {
        titre: 'Réfection de toiture',
        description:
          "Le temps sec et les températures modérées sont parfaits pour remplacer des tuiles, refaire l'étanchéité ou rénover la zinguerie. Les couvreurs sont très demandés en été : réservez dès mai.",
        service: 'couvreur',
      },
    ],
    travauxAEviter: [
      'Couler une dalle en cas de canicule précoce (séchage trop rapide = fissures)',
      'Planter des végétaux si la sécheresse s\'installe sans système d\'arrosage',
    ],
    conseilDuMois:
      "Les ponts de mai réduisent les semaines de travail. Anticipez les commandes de matériaux et confirmez les plannings avec vos artisans pour éviter les retards liés aux jours fériés.",
    climatNote:
      'Températures de 13 à 22 °C. Ensoleillement généreux (15 h de jour). Risque d\'orages ponctuels mais longues périodes sèches. Conditions optimales pour la plupart des travaux extérieurs.',
  },
  {
    mois: 'Juin',
    slug: 'juin',
    travauxRecommandes: [
      {
        titre: 'Construction d\'extension ou surélévation',
        description:
          "Juin lance la haute saison de la construction. Les conditions météo sont stables, le béton sèche bien et les jours longs permettent d'avancer rapidement. Visez une livraison avant l'automne.",
        service: 'macon',
      },
      {
        titre: 'Installation d\'une pompe à chaleur',
        description:
          "Installer une PAC en juin permet d'en profiter dès l'hiver suivant et de bénéficier de la fonction rafraîchissement pendant l'été. Les délais d'installation sont de 1 à 3 jours hors terrassement.",
        service: 'pompe-a-chaleur',
      },
      {
        titre: 'Étanchéité de toiture-terrasse',
        description:
          "Le temps sec de juin est idéal pour refaire l'étanchéité d'une toiture-terrasse. Les membranes bitumineuses ou EPDM se posent par temps sec et chaud. Les fuites ne pardonnent pas : anticipez.",
        service: 'couvreur',
      },
      {
        titre: 'Mise aux normes électriques',
        description:
          "Si vous prévoyez des travaux importants, profitez de juin pour mettre votre installation électrique aux normes NF C 15-100. Le tableau, les protections et le câblage vieillissants sont un risque d'incendie.",
        service: 'electricien',
      },
    ],
    travauxAEviter: [
      'Pose de bitume ou d\'asphalte en cas de forte chaleur (déformation du revêtement)',
      'Travaux de plâtrerie extérieure par temps très chaud (séchage trop rapide)',
    ],
    conseilDuMois:
      "Pensez à la protection solaire avant la canicule : stores, volets roulants, films solaires ou brise-soleil. Ces équipements réduisent la température intérieure de 5 à 10 °C et évitent le recours à la climatisation.",
    climatNote:
      'Températures de 16 à 27 °C. Solstice d\'été le 21 juin (16 h de jour). Risque de canicule précoce. Orages parfois violents. Ensoleillement maximal dans le sud.',
  },
  {
    mois: 'Juillet',
    slug: 'juillet',
    travauxRecommandes: [
      {
        titre: 'Construction de piscine',
        description:
          "Juillet est le dernier mois pour lancer une piscine et espérer en profiter en fin d'été. Le terrassement, le coulage et la mise en eau demandent 6 à 8 semaines. Attention aux délais : les piscinistes sont pris d'assaut.",
        service: 'macon',
      },
      {
        titre: 'Rénovation de salle de bain',
        description:
          "En été, la salle de bain est moins sollicitée (douche extérieure, vacances). C'est le moment de refaire la plomberie, le carrelage et l'étanchéité sans trop gêner le quotidien familial.",
        service: 'plombier',
      },
      {
        titre: 'Pose de carrelage extérieur',
        description:
          "Le temps chaud et sec de juillet est parfait pour la pose de carrelage sur terrasse ou plage de piscine. La colle et les joints sèchent rapidement. Respectez toutefois les joints de dilatation pour éviter les fissures thermiques.",
        service: 'carreleur',
      },
      {
        titre: 'Installation de volets roulants',
        description:
          "Les volets roulants (surtout solaires) apportent un confort thermique immédiat en été. Pas besoin de gros travaux : les modèles en rénovation se posent en une demi-journée par fenêtre.",
        service: 'menuisier',
      },
    ],
    travauxAEviter: [
      'Couler du béton par canicule (> 35 °C) sans précautions (risque de fissuration)',
      'Pose d\'ITE avec enduit par forte chaleur (l\'enduit sèche trop vite et craquelle)',
      'Travaux de couverture aux heures les plus chaudes (sécurité des couvreurs)',
    ],
    conseilDuMois:
      "Si vous partez en vacances, coupez l'eau au compteur pour éviter un dégât des eaux pendant votre absence. Un flexible de machine à laver ou un raccord qui lâche en votre absence peut causer des milliers d'euros de dommages.",
    climatNote:
      'Températures de 19 à 31 °C. Canicule possible (surtout dans le sud et l\'est). Orages parfois violents avec grêle. Sécheresse fréquente. Ensoleillement maximal.',
  },
  {
    mois: 'Août',
    slug: 'aout',
    travauxRecommandes: [
      {
        titre: 'Travaux intérieurs pendant les vacances',
        description:
          "Si vous êtes absent en août, c'est le moment idéal pour confier vos clés à un artisan : rénovation de cuisine, peinture intérieure, pose de parquet. Vous retrouvez un logement transformé à la rentrée.",
        service: 'peintre',
      },
      {
        titre: 'Assainissement individuel',
        description:
          "Le sol est sec et stable en août, ce qui facilite le terrassement pour une fosse septique ou une micro-station d'épuration. Les nappes phréatiques sont au plus bas, réduisant le risque d'effondrement de tranchée.",
        service: 'terrassier',
      },
      {
        titre: 'Rénovation de charpente',
        description:
          "Le temps sec d'août est idéal pour les travaux de charpente : remplacement de pièces vermoulues, traitement fongicide et insecticide, renforcement structurel. Le bois sèche vite et les conditions de travail sont bonnes.",
        service: 'charpentier',
      },
      {
        titre: 'Domotique et alarme',
        description:
          "Profitez de l'été pour installer un système d'alarme, des caméras de surveillance ou de la domotique (éclairage connecté, thermostat intelligent). Les cambriolages augmentent pendant les vacances d'été.",
        service: 'electricien',
      },
    ],
    travauxAEviter: [
      'Travaux de maçonnerie extérieure pendant une canicule prolongée',
      'Peinture extérieure en plein soleil (la peinture sèche trop vite, traces de reprise)',
      'Plantation et engazonnement (arrosage intensif nécessaire)',
    ],
    conseilDuMois:
      "Beaucoup d'artisans prennent leurs congés en août. Réservez vos interventions dès juin. En revanche, les artisans qui travaillent en août sont souvent plus disponibles et réactifs : profitez-en pour les petits travaux.",
    climatNote:
      'Températures de 18 à 30 °C. Orages de fin d\'été fréquents. Risque de sécheresse dans le sud. Les nuits commencent à rafraîchir fin août. Jours qui raccourcissent (14 h).',
  },
  {
    mois: 'Septembre',
    slug: 'septembre',
    travauxRecommandes: [
      {
        titre: 'Remplacement de chaudière',
        description:
          "Septembre est le mois idéal pour remplacer votre chaudière : vous évitez la panne en plein hiver et les délais d'installation de dernière minute. Les chaudières à condensation et PAC air-eau sont éligibles aux aides.",
        service: 'chauffagiste',
      },
      {
        titre: 'Isolation des murs (ITI ou ITE)',
        description:
          "Les températures douces de septembre permettent encore de réaliser une isolation par l'extérieur dans de bonnes conditions. Pour l'intérieur, la saison importe peu. Vous profiterez des économies dès cet hiver.",
        service: 'isolation-thermique',
      },
      {
        titre: 'Ramonage de cheminée',
        description:
          "Le ramonage est obligatoire au moins une fois par an (deux fois pour le bois). Septembre est le moment idéal : avant la première flambée et quand les ramoneurs ne sont pas encore débordés par la demande hivernale.",
        service: 'chauffagiste',
      },
      {
        titre: 'Rénovation de façade et peinture extérieure',
        description:
          "Le temps encore doux et sec de septembre offre un dernier créneau pour les travaux de façade. L'enduit et la peinture sèchent bien entre 10 et 25 °C. Après octobre, c'est trop risqué dans la moitié nord.",
        service: 'facadier',
      },
    ],
    travauxAEviter: [
      'Reporter les travaux de chauffage — les délais explosent dès novembre',
      'Négliger la purge et le contrôle du circuit de chauffage avant la remise en route',
    ],
    conseilDuMois:
      "Faites le tour de votre maison : vérifiez les joints de fenêtres, l'état de la toiture, les gouttières et l'isolation des combles. C'est le meilleur moment pour corriger les faiblesses avant l'hiver.",
    climatNote:
      'Températures de 13 à 24 °C. Journées encore longues (12 h). Derniers beaux jours, idéaux pour les travaux extérieurs. Premières pluies automnales possibles fin septembre.',
  },
  {
    mois: 'Octobre',
    slug: 'octobre',
    travauxRecommandes: [
      {
        titre: 'Nettoyage et vérification de toiture',
        description:
          "Avant les tempêtes d'automne, faites inspecter votre toiture : tuiles cassées, solins décollés, mousses à traiter. Un couvreur peut aussi poser un traitement hydrofuge pour prolonger la durée de vie des tuiles.",
        service: 'couvreur',
      },
      {
        titre: 'Installation de poêle à bois ou granulés',
        description:
          "Octobre est le dernier mois pour installer un poêle avant les premiers froids. Le conduit de fumée, la ventilation et le raccordement doivent être réalisés par un professionnel qualifié RGE pour les aides.",
        service: 'chauffagiste',
      },
      {
        titre: 'Mise hors d\'eau d\'un chantier',
        description:
          "Si vous avez lancé une construction ou extension cet été, la mise hors d'eau (toiture posée) doit être achevée avant les pluies d'automne. C'est la priorité absolue pour protéger la structure pendant l'hiver.",
        service: 'couvreur',
      },
      {
        titre: 'Protection des canalisations extérieures',
        description:
          "Purgez et isolez les robinets extérieurs, l'arrosage automatique et les canalisations exposées au gel. Un tuyau qui éclate par le gel peut coûter des centaines d'euros de réparation et de dégâts des eaux.",
        service: 'plombier',
      },
    ],
    travauxAEviter: [
      'Commencer un ravalement de façade (risque de gel nocturne dès fin octobre dans le nord)',
      'Lancer un terrassement sans urgence (sol qui se gorge d\'eau)',
      'Pose d\'enduit extérieur à la chaux (trop humide pour un bon séchage)',
    ],
    conseilDuMois:
      "Programmez le désembouage de votre circuit de chauffage si vos radiateurs sont tièdes ou présentent des bruits. Les boues réduisent l'efficacité du chauffage de 15 à 40 % et accélèrent l'usure de la chaudière.",
    climatNote:
      'Températures de 8 à 17 °C. Passage à l\'heure d\'hiver fin octobre. Pluies fréquentes, jours courts (10-11 h). Premières gelées matinales possibles dans le nord et l\'est.',
  },
  {
    mois: 'Novembre',
    slug: 'novembre',
    travauxRecommandes: [
      {
        titre: 'Travaux d\'intérieur (cuisine, salle de bain)',
        description:
          "Novembre est parfait pour les rénovations intérieures : nouvelle cuisine, salle de bain, aménagement de combles. Les artisans d'intérieur sont plus disponibles qu'au printemps et les travaux ne dépendent pas de la météo.",
        service: 'plombier',
      },
      {
        titre: 'Mise aux normes du tableau électrique',
        description:
          "Avec l'hiver qui approche et la consommation électrique qui augmente, c'est le moment de moderniser un tableau vétuste : remplacement des fusibles par des disjoncteurs, ajout de différentiels 30 mA, parafoudre.",
        service: 'electricien',
      },
      {
        titre: 'Calorifugeage des tuyaux de chauffage',
        description:
          "Isoler les tuyaux de chauffage dans les espaces non chauffés (cave, garage, vide sanitaire) réduit les pertes de chaleur de 10 à 20 %. C'est un geste simple et économique, souvent pris en charge par les CEE.",
        service: 'chauffagiste',
      },
      {
        titre: 'Diagnostic et traitement des ponts thermiques',
        description:
          "Les ponts thermiques sont très visibles en novembre grâce à la caméra thermique (le contraste chaud/froid est maximal). Faites réaliser une thermographie pour identifier les points faibles de votre isolation.",
        service: 'isolation-thermique',
      },
    ],
    travauxAEviter: [
      'Tout travail de maçonnerie extérieure (gel, pluie, humidité)',
      'Peinture extérieure (conditions défavorables jusqu\'en mars)',
      'Construction de terrasse bois (le bois doit être posé sur un sol sec)',
    ],
    conseilDuMois:
      "Vérifiez le bon fonctionnement de vos détecteurs de fumée (obligatoires) et de monoxyde de carbone (recommandés). Changez les piles. Les intoxications au CO augmentent fortement dès la mise en route du chauffage.",
    climatNote:
      'Températures de 4 à 11 °C. Jours courts (9 h). Brouillard et humidité. Premières neiges en altitude. Les gelées deviennent régulières dans la moitié nord.',
  },
  {
    mois: 'Décembre',
    slug: 'decembre',
    travauxRecommandes: [
      {
        titre: 'Dépannage et entretien de chauffage',
        description:
          "Les pannes de chauffage sont fréquentes en décembre avec le froid. Ayez le numéro d'un chauffagiste de confiance. Un contrat d'entretien garantit une intervention prioritaire et souvent sous 24 h.",
        service: 'chauffagiste',
      },
      {
        titre: 'Aménagement de combles',
        description:
          "L'aménagement de combles est un chantier d'intérieur qui ne dépend pas de la météo (une fois la toiture fermée). Isolation, placo, électricité, plancher : tout peut avancer pendant l'hiver.",
        service: 'plaquiste',
      },
      {
        titre: 'Rénovation électrique intérieure',
        description:
          "Profitez de la fin d'année pour rénover votre installation électrique : ajout de prises, remplacement d'interrupteurs, passage en LED. Les soirées sont longues, autant que l'éclairage soit optimal.",
        service: 'electricien',
      },
      {
        titre: 'Planification et devis pour l\'année suivante',
        description:
          "Décembre est le mois de la planification. Prenez rendez-vous avec les artisans, demandez des devis, montez vos dossiers d'aides. Les carnets de commandes se remplissent vite dès janvier.",
        service: 'macon',
      },
    ],
    travauxAEviter: [
      'Tout travail extérieur non urgent (gel, pluie, neige, jours très courts)',
      'Couler du béton extérieur (risque de gel avant la prise complète)',
      'Travaux de toiture sauf urgence (conditions dangereuses)',
      'Plantation et aménagement paysager (sol gelé ou détrempé)',
    ],
    conseilDuMois:
      "Pensez à vérifier votre consommation de chauffage par rapport à l'année précédente. Une hausse inexpliquée peut signaler une dégradation de l'isolation, un défaut de chaudière ou des fuites dans le circuit de chauffage.",
    climatNote:
      'Températures de 1 à 7 °C. Jours les plus courts de l\'année (8 h). Gel fréquent, neige possible partout. Solstice d\'hiver le 21 décembre. Priorité aux travaux intérieurs.',
  },
]
