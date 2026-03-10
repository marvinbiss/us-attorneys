import type { BlogArticle } from './articles'

export const saisonnierArticles: Record<string, BlogArticle> = {
  'preparer-maison-hiver-checklist': {
    title: 'Préparer sa maison pour l\'hiver : la check-list complète',
    excerpt:
      'Chauffage, isolation, toiture, plomberie… Suivez notre check-list en 8 étapes pour hiverner votre maison sereinement et éviter les mauvaises surprises dès les premiers froids.',
    image: '/images/blog/preparer-maison-hiver-checklist.webp',
    author: 'ServicesArtisans',
    date: '2026-03-06',
    readTime: '12 min',
    category: 'Saisonnier',
    tags: ['hiver', 'entretien', 'saisonnier', 'chauffage', 'isolation', 'checklist', '2026'],
    keyTakeaways: [
      'La révision annuelle de la chaudière est obligatoire (décret 2009-649) et doit être réalisée par un professionnel certifié avant le début de la saison de chauffe.',
      'Le ramonage du conduit de cheminée est exigé 1 à 2 fois par an selon les arrêtés préfectoraux ; le certificat est indispensable pour votre assurance habitation.',
      'Calorifuger les tuyaux exposés au gel et purger les robinets extérieurs permet d\'éviter des dégâts des eaux pouvant coûter plusieurs milliers d\'euros.',
      'Un planning d\'intervention étalé entre octobre et mi-novembre vous garantit la disponibilité des artisans et des tarifs plus compétitifs.',
    ],
    faq: [
      {
        question: 'Quand faut-il commencer à préparer sa maison pour l\'hiver ?',
        answer:
          'Idéalement dès la fin du mois de septembre. Les professionnels du chauffage et du ramonage sont très sollicités à partir de mi-octobre. Planifier vos interventions tôt vous assure un meilleur choix de créneaux et souvent de meilleurs tarifs. La période optimale pour l\'ensemble des travaux préparatoires s\'étend d\'octobre à mi-novembre.',
      },
      {
        question: 'La révision de chaudière est-elle vraiment obligatoire chaque année ?',
        answer:
          'Oui, le décret n° 2009-649 du 9 juin 2009 impose un entretien annuel des chaudières dont la puissance est comprise entre 4 et 400 kW, qu\'elles fonctionnent au gaz, au fioul, au bois ou au charbon. L\'installateur ou le chauffagiste remet une attestation d\'entretien dans les 15 jours suivant la visite. Cette attestation peut être exigée par votre assureur en cas de sinistre.',
      },
      {
        question: 'Combien coûte la préparation complète d\'une maison pour l\'hiver ?',
        answer:
          'Le budget varie selon la taille du logement et les interventions nécessaires. Comptez environ 90 à 150 € pour la révision de chaudière, 50 à 90 € par conduit pour le ramonage, et 200 à 600 € pour des travaux d\'isolation ponctuels (joints, bas de porte, calfeutrage). Au total, un budget de 400 à 900 € couvre l\'essentiel pour une maison de taille moyenne.',
      },
      {
        question: 'Comment savoir si mon isolation est suffisante ?',
        answer:
          'Plusieurs signes révèlent une isolation déficiente : sensation de paroi froide près des murs ou fenêtres, condensation récurrente sur les vitres, facture de chauffage anormalement élevée, ou courants d\'air perceptibles près des ouvertures. Un diagnostic thermique réalisé par un professionnel (environ 300 à 800 €) permet d\'identifier précisément les points faibles. Vous pouvez aussi réaliser un test simple avec une bougie le long des fenêtres et portes pour détecter les infiltrations d\'air.',
      },
      {
        question: 'Quelles aides financières existent pour les travaux de préparation hivernale ?',
        answer:
          'MaPrimeRénov\' finance une partie des travaux d\'isolation et de remplacement de système de chauffage, selon vos revenus et le gain énergétique. Les CEE (Certificats d\'Économies d\'Énergie) offrent des primes complémentaires pour l\'isolation et le chauffage performant. L\'éco-PTZ permet d\'emprunter jusqu\'à 50 000 € à taux zéro pour un bouquet de travaux. Enfin, certaines collectivités locales proposent des aides additionnelles. Consultez france-renov.gouv.fr pour un bilan personnalisé.',
      },
    ],
    content: [
      `# Préparer sa maison pour l'hiver : la check-list complète

Chaque année, les premiers froids prennent de court des milliers de foyers français. Chaudière en panne, tuyaux gelés, facture de chauffage qui explose… Ces désagréments sont pourtant évitables grâce à une préparation méthodique. Cette check-list en 8 étapes vous guide pour hiverner votre maison de manière efficace, sécurisée et conforme à la réglementation.`,

      `## 1. Chauffage : révision et optimisation

La révision de votre système de chauffage constitue la priorité absolue. Le **décret n° 2009-649** rend obligatoire l'entretien annuel de toute chaudière d'une puissance de 4 à 400 kW, quel que soit le combustible utilisé (gaz, fioul, bois, granulés).

### Chaudière et pompe à chaleur

Faites intervenir un chauffagiste certifié RGE pour :
- Vérifier l'étanchéité du circuit et les organes de sécurité
- Nettoyer le brûleur et le corps de chauffe
- Contrôler le taux de monoxyde de carbone (CO)
- Mesurer le rendement de combustion

Pour les pompes à chaleur (PAC), un contrôle d'étanchéité du circuit frigorifique est obligatoire tous les 2 ans pour les équipements contenant plus de 2 kg de fluide.

### Radiateurs et émetteurs

Avant la mise en route du chauffage, **purgez chaque radiateur** en commençant par ceux situés au point le plus bas de l'installation. Un radiateur mal purgé perd jusqu'à 15 % de sa capacité de chauffe et génère des bruits de circulation d'eau désagréables.

### Thermostat programmable

:::tip
Un thermostat programmable permet de réduire la facture de chauffage de 10 à 25 %. Réglez 19 °C en journée dans les pièces de vie, 16 °C la nuit et pendant les absences. Chaque degré supplémentaire représente environ 7 % de consommation en plus.
:::`,

      `## 2. Ramonage : une obligation légale à ne pas négliger

Le ramonage des conduits de fumée est **obligatoire 1 à 2 fois par an** selon les arrêtés préfectoraux de votre commune. Pour les appareils à bois ou charbon, un second ramonage en période de chauffe est généralement exigé.

### Pourquoi c'est indispensable

Un conduit encrassé augmente le risque d'incendie et d'intoxication au monoxyde de carbone. Chaque année, le CO est responsable d'environ 4 000 hospitalisations en France. Le ramonage mécanique élimine la suie, le goudron et les éventuels nids d'oiseaux.

### Le certificat de ramonage

Le [ramoneur](/services/ramoneur) professionnel vous remet un **certificat de ramonage** à l'issue de son intervention. Conservez-le précieusement : votre assureur peut le réclamer en cas de sinistre lié au chauffage. Sans ce document, l'indemnisation peut être réduite voire refusée.

:::warning
Ne tentez jamais de ramoner vous-même un conduit avec des moyens de fortune. Un ramonage chimique (bûche de ramonage) ne se substitue pas au ramonage mécanique obligatoire effectué par un professionnel qualifié.
:::`,

      `## 3. Isolation : traquer les déperditions thermiques

Environ 25 % des pertes de chaleur d'une maison passent par les fenêtres et les portes. Avant l'hiver, un passage en revue méthodique s'impose.

### Joints de fenêtres et portes

Inspectez les joints de toutes les ouvertures. Un joint usé, craquelé ou décollé laisse passer l'air froid. Le remplacement de joints adhésifs coûte quelques euros par fenêtre et se réalise en quelques minutes.

### Bas de porte

Installez des **bas de porte** (boudins, brosses ou plinthes automatiques) sur les portes donnant sur l'extérieur, le garage ou les pièces non chauffées. C'est l'un des gestes les plus rentables en matière d'isolation.

### Rideaux thermiques et films isolants

Les rideaux thermiques ajoutent une couche d'isolation devant les fenêtres et réduisent la sensation de paroi froide. Pour les fenêtres simple vitrage que vous ne pouvez pas remplacer immédiatement, un **film isolant thermorétractable** constitue une solution temporaire efficace, réduisant les déperditions de 20 à 30 %.

### Calfeutrage des points singuliers

N'oubliez pas les passages de câbles, les coffres de volets roulants, les trappes de combles et les gaines techniques. Un tube de mastic silicone ou de la mousse expansive suffit à traiter ces points souvent négligés.`,

      `## 4. Toiture et gouttières : protéger par le haut

La toiture représente jusqu'à 30 % des déperditions thermiques d'une maison mal isolée. Avant l'hiver, une inspection visuelle est indispensable.

### Vérification des tuiles et ardoises

Depuis le sol, avec des jumelles, repérez les tuiles fissurées, déplacées ou manquantes. Après une tempête d'automne, cette vérification est d'autant plus importante. Faites appel à un [couvreur](/services/couvreur) professionnel pour toute réparation en hauteur — les chutes de toit figurent parmi les accidents domestiques les plus graves.

### Nettoyage des gouttières

Des gouttières obstruées par les feuilles mortes provoquent des débordements qui infiltrent les murs et les fondations. Nettoyez-les intégralement et vérifiez que les descentes évacuent correctement l'eau. Installez des **crapaudines** (grilles pare-feuilles) pour limiter l'accumulation de débris.

:::tip
Profitez du nettoyage des gouttières pour vérifier l'état de la zinguerie (noues, faîtières, solins). Une soudure défaillante peut provoquer des infiltrations invisibles qui dégradent la charpente sur le long terme.
:::`,

      `## 5. Plomberie : prévenir le gel des canalisations

Un tuyau qui gèle peut éclater et causer des dégâts des eaux considérables. Les réparations se chiffrent rapidement en milliers d'euros, sans compter les dommages aux revêtements et au mobilier.

### Calorifuger les tuyaux exposés

Tous les tuyaux situés dans des espaces non chauffés (garage, cave, vide sanitaire, combles) doivent être protégés par des **manchons isolants** en mousse ou en laine minérale. Le coût est dérisoire (2 à 5 € le mètre linéaire) comparé aux conséquences d'un gel.

### Purger les robinets extérieurs

Fermez le robinet d'arrêt intérieur alimentant les points d'eau extérieurs (jardin, terrasse), puis ouvrez le robinet extérieur pour vider entièrement la canalisation. Un [plombier](/services/plombier) peut installer des vannes de purge si votre installation n'en possède pas.

### Localiser le robinet d'arrêt général

Assurez-vous que chaque occupant du logement sait où se trouve le robinet d'arrêt général et qu'il est manœuvrable. En cas de fuite hivernale, chaque minute compte pour limiter les dégâts.

:::warning
Si vous vous absentez plusieurs jours en période de grand froid, maintenez le chauffage à 8-10 °C minimum ou vidangez entièrement le circuit. Un logement non chauffé avec des canalisations en eau est un sinistre en puissance.
:::`,

      `## 6. VMC : garantir une ventilation saine

La ventilation mécanique contrôlée (VMC) joue un rôle crucial en hiver, quand les fenêtres restent fermées. Une VMC encrassée ne renouvelle plus correctement l'air, favorisant condensation, moisissures et allergènes.

### Nettoyage des bouches d'extraction

Démontez et nettoyez les bouches d'extraction (cuisine, salle de bain, WC) à l'eau savonneuse. Des bouches obstruées par la graisse et la poussière réduisent le débit d'air de 50 % ou plus.

### Vérification du débit

Placez une feuille de papier devant chaque bouche d'extraction : elle doit rester plaquée. Si elle tombe, le débit est insuffisant. Vérifiez que les entrées d'air (réglettes sur les fenêtres) ne sont pas obstruées et nettoyez-les.

### Filtres de VMC double flux

Si votre logement est équipé d'une VMC double flux, remplacez les filtres selon les préconisations du fabricant (tous les 3 à 6 mois en moyenne). Des filtres colmatés augmentent la consommation électrique du ventilateur et dégradent la qualité de l'air intérieur.`,

      `## 7. Électricité et sécurité incendie

L'hiver concentre les risques d'incendie domestique en raison de l'utilisation intensive du chauffage et de l'éclairage prolongé.

### Disjoncteur différentiel

Testez votre disjoncteur différentiel en appuyant sur le bouton « Test ». L'appareil doit couper instantanément le courant. Répétez cette vérification tous les 6 mois. Un différentiel défaillant ne vous protège plus contre l'électrocution.

### Détecteurs de fumée (loi Morange)

La **loi Morange du 9 mars 2010** impose au moins un détecteur avertisseur autonome de fumée (DAAF) par logement. Vérifiez que vos détecteurs fonctionnent en appuyant sur le bouton test. Remplacez les piles (ou l'appareil entier s'il a plus de 10 ans). Installez un détecteur supplémentaire à proximité des chambres si votre logement est sur plusieurs niveaux.

### Détecteur de monoxyde de carbone

Bien que non obligatoire, un détecteur de CO est **vivement recommandé** dans tout logement équipé d'un appareil à combustion (chaudière, poêle, cheminée, chauffe-eau à gaz). Le CO est un gaz inodore et incolore qui tue chaque année une centaine de personnes en France.

:::tip
Profitez de cette vérification pour contrôler l'état de vos multiprises et rallonges. Les appareils de chauffage d'appoint doivent être branchés directement sur une prise murale — jamais sur une multiprise qui risque de surchauffer.
:::`,

      `## 8. Budget prévisionnel et planning octobre-novembre

Une bonne préparation hivernale s'organise et se budgétise. Voici un planning type pour ne rien oublier.

### Planning recommandé

**Début octobre :**
- Prendre rendez-vous pour la révision chaudière/PAC
- Prendre rendez-vous pour le ramonage
- Commander les manchons isolants et joints de remplacement

**Mi-octobre :**
- Inspecter la toiture et nettoyer les gouttières
- Purger les radiateurs et vérifier le thermostat
- Nettoyer les bouches de VMC

**Fin octobre :**
- Remplacer les joints de fenêtres et installer les bas de porte
- Calorifuger les tuyaux exposés
- Purger les robinets extérieurs

**Début novembre :**
- Tester les détecteurs de fumée et de CO
- Vérifier le disjoncteur différentiel
- Faire le tour final des points de calfeutrage

### Budget prévisionnel moyen

| Poste | Coût estimé |
|-------|-------------|
| Révision chaudière/PAC | 90 – 180 € |
| Ramonage (1 conduit) | 50 – 90 € |
| Joints et bas de porte | 30 – 80 € |
| Manchons isolants tuyaux | 20 – 50 € |
| Détecteur CO | 20 – 40 € |
| Nettoyage gouttières (pro) | 100 – 250 € |
| **Total estimé** | **310 – 690 €** |

:::tip
En anticipant vos interventions dès octobre, vous bénéficiez d'une meilleure disponibilité des artisans et de tarifs souvent plus avantageux qu'en pleine période de rush (novembre-décembre). Regroupez les interventions pour réduire les frais de déplacement.
:::

En suivant cette check-list méthodiquement, vous aborderez l'hiver l'esprit tranquille, avec un logement sûr, confortable et économe en énergie. N'hésitez pas à faire appel aux artisans de confiance référencés sur ServicesArtisans pour chaque étape de votre préparation hivernale.`,
    ],
  },
}
