/**
 * Glossaire du bâtiment — 150+ termes techniques expliqués pour les particuliers.
 * Utilisé sur la page pilier /glossary pour le SEO et l'éducation des propriétaires.
 */

export interface GlossaireTerm {
  term: string
  slug: string
  definition: string
  category: string
  relatedService?: string
}

export const glossaireCategories = [
  'Gros œuvre',
  'Charpente & toiture',
  'Plomberie',
  'Électricité',
  'Isolation & énergie',
  'Menuiserie',
  'Revêtements',
  'Administratif & juridique',
] as const

export type GlossaireCategory = (typeof glossaireCategories)[number]

export const glossaireTerms: GlossaireTerm[] = [
  // ─── Gros œuvre ────────────────────────────────────────────
  {
    term: 'Fondations',
    slug: 'fondations',
    definition:
      "Les fondations sont la base de tout bâtiment : elles transmettent les charges de la construction au sol. Leur type (semelles filantes, isolées, radier) dépend de la nature du terrain et du poids de l'ouvrage. Des fondations mal dimensionnées peuvent entraîner des fissures structurelles et compromettre la solidité de la maison.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Chaînage',
    slug: 'chainage',
    definition:
      "Le chaînage est une armature en béton armé qui ceinture les murs porteurs à chaque niveau (horizontal) et aux angles (vertical). Il assure la cohésion de la structure et empêche l'écartement des murs. C'est un élément obligatoire selon les règles parasismiques et les DTU en vigueur.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Linteau',
    slug: 'linteau',
    definition:
      "Le linteau est une poutre horizontale placée au-dessus d'une ouverture (porte, fenêtre) pour supporter le poids du mur situé au-dessus. Il peut être en béton armé, en acier (IPN) ou en bois selon le type de construction. Un linteau sous-dimensionné provoque des fissures en escalier autour de l'ouverture.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Mur porteur',
    slug: 'mur-porteur',
    definition:
      "Un mur porteur supporte le poids de la structure au-dessus de lui (plancher, toiture). Contrairement à une simple cloison, il ne peut pas être supprimé sans précautions : il faut poser un IPN ou une poutre de substitution, avec l'aval d'un bureau d'études structure. Toucher à un mur porteur sans étude préalable met en danger la stabilité du bâtiment.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Longrine',
    slug: 'longrine',
    definition:
      "La longrine est une poutre en béton armé qui relie les plots ou pieux de fondation entre eux. Elle répartit les charges du bâtiment et sert de support au plancher bas. On la retrouve fréquemment dans les constructions sur vide sanitaire ou terrain en pente.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Radier',
    slug: 'radier',
    definition:
      "Le radier est une dalle de fondation épaisse qui couvre toute la surface au sol du bâtiment. Il est utilisé quand le sol est de mauvaise portance ou que la nappe phréatique est haute. Le radier répartit uniformément les charges, ce qui évite les tassements différentiels.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Hérisson',
    slug: 'herisson',
    definition:
      "Le hérisson est une couche de pierres ou de graviers compactés disposée sous une dalle béton. Il assure le drainage des eaux de ruissellement et empêche les remontées capillaires d'humidité dans la dalle. Son épaisseur varie généralement entre 15 et 30 cm selon la nature du terrain.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Vide sanitaire',
    slug: 'vide-sanitaire',
    definition:
      "Le vide sanitaire est un espace vide entre le sol naturel et le plancher bas de la maison, généralement de 20 à 80 cm de hauteur. Il protège contre les remontées d'humidité et facilite le passage des réseaux (eau, électricité). Il doit rester ventilé pour éviter la condensation.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Dalle béton',
    slug: 'dalle-beton',
    definition:
      "La dalle béton est un ouvrage horizontal en béton armé qui constitue le plancher d'un bâtiment. Elle peut être coulée en place ou composée d'éléments préfabriqués (hourdis + poutrelles). Son épaisseur et son ferraillage dépendent de la portée et des charges qu'elle doit supporter.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Agglo (parpaing)',
    slug: 'agglo-parpaing',
    definition:
      "L'agglo, ou parpaing, est un bloc creux en béton utilisé pour monter les murs. C'est le matériau de construction le plus courant en France grâce à son rapport coût/solidité. Il existe en différentes épaisseurs (10, 15, 20 cm) et doit être complété par une isolation thermique car il est très peu isolant seul.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Béton armé',
    slug: 'beton-arme',
    definition:
      "Le béton armé associe du béton (résistant à la compression) à des armatures en acier (résistantes à la traction). Cette combinaison permet de réaliser des structures porteuses comme les poteaux, poutres, dalles et fondations. Le dosage et le positionnement des aciers sont définis par le bureau d'études.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Coffrage',
    slug: 'coffrage',
    definition:
      "Le coffrage est un moule temporaire dans lequel on coule le béton pour lui donner sa forme définitive. Il peut être en bois, en métal ou en matériau composite. La qualité du coffrage détermine directement l'aspect de surface et la précision dimensionnelle de l'ouvrage fini.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Ferraillage',
    slug: 'ferraillage',
    definition:
      "Le ferraillage désigne l'ensemble des armatures en acier (barres, treillis soudé, étriers) placées dans le béton avant coulage. Il confère au béton armé sa résistance à la traction et à la flexion. Un ferraillage insuffisant ou mal positionné peut compromettre la solidité de l'ouvrage.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Acrotère',
    slug: 'acrotere',
    definition:
      "L'acrotère est un muret situé en bordure d'une toiture-terrasse. Il sert de garde-corps, permet de fixer l'étanchéité en relevé et protège la jonction mur/toiture. Sa hauteur minimale est réglementée et son étanchéité doit être soignée pour éviter les infiltrations.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Arase',
    slug: 'arase',
    definition:
      "L'arase est une couche de mortier appliquée sur le dessus d'un mur pour le mettre de niveau avant de poser la rangée suivante ou un plancher. L'arase étanche (avec une bande bitumineuse) est indispensable entre les fondations et le premier rang de parpaings pour bloquer les remontées d'humidité.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Hourdis',
    slug: 'hourdis',
    definition:
      "Les hourdis sont des éléments de remplissage placés entre les poutrelles d'un plancher préfabriqué. Ils peuvent être en béton, en polystyrène (pour l'isolation) ou en terre cuite. Ils ne portent pas de charge mais servent de coffrage perdu pour la dalle de compression coulée par-dessus.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Poutrelle',
    slug: 'poutrelle',
    definition:
      "La poutrelle est un élément porteur préfabriqué en béton précontraint qui, associé aux hourdis et à une dalle de compression, forme un plancher. Sa portée et sa section sont calculées en fonction des charges et de la distance entre appuis. C'est le système de plancher le plus répandu en construction neuve.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Jambage',
    slug: 'jambage',
    definition:
      "Le jambage est le montant vertical d'une baie (porte ou fenêtre) dans un mur. Il encadre l'ouverture et supporte le linteau. En maçonnerie, les jambages doivent être renforcés par un chaînage vertical pour assurer la stabilité de l'ensemble, surtout en zone sismique.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Treillis soudé',
    slug: 'treillis-soude',
    definition:
      "Le treillis soudé est un panneau d'armature en acier constitué de fils croisés et soudés entre eux, utilisé pour renforcer les dalles, chapes et dallages. Il se décline en différentes mailles et diamètres de fils (ST25, ST10, etc.) selon les contraintes mécaniques à reprendre.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },

  // ─── Charpente & toiture ──────────────────────────────────
  {
    term: 'Fermette',
    slug: 'fermette',
    definition:
      "La fermette est une charpente industrielle légère en bois, assemblée par des connecteurs métalliques. Elle est économique et rapide à poser, mais occupe tout le volume des combles, les rendant difficilement aménageables. C'est le type de charpente le plus courant dans la construction neuve.",
    category: 'Charpente & toiture',
    relatedService: 'charpentier',
  },
  {
    term: 'Chevron',
    slug: 'chevron',
    definition:
      "Le chevron est une pièce de bois inclinée fixée sur les pannes de la charpente. Il supporte les liteaux sur lesquels sont posées les tuiles ou ardoises. Son espacement et sa section sont calculés en fonction de la charge de couverture et de la zone climatique (neige, vent).",
    category: 'Charpente & toiture',
    relatedService: 'charpentier',
  },
  {
    term: 'Panne',
    slug: 'panne',
    definition:
      "La panne est une poutre horizontale de la charpente qui repose sur les fermes ou les murs pignons. On distingue la panne faîtière (au sommet), les pannes intermédiaires et la panne sablière (en bas de pente). Elles supportent les chevrons et transmettent les charges aux murs porteurs.",
    category: 'Charpente & toiture',
    relatedService: 'charpentier',
  },
  {
    term: 'Liteaux',
    slug: 'liteaux',
    definition:
      "Les liteaux sont des lattes de bois clouées horizontalement sur les chevrons. Ils servent de support de fixation aux tuiles ou ardoises. Leur espacement (pureau) est déterminé par le type de couverture et la pente du toit, et conditionne l'étanchéité de la toiture.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Faîtage',
    slug: 'faitage',
    definition:
      "Le faîtage est la ligne horizontale au sommet du toit, à la jonction des deux pans de couverture. Il est scellé avec des tuiles faîtières ou un closoir ventilé pour assurer l'étanchéité tout en permettant la ventilation de la sous-toiture. Un faîtage endommagé est une cause fréquente d'infiltration.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Noue',
    slug: 'noue',
    definition:
      "La noue est l'angle rentrant formé par la jonction de deux pans de toiture. C'est un point critique de la couverture car l'eau de pluie s'y concentre. Elle est réalisée en zinc, plomb ou avec des tuiles spéciales et doit être parfaitement étanche pour éviter les infiltrations.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Rive',
    slug: 'rive',
    definition:
      "La rive est le bord latéral d'un pan de toiture. Elle est protégée par des tuiles de rive, une bande de rive en zinc ou un mortier de scellement. Son rôle est d'empêcher l'eau et le vent de s'infiltrer sous la couverture par les côtés du toit.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Solin',
    slug: 'solin',
    definition:
      "Le solin est un ouvrage d'étanchéité réalisé à la jonction entre la toiture et un mur ou une souche de cheminée. Il est généralement en zinc, plomb ou mortier. Un solin défaillant est l'une des causes les plus fréquentes de fuites en toiture, notamment autour des cheminées.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Sous-face',
    slug: 'sous-face',
    definition:
      "La sous-face désigne l'habillage du dessous d'un débord de toit (avancée de toit). Elle peut être en PVC, bois ou aluminium et intègre souvent des grilles de ventilation pour assurer la circulation d'air dans les combles. Elle protège la charpente des intempéries et des nuisibles.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Écran sous-toiture',
    slug: 'ecran-sous-toiture',
    definition:
      "L'écran sous-toiture est une membrane souple posée sur les chevrons, sous les liteaux et la couverture. Il protège les combles contre les infiltrations d'eau (pluie battante, neige poudreuse) et la poussière tout en laissant passer la vapeur d'eau. Il est devenu quasi obligatoire dans les DTU récents.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Voliges',
    slug: 'voliges',
    definition:
      "Les voliges sont des planches minces clouées sur les chevrons pour former un support continu de couverture, notamment pour les ardoises ou les bardeaux. Contrairement aux liteaux (support discontinu), elles offrent une surface pleine qui facilite la fixation et renforce la rigidité du toit.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Ardoise',
    slug: 'ardoise',
    definition:
      "L'ardoise est un matériau de couverture naturel (schiste) ou synthétique (fibro-ciment) très durable (jusqu'à 100 ans pour l'ardoise naturelle). Elle est fixée par crochet ou clou sur des liteaux ou voliges. Son coût est plus élevé que la tuile, mais elle offre une esthétique et une longévité remarquables.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Zinguerie',
    slug: 'zinguerie',
    definition:
      "La zinguerie regroupe tous les ouvrages en zinc (ou aluminium laqué) d'une toiture : gouttières, descentes d'eau pluviale, chéneaux, noues, solins et bandes de rive. Ces éléments assurent la collecte et l'évacuation des eaux de pluie. Un entretien régulier évite les débordements et infiltrations.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Chéneau',
    slug: 'cheneau',
    definition:
      "Le chéneau est un canal en zinc, cuivre ou PVC intégré à la toiture pour collecter les eaux de pluie. Contrairement à la gouttière (suspendue en bord de toit), le chéneau est encastré dans la maçonnerie ou la charpente. Il nécessite un entretien régulier pour éviter les obstructions par les feuilles.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },

  // ─── Plomberie ─────────────────────────────────────────────
  {
    term: 'Siphon',
    slug: 'siphon',
    definition:
      "Le siphon est un dispositif en forme de S ou de U placé sous chaque appareil sanitaire (évier, lavabo, douche). Il retient une garde d'eau qui empêche les mauvaises odeurs d'égout de remonter dans la pièce. Il doit être nettoyé régulièrement pour éviter les bouchons.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Nourrice (collecteur)',
    slug: 'nourrice-collecteur',
    definition:
      "La nourrice, ou collecteur, est un répartiteur d'eau installé en sortie du compteur ou du chauffe-eau. Elle distribue l'eau vers chaque point de puisage par des tuyaux individuels, ce qui permet de couper l'alimentation d'un appareil sans affecter les autres. C'est le standard en plomberie moderne.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'PER (polyéthylène réticulé)',
    slug: 'per',
    definition:
      "Le PER est un tuyau souple en polyéthylène réticulé utilisé pour la distribution d'eau chaude et froide. Il se plie facilement, résiste au calcaire et au gel, et se raccorde sans soudure grâce à des raccords à sertir ou à glissement. C'est le matériau le plus utilisé en plomberie résidentielle aujourd'hui.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Multicouche',
    slug: 'multicouche',
    definition:
      "Le tube multicouche est composé de deux couches de PER séparées par une couche d'aluminium. Il combine la souplesse du PER et la rigidité du cuivre : il garde sa forme une fois cintré et présente une excellente résistance à la pression. Il est adapté à l'eau chaude, froide et au chauffage.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Cuivre (tuyauterie)',
    slug: 'cuivre-tuyauterie',
    definition:
      "Le cuivre est le matériau traditionnel de la plomberie, apprécié pour sa durabilité (50 ans et plus), ses propriétés antibactériennes et sa résistance à la corrosion. Il se travaille par brasage ou avec des raccords à compression. Plus coûteux que le PER, il reste la référence en rénovation de qualité.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Colonne montante',
    slug: 'colonne-montante',
    definition:
      "La colonne montante est la canalisation verticale principale d'un immeuble qui distribue l'eau potable à chaque étage. Son remplacement (souvent en plomb dans les immeubles anciens) est un travail de copropriété. Elle est généralement accompagnée d'un compteur divisionnaire par logement.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Vanne d\'arrêt',
    slug: 'vanne-arret',
    definition:
      "La vanne d'arrêt est un robinet qui permet de couper l'alimentation en eau d'un circuit ou d'un appareil. Chaque logement doit disposer d'une vanne générale et idéalement de vannes individuelles par circuit. Savoir où se trouve votre vanne d'arrêt est le premier réflexe en cas de fuite.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Réducteur de pression',
    slug: 'reducteur-de-pression',
    definition:
      "Le réducteur de pression est un appareil installé après le compteur d'eau pour abaisser et stabiliser la pression du réseau (idéalement entre 2,5 et 3,5 bars). Une pression trop élevée use prématurément les robinets, provoque des coups de bélier et augmente la consommation d'eau.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Anti-bélier',
    slug: 'anti-belier',
    definition:
      "L'anti-bélier est un dispositif qui absorbe les ondes de choc (coups de bélier) provoquées par la fermeture brutale d'un robinet ou d'une électrovanne. Ces chocs peuvent endommager les canalisations et les raccords. L'anti-bélier se monte près de l'appareil responsable du bruit.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Disconnecteur',
    slug: 'disconnecteur',
    definition:
      "Le disconnecteur est un dispositif anti-retour qui empêche l'eau usée ou polluée de refluer dans le réseau d'eau potable. Il est obligatoire dans certaines installations (arrosage, chauffage, piscine). Son absence peut entraîner une contamination du réseau public en cas de chute de pression.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Groupe de sécurité',
    slug: 'groupe-de-securite',
    definition:
      "Le groupe de sécurité est un organe de protection obligatoire sur tout chauffe-eau à accumulation. Il limite la pression à 7 bars, évacue l'eau de dilatation et permet la vidange du ballon. Il doit être actionné manuellement une fois par mois et remplacé tous les 5 ans environ.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Chauffe-eau thermodynamique',
    slug: 'chauffe-eau-thermodynamique',
    definition:
      "Le chauffe-eau thermodynamique (CET) utilise une pompe à chaleur intégrée pour chauffer l'eau sanitaire en puisant les calories dans l'air ambiant. Il consomme 2 à 3 fois moins d'électricité qu'un cumulus classique. Éligible aux aides MaPrimeRénov', il est devenu le standard en construction neuve RE2020.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Évacuation PVC',
    slug: 'evacuation-pvc',
    definition:
      "Les tuyaux d'évacuation en PVC assurent le transport des eaux usées et pluviales vers le tout-à-l'égout ou la fosse septique. Ils existent en différents diamètres (32 à 125 mm) et doivent respecter une pente minimale de 1 à 3 cm par mètre pour garantir un bon écoulement sans stagnation.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },

  // ─── Électricité ───────────────────────────────────────────
  {
    term: 'Disjoncteur différentiel',
    slug: 'disjoncteur-differentiel',
    definition:
      "Le disjoncteur différentiel combine deux protections : il coupe le circuit en cas de surcharge ou court-circuit (comme un disjoncteur classique) ET en cas de fuite de courant à la terre (protection des personnes). C'est l'appareil de tête de chaque rangée du tableau électrique.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Interrupteur différentiel',
    slug: 'interrupteur-differentiel',
    definition:
      "L'interrupteur différentiel protège les personnes contre les fuites de courant (électrisation) mais ne protège pas contre les surintensités. Il est placé en tête de rangée dans le tableau et protège un groupe de circuits. La norme NF C 15-100 impose au minimum deux interrupteurs différentiels 30 mA par logement.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Tableau divisionnaire',
    slug: 'tableau-divisionnaire',
    definition:
      "Le tableau divisionnaire est un tableau électrique secondaire installé à distance du tableau principal, par exemple dans un garage ou une extension. Il est alimenté par un câble protégé depuis le tableau principal et dispose de ses propres protections (différentiel + disjoncteurs).",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Section de câble',
    slug: 'section-de-cable',
    definition:
      "La section de câble (en mm²) détermine l'intensité maximale qu'un conducteur peut transporter sans surchauffe. Par exemple : 1,5 mm² pour l'éclairage (10A), 2,5 mm² pour les prises (16A), 6 mm² pour la plaque de cuisson (32A). Une section inadaptée est un risque d'incendie.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Pieuvre électrique',
    slug: 'pieuvre-electrique',
    definition:
      "La pieuvre électrique est un système de câblage préfabriqué en usine, constitué d'un boîtier central et de gaines rayonnant vers chaque point d'utilisation. Elle simplifie et accélère le câblage des constructions neuves tout en garantissant la conformité NF C 15-100.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'GTL (Gaine Technique Logement)',
    slug: 'gtl',
    definition:
      "La GTL est un espace technique obligatoire (NF C 15-100) qui regroupe le tableau électrique, le coffret de communication (VDI), le disjoncteur de branchement et les arrivées de courant fort et faible. Elle doit être directement accessible et mesurer au minimum 60 cm de large.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'ETEL (Espace Technique Électrique du Logement)',
    slug: 'etel',
    definition:
      "L'ETEL est la zone dédiée à la GTL dans un logement, imposée par la norme NF C 15-100. Ses dimensions minimales sont de 60 cm de large sur 25 cm de profondeur, du sol au plafond. Aucun réseau d'eau ni de gaz ne doit traverser cet espace pour des raisons de sécurité.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'NF C 15-100',
    slug: 'nf-c-15-100',
    definition:
      "La NF C 15-100 est la norme française qui régit les installations électriques dans les bâtiments résidentiels. Elle définit le nombre minimal de prises, circuits et protections par pièce. Toute installation neuve ou rénovation complète doit la respecter. Le Consuel vérifie la conformité avant la mise en service.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Consuel',
    slug: 'consuel',
    definition:
      "Le Consuel est l'organisme qui délivre l'attestation de conformité d'une installation électrique neuve ou entièrement rénovée. Cette attestation est obligatoire pour obtenir la mise en service du compteur auprès d'Enedis. L'inspection vérifie la conformité à la norme NF C 15-100.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Mise à la terre',
    slug: 'mise-a-la-terre',
    definition:
      "La mise à la terre consiste à relier les masses métalliques de l'installation (appareils, canalisations, châssis) à un piquet de terre enfoncé dans le sol. Elle permet au courant de fuite de s'écouler vers la terre et de déclencher le différentiel, protégeant ainsi les occupants contre l'électrisation.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Parafoudre',
    slug: 'parafoudre',
    definition:
      "Le parafoudre est un dispositif installé dans le tableau électrique pour protéger les équipements contre les surtensions liées à la foudre. Il est obligatoire en zones AQ2 (régions à forte densité de foudroiement) ou quand le bâtiment est équipé d'un paratonnerre. Il protège notamment les appareils électroniques sensibles.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Contacteur jour/nuit',
    slug: 'contacteur-jour-nuit',
    definition:
      "Le contacteur jour/nuit (ou contacteur heures creuses) est un appareil modulaire du tableau qui commande automatiquement le chauffe-eau pendant les heures creuses. Il reçoit un signal d'Enedis pour basculer entre les tarifs. Il permet de réduire significativement la facture d'électricité liée à l'eau chaude sanitaire.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Délesteur',
    slug: 'delesteur',
    definition:
      "Le délesteur est un appareil qui coupe temporairement des circuits non prioritaires (chauffe-eau, radiateurs secondaires) quand la consommation totale approche la puissance souscrite. Il évite les disjonctions intempestives sans avoir besoin d'augmenter l'abonnement, ce qui représente une économie significative.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Câblage VDI',
    slug: 'cablage-vdi',
    definition:
      "Le câblage VDI (Voix-Données-Images) regroupe les réseaux de communication d'un logement : téléphone, internet et télévision. La norme NF C 15-100 impose un coffret VDI dans la GTL et au moins deux prises RJ45 par pièce principale dans les logements neufs.",
    category: 'Électricité',
    relatedService: 'electricien',
  },

  // ─── Isolation & énergie ───────────────────────────────────
  {
    term: 'Résistance thermique (R)',
    slug: 'resistance-thermique-r',
    definition:
      "La résistance thermique R (en m².K/W) mesure la capacité d'un matériau ou d'une paroi à s'opposer au passage de la chaleur. Plus R est élevé, plus l'isolation est performante. Les aides financières exigent un R minimal selon la zone : par exemple R ≥ 7 pour l'isolation des combles perdus.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'Lambda (λ)',
    slug: 'lambda',
    definition:
      "Le lambda (λ) est le coefficient de conductivité thermique d'un matériau, exprimé en W/(m.K). Plus il est bas, plus le matériau est isolant. Par exemple : laine de verre λ = 0,032, polystyrène expansé λ = 0,038, fibre de bois λ = 0,038. Il sert à calculer la résistance R = épaisseur / λ.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'Pont thermique',
    slug: 'pont-thermique',
    definition:
      "Un pont thermique est une zone de faiblesse dans l'enveloppe isolante du bâtiment où la chaleur s'échappe plus facilement. On les trouve aux jonctions mur/plancher, autour des fenêtres et au niveau des balcons. Ils peuvent représenter jusqu'à 25 % des déperditions thermiques et favorisent la condensation.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'Pare-vapeur',
    slug: 'pare-vapeur',
    definition:
      "Le pare-vapeur est une membrane étanche à la vapeur d'eau (Sd ≥ 18 m) placée côté chaud de l'isolant. Il empêche la vapeur d'eau intérieure de migrer dans l'isolant et d'y condenser, ce qui dégraderait ses performances. Il est indispensable dans les toitures et murs à ossature bois.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'Frein-vapeur',
    slug: 'frein-vapeur',
    definition:
      "Le frein-vapeur est une membrane à perméabilité variable (Sd entre 2 et 5 m) qui régule le passage de la vapeur d'eau. Il limite la migration de vapeur en hiver tout en permettant le séchage de la paroi en été. Il est préféré au pare-vapeur dans les constructions bois et l'isolation biosourcée.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'ITI (Isolation Thermique par l\'Intérieur)',
    slug: 'iti',
    definition:
      "L'ITI consiste à poser l'isolant sur la face intérieure des murs. C'est la solution la plus économique et la plus courante en rénovation. Ses inconvénients : elle réduit la surface habitable, ne traite pas tous les ponts thermiques et diminue l'inertie thermique des murs.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'ITE (Isolation Thermique par l\'Extérieur)',
    slug: 'ite',
    definition:
      "L'ITE consiste à envelopper le bâtiment d'un manteau isolant par l'extérieur, sous enduit ou sous bardage. Elle supprime la majorité des ponts thermiques, conserve l'inertie des murs et ne réduit pas la surface habitable. Plus coûteuse que l'ITI, elle offre les meilleures performances globales.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'Sarking',
    slug: 'sarking',
    definition:
      "Le sarking est une technique d'isolation de toiture par l'extérieur. Des panneaux isolants rigides sont posés sur les chevrons, sous les liteaux et la couverture. Cette méthode conserve le volume des combles, supprime les ponts thermiques de la charpente et convient aussi bien en neuf qu'en rénovation.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'DPE (Diagnostic de Performance Énergétique)',
    slug: 'dpe',
    definition:
      "Le DPE est un diagnostic obligatoire lors de la vente ou la location d'un logement. Il attribue une étiquette énergie (A à G) en fonction de la consommation d'énergie primaire et des émissions de CO₂. Depuis 2023, les logements classés G sont progressivement interdits à la location.",
    category: 'Isolation & énergie',
    relatedService: 'diagnostiqueur-immobilier',
  },
  {
    term: 'BBC (Bâtiment Basse Consommation)',
    slug: 'bbc',
    definition:
      "Le label BBC désigne un bâtiment dont la consommation d'énergie primaire est inférieure à 50 kWh/m²/an (modulé selon la zone climatique). Atteindre le niveau BBC en rénovation ouvre droit à des aides bonifiées. C'est l'objectif de performance des rénovations globales ambitieuses.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'RE2020',
    slug: 're2020',
    definition:
      "La RE2020 (Réglementation Environnementale 2020) est la norme qui s'applique à toutes les constructions neuves depuis le 1er janvier 2022. Elle renforce les exigences d'isolation, impose un seuil maximal d'émissions carbone sur tout le cycle de vie du bâtiment et encourage les matériaux biosourcés.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'RT2012',
    slug: 'rt2012',
    definition:
      "La RT2012 (Réglementation Thermique 2012) est l'ancienne norme thermique qui s'appliquait aux constructions neuves avant la RE2020. Elle imposait une consommation maximale de 50 kWh/m²/an en énergie primaire. Les bâtiments construits sous RT2012 restent performants, mais la RE2020 est désormais plus exigeante.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'VMC simple flux',
    slug: 'vmc-simple-flux',
    definition:
      "La VMC simple flux est un système de ventilation mécanique qui extrait l'air vicié des pièces humides (cuisine, salle de bain, WC) et fait entrer l'air neuf par des entrées d'air dans les pièces de vie. La version hygroréglable (type B) module les débits selon l'humidité pour limiter les déperditions.",
    category: 'Isolation & énergie',
    relatedService: 'chauffagiste',
  },
  {
    term: 'VMC double flux',
    slug: 'vmc-double-flux',
    definition:
      "La VMC double flux récupère jusqu'à 90 % de la chaleur de l'air extrait pour préchauffer l'air neuf entrant. Elle supprime les entrées d'air dans les fenêtres et filtre l'air extérieur (pollens, particules). Son surcoût est compensé par les économies de chauffage, surtout dans les maisons très isolées.",
    category: 'Isolation & énergie',
    relatedService: 'chauffagiste',
  },
  {
    term: 'Pompe à chaleur (PAC)',
    slug: 'pompe-a-chaleur-pac',
    definition:
      "La pompe à chaleur est un appareil qui puise les calories dans l'air extérieur (aérothermie), le sol (géothermie) ou l'eau pour chauffer le logement. Son COP (coefficient de performance) de 3 à 5 signifie qu'elle produit 3 à 5 kWh de chaleur pour 1 kWh d'électricité consommé. Éligible à MaPrimeRénov'.",
    category: 'Isolation & énergie',
    relatedService: 'pompe-a-chaleur',
  },
  {
    term: 'MaPrimeRénov\'',
    slug: 'maprimenov',
    definition:
      "MaPrimeRénov' est l'aide financière principale de l'État pour la rénovation énergétique des logements. Son montant dépend des revenus du ménage, du type de travaux et du gain énergétique visé. Elle est cumulable avec les CEE, l'éco-PTZ et la TVA à 5,5 %. La demande se fait avant le début des travaux.",
    category: 'Isolation & énergie',
    relatedService: 'renovation-energetique',
  },
  {
    term: 'CEE (Certificats d\'Économie d\'Énergie)',
    slug: 'cee',
    definition:
      "Les CEE sont un dispositif qui oblige les fournisseurs d'énergie à financer des travaux d'économies d'énergie chez les particuliers. Concrètement, vous recevez une prime (versée par le fournisseur) pour vos travaux d'isolation, de chauffage ou de ventilation. Le montant varie selon les travaux et la zone géographique.",
    category: 'Isolation & énergie',
    relatedService: 'renovation-energetique',
  },

  // ─── Menuiserie ────────────────────────────────────────────
  {
    term: 'Dormant',
    slug: 'dormant',
    definition:
      "Le dormant est le cadre fixe d'une fenêtre ou d'une porte, scellé dans la maçonnerie. Il reçoit l'ouvrant (la partie mobile). En rénovation, on peut poser une nouvelle fenêtre en conservant l'ancien dormant (pose en rénovation) ou le remplacer entièrement (pose en dépose totale) pour de meilleures performances.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Ouvrant',
    slug: 'ouvrant',
    definition:
      "L'ouvrant est la partie mobile d'une fenêtre ou d'une porte, celle qui s'ouvre et se ferme. Il est articulé au dormant par des paumelles ou des compas. Il existe différents types d'ouverture : à la française (axe vertical), oscillo-battant, coulissant, à soufflet (axe horizontal bas).",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Meneau',
    slug: 'meneau',
    definition:
      "Le meneau est un montant vertical qui divise une baie vitrée en plusieurs parties. Il peut être structurel (pierre, bois) ou esthétique (profilé aluminium). Dans les fenêtres modernes, les « petits bois » collés imitent l'aspect des meneaux anciens sans diviser réellement le vitrage.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Traverse',
    slug: 'traverse',
    definition:
      "La traverse est un élément horizontal du cadre d'une fenêtre ou d'une porte. La traverse haute forme le dessus de l'ouvrant, la traverse basse (ou jet d'eau) se situe en bas et assure l'évacuation de l'eau de pluie. Une traverse basse mal conçue est une source fréquente d'infiltration.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Crémone',
    slug: 'cremone',
    definition:
      "La crémone est le mécanisme de fermeture d'une fenêtre, composé de deux tringles actionnées par une poignée. Quand on tourne la poignée, les tringles se déplacent vers le haut et vers le bas pour verrouiller l'ouvrant sur le dormant. La crémone oscillo-battante permet aussi l'ouverture en soufflet.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Gâche',
    slug: 'gache',
    definition:
      "La gâche est la pièce métallique fixée sur le dormant dans laquelle vient se loger le pêne de la serrure ou les points de fermeture de la crémone. Une gâche mal réglée empêche la fenêtre de fermer correctement et compromet l'étanchéité à l'air et à l'eau.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Paumelle',
    slug: 'paumelle',
    definition:
      "La paumelle est la charnière qui relie l'ouvrant au dormant d'une fenêtre ou d'une porte. Les paumelles modernes sont réglables en trois dimensions (hauteur, latéral, compression) pour ajuster parfaitement la fermeture. Elles supportent le poids de l'ouvrant et conditionnent sa longévité.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Coefficient Uw',
    slug: 'coefficient-uw',
    definition:
      "Le Uw (en W/m².K) mesure la performance thermique globale d'une fenêtre (vitrage + menuiserie). Plus il est bas, plus la fenêtre est isolante. Repères : simple vitrage Uw ≈ 5, double vitrage standard Uw ≈ 1,4, triple vitrage Uw ≈ 0,8. Les aides exigent généralement un Uw ≤ 1,3.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Double vitrage',
    slug: 'double-vitrage',
    definition:
      "Le double vitrage est composé de deux vitres séparées par une lame d'air ou de gaz argon. La notation 4/16/4 signifie : vitre de 4 mm, lame de 16 mm, vitre de 4 mm. Le gaz argon améliore l'isolation de 10 à 15 % par rapport à l'air. C'est le standard actuel pour les fenêtres.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Triple vitrage',
    slug: 'triple-vitrage',
    definition:
      "Le triple vitrage comporte trois vitres et deux lames de gaz, offrant un Ug pouvant descendre à 0,5 W/m².K. Il est surtout pertinent pour les façades nord et dans les régions froides. Son poids supérieur nécessite des menuiseries renforcées. Le surcoût par rapport au double vitrage est de 50 à 80 %.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Intercalaire warm-edge',
    slug: 'intercalaire-warm-edge',
    definition:
      "L'intercalaire warm-edge (ou « bord chaud ») est l'espaceur qui sépare les vitres d'un double ou triple vitrage. Contrairement aux intercalaires en aluminium, il est en matériau composite à faible conductivité, ce qui réduit le pont thermique en périphérie du vitrage et limite la condensation sur les bords.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Vitrage à contrôle solaire',
    slug: 'vitrage-controle-solaire',
    definition:
      "Le vitrage à contrôle solaire possède un traitement qui laisse passer la lumière tout en réfléchissant une partie de la chaleur du soleil. Son facteur solaire (g) est inférieur à 0,35. Il est recommandé pour les grandes baies vitrées exposées sud ou ouest afin de limiter la surchauffe estivale sans recourir à la climatisation.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Seuil PMR',
    slug: 'seuil-pmr',
    definition:
      "Le seuil PMR est un seuil de porte d'entrée ou de baie vitrée dont la hauteur ne dépasse pas 20 mm, facilitant l'accès aux personnes à mobilité réduite et aux fauteuils roulants. Il est obligatoire dans les logements neufs accessibles et de plus en plus demandé en rénovation pour le confort quotidien.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Joint de vitrage',
    slug: 'joint-de-vitrage',
    definition:
      "Le joint de vitrage assure l'étanchéité entre la vitre et le cadre de la fenêtre. Il peut être en silicone, en EPDM ou en mastic. Un joint vieilli ou décollé provoque des infiltrations d'eau et d'air. Son remplacement est une opération simple qui améliore considérablement le confort thermique.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },

  // ─── Revêtements ───────────────────────────────────────────
  {
    term: 'Ragréage',
    slug: 'ragreage',
    definition:
      "Le ragréage est un enduit autolissant appliqué sur un sol pour le rendre parfaitement plan avant la pose d'un revêtement (carrelage, parquet, vinyle). Il corrige les irrégularités de surface jusqu'à 10 mm d'épaisseur. Un ragréage raté (fissures, décollements) compromet l'adhérence et la durabilité du revêtement final.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Primaire d\'accrochage',
    slug: 'primaire-accrochage',
    definition:
      "Le primaire d'accrochage est un produit liquide appliqué sur un support avant l'enduit, le ragréage ou la colle à carrelage. Il améliore l'adhérence du produit suivant et régule l'absorption du support. Sauter cette étape est la cause n°1 de décollement des carrelages et enduits.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Enduit de lissage',
    slug: 'enduit-de-lissage',
    definition:
      "L'enduit de lissage est une couche fine appliquée sur un mur pour obtenir une surface parfaitement lisse avant la peinture ou le papier peint. Il comble les petits défauts (griffures, trous de cheville, bulles). Il s'applique au couteau en une ou deux couches et se ponce après séchage.",
    category: 'Revêtements',
    relatedService: 'peintre',
  },
  {
    term: 'Chape',
    slug: 'chape',
    definition:
      "La chape est une couche de mortier (ciment ou anhydrite) coulée sur une dalle pour obtenir une surface plane et lisse. Elle peut intégrer un plancher chauffant et une isolation acoustique. Son épaisseur varie de 3 à 8 cm. Le temps de séchage (3 à 4 semaines pour une chape ciment) est à respecter impérativement avant la pose du revêtement.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Sous-couche (peinture)',
    slug: 'sous-couche-peinture',
    definition:
      "La sous-couche (ou primaire) est la première couche de peinture qui prépare le support. Elle améliore l'accroche de la peinture de finition, uniformise l'absorption du support et masque les anciennes couleurs. Sans sous-couche adaptée, il faut souvent 3 à 4 couches de finition au lieu de 2.",
    category: 'Revêtements',
    relatedService: 'peintre',
  },
  {
    term: 'Grès cérame',
    slug: 'gres-cerame',
    definition:
      "Le grès cérame est un carrelage en pâte de grès pressée et cuite à très haute température (1 200 °C). Extrêmement dur et peu poreux, il résiste au gel, aux taches et à l'usure. Il existe en version pleine masse (teint dans la masse) ou émaillé. C'est le choix privilégié pour les sols intérieurs et extérieurs.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Faïence',
    slug: 'faience',
    definition:
      "La faïence est un carrelage mural en terre cuite émaillée, plus léger et plus facile à couper que le grès cérame. Elle est destinée uniquement aux murs (trop fragile pour les sols). Très utilisée dans les salles de bain et cuisines, elle offre une grande variété de couleurs et de décors.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Émaux de Briare',
    slug: 'emaux-de-briare',
    definition:
      "Les émaux de Briare sont de petites mosaïques en pâte de verre émaillée, originaires de la ville de Briare. Ils sont utilisés pour les piscines, les douches et les frises décoratives. Résistants au gel et aux produits chimiques, ils offrent une palette de couleurs éclatantes et une finition haut de gamme.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Croisillons',
    slug: 'croisillons',
    definition:
      "Les croisillons sont de petites pièces en plastique placées entre les carreaux lors de la pose pour garantir un espacement régulier des joints. Ils existent en différentes épaisseurs (1 à 5 mm). Le choix de l'épaisseur dépend du format du carrelage et du rendu esthétique souhaité.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Mortier-colle',
    slug: 'mortier-colle',
    definition:
      "Le mortier-colle est un mélange à base de ciment utilisé pour fixer les carreaux sur leur support. Il existe en différentes classes (C1, C2, C2S pour les supports déformables) et en version standard ou améliorée. Le choix dépend du type de carrelage, du support et de l'usage (intérieur, extérieur, pièce humide).",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Joint de carrelage',
    slug: 'joint-de-carrelage',
    definition:
      "Le joint de carrelage comble l'espace entre les carreaux. Il assure l'étanchéité, compense les variations dimensionnelles et permet un entretien facile. Il existe en version ciment (classique) ou époxy (imputrescible, résistant aux taches). Les joints époxy sont recommandés dans les douches et cuisines professionnelles.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Enduit à la chaux',
    slug: 'enduit-a-la-chaux',
    definition:
      "L'enduit à la chaux est un revêtement mural traditionnel composé de chaux aérienne ou hydraulique mélangée à du sable. Perméable à la vapeur d'eau, il laisse « respirer » les murs anciens et régule l'humidité. Il est privilégié en rénovation du bâti ancien où le ciment est à proscrire.",
    category: 'Revêtements',
    relatedService: 'facadier',
  },
  {
    term: 'Béton ciré',
    slug: 'beton-cire',
    definition:
      "Le béton ciré est un revêtement décoratif composé de ciment, de résine et de pigments, appliqué en couche mince (2-3 mm) sur un sol ou un mur. Il offre un rendu contemporain et sans joint. Sa mise en œuvre demande un savoir-faire particulier et un support parfaitement préparé pour éviter les fissures.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'SPEC (Système de Protection à l\'Eau sous Carrelage)',
    slug: 'spec',
    definition:
      "Le SPEC est un système d'étanchéité liquide appliqué sous le carrelage dans les pièces humides (douche, salle de bain). Il se compose d'une résine, de bandes de renfort aux angles et d'une natte. Il est obligatoire dans les douches à l'italienne et fortement recommandé dans toute salle d'eau.",
    category: 'Revêtements',
    relatedService: 'carreleur',
  },
  {
    term: 'Parquet flottant',
    slug: 'parquet-flottant',
    definition:
      "Le parquet flottant est un revêtement de sol en bois (ou stratifié) posé sans colle ni clou sur une sous-couche isolante. Les lames s'emboîtent par un système de clic. Cette technique permet une pose rapide et une dépose sans dommage. Un joint de dilatation de 8 mm minimum doit être respecté en périphérie.",
    category: 'Revêtements',
    relatedService: 'menuisier',
  },

  // ─── Administratif & juridique ─────────────────────────────
  {
    term: 'Garantie décennale',
    slug: 'garantie-decennale',
    definition:
      "La garantie décennale est une assurance obligatoire pour tout constructeur, couvrant pendant 10 ans les dommages qui compromettent la solidité de l'ouvrage ou le rendent impropre à sa destination. Elle couvre par exemple les fissures structurelles, les problèmes d'étanchéité ou les défauts de fondation. Vérifiez toujours l'attestation avant de signer a consultation.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Assurance dommage-ouvrage',
    slug: 'dommage-ouvrage',
    definition:
      "L'assurance dommage-ouvrage (DO) est obligatoire pour tout maître d'ouvrage (particulier qui fait construire). Elle préfinance les réparations relevant de la garantie décennale sans attendre la recherche de responsabilité. Son coût (2 à 5 % du montant des travaux) évite des années de procédure en cas de sinistre.",
    category: 'Administratif & juridique',
  },
  {
    term: 'CCMI (Contrat de Construction de Maison Individuelle)',
    slug: 'ccmi',
    definition:
      "Le CCMI est le contrat le plus protecteur pour un particulier qui fait construire une maison. Il impose un prix ferme et définitif, des pénalités de retard, une garantie de livraison et une garantie de remboursement. Tout constructeur de maison individuelle est tenu de le proposer dès lors qu'il fournit le plan.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Maître d\'œuvre',
    slug: 'maitre-oeuvre',
    definition:
      "Le maître d'œuvre est le professionnel (architecte, bureau d'études, économiste) qui conçoit le projet, coordonne les entreprises et contrôle la bonne exécution des travaux pour le compte du propriétaire. Il est le garant de la qualité technique et du respect du budget et des délais.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Maître d\'ouvrage',
    slug: 'maitre-ouvrage',
    definition:
      "Le maître d'ouvrage est le commanditaire des travaux : c'est vous, le propriétaire. Vous définissez le programme, le budget et les délais. Vous êtes responsable du choix des entreprises et du paiement des travaux. En cas de construction neuve, vous devez souscrire l'assurance dommage-ouvrage.",
    category: 'Administratif & juridique',
  },
  {
    term: 'PV de réception des travaux',
    slug: 'pv-reception-travaux',
    definition:
      "Le procès-verbal de réception est le document officiel par lequel le maître d'ouvrage accepte les travaux réalisés. Il peut être avec ou sans réserves. C'est une date clé : elle déclenche les garanties légales (parfait achèvement, biennale, décennale). Ne signez jamais sans avoir tout inspecté minutieusement.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Réserves',
    slug: 'reserves',
    definition:
      "Les réserves sont les défauts ou malfaçons constatés lors de la réception des travaux et consignés dans le PV. L'entreprise a un an (garantie de parfait achèvement) pour les corriger. Des réserves bien formulées, précises et datées, sont essentielles pour protéger vos droits en cas de litige.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Levée de réserves',
    slug: 'levee-de-reserves',
    definition:
      "La levée de réserves est le constat que les défauts signalés lors de la réception ont été corrigés par l'entreprise. Elle se formalise par un PV de levée de réserves signé par les deux parties. Si l'entreprise ne corrige pas dans le délai d'un an, le maître d'ouvrage peut faire intervenir une autre entreprise aux frais de la première.",
    category: 'Administratif & juridique',
  },
  {
    term: 'DROC (Déclaration d\'Ouverture de Chantier)',
    slug: 'droc',
    definition:
      "La DROC est un formulaire Cerfa (n°13407) à déposer en mairie dès le début des travaux ayant fait l'objet d'un permis de construire. Elle informe l'administration que le chantier est lancé et déclenche le délai de validité du permis. Oublier cette déclaration peut poser problème lors de la revente.",
    category: 'Administratif & juridique',
  },
  {
    term: 'DAACT (Déclaration d\'Achèvement et de Conformité des Travaux)',
    slug: 'daact',
    definition:
      "La DAACT est le formulaire Cerfa (n°13408) à déposer en mairie dans les 90 jours suivant l'achèvement des travaux soumis à permis de construire ou déclaration préalable. La mairie dispose de 3 mois (5 en secteur protégé) pour contester la conformité. Sans DAACT, le bien est considéré comme non conforme.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Permis de construire',
    slug: 'permis-de-construire',
    definition:
      "Le permis de construire est une autorisation d'urbanisme obligatoire pour les constructions nouvelles de plus de 20 m² d'emprise au sol (ou 40 m² en zone urbaine avec PLU). Le recours à un architecte est obligatoire au-delà de 150 m² de surface de plancher. Le délai d'instruction est de 2 à 3 mois.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Déclaration préalable de travaux',
    slug: 'declaration-prealable',
    definition:
      "La déclaration préalable (DP) est une autorisation d'urbanisme simplifiée pour les travaux de faible ampleur : extension de 5 à 20 m², ravalement, changement de fenêtres en zone protégée, pose de panneaux solaires, clôture. Le délai d'instruction est d'un mois. Elle est plus simple que le permis de construire mais tout aussi obligatoire.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Garantie de parfait achèvement',
    slug: 'garantie-parfait-achevement',
    definition:
      "La garantie de parfait achèvement oblige l'entreprise à réparer tous les désordres signalés par le maître d'ouvrage pendant l'année qui suit la réception des travaux. Elle couvre tout : défauts esthétiques, malfaçons, vices apparents. C'est la garantie la plus large mais la plus courte (1 an seulement).",
    category: 'Administratif & juridique',
  },
  {
    term: 'Garantie biennale (bon fonctionnement)',
    slug: 'garantie-biennale',
    definition:
      "La garantie biennale couvre pendant 2 ans après la réception les éléments d'équipement dissociables du bâtiment : robinetterie, volets roulants, radiateurs, portes intérieures, revêtements muraux. Elle ne concerne pas les éléments indissociables (ceux dont le retrait endommagerait la structure), qui relèvent de la décennale.",
    category: 'Administratif & juridique',
  },
  {
    term: 'PLU (Plan Local d\'Urbanisme)',
    slug: 'plu',
    definition:
      "Le PLU est le document d'urbanisme qui définit les règles de construction sur chaque parcelle d'une commune : hauteur maximale, emprise au sol, retrait par rapport aux limites, aspect extérieur. Il est consultable gratuitement en mairie ou sur le géoportail de l'urbanisme. Toute construction doit respecter le PLU en vigueur.",
    category: 'Administratif & juridique',
  },
  {
    term: 'DTU (Document Technique Unifié)',
    slug: 'dtu',
    definition:
      "Les DTU sont des normes françaises qui définissent les règles de l'art pour chaque type de travaux du bâtiment (DTU 26.1 pour les enduits, DTU 52.1 pour le carrelage, etc.). Bien que non obligatoires juridiquement, leur non-respect peut exclure la prise en charge par l'assurance décennale en cas de sinistre.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Devis',
    slug: 'devis',
    definition:
      "The consultation est un document écrit détaillant les travaux à réaliser, les matériaux, les quantités, les prix unitaires et le montant total TTC. Il engage the attorney sur le prix une fois signé par le client. A consultation précis et complet est votre meilleure protection : ne signez jamais a consultation vague ou incomplet.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Retenue de garantie (5 %)',
    slug: 'retenue-de-garantie',
    definition:
      "La retenue de garantie est le droit pour le maître d'ouvrage de conserver 5 % du montant des travaux pendant un an après la réception. Cette somme est consignée chez un tiers (notaire, CDC) et sert à garantir la levée des réserves. Elle est libérée automatiquement au bout d'un an si les réserves sont levées.",
    category: 'Administratif & juridique',
  },

  // ─── Termes supplémentaires — Gros œuvre ───────────────────
  {
    term: 'Semelle filante',
    slug: 'semelle-filante',
    definition:
      "La semelle filante est une fondation continue en béton armé qui court sous tous les murs porteurs d'un bâtiment. Sa largeur (40 à 80 cm) et sa profondeur (50 à 100 cm) dépendent de la nature du sol et des charges à reprendre. C'est le type de fondation le plus courant pour les maisons individuelles.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'Plancher collaborant (bac acier)',
    slug: 'plancher-collaborant',
    definition:
      "Le plancher collaborant est un système de dalle composé d'un bac en acier nervuré servant de coffrage permanent et d'une dalle de béton coulée par-dessus. L'acier et le béton travaillent ensemble (d'où le nom « collaborant »). Ce système est rapide à poser et très utilisé en extension et surélévation.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },
  {
    term: 'IPN (poutrelle métallique)',
    slug: 'ipn',
    definition:
      "L'IPN est un profilé métallique en forme de I utilisé comme poutre porteuse. On l'emploie principalement pour remplacer un mur porteur (en association avec des poteaux), créer une grande ouverture ou soutenir un plancher. Son dimensionnement doit être calculé par un bureau d'études structure.",
    category: 'Gros œuvre',
    relatedService: 'macon',
  },

  // ─── Termes supplémentaires — Charpente & toiture ──────────
  {
    term: 'Tuile mécanique',
    slug: 'tuile-mecanique',
    definition:
      "La tuile mécanique (ou tuile à emboîtement) est une tuile en terre cuite dotée de nervures qui s'emboîtent les unes dans les autres pour assurer l'étanchéité. Plus rapide à poser que la tuile plate, elle est le type de couverture le plus répandu en France. Sa durée de vie dépasse 50 ans.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Chatière (ventilation toiture)',
    slug: 'chatiere',
    definition:
      "La chatière est une petite tuile ajourée ou un accessoire de ventilation placé sur le pan de toiture. Elle permet la circulation d'air sous la couverture pour éviter la condensation dans les combles. Le nombre de chatières est calculé en fonction de la surface de toiture et de la zone climatique.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },
  {
    term: 'Closoir de faîtage',
    slug: 'closoir-faitage',
    definition:
      "Le closoir est une bande souple ventilée placée sous les tuiles faîtières au sommet du toit. Il assure l'étanchéité du faîtage tout en laissant passer l'air pour ventiler la sous-toiture. Il remplace avantageusement le scellement au mortier, plus rigide et sujet aux fissures.",
    category: 'Charpente & toiture',
    relatedService: 'couvreur',
  },

  // ─── Termes supplémentaires — Plomberie ────────────────────
  {
    term: 'Fosse septique (toutes eaux)',
    slug: 'fosse-septique',
    definition:
      "La fosse toutes eaux est un dispositif d'assainissement non collectif qui reçoit l'ensemble des eaux usées d'un logement (eaux vannes et eaux ménagères). Elle assure un prétraitement par décantation avant l'épuration dans un système d'épandage ou un filtre. Elle doit être vidangée tous les 4 ans environ.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Mitigeur thermostatique',
    slug: 'mitigeur-thermostatique',
    definition:
      "Le mitigeur thermostatique maintient automatiquement la température de l'eau à la valeur choisie, même en cas de variation de débit sur le réseau. Il est particulièrement recommandé pour les douches : il évite les brûlures et offre un confort d'utilisation supérieur au mitigeur classique.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },
  {
    term: 'Clapet anti-retour',
    slug: 'clapet-anti-retour',
    definition:
      "Le clapet anti-retour est un dispositif qui ne laisse passer l'eau que dans un seul sens. Il empêche le refoulement des eaux usées dans le logement en cas de remontée du réseau d'assainissement (inondation, obstruction). Il est indispensable pour les logements situés en contrebas de la voie publique.",
    category: 'Plomberie',
    relatedService: 'plombier',
  },

  // ─── Termes supplémentaires — Électricité ──────────────────
  {
    term: 'Disjoncteur de branchement',
    slug: 'disjoncteur-branchement',
    definition:
      "Le disjoncteur de branchement (ou disjoncteur général) est l'appareil de coupure principal situé en amont du tableau électrique. Il est plombé par Enedis et calibré selon la puissance souscrite (6 kVA, 9 kVA, etc.). Il protège l'installation contre les surcharges globales et permet de couper l'alimentation générale du logement.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Prise de terre',
    slug: 'prise-de-terre',
    definition:
      "La prise de terre est le dispositif enfoui dans le sol (piquet, boucle de fond de fouille) qui assure la connexion électrique entre l'installation et la terre. Sa résistance doit être inférieure à 100 ohms pour garantir le déclenchement du différentiel en cas de défaut. Elle est mesurée par le Consuel.",
    category: 'Électricité',
    relatedService: 'electricien',
  },
  {
    term: 'Gaine ICTA',
    slug: 'gaine-icta',
    definition:
      "La gaine ICTA (Isolant Cintrable Transversalement Annelé) est un tube souple en PVC dans lequel passent les câbles électriques. Elle protège les conducteurs contre les chocs mécaniques et facilite le remplacement ultérieur des fils. Son utilisation est obligatoire dans les constructions neuves et les rénovations.",
    category: 'Électricité',
    relatedService: 'electricien',
  },

  // ─── Termes supplémentaires — Isolation & énergie ──────────
  {
    term: 'Laine de verre',
    slug: 'laine-de-verre',
    definition:
      "La laine de verre est l'isolant le plus utilisé en France (60 % du marché). Fabriquée à partir de sable et de verre recyclé, elle offre un excellent rapport performance/prix (lambda ≈ 0,032 W/m.K). Elle se décline en rouleaux, panneaux et flocons pour souffler dans les combles perdus.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'Laine de roche',
    slug: 'laine-de-roche',
    definition:
      "La laine de roche est un isolant minéral fabriqué à partir de basalte. Elle offre des performances thermiques similaires à la laine de verre (lambda ≈ 0,035) mais avec une meilleure résistance au feu (incombustible) et une densité supérieure qui améliore l'isolation acoustique. Elle est privilégiée en ITE et en cloisons.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'Polyuréthane (PUR)',
    slug: 'polyurethane',
    definition:
      "Le polyuréthane (PUR) est l'un des isolants les plus performants du marché avec un lambda de 0,022 à 0,028 W/m.K. En panneaux rigides, il permet d'atteindre une résistance thermique élevée avec une faible épaisseur. Il est idéal pour l'isolation des sols et des toitures-terrasses où l'espace est limité.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },
  {
    term: 'Audit énergétique',
    slug: 'audit-energetique',
    definition:
      "L'audit énergétique est une étude approfondie des performances thermiques d'un logement, plus détaillée qu'un DPE. Il propose des scénarios de travaux chiffrés avec les gains énergétiques attendus. Il est obligatoire depuis 2023 pour la vente des logements classés F ou G au DPE, et requis pour MaPrimeRénov' Parcours accompagné.",
    category: 'Isolation & énergie',
    relatedService: 'diagnostiqueur-immobilier',
  },
  {
    term: 'Étanchéité à l\'air',
    slug: 'etancheite-air',
    definition:
      "L'étanchéité à l'air mesure la capacité de l'enveloppe du bâtiment à limiter les fuites d'air parasites (prises, passages de gaines, menuiseries). Elle est mesurée par un test d'infiltrométrie (blower door) et est réglementée en construction neuve (RE2020). Une bonne étanchéité réduit les déperditions de 15 à 25 %.",
    category: 'Isolation & énergie',
    relatedService: 'isolation-thermique',
  },

  // ─── Termes supplémentaires — Menuiserie ───────────────────
  {
    term: 'Baie coulissante à galandage',
    slug: 'baie-galandage',
    definition:
      "La baie à galandage est une baie vitrée coulissante dont les vantaux s'escamotent dans l'épaisseur du mur (la « galandage »). Ouverte, elle libère 100 % de la surface vitrée, créant une continuité totale entre intérieur et extérieur. Son installation nécessite un mur suffisamment épais et un châssis spécifique.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Oscillo-battant',
    slug: 'oscillo-battant',
    definition:
      "L'oscillo-battant est un type d'ouverture de fenêtre qui combine deux modes : l'ouverture à la française (rotation sur un axe vertical) et l'ouverture en soufflet (basculement du haut vers l'intérieur). Ce système permet de ventiler en toute sécurité sans ouvrir complètement la fenêtre.",
    category: 'Menuiserie',
    relatedService: 'menuisier',
  },
  {
    term: 'Porte blindée',
    slug: 'porte-blindee',
    definition:
      "Une porte blindée est une porte d'entrée renforcée avec un bloc-porte en acier, des paumelles anti-dégondage et une serrure multipoints (3, 5 ou 7 points). Certifiée A2P (1 à 3 étoiles selon le niveau de résistance à l'effraction), elle offre une protection contre le cambriolage tout en assurant une isolation thermique et acoustique.",
    category: 'Menuiserie',
    relatedService: 'serrurier',
  },

  // ─── Termes supplémentaires — Revêtements ─────────────────
  {
    term: 'Peinture glycéro vs acrylique',
    slug: 'peinture-glycero-acrylique',
    definition:
      "La peinture acrylique (à l'eau) est la plus utilisée en intérieur : elle sèche vite, sent peu et respecte l'environnement. La peinture glycéro (à l'huile) offre un fini plus lisse et résiste mieux à l'humidité, mais ses solvants sont toxiques et son usage est de plus en plus réglementé (directive COV).",
    category: 'Revêtements',
    relatedService: 'peintre',
  },
  {
    term: 'Crépi (enduit de façade)',
    slug: 'crepi',
    definition:
      "Le crépi est un enduit de finition appliqué sur les murs extérieurs pour les protéger des intempéries et leur donner un aspect esthétique. Il existe en finition grattée, talochée, projetée ou écrasée. Un crépi bien appliqué sur un support sain dure 15 à 30 ans avant de nécessiter un ravalement.",
    category: 'Revêtements',
    relatedService: 'facadier',
  },
  {
    term: 'Placo (plaque de plâtre)',
    slug: 'placo',
    definition:
      "Le placo (marque Placoplatre devenue nom commun) désigne les plaques de plâtre utilisées pour créer des cloisons, doublages et faux plafonds. Il existe en version standard (BA13), hydrofuge (vert, pour les pièces humides), coupe-feu (rose) et haute dureté. Le placo se visse sur une ossature métallique et se joint à l'enduit.",
    category: 'Revêtements',
    relatedService: 'plaquiste',
  },

  // ─── Termes supplémentaires — Administratif ────────────────
  {
    term: 'Responsabilité civile professionnelle (RC Pro)',
    slug: 'rc-pro',
    definition:
      "La RC Pro est une assurance obligatoire pour tout artisan du bâtiment. Elle couvre les dommages causés à des tiers pendant l'exécution des travaux (dégât chez un voisin, blessure d'un passant). Elle est distincte de la garantie décennale et doit figurer sur the consultation avec le nom de l'assureur et le numéro de police.",
    category: 'Administratif & juridique',
  },
  {
    term: 'SIRET',
    slug: 'siret',
    definition:
      "Le SIRET est un identifiant unique de 14 chiffres attribué à chaque établissement d'une entreprise. Il est composé du SIREN (9 chiffres identifiant l'entreprise) + NIC (5 chiffres identifiant l'établissement). Vérifier le SIRET d'an attorney sur societe.com ou infogreffe.fr permet de s'assurer que l'entreprise est bien enregistrée et active.",
    category: 'Administratif & juridique',
  },
  {
    term: 'Auto-entrepreneur (micro-entreprise)',
    slug: 'auto-entrepreneur',
    definition:
      "Le statut d'auto-entrepreneur (micro-entreprise) est un régime simplifié pour the attorneys indépendants. Le chiffre d'affaires est plafonné (77 700 € en prestations de services). Un auto-entrepreneur du bâtiment doit avoir les mêmes assurances (décennale, RC Pro) qu'une entreprise classique. Son absence de TVA peut rendre ses tarifs compétitifs.",
    category: 'Administratif & juridique',
  },
]
