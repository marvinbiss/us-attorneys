/**
 * Contenu SEO riche pour chaque corps de métier.
 * Utilisé sur les pages hub de services pour ajouter du contenu contextuel
 * (guide de prix, FAQ, conseils pratiques).
 */

export interface TradeContent {
  slug: string
  name: string
  priceRange: {
    min: number
    max: number
    unit: string
  }
  commonTasks: string[]
  tips: string[]
  faq: { q: string; a: string }[]
  emergencyInfo?: string
  certifications: string[]
  averageResponseTime: string
}

export const tradeContent: Record<string, TradeContent> = {
  plombier: {
    slug: 'plombier',
    name: 'Plombier',
    priceRange: {
      min: 60,
      max: 90,
      unit: '€/h',
    },
    commonTasks: [
      'Débouchage de canalisation : 80 à 250 € selon la complexité',
      'Remplacement d\'un chauffe-eau : 800 à 2 500 € (fourniture + pose)',
      'Réparation de fuite d\'eau : 90 à 300 €',
      'Installation d\'un WC : 200 à 600 € (hors fourniture)',
      'Pose d\'un robinet mitigeur : 80 à 200 € (hors fourniture)',
      'Remplacement d\'un ballon d\'eau chaude : 600 à 2 000 €',
      'Détection de fuite non destructive (gaz traceur ou caméra thermique) : 150 à 400 €',
      'Rénovation complète plomberie salle de bain (alimentation + évacuation) : 1 500 à 4 000 €',
    ],
    tips: [
      'Vérifiez que le plombier dispose d\'une assurance responsabilité civile professionnelle et d\'une garantie décennale, obligatoires pour les travaux de plomberie.',
      'Demandez toujours un devis détaillé avant le début des travaux : un professionnel sérieux ne commence jamais sans accord écrit sur le prix.',
      'Privilégiez un plombier certifié RGE si vous envisagez des travaux liés au chauffage ou à l\'eau chaude, car cela vous ouvre droit aux aides de l\'État (MaPrimeRenov\', CEE).',
      'En cas d\'urgence, coupez l\'arrivée d\'eau générale avant l\'arrivée du plombier pour limiter les dégâts. Le compteur se trouve souvent dans la cave ou à l\'extérieur.',
      'Méfiez-vous des plombiers qui refusent de donner un devis par écrit ou qui exigent un paiement intégral avant intervention : ce sont des signaux d\'alerte.',
      'Fermez le robinet d\'arrêt général immédiatement si vous constatez une fuite : un joint qui goutte peut gaspiller jusqu\'à 100 litres d\'eau par jour, soit plus de 35 m³ par an.',
      'Faites vidanger votre chauffe-eau une fois par an et vérifiez le groupe de sécurité chaque mois pour éviter l\'accumulation de calcaire et prolonger sa durée de vie de 3 à 5 ans.',
      'Pour un WC suspendu, prévoyez un bâti-support encastré (Geberit ou équivalent) et un mur porteur ou renforcé : le coût total (bâti + cuvette + pose) se situe entre 800 et 2 000 €.',
    ],
    faq: [
      {
        q: 'Combien coûte une intervention de plombier en urgence ?',
        a: 'Une intervention d\'urgence coûte en moyenne entre 150 et 400 €, avec des majorations possibles la nuit (+50 à 100 %), le week-end (+25 à 50 %) et les jours fériés (+50 à 100 %). Exigez toujours un devis avant que le plombier ne commence les travaux, même en urgence.',
      },
      {
        q: 'Comment savoir si mon plombier est fiable ?',
        a: 'Vérifiez son numéro SIRET sur le site de l\'INSEE, son inscription au registre des métiers, et demandez une copie de son assurance décennale. Un plombier sérieux fournit ces documents sans difficulté. Consultez également les avis en ligne et demandez des références de chantiers récents.',
      },
      {
        q: 'Quels travaux de plomberie puis-je faire moi-même ?',
        a: 'Vous pouvez changer un joint de robinet, remplacer un flexible de douche ou déboucher un siphon avec une ventouse. En revanche, toute intervention sur les canalisations encastrées, le chauffe-eau ou l\'arrivée d\'eau principale doit être confiée à un professionnel pour des raisons de sécurité et d\'assurance.',
      },
      {
        q: 'Le plombier doit-il fournir une facture ?',
        a: 'Oui, c\'est obligatoire pour toute prestation supérieure à 25 €. La facture doit mentionner le détail des travaux, le prix unitaire des pièces, le taux horaire de la main-d\'oeuvre et la TVA appliquée (10 % pour la rénovation, 20 % pour le neuf). Conservez-la précieusement pour la garantie.',
      },
      {
        q: 'Que faire en cas de fuite d\'eau la nuit ?',
        a: 'Coupez immédiatement l\'arrivée d\'eau au compteur général, généralement situé dans la cave ou à l\'extérieur du logement. Placez des récipients sous la fuite et épongez l\'eau stagnante pour limiter les dégâts. Contactez ensuite un plombier d\'urgence ; les majorations nocturnes et de week-end varient de 50 à 100 % du tarif de base.',
      },
      {
        q: 'Comment déboucher un évier naturellement ?',
        a: 'Versez un mélange de bicarbonate de soude (6 cuillères à soupe) et de vinaigre blanc (25 cl) dans la canalisation, laissez agir 30 minutes puis rincez à l\'eau bouillante. Si le bouchon persiste, utilisez une ventouse ou un furet manuel. Si ces méthodes échouent, faites appel à un plombier qui pourra utiliser un furet électrique ou un hydrocurage.',
      },
      {
        q: 'Quel est le coût d\'un remplacement de chauffe-eau ?',
        a: 'Le remplacement d\'un chauffe-eau électrique de 200 litres coûte entre 800 et 1 500 € (fourniture + pose), tandis qu\'un chauffe-eau thermodynamique revient à 2 500 à 4 500 €. Le prix dépend du type (électrique, gaz, thermodynamique, solaire), de la capacité et de l\'accessibilité de l\'installation. Un chauffe-eau thermodynamique permet d\'économiser 40 à 50 % sur la facture d\'eau chaude par rapport à un chauffe-eau électrique classique (source : ADEME).',
      },
      {
        q: 'Quelle est la durée de vie d\'une installation de plomberie ?',
        a: 'Les canalisations en cuivre durent 50 à 80 ans, celles en PER (polyéthylène réticulé) environ 50 ans, tandis que les tuyaux en plomb (interdits depuis 1995) doivent être remplacés. Un chauffe-eau a une durée de vie de 10 à 15 ans et les robinetteries de 15 à 20 ans. Un entretien régulier (détartrage, vérification des joints) prolonge significativement la durée de vie de l\'installation.',
      },
    ],
    emergencyInfo:
      'En cas de fuite d\'eau importante ou de canalisation bouchée, coupez immédiatement l\'arrivée d\'eau au compteur général et contactez un plombier d\'urgence. Certains professionnels proposent des interventions en soirée ou le week-end. Les tarifs d\'urgence sont majorés de 50 à 100 % par rapport à une intervention en journée.',
    certifications: [
      'Qualibat (qualification 5111/5112 plomberie sanitaire)',
      'RGE (Reconnu Garant de l\'Environnement)',
      'PG (Professionnel du Gaz — obligatoire pour les installations gaz)',
      'Qualigaz (certificat de conformité gaz)',
      'QualiPAC (pompes à chaleur)',
      'QualiSol (chauffe-eau solaire)',
      'Agrément ACS (Attestation de Conformité Sanitaire — matériaux en contact avec l\'eau potable)',
      'Certification Qualipac (installation de pompes à chaleur eau/eau)',
    ],
    averageResponseTime: 'Urgence (fuite, bouchon) : délai variable selon disponibilité ; travaux planifiés sous 1 à 2 semaines',
  },

  electricien: {
    slug: 'electricien',
    name: 'Électricien',
    priceRange: {
      min: 50,
      max: 80,
      unit: '€/h',
    },
    commonTasks: [
      'Mise aux normes d\'un tableau électrique : 800 à 2 500 €',
      'Installation d\'un point lumineux : 80 à 200 €',
      'Pose d\'une prise électrique supplémentaire : 60 à 150 €',
      'Remplacement d\'un interrupteur différentiel : 150 à 350 €',
      'Installation d\'un interphone ou visiophone : 300 à 1 200 €',
      'Réfection complète de l\'électricité d\'un appartement (60 m²) : 5 000 à 10 000 €',
      'Installation d\'un système domotique (éclairage, volets) : 1 500 à 5 000 €',
      'Pose de volets roulants électriques (par volet) : 400 à 900 €',
    ],
    tips: [
      'Assurez-vous que l\'électricien respecte la norme NF C 15-100, obligatoire pour toute installation électrique en France. Demandez un certificat de conformité Consuel à la fin des travaux.',
      'Comparez au moins trois devis en vérifiant que chacun détaille les fournitures, la main-d\'oeuvre et le coût des mises en conformité éventuelles.',
      'Choisissez un électricien certifié IRVE si vous souhaitez installer une borne de recharge pour véhicule électrique : c\'est obligatoire pour bénéficier des aides. Note : le crédit d\'impôt pour borne de recharge a été supprimé au 1er janvier 2026.',
      'Avant toute intervention, vérifiez que l\'électricien possède une habilitation électrique valide (B1, B2 ou BR selon le type de travaux).',
      'Pour des travaux de rénovation énergétique (chauffage électrique performant, VMC), un électricien RGE est indispensable pour obtenir les aides financières de l\'État.',
      'Coupez toujours le disjoncteur général avant toute intervention sur votre installation électrique, même pour un simple changement de prise ou d\'interrupteur.',
      'Demandez systématiquement l\'attestation de conformité Consuel après des travaux importants : c\'est votre preuve en cas de sinistre auprès de l\'assurance.',
      'Conservez le schéma de votre tableau électrique et le plan de câblage : ils facilitent les interventions futures et sont exigés lors de la revente du logement.',
    ],
    faq: [
      {
        q: 'Ma maison est ancienne, faut-il refaire toute l\'électricité ?',
        a: 'Pas nécessairement, mais un diagnostic électrique est fortement recommandé pour les installations de plus de 15 ans. Un électricien qualifié évaluera la conformité à la norme NF C 15-100 et proposera les mises à niveau nécessaires. Une rénovation partielle (tableau, prises de terre, différentiels) coûte entre 1 500 et 4 000 € selon la surface.',
      },
      {
        q: 'Combien coûte l\'installation d\'une borne de recharge pour voiture électrique ?',
        a: 'L\'installation d\'une borne de recharge domestique (wallbox 7 kW) coûte entre 1 200 et 2 500 € pose comprise. Note : le crédit d\'impôt pour borne de recharge a été supprimé au 1er janvier 2026. Faites appel à un électricien certifié IRVE. Le délai d\'installation est généralement de 1 à 3 jours.',
      },
      {
        q: 'Qu\'est-ce que le certificat Consuel et est-il obligatoire ?',
        a: 'Le Consuel (Comité National pour la Sécurité des Usagers de l\'Électricité) délivre une attestation de conformité électrique. Il est obligatoire pour toute nouvelle installation ou rénovation complète avant la mise sous tension par Enedis. Le coût est d\'environ 120 à 180 € selon le type d\'installation.',
      },
      {
        q: 'Comment savoir si mon installation électrique est aux normes ?',
        a: 'Faites réaliser un diagnostic électrique par un électricien certifié ou un diagnostiqueur agréé. Ce contrôle vérifie la conformité à la norme NF C 15-100 : présence d\'un disjoncteur différentiel 30 mA, mise à la terre, protection des circuits et état des prises. Ce diagnostic est obligatoire pour la vente d\'un logement de plus de 15 ans et coûte entre 100 et 200 €.',
      },
      {
        q: 'Quand faut-il refaire le tableau électrique ?',
        a: 'Le remplacement du tableau est nécessaire si votre installation a plus de 25 ans, si le tableau comporte encore des fusibles à broche, s\'il n\'y a pas de disjoncteur différentiel 30 mA ou si vous ajoutez des équipements énergivores (borne de recharge, pompe à chaleur). Le coût d\'un tableau neuf aux normes est de 800 à 2 500 € selon le nombre de circuits.',
      },
      {
        q: 'Les travaux électriques nécessitent-ils une mise aux normes complète ?',
        a: 'Non, la mise aux normes complète n\'est obligatoire que pour une construction neuve ou une rénovation totale. Pour des travaux partiels, seuls les circuits concernés doivent respecter la norme NF C 15-100 en vigueur. Toutefois, l\'électricien doit s\'assurer que les travaux ne créent pas de danger sur le reste de l\'installation.',
      },
      {
        q: 'Combien de prises électriques faut-il par pièce ?',
        a: 'La norme NF C 15-100 impose un minimum de 5 prises dans un séjour de moins de 28 m² (7 au-delà), 3 prises dans une chambre, 6 prises dans une cuisine (dont 4 au-dessus du plan de travail) et 1 prise dans les toilettes. Chaque prise doit être alimentée par un circuit protégé par un disjoncteur adapté (16 A ou 20 A).',
      },
      {
        q: 'Peut-on faire soi-même des travaux électriques dans son logement ?',
        a: 'Légalement, un particulier peut réaliser des travaux électriques dans son propre logement, mais il engage sa responsabilité en cas d\'accident ou d\'incendie. L\'attestation Consuel sera exigée pour le raccordement au réseau. Pour des raisons de sécurité et d\'assurance, il est vivement recommandé de confier les travaux à un électricien qualifié, surtout pour le tableau et les circuits principaux.',
      },
    ],
    emergencyInfo:
      'En cas de panne électrique, de fils dénudés ou d\'odeur de brûlé, coupez immédiatement le disjoncteur général et appelez un électricien d\'urgence. Ne tentez jamais de réparer vous-même un problème électrique. Un électricien d\'astreinte peut intervenir selon sa disponibilité, avec une majoration de 50 à 100 % en dehors des heures ouvrées.',
    certifications: [
      'Qualifelec (qualification E1 à E3 selon le niveau de compétence)',
      'RGE (Reconnu Garant de l\'Environnement)',
      'Qualification IRVE (obligatoire pour les bornes de recharge)',
      'Habilitation électrique (B1, B2, BR, HC — obligatoire)',
      'Qualibat (qualification 5411/5412 installations électriques)',
      'Consuel (attestation de conformité électrique)',
      'Habilitation B2V (travaux au voisinage de pièces nues sous tension)',
      'Certification NF Habitat (installations électriques résidentielles)',
    ],
    averageResponseTime: 'Urgence (panne, court-circuit) : délai variable selon disponibilité ; travaux planifiés sous 1 à 2 semaines',
  },

  serrurier: {
    slug: 'serrurier',
    name: 'Serrurier',
    priceRange: {
      min: 80,
      max: 150,
      unit: '€/intervention',
    },
    commonTasks: [
      'Ouverture de porte claquée (sans effraction) : 80 à 150 €',
      'Ouverture de porte blindée : 150 à 400 €',
      'Changement de serrure standard : 100 à 300 € (fourniture incluse)',
      'Pose d\'une serrure multipoints : 300 à 800 €',
      'Blindage de porte existante : 800 à 2 000 €',
      'Installation d\'une porte blindée complète : 1 500 à 4 500 €',
      'Copie de clé standard ou haute sécurité : 5 à 80 € selon le type',
      'Installation d\'une serrure connectée : 200 à 600 € (fourniture + pose)',
    ],
    tips: [
      'En cas de porte claquée, ne paniquez pas : un serrurier qualifié peut ouvrir sans dégradation dans la majorité des cas. Ne faites jamais appel à un dépanneur trouvé sur un prospectus dans votre boîte aux lettres.',
      'Exigez un devis ferme et définitif avant toute intervention, y compris en urgence. La loi oblige le serrurier à vous remettre un devis écrit pour toute prestation dépassant 150 €.',
      'Méfiez-vous des serruriers qui annoncent des prix très bas par téléphone puis gonflent la facture une fois sur place. Vérifiez les avis en ligne et le numéro SIRET avant d\'appeler.',
      'Privilégiez les serruriers ayant une adresse physique vérifiable (atelier ou magasin). C\'est un gage de sérieux et de recours possible en cas de problème.',
      'Après un cambriolage, faites intervenir la police avant le serrurier. Vous aurez besoin du dépôt de plainte pour votre assurance, et il ne faut pas toucher à la scène.',
      'Gardez toujours un double de clé chez un voisin de confiance ou dans un boîtier à code sécurisé. Cela vous évitera des frais d\'ouverture de porte en cas d\'oubli.',
      'Ne laissez jamais la clé sur la porte, même à l\'intérieur : en cas de porte claquée, le serrurier devra percer le cylindre si la clé bloque l\'accès, ce qui augmente considérablement le coût.',
      'Photographiez le recto de votre carte de propriété de clé (numéro gravé sur la clé ou la carte fournie). Ce numéro permet au serrurier de reproduire votre clé haute sécurité sans démonter la serrure.',
    ],
    faq: [
      {
        q: 'Combien coûte une ouverture de porte le dimanche ou la nuit ?',
        a: 'Une ouverture de porte en horaires non ouvrés (nuit, dimanche, jours fériés) coûte entre 150 et 350 € pour une porte standard, et entre 250 et 500 € pour une porte blindée. Les majorations de nuit (entre 20h et 6h) vont de 50 à 100 % du tarif de base. Demandez toujours le prix total avant que le serrurier n\'intervienne.',
      },
      {
        q: 'Quelle serrure choisir pour sécuriser mon logement ?',
        a: 'Pour une sécurité optimale, optez pour une serrure certifiée A2P (Assurance Prévention Protection). Il existe 3 niveaux : A2P* (résistance de 5 min à l\'effraction), A2P** (10 min) et A2P*** (15 min). Les assureurs exigent souvent un niveau A2P** minimum. Comptez 200 à 600 € pour la serrure et 100 à 200 € pour la pose.',
      },
      {
        q: 'Mon assurance prend-elle en charge les frais de serrurier ?',
        a: 'Oui, la plupart des contrats d\'assurance habitation couvrent les frais de serrurier en cas de cambriolage, de perte de clés ou de porte claquée, souvent dans le cadre de la garantie assistance. Vérifiez votre contrat et contactez votre assureur avant l\'intervention si possible. Conservez la facture et le devis pour le remboursement.',
      },
      {
        q: 'Comment éviter les arnaques aux serruriers ?',
        a: 'Vérifiez le SIRET de l\'entreprise, recherchez des avis en ligne et privilégiez le bouche-à-oreille. Refusez toute intervention sans devis préalable écrit. Un serrurier honnête accepte toujours de détailler ses tarifs. En cas de doute, contactez la DGCCRF (Direction Générale de la Concurrence) au 0809 540 550.',
      },
      {
        q: 'Mon assurance couvre-t-elle un changement de serrure après un cambriolage ?',
        a: 'Oui, la garantie vol de votre assurance habitation prend généralement en charge le remplacement de la serrure et la réparation de la porte après un cambriolage. Vous devez déposer plainte au commissariat, déclarer le sinistre sous 2 jours ouvrés et conserver la facture du serrurier. Le remboursement se fait sur présentation de ces justificatifs, souvent sans franchise.',
      },
      {
        q: 'Combien de temps faut-il pour ouvrir une porte claquée ?',
        a: 'Un serrurier expérimenté ouvre une porte claquée (non verrouillée à clé) en 5 à 15 minutes sans abîmer la serrure, grâce à des outils spécialisés (crochet, by-pass, radio). Pour une porte verrouillée ou blindée, l\'intervention peut prendre 30 minutes à 1 heure. Si le cylindre doit être percé, le remplacement de la serrure sera nécessaire.',
      },
      {
        q: 'Quelle est la différence entre une serrure 3 points et 5 points ?',
        a: 'Une serrure 3 points verrouille la porte en trois endroits (haut, milieu, bas) et offre un niveau de sécurité correct pour un appartement. La serrure 5 points ajoute deux points latéraux pour une résistance accrue à l\'effraction, recommandée pour les maisons et les rez-de-chaussée. Les assureurs exigent souvent un minimum de 3 points avec certification A2P pour les logements.',
      },
      {
        q: 'Peut-on changer une serrure de porte d\'entrée en copropriété ?',
        a: 'Vous pouvez librement changer le cylindre (barillet) de votre porte d\'entrée privative sans autorisation. En revanche, modifier la serrure de la porte d\'entrée de l\'immeuble nécessite l\'accord du syndic de copropriété. Si vous êtes locataire, vous pouvez changer la serrure à vos frais mais devez remettre l\'ancienne en quittant le logement.',
      },
    ],
    emergencyInfo:
      'En cas de porte claquée ou de serrure cassée, un serrurier d\'urgence intervient dans les meilleurs délais (délai variable selon disponibilité et localisation). Attention aux majorations : +50 % en soirée (après 19h), +75 à 100 % la nuit (après 22h), le dimanche et les jours fériés. Exigez toujours un devis écrit avant le début de l\'intervention.',
    certifications: [
      'Certification A2P (1 à 3 étoiles — résistance à l\'effraction, délivrée par le CNPP)',
      'Qualibat (qualification 4421 serrurerie)',
      'CQP Serrurier-dépanneur (Certificat de Qualification Professionnelle)',
      'Certification FMSD (Serrurier dépanneur-installateur, inscrite au RNCP)',
      'Certification A2P Service (installateur agréé par le CNPP pour la pose de serrures certifiées)',
      'Label Serrurier de Confiance (délivré par la Fédération Française des Constructeurs de Serrures)',
      'Qualification Qualibat 4413 (fermetures industrielles et serrurerie de bâtiment)',
      'Assurance décennale et responsabilité civile professionnelle obligatoires',
    ],
    averageResponseTime: 'Urgence (porte claquée, effraction) : délai variable selon disponibilité et localisation',
  },

  chauffagiste: {
    slug: 'chauffagiste',
    name: 'Chauffagiste',
    priceRange: {
      min: 60,
      max: 100,
      unit: '€/h',
    },
    commonTasks: [
      'Entretien annuel de chaudière gaz : 100 à 200 €',
      'Remplacement d\'une chaudière gaz à condensation : 3 000 à 7 000 € (fourniture + pose)',
      'Installation d\'une pompe à chaleur air-eau : 8 000 à 15 000 €',
      'Désembouage d\'un circuit de chauffage : 400 à 900 €',
      'Remplacement de radiateurs : 300 à 800 € par radiateur (fourniture + pose)',
      'Installation d\'un plancher chauffant : 50 à 100 €/m²',
      'Installation d\'un thermostat connecté : 150 à 450 € (fourniture + pose)',
      'Dépannage et remise en service du chauffage central : 150 à 350 € (déplacement + main-d\'œuvre)',
    ],
    tips: [
      'L\'entretien annuel de votre chaudière est obligatoire par la loi (décret du 9 juin 2009). Prévoyez-le à l\'automne, avant la saison de chauffe, pour éviter les pannes en plein hiver.',
      'Privilégiez un chauffagiste certifié RGE pour bénéficier des aides financières : MaPrimeRenov\' (jusqu\'à 5 000 € pour une pompe à chaleur), CEE, éco-prêt à taux zéro et TVA à 5,5 %. Attention : depuis le 1er mars 2025, les chaudières gaz et fioul sont soumises à la TVA à 20 % (fin du taux réduit). La TVA réduite (5,5 % ou 10 %) s\'applique uniquement aux équipements non fossiles (PAC, chaudière biomasse, etc.).',
      'Comparez les performances énergétiques (COP pour les pompes à chaleur, rendement pour les chaudières) et pas seulement le prix d\'achat. Une chaudière à condensation consomme 15 à 30 % de moins qu\'une ancienne chaudière non-condensation (plus de 15 ans).',
      'Demandez un bilan thermique complet avant l\'installation d\'un nouveau système de chauffage. Un bon chauffagiste dimensionne l\'installation en fonction de la surface, de l\'isolation et de la zone climatique.',
      'Souscrivez un contrat d\'entretien annuel : il coûte entre 120 et 250 € par an et inclut généralement la visite obligatoire, le dépannage prioritaire et les pièces d\'usure.',
      'Ne baissez pas le chauffage en dessous de 16 °C la nuit : la relance du matin consomme plus d\'énergie que le maintien d\'une température modérée. L\'ADEME recommande 17 °C dans les chambres et 19 °C dans les pièces de vie.',
      'Purgez vos radiateurs chaque automne avant la remise en route du chauffage. L\'air emprisonné dans le circuit réduit l\'efficacité de chauffe et peut provoquer des bruits de circulation désagréables.',
      'Un thermostat connecté (Netatmo, Tado, Honeywell) permet de programmer le chauffage pièce par pièce et de le piloter à distance. L\'économie constatée est de 15 à 25 % sur la facture de chauffage selon l\'ADEME.',
    ],
    faq: [
      {
        q: 'Quand dois-je remplacer ma chaudière ?',
        a: 'Une chaudière a une durée de vie moyenne de 15 à 20 ans. Les signes qui doivent alerter : pannes fréquentes, surconsommation de gaz, bruits inhabituels, eau pas assez chaude. Si votre chaudière a plus de 15 ans, un remplacement par un modèle à condensation vous fera économiser 20 à 30 % sur votre facture énergétique.',
      },
      {
        q: 'Pompe à chaleur ou chaudière gaz : que choisir ?',
        a: 'La pompe à chaleur air-eau est plus écologique et bénéficie de plus d\'aides (MaPrimeRenov\' jusqu\'à 5 000 €), mais son coût d\'installation est plus élevé (8 000 à 15 000 € contre 3 000 à 7 000 € pour une chaudière gaz). Elle est idéale pour les maisons bien isolées. La chaudière gaz à condensation reste pertinente en appartement ou si le réseau de gaz est déjà installé.',
      },
      {
        q: 'Les aides de l\'État pour le chauffage sont-elles cumulables ?',
        a: 'Oui, sous conditions de revenus et avec un artisan RGE. Vous pouvez cumuler MaPrimeRenov\', les CEE (Certificats d\'Économies d\'Énergie), l\'éco-prêt à taux zéro (jusqu\'à 50 000 €) et la TVA réduite à 5,5 %. Le montant total peut couvrir 50 à 90 % du coût des travaux pour les ménages modestes. Attention : depuis le 1er mars 2025, les chaudières gaz et fioul sont soumises à la TVA à 20 % (fin du taux réduit). La TVA réduite (5,5 % ou 10 %) s\'applique uniquement aux équipements non fossiles (PAC, chaudière biomasse, etc.).',
      },
      {
        q: 'Ma chaudière est en panne en plein hiver, que faire ?',
        a: 'Vérifiez d\'abord les éléments simples : thermostat, pression du circuit (entre 1 et 1,5 bar), disjoncteur dédié. Si le problème persiste, appelez un chauffagiste en urgence. Les délais varient selon les disponibilités et votre localisation. Si vous avez un contrat d\'entretien, le dépannage est souvent inclus ou prioritaire.',
      },
      {
        q: 'L\'entretien annuel de la chaudière est-il vraiment obligatoire ?',
        a: 'Oui, l\'entretien annuel est obligatoire depuis le décret du 9 juin 2009 pour toutes les chaudières (gaz, fioul, bois) d\'une puissance de 4 à 400 kW. Le chauffagiste vérifie la combustion, nettoie les composants et mesure les émissions de CO. Il remet une attestation d\'entretien, exigée par l\'assurance en cas de sinistre. Le coût est de 100 à 200 €.',
      },
      {
        q: 'Comment purger correctement ses radiateurs ?',
        a: 'La purge des radiateurs doit se faire chaque année avant la saison de chauffe. Ouvrez la vis de purge en haut du radiateur avec une clé spéciale, laissez l\'air s\'échapper jusqu\'à ce que de l\'eau coule, puis refermez. Commencez par le radiateur le plus proche de la chaudière. Après la purge, vérifiez la pression du circuit (1 à 1,5 bar) et ajoutez de l\'eau si nécessaire.',
      },
      {
        q: 'Quel est le coût d\'un plancher chauffant ?',
        a: 'L\'installation d\'un plancher chauffant hydraulique coûte entre 50 et 100 €/m² (pose uniquement) et entre 70 et 120 €/m² pour un système électrique. Pour une maison de 100 m², le budget total (fourniture + pose) est de 8 000 à 15 000 €. Le plancher chauffant offre un confort supérieur aux radiateurs et permet des économies d\'énergie de 10 à 15 %.',
      },
      {
        q: 'Faut-il un contrat d\'entretien pour sa chaudière ?',
        a: 'Le contrat d\'entretien n\'est pas obligatoire mais vivement recommandé. Il coûte entre 120 et 250 € par an et inclut la visite annuelle obligatoire, le dépannage prioritaire (souvent sous 24h) et parfois les pièces d\'usure. Sans contrat, une intervention d\'urgence coûte 150 à 350 € avec des délais plus longs, surtout en plein hiver.',
      },
    ],
    emergencyInfo:
      'En cas de panne de chauffage en hiver, contactez un chauffagiste d\'urgence : les délais d\'intervention varient selon les disponibilités et la localisation. En cas d\'odeur de gaz, ouvrez les fenêtres, ne touchez pas aux interrupteurs électriques, quittez le logement et appelez immédiatement le numéro d\'urgence GRDF : 0 800 47 33 33 (gratuit, 24h/24).',
    certifications: [
      'RGE (Reconnu Garant de l\'Environnement)',
      'Qualibat (qualification 5211/5212 chauffage)',
      'PG (Professionnel du Gaz — obligatoire pour les installations gaz)',
      'Qualigaz (certificat de conformité gaz)',
      'QualiPAC (pompes à chaleur)',
      'Qualibois (chauffage bois : poêles, chaudières)',
      'Qualifioul (installations fioul)',
      'QualiSol (chauffe-eau solaire)',
    ],
    averageResponseTime: 'Urgence : délai variable selon disponibilité ; entretien sur rendez-vous sous 1 à 2 semaines',
  },

  'peintre-en-batiment': {
    slug: 'peintre-en-batiment',
    name: 'Peintre en bâtiment',
    priceRange: {
      min: 25,
      max: 45,
      unit: '€/m²',
    },
    commonTasks: [
      'Peinture d\'une pièce (murs + plafond, 12 m²) : 400 à 800 €',
      'Ravalement de façade (enduit + peinture) : 40 à 100 €/m²',
      'Pose de papier peint : 15 à 35 €/m² (hors fourniture)',
      'Laquage de boiseries et portes : 30 à 60 €/m²',
      'Traitement et peinture de volets : 50 à 120 € par volet',
      'Peinture de plafond seul : 18 à 35 €/m²',
      'Peinture de façade extérieure (hors ravalement complet) : 25 à 50 €/m²',
      'Enduit de lissage sur murs abîmés : 15 à 30 €/m²',
    ],
    tips: [
      'Un bon peintre commence toujours par une préparation minutieuse des surfaces : lessivage, ponçage, rebouchage des fissures et application d\'une sous-couche. Cette étape représente 60 % du travail et garantit un résultat durable.',
      'Demandez au peintre de préciser la marque et la gamme de peinture utilisée. Les peintures professionnelles (Tollens, Sikkens, Zolpan) offrent un meilleur rendu et une meilleure tenue que les premiers prix de grande surface.',
      'Pour un ravalement de façade, vérifiez que le peintre possède une garantie décennale, car les travaux extérieurs engagent la responsabilité du professionnel pendant 10 ans.',
      'Le devis doit indiquer le nombre de couches prévues (minimum 2 pour un résultat optimal), le type de finition (mat, satiné, brillant) et si la préparation des supports est incluse.',
      'Privilégiez les peintures à faible émission de COV (Composants Organiques Volatils), identifiées par le label A+ sur l\'étiquette, surtout pour les chambres et les pièces de vie.',
      'Aérez abondamment la pièce pendant et après les travaux de peinture (au moins 24 à 48 h), même avec des peintures acryliques à l\'eau qui émettent moins de solvants que les glycéro.',
      'Préparer les murs (rebouchage, ponçage, sous-couche) représente 50 % du résultat final : ne négligez jamais cette étape et vérifiez que le peintre la détaille bien dans son devis.',
      'Demandez à votre peintre de vous présenter un nuancier RAL ou NCS afin de valider la teinte exacte avant le chantier : l\'écran d\'un téléphone ne restitue pas fidèlement les couleurs.',
    ],
    faq: [
      {
        q: 'Combien coûte la peinture d\'un appartement complet ?',
        a: 'Pour un appartement de 60 m², comptez entre 2 500 et 5 000 € pour la peinture de toutes les pièces (murs et plafonds), fournitures incluses. Le prix varie selon l\'état des murs (plus de préparation = plus cher), le nombre de couleurs et la qualité de la peinture choisie. Demandez au moins 3 devis pour comparer.',
      },
      {
        q: 'Faut-il vider entièrement la pièce avant les travaux de peinture ?',
        a: 'Idéalement oui, mais un bon peintre peut travailler dans une pièce partiellement vidée. Il protégera les meubles restants avec des bâches et du ruban de masquage. Prévoyez toutefois de déplacer les meubles au centre de la pièce et de débarrasser les étagères et les cadres.',
      },
      {
        q: 'Quelle est la différence entre peinture mate, satinée et brillante ?',
        a: 'La peinture mate masque les imperfections et donne un aspect sobre, idéale pour les plafonds et les chambres. La satinée est lavable et résistante, parfaite pour les pièces de vie, couloirs et cuisines. La brillante (ou laquée) offre un rendu très lisse et se nettoie facilement, recommandée pour les boiseries et les salles de bain.',
      },
      {
        q: 'Combien de temps faut-il pour peindre un appartement ?',
        a: 'Pour un appartement de 60 m², comptez 5 à 8 jours de travail incluant la préparation, l\'application de 2 couches et les finitions. Le délai peut être plus long si les murs nécessitent d\'importants travaux de préparation (rebouchage, enduit, ponçage).',
      },
      {
        q: 'Comment bien préparer les murs avant de peindre ?',
        a: 'La préparation comprend le lessivage à la lessive Saint-Marc pour dégraisser, le rebouchage des trous et fissures à l\'enduit, le ponçage au papier de verre grain 120, et l\'application d\'une sous-couche d\'accrochage. Sur un mur neuf en plâtre, une sous-couche spéciale est indispensable pour éviter que la peinture ne cloque. Cette étape représente 60 % du temps total des travaux.',
      },
      {
        q: 'Quelle peinture choisir pour une salle de bain ?',
        a: 'Optez pour une peinture acrylique spéciale pièces humides, résistante à l\'humidité et aux moisissures (classe 1 ou 2 selon la norme ISO 11998). Les marques professionnelles comme Tollens, Sikkens ou Zolpan proposent des gammes dédiées. Comptez 30 à 50 € le litre en qualité professionnelle. Évitez les peintures glycéro dans les pièces de vie en raison de leurs émanations de COV.',
      },
      {
        q: 'La peinture de façade nécessite-t-elle une autorisation ?',
        a: 'Oui, un ravalement de façade nécessite une déclaration préalable de travaux en mairie si vous modifiez l\'aspect extérieur (couleur, enduit). En zone protégée (ABF), l\'accord de l\'Architecte des Bâtiments de France est requis, ce qui peut limiter le choix des couleurs. Certaines communes imposent un ravalement tous les 10 ans (Paris, par exemple) et peuvent émettre un arrêté si la façade est dégradée.',
      },
      {
        q: 'Combien de couches de peinture faut-il appliquer ?',
        a: 'Deux couches de peinture de finition sont le minimum pour un résultat homogène et durable. Sur un support neuf ou un changement de couleur radical (clair vers foncé), une sous-couche plus deux couches de finition sont nécessaires. Chaque couche doit sécher complètement (4 à 6 heures pour une acrylique) avant l\'application de la suivante.',
      },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la peinture en bâtiment. Prenez rendez-vous pour un devis gratuit sous 48h et une intervention planifiée sous 1 à 3 semaines.',
    certifications: [
      'Qualibat (qualification 6111/6112 peinture et ravalement)',
      'RGE (obligatoire si ITE — isolation thermique par l\'extérieur)',
      'ACQPA (qualification peinture anticorrosion — ouvrages métalliques)',
      'Compagnons du Devoir (formation d\'excellence)',
      'Certification AFNOR NF Environnement (peintures et vernis écologiques)',
      'Label Artisan d\'Art (spécialiste en peinture décorative, faux bois, patines)',
      'Assurance décennale (obligatoire pour tous travaux de peinture extérieure et ravalement)',
      'Certification IREF (Institut de Recherche et d\'Études sur la Finition)',
    ],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 3 semaines',
  },

  menuisier: {
    slug: 'menuisier',
    name: 'Menuisier',
    priceRange: {
      min: 45,
      max: 75,
      unit: '€/h',
    },
    commonTasks: [
      'Pose d\'une fenêtre double vitrage PVC : 300 à 800 € (hors fourniture)',
      'Fabrication et pose d\'un placard sur mesure : 800 à 3 000 €',
      'Pose d\'une porte intérieure : 150 à 400 € (hors fourniture)',
      'Installation d\'une cuisine aménagée : 1 500 à 5 000 € (pose uniquement)',
      'Création d\'un escalier sur mesure : 3 000 à 10 000 €',
      'Pose de parquet massif ou contrecollé : 30 à 70 €/m² (pose uniquement)',
      'Menuiserie extérieure (volets battants, portail bois) : 500 à 3 500 € selon dimensions',
      'Habillage et aménagement de sous-pente : 600 à 2 500 € selon surface et finitions',
    ],
    tips: [
      'Distinguez le menuisier d\'agencement (placards, cuisines, dressings sur mesure) du menuisier poseur (fenêtres, portes, parquet). Choisissez le spécialiste adapté à votre projet pour un résultat optimal.',
      'Pour le remplacement de fenêtres, un menuisier certifié RGE est indispensable pour bénéficier de MaPrimeRenov\' et des CEE. La pose doit respecter le DTU 36.5 pour garantir l\'étanchéité.',
      'Demandez à voir des réalisations précédentes du menuisier, surtout pour du mobilier sur mesure. Les photos de chantiers terminés sont un bon indicateur de la qualité du travail.',
      'Vérifiez que le devis précise l\'essence de bois utilisée (chêne, hêtre, sapin, bois exotique) et son origine. Le label PEFC ou FSC garantit un bois issu de forêts gérées durablement.',
      'Pour des fenêtres ou des volets, comparez les performances thermiques (coefficient Uw en W/m².K) et pas uniquement le prix. Un bon vitrage isolant se rentabilise en économies de chauffage.',
      'Choisissez du bois certifié PEFC ou FSC pour garantir une provenance durable. Ces labels assurent que le bois est issu de forêts gérées de manière responsable, un argument de qualité pour vos menuiseries.',
      'Un escalier en bois massif (chêne, hêtre, frêne) se patine naturellement avec le temps et gagne en caractère. Appliquez un vitrificateur mat pour le protéger tout en conservant son aspect naturel.',
      'Faites poser vos fenêtres par un menuisier certifié RGE pour bénéficier des aides à la rénovation énergétique (MaPrimeRenov\', CEE, éco-PTZ). Sans cette certification, aucune subvention ne sera accordée.',
    ],
    faq: [
      {
        q: 'Combien coûte le remplacement de toutes les fenêtres d\'une maison ?',
        a: 'Pour une maison standard avec 8 à 12 fenêtres, comptez entre 5 000 et 15 000 € selon le matériau (PVC : le moins cher, aluminium : intermédiaire, bois : le plus cher) et le type de vitrage. Avec les aides (MaPrimeRenov\' + CEE), la facture peut être réduite de 30 à 50 % pour les ménages modestes.',
      },
      {
        q: 'Bois, PVC ou aluminium : quel matériau choisir pour mes fenêtres ?',
        a: 'Le PVC offre le meilleur rapport qualité-prix et une bonne isolation (à partir de 300 € la fenêtre). Le bois est le plus esthétique et isolant mais nécessite un entretien régulier (à partir de 500 €). L\'aluminium est fin, moderne et sans entretien, mais moins isolant (à partir de 450 €). Le mixte bois-alu combine les avantages des deux.',
      },
      {
        q: 'Faut-il un permis de construire pour changer les fenêtres ?',
        a: 'Non, mais une déclaration préalable de travaux en mairie est obligatoire si vous modifiez l\'aspect extérieur de la façade (forme, couleur, matériau des fenêtres). En zone protégée (ABF, sites classés), l\'accord de l\'Architecte des Bâtiments de France est nécessaire. Les délais d\'instruction sont de 1 à 2 mois.',
      },
      {
        q: 'Combien coûte un dressing ou placard sur mesure ?',
        a: 'Un placard sur mesure avec portes coulissantes coûte entre 800 et 3 000 € selon les dimensions, le matériau (mélaminé, bois massif, laqué) et les aménagements intérieurs (tiroirs, penderies, étagères). Un dressing complet avec éclairage intégré peut atteindre 5 000 à 8 000 €. Le sur-mesure permet d\'exploiter chaque centimètre, notamment sous les combles ou dans les espaces atypiques.',
      },
      {
        q: 'Quelle est la durée de vie des fenêtres en PVC ?',
        a: 'Les fenêtres PVC de qualité ont une durée de vie de 25 à 35 ans sans entretien particulier, hormis un nettoyage régulier au savon doux. Les fenêtres en bois durent aussi longtemps mais nécessitent un entretien (lasure ou peinture) tous les 5 à 7 ans. Les fenêtres aluminium ont la meilleure longévité, jusqu\'à 40 ans, grâce à leur résistance à la corrosion.',
      },
      {
        q: 'Un menuisier peut-il fabriquer un escalier sur mesure ?',
        a: 'Oui, c\'est même l\'une des spécialités du menuisier d\'agencement. Un escalier sur mesure en bois coûte entre 3 000 et 10 000 € selon l\'essence (hêtre, chêne, frêne), la forme (droit, tournant, hélicoïdal) et les finitions (vitrification, peinture, garde-corps). La fabrication et la pose prennent 2 à 4 semaines. Un escalier sur mesure optimise l\'espace et s\'adapte parfaitement à la configuration du logement.',
      },
      {
        q: 'Comment entretenir ses menuiseries en bois ?',
        a: 'Les menuiseries extérieures en bois doivent être protégées par une lasure ou une peinture microporeuse tous les 5 à 7 ans. Poncez légèrement la surface, dépoussiérez et appliquez deux couches de lasure au pinceau. Pour les menuiseries intérieures (portes, placards), un nettoyage à l\'eau savonneuse suffit. Si le bois est abîmé, un menuisier peut le décaper, le traiter et le remettre en état.',
      },
      {
        q: 'Quelles aides existent pour le remplacement de fenêtres ?',
        a: 'MaPrimeRenov\' finance jusqu\'à 100 € par fenêtre (simple vers double vitrage) pour les ménages modestes. Les CEE (Certificats d\'Économies d\'Énergie) ajoutent 40 à 100 € par fenêtre (selon profil de revenus). L\'éco-prêt à taux zéro permet de financer jusqu\'à 7 000 € de remplacement de fenêtres sans intérêts. Le menuisier doit être certifié RGE pour que vous puissiez bénéficier de ces aides.',
      },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la menuiserie. Pour le remplacement de fenêtres cassées ou de portes endommagées, prenez rendez-vous pour un devis gratuit sous 48h.',
    certifications: [
      'Qualibat (qualification 3511 fourniture et pose de menuiseries extérieures)',
      'RGE (obligatoire pour les aides — fenêtres et portes isolantes)',
      'Certification NF Fenêtres bois ou NF Fenêtres PVC (FCBA/CSTB)',
      'Compagnons du Devoir (formation d\'excellence)',
      'Label Menuiserie 21 (engagement qualité UFME)',
      'Certification PEFC/FSC (traçabilité et gestion durable des bois)',
      'Qualibat 4321 (fabrication de menuiseries et fermetures en bois)',
      'Label Artisan d\'Art (distinction pour les menuisiers ébénistes d\'exception)',
    ],
    averageResponseTime: 'Devis sous 48h, intervention sous 2 à 4 semaines',
  },

  carreleur: {
    slug: 'carreleur',
    name: 'Carreleur',
    priceRange: {
      min: 35,
      max: 65,
      unit: '€/m²',
    },
    commonTasks: [
      'Pose de carrelage au sol (format standard) : 35 à 55 €/m² (pose uniquement)',
      'Pose de carrelage grand format (60x60 et plus) : 50 à 75 €/m²',
      'Pose de faïence murale (salle de bain) : 40 à 65 €/m²',
      'Pose de mosaïque : 60 à 100 €/m²',
      'Carrelage d\'une terrasse extérieure : 45 à 80 €/m²',
      'Dépose d\'ancien carrelage + repose : 15 à 30 €/m² supplémentaires',
      'Ragréage et préparation du sol avant pose : 15 à 25 €/m²',
      'Pose de carrelage sur plancher chauffant : 50 à 80 €/m² (colle flexible spéciale)',
    ],
    tips: [
      'Le prix de la pose dépend fortement du format des carreaux : les grands formats (60x60, 80x80) et les poses en diagonale ou en décalé coûtent 20 à 40 % plus cher que la pose droite en format standard.',
      'Vérifiez que le carreleur inclut la préparation du support dans son devis : ragréage, mise à niveau et étanchéité (obligatoire en salle de bain sous la norme DTU 52.1). Un support mal préparé est la première cause de décollement.',
      'Prévoyez 10 à 15 % de carrelage supplémentaire pour les coupes et la casse. Pour les grands formats et les poses complexes, cette marge peut monter à 20 %.',
      'Demandez au carreleur son avis sur le type de carrelage adapté à votre usage : classement UPEC pour l\'intérieur (U pour usure, P pour poinçonnement, E pour eau, C pour chimique), et classement R pour l\'antidérapant en extérieur.',
      'Pour une salle de bain, exigez une étanchéité sous carrelage (système SPEC conforme au DTU 52.1). C\'est un travail supplémentaire mais indispensable pour éviter les infiltrations.',
      'Un calepinage (plan de pose détaillé) réalisé en amont par le carreleur évite les coupes disgracieuses et optimise la répartition des carreaux. Demandez-le systématiquement, surtout pour les grands formats et les motifs complexes.',
      'Vérifiez la planéité du sol avant la pose : un écart supérieur à 5 mm sous la règle de 2 m nécessite un ragréage. Poser du carrelage sur un sol irrégulier entraîne des surépaisseurs de colle, des risques de fissures et un résultat inesthétique.',
      'En pièce humide (salle de bain, douche italienne), un joint hydrofuge à base d\'époxy est indispensable. Plus cher qu\'un joint ciment classique (10 à 15 €/m² supplémentaires), il empêche toute infiltration d\'eau et ne noircit pas avec le temps.',
    ],
    faq: [
      {
        q: 'Combien de temps faut-il pour carreler une salle de bain ?',
        a: 'Pour une salle de bain standard de 5 à 8 m² (sol + murs), comptez 3 à 5 jours de travail incluant la préparation, la pose de l\'étanchéité, le carrelage et les joints. Ajoutez 1 à 2 jours si l\'ancien carrelage doit être déposé. Le séchage des joints nécessite 24h supplémentaires avant utilisation.',
      },
      {
        q: 'Puis-je poser du carrelage sur un ancien carrelage ?',
        a: 'Oui, c\'est possible si l\'ancien carrelage est bien adhérent, plan et en bon état. Le carreleur utilisera un primaire d\'accrochage spécifique. Attention cependant : cette technique ajoute environ 1 cm d\'épaisseur au sol, ce qui peut poser des problèmes de seuil de porte et de hauteur sous plafond dans certaines pièces.',
      },
      {
        q: 'Quel carrelage choisir pour un sol de cuisine ?',
        a: 'Pour une cuisine, privilégiez un carrelage grès cérame classement UPEC U3 P3 E2 C1 minimum : résistant à l\'usure, aux chocs, à l\'eau et aux produits ménagers. Les formats 30x60 ou 60x60 en finition mate ou satinée sont les plus pratiques. Évitez les finitions très brillantes (glissantes) et les couleurs trop claires (salissantes).',
      },
      {
        q: 'Quel est le coût de la pose de carrelage au m² ?',
        a: 'La pose de carrelage au sol coûte entre 35 et 55 €/m² en format standard (30x30 à 45x45), 50 à 75 €/m² pour du grand format (60x60 et plus) et 60 à 100 €/m² pour de la mosaïque. La pose murale (faïence) revient à 40 à 65 €/m². Ces prix s\'entendent hors fourniture du carrelage. Ajoutez 15 à 30 €/m² si l\'ancien revêtement doit être déposé.',
      },
      {
        q: 'Faut-il une étanchéité sous le carrelage de salle de bain ?',
        a: 'Oui, l\'étanchéité sous carrelage (système SPEC) est indispensable dans les zones de projection d\'eau (douche, contour de baignoire) conformément au DTU 52.1. Le carreleur applique une membrane ou un produit liquide d\'étanchéité avant la pose du carrelage. Ce poste supplémentaire coûte 20 à 40 €/m² mais évite les infiltrations d\'eau et les dégâts des eaux chez le voisin du dessous.',
      },
      {
        q: 'Comment choisir entre carrelage et grès cérame ?',
        a: 'Le grès cérame est en réalité un type de carrelage, fabriqué par pressage à haute température. Il est plus dense, plus résistant et moins poreux que la faïence ou le carrelage classique en terre cuite. Le grès cérame pleine masse est le plus solide (teinté dans la masse, les éclats sont invisibles). Pour un usage courant en intérieur, le grès cérame émaillé offre le meilleur rapport qualité-prix.',
      },
      {
        q: 'Quel carrelage choisir pour une terrasse extérieure ?',
        a: 'Pour une terrasse, choisissez un carrelage antidérapant classé R11 minimum (R12 en bord de piscine), résistant au gel (norme ISO 10545-12) et de faible porosité. Le grès cérame pleine masse ou le carrelage en pierre naturelle sont les mieux adaptés. Prévoyez une pente de 1 à 2 % pour l\'évacuation de l\'eau. Le budget est de 45 à 80 €/m² pour la pose.',
      },
      {
        q: 'Combien de temps faut-il attendre avant de marcher sur un carrelage neuf ?',
        a: 'Il faut attendre 24 heures minimum après la pose avant de marcher sur le carrelage, le temps que la colle sèche. Les joints doivent être réalisés 24 à 48 heures après la pose et nécessitent à leur tour 24 heures de séchage. Au total, comptez 3 à 4 jours avant de pouvoir utiliser normalement la pièce. Évitez de poser des meubles lourds pendant au moins une semaine.',
      },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour le carrelage. Prenez rendez-vous pour un devis gratuit sous 48h et une intervention planifiée sous 1 à 3 semaines.',
    certifications: [
      'Qualibat (qualification 6321/6322 carrelage et revêtements céramiques)',
      'Certification CSTB (classement UPEC des locaux — Centre Scientifique et Technique du Bâtiment)',
      'Compagnons du Devoir (formation d\'excellence)',
      'Label Artisan de confiance (Chambre de Métiers et de l\'Artisanat)',
      'Conformité NF DTU 52.1 (pose de revêtements de sol scellés — sols)',
      'Conformité NF DTU 52.2 (pose de revêtements muraux scellés — murs)',
      'Qualibat 6331 (pose de carrelages et revêtements céramiques collés)',
      'Certification NF UPEC (classement des locaux par le CSTB)',
    ],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 3 semaines',
  },

  couvreur: {
    slug: 'couvreur',
    name: 'Couvreur',
    priceRange: {
      min: 50,
      max: 90,
      unit: '€/m²',
    },
    commonTasks: [
      'Réparation de fuite de toiture : 200 à 800 €',
      'Remplacement de tuiles cassées : 40 à 80 €/m²',
      'Réfection complète de toiture (100 m²) : 8 000 à 18 000 €',
      'Pose de gouttière en zinc : 40 à 80 €/ml',
      'Nettoyage et démoussage de toiture : 15 à 30 €/m²',
      'Installation de fenêtre de toit (Velux) : 500 à 1 500 € (hors fourniture)',
      'Réparation de faîtage (scellement ou remplacement) : 40 à 80 €/ml',
      'Étanchéité toiture terrasse (membrane EPDM ou bitume) : 50 à 120 €/m²',
    ],
    tips: [
      'Faites inspecter votre toiture tous les 5 ans et après chaque épisode de grêlons ou de tempête. Une petite réparation à temps évite un remplacement complet bien plus coûteux.',
      'Vérifiez que le couvreur dispose d\'une garantie décennale à jour et d\'une assurance responsabilité civile. Les travaux de toiture engagent la solidité de l\'ouvrage et sont couverts 10 ans.',
      'Profitez d\'une réfection de toiture pour améliorer l\'isolation : l\'isolation par l\'extérieur (sarking) ou par l\'intérieur permet de réduire les déperditions thermiques de 25 à 30 %. Un couvreur RGE ouvre droit aux aides de l\'État.',
      'Ne montez jamais seul sur un toit pour évaluer les dégâts. La chute de hauteur est la première cause d\'accident mortel dans le bâtiment. Laissez l\'inspection à un professionnel équipé.',
      'Demandez des photos avant/après et un rapport d\'intervention écrit. Certains couvreurs utilisent des drones pour inspecter la toiture sans échafaudage, ce qui réduit les coûts.',
      'Remplacez rapidement toute tuile cassée ou déplacée : une seule tuile manquante suffit à provoquer des infiltrations qui endommagent la charpente et l\'isolation en quelques semaines.',
      'Lors d\'une réfection de toiture, faites vérifier l\'état de la charpente en même temps que la couverture : un diagnostic complet évite de devoir rouvrir le toit quelques années plus tard.',
      'Ne montez jamais sur un toit mouillé, verglacé ou par grand vent : les accidents de toiture représentent plus de 10 % des accidents mortels du BTP en France chaque année.',
    ],
    faq: [
      {
        q: 'Combien coûte une réfection complète de toiture ?',
        a: 'Pour une maison de 100 m² de toiture, comptez entre 8 000 et 18 000 € selon le matériau (tuiles terre cuite : 50-80 €/m², ardoise : 80-120 €/m², zinc : 60-100 €/m²) et la complexité (pente, cheminée, lucarnes). Ce prix inclut la dépose, la fourniture et la pose. L\'échafaudage représente 10 à 15 % du budget.',
      },
      {
        q: 'Faut-il un permis de construire pour refaire sa toiture ?',
        a: 'Une déclaration préalable de travaux suffit si vous conservez le même matériau et la même couleur. En revanche, un permis de construire est nécessaire si vous modifiez la pente, la hauteur ou le type de couverture. En zone protégée (ABF), l\'accord de l\'Architecte des Bâtiments de France est requis.',
      },
      {
        q: 'À quelle fréquence faut-il démousser sa toiture ?',
        a: 'Un démoussage est recommandé tous les 3 à 5 ans, selon l\'exposition et l\'environnement (plus fréquent près d\'arbres ou en zone humide). Le démoussage coûte entre 15 et 30 €/m² et prolonge la durée de vie de votre couverture. Évitez le nettoyeur haute pression, qui endommage les tuiles.',
      },
      {
        q: 'Ma toiture fuit après une tempête, que faire en urgence ?',
        a: 'Placez des récipients sous les fuites et contactez un couvreur d\'urgence. Prenez des photos des dégâts pour votre assurance et déclarez le sinistre sous 5 jours ouvrés (30 jours après publication de l\'arrêté de catastrophe naturelle au Journal Officiel, art. L113-2 Code des assurances). En attendant le couvreur, vous pouvez bâcher temporairement la zone depuis l\'intérieur des combles, sans monter sur le toit.',
      },
      {
        q: 'Quelle est la durée de vie d\'une toiture selon le matériau ?',
        a: 'Les tuiles en terre cuite durent 50 à 100 ans, l\'ardoise naturelle 75 à 150 ans, le zinc 50 à 80 ans et les tuiles béton 30 à 50 ans. Le shingle (bitume) a la durée de vie la plus courte : 20 à 30 ans. Ces durées supposent un entretien régulier (démoussage, remplacement des éléments cassés, vérification des solins et faîtages).',
      },
      {
        q: 'Combien coûte l\'installation d\'une fenêtre de toit (Velux) ?',
        a: 'L\'installation d\'une fenêtre de toit standard (78x98 cm) coûte entre 500 et 1 500 € pour la pose seule, auxquels s\'ajoute le prix de la fenêtre (300 à 1 200 € selon le modèle). Une fenêtre motorisée avec stores intégrés peut atteindre 2 500 €. Le couvreur doit assurer une parfaite étanchéité avec un kit de raccordement adapté à la couverture.',
      },
      {
        q: 'L\'isolation de toiture est-elle éligible aux aides de l\'État ?',
        a: 'Oui, l\'isolation de la toiture par l\'intérieur ou l\'extérieur (sarking) est éligible à MaPrimeRenov\' (jusqu\'à 25 €/m² pour les ménages modestes), aux CEE et à l\'éco-prêt à taux zéro. Le couvreur doit être certifié RGE. L\'isolation de toiture est l\'un des travaux les plus rentables : elle réduit les déperditions thermiques de 25 à 30 % et se rentabilise en 4 à 6 ans.',
      },
      {
        q: 'Comment savoir si ma charpente a besoin d\'un traitement ?',
        a: 'Inspectez les bois de charpente à la recherche de sciure au sol (signe de vrillettes ou capricornes), de trous de sortie d\'insectes, de champignons (mérule) ou de bois qui s\'effrite au contact. Un diagnostic par un professionnel est recommandé tous les 10 ans. Le traitement préventif ou curatif coûte entre 20 et 50 €/m² et protège la charpente pour 10 à 20 ans.',
      },
    ],
    emergencyInfo:
      'Intervention d\'urgence pour dégâts de tempête, tuiles arrachées ou fuite de toiture. Un couvreur d\'urgence peut effectuer un bâchage provisoire pour protéger votre habitation, selon disponibilité. Majorations : +80 à 120 % la nuit et le week-end.',
    certifications: [
      'Qualibat (qualification 3111/3112 couverture en tuiles)',
      'RGE (obligatoire pour l\'isolation de toiture — aides MaPrimeRénov\')',
      'Compagnons du Devoir (formation d\'excellence)',
      'QualiPV (si pose de panneaux solaires en toiture)',
      'Certification CSTB (Centre Scientifique et Technique du Bâtiment — avis techniques)',
      'Qualification Handibat (accessibilité et adaptation du logement)',
      'Qualibat 3191 (étanchéité de toitures-terrasses)',
      'Compagnons du Tour de France (formation traditionnelle d\'excellence)',
    ],
    averageResponseTime: 'Urgence (bâchage, fuite) : délai variable selon disponibilité ; travaux de réfection sous 1 à 4 semaines',
  },

  macon: {
    slug: 'macon',
    name: 'Maçon',
    priceRange: {
      min: 45,
      max: 70,
      unit: '€/h',
    },
    commonTasks: [
      'Construction d\'un mur en parpaings : 50 à 80 €/m²',
      'Coulée d\'une dalle béton (garage, terrasse) : 60 à 120 €/m²',
      'Ouverture d\'un mur porteur (avec IPN) : 2 500 à 6 000 €',
      'Construction d\'une extension : 1 200 à 2 000 €/m²',
      'Réparation de fissures structurelles : 50 à 200 €/ml',
      'Montage d\'un mur de clôture : 100 à 250 €/ml',
      'Ravalement de façade (enduit ou crépi) : 30 à 80 €/m²',
      'Réalisation de fondations (semelle filante) : 150 à 300 €/ml',
    ],
    tips: [
      'Pour toute ouverture dans un mur porteur, exigez une étude structurelle réalisée par un bureau d\'études agréé. Le maçon doit suivre les préconisations de l\'ingénieur et poser une poutre (IPN) dimensionnée pour reprendre les charges.',
      'Vérifiez les références du maçon sur des chantiers similaires au vôtre. Un maçon spécialisé en neuf n\'a pas forcément l\'expérience de la rénovation, et inversement.',
      'Les travaux de maçonnerie sont soumis à la garantie décennale obligatoire. Demandez une copie de l\'attestation d\'assurance avant le début du chantier et vérifiez qu\'elle couvre le type de travaux prévus.',
      'Pour une extension ou une construction, une déclaration préalable ou un permis de construire est obligatoire selon la surface. En dessous de 20 m², une déclaration suffit ; au-delà, le permis est requis (seuil porté à 40 m² en zone PLU).',
      'Privilégiez les périodes de printemps et d\'automne pour les travaux de maçonnerie : le béton et le mortier nécessitent des températures comprises entre 5 et 30°C pour une prise optimale.',
      'Faites toujours réaliser une étude de sol (mission G2) avant de couler des fondations. Cette étude détermine la nature du terrain et le type de fondations adapté, évitant les tassements différentiels et les fissures futures. Comptez 1 500 à 3 000 € pour une étude G2.',
      'Le béton nécessite un temps de séchage (cure) de 28 jours avant de pouvoir supporter sa charge maximale. Ne demandez pas au maçon de construire sur une dalle ou des fondations qui n\'ont pas atteint ce délai, sous peine de compromettre la solidité de l\'ouvrage.',
      'Avant tout projet d\'agrandissement, consultez le PLU (Plan Local d\'Urbanisme) de votre commune et vérifiez les servitudes d\'urbanisme : coefficient d\'emprise au sol, hauteur maximale, recul par rapport aux limites de propriété et aspect extérieur imposé.',
    ],
    faq: [
      {
        q: 'Combien coûte la construction d\'une extension de maison ?',
        a: 'Le prix d\'une extension en maçonnerie traditionnelle varie de 1 200 à 2 000 €/m² selon les finitions, la complexité de la structure et la région. Une extension de 20 m² coûte ainsi entre 24 000 et 40 000 €. Ce prix comprend les fondations, les murs, la toiture et le clos couvert, mais pas les finitions intérieures.',
      },
      {
        q: 'Peut-on abattre un mur porteur soi-même ?',
        a: 'Absolument pas. L\'ouverture d\'un mur porteur sans étude structurelle préalable et sans professionnel qualifié peut provoquer l\'effondrement partiel ou total du bâtiment. De plus, en copropriété, l\'accord du syndicat est obligatoire. Le coût d\'une ouverture dans un mur porteur (étude + travaux) est de 2 500 à 6 000 €.',
      },
      {
        q: 'Quelles sont les fondations nécessaires pour un mur de clôture ?',
        a: 'Un mur de clôture en parpaings nécessite une semelle de fondation en béton armé d\'au moins 30 cm de profondeur et 40 cm de largeur, hors gel (50 à 80 cm selon la région). Le maçon doit respecter les règles d\'urbanisme locales (hauteur maximale, retrait par rapport à la limite de propriété).',
      },
      {
        q: 'Combien coûte la construction d\'un garage en parpaings ?',
        a: 'La construction d\'un garage simple (environ 20 m²) en parpaings coûte entre 15 000 et 25 000 €, comprenant les fondations, les murs, la dalle, la toiture et la porte de garage. Un garage double (40 m²) revient à 25 000 à 45 000 €. Un permis de construire est nécessaire pour une surface supérieure à 20 m², une déclaration préalable en dessous.',
      },
      {
        q: 'Les fissures sur ma maison sont-elles dangereuses ?',
        a: 'Les microfissures (moins de 0,2 mm) sont généralement superficielles et sans danger. Les fissures de 0,2 à 2 mm doivent être surveillées et réparées pour éviter les infiltrations d\'eau. Les fissures supérieures à 2 mm ou en escalier le long des joints de parpaings peuvent indiquer un problème structurel et nécessitent l\'intervention urgente d\'un maçon et éventuellement d\'un bureau d\'études.',
      },
      {
        q: 'Quelle est la meilleure période pour réaliser des travaux de maçonnerie ?',
        a: 'Le printemps (avril-juin) et l\'automne (septembre-octobre) sont les périodes idéales. Le béton et le mortier nécessitent des températures entre 5 et 30 °C pour une prise optimale. En hiver, le gel peut compromettre la solidité du béton, et en plein été, la chaleur excessive accélère le séchage et provoque des fissures. Si les travaux doivent se faire en hiver, le maçon utilisera des adjuvants antigel.',
      },
      {
        q: 'Faut-il un permis de construire pour une extension de maison ?',
        a: 'En zone couverte par un PLU (Plan Local d\'Urbanisme), une déclaration préalable suffit pour une extension de moins de 40 m². Au-delà, un permis de construire est obligatoire. Hors PLU, le seuil est de 20 m². De plus, si la surface totale de la maison après extension dépasse 150 m², le recours à un architecte est obligatoire.',
      },
      {
        q: 'Combien coûte une dalle béton pour une terrasse ?',
        a: 'Une dalle béton de 15 cm d\'épaisseur pour terrasse coûte entre 60 et 120 €/m², comprenant le terrassement, le ferraillage, le coffrage et le coulage du béton. Pour une terrasse de 30 m², le budget total est de 1 800 à 3 600 €. Le béton décoratif (désactivé, ciré ou imprimé) est plus cher : 80 à 180 €/m², mais ne nécessite pas de revêtement supplémentaire.',
      },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la maçonnerie. Pour les travaux de gros oeuvre, extension ou rénovation, prenez rendez-vous pour un devis gratuit sous 1 semaine.',
    certifications: [
      'Qualibat (qualification 2111/2112 maçonnerie et béton armé)',
      'RGE (obligatoire si ITE — isolation thermique par l\'extérieur)',
      'Compagnons du Devoir (formation d\'excellence)',
      'NF Habitat (label qualité construction neuve et rénovation)',
      'NF DTU 20.1 (norme de référence pour les ouvrages en maçonnerie de petits éléments)',
      'Compagnons du Tour de France (formation traditionnelle et savoir-faire artisanal)',
      'Certification Éco Artisan (engagement en performance énergétique et environnementale)',
      'Certification Handibat (adaptation du logement aux personnes à mobilité réduite)',
    ],
    averageResponseTime: 'Devis sous 1 semaine, intervention sous 2 à 6 semaines',
  },

  jardinier: {
    slug: 'jardinier',
    name: 'Jardinier',
    priceRange: {
      min: 30,
      max: 50,
      unit: '€/h',
    },
    commonTasks: [
      'Tonte de pelouse (jardin de 200 m²) : 30 à 60 €',
      'Taille de haie : 15 à 25 €/ml',
      'Élagage d\'arbre (hauteur moyenne) : 200 à 600 € par arbre',
      'Création de jardin (plantations + engazonnement) : 20 à 50 €/m²',
      'Entretien mensuel d\'un jardin (200 m²) : 100 à 200 €/mois',
      'Abattage d\'arbre avec dessouchage : 400 à 1 500 € selon la taille',
      'Installation d\'arrosage automatique : 1 500 à 4 000 € (enterré, programmateur inclus)',
      'Engazonnement (semis ou placage de gazon) : 5 à 15 €/m²',
    ],
    tips: [
      'Les prestations de jardinage à domicile ouvrent droit à un crédit d\'impôt de 50 % dans la limite de 5 000 € de dépenses par an (soit 2 500 € de crédit d\'impôt). Le jardinier doit être déclaré en tant que service à la personne (SAP).',
      'Privilégiez un contrat annuel d\'entretien plutôt que des interventions ponctuelles : le tarif horaire est généralement 20 à 30 % inférieur et le jardinier connaît mieux votre terrain au fil des saisons.',
      'Pour l\'élagage d\'arbres de plus de 7 mètres, faites appel à un élagueur-grimpeur certifié CS (Certificat de Spécialisation) taille et soins des arbres. L\'élagage non professionnel peut tuer l\'arbre et engager votre responsabilité.',
      'Vérifiez que le jardinier évacue les déchets verts ou prévoyez ce poste dans le devis. L\'évacuation et le traitement en déchetterie représentent un coût supplémentaire de 50 à 150 € par intervention.',
      'Pour la création d\'un jardin, demandez un plan d\'aménagement tenant compte de l\'exposition, du sol et du climat de votre région. Un jardinier-paysagiste saura choisir des plantes adaptées qui nécessiteront moins d\'entretien.',
      'Taillez vos haies avant mi-mars et après mi-août pour respecter la période de nidification des oiseaux. La taille est interdite du 15 mars au 31 juillet en zone agricole (arrêté du 24 avril 2015).',
      'Un arrosage automatique programmé permet d\'économiser environ 30 % d\'eau par rapport à un arrosage manuel, tout en assurant un apport régulier adapté aux besoins réels des plantes.',
      'L\'élagage courant (branches basses, haies) est à la charge du locataire au titre de l\'entretien courant. En revanche, l\'élagage lourd d\'arbres de grande hauteur ou l\'abattage restent à la charge du propriétaire.',
    ],
    faq: [
      {
        q: 'Puis-je bénéficier d\'un crédit d\'impôt pour les travaux de jardinage ?',
        a: 'Oui, les petits travaux de jardinage (tonte, taille de haies, désherbage, débroussaillage) bénéficient d\'un crédit d\'impôt de 50 % dans la limite de 5 000 € par an. Le jardinier doit être agréé services à la personne (SAP) ou vous devez passer par un organisme agréé (CESU). Les travaux de création paysagère ne sont pas éligibles.',
      },
      {
        q: 'A-t-on le droit de couper les branches du voisin qui dépassent ?',
        a: 'Non, vous ne pouvez pas couper vous-même les branches de votre voisin qui dépassent sur votre terrain. L\'article 673 du Code civil vous autorise à demander à votre voisin de les couper, et en cas de refus, à saisir le tribunal. Depuis 2023, si votre voisin ne réagit pas sous 2 mois après mise en demeure, vous pouvez faire couper à ses frais.',
      },
      {
        q: 'Quelle est la meilleure période pour tailler les haies ?',
        a: 'La taille principale se fait en fin d\'hiver (février-mars), avant la reprise de végétation. Une seconde taille d\'entretien est recommandée en fin d\'été (septembre). Attention : la taille est interdite du 15 mars au 31 juillet dans les zones agricoles pour protéger la nidification des oiseaux (arrêté du 24 avril 2015).',
      },
      {
        q: 'Quel budget pour l\'entretien annuel d\'un jardin de 500 m² ?',
        a: 'Comptez entre 1 500 et 3 500 € par an pour un entretien complet comprenant la tonte bimensuelle (avril à octobre), 2 tailles de haie, le désherbage des massifs et le ramassage des feuilles à l\'automne. Ce budget peut être réduit de 50 % grâce au crédit d\'impôt si le jardinier est agréé SAP.',
      },
      {
        q: 'Combien coûte l\'élagage d\'un grand arbre ?',
        a: 'L\'élagage d\'un arbre de taille moyenne (8 à 15 m) coûte entre 200 et 600 €, et entre 500 et 1 500 € pour un grand arbre (plus de 15 m). Le prix dépend de la hauteur, de l\'accessibilité et du volume de branches à couper. L\'abattage avec dessouchage est plus cher : 400 à 2 500 € selon la taille. Faites appel à un élagueur-grimpeur certifié CS pour les arbres de grande hauteur.',
      },
      {
        q: 'Quand et comment scarifier sa pelouse ?',
        a: 'La scarification se fait idéalement au printemps (mars-avril) et éventuellement à l\'automne (septembre). Elle consiste à griffer le sol pour retirer la mousse et le feutrage qui étouffent le gazon. Après scarification, semez du gazon de regarnissage et apportez un engrais adapté. Un jardinier professionnel facture la scarification entre 0,15 et 0,30 €/m².',
      },
      {
        q: 'Faut-il une autorisation pour abattre un arbre dans son jardin ?',
        a: 'En règle générale, vous pouvez abattre un arbre sur votre propriété sans autorisation. Cependant, une autorisation est nécessaire si l\'arbre est classé (Espace Boisé Classé au PLU), s\'il est situé en zone protégée (périmètre ABF) ou si un arrêté municipal interdit l\'abattage. Renseignez-vous auprès de votre mairie avant toute intervention. En copropriété, l\'accord du syndic est requis.',
      },
      {
        q: 'Comment créer un système d\'arrosage automatique ?',
        a: 'L\'installation d\'un arrosage automatique enterré coûte entre 8 et 15 €/m² pour un jardin de 200 à 500 m², incluant les tuyaux, les asperseurs, le programmateur et la main-d\'oeuvre. Un système goutte-à-goutte pour les massifs et haies est moins cher (3 à 8 €/m²). Le jardinier-paysagiste dimensionne l\'installation en fonction de la pression d\'eau, du débit disponible et des besoins des plantations.',
      },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour le jardinage courant. Pour l\'élagage d\'urgence d\'un arbre dangereux après une tempête, contactez les pompiers (18) ou un élagueur grimpeur spécialisé. Entretien sur rendez-vous sous 1 à 2 semaines.',
    certifications: [
      'Certiphyto (obligatoire pour l\'utilisation de produits phytosanitaires)',
      'Agrément Services à la Personne (SAP — crédit d\'impôt 50 %)',
      'CS Taille et soins des arbres (certificat de spécialisation élagage)',
      'Qualipaysage (certification professionnelle du secteur paysager)',
      'CAPA Travaux Paysagers (diplôme de référence)',
      'Assurance responsabilité civile professionnelle (obligatoire, couvre les dommages aux biens et aux personnes)',
      'BP Aménagements Paysagers (brevet professionnel, niveau bac)',
      'Certification Écocert ou Agriculture Biologique (pour les prestations d\'entretien sans produits chimiques)',
    ],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 2 semaines selon la saison',
  },

  vitrier: {
    slug: 'vitrier',
    name: 'Vitrier',
    priceRange: {
      min: 50,
      max: 100,
      unit: '€/intervention',
    },
    commonTasks: [
      'Remplacement d\'un simple vitrage : 60 à 150 €/m² (fourniture + pose)',
      'Pose de double vitrage : 150 à 350 €/m²',
      'Remplacement d\'une vitre cassée (standard) : 80 à 200 €',
      'Survitrage d\'une fenêtre existante : 80 à 150 €/m²',
      'Pose d\'une crédence en verre (cuisine) : 200 à 500 €/m²',
      'Installation d\'une paroi de douche en verre : 400 à 1 200 €',
      'Pose d\'un vitrage feuilleté de sécurité (anti-effraction) : 200 à 450 €/m²',
      'Installation d\'un garde-corps en verre (balcon, terrasse) : 250 à 600 €/ml',
    ],
    tips: [
      'En cas de vitre cassée, sécurisez la zone avec du carton ou du ruban adhésif en attendant le vitrier. Ne tentez pas de retirer les morceaux de verre à mains nues.',
      'Privilégiez le double vitrage 4/16/4 pour un bon rapport qualité-prix en isolation thermique. Le triple vitrage n\'est justifié que dans les régions très froides.',
      'Demandez au vitrier de vous fournir le coefficient d\'isolation (Ug) du vitrage proposé. Plus ce chiffre est bas, meilleure est l\'isolation : Ug < 1,1 W/m².K pour du bon double vitrage.',
      'Pour une crédence ou une paroi de douche, exigez du verre sécurit (trempé) conforme à la norme EN 12150 : en cas de casse, il se fragmente en petits morceaux non coupants.',
      'Un vitrier d\'urgence peut intervenir pour sécuriser une vitrine commerciale ou une baie vitrée cassée. Vérifiez que le professionnel propose un service de mise en sécurité provisoire.',
      'Vérifiez votre contrat multirisque habitation : la garantie bris de glace couvre souvent le remplacement des vitres cassées. Conservez les morceaux et prenez des photos avant nettoyage pour faciliter la déclaration.',
      'Choisissez un vitrage adapté à l\'orientation de vos fenêtres : vitrage à isolation phonique renforcée côté rue, vitrage à contrôle solaire côté sud et ouest pour limiter la surchauffe en été.',
      'Après une intervention, vérifiez la qualité de la pose : le mastic ou le joint silicone doit être continu et sans bulle, et le vitrage ne doit présenter aucun jeu dans le châssis.',
    ],
    faq: [
      {
        q: 'Combien coûte le remplacement d\'une vitre cassée ?',
        a: 'Le remplacement d\'une vitre simple coûte entre 80 et 200 € pour une fenêtre standard (environ 1 m²). Pour du double vitrage, comptez 150 à 350 €/m² fourniture et pose comprises. Les tarifs augmentent pour les grandes dimensions, les formes spéciales et les interventions en urgence (+50 à 100 %).',
      },
      {
        q: 'Mon assurance couvre-t-elle le remplacement d\'une vitre ?',
        a: 'Oui, si la casse est due à un événement couvert par votre contrat (tempête, vandalisme, cambriolage). La garantie bris de glace, souvent en option, couvre les vitres, miroirs et plaques vitrocéramiques. Déclarez le sinistre sous 5 jours ouvrés et conservez les morceaux de verre si possible.',
      },
      {
        q: 'Double ou triple vitrage : lequel choisir ?',
        a: 'Le double vitrage 4/16/4 avec gaz argon (Ug \u2248 1,1 W/m².K) suffit dans la majorité des cas en France métropolitaine. Le triple vitrage (Ug \u2248 0,6 W/m².K) est recommandé uniquement pour les façades nord en climat continental ou montagnard. Il est plus lourd et plus cher (+40 à 60 %) pour un gain d\'isolation modeste en climat tempéré.',
      },
      {
        q: 'Peut-on remplacer un simple vitrage par du double vitrage sans changer la fenêtre ?',
        a: 'Oui, grâce au survitrage ou au remplacement du vitrage seul (si le châssis est en bon état et assez profond pour accueillir un double vitrage). Le survitrage consiste à fixer un second vitrage sur la fenêtre existante (80 à 150 €/m²). Le remplacement du vitrage dans le châssis existant coûte 150 à 300 €/m². Ces solutions sont moins performantes qu\'un remplacement complet mais beaucoup moins chères.',
      },
      {
        q: 'Combien de temps faut-il pour remplacer une vitre cassée ?',
        a: 'Le remplacement d\'une vitre standard prend 30 minutes à 1 heure sur place. Cependant, si le vitrage est sur mesure (grande dimension, forme spéciale, double vitrage à commander), le vitrier posera d\'abord un panneau provisoire et reviendra sous 24 à 72 heures avec le vitrage définitif. Pour les urgences, la mise en sécurité provisoire est réalisée en moins d\'une heure.',
      },
      {
        q: 'Qu\'est-ce que le verre sécurit (trempé) et quand est-il obligatoire ?',
        a: 'Le verre trempé est chauffé à 700 °C puis refroidi brusquement, ce qui le rend 5 fois plus résistant qu\'un verre ordinaire. En cas de casse, il se fragmente en petits morceaux non coupants. Il est obligatoire pour les portes vitrées, les parois de douche, les garde-corps en verre et les baies vitrées dont le bord inférieur est à moins de 90 cm du sol (norme NF DTU 39).',
      },
      {
        q: 'Comment améliorer l\'isolation de mes vitrages sans tout changer ?',
        a: 'Plusieurs solutions existent : le film isolant thermique à coller sur le vitrage (10 à 30 €/m², gain de 30 % sur les déperditions), le survitrage (80 à 150 €/m²), ou le remplacement des joints d\'étanchéité des fenêtres (5 à 15 €/ml). Un vitrier peut aussi remplacer le vitrage seul sans changer le châssis, si celui-ci est en bon état.',
      },
      {
        q: 'Quel type de verre choisir pour une crédence de cuisine ?',
        a: 'La crédence en verre doit être en verre trempé sécurit (obligatoire derrière une plaque de cuisson) de 6 mm d\'épaisseur minimum. Elle peut être laquée dans la couleur de votre choix, imprimée avec un motif ou en verre dépoli. Comptez 200 à 500 €/m² pose comprise. L\'avantage principal est l\'absence de joints : le nettoyage est simple et l\'hygiène optimale.',
      },
    ],
    emergencyInfo:
      'En cas de vitre cassée (effraction, tempête, accident), un vitrier d\'urgence peut intervenir pour sécuriser l\'ouverture avec un panneau provisoire, selon disponibilité. Le remplacement définitif se fait généralement sous 24 à 48h. Majorations : +50 à 100 % la nuit et le week-end.',
    certifications: [
      'Qualibat (qualification 4311/4312 vitrerie-miroiterie)',
      'Certification Cekal (qualité des vitrages isolants, feuilletés et trempés)',
      'RGE (pour remplacement de vitrages isolants ouvrant droit aux aides)',
      'Assurance décennale couvrant les travaux de vitrerie et miroiterie',
      'Certification NF DTU 39 (pose de vitrages en bâtiment)',
      'Qualification Qualifelec (si travaux combinés vitrerie-menuiserie aluminium)',
      'Membre de la Fédération Française des Professionnels du Verre (FFPV)',
      'Certification EN 12150 (mise en œuvre de verre trempé sécurit)',
    ],
    averageResponseTime: 'Urgence (bris de vitre) : délai variable selon disponibilité ; remplacement définitif sous 24 à 48h',
  },

  climaticien: {
    slug: 'climaticien',
    name: 'Climaticien',
    priceRange: {
      min: 60,
      max: 100,
      unit: '€/h',
    },
    commonTasks: [
      'Installation d\'un split mural (2,5 kW) : 1 500 à 3 000 €',
      'Pose d\'une climatisation gainable : 5 000 à 12 000 €',
      'Installation d\'une climatisation multi-split (3 unités) : 4 000 à 8 000 €',
      'Entretien annuel d\'une climatisation : 100 à 200 €',
      'Recharge de gaz réfrigérant : 200 à 500 €',
      'Installation d\'une pompe à chaleur air-air : 3 000 à 7 000 €',
      'Remplacement d\'un compresseur de climatisation : 800 à 1 500 €',
      'Désembouage et nettoyage du circuit frigorifique : 300 à 600 €',
    ],
    tips: [
      'Privilégiez un climaticien certifié RGE et détenteur de l\'attestation de capacité à manipuler les fluides frigorigènes, obligatoire depuis 2015 pour toute intervention sur un circuit frigorifique.',
      'Une pompe à chaleur air-air (climatisation réversible) est plus économique qu\'une climatisation classique : elle consomme 1 kWh d\'électricité pour produire 3 à 4 kWh de chaleur ou de froid (COP de 3 à 4).',
      'Le dimensionnement est crucial : une climatisation trop puissante consomme plus et dégrade le confort (cycles courts). Exigez un bilan thermique avant toute installation.',
      'L\'entretien annuel est obligatoire pour les systèmes contenant plus de 2 kg de fluide frigorigène (la plupart des splits). Le carnet d\'entretien doit être tenu à jour.',
      'Attention au bruit : vérifiez le niveau sonore de l\'unité extérieure (en dB(A)) et respectez les distances réglementaires avec le voisinage. L\'installation d\'une unité extérieure en copropriété nécessite souvent l\'accord de l\'assemblée générale.',
      'Nettoyez les filtres de votre climatisation tous les 2 mois en période d\'utilisation pour maintenir un rendement optimal et une bonne qualité d\'air intérieur.',
      'Faites vérifier le niveau de fluide frigorigène chaque année par un technicien certifié : une fuite de 10 % réduit les performances de 20 % et augmente la consommation électrique.',
      'Une clim réversible bien dimensionnée remplace un chauffage d\'appoint dans les régions tempérées et permet de réaliser jusqu\'à 60 % d\'économies par rapport à des convecteurs électriques.',
    ],
    faq: [
      {
        q: 'Combien coûte l\'installation d\'une climatisation ?',
        a: 'Un split mural standard (2,5 kW, pour une pièce de 25 m²) coûte entre 1 500 et 3 000 € pose comprise. Un système multi-split (3 unités intérieures) revient à 4 000 à 8 000 €. La climatisation gainable (invisible, conduits dans les faux plafonds) coûte 5 000 à 12 000 €. Les modèles réversibles (chaud/froid) sont plus économiques à l\'usage.',
      },
      {
        q: 'La climatisation réversible est-elle économique pour le chauffage ?',
        a: 'Oui, une pompe à chaleur air-air réversible consomme 3 à 4 fois moins d\'électricité qu\'un radiateur électrique classique grâce à son COP (Coefficient de Performance). Pour un appartement de 60 m², l\'économie est de 300 à 600 € par an sur la facture de chauffage. L\'investissement est amorti en 3 à 5 ans.',
      },
      {
        q: 'Faut-il une autorisation pour installer une climatisation ?',
        a: 'L\'unité extérieure ne nécessite pas de permis de construire, mais une déclaration préalable peut être exigée dans certaines communes (vérifiez le PLU). En copropriété, l\'accord de l\'assemblée générale est généralement requis. Respectez les réglementations sur le bruit (émergence < 5 dB(A) le jour, < 3 dB(A) la nuit).',
      },
      {
        q: 'À quelle fréquence faut-il entretenir sa climatisation ?',
        a: 'L\'entretien annuel est obligatoire pour les systèmes contenant plus de 2 kg de fluide frigorigène. Nettoyez les filtres intérieurs tous les 2 à 4 semaines en période d\'utilisation (un filtre encrassé réduit les performances de 20 à 30 %). L\'entretien professionnel comprend la vérification du circuit frigorifique, le nettoyage des échangeurs et le contrôle de l\'étanchéité. Le coût est de 100 à 200 € par an.',
      },
      {
        q: 'Quelle puissance de climatisation pour ma pièce ?',
        a: 'En règle générale, comptez 100 watts par m² pour une pièce standard (hauteur sous plafond de 2,50 m, isolation correcte). Ainsi, une pièce de 25 m² nécessite environ 2 500 watts (2,5 kW). Ce calcul doit être affiné par un bilan thermique tenant compte de l\'exposition, de la surface vitrée, de l\'isolation et du nombre d\'occupants. Un surdimensionnement entraîne des cycles courts et une surconsommation.',
      },
      {
        q: 'La climatisation réversible remplace-t-elle un chauffage classique ?',
        a: 'Dans le sud de la France et les régions tempérées, une pompe à chaleur air-air réversible peut constituer le chauffage principal. En revanche, dans les régions au climat continental ou montagnard (températures inférieures à -7 °C), elle doit être complétée par un chauffage d\'appoint car son rendement baisse fortement par grand froid. Un modèle Inverter maintient de bonnes performances jusqu\'à -15 °C.',
      },
      {
        q: 'Climatisation split ou gainable : quelle différence ?',
        a: 'Le split mural est l\'option la plus simple et la moins chère (1 500 à 3 000 € par unité), idéale pour climatiser une ou deux pièces. La climatisation gainable distribue l\'air via des gaines dans les faux plafonds : elle est invisible, silencieuse et climatise tout le logement de manière homogène, mais coûte plus cher (5 000 à 12 000 €) et nécessite un faux plafond ou des combles accessibles.',
      },
      {
        q: 'Quel est l\'impact de la climatisation sur la facture d\'électricité ?',
        a: 'Un split de 2,5 kW consomme environ 800 à 1 200 kWh par saison (juin à septembre), soit 150 à 250 € sur la facture d\'électricité. Les modèles Inverter de classe A+++ consomment 30 à 40 % de moins que les modèles classiques. Réglez le thermostat sur 25-26 °C plutôt que 20 °C : chaque degré en moins augmente la consommation de 7 %.',
      },
    ],
    emergencyInfo:
      'En cas de panne de climatisation pendant une canicule, contactez un climaticien d\'urgence : les délais varient selon les disponibilités. Vérifiez d\'abord les réglages, le disjoncteur dédié et les filtres (encrassés = perte de performance). En attendant, fermez les volets, aérez la nuit et utilisez un ventilateur.',
    certifications: [
      'Attestation de capacité fluides frigorigènes (obligatoire — catégorie I à IV)',
      'RGE (Reconnu Garant de l\'Environnement)',
      'QualiPAC (pompes à chaleur et climatisation réversible)',
      'Qualifroid / Qualiclimafroid (qualification froid et climatisation, accrédité COFRAC)',
      'Qualibat (qualification 5311/5312 génie climatique)',
      'Qualipac (installation de pompes à chaleur air/air — certification dédiée)',
      'Agrément préfectoral pour manipulation de fluides frigorigènes catégorie I (circuits de plus de 2 kg)',
      'Certification NF PAC (performance et fiabilité des pompes à chaleur, délivrée par AFNOR)',
    ],
    averageResponseTime: 'Urgence canicule : délai variable selon disponibilité ; installation sur devis sous 2 à 4 semaines',
  },

  cuisiniste: {
    slug: 'cuisiniste',
    name: 'Cuisiniste',
    priceRange: {
      min: 3000,
      max: 15000,
      unit: '€ (cuisine complète)',
    },
    commonTasks: [
      'Cuisine équipée entrée de gamme (5 ml) : 3 000 à 6 000 € (fourniture + pose)',
      'Cuisine équipée milieu de gamme : 6 000 à 12 000 €',
      'Cuisine sur mesure haut de gamme : 12 000 à 30 000 €',
      'Remplacement d\'un plan de travail : 200 à 800 €/ml selon le matériau',
      'Pose seule d\'une cuisine (hors meubles) : 1 500 à 4 000 €',
      'Installation d\'un îlot central : 2 000 à 8 000 €',
      'Installation d\'un îlot central avec raccordements (eau, électricité, hotte) : 2 000 à 5 000 €',
      'Remplacement plan de travail (granit, quartz, stratifié) : 200 à 800 €/ml',
    ],
    tips: [
      'Faites réaliser plusieurs plans d\'aménagement avant de vous engager. Un bon cuisiniste propose un plan 3D gratuit et prend en compte vos habitudes culinaires, pas uniquement l\'esthétique.',
      'Vérifiez que le devis inclut tous les postes : meubles, plan de travail, électroménager, plomberie, électricité, crédence et finitions. Les "surprises" représentent souvent 10 à 20 % du budget initial.',
      'Le triangle d\'activité (évier-plaque-réfrigérateur) est la clé d\'une cuisine fonctionnelle : la distance entre chaque point ne doit pas dépasser 2,5 m pour un confort optimal.',
      'Privilégiez les charnières et glissières de marque (Blum, Hettich, Grass) : ce sont les pièces les plus sollicitées et la qualité de la quincaillerie détermine la durabilité de la cuisine.',
      'Demandez la garantie sur les meubles (minimum 5 ans), le plan de travail et la pose. Un cuisiniste sérieux offre un service après-vente et un ajustement des portes après 6 mois d\'utilisation.',
      'Prévoyez les raccordements électriques et plomberie AVANT la pose de la cuisine — les modifier après coûte 2 à 3 fois plus cher.',
      'Mesurez le triangle d\'activité (évier-plaque-réfrigérateur) — idéalement 3,5 à 6,5 m de périmètre pour une circulation fluide sans pas inutiles.',
      'Prévoyez au moins 4 prises électriques au-dessus du plan de travail pour brancher vos appareils du quotidien (bouilloire, robot, grille-pain) sans rallonge.',
    ],
    faq: [
      {
        q: 'Quel budget prévoir pour une cuisine équipée ?',
        a: 'Pour une cuisine de 5 mètres linéaires, comptez 3 000 à 6 000 € en entrée de gamme (meubles en mélaminé, électroménager basique), 6 000 à 12 000 € en milieu de gamme (façades laquées, électroménager de marque) et 12 000 à 30 000 € pour du haut de gamme ou du sur-mesure. La pose représente 15 à 25 % du budget total.',
      },
      {
        q: 'Combien de temps dure l\'installation d\'une cuisine ?',
        a: 'L\'installation complète (dépose ancienne cuisine, plomberie, électricité, pose des meubles, plan de travail, électroménager et finitions) prend entre 3 et 7 jours ouvrés. Ajoutez 1 à 2 semaines de délai pour la fabrication des meubles sur mesure et 2 à 3 mois pour le haut de gamme.',
      },
      {
        q: 'Quel plan de travail choisir ?',
        a: 'Le stratifié est le plus abordable (50-150 €/ml) et disponible en nombreux décors. Le bois massif (150-300 €/ml) est chaleureux mais demande un entretien régulier. Le quartz (250-500 €/ml) est très résistant et sans entretien. Le granit (300-600 €/ml) est indestructible. La céramique (400-800 €/ml) résiste à tout (chaleur, rayures, taches).',
      },
      {
        q: 'Faut-il prévoir des travaux de plomberie et d\'électricité avec la cuisine ?',
        a: 'Oui, la rénovation d\'une cuisine implique presque toujours des travaux de plomberie (déplacement de l\'évier, raccordement du lave-vaisselle) et d\'électricité (ajout de prises, circuit dédié pour le four et la plaque). Un bon cuisiniste coordonne ces corps de métier. Prévoyez 500 à 2 000 € supplémentaires pour la plomberie et 300 à 1 500 € pour l\'électricité.',
      },
      {
        q: 'Comment bien agencer une petite cuisine ?',
        a: 'Dans une cuisine de moins de 8 m², privilégiez un agencement en L ou en I pour optimiser l\'espace. Utilisez des meubles hauts jusqu\'au plafond, des tiroirs plutôt que des placards bas (accès plus facile), et un plan de travail escamotable si nécessaire. Un cuisiniste expérimenté peut rendre une cuisine de 5 m² parfaitement fonctionnelle grâce à des solutions sur mesure.',
      },
      {
        q: 'Quelle est la différence entre une cuisine en kit et une cuisine sur mesure ?',
        a: 'La cuisine en kit (grande surface de bricolage) coûte 1 000 à 4 000 € pour 5 ml mais propose des dimensions standardisées qui laissent parfois des espaces vides. La cuisine sur mesure (cuisiniste professionnel) coûte 3 000 à 15 000 € mais s\'adapte parfaitement à votre pièce, avec des matériaux de meilleure qualité et un suivi de chantier complet incluant la pose.',
      },
      {
        q: 'Les cuisinistes proposent-ils un service après-vente ?',
        a: 'Les cuisinistes sérieux offrent une garantie de 2 à 10 ans sur les meubles et un service après-vente incluant le réglage des portes et tiroirs après installation (le bois travaille les premiers mois). Vérifiez les conditions de garantie avant de signer : certaines enseignes incluent un ajustement gratuit à 6 mois. En cas de problème, le cuisiniste est votre interlocuteur unique, contrairement à une cuisine en kit.',
      },
      {
        q: 'Quels sont les délais pour une cuisine sur mesure ?',
        a: 'Comptez 2 à 3 semaines pour la conception (prise de mesures, plan 3D, choix des matériaux), 4 à 8 semaines pour la fabrication des meubles, et 3 à 7 jours pour la pose complète. Au total, prévoyez 2 à 3 mois entre la commande et l\'installation. Les cuisines haut de gamme ou importées peuvent nécessiter 3 à 4 mois de fabrication.',
      },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour l\'installation de cuisine. La conception, la fabrication et la pose sont des projets planifiés sur plusieurs semaines. Prenez rendez-vous pour un premier échange sous 48h.',
    certifications: [
      'Qualibat (qualification aménagement intérieur)',
      'NF Ameublement (certification AFNOR/FCBA — sécurité et durabilité du mobilier)',
      'NF Environnement Ameublement (label éco-responsable)',
      'Garantie Meubles de France (fabrication française)',
      'Qualibat 4131 (agencement de cuisines)',
      'Label Artisan de confiance (CMA)',
      'Certification NF Ameublement',
      'Assurance décennale (obligatoire si modification des réseaux)',
    ],
    averageResponseTime: 'Conception 2 à 3 semaines, fabrication 4 à 8 semaines, pose 3 à 7 jours',
  },

  solier: {
    slug: 'solier',
    name: 'Solier',
    priceRange: {
      min: 25,
      max: 60,
      unit: '€/m²',
    },
    commonTasks: [
      'Pose de parquet flottant : 20 à 35 €/m² (pose uniquement)',
      'Pose de parquet massif collé : 35 à 60 €/m²',
      'Pose de sol PVC/vinyle en lames ou dalles : 15 à 30 €/m²',
      'Pose de moquette : 10 à 25 €/m²',
      'Ragréage du sol (mise à niveau) : 15 à 30 €/m²',
      'Pose de sol souple linoléum : 20 à 40 €/m²',
      'Dépose de l\'ancien revêtement de sol : 5 à 15 €/m²',
      'Pose de sol amortissant (crèche, salle de sport) : 30 à 60 €/m²',
    ],
    tips: [
      'Le ragréage (mise à niveau du support) est souvent indispensable avant la pose d\'un revêtement de sol. Un sol mal préparé est la première cause de désordres. Ce poste peut représenter 15 à 30 €/m² supplémentaires.',
      'Le parquet contrecollé offre le meilleur compromis entre esthétique (couche d\'usure en bois noble) et stabilité (pas de retrait ni gonflement). Il est compatible avec le chauffage au sol.',
      'Les sols PVC/vinyle nouvelle génération (LVT - Luxury Vinyl Tiles) offrent un rendu très réaliste (imitation bois, pierre) avec une grande résistance à l\'eau et à l\'usure, idéaux pour les salles de bain et cuisines.',
      'Demandez au solier le classement UPEC du revêtement proposé et vérifiez qu\'il correspond à l\'usage de la pièce : U3 P3 minimum pour une entrée ou un couloir, U2 P2 suffisant pour une chambre.',
      'Prévoyez 5 à 10 % de matériau supplémentaire pour les coupes et les raccords. Pour les poses en diagonale ou dans les pièces en L, cette marge monte à 15 %.',
      'Le ragréage est indispensable si le sol présente plus de 2 mm de différence de niveau sur 2 mètres : sans cette étape, le revêtement ondulera et se décollera prématurément.',
      'Un sol vinyle LVT (Luxury Vinyl Tiles) imite parfaitement le bois ou la pierre naturelle pour environ 3 fois moins cher, avec une résistance à l\'eau que le parquet ne peut pas offrir.',
      'En copropriété, vérifiez le classement acoustique minimum exigé dans le règlement (indice ΔLw) : une sous-couche acoustique adaptée évite les litiges avec les voisins du dessous.',
    ],
    faq: [
      {
        q: 'Parquet massif, contrecollé ou stratifié : lequel choisir ?',
        a: 'Le parquet massif (30-80 €/m²) est le plus noble et durable (ponçable plusieurs fois), mais sensible à l\'humidité. Le contrecollé (25-60 €/m²) offre le meilleur compromis qualité-prix et convient au chauffage au sol. Le stratifié (10-25 €/m²) est le moins cher mais ne peut pas être poncé et a une durée de vie limitée (10-15 ans).',
      },
      {
        q: 'Peut-on poser du parquet sur du carrelage existant ?',
        a: 'Oui, à condition que le carrelage soit bien adhérent, plan (tolérance de 2 mm sous la règle de 2 m) et propre. Le solier posera une sous-couche d\'isolation phonique et thermique. Attention : l\'ajout d\'épaisseur (8 à 15 mm) peut nécessiter de raboter les portes et d\'adapter les seuils.',
      },
      {
        q: 'Quel sol choisir pour une salle de bain ?',
        a: 'Les meilleurs choix sont le sol PVC/vinyle (étanche, antidérapant, 15-30 €/m²), le parquet teck ou bambou (naturellement résistant à l\'eau, 40-70 €/m²) ou le sol souple linoléum (écologique, antibactérien, 20-40 €/m²). Évitez le stratifié classique qui gonfle au contact de l\'eau. Le carrelage reste la solution la plus durable.',
      },
      {
        q: 'Qu\'est-ce que le ragréage et quand est-il nécessaire ?',
        a: 'Le ragréage est une chape fine (3 à 10 mm) coulée sur le sol existant pour le lisser et le mettre à niveau avant la pose d\'un revêtement. Il est nécessaire quand le sol présente des irrégularités supérieures à 2 mm sous la règle de 2 m. Le coût est de 15 à 30 €/m². Le solier utilise un ragréage autolissant qui se met à niveau seul et sèche en 4 à 24 heures.',
      },
      {
        q: 'Le parquet est-il compatible avec le chauffage au sol ?',
        a: 'Oui, mais uniquement certains types : le parquet contrecollé (épaisseur totale de 12 à 15 mm) et le stratifié sont compatibles, en pose flottante. Le parquet massif est déconseillé car il se dilate trop. La résistance thermique totale (parquet + sous-couche) ne doit pas dépasser 0,15 m².K/W. Un solier expérimenté saura vous orienter vers le bon produit et la bonne épaisseur.',
      },
      {
        q: 'Combien coûte la pose de parquet dans un appartement ?',
        a: 'Pour un appartement de 60 m², la pose de parquet flottant coûte entre 1 200 et 2 100 € (pose seule, 20 à 35 €/m²), le parquet contrecollé collé entre 2 100 et 3 600 € (35 à 60 €/m²), et le parquet massif entre 3 000 et 4 800 € (50 à 80 €/m²). Ajoutez le ragréage si nécessaire (15 à 30 €/m²) et la sous-couche isolante (3 à 8 €/m²).',
      },
      {
        q: 'Pose collée ou pose flottante : quelle différence ?',
        a: 'La pose flottante (les lames s\'emboîtent sans fixation au sol) est plus rapide, moins chère (20 à 35 €/m²) et permet de démonter le parquet. La pose collée (les lames sont collées directement au sol) offre un meilleur confort acoustique, une meilleure stabilité et est obligatoire pour le parquet massif et le chauffage au sol. Elle coûte 35 à 60 €/m² et nécessite un sol parfaitement préparé.',
      },
      {
        q: 'Quelle sous-couche choisir sous un parquet flottant ?',
        a: 'La sous-couche en mousse polyéthylène (2 à 4 €/m²) est l\'option économique de base. La sous-couche en liège (5 à 10 €/m²) offre la meilleure isolation phonique et thermique. La sous-couche en fibre de bois (4 à 8 €/m²) est le choix écologique. Pour un sol sur vide sanitaire ou en rez-de-chaussée, ajoutez un pare-vapeur pour protéger le parquet de l\'humidité.',
      },
      {
        q: 'Sol PVC, vinyle ou linoléum : quelle différence ?',
        a: 'Le PVC et le vinyle sont des matériaux synthétiques à base de polychlorure de vinyle : très résistants à l\'eau, faciles d\'entretien et économiques (15 à 30 €/m² posés). Le linoléum est un revêtement 100 % naturel (huile de lin, résine, farine de bois, jute) : plus cher (30 à 50 €/m²) mais écologique, antibactérien et recyclable. Le linoléum est à privilégier dans les crèches et les établissements de santé.',
      },
      {
        q: 'Un sol souple peut-il être posé sur un plancher chauffant ?',
        a: 'Oui, à condition de choisir un revêtement compatible dont la résistance thermique ne dépasse pas 0,15 m².K/W. Les sols PVC/vinyle et le linoléum sont généralement compatibles. La moquette épaisse est déconseillée car elle isole trop et réduit l\'efficacité du chauffage. Demandez systématiquement la fiche technique du produit au solier pour vérifier cette valeur.',
      },
      {
        q: 'Combien de temps dure un sol souple ?',
        a: 'La durée de vie dépend du type de revêtement et de l\'intensité du passage : un sol PVC/vinyle dure 15 à 25 ans, un linoléum 25 à 40 ans grâce à sa composition naturelle très résistante, et une moquette 10 à 15 ans dans une chambre mais seulement 5 à 8 ans dans un couloir ou un bureau à fort passage. Un entretien régulier et adapté prolonge sensiblement la durée de vie.',
      },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la pose de revêtements de sol. Prenez rendez-vous pour un devis gratuit sous 48h et une intervention planifiée sous 1 à 3 semaines.',
    certifications: [
      'Qualibat (qualification 6411 revêtements de sol souples)',
      'Qualibat (qualification 6421 parquets et revêtements en bois)',
      'Titre Professionnel Solier Moquettiste (inscrit au RNCP)',
      'Compagnons du Devoir (formation d\'excellence)',
      'Qualibat 6231 (revêtements de sols souples collés)',
      'NF DTU 53.1 (pose de revêtements de sol textiles et moquettes)',
      'NF DTU 53.2 (pose de revêtements de sol PVC collés)',
      'Certification UPEC (classement de résistance des locaux et revêtements)',
    ],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 3 semaines',
  },

  nettoyage: {
    slug: 'nettoyage',
    name: 'Nettoyage',
    priceRange: {
      min: 25,
      max: 45,
      unit: '€/h',
    },
    commonTasks: [
      'Nettoyage de fin de chantier (appartement 60 m²) : 400 à 800 €',
      'Nettoyage de copropriété (parties communes) : 200 à 500 €/mois',
      'Nettoyage de vitres (logement) : 5 à 10 €/m²',
      'Remise en état après sinistre : 500 à 2 000 €',
      'Nettoyage de façade (kärcher professionnel) : 10 à 25 €/m²',
      'Débarras et nettoyage de locaux : 30 à 50 €/m²',
      'Entretien régulier de bureaux et locaux professionnels : 15 à 25 €/h',
      'Nettoyage industriel (entrepôt, atelier, usine) : 3 à 8 €/m²',
    ],
    tips: [
      'Pour un nettoyage de fin de chantier, exigez un cahier des charges précis : lessivage des murs, décapage des sols, nettoyage des vitres (intérieur + extérieur), dégraissage de la cuisine et nettoyage des sanitaires.',
      'Vérifiez que l\'entreprise de nettoyage dispose d\'une assurance responsabilité civile professionnelle et que ses salariés sont déclarés (demandez un extrait Kbis et une attestation URSSAF).',
      'Pour le nettoyage régulier de copropriété, un contrat annuel avec un cahier des charges détaillé (fréquence, surfaces, prestations) est plus économique que des interventions ponctuelles.',
      'Les entreprises de nettoyage à domicile agréées services à la personne (SAP) ouvrent droit à un crédit d\'impôt de 50 % dans la limite de 12 000 € de dépenses par an.',
      'Pour un nettoyage après sinistre (dégât des eaux, incendie), conservez les factures pour votre assurance. La plupart des contrats d\'assurance habitation couvrent ces frais.',
      'Le crédit d\'impôt SAP de 50 % s\'applique au ménage à domicile dans la limite de 12 000 €/an de dépenses : c\'est l\'un des dispositifs les plus avantageux pour réduire le coût d\'une aide ménagère régulière.',
      'Un nettoyage régulier préventif coûte en moyenne 3 fois moins cher qu\'un nettoyage curatif intensif : programmez des interventions planifiées plutôt que d\'attendre l\'encrassement complet.',
      'Pour les contrats de nettoyage récurrent (bureaux, copropriétés), demandez un cahier des charges détaillé précisant les surfaces, les fréquences, les produits utilisés et les critères de contrôle qualité.',
    ],
    faq: [
      {
        q: 'Combien coûte un nettoyage de fin de chantier ?',
        a: 'Pour un appartement de 60 m², comptez 400 à 800 € selon l\'état des lieux et l\'étendue des travaux réalisés. Pour une maison de 120 m², le budget est de 700 à 1 500 €. Ce tarif inclut le lessivage des murs, le décapage et lustrage des sols, le nettoyage des vitres et la désinfection des sanitaires.',
      },
      {
        q: 'Puis-je bénéficier d\'un crédit d\'impôt pour le nettoyage ?',
        a: 'Oui, le ménage à domicile bénéficie d\'un crédit d\'impôt de 50 % si l\'entreprise est agréée services à la personne (SAP) ou si vous employez directement une personne via le CESU. Le plafond est de 12 000 € de dépenses par an (+1 500 € par enfant à charge). Seul le nettoyage à domicile est éligible, pas le nettoyage professionnel de locaux.',
      },
      {
        q: 'Comment choisir une entreprise de nettoyage fiable ?',
        a: 'Vérifiez le SIRET, l\'inscription au registre du commerce (Kbis), l\'attestation URSSAF à jour et l\'assurance RC professionnelle. Demandez des références clients et consultez les avis en ligne. Une entreprise sérieuse propose un devis gratuit après visite sur site et ne demande jamais de paiement en espèces.',
      },
      {
        q: 'Quelle est la différence entre un nettoyage classique et un nettoyage de fin de chantier ?',
        a: 'Le nettoyage de fin de chantier est bien plus intensif qu\'un ménage classique. Il comprend le décapage des sols (résidus de colle, ciment, peinture), le lessivage des murs et plafonds, le nettoyage des menuiseries et vitrages, et la désinfection complète des sanitaires. Le tarif est 2 à 3 fois plus élevé qu\'un ménage standard car il nécessite des produits et des équipements professionnels spécifiques.',
      },
      {
        q: 'Combien coûte le nettoyage des parties communes d\'un immeuble ?',
        a: 'Le nettoyage hebdomadaire des parties communes (hall, escalier, paliers) d\'un petit immeuble de 10 à 20 lots coûte entre 200 et 500 € par mois. Ce tarif inclut le balayage, le lavage des sols, le nettoyage des vitres d\'entrée et la sortie des poubelles. Un contrat annuel est plus économique que des interventions ponctuelles et permet de répartir les charges entre copropriétaires.',
      },
      {
        q: 'Le nettoyage après un dégât des eaux est-il couvert par l\'assurance ?',
        a: 'Oui, la plupart des contrats d\'assurance habitation couvrent les frais de remise en état après un dégât des eaux, y compris le nettoyage et l\'assèchement. Déclarez le sinistre sous 5 jours ouvrés, prenez des photos des dégâts et conservez toutes les factures. L\'expert de l\'assurance validera la prise en charge. Certains contrats incluent un service d\'assistance avec envoi direct d\'une entreprise de nettoyage.',
      },
      {
        q: 'Peut-on nettoyer une façade soi-même ou faut-il un professionnel ?',
        a: 'Le nettoyage d\'une façade de plain-pied peut se faire soi-même avec un nettoyeur haute pression (attention à ne pas dépasser 100 bars pour ne pas abîmer l\'enduit). Au-delà du premier étage, faites appel à un professionnel équipé (nacelle, échafaudage) pour des raisons de sécurité. Le nettoyage professionnel de façade coûte 10 à 25 €/m² et peut inclure un traitement hydrofuge de protection.',
      },
      {
        q: 'Quels produits sont utilisés pour un nettoyage professionnel écologique ?',
        a: 'Les entreprises labellisées Écolabel Européen utilisent des produits biodégradables à base de tensioactifs végétaux, sans phosphates ni solvants chlorés. Les techniques de nettoyage vapeur (150 °C) permettent de désinfecter sans produit chimique. Le microfibre professionnelle réduit la consommation d\'eau de 90 %. Ces solutions écologiques sont particulièrement adaptées aux crèches, écoles et logements avec enfants en bas âge.',
      },
      {
        q: 'Quelle est la différence entre nettoyage courant et remise en état ?',
        a: 'Le nettoyage courant correspond à l\'entretien régulier (dépoussiérage, lavage des sols, désinfection des sanitaires). La remise en état implique un décapage profond, un traitement des surfaces (cristallisation, ponçage) et parfois une rénovation des revêtements. Le coût d\'une remise en état est 2 à 3 fois supérieur à celui d\'un nettoyage classique, car elle mobilise des équipements spécialisés (monobrosse, autolaveuse) et des produits techniques.',
      },
      {
        q: 'Le nettoyage de fin de chantier est-il à la charge de l\'entreprise de travaux ?',
        a: 'En principe, l\'entreprise de travaux doit livrer un chantier propre et le nettoyage de fin de chantier est inclus dans le marché. Cependant, vérifiez votre contrat de travaux : certaines clauses excluent le nettoyage approfondi (vitres, décapage des sols). Si le contrat est muet sur ce point, l\'article 1792-6 du Code civil impose la livraison d\'un ouvrage en bon état. En cas de litige, conservez des photos avant/après et faites établir un constat.',
      },
    ],
    emergencyInfo:
      'Nettoyage d\'urgence disponible après sinistre (dégât des eaux, incendie, inondation). Intervention sous 24 à 48h pour la remise en état et le nettoyage post-sinistre. Majoration de +30 à 60 % en dehors des heures ouvrées.',
    certifications: [
      'Qualipropre (qualification professionnelle du secteur de la propreté — valable 4 ans)',
      'Agrément Services à la Personne (SAP — crédit d\'impôt 50 % pour le ménage à domicile)',
      'ISO 14001 (management environnemental)',
      'Écolabel Européen (utilisation de produits écologiques)',
      'CQP Agent de propreté (Certificat de Qualification Professionnelle — INHNI)',
      'Label AFNOR NF Service Propreté (certification de qualité des prestations de nettoyage)',
      'Certification MASE (Management de la Sécurité, Santé et Environnement au travail)',
      'Qualibat 8211 (nettoyage de bâtiment — qualification reconnue dans le secteur du BTP)',
    ],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 5 jours',
  },

  // ════════════════════════════════════════════════════════════════════════
  // NOUVEAUX MÉTIERS (35 services additionnels)
  // ════════════════════════════════════════════════════════════════════════

  terrassier: {
    slug: 'terrassier',
    name: 'Terrassier',
    priceRange: { min: 30, max: 60, unit: '€/m³' },
    commonTasks: [
      'Terrassement pour fondations : 30 à 60 €/m³',
      'Décaissement de terrain : 5 à 15 €/m²',
      'Viabilisation de parcelle (VRD) : 5 000 à 15 000 €',
      'Assainissement individuel (fosse septique) : 4 000 à 12 000 €',
      'Création de tranchées pour réseaux : 15 à 40 €/ml',
      'Remblaiement et compactage de terrain : 15 à 30 €/m³',
      'Nivellement et mise à niveau de terrain : 10 à 25 €/m²',
      'Création de chemin d\'accès empierré : 30 à 60 €/m²',
    ],
    tips: [
      'Avant tout terrassement, faites réaliser une étude de sol (G2) pour connaître la nature du terrain et adapter les travaux.',
      'Vérifiez que le terrassier dispose d\'une assurance décennale et d\'une RC professionnelle.',
      'Demandez les autorisations de voirie si les engins doivent circuler sur la voie publique.',
      'Faites réaliser un DICT (Déclaration d\'Intention de Commencement de Travaux) avant de creuser pour localiser les réseaux souterrains (gaz, électricité, eau, télécom).',
      'Prévoyez une zone de stockage suffisante pour les déblais : un terrassement de 100 m² génère 50 à 150 m³ de terre à évacuer ou à réutiliser en remblai.',
      'Ne commencez jamais un terrassement sans avoir fait une DICT (déclaration d\'intention de commencement de travaux) pour localiser les réseaux enterrés : endommager une canalisation de gaz ou un câble électrique peut engager votre responsabilité.',
      'Prévoyez 20 % de volume en plus lors de l\'évacuation des terres, car la terre foisonne (augmente de volume une fois excavée) : 10 m³ en place deviennent environ 12 m³ en tas.',
      'Évitez le terrassement par temps de pluie : le sol détrempé est instable, les engins risquent de s\'enliser et le compactage sera de mauvaise qualité. Privilégiez une période sèche.',
    ],
    faq: [
      { q: 'Combien coûte un terrassement de maison ?', a: 'Le terrassement pour une maison individuelle de 100 m² au sol coûte entre 3 000 et 10 000 € selon la nature du terrain, la profondeur des fondations et l\'accessibilité du chantier.' },
      { q: 'Faut-il un permis pour terrassement ?', a: 'Pas de permis spécifique, mais une déclaration préalable de travaux est nécessaire si le terrassement modifie le relief naturel du terrain de plus de 2 m de hauteur et 100 m² de surface.' },
      { q: 'Quelle est la meilleure période pour réaliser un terrassement ?', a: 'Le printemps et l\'été sont les saisons idéales, car le sol est sec et stable. Évitez les périodes de gel (le sol gelé est très dur à creuser) et les fortes pluies (risque d\'effondrement et de boue). Un terrassier expérimenté adapte ses techniques selon la saison.' },
      { q: 'Qu\'est-ce qu\'une étude de sol et est-elle obligatoire ?', a: 'L\'étude de sol (ou étude géotechnique G2) analyse la nature du terrain (argile, roche, sable) pour dimensionner les fondations. Elle est obligatoire depuis 2020 pour la vente de terrains constructibles en zone argileuse (loi ELAN). Son coût est de 1 500 à 3 000 € et elle évite des surcoûts majeurs en cas de terrain instable.' },
      { q: 'Combien de temps dure un terrassement pour une maison ?', a: 'Le terrassement d\'une maison individuelle dure en moyenne 2 à 5 jours ouvrés selon la surface, la profondeur des fondations et la nature du sol. Un terrain rocheux nécessitera un brise-roche hydraulique et peut doubler la durée du chantier. L\'évacuation des terres représente souvent 30 à 40 % du temps total.' },
      { q: 'Combien coûte le terrassement d\'un terrain ?', a: 'Le prix varie considérablement selon la nature du sol : 20 à 40 €/m³ pour de la terre meuble, 50 à 100 €/m³ pour de la roche nécessitant un brise-roche hydraulique. L\'accessibilité du terrain et la distance d\'évacuation des déblais impactent également fortement le prix final.' },
      { q: 'Faut-il une étude de sol avant le terrassement ?', a: 'C\'est fortement recommandé et même obligatoire depuis 2020 en zone argileuse (loi ELAN). L\'étude géotechnique G2 coûte entre 1 500 et 3 000 € et permet de dimensionner correctement les fondations, d\'anticiper les difficultés (nappe phréatique, roche) et d\'éviter des surcoûts importants en cours de chantier.' },
      { q: 'Que devient la terre excavée lors d\'un terrassement ?', a: 'La terre excavée peut être réutilisée en remblai sur le chantier si elle est propre et de bonne qualité (pas de terre végétale pour les fondations). Sinon, elle doit être évacuée vers une décharge agréée (Installation de Stockage de Déchets Inertes), ce qui coûte 15 à 30 €/m³ hors transport. Pensez à négocier l\'évacuation dans le devis global.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour le terrassement. Les travaux de terrassement nécessitent une préparation rigoureuse (étude de sol, DICT). Prenez rendez-vous pour un devis gratuit sous 48h.',
    certifications: ['Qualibat (qualification 1111/1112 terrassement)', 'CACES (Certificat d\'Aptitude à la Conduite En Sécurité — catégories A à F)', 'AIPR (Autorisation d\'Intervention à Proximité des Réseaux — obligatoire)', 'Label Qualité TP (Travaux Publics)', 'NF DTU 12 (terrassement pour le bâtiment — normes de mise en œuvre)', 'Assurance décennale obligatoire pour tous travaux de terrassement', 'Certification FNTP (Fédération Nationale des Travaux Publics)', 'Qualibat 1112 (terrassements spécialisés — niveau confirmé)'],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 3 semaines',
  },

  charpentier: {
    slug: 'charpentier',
    name: 'Charpentier',
    priceRange: { min: 50, max: 120, unit: '€/m²' },
    commonTasks: [
      'Charpente traditionnelle bois : 70 à 150 €/m² de toiture',
      'Charpente fermettes industrielles : 50 à 80 €/m²',
      'Réparation de charpente (remplacement de pièces) : 100 à 250 €/ml',
      'Traitement insecticide/fongicide : 15 à 30 €/m²',
      'Surélévation en ossature bois : 1 200 à 2 000 €/m²',
      'Traitement charpente par injection (anti-termites/capricornes) : 20 à 40 €/m²',
      'Surélévation de toiture (rehaussement) : 800 à 1 500 €/m²',
      'Construction d\'un carport ou auvent en bois : 2 000 à 6 000 €',
    ],
    tips: [
      'Un traitement préventif de la charpente tous les 10 ans prolonge sa durée de vie de plusieurs décennies.',
      'Pour une extension en bois, vérifiez que le charpentier est certifié ACQPA ou titulaire d\'un Qualibat charpente bois.',
      'Exigez un diagnostic parasitaire (termites, capricornes) avant toute rénovation de charpente ancienne.',
      'En zone sismique, la charpente doit respecter les règles parasismiques (Eurocode 8). Demandez au charpentier de vérifier la classification de votre commune.',
      'Lors d\'une surélévation en ossature bois, vérifiez que le PLU de votre commune autorise la hauteur supplémentaire et obtenez un permis de construire avant le démarrage des travaux.',
      'Faites inspecter votre charpente tous les 5 ans pour détecter l\'humidité et les insectes xylophages (termites, capricornes, vrillettes) avant qu\'ils ne causent des dégâts structurels.',
      'Un traitement préventif de charpente coûte 10 fois moins cher qu\'un traitement curatif : comptez 15 à 30 €/m² en préventif contre 150 à 300 €/m² en curatif avec remplacement de pièces.',
      'Utilisez du bois classe 3 ou 4 pour les charpentes exposées à l\'humidité (auvents, débords de toit, charpentes en région pluvieuse) : le douglas ou le mélèze résistent naturellement sans traitement chimique.',
    ],
    faq: [
      { q: 'Quelle est la durée de vie d\'une charpente bois ?', a: 'Une charpente bois bien entretenue dure 100 ans et plus. Les charpentes en chêne des bâtiments anciens atteignent souvent 200 à 300 ans. Le principal ennemi est l\'humidité, qui favorise les champignons (mérule) et les insectes xylophages.' },
      { q: 'Charpente traditionnelle ou fermettes ?', a: 'La charpente traditionnelle permet d\'aménager les combles et offre un cachet architectural. Les fermettes sont 30 à 40 % moins chères mais rendent les combles inaménageables (sauf conversion coûteuse). Pour une maison avec projet de combles aménagés, choisissez le traditionnel.' },
      { q: 'Comment détecter un problème de charpente ?', a: 'Les signes d\'alerte sont : affaissement visible de la toiture, craquements inhabituels, présence de sciure (signe d\'insectes xylophages), taches d\'humidité au plafond, odeur de moisi dans les combles. Au moindre doute, faites intervenir un charpentier pour un diagnostic. Un traitement précoce coûte 15 à 30 €/m², contre 100 à 250 €/ml pour un remplacement de pièce.' },
      { q: 'Quel bois choisir pour une charpente ?', a: 'Le sapin et l\'épicéa (résineux) sont les plus courants et économiques (classe d\'emploi 2). Le chêne est plus noble et résistant mais 2 à 3 fois plus cher. Le douglas offre un excellent compromis : naturellement durable (classe 3), il résiste aux insectes sans traitement chimique. Pour les régions humides, le mélèze est recommandé.' },
      { q: 'Combien coûte l\'aménagement de combles avec modification de charpente ?', a: 'L\'aménagement de combles avec modification de charpente (passage de fermettes en charpente traditionnelle) coûte entre 800 et 1 500 €/m² tout compris (charpente, isolation, plancher, escalier, finitions). Pour des combles de 40 m², prévoyez un budget de 35 000 à 60 000 €. C\'est souvent plus rentable qu\'une extension.' },
      { q: 'Comment savoir si ma charpente est attaquée par les insectes ?', a: 'Les signes révélateurs sont : sciure fine au sol sous la charpente, petits trous de sortie de 2 à 4 mm dans le bois, bois qui sonne creux lorsque vous le tapotez, et galeries visibles en surface. Certains insectes comme les capricornes émettent un bruit de grignotement audible la nuit. Au moindre doute, faites réaliser un diagnostic par un professionnel certifié (150 à 300 €) qui identifiera l\'espèce et le traitement adapté.' },
      { q: 'Charpente traditionnelle ou fermette : quelle différence ?', a: 'La charpente traditionnelle est réalisée en bois massif assemblé par tenons-mortaises ou boulonnage. Elle permet l\'aménagement des combles et coûte 80 à 120 €/m². La charpente fermette (industrielle) est constituée de triangles en bois léger reliés par des connecteurs métalliques. Elle est plus économique (50 à 70 €/m²) mais rend les combles perdus, sauf conversion coûteuse. Le choix dépend de votre projet : si vous envisagez d\'aménager les combles, optez pour le traditionnel.' },
      { q: 'Combien de temps dure une charpente en bois ?', a: 'Une charpente en bois bien entretenue et régulièrement traitée dure 50 à 100 ans sans problème. Les charpentes en chêne de bâtiments historiques dépassent même 200 à 300 ans. La clé de la longévité est l\'entretien : une inspection tous les 5 ans permet de détecter l\'humidité, les champignons (mérule) et les insectes xylophages avant qu\'ils ne fragilisent la structure. Un traitement préventif régulier et une bonne ventilation des combles sont essentiels.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la charpente. En cas de dégât de tempête sur la charpente, contactez d\'abord un couvreur pour un bâchage d\'urgence, puis un charpentier pour le diagnostic et la réparation structurelle.',
    certifications: ['Qualibat (qualification 2311/2312 charpente bois)', 'CTB-A+ (certification traitement du bois — FCBA)', 'Compagnons du Devoir (formation d\'excellence)', 'RGE (si isolation des combles associée)', 'Qualibat 2312 (charpente bois — niveau confirmé)', 'Compagnons du Tour de France (excellence artisanale)', 'Certification CTB-A+ traitement préventif du bois (FCBA)', 'Label RGE (isolation sous rampants de toiture)'],
    averageResponseTime: 'Devis sous 1 semaine, intervention sous 2 à 4 semaines',
  },

  zingueur: {
    slug: 'zingueur',
    name: 'Zingueur',
    priceRange: { min: 40, max: 80, unit: '€/ml' },
    commonTasks: [
      'Pose de gouttières en zinc : 40 à 80 €/ml',
      'Remplacement de chéneaux : 60 à 120 €/ml',
      'Pose de descentes d\'eau : 30 à 60 €/ml',
      'Habillage de rives et bandeaux : 50 à 100 €/ml',
      'Réparation de noues et faîtages : 80 à 200 €/ml',
      'Pose de gouttières en aluminium laqué ou PVC : 30 à 80 €/ml',
      'Remplacement de descente d\'eaux pluviales : 40 à 100 €/ml',
      'Habillage de lucarne en zinc : 500 à 2 000 €',
      'Pose de noue (intersection de toiture) : 50 à 100 €/ml',
      'Réparation de solins de cheminée : 200 à 600 €',
      'Faîtage ventilé en zinc : 30 à 60 €/ml',
      'Bavette et abergement de cheminée : 100 à 300 €/pièce',
      'Chéneau zinc sur mesure : 60 à 150 €/ml',
    ],
    tips: [
      'Le zinc a une durée de vie de 50 à 100 ans selon la qualité et l\'exposition. Préférez le zinc prépatiné pour une meilleure résistance à la corrosion.',
      'Faites vérifier l\'état de vos gouttières et descentes après chaque automne pour éviter les engorgements.',
      'Choisissez un zingueur qui travaille le zinc en continu (sans soudure) pour les longues longueurs de gouttière : c\'est plus étanche et plus durable.',
      'Faites poser des crépines (grilles) à l\'entrée des descentes pour empêcher les feuilles mortes de boucher les évacuations.',
      'En bord de mer, le zinc standard se corrode rapidement. Optez pour du zinc-cuivre-titane (VMZINC) ou de l\'aluminium laqué, plus résistant aux embruns salins.',
      'Une gouttière bouchée peut provoquer des infiltrations dans les murs et les fondations : ne négligez jamais un débordement, même ponctuel.',
      'Le zinc naturel se patine naturellement en 5 à 10 ans pour prendre une teinte gris mat protectrice. Ne peignez jamais du zinc neuf : la patine est sa meilleure protection.',
      'Les crépines (crapaudines) en sortie de gouttière empêchent les bouchons de feuilles et réduisent considérablement la fréquence de nettoyage. Comptez 5 à 15 € pièce, un investissement dérisoire.',
    ],
    faq: [
      { q: 'Quel est le prix de remplacement de gouttières ?', a: 'Comptez 40 à 80 €/ml pour des gouttières en zinc, pose comprise. Pour une maison de 40 ml de gouttières, le budget total se situe entre 2 000 et 4 000 €. Le PVC est moins cher (20 à 40 €/ml) mais dure 2 à 3 fois moins longtemps.' },
      { q: 'Gouttière zinc, PVC ou aluminium : laquelle choisir ?', a: 'Le zinc est le matériau le plus durable (50 à 100 ans) avec un bel aspect patiné, mais il est le plus cher. L\'aluminium laqué offre un bon compromis (30 à 50 ans, large choix de couleurs, 35 à 70 €/ml). Le PVC est économique (20 à 40 €/ml) mais se déforme sous l\'effet du soleil et ne dure que 15 à 25 ans.' },
      { q: 'À quelle fréquence faut-il nettoyer ses gouttières ?', a: 'Un nettoyage complet est recommandé 2 fois par an : à la fin de l\'automne (après la chute des feuilles) et au printemps. Si votre maison est entourée d\'arbres, ajoutez un nettoyage en été. Des gouttières bouchées provoquent des débordements qui endommagent les façades et les fondations.' },
      { q: 'Quels sont les signes d\'une gouttière en mauvais état ?', a: 'Les signes d\'alerte sont : débordements lors des pluies, traces de rouille ou verdissement, gouttière qui se désolidarise de la façade, fissures visibles, eau qui coule le long du mur au lieu de descendre par les tuyaux. Une gouttière percée non réparée peut provoquer des infiltrations dans les murs et la toiture.' },
      { q: 'Peut-on poser des gouttières soi-même ?', a: 'La pose de gouttières PVC avec collage est accessible aux bricoleurs confirmés. En revanche, la zinguerie (zinc soudé) requiert un savoir-faire professionnel : soudure à l\'étain, façonnage sur mesure et respect des pentes d\'écoulement (5 mm/ml minimum). Un défaut de pose entraîne des infiltrations et engage votre responsabilité en cas de sinistre.' },
      { q: 'Zinc, alu ou PVC pour les gouttières : quel matériau dure le plus longtemps ?', a: 'Le zinc est le matériau le plus noble avec une durée de vie de 50 ans et plus, mais c\'est le plus onéreux (40 à 80 €/ml). L\'aluminium laqué ne nécessite aucun entretien et dure environ 30 ans avec un bon rapport qualité-prix (35 à 70 €/ml). Le PVC est le plus économique (20 à 40 €/ml) mais ne dure que 15 à 20 ans et jaunit avec le temps sous l\'effet des UV.' },
      { q: 'Le zingueur et le couvreur sont-ils le même métier ?', a: 'Ce sont deux métiers complémentaires. Le couvreur pose les éléments de couverture (tuiles, ardoises, bac acier), tandis que le zingueur se spécialise dans les éléments métalliques d\'évacuation d\'eau et d\'étanchéité : gouttières, chéneaux, noues, solins, abergements de cheminée et habillages de lucarne. Beaucoup d\'artisans cumulent les deux compétences (couvreur-zingueur).' },
      { q: 'Combien coûte la réparation d\'un solin de cheminée ?', a: 'La réparation d\'un solin de cheminée coûte entre 200 et 600 € selon l\'accessibilité et l\'étendue des dégâts. Le solin assure l\'étanchéité entre la cheminée et la toiture : s\'il est fissuré ou décollé, l\'eau s\'infiltre directement dans la charpente. C\'est une réparation à ne jamais différer pour éviter des dommages structurels coûteux.' },
    ],
    emergencyInfo:
      'En cas de débordement de gouttière, descente d\'eau arrachée ou fuite au niveau des raccords de toiture, contactez un zingueur d\'urgence pour une réparation provisoire. Disponibilité et délais variables. Majorations : +60 à 100 % la nuit et le week-end.',
    certifications: ['Qualibat (qualification 3121/3122 couverture-zinguerie)', 'Compagnons du Devoir (formation d\'excellence)', 'Certification VMZINC Installateur (partenaire fabricant)', 'Qualibat 3511 (zinguerie)', 'Compagnons du Tour de France', 'Certification couvreur-zingueur', 'NF DTU 40.5 (travaux de zinguerie)', 'Assurance décennale obligatoire'],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 2 semaines',
  },

  etancheiste: {
    slug: 'etancheiste',
    name: 'Étanchéiste',
    priceRange: { min: 40, max: 100, unit: '€/m²' },
    commonTasks: [
      'Étanchéité toiture-terrasse (membrane bitume) : 40 à 80 €/m²',
      'Étanchéité PVC/EPDM : 50 à 100 €/m²',
      'Étanchéité de balcon/loggia : 60 à 120 €/m²',
      'Cuvelage de sous-sol : 150 à 300 €/m²',
      'Traitement d\'infiltrations : 50 à 200 €/m²',
      'Étanchéité toiture terrasse membrane EPDM : 50 à 120 €/m²',
      'Étanchéité fondations (murs enterrés) : 40 à 80 €/ml',
      'Étanchéité douche italienne (système d\'étanchéité liquide SPEC) : 300 à 600 €',
      'Réparation de fissures de façade avec traitement d\'étanchéité : 30 à 60 €/ml',
      'Pose de drain périphérique : 80 à 150 €/ml',
    ],
    tips: [
      'L\'étanchéité d\'un toit-terrasse doit être contrôlée tous les 5 ans. Un défaut mineur non traité peut entraîner des dommages structurels majeurs.',
      'Pour les terrasses accessibles, privilégiez une membrane EPDM (durée de vie 40 ans+) plutôt qu\'un bitume classique.',
      'Demandez un test d\'étanchéité (mise en eau) après les travaux : l\'étanchéiste remplit la terrasse de quelques centimètres d\'eau pendant 48 à 72h pour vérifier l\'absence de fuite.',
      'Coupler l\'étanchéité avec une isolation thermique (toiture chaude) est plus rentable que de faire les deux séparément et ouvre droit aux aides MaPrimeRénov\'.',
      'Vérifiez que l\'étanchéiste possède une garantie décennale spécifique à l\'étanchéité (et pas seulement une garantie généraliste bâtiment) pour être correctement couvert en cas de sinistre.',
      'Ne négligez jamais l\'étanchéité d\'une douche italienne : c\'est le premier poste de sinistre en assurance habitation. Un défaut d\'étanchéité sous le receveur provoque des dégâts des eaux invisibles pendant des mois.',
      'Vérifiez l\'étanchéité de votre toiture terrasse après chaque hiver : le gel, la neige et les écarts de température fragilisent les membranes et les relevés d\'étanchéité.',
      'Un drain périphérique bien posé protège vos fondations pour 30 ans minimum. C\'est un investissement rentable qui évite des travaux de cuvelage beaucoup plus coûteux par la suite.',
    ],
    faq: [
      { q: 'Quelle garantie pour des travaux d\'étanchéité ?', a: 'Les travaux d\'étanchéité sont couverts par la garantie décennale (10 ans). De plus, la plupart des fabricants de membranes offrent une garantie produit de 15 à 25 ans. Exigez les attestations d\'assurance et de garantie fabricant.' },
      { q: 'Quelle est la durée de vie d\'une étanchéité de toit-terrasse ?', a: 'Une membrane bitume SBS dure 20 à 30 ans, une membrane EPDM (caoutchouc synthétique) atteint 40 à 50 ans, et une résine d\'étanchéité liquide (SEL) offre 20 à 25 ans de protection. La durée de vie dépend aussi de l\'entretien : un nettoyage annuel et une inspection bisannuelle prolongent significativement la longévité du complexe.' },
      { q: 'Comment savoir si mon toit-terrasse a un problème d\'étanchéité ?', a: 'Les signes révélateurs sont : traces d\'humidité ou auréoles au plafond de l\'étage inférieur, flaques stagnantes sur la terrasse après 48h sans pluie (défaut de pente), cloquage ou décollement de la membrane, végétation qui pousse dans les joints. Un diagnostic par un étanchéiste professionnel coûte 200 à 500 € et permet de cibler les réparations.' },
      { q: 'Qu\'est-ce qu\'un cuvelage de sous-sol ?', a: 'Le cuvelage est un traitement d\'étanchéité intérieur ou extérieur des murs enterrés pour stopper les infiltrations d\'eau dans un sous-sol. Il combine un enduit d\'imperméabilisation, un drainage périphérique et parfois une pompe de relevage. Le coût varie de 150 à 300 €/m² de surface traitée. C\'est la solution définitive pour un sous-sol humide.' },
      { q: 'Peut-on végétaliser un toit-terrasse étanchéifié ?', a: 'Oui, à condition que la structure porte le surpoids (80 à 150 kg/m² selon le type de végétalisation) et que l\'étanchéité soit anti-racines (membrane bitume avec voile de verre ou EPDM). La végétalisation extensive (sedum) est la plus légère et la moins exigeante en entretien. Elle prolonge la durée de vie de l\'étanchéité en la protégeant des UV.' },
      { q: 'Quelle membrane choisir pour une toiture terrasse ?', a: 'L\'EPDM (caoutchouc synthétique) offre une durée de vie de 50 ans avec très peu d\'entretien, c\'est le choix premium. Le bitume SBS est moins cher mais dure 20 à 30 ans et nécessite un entretien plus régulier. Le PVC offre un bon rapport qualité-prix avec 25 à 35 ans de durée de vie. Le choix dépend du budget, de la surface et de l\'accessibilité de la terrasse.' },
      { q: 'Mon sous-sol est humide : faut-il un cuvelage ?', a: 'Si les infiltrations sont latérales (eau qui traverse les murs enterrés), le cuvelage est la solution définitive. Il consiste à créer une chemise étanche à l\'intérieur des murs du sous-sol, combinant enduit d\'imperméabilisation, drainage et parfois pompe de relevage. Le coût varie de 150 à 300 €/m² de surface traitée. Un simple traitement hydrofuge de surface ne suffira pas face à une pression hydrostatique.' },
      { q: 'L\'étanchéité est-elle couverte par la garantie décennale ?', a: 'Oui, l\'étanchéité fait partie du gros œuvre et relève de la garantie décennale (10 ans). Les sinistres liés à un défaut d\'étanchéité sont d\'ailleurs les plus fréquents en assurance décennale. L\'étanchéiste doit vous remettre son attestation d\'assurance décennale avant le début des travaux. Conservez-la précieusement : elle vous protège pendant 10 ans en cas d\'infiltration.' },
    ],
    emergencyInfo:
      'En cas d\'infiltration d\'eau majeure par la toiture-terrasse ou le sous-sol, un étanchéiste peut réaliser une réparation provisoire d\'urgence pour stopper les dégâts. Disponibilité et délais variables. Majorations : +60 à 100 % en dehors des heures ouvrées.',
    certifications: ['Qualibat (qualification 1311/1312 étanchéité)', 'Certification ASQUAL (géomembranes et étanchéité)', 'RGE (obligatoire si isolation thermique associée — toiture chaude)', 'Qualibat 3191 (étanchéité toitures-terrasses)', 'Qualibat 3192 (étanchéité façades)', 'Certification CSFE (Chambre Syndicale Française de l\'Étanchéité)', 'Label RGE pour travaux d\'étanchéité couplés à l\'isolation thermique', 'Assurance décennale obligatoire spécifique à l\'étanchéité'],
    averageResponseTime: 'Devis sous 1 semaine, intervention sous 2 à 3 semaines',
  },

  facadier: {
    slug: 'facadier',
    name: 'Façadier',
    priceRange: { min: 30, max: 100, unit: '€/m²' },
    commonTasks: [
      'Ravalement de façade (enduit) : 30 à 70 €/m²',
      'Isolation thermique par l\'extérieur (ITE) : 100 à 200 €/m²',
      'Peinture de façade : 20 à 45 €/m²',
      'Nettoyage haute pression : 10 à 25 €/m²',
      'Traitement anti-mousse et hydrofuge : 15 à 30 €/m²',
      'Ravalement complet (nettoyage + enduit + peinture) : 40 à 100 €/m²',
      'Crépi ou enduit décoratif (taloché, gratté, ribbé) : 30 à 60 €/m²',
      'Reprise de fissures structurelles avec agrafage : 30 à 80 €/ml',
    ],
    tips: [
      'Un ravalement de façade est obligatoire tous les 10 ans dans certaines communes. Renseignez-vous auprès de votre mairie.',
      'Profitez d\'un ravalement pour ajouter une isolation par l\'extérieur (ITE) et bénéficier des aides MaPrimeRénov\'.',
      'Vérifiez les arrêtés municipaux sur les couleurs autorisées pour votre façade : les ABF (Architectes des Bâtiments de France) imposent des teintes spécifiques dans les zones protégées.',
      'Avant un ravalement, faites diagnostiquer les fissures : une fissure structurelle nécessite un traitement des fondations avant toute remise en état de la façade.',
      'Privilégiez les mois de printemps et d\'automne pour le ravalement : les enduits ne doivent pas être appliqués en dessous de 5 °C ni au-dessus de 35 °C.',
      'Le ravalement est l\'occasion idéale de faire une ITE : l\'échafaudage est déjà en place, ce qui réduit le coût global d\'environ 30 %.',
      'Un diagnostic façade préalable (500 à 1 000 €) permet d\'identifier les désordres cachés (infiltrations, décollement d\'enduit, carbonatation du béton) et d\'éviter les mauvaises surprises en cours de chantier.',
      'Vérifiez les obligations communales de ravalement : certaines mairies envoient des mises en demeure avec astreintes financières de 50 à 200 € par jour de retard si les travaux ne sont pas engagés dans le délai imparti.',
    ],
    faq: [
      { q: 'Combien coûte un ravalement de façade pour une maison ?', a: 'Pour une maison de 100 m² de façade, comptez entre 5 000 et 15 000 € selon l\'état du support, le type d\'enduit et la nécessité d\'un échafaudage. Avec ITE, le budget monte à 15 000 à 25 000 € mais les aides peuvent couvrir jusqu\'à 40 %.' },
      { q: 'Le ravalement de façade est-il obligatoire ?', a: 'Dans les communes ayant pris un arrêté en ce sens, le ravalement est obligatoire tous les 10 ans (article L132-1 du Code de la construction). La mairie peut vous mettre en demeure de réaliser les travaux sous 6 mois. En copropriété, le ravalement est voté en assemblée générale à la majorité absolue.' },
      { q: 'Quelles aides financières pour un ravalement de façade ?', a: 'Un ravalement simple n\'ouvre pas droit aux aides. En revanche, si vous ajoutez une isolation thermique par l\'extérieur (ITE), vous pouvez bénéficier de MaPrimeRénov\' (jusqu\'à 75 €/m²), des CEE (prime énergie), de l\'éco-PTZ et de la TVA à 5,5 %. Certaines communes accordent aussi des subventions pour l\'embellissement des façades.' },
      { q: 'Combien de temps durent les travaux de ravalement ?', a: 'Pour une maison individuelle, le ravalement dure 2 à 4 semaines selon la surface et le type de traitement (nettoyage simple, enduit, ITE). L\'installation de l\'échafaudage prend 1 à 2 jours. Prévoyez que l\'échafaudage restera en place pendant toute la durée du chantier, ce qui peut gêner l\'accès au jardin ou au parking.' },
      { q: 'Quelle différence entre enduit monocouche et enduit traditionnel ?', a: 'L\'enduit monocouche (ou enduit projeté) s\'applique en une seule passe à la machine et coûte 25 à 50 €/m². L\'enduit traditionnel se pose en 3 couches à la main (gobetis, corps d\'enduit, finition) et revient à 40 à 70 €/m². Le traditionnel offre une meilleure durabilité et un rendu plus authentique, mais il est plus long à mettre en œuvre.' },
      { q: 'Combien coûte une ITE (isolation thermique par l\'extérieur) ?', a: 'L\'ITE coûte entre 120 et 200 €/m² fourniture et pose comprises, selon l\'isolant choisi (polystyrène expansé, laine de roche, fibre de bois) et la finition (enduit mince, bardage). Pour une maison de 100 m² de façade, le budget se situe entre 12 000 et 20 000 €. Les aides MaPrimeRénov\' peuvent atteindre 75 €/m² et les primes CEE 10 à 15 €/m², réduisant significativement le reste à charge.' },
      { q: 'Faut-il une autorisation pour un ravalement de façade ?', a: 'Oui, une déclaration préalable de travaux est obligatoire dans la plupart des communes (article R421-17-a du Code de l\'urbanisme). En zone protégée (ABF, site classé, AVAP), l\'accord de l\'Architecte des Bâtiments de France est requis, ce qui allonge le délai d\'instruction à 2 mois au lieu d\'1 mois. L\'absence de déclaration expose à une amende pouvant atteindre 6 000 €/m² de surface concernée.' },
      { q: 'Comment choisir entre un crépi et une peinture de façade ?', a: 'Le crépi (enduit projeté ou taloché) est idéal pour masquer les irrégularités du support et offre une durabilité de 20 à 30 ans pour un coût de 30 à 60 €/m². La peinture de façade (20 à 40 €/m²) convient aux supports déjà en bon état et se renouvelle tous les 10 à 15 ans. Pour une façade très dégradée, l\'enduit est préférable ; pour un simple rafraîchissement, la peinture suffit.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour le ravalement de façade. Les travaux de façade nécessitent un échafaudage et une déclaration préalable en mairie. Prenez rendez-vous pour un devis gratuit sous 1 semaine.',
    certifications: ['Qualibat (qualification 6111/6112 ravalement, 7131/7132 ITE)', 'RGE (obligatoire pour l\'ITE — isolation thermique par l\'extérieur)', 'Certification applicateur Sto, Weber ou Parex-Lanko (partenaires fabricants)', 'Qualibat 7131 (ravalement de façade — enduits et peintures)', 'Qualibat 7132 (ITE — isolation thermique par l\'extérieur)', 'NF DTU 42.1 (référentiel peinture de façade — conformité technique)', 'Assurance décennale (obligatoire pour tous travaux de façade et d\'ITE)', 'Certification ACQPA (application de peintures anticorrosion et de protection)'],
    averageResponseTime: 'Devis sous 1 semaine, intervention sous 2 à 6 semaines',
  },

  platrier: {
    slug: 'platrier',
    name: 'Plâtrier',
    priceRange: { min: 25, max: 55, unit: '€/m²' },
    commonTasks: [
      'Pose de cloisons en plaques de plâtre : 30 à 55 €/m²',
      'Faux-plafond en plaques de plâtre : 35 à 65 €/m²',
      'Doublage isolant (plaque + isolant) : 40 à 80 €/m²',
      'Enduit plâtre traditionnel : 25 à 45 €/m²',
      'Staff et corniche décorative : 30 à 100 €/ml',
      'Pose de plaques de plâtre (BA13) : 25 à 45 €/m²',
      'Enduit de lissage : 15 à 30 €/m²',
      'Ratissage murs avant peinture : 10 à 20 €/m²',
      'Bandes et joints de placo : 8 à 15 €/ml',
    ],
    tips: [
      'Pour les pièces humides (salle de bain, cuisine), exigez des plaques hydrofuges (vertes) et non des plaques standard.',
      'Un plâtrier-plaquiste expérimenté réalise des joints invisibles. Vérifiez la qualité des finitions sur des chantiers précédents.',
      'Pour une isolation acoustique efficace entre deux pièces, demandez une cloison double parement (2 plaques de chaque côté) avec laine minérale de 45 mm minimum dans l\'ossature.',
      'Les plaques de plâtre existent en version coupe-feu (rose, résistance 1 à 2 heures), hydrofuge (verte) et haute dureté (bleue). Choisissez la bonne référence selon l\'usage de la pièce.',
      'Pour un faux-plafond, demandez un plâtrier qui utilise des suspentes anti-vibratiles : elles réduisent considérablement la transmission des bruits d\'impact venant de l\'étage supérieur.',
      'Le placo phonique (Placo Phonique ou similaire) réduit le bruit de 50 % par rapport au BA13 standard : un investissement rentable pour les chambres et les pièces de vie.',
      'Prévoyez les boîtiers électriques AVANT la pose des plaques : les découpes après coup fragilisent le placo et compliquent le travail de l\'électricien.',
      'Un bon plâtrier fait les bandes invisibles dès la première passe. Si vous voyez des surépaisseurs ou des traces de ponçage excessif, c\'est le signe d\'un manque de savoir-faire.',
    ],
    faq: [
      { q: 'Plaque de plâtre ou enduit traditionnel ?', a: 'Les plaques de plâtre (BA13) sont plus rapides à poser et moins chères (30-55 €/m²). L\'enduit traditionnel offre une meilleure inertie thermique et acoustique mais coûte plus cher en main-d\'œuvre. Pour une rénovation, les plaques sont souvent privilégiées ; pour du neuf haut de gamme, l\'enduit traditionnel.' },
      { q: 'Quelle épaisseur de cloison pour une bonne isolation phonique ?', a: 'Une cloison standard en BA13 (72 mm total) offre un affaiblissement de 35 à 40 dB. Pour une isolation phonique correcte entre deux chambres, optez pour une cloison de 98 mm (ossature 48 mm + 2 plaques de 13 mm + laine 45 mm) qui atteint 42 à 48 dB. Pour un mur mitoyen ou un studio de musique, une double cloison désolidarisée (160 mm) atteint 55 à 60 dB.' },
      { q: 'Comment réparer une fissure dans un plafond en plâtre ?', a: 'Pour une fissure superficielle, grattez la fissure en V, appliquez un calicot (bande à fissure) enduit de MAP ou d\'enduit de lissage. Pour une fissure structurelle (qui s\'ouvre progressivement), faites d\'abord diagnostiquer la cause (mouvement de structure, tassement) avant de réparer le plâtre. Une réparation cosmétique sur une fissure active réapparaîtra en quelques mois.' },
      { q: 'Combien de temps faut-il pour poser un faux-plafond ?', a: 'Un plâtrier expérimenté pose environ 15 à 25 m² de faux-plafond par jour. Pour une maison de 80 m², comptez 4 à 6 jours (ossature + plaques + bandes). Ajoutez 1 à 2 jours pour les finitions (enduit de lissage, ponçage). Les découpes pour spots encastrés et VMC sont incluses dans ce délai.' },
      { q: 'Quelle est la hauteur minimale pour un faux-plafond ?', a: 'La hauteur sous plafond minimale habitable est de 2,20 m selon le Code de la construction. Un faux-plafond standard consomme 5 à 10 cm de hauteur (suspentes + ossature + plaque). Si vous prévoyez des spots encastrés, comptez 10 à 15 cm. Pour un passage de gaines de VMC ou de climatisation, il faudra 20 à 30 cm.' },
      { q: 'Placo standard ou hydrofuge : lequel choisir ?', a: 'Le BA13 standard (blanc) convient aux pièces sèches (chambres, salon, couloirs). Le BA13H (vert) est hydrofuge et obligatoire dans les pièces humides (salle de bain, cuisine, buanderie). Le BA13I (rose) est ignifuge et recommandé pour les cloisons de chaufferie, les gaines techniques et les locaux à risque incendie. Le surcoût du BA13H par rapport au standard est d\'environ 2 à 3 €/m².' },
      { q: 'Peut-on accrocher des charges lourdes sur du placo ?', a: 'Avec des chevilles Molly (chevilles à expansion métalliques), vous pouvez suspendre jusqu\'à 30 kg par point de fixation sur du BA13 standard. Pour des charges plus lourdes (meubles de cuisine, téléviseur, ballon d\'eau chaude), utilisez des plaques renforcées type Habito (Placo) qui supportent jusqu\'à 80 kg sans chevilles spéciales. Au-delà, prévoyez des renforts en bois ou en métal dans l\'ossature lors de la pose.' },
      { q: 'Combien de temps pour monter une cloison placo ?', a: 'Un plâtrier-plaquiste expérimenté monte une cloison simple de 10 m² en une journée (ossature métallique + plaques + vissage). Comptez 2 à 3 jours supplémentaires pour une cloison avec isolation intégrée et finition complète (bandes, enduit de lissage, ponçage). Le temps de séchage des enduits (24 à 48 h entre chaque couche) allonge le planning global.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la plâtrerie. Pour les réparations de cloisons, faux-plafonds ou enduits, prenez rendez-vous pour un devis gratuit sous 48h.',
    certifications: ['Qualibat (qualification 4111/4112 plâtrerie, cloisons et doublages)', 'Certification Placo Applicateur (partenaire Saint-Gobain)', 'RGE (obligatoire si doublage isolant ouvrant droit aux aides)', 'Qualibat 4121 (plâtrerie — enduits et ouvrages en plâtre)', 'NF DTU 25.41 (cloisons en plaques de plâtre sur ossature métallique)', 'Certification Plaquiste agréé Placo/Saint-Gobain', 'Label RGE (si isolation intégrée aux doublages — accès aux aides CEE et MaPrimeRénov\')', 'Assurance décennale obligatoire (garantie 10 ans sur cloisons, doublages et faux-plafonds)'],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 2 semaines',
  },

  metallier: {
    slug: 'metallier',
    name: 'Métallier',
    priceRange: { min: 150, max: 400, unit: '€/ml' },
    commonTasks: [
      'Escalier métallique sur mesure : 3 000 à 12 000 €',
      'Garde-corps en acier/inox : 150 à 400 €/ml',
      'Verrière d\'intérieur : 800 à 2 500 €/m²',
      'Porte d\'entrée en acier : 1 500 à 5 000 €',
      'Pergola métallique : 3 000 à 8 000 €',
      'Structure métallique (mezzanine, extension) : 200 à 400 €/m²',
      'Portail coulissant motorisé : 2 000 à 6 000 €',
      'Charpente métallique industrielle : 80 à 150 €/m²',
    ],
    tips: [
      'L\'acier thermolaqué offre le meilleur rapport qualité/prix pour les ouvrages extérieurs. L\'inox est réservé aux environnements corrosifs (bord de mer).',
      'Demandez des plans cotés et une maquette 3D avant la fabrication pour valider les dimensions exactes.',
      'Pour un garde-corps, vérifiez que le métallier respecte la norme NF P01-012 : hauteur minimale de 1 m, espacement des barreaux de 11 cm maximum et absence de point d\'escalade pour les enfants.',
      'Prévoyez un accès suffisant pour la livraison et la manutention : un escalier métallique ou une verrière arrive souvent en éléments de grande dimension qui nécessitent un passage adapté.',
      'Demandez au métallier de vous fournir une note de calcul pour les ouvrages structurels (escaliers, mezzanines, passerelles) afin de garantir la conformité aux normes de résistance.',
      'Le thermolaquage (peinture poudre cuite au four à 200 °C) offre une finition 3 fois plus durable que la peinture liquide classique, avec une résistance supérieure aux UV, aux rayures et aux intempéries.',
      'Une verrière en acier nécessite un traitement antirouille tous les 10 ans environ. Inspectez les joints entre le métal et le vitrage et appliquez un produit anticorrosion dès l\'apparition de points de rouille.',
      'Demandez un plan 3D avant fabrication pour valider les proportions et l\'intégration dans votre espace — un ouvrage métallique fabriqué sur mesure ne peut pas être modifié une fois soudé.',
    ],
    faq: [
      { q: 'Combien coûte une verrière d\'intérieur ?', a: 'Une verrière atelier sur mesure coûte entre 800 et 2 500 €/m² selon le matériau (acier, aluminium), le type de vitrage (simple, double, feuilleté) et la complexité de la pose. Une verrière standard de 2 m × 1,5 m revient à 2 500 à 5 000 €, pose comprise.' },
      { q: 'Acier, inox ou aluminium : quel métal choisir ?', a: 'L\'acier est le plus polyvalent et le moins cher, idéal pour la plupart des ouvrages intérieurs et extérieurs (avec traitement thermolaqué). L\'inox (304 ou 316) résiste à la corrosion sans entretien, parfait pour les bords de mer ou de piscine, mais coûte 2 à 3 fois plus cher. L\'aluminium est léger et ne rouille pas, adapté aux menuiseries et grandes portées.' },
      { q: 'Combien coûte un escalier métallique sur mesure ?', a: 'Un escalier droit en acier thermolaqué revient à 3 000 à 6 000 €, un quart-tournant à 5 000 à 8 000 € et un escalier hélicoïdal à 6 000 à 12 000 €. Le prix augmente avec les finitions (marches en bois, verre ou acier), le type de garde-corps et la complexité de la pose. Prévoyez 4 à 6 semaines de fabrication.' },
      { q: 'Une verrière d\'intérieur isole-t-elle du bruit ?', a: 'Avec un simple vitrage (6 mm), l\'isolation acoustique est faible (environ 25 dB). Un double vitrage 4/16/4 atteint 30 à 35 dB, ce qui est acceptable pour séparer une cuisine d\'un salon. Pour une véritable isolation phonique (bureau, chambre), optez pour un vitrage acoustique feuilleté 44.2 qui offre 37 à 42 dB d\'affaiblissement.' },
      { q: 'Faut-il un permis de construire pour une pergola métallique ?', a: 'Une pergola de moins de 5 m² est dispensée de formalités. Entre 5 et 20 m² (ou 40 m² en zone PLU), une déclaration préalable de travaux suffit. Au-delà de 20 m² (ou 40 m²), un permis de construire est nécessaire. En zone protégée (ABF), toute pergola nécessite au minimum une déclaration préalable, quelle que soit la surface.' },
      { q: 'Peut-on mélanger métal et bois dans un ouvrage ?', a: 'Oui, c\'est une tendance très actuelle en architecture intérieure et extérieure. Le métal apporte la structure et la rigidité, tandis que le bois ajoute chaleur et confort visuel. Les combinaisons les plus populaires sont l\'escalier métal-bois (structure acier + marches en chêne), la mezzanine sur ossature métallique avec plancher bois et le garde-corps acier avec main courante en bois. Prévoyez un budget de 10 à 20 % supérieur à un ouvrage tout métal.' },
      { q: 'Combien coûte un portail coulissant motorisé en métal ?', a: 'Un portail coulissant motorisé en acier thermolaqué coûte entre 2 000 et 6 000 € tout compris (portail + rail + motorisation + pose). Le prix varie selon la largeur (3 à 5 m), le design (plein, ajouré, à lames) et la motorisation choisie. Prévoyez un massif béton pour le rail de guidage et une alimentation électrique enterrée. Le délai de fabrication est de 3 à 5 semaines.' },
      { q: 'Qu\'est-ce qu\'une structure métallique pour mezzanine et combien ça coûte ?', a: 'Une mezzanine sur structure métallique consiste en un plancher surélevé porté par des poteaux et des poutres en acier (IPN ou HEA). Le coût se situe entre 200 et 400 €/m² pour la structure seule, hors plancher et finitions. Pour une mezzanine de 15 m², comptez 4 500 à 8 000 € tout compris. Une note de calcul est obligatoire pour valider la portée et le dimensionnement des profilés selon les charges d\'exploitation prévues.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la métallerie. Les ouvrages métalliques (escaliers, garde-corps, verrières) sont fabriqués sur mesure en atelier. Prenez rendez-vous pour un devis gratuit sous 1 semaine.',
    certifications: ['Qualibat (qualification 4411/4412 métallerie-serrurerie)', 'Certification EN 1090 (exécution des structures en acier — marquage CE)', 'Label Artisanat d\'Art (ouvrages décoratifs)', 'ACQPA (qualification peinture anticorrosion — si thermolaquage)', 'Certification soudure EN ISO 9606 (qualification du soudeur)', 'Qualification CTICM (Centre Technique Industriel de la Construction Métallique)', 'Compagnons du Tour de France (parcours de formation itinérant d\'excellence)', 'Assurance décennale obligatoire (garantie 10 ans sur les ouvrages structurels)'],
    averageResponseTime: 'Devis sous 1 semaine, fabrication 3 à 6 semaines',
  },

  ferronnier: {
    slug: 'ferronnier',
    name: 'Ferronnier',
    priceRange: { min: 200, max: 600, unit: '€/ml' },
    commonTasks: [
      'Portail en fer forgé sur mesure : 2 000 à 8 000 €',
      'Grille de fenêtre : 150 à 500 €/unité',
      'Rampe d\'escalier en fer forgé : 200 à 600 €/ml',
      'Table ou mobilier en fer forgé : 500 à 3 000 €',
      'Restauration d\'ouvrages anciens : sur devis',
      'Fabrication de grille de défense pour fenêtre : 200 à 600 €/fenêtre',
      'Garde-corps d\'escalier ou de balcon en fer forgé : 150 à 400 €/ml',
      'Marquise ou auvent en fer forgé : 800 à 3 000 €',
    ],
    tips: [
      'La ferronnerie d\'art est un métier rare — les délais de fabrication sont souvent longs (4 à 8 semaines). Anticipez vos projets.',
      'Pour les ouvrages extérieurs, exigez un traitement anticorrosion par galvanisation à chaud avant mise en peinture.',
      'Demandez à voir le book de réalisations du ferronnier : chaque artisan a un style propre (contemporain, classique, art déco). Assurez-vous que son esthétique correspond à votre projet.',
      'Le fer forgé nécessite un entretien régulier : appliquez une peinture antirouille tous les 5 à 7 ans pour les ouvrages extérieurs afin de préserver l\'aspect et la solidité.',
      'Pour un portail en fer forgé motorisé, prévoyez les gaines électriques dans les piliers avant la pose du portail — les ajouter après est beaucoup plus coûteux.',
      'La métallisation à chaud (projection de zinc) offre une protection anticorrosion de 20 ans et plus sans entretien, bien supérieure à la simple peinture antirouille.',
      'Demandez un échantillon de finition (patine, thermolaquage, cirage) avant de valider la commande — le rendu final varie considérablement selon la technique employée.',
      'Les délais de fabrication en atelier sont de 4 à 8 semaines en moyenne : planifiez votre projet en amont, surtout au printemps quand les carnets de commandes sont pleins.',
    ],
    faq: [
      { q: 'Quelle est la différence entre un ferronnier et un métallier ?', a: 'Le ferronnier travaille principalement le fer forgé à chaud (forge traditionnelle) pour des ouvrages décoratifs et artistiques. Le métallier travaille l\'acier, l\'inox et l\'aluminium à froid (soudure, pliage) pour des ouvrages structurels. En pratique, beaucoup d\'artisans maîtrisent les deux techniques.' },
      { q: 'Combien coûte un portail en fer forgé ?', a: 'Un portail en fer forgé sur mesure coûte entre 2 000 et 8 000 € selon les dimensions, la complexité du motif et le type de finition. Un portail battant standard (3 m de largeur) revient à 2 500 à 4 500 €, tandis qu\'un modèle très ouvragé avec volutes et pointes peut atteindre 6 000 à 8 000 €. Ajoutez 1 000 à 2 500 € pour la motorisation.' },
      { q: 'Le fer forgé est-il adapté en bord de mer ?', a: 'Le fer forgé supporte mal les environnements salins sans traitement adapté. Pour le bord de mer, exigez une galvanisation à chaud (immersion dans un bain de zinc à 450 °C) suivie d\'une peinture époxy marine. Ce traitement double le coût de la finition mais garantit 20 à 30 ans de tenue. Alternativement, optez pour de l\'inox 316L ou de l\'aluminium.' },
      { q: 'Peut-on restaurer une rampe ou un portail ancien en fer forgé ?', a: 'Oui, un ferronnier spécialisé en restauration peut décaper, redresser et ressouder des ouvrages anciens. La restauration coûte généralement 30 à 60 % du prix d\'un ouvrage neuf équivalent, tout en préservant le cachet d\'origine. Le ferronnier peut aussi reproduire à l\'identique les éléments manquants (volutes, rosaces). Comptez 4 à 8 semaines de travail en atelier.' },
      { q: 'Le fer forgé est-il plus solide que l\'acier soudé ?', a: 'Le fer forgé traditionnel (travaillé à la forge à 900-1200 °C) offre une structure fibreuse très résistante à la fatigue et aux chocs. L\'acier soudé industriel est plus rigide mais les soudures constituent des points de faiblesse potentiels. Pour un garde-corps ou un portail, les deux techniques offrent une solidité largement suffisante. Le fer forgé se distingue surtout par son esthétique unique.' },
      { q: 'Fer forgé ou aluminium pour un portail ?', a: 'Le fer forgé est artisanal, durable et noble : chaque portail est unique, avec une durée de vie de 50 ans et plus. En revanche, il nécessite un entretien anticorrosion régulier (tous les 5 à 7 ans). L\'aluminium est léger, sans entretien et résistant à la corrosion, mais son aspect reste industriel et standardisé. Le fer forgé est un choix patrimonial, l\'aluminium un choix pratique.' },
      { q: 'Combien coûte un garde-corps en fer forgé ?', a: 'Un garde-corps en fer forgé coûte entre 150 et 400 €/ml selon la complexité du motif, pose incluse. Pour un balcon standard de 3 à 4 mètres linéaires, comptez 1 500 à 4 000 € tout compris. Un modèle simple à barreaux droits sera en bas de fourchette, tandis qu\'un ouvrage avec volutes, feuillages ou motifs personnalisés se situera en haut de gamme.' },
      { q: 'La ferronnerie d\'art est-elle éligible aux aides de l\'État ?', a: 'Les ouvrages purement décoratifs (mobilier, sculptures) ne sont pas éligibles aux aides. En revanche, les grilles de défense pour fenêtres peuvent relever de la sécurisation du logement. Par ailleurs, tous les travaux de ferronnerie en rénovation d\'un logement de plus de 2 ans bénéficient d\'une TVA réduite à 10 % au lieu de 20 %, ce qui représente une économie significative sur des ouvrages coûteux.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la ferronnerie d\'art. Les ouvrages en fer forgé sont fabriqués sur mesure en atelier et nécessitent un délai de fabrication de 4 à 8 semaines. Prenez rendez-vous pour un devis gratuit sous 1 semaine.',
    certifications: ['Label Entreprise du Patrimoine Vivant (EPV — délivré par l\'État)', 'Titre de Maître Artisan en métier d\'art (Chambre de Métiers)', 'Compagnons du Devoir (formation d\'excellence)', 'Qualibat (qualification 4411 métallerie-serrurerie)', 'Compagnons du Tour de France (parcours de formation itinérant)', 'Certification soudure EN ISO 9606 (qualification du soudeur)', 'Assurance décennale obligatoire (garantie 10 ans sur les ouvrages structurels)', 'Label Maître Artisan en Métier d\'Art (délivré par la Chambre de Métiers et de l\'Artisanat)'],
    averageResponseTime: 'Devis sous 1 semaine, fabrication 4 à 8 semaines',
  },

  'poseur-de-parquet': {
    slug: 'poseur-de-parquet',
    name: 'Poseur de parquet',
    priceRange: { min: 25, max: 80, unit: '€/m²' },
    commonTasks: [
      'Pose de parquet flottant : 25 à 40 €/m²',
      'Pose de parquet massif collé : 40 à 80 €/m²',
      'Pose de parquet massif cloué : 50 à 90 €/m²',
      'Ponçage et vitrification : 25 à 45 €/m²',
      'Pose en point de Hongrie ou Versailles : 80 à 150 €/m²',
    ],
    tips: [
      'Laissez le parquet s\'acclimater 48h minimum dans la pièce avant la pose, pour éviter les déformations.',
      'Pour un parquet massif dans une pièce humide, optez pour des essences exotiques (teck, ipé) naturellement résistantes à l\'eau.',
      'Choisissez une finition adaptée à votre usage : la vitrification est la plus résistante pour un couloir ou un séjour très fréquenté, tandis que l\'huile donne un toucher plus naturel et se rénove localement.',
      'Vérifiez que le support est parfaitement plan avant la pose (tolérance de 3 mm sous une règle de 2 m) — un ragréage peut être nécessaire et doit être prévu dans le devis.',
      'Demandez au poseur de laisser un joint de dilatation périphérique de 8 à 10 mm le long des murs. Ce joint, caché par les plinthes, est indispensable pour que le bois puisse travailler avec les variations d\'humidité.',
    ],
    faq: [
      { q: 'Parquet massif, contrecollé ou stratifié ?', a: 'Le parquet massif (30-80 €/m² hors pose) se ponce et se rénove plusieurs fois, durant 50 à 100 ans. Le contrecollé (25-60 €/m²) se ponce 1 à 3 fois et dure 30 ans. Le stratifié (10-25 €/m²) ne se ponce pas et dure 10 à 20 ans. Le massif est un investissement, le stratifié un compromis économique.' },
      { q: 'Peut-on poser du parquet sur un plancher chauffant ?', a: 'Oui, à condition de choisir un parquet compatible. Le parquet contrecollé (épaisseur de parement 2,5 à 4 mm) est le plus adapté car il se déforme peu. Le parquet massif est possible si l\'épaisseur reste sous 15 mm. Évitez les essences sensibles (hêtre, érable) et privilégiez le chêne. La pose collée en plein est obligatoire — la pose flottante est déconseillée sur plancher chauffant.' },
      { q: 'Combien coûte un ponçage-vitrification de parquet ?', a: 'Le ponçage-vitrification coûte entre 25 et 45 €/m² pour un parquet en bon état (3 passes de ponçage + 2 couches de vitrification). Si le parquet est très abîmé ou taché, un rebouchage des joints et des trous ajoute 5 à 10 €/m². Pour un appartement de 60 m², le budget total est de 1 800 à 3 300 €. Le chantier dure 3 à 5 jours avec un séchage de 24 à 48h après la dernière couche.' },
      { q: 'Quelle pose choisir : flottante, collée ou clouée ?', a: 'La pose flottante (clipsée sur sous-couche) est la plus rapide et la moins chère (15 à 25 €/m²), idéale pour le stratifié et le contrecollé. La pose collée (25 à 40 €/m²) offre un meilleur confort acoustique et convient au contrecollé et au massif mince. La pose clouée (35 à 50 €/m²) est la méthode traditionnelle pour le parquet massif sur lambourdes, offrant la meilleure longévité.' },
      { q: 'Comment entretenir un parquet au quotidien ?', a: 'Passez l\'aspirateur régulièrement avec une brosse douce (pas de brosse rotative). Nettoyez à la serpillère bien essorée avec un savon neutre. Évitez l\'eau stagnante et les produits agressifs (javel, ammoniaque). Pour un parquet vitrifié, appliquez un polish de rénovation une fois par an. Pour un parquet huilé, repassez une couche d\'huile d\'entretien tous les 6 à 12 mois sur les zones de passage.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la pose de parquet. La pose, le ponçage et la vitrification nécessitent des conditions de température et d\'humidité contrôlées. Prenez rendez-vous pour un devis gratuit sous 48h.',
    certifications: ['Qualibat (qualification 6421 parquets et revêtements en bois)', 'Label Parquets de France (origine et qualité de fabrication)', 'Compagnons du Devoir (formation d\'excellence)'],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 3 semaines',
  },

  miroitier: {
    slug: 'miroitier',
    name: 'Miroitier',
    priceRange: { min: 80, max: 250, unit: '€/m²' },
    commonTasks: [
      'Pose de miroir sur mesure : 80 à 200 €/m²',
      'Crédence de cuisine en verre : 150 à 350 €/m²',
      'Paroi de douche en verre trempé : 400 à 1 200 €',
      'Vitrine de commerce : 200 à 500 €/m²',
      'Remplacement de double vitrage : 150 à 400 €/m²',
      'Cloison vitrée ou verrière d\'intérieur : 200 à 500 €/m²',
      'Remplacement de miroir de salle de bain : 100 à 400 €',
      'Miroir décoratif biseauté sur mesure : 150 à 500 €/m²',
    ],
    tips: [
      'Pour les parois de douche et garde-corps, le verre trempé securit est obligatoire (norme NF EN 12150).',
      'Un miroir sur mesure avec bords polis et fixations invisibles coûte plus cher mais offre un rendu haut de gamme.',
      'En cas de bris de vitrage, sécurisez immédiatement la zone et bâchez l\'ouverture. Un miroitier d\'urgence peut intervenir sous 24 à 48h pour un remplacement provisoire ou définitif.',
      'Pour une crédence en verre, prévoyez les prises de mesure après la pose de la cuisine : les découpes pour les prises électriques et les interrupteurs doivent être millimétrées.',
      'Le verre feuilleté (deux verres collés par un film PVB) est obligatoire pour les garde-corps et les applications en hauteur. En cas de casse, les morceaux restent collés au film, évitant les blessures.',
      'Un miroir bien placé agrandit visuellement une pièce de 30 % — idéal pour les entrées et les petits salons.',
      'La crédence en verre laqué est plus hygiénique et facile d\'entretien que le carrelage : pas de joints, nettoyage en un coup d\'éponge.',
      'Faites toujours prendre les cotes par le miroitier lui-même : 1 mm d\'erreur suffit à rendre un miroir sur mesure inutilisable.',
    ],
    faq: [
      { q: 'Quelle épaisseur de verre pour une crédence ?', a: 'Une crédence de cuisine nécessite un verre trempé de 6 mm minimum (8 mm recommandé pour les grandes surfaces). Le verre laqué est le plus populaire car il offre un large choix de couleurs et se nettoie facilement. Budget : 150 à 350 €/m², pose comprise.' },
      { q: 'Combien coûte le remplacement d\'un double vitrage ?', a: 'Le remplacement d\'un double vitrage standard (4/16/4) coûte entre 150 et 300 €/m² pose comprise. Un vitrage à isolation renforcée (VIR ou ITR) revient à 200 à 400 €/m² mais réduit les déperditions thermiques de 40 %. Pour une fenêtre standard (1,2 m × 1 m), comptez 200 à 400 € tout compris. Le délai est de 1 à 2 semaines (fabrication sur mesure).' },
      { q: 'Verre trempé ou verre feuilleté : lequel choisir ?', a: 'Le verre trempé (securit) est 5 fois plus résistant que le verre ordinaire et se brise en petits morceaux non coupants. Il est obligatoire pour les parois de douche et les tables. Le verre feuilleté (deux verres + film PVB) ne tombe pas en morceaux à la casse : il est obligatoire pour les garde-corps, les toitures vitrées et les vitrines. Certaines applications exigent un verre trempé-feuilleté (cumul des deux propriétés).' },
      { q: 'Un miroitier peut-il intervenir en urgence ?', a: 'Oui, la plupart des miroitiers proposent un service d\'urgence pour les vitrines de commerce cassées, les fenêtres brisées après effraction ou les dégâts de tempête. L\'intervention sous 24h coûte 30 à 50 % de plus qu\'une intervention programmée. En attendant, bâchez l\'ouverture avec une bâche ou du contreplaqué pour sécuriser le local.' },
      { q: 'Comment choisir un miroir pour une salle de bain ?', a: 'Optez pour un miroir avec traitement anti-buée intégré (film chauffant au dos) et bords polis pour résister à l\'humidité. Évitez les miroirs bas de gamme dont le tain (couche réfléchissante) se dégrade rapidement en milieu humide. Un miroir sur mesure avec éclairage LED intégré coûte 200 à 800 € selon les dimensions et les options.' },
      { q: 'Quelle épaisseur de miroir choisir ?', a: '3 mm convient pour la décoration légère (cadres, petits miroirs décoratifs). 4 à 5 mm est le standard pour une salle de bain ou un miroir mural de taille moyenne. 6 mm et plus est recommandé pour les grands formats (miroir plein pied, miroir mural de plus d\'un mètre) ou les poses lourdes nécessitant une fixation mécanique.' },
      { q: 'Miroir argenté ou miroir aluminium : quelle différence ?', a: 'Le miroir argenté offre un reflet plus naturel et plus lumineux : c\'est le choix classique pour les salons, les chambres et les entrées. Le miroir aluminium résiste mieux à l\'humidité et à la corrosion : il est adapté aux salles de bain, aux piscines et aux environnements humides. L\'écart de prix est faible (10 à 15 % de plus pour l\'aluminium).' },
      { q: 'Peut-on poser un miroir sur un mur humide ?', a: 'Oui, à condition d\'utiliser un miroir avec traitement anti-humidité (tain protégé par une couche de cuivre ou d\'aluminium) et une colle spéciale type mastic-miroir neutre (ne pas utiliser de colle acide qui attaque le tain). Évitez le contact direct avec l\'eau : laissez un espace de 5 mm minimum entre le bas du miroir et la surface mouillée (plan de vasque, rebord de baignoire).' },
    ],
    emergencyInfo:
      'Intervention d\'urgence pour vitrine de commerce cassée, miroir brisé ou paroi de douche éclatée. Un miroitier d\'urgence peut sécuriser les lieux et poser un vitrage provisoire selon disponibilité. Majorations : +100 à 150 % la nuit et le week-end.',
    certifications: ['Qualibat 4423 (miroiterie)', 'Certification Cekal (vitrages isolants)', 'NF DTU 39 (mise en \u0153uvre des vitrages)', 'Label Artisan verrier', 'Assurance RC professionnelle', 'Qualibat (qualification 4311/4312 vitrerie-miroiterie)', 'Certification NF EN 12150 (verres de sécurité trempés)', 'Certification NF EN 1036 (miroirs argentés)'],
    averageResponseTime: 'Devis sous 48h, fabrication 1 à 3 semaines',
  },

  storiste: {
    slug: 'storiste',
    name: 'Storiste',
    priceRange: { min: 200, max: 800, unit: '€/unité' },
    commonTasks: [
      'Store banne motorisé : 800 à 3 000 €',
      'Volet roulant électrique : 300 à 800 €/fenêtre',
      'Store intérieur (vénitien, enrouleur) : 100 à 400 €',
      'Pergola bioclimatique : 5 000 à 15 000 €',
      'Motorisation de volets existants : 200 à 500 €/volet',
      'Store enrouleur intérieur (occultant ou tamisant) : 50 à 200 €',
      'Brise-soleil orientable (BSO) : 400 à 1 000 €/fenêtre',
      'Moustiquaire enroulable sur mesure : 100 à 300 €',
      'Store vénitien aluminium : 80 à 250 €',
      'Rideau métallique pour commerce : 1 500 à 4 000 €',
    ],
    tips: [
      'Pour les stores extérieurs, privilégiez une toile acrylique teinte masse (garantie 5 à 10 ans) plutôt qu\'une toile polyester qui se décolore rapidement.',
      'La motorisation Somfy est la référence en France — elle permet l\'intégration domotique et les capteurs vent/soleil.',
      'Mesurez précisément l\'encombrement disponible (coffre de volet, profondeur du linteau) avant de commander un store ou un volet : un mauvais dimensionnement oblige à tout refaire.',
      'Pour un store banne, investissez dans un capteur vent automatique : il rétracte le store en cas de rafales et évite les dégâts qui ne sont généralement pas couverts par la garantie.',
      'Si vos volets roulants grincent ou peinent à monter, un simple graissage des coulisses et un dépoussiérage du tablier suffisent souvent. L\'entretien annuel prolonge leur durée de vie de plusieurs années.',
      'Un capteur vent (anémomètre) automatique protège votre store banne des rafales et évite la casse — indispensable si vous vous absentez souvent.',
      'Les brise-soleil orientables (BSO) sont éligibles à MaPrimeRénov\' en tant que protection solaire : renseignez-vous auprès de votre installateur RGE pour bénéficier de l\'aide.',
      'Nettoyez votre toile de store deux fois par an à l\'eau tiède savonneuse (savon de Marseille) et laissez-la sécher entièrement avant de la replier pour éviter moisissures et taches tenaces.',
    ],
    faq: [
      { q: 'Combien coûte la motorisation de tous les volets d\'une maison ?', a: 'Pour une maison de 8 à 10 volets, comptez 2 500 à 5 000 € pour la motorisation complète (moteurs + commandes radio + installation). Une commande centralisée ajoute 300 à 800 €. La motorisation solaire est possible si le câblage électrique est difficile (+30 % de surcoût).' },
      { q: 'Store banne manuel ou motorisé ?', a: 'Un store banne manuel (manivelle) coûte 500 à 1 500 € et convient aux petites largeurs (jusqu\'à 3 m). Un store motorisé (800 à 3 000 €) est recommandé au-delà de 3 m de largeur, car la manœuvre manuelle devient pénible. La motorisation permet aussi l\'ajout de capteurs automatiques (vent, soleil, pluie) qui protègent le store en votre absence.' },
      { q: 'Quelle est la durée de vie d\'un store banne ?', a: 'Un store banne de qualité dure 10 à 15 ans avec un entretien correct. La toile acrylique teinte masse (la plus résistante) conserve ses couleurs 10 à 12 ans. L\'armature en aluminium dure 20 ans+. Pour prolonger la durée de vie : rétractez le store en cas de vent fort, laissez sécher la toile avant de la replier et nettoyez-la une fois par an au savon de Marseille.' },
      { q: 'Quelles aides pour le remplacement de volets roulants ?', a: 'Le remplacement de volets roulants anciens par des modèles isolants ouvre droit à la TVA réduite à 10 % pour les logements de plus de 2 ans. Si les volets intègrent une isolation thermique renforcée (coefficient Uc ≤ 1,4), vous pouvez bénéficier de MaPrimeRénov\' et des CEE (prime énergie) à condition de passer par un installateur RGE.' },
      { q: 'Pergola bioclimatique ou store banne : que choisir ?', a: 'Le store banne (800 à 3 000 €) est idéal pour un ombrage ponctuel et se rétracte entièrement. La pergola bioclimatique (5 000 à 15 000 €) offre une protection permanente avec des lames orientables qui régulent la luminosité et la ventilation. La pergola ajoute de la valeur au bien immobilier et crée un véritable espace de vie extérieur utilisable même par temps de pluie légère.' },
      { q: 'Store banne ou pergola : que choisir pour sa terrasse ?', a: 'Le store banne est moins cher (800 à 3 000 €), amovible et facile à installer, mais il est fragile au vent (rétractation obligatoire au-delà de 40 km/h). La pergola bioclimatique (5 000 à 15 000 €) est une structure permanente, solide face aux intempéries, mais elle nécessite des fondations et parfois une déclaration préalable de travaux. Pour un usage occasionnel, le store banne suffit ; pour un véritable espace de vie extérieur toute l\'année, la pergola est le meilleur investissement.' },
      { q: 'Quelle toile choisir pour un store banne ?', a: 'La toile acrylique teinte masse est la plus résistante aux UV et conserve ses couleurs 10 à 12 ans : c\'est le choix de référence pour les stores extérieurs. La toile polyester est moins chère mais se décolore en 4 à 5 ans sous l\'exposition solaire. La toile micro-perforée laisse passer l\'air et réduit l\'effet de serre sous le store, idéale pour les terrasses fermées. Privilégiez les marques Dickson ou Sattler, références du marché en France.' },
      { q: 'Un store motorisé est-il préférable à un store manuel ?', a: 'Un store motorisé coûte 200 à 400 € de plus qu\'un modèle manuel, mais il offre un confort d\'utilisation supérieur et une durée de vie accrue (moins de contraintes mécaniques sur les bras). La motorisation permet surtout l\'ajout de capteurs automatiques (vent, soleil, pluie) qui protègent le store en votre absence. Au-delà de 3 m de largeur, la motorisation est fortement recommandée car la manœuvre manuelle devient pénible et risque d\'endommager le mécanisme.' },
    ],
    emergencyInfo:
      'Intervention d\'urgence pour volet roulant bloqué empêchant la fermeture ou l\'ouverture d\'une fenêtre, ou store banne cassé menaçant de tomber. Un storiste peut intervenir pour une réparation ou un déblocage selon disponibilité. Majorations : +60 à 100 % en dehors des heures ouvrées.',
    certifications: ['Qualibat (qualification 3511/3512 stores et fermetures)', 'RGE (obligatoire pour volets isolants ouvrant droit aux aides)', 'Expert Somfy (partenaire installateur certifié par le fabricant)', 'Label Storiste de France (réseau national de storistes professionnels)', 'Certification ACERMI (performance thermique des stores et fermetures)', 'NF EN 13561 (norme européenne pour les stores extérieurs)', 'Qualification Somfy Expert (partenaire certifié motorisation et domotique)', 'Assurance RC professionnelle (responsabilité civile obligatoire pour les installateurs)'],
    averageResponseTime: 'Devis sous 48h, intervention sous 1 à 2 semaines',
  },

  'salle-de-bain': {
    slug: 'salle-de-bain',
    name: 'Salle de bain',
    priceRange: { min: 4000, max: 15000, unit: '€' },
    commonTasks: [
      'Rénovation complète salle de bain 5 m² : 5 000 à 12 000 €',
      'Remplacement baignoire par douche à l\'italienne : 3 000 à 7 000 €',
      'Création d\'une salle de bain (dans une chambre) : 8 000 à 20 000 €',
      'Pose de carrelage mural et sol : 40 à 80 €/m²',
      'Installation meuble vasque + robinetterie : 500 à 2 500 €',
    ],
    tips: [
      'Pour une douche à l\'italienne, exigez une étanchéité SPEC (Système de Protection à l\'Eau sous Carrelage) certifiée.',
      'Prévoyez une VMC performante pour éviter les problèmes d\'humidité et de moisissures.',
      'Prévoyez un budget de 15 à 20 % en plus pour les imprévus (tuyauterie vétuste à reprendre, support mural dégradé derrière l\'ancien carrelage).',
      'Pour une salle de bain accessible PMR, les normes imposent une douche de plain-pied d\'au moins 120 × 120 cm, des barres d\'appui et un espace de manœuvre de 150 cm de diamètre.',
      'Faites appel à un seul coordinateur de travaux (plombier-carreleur ou entreprise tous corps d\'état) plutôt que de gérer 3 ou 4 artisans séparément — cela simplifie la planification et les garanties.',
    ],
    faq: [
      { q: 'Quelles aides pour rénover sa salle de bain ?', a: 'Si vous avez plus de 60 ans ou êtes en situation de handicap, l\'aide MaPrimeAdapt\' peut couvrir jusqu\'à 70 % des travaux d\'adaptation (douche accessible, barres d\'appui). La TVA réduite à 10 % s\'applique pour les logements de plus de 2 ans. Certaines caisses de retraite proposent aussi des aides.' },
      { q: 'Combien de temps durent les travaux de rénovation d\'une salle de bain ?', a: 'Une rénovation complète de salle de bain (5 à 8 m²) dure en moyenne 2 à 3 semaines : démolition (2-3 jours), plomberie et électricité (2-3 jours), étanchéité et carrelage (4-5 jours), pose des équipements (2-3 jours), finitions (1-2 jours). Pendant les travaux, prévoyez un point d\'eau de substitution (cuisine, salle d\'eau secondaire).' },
      { q: 'Douche à l\'italienne ou receveur extra-plat ?', a: 'La douche à l\'italienne (encastrée dans le sol) offre un esthétisme supérieur et une accessibilité optimale, mais nécessite un sol épais pour encastrer la bonde et une étanchéité irréprochable (4 000 à 7 000 €). Le receveur extra-plat (2 à 4 cm de hauteur) est plus simple à poser, moins risqué pour l\'étanchéité et plus économique (2 500 à 5 000 €). En rénovation d\'appartement, le receveur extra-plat est souvent le choix le plus pragmatique.' },
      { q: 'Quel carrelage choisir pour une salle de bain ?', a: 'Privilégiez un carrelage antidérapant classé R10 ou R11 pour le sol de douche (norme DIN 51097 classe B minimum). Le grès cérame est le matériau le plus résistant à l\'humidité et le plus facile à entretenir. Évitez les joints blancs qui jaunissent : optez pour un joint époxy (imperméable et antifongique) de couleur grise ou assortie au carrelage.' },
      { q: 'Peut-on créer une salle de bain dans une chambre ?', a: 'Oui, c\'est courant lors d\'une rénovation. Les contraintes principales sont : l\'acheminement des arrivées d\'eau et des évacuations (possible avec une pompe de relevage si nécessaire), la ventilation (VMC obligatoire), l\'étanchéité du sol et l\'isolation phonique. Le budget pour créer une salle de bain complète dans une chambre se situe entre 8 000 et 20 000 € selon le niveau de finition.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la rénovation de salle de bain. En cas de fuite d\'eau urgente, contactez un plombier d\'urgence. Pour votre projet de rénovation, prenez rendez-vous pour un devis gratuit sous 1 semaine.',
    certifications: ['Qualibat (qualification aménagement intérieur, plomberie, carrelage)', 'Handibat (label accessibilité PMR — Chambre de Métiers)', 'RGE (si isolation thermique associée — ouvre droit aux aides)'],
    averageResponseTime: 'Devis sous 1 semaine, intervention sous 2 à 6 semaines',
  },

  'architecte-interieur': {
    slug: 'architecte-interieur',
    name: 'Architecte d\'intérieur',
    priceRange: { min: 50, max: 150, unit: '€/m²' },
    commonTasks: [
      'Consultation / conseil déco : 80 à 200 €/h',
      'Projet d\'aménagement complet : 50 à 150 €/m² de surface aménagée',
      'Suivi de chantier : 8 à 15 % du montant des travaux',
      'Plans 3D et planches d\'ambiance : 500 à 2 000 €',
      'Rénovation d\'appartement haussmannien : 800 à 2 000 €/m²',
    ],
    tips: [
      'Un architecte d\'intérieur titulaire du diplôme CFAI est inscrit au Conseil français des architectes d\'intérieur et peut porter le titre protégé.',
      'Définissez un budget précis avant la première consultation pour que le professionnel adapte ses propositions.',
      'Demandez un contrat de mission détaillé avant le démarrage : il doit préciser les livrables (plans, vues 3D, planning), les honoraires et les conditions de suivi de chantier.',
      'Si votre projet implique des modifications structurelles (suppression de mur porteur, trémie d\'escalier), l\'architecte d\'intérieur devra faire valider les calculs par un bureau d\'études structure.',
      'Pour les projets d\'envergure (plus de 150 m² de surface de plancher), le recours à un architecte DPLG est obligatoire, même si un architecte d\'intérieur coordonne le projet esthétique.',
    ],
    faq: [
      { q: 'Architecte d\'intérieur ou décorateur ?', a: 'L\'architecte d\'intérieur peut modifier les volumes (cloisons, ouvertures, mezzanines) et déposer des permis. Le décorateur intervient uniquement sur l\'ameublement, les couleurs et les textiles sans toucher au bâti. Pour une rénovation avec travaux structurels, un architecte d\'intérieur est indispensable.' },
      { q: 'Combien coûte un architecte d\'intérieur pour un appartement ?', a: 'Les honoraires varient selon le type de mission : une consultation de 2h coûte 150 à 400 €, un projet complet (plans + 3D + shopping list) revient à 50 à 150 €/m², et un suivi de chantier complet ajoute 8 à 15 % du montant des travaux. Pour un appartement de 70 m² avec rénovation lourde, comptez 5 000 à 15 000 € d\'honoraires pour la mission complète.' },
      { q: 'Quels livrables attendre d\'un architecte d\'intérieur ?', a: 'Une mission complète inclut : un relevé de l\'existant, des plans d\'aménagement (2 à 3 propositions), des vues 3D réalistes, des planches de matériaux et de couleurs, un carnet de détails techniques, un descriptif des travaux pour consulter les entreprises et un planning prévisionnel. Vérifiez que ces livrables sont listés dans le contrat de mission.' },
      { q: 'L\'architecte d\'intérieur peut-il déposer un permis de construire ?', a: 'L\'architecte d\'intérieur peut déposer une déclaration préalable de travaux et un permis de construire pour les projets de moins de 150 m² de surface de plancher. Au-delà de 150 m², un architecte DPLG (inscrit à l\'Ordre) est obligatoire pour signer le permis. Les deux professionnels travaillent souvent en complémentarité sur les grands projets.' },
      { q: 'Comment choisir le bon architecte d\'intérieur ?', a: 'Consultez son portfolio pour vérifier que son style correspond à vos goûts. Vérifiez son diplôme (CFAI ou équivalent bac+5) et son inscription au Conseil français des architectes d\'intérieur. Demandez des références de clients récents et visitez si possible un chantier en cours. Enfin, comparez au moins 3 devis en vérifiant que le périmètre de la mission est identique.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour l\'architecture d\'intérieur. Les projets d\'aménagement et de rénovation sont planifiés sur plusieurs semaines à plusieurs mois. Prenez rendez-vous pour une première consultation sous 1 semaine.',
    certifications: ['Diplôme CFAI (Conseil Français des Architectes d\'Intérieur — titre protégé)', 'Inscription à l\'Ordre des Architectes (si architecte DPLG/HMONP)', 'Assurance décennale (obligatoire pour les travaux de structure)'],
    averageResponseTime: 'Premier rendez-vous sous 1 semaine',
  },

  decorateur: {
    slug: 'decorateur',
    name: 'Décorateur',
    priceRange: { min: 50, max: 120, unit: '€/h' },
    commonTasks: [
      'Conseil en décoration (visite + recommandations) : 150 à 500 €',
      'Planche d\'ambiance et shopping list : 300 à 1 000 €/pièce',
      'Home staging pour vente immobilière : 1 à 3 % du prix de vente',
      'Décoration événementielle : 500 à 3 000 €',
      'Accompagnement achat mobilier : 50 à 120 €/h',
      'Conseil en décoration (consultation 2h, diagnostic + préconisations) : 150 à 300 €',
      'Home staging complet avant vente (désencombrement, mobilier, mise en scène) : 1 500 à 4 000 €',
      'Création planche tendance et shopping list personnalisée : 300 à 800 €',
      'Agencement et optimisation d\'espace (plan d\'implantation mobilier) : 500 à 2 000 €',
      'Conseil couleurs et matériaux (nuancier personnalisé + échantillons) : 200 à 600 €',
    ],
    tips: [
      'Un bon décorateur vous fait gagner du temps et de l\'argent en évitant les erreurs d\'achat (meubles inadaptés, couleurs qui ne vont pas ensemble).',
      'Pour un home staging, comptez un ROI de 5 à 10 fois le coût investi sur le prix de vente final.',
      'Demandez au décorateur une shopping list avec des alternatives à plusieurs niveaux de prix : cela vous permet d\'ajuster le budget sans compromettre l\'harmonie générale du projet.',
      'Pour une pièce à vivre, commencez par définir les couleurs dominantes (murs, sol) avant de choisir le mobilier. L\'inverse est une erreur fréquente qui oblige à tout reprendre.',
      'Un décorateur professionnel bénéficie de tarifs négociés chez les fournisseurs (10 à 30 % de remise) : même en comptant ses honoraires, vous pouvez économiser sur l\'achat du mobilier.',
      'Créez un moodboard (tableau d\'inspiration) avant tout achat : rassemblez photos, échantillons de tissus et nuances de peinture pour valider la cohérence visuelle de votre projet.',
      'Mélangez 3 matières maximum par pièce (bois, métal, textile par exemple) pour un résultat harmonieux sans surcharge visuelle.',
      'Appliquez la règle 60-30-10 pour les couleurs : 60 % de couleur dominante (murs, sol), 30 % de couleur secondaire (mobilier, rideaux) et 10 % de couleur d\'accent (coussins, objets déco).',
      'Prévoyez au minimum 3 sources de lumière par pièce (plafonnier, lampe à poser, applique ou liseuse) pour créer des ambiances variées et éviter l\'effet « éclairage de bureau ».',
    ],
    faq: [
      { q: 'Combien coûte un décorateur pour un salon ?', a: 'Pour un salon de 25 à 35 m², comptez 500 à 2 000 € pour une prestation complète : visite, planche d\'ambiance, shopping list et accompagnement achat. Le budget mobilier et accessoires est en sus.' },
      { q: 'Quelle est la différence entre un décorateur et un home stager ?', a: 'Le décorateur crée un intérieur personnalisé selon les goûts et le mode de vie du client (projet durable). Le home stager prépare un bien immobilier pour la vente en le dépersonnalisant et en le mettant en valeur pour séduire un maximum d\'acheteurs (projet temporaire). Le home staging coûte généralement 1 à 3 % du prix de vente et permet de vendre plus vite et souvent à un meilleur prix.' },
      { q: 'Un décorateur peut-il intervenir à distance ?', a: 'Oui, beaucoup de décorateurs proposent des prestations en ligne : vous envoyez les photos et les mesures de votre pièce, et le décorateur vous livre une planche d\'ambiance, un plan d\'aménagement et une shopping list. Le coût est 30 à 50 % inférieur à une prestation sur place (300 à 1 000 € par pièce). C\'est une bonne solution pour les petits budgets ou les zones éloignées.' },
      { q: 'Quelles sont les tendances déco actuelles ?', a: 'Les tendances 2025-2026 privilégient les matériaux naturels (bois brut, pierre, lin), les couleurs terracotta et vert sauge, le mobilier arrondi et les luminaires sculpturaux. Le style japandi (mélange japonais-scandinave) et le maximalisme coloré coexistent. Un bon décorateur vous guidera vers un style intemporel qui ne se démodera pas en quelques mois.' },
      { q: 'Le décorateur achète-t-il le mobilier à ma place ?', a: 'Selon la formule choisie, le décorateur peut soit vous fournir une shopping list que vous achetez vous-même, soit se charger de toutes les commandes (accompagnement achat). Dans le second cas, il gère les délais de livraison, vérifie la conformité des produits et coordonne la mise en place. Cette prestation coûte 50 à 120 €/h ou un forfait de 500 à 1 500 € selon le volume d\'achats.' },
      { q: 'Quelle différence entre décorateur et architecte d\'intérieur ?', a: 'Le décorateur intervient sur l\'esthétique sans toucher au bâti : couleurs, mobilier, textiles, éclairage et agencement de l\'existant. L\'architecte d\'intérieur peut modifier la structure (abattre une cloison, déplacer une cuisine, créer une mezzanine) et doit être inscrit au CFAI ou titulaire d\'un diplôme reconnu par l\'État. Pour un relooking sans travaux, le décorateur suffit ; pour des modifications structurelles, un architecte d\'intérieur est indispensable.' },
      { q: 'Combien coûte une prestation de décoration complète ?', a: 'Une consultation initiale (visite + recommandations) coûte 150 à 300 €. Un projet complet pour une pièce (planche d\'ambiance, plan d\'aménagement, shopping list, suivi) revient à 800 à 2 000 €. Pour un appartement entier, comptez 2 000 à 6 000 € hors mobilier. Les honoraires se facturent au forfait, à l\'heure (50 à 120 €/h) ou en pourcentage du budget mobilier (10 à 15 %).' },
      { q: 'Le home staging est-il rentable ?', a: 'Oui, le home staging est l\'un des investissements les plus rentables en immobilier. Selon la FNAIM, le retour sur investissement est de 3 à 5 fois la somme engagée : un home staging à 2 000 € permet de vendre 5 000 à 10 000 € plus cher et réduit le délai de vente de 30 à 50 %. Le home staging virtuel (retouche photo 3D) est une alternative économique (200 à 500 € par bien) pour les annonces en ligne.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la décoration d\'intérieur. Les prestations de conseil déco, home staging et accompagnement achat sont planifiées sur rendez-vous. Premier rendez-vous disponible sous 1 semaine.',
    certifications: ['Titre professionnel Décorateur d\'intérieur (inscrit au RNCP)', 'Membre de l\'UFDI (Union Francophone des Décorateurs d\'Intérieur)', 'Certification home staging (si spécialisation valorisation immobilière)', 'Diplôme CFAI ou ESAIL (écoles reconnues en architecture intérieure et décoration)', 'Certification Conseil en décoration délivrée par la CMA (Chambre de Métiers et de l\'Artisanat)', 'Label Décorateur professionnel (gage de compétence et de déontologie)', 'Assurance RC professionnelle (responsabilité civile couvrant conseils et préconisations)', 'Certification Home Staging Europe (formation spécialisée en valorisation immobilière)'],
    averageResponseTime: 'Premier rendez-vous sous 1 semaine',
  },

  domoticien: {
    slug: 'domoticien',
    name: 'Domoticien',
    priceRange: { min: 500, max: 5000, unit: '€' },
    commonTasks: [
      'Installation domotique complète maison : 5 000 à 20 000 €',
      'Éclairage connecté (10 points) : 1 000 à 3 000 €',
      'Thermostat connecté : 300 à 800 € (fourniture + pose)',
      'Serrure connectée : 300 à 1 000 €',
      'Système multiroom audio : 2 000 à 8 000 €',
      'Automatisation volets roulants : 200 à 500 € par volet (moteur + module connecté)',
      'Intégration alarme + caméras + domotique centralisée : 1 500 à 5 000 €',
      'Portier vidéo connecté (Doorbird, Netatmo) : 300 à 800 €',
    ],
    tips: [
      'Privilégiez les protocoles ouverts (KNX, Zigbee, Z-Wave) plutôt que les systèmes propriétaires fermés pour garantir l\'évolutivité.',
      'Prévoyez un réseau Ethernet en étoile (câble Cat 6) même si vous utilisez du Wi-Fi — c\'est la base d\'une installation fiable.',
      'En rénovation, les protocoles sans fil (Zigbee, Z-Wave, Wi-Fi) évitent de tirer des câbles dans les murs. En construction neuve, privilégiez le KNX filaire pour une fiabilité maximale.',
      'Pensez à prévoir un onduleur (UPS) pour votre box domotique et votre routeur : une coupure de courant ne doit pas désactiver votre système de sécurité ni votre chauffage.',
      'Choisissez un domoticien qui propose un contrat de maintenance : les mises à jour logicielles, le remplacement de piles des capteurs et le support technique sont essentiels pour la pérennité du système.',
      'Commencez par un protocole ouvert (Zigbee ou Z-Wave) plutôt que propriétaire : vous pourrez mélanger les marques et changer de hub sans tout racheter.',
      'Prévoyez un réseau Wi-Fi mesh (Ubiquiti, TP-Link Deco) pour couvrir toute la maison : les appareils connectés en Wi-Fi perdent leur fiabilité si le signal est faible.',
      'Centralisez toute la domotique sur un hub unique (Home Assistant, Jeedom, Homey) : un point de contrôle central simplifie la gestion et les scénarios multi-pièces.',
    ],
    faq: [
      { q: 'Quel budget pour domotiser une maison ?', a: 'Le budget varie de 3 000 € (kit DIY : éclairage + thermostat + volets) à 30 000 €+ (installation professionnelle KNX complète). Un bon compromis est un système Zigbee/Z-Wave avec box domotique (5 000 à 10 000 €) qui couvre éclairage, chauffage, volets et sécurité.' },
      { q: 'KNX, Zigbee ou Z-Wave : quel protocole choisir ?', a: 'Le KNX est le standard professionnel filaire le plus fiable et pérenne (30 ans+), mais il coûte 2 à 3 fois plus cher et nécessite un câblage spécifique (bus EIB). Le Zigbee est le protocole sans fil le plus répandu (compatible Philips Hue, Ikea, Aqara) avec un excellent rapport qualité-prix. Le Z-Wave offre une portée supérieure et moins d\'interférences mais un choix de produits plus restreint. En rénovation, Zigbee ou Z-Wave sont les plus adaptés.' },
      { q: 'La domotique permet-elle de réaliser des économies d\'énergie ?', a: 'Oui, une installation domotique bien configurée réduit la facture énergétique de 15 à 30 %. Le thermostat connecté seul fait économiser 10 à 15 % sur le chauffage. L\'automatisation des volets (fermeture la nuit en hiver, occultation en été) ajoute 5 à 10 %. La gestion intelligente de l\'éclairage (détecteurs de présence, scénarios) réduit la consommation de 20 à 40 %.' },
      { q: 'Peut-on domotiser une maison ancienne sans gros travaux ?', a: 'Oui, grâce aux protocoles sans fil (Zigbee, Z-Wave, Wi-Fi). On remplace les interrupteurs par des modules connectés, on ajoute des capteurs (température, ouverture, mouvement) et on installe une box domotique centrale. L\'installation est non invasive et réversible. Comptez 3 000 à 8 000 € pour une maison de 4 pièces avec éclairage, chauffage, volets et sécurité.' },
      { q: 'La domotique est-elle compatible avec les assistants vocaux ?', a: 'La plupart des systèmes domotiques sont compatibles avec Google Home, Amazon Alexa et Apple HomeKit. Le contrôle vocal permet de piloter l\'éclairage, le chauffage, les volets et les scénarios par la voix. Pour une compatibilité maximale, le nouveau standard Matter (soutenu par Google, Apple, Amazon et Samsung) unifie les protocoles et garantit l\'interopérabilité entre marques.' },
      { q: 'KNX, Zigbee ou Wi-Fi : quel protocole domotique choisir ?', a: 'Le KNX est un protocole filaire professionnel haut de gamme, extrêmement fiable et pérenne (30 ans+), mais onéreux (2 à 3 fois le prix du sans-fil) et réservé au neuf ou à la rénovation lourde. Le Zigbee est un protocole sans fil fiable à faible consommation, idéal pour les capteurs et interrupteurs (compatible Matter). Le Wi-Fi est le plus simple à mettre en place mais sature le réseau domestique au-delà de 20-30 appareils et consomme davantage d\'énergie.' },
      { q: 'Faut-il un domoticien professionnel pour une maison connectée ?', a: 'Le DIY est tout à fait possible pour les bases (ampoules connectées, thermostat intelligent, prises connectées) grâce aux kits grand public. En revanche, un domoticien professionnel est nécessaire dès que l\'on souhaite une intégration complète multi-protocoles (KNX + Zigbee), la programmation de scénarios avancés, le câblage d\'un tableau domotique ou l\'interconnexion alarme-caméras-éclairage. Comptez 500 à 1 500 € de main-d\'oeuvre pour la programmation seule.' },
      { q: 'La domotique augmente-t-elle la valeur d\'un bien immobilier ?', a: 'Oui, selon plusieurs études immobilières, une installation domotique bien intégrée peut augmenter la valeur d\'un bien de 3 à 5 %. L\'attractivité locative est également renforcée : les locataires sont prêts à payer un loyer supérieur pour un logement connecté (chauffage intelligent, sécurité, confort). L\'investissement est d\'autant plus rentable si l\'installation repose sur des protocoles ouverts et standardisés (KNX, Matter).' },
    ],
    emergencyInfo:
      'Intervention d\'urgence pour panne de serrure connectée vous empêchant d\'accéder à votre domicile, ou défaillance du système d\'alarme domotique. Un domoticien peut intervenir pour un diagnostic et une remise en service selon disponibilité. Majorations : +80 à 120 % la nuit et le week-end.',
    certifications: ['Certification KNX Partner (standard international de la domotique filaire)', 'Certification Crestron/Control4 (systèmes haut de gamme)', 'Habilitation électrique (obligatoire)', 'Qualifelec (mention courants faibles et domotique)', 'Qualibat 5411 (domotique et gestion technique du bâtiment)', 'Label Promotelec (installations électriques et domotiques conformes)', 'Agrément constructeur Somfy (motorisation et domotique volets/stores)', 'Agrément constructeur Delta Dore (solutions domotiques résidentielles)'],
    averageResponseTime: 'Devis sous 1 semaine, installation 1 à 4 semaines',
  },

  'pompe-a-chaleur': {
    slug: 'pompe-a-chaleur',
    name: 'Pompe à chaleur',
    priceRange: { min: 8000, max: 18000, unit: '€' },
    commonTasks: [
      'PAC air/eau (chauffage + ECS) : 10 000 à 18 000 €',
      'PAC air/air (climatisation réversible) : 3 000 à 8 000 €',
      'PAC géothermique : 15 000 à 25 000 €',
      'Entretien annuel obligatoire : 150 à 300 €',
      'Remplacement de chaudière fioul par PAC : 12 000 à 20 000 €',
    ],
    tips: [
      'Exigez un installateur certifié QualiPAC — c\'est obligatoire pour bénéficier des aides MaPrimeRénov\' et des CEE.',
      'Un dimensionnement correct est crucial : une PAC surdimensionnée consomme plus et s\'use prématurément. Exigez une étude thermique (800 à 1 500 €).',
      'L\'entretien annuel d\'une PAC de plus de 4 kW est obligatoire depuis 2020 (décret n° 2020-912). Souscrivez un contrat de maintenance dès l\'installation pour garantir les performances et la durée de vie.',
      'Vérifiez le niveau sonore de l\'unité extérieure (exprimé en dB(A) à 1 m) avant l\'achat : les PAC air/eau les plus silencieuses descendent sous 40 dB(A). Un mauvais choix peut créer des conflits de voisinage.',
      'Coupler une pompe à chaleur avec des panneaux solaires photovoltaïques permet d\'alimenter la PAC avec de l\'électricité gratuite en journée, réduisant la facture de chauffage de 60 à 80 %.',
    ],
    faq: [
      { q: 'Quelles aides pour installer une pompe à chaleur ?', a: 'MaPrimeRénov\' : jusqu\'à 5 000 € (revenus modestes). CEE (prime énergie) : 2 000 à 4 000 €. Éco-PTZ : prêt à taux zéro jusqu\'à 50 000 €. TVA réduite à 5,5 %. Au total, les aides peuvent couvrir 40 à 70 % du coût pour les ménages modestes.' },
      { q: 'PAC air/eau ou air/air : laquelle choisir ?', a: 'La PAC air/eau chauffe l\'eau du circuit de radiateurs ou du plancher chauffant et peut aussi produire l\'eau chaude sanitaire. Elle est idéale en remplacement d\'une chaudière fioul ou gaz (10 000 à 18 000 €). La PAC air/air (climatisation réversible) souffle de l\'air chaud ou froid via des splits muraux (3 000 à 8 000 €). Elle est plus économique mais ne produit pas d\'eau chaude et n\'ouvre pas droit à MaPrimeRénov\'.' },
      { q: 'Quelle est la durée de vie d\'une pompe à chaleur ?', a: 'Une PAC air/eau bien entretenue dure 15 à 20 ans. Le compresseur (pièce la plus sollicitée) a une durée de vie de 12 à 15 ans. Un entretien annuel (vérification du fluide frigorigène, nettoyage des filtres, contrôle des performances) est obligatoire et prolonge significativement la durée de vie. Le remplacement du compresseur (1 500 à 3 000 €) peut redonner 10 ans de vie à l\'installation.' },
      { q: 'Une pompe à chaleur fonctionne-t-elle par grand froid ?', a: 'Les PAC air/eau récentes fonctionnent jusqu\'à -15 °C, voire -25 °C pour les modèles haut de gamme (Daikin Altherma, Atlantic Alfea). Toutefois, le COP (coefficient de performance) diminue avec la température extérieure : de 4 à 5 par temps doux (7 °C), il chute à 2 à 3 par -10 °C. Un appoint électrique intégré prend le relais lors des vagues de froid exceptionnelles.' },
      { q: 'La pompe à chaleur est-elle bruyante ?', a: 'L\'unité extérieure émet 40 à 55 dB(A) à 1 m de distance (comparable à une conversation). Les modèles récents proposent un mode silencieux nocturne (35 à 45 dB). La réglementation impose un seuil d\'émergence de 5 dB(A) le jour et 3 dB(A) la nuit par rapport au bruit ambiant. Installez l\'unité extérieure à distance des chambres du voisin et sur des plots anti-vibratiles pour limiter les nuisances.' },
    ],
    emergencyInfo: 'En cas de panne de chauffage en hiver, un chauffagiste d\'urgence peut intervenir en 2 à 4h pour un diagnostic. Coût : 150 à 350 € (déplacement + diagnostic).',
    certifications: ['QualiPAC (obligatoire pour les aides MaPrimeRénov\' et CEE)', 'RGE (Reconnu Garant de l\'Environnement)', 'Attestation de capacité fluides frigorigènes (obligatoire — catégorie I)', 'Qualibat (qualification 5212/5213 chauffage, génie climatique)'],
    averageResponseTime: 'Devis sous 1 semaine, installation 2 à 4 semaines',
  },

  'panneaux-solaires': {
    slug: 'panneaux-solaires',
    name: 'Panneaux solaires',
    priceRange: { min: 7000, max: 20000, unit: '€' },
    commonTasks: [
      'Installation photovoltaïque 3 kWc : 7 000 à 10 000 €',
      'Installation photovoltaïque 6 kWc : 12 000 à 16 000 €',
      'Installation photovoltaïque 9 kWc : 16 000 à 22 000 €',
      'Solaire thermique (eau chaude) : 4 000 à 8 000 €',
      'Batterie de stockage : 4 000 à 10 000 €',
    ],
    tips: [
      'La rentabilité dépend de l\'orientation (sud idéal), de l\'inclinaison (30° optimal) et de l\'ensoleillement local. Une étude de faisabilité gratuite est proposée par la plupart des installateurs.',
      'En autoconsommation avec revente du surplus, le retour sur investissement est de 8 à 12 ans en moyenne.',
      'Vérifiez que votre installateur possède la certification QualiPV et le label RGE, deux conditions indispensables pour bénéficier des aides de l\'État (prime à l\'autoconsommation, obligation d\'achat EDF OA).',
      'Faites nettoyer vos panneaux une fois par an à l\'eau claire sans détergent : la poussière et les fientes d\'oiseaux peuvent réduire la production de 5 à 15 %.',
      'Pensez au monitoring en temps réel via une application : un dysfonctionnement non détecté peut représenter plusieurs centaines d\'euros de perte de production sur un an.',
    ],
    faq: [
      { q: 'Est-ce rentable d\'installer des panneaux solaires ?', a: 'Oui, avec un prix de l\'électricité en hausse constante. Une installation de 3 kWc produit environ 3 500 kWh/an dans le sud de la France, soit 500 à 700 € d\'économie annuelle. Avec la prime à l\'autoconsommation (1 140 € pour 3 kWc) et la revente du surplus au tarif CRE en vigueur (révisé trimestriellement — vérifiez sur edf-oa.fr), le retour sur investissement se fait en 8 à 12 ans pour un équipement qui dure 30 ans+.' },
      { q: 'Quelle est la durée de vie des panneaux solaires ?', a: 'Les panneaux photovoltaïques ont une durée de vie de 30 à 40 ans. La garantie constructeur couvre généralement 25 ans sur la production (80 % du rendement initial garanti). L\'onduleur, en revanche, doit être remplacé tous les 10 à 15 ans (coût : 1 000 à 2 000 €).' },
      { q: 'Peut-on installer des panneaux solaires sur un toit plat ou orienté nord ?', a: 'Un toit plat convient très bien grâce à des supports inclinés à 30° orientés plein sud. En revanche, une orientation nord réduit la production de 40 à 50 %, ce qui rend le projet rarement rentable. Les orientations est et ouest restent viables avec une perte de 15 à 20 % seulement.' },
      { q: 'Faut-il une autorisation pour poser des panneaux solaires ?', a: 'Oui, une déclaration préalable de travaux en mairie est obligatoire dans tous les cas. En zone protégée (ABF, monument historique), l\'architecte des Bâtiments de France doit donner son accord, ce qui peut rallonger le délai de 2 à 6 mois. En copropriété, un vote en assemblée générale est requis.' },
      { q: 'Autoconsommation totale ou revente du surplus : quel choix faire ?', a: 'L\'autoconsommation avec revente du surplus est le modèle le plus courant et le plus rentable pour les particuliers. Vous consommez directement l\'électricité produite et revendez l\'excédent à EDF OA à un tarif garanti pendant 20 ans. La revente totale est plutôt réservée aux grandes toitures ou aux bâtiments peu consommateurs.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour l\'installation de panneaux solaires. En cas de panne de votre onduleur ou de baisse de production anormale, contactez votre installateur pour un diagnostic sous 48h à 1 semaine.',
    certifications: ['QualiPV (qualification Qualit\'EnR — installation photovoltaïque)', 'RGE (obligatoire pour les aides MaPrimeRénov\' et prime autoconsommation)', 'QualiSol (si installation de solaire thermique — chauffe-eau et SSC)', 'Consuel (attestation de conformité électrique — obligatoire pour le raccordement)'],
    averageResponseTime: 'Étude gratuite sous 1 semaine, installation 4 à 8 semaines',
  },

  'isolation-thermique': {
    slug: 'isolation-thermique',
    name: 'Isolation thermique',
    priceRange: { min: 20, max: 100, unit: '€/m²' },
    commonTasks: [
      'Isolation des combles perdus (soufflage) : 20 à 35 €/m²',
      'Isolation des combles aménagés : 40 à 80 €/m²',
      'Isolation des murs par l\'intérieur (ITI) : 30 à 70 €/m²',
      'Isolation des murs par l\'extérieur (ITE) : 100 à 200 €/m²',
      'Isolation du plancher bas : 25 à 50 €/m²',
    ],
    tips: [
      'Les combles sont responsables de 25 à 30 % des déperditions thermiques : c\'est le poste à traiter en priorité.',
      'Exigez des matériaux certifiés ACERMI et un artisan RGE pour bénéficier des aides (MaPrimeRénov\', CEE, éco-PTZ).',
      'Comparez les devis sur la résistance thermique (R) proposée et pas uniquement sur le prix au m² : un isolant moins cher mais moins performant vous coûtera plus cher en énergie à long terme.',
      'Attention aux ponts thermiques (jonctions murs/planchers, contours de fenêtres) : une isolation mal posée peut perdre jusqu\'à 20 % de son efficacité si ces points ne sont pas traités.',
      'Pour l\'isolation par l\'extérieur (ITE), vérifiez que l\'entreprise maîtrise la pose d\'enduit sur isolant et demandez des photos de chantiers réalisés depuis au moins 5 ans.',
    ],
    faq: [
      { q: 'Quelle épaisseur d\'isolant faut-il ?', a: 'Pour les combles perdus : 30 à 40 cm de laine de verre/roche (R ≥ 7 m².K/W). Pour les murs par l\'intérieur : 12 à 16 cm (R ≥ 3,7). Pour les murs par l\'extérieur : 14 à 18 cm (R ≥ 3,7). Ces valeurs correspondent à la RT 2012 / RE 2020 et permettent d\'obtenir les aides.' },
      { q: 'Isolation par l\'intérieur ou par l\'extérieur : que choisir ?', a: 'L\'ITI (intérieur) est moins chère (30 à 70 €/m²) et ne modifie pas la façade, mais réduit la surface habitable de 3 à 5 %. L\'ITE (extérieur) coûte plus cher (100 à 200 €/m²) mais supprime les ponts thermiques, préserve l\'espace intérieur et offre un ravalement de façade inclus. L\'ITE est idéale lors d\'un ravalement obligatoire.' },
      { q: 'L\'isolation des combles est-elle vraiment prioritaire ?', a: 'Oui, car la chaleur monte : les combles non isolés représentent 25 à 30 % des pertes de chaleur d\'une maison. C\'est aussi l\'isolation la moins chère (20 à 35 €/m² en soufflage pour combles perdus) avec le meilleur retour sur investissement (amortie en 3 à 5 ans grâce aux économies de chauffage).' },
      { q: 'Quels matériaux isolants choisir ?', a: 'La laine de verre et la laine de roche offrent le meilleur rapport performance/prix. La ouate de cellulose et la fibre de bois sont des alternatives écologiques avec un bon déphasage thermique (confort d\'été). Le polyuréthane est le plus performant à épaisseur égale mais coûte plus cher. Tous doivent être certifiés ACERMI.' },
      { q: 'L\'isolation phonique et thermique sont-elles la même chose ?', a: 'Non, ce sont deux performances distinctes. Un bon isolant thermique n\'est pas forcément un bon isolant phonique. La laine de roche et la ouate de cellulose offrent de bonnes performances dans les deux domaines. Pour une isolation phonique spécifique, il faut traiter les parois avec des systèmes masse-ressort-masse (double cloison avec isolant intercalé).' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour l\'isolation thermique. Les travaux d\'isolation sont des projets planifiés nécessitant une étude préalable. Prenez rendez-vous pour un devis gratuit sous 1 semaine.',
    certifications: ['RGE (Reconnu Garant de l\'Environnement — obligatoire pour les aides)', 'Qualibat (qualification 7131/7132 isolation thermique intérieure et extérieure)', 'Certification ACERMI (garantie de performance des matériaux isolants)', 'NF Habitat / NF Habitat HQE (label qualité rénovation)'],
    averageResponseTime: 'Devis sous 1 semaine, intervention 1 à 3 semaines',
  },

  'renovation-energetique': {
    slug: 'renovation-energetique',
    name: 'Rénovation énergétique',
    priceRange: { min: 15000, max: 50000, unit: '€' },
    commonTasks: [
      'Audit énergétique (DPE + préconisations) : 800 à 1 500 €',
      'Rénovation globale (isolation + chauffage + ventilation) : 20 000 à 60 000 €',
      'Passage de DPE F/G à C/D : 15 000 à 40 000 €',
      'Remplacement de chaudière fioul par PAC + isolation : 25 000 à 50 000 €',
    ],
    tips: [
      'Commencez toujours par un audit énergétique pour hiérarchiser les travaux et maximiser les aides.',
      'Le Parcours accompagné de MaPrimeRénov\' récompense les projets de rénovation globale améliorant le DPE d\'au moins 2 classes. Ce bonus a été intégré dans le Parcours accompagné depuis 2024.',
      'Faites appel à un Accompagnateur Rénov\' agréé par l\'État : c\'est désormais obligatoire pour les projets de rénovation globale bénéficiant de MaPrimeRénov\'.',
      'Priorisez les travaux dans cet ordre : isolation (combles, murs, sols), puis ventilation (VMC double flux), puis changement du système de chauffage. Isoler sans ventiler provoque des problèmes d\'humidité.',
      'Conservez toutes les factures et attestations RGE pendant 10 ans : elles servent de preuve pour les garanties décennales et en cas de contrôle fiscal sur les aides perçues.',
    ],
    faq: [
      { q: 'Quelles sont les aides pour une rénovation énergétique ?', a: 'MaPrimeRénov\' (jusqu\'à 20 000 €), MaPrimeRénov\' Parcours accompagné pour les ménages modestes (jusqu\'à 32 000 € pour les très modestes), CEE (primes énergie), éco-PTZ (jusqu\'à 50 000 € à taux zéro), TVA à 5,5 %, aides locales (régions, départements). Un ménage modeste peut couvrir jusqu\'à 80 % du coût des travaux.' },
      { q: 'Qu\'est-ce qu\'un audit énergétique et est-il obligatoire ?', a: 'L\'audit énergétique est une analyse complète de votre logement (isolation, chauffage, ventilation) avec un plan de travaux chiffré. Il est obligatoire depuis 2023 pour la vente des logements classés F ou G au DPE. Son coût (800 à 1 500 €) est partiellement pris en charge par MaPrimeRénov\' (jusqu\'à 500 €).' },
      { q: 'Comment passer d\'un DPE F ou G à un DPE C ou D ?', a: 'Il faut généralement combiner isolation des combles et des murs (gain de 1 à 2 classes), remplacement du chauffage par une pompe à chaleur ou chaudière à condensation (gain de 1 classe), et installation d\'une VMC double flux. Le budget moyen est de 20 000 à 40 000 €, mais les aides peuvent couvrir 50 à 80 % pour les ménages modestes.' },
      { q: 'Peut-on rénover par étapes ou faut-il tout faire d\'un coup ?', a: 'On peut rénover par étapes, mais la rénovation globale est plus efficace et mieux aidée. Le parcours « par geste » de MaPrimeRénov\' finance chaque poste séparément, tandis que le parcours « accompagné » pour une rénovation globale offre des primes bonifiées. Attention à l\'ordre des travaux : isoler avant de changer le chauffage pour bien dimensionner l\'équipement.' },
      { q: 'Les logements classés G seront-ils vraiment interdits à la location ?', a: 'Oui, la loi Climat et Résilience interdit progressivement la location des passoires thermiques : les logements G sont interdits à la location depuis janvier 2025, les F le seront en 2028 et les E en 2034. Les propriétaires bailleurs doivent donc engager des travaux de rénovation sous peine de ne plus pouvoir louer.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la rénovation énergétique. Les projets de rénovation globale nécessitent un audit énergétique préalable et une planification sur plusieurs mois. Prenez rendez-vous pour un premier rendez-vous sous 2 semaines.',
    certifications: ['RGE (Reconnu Garant de l\'Environnement — obligatoire pour toutes les aides)', 'Audit énergétique certifié OPQIBI 1905 ou Qualibat 8731', 'Label BBC Rénovation (Bâtiment Basse Consommation)', 'Accompagnateur Rénov\' agréé par l\'État (obligatoire pour MaPrimeRénov\' parcours accompagné)'],
    averageResponseTime: 'Audit sous 2 semaines, planification des travaux 1 à 3 mois',
  },

  'borne-recharge': {
    slug: 'borne-recharge',
    name: 'Borne de recharge',
    priceRange: { min: 1200, max: 3000, unit: '€' },
    commonTasks: [
      'Borne 7,4 kW (monophasé) : 1 200 à 2 000 €',
      'Borne 11 kW (triphasé) : 1 500 à 2 500 €',
      'Borne 22 kW (triphasé) : 2 000 à 3 500 €',
      'Installation en copropriété (droit à la prise) : 1 500 à 3 000 €',
      'Mise aux normes du tableau électrique : 500 à 1 500 €',
    ],
    tips: [
      'Seul un électricien certifié IRVE peut installer une borne de recharge — c\'est obligatoire pour bénéficier des aides (prime Advenir en copropriété). Note : le crédit d\'impôt de 300 € a été supprimé au 1er janvier 2026.',
      'Une borne 7,4 kW suffit pour la plupart des usages (recharge complète en 6 à 8h pendant la nuit).',
      'Vérifiez la puissance de votre abonnement électrique avant l\'installation : une borne 7,4 kW nécessite souvent un passage en 9 kVA minimum, et une borne 11 kW exige un raccordement triphasé.',
      'Programmez la recharge en heures creuses (généralement entre 22h et 6h) pour réduire le coût d\'électricité de 30 à 40 % par rapport aux heures pleines.',
      'En copropriété, vous pouvez invoquer le « droit à la prise » (décret du 13 juillet 2011) : le syndic ne peut pas refuser l\'installation sauf motif sérieux et légitime.',
    ],
    faq: [
      { q: 'Quelles aides pour installer une borne de recharge ?', a: 'Le crédit d\'impôt pour borne de recharge a été supprimé au 1er janvier 2026. Prime Advenir jusqu\'à 960 € en copropriété, TVA réduite à 5,5 % pour les logements de plus de 2 ans. Le budget net après aides dépend de votre situation (copropriété, aides locales).' },
      { q: 'Peut-on recharger sa voiture électrique sur une prise domestique classique ?', a: 'Techniquement oui, mais c\'est déconseillé pour un usage quotidien. Une prise standard 230V/10A délivre seulement 2,3 kW, soit 10 à 15 heures pour une recharge complète. De plus, elle n\'est pas conçue pour une utilisation prolongée à pleine charge et peut provoquer un échauffement dangereux. Une prise renforcée Green\'Up (3,7 kW) est un minimum acceptable.' },
      { q: 'Quelle différence entre une borne monophasée et triphasée ?', a: 'Une borne monophasée (7,4 kW max) est la plus courante en maison individuelle et suffit pour une recharge nocturne. Une borne triphasée (11 ou 22 kW) recharge 2 à 3 fois plus vite mais nécessite un raccordement triphasé (modification du compteur Enedis, 150 à 300 €). Le triphasé est recommandé si vous parcourez plus de 100 km par jour.' },
      { q: 'Combien coûte la recharge d\'une voiture électrique à domicile ?', a: 'En tarif de base, une recharge complète (batterie de 50 kWh) coûte environ 10 à 12 €. En heures creuses, ce coût tombe à 7 à 8 €, soit environ 2 € aux 100 km. C\'est 4 à 5 fois moins cher qu\'un véhicule essence. Avec un abonnement adapté et la programmation nocturne, le surcoût d\'électricité est de 30 à 50 €/mois pour 15 000 km/an.' },
      { q: 'L\'installation d\'une borne nécessite-t-elle des travaux importants ?', a: 'Dans la majorité des cas, l\'installation est simple : fixation murale de la borne, tirage d\'un câble depuis le tableau électrique et ajout d\'un disjoncteur dédié. Les travaux durent 2 à 4 heures. Cependant, si le tableau est éloigné du garage (plus de 20 m) ou si une mise aux normes électrique est nécessaire, le coût et la durée augmentent significativement.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour l\'installation de bornes de recharge. En cas de panne de votre borne existante, contactez le SAV du fabricant ou votre installateur IRVE pour un diagnostic sous 48h.',
    certifications: ['Qualification IRVE P1/P2/P3 (obligatoire — Infrastructure de Recharge de Véhicules Électriques)', 'Habilitation électrique (obligatoire)', 'Qualifelec (mention IRVE)', 'Consuel (attestation de conformité électrique)'],
    averageResponseTime: 'Devis sous 48h, installation sous 1 à 2 semaines',
  },

  ramoneur: {
    slug: 'ramoneur',
    name: 'Ramoneur',
    priceRange: { min: 50, max: 120, unit: '€' },
    commonTasks: [
      'Ramonage de cheminée (conduit maçonné) : 50 à 90 €',
      'Ramonage de poêle à bois/granulés : 60 à 120 €',
      'Ramonage de chaudière (conduit fumée) : 70 à 130 €',
      'Débistrage (enlèvement du bistre) : 150 à 400 €',
      'Tubage de conduit : 1 500 à 3 500 €',
      'Inspection vidéo de conduit de fumée : 100 à 200 €',
      'Test d\'étanchéité de conduit : 100 à 200 €',
      'Installation d\'un chapeau de cheminée (aspirateur statique ou anti-refoulement) : 100 à 300 €',
    ],
    tips: [
      'Le ramonage est obligatoire 1 à 2 fois par an selon les communes (vérifiez le règlement sanitaire départemental). Le certificat de ramonage est exigé par votre assurance en cas de sinistre.',
      'Planifiez votre ramonage en septembre/octobre, avant la saison de chauffe — les délais sont plus courts qu\'en plein hiver.',
      'Après l\'intervention, exigez un certificat de ramonage portant la date, la nature des travaux et le nom du professionnel : c\'est ce document que votre assureur réclamera en cas de sinistre.',
      'Si votre conduit est ancien (avant 1960) ou fissuré, le ramoneur peut recommander un tubage en inox : c\'est un investissement de 1 500 à 3 500 € qui sécurise l\'installation pour 30 ans.',
      'Pour un poêle à granulés, le ramonage doit inclure le nettoyage du conduit d\'évacuation ET du conduit de raccordement : les deux sont sources d\'encrassement et de risque.',
      'Conservez le certificat de ramonage pendant au moins 2 ans : c\'est la pièce justificative exigée par votre assureur en cas de sinistre (incendie de cheminée, dégât des eaux lié au conduit).',
      'Le débistrage est nécessaire dès que le bistre (dépôt dur et brillant) s\'accumule dans le conduit : un simple ramonage mécanique ne l\'élimine pas, il faut une débistreuse rotative.',
      'Un conduit non tubé construit avant 1960 doit être gainé en inox pour être conforme aux normes DTU 24.1 : sans tubage, les risques de fuite de CO et de feu de cheminée sont multipliés.',
    ],
    faq: [
      { q: 'Que risque-t-on sans ramonage ?', a: 'Sans ramonage, vous risquez un feu de cheminée (bistre inflammable), une intoxication au monoxyde de carbone (CO), et un refus d\'indemnisation par votre assurance en cas d\'incendie. L\'amende pour défaut de ramonage peut atteindre 450 € (contravention de 3e classe).' },
      { q: 'Combien de fois par an faut-il faire ramoner ?', a: 'Le règlement sanitaire départemental impose généralement 2 ramonages par an pour les combustibles solides (bois, granulés) dont 1 pendant la période de chauffe, et 1 ramonage par an pour le gaz et le fioul. Vérifiez les obligations de votre commune car elles varient d\'un département à l\'autre.' },
      { q: 'Quelle est la différence entre ramonage mécanique et chimique ?', a: 'Le ramonage mécanique (avec hérisson) est le seul reconnu légalement et par les assurances. Le ramonage chimique (bûches de ramonage) est un complément d\'entretien qui ramollit les dépôts de suie, mais ne remplace jamais le passage d\'un professionnel. Les bûches de ramonage ne donnent pas droit à un certificat.' },
      { q: 'Qu\'est-ce que le bistre et comment le traiter ?', a: 'Le bistre est un dépôt dur et inflammable qui se forme sur les parois du conduit, surtout avec du bois humide ou une combustion lente. Le débistrage nécessite une machine rotative spéciale (débistreuse) et coûte 150 à 400 €. Un ramonage classique ne suffit pas à l\'éliminer. Brûler du bois sec (moins de 20 % d\'humidité) limite sa formation.' },
      { q: 'Comment choisir un bon ramoneur ?', a: 'Vérifiez qu\'il possède une qualification Qualibat 5141 ou une certification équivalente, une assurance responsabilité civile professionnelle et qu\'il remet systématiquement un certificat de ramonage. Privilégiez un professionnel local recommandé par le bouche-à-oreille. Méfiez-vous des offres à moins de 30 € : un ramonage sérieux prend 20 à 40 minutes.' },
      { q: 'Le ramonage est-il à la charge du locataire ou du propriétaire ?', a: 'Le ramonage est une charge locative : c\'est au locataire de le faire réaliser et de le payer. En revanche, le propriétaire est responsable du bon état du conduit (tubage, étanchéité, conformité). Si le conduit est défaillant, c\'est au propriétaire de financer les travaux de remise en état.' },
      { q: 'Peut-on ramoner soi-même sa cheminée ?', a: 'Techniquement oui, mais un ramonage par un particulier n\'a aucune valeur légale : seul un professionnel qualifié peut délivrer le certificat de ramonage exigé par les assurances et la réglementation. En cas de sinistre sans certificat professionnel, l\'assureur peut refuser l\'indemnisation.' },
      { q: 'Combien coûte un ramonage en 2025 ?', a: 'Un ramonage standard de cheminée à foyer ouvert coûte 50 à 90 €. Pour un poêle à bois ou à granulés, comptez 60 à 100 €. Le ramonage d\'un conduit de chaudière gaz ou fioul revient à 50 à 80 €. Le débistrage, plus technique, coûte 200 à 500 € selon l\'état du conduit.' },
    ],
    emergencyInfo:
      'Intervention d\'urgence en cas de feu de cheminée ou de suspicion d\'intoxication au monoxyde de carbone (CO). Appelez les pompiers (18) en premier. Un ramoneur-fumiste peut intervenir sous 2 à 4 heures pour sécuriser le conduit après l\'intervention des secours. Majorations : +80 à 100 % la nuit et le week-end.',
    certifications: ['Qualibat (qualification 5141 ramonage et entretien de conduits)', 'Titre Professionnel Ramoneur-fumiste (inscrit au RNCP)', 'Compagnons du Devoir (formation d\'excellence)', 'Qualification Qualibat 5142 (ramonage — conduits de fumée)', 'Label Ramoneur certifié ONQR (Organisation Nationale de la Qualification du Ramonage)', 'Certification QUALIRAMONAGE (référentiel qualité métier)', 'Assurance responsabilité civile professionnelle (obligatoire)', 'Habilitation travail en hauteur (interventions sur toiture et souche de cheminée)'],
    averageResponseTime: 'Intervention sous 1 semaine en basse saison, 2 à 3 semaines en automne',
  },

  paysagiste: {
    slug: 'paysagiste',
    name: 'Paysagiste',
    priceRange: { min: 35, max: 80, unit: '€/m²' },
    commonTasks: [
      'Aménagement paysager complet : 35 à 80 €/m²',
      'Création de terrasse (bois, pierre) : 80 à 250 €/m²',
      'Engazonnement (semis ou placage) : 5 à 15 €/m²',
      'Plantation d\'arbres et haies : 30 à 100 €/unité',
      'Système d\'arrosage automatique : 10 à 25 €/m²',
      'Conception plan de jardin (étude paysagère) : 500 à 2 000 €',
      'Clôture et portail extérieur : 80 à 200 €/ml',
      'Éclairage extérieur paysager : 1 000 à 4 000 €',
      'Enrochement ou muret paysager : 150 à 400 €/m²',
      'Maçonnerie paysagère (allées, bordures) : 40 à 100 €/m²',
    ],
    tips: [
      'Un paysagiste concepteur (diplôme DPLG ou ENSP) conçoit le projet ; un paysagiste entrepreneur réalise les travaux. Les deux compétences sont parfois réunies chez le même professionnel.',
      'Demandez un plan d\'aménagement avec plantations adaptées au climat et au sol de votre région.',
      'Prévoyez les travaux de plantation entre octobre et mars (période de repos végétatif) pour favoriser la reprise des végétaux et bénéficier de tarifs pépiniéristes plus avantageux.',
      'Intégrez un système d\'arrosage automatique dès la conception du projet : l\'installer après coup coûte 30 à 50 % plus cher car il faut creuser dans un jardin déjà aménagé.',
      'Demandez un plan d\'entretien annuel chiffré : un beau jardin nécessite un suivi régulier (taille, fertilisation, désherbage) dont le coût annuel représente 5 à 10 % de l\'investissement initial.',
      'Un plan paysager professionnel évite les erreurs de plantation coûteuses à corriger : mauvais espacement, espèces inadaptées au sol ou à l\'exposition.',
      'Choisissez des plantes adaptées à votre sol et à votre exposition — un paysagiste sait les identifier grâce à une analyse de terrain, ce qui garantit un taux de reprise supérieur à 90 %.',
      'Prévoyez 10 à 15 % du budget total pour l\'éclairage extérieur : il valorise le jardin même la nuit et renforce la sécurité de votre propriété.',
    ],
    faq: [
      { q: 'Combien coûte l\'aménagement d\'un jardin de 200 m² ?', a: 'Pour un jardin de 200 m² avec terrasse, plantations et engazonnement, comptez 8 000 à 20 000 € selon le niveau de finition. Un projet haut de gamme avec piscine peut atteindre 50 000 €+.' },
      { q: 'Quelle est la différence entre un paysagiste et un jardinier ?', a: 'Le paysagiste conçoit et réalise des aménagements extérieurs complets (terrasses, plantations, murets, éclairage, arrosage). Le jardinier assure l\'entretien courant (tonte, taille, désherbage). Un paysagiste diplômé DPLG ou ENSP peut aussi réaliser des études de sol et des plans d\'architecte paysagiste. Pour un simple entretien de jardin, un jardinier suffit (20 à 40 €/h).' },
      { q: 'Faut-il un permis pour des travaux d\'aménagement extérieur ?', a: 'Aucune autorisation n\'est requise pour les plantations et l\'engazonnement. En revanche, une déclaration préalable de travaux est nécessaire pour une terrasse de plus de 20 m² ou surélevée de plus de 60 cm, un mur de clôture dépassant 2 m de hauteur, ou un abri de jardin de plus de 5 m². Un permis de construire s\'impose au-delà de 20 m² de surface de plancher.' },
      { q: 'Quelles plantes choisir pour un jardin facile d\'entretien ?', a: 'Privilégiez les plantes vivaces adaptées à votre zone climatique : lavande, romarin et olivier en climat méditerranéen ; hortensias, érables et graminées en climat océanique. Les couvre-sols (pervenche, lierre, thym rampant) limitent le désherbage. Un paillis minéral ou organique réduit l\'arrosage de 50 % et freine la pousse des mauvaises herbes.' },
      { q: 'Comment estimer le budget d\'entretien annuel d\'un jardin ?', a: 'Pour un jardin de 200 m², comptez 1 000 à 3 000 €/an en entretien professionnel (tonte bimensuelle, taille des haies 2 fois/an, traitement phytosanitaire, nettoyage). Un contrat annuel d\'entretien avec un paysagiste est 20 à 30 % moins cher que des interventions ponctuelles. Le crédit d\'impôt « services à la personne » (50 %) s\'applique pour l\'entretien de jardin chez les particuliers.' },
      { q: 'Paysagiste ou jardinier : qui contacter ?', a: 'Le paysagiste intervient pour la conception et la création d\'espaces extérieurs (terrasses, massifs, éclairage, arrosage intégré). Le jardinier se charge de l\'entretien courant (tonte, taille, désherbage). Certains professionnels cumulent les deux compétences. Pour un projet d\'aménagement complet, privilégiez un paysagiste qualifié ; pour un entretien régulier, un jardinier suffit (20 à 40 €/h).' },
      { q: 'Combien coûte un aménagement de jardin complet ?', a: 'Comptez 30 à 80 €/m² pour un jardin simple (engazonnement, quelques plantations, allée). Pour un aménagement haut de gamme incluant terrasse bois ou pierre, plantations structurées et éclairage paysager, le budget monte à 80 à 200 €/m². Un jardin de 300 m² en gamme intermédiaire revient à 15 000 à 30 000 € tout compris.' },
      { q: 'Faut-il un permis pour aménager son jardin ?', a: 'Non, la plupart des aménagements paysagers (plantations, engazonnement, allées) ne nécessitent aucune autorisation. Cependant, une déclaration préalable est obligatoire pour une construction de plus de 5 m² au sol, un mur ou une clôture de plus de 2 m de haut, une piscine de plus de 10 m², ou un abri de jardin dépassant 20 m². Au-delà de 20 m² de surface de plancher, un permis de construire est requis.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour l\'aménagement paysager. Les projets de création de jardin, terrasse et plantations sont planifiés sur plusieurs semaines. Prenez rendez-vous pour une étude sous 2 semaines.',
    certifications: ['Diplôme ENSP ou DEP Paysage (titre de paysagiste concepteur)', 'Qualipaysage (certification professionnelle — reconnue par l\'État)', 'Label Écojardin (gestion écologique et durable des espaces verts)', 'Certiphyto (obligatoire si utilisation de produits phytosanitaires)', 'Qualibat 1131 (voirie et réseaux divers — terrassement paysager)', 'BTS Aménagements paysagers (diplôme de référence pour les techniciens)', 'Assurance décennale (obligatoire pour la maçonnerie paysagère : murets, terrasses, escaliers)', 'Label Jardins de France (réseau d\'excellence des jardins remarquables)'],
    averageResponseTime: 'Étude sous 2 semaines, réalisation 2 à 8 semaines',
  },

  pisciniste: {
    slug: 'pisciniste',
    name: 'Pisciniste',
    priceRange: { min: 15000, max: 50000, unit: '€' },
    commonTasks: [
      'Piscine coque polyester 8×4 m : 15 000 à 25 000 €',
      'Piscine béton maçonnée 8×4 m : 25 000 à 50 000 €',
      'Piscine hors-sol bois ou acier : 3 000 à 10 000 €',
      'Rénovation de liner : 2 000 à 5 000 €',
      'Mise en sécurité (alarme, barrière, couverture) : 1 000 à 5 000 €',
      'Installation pompe à chaleur piscine : 2 000 à 5 000 €',
      'Mise en hivernage complète : 200 à 400 €',
      'Ouverture de saison (mise en route) : 200 à 350 €',
      'Installation traitement automatique (électrolyse au sel) : 1 500 à 3 000 €',
    ],
    tips: [
      'La mise en sécurité est obligatoire (loi du 3 janvier 2003) : alarme, barrière, couverture ou abri. Amende de 45 000 € en cas de non-respect.',
      'Prévoyez un budget annuel d\'entretien de 500 à 1 500 € (produits, électricité, hivernage).',
      'Faites réaliser une étude de sol avant de choisir le type de piscine : un terrain argileux ou avec une nappe phréatique haute impose des contraintes de construction qui peuvent doubler le budget.',
      'Comparez les garanties décennales des piscinistes : la structure (béton, coque) doit être couverte 10 ans, mais le liner et les équipements techniques ont des garanties plus courtes (2 à 5 ans).',
      'Pensez à l\'hivernage actif (filtration réduite) plutôt que passif (arrêt total) si vous êtes dans une région où les températures descendent rarement sous 0°C : la remise en route au printemps sera beaucoup plus simple.',
      'Une couverture isotherme réduit l\'évaporation de 90 % et la consommation de chauffage de 50 % : c\'est l\'investissement le plus rentable pour toute piscine chauffée.',
      'L\'électrolyse au sel réduit le budget produits chimiques de 70 % par rapport au traitement au chlore classique, tout en offrant une eau plus douce et moins irritante pour la peau et les yeux.',
      'Faites analyser l\'eau de votre piscine par un professionnel au moins une fois par saison : un pH mal équilibré (hors 7,0 à 7,4) rend le traitement inefficace et accélère l\'usure du liner et des équipements.',
    ],
    faq: [
      { q: 'Faut-il un permis de construire pour une piscine ?', a: 'Pas de formalité pour les piscines de moins de 10 m². Déclaration préalable de travaux pour les piscines de 10 à 100 m². Permis de construire obligatoire au-delà de 100 m² ou pour les piscines couvertes de plus de 1,80 m de hauteur. La taxe d\'aménagement s\'applique à toutes les piscines de plus de 10 m² (200 €/m² en 2025).' },
      { q: 'Piscine coque ou béton : laquelle choisir ?', a: 'La piscine coque polyester est moins chère (15 000 à 25 000 € pour 8×4 m), plus rapide à installer (1 à 2 semaines) et facile d\'entretien, mais les formes et dimensions sont limitées au catalogue du fabricant. La piscine béton (25 000 à 50 000 €) permet toutes les formes et dimensions sur mesure, mais nécessite 2 à 3 mois de travaux. Le béton est plus durable (50 ans+) que la coque (20 à 25 ans).' },
      { q: 'Quel système de traitement d\'eau choisir ?', a: 'Le chlore reste le plus économique (200 à 400 €/an) mais peut irriter la peau et les yeux. L\'électrolyse au sel (1 500 à 3 000 € d\'investissement) est plus confortable et économique sur le long terme. Le traitement UV ou à l\'ozone (2 000 à 4 000 €) réduit drastiquement l\'usage de produits chimiques. Le brome est recommandé pour les piscines chauffées (spa, couverture).' },
      { q: 'Combien coûte l\'entretien annuel d\'une piscine ?', a: 'Le budget annuel d\'entretien se situe entre 1 500 et 3 000 € par an pour une piscine enterrée : produits de traitement (300 à 600 €), électricité pour la filtration et le chauffage (300 à 800 €), entretien professionnel régulier (500 à 1 000 €), hivernage et ouverture de saison (400 à 700 € si réalisés par un pisciniste). Un robot nettoyeur automatique (800 à 2 000 €) réduit le temps d\'entretien manuel.' },
      { q: 'Une piscine augmente-t-elle la valeur de mon bien immobilier ?', a: 'Oui, une piscine enterrée bien entretenue peut augmenter la valeur d\'une maison de 5 à 15 % selon la région (davantage dans le sud). En revanche, elle augmente aussi la taxe foncière (via la taxe d\'aménagement de 200 €/m²) et les charges d\'assurance habitation. Dans les régions au nord de la Loire, la plus-value est plus limitée.' },
      { q: 'Quelle pompe à chaleur choisir pour chauffer sa piscine ?', a: 'Pour une piscine de 8×4 m (environ 50 m³), une pompe à chaleur de 9 à 12 kW suffit (2 000 à 5 000 € pose comprise). Privilégiez un modèle Inverter (modulation de puissance) qui consomme 30 à 40 % d\'énergie en moins qu\'un modèle on/off. Le COP (coefficient de performance) doit être supérieur à 5 pour être rentable. La PAC permet de gagner 5 à 10°C sur la température de l\'eau et d\'allonger la saison de baignade d\'avril à octobre.' },
      { q: 'Comment bien hiverner sa piscine ?', a: 'L\'hivernage se fait lorsque la température de l\'eau descend sous 12°C. Nettoyez le bassin, ajustez le pH entre 7,0 et 7,4, effectuez un traitement choc, baissez le niveau d\'eau sous les skimmers, purgez les canalisations et le local technique, posez les bouchons d\'hivernage et la couverture. L\'hivernage actif (filtration réduite 2 à 3 h/jour) est recommandé dans les régions au climat doux. Coût professionnel : 200 à 400 €.' },
      { q: 'Quels sont les dispositifs de sécurité obligatoires pour une piscine ?', a: 'La loi du 3 janvier 2003 impose au moins un des 4 dispositifs de sécurité normalisés pour toute piscine enterrée privée : barrière de protection NF P90-306 (1 000 à 5 000 €), alarme sonore NF P90-307 (200 à 1 000 €), couverture de sécurité NF P90-308 (1 500 à 5 000 €) ou abri de piscine NF P90-309 (5 000 à 30 000 €). Le non-respect est passible d\'une amende de 45 000 €.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour la construction de piscine. En cas de fuite de votre piscine existante ou de panne du système de filtration, contactez votre pisciniste pour un diagnostic sous 48h à 1 semaine.',
    certifications: ['Qualification FPP (Fédération des Professionnels de la Piscine)', 'Label Propiscines', 'Certification NF Piscine', 'Label QualiPAC (pompe à chaleur piscine)', 'Certification Qualibat piscine (construction et rénovation)', 'NF P90-308 (couverture de sécurité piscine)', 'Assurance décennale obligatoire (structure et étanchéité)', 'Certification AFNOR NF C15-100 (conformité électrique local technique)'],
    averageResponseTime: 'Étude sous 2 semaines, construction 4 à 12 semaines',
  },

  'alarme-securite': {
    slug: 'alarme-securite',
    name: 'Alarme et sécurité',
    priceRange: { min: 500, max: 3000, unit: '€' },
    commonTasks: [
      'Alarme sans fil (maison 100 m²) : 500 à 1 500 €',
      'Vidéosurveillance (4 caméras) : 1 000 à 3 000 €',
      'Interphone/visiophone : 300 à 1 500 €',
      'Contrôle d\'accès (digicode, badge) : 500 à 2 000 €',
      'Télésurveillance (abonnement) : 20 à 50 €/mois',
      'Détecteur de mouvement extérieur : 150 à 400 €',
      'Alarme connectée smartphone (pack maison) : 300 à 1 200 €',
      'Coffre-fort encastré (pose comprise) : 500 à 2 500 €',
    ],
    tips: [
      'Privilégiez les systèmes certifiés NF A2P (1 à 3 boucliers) — c\'est un gage de fiabilité reconnu par les assurances.',
      'Une alarme avec télésurveillance permet une intervention des forces de l\'ordre en 15 à 20 minutes en zone urbaine.',
      'Installez des détecteurs sur tous les points d\'accès vulnérables : porte d\'entrée, baies vitrées, portes de garage et fenêtres du rez-de-chaussée. Un système sous-dimensionné laisse des zones non couvertes.',
      'Pour la vidéosurveillance extérieure, vérifiez la réglementation RGPD : vos caméras ne doivent filmer que votre propriété privée, jamais la voie publique ni le jardin du voisin.',
      'Testez votre alarme au moins une fois par trimestre en déclenchant une alerte test auprès de votre centre de télésurveillance : c\'est la seule façon de vérifier que toute la chaîne fonctionne.',
      'Placez les détecteurs de mouvement à 2,20 m de hauteur dans les angles de pièce pour une couverture optimale et éviter les déclenchements intempestifs par les animaux domestiques.',
      'Vérifiez que votre assurance habitation exige ou recommande un type d\'alarme spécifique (NF A2P) : installer le bon modèle dès le départ vous évitera de devoir changer d\'équipement pour être couvert.',
      'Prévenez votre assureur dès l\'installation de votre alarme pour bénéficier d\'une réduction de prime pouvant aller jusqu\'à 15 % sur votre contrat multirisque habitation.',
    ],
    faq: [
      { q: 'Mon assurance baisse-t-elle avec une alarme ?', a: 'Oui, la plupart des assureurs accordent une réduction de 5 à 15 % sur la prime habitation pour un système d\'alarme certifié NF A2P avec télésurveillance. Certains contrats exigent même une alarme pour couvrir les objets de valeur supérieure à un certain montant.' },
      { q: 'Alarme filaire ou sans fil : que choisir ?', a: 'L\'alarme sans fil est la plus répandue en résidentiel : installation rapide (1 journée), pas de travaux de câblage, et elle se déplace facilement en cas de déménagement. L\'alarme filaire est plus fiable (pas de problème de batterie ni d\'interférence radio), idéale pour les grandes maisons ou les locaux professionnels, mais nécessite des travaux d\'installation plus importants.' },
      { q: 'Peut-on installer une caméra de vidéosurveillance chez soi sans autorisation ?', a: 'Chez un particulier, aucune autorisation n\'est requise tant que les caméras ne filment que votre propriété privée (jardin, entrée, garage). Il est interdit de filmer la voie publique, le trottoir ou la propriété des voisins. En copropriété, l\'installation dans les parties communes nécessite un vote en assemblée générale. Vous devez informer vos visiteurs par un panneau visible.' },
      { q: 'La télésurveillance vaut-elle le coût de l\'abonnement ?', a: 'L\'abonnement de télésurveillance (20 à 50 €/mois) inclut la surveillance 24h/24 par un opérateur qui lève le doute en cas d\'alerte et prévient les forces de l\'ordre si nécessaire. C\'est particulièrement utile si vous vous absentez souvent ou si vous avez une résidence secondaire. Sans télésurveillance, l\'alarme ne fait que sonner localement, ce qui est peu dissuasif en zone isolée.' },
      { q: 'Combien de détecteurs faut-il pour protéger une maison ?', a: 'Pour une maison standard de 100 m² sur un niveau : 1 centrale, 1 détecteur d\'ouverture par porte/fenêtre accessible (6 à 10), 2 à 3 détecteurs de mouvement pour les zones de passage intérieures, 1 sirène extérieure et 2 télécommandes. Comptez 500 à 1 500 € pour un kit complet sans fil certifié NF A2P, hors pose professionnelle (200 à 500 €).' },
      { q: 'Faut-il un abonnement de télésurveillance ?', a: 'L\'abonnement de télésurveillance (20 à 50 €/mois) n\'est pas obligatoire mais fortement recommandé. Il permet une intervention rapide en cas d\'alerte grâce à un opérateur qui assure la levée de doute vidéo et prévient les forces de l\'ordre si nécessaire. Sans abonnement, l\'alarme se limite à une sirène locale, peu efficace en zone isolée.' },
      { q: 'Comment dissuader les cambrioleurs efficacement ?', a: 'La combinaison de plusieurs dispositifs est la plus dissuasive : une alarme visible avec sirène extérieure, des caméras apparentes aux points d\'accès, un éclairage à détection de mouvement autour du domicile et un simulateur de présence (lumières et volets programmés). Les statistiques montrent que 80 % des cambrioleurs renoncent face à une alarme visible.' },
      { q: 'Les détecteurs de fumée interconnectés sont-ils obligatoires ?', a: 'Depuis 2015, au moins un détecteur de fumée (DAAF) est obligatoire par logement. L\'interconnexion n\'est pas imposée par la loi mais est vivement recommandée : lorsqu\'un détecteur se déclenche, tous les autres sonnent simultanément, ce qui est crucial dans les grandes maisons à étages. Comptez 20 à 50 € par détecteur interconnecté sans fil, contre 5 à 15 € pour un modèle autonome.' },
    ],
    emergencyInfo:
      'Intervention d\'urgence pour système d\'alarme en panne, caméra de vidéosurveillance défaillante ou intrusion détectée. Un technicien en sécurité peut intervenir sous 2 à 4 heures pour diagnostiquer et remettre en service votre installation. Majorations : +80 à 120 % la nuit et le week-end.',
    certifications: ['Certification APSAD (Assemblée Plénière des Sociétés d\'Assurance Dommages)', 'Label NF A2P (alarmes anti-intrusion — 1 à 3 boucliers)', 'Habilitation CNAPS (agents de sécurité)', 'Qualification CNPP (Centre National de Prévention et de Protection)', 'Certification NF Service Télésurveillance', 'Qualification Qualifelec (installations électroniques de sécurité)', 'Certification SSI (Système de Sécurité Incendie)', 'Assurance responsabilité civile professionnelle (obligatoire)'],
    averageResponseTime: 'Devis sous 48h, installation sous 1 semaine',
  },

  antenniste: {
    slug: 'antenniste',
    name: 'Antenniste',
    priceRange: { min: 100, max: 400, unit: '€' },
    commonTasks: [
      'Installation antenne TNT : 100 à 250 €',
      'Installation parabole satellite : 150 à 400 €',
      'Raccordement fibre optique intérieur : 100 à 300 €',
      'Amplificateur de signal TNT : 80 à 200 €',
      'Câblage coaxial ou Ethernet : 30 à 60 €/point',
      'Orientation ou réorientation parabole satellite : 80 à 150 €',
      'Installation antenne 4G/5G fixe (box extérieure) : 150 à 350 €',
      'Installation antenne collective immeuble : 500 à 2 000 €',
    ],
    tips: [
      'Depuis 2023, la TNT en Ultra HD (DVB-T2) se déploie progressivement. Vérifiez que votre installation est compatible.',
      'Pour une réception optimale de la TNT, l\'antenne doit être orientée vers l\'émetteur le plus proche (consultez le site de l\'ANFR).',
      'Si vous passez à la fibre optique, faites câbler plusieurs pièces en Ethernet Cat 6 lors de l\'installation : le Wi-Fi reste moins stable que le filaire pour le streaming 4K et le télétravail.',
      'En immeuble collectif, vérifiez si une antenne collective existe avant d\'installer une antenne individuelle — votre syndic peut avoir un contrat couvrant déjà la TNT et le satellite.',
      'Pour les zones de réception difficile, un amplificateur de signal TNT avec filtre 4G/5G évite les interférences causées par les antennes relais de téléphonie mobile à proximité.',
      'Vérifiez la couverture TNT de votre adresse sur recevoirlatnt.fr avant d\'investir dans une nouvelle antenne : le site indique l\'émetteur le plus proche et les chaînes disponibles.',
      'Un câble coaxial de qualité (double blindage, type 17 VATC ou PH 100) réduit considérablement les interférences et les pertes de signal, surtout sur les grandes longueurs.',
      'Une antenne intérieure ne suffit généralement pas au-delà de 20 km de l\'émetteur TNT : privilégiez une antenne extérieure en toiture pour une réception fiable et stable.',
    ],
    faq: [
      { q: 'TNT, satellite ou box internet : que choisir ?', a: 'La TNT est gratuite et couvre 97 % du territoire mais offre moins de chaînes. Le satellite (Canal+, Fransat) offre plus de chaînes mais nécessite une parabole. La box internet ADSL/fibre propose la TV via le réseau internet avec replay et VOD inclus. En zone blanche (pas de fibre ni de bonne couverture TNT), le satellite reste la meilleure option.' },
      { q: 'Pourquoi ma réception TNT est-elle mauvaise ?', a: 'Les causes les plus fréquentes sont : une antenne mal orientée ou vieillissante, un câble coaxial abîmé ou trop ancien (préférez le câble de type 17 VATC), des interférences 4G/5G (nécessitant un filtre LTE), un amplificateur défaillant ou des prises murales oxydées. Un antenniste peut diagnostiquer le problème en mesurant le signal à chaque point du réseau.' },
      { q: 'Combien coûte le raccordement fibre optique intérieur ?', a: 'Le raccordement de la fibre depuis le point de branchement optique (PBO) jusqu\'à la prise terminale optique (PTO) est gratuit et réalisé par l\'opérateur. En revanche, si vous souhaitez plusieurs prises Ethernet dans différentes pièces ou un câblage encastré, un antenniste facture 100 à 300 € par point de desserte, plus le passage de gaines si nécessaire.' },
      { q: 'Faut-il une autorisation pour installer une parabole ?', a: 'En maison individuelle, aucune autorisation n\'est requise sauf en zone protégée (ABF). En copropriété, le règlement peut interdire les paraboles en façade, mais la loi du 2 juillet 1966 garantit le « droit à l\'antenne » : le syndic ne peut pas refuser si aucune antenne collective ne fournit un service équivalent. La parabole doit être discrète et ne pas nuire à l\'esthétique du bâtiment.' },
      { q: 'Mon antenne TNT est-elle compatible avec la nouvelle norme DVB-T2 ?', a: 'L\'antenne elle-même (râteau UHF) est généralement compatible : c\'est le décodeur TNT ou le téléviseur qui doit supporter le DVB-T2/HEVC. Les téléviseurs vendus depuis 2020 intègrent généralement cette norme. Si votre téléviseur est plus ancien, un décodeur TNT HD compatible DVB-T2 coûte 30 à 60 €. Vérifiez sur le site recevoirlatnt.fr.' },
      { q: 'TNT ou satellite : quel choix pour une bonne réception TV ?', a: 'La TNT est gratuite et ne nécessite aucun abonnement, mais la couverture varie selon votre éloignement de l\'émetteur (environ 97 % du territoire). Le satellite (Astra 19.2° pour Fransat ou Canal+) couvre 100 % du territoire français, y compris les zones blanches, mais peut impliquer un abonnement selon le bouquet choisi. En zone bien couverte, la TNT reste le choix le plus économique.' },
      { q: 'Peut-on installer une antenne parabolique en copropriété ?', a: 'Oui, la loi du 2 juillet 1966 garantit le « droit à l\'antenne » pour tout occupant d\'un immeuble collectif. Le syndic ne peut pas s\'y opposer si aucune antenne collective ne fournit un service équivalent. Toutefois, le règlement de copropriété peut imposer des contraintes esthétiques : couleur, emplacement discret, fixation non visible depuis la rue. Il est conseillé de notifier le syndic par lettre recommandée avant l\'installation.' },
      { q: 'Comment améliorer la réception TNT dans une zone mal couverte ?', a: 'Plusieurs solutions existent : installer une antenne directionnelle à gain élevé (type Yagi) orientée précisément vers l\'émetteur, ajouter un amplificateur de signal avec filtre 4G/5G, positionner l\'antenne le plus haut possible sur le toit, et vérifier l\'état du câblage coaxial (remplacer tout câble de plus de 15 ans). Un antenniste peut mesurer le niveau de signal et recommander la meilleure combinaison.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour l\'installation d\'antennes ou de paraboles. Pour une panne de réception TNT ou satellite, un antenniste peut intervenir sous 48h à 1 semaine pour un diagnostic et une réparation.',
    certifications: ['Titre Professionnel Installateur Antenniste (inscrit au RNCP)', 'Habilitation électrique (obligatoire)', 'Habilitation travail en hauteur (obligatoire pour interventions sur toiture)', 'Formation fibre optique FTTH (raccordement et câblage)', 'Qualification professionnelle antenniste (Chambre des Métiers)', 'Certification ACOME (câblage et connectique)', 'Label Quali\'SAT (installateur satellite agréé)', 'CACES nacelle (interventions en hauteur sur immeubles)'],
    averageResponseTime: 'Intervention sous 48h à 1 semaine',
  },

  ascensoriste: {
    slug: 'ascensoriste',
    name: 'Ascensoriste',
    priceRange: { min: 15000, max: 50000, unit: '€' },
    commonTasks: [
      'Installation ascenseur 3 étages : 20 000 à 50 000 €',
      'Monte-escalier (1 étage) : 3 500 à 8 000 €',
      'Plateforme élévatrice PMR : 8 000 à 15 000 €',
      'Contrat de maintenance annuel : 1 500 à 4 000 €',
      'Modernisation d\'ascenseur existant : 10 000 à 30 000 €',
      'Ascenseur privatif 2 étages (hydraulique ou pneumatique) : 15 000 à 40 000 €',
      'Monte-escalier tournant sur mesure : 6 000 à 12 000 €',
      'Mise aux normes ascenseur existant (loi SAE) : 10 000 à 50 000 €',
      'Dépannage ascenseur bloqué (intervention d\'urgence) : 150 à 400 €',
    ],
    tips: [
      'Le contrat de maintenance est obligatoire (décret du 9 septembre 2004). Comparez les offres : certains contrats incluent les pièces d\'usure, d\'autres non.',
      'Pour un monte-escalier, vérifiez la largeur de l\'escalier (65 cm minimum) et la capacité de charge (jusqu\'à 130 kg standard).',
      'Avant de signer un contrat de maintenance, vérifiez s\'il est « à l\'entretien complet » (pièces incluses) ou « à l\'entretien normal » (pièces en supplément) : la différence de coût annuel peut être de 30 à 50 %.',
      'Un ascenseur en copropriété doit faire l\'objet d\'un contrôle technique quinquennal obligatoire par un organisme agréé, indépendamment du contrat de maintenance.',
      'Pour l\'installation d\'un monte-escalier, demandez une démonstration à domicile avant d\'acheter : chaque escalier est différent (courbe, largeur, palier intermédiaire) et le confort d\'utilisation doit être testé in situ.',
      'Un contrat de maintenance « étendu » (pièces incluses) coûte plus cher qu\'un contrat « normal », mais il évite les mauvaises surprises en cas de remplacement de moteur ou de carte électronique (500 à 3 000 € la pièce).',
      'La mise aux normes SAE (sécurité des ascenseurs existants) est obligatoire en copropriété : vérifiez que votre syndic a planifié et budgété les travaux, sous peine de responsabilité en cas d\'accident.',
      'Comparez impérativement les devis de maintenance entre prestataires : les écarts de prix pour un même ascenseur peuvent atteindre 100 % d\'un ascensoriste à l\'autre, sans différence de prestation réelle.',
    ],
    faq: [
      { q: 'Quelles aides pour un monte-escalier ?', a: 'MaPrimeAdapt\' (jusqu\'à 70 % pour les revenus modestes), TVA réduite à 5,5 %, crédit d\'impôt de 25 % (plafonné à 5 000 € pour une personne seule), aides des caisses de retraite et de l\'ANAH. Le reste à charge peut être inférieur à 1 000 € pour un ménage modeste.' },
      { q: 'Peut-on installer un ascenseur dans une maison individuelle ?', a: 'Oui, il existe des ascenseurs privatifs compacts (cabine de 1 m² environ) qui s\'installent dans une trémie de 1,20 × 1,20 m ou à l\'extérieur du bâtiment. Le coût varie de 15 000 à 40 000 € selon le nombre d\'étages et le type (hydraulique, électrique, pneumatique). Un permis de construire est nécessaire si l\'installation modifie la structure ou la façade du bâtiment.' },
      { q: 'Monte-escalier droit ou tournant : quelle différence de prix ?', a: 'Un monte-escalier pour escalier droit coûte 3 500 à 5 000 € car le rail est standard. Pour un escalier tournant ou avec palier, le rail est fabriqué sur mesure, ce qui porte le prix à 6 000 à 12 000 €. L\'installation prend 2 à 4 heures pour un droit et une journée pour un tournant. Les deux types bénéficient des mêmes aides financières.' },
      { q: 'Quel est le coût de maintenance d\'un ascenseur en copropriété ?', a: 'Le contrat de maintenance annuel coûte 1 500 à 4 000 € selon le type d\'ascenseur et le niveau de prestation (normal ou complet). La loi impose un entretien mensuel, un contrôle semestriel de sécurité et un contrôle technique quinquennal par un organisme indépendant (1 000 à 2 000 €). Le budget total annuel pour un ascenseur est de 2 500 à 6 000 €.' },
      { q: 'Quelles sont les normes de sécurité pour un ascenseur ?', a: 'Les ascenseurs doivent respecter la directive européenne 2014/33/UE et la norme NF EN 81-20. Les travaux de modernisation obligatoires (loi SAE de 2003) incluent : porte palière verrouillée, dispositif anti-vandalisme, système de télécommunication en cabine, précision d\'arrêt et d\'horizontalité, et dispositif de protection contre la vitesse excessive.' },
      { q: 'Combien coûte un ascenseur privatif ?', a: 'Un ascenseur privatif coûte entre 15 000 et 40 000 € selon le nombre d\'étages et la technologie choisie. L\'ascenseur hydraulique est le moins cher (15 000 à 25 000 €) mais nécessite un local technique. L\'ascenseur électrique à gaines (20 000 à 35 000 €) est plus silencieux et économe en énergie. L\'ascenseur pneumatique (25 000 à 40 000 €) ne nécessite ni fosse ni local technique, ce qui réduit considérablement les travaux de gros œuvre. Ajoutez 3 000 à 8 000 € pour les travaux de maçonnerie (trémie, fosse).' },
      { q: 'Un monte-escalier est-il éligible aux aides financières ?', a: 'Oui, plusieurs dispositifs existent : MaPrimeRénov\' Autonomie (jusqu\'à 4 000 € selon les revenus), crédit d\'impôt de 25 % plafonné à 5 000 € par personne (10 000 € pour un couple), TVA réduite à 5,5 % si le logement a plus de 2 ans, APA (allocation personnalisée d\'autonomie) si perte d\'autonomie GIR 1 à 4, aides des caisses de retraite (CARSAT, MSA) et de l\'ANAH. Le cumul de ces aides peut réduire le reste à charge à moins de 1 000 € pour un ménage modeste.' },
      { q: 'Quelle est la durée de vie d\'un ascenseur ?', a: 'Un ascenseur bien entretenu dure 25 à 40 ans avant de nécessiter un remplacement complet. Les pièces d\'usure (câbles, poulies, contacts de porte) sont remplacées régulièrement dans le cadre du contrat de maintenance. La modernisation de la cabine (5 000 à 15 000 €) peut prolonger la durée de vie de 10 à 15 ans. Le contrat de maintenance est obligatoire pour les ascenseurs en ERP et en copropriété ; il est vivement recommandé pour les ascenseurs privatifs afin de garantir la sécurité et la longévité de l\'installation.' },
    ],
    emergencyInfo:
      'En cas de personne bloquée dans un ascenseur ou de panne immobilisant la cabine, les sociétés d\'ascenseurs ont l\'obligation réglementaire (décret n° 2004-964) de disposer d\'un service de garde joignable à tout moment. En cas de personne bloquée, appelez également les pompiers (18). Majorations : +100 à 150 % la nuit, le week-end et les jours fériés.',
    certifications: ['Conformité NF EN 81-20/50 (norme européenne de sécurité des ascenseurs)', 'Habilitation électrique HBT (obligatoire)', 'Certification constructeur agréé (Otis, Schindler, Kone, ThyssenKrupp)', 'Contrôle technique quinquennal obligatoire (organisme agréé)', 'Certification APAVE ou Bureau Veritas (contrôle technique réglementaire)', 'Qualibat 5411 (installation et maintenance d\'ascenseurs)', 'Certification ascensoriste agréé (délivrée par les constructeurs)', 'Assurance décennale obligatoire (couvre les vices de construction pendant 10 ans)'],
    averageResponseTime: 'Diagnostic sous 1 semaine, installation 4 à 12 semaines',
  },

  diagnostiqueur: {
    slug: 'diagnostiqueur',
    name: 'Diagnostiqueur',
    priceRange: { min: 100, max: 600, unit: '€' },
    commonTasks: [
      'DPE (Diagnostic de Performance Énergétique) : 100 à 250 €',
      'Pack diagnostics vente (DPE + amiante + plomb + électricité + gaz + termites) : 300 à 600 €',
      'Diagnostic amiante : 80 à 150 €',
      'Diagnostic plomb (CREP) : 100 à 200 €',
      'Diagnostic électricité ou gaz : 100 à 150 €',
      'Diagnostic électricité (installation de plus de 15 ans) : 80 à 150 €',
      'Diagnostic gaz (installation de plus de 15 ans) : 80 à 130 €',
      'Diagnostic termites (zones à arrêté préfectoral) : 80 à 150 €',
      'Mesurage loi Carrez (superficie privative) : 70 à 120 €',
      'Diagnostic assainissement non collectif : 100 à 200 €',
    ],
    tips: [
      'Le DPE est obligatoire pour toute vente ou location depuis 2006. Depuis 2021, il est opposable juridiquement : un mauvais DPE peut entraîner une action en justice.',
      'Regroupez tous les diagnostics chez un même professionnel pour obtenir un tarif pack (30 à 40 % de réduction).',
      'Vérifiez que votre diagnostiqueur est certifié par un organisme accrédité COFRAC et qu\'il dispose d\'une assurance responsabilité civile professionnelle à jour — c\'est une obligation légale.',
      'Anticipez les diagnostics avant la mise en vente : un DPE défavorable (F ou G) doit être affiché sur l\'annonce immobilière et peut réduire le prix de vente de 5 à 15 %.',
      'Pour une location, le DPE et l\'ERP sont obligatoires lors de chaque nouveau bail. Le diagnostic plomb (CREP) est aussi requis pour les logements construits avant 1949.',
      'Le DPE influence directement la valeur de votre bien : les logements classés F ou G subissent un malus de 5 à 15 % sur le prix de vente par rapport à un bien équivalent classé D ou E.',
      'Vérifiez la certification COFRAC de votre diagnostiqueur sur le site du ministère de la Transition écologique — un diagnostic réalisé par un professionnel non certifié est juridiquement nul.',
      'Pour la vente d\'un T3, prévoyez un budget de 300 à 600 € pour le pack diagnostic complet ; pour une maison individuelle, comptez 500 à 900 € selon la surface et l\'ancienneté du bien.',
    ],
    faq: [
      { q: 'Quels diagnostics sont obligatoires pour vendre ?', a: 'DPE, diagnostic amiante (si permis avant 1997), plomb (si avant 1949), électricité et gaz (si installations de plus de 15 ans), termites (dans les zones à risque), ERP (état des risques et pollutions), et mesurage loi Carrez. Le DPE a une durée de validité de 10 ans, les autres varient de 6 mois (termites) à illimité (amiante si négatif).' },
      { q: 'Combien de temps les diagnostics immobiliers sont-ils valables ?', a: 'La validité varie selon le diagnostic : DPE : 10 ans. Amiante : illimité si négatif (à refaire si positif après travaux). Plomb (CREP) : illimité si négatif, 1 an si positif (pour la vente), 6 ans pour la location. Électricité et gaz : 3 ans pour la vente, 6 ans pour la location. Termites : 6 mois. ERP : 6 mois. Loi Carrez : illimité sauf travaux.' },
      { q: 'Le DPE est-il fiable ?', a: 'Depuis la réforme de 2021, le DPE est calculé selon une méthode unifiée (3CL-2021) qui prend en compte l\'enveloppe du bâtiment, le système de chauffage et la ventilation. Il est désormais opposable juridiquement. Toutefois, des écarts de résultats entre diagnostiqueurs persistent. N\'hésitez pas à demander un second avis si le résultat vous semble incohérent.' },
      { q: 'Peut-on contester un diagnostic immobilier ?', a: 'Oui, si vous estimez qu\'un diagnostic est erroné, vous pouvez faire appel à un autre diagnostiqueur pour un contre-diagnostic. En cas de préjudice avéré (DPE surévalué ayant conduit à un achat plus cher), une action en justice contre le diagnostiqueur est possible via son assurance RC professionnelle. Le vendeur peut aussi être mis en cause pour vice caché.' },
      { q: 'Faut-il être présent lors des diagnostics ?', a: 'Ce n\'est pas obligatoire mais fortement recommandé, surtout pour le DPE. Votre présence permet de fournir des informations utiles au diagnostiqueur (factures d\'énergie, travaux récents d\'isolation, type de chauffage) qui amélioreront la précision du diagnostic. Le diagnostiqueur doit avoir accès à toutes les pièces, y compris les combles, la cave et le garage.' },
      { q: 'Combien coûte un pack diagnostic complet ?', a: 'Pour un appartement T3, un pack complet (DPE + amiante + plomb + électricité + gaz + Carrez + ERP) coûte entre 300 et 600 €. Pour une maison individuelle, comptez 500 à 900 € en raison de la surface plus importante et du diagnostic assainissement éventuellement requis. Regrouper tous les diagnostics chez un seul professionnel permet une réduction de 30 à 40 % par rapport à des diagnostics commandés séparément.' },
      { q: 'Quelle est la durée de validité du DPE ?', a: 'Le DPE est valable 10 ans. Attention aux anciens DPE : ceux réalisés entre le 1er janvier 2018 et le 30 juin 2021 ne sont valables que jusqu\'au 31 décembre 2024. Ceux réalisés entre le 1er janvier 2013 et le 31 décembre 2017 sont déjà caducs depuis le 1er janvier 2023. En cas de travaux de rénovation énergétique significatifs, il est recommandé de refaire le DPE pour valoriser votre bien.' },
      { q: 'Quels diagnostics sont obligatoires pour une location ?', a: 'Pour toute mise en location, le bailleur doit fournir un DPE en cours de validité, un ERP (état des risques et pollutions) de moins de 6 mois, et un diagnostic plomb (CREP) si le logement a été construit avant le 1er janvier 1949. Depuis 2023, les logements classés G+ au DPE (consommation supérieure à 450 kWh/m²/an) sont interdits à la location. Cette interdiction s\'étendra à tous les G en 2025, aux F en 2028 et aux E en 2034.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour les diagnostics immobiliers. Les diagnostics (DPE, amiante, plomb, électricité, gaz) sont des prestations planifiées. Intervention possible sous 48h à 1 semaine selon la disponibilité.',
    certifications: ['Certification par organisme accrédité COFRAC (obligatoire — Bureau Veritas, Dekra, Qualixpert, I.Cert, etc.)', 'Certifications par domaine : DPE, amiante, plomb, électricité, gaz, termites (chacune est spécifique)', 'Assurance RC professionnelle (obligatoire)', 'Formation continue obligatoire (recyclage tous les 7 ans)', 'Certification avec mention DPE (obligatoire pour les bâtiments publics et ERP)', 'Certification amiante avec mention (repérage avant travaux et démolition)', 'Certification amiante sans mention (repérage avant vente uniquement)', 'Certification plomb (habilitation spécifique pour le CREP)'],
    averageResponseTime: 'Intervention sous 48h à 1 semaine',
  },

  geometre: {
    slug: 'geometre',
    name: 'Géomètre',
    priceRange: { min: 500, max: 3000, unit: '€' },
    commonTasks: [
      'Bornage de terrain : 800 à 2 000 €',
      'Division parcellaire : 1 000 à 3 000 €',
      'Plan topographique : 500 à 1 500 €',
      'Plan de masse (permis de construire) : 300 à 800 €',
      'Implantation de construction : 500 à 1 500 €',
      'Division parcellaire (lotissement) : 800 à 2 500 €',
      'Attestation de surface Carrez : 80 à 150 €',
      'Implantation de construction (permis de construire) : 500 à 1 500 €',
    ],
    tips: [
      'Seul un géomètre-expert inscrit à l\'Ordre peut réaliser un bornage officiel — les documents produits par un géomètre non inscrit n\'ont pas de valeur juridique.',
      'Le bornage est obligatoire pour toute vente de terrain à bâtir (loi SRU). Il est aussi recommandé en cas de litige de voisinage.',
      'Demandez un devis détaillé qui distingue les honoraires du géomètre-expert et les frais annexes (déplacement, bornes, publication au cadastre) : les tarifs ne sont pas réglementés et varient du simple au triple.',
      'Pour un projet de construction, faites intervenir le géomètre-expert en amont : le plan topographique et l\'implantation de la construction sont indispensables avant le dépôt du permis de construire.',
      'Conservez précieusement le procès-verbal de bornage : c\'est un document juridique définitif qui ne peut être contesté que par voie judiciaire et qui engage votre voisin autant que vous.',
      'Vérifiez que votre géomètre est bien inscrit à l\'Ordre des Géomètres-Experts sur le site officiel geometre-expert.fr.',
      'Pour un bornage, prévenez vos voisins à l\'avance : leur présence est nécessaire pour un bornage amiable, moins coûteux qu\'un bornage judiciaire.',
    ],
    faq: [
      { q: 'Quelle est la différence entre bornage et cadastre ?', a: 'Le bornage fixe les limites réelles de propriété sur le terrain (bornes physiques + procès-verbal). Le cadastre est un document fiscal qui donne les limites indicatives. En cas de contradiction, le bornage prévaut. Le cadastre n\'a pas de valeur juridique pour déterminer les limites de propriété.' },
      { q: 'Mon voisin peut-il refuser un bornage ?', a: 'Non, le bornage est un droit imprescriptible prévu par l\'article 646 du Code civil. Si votre voisin refuse de participer au bornage amiable, vous pouvez saisir le tribunal judiciaire pour demander un bornage judiciaire. Le juge désignera un géomètre-expert et les frais seront partagés entre les deux parties. La procédure dure 6 à 18 mois.' },
      { q: 'Combien coûte un bornage de terrain ?', a: 'Le bornage amiable coûte entre 800 et 2 000 € selon la taille du terrain, le nombre de bornes à poser et la complexité (terrain en pente, accès difficile, nombreux voisins). Le bornage judiciaire est plus cher (2 000 à 5 000 €) en raison des frais de procédure. Les honoraires sont libres mais doivent être annoncés par devis préalable.' },
      { q: 'Qu\'est-ce qu\'une division parcellaire ?', a: 'La division parcellaire consiste à diviser un terrain en deux ou plusieurs lots constructibles. Le géomètre-expert réalise le plan de division, dépose le dossier en mairie et procède au bornage des nouveaux lots. Cette opération est obligatoire pour vendre une partie de son terrain. Le coût est de 1 000 à 3 000 € et le délai de 1 à 3 mois.' },
      { q: 'Le géomètre-expert est-il nécessaire pour un permis de construire ?', a: 'Ce n\'est pas une obligation légale, mais le plan topographique et le plan de masse (pièces PCMI 2 et PCMI 3) réalisés par un géomètre-expert sont beaucoup plus précis que ceux faits par un non-professionnel. Pour les projets complexes (terrain en pente, limite de propriété proche), le recours au géomètre est vivement recommandé pour éviter un refus de permis.' },
      { q: 'Quelle est la différence entre un géomètre-expert et un géomètre-topographe ?', a: 'Le géomètre-expert est inscrit à l\'Ordre (OGE), seul habilité à réaliser un bornage ayant valeur juridique. Le géomètre-topographe réalise des relevés techniques mais ne peut pas établir de documents fonciers opposables aux tiers.' },
      { q: 'Le bornage est-il obligatoire avant de vendre un terrain ?', a: 'Non obligatoire pour une vente classique, mais fortement recommandé. Il est obligatoire pour la vente d\'un lot de lotissement (loi SRU). Le bornage sécurise la transaction et évite les litiges futurs avec les voisins.' },
      { q: 'Combien coûte un bornage de terrain ?', a: 'Entre 600 et 2 000 € selon la complexité : nombre de bornes, accessibilité, recherches cadastrales nécessaires. Un bornage contradictoire (avec accord des voisins) est moins cher qu\'un bornage judiciaire.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour les prestations de géomètre-expert. Le bornage, la division parcellaire et les plans topographiques sont des missions planifiées. Prenez rendez-vous pour un devis sous 1 semaine.',
    certifications: ['Inscription à l\'Ordre des Géomètres-Experts (obligatoire)', 'Diplôme DPLG ou ESGT', 'Assurance RC professionnelle obligatoire', 'Inscription à l\'Ordre des Géomètres-Experts (OGE — obligatoire)', 'Assurance responsabilité civile professionnelle décennale', 'Certification DPE (diagnostic de performance foncière)', 'Habilitation topographie par drone (photogrammétrie)', 'Certification Qualibat géotechnique (études de sol)'],
    averageResponseTime: 'Devis sous 1 semaine, intervention 2 à 4 semaines',
  },

  desinsectisation: {
    slug: 'desinsectisation',
    name: 'Désinsectisation',
    priceRange: { min: 80, max: 300, unit: '€' },
    commonTasks: [
      'Traitement punaises de lit (appartement) : 200 à 600 €',
      'Traitement cafards/blattes : 80 à 250 €',
      'Destruction de nid de guêpes/frelons : 80 à 200 €',
      'Traitement anti-moustiques (jardin) : 150 à 400 €',
      'Traitement termites : 1 500 à 4 000 €',
      'Traitement punaises de lit (appartement T2-T3) : 200 à 500 €',
      'Destruction nid de guêpes/frelons : 80 à 200 €',
      'Traitement cafards/blattes (appartement) : 100 à 300 €',
    ],
    tips: [
      'Pour les punaises de lit, un minimum de 2 passages à 15 jours d\'intervalle est nécessaire pour éliminer les œufs qui éclosent après le premier traitement.',
      'En cas de frelons asiatiques, contactez votre mairie — certaines communes prennent en charge la destruction des nids.',
      'Ne tentez jamais de détruire un nid de guêpes ou de frelons vous-même : les piqûres multiples peuvent provoquer un choc anaphylactique mortel, même chez une personne non allergique.',
      'Après un traitement contre les cafards, ne nettoyez pas les zones traitées pendant au moins 15 jours : le produit insecticide continue d\'agir par contact sur les insectes survivants.',
      'Pour prévenir le retour des punaises de lit après traitement, placez des housses anti-punaises sur les matelas et sommiers et inspectez régulièrement les coutures et les recoins du lit.',
      'Pour les punaises de lit, lavez tout le linge à 60°C minimum et passez l\'aspirateur avant l\'intervention.',
      'Un traitement thermique (vapeur sèche à 180°C) est plus écologique que les insecticides chimiques.',
      'Exigez un certificat de traitement : il peut être exigé par votre bailleur ou assurance.',
    ],
    emergencyInfo: 'Pour un nid de guêpes ou frelons dangereux (proximité de passage fréquenté), un désinsectiseur peut intervenir en urgence. Délai variable selon disponibilité. Coût : 100 à 250 €.',
    faq: [
      { q: 'Les punaises de lit sont-elles un signe de saleté ?', a: 'Non, les punaises de lit ne sont pas liées à l\'hygiène. Elles se transportent via les bagages, les vêtements et les meubles d\'occasion. Même les hôtels 5 étoiles peuvent être touchés. Le traitement professionnel (thermique ou chimique) est la seule solution efficace.' },
      { q: 'Traitement thermique ou chimique contre les punaises de lit ?', a: 'Le traitement thermique (vapeur sèche à 180°C ou canon à chaleur) tue les punaises et leurs œufs en une seule intervention, sans produit chimique. Il coûte 30 à 50 % plus cher que le traitement chimique mais est plus rapide et sans résidu. Le traitement chimique (insecticide professionnel) est efficace mais nécessite 2 à 3 passages car les œufs résistent au premier traitement.' },
      { q: 'Comment reconnaître des punaises de lit ?', a: 'Les punaises de lit adultes mesurent 5 à 7 mm, sont ovales, plates et de couleur brun-rougeâtre. Les signes d\'infestation sont : piqûres en ligne ou en grappe sur la peau au réveil, petites taches noires (déjections) sur le matelas et les draps, traces de sang sur les draps, et une odeur douceâtre dans les cas avancés. Elles se cachent dans les coutures des matelas, les fissures du sommier et derrière les têtes de lit.' },
      { q: 'Les produits anti-cafards du commerce sont-ils efficaces ?', a: 'Les gels et pièges vendus en grande surface peuvent traiter une infestation légère (quelques individus). Pour une infestation établie (plusieurs dizaines d\'individus, présence en journée), seul un traitement professionnel avec des biocides à usage restreint (non accessibles au public) garantit une éradication complète. Le coût professionnel (80 à 250 €) est vite amorti face à une infestation qui s\'aggrave.' },
      { q: 'Le propriétaire ou le locataire doit-il payer la désinsectisation ?', a: 'En cas de punaises de lit, la loi Elan (2018) impose au propriétaire de prendre en charge le traitement, sauf si le locataire est à l\'origine de l\'infestation (ce qui est difficile à prouver). Pour les cafards, le propriétaire doit livrer un logement décent exempt de nuisibles. L\'entretien courant (prévention) reste à la charge du locataire. En copropriété, le syndic peut faire traiter les parties communes.' },
      { q: 'Comment reconnaître une infestation de punaises de lit ?', a: 'Les signes révélateurs sont : des piqûres alignées en rang sur la peau au réveil (bras, jambes, dos), de petites taches de sang sur les draps causées par l\'écrasement des punaises gorgées de sang pendant le sommeil, des points noirs (déjections) sur les coutures du matelas, le sommier et la tête de lit, et dans les cas avancés une odeur douceâtre et musquée caractéristique. Inspectez les recoins du matelas, les plinthes et les prises électriques à l\'aide d\'une lampe torche.' },
      { q: 'Combien de traitements faut-il pour éliminer les punaises de lit ?', a: 'En traitement chimique (insecticide professionnel), il faut généralement 2 à 3 passages espacés de 15 jours. Le premier passage élimine les punaises adultes et les nymphes, mais les œufs résistent. Les passages suivants ciblent les punaises nouvellement écloses avant qu\'elles ne pondent à leur tour. Le traitement thermique (vapeur sèche ou canon à chaleur à 60°C+) peut éliminer l\'infestation en un seul passage car la chaleur détruit aussi les œufs, mais il coûte 30 à 50 % plus cher.' },
      { q: 'Le traitement anti-cafards est-il dangereux pour les enfants et animaux ?', a: 'Le gel insecticide (méthode la plus courante) est appliqué en petites gouttes dans les recoins inaccessibles (derrière les meubles, sous l\'évier, dans les charnières) : il présente un risque très faible pour les enfants et les animaux domestiques car les quantités sont infimes et les emplacements hors de portée. En revanche, la fumigation (nébulisation d\'insecticide) nécessite une évacuation temporaire du logement (4 à 6 heures) et une aération complète de 2 heures avant le retour. Dans tous les cas, demandez au technicien la fiche de données de sécurité du produit utilisé.' },
    ],
    certifications: ['Certibiocide nuisibles TP14/TP18 (obligatoire — valable 5 ans)', 'Certification CS3D (Chambre Syndicale 3D — Dératisation, Désinsectisation, Désinfection)', 'Assurance RC professionnelle (obligatoire)', 'Déclaration d\'activité biocides auprès de l\'ANSES', 'Formation Certibiocide TP18 (insecticides — renouvellement tous les 5 ans)', 'Protocole HACCP pour les locaux alimentaires', 'Certification Certibiocide (obligatoire depuis 2015)', 'Assurance RC professionnelle spécifique nuisibles'],
    averageResponseTime: 'Intervention sous 24 à 48h',
  },

  deratisation: {
    slug: 'deratisation',
    name: 'Dératisation',
    priceRange: { min: 80, max: 300, unit: '€' },
    commonTasks: [
      'Dératisation maison/appartement : 80 à 200 €',
      'Dératisation local commercial : 150 à 400 €',
      'Contrat annuel de prévention (4 passages) : 300 à 800 €',
      'Traitement fouines/loirs : 150 à 350 €',
      'Rebouchage des accès (grillage, mousse expansive) : 100 à 300 €',
      'Dératisation cave/sous-sol : 100 à 250 €',
      'Dératisation restaurant/boulangerie (HACCP) : 200 à 500 €',
      'Audit de prévention et diagnostic rongeurs : 50 à 150 €',
    ],
    tips: [
      'La dératisation est obligatoire dans les locaux à usage professionnel (restaurants, commerces alimentaires) — un contrat annuel est recommandé.',
      'Un diagnostic des points d\'entrée est essentiel : sans rebouchage, les rongeurs reviennent en quelques semaines.',
      'Ne touchez jamais les cadavres ou excréments de rongeurs à mains nues : portez des gants jetables et désinfectez les surfaces à l\'eau de Javel, car les rongeurs transmettent des maladies (leptospirose, hantavirus).',
      'Rangez toute nourriture dans des contenants hermétiques (verre, métal) et ne laissez jamais de gamelles d\'animaux domestiques pleines la nuit : c\'est la principale source d\'attraction pour les rongeurs.',
      'Avant de signer un contrat, demandez si le dératiseur utilise des postes d\'appâtage sécurisés (obligatoires en présence d\'enfants ou d\'animaux domestiques) et s\'il récupère les cadavres après traitement.',
      'Vérifiez que le dératiseur vous remet un rapport d\'intervention détaillé après chaque passage.',
      'Un contrat annuel de prévention (3 à 4 passages) est plus économique qu\'une intervention ponctuelle en urgence.',
      'Demandez si l\'entreprise propose un suivi post-traitement gratuit en cas de réapparition dans les 30 jours.',
    ],
    faq: [
      { q: 'Comment savoir si j\'ai des rats ou des souris ?', a: 'Les indices sont : crottes (2 cm pour un rat, 5 mm pour une souris), traces de grignotage sur les câbles/emballages, bruits de grattement la nuit (dans les cloisons, faux-plafonds), odeur musquée caractéristique. Un professionnel peut confirmer l\'espèce et évaluer l\'ampleur de l\'infestation.' },
      { q: 'Les rats sont-ils dangereux pour la santé ?', a: 'Oui, les rats transmettent de nombreuses maladies par leurs urines, excréments et morsures : leptospirose (potentiellement mortelle), salmonellose, hantavirus et peste (rare en France). Ils rongent aussi les câbles électriques (risque d\'incendie) et les canalisations (risque de fuite). Une intervention rapide est indispensable dès les premiers signes.' },
      { q: 'Combien de temps dure une dératisation complète ?', a: 'Une dératisation prend généralement 2 à 4 semaines avec 2 à 3 passages du professionnel. Le premier passage pose les appâts et identifie les points d\'activité. Les passages suivants contrôlent la consommation des appâts et ajustent le traitement. Le rebouchage des accès est réalisé une fois l\'infestation maîtrisée. Pour un local commercial, un contrat annuel avec 4 passages préventifs est recommandé.' },
      { q: 'Les pièges à rats du commerce sont-ils efficaces ?', a: 'Les pièges mécaniques (tapettes) et les pièges à colle peuvent attraper quelques individus isolés, mais sont inefficaces contre une colonie établie. Les rats sont des animaux intelligents qui apprennent rapidement à éviter les pièges. De plus, l\'utilisation de raticides par un non-professionnel peut être dangereuse pour les enfants, les animaux domestiques et la faune sauvage.' },
      { q: 'Le propriétaire ou le locataire doit-il payer la dératisation ?', a: 'La dératisation relève de l\'obligation du propriétaire de fournir un logement décent (loi du 6 juillet 1989). Si l\'infestation préexistait à l\'entrée dans les lieux, le propriétaire paie intégralement. Si elle apparaît en cours de bail à cause d\'un défaut d\'entretien du locataire (poubelles ouvertes, nourriture stockée au sol), le locataire peut être mis à contribution. En copropriété, le syndic traite les parties communes.' },
      { q: 'Quels sont les signes d\'une infestation de rats ?', a: 'Les signes les plus courants sont : la présence de crottes (noires, en forme de fuseau, 1 à 2 cm pour un rat), des traces de grignotage sur les câbles électriques, les emballages alimentaires ou le bois, des bruits de grattement ou de trottinement la nuit dans les cloisons et faux-plafonds, des traces de gras (marques sombres et luisantes) le long des murs et des plinthes (les rats empruntent toujours les mêmes chemins), ainsi qu\'une odeur musquée persistante dans les espaces confinés. Si vous observez plusieurs de ces signes, contactez un dératiseur professionnel pour un diagnostic précis.' },
      { q: 'La dératisation est-elle obligatoire pour les professionnels ?', a: 'Oui, la dératisation est une obligation légale pour de nombreux professionnels. Le règlement sanitaire départemental (RSD) impose aux propriétaires et gestionnaires de locaux de prévenir et traiter les infestations de rongeurs. Les établissements manipulant des denrées alimentaires (restaurants, boulangeries, supermarchés) sont soumis au plan HACCP qui exige un plan de lutte contre les nuisibles documenté avec un prestataire agréé. Le non-respect de ces obligations peut entraîner des sanctions administratives (fermeture temporaire) et pénales (amendes). Un contrat annuel avec un dératiseur certifié est la solution la plus courante pour rester en conformité.' },
      { q: 'Quels produits sont utilisés par les dératiseurs professionnels ?', a: 'Les dératiseurs professionnels utilisent principalement des rodenticides anticoagulants de deuxième génération (bromadialone, difénacoum, brodifacoum), conditionnés sous forme de blocs paraffinés ou de pâte fraîche, placés dans des postes d\'appâtage sécurisés inaccessibles aux enfants et aux animaux domestiques. Ils emploient également des pièges mécaniques (tapettes professionnelles, nasses) et des pièges électroniques pour les zones sensibles où les produits chimiques ne sont pas souhaitables. Tous les produits biocides utilisés doivent être autorisés par l\'ANSES et porter un numéro d\'AMM (Autorisation de Mise sur le Marché). Depuis 2018, le règlement européen sur les produits biocides (RPB 528/2012) renforce les conditions d\'utilisation et impose le Certibiocide pour tout applicateur professionnel.' },
    ],
    emergencyInfo:
      'Intervention d\'urgence pour infestation sévère de rats ou souris menaçant la salubrité ou la sécurité (rongement de câbles électriques, contamination alimentaire). Un dératiseur peut intervenir sous 2 à 6 heures en zone urbaine. Majorations : +50 à 80 % en dehors des heures ouvrées.',
    certifications: ['Certibiocide nuisibles TP14/TP18 (obligatoire — valable 5 ans)', 'Certification CS3D (Chambre Syndicale 3D — Dératisation, Désinsectisation, Désinfection)', 'Assurance RC professionnelle (obligatoire)', 'Déclaration d\'activité biocides auprès de l\'ANSES', 'Formation Certibiocide (renouvellement tous les 5 ans)', 'Conformité au règlement européen sur les produits biocides (RPB 528/2012)', 'Certification Certibiocide (obligatoire depuis 2015 pour l\'usage de produits biocides)', 'Assurance RC professionnelle spécifique nuisibles'],
    averageResponseTime: 'Intervention sous 24 à 48h',
  },

  demenageur: {
    slug: 'demenageur',
    name: 'Déménageur',
    priceRange: { min: 500, max: 3000, unit: '€' },
    commonTasks: [
      'Déménagement studio (30 m²) même ville : 400 à 800 €',
      'Déménagement T3 (60 m²) même ville : 800 à 1 500 €',
      'Déménagement T3 longue distance (500 km) : 1 500 à 3 000 €',
      'Déménagement maison (120 m²) : 2 000 à 5 000 €',
      'Garde-meubles : 50 à 200 €/m³/mois',
      'Monte-meubles / \u00e9l\u00e9vateur ext\u00e9rieur : 200 \u00e0 600 \u20ac la demi-journ\u00e9e',
      'Emballage complet par le d\u00e9m\u00e9nageur (formule luxe) : +30 \u00e0 50 % du prix de base',
      'D\u00e9m\u00e9nagement international (Europe) : 3 000 \u00e0 8 000 \u20ac selon volume et destination',
    ],
    tips: [
      'Demandez 3 devis minimum et vérifiez que le déménageur est immatriculé au registre des transporteurs (numéro DREAL).',
      'Souscrivez l\'assurance « valeur déclarée » (1 à 2 % de la valeur des biens) plutôt que la couverture de base (très faible indemnisation au poids).',
      'Faites une visite technique à domicile avec le déménageur avant de signer : c\'est la seule façon d\'obtenir un devis fiable et d\'éviter les mauvaises surprises le jour J (escalier étroit, piano, accès difficile).',
      'Déballez et vérifiez vos cartons dans les 3 jours suivant la livraison : au-delà, il est beaucoup plus difficile de faire jouer la garantie pour les objets endommagés.',
      'Comparez les formules : le déménagement « économique » (vous faites les cartons) coûte 30 à 40 % moins cher que la formule « tout compris » (emballage, transport, déballage).',
      'Pr\u00e9voyez un carton \u00ab premier jour \u00bb avec draps, serviettes, cafeti\u00e8re, chargeurs et produits d\'hygi\u00e8ne \u2014 vous l\'ouvrirez en premier \u00e0 l\'arriv\u00e9e sans avoir \u00e0 tout d\u00e9baller.',
      'Photographiez vos branchements (TV, box internet, ordinateur) avant de les d\u00e9connecter : cela facilite grandement la r\u00e9installation dans le nouveau logement.',
      'Transf\u00e9rez votre contrat d\'\u00e9lectricit\u00e9/gaz 15 jours avant le d\u00e9m\u00e9nagement pour que le nouveau logement soit aliment\u00e9 d\u00e8s votre arriv\u00e9e. Pensez aussi \u00e0 la redirection du courrier (service La Poste, 7,50 \u20ac par mois).',
    ],
    faq: [
      { q: 'Quand réserver son déménageur ?', a: 'Réservez 4 à 6 semaines à l\'avance en période creuse (octobre-mars) et 8 à 12 semaines en période haute (juin-septembre). Les premiers et derniers jours du mois sont les plus demandés. Un déménagement en milieu de mois et en semaine est souvent 20 à 30 % moins cher.' },
      { q: 'Comment vérifier si un déménageur est sérieux ?', a: 'Vérifiez qu\'il possède une immatriculation DREAL (registre des transporteurs, obligatoire), une assurance responsabilité civile professionnelle et idéalement le label NF Service Déménagement. Consultez les avis en ligne et demandez des références. Méfiez-vous des devis par téléphone sans visite à domicile et des prix très inférieurs au marché.' },
      { q: 'Que faire en cas de casse ou de perte pendant le déménagement ?', a: 'Notez les réserves directement sur le bon de livraison le jour du déménagement (« carton X abîmé », « meuble rayé »). Confirmez par lettre recommandée AR dans les 10 jours. L\'indemnisation dépend de l\'assurance souscrite : la couverture de base rembourse au poids (très peu), tandis que l\'assurance « valeur déclarée » rembourse à la valeur réelle. Conservez les factures d\'achat des objets de valeur.' },
      { q: 'Combien de cartons faut-il pour un déménagement ?', a: 'En moyenne, comptez 20 à 30 cartons pour un studio, 40 à 60 pour un T3 et 80 à 120 pour une maison. La plupart des déménageurs professionnels fournissent les cartons dans le devis (ou les facturent 2 à 5 € pièce). Récupérer des cartons gratuits en supermarché est possible mais vérifiez leur solidité — un carton qui cède peut endommager son contenu.' },
      { q: 'Peut-on déménager ses plantes et son électroménager ?', a: 'Les plantes ne sont pas couvertes par l\'assurance du déménageur et voyagent sous votre responsabilité. Transportez-les vous-même si possible. Pour l\'électroménager, le lave-linge doit être vidangé et ses tambours calés avec les vis de transport. Le réfrigérateur doit être débranché 24h à l\'avance et transporté debout. Le déménageur peut refuser ces appareils s\'ils ne sont pas préparés.' },
      { q: 'Quelle assurance choisir pour son d\u00e9m\u00e9nagement ?', a: 'L\'assurance \u00ab valeur d\u00e9clar\u00e9e \u00bb (1 \u00e0 2 % de la valeur totale) est recommand\u00e9e. La couverture de base (ad valorem l\u00e9gale) ne rembourse qu\'environ 23 \u20ac/m\u00b3 \u2014 insuffisant pour des meubles ou de l\'\u00e9lectronique. Pour les objets de valeur (\u0153uvres d\'art, instruments), souscrivez une extension \u00ab objets pr\u00e9cieux \u00bb avec inventaire d\u00e9taill\u00e9 et photos avant le d\u00e9part.' },
      { q: 'Peut-on d\u00e9m\u00e9nager soi-m\u00eame et louer un camion ?', a: 'Oui, la location de camion (20 m\u00b3) co\u00fbte 80 \u00e0 200 \u20ac/jour hors carburant et p\u00e9age. Ajoutez le mat\u00e9riel (couvertures, sangles, diable) et la main-d\'\u0153uvre amicale. Attention : sans assurance pro, vos meubles ne sont pas couverts en cas de casse. Pour un T3 ou plus, le d\u00e9m\u00e9nageur professionnel est souvent plus rentable une fois les risques pris en compte.' },
      { q: 'Quelles aides financi\u00e8res existent pour un d\u00e9m\u00e9nagement ?', a: 'Action Logement verse jusqu\'\u00e0 1 000 \u20ac (Mobili-Pass) pour les salari\u00e9s du priv\u00e9 mut\u00e9s ou en mobilit\u00e9 professionnelle. La CAF propose une prime de d\u00e9m\u00e9nagement (jusqu\'\u00e0 1 082 \u20ac + 90 \u20ac/enfant) pour les familles de 3 enfants ou plus. Certaines entreprises prennent en charge tout ou partie du d\u00e9m\u00e9nagement lors d\'une mutation.' },
      { q: 'Comment prot\u00e9ger ses meubles pendant le transport ?', a: 'Utilisez des couvertures de d\u00e9m\u00e9nagement pour les meubles massifs, du papier bulle pour la vaisselle et les objets fragiles, et du film \u00e9tirable pour maintenir les tiroirs et portes ferm\u00e9s. D\u00e9montez les meubles volumineux (armoires, lits) et num\u00e9rotez les pi\u00e8ces avec du ruban adh\u00e9sif. Les cartons \u00ab penderie \u00bb permettent de transporter les v\u00eatements sur cintres sans les froisser.' },
    ],
    emergencyInfo:
      'Pas de service d\'urgence pour le déménagement. Les déménagements nécessitent une visite technique préalable et une planification de 2 à 8 semaines. Prenez rendez-vous pour un devis gratuit sous 48h.',
    certifications: ['Immatriculation DREAL (obligatoire)', 'Label NF Service D\u00e9m\u00e9nagement', 'Certification ISO 9001 (qualit\u00e9)', 'Charte Qualit\u00e9 D\u00e9m\u00e9nagement (FIDI pour l\'international)', 'Assurance responsabilit\u00e9 civile professionnelle', 'Agr\u00e9ment IATA (d\u00e9m\u00e9nagement avec transport a\u00e9rien)', 'Label Déménageur Éco-responsable', 'Certification ISO 14001 (management environnemental)'],
    averageResponseTime: 'Devis sous 48h (visite technique), planification 2 à 8 semaines',
  },

  ebeniste: {
    slug: 'ebeniste',
    name: 'Ébéniste',
    priceRange: {
      min: 50,
      max: 90,
      unit: '€/h',
    },
    commonTasks: [
      "Fabrication d'un meuble sur mesure (bibliothèque, buffet) : 1 500 à 6 000 €",
      "Restauration d'un meuble ancien : 300 à 2 500 € selon l'état et la complexité",
      "Fabrication d'un escalier en bois massif : 3 000 à 12 000 €",
      "Pose d'un plan de travail en bois massif : 400 à 1 200 € (fourniture + pose)",
      "Création d'un dressing sur mesure : 2 000 à 8 000 €",
      "Fabrication d'une table en bois massif : 800 à 4 000 €",
      "Placage et marqueterie (restauration) : 200 à 1 500 € selon la surface",
      "Fabrication d'un meuble de salle de bain en bois : 1 000 à 3 500 €",
    ],
    tips: [
      "Choisissez un ébéniste qui vous montre son atelier et des exemples de réalisations précédentes. Le savoir-faire artisanal se juge sur les finitions : assemblages, qualité du ponçage et régularité du vernis ou de l'huile.",
      "Définissez précisément vos besoins (dimensions, essence de bois, finition) avant de demander un devis. Un cahier des charges clair évite les malentendus et les surcoûts.",
      "Privilégiez les bois certifiés PEFC ou FSC pour garantir une provenance durable. Le chêne, le noyer et le merisier sont les essences les plus demandées en ébénisterie française.",
      "Demandez un devis détaillé mentionnant l'essence de bois, le type de finition (vernis, huile, cire, laque), les dimensions exactes et le délai de fabrication.",
      "Un meuble sur mesure coûte plus cher qu'un meuble industriel, mais sa durée de vie est de 50 à 100 ans contre 5 à 15 ans pour du mobilier en panneaux de particules.",
      "Pour la restauration d'un meuble ancien de valeur, faites appel à un ébéniste spécialisé en restauration qui respectera les techniques traditionnelles (collage à la colle de peau, vernis au tampon).",
      "Prévoyez un délai de fabrication de 4 à 12 semaines pour un meuble sur mesure. Un ébéniste sérieux ne bâcle pas son travail : chaque pièce est unique.",
      "Vérifiez que l'ébéniste possède une assurance responsabilité civile professionnelle et, pour les travaux intégrés au bâti (escaliers, bibliothèques encastrées), une garantie décennale.",
    ],
    faq: [
      {
        q: "Quelle est la différence entre un ébéniste et un menuisier ?",
        a: "Le menuisier travaille principalement sur les éléments de structure et d'agencement du bâtiment (portes, fenêtres, parquets, placards). L'ébéniste est spécialisé dans la fabrication et la restauration de meubles, avec un travail de précision sur les assemblages, les placages et les finitions. L'ébéniste maîtrise des techniques comme la marqueterie, le cintrage du bois et le vernis au tampon.",
      },
      {
        q: "Combien coûte un meuble sur mesure par rapport à du mobilier industriel ?",
        a: "Un meuble sur mesure coûte en moyenne 2 à 5 fois plus cher qu'un équivalent industriel. Par exemple, une bibliothèque en chêne massif sur mesure revient à 2 000 à 5 000 €, contre 300 à 800 € pour un modèle en kit. La différence se justifie par la qualité des matériaux (bois massif vs panneaux), la durabilité (50 à 100 ans vs 5 à 15 ans) et l'adaptation parfaite à votre espace.",
      },
      {
        q: "Quelles essences de bois choisir pour un meuble ?",
        a: "Le choix dépend de l'usage et du budget. Le chêne (60 à 120 €/m² en plateau) est le plus polyvalent : solide, durable et facile à travailler. Le noyer (100 à 200 €/m²) offre un grain élégant et une teinte chaude. Le merisier (80 à 150 €/m²) est prisé pour les meubles de style. Pour les budgets serrés, le hêtre (40 à 80 €/m²) est un excellent compromis.",
      },
      {
        q: "Peut-on restaurer un meuble ancien abîmé ?",
        a: "Oui, dans la grande majorité des cas. Un ébéniste restaurateur peut réparer des pieds cassés, remplacer des placages décollés, recoller des assemblages, combler des manques de bois et refaire entièrement la finition. Seuls les meubles dont la structure est irrémédiablement vermoulue (piqûres de vers sur plus de 50 % de l'épaisseur) sont parfois irrécupérables. Un traitement insecticide préalable est souvent nécessaire (50 à 150 €).",
      },
      {
        q: "Quel délai prévoir pour la fabrication d'un meuble sur mesure ?",
        a: "Comptez en moyenne 4 à 12 semaines entre la validation du devis et la livraison. Ce délai inclut l'approvisionnement en bois (2 à 4 semaines si l'essence n'est pas en stock), la fabrication proprement dite (2 à 6 semaines) et les finitions (ponçage, vernis ou huile en plusieurs couches). Les projets complexes (marqueterie, cintrage) peuvent nécessiter jusqu'à 16 semaines.",
      },
      {
        q: "Comment entretenir un meuble en bois massif ?",
        a: "Pour un meuble huilé, appliquez une couche d'huile (lin, tung ou huile spéciale bois) tous les 6 à 12 mois. Pour un meuble vernis, un simple dépoussiérage et un nettoyage à l'eau légèrement savonneuse suffisent. Évitez les produits à base de silicone qui encrassent le bois. Ne placez jamais un meuble en bois massif près d'une source de chaleur directe (radiateur, cheminée) : le bois se fendrait.",
      },
      {
        q: "Un ébéniste peut-il reproduire un meuble ancien ou de style ?",
        a: "Oui, c'est l'une des spécialités de l'ébénisterie. Un ébéniste peut reproduire fidèlement un meuble Louis XV, Art Déco ou contemporain à partir de photos, de plans ou d'un modèle existant. Le coût dépend de la complexité : comptez 1 500 à 3 000 € pour une commode de style simple et 5 000 à 15 000 € pour une pièce complexe avec marqueterie.",
      },
    ],
    emergencyInfo:
      "Pas de service d'urgence pour l'ébénisterie. La fabrication et la restauration de meubles sont des projets planifiés nécessitant un travail en atelier. Prenez rendez-vous pour un devis gratuit sous 1 semaine.",
    certifications: [
      "CAP Ébéniste ou BMA Ébéniste (formation initiale obligatoire)",
      "Brevet des Métiers d'Art (BMA) Ébénisterie",
      "Titre de Meilleur Ouvrier de France (MOF) en ébénisterie",
      "Label Entreprise du Patrimoine Vivant (EPV)",
      "Qualibat (qualification 4322 agencement intérieur bois)",
      "Certification PEFC / FSC (bois issus de forêts gérées durablement)",
      "Assurance responsabilité civile professionnelle",
      "Garantie décennale (pour les ouvrages intégrés au bâti)",
    ],
    averageResponseTime: "Devis sous 1 semaine (visite et prise de mesures), fabrication 4 à 12 semaines",
  },
}

/**
 * Récupère le contenu d'un corps de métier par son slug.
 * Retourne undefined si le slug n'existe pas.
 */
export function getTradeContent(slug: string): TradeContent | undefined {
  return tradeContent[slug]
}

/**
 * Récupère tous les slugs de métiers disponibles.
 */
export function getTradesSlugs(): string[] {
  return Object.keys(tradeContent)
}

/**
 * Slugifie un nom de tâche pour l'URL /tarifs/[service]/[ville]/[travail].
 */
export function slugifyTask(taskName: string): string {
  return taskName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Parse une tâche depuis commonTasks (format "nom : prix").
 */
export function parseTask(task: string): { name: string; slug: string; priceText: string } {
  const colonIdx = task.indexOf(':')
  if (colonIdx === -1) return { name: task.trim(), slug: slugifyTask(task.trim()), priceText: '' }
  const name = task.substring(0, colonIdx).trim()
  const priceText = task.substring(colonIdx + 1).trim()
  return { name, slug: slugifyTask(name), priceText }
}

/** Retourne toutes les taches parsees pour un service */
export function getTasksForService(serviceSlug: string): { name: string; slug: string; priceText: string }[] {
  const trade = tradeContent[serviceSlug]
  if (!trade) return []
  return trade.commonTasks.map(parseTask)
}
