/**
 * Generates UNIQUE SEO content for each service+location combination.
 *
 * Combines service-specific data (trade-content.ts) with location-specific
 * data (france.ts) to produce substantially different body text for every
 * page, eliminating the doorway-pages risk of near-identical content.
 */

import type { Ville } from '@/lib/data/france'
import { getTradeContent } from '@/lib/data/trade-content'
import { generateDataDrivenContent, type DataDrivenContent } from '@/lib/seo/data-driven-content'
import type { CommuneData } from '@/lib/data/commune-data'
import { formatNumber, formatEuro, monthName } from '@/lib/data/commune-data'
import { getQuartierRealPrix, getVilleRealPrix, getRealDpe } from '@/lib/data/quartier-real-data'
import { getDeptArtisanCounts } from '@/lib/data/dept-artisan-counts'
import { getQuartierData, type QuartierProfile as QuartierDataProfile } from '@/lib/data/quartier-data'

// ---------------------------------------------------------------------------
// Regional pricing multipliers
// ---------------------------------------------------------------------------

const REGIONAL_MULTIPLIERS: Record<string, number> = {
  // Metropolitan France
  'Île-de-France': 1.25,
  "Provence-Alpes-Côte d'Azur": 1.15,
  'Auvergne-Rhône-Alpes': 1.10,
  'Occitanie': 1.05,
  'Nouvelle-Aquitaine': 1.00,
  'Pays de la Loire': 0.95,
  'Bretagne': 0.95,
  'Grand Est': 0.95,
  'Normandie': 0.95,
  'Hauts-de-France': 0.90,
  'Centre-Val de Loire': 0.90,
  'Bourgogne-Franche-Comté': 0.90,
  'Corse': 1.20,
  // Overseas territories (higher costs due to shipping and insularity)
  'Guadeloupe': 1.30,
  'Martinique': 1.30,
  'Guyane': 1.35,
  'La Réunion': 1.25,
  'Mayotte': 1.40,
}

export function getRegionalMultiplier(region: string): number {
  return REGIONAL_MULTIPLIERS[region] ?? 1.0
}

function getRegionalLabel(region: string): string {
  const m = getRegionalMultiplier(region)
  if (m >= 1.20) return 'nettement supérieurs à la moyenne nationale'
  if (m >= 1.05) return 'légèrement supérieurs à la moyenne nationale'
  if (m <= 0.95) return 'légèrement inférieurs à la moyenne nationale'
  return 'proches de la moyenne nationale'
}

// ---------------------------------------------------------------------------
// Seasonal / contextual tips per service
// ---------------------------------------------------------------------------

interface SeasonalTips {
  coastal: string
  mountain: string
  urban: string
  rural: string
  default: string
}

const SEASONAL_TIPS: Record<string, SeasonalTips> = {
  plombier: {
    coastal:
      "En zone littorale, les canalisations sont davantage exposées à la corrosion saline. Un entretien préventif annuel est recommandé pour éviter les fuites liées à l'usure accélérée des tuyauteries.",
    mountain:
      "En zone de montagne, les risques de gel des canalisations sont accrus en hiver. Pensez à isoler vos tuyaux extérieurs et à purger le circuit avant les premières gelées.",
    urban:
      "Dans les immeubles anciens du centre-ville, les colonnes montantes en plomb ou en fonte peuvent nécessiter un remplacement. Renseignez-vous auprès de votre copropriété sur l'état des canalisations communes.",
    rural:
      "En zone rurale, les installations d'assainissement individuel (fosse septique) doivent être contrôlées par le SPANC tous les 4 ans. Un plombier qualifié peut assurer la vidange et l'entretien.",
    default:
      "Avant l'hiver, faites contrôler votre chauffe-eau et vos radiateurs pour garantir un fonctionnement optimal pendant la saison froide.",
  },
  electricien: {
    coastal:
      "Le climat salin du littoral accélère l'oxydation des contacts électriques extérieurs. Privilégiez des boîtiers étanches IP65 et un contrôle régulier des installations exposées.",
    mountain:
      "Les coupures de courant sont plus fréquentes en montagne en période de neige. L'installation d'un groupe électrogène ou d'un onduleur peut sécuriser votre alimentation.",
    urban:
      "Dans les logements anciens du centre-ville, la mise aux normes NF C 15-100 est souvent indispensable. Un diagnostic électrique est obligatoire pour la vente ou la location.",
    rural:
      "En zone rurale, les branchements aériens sont plus exposés aux intempéries. Envisagez un parafoudre pour protéger vos équipements électroniques.",
    default:
      "Faites vérifier votre tableau électrique tous les 10 ans pour garantir la conformité et la sécurité de votre installation.",
  },
  serrurier: {
    coastal:
      "L'air marin accélère la corrosion des serrures et des cylindres. Privilégiez des serrures en acier inoxydable ou traitées anticorrosion pour les portes exposées.",
    mountain:
      "Les variations de température en montagne peuvent provoquer des dilatations du bâti qui grippent les serrures. Un entretien annuel avec lubrification est conseillé.",
    urban:
      "En centre-ville, les tentatives de cambriolage sont plus fréquentes. Investissez dans une serrure certifiée A2P** minimum et un cylindre haute sécurité pour votre porte d'entrée.",
    rural:
      "En zone pavillonnaire, pensez à sécuriser l'ensemble des accès : porte d'entrée, porte de garage, portail et fenêtres accessibles du rez-de-chaussée.",
    default:
      "Changez votre cylindre de serrure en cas de perte de clé ou après l'emménagement dans un nouveau logement, même si la serrure fonctionne correctement.",
  },
  chauffagiste: {
    coastal:
      "Le climat doux du littoral rend la pompe à chaleur air-eau particulièrement performante, avec un COP optimal grâce aux températures hivernales modérées.",
    mountain:
      "En altitude, les températures hivernales basses réduisent le rendement des pompes à chaleur air-eau. Une chaudière gaz à condensation ou un système hybride est souvent plus adapté.",
    urban:
      "En copropriété, le remplacement de la chaudière collective par des solutions individuelles performantes nécessite un vote en assemblée générale et un audit énergétique préalable.",
    rural:
      "En zone rurale non raccordée au gaz de ville, les alternatives sont le fioul (en voie de suppression), la pompe à chaleur, le poêle à granulés ou la chaudière bois.",
    default:
      "Planifiez l'entretien obligatoire de votre chaudière en septembre-octobre, avant le début de la saison de chauffe, pour éviter les pannes en plein hiver.",
  },
  'peintre-en-batiment': {
    coastal:
      "Les façades en bord de mer subissent une usure accélérée due aux embruns salins. Un ravalement avec une peinture spéciale façade marine est recommandé tous les 8 à 10 ans.",
    mountain:
      "En montagne, les écarts de température importants nécessitent l'utilisation de peintures extérieures élastiques capables de résister aux cycles gel-dégel répétés.",
    urban:
      "En centre-ville, le ravalement de façade est souvent obligatoire tous les 10 ans (arrêté municipal). Renseignez-vous en mairie sur les délais et les couleurs autorisées.",
    rural:
      "Pour les maisons de campagne, les peintures à la chaux ou aux silicates sont idéales : elles laissent respirer les murs anciens en pierre et offrent un rendu authentique.",
    default:
      "Prévoyez vos travaux de peinture extérieure au printemps ou en début d'automne, quand les températures sont comprises entre 10 et 25 °C pour un séchage optimal.",
  },
  menuisier: {
    coastal:
      "En bord de mer, le bois extérieur (volets, portes, fenêtres) nécessite un traitement spécifique contre les embruns. L'aluminium ou le PVC sont des alternatives durables pour les menuiseries exposées.",
    mountain:
      "En montagne, le triple vitrage est recommandé pour les fenêtres exposées au nord et en altitude. Le surcoût est rentabilisé par les économies de chauffage en 5 à 8 ans.",
    urban:
      "En appartement, le remplacement des fenêtres nécessite souvent l'accord de la copropriété si l'aspect extérieur est modifié. Vérifiez le règlement de copropriété avant les travaux.",
    rural:
      "Pour les maisons anciennes en zone rurale, un menuisier spécialisé en rénovation du patrimoine saura restaurer les huisseries d'époque tout en améliorant l'isolation.",
    default:
      "Vérifiez l'état des joints de vos fenêtres chaque année. Des joints usés peuvent augmenter votre facture de chauffage de 10 à 15 %.",
  },
  carreleur: {
    coastal:
      "Pour les terrasses en bord de mer, privilégiez un carrelage classement R11 antidérapant et résistant au gel, posé sur un support avec étanchéité renforcée contre les remontées salines.",
    mountain:
      "En montagne, le carrelage extérieur doit impérativement être classé antigel (norme NF EN ISO 10545-12). La pose sur plots est recommandée pour faciliter le drainage.",
    urban:
      "Dans les appartements anciens, le carreleur devra souvent réaliser un ragréage important pour compenser les irrégularités des planchers d'époque.",
    rural:
      "Pour les maisons de caractère, le carrelage en terre cuite ou les tomettes artisanales apportent un cachet authentique tout en offrant une excellente inertie thermique.",
    default:
      "Après la pose, attendez au moins 24 heures avant de marcher sur le carrelage et 7 jours avant de solliciter fortement le sol (meubles lourds).",
  },
  couvreur: {
    coastal:
      "En zone littorale, les toitures sont soumises aux vents forts et aux embruns. Un contrôle annuel de la fixation des tuiles et de l'étanchéité des faîtages est indispensable.",
    mountain:
      "En montagne, le poids de la neige impose un dimensionnement renforcé de la charpente. Vérifiez que votre couvreur connaît les charges de neige de votre zone (norme NF EN 1991-1-3).",
    urban:
      "En centre-ville, les toitures en zinc sont fréquentes et nécessitent un couvreur-zingueur spécialisé pour les réparations et l'entretien des noues et chéneaux.",
    rural:
      "Pour les maisons rurales avec une grande surface de toiture, profitez d'une réfection pour installer des panneaux solaires : le couvreur peut coordonner les deux chantiers.",
    default:
      "Faites inspecter votre toiture après chaque tempête et au moins une fois tous les 5 ans pour détecter les tuiles cassées ou déplacées avant que les infiltrations ne causent des dégâts.",
  },
  macon: {
    coastal:
      "En bord de mer, le béton armé est soumis à la corrosion des armatures par les chlorures. Exigez un béton de classe d'exposition XS (milieu marin) pour toute construction exposée.",
    mountain:
      "En montagne, les fondations doivent être plus profondes (hors gel) et le béton doit résister aux cycles gel-dégel. La classe d'exposition XF est requise pour les éléments extérieurs.",
    urban:
      "En milieu urbain dense, les travaux de maçonnerie en mitoyenneté nécessitent un constat d'huissier préalable et le respect des règles de voisinage (horaires, accès, propreté).",
    rural:
      "Pour les constructions en zone rurale, renseignez-vous sur les règles du PLU (Plan Local d'Urbanisme) : hauteur maximale, emprise au sol et matériaux autorisés varient selon les communes.",
    default:
      "Ne planifiez pas de travaux de maçonnerie en période de gel (température < 5 °C) : le mortier et le béton ne prennent pas correctement et la solidité de l'ouvrage est compromise.",
  },
  jardinier: {
    coastal:
      "En zone littorale, privilégiez des plantes résistantes aux embruns et au vent : tamaris, laurier-rose, agapanthe, graminées ornementales. Un jardinier-paysagiste local saura composer un jardin adapté.",
    mountain:
      "En montagne, la saison de jardinage est plus courte. Choisissez des plantes rustiques résistantes au gel (-15 à -25 °C) et planifiez les plantations entre mai et septembre.",
    urban:
      "En ville, les jardins de petite superficie et les terrasses gagnent à être aménagés par un paysagiste qui optimisera l'espace avec des plantes en bacs, des treillages et du mobilier adapté.",
    rural:
      "Pour les grands terrains, un contrat d'entretien annuel avec tonte bimensuelle, taille des haies et entretien des massifs est la solution la plus économique à long terme.",
    default:
      "Adaptez votre calendrier de jardinage à votre zone climatique : les dates de taille, de plantation et de semis varient significativement entre le nord et le sud de la France.",
  },
  vitrier: {
    coastal:
      "En front de mer, les vitrages doivent résister aux projections salines et aux vents forts. Optez pour du double vitrage feuilleté avec un intercalaire warm-edge pour une isolation optimale.",
    mountain:
      "En altitude, le triple vitrage est justifié pour les grandes baies vitrées exposées au nord. Le surcoût de 40 à 60 % est compensé par les économies de chauffage.",
    urban:
      "En centre-ville, le double vitrage acoustique (vitrage asymétrique 10/16/4) réduit le bruit extérieur de 35 à 40 dB, un confort appréciable en bordure de rue passante.",
    rural:
      "Pour les maisons isolées, les vitrages retardateurs d'effraction (classés P2A à P5A) renforcent la sécurité sans nécessiter de volets roulants ou de barreaux.",
    default:
      "Vérifiez l'état de vos joints de vitrage chaque année. Un joint défaillant provoque des infiltrations d'air et d'eau qui dégradent le cadre et réduisent l'isolation.",
  },
  climaticien: {
    coastal:
      "Le climat méditerranéen rend nécessaire une climatisation performante de mai à septembre. En bord de mer, l'unité extérieure doit être protégée de la corrosion saline avec un traitement anticorrosion spécifique.",
    mountain:
      "En montagne, la climatisation réversible (pompe à chaleur air-air) est idéale : elle rafraîchit en été et chauffe efficacement en mi-saison, réduisant la facture énergétique globale.",
    urban:
      "En copropriété, l'installation d'une unité extérieure de climatisation nécessite l'accord de l'assemblée générale. Le bruit de l'appareil doit respecter les normes de voisinage.",
    rural:
      "Pour les grandes maisons, un système gainable avec régulation par zone permet de climatiser chaque pièce indépendamment, optimisant le confort et la consommation.",
    default:
      "Faites entretenir votre climatisation chaque année au printemps, avant la saison chaude. Un filtre encrassé augmente la consommation de 5 à 15 % et dégrade la qualité de l'air.",
  },
  cuisiniste: {
    coastal:
      "En bord de mer, l'humidité ambiante peut affecter les meubles de cuisine en bois massif. Optez pour des façades en stratifié haute pression ou en laqué, plus résistantes à l'humidité.",
    mountain:
      "Dans les chalets et maisons de montagne, une cuisine en bois massif (chêne, noyer) s'harmonise avec l'architecture locale. Un cuisiniste artisan local maîtrise ces finitions traditionnelles.",
    urban:
      "En appartement, l'optimisation de l'espace est primordiale. Un cuisiniste expérimenté peut concevoir une cuisine fonctionnelle même dans moins de 6 m² grâce au mobilier sur mesure.",
    rural:
      "Pour les grandes cuisines de maison, l'îlot central est un atout majeur. Prévoyez au minimum 90 cm de passage autour de l'îlot pour une circulation confortable.",
    default:
      "Prenez le temps de comparer au moins 3 devis de cuisinistes différents. Les écarts de prix pour des prestations similaires peuvent atteindre 30 à 50 %.",
  },
  solier: {
    coastal:
      "En zone littorale humide, les sols PVC et vinyle sont particulièrement adaptés grâce à leur étanchéité naturelle. Évitez le parquet massif dans les pièces exposées à l'humidité marine.",
    mountain:
      "En montagne, le parquet massif en chêne ou en châtaignier apporte chaleur et authenticité. Associé à un chauffage au sol, le parquet contrecollé offre le meilleur compromis.",
    urban:
      "En appartement, l'isolation phonique du sol est essentielle pour le confort des voisins. Exigez une sous-couche acoustique conforme à la réglementation (ΔLw ≥ 17 dB).",
    rural:
      "Pour les maisons anciennes avec des planchers irréguliers, un ragréage soigné est indispensable avant la pose. Le solier évaluera la planéité et proposera la solution adaptée.",
    default:
      "Laissez le revêtement de sol s'acclimater 48 heures dans la pièce avant la pose, à température ambiante, pour éviter les retraits ou dilatations après installation.",
  },
  nettoyage: {
    coastal:
      "En bord de mer, le nettoyage des vitres et des façades doit être plus fréquent en raison des dépôts de sel marin. Un contrat trimestriel de nettoyage extérieur préserve l'aspect du bâtiment.",
    mountain:
      "Après la saison d'hiver, un nettoyage complet des extérieurs (façade, terrasse, gouttières) est recommandé pour éliminer les résidus de sel de déneigement et les mousses.",
    urban:
      "En copropriété, le nettoyage des parties communes (hall, escaliers, local poubelles) est un poste important du budget. Un appel d'offres annuel permet d'obtenir les meilleurs tarifs.",
    rural:
      "Pour les grandes propriétés, le nettoyage de fin de chantier après des travaux de rénovation nécessite une entreprise équipée : aspirateur industriel, autolaveuse, nettoyeur haute pression.",
    default:
      "Pour un résultat professionnel, demandez toujours un devis après visite sur site. Le prix au m² varie selon l'état des lieux et le type de nettoyage requis.",
  },
  terrassier: {
    coastal:
      "En zone littorale, les sols sablonneux et la proximité de la nappe phréatique imposent une étude géotechnique préalable. Le terrassier doit adapter le compactage et prévoir un drainage renforcé pour éviter les remontées d'eau.",
    mountain:
      "En montagne, la profondeur hors gel des fondations peut dépasser 1 mètre selon l'altitude. Privilégiez les travaux de terrassement en été, lorsque le sol est dégelé et sec, pour éviter les effondrements liés au dégel.",
    urban:
      "En milieu urbain dense, le terrassement nécessite une attention particulière aux réseaux enterrés (gaz, eau, électricité, fibre). Une déclaration de travaux (DT/DICT) est obligatoire avant tout coup de pelle mécanique.",
    rural:
      "En zone rurale, les terrains non viabilisés peuvent présenter des surprises : roche affleurante, argiles gonflantes ou anciennes cavités. Une étude de sol G2 est recommandée avant tout projet de construction.",
    default:
      "Planifiez vos travaux de terrassement en période sèche (printemps ou début d'automne) : un sol détrempé par la pluie est instable, plus lourd à évacuer et sujet aux effondrements de talus.",
  },
  charpentier: {
    coastal:
      "En bord de mer, l'humidité saline accélère la dégradation du bois de charpente. Privilégiez des essences naturellement résistantes (chêne, châtaignier) ou un traitement autoclave classe 4 pour les pièces exposées.",
    mountain:
      "En montagne, la charpente doit être dimensionnée pour supporter les charges de neige selon la norme NF EN 1991-1-3 (jusqu'à 400 kg/m² en haute altitude). Un contrôle après chaque hiver rigoureux est conseillé.",
    urban:
      "En centre-ville, la rénovation d'une charpente ancienne nécessite souvent un diagnostic préalable (insectes xylophages, champignons). En secteur protégé, l'architecte des Bâtiments de France peut imposer des matériaux spécifiques.",
    rural:
      "Pour les granges et corps de ferme, un charpentier spécialisé en patrimoine rural saura restaurer les fermes traditionnelles tout en renforçant la structure pour un aménagement de combles ou un changement d'usage.",
    default:
      "L'été est la saison idéale pour les travaux de charpente : le bois sec absorbe mieux les traitements préventifs, et les conditions météo permettent de travailler à découvert sans risque d'infiltration.",
  },
  zingueur: {
    coastal:
      "En zone littorale, le zinc est soumis à la corrosion saline accélérée. Optez pour du zinc prépatiné ou du zinc-titane à haute résistance, et faites contrôler les soudures et joints tous les 2 ans.",
    mountain:
      "En montagne, les fortes chutes de neige et le gel peuvent endommager les gouttières et chéneaux en zinc. Un zingueur doit vérifier les fixations et l'étanchéité des raccords après chaque hiver.",
    urban:
      "En centre-ville, les toitures en zinc à joints debout sont caractéristiques du patrimoine haussmannien. Faites appel à un zingueur qualifié pour les réparations afin de préserver l'aspect d'origine et la conformité urbanistique.",
    rural:
      "Pour les bâtiments agricoles et les grandes toitures, le zinc offre un excellent rapport durabilité-prix avec une durée de vie de 80 à 100 ans. Un entretien régulier des évacuations d'eau pluviale prolonge cette longévité.",
    default:
      "Faites nettoyer et inspecter vos gouttières, chéneaux et descentes en zinc au printemps et à l'automne pour éviter les obstructions par les feuilles mortes et garantir un bon écoulement des eaux pluviales.",
  },
  etancheiste: {
    coastal:
      "En bord de mer, les toitures-terrasses sont exposées aux embruns et aux vents violents. L'étanchéiste doit utiliser des membranes renforcées (EPDM ou bitume élastomère SBS) avec un collage intégral pour résister aux arrachements.",
    mountain:
      "En altitude, les cycles gel-dégel répétés mettent à rude épreuve l'étanchéité des toitures plates. Une membrane élastique capable de supporter des températures jusqu'à -30 °C est indispensable.",
    urban:
      "En immeuble, l'étanchéité des toitures-terrasses doit être contrôlée tous les 5 ans et rénovée tous les 15 à 20 ans. En copropriété, ce poste représente un investissement majeur à anticiper dans le plan pluriannuel de travaux.",
    rural:
      "Pour les dépendances et extensions à toit plat en zone rurale, une étanchéité liquide (résine polyuréthane) offre une mise en œuvre rapide et une excellente adaptation aux formes irrégulières des bâtis anciens.",
    default:
      "Planifiez les travaux d'étanchéité au printemps ou en début d'automne, par temps sec et hors gel (température supérieure à 5 °C), pour garantir une adhérence optimale des membranes et résines.",
  },
  facadier: {
    coastal:
      "En zone littorale, les façades subissent une usure accélérée due aux embruns salins et à l'humidité. Un ravalement avec un enduit hydrofuge et une peinture spéciale façade marine est recommandé tous les 8 à 10 ans.",
    mountain:
      "En montagne, les écarts de température importants (jusqu'à 40 °C d'amplitude annuelle) imposent l'utilisation d'enduits souples et de peintures élastiques capables de résister aux cycles gel-dégel sans fissurer.",
    urban:
      "En centre-ville, le ravalement de façade est souvent obligatoire tous les 10 ans (arrêté municipal). Renseignez-vous en mairie sur les couleurs autorisées et les aides financières disponibles (ANAH, MaPrimeRénov').",
    rural:
      "Pour les maisons en pierre de pays, le facadier doit maîtriser les enduits à la chaux qui laissent respirer les murs anciens. Les enduits ciment sont à proscrire car ils emprisonnent l'humidité et dégradent la pierre.",
    default:
      "La période idéale pour un ravalement de façade se situe entre avril et octobre, lorsque les températures sont comprises entre 5 et 30 °C et que l'humidité relative reste inférieure à 80 %.",
  },
  platrier: {
    coastal:
      "En zone littorale, l'humidité ambiante élevée ralentit le séchage du plâtre. Privilégiez les plaques de plâtre hydrofuges (type H1) pour les pièces exposées, et prévoyez une ventilation renforcée pendant le séchage.",
    mountain:
      "En montagne, les variations importantes de température et d'hygrométrie entre les saisons imposent l'utilisation de bandes de désolidarisation aux jonctions murs-plafond pour absorber les mouvements du bâti.",
    urban:
      "En appartement ancien, le plâtrier intervient souvent pour la rénovation des moulures, corniches et rosaces au plafond. Un artisan spécialisé en plâtrerie traditionnelle saura restaurer ces éléments patrimoniaux.",
    rural:
      "Pour les maisons anciennes en pierre, le plâtre traditionnel projeté offre une meilleure régulation hygrométrique que les plaques de plâtre. Il laisse respirer les murs tout en offrant une finition lisse et durable.",
    default:
      "Les travaux de plâtrerie nécessitent une température ambiante comprise entre 5 et 30 °C pour un séchage optimal. Comptez une semaine par centimètre d'épaisseur avant d'appliquer la peinture de finition.",
  },
  metallier: {
    coastal:
      "En bord de mer, les ouvrages métalliques (garde-corps, portails, verrières) doivent recevoir un traitement anticorrosion renforcé : galvanisation à chaud suivie d'un thermolaquage pour résister à l'air salin (classe de corrosivité C4-C5).",
    mountain:
      "En montagne, les structures métalliques extérieures (balcons, escaliers, auvents) doivent être dimensionnées pour supporter les charges de neige et les contraintes thermiques liées aux écarts de température importants.",
    urban:
      "En milieu urbain, le métallier conçoit des ouvrages sur mesure adaptés aux contraintes d'espace : verrières d'atelier, mezzanines, escaliers hélicoïdaux et garde-corps design qui optimisent les volumes intérieurs.",
    rural:
      "Pour les propriétés rurales, le métallier fabrique des portails, clôtures et structures agricoles (hangars, abris) robustes et fonctionnels. L'acier galvanisé offre un excellent rapport résistance-prix pour ces grands ouvrages.",
    default:
      "Un entretien annuel des ouvrages métalliques extérieurs est indispensable : inspection des soudures, reprise des points de rouille et application d'une peinture antirouille prolongent la durée de vie de vos installations.",
  },
  ferronnier: {
    coastal:
      "En bord de mer, le fer forgé est particulièrement vulnérable à la corrosion saline. Exigez un système duplex (galvanisation + thermolaquage) pour vos garde-corps, portails et grilles, et prévoyez un entretien trimestriel.",
    mountain:
      "En montagne, les ouvrages en fer forgé extérieurs (rambardes, balconnets) subissent les cycles gel-dégel qui accélèrent l'oxydation. Un traitement antirouille et une peinture spéciale montagne sont recommandés chaque printemps.",
    urban:
      "En centre-ville historique, le ferronnier d'art restaure les éléments de patrimoine (grilles, impostes, marquises) dans le respect du style d'origine. En secteur ABF, la conformité des ouvrages aux prescriptions architecturales est obligatoire.",
    rural:
      "Pour les demeures de caractère, le ferronnier crée des pièces uniques (portails, rampes d'escalier, girouettes) qui valorisent le patrimoine rural. Le fer forgé artisanal apporte un cachet authentique aux maisons de campagne.",
    default:
      "Entretenez vos ouvrages en fer forgé au moins deux fois par an : un nettoyage à l'eau savonneuse suivi d'une application de cire ou de vernis antirouille protège durablement le métal contre l'oxydation.",
  },
  'poseur-de-parquet': {
    coastal:
      "En zone littorale, l'humidité ambiante élevée rend le parquet massif vulnérable aux déformations. Privilégiez un parquet contrecollé ou un parquet en bois exotique (teck, ipé) naturellement résistant à l'humidité.",
    mountain:
      "En montagne, le parquet en chêne massif ou en châtaignier apporte chaleur et authenticité aux chalets. Associé à un plancher chauffant, le parquet contrecollé (épaisseur ≤ 15 mm) offre le meilleur compromis thermique.",
    urban:
      "En appartement, l'isolation phonique sous parquet est essentielle pour le confort des voisins. Exigez une sous-couche acoustique conforme à la réglementation (affaiblissement ΔLw ≥ 17 dB) avant toute pose.",
    rural:
      "Pour les maisons anciennes aux planchers irréguliers, un ragréage soigné est indispensable avant la pose. Un poseur expérimenté saura adapter la technique (pose collée, flottante ou clouée) à l'état du support.",
    default:
      "Le printemps et l'automne offrent les meilleures conditions pour la pose de parquet : une température de 18 à 20 °C et une hygrométrie entre 40 et 60 % garantissent la stabilité dimensionnelle du bois.",
  },
  miroitier: {
    coastal:
      "En bord de mer, les vitrages et miroirs extérieurs sont exposés aux projections salines. Le miroitier doit utiliser des vitrages traités anticorrosion avec des intercalaires warm-edge pour éviter la dégradation des joints.",
    mountain:
      "En altitude, le triple vitrage est recommandé pour les grandes surfaces vitrées exposées au froid. Le miroitier peut concevoir des vitrages à isolation thermique renforcée (Ug ≤ 0,6 W/m²K) pour limiter les déperditions.",
    urban:
      "En milieu urbain, le miroitier installe des cloisons vitrées, des crédences en verre et des miroirs sur mesure qui agrandissent visuellement les espaces réduits des appartements en centre-ville.",
    rural:
      "Pour les maisons isolées, le miroitier peut poser des vitrages retardateurs d'effraction (classés P2A à P5A) qui renforcent la sécurité sans nuire à l'esthétique ni nécessiter de barreaux ou volets blindés.",
    default:
      "Lors du remplacement d'un vitrage, demandez au miroitier un devis comparatif entre double et triple vitrage. L'écart de prix de 40 à 60 % peut être rentabilisé en 5 à 8 ans grâce aux économies d'énergie.",
  },
  storiste: {
    coastal:
      "En zone littorale, les stores bannes et volets roulants sont exposés aux vents forts et à l'air salin. Optez pour des toiles traitées anti-UV et anti-moisissures, et des mécanismes en aluminium laqué résistant à la corrosion.",
    mountain:
      "En montagne, les volets roulants isolants (mousse polyuréthane injectée) réduisent significativement les déperditions thermiques en hiver. Un storiste local saura adapter les dimensions aux contraintes des ouvertures de chalet.",
    urban:
      "En copropriété, l'installation de stores extérieurs ou de volets roulants peut nécessiter l'accord de l'assemblée générale si l'aspect de la façade est modifié. Vérifiez le règlement de copropriété avant les travaux.",
    rural:
      "Pour les grandes maisons avec de nombreuses ouvertures, un système de volets roulants motorisés avec centralisation domotique permet de gérer l'ensemble des ouvrants depuis une seule commande ou un smartphone.",
    default:
      "Faites installer vos stores bannes au printemps, avant les premières chaleurs estivales. Un entretien annuel (nettoyage de la toile, lubrification du mécanisme, vérification du moteur) prolonge leur durée de vie de 5 à 10 ans.",
  },
  'salle-de-bain': {
    coastal:
      "En zone littorale, l'humidité ambiante élevée exige une ventilation renforcée dans la salle de bain (VMC hygroréglable type B minimum) et des matériaux résistants : carrelage grès cérame, meubles en stratifié hydrofuge.",
    mountain:
      "En montagne, la salle de bain doit compenser le froid extérieur : plancher chauffant électrique, sèche-serviettes performant et isolation thermique renforcée des murs donnant sur l'extérieur garantissent le confort.",
    urban:
      "En appartement, la rénovation d'une salle de bain implique souvent des contraintes d'accès et de mitoyenneté. Planifiez les travaux en automne ou en hiver, quand les artisans sont plus disponibles et les délais plus courts.",
    rural:
      "Pour les maisons non raccordées au tout-à-l'égout, la salle de bain doit être conçue pour limiter la charge sur l'assainissement individuel : robinetterie économe en eau, douche plutôt que baignoire, chasse d'eau double débit.",
    default:
      "Les vacances d'été sont souvent privilégiées pour rénover la salle de bain (4 semaines de travaux en moyenne), mais la période septembre-février offre de meilleurs délais et parfois des tarifs plus avantageux.",
  },
  'architecte-interieur': {
    coastal:
      "En bord de mer, l'architecte d'intérieur privilégie des matériaux résistants à l'humidité saline : sols en grès cérame, menuiseries en aluminium thermolaqué et textiles techniques anti-moisissures pour un intérieur durable.",
    mountain:
      "En montagne, l'architecte d'intérieur conçoit des espaces chaleureux adaptés au climat : bois massif, pierre naturelle, isolation renforcée et optimisation de la lumière naturelle dans des pièces souvent plus sombres en hiver.",
    urban:
      "En appartement citadin, l'architecte d'intérieur optimise chaque mètre carré : cloisons amovibles, rangements sur mesure, mezzanines et jeux de lumière agrandissent visuellement les espaces les plus contraints.",
    rural:
      "Pour les maisons de campagne et les corps de ferme réhabilités, l'architecte d'intérieur valorise les éléments de caractère (poutres apparentes, pierres, tomettes) tout en intégrant un confort moderne et fonctionnel.",
    default:
      "Consultez un architecte d'intérieur en amont de vos travaux de rénovation : sa vision globale du projet permet d'optimiser le budget, d'anticiper les contraintes techniques et de coordonner efficacement les différents corps de métier.",
  },
  decorateur: {
    coastal:
      "En bord de mer, le décorateur sélectionne des textiles résistants à l'humidité et aux UV (lin lavé, coton traité) et des couleurs qui ne ternissent pas avec le sel marin. Les matières naturelles (rotin, jute) apportent une ambiance littorale authentique.",
    mountain:
      "En montagne, le décorateur crée des ambiances cocooning avec des matières chaudes (laine, fourrure, bois brut) et des teintes profondes. Le mobilier et les textiles doivent aussi répondre aux contraintes d'entretien liées aux activités outdoor.",
    urban:
      "En petit espace urbain, le décorateur joue sur les couleurs claires, les miroirs et l'éclairage stratégique pour agrandir visuellement les pièces. Un choix cohérent de mobilier multifonctionnel optimise le confort au quotidien.",
    rural:
      "Pour les maisons de campagne, le décorateur marie l'ancien et le contemporain : meubles chinés, objets artisanaux locaux et touches de modernité créent un intérieur chaleureux qui respecte le cachet du bâti traditionnel.",
    default:
      "Faites appel à un décorateur avant d'acheter mobilier et matériaux : ses conseils sur les couleurs, les textures et l'agencement vous évitent des erreurs coûteuses et garantissent un résultat harmonieux dès le premier essai.",
  },
  domoticien: {
    coastal:
      "En zone littorale, la domotique permet de gérer automatiquement la fermeture des volets en cas de vent fort (capteur anémométrique) et de contrôler la ventilation pour lutter contre l'humidité saline dans le logement.",
    mountain:
      "En montagne, un système domotique optimise le chauffage : programmation selon les heures d'ensoleillement, gestion à distance pour les résidences secondaires et alertes en cas de gel pour prévenir les dégâts sur les canalisations.",
    urban:
      "En appartement connecté, la domotique centralise la gestion de l'éclairage, du chauffage, des volets et de la sécurité via une seule application. L'installation sans fil (protocole Zigbee, Z-Wave) évite les travaux lourds de câblage.",
    rural:
      "Pour les grandes propriétés rurales, la domotique sécurise les accès (portail motorisé, vidéosurveillance, détection de présence) et automatise l'arrosage du jardin et la gestion de l'éclairage extérieur à distance.",
    default:
      "Planifiez l'installation domotique pendant une rénovation électrique pour intégrer le câblage nécessaire. Pour un logement existant, les solutions sans fil offrent une mise en œuvre rapide et non invasive.",
  },
  'pompe-a-chaleur': {
    coastal:
      "En zone littorale aux hivers doux, la pompe à chaleur air-eau affiche un COP optimal (coefficient de performance de 4 à 5). L'unité extérieure doit cependant être protégée de la corrosion saline par un traitement anticorrosion spécifique.",
    mountain:
      "En altitude, les températures hivernales basses (sous -10 °C) réduisent significativement le rendement des PAC air-eau. Un modèle haute température ou un système hybride (PAC + chaudière bois) est recommandé au-dessus de 800 m.",
    urban:
      "En copropriété, l'installation d'une pompe à chaleur nécessite l'accord de l'AG pour l'unité extérieure. Attention au bruit : respectez la réglementation sur les émergences sonores (5 dB de jour, 3 dB de nuit) pour le voisinage.",
    rural:
      "En zone rurale non raccordée au gaz de ville, la pompe à chaleur est l'alternative idéale au fioul (en voie de suppression). Un modèle air-eau de 8 à 12 kW couvre les besoins d'une maison individuelle de 100 à 150 m².",
    default:
      "Faites installer votre pompe à chaleur au printemps ou en été, quand les besoins en chauffage sont faibles. Cela évite une coupure inconfortable en plein hiver et permet de bénéficier de délais d'intervention plus courts.",
  },
  'panneaux-solaires': {
    coastal:
      "En zone littorale, l'ensoleillement généreux (1 800 à 2 500 h/an) maximise la production solaire. Attention toutefois à la corrosion saline des fixations : exigez des supports en aluminium anodisé ou en acier inoxydable.",
    mountain:
      "En montagne, l'ensoleillement est excellent mais la neige peut recouvrir les panneaux en hiver. Une inclinaison de 35 à 45° favorise le glissement naturel de la neige et optimise la production estivale en altitude.",
    urban:
      "En toiture d'immeuble, les panneaux solaires sont une excellente valorisation des parties communes. La copropriété peut opter pour l'autoconsommation collective, réduisant la facture énergétique de l'ensemble des résidents.",
    rural:
      "Les grandes toitures des maisons rurales et bâtiments agricoles offrent un potentiel solaire considérable. Une installation de 6 à 9 kWc en autoconsommation avec revente de surplus couvre les besoins et génère un revenu complémentaire.",
    default:
      "Le printemps et le début de l'automne sont les meilleures périodes pour installer des panneaux solaires : conditions météo favorables, disponibilité des installateurs et mise en service avant les pics de production estivale.",
  },
  'isolation-thermique': {
    coastal:
      "En zone littorale, l'isolation thermique doit aussi gérer l'humidité saline. Privilégiez les isolants insensibles à l'eau (polyuréthane projeté, verre cellulaire) pour les murs exposés aux embruns et à la condensation.",
    mountain:
      "En montagne, une isolation renforcée est indispensable : visez une résistance thermique R ≥ 8 m²K/W en toiture et R ≥ 5 en murs pour compenser les hivers longs et rigoureux à plus de 800 m d'altitude.",
    urban:
      "En copropriété, l'isolation thermique par l'extérieur (ITE) est la solution la plus efficace pour améliorer le DPE sans réduire la surface habitable. Elle nécessite un vote en assemblée générale et peut bénéficier de MaPrimeRénov' copropriété.",
    rural:
      "Pour les maisons anciennes en pierre, l'isolation par l'intérieur doit préserver la capacité du mur à respirer. Les isolants biosourcés (fibre de bois, chanvre, ouate de cellulose) offrent un excellent compromis entre performance thermique et régulation hygrométrique.",
    default:
      "L'automne est la période idéale pour engager des travaux d'isolation thermique : les artisans RGE sont plus disponibles qu'au printemps et les travaux seront terminés avant l'hiver, vous permettant de bénéficier immédiatement des économies de chauffage.",
  },
  'renovation-energetique': {
    coastal:
      "En zone littorale, la rénovation énergétique doit intégrer la résistance à l'air salin et l'humidité. Les menuiseries en aluminium thermolaqué et les isolants hydrophobes garantissent la pérennité des travaux face aux conditions marines.",
    mountain:
      "En montagne, la rénovation énergétique globale (isolation + chauffage + ventilation) est la plus rentable. Les aides MaPrimeRénov' Parcours accompagné sont majorées pour les logements en zone climatique H1, où les besoins de chauffage sont les plus élevés.",
    urban:
      "En milieu urbain, la rénovation énergétique des copropriétés représente un enjeu majeur. Le diagnostic technique global (DTG) et l'audit énergétique sont désormais obligatoires pour planifier les travaux dans le plan pluriannuel de travaux.",
    rural:
      "Pour les maisons individuelles rurales chauffées au fioul, la rénovation énergétique combinant isolation et remplacement de la chaudière par une pompe à chaleur permet de diviser la facture énergétique par 3 à 4, avec des aides pouvant couvrir jusqu'à 90 % du coût.",
    default:
      "Commencez toujours par un audit énergétique réglementaire avant d'engager des travaux de rénovation. Il hiérarchise les postes à traiter (isolation, chauffage, ventilation) et conditionne l'accès aux aides MaPrimeRénov' les plus avantageuses.",
  },
  'borne-recharge': {
    coastal:
      "En zone littorale, la borne de recharge extérieure doit résister à la corrosion saline. Exigez un boîtier IP65 minimum avec des connecteurs traités anticorrosion, et prévoyez un auvent de protection contre les embruns.",
    mountain:
      "En montagne, la borne de recharge doit fonctionner par grand froid (-20 °C). Les modèles avec préchauffage intégré et câble renforcé garantissent une charge fiable même en conditions hivernales extrêmes.",
    urban:
      "En copropriété, l'installation d'une borne de recharge relève du droit à la prise : le syndic ne peut s'y opposer. L'installateur IRVE qualifié dimensionnera la puissance disponible et proposera une solution de comptage individuel conforme.",
    rural:
      "En zone rurale, l'installation d'une borne de recharge 7 kW en monophasé suffit pour les besoins quotidiens. Si votre compteur le permet, une borne 22 kW triphasée offre une recharge complète en 2 à 3 heures.",
    default:
      "Faites installer votre borne de recharge par un installateur certifié IRVE (Infrastructure de Recharge pour Véhicules Électriques). Cette qualification est obligatoire pour les bornes de plus de 3,7 kW et conditionne l'accès au crédit d'impôt de 300 €.",
  },
  ramoneur: {
    coastal:
      "En zone littorale, les cheminées sont moins sollicitées mais le ramonage annuel reste obligatoire. L'humidité marine favorise les dépôts de bistre dans les conduits peu utilisés, augmentant le risque de feu de cheminée à la reprise.",
    mountain:
      "En montagne, le ramonage doit être effectué deux fois par an (obligation légale) en raison de l'usage intensif du chauffage au bois. Planifiez un passage en septembre avant la saison de chauffe et un en mars après l'hiver.",
    urban:
      "En immeuble, le ramonage des conduits collectifs est à la charge de la copropriété et doit être réalisé par un professionnel qualifié. Vérifiez que le syndic fait bien effectuer les deux ramonages annuels obligatoires.",
    rural:
      "En zone rurale, les poêles à bois et inserts sont très répandus. Un ramoneur qualifié contrôlera non seulement le conduit mais aussi l'état du tubage, les joints d'étanchéité et le tirage, garants d'un fonctionnement sûr et performant.",
    default:
      "Le ramonage est obligatoire au moins une fois par an (deux fois pour le bois et le charbon). Le certificat de ramonage délivré par le professionnel est exigé par votre assurance habitation en cas de sinistre lié au chauffage.",
  },
  paysagiste: {
    coastal:
      "En bord de mer, le paysagiste compose avec les contraintes du vent, du sel et de la sécheresse estivale. Les jardins littoraux réussis associent haies brise-vent (tamaris, éléagnus), couvre-sols résistants et plantes de rocaille.",
    mountain:
      "En montagne, le paysagiste doit sélectionner des végétaux rustiques supportant le gel intense et la courte saison de végétation. Les jardins alpins, les murets en pierre sèche et les prairies fleuries s'intègrent naturellement au paysage.",
    urban:
      "En milieu urbain, le paysagiste optimise les petits espaces : jardins de ville, terrasses et toitures végétalisées. La conception paysagère intègre les contraintes de vis-à-vis, de poids et d'accès pour créer des îlots de verdure en cœur de ville.",
    rural:
      "Pour les grands terrains ruraux, le paysagiste conçoit un plan d'aménagement global : allées, haies champêtres, verger, potager et espaces de détente. Un projet bien pensé valorise la propriété tout en limitant l'entretien futur.",
    default:
      "Consultez un paysagiste avant de planter : sa connaissance du sol, du climat local et des végétaux adaptés vous évitera des erreurs coûteuses. Un plan d'aménagement paysager professionnel valorise votre propriété de 10 à 15 %.",
  },
  pisciniste: {
    coastal:
      "En zone littorale, la piscine bénéficie d'un climat favorable à une longue saison de baignade (mai à octobre). Le pisciniste doit cependant anticiper la corrosion saline des équipements et recommander des matériaux adaptés (inox 316L, PVC renforcé).",
    mountain:
      "En montagne, la construction d'une piscine impose des précautions spécifiques : fondations hors gel, hivernage rigoureux, chauffage par pompe à chaleur haute température ou panneaux solaires pour compenser la fraîcheur des soirées d'altitude.",
    urban:
      "En milieu urbain, les mini-piscines (moins de 10 m²) ne nécessitent pas de permis de construire et s'intègrent dans les petits jardins de ville. Le pisciniste optimise l'espace avec des formes compactes et des équipements intégrés.",
    rural:
      "En zone rurale, les terrains spacieux permettent d'envisager de grandes piscines avec plage immergée et pool house. Vérifiez les règles du PLU et la distance réglementaire par rapport aux limites de propriété avant tout projet.",
    default:
      "L'hiver est la meilleure période pour planifier votre projet de piscine : les piscinistes sont plus disponibles, les délais de construction sont plus courts et le bassin sera prêt pour la saison estivale suivante.",
  },
  'alarme-securite': {
    coastal:
      "En zone littorale, les systèmes d'alarme doivent résister à la corrosion saline. Privilégiez des détecteurs et sirènes en boîtiers étanches IP65 avec traitement anticorrosion, et prévoyez une maintenance semestrielle des contacts extérieurs.",
    mountain:
      "En montagne, les résidences secondaires inoccupées une partie de l'année sont des cibles privilégiées. Un système d'alarme connecté avec vidéosurveillance et alerte smartphone permet de surveiller votre bien à distance toute l'année.",
    urban:
      "En centre-ville et en appartement, les cambriolages sont statistiquement plus fréquents. Un système d'alarme avec détection d'ouverture sur toutes les fenêtres accessibles et une sirène intérieure dissuasive renforce significativement la protection.",
    rural:
      "En zone rurale isolée, un système d'alarme avec détection périmétrique extérieure (barrières infrarouges, vidéo-détection) protège la propriété avant même qu'un intrus n'atteigne le bâtiment. La télésurveillance compense l'éloignement des forces de l'ordre.",
    default:
      "Faites réaliser un diagnostic sécurité par un installateur certifié APSAD avant de choisir votre système d'alarme. Il identifiera les points vulnérables de votre habitation et dimensionnera la solution adaptée à votre niveau de risque.",
  },
  antenniste: {
    coastal:
      "En zone littorale, les antennes sont exposées aux vents forts et à la corrosion saline. L'antenniste doit utiliser des fixations en inox et des câbles à double blindage pour garantir une réception stable et durable face aux conditions marines.",
    mountain:
      "En montagne, la réception TNT peut être perturbée par le relief. L'antenniste orientera l'antenne vers le meilleur émetteur et pourra recommander un amplificateur de signal ou une parabole satellite si la couverture terrestre est insuffisante.",
    urban:
      "En copropriété, l'antenne collective dessert l'ensemble des logements. L'antenniste peut moderniser l'installation (passage à la fibre optique, ajout de prises multimédia) en intervenant sur les parties communes après accord du syndic.",
    rural:
      "En zone rurale, la couverture TNT peut être limitée et la fibre absente. Un antenniste qualifié évaluera les options disponibles : antenne directionnelle haute performance, réception satellite ou internet par antenne 4G/5G fixe.",
    default:
      "Depuis le passage à la TNT HD, certaines anciennes antennes râteau ne captent plus tous les canaux. Faites contrôler votre installation par un antenniste pour vérifier la compatibilité et optimiser la qualité de réception.",
  },
  ascensoriste: {
    coastal:
      "En zone littorale, les ascenseurs sont exposés à l'air salin qui corrode les câbles, guides et composants électroniques. Un contrat de maintenance renforcé avec inspection trimestrielle des pièces sensibles est recommandé pour les immeubles en front de mer.",
    mountain:
      "En station de montagne, les ascenseurs subissent des variations de température extrêmes et une fréquentation saisonnière intense. L'ascensoriste doit adapter le programme de maintenance au rythme des saisons touristiques.",
    urban:
      "En copropriété urbaine, la modernisation de l'ascenseur (mise aux normes, remplacement de la cabine, installation d'un variateur de fréquence) améliore la sécurité, réduit la consommation d'énergie et valorise le patrimoine de l'immeuble.",
    rural:
      "Pour les ERP (établissements recevant du public) en zone rurale comme les mairies, les EHPAD ou les cabinets médicaux, l'installation d'un ascenseur ou d'une plateforme élévatrice répond aux obligations d'accessibilité PMR.",
    default:
      "Le contrat d'entretien d'ascenseur est obligatoire et doit inclure au minimum une visite mensuelle de vérification et un contrôle technique quinquennal. Comparez les offres des ascensoristes en vérifiant le détail des prestations incluses.",
  },
  diagnostiqueur: {
    coastal:
      "En zone littorale, le diagnostiqueur immobilier porte une attention particulière aux risques naturels (submersion marine, érosion côtière) et à l'état des matériaux exposés aux embruns, qui vieillissent plus rapidement qu'à l'intérieur des terres.",
    mountain:
      "En montagne, le diagnostic immobilier inclut l'évaluation des risques naturels spécifiques : avalanches, glissements de terrain et mouvements de sols. Le DPE révèle souvent des besoins d'isolation importants dans les logements d'altitude.",
    urban:
      "En centre-ville, les logements anciens nécessitent fréquemment un diagnostic amiante (bâtiments avant 1997), un diagnostic plomb (avant 1949) et un DPE qui révèle souvent une étiquette E, F ou G dans le bâti non rénové.",
    rural:
      "En zone rurale, le diagnostiqueur vérifie également l'assainissement non collectif (contrôle SPANC obligatoire pour la vente) et les risques liés aux termites, aux mérules ou au radon selon la localisation géographique du bien.",
    default:
      "Regroupez tous vos diagnostics immobiliers obligatoires (DPE, amiante, plomb, électricité, gaz, termites, ERP) auprès d'un seul diagnostiqueur certifié. Le pack complet est plus économique que des interventions séparées.",
  },
  geometre: {
    coastal:
      "En zone littorale, le géomètre-expert intervient dans le contexte particulier du recul du trait de côte et des zones submersibles. Le bornage et la délimitation des propriétés tiennent compte des servitudes liées aux risques côtiers.",
    mountain:
      "En montagne, le géomètre-expert travaille sur des terrains pentus avec des accès parfois difficiles. Le relevé topographique est indispensable pour implanter correctement un bâtiment et dimensionner les terrassements sur un terrain en pente.",
    urban:
      "En milieu urbain dense, le géomètre-expert intervient pour les divisions parcellaires, les copropriétés et les limites mitoyennes. Son expertise est incontournable lors d'une division de terrain en vue d'une construction en second rang.",
    rural:
      "En zone rurale, le bornage par un géomètre-expert est essentiel pour sécuriser les limites de propriété, souvent imprécises sur les anciens cadastres. Cette démarche prévient les litiges de voisinage lors d'une clôture ou d'une construction.",
    default:
      "Avant tout achat de terrain constructible, faites réaliser un bornage contradictoire par un géomètre-expert. Ce document officiel, opposable aux tiers, garantit la superficie exacte et les limites précises de votre future propriété.",
  },
  desinsectisation: {
    coastal:
      "En zone littorale au climat doux, les insectes sont actifs une grande partie de l'année. Les moustiques, les blattes et les guêpes prolifèrent dès le printemps et nécessitent des traitements préventifs réguliers pour les habitations proches du littoral.",
    mountain:
      "En montagne, les insectes xylophages (capricornes, vrillettes) menacent les charpentes en bois des chalets et maisons traditionnelles. Un traitement préventif tous les 10 ans et une inspection régulière protègent la structure du bâti.",
    urban:
      "En milieu urbain dense, les blattes et les punaises de lit sont les nuisibles les plus fréquents. Une désinsectisation professionnelle avec traitement ciblé et suivi à 15 jours est indispensable pour éradiquer complètement une infestation.",
    rural:
      "En zone rurale, les guêpes, frelons (y compris le frelon asiatique) et les termites sont les principales menaces. La destruction d'un nid de frelons doit impérativement être confiée à un professionnel équipé pour intervenir en toute sécurité.",
    default:
      "N'attendez pas qu'une infestation s'installe pour agir. Dès les premiers signes (insectes récurrents, traces de piqûres, sciure suspecte), contactez un professionnel de la désinsectisation qui identifiera l'espèce et appliquera le traitement adapté.",
  },
  deratisation: {
    coastal:
      "En zone portuaire et littorale, les rats sont particulièrement présents en raison de la proximité des zones de stockage et des réseaux d'assainissement. Une dératisation professionnelle avec appâts sécurisés protège les habitations voisines du port.",
    mountain:
      "En montagne, les rongeurs cherchent refuge dans les habitations dès les premiers froids d'automne. Une dératisation préventive en septembre, avec obturation des points d'entrée, évite les infestations hivernales dans les combles et les caves.",
    urban:
      "En milieu urbain dense, la dératisation est un enjeu de santé publique. En immeuble, l'intervention doit être coordonnée à l'échelle de la copropriété (caves, locaux poubelles, courettes) pour éviter que les rongeurs ne migrent d'un logement à l'autre.",
    rural:
      "En zone rurale, les granges, hangars agricoles et dépendances sont des foyers de prolifération des rongeurs. Un plan de dératisation professionnel avec postes d'appâtage sécurisés protège les stocks alimentaires et évite la contamination.",
    default:
      "La dératisation professionnelle combine plusieurs techniques (appâts rodonticides, pièges mécaniques, obturation des accès) pour un résultat durable. Un suivi trimestriel est recommandé pour prévenir toute réinfestation après le traitement initial.",
  },
  demenageur: {
    coastal:
      "En zone littorale, les déménagements estivaux coïncident avec l'afflux touristique, ce qui complique l'accès et le stationnement. Réservez votre déménageur au moins 2 mois à l'avance pour la période juin-septembre en bord de mer.",
    mountain:
      "En montagne, les déménagements sont plus complexes en raison des routes sinueuses, des accès limités en hiver et des conditions météo changeantes. Privilégiez la période mai-octobre et choisissez un déménageur habitué au terrain montagneux.",
    urban:
      "En centre-ville, le déménageur doit gérer les contraintes d'accès : étages sans ascenseur, rues étroites, stationnement réglementé. Demandez l'autorisation de stationnement en mairie au moins 15 jours avant et prévoyez le monte-meubles si nécessaire.",
    rural:
      "En zone rurale, les grandes distances entre l'ancien et le nouveau logement augmentent le coût du déménagement. Un déménageur proposant un forfait tout compris (emballage, transport, déballage) est souvent plus avantageux qu'une location de camion.",
    default:
      "Demandez un devis après visite technique obligatoire (gratuite) : le déménageur évaluera le volume à transporter, les contraintes d'accès et les besoins spécifiques. Comparez au moins 3 devis détaillés et vérifiez les assurances proposées.",
  },
}

// ---------------------------------------------------------------------------
// Bridge: convert static Ville data to partial CommuneData for data-driven
// content even without the communes DB table being populated.
// ---------------------------------------------------------------------------

function villeToPartialCommuneData(ville: Ville): CommuneData {
  const pop = parseInt(ville.population.replace(/\s/g, ''), 10) || 0
  const regionClimate = REGION_CLIMATE[ville.region] || 'semi-oceanique'
  const mountainDepts = ['73', '74', '05', '38', '09', '65', '04']
  const climatZone = mountainDepts.includes(ville.departementCode)
    ? 'montagnard'
    : regionClimate === 'oceanique' ? 'océanique'
    : regionClimate === 'continental' ? 'continental'
    : regionClimate === 'mediterraneen' ? 'méditerranéen'
    : regionClimate === 'montagnard' ? 'montagnard'
    : regionClimate === 'tropical' ? 'tropical'
    : 'semi-océanique'

  // Regional estimates for socio-economic data (INSEE averages by region)
  // These unlock data-driven sections even without DB enrichment
  const REGIONAL_REVENU_MEDIAN: Record<string, number> = {
    'Île-de-France': 24670,
    'Auvergne-Rhône-Alpes': 22850,
    "Provence-Alpes-Côte d'Azur": 21550,
    'Occitanie': 20800,
    'Nouvelle-Aquitaine': 21250,
    'Pays de la Loire': 22100,
    'Bretagne': 21800,
    'Grand Est': 21400,
    'Hauts-de-France': 19950,
    'Normandie': 21100,
    'Centre-Val de Loire': 21500,
    'Bourgogne-Franche-Comté': 21350,
    'Corse': 20500,
  }

  const REGIONAL_PRIX_M2: Record<string, number> = {
    'Île-de-France': 5200,
    'Auvergne-Rhône-Alpes': 2850,
    "Provence-Alpes-Côte d'Azur": 3500,
    'Occitanie': 2200,
    'Nouvelle-Aquitaine': 2100,
    'Pays de la Loire': 2400,
    'Bretagne': 2300,
    'Grand Est': 1800,
    'Hauts-de-France': 1700,
    'Normandie': 1900,
    'Centre-Val de Loire': 1600,
    'Bourgogne-Franche-Comté': 1550,
    'Corse': 3200,
  }

  // Estimate part_maisons based on population (larger cities = more apartments)
  const estimatedPartMaisons = pop >= 200000 ? 15
    : pop >= 100000 ? 25
    : pop >= 50000 ? 35
    : pop >= 20000 ? 50
    : pop >= 5000 ? 65
    : 80

  // Estimate logement count from population (avg ~2.2 persons/household in France)
  const estimatedLogements = pop > 0 ? Math.round(pop / 2.2) : null

  // ---- Climate estimates by zone (Météo-France national averages) ----
  const CLIMATE_ESTIMATES: Record<string, {
    jours_gel: number; precip: number; temp_hiver: number; temp_ete: number;
    travaux_debut: number; travaux_fin: number;
  }> = {
    'océanique':       { jours_gel: 20, precip: 850, temp_hiver: 5.5, temp_ete: 19.5, travaux_debut: 4, travaux_fin: 10 },
    'semi-océanique':  { jours_gel: 30, precip: 700, temp_hiver: 4.5, temp_ete: 20.5, travaux_debut: 4, travaux_fin: 10 },
    'continental':     { jours_gel: 55, precip: 750, temp_hiver: 2.0, temp_ete: 21.0, travaux_debut: 4, travaux_fin: 10 },
    'méditerranéen':   { jours_gel: 10, precip: 600, temp_hiver: 7.5, temp_ete: 24.5, travaux_debut: 3, travaux_fin: 11 },
    'montagnard':      { jours_gel: 90, precip: 1100, temp_hiver: -1.0, temp_ete: 17.0, travaux_debut: 5, travaux_fin: 9 },
    'tropical':        { jours_gel: 0, precip: 1800, temp_hiver: 23.0, temp_ete: 27.0, travaux_debut: 1, travaux_fin: 12 },
  }
  const climEstBase = CLIMATE_ESTIMATES[climatZone]

  // Per-city perturbation: deterministic variation based on city slug hash
  // Ensures same-region cities get slightly different numbers (±15% range)
  const cityHash = hashCode(ville.slug)
  const perturbation = 0.85 + (cityHash % 31) / 100 // 0.85 to 1.15

  // Departement-level adjustments to climate (northern depts colder, altitude, etc.)
  const DEPT_FROST_ADJUST: Record<string, number> = {
    '59': 1.15, '62': 1.15, '80': 1.10, '02': 1.15, // Hauts-de-France: colder
    '67': 1.20, '68': 1.25, '57': 1.15, '88': 1.30, // Grand Est: colder, Vosges
    '25': 1.30, '39': 1.20, '70': 1.15, // Franche-Comté: Jura
    '63': 1.15, '15': 1.20, '43': 1.15, // Auvergne: Massif Central
    '48': 1.25, '12': 1.10, '09': 1.20, '66': 1.10, // Occitanie montagneux
    '06': 0.85, '83': 0.85, '13': 0.90, // Côte d'Azur: plus doux
    '33': 0.90, '40': 0.90, '64': 0.95, // Aquitaine: doux
    '29': 0.85, '56': 0.85, '22': 0.90, '35': 0.95, // Bretagne: doux
    '2A': 0.80, '2B': 0.85, // Corse
    '73': 1.40, '74': 1.35, '05': 1.50, '38': 1.15, '04': 1.20, // Alpes
    '65': 1.25, // Pyrénées
  }
  const frostAdj = DEPT_FROST_ADJUST[ville.departementCode] || 1.0
  const climEst = climEstBase ? {
    jours_gel: Math.round(climEstBase.jours_gel * frostAdj * perturbation),
    precip: Math.round(climEstBase.precip * perturbation),
    temp_hiver: Math.round((climEstBase.temp_hiver + (frostAdj > 1 ? -(frostAdj - 1) * 3 : (1 - frostAdj) * 2)) * perturbation * 10) / 10,
    temp_ete: Math.round((climEstBase.temp_ete + (frostAdj > 1 ? -(frostAdj - 1) * 1.5 : (1 - frostAdj) * 2)) * 10) / 10,
    travaux_debut: climEstBase.travaux_debut,
    travaux_fin: climEstBase.travaux_fin,
  } : null

  // ---- Artisan market estimates from real INSEE/CMA/CAPEB department data ----
  // Uses DEPT_ARTISAN_COUNTS lookup (dept-artisan-counts.ts) for department-level
  // totals, then derives city-level estimate proportional to population share.
  const deptCounts = getDeptArtisanCounts(ville.departementCode, pop)
  // Department population estimates (INSEE 2024) for computing city share
  const DEPT_POPULATION: Record<string, number> = {
    '75': 2104000, '77': 1421000, '78': 1448000, '91': 1306000,
    '92': 1624000, '93': 1644000, '94': 1407000, '95': 1249000,
    '02': 525000, '59': 2608000, '60': 829000, '62': 1468000, '80': 572000,
    '08': 270000, '10': 311000, '51': 567000, '52': 172000,
    '54': 733000, '55': 184000, '57': 1046000, '67': 1140000, '68': 764000, '88': 363000,
    '14': 694000, '27': 601000, '50': 495000, '61': 278000, '76': 1256000,
    '22': 600000, '29': 909000, '35': 1094000, '56': 759000,
    '44': 1437000, '49': 818000, '53': 307000, '72': 566000, '85': 685000,
    '18': 302000, '28': 432000, '36': 218000, '37': 610000, '41': 329000, '45': 680000,
    '21': 534000, '25': 543000, '39': 260000, '58': 202000, '70': 234000, '71': 551000, '89': 338000, '90': 142000,
    '01': 655000, '03': 335000, '07': 328000, '15': 144000, '26': 517000,
    '38': 1272000, '42': 762000, '43': 227000, '63': 659000, '69': 1878000, '73': 436000, '74': 826000,
    '16': 352000, '17': 651000, '19': 240000, '23': 116000, '24': 413000,
    '33': 1623000, '40': 413000, '47': 330000, '64': 682000, '79': 374000, '86': 439000, '87': 373000,
    '09': 153000, '11': 374000, '12': 279000, '30': 748000, '31': 1415000, '32': 191000,
    '34': 1175000, '46': 174000, '48': 76000, '65': 228000, '66': 479000, '81': 389000, '82': 262000,
    '04': 164000, '05': 141000, '06': 1083000, '13': 2043000, '83': 1076000, '84': 561000,
    '2A': 158000, '2B': 181000,
    '971': 384000, '972': 364000, '973': 294000, '974': 860000, '976': 321000,
  }
  const deptPop = DEPT_POPULATION[ville.departementCode] || pop * 10 // fallback
  // City share of department: ratio of city pop to department pop, with perturbation
  const cityShare = deptPop > 0 ? (pop / deptPop) * perturbation : perturbation
  const estimatedArtisans = deptCounts && pop > 0
    ? Math.max(1, Math.round(deptCounts.artisans * cityShare))
    : null
  const estimatedBtp = deptCounts && estimatedArtisans
    ? Math.max(1, Math.round(deptCounts.btp * cityShare))
    : null

  // ---- DPE passoires estimates by region (ADEME Observatoire DPE averages) ----
  const REGIONAL_DPE_PASSOIRES: Record<string, number> = {
    'Île-de-France': 15,
    'Hauts-de-France': 22,
    'Grand Est': 21,
    'Normandie': 20,
    'Bretagne': 17,
    'Pays de la Loire': 14,
    'Centre-Val de Loire': 19,
    'Bourgogne-Franche-Comté': 23,
    'Auvergne-Rhône-Alpes': 18,
    'Nouvelle-Aquitaine': 16,
    'Occitanie': 14,
    "Provence-Alpes-Côte d'Azur": 13,
    'Corse': 11,
  }
  // Use real DPE data when available, else regional estimate with perturbation
  const realDpe = getRealDpe(ville.slug, ville.region, ville.departementCode)
  const baseDpe = REGIONAL_DPE_PASSOIRES[ville.region]
  const estimatedPassoiresDpe = realDpe != null
    ? realDpe
    : baseDpe != null
    ? Math.round(baseDpe * perturbation)
    : null

  return {
    code_insee: '',
    name: ville.name,
    slug: ville.slug,
    code_postal: ville.codePostal,
    departement_code: ville.departementCode,
    departement_name: ville.departement,
    region_name: ville.region,
    latitude: null,
    longitude: null,
    altitude_moyenne: null,
    superficie_km2: null,
    population: pop,
    densite_population: null,
    // Adjust revenu and prix by population (cities tend higher) + perturbation
    revenu_median: REGIONAL_REVENU_MEDIAN[ville.region]
      ? Math.round((REGIONAL_REVENU_MEDIAN[ville.region] * (pop >= 100000 ? 1.08 : pop >= 30000 ? 1.02 : pop >= 10000 ? 0.97 : 0.93) * perturbation) / 10) * 10
      : null,
    prix_m2_moyen: getVilleRealPrix(ville.slug)
      ?? (REGIONAL_PRIX_M2[ville.region]
        ? Math.round((REGIONAL_PRIX_M2[ville.region] * (pop >= 200000 ? 1.25 : pop >= 100000 ? 1.10 : pop >= 50000 ? 1.0 : pop >= 10000 ? 0.85 : 0.70) * perturbation) / 10) * 10
        : null),
    nb_logements: estimatedLogements,
    part_maisons_pct: estimatedPartMaisons,
    climat_zone: climatZone,
    nb_entreprises_artisanales: estimatedArtisans,
    gentile: null,
    description: ville.description || null,
    provider_count: 0,
    nb_artisans_btp: estimatedBtp,
    nb_artisans_rge: null,
    pct_passoires_dpe: estimatedPassoiresDpe,
    nb_dpe_total: null,
    jours_gel_annuels: climEst?.jours_gel ?? null,
    precipitation_annuelle: climEst?.precip ?? null,
    mois_travaux_ext_debut: climEst?.travaux_debut ?? null,
    mois_travaux_ext_fin: climEst?.travaux_fin ?? null,
    temperature_moyenne_hiver: climEst?.temp_hiver ?? null,
    temperature_moyenne_ete: climEst?.temp_ete ?? null,
    nb_transactions_annuelles: null,
    prix_m2_maison: null,
    prix_m2_appartement: null,
    nb_maprimerenov_annuel: null,
    enriched_at: null,
  }
}

// ---------------------------------------------------------------------------
// Quartier-specific data derivation from city-level commune data
// ---------------------------------------------------------------------------

const ERA_PRICE_MULT: Record<string, number> = {
  'haussmannien': 1.25,
  'post-2000': 1.15,
  'pre-1950': 0.95,
  '1950-1980': 0.85,
  '1980-2000': 1.0,
  'mixte': 1.0,
}

const DENSITY_PRICE_MULT: Record<string, number> = {
  'dense': 1.05,
  'residentiel': 1.0,
  'periurbain': 0.90,
}

const DENSITY_ARTISAN_MULT: Record<string, number> = {
  'dense': 1.12,
  'residentiel': 1.0,
  'periurbain': 0.85,
}

const DENSITY_MAISONS_ADJUST: Record<string, number> = {
  'dense': -10,
  'residentiel': 0,
  'periurbain': 15,
}

const ERA_DPE_MULT: Record<string, number> = {
  'pre-1950': 1.40,
  'haussmannien': 1.30,
  '1950-1980': 1.25,
  '1980-2000': 1.05,
  'post-2000': 0.40,
  'mixte': 1.0,
}

function deriveQuartierCommuneData(
  cityData: CommuneData,
  quartierName: string,
  villeSlug: string,
  era: string,
  density: string,
  quartierCount: number,
): CommuneData {
  const qHash = hashCode(`q-${villeSlug}-${quartierName}`)
  const qPerturbation = 0.92 + (qHash % 17) / 100 // 0.92 to 1.08

  const eraPrice = ERA_PRICE_MULT[era] || 1.0
  const densityPrice = DENSITY_PRICE_MULT[density] || 1.0
  const densityArtisan = DENSITY_ARTISAN_MULT[density] || 1.0
  const dpeMult = ERA_DPE_MULT[era] || 1.0
  const nQ = Math.max(quartierCount, 4) // min 4 to avoid absurd per-quartier counts

  // Use real quartier prix/m² when available
  const realData = getQuartierRealPrix(villeSlug, quartierName)

  return {
    ...cityData,
    name: `${quartierName} (${cityData.name})`,
    slug: `${villeSlug}-${quartierName}`,
    prix_m2_moyen: realData
      ? realData.prixM2
      : cityData.prix_m2_moyen
      ? Math.round(cityData.prix_m2_moyen * eraPrice * densityPrice * qPerturbation / 10) * 10
      : null,
    nb_entreprises_artisanales: cityData.nb_entreprises_artisanales
      ? Math.round(cityData.nb_entreprises_artisanales * densityArtisan * qPerturbation / nQ)
      : null,
    nb_artisans_btp: cityData.nb_artisans_btp
      ? Math.round(cityData.nb_artisans_btp * densityArtisan * qPerturbation / nQ)
      : null,
    part_maisons_pct: cityData.part_maisons_pct != null
      ? Math.max(5, Math.min(95, Math.round((cityData.part_maisons_pct + (DENSITY_MAISONS_ADJUST[density] || 0)) * qPerturbation)))
      : null,
    pct_passoires_dpe: cityData.pct_passoires_dpe != null
      ? Math.max(3, Math.min(55, Math.round(cityData.pct_passoires_dpe * dpeMult * qPerturbation)))
      : null,
    nb_logements: cityData.nb_logements
      ? Math.round(cityData.nb_logements / nQ * qPerturbation)
      : null,
  }
}

// ---------------------------------------------------------------------------
// Deterministic "random" seed from string — for variation without randomness
// ---------------------------------------------------------------------------

export function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// ---------------------------------------------------------------------------
// City context helpers
// ---------------------------------------------------------------------------

function getCityContext(ville: Ville): 'coastal' | 'mountain' | 'urban' | 'rural' | 'default' {
  const regionLower = ville.region.toLowerCase()
  const descLower = ville.description.toLowerCase()
  const pop = parseInt(ville.population.replace(/\s/g, ''), 10) || 0

  // Coastal detection
  if (
    descLower.includes('littoral') ||
    descLower.includes('port') ||
    descLower.includes('côte') ||
    descLower.includes('mer') ||
    descLower.includes('méditerran') ||
    descLower.includes('maritime') ||
    descLower.includes('océan') ||
    descLower.includes('plage') ||
    ['Marseille', 'Nice', 'Toulon', 'Montpellier', 'Brest', 'La Rochelle', 'Cannes', 'Ajaccio', 'Bastia', 'Perpignan', 'Bayonne', 'Saint-Nazaire', 'Dunkerque', 'Calais', 'Boulogne-sur-Mer', 'Sète', 'Antibes'].includes(ville.name)
  ) {
    return 'coastal'
  }

  // Mountain detection
  if (
    descLower.includes('montagne') ||
    descLower.includes('alpes') ||
    descLower.includes('pyrénées') ||
    descLower.includes('altitude') ||
    descLower.includes('ski') ||
    regionLower.includes('alpes') ||
    ['Grenoble', 'Annecy', 'Chambéry', 'Gap', 'Briançon', 'Chamonix', 'Pau'].includes(ville.name)
  ) {
    return 'mountain'
  }

  // Urban vs rural by population
  if (pop >= 100000) return 'urban'
  if (pop < 30000) return 'rural'

  return 'default'
}

// ---------------------------------------------------------------------------
// Intro text templates — 15 varied structures to avoid repetition
// ---------------------------------------------------------------------------

function generateIntroText(
  serviceSlug: string,
  serviceName: string,
  ville: Ville,
  providerCount: number,
): string {
  const pop = ville.population
  const dep = ville.departement
  const region = ville.region
  const svcLower = serviceName.toLowerCase()
  const hash = hashCode(`${serviceSlug}-${ville.slug}`)
  const count = providerCount > 0 ? providerCount : 'les'
  const countSpace = providerCount > 0 ? providerCount + ' ' : ''

  const templates = [
    // 1 — Fait direct sur le nombre
    `${ville.name} compte ${count} ${svcLower}s référencés sur ServicesArtisans. Située dans le département ${dep} en région ${region}, cette commune de ${pop} habitants bénéficie d'un réseau dense de professionnels du bâtiment, tous identifiés par leur numéro SIREN via l'API officielle du gouvernement.`,

    // 2 — Annuaire et code postal
    `ServicesArtisans recense ${count} ${svcLower}s à ${ville.name} (${ville.codePostal}). Cette commune de ${pop} habitants du département ${dep}, en région ${region}, dispose de professionnels référencés dans votre secteur géographique. Chaque ${svcLower} listé est identifié par son numéro SIREN, garantissant une activité déclarée et vérifiable.`,

    // 3 — Exercent dans le département
    `${countSpace}${svcLower}s exercent à ${ville.name}, dans le département ${dep}. Cette ville de ${pop} habitants en ${region} dispose de nombreux artisans qualifiés. ServicesArtisans vous permet de comparer les ${svcLower}s référencés à ${ville.name} (${ville.codePostal}), de consulter leurs coordonnées et de les contacter directement pour un devis gratuit.`,

    // 4 — Comparer en région
    `Comparez ${count} ${svcLower}s vérifiés à ${ville.name} en ${region}. Notre annuaire couvre l'ensemble du département ${dep} et référence les professionnels qualifiés dans votre commune de ${pop} habitants. Tous les artisans listés sont identifiés via l'API Sirene du gouvernement, un gage de transparence pour les habitants de ${ville.name} (${ville.codePostal}).`,

    // 5 — Référencement SIREN
    `À ${ville.name}, ${count} ${svcLower}s sont référencés par numéro SIREN. Les habitants de cette commune (${pop} habitants, ${dep}, ${region}) peuvent compter sur ServicesArtisans pour comparer les professionnels exerçant à ${ville.name} et dans les communes voisines du ${ville.departementCode}. Chaque profil est vérifié via le registre SIREN, vous assurant de contacter des artisans en règle.`,

    // 6 — Intervention et code postal
    `${count} ${svcLower}s interviennent à ${ville.name} (${ville.codePostal}), département ${dep}. Cette commune en ${region} rassemble ${pop} habitants qui peuvent avoir besoin d'un professionnel pour leurs projets de construction, rénovation ou dépannage. ServicesArtisans met à votre disposition un annuaire de professionnels vérifiés par SIREN intervenant à ${ville.name} et ses alentours.`,

    // 7 — Identification SIREN par département
    `${ville.name} (${dep}) dispose de ${count} ${svcLower}s identifiés par SIREN. Le métier de ${svcLower} requiert un savoir-faire spécifique, et dans cette commune de ${pop} habitants, les professionnels du secteur ne manquent pas. ServicesArtisans vous aide à les identifier en ${region}, chacun vérifié auprès des données officielles de l'État.`,

    // 8 — Devis gratuit
    `ServicesArtisans liste ${count} ${svcLower}s à ${ville.name} pour un devis gratuit. Notre annuaire recense les artisans identifiés par SIREN dans le ${dep} (${ville.departementCode}), en région ${region}. Avec ${pop} habitants, ${ville.name} dispose d'un tissu artisanal dynamique pour répondre à toutes vos demandes.`,

    // 9 — Actifs et population
    `${count} ${svcLower}s sont actifs à ${ville.name}, commune de ${pop} habitants. Dans le ${dep}, la demande en services de ${svcLower} reste constante tout au long de l'année. En ${region}, ServicesArtisans référence les professionnels intervenant à ${ville.name} (${ville.codePostal}) et dans les communes environnantes, tous identifiés par leur numéro SIREN.`,

    // 10 — Trouvez un professionnel
    `Trouvez un ${svcLower} vérifié à ${ville.name} parmi ${count} professionnels référencés. Que ce soit pour un dépannage urgent ou un projet planifié, ServicesArtisans répertorie les artisans du ${dep} (${ville.codePostal}) en ${region}, vérifiés via l'API Sirene du gouvernement, pour vous permettre de comparer et de choisir en toute confiance.`,

    // 11 — Ancrage régional
    `${ville.name} en ${region} rassemble ${count} ${svcLower}s sur notre annuaire. Dans cette commune de ${pop} habitants du ${dep}, les services d'un ${svcLower} qualifié sont indispensables pour maintenir et valoriser votre habitat. Chaque professionnel est référencé par SIREN, garantissant son existence légale et son activité déclarée.`,

    // 12 — Comparaison directe
    `Comparez les ${count} ${svcLower}s référencés à ${ville.name} (${ville.codePostal}). ServicesArtisans liste les professionnels vérifiés dans le ${dep} (${region}), pour cette commune de ${pop} habitants. Consultez les coordonnées de chaque artisan identifié par SIREN et demandez plusieurs devis gratuits pour votre projet.`,

    // 13 — Disponibilité locale
    `${countSpace}${svcLower}s qualifiés sont disponibles à ${ville.name}, ${dep}. La qualité des travaux dépend avant tout du choix du professionnel. Dans cette commune de ${pop} habitants en ${region}, ServicesArtisans vous propose un annuaire d'artisans référencés et vérifiés par leur numéro SIREN, pour sélectionner le bon prestataire en toute sérénité.`,

    // 14 — Proximité géographique
    `${count} ${svcLower}s proches de ${ville.name} (${ville.codePostal}) sont sur ServicesArtisans. La proximité est essentielle pour bénéficier d'une intervention rapide et de tarifs compétitifs. Notre annuaire couvre tout le département ${dep} en ${region} et référence les professionnels prêts à intervenir dans votre commune de ${pop} habitants et ses environs.`,

    // 15 — Vérifiés et comparables
    `${ville.name} (${ville.codePostal}) : ${count} ${svcLower}s vérifiés et comparables. Dans le ${dep} (${region}), chaque artisan référencé sur ServicesArtisans est identifié par son numéro SIREN via les données officielles du gouvernement, un critère de fiabilité essentiel pour les ${pop} habitants de cette commune.`,
  ]

  return templates[hash % templates.length]
}

// ---------------------------------------------------------------------------
// Pricing note with regional adjustment
// ---------------------------------------------------------------------------

interface PricingNoteParams {
  svc: string; name: string; cp: string; region: string; dept: string
  min: number; max: number; unit: string; label: string
}

const PRICING_NOTE_TEMPLATES: ((p: PricingNoteParams) => string)[] = [
  (p) => `À ${p.name}, les tarifs d'un ${p.svc} se situent en moyenne entre ${p.min} et ${p.max} ${p.unit}, des prix ${p.label}. En ${p.region}, le coût de la vie et la densité de professionnels influencent directement les tarifs pratiqués. Comparez au moins trois devis de ${p.svc}s à ${p.name} (${p.cp}) pour choisir la meilleure offre.`,
  (p) => `Le tarif moyen d'un ${p.svc} à ${p.name} (${p.dept}) oscille entre ${p.min} et ${p.max} ${p.unit}. Ces prix, ${p.label}, reflètent la réalité du marché en ${p.region}. Le coût final dépend de la nature de l'intervention, des matériaux et de l'urgence du chantier. Un devis détaillé reste la meilleure manière de budgétiser vos travaux.`,
  (p) => `Comptez entre ${p.min} et ${p.max} ${p.unit} pour un ${p.svc} à ${p.name}, un tarif ${p.label}. La fourchette varie selon la complexité du chantier et les matériaux utilisés. À ${p.name} (${p.cp}), la concurrence entre professionnels vous permet de négocier en comparant plusieurs propositions.`,
  (p) => `En ${p.region}, faire appel à un ${p.svc} à ${p.name} coûte en moyenne de ${p.min} à ${p.max} ${p.unit}. Ce tarif, ${p.label}, inclut le déplacement et la main-d'œuvre mais pas les fournitures spécifiques. Demandez un devis précis mentionnant le détail des postes pour éviter les mauvaises surprises.`,
  (p) => `Les ${p.svc}s intervenant à ${p.name} (${p.dept}, ${p.cp}) facturent généralement entre ${p.min} et ${p.max} ${p.unit}. Ce niveau de prix est ${p.label}. Pour obtenir le meilleur rapport qualité-prix, nous conseillons de comparer les devis en vérifiant les garanties, assurances et délais de chaque professionnel.`,
]

function generatePricingNote(
  serviceSlug: string,
  serviceName: string,
  ville: Ville,
): string {
  const trade = getTradeContent(serviceSlug)
  if (!trade) return ''

  const multiplier = getRegionalMultiplier(ville.region)
  const seed = Math.abs(hashCode(`pricing-${serviceSlug}-${ville.slug}`))
  const template = PRICING_NOTE_TEMPLATES[seed % PRICING_NOTE_TEMPLATES.length]

  return template({
    svc: serviceName.toLowerCase(),
    name: ville.name,
    cp: ville.codePostal,
    region: ville.region,
    dept: ville.departement,
    min: Math.round(trade.priceRange.min * multiplier),
    max: Math.round(trade.priceRange.max * multiplier),
    unit: trade.priceRange.unit,
    label: getRegionalLabel(ville.region),
  })
}

// ---------------------------------------------------------------------------
// Local tips
// ---------------------------------------------------------------------------

function generateLocalTips(
  serviceSlug: string,
  serviceName: string,
  ville: Ville,
): string[] {
  const trade = getTradeContent(serviceSlug)
  const context = getCityContext(ville)
  const tips: string[] = []
  const svcLower = serviceName.toLowerCase()
  const hash = hashCode(`${serviceSlug}-${ville.slug}-tips`)

  // 1. Context-specific tip from SEASONAL_TIPS
  const seasonalForService = SEASONAL_TIPS[serviceSlug]
  if (seasonalForService) {
    tips.push(seasonalForService[context] || seasonalForService.default)
  }

  // 2. Pick 1-2 tips from trade content (deterministic selection based on hash)
  if (trade && trade.tips.length > 0) {
    const idx1 = hash % trade.tips.length
    tips.push(trade.tips[idx1])

    if (trade.tips.length > 2) {
      const idx2 = (hash + 3) % trade.tips.length
      if (idx2 !== idx1) {
        tips.push(trade.tips[idx2])
      }
    }
  }

  // 3. Regional-specific general tip
  const multiplier = getRegionalMultiplier(ville.region)
  if (multiplier >= 1.20) {
    tips.push(
      `Les tarifs des ${svcLower}s en ${ville.region} sont parmi les plus élevés de France. N'hésitez pas à élargir votre recherche aux communes limitrophes de ${ville.name} pour obtenir des devis plus compétitifs.`,
    )
  } else if (multiplier <= 0.95) {
    tips.push(
      `En ${ville.region}, les tarifs des artisans sont généralement plus accessibles qu'en Île-de-France ou sur la Côte d'Azur. Profitez-en pour comparer les devis de ${svcLower}s à ${ville.name} et choisir le meilleur rapport qualité-prix.`,
    )
  }

  return tips.slice(0, 3)
}

// ---------------------------------------------------------------------------
// Quartier text
// ---------------------------------------------------------------------------

function generateQuartierText(
  serviceName: string,
  ville: Ville,
): string {
  const svcLower = serviceName.toLowerCase()

  if (ville.quartiers.length === 0) {
    return `Nos ${svcLower}s référencés interviennent dans toute la commune de ${ville.name} ainsi que dans les villes et villages voisins du département ${ville.departement} (${ville.departementCode}). Que vous habitiez au centre-ville ou en périphérie, vous trouverez un professionnel qualifié à proximité de chez vous.`
  }

  // Show a subset of quartiers for variety (use all if <= 6, else pick based on slug hash)
  const maxQuartiers = 8
  const quartiersToShow =
    ville.quartiers.length <= maxQuartiers
      ? ville.quartiers
      : ville.quartiers.slice(0, maxQuartiers)

  const quartiersList = quartiersToShow.join(', ')
  const remaining = ville.quartiers.length - quartiersToShow.length

  let text = `Nos ${svcLower}s interviennent dans l'ensemble des quartiers de ${ville.name} : ${quartiersList}`
  if (remaining > 0) {
    text += ` et ${remaining} autres quartiers`
  }
  text += `. Quel que soit votre secteur à ${ville.name} (${ville.codePostal}), un ${svcLower} qualifié peut se déplacer rapidement chez vous pour un diagnostic ou un devis gratuit.`

  return text
}

// ---------------------------------------------------------------------------
// Conclusion / CTA — 10 varied templates
// ---------------------------------------------------------------------------

function generateConclusion(
  serviceSlug: string,
  serviceName: string,
  ville: Ville,
  providerCount: number,
): string {
  const svcLower = serviceName.toLowerCase()
  const trade = getTradeContent(serviceSlug)
  const hash = hashCode(`${serviceSlug}-${ville.slug}-cta`)
  const countSpace = providerCount > 0 ? providerCount + ' ' : ''

  const urgencyLine = trade?.emergencyInfo
    ? ` En cas d'urgence, certains ${svcLower}s de ${ville.name} proposent une intervention rapide : ${trade.averageResponseTime.toLowerCase()}.`
    : ''

  const certLine =
    trade && trade.certifications.length > 0
      ? ` Parmi les qualifications à rechercher : ${trade.certifications.slice(0, 2).join(', ')}.`
      : ''

  const templates = [
    // 1 — Appel à l'action direct
    `Ne perdez plus de temps à chercher un ${svcLower} fiable à ${ville.name}. Consultez les ${countSpace}profils référencés sur ServicesArtisans, comparez les coordonnées et contactez directement le professionnel de votre choix dans le ${ville.departement} (${ville.departementCode}).${urgencyLine}${certLine}`,

    // 2 — Simplicité de la démarche
    `ServicesArtisans simplifie votre recherche de ${svcLower} à ${ville.name} (${ville.codePostal}). Parcourez notre annuaire de ${countSpace}professionnels référencés en ${ville.region}, consultez leurs informations et demandez vos devis gratuitement.${urgencyLine}${certLine}`,

    // 3 — En quelques clics
    `Trouvez le ${svcLower} qu'il vous faut à ${ville.name} en quelques clics. Notre annuaire de ${countSpace}professionnels du ${ville.departement} vous permet de comparer et de contacter les artisans référencés par SIREN dans votre secteur.${urgencyLine}${certLine}`,

    // 4 — Confiance et transparence
    `Faites le bon choix pour vos travaux à ${ville.name} (${ville.codePostal}). Les ${countSpace}${svcLower}s référencés sur ServicesArtisans dans le ${ville.departement} sont tous identifiés par SIREN, un gage de sérieux et de transparence pour les habitants de ${ville.name}.${urgencyLine}${certLine}`,

    // 5 — Recommandation d'action
    `N'attendez plus pour lancer votre projet : consultez dès maintenant les ${countSpace}${svcLower}s disponibles à ${ville.name} et dans le ${ville.departementCode}. ServicesArtisans vous donne accès aux coordonnées de professionnels vérifiés en ${ville.region}, pour des devis rapides et sans engagement.${urgencyLine}${certLine}`,

    // 6 — Résumé des avantages
    `Annuaire vérifié, données SIREN officielles, accès gratuit : ServicesArtisans réunit toutes les conditions pour vous aider à trouver un ${svcLower} de confiance à ${ville.name} (${ville.codePostal}). Comparez les ${countSpace}professionnels du ${ville.departement} et contactez celui qui correspond à votre besoin.${urgencyLine}${certLine}`,

    // 7 — Proximité et réactivité
    `À ${ville.name}, un ${svcLower} qualifié n'est qu'à quelques clics. Parcourez les ${countSpace}profils référencés dans le ${ville.departement} (${ville.region}) sur ServicesArtisans et trouvez le professionnel idéal pour votre projet, qu'il s'agisse d'un dépannage ou de travaux planifiés.${urgencyLine}${certLine}`,

    // 8 — Gratuit et sans engagement
    `Votre recherche de ${svcLower} à ${ville.name} commence ici. Accédez gratuitement à notre annuaire de ${countSpace}professionnels du ${ville.departement}, vérifiés par leur numéro SIREN, et demandez vos devis sans engagement auprès des artisans de ${ville.name} (${ville.codePostal}).${urgencyLine}${certLine}`,

    // 9 — Question finale
    `Prêt à trouver votre ${svcLower} à ${ville.name} ? ServicesArtisans met à votre disposition ${countSpace}professionnels référencés dans le ${ville.departement} (${ville.departementCode}), en ${ville.region}. Comparez les profils, vérifiez les qualifications et lancez votre projet en toute sérénité.${urgencyLine}${certLine}`,

    // 10 — Mise en avant locale
    `Les ${countSpace}${svcLower}s de ${ville.name} référencés sur ServicesArtisans sont prêts à intervenir dans votre commune et dans tout le ${ville.departement}. Profitez d'un annuaire fiable, basé sur les données SIREN du gouvernement, pour choisir le bon professionnel en ${ville.region}.${urgencyLine}${certLine}`,
  ]

  return templates[hash % templates.length]
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

export interface LocationContent {
  introText: string
  pricingNote: string
  localTips: string[]
  quartierText: string
  conclusion: string
  climateLabel: string
  citySizeLabel: string
  climateTip: string
  faqItems: { question: string; answer: string }[]
  /** Data-driven content sections (null when commune data unavailable) */
  dataDriven: DataDrivenContent | null
}

// Pool of 15 service+location FAQ questions — 4 selected per page via hash
interface SvcLocFaqParams { svc: string; name: string; dept: string; deptCode: string; pop: string; region: string; climate: string }

const SVC_LOCATION_FAQ_POOL: { q: (p: SvcLocFaqParams) => string; a: (p: SvcLocFaqParams) => string }[] = [
  {
    q: (p) => `Combien coûte un ${p.svc} à ${p.name} ?`,
    a: (p) => `Les tarifs d'un ${p.svc} à ${p.name} (${p.dept}) varient selon la nature des travaux. En ${p.region}, les prix sont ${getRegionalLabel(p.region)}. Demandez plusieurs devis pour comparer les offres.`,
  },
  {
    q: (p) => `Comment trouver un bon ${p.svc} à ${p.name} ?`,
    a: (p) => `Sur ServicesArtisans, les ${p.svc}s référencés à ${p.name} sont vérifiés via leur numéro SIREN. Comparez les profils, vérifiez les qualifications et demandez jusqu'à 3 devis gratuits.`,
  },
  {
    q: (p) => `Un ${p.svc} à ${p.name} intervient-il en urgence ?`,
    a: (p) => `De nombreux ${p.svc}s à ${p.name} proposent des interventions d'urgence, y compris le week-end et les jours fériés. Consultez notre page urgence pour un dépannage rapide dans le ${p.deptCode}.`,
  },
  {
    q: (p) => `Quels sont les délais d'intervention d'un ${p.svc} à ${p.name} ?`,
    a: (p) => `En fonction de la demande, un ${p.svc} à ${p.name} peut intervenir sous 24 à 48h pour un rendez-vous planifié, et dans l'heure pour une urgence. La disponibilité dépend de la saison et de la zone.`,
  },
  {
    q: (p) => `Le ${p.svc} à ${p.name} est-il assuré ?`,
    a: (p) => `Les ${p.svc}s du bâtiment à ${p.name} sont tenus de souscrire une assurance décennale. Demandez systématiquement l'attestation avant le début des travaux pour vous protéger.`,
  },
  {
    q: (p) => `Faut-il un devis pour des travaux de ${p.svc} à ${p.name} ?`,
    a: (p) => `Oui, un devis écrit est obligatoire pour tout travail de ${p.svc} dépassant 150 €. À ${p.name}, demandez au moins 3 devis pour comparer. Notre service de mise en relation est 100% gratuit.`,
  },
  {
    q: (p) => `Quelles garanties offre un ${p.svc} à ${p.name} ?`,
    a: (p) => `Un ${p.svc} à ${p.name} doit fournir : garantie décennale (10 ans), garantie de parfait achèvement (1 an) et garantie biennale (2 ans) sur les équipements. Vérifiez ces points avant de signer.`,
  },
  {
    q: (p) => `Le climat ${p.climate.toLowerCase()} à ${p.name} impacte-t-il les travaux ?`,
    a: (p) => `Oui, le climat ${p.climate.toLowerCase()} de ${p.name} influence directement les besoins en ${p.svc}. Les professionnels locaux connaissent ces contraintes et adaptent leurs prestations en conséquence.`,
  },
  {
    q: (p) => `Quels quartiers de ${p.name} sont couverts par un ${p.svc} ?`,
    a: (p) => `Les ${p.svc}s référencés sur ServicesArtisans couvrent l'ensemble des quartiers de ${p.name} et ses environs dans le ${p.dept} (${p.deptCode}). Consultez la section quartiers sur cette page.`,
  },
  {
    q: (p) => `Un ${p.svc} à ${p.name} peut-il m'aider pour une rénovation énergétique ?`,
    a: (p) => `Selon le corps de métier, un ${p.svc} à ${p.name} peut contribuer à la rénovation énergétique de votre logement. Pour accéder aux aides (MaPrimeRénov', CEE), choisissez un artisan RGE.`,
  },
  {
    q: (p) => `Comment comparer les ${p.svc}s à ${p.name} ?`,
    a: (p) => `Comparez les devis en tenant compte du prix, des délais, des garanties et de l'expérience locale. À ${p.name}, privilégiez les ${p.svc}s qui connaissent le bâti typique de ${p.region}.`,
  },
  {
    q: (p) => `Peut-on faire intervenir un ${p.svc} le week-end à ${p.name} ?`,
    a: (p) => `Certains ${p.svc}s à ${p.name} proposent des interventions le week-end, notamment pour les urgences. Un supplément de 20 à 50% est généralement appliqué hors heures ouvrées.`,
  },
  {
    q: (p) => `Quelles aides pour des travaux de ${p.svc} à ${p.name} ?`,
    a: (p) => `Les habitants de ${p.name} (${p.dept}) peuvent bénéficier de MaPrimeRénov', de l'éco-PTZ et des CEE pour certains travaux de ${p.svc}. Renseignez-vous auprès de l'ANAH ou de votre mairie.`,
  },
  {
    q: (p) => `Que faire en cas de litige avec un ${p.svc} à ${p.name} ?`,
    a: (p) => `En cas de problème, adressez une réclamation écrite au ${p.svc}. Si le litige persiste, contactez le médiateur de la consommation ou la DGCCRF du ${p.dept}. L'assurance décennale couvre les malfaçons.`,
  },
  {
    q: (p) => `Les ${p.svc}s à ${p.name} sont-ils référencés officiellement ?`,
    a: (p) => `Oui, tous les ${p.svc}s listés sur ServicesArtisans à ${p.name} sont identifiés par leur numéro SIREN via les données officielles du gouvernement. C'est un gage de transparence et de fiabilité.`,
  },
]

// ---------------------------------------------------------------------------
// Service-aware climate tips — unique per service×climate×city combo
// ---------------------------------------------------------------------------

const CLIMATE_SERVICE_TIPS: Record<ClimateZone, ((svc: string, name: string) => string)[]> = {
  'oceanique': [
    (svc, name) => `Le climat océanique de ${name} soumet le bâti à une humidité persistante. Un ${svc} intervenant régulièrement dans la zone connaît ces contraintes et adapte ses matériaux et techniques pour garantir la durabilité de ses interventions.`,
    (svc, name) => `À ${name}, l'air marin et les précipitations fréquentes exigent des choix de matériaux adaptés. Votre ${svc} doit privilégier des solutions résistantes à l'humidité pour un résultat durable.`,
    (svc, name) => `Les façades et installations extérieures à ${name} subissent l'usure du climat océanique. Les ${svc}s expérimentés dans la zone sélectionnent des matériaux anticorrosion et des traitements hydrofuges spécifiques.`,
    (svc, name) => `L'humidité récurrente à ${name} nécessite une attention particulière lors des travaux. Un ${svc} local sait que la ventilation et l'étanchéité sont les priorités dans un environnement océanique.`,
    (svc, name) => `Le vent et la pluie à ${name} accélèrent le vieillissement du bâti. Un ${svc} qualifié tiendra compte de ces facteurs climatiques dans ses recommandations et son choix de matériaux.`,
  ],
  'continental': [
    (svc, name) => `À ${name}, les hivers rigoureux et les étés chauds créent d'importants écarts thermiques. Un ${svc} compétent dimensionne ses interventions en tenant compte de ces contraintes continentales pour éviter les désordres liés aux dilatations.`,
    (svc, name) => `Le climat continental de ${name} soumet les installations à des cycles gel-dégel répétés. Les ${svc}s locaux maîtrisent les techniques de protection adaptées à ces conditions exigeantes.`,
    (svc, name) => `Les températures négatives hivernales à ${name} requièrent des précautions spécifiques. Un ${svc} expérimenté prévoit l'isolation et la protection antigel adaptées au climat continental.`,
    (svc, name) => `En été comme en hiver, le bâti à ${name} est soumis à rude épreuve. Votre ${svc} doit anticiper les contraintes thermiques propres au climat continental pour garantir la pérennité de ses travaux.`,
    (svc, name) => `Le gel prolongé à ${name} peut endommager les installations mal protégées. Un ${svc} connaissant la région sait quels matériaux et techniques résistent aux hivers continentaux.`,
  ],
  'mediterraneen': [
    (svc, name) => `À ${name}, le soleil intense et les épisodes de pluies violentes alternent tout au long de l'année. Un ${svc} local adapte ses interventions à ce climat méditerranéen pour assurer leur longévité.`,
    (svc, name) => `La chaleur estivale à ${name} et les orages d'automne sollicitent fortement le bâti. Les ${svc}s expérimentés en zone méditerranéenne choisissent des matériaux résistants aux UV et aux intempéries.`,
    (svc, name) => `Le retrait des argiles en période de sécheresse à ${name} peut affecter les fondations. Un ${svc} qualifié prend en compte ces mouvements de terrain typiques du climat méditerranéen.`,
    (svc, name) => `Les températures élevées à ${name} engendrent des contraintes spécifiques sur les matériaux. Votre ${svc} doit sélectionner des produits résistants à la chaleur et aux rayons UV pour des travaux durables.`,
    (svc, name) => `Les épisodes cévenols à ${name} peuvent causer des infiltrations soudaines. Un ${svc} local anticipe ces risques en privilégiant l'étanchéité renforcée dans ses interventions.`,
  ],
  'montagnard': [
    (svc, name) => `En altitude à ${name}, le poids de la neige, le gel prolongé et les écarts thermiques imposent des contraintes majeures. Un ${svc} rodé au climat montagnard utilise des matériaux et techniques adaptés à ces conditions extrêmes.`,
    (svc, name) => `Les conditions hivernales rigoureuses à ${name} limitent la période de travaux extérieurs. Les ${svc}s expérimentés en montagne planifient les chantiers en conséquence et renforcent les protections antigel.`,
    (svc, name) => `À ${name}, l'isolation thermique est un enjeu central. Un ${svc} connaissant le bâti montagnard sait que chaque intervention doit contribuer à la performance énergétique du logement.`,
    (svc, name) => `Le gel intense et la neige à ${name} sollicitent l'ensemble du bâti. Votre ${svc} doit maîtriser les techniques spécifiques au climat de montagne pour garantir des interventions résistantes aux intempéries.`,
    (svc, name) => `Les contraintes d'accès en hiver à ${name} allongent les délais d'intervention. Un ${svc} local anticipe ces difficultés et propose des solutions adaptées à la saisonnalité montagnarde.`,
  ],
  'semi-oceanique': [
    (svc, name) => `Le climat semi-océanique de ${name} combine humidité modérée et hivers frais. Un ${svc} intervenant dans cette zone adapte ses recommandations pour garantir une bonne ventilation et une protection durable contre l'humidité.`,
    (svc, name) => `À ${name}, les précipitations régulières mais modérées sollicitent le bâti de manière continue. Les ${svc}s locaux connaissent l'importance des traitements préventifs dans ce climat tempéré humide.`,
    (svc, name) => `Le climat tempéré de ${name} favorise la condensation dans les logements mal ventilés. Un ${svc} compétent intègre la gestion de l'humidité dans chacune de ses interventions.`,
    (svc, name) => `Les hivers frais et les étés doux à ${name} créent un environnement favorable aux moisissures. Votre ${svc} doit veiller à la ventilation et à l'étanchéité pour préserver la salubrité du logement.`,
    (svc, name) => `À ${name}, le climat semi-océanique préserve relativement le bâti mais demande un entretien régulier. Un ${svc} professionnel recommandera un calendrier d'entretien adapté à ces conditions.`,
  ],
  'tropical': [
    (svc, name) => `Le climat tropical de ${name} soumet le bâti à une humidité constante et des températures élevées. Un ${svc} expérimenté en zone tropicale sélectionne des matériaux résistants aux moisissures et à la corrosion.`,
    (svc, name) => `À ${name}, les risques cycloniques exigent des normes de construction renforcées. Les ${svc}s locaux maîtrisent les techniques paracycloniques pour garantir la résistance des installations.`,
    (svc, name) => `L'air salin et l'humidité permanente à ${name} accélèrent la dégradation des matériaux. Un ${svc} connaissant le climat tropical choisit des produits spécifiquement conçus pour résister à ces conditions.`,
    (svc, name) => `Les termites et insectes xylophages sont un fléau à ${name}. Votre ${svc} doit intégrer la protection contre ces nuisibles dans ses interventions, notamment pour les structures en bois.`,
    (svc, name) => `La chaleur et l'humidité constantes à ${name} rendent indispensable une climatisation performante. Un ${svc} local sait dimensionner les installations pour ce climat exigeant.`,
  ],
}

function generateServiceClimateTip(svc: string, cityName: string, climate: ClimateZone, seed: number): string {
  const tips = CLIMATE_SERVICE_TIPS[climate]
  return tips[seed % tips.length](svc, cityName)
}

export function generateLocationContent(
  serviceSlug: string,
  serviceName: string,
  ville: Ville,
  providerCount: number = 0,
  communeData?: import('@/lib/data/commune-data').CommuneData | null | undefined,
): LocationContent {
  const svcLower = serviceName.toLowerCase()
  const regionClimate = REGION_CLIMATE[ville.region] || 'semi-oceanique'
  const climate = CLIMATES.find(c => c.key === regionClimate) || CLIMATES[4]
  const mountainDepts = ['73', '74', '05', '38', '09', '65', '04']
  const finalClimate = mountainDepts.includes(ville.departementCode) ? (CLIMATES.find(c => c.key === 'montagnard') || climate) : climate
  const size = getCitySize(ville.population)
  const tipSeed = Math.abs(hashCode(`svc-climate-${serviceSlug}-${ville.slug}`))
  const climateTip = generateServiceClimateTip(svcLower, ville.name, finalClimate.key, tipSeed)

  // Select 4 FAQ from pool of 15 via deterministic hash
  const faqParams: SvcLocFaqParams = { svc: svcLower, name: ville.name, dept: ville.departement, deptCode: ville.departementCode, pop: ville.population, region: ville.region, climate: finalClimate.label }
  const faqIndices: number[] = []
  let faqSeed = Math.abs(hashCode(`faq-svc-${serviceSlug}-${ville.slug}`))
  while (faqIndices.length < 4) {
    const idx = faqSeed % SVC_LOCATION_FAQ_POOL.length
    if (!faqIndices.includes(idx)) faqIndices.push(idx)
    faqSeed = Math.abs(hashCode(`faq${faqSeed}-svc-${faqIndices.length}`))
  }
  const faqItems = faqIndices.map(idx => {
    const f = SVC_LOCATION_FAQ_POOL[idx]
    return { question: f.q(faqParams), answer: f.a(faqParams) }
  })

  // Generate data-driven content — ALWAYS, using DB data when available, else static Ville data
  const effectiveCommuneData = communeData || villeToPartialCommuneData(ville)
  const dataDriven = generateDataDrivenContent(effectiveCommuneData, serviceSlug, serviceName, providerCount)

  return {
    introText: dataDriven?.intro || generateIntroText(serviceSlug, serviceName, ville, providerCount),
    pricingNote: generatePricingNote(serviceSlug, serviceName, ville),
    localTips: generateLocalTips(serviceSlug, serviceName, ville),
    quartierText: generateQuartierText(serviceName, ville),
    conclusion: generateConclusion(serviceSlug, serviceName, ville, providerCount),
    climateLabel: finalClimate.label,
    citySizeLabel: size.label,
    climateTip,
    faqItems: dataDriven.faqItems.length > 0 ? dataDriven.faqItems : faqItems,
    dataDriven,
  }
}

// ---------------------------------------------------------------------------
// Quartier page content — programmatic SEO with unique building profiles
// ---------------------------------------------------------------------------

type BuildingEra = 'pre-1950' | '1950-1980' | '1980-2000' | 'post-2000' | 'haussmannien' | 'mixte'
type UrbanDensity = 'dense' | 'residentiel' | 'periurbain'

export interface QuartierProfile {
  era: BuildingEra
  eraLabel: string
  density: UrbanDensity
  densityLabel: string
  commonIssues: string[]
  topServiceSlugs: string[]
  architecturalNote: string
}

export interface QuartierDataDrivenContent {
  immobilierQuartier: string
  marcheArtisanalQuartier: string
  energetiqueQuartier: string
  climatQuartier: string
  statCards: {
    prixM2Quartier: number
    artisansProximite: number
    artisansBtp: number
    passoiresDpe: number
    joursGel: number | null
    periodeTravaux: string | null
  }
  dataSources: string[]
}

export interface QuartierContent {
  profile: QuartierProfile
  intro: string
  batimentContext: string
  servicesDemandes: string
  conseils: string
  proximite: string
  faqItems: { question: string; answer: string }[]
  dataDriven: QuartierDataDrivenContent | null
}

const ERAS: { key: BuildingEra; label: string }[] = [
  { key: 'pre-1950', label: 'Bâti ancien (avant 1950)' },
  { key: '1950-1980', label: 'Construction d\'après-guerre (1950–1980)' },
  { key: '1980-2000', label: 'Construction moderne (1980–2000)' },
  { key: 'post-2000', label: 'Construction récente (après 2000)' },
  { key: 'haussmannien', label: 'Architecture haussmannienne' },
  { key: 'mixte', label: 'Bâti mixte (plusieurs époques)' },
]

const DENSITIES: { key: UrbanDensity; label: string }[] = [
  { key: 'dense', label: 'Zone urbaine dense' },
  { key: 'residentiel', label: 'Quartier résidentiel' },
  { key: 'periurbain', label: 'Zone périurbaine' },
]

const SERVICE_PRIORITY: Record<BuildingEra, string[]> = {
  'pre-1950': ['plombier', 'electricien', 'macon', 'couvreur', 'peintre-en-batiment', 'menuisier', 'chauffagiste', 'serrurier', 'carreleur', 'climaticien', 'vitrier', 'terrassier', 'paysagiste', 'facade', 'domoticien'],
  '1950-1980': ['electricien', 'chauffagiste', 'plombier', 'peintre-en-batiment', 'climaticien', 'menuisier', 'carreleur', 'macon', 'couvreur', 'serrurier', 'vitrier', 'facade', 'terrassier', 'paysagiste', 'domoticien'],
  '1980-2000': ['peintre-en-batiment', 'menuisier', 'chauffagiste', 'climaticien', 'plombier', 'electricien', 'carreleur', 'serrurier', 'couvreur', 'macon', 'vitrier', 'facade', 'terrassier', 'paysagiste', 'domoticien'],
  'post-2000': ['climaticien', 'domoticien', 'serrurier', 'plombier', 'electricien', 'peintre-en-batiment', 'menuisier', 'carreleur', 'chauffagiste', 'vitrier', 'couvreur', 'macon', 'facade', 'terrassier', 'paysagiste'],
  'haussmannien': ['peintre-en-batiment', 'plombier', 'electricien', 'menuisier', 'macon', 'serrurier', 'chauffagiste', 'carreleur', 'couvreur', 'vitrier', 'climaticien', 'facade', 'terrassier', 'paysagiste', 'domoticien'],
  'mixte': ['plombier', 'electricien', 'serrurier', 'chauffagiste', 'peintre-en-batiment', 'menuisier', 'climaticien', 'carreleur', 'couvreur', 'macon', 'vitrier', 'facade', 'terrassier', 'paysagiste', 'domoticien'],
}

const ERA_ISSUES: Record<BuildingEra, string[]> = {
  'pre-1950': [
    'Canalisations en plomb ou fonte à remplacer',
    'Installation électrique non conforme aux normes NF C 15-100',
    'Isolation thermique inexistante ou dégradée',
    'Charpente et toiture nécessitant un traitement ou une réfection',
    'Humidité et remontées capillaires dans les murs',
  ],
  '1950-1980': [
    'Présence potentielle d\'amiante (dalles, flocages, canalisations)',
    'Isolation thermique très insuffisante (pas de RT à l\'époque)',
    'Chauffage collectif vieillissant (fioul ou gaz)',
    'Fenêtres simple vitrage à remplacer',
    'Colonnes montantes eau et électricité à rénover',
  ],
  '1980-2000': [
    'Menuiseries PVC première génération à remplacer',
    'Chaudière gaz arrivant en fin de vie',
    'Isolation conforme RT 1982 mais insuffisante aujourd\'hui',
    'Revêtements et finitions à rafraîchir',
    'Salle de bain et cuisine à moderniser',
  ],
  'post-2000': [
    'Entretien préventif de la VMC double flux',
    'Installation de climatisation réversible',
    'Ajout de domotique et équipements connectés',
    'Personnalisation et optimisation de l\'espace intérieur',
    'Entretien courant des équipements modernes',
  ],
  'haussmannien': [
    'Restauration de moulures, corniches et rosaces',
    'Rénovation du parquet massif (point de Hongrie, Versailles)',
    'Mise aux normes électriques sans dénaturer le cachet',
    'Restauration de cheminées en marbre et boiseries',
    'Plomberie à moderniser dans un bâti classé ou protégé',
  ],
  'mixte': [
    'Diagnostic différencié selon l\'époque de chaque bâtiment',
    'Coordination des travaux sur bâti hétérogène',
    'Choix de matériaux compatibles avec l\'existant',
    'Rénovation progressive adaptée à chaque lot',
    'Harmonisation esthétique entre ancien et moderne',
  ],
}

const ERA_ARCH_NOTES: Record<BuildingEra, string[]> = {
  'pre-1950': [
    'Murs porteurs en pierre ou brique, planchers bois, absence fréquente de fondations profondes. Ce type de bâti requiert des artisans expérimentés en rénovation du patrimoine ancien.',
    'Construction traditionnelle avec matériaux locaux et hauteurs sous plafond généreuses. L\'absence d\'isolation d\'origine rend la rénovation énergétique prioritaire.',
    'Bâti d\'avant-guerre caractérisé par des murs épais, des escaliers en pierre et des réseaux (eau, gaz, électricité) souvent d\'origine.',
  ],
  '1950-1980': [
    'Immeubles en béton armé de la reconstruction, conçus pour loger rapidement. Les matériaux de l\'époque (amiante, peintures au plomb) nécessitent un diagnostic avant travaux.',
    'Logements fonctionnels avec isolation minimale et chauffage souvent collectif. La priorité est à la performance énergétique et au confort thermique.',
    'Construction standardisée des Trente Glorieuses, avec des surfaces correctes mais des finitions et équipements aujourd\'hui obsolètes.',
  ],
  '1980-2000': [
    'Construction conforme aux premières réglementations thermiques (RT 1982/1988). Double vitrage première génération et matériaux industriels (PVC, béton cellulaire).',
    'Bâti globalement sain mais nécessitant des mises à jour esthétiques et énergétiques pour atteindre les standards actuels de confort.',
    'Logements bien conçus pour l\'époque, avec des équipements (chaudière, menuiseries) arrivant en fin de cycle de vie après 25-40 ans.',
  ],
  'post-2000': [
    'Construction aux normes RT 2000/2005/2012, avec VMC, double vitrage performant et isolation conforme. Les travaux portent essentiellement sur la personnalisation.',
    'Bâti récent et bien isolé, équipements modernes. Les interventions concernent principalement l\'aménagement intérieur et la domotique.',
    'Logements livrés aux normes actuelles avec des garanties constructeur. Les besoins se concentrent sur l\'optimisation et la décoration.',
  ],
  'haussmannien': [
    'Pierre de taille, façades ornementées, balcons en fer forgé, hauteur sous plafond de 3 mètres ou plus. Chaque intervention doit respecter le patrimoine.',
    'Parquet massif point de Hongrie, moulures au plafond, cheminées en marbre, portes à double battant. Un patrimoine qui appelle des artisans qualifiés en restauration.',
    'Cage d\'escalier monumentale, balcons filants et ornements en stuc. La rénovation requiert un savoir-faire artisanal respectueux du style d\'origine.',
  ],
  'mixte': [
    'Quartier mêlant constructions de différentes époques, du XIXᵉ siècle aux résidences récentes. Chaque bâtiment nécessite une approche de rénovation adaptée.',
    'Cohabitation d\'immeubles anciens et de résidences modernes. Les artisans du secteur sont amenés à maîtriser des techniques variées.',
    'Tissu urbain évolutif mêlant patrimoine ancien et constructions neuves. La diversité architecturale justifie des diagnostics au cas par cas.',
  ],
}

// 20 intro templates — each interpolates era/density/arch info for unique content
type IntroFn = (q: string, v: string, dep: string, code: string, pop: string, era: string, arch: string, density: string) => string
const QUARTIER_INTROS: IntroFn[] = [
  (q, v, dep, code, pop, era, arch, density) =>
    `Le quartier ${q} à ${v} (${code}) se caractérise par un ${era.toLowerCase()} en ${density.toLowerCase()}. ${arch} Avec ${pop} habitants, ${v} dans le ${dep} dispose d'artisans qualifiés pour ce type de bâti.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Vous habitez ${q} à ${v} ? Ce quartier en ${density.toLowerCase()} est composé de ${era.toLowerCase()}. ${arch} Notre annuaire référence les artisans du ${dep} (${code}) qualifiés pour intervenir sur ce patrimoine, au service des ${pop} habitants.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `${q}, quartier de ${v} dans le ${dep} (${code}), présente un profil immobilier de type ${era.toLowerCase()}. ${arch} En ${density.toLowerCase()}, les besoins en artisanat sont spécifiques et nos professionnels référencés connaissent les particularités de ${v} (${pop} hab.).`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Dans le quartier ${q} à ${v}, le parc immobilier relève du ${era.toLowerCase()}. ${arch} En ${density.toLowerCase()} dans le ${dep} (${code}), ce secteur de ${v} (${pop} hab.) bénéficie d'artisans formés aux techniques adaptées à cette construction.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Trouver un artisan compétent à ${q} (${v}) demande de connaître le bâti local. En ${density.toLowerCase()}, le quartier est composé de ${era.toLowerCase()}. ${arch} Les ${pop} habitants de ${v} (${dep}, ${code}) peuvent compter sur des professionnels adaptés.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Le secteur de ${q} à ${v} (${dep}, ${code}) offre un cadre de ${density.toLowerCase()} marqué par du ${era.toLowerCase()}. ${arch} Pour les ${pop} habitants, notre plateforme identifie les artisans dont l'expertise correspond aux caractéristiques du quartier.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `À ${q}, dans la commune de ${v} (${code}), le bâti dominant est de type ${era.toLowerCase()} en contexte de ${density.toLowerCase()}. ${arch} Le ${dep} compte de nombreux artisans dont le savoir-faire correspond aux besoins des ${pop} habitants de ${v}.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Besoin de travaux à ${q} ? Ce secteur de ${v} (${dep}, ${code}) se distingue par son ${era.toLowerCase()} en ${density.toLowerCase()}. ${arch} Comparez les artisans qualifiés parmi les professionnels desservant les ${pop} habitants de la commune.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Le quartier ${q} de ${v} (${dep}, ${code}) est un secteur en ${density.toLowerCase()} où prédomine le ${era.toLowerCase()}. ${arch} Nous référençons des artisans maîtrisant les techniques adaptées aux constructions de ce quartier pour les ${pop} habitants.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Résider à ${q} dans ${v} (${code}), c'est vivre en ${density.toLowerCase()} dans du ${era.toLowerCase()}. ${arch} Le ${dep} regorge d'artisans compétents pour ce type d'habitat. ${v} et ses ${pop} habitants sont couverts par notre réseau de professionnels.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `${q} est un quartier de ${v} dans le ${dep} (${code}), en ${density.toLowerCase()}. Le parc immobilier y est marqué par du ${era.toLowerCase()}. ${arch} Pour des travaux adaptés, les ${pop} habitants de la commune peuvent compter sur nos artisans référencés.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Votre projet concerne ${q} à ${v} ? Ce secteur en ${density.toLowerCase()} du ${dep} (${code}) est caractérisé par un parc de ${era.toLowerCase()}. ${arch} Parmi les professionnels intervenant auprès des ${pop} habitants, trouvez l'artisan adapté à votre chantier.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Quartier en ${density.toLowerCase()}, ${q} à ${v} (${dep}, ${code}) se compose essentiellement de ${era.toLowerCase()}. ${arch} Les artisans locaux maîtrisent les contraintes propres à ce type de construction et accompagnent les ${pop} habitants dans leurs projets de rénovation ou d'entretien.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Situé à ${v} dans le ${dep} (${code}), le quartier ${q} accueille un parc immobilier de ${era.toLowerCase()} en ${density.toLowerCase()}. ${arch} Pour répondre aux besoins des ${pop} habitants, notre annuaire recense les artisans dont le savoir-faire correspond au bâti du secteur.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Les constructions du quartier ${q} relèvent du ${era.toLowerCase()}, dans un environnement de ${density.toLowerCase()} à ${v} (${dep}, ${code}). ${arch} Cette configuration oriente le choix des artisans : les ${pop} habitants peuvent identifier ici les professionnels adaptés.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `${v} (${code}), commune de ${pop} habitants dans le ${dep}, abrite le quartier ${q} où le bâti de ${era.toLowerCase()} prédomine en ${density.toLowerCase()}. ${arch} Nos artisans référencés interviennent sur ces constructions avec une expertise éprouvée.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Au cœur de ${v} (${dep}, ${code}), ${q} est un secteur en ${density.toLowerCase()} dont le parc bâti remonte au ${era.toLowerCase()}. ${arch} Les ${pop} habitants y trouvent des artisans qualifiés capables de répondre aux exigences de ce patrimoine immobilier.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Le profil immobilier de ${q} à ${v} associe ${era.toLowerCase()} et ${density.toLowerCase()}. ${arch} Cette combinaison influence directement les besoins en artisanat. Dans le ${dep} (${code}), les professionnels référencés par notre annuaire connaissent les particularités du quartier et ses ${pop} habitants.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `Connaître le bâti de ${q} est essentiel pour choisir le bon artisan à ${v}. Ce quartier en ${density.toLowerCase()} du ${dep} (${code}) est constitué de ${era.toLowerCase()}. ${arch} Parmi les professionnels couvrant cette commune de ${pop} habitants, sélectionnez celui dont l'expérience correspond à votre chantier.`,
  (q, v, dep, code, pop, era, arch, density) =>
    `${q} fait partie des quartiers de ${v} (${code}) où le ${era.toLowerCase()} définit le paysage urbain en ${density.toLowerCase()}. ${arch} Pour les ${pop} habitants du ${dep}, notre plateforme facilite la mise en relation avec des artisans compétents sur ce type de bâti.`,
]

// Building context by era — 3 templates each
const BATIMENT_CONTEXTS: Record<BuildingEra, ((q: string, v: string) => string)[]> = {
  'pre-1950': [
    (q, v) => `Dans le quartier ${q}, le bâti ancien peut présenter des contraintes spécifiques. Les canalisations d'origine (plomb, fonte) peuvent nécessiter un remplacement pour des raisons sanitaires. L'installation électrique, conçue pour des usages limités, peut nécessiter une mise aux normes. Les artisans de ${v} spécialisés en rénovation du patrimoine ancien maîtrisent ces interventions.`,
    (q, v) => `Le quartier ${q} à ${v} abrite un patrimoine d'avant 1950 qui peut demander une expertise particulière. Murs porteurs en pierre, planchers bois et charpentes anciennes requièrent des artisans formés aux techniques traditionnelles. La rénovation énergétique doit préserver le caractère architectural tout en améliorant le confort.`,
    (q, v) => `À ${q}, le parc immobilier ancien peut présenter des défis que seuls des artisans expérimentés peuvent relever. Problèmes d'humidité, réseaux vétustes, isolation insuffisante : chaque chantier à ${v} peut nécessiter un diagnostic approfondi. Nos artisans référencés connaissent les pathologies du bâti ancien et proposent des solutions durables.`,
  ],
  '1950-1980': [
    (q, v) => `Le parc immobilier du quartier ${q} à ${v} date principalement de la période 1950-1980. Ces constructions des Trente Glorieuses présentent des caractéristiques communes : béton armé, isolation minimale, et potentielle présence d'amiante. Avant tout travaux, un diagnostic est recommandé. Les artisans qualifiés de ${v} connaissent ces problématiques.`,
    (q, v) => `À ${q}, les logements construits entre 1950 et 1980 arrivent à un âge où la rénovation devient incontournable. Remplacement du chauffage vieillissant, isolation par l'extérieur et changement des fenêtres simple vitrage sont les chantiers prioritaires. Les artisans de ${v} spécialisés en rénovation énergétique vous accompagnent avec des solutions éligibles aux aides de l'État.`,
    (q, v) => `Dans le quartier ${q} à ${v}, le bâti des années 1950-1980 peut nécessiter une attention particulière. Les colonnes montantes approchent parfois leur fin de vie, les matériaux d'époque peuvent contenir des substances interdites, et les performances thermiques sont souvent en dessous des standards actuels. Une rénovation globale planifiée avec des artisans compétents permet de transformer ces logements.`,
  ],
  '1980-2000': [
    (q, v) => `Le quartier ${q} à ${v} comporte un parc construit entre 1980 et 2000, marqué par les premières réglementations thermiques. Ces logements, globalement sains, arrivent à un stade où les équipements d'origine (chaudière, menuiseries, revêtements) nécessitent un remplacement. C'est l'occasion d'opter pour des solutions plus performantes avec des artisans qualifiés.`,
    (q, v) => `À ${q}, les constructions des années 1980-2000 offrent un bon compromis entre confort et coût de rénovation. Les travaux courants : rafraîchissement des peintures, remplacement de la chaudière par une pompe à chaleur, modernisation de la cuisine ou salle de bain. Les artisans de ${v} interviennent régulièrement sur ce type de bâti.`,
    (q, v) => `Dans le quartier ${q}, les logements 1980-2000 à ${v} présentent un potentiel de valorisation intéressant. En remplaçant les menuiseries vieillissantes, en optimisant le chauffage et en modernisant les espaces intérieurs, vous améliorez significativement confort et valeur de votre bien. Nos artisans proposent des devis adaptés.`,
  ],
  'post-2000': [
    (q, v) => `Le quartier ${q} à ${v} bénéficie de constructions récentes, conformes aux normes RT 2000/2005/2012. Ces logements bien isolés nécessitent essentiellement des travaux de personnalisation : climatisation réversible, domotique, aménagement sur mesure. Les artisans de ${v} spécialisés en équipements modernes sont les mieux placés.`,
    (q, v) => `À ${q}, le bâti récent de ${v} offre un excellent confort de base. Les interventions les plus demandées : personnalisation de l'intérieur (dressing, verrière), équipements connectés (thermostat intelligent, volets automatisés), entretien courant. Nos artisans référencés interviennent avec le soin exigé par ces logements modernes.`,
    (q, v) => `Dans le quartier ${q} à ${v}, les résidences post-2000 sont conçues pour le confort moderne mais peuvent gagner en fonctionnalité. Borne de recharge, panneau solaire, pergola bioclimatique : les possibilités sont nombreuses. Consultez les artisans qualifiés de ${v} pour des devis personnalisés.`,
  ],
  'haussmannien': [
    (q, v) => `Le quartier ${q} à ${v} abrite un patrimoine haussmannien d'exception exigeant des artisans maîtrisant la restauration. Parquet en point de Hongrie, moulures, cheminées en marbre : chaque élément raconte l'histoire du bâtiment. La rénovation doit préserver ce cachet tout en intégrant le confort moderne. Seuls des artisans expérimentés à ${v} peuvent relever ce défi.`,
    (q, v) => `À ${q}, les immeubles haussmanniens de ${v} constituent un patrimoine prestigieux. Leur rénovation requiert un savoir-faire spécifique : restauration de gypseries, réfection de parquets massifs, mise aux normes sans dénaturer les volumes. Les artisans spécialisés connaissent les contraintes réglementaires (ABF, PLU) et les techniques respectueuses de ce style.`,
    (q, v) => `Dans le quartier ${q} de ${v}, le style haussmannien peut présenter des exigences spécifiques. Hauteurs sous plafond de trois mètres, façades en pierre de taille, ferronneries d'art : chaque intervention doit sublimer le patrimoine existant. Nos artisans référencés allient expertise technique et sensibilité architecturale.`,
  ],
  'mixte': [
    (q, v) => `Le quartier ${q} à ${v} présente un tissu urbain varié, mêlant constructions de différentes époques. Cette diversité implique des besoins de rénovation tout aussi variés : mise aux normes du bâti ancien, rénovation énergétique d'après-guerre, modernisation des résidences 1980-2000. Les artisans polyvalents de ${v} sont habitués à adapter leurs techniques.`,
    (q, v) => `À ${q}, la cohabitation de bâtiments anciens et récents à ${v} crée un quartier dynamique où chaque projet est unique. Que votre logement date du XXᵉ siècle ou des années 2000, les artisans locaux savent adapter leur approche. Un diagnostic précis permettra de définir les travaux prioritaires.`,
    (q, v) => `Dans le quartier ${q} de ${v}, le bâti mixte reflète l'évolution urbaine de la commune. Chaque époque apporte ses spécificités et contraintes. Les artisans intervenant dans ce secteur maîtrisent aussi bien la rénovation du bâti ancien que les techniques modernes. Notre annuaire identifie les professionnels dont le savoir-faire couvre ces besoins.`,
  ],
}

// Tips by era — 4 templates each
const ERA_TIPS: Record<BuildingEra, ((q: string, v: string) => string)[]> = {
  'pre-1950': [
    (q, v) => `Si vous habitez un logement ancien à ${q}, privilégiez un diagnostic complet avant d'engager des travaux. Vérifiez canalisations (plomb), installation électrique et charpente. À ${v}, les artisans spécialisés en bâti ancien vous conseillent sur les priorités et les aides disponibles (MaPrimeRénov', éco-PTZ). Demandez toujours plusieurs devis.`,
    (q, v) => `Si votre logement est ancien à ${q}, respectez l'ordre logique : gros œuvre (toiture, murs) d'abord, puis réseaux (électricité, plomberie, chauffage), enfin finitions (peinture, sols). À ${v}, les artisans expérimentés planifient pour éviter de reprendre des travaux déjà réalisés. Cette approche vous fait gagner du temps et de l'argent.`,
    (q, v) => `Dans un logement d'avant 1950 à ${q}, l'humidité est souvent le premier ennemi. Avant toute rénovation esthétique, traitez les remontées capillaires et assurez une ventilation correcte. Les artisans de ${v} spécialisés en bâti ancien sauront poser un diagnostic d'humidité et proposer des solutions pérennes adaptées aux murs anciens.`,
    (q, v) => `Rénover un logement ancien à ${q} offre l'opportunité de valoriser des éléments de caractère : tomettes, poutres apparentes, cheminées en pierre. À ${v}, les artisans formés à la restauration du patrimoine savent allier authenticité et confort moderne. Pensez à vérifier l'éligibilité de vos travaux aux aides de l'ANAH.`,
  ],
  '1950-1980': [
    (q, v) => `Si vous habitez un logement 1950-1980 à ${q}, faites réaliser un diagnostic amiante et un DPE avant tout chantier. Ces documents orienteront vos travaux prioritaires. À ${v}, les artisans certifiés savent manipuler les matériaux amiantés en sécurité. La rénovation énergétique ouvre droit à des aides substantielles.`,
    (q, v) => `Si vous habitez un logement d'après-guerre à ${q}, la priorité est souvent la performance énergétique. Isolation par l'extérieur, remplacement des fenêtres et chauffage performant peuvent diviser par deux votre facture. Les artisans RGE de ${v} vous permettent de bénéficier des aides financières. Faites un audit énergétique pour définir le plan optimal.`,
    (q, v) => `Les immeubles des années 1950-1980 à ${q} souffrent souvent d'une isolation acoustique insuffisante. Si le bruit entre logements vous gêne, les artisans de ${v} peuvent installer des doublages acoustiques sur murs et plafonds. Associée à l'isolation thermique, cette intervention améliore radicalement le confort quotidien.`,
    (q, v) => `À ${q}, les logements de cette époque disposent parfois de colonnes montantes en fin de vie. Si vous constatez une baisse de pression ou des fuites récurrentes, faites inspecter les canalisations collectives. Les artisans plombiers de ${v} évaluent l'état du réseau et proposent un remplacement coordonné avec la copropriété.`,
  ],
  '1980-2000': [
    (q, v) => `Dans un logement 1980-2000 à ${q}, les travaux les plus rentables : remplacement de la chaudière (pompe à chaleur ou condensation) et changement des menuiseries vieillissantes. À ${v}, ces interventions améliorent sensiblement le confort tout en réduisant les charges. Profitez-en pour moderniser la ventilation (VMC hygroréglable).`,
    (q, v) => `Votre logement des années 1980-2000 à ${q} a besoin d'une mise au goût du jour. Cuisine, salle de bain, revêtements : ces espaces se rénovent efficacement avec des artisans compétents à ${v}. Astuce : coordonnez plomberie et électricité avec la rénovation des pièces d'eau pour optimiser le budget.`,
    (q, v) => `Les logements 1980-2000 à ${q} possèdent souvent un tableau électrique aux normes de l'époque mais insuffisant pour les usages actuels. Plaques à induction, climatisation, borne de recharge : ces équipements exigent une mise à niveau. Les électriciens de ${v} effectuent un bilan de puissance avant toute intervention.`,
    (q, v) => `Si votre résidence des années 1980-2000 à ${q} dispose d'un balcon ou d'une terrasse, vérifiez l'étanchéité tous les dix ans. Les revêtements d'origine arrivent en fin de cycle et des infiltrations peuvent endommager la structure. Les artisans étanchéistes de ${v} proposent des solutions durables et garanties.`,
  ],
  'post-2000': [
    (q, v) => `Votre logement récent à ${q} est aux normes mais peut gagner en confort. Pensez à la climatisation réversible, la domotique pour optimiser votre consommation, ou un aménagement sur mesure (dressing, verrière). Les artisans de ${v} spécialisés en finitions haut de gamme sauront valoriser votre intérieur.`,
    (q, v) => `Dans un logement post-2000 à ${q}, les travaux sont liés à l'évolution de vos besoins : bureau, borne de recharge, agrandissement. À ${v}, les artisans intervenant sur le bâti récent connaissent les matériaux et techniques actuels. Vérifiez les garanties constructeur encore en cours avant certains travaux.`,
    (q, v) => `Votre résidence récente à ${q} bénéficie d'une bonne isolation de base, mais la domotique peut encore optimiser votre consommation. Thermostat connecté, volets automatisés, éclairage programmable : les artisans de ${v} spécialisés en maison intelligente transforment votre quotidien sans gros travaux.`,
    (q, v) => `Dans les constructions post-2000 à ${q}, l'aménagement extérieur est souvent le levier de valorisation le plus efficace. Pergola bioclimatique, terrasse en bois composite, éclairage paysager : les artisans de ${v} créent des espaces de vie prolongés qui augmentent la valeur de votre bien.`,
  ],
  'haussmannien': [
    (q, v) => `Si vous rénovez un appartement haussmannien à ${q}, choisissez des artisans expérimentés en restauration. Parquet ancien, moulures, cheminées exigent un savoir-faire spécifique. À ${v}, vérifiez si votre immeuble est en secteur protégé (ABF) : certains travaux de façade peuvent nécessiter une autorisation préalable.`,
    (q, v) => `Un haussmannien à ${q} offre des volumes exceptionnels. Les artisans de ${v} peuvent moderniser électricité et plomberie de manière invisible, installer une cuisine contemporaine dans le respect des proportions, et restaurer les éléments de décor (parquet, moulures, cheminées) qui font le charme de ces logements.`,
    (q, v) => `La rénovation d'un haussmannien à ${q} passe souvent par la mise aux normes du réseau électrique, dissimulé dans les moulures et les plinthes pour préserver l'esthétique. Les artisans de ${v} spécialisés en patrimoine maîtrisent ces techniques d'encastrement invisible qui respectent le cachet de votre appartement.`,
    (q, v) => `Les parquets en point de Hongrie ou en bâtons rompus de votre haussmannien à ${q} méritent une attention particulière. Ponçage, vitrification ou huilage : chaque finition a ses avantages. Les parqueteurs de ${v} évaluent l'épaisseur restante de bois noble avant d'intervenir pour garantir la longévité du plancher.`,
  ],
  'mixte': [
    (q, v) => `Dans un quartier au bâti mixte comme ${q}, commencez par identifier l'époque de construction pour cibler les travaux pertinents. Un artisan polyvalent de ${v} vous orientera vers les interventions prioritaires après un état des lieux. Les techniques varient considérablement entre bâtiment ancien et résidence récente.`,
    (q, v) => `À ${q}, la diversité du bâti implique de choisir des artisans adaptés à votre situation. Que vous habitiez un immeuble ancien ou une résidence moderne à ${v}, demandez un diagnostic précis avant d'engager des travaux. Les devis doivent être établis après visite sur site pour prendre en compte les particularités de votre construction.`,
    (q, v) => `Le bâti hétérogène de ${q} signifie que deux logements voisins peuvent avoir des besoins radicalement différents. Avant d'engager des travaux à ${v}, faites établir un état des lieux technique par un artisan qualifié. Cette étape évite les mauvaises surprises et permet de budgétiser avec précision.`,
    (q, v) => `Dans un quartier mixte comme ${q}, profitez de la variété des chantiers pour trouver des artisans polyvalents à ${v}. Ces professionnels, habitués à passer du bâti ancien à la construction récente, apportent une vision globale précieuse. Ils sauront vous conseiller sur les matériaux et techniques les mieux adaptés à votre logement.`,
  ],
}

// 15 FAQ templates — 4 selected per page via hash
const FAQ_POOL: { q: (n: string, v: string) => string; a: (n: string, v: string, dep: string, code: string, era: string, issues: string[]) => string }[] = [
  {
    q: (n, v) => `Quels artisans interviennent à ${n}, ${v} ?`,
    a: (n, v, dep, code) => `Notre annuaire référence des artisans dans plus de 40 corps de métier intervenant dans le quartier ${n} à ${v} (${code}) : plombiers, électriciens, serruriers, chauffagistes, peintres, menuisiers, couvreurs, maçons et plus. Tous sont identifiés à partir des données SIREN du ${dep}.`,
  },
  {
    q: (n) => `Comment obtenir un devis gratuit à ${n} ?`,
    a: (n, v) => `Sélectionnez le service souhaité, indiquez ${v} comme localisation, et décrivez votre projet. Vous recevrez jusqu'à 3 propositions d'artisans qualifiés intervenant à ${n}. Service 100% gratuit et sans engagement.`,
  },
  {
    q: (_n, v) => `Combien coûte un artisan à ${v} ?`,
    a: (_n, v, _dep, code) => `Les tarifs varient selon le corps de métier, la complexité et l'urgence. À ${v} (${code}), comptez en moyenne 50–90 €/h selon la spécialité. Demandez plusieurs devis pour comparer les prix et prestations.`,
  },
  {
    q: (n) => `Quel est le délai d'intervention moyen à ${n} ?`,
    a: (n, v) => `Pour une urgence (fuite, panne, serrure bloquée), les artisans de ${v} interviennent sous 1 à 4 heures à ${n}. Pour des travaux planifiés, comptez 1 à 3 semaines selon la disponibilité et l'ampleur du chantier.`,
  },
  {
    q: (n, v) => `Les artisans à ${n}, ${v} sont-ils vérifiés ?`,
    a: (n, v, dep) => `Les artisans référencés à ${n} (${v}) sont identifiés via les données officielles du registre SIREN. Nous vérifions l'existence légale de l'entreprise, son activité dans le ${dep}, et sa spécialité déclarée. Les avis clients complètent cette vérification.`,
  },
  {
    q: (n) => `Quels sont les travaux les plus courants à ${n} ?`,
    a: (n, v, _dep, _code, era, issues) => `À ${n} (${v}), le bâti de type ${era.toLowerCase()} génère des besoins spécifiques : ${issues.slice(0, 3).join(', ').toLowerCase()}. Les artisans locaux connaissent ces problématiques et proposent des solutions adaptées.`,
  },
  {
    q: (n, v) => `Comment choisir le bon artisan à ${n}, ${v} ?`,
    a: (n, v, _dep, _code, era) => `Pour bien choisir un artisan à ${n}, vérifiez que sa spécialité correspond à votre besoin. Le bâti de ${v} étant de type ${era.toLowerCase()}, privilégiez un professionnel expérimenté sur cette construction. Comparez au moins 3 devis, vérifiez les assurances (décennale, RC pro), et consultez les avis.`,
  },
  {
    q: () => `Les devis sont-ils vraiment gratuits et sans engagement ?`,
    a: (_n, v) => `Oui, les devis demandés via notre plateforme sont entièrement gratuits et sans engagement. Vous pouvez recevoir jusqu'à 3 propositions d'artisans de ${v}, les comparer, et choisir librement. Aucun frais caché, aucune obligation.`,
  },
  {
    q: (n) => `Un artisan peut-il intervenir en urgence à ${n} ?`,
    a: (n, v) => `Certains artisans de ${v} proposent des interventions d'urgence à ${n} : fuite d'eau, panne électrique, porte claquée, panne de chauffage. Disponibilité et délais variables selon les professionnels. Les tarifs d'urgence incluent généralement un supplément.`,
  },
  {
    q: (n) => `Quelles garanties pour les travaux à ${n} ?`,
    a: (n, v) => `Les artisans professionnels à ${v} sont couverts par l'assurance décennale et la RC professionnelle. Pour les travaux à ${n}, exigez une attestation d'assurance à jour. La garantie de parfait achèvement (1 an) et la garantie biennale (2 ans) complètent votre protection.`,
  },
  {
    q: (n, v) => `Faut-il un permis pour rénover à ${n}, ${v} ?`,
    a: (n, v, dep) => `Cela dépend de la nature des travaux. À ${n} (${v}), les travaux intérieurs ne nécessitent généralement pas d'autorisation. En revanche, modification de façade, extension ou changement de destination requiert une déclaration préalable auprès de la mairie. Consultez le PLU du ${dep}.`,
  },
  {
    q: (_n, v) => `Comment comparer efficacement les artisans à ${v} ?`,
    a: (_n, v) => `Demandez au minimum 3 devis détaillés pour le même périmètre de travaux à ${v}. Vérifiez que chaque devis précise : nature des travaux, matériaux, délais, prix HT et TTC, conditions de paiement. Consultez les avis clients et vérifiez les certifications (RGE, Qualibat).`,
  },
  {
    q: (_n, v) => `Quelles aides financières pour rénover à ${v} ?`,
    a: (_n, v, dep, code) => `Les habitants de ${v} (${code}) peuvent bénéficier de : MaPrimeRénov', éco-PTZ, CEE (Certificats d'Économies d'Énergie), et parfois des aides locales du ${dep}. Pour en bénéficier, les travaux doivent être réalisés par un artisan certifié RGE. Demandez un audit énergétique.`,
  },
  {
    q: (n) => `Le bâti à ${n} nécessite-t-il des artisans spécialisés ?`,
    a: (n, v, _dep, _code, era, issues) => `Le quartier ${n} à ${v} est composé de ${era.toLowerCase()}, ce qui implique des compétences spécifiques. Les problématiques courantes (${issues.slice(0, 2).join(', ').toLowerCase()}) demandent des artisans formés. Privilégiez des professionnels expérimentés sur des chantiers similaires.`,
  },
  {
    q: () => `Comment vérifier un artisan avant de l'engager ?`,
    a: (_n, v) => `Avant d'engager un artisan à ${v} : vérifiez son inscription au registre des métiers (SIRET actif), ses assurances (décennale, RC pro), sa certification RGE si nécessaire. Demandez des références de chantiers similaires. Méfiez-vous des devis anormalement bas.`,
  },
]

// 12 proximity templates — each references era for uniqueness
const PROXIMITY_TEMPLATES: ((q: string, v: string, era: string) => string)[] = [
  (q, v, era) => `Faire appel à un artisan proche de ${q} offre des avantages concrets : temps de déplacement réduit, connaissance du ${era.toLowerCase()}, réactivité en cas d'urgence, et suivi facilité. Un professionnel de ${v} connaît les réglementations locales et les fournisseurs du secteur.`,
  (q, v, era) => `Choisir un artisan intervenant à ${q} vous garantit un service adapté au ${era.toLowerCase()} du quartier. Moins de frais de déplacement, meilleure connaissance du bâti local, délais plus courts : la proximité est un critère de qualité. Les artisans de ${v} s'engagent sur des délais réalistes.`,
  (q, v) => `Un artisan basé à ${v} et intervenant à ${q} offre une réactivité précieuse. En cas d'urgence, il peut être sur place en moins d'une heure. Sa connaissance du quartier (accès, stationnement, bâtiments) lui permet d'intervenir efficacement. La proximité facilite aussi le suivi de chantier.`,
  (q, v, era) => `La proximité d'un artisan est un atout majeur à ${q}. Un professionnel de ${v} habitué au ${era.toLowerCase()} anticipe les difficultés et connaît les bonnes pratiques locales. Le bouche-à-oreille fonctionne : un artisan local qui fait du bon travail est recommandé par vos voisins.`,
  (q, v, era) => `Privilégier un artisan local pour vos travaux à ${q}, c'est aussi soutenir l'économie de proximité. Les professionnels de ${v} investissent dans la connaissance du ${era.toLowerCase()}, travaillent avec des fournisseurs locaux et s'engagent sur la qualité. Résultat : interventions soignées et tarifs compétitifs.`,
  (q, v) => `Les artisans de ${v} intervenant à ${q} combinent expertise technique et connaissance du terrain. Ils savent quels matériaux conviennent, connaissent les contraintes d'accès et peuvent mobiliser leur réseau local (autres corps de métier, fournisseurs). Cette proximité se traduit par des chantiers mieux coordonnés.`,
  (q, v, era) => `Pour des travaux sur du ${era.toLowerCase()} à ${q}, un artisan local est un choix judicieux. Il connaît les pathologies récurrentes du quartier, dispose de références vérifiables à ${v} et peut assurer un service après-vente réactif. La confiance se construit dans la durée grâce à cette proximité.`,
  (q, v, era) => `Engager un artisan de ${v} pour intervenir à ${q}, c'est bénéficier d'un professionnel familier du ${era.toLowerCase()} environnant. Les frais de déplacement sont réduits, les délais d'intervention raccourcis, et le suivi après chantier simplifié. Autant d'arguments en faveur d'un prestataire de proximité.`,
  (q, v) => `À ${q}, miser sur un artisan local de ${v} présente des avantages concrets au quotidien. En cas de malfaçon ou de retouche nécessaire, il se déplace sans délai ni surcoût. Sa réputation locale l'engage à fournir un travail irréprochable, car chaque chantier est une vitrine pour de futurs clients du quartier.`,
  (q, v, era) => `Les professionnels installés à ${v} qui interviennent à ${q} ont développé une expertise du ${era.toLowerCase()} au fil de leurs chantiers. Cette expérience accumulée leur permet d'anticiper les imprévus, de proposer les solutions les plus adaptées et de respecter les délais annoncés.`,
  (q, v, era) => `Travailler avec un artisan basé près de ${q} à ${v} facilite chaque étape du projet. Du premier rendez-vous au suivi post-chantier, la proximité géographique simplifie les échanges. Sur du ${era.toLowerCase()}, cette connaissance fine du bâti local est un avantage décisif pour la réussite de vos travaux.`,
  (q, v) => `Un professionnel du bâtiment ancré à ${v} et habitué à intervenir à ${q} est un partenaire de confiance pour vos travaux. Il connaît les règles d'urbanisme locales, les spécificités du quartier et peut coordonner plusieurs corps de métier en s'appuyant sur son réseau de confrères à proximité.`,
]

// Inline slug helper — same logic as toQuartierSlug in france.ts / slugify in utils.ts
function toQuartierSlug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Map quartier-data.ts epoque → location-content.ts BuildingEra
function mapEpoqueToBuildingEra(epoque: QuartierDataProfile['epoque']): BuildingEra {
  switch (epoque) {
    case 'medieval': return 'pre-1950'
    case 'haussmannien': return 'haussmannien'
    case '1945-1970': return '1950-1980'
    case '1970-2000': return '1980-2000'
    case 'post-2000': return 'post-2000'
  }
}

// Map quartier-data.ts densite → location-content.ts UrbanDensity
function mapDensiteToUrbanDensity(densite: QuartierDataProfile['densite']): UrbanDensity {
  switch (densite) {
    case 'haute': return 'dense'
    case 'moyenne': return 'residentiel'
    case 'faible': return 'periurbain'
  }
}

function getQuartierProfile(ville: Ville, quartierName: string): QuartierProfile {
  // Try to get enriched data from quartier-data.ts first
  const realData = getQuartierData(ville.slug, toQuartierSlug(quartierName))
  if (realData) {
    const eraKey = mapEpoqueToBuildingEra(realData.epoque)
    const densityKey = mapDensiteToUrbanDensity(realData.densite)
    const era = ERAS.find(e => e.key === eraKey) || ERAS[0]
    const density = DENSITIES.find(d => d.key === densityKey) || DENSITIES[1]
    const seed3 = Math.abs(hashCode(`arch-${ville.slug}-${quartierName}`))
    const archNotes = ERA_ARCH_NOTES[era.key]
    const archNote = archNotes[seed3 % archNotes.length]
    const issues = ERA_ISSUES[era.key]
    const topSlugs = SERVICE_PRIORITY[era.key]

    return {
      era: era.key,
      eraLabel: era.label,
      density: density.key,
      densityLabel: density.label,
      commonIssues: issues,
      topServiceSlugs: topSlugs,
      architecturalNote: archNote,
    }
  }

  // Fallback: algorithmic logic when no enriched quartier data is available
  const pop = parsePop(ville.population)
  const quartierIdx = ville.quartiers.indexOf(quartierName)
  const total = ville.quartiers.length
  const posRatio = total > 1 ? (quartierIdx >= 0 ? quartierIdx : 0) / (total - 1) : 0.5
  const seed3 = Math.abs(hashCode(`arch-${ville.slug}-${quartierName}`))

  // Era derived from city characteristics + quartier position (center=old, periphery=new)
  let eraKey: BuildingEra
  if (ville.departementCode === '75') {
    // Paris arrondissements: parse number for granular era assignment
    const arrMatch = quartierName.match(/^(\d+)/)
    const arrNum = arrMatch ? parseInt(arrMatch[1], 10) : 0
    if (arrNum >= 1 && arrNum <= 6) {
      // Rive gauche historique + Marais/Châtelet: médiéval + haussmannien
      eraKey = 'pre-1950'
    } else if ([7, 8, 16, 17].includes(arrNum)) {
      // Quartiers bourgeois: haussmannien pur
      eraKey = 'haussmannien'
    } else if ([9, 10, 11, 18, 19, 20].includes(arrNum)) {
      // Quartiers populaires: pré-haussmannien + après-guerre
      eraKey = '1950-1980'
    } else if ([12, 13, 14, 15].includes(arrNum)) {
      // Quartiers résidentiels: mixte haussmannien + tours modernes
      eraKey = 'mixte'
    } else {
      eraKey = 'haussmannien'
    }
  } else if (ville.slug === 'lyon') {
    // Lyon quartiers: specific era by name
    const lyonEras: Record<string, BuildingEra> = {
      'Vieux Lyon': 'pre-1950', 'Presqu\'île': 'haussmannien',
      'Croix-Rousse': 'pre-1950', 'Part-Dieu': '1980-2000',
      'Confluence': 'post-2000', 'Gerland': '1950-1980', 'Villeurbanne': '1950-1980',
    }
    eraKey = lyonEras[quartierName] || (posRatio < 0.4 ? 'pre-1950' : '1950-1980')
  } else if (ville.slug === 'marseille') {
    // Marseille quartiers: specific era by name
    const marseilleEras: Record<string, BuildingEra> = {
      'Vieux-Port': 'pre-1950', 'Le Panier': 'pre-1950',
      'La Joliette': '1980-2000', 'Castellane': '1950-1980',
      'La Canebière': 'haussmannien', 'Prado': 'haussmannien',
      'Bonneveine': '1980-2000', 'Les Calanques': 'post-2000',
    }
    eraKey = marseilleEras[quartierName] || (posRatio < 0.4 ? 'pre-1950' : '1950-1980')
  } else if (['92', '93', '94'].includes(ville.departementCode)) {
    // Petite couronne: haussmannien/pre-1950 center, apres-guerre periphery
    eraKey = posRatio < 0.3 ? 'haussmannien' : posRatio < 0.6 ? 'pre-1950' : '1950-1980'
  } else if (['78', '91', '95', '77'].includes(ville.departementCode)) {
    // Grande couronne IDF: apres-guerre to modern
    eraKey = posRatio < 0.4 ? '1950-1980' : 'post-2000'
  } else if (pop > 200000) {
    // Grandes métropoles: old center → modern periphery
    eraKey = posRatio < 0.3 ? 'pre-1950' : posRatio < 0.6 ? '1950-1980' : '1980-2000'
  } else if (pop > 50000) {
    // Grandes villes: old center → mixed
    eraKey = posRatio < 0.4 ? 'pre-1950' : posRatio < 0.7 ? '1950-1980' : '1980-2000'
  } else if (pop > 10000) {
    // Villes moyennes: mostly old with some modern
    eraKey = posRatio < 0.5 ? 'pre-1950' : '1980-2000'
  } else {
    // Petites villes: predominantly old
    eraKey = 'pre-1950'
  }

  // Density derived from population
  let densityKey: UrbanDensity
  if (pop > 100000) {
    densityKey = posRatio < 0.5 ? 'dense' : 'residentiel'
  } else if (pop > 30000) {
    densityKey = posRatio < 0.3 ? 'dense' : 'residentiel'
  } else if (pop > 10000) {
    densityKey = 'residentiel'
  } else {
    densityKey = 'periurbain'
  }

  const era = ERAS.find(e => e.key === eraKey) || ERAS[0]
  const density = DENSITIES.find(d => d.key === densityKey) || DENSITIES[1]
  const archNotes = ERA_ARCH_NOTES[era.key]
  const archNote = archNotes[seed3 % archNotes.length]
  const issues = ERA_ISSUES[era.key]
  const topSlugs = SERVICE_PRIORITY[era.key]

  return {
    era: era.key,
    eraLabel: era.label,
    density: density.key,
    densityLabel: density.label,
    commonIssues: issues,
    topServiceSlugs: topSlugs,
    architecturalNote: archNote,
  }
}

// ---------------------------------------------------------------------------
// Data-driven content for quartier pages — unique numeric sections per quartier
// ---------------------------------------------------------------------------

const ERA_ENERGY_NOTES: Record<string, string[]> = {
  'pre-1950': [
    'L\'absence d\'isolation d\'origine et les matériaux anciens expliquent cette proportion élevée.',
    'Les murs en pierre et les planchers bois, dépourvus d\'isolation moderne, laissent s\'échapper une part importante de la chaleur.',
    'Sans rupture de pont thermique ni double vitrage, ces constructions d\'avant-guerre affichent des consommations bien supérieures aux standards actuels.',
  ],
  'haussmannien': [
    'Les murs porteurs en pierre offrent une inertie thermique naturelle, mais l\'isolation reste souvent insuffisante.',
    'L\'épaisseur des murs haussmanniens compense partiellement l\'absence d\'isolation, mais les hauts plafonds augmentent le volume à chauffer.',
    'La configuration des immeubles haussmanniens (grandes fenêtres, planchers anciens) crée des déperditions significatives malgré la qualité du bâti.',
  ],
  '1950-1980': [
    'Les constructions d\'après-guerre, bâties sans réglementation thermique, sont particulièrement concernées.',
    'Le béton armé des années 1950-1980, bon marché mais conducteur, génère d\'importants ponts thermiques et une facture énergétique élevée.',
    'L\'absence de norme thermique à l\'époque de construction se traduit par des performances énergétiques très en deçà des exigences actuelles.',
  ],
  '1980-2000': [
    'Les premières normes thermiques (RT 1982) limitent le phénomène, mais ces logements gagnent à être rénovés.',
    'Conformes aux normes de l\'époque (RT 1982/1988), ces constructions présentent des performances honorables mais améliorables avec les matériaux actuels.',
    'Le double vitrage première génération et l\'isolation légère des années 1980-2000 atteignent aujourd\'hui leurs limites après 30 à 40 ans de service.',
  ],
  'post-2000': [
    'Le respect des normes RT 2005/2012 réduit considérablement la proportion de logements énergivores.',
    'Les logements récents bénéficient d\'une isolation performante, d\'une VMC efficace et de menuiseries haute qualité, limitant les déperditions.',
    'La construction post-2000, soumise à des exigences réglementaires strictes, affiche des consommations très inférieures à la moyenne du parc français.',
  ],
  'mixte': [
    'La diversité des époques de construction se traduit par des performances énergétiques très hétérogènes.',
    'Dans un tissu urbain mixte, les logements anciens côtoient des résidences récentes : les écarts de DPE peuvent aller de A à G sur un même quartier.',
    'Le bâti mixte génère des besoins contrastés : rénovation lourde pour les constructions anciennes, entretien courant pour les plus récentes.',
  ],
}

const ERA_CLIMAT_IMPACT: Record<string, ((q: string) => string)[]> = {
  'pre-1950': [
    (q) => `Pour le bâti ancien de ${q}, le gel accentue les risques d'infiltration et de fissuration des maçonneries. L'isolation thermique est d'autant plus critique.`,
    (q) => `À ${q}, les constructions d'avant 1950 sont vulnérables aux cycles gel-dégel qui fragilisent les joints de maçonnerie. Un entretien préventif régulier limite les dégradations.`,
    (q) => `Le patrimoine bâti ancien de ${q} nécessite une attention particulière lors des épisodes de froid : les matériaux poreux absorbent l'humidité qui, en gelant, fissure pierres et enduits.`,
  ],
  '1950-1980': [
    (q) => `Les constructions d'après-guerre de ${q}, souvent peu isolées, subissent de plein fouet les variations thermiques. Le remplacement des fenêtres simple vitrage est une priorité.`,
    (q) => `À ${q}, les immeubles des années 1950-1980 présentent des façades exposées aux intempéries sans protection thermique adéquate. La priorité : isoler et remplacer les menuiseries.`,
    (q) => `Le béton des constructions d'après-guerre de ${q} conduit le froid en profondeur. En période de gel, les ponts thermiques génèrent condensation et moisissures à l'intérieur.`,
  ],
  '1980-2000': [
    (q) => `Les logements des années 1980-2000 à ${q} résistent mieux au climat grâce aux premières normes thermiques, mais les menuiseries d'origine arrivent en fin de vie.`,
    (q) => `À ${q}, les résidences 1980-2000 sont mieux protégées contre le froid que le parc ancien, mais l'étanchéité des toitures-terrasses et des joints de façade mérite un contrôle régulier.`,
    (q) => `Le bâti des années 1980-2000 de ${q} bénéficie d'une isolation correcte pour l'époque, mais le vieillissement des matériaux réduit leur efficacité face aux aléas climatiques.`,
  ],
  'post-2000': [
    (q) => `Le bâti récent de ${q} est conçu pour résister aux aléas climatiques. L'entretien courant (VMC, étanchéité) reste néanmoins essentiel.`,
    (q) => `Les constructions modernes de ${q} intègrent une isolation performante qui protège des variations saisonnières. Un suivi d'entretien préventif suffit généralement.`,
    (q) => `À ${q}, les logements post-2000 supportent bien les contraintes climatiques grâce aux normes RT en vigueur. La VMC double flux et le double vitrage limitent les déperditions.`,
  ],
  'haussmannien': [
    (q) => `Les immeubles haussmanniens de ${q}, avec leurs murs épais en pierre, offrent une bonne inertie thermique, mais les jonctions fenêtres-maçonnerie sont des points faibles.`,
    (q) => `À ${q}, le patrimoine haussmannien bénéficie de murs massifs qui régulent naturellement la température. En revanche, les courants d'air aux menuiseries anciennes restent un défi.`,
    (q) => `La pierre de taille des immeubles haussmanniens de ${q} absorbe et restitue la chaleur, mais les planchers hauts et les grandes fenêtres augmentent les besoins de chauffage en hiver.`,
  ],
  'mixte': [
    (q) => `La diversité architecturale de ${q} implique des réponses climatiques variées, du traitement anti-humidité du bâti ancien à l'entretien préventif du bâti récent.`,
    (q) => `À ${q}, chaque époque de construction réagit différemment aux aléas climatiques. Un diagnostic thermique adapté à chaque bâtiment est recommandé avant travaux.`,
    (q) => `Le tissu urbain mixte de ${q} présente des vulnérabilités climatiques hétérogènes : le bâti ancien craint l'humidité, tandis que le bâti récent nécessite un entretien régulier.`,
  ],
}

function generateQuartierDataDrivenContent(
  ville: Ville,
  quartierName: string,
  profile: QuartierProfile,
): QuartierDataDrivenContent {
  const cityData = villeToPartialCommuneData(ville)
  const nQ = ville.quartiers.length
  const qData = deriveQuartierCommuneData(cityData, quartierName, ville.slug, profile.era, profile.density, nQ)
  const seed = Math.abs(hashCode(`qdd-${ville.slug}-${quartierName}`))
  const dataSources: string[] = []

  // Try to get enriched quartier data for real values
  const realData = getQuartierData(ville.slug, toQuartierSlug(quartierName))

  // ── Section 1: Immobilier quartier ──
  const prixQ = realData ? realData.prixM2 : qData.prix_m2_moyen
  const prixCity = cityData.prix_m2_moyen
  const logements = qData.nb_logements
  const partMaisons = qData.part_maisons_pct

  let immobilierQuartier: string
  if (prixQ && prixCity) {
    const diff = Math.round(((prixQ - prixCity) / prixCity) * 100)
    const diffLabel = diff > 0 ? `${diff} % au-dessus` : diff < 0 ? `${Math.abs(diff)} % en dessous` : 'au niveau'

    const immoTemplates = [
      `Le quartier ${quartierName} à ${ville.name} affiche un prix immobilier estimé à ${formatEuro(prixQ)}/m², soit ${diffLabel} de la moyenne communale (${formatEuro(prixCity)}/m²). ${profile.eraLabel}, ce type de bâti ${diff > 5 ? 'bénéficie d\'une cote supérieure' : diff < -5 ? 'reste plus accessible' : 'se situe dans la norme locale'} sur le marché.${logements ? ` Le parc résidentiel du quartier compte environ ${formatNumber(logements)} logements.` : ''}${partMaisons != null ? ` L'habitat est composé à ${partMaisons} % de maisons individuelles.` : ''}`,

      `Avec un prix au m² estimé à ${formatEuro(prixQ)} dans le quartier ${quartierName}, le marché immobilier local reflète les caractéristiques du ${profile.eraLabel.toLowerCase()} en ${profile.densityLabel.toLowerCase()}. Par rapport à la moyenne de ${ville.name} (${formatEuro(prixCity)}/m²), ce quartier est ${diffLabel}.${logements ? ` On y recense environ ${formatNumber(logements)} logements.` : ''}${partMaisons != null ? ` La part de maisons individuelles atteint ${partMaisons} %.` : ''}`,

      `À ${quartierName} (${ville.name}), le prix immobilier se situe autour de ${formatEuro(prixQ)}/m², ${diffLabel} de la moyenne communale de ${formatEuro(prixCity)}/m². Le ${profile.eraLabel.toLowerCase()} et la densité ${profile.densityLabel.toLowerCase()} influencent directement la valeur foncière et les besoins en rénovation.${logements ? ` Le quartier représente environ ${formatNumber(logements)} logements.` : ''}`,
    ]
    immobilierQuartier = immoTemplates[seed % 3]
    const realPrixData = getQuartierRealPrix(ville.slug, quartierName)
    dataSources.push(realPrixData
      ? `${realPrixData.source} (prix réels ${realPrixData.annee})`
      : 'DVF Etalab / INSEE (estimations prix immobiliers)')
  } else {
    immobilierQuartier = `Le quartier ${quartierName} à ${ville.name} est caractérisé par un ${profile.eraLabel.toLowerCase()} en ${profile.densityLabel.toLowerCase()}, des paramètres qui influencent les prix immobiliers et les besoins en travaux.`
  }

  // ── Section 2: Marché artisanal quartier ──
  const artisans = qData.nb_entreprises_artisanales
  const btp = qData.nb_artisans_btp

  let marcheArtisanalQuartier: string
  if (artisans && btp) {
    const marchTemplates = [
      `Le quartier ${quartierName} et ses environs comptent environ ${formatNumber(artisans)} entreprises artisanales, dont ${formatNumber(btp)} dans le BTP (codes NAF 41-43). ${profile.density === 'dense' ? 'La forte densité urbaine concentre l\'offre' : profile.density === 'periurbain' ? 'Le caractère périurbain étend le rayon d\'intervention des artisans' : 'Le profil résidentiel assure un bon maillage de professionnels'} à proximité du quartier.`,

      `Autour de ${quartierName} à ${ville.name}, on recense environ ${formatNumber(artisans)} artisans immatriculés, ${formatNumber(btp)} étant spécialisés dans le BTP. Le bâti de type ${profile.eraLabel.toLowerCase()} génère une demande spécifique que ces professionnels connaissent. ${profile.density === 'dense' ? 'La densité du quartier réduit les temps de déplacement.' : 'Le périmètre d\'intervention s\'adapte au tissu urbain local.'}`,

      `${formatNumber(artisans)} entreprises artisanales opèrent dans le secteur de ${quartierName} (${ville.name}), dont ${formatNumber(btp)} artisans du bâtiment. Ce tissu professionnel ${artisans > 200 ? 'dense' : artisans > 50 ? 'solide' : 'de proximité'} permet de trouver un professionnel adapté au ${profile.eraLabel.toLowerCase()} qui caractérise le quartier.`,
    ]
    marcheArtisanalQuartier = marchTemplates[(seed + 1) % 3]
    dataSources.push('API SIRENE / INSEE (entreprises artisanales)')
  } else {
    marcheArtisanalQuartier = `Le quartier ${quartierName} à ${ville.name} est desservi par les artisans du ${ville.departement}. Nos professionnels référencés connaissent le ${profile.eraLabel.toLowerCase()} du secteur.`
  }

  // ── Section 3: Énergétique / DPE quartier ──
  const dpe = realData ? realData.tauxPassoires : qData.pct_passoires_dpe
  const cityDpe = cityData.pct_passoires_dpe
  const dpeMedianLabel = realData ? `DPE médian ${realData.dpeMedian}` : null

  let energetiqueQuartier: string
  if (dpe != null && cityDpe != null) {
    const dpeCompare = dpe > cityDpe
      ? `supérieur à la moyenne communale (${cityDpe} %)`
      : dpe < cityDpe
      ? `inférieur à la moyenne communale (${cityDpe} %)`
      : 'proche de la moyenne communale'
    const eraNotes = ERA_ENERGY_NOTES[profile.era] || ['']
    const eraNote = eraNotes[Math.abs(hashCode(`enr-${ville.slug}-${quartierName}`)) % eraNotes.length]
    const dpeMedianSuffix = dpeMedianLabel ? ` Le ${dpeMedianLabel} du quartier confirme cette tendance.` : ''

    const nrgTemplates = [
      `À ${quartierName}, on estime que ${dpe} % des logements sont des passoires thermiques (DPE F ou G), un taux ${dpeCompare}. ${eraNote} L'interdiction progressive de location des logements mal classés accélère la demande de rénovation énergétique.${dpeMedianSuffix}`,

      `Dans le quartier ${quartierName} (${ville.name}), environ ${dpe} % des logements présentent un diagnostic énergétique défavorable (classes F-G), ${dpeCompare}. ${eraNote} Les artisans RGE du secteur accompagnent les propriétaires dans cette transition.${dpeMedianSuffix}`,

      `Le quartier ${quartierName} affiche une estimation de ${dpe} % de passoires thermiques, ${dpeCompare}. Pour un bâti de type ${profile.eraLabel.toLowerCase()}, ${dpe > 20 ? 'ce chiffre appelle des travaux de rénovation énergétique prioritaires' : dpe > 10 ? 'ce taux reflète les caractéristiques constructives de l\'époque' : 'cette performance témoigne de normes de construction récentes'}. ${eraNote}${dpeMedianSuffix}`,
    ]
    energetiqueQuartier = nrgTemplates[(seed + 2) % 3]
    dataSources.push('ADEME (DPE, estimations par type de bâti)')
  } else {
    energetiqueQuartier = `Le ${profile.eraLabel.toLowerCase()} du quartier ${quartierName} influence directement les performances énergétiques des logements. Consultez un artisan RGE pour un diagnostic adapté.`
  }

  // ── Section 4: Climat et travaux quartier ──
  const gel = cityData.jours_gel_annuels
  const precip = cityData.precipitation_annuelle
  const tempH = cityData.temperature_moyenne_hiver
  const tempE = cityData.temperature_moyenne_ete
  const trDebut = cityData.mois_travaux_ext_debut
  const trFin = cityData.mois_travaux_ext_fin

  let climatQuartier: string
  if (gel != null || precip != null) {
    const climatParts: string[] = []

    if (gel != null && tempH != null && tempE != null) {
      const climTemplates = [
        `À ${ville.name}, le climat impose ${gel} jours de gel annuels en moyenne, avec des températures variant de ${tempH.toFixed(1)} °C en hiver à ${tempE.toFixed(1)} °C en été.`,
        `${ville.name} connaît en moyenne ${gel} jours de gel par an. Les températures oscillent entre ${tempH.toFixed(1)} °C (hiver) et ${tempE.toFixed(1)} °C (été).`,
        `Avec ${gel} jours de gel et un thermomètre entre ${tempH.toFixed(1)} °C et ${tempE.toFixed(1)} °C selon la saison, ${ville.name} présente des contraintes climatiques à prendre en compte.`,
      ]
      climatParts.push(climTemplates[(seed + 3) % 3])
    }

    if (precip != null) {
      climatParts.push(`La pluviométrie annuelle atteint ${formatNumber(precip)} mm.`)
    }

    const impactFns = ERA_CLIMAT_IMPACT[profile.era]
    if (impactFns) {
      const impactFn = impactFns[Math.abs(hashCode(`clim-${ville.slug}-${quartierName}`)) % impactFns.length]
      climatParts.push(impactFn(quartierName))
    }

    if (trDebut != null && trFin != null) {
      climatParts.push(`La période optimale pour les travaux extérieurs à ${quartierName} s'étend de ${monthName(trDebut)} à ${monthName(trFin)}.`)
    }

    climatQuartier = climatParts.join(' ')
    dataSources.push('Open-Meteo / Météo-France (données climatiques)')
  } else {
    climatQuartier = `Les conditions climatiques de ${ville.name} influencent les travaux à ${quartierName}. Adaptez le calendrier de vos chantiers aux saisons pour garantir la qualité des interventions.`
  }

  const periodeTravaux = trDebut != null && trFin != null ? `${monthName(trDebut)} à ${monthName(trFin)}` : null

  // ── Enrich with transport & risques from real quartier data ──
  if (realData) {
    const RISQUE_LABELS: Record<string, string> = {
      inondation: 'risque d\'inondation',
      sismique: 'risque sismique',
      argile: 'retrait-gonflement des argiles',
      radon: 'exposition au radon',
      littoral: 'érosion littorale',
    }
    const TRANSPORT_LABELS: Record<string, string> = {
      metro: 'métro',
      tram: 'tramway',
      rer: 'RER',
      bus: 'bus',
      gare: 'gare ferroviaire',
      aucun: 'aucun transport en commun',
    }

    if (realData.risques.length > 0) {
      const risquesStr = realData.risques.map(r => RISQUE_LABELS[r] || r).join(', ')
      climatQuartier += ` Le quartier ${quartierName} est également concerné par : ${risquesStr}. Ces facteurs peuvent influencer les travaux de rénovation et les choix de matériaux.`
    }

    if (realData.transport.length > 0 && !realData.transport.includes('aucun')) {
      const transportStr = realData.transport.map(t => TRANSPORT_LABELS[t] || t).join(', ')
      marcheArtisanalQuartier += ` Le quartier est desservi par : ${transportStr}, facilitant l'accès des artisans au chantier.`
    }

    // Add loyer info to immobilier section when available
    if (realData.loyerM2 > 0) {
      immobilierQuartier += ` Le loyer moyen se situe autour de ${formatEuro(realData.loyerM2)}/m²/mois, avec un taux de propriétaires de ${realData.tauxProprietaires} %.`
    }
  }

  return {
    immobilierQuartier,
    marcheArtisanalQuartier,
    energetiqueQuartier,
    climatQuartier,
    statCards: {
      prixM2Quartier: prixQ || 0,
      artisansProximite: artisans || 0,
      artisansBtp: btp || 0,
      passoiresDpe: dpe || 0,
      joursGel: gel,
      periodeTravaux,
    },
    dataSources: Array.from(new Set(dataSources)),
  }
}

export function generateQuartierContent(ville: Ville, quartierName: string, serviceSlug?: string): QuartierContent {
  const seedSuffix = serviceSlug ? `-${serviceSlug}` : ''
  const seed = Math.abs(hashCode(`${ville.slug}-${quartierName}${seedSuffix}`))
  const profile = getQuartierProfile(ville, quartierName)

  // Intro — 12 templates × era/density/arch data = unique per profile
  const introFn = QUARTIER_INTROS[seed % QUARTIER_INTROS.length]
  const intro = introFn(quartierName, ville.name, ville.departement, ville.departementCode, ville.population, profile.eraLabel, profile.architecturalNote, profile.densityLabel)

  // Building context — by era
  const ctxTemplates = BATIMENT_CONTEXTS[profile.era]
  const batimentContext = ctxTemplates[Math.abs(hashCode(`ctx-${ville.slug}-${quartierName}${seedSuffix}`)) % ctxTemplates.length](quartierName, ville.name)

  // Services pricing — top 5 for this era
  const multiplier = getRegionalMultiplier(ville.region)
  const pricingLines = profile.topServiceSlugs.slice(0, 5).map(slug => {
    const t = getTradeContent(slug)
    if (!t) return null
    const min = Math.round(t.priceRange.min * multiplier)
    const max = Math.round(t.priceRange.max * multiplier)
    return `${t.name} : ${min}–${max} ${t.priceRange.unit}`
  }).filter(Boolean)

  const sdTemplates = [
    `Dans le quartier ${quartierName} à ${ville.name}, les services fréquemment demandés dans les quartiers à ${profile.eraLabel.toLowerCase()} sont : ${pricingLines.join(' · ')}. Ces tarifs indicatifs pour la région ${ville.region} varient selon la complexité, l'urgence et les matériaux. Comparez plusieurs devis.`,
    `À ${quartierName} (${ville.name}), les artisans les plus sollicités interviennent sur du ${profile.eraLabel.toLowerCase()}. Tarifs constatés en ${ville.region} : ${pricingLines.join(' · ')}. Prix indicatifs, variables selon le chantier et les matériaux choisis.`,
    `Les habitants de ${quartierName} à ${ville.name} font appel à des artisans spécialisés dans le ${profile.eraLabel.toLowerCase()}. Fourchettes tarifaires en ${ville.region} : ${pricingLines.join(' · ')}. Demandez plusieurs devis pour affiner votre budget.`,
    `Pour un logement à ${quartierName}, les travaux courants sur du ${profile.eraLabel.toLowerCase()} couvrent : ${pricingLines.join(' · ')}. Ces estimations pour la région ${ville.region} dépendent de l'état du bâti, de l'accès chantier et des finitions souhaitées.`,
    `Le quartier ${quartierName} à ${ville.name}, typique du ${profile.eraLabel.toLowerCase()}, génère une demande régulière pour : ${pricingLines.join(' · ')}. Tarifs indicatifs ${ville.region}, à confirmer par devis personnalisé.`,
    `Avec un parc immobilier de ${profile.eraLabel.toLowerCase()}, ${quartierName} concentre des besoins artisanaux précis. Les prestations les plus courantes en ${ville.region} : ${pricingLines.join(' · ')}. Un devis sur site reste indispensable pour un chiffrage fiable.`,
    `Les résidents de ${quartierName} à ${ville.name} recherchent régulièrement des artisans pour du ${profile.eraLabel.toLowerCase()}. Grille tarifaire indicative en ${ville.region} : ${pricingLines.join(' · ')}. Les prix définitifs dépendent de l'état du logement et de l'ampleur des travaux.`,
    `À ${ville.name}, le quartier ${quartierName} présente un bâti de ${profile.eraLabel.toLowerCase()} qui oriente la demande en artisanat. Principales prestations et tarifs constatés en ${ville.region} : ${pricingLines.join(' · ')}. Sollicitez plusieurs professionnels pour comparer.`,
    `Le ${profile.eraLabel.toLowerCase()} caractéristique de ${quartierName} à ${ville.name} implique des interventions spécifiques. Estimations tarifaires pour la région ${ville.region} : ${pricingLines.join(' · ')}. Ces fourchettes sont données à titre indicatif et peuvent varier selon l'accès au chantier.`,
    `Quartier de ${ville.name} au bâti de ${profile.eraLabel.toLowerCase()}, ${quartierName} voit une demande soutenue pour : ${pricingLines.join(' · ')}. Ces tarifs moyens en ${ville.region} constituent un repère utile, mais seul un devis après visite garantit un prix juste.`,
  ]
  const servicesDemandes = sdTemplates[Math.abs(hashCode(`sd-${ville.slug}-${quartierName}${seedSuffix}`)) % sdTemplates.length]

  // Tips — by era
  const tipTemplates = ERA_TIPS[profile.era]
  const conseils = tipTemplates[Math.abs(hashCode(`tips-${ville.slug}-${quartierName}${seedSuffix}`)) % tipTemplates.length](quartierName, ville.name)

  // Proximity
  const proxFn = PROXIMITY_TEMPLATES[Math.abs(hashCode(`prox-${ville.slug}-${quartierName}${seedSuffix}`)) % PROXIMITY_TEMPLATES.length]
  const proximite = proxFn(quartierName, ville.name, profile.eraLabel)

  // FAQ — select 4 from pool of 15 via hash
  const faqIndices: number[] = []
  let faqSeed = Math.abs(hashCode(`faq-${ville.slug}-${quartierName}${seedSuffix}`))
  while (faqIndices.length < 4) {
    const idx = faqSeed % FAQ_POOL.length
    if (!faqIndices.includes(idx)) faqIndices.push(idx)
    faqSeed = Math.abs(hashCode(`faq${faqSeed}-${faqIndices.length}`))
  }
  const faqItems = faqIndices.map(idx => {
    const f = FAQ_POOL[idx]
    return {
      question: f.q(quartierName, ville.name),
      answer: f.a(quartierName, ville.name, ville.departement, ville.departementCode, profile.eraLabel, profile.commonIssues),
    }
  })

  // Generate data-driven content
  const dataDriven = generateQuartierDataDrivenContent(ville, quartierName, profile)

  // Add data-driven FAQ items with quartier-specific numbers
  if (dataDriven.statCards.prixM2Quartier > 0) {
    const cityData = villeToPartialCommuneData(ville)
    const prixCity = cityData.prix_m2_moyen
    if (prixCity) {
      const diff = Math.round(((dataDriven.statCards.prixM2Quartier - prixCity) / prixCity) * 100)
      faqItems.push({
        question: `Quel est le prix immobilier dans le quartier ${quartierName} ?`,
        answer: `Le prix moyen estimé à ${quartierName} (${ville.name}) est de ${formatEuro(dataDriven.statCards.prixM2Quartier)}/m², ${diff > 0 ? `${diff} % au-dessus` : diff < 0 ? `${Math.abs(diff)} % en dessous` : 'au niveau'} de la moyenne communale de ${formatEuro(prixCity)}/m². Le ${profile.eraLabel.toLowerCase()} et la densité ${profile.densityLabel.toLowerCase()} influencent ce positionnement.`,
      })
    }
  }

  if (dataDriven.statCards.passoiresDpe > 0) {
    faqItems.push({
      question: `Les logements de ${quartierName} sont-ils énergivores ?`,
      answer: `On estime que ${dataDriven.statCards.passoiresDpe} % des logements du quartier ${quartierName} sont classés F ou G au DPE. Pour un ${profile.eraLabel.toLowerCase()}, ${dataDriven.statCards.passoiresDpe > 20 ? 'ce taux justifie des travaux de rénovation énergétique prioritaires' : 'ce taux reflète les caractéristiques constructives du bâti'}. Les artisans RGE de ${ville.name} accompagnent les propriétaires éligibles à MaPrimeRénov'.`,
    })
  }

  return { profile, intro, batimentContext, servicesDemandes, conseils, proximite, faqItems, dataDriven }
}

// ---------------------------------------------------------------------------
// Département page content — programmatic SEO with climate & economic profiles
// ---------------------------------------------------------------------------

type ClimateZone = 'oceanique' | 'continental' | 'mediterraneen' | 'montagnard' | 'semi-oceanique' | 'tropical'
type EconomyType = 'industriel' | 'agricole' | 'tertiaire' | 'touristique' | 'mixte'
type HousingStock = 'ancien-pierre' | 'apres-guerre' | 'moderne' | 'mixte-urbain' | 'rural-traditionnel'

export interface DepartementProfile {
  climate: ClimateZone
  climateLabel: string
  economy: EconomyType
  economyLabel: string
  housing: HousingStock
  housingLabel: string
  topServiceSlugs: string[]
  climaticIssues: string[]
}

export interface DepartementContent {
  profile: DepartementProfile
  intro: string
  contexteHabitat: string
  servicesPrioritaires: string
  conseilsDepartement: string
  faqItems: { question: string; answer: string }[]
}

const CLIMATES: { key: ClimateZone; label: string }[] = [
  { key: 'oceanique', label: 'Climat océanique' },
  { key: 'continental', label: 'Climat continental' },
  { key: 'mediterraneen', label: 'Climat méditerranéen' },
  { key: 'montagnard', label: 'Climat montagnard' },
  { key: 'semi-oceanique', label: 'Climat semi-océanique' },
  { key: 'tropical', label: 'Climat tropical' },
]

const ECONOMIES: { key: EconomyType; label: string }[] = [
  { key: 'industriel', label: 'Économie industrielle' },
  { key: 'agricole', label: 'Économie agricole' },
  { key: 'tertiaire', label: 'Économie tertiaire' },
  { key: 'touristique', label: 'Économie touristique' },
  { key: 'mixte', label: 'Économie diversifiée' },
]

const HOUSINGS: { key: HousingStock; label: string }[] = [
  { key: 'ancien-pierre', label: 'Bâti ancien en pierre' },
  { key: 'apres-guerre', label: 'Construction d\'après-guerre' },
  { key: 'moderne', label: 'Construction contemporaine' },
  { key: 'mixte-urbain', label: 'Parc immobilier mixte urbain' },
  { key: 'rural-traditionnel', label: 'Habitat rural traditionnel' },
]

const REGION_CLIMATE: Record<string, ClimateZone> = {
  'Île-de-France': 'semi-oceanique',
  'Bretagne': 'oceanique',
  'Normandie': 'oceanique',
  'Pays de la Loire': 'oceanique',
  'Hauts-de-France': 'oceanique',
  'Grand Est': 'continental',
  'Bourgogne-Franche-Comté': 'continental',
  'Centre-Val de Loire': 'semi-oceanique',
  "Provence-Alpes-Côte d'Azur": 'mediterraneen',
  'Occitanie': 'mediterraneen',
  'Corse': 'mediterraneen',
  'Auvergne-Rhône-Alpes': 'continental',
  'Nouvelle-Aquitaine': 'oceanique',
  'Guadeloupe': 'tropical',
  'Martinique': 'tropical',
  'Guyane': 'tropical',
  'La Réunion': 'tropical',
  'Mayotte': 'tropical',
}

// Department-level climate overrides (when different from regional default)
const DEPT_CLIMATE_OVERRIDES: Record<string, ClimateZone> = {
  // PACA — coast vs mountains
  '04': 'montagnard',    // Alpes-de-Haute-Provence
  '05': 'montagnard',    // Hautes-Alpes
  '06': 'mediterraneen', // Alpes-Maritimes (coast)
  '13': 'mediterraneen', // Bouches-du-Rhône
  '83': 'mediterraneen', // Var
  '84': 'mediterraneen', // Vaucluse
  // Auvergne-Rhône-Alpes — mountain vs plain
  '01': 'semi-oceanique', // Ain
  '03': 'semi-oceanique', // Allier
  '07': 'mediterraneen',  // Ardèche (south)
  '15': 'montagnard',     // Cantal
  '26': 'mediterraneen',  // Drôme
  '38': 'continental',    // Isère
  '42': 'continental',    // Loire
  '43': 'montagnard',     // Haute-Loire
  '63': 'montagnard',     // Puy-de-Dôme
  '69': 'continental',    // Rhône
  '73': 'montagnard',     // Savoie
  '74': 'montagnard',     // Haute-Savoie
  // Occitanie — Mediterranean coast vs mountains vs Atlantic
  '09': 'montagnard',     // Ariège
  '11': 'mediterraneen',  // Aude
  '12': 'semi-oceanique', // Aveyron
  '30': 'mediterraneen',  // Gard
  '31': 'semi-oceanique', // Haute-Garonne
  '32': 'semi-oceanique', // Gers
  '34': 'mediterraneen',  // Hérault
  '46': 'semi-oceanique', // Lot
  '48': 'montagnard',     // Lozère
  '65': 'montagnard',     // Hautes-Pyrénées
  '66': 'mediterraneen',  // Pyrénées-Orientales
  '81': 'semi-oceanique', // Tarn
  '82': 'semi-oceanique', // Tarn-et-Garonne
  // Nouvelle-Aquitaine — Atlantic coast vs inland
  '16': 'oceanique',      // Charente
  '17': 'oceanique',      // Charente-Maritime
  '19': 'semi-oceanique', // Corrèze
  '23': 'semi-oceanique', // Creuse
  '24': 'semi-oceanique', // Dordogne
  '33': 'oceanique',      // Gironde
  '40': 'oceanique',      // Landes
  '47': 'semi-oceanique', // Lot-et-Garonne
  '64': 'oceanique',      // Pyrénées-Atlantiques
  '79': 'oceanique',      // Deux-Sèvres
  '86': 'semi-oceanique', // Vienne
  '87': 'semi-oceanique', // Haute-Vienne
  // Grand Est — continental variations
  '08': 'continental',    // Ardennes
  '10': 'continental',    // Aube
  '51': 'continental',    // Marne
  '52': 'continental',    // Haute-Marne
  '54': 'continental',    // Meurthe-et-Moselle
  '55': 'continental',    // Meuse
  '57': 'continental',    // Moselle
  '67': 'continental',    // Bas-Rhin
  '68': 'continental',    // Haut-Rhin (could be semi-montagnard)
  '88': 'montagnard',     // Vosges
  // Bourgogne-Franche-Comté
  '21': 'continental',    // Côte-d'Or
  '25': 'montagnard',     // Doubs (Jura)
  '39': 'montagnard',     // Jura
  '58': 'continental',    // Nièvre
  '70': 'continental',    // Haute-Saône
  '71': 'continental',    // Saône-et-Loire
  '89': 'continental',    // Yonne
  '90': 'continental',    // Territoire de Belfort
  // Corse
  '2A': 'mediterraneen',  // Corse-du-Sud
  '2B': 'mediterraneen',  // Haute-Corse
  // DOM-TOM
  '971': 'tropical',      // Guadeloupe
  '972': 'tropical',      // Martinique
  '973': 'tropical',      // Guyane
  '974': 'tropical',      // Réunion
  '976': 'tropical',      // Mayotte
}

const DEPT_SERVICE_PRIORITY: Record<ClimateZone, string[]> = {
  'oceanique': ['couvreur', 'peintre-en-batiment', 'plombier', 'chauffagiste', 'menuisier', 'electricien', 'macon', 'facade', 'serrurier', 'climaticien', 'carreleur', 'vitrier', 'terrassier', 'paysagiste', 'domoticien'],
  'continental': ['chauffagiste', 'plombier', 'electricien', 'couvreur', 'menuisier', 'macon', 'peintre-en-batiment', 'climaticien', 'serrurier', 'facade', 'carreleur', 'vitrier', 'terrassier', 'paysagiste', 'domoticien'],
  'mediterraneen': ['climaticien', 'plombier', 'electricien', 'peintre-en-batiment', 'carreleur', 'macon', 'serrurier', 'facade', 'couvreur', 'menuisier', 'chauffagiste', 'vitrier', 'terrassier', 'paysagiste', 'domoticien'],
  'montagnard': ['chauffagiste', 'couvreur', 'plombier', 'menuisier', 'macon', 'electricien', 'peintre-en-batiment', 'serrurier', 'facade', 'vitrier', 'climaticien', 'carreleur', 'terrassier', 'paysagiste', 'domoticien'],
  'semi-oceanique': ['plombier', 'electricien', 'chauffagiste', 'peintre-en-batiment', 'menuisier', 'couvreur', 'serrurier', 'macon', 'climaticien', 'carreleur', 'facade', 'vitrier', 'terrassier', 'paysagiste', 'domoticien'],
  'tropical': ['climaticien', 'plombier', 'electricien', 'macon', 'peintre-en-batiment', 'couvreur', 'carreleur', 'serrurier', 'menuisier', 'facade', 'terrassier', 'paysagiste', 'vitrier', 'chauffagiste', 'domoticien'],
}

const CLIMATE_ISSUES: Record<ClimateZone, string[]> = {
  'oceanique': [
    'Humidité persistante et risques de condensation dans les logements',
    'Dégradation accélérée des façades exposées aux vents marins et à la pluie',
    'Mousses et lichens sur toitures nécessitant un traitement régulier',
    'Menuiseries extérieures fragilisées par les intempéries fréquentes',
    'Problèmes d\'étanchéité liés aux fortes précipitations',
    'Corrosion des éléments métalliques (gouttières, garde-corps) par l\'air salin côtier',
    'VMC sollicitée en permanence pour évacuer l\'excès d\'humidité intérieure',
    'Revêtements de sol sensibles au gonflement dans les pièces humides',
  ],
  'continental': [
    'Gel hivernal causant des fissures dans les murs et fondations',
    'Isolation thermique sollicitée par les écarts de température importants',
    'Canalisations exposées au risque de gel en hiver',
    'Chaudières fortement sollicitées durant les hivers rigoureux',
    'Dilatation thermique des matériaux entre été et hiver',
    'Volets et fermetures déformés par les variations de température',
    'Dallages extérieurs fissurés par les cycles gel-dégel répétés',
    'Consommation énergétique élevée nécessitant une isolation performante',
  ],
  'mediterraneen': [
    'Surchauffe estivale nécessitant climatisation et protections solaires',
    'Sécheresse et retrait des argiles fragilisant les fondations',
    'Évaporation rapide de l\'humidité provoquant des fissures de façade',
    'Épisodes cévenols et pluies torrentielles sollicitant les toitures',
    'Vieillissement accéléré des peintures extérieures par le soleil',
    'Stores et volets roulants sollicités quotidiennement en période estivale',
    'Joints de carrelage extérieur dégradés par l\'alternance chaleur/pluies violentes',
    'Végétation envahissante (racines, lierre) fragilisant les murs et canalisations',
  ],
  'montagnard': [
    'Surcharge de neige sur les toitures et charpentes',
    'Gel prolongé imposant des installations antigel sur les canalisations',
    'Isolation renforcée indispensable face au froid durable',
    'Accessibilité des chantiers limitée en hiver',
    'Bois de charpente soumis à d\'importants écarts d\'humidité',
    'Fondations exposées aux mouvements de terrain liés au dégel printanier',
    'Gouttières et descentes d\'eau pluviale endommagées par le gel et la neige',
    'Menuiseries extérieures déformées par les températures extrêmes',
  ],
  'semi-oceanique': [
    'Alternance de périodes humides et sèches sollicitant les façades',
    'Chauffage nécessaire 6 à 7 mois par an',
    'Condensation fréquente dans les logements mal ventilés',
    'Joints et enduits à surveiller face à l\'humidité récurrente',
    'Toitures soumises à des précipitations régulières modérées',
    'Mousses sur les terrasses et allées nécessitant un nettoyage saisonnier',
    'Charpentes à contrôler régulièrement contre les infiltrations lentes',
    'Peintures extérieures ternies par l\'humidité et le manque d\'ensoleillement',
  ],
  'tropical': [
    'Humidité constante et risques de moisissures dans les logements',
    'Corrosion accélérée des métaux par l\'air salin',
    'Climatisation indispensable nécessitant un entretien régulier',
    'Constructions soumises aux risques cycloniques',
    'Termites et insectes xylophages attaquant les bois de structure',
    'Peintures et enduits dégradés rapidement par l\'humidité et les UV intenses',
    'Installations électriques à protéger contre la foudre et les surtensions',
    'Étanchéité des toitures-terrasses mise à rude épreuve par les pluies diluviennes',
  ],
}

const HOUSING_DESCRIPTIONS: Record<HousingStock, string[]> = {
  'ancien-pierre': [
    'Le parc immobilier est dominé par des constructions en pierre locale, témoignage d\'un riche patrimoine architectural. Murs épais, charpentes traditionnelles et caves voûtées caractérisent ces habitations qui nécessitent des artisans maîtrisant les techniques de rénovation du bâti ancien.',
    'L\'habitat ancien en pierre constitue le cœur du patrimoine bâti du département. Ces constructions, souvent antérieures au XXᵉ siècle, présentent des qualités thermiques naturelles mais requièrent une rénovation respectueuse des matériaux d\'origine.',
    'Les constructions traditionnelles en pierre du département reflètent l\'identité locale. Toitures en ardoise ou en tuile, murs en moellon ou pierre de taille : chaque intervention doit préserver ce caractère tout en améliorant le confort moderne.',
  ],
  'apres-guerre': [
    'Le département compte une proportion significative de logements construits entre 1950 et 1980. Ces immeubles collectifs et pavillons standardisés arrivent à un âge où la rénovation énergétique (isolation, chauffage, fenêtres) devient prioritaire.',
    'L\'habitat d\'après-guerre domine dans les zones urbaines du département. Construits rapidement, ces logements présentent une isolation insuffisante et des équipements vieillissants. La rénovation globale est le meilleur investissement.',
    'Les logements des Trente Glorieuses, nombreux dans le département : béton armé, isolation minimale, chauffage collectif. Les artisans locaux maîtrisent les spécificités de ce bâti et les aides disponibles pour sa rénovation.',
  ],
  'moderne': [
    'Le parc immobilier du département a bénéficié d\'un développement récent avec de nombreuses constructions conformes aux normes thermiques modernes. Les travaux portent sur la personnalisation des intérieurs, l\'installation de climatisation et la domotique.',
    'L\'attractivité du département se traduit par un parc de logements récents et bien isolés. Les besoins portent sur l\'équipement (borne de recharge, panneaux solaires) et l\'aménagement intérieur plutôt que sur la rénovation lourde.',
    'Le dynamisme démographique du département a généré un parc immobilier contemporain, conforme aux dernières normes. Les artisans interviennent pour des projets de personnalisation, d\'extension et d\'optimisation énergétique.',
  ],
  'mixte-urbain': [
    'Le département présente un parc immobilier hétérogène : immeubles anciens en centre-ville, logements collectifs d\'après-guerre en première couronne, et pavillons modernes en périphérie. Chaque type exige un savoir-faire adapté.',
    'La diversité du parc immobilier reflète plusieurs siècles d\'urbanisation. Du bâti historique aux résidences récentes, les artisans locaux doivent maîtriser des techniques variées, de la restauration patrimoniale à l\'installation domotique.',
    'En zone urbaine dense, le département mêle constructions de toutes époques. Cette diversité exige des artisans une polyvalence technique : rénovation de moulures anciennes, isolation de murs en béton, ou finitions haut de gamme dans le neuf.',
  ],
  'rural-traditionnel': [
    'L\'habitat rural domine le paysage du département : longères, corps de ferme, maisons de caractère en matériaux locaux. Ces constructions nécessitent des artisans connaissant les techniques anciennes (enduits à la chaux, charpentes traditionnelles).',
    'Le département conserve un patrimoine rural riche : granges à rénover, maisons à colombages, fermes en pierre. La rénovation attire de nouveaux habitants mais exige des artisans formés au bâti ancien.',
    'L\'habitat dispersé du département se compose de constructions traditionnelles en matériaux locaux. Rénovations fréquentes : isolation par l\'intérieur, remplacement des huisseries, mise aux normes des réseaux.',
  ],
}

type DeptIntroFn = (name: string, code: string, region: string, pop: string, chefLieu: string, climate: string, economy: string, housing: string) => string
const DEPT_INTROS: DeptIntroFn[] = [
  (name, code, region, pop, chefLieu, climate, economy, housing) =>
    `Le ${name} (${code}), en ${region}, abrite ${pop} habitants avec ${chefLieu} pour chef-lieu. Caractérisé par un ${climate.toLowerCase()} et une ${economy.toLowerCase()}, le département présente un parc immobilier de type ${housing.toLowerCase()}. Les artisans du ${code} adaptent leurs interventions à ces spécificités.`,
  (name, code, region, pop, _chefLieu, climate, economy, housing) =>
    `Trouver un artisan qualifié dans le ${name} (${code}) nécessite de comprendre les particularités du département. En ${region}, ce territoire de ${pop} habitants bénéficie d'un ${climate.toLowerCase()} influençant les besoins en artisanat. L'${economy.toLowerCase()} et le ${housing.toLowerCase()} orientent les interventions prioritaires.`,
  (name, code, region, pop, chefLieu, climate, economy, housing) =>
    `Le département du ${name} (${code}), dont le chef-lieu est ${chefLieu}, se situe en ${region}. Avec ${pop} habitants, il conjugue ${climate.toLowerCase()} et ${economy.toLowerCase()}. Le ${housing.toLowerCase()} impose aux artisans locaux une expertise adaptée aux constructions dominantes.`,
  (name, code, region, pop, _chefLieu, climate, economy, housing) =>
    `Vous recherchez un artisan dans le ${name} ? Ce département de ${pop} habitants en ${region} (${code}) se distingue par son ${climate.toLowerCase()}, son ${economy.toLowerCase()} et un parc de ${housing.toLowerCase()}. Notre annuaire référence les professionnels correspondant à ces caractéristiques.`,
  (name, code, region, pop, chefLieu, climate, _economy, housing) =>
    `Le ${name} (${code}) en ${region} compte ${pop} habitants autour de son chef-lieu ${chefLieu}. Son ${climate.toLowerCase()} conditionne les besoins en isolation, chauffage et entretien. Le ${housing.toLowerCase()} demande des artisans compétents et habitués au contexte local.`,
  (name, code, region, pop, _chefLieu, climate, economy, housing) =>
    `Département de ${pop} habitants en ${region}, le ${name} (${code}) présente un profil artisanal marqué par son ${climate.toLowerCase()} et son ${economy.toLowerCase()}. Le ${housing.toLowerCase()} génère des besoins spécifiques que nos artisans référencés maîtrisent.`,
  (name, code, region, pop, chefLieu, climate, economy, housing) =>
    `Dans le ${name} (${code}), les ${pop} habitants de la ${region} comptent sur un réseau d'artisans qualifiés. Le ${climate.toLowerCase()} et l'${economy.toLowerCase()} façonnent la demande, tandis que le ${housing.toLowerCase()} guide les interventions. ${chefLieu} concentre une part importante de l'activité.`,
  (name, code, region, pop, chefLieu, climate, economy, housing) =>
    `Le ${name} (${code}), rattaché à la ${region}, est un territoire de ${pop} habitants dont le chef-lieu est ${chefLieu}. Entre ${climate.toLowerCase()} et ${economy.toLowerCase()}, le département accueille un ${housing.toLowerCase()} aux besoins variés.`,
  (name, code, region, pop, _chefLieu, climate, economy, housing) =>
    `Avec ${pop} habitants dans le ${name} (${code}), ce département de la ${region} offre un marché de l'artisanat dynamique. Le ${climate.toLowerCase()} influence les chantiers, l'${economy.toLowerCase()} soutient la demande, et le ${housing.toLowerCase()} oriente les spécialités sollicitées.`,
  (name, code, region, pop, chefLieu, climate, _economy, housing) =>
    `Le ${name}, département ${code} de la ${region}, regroupe ${pop} habitants avec ${chefLieu} comme préfecture. Le ${climate.toLowerCase()} impacte l'usure des bâtiments. Le ${housing.toLowerCase()} requiert des artisans formés aux techniques adaptées.`,
]

const DEPT_TIPS: Record<ClimateZone, ((name: string, code: string) => string)[]> = {
  'oceanique': [
    (name, code) => `Dans le ${name} (${code}), l'humidité est l'ennemi principal du bâti. Privilégiez une VMC performante et des traitements anti-humidité réguliers. Les façades exposées à l'ouest subissent davantage d'intempéries — un ravalement tous les 10-15 ans est recommandé.`,
    (name) => `Le climat océanique du ${name} appelle un entretien régulier des toitures (démoussage annuel), des gouttières (nettoyage biannuel) et des menuiseries. Investir dans des matériaux résistants à l'humidité réduit les coûts de maintenance à long terme.`,
    (name, code) => `Les vents marins dans le ${name} (${code}) chargent l'air de sel et d'humidité, accélérant la corrosion des métaux et le ternissement des façades. Optez pour des menuiseries aluminium laquées ou PVC, plus résistantes que le bois brut dans ce contexte.`,
    (name) => `L'isolation par l'extérieur (ITE) est particulièrement recommandée dans le ${name} en climat océanique : elle protège les murs des infiltrations tout en réduisant les ponts thermiques. Les artisans locaux maîtrisent la pose de bardages ventilés adaptés.`,
    (name, code) => `Dans le ${name} (${code}), les remontées capillaires dans les maisons anciennes sont fréquentes. Un diagnostic humidité avant travaux est essentiel : injection de résine hydrophobe, drainage périphérique ou cuvelage selon la gravité. Consultez un professionnel qualifié.`,
  ],
  'continental': [
    (name, code) => `Le climat continental du ${name} (${code}) impose des contraintes thermiques majeures. L'isolation des combles et murs est le premier investissement rentable — les économies de chauffage remboursent l'investissement en 5-8 ans. Protégez les canalisations extérieures contre le gel.`,
    (name) => `Dans le ${name}, les écarts de température entre été et hiver sollicitent les matériaux. Vérifiez joints de dilatation, enduits de façade et chauffage avant chaque hiver. Un entretien de chaudière annuel est obligatoire.`,
    (name, code) => `Les gelées tardives dans le ${name} (${code}) peuvent endommager les canalisations extérieures et les compteurs d'eau. Avant l'hiver, purgez les circuits non chauffés et isolez les tuyaux exposés avec des manchons calorifuges.`,
    (name) => `L'amplitude thermique annuelle du ${name} (parfois 40°C entre hiver et été) commande le choix de matériaux à faible coefficient de dilatation. Les revêtements de sol, enduits et joints doivent absorber ces variations sans fissurer.`,
    (name, code) => `Dans le ${name} (${code}), la pompe à chaleur air-eau est le système de chauffage le plus recommandé : performante par grand froid grâce aux modèles basse température, elle permet des économies de 50-70% par rapport au fioul. Vérifiez le COP à -15°C avant d'investir.`,
  ],
  'mediterraneen': [
    (name, code) => `Le climat méditerranéen du ${name} (${code}) impose deux priorités : la protection contre la chaleur estivale (volets, isolation, climatisation) et la gestion des épisodes de pluies intenses. Les artisans locaux connaissent les matériaux adaptés au soleil intense.`,
    (name) => `Dans le ${name}, l'ensoleillement intense accélère le vieillissement des peintures et joints. Optez pour des revêtements haute résistance UV. Les épisodes cévenols exigent des gouttières surdimensionnées et une étanchéité irréprochable.`,
    (name, code) => `La sécheresse estivale dans le ${name} (${code}) provoque le retrait-gonflement des argiles, première cause de sinistres sur maisons individuelles. Un diagnostic géotechnique et des fondations adaptées sont indispensables pour construire ou rénover.`,
    (name) => `L'isolation par l'extérieur en enduit clair est idéale dans le ${name} : elle réduit la surchauffe estivale de 5 à 8°C et offre un confort d'été sans climatisation excessive. Combinée à des brise-soleil, c'est la solution la plus performante.`,
    (name, code) => `Les terrasses et toitures-terrasses dans le ${name} (${code}) nécessitent une étanchéité renforcée avec des membranes PVC ou EPDM résistantes aux UV. Prévoyez des évacuations surdimensionnées : les pluies méditerranéennes peuvent déverser 100 mm en une heure.`,
  ],
  'montagnard': [
    (name, code) => `En montagne dans le ${name} (${code}), la surcharge de neige dimensionne la charpente et l'isolation doit être renforcée (R > 7 en combles). Planifiez vos travaux entre mai et octobre. Le bois de charpente doit être traité contre l'humidité.`,
    (name) => `Le ${name} en altitude présente des contraintes spécifiques : matériaux résistants au gel, isolation thermique renforcée, chaudière performante. Les artisans locaux maîtrisent les normes de construction en zone montagne et les aides spécifiques.`,
    (name, code) => `Dans le ${name} (${code}), le déneigement des toitures est une obligation de sécurité au-delà de 40 cm d'accumulation. Prévoyez des crochets pare-neige et des gouttières chauffantes pour éviter les dégâts liés aux redoux brutaux.`,
    (name) => `Le triple vitrage est rentable dans le ${name} en zone montagnarde : le surcoût de 15-20% par rapport au double vitrage est amorti en 6-8 ans par les économies de chauffage. Associez-le à des volets bois pour une isolation maximale.`,
    (name, code) => `Les fondations dans le ${name} (${code}) doivent descendre sous la profondeur de gel (80 cm à 1,20 m selon l'altitude). Un vide sanitaire ventilé protège la dalle contre l'humidité du sol. Choisissez un artisan habitué aux normes montagne.`,
  ],
  'semi-oceanique': [
    (name, code) => `Le climat tempéré du ${name} (${code}) facilite les travaux toute l'année, avec une attention particulière en hiver pour le chauffage et la ventilation. L'humidité modérée nécessite une VMC efficace. Les artisans connaissent les spécificités locales.`,
    (name) => `Dans le ${name}, le climat semi-océanique offre des conditions favorables à la plupart des chantiers. Les périodes de gel obligent à reporter la maçonnerie extérieure. Profitez du printemps et de l'automne pour les ravalements.`,
    (name, code) => `L'humidité modérée du ${name} (${code}) favorise le développement de mousses sur les toitures et façades nord. Un traitement préventif biannuel au printemps et à l'automne évite les dégradations coûteuses à long terme.`,
    (name) => `Dans le ${name}, la VMC hygroréglable de type B est le meilleur compromis : elle adapte le débit aux besoins réels de chaque pièce, réduisant les déperditions thermiques de 10-15% par rapport à une VMC autoréglable.`,
    (name, code) => `Le ${name} (${code}) bénéficie de conditions idéales pour la rénovation énergétique globale : isolation + ventilation + chauffage. Les aides MaPrimeRénov' en rénovation d'ampleur couvrent jusqu'à 90% des travaux pour les ménages modestes.`,
  ],
  'tropical': [
    (name, code) => `Le climat tropical du ${name} (${code}) impose des normes spécifiques : résistance aux cyclones, protection anti-termites, ventilation naturelle renforcée. Faites vérifier la structure de votre habitation avant la saison cyclonique.`,
    (name) => `Dans le ${name}, l'humidité permanente et la chaleur accélèrent le vieillissement des constructions. Traitements anti-corrosion, peintures fongicides, bois traité classe 4 : les matériaux doivent être adaptés au climat tropical.`,
    (name, code) => `Les termites sont un fléau majeur dans le ${name} (${code}). Le diagnostic termites est obligatoire avant toute vente, et un traitement préventif du bâti (barrière chimique ou pièges) protège votre investissement pour 10 ans.`,
    (name) => `La ventilation naturelle traversante est le premier levier de confort dans le ${name}. Avant d'investir dans la climatisation, assurez-vous que votre habitation bénéficie d'ouvertures opposées et d'un bon brassage d'air.`,
    (name, code) => `En zone cyclonique dans le ${name} (${code}), les menuiseries doivent résister à des vents de 250 km/h. Volets cycloniques, ancrages renforcés et toiture solidarisée : faites vérifier votre habitation par un professionnel agréé avant chaque saison.`,
  ],
}

const DEPT_FAQ_POOL: { q: (name: string, code: string) => string; a: (name: string, code: string, region: string, pop: string, climate: string, issues: string[]) => string }[] = [
  { q: (name, code) => `Combien d'artisans sont référencés dans le ${name} (${code}) ?`, a: (name, code, region) => `Le ${name} (${code}) en ${region} fait partie de notre réseau d'artisans référencés à partir des données SIREN officielles de l'INSEE.` },
  { q: (name) => `Quels sont les travaux les plus demandés dans le ${name} ?`, a: (name, _code, _region, _pop, climate, issues) => `Le ${climate.toLowerCase()} du ${name} génère des besoins spécifiques : ${issues.slice(0, 3).join(', ').toLowerCase()}. Les artisans locaux proposent des solutions éprouvées.` },
  { q: (name, code) => `Comment obtenir un devis gratuit dans le ${name} (${code}) ?`, a: (name) => `Choisissez le service, indiquez votre ville dans le ${name}, et décrivez votre projet. Vous recevrez jusqu'à 3 propositions d'artisans qualifiés. Service 100% gratuit et sans engagement.` },
  { q: (name) => `Les artisans du ${name} sont-ils assurés ?`, a: (name, _code, region) => `Les artisans du ${name} (${region}) sont tenus de disposer d'une assurance décennale et d'une RC pro. Exigez une attestation à jour avant les travaux.` },
  { q: (name) => `Quel est le délai moyen pour des travaux dans le ${name} ?`, a: (name) => `Dans le ${name}, comptez 1-4h pour une urgence, 1-3 semaines pour des travaux planifiés, et 2-4 mois pour une rénovation complète.` },
  { q: (name) => `Quelles aides financières sont disponibles dans le ${name} ?`, a: (name, code, region) => `Les habitants du ${name} (${code}) peuvent bénéficier de MaPrimeRénov', éco-PTZ, CEE, et aides locales de la ${region}. Travaux réalisés par un artisan RGE.` },
  { q: (name) => `Comment le climat influence-t-il les travaux dans le ${name} ?`, a: (name, _code, _region, _pop, climate, issues) => `Le ${climate.toLowerCase()} du ${name} impacte le bâti : ${issues.slice(0, 2).join(' ; ').toLowerCase()}. Les artisans adaptent techniques et matériaux à ces contraintes.` },
  { q: (name) => `Peut-on trouver un artisan en urgence dans le ${name} ?`, a: (name) => `Certains artisans du ${name} proposent des interventions d'urgence pour les situations critiques : fuite, panne électrique, serrure bloquée, chauffage défaillant. Les délais varient selon les disponibilités et la localisation.` },
  { q: (name) => `Quel type de bâti domine dans le ${name} ?`, a: (name, _code, _region, _pop, _climate, issues) => `Le parc du ${name} est varié, avec des problématiques récurrentes : ${issues.slice(0, 3).join(', ').toLowerCase()}. L'importance de choisir un artisan expérimenté localement.` },
  { q: (name) => `Comment vérifier un artisan dans le ${name} ?`, a: (name) => `Vérifiez son SIRET actif, demandez assurance décennale et RC pro, consultez les avis, exigez un devis détaillé signé. Les certifiés RGE ou Qualibat offrent des garanties supplémentaires dans le ${name}.` },
  { q: (name) => `Combien coûte un artisan dans le ${name} ?`, a: (name, code, region) => `Dans le ${name} (${code}), comptez 45-90 €/h selon la spécialité. En ${region}, demandez plusieurs devis pour comparer. Tarifs incluant généralement le déplacement.` },
  { q: (name) => `Faut-il des autorisations pour rénover dans le ${name} ?`, a: (name) => `Les travaux intérieurs ne nécessitent généralement aucune autorisation dans le ${name}. Les modifications de façade ou extensions exigent une déclaration préalable. Consultez le PLU.` },
  { q: () => `Les devis sont-ils gratuits et sans engagement ?`, a: (name) => `Oui, les devis via ServicesArtisans pour le ${name} sont gratuits et sans engagement. Comparez jusqu'à 3 propositions de professionnels qualifiés.` },
  { q: (name) => `Quelles certifications rechercher dans le ${name} ?`, a: (name) => `Dans le ${name}, privilégiez : RGE (aides rénovation), Qualibat (qualification), QualiPV (solaire), QualiBois et QualiPAC (chauffage). Vérifiez la validité sur les annuaires officiels.` },
  { q: (name) => `Comment planifier une rénovation dans le ${name} ?`, a: (name) => `Pour rénover dans le ${name}, commencez par un audit énergétique. Définissez les priorités : gros œuvre, réseaux, isolation, finitions. Un maître d'œuvre peut coordonner (8-12% du montant).` },
]

// Real economy mapping by department code (based on actual French economic data)
const TERTIAIRE_DEPTS = new Set(['75','92','93','94','78','91','95','77','69','13','33','31','44','67','34','06','35','59','76','42','38','63','57','54','30','83'])
const INDUSTRIEL_DEPTS = new Set(['08','10','25','39','71','90','70','68','62','02','60','80','27','55','88'])
const AGRICOLE_DEPTS = new Set(['32','40','47','28','41','45','36','18','03','15','43','46','48','12','82','81','16','79','86','23','87','19','24','58','89','21','52','51'])
const TOURISTIQUE_DEPTS = new Set(['2A','2B','73','74','05','04','11','66','64','17','50','22','29','56','85'])

function getDeptEconomy(code: string): EconomyType {
  if (TERTIAIRE_DEPTS.has(code)) return 'tertiaire'
  if (INDUSTRIEL_DEPTS.has(code)) return 'industriel'
  if (AGRICOLE_DEPTS.has(code)) return 'agricole'
  if (TOURISTIQUE_DEPTS.has(code)) return 'touristique'
  return 'mixte'
}

// Real housing stock mapping by department code (based on INSEE building age data)
const ANCIEN_PIERRE_DEPTS = new Set(['24','46','12','19','48','15','23','87','16','79','86','36','18','03','43','07','26','04','05','09','32','47','82','81','11','2A','2B'])
const APRES_GUERRE_DEPTS = new Set(['59','62','93','94','57','54','55','88','80','02','60','76','27','08','10','51','52','70','90','25','39','71'])
const MODERNE_DEPTS = new Set(['78','91','95','77','34','31','33','44','35','49','37','45','28','41','85','72','53','01','74','38'])
const MIXTE_URBAIN_DEPTS = new Set(['75','92','69','13','06','83','30','66','64','40','17','42','63','67','68'])

function getDeptHousing(code: string): HousingStock {
  if (ANCIEN_PIERRE_DEPTS.has(code)) return 'ancien-pierre'
  if (APRES_GUERRE_DEPTS.has(code)) return 'apres-guerre'
  if (MODERNE_DEPTS.has(code)) return 'moderne'
  if (MIXTE_URBAIN_DEPTS.has(code)) return 'mixte-urbain'
  return 'rural-traditionnel'
}

function getDepartementProfile(dept: import('@/lib/data/france').Departement): DepartementProfile {
  const climateKey = DEPT_CLIMATE_OVERRIDES[dept.code] || REGION_CLIMATE[dept.region] || 'semi-oceanique'
  const finalClimate = CLIMATES.find(c => c.key === climateKey) || CLIMATES[4]

  const economyKey = getDeptEconomy(dept.code)
  const economy = ECONOMIES.find(e => e.key === economyKey) || ECONOMIES[4]
  const housingKey = getDeptHousing(dept.code)
  const housing = HOUSINGS.find(h => h.key === housingKey) || HOUSINGS[3]

  // Hash-select 5 issues from 8 for variety across departments
  const allIssues = CLIMATE_ISSUES[finalClimate.key]
  const issueSeed = Math.abs(hashCode(`dept-issues-${dept.code}`))
  const selectedIssues: string[] = []
  const used = new Set<number>()
  let s = issueSeed
  while (selectedIssues.length < 5 && selectedIssues.length < allIssues.length) {
    const idx = s % allIssues.length
    if (!used.has(idx)) { used.add(idx); selectedIssues.push(allIssues[idx]) }
    s = Math.abs(hashCode(`di${s}-${selectedIssues.length}`))
  }

  return {
    climate: finalClimate.key, climateLabel: finalClimate.label,
    economy: economy.key, economyLabel: economy.label,
    housing: housing.key, housingLabel: housing.label,
    topServiceSlugs: DEPT_SERVICE_PRIORITY[finalClimate.key],
    climaticIssues: selectedIssues,
  }
}

export function generateDepartementContent(dept: import('@/lib/data/france').Departement): DepartementContent {
  const seed = Math.abs(hashCode(`dept-${dept.slug}`))
  const profile = getDepartementProfile(dept)

  const introFn = DEPT_INTROS[seed % DEPT_INTROS.length]
  const intro = introFn(dept.name, dept.code, dept.region, dept.population, dept.chefLieu, profile.climateLabel, profile.economyLabel, profile.housingLabel)

  const housingDescs = HOUSING_DESCRIPTIONS[profile.housing]
  const contexteHabitat = housingDescs[Math.abs(hashCode(`hab-${dept.slug}`)) % housingDescs.length]

  const multiplier = getRegionalMultiplier(dept.region)
  const pricingLines = profile.topServiceSlugs.slice(0, 5).map(slug => {
    const t = getTradeContent(slug)
    if (!t) return null
    const min = Math.round(t.priceRange.min * multiplier)
    const max = Math.round(t.priceRange.max * multiplier)
    return `${t.name} : ${min}–${max} ${t.priceRange.unit}`
  }).filter(Boolean)

  const servicesPrioritaires = `Dans le ${dept.name} (${dept.code}), le ${profile.climateLabel.toLowerCase()} et le ${profile.housingLabel.toLowerCase()} orientent les besoins. Services les plus sollicités : ${pricingLines.join(' · ')}. Tarifs indicatifs pour la ${dept.region}, variant selon complexité et urgence.`

  const tipTemplates = DEPT_TIPS[profile.climate]
  const conseilsDepartement = tipTemplates[Math.abs(hashCode(`tips-dept-${dept.slug}`)) % tipTemplates.length](dept.name, dept.code)

  const faqIndices: number[] = []
  let faqSeed = Math.abs(hashCode(`faq-dept-${dept.slug}`))
  while (faqIndices.length < 4) {
    const idx = faqSeed % DEPT_FAQ_POOL.length
    if (!faqIndices.includes(idx)) faqIndices.push(idx)
    faqSeed = Math.abs(hashCode(`faq${faqSeed}-dept-${faqIndices.length}`))
  }
  const faqItems = faqIndices.map(idx => {
    const f = DEPT_FAQ_POOL[idx]
    return { question: f.q(dept.name, dept.code), answer: f.a(dept.name, dept.code, dept.region, dept.population, profile.climateLabel, profile.climaticIssues) }
  })

  return { profile, intro, contexteHabitat, servicesPrioritaires, conseilsDepartement, faqItems }
}

// ---------------------------------------------------------------------------
// Région page content — programmatic SEO with geographic & economic profiles
// ---------------------------------------------------------------------------

type GeoType = 'littoral' | 'montagne' | 'plaine' | 'insulaire' | 'mixte-geo'
type RegionalEconomy = 'metropole-services' | 'industrie-reconversion' | 'agriculture-viticulture' | 'tourisme-patrimoine' | 'economie-diversifiee'

export interface RegionProfile {
  climate: ClimateZone
  climateLabel: string
  geoType: GeoType
  geoLabel: string
  economy: RegionalEconomy
  economyLabel: string
  topServiceSlugs: string[]
  keyFacts: string[]
}

export interface RegionContent {
  profile: RegionProfile
  intro: string
  contexteRegional: string
  servicesPrioritaires: string
  conseilsRegion: string
  faqItems: { question: string; answer: string }[]
}

const GEO_TYPES: { key: GeoType; label: string }[] = [
  { key: 'littoral', label: 'Façade littorale' },
  { key: 'montagne', label: 'Relief montagneux' },
  { key: 'plaine', label: 'Plaines et vallées' },
  { key: 'insulaire', label: 'Territoire insulaire' },
  { key: 'mixte-geo', label: 'Géographie variée' },
]

const REGIONAL_ECONOMIES_LIST: { key: RegionalEconomy; label: string }[] = [
  { key: 'metropole-services', label: 'Économie métropolitaine et tertiaire' },
  { key: 'industrie-reconversion', label: 'Industrie en reconversion' },
  { key: 'agriculture-viticulture', label: 'Agriculture et viticulture' },
  { key: 'tourisme-patrimoine', label: 'Tourisme et patrimoine' },
  { key: 'economie-diversifiee', label: 'Économie diversifiée' },
]

const REGION_GEO: Record<string, GeoType> = {
  'ile-de-france': 'plaine', 'bretagne': 'littoral', 'normandie': 'littoral',
  'pays-de-la-loire': 'littoral', 'hauts-de-france': 'plaine', 'grand-est': 'plaine',
  'bourgogne-franche-comte': 'mixte-geo', 'centre-val-de-loire': 'plaine',
  'provence-alpes-cote-azur': 'mixte-geo', 'occitanie': 'mixte-geo', 'corse': 'insulaire',
  'auvergne-rhone-alpes': 'montagne', 'nouvelle-aquitaine': 'littoral',
  'guadeloupe': 'insulaire', 'martinique': 'insulaire', 'guyane': 'plaine',
  'la-reunion': 'insulaire', 'mayotte': 'insulaire',
}

const REGION_ECONOMY: Record<string, RegionalEconomy> = {
  'ile-de-france': 'metropole-services', 'bretagne': 'agriculture-viticulture',
  'normandie': 'industrie-reconversion', 'pays-de-la-loire': 'economie-diversifiee',
  'hauts-de-france': 'industrie-reconversion', 'grand-est': 'industrie-reconversion',
  'bourgogne-franche-comte': 'agriculture-viticulture', 'centre-val-de-loire': 'agriculture-viticulture',
  'provence-alpes-cote-azur': 'tourisme-patrimoine', 'occitanie': 'tourisme-patrimoine',
  'corse': 'tourisme-patrimoine', 'auvergne-rhone-alpes': 'economie-diversifiee',
  'nouvelle-aquitaine': 'economie-diversifiee', 'guadeloupe': 'tourisme-patrimoine',
  'martinique': 'tourisme-patrimoine', 'guyane': 'economie-diversifiee',
  'la-reunion': 'tourisme-patrimoine', 'mayotte': 'economie-diversifiee',
}

const GEO_FACTS: Record<GeoType, string[]> = {
  'littoral': [
    'L\'air salin accélère la corrosion des métaux et l\'usure des peintures extérieures',
    'Les constructions doivent résister aux vents forts et aux embruns marins',
    'Le taux d\'humidité élevé impose une ventilation renforcée des logements',
    'Les terrains littoraux sont soumis à la loi Littoral',
    'La demande saisonnière crée des pics d\'activité pour les artisans',
  ],
  'montagne': [
    'La surcharge de neige dimensionne les charpentes et impose des normes spécifiques',
    'Les constructions doivent résister à des températures très basses en hiver',
    'L\'accessibilité des chantiers est limitée pendant la saison hivernale',
    'Le bois traditionnel nécessite des traitements adaptés',
    'L\'isolation thermique renforcée est indispensable pour le confort',
  ],
  'plaine': [
    'Le parc immobilier bénéficie de conditions de construction favorables',
    'Les sols argileux peuvent provoquer des mouvements de terrain',
    'L\'urbanisation concentre des logements d\'après-guerre à rénover',
    'L\'absence de relief facilite les travaux de toiture et façade',
    'La nappe phréatique proche peut poser des problèmes d\'humidité',
  ],
  'insulaire': [
    'L\'insularité renchérit le coût des matériaux importés',
    'Le climat spécifique exige des matériaux adaptés',
    'Les normes tiennent compte des risques sismiques et cycloniques',
    'Les artisans locaux maîtrisent des techniques spécifiques au territoire',
    'La protection du patrimoine naturel influence les choix architecturaux',
  ],
  'mixte-geo': [
    'La diversité géographique requiert une grande variété de techniques',
    'Les artisans s\'adaptent aux contraintes de chaque zone',
    'Le parc immobilier reflète la variété des terrains et des climats',
    'Les matériaux locaux varient selon les territoires',
    'Les réglementations d\'urbanisme diffèrent entre zones côtières et intérieures',
  ],
}

const REGION_CONTEXTS: Record<RegionalEconomy, ((name: string, deptCount: number, cityCount: number) => string)[]> = {
  'metropole-services': [
    (name, deptCount, cityCount) => `La région ${name}, pôle tertiaire majeur, regroupe ${deptCount} départements et ${cityCount} villes. L'activité économique soutenue génère une forte demande en artisanat : rénovation d'appartements, aménagement de bureaux, entretien d'immeubles collectifs.`,
    (name, deptCount, cityCount) => `En ${name}, l'économie métropolitaine concentre une population active importante sur ${deptCount} départements. Les ${cityCount} villes couvertes accueillent un parc de logements sous tension : la rénovation est un enjeu majeur.`,
    (name, deptCount, cityCount) => `Première région économique, ${name} conjugue densité urbaine et dynamisme immobilier. Avec ${deptCount} départements et ${cityCount} villes, la compétition entre artisans est un gage de qualité et de réactivité.`,
    (name, deptCount, cityCount) => `Le marché immobilier tendu de ${name} pousse les propriétaires à rénover plutôt qu'acheter. Sur ${deptCount} départements et ${cityCount} villes, les artisans répondent à une demande croissante en rénovation d'intérieur et mise aux normes.`,
    (name, deptCount, cityCount) => `Avec ${deptCount} départements et ${cityCount} villes, ${name} concentre le plus grand bassin de professionnels du bâtiment en France. La densité de population et le parc tertiaire créent un marché artisanal où l'expertise et la disponibilité font la différence.`,
  ],
  'industrie-reconversion': [
    (name, deptCount, cityCount) => `La région ${name} vit une reconversion de son tissu industriel. Ses ${deptCount} départements et ${cityCount} villes concentrent un parc immobilier de la période industrielle nécessitant une rénovation profonde.`,
    (name, deptCount, cityCount) => `En ${name}, l'héritage industriel a façonné l'habitat : logements ouvriers, grands ensembles. Les ${deptCount} départements (${cityCount} villes) offrent un potentiel de rénovation considérable.`,
    (name, deptCount, cityCount) => `Le dynamisme de reconversion de ${name} se traduit par une forte demande en rénovation sur ${deptCount} départements et ${cityCount} villes.`,
    (name, deptCount, cityCount) => `Les programmes de réhabilitation urbaine en ${name} transforment les friches industrielles en logements et espaces de vie. Les artisans des ${deptCount} départements (${cityCount} villes) maîtrisent la reconversion de bâtiments anciens.`,
    (name, deptCount, cityCount) => `La transition écologique de ${name} stimule la rénovation énergétique des logements ouvriers et HLM sur ${deptCount} départements. Les ${cityCount} villes couvertes bénéficient d'aides spécifiques aux territoires en reconversion.`,
  ],
  'agriculture-viticulture': [
    (name, deptCount, cityCount) => `La région ${name}, terre de terroir, présente un patrimoine bâti rural riche sur ses ${deptCount} départements. Les ${cityCount} villes référencent des artisans spécialisés en habitat traditionnel : longères, corps de ferme, maisons de vignerons.`,
    (name, deptCount, cityCount) => `En ${name}, l'économie agricole a façonné un paysage architectural unique. Les ${deptCount} départements abritent un patrimoine que les artisans des ${cityCount} villes savent restaurer.`,
    (name, deptCount, cityCount) => `Le caractère agricole de ${name} se reflète dans son habitat : constructions en matériaux locaux, villages de caractère. Les artisans des ${deptCount} départements (${cityCount} villes) maîtrisent ce patrimoine rural.`,
    (name, deptCount, cityCount) => `L'attractivité résidentielle de ${name} attire des néo-ruraux qui rénovent granges, moulins et dépendances agricoles. Les artisans des ${deptCount} départements (${cityCount} villes) allient savoir-faire traditionnel et techniques modernes.`,
    (name, deptCount, cityCount) => `Le patrimoine viticole et agricole de ${name} génère des chantiers spécifiques : rénovation de chais, isolation de longères, restauration de toitures en tuiles plates. ${deptCount} départements et ${cityCount} villes concentrent des artisans experts.`,
  ],
  'tourisme-patrimoine': [
    (name, deptCount, cityCount) => `La région ${name}, destination touristique majeure, conjugue patrimoine exceptionnel et exigences d'accueil. Les ${deptCount} départements et ${cityCount} villes abritent des artisans rompus à la restauration patrimoniale.`,
    (name, deptCount, cityCount) => `En ${name}, tourisme et patrimoine appellent un niveau d'exigence élevé. Les ${deptCount} départements (${cityCount} villes) concentrent des artisans habitués aux contraintes patrimoniales.`,
    (name, deptCount, cityCount) => `L'attractivité touristique de ${name} soutient une forte demande en artisanat de qualité sur ses ${deptCount} départements et ${cityCount} villes.`,
    (name, deptCount, cityCount) => `Les résidences secondaires en ${name} représentent un marché important pour les artisans locaux. Sur ${deptCount} départements et ${cityCount} villes, la rénovation haut de gamme et l'entretien saisonnier alimentent l'activité tout au long de l'année.`,
    (name, deptCount, cityCount) => `Le classement au patrimoine de nombreux sites en ${name} impose des contraintes spécifiques : matériaux d'origine, techniques traditionnelles, validation par les ABF. Les artisans des ${deptCount} départements (${cityCount} villes) maîtrisent ces exigences.`,
  ],
  'economie-diversifiee': [
    (name, deptCount, cityCount) => `La région ${name} bénéficie d'une économie diversifiée soutenant un marché artisanal dynamique. Ses ${deptCount} départements et ${cityCount} villes accueillent un parc immobilier varié.`,
    (name, deptCount, cityCount) => `En ${name}, la diversité économique se traduit par un marché de rénovation actif. Les ${deptCount} départements mêlent zones industrielles, pôles technologiques et espaces agricoles. ${cityCount} villes offrent un large choix de professionnels.`,
    (name, deptCount, cityCount) => `Le tissu économique diversifié de ${name} nourrit une demande artisanale soutenue sur ses ${deptCount} départements (${cityCount} villes).`,
    (name, deptCount, cityCount) => `La croissance démographique de ${name} entraîne des besoins en construction neuve et rénovation. Les ${deptCount} départements et ${cityCount} villes offrent un vivier d'artisans couvrant tous les corps de métier du bâtiment.`,
    (name, deptCount, cityCount) => `L'équilibre entre urbain et rural en ${name} diversifie les besoins artisanaux : rénovation d'appartements en centre-ville, construction de maisons individuelles en périphérie. ${deptCount} départements et ${cityCount} villes sont couverts.`,
  ],
}

type RegionIntroFn = (name: string, deptCount: number, cityCount: number, climate: string, geo: string, economy: string) => string
const REGION_INTROS: RegionIntroFn[] = [
  (name, deptCount, cityCount, climate, geo, economy) =>
    `La région ${name} regroupe ${deptCount} départements et ${cityCount} villes. Caractérisée par un ${climate.toLowerCase()} et une ${geo.toLowerCase()}, elle présente une ${economy.toLowerCase()} influençant les besoins en artisanat.`,
  (name, deptCount, cityCount, climate, geo, economy) =>
    `Trouver un artisan en ${name} implique de connaître les spécificités régionales. Avec ${deptCount} départements, ${cityCount} villes et un ${climate.toLowerCase()}, cette région à la ${geo.toLowerCase()} et l'${economy.toLowerCase()} offre un marché riche.`,
  (name, deptCount, cityCount, climate, geo, economy) =>
    `En ${name}, ${deptCount} départements et ${cityCount} villes constituent un bassin de vie majeur. Le ${climate.toLowerCase()} et la ${geo.toLowerCase()} façonnent le parc immobilier, tandis que l'${economy.toLowerCase()} soutient la demande.`,
  (name, deptCount, cityCount, climate, _geo, economy) =>
    `La région ${name} offre un réseau dense d'artisans sur ${deptCount} départements et ${cityCount} villes. Son ${climate.toLowerCase()} détermine les priorités de rénovation, dans un contexte d'${economy.toLowerCase()}.`,
  (name, deptCount, cityCount, climate, geo, economy) =>
    `Avec ${deptCount} départements et ${cityCount} villes, ${name} est un territoire de ${geo.toLowerCase()} au ${climate.toLowerCase()}. L'${economy.toLowerCase()} stimule un marché de l'artisanat où qualité et réactivité sont essentielles.`,
  (name, deptCount, cityCount, climate, geo) =>
    `${name} : ${deptCount} départements, ${cityCount} villes, et un patrimoine bâti façonné par le ${climate.toLowerCase()} et la ${geo.toLowerCase()}. Les artisans régionaux maîtrisent les techniques adaptées.`,
  (name, deptCount, cityCount, climate, geo, economy) =>
    `Région de ${geo.toLowerCase()}, ${name} compte ${deptCount} départements et ${cityCount} villes. Le ${climate.toLowerCase()} dicte ses contraintes, et l'${economy.toLowerCase()} maintient une demande soutenue.`,
  (name, deptCount, cityCount, climate, geo, economy) =>
    `Le patrimoine bâti de ${name} reflète son ${climate.toLowerCase()} et sa ${geo.toLowerCase()}. Nos ${cityCount} villes, réparties sur ${deptCount} départements, donnent accès à des artisans formés aux spécificités locales. L'${economy.toLowerCase()} garantit un vivier de professionnels.`,
  (name, deptCount, cityCount, climate, geo, economy) =>
    `Vous cherchez un artisan en ${name} ? La région compte ${deptCount} départements, ${cityCount} villes et un patrimoine bâti influencé par le ${climate.toLowerCase()}. Entre ${geo.toLowerCase()} et ${economy.toLowerCase()}, les besoins artisanaux varient d'un territoire à l'autre.`,
  (name, deptCount, cityCount, climate, geo, economy) =>
    `De la ${geo.toLowerCase()} au ${climate.toLowerCase()}, ${name} offre un cadre de vie exigeant pour le bâti. Les artisans répartis sur ${deptCount} départements et ${cityCount} villes adaptent leurs interventions à l'${economy.toLowerCase()} et aux contraintes locales du patrimoine régional.`,
]

const REGION_TIPS: Record<ClimateZone, ((name: string) => string)[]> = {
  'oceanique': [
    (name) => `En ${name}, planifiez les travaux extérieurs entre avril et octobre. L'humidité océanique exige des matériaux résistants : menuiseries aluminium ou PVC, peintures microporeuses, enduits hydrofuges. Les artisans régionaux connaissent les produits adaptés.`,
    (name) => `Pour protéger votre habitation en ${name}, investissez dans la ventilation et les traitements anti-humidité. Faites inspecter votre toiture après chaque hiver. Un démoussage régulier et un contrôle des gouttières avant les pluies sont recommandés.`,
    (name) => `Les murs en pierre des maisons anciennes en ${name} nécessitent des enduits à la chaux, respirants, plutôt que du ciment qui piège l'humidité. Un artisan spécialisé en rénovation patrimoniale saura choisir le bon mortier.`,
    (name) => `Le bardage bois est très répandu en ${name} mais exige un entretien régulier : lasure tous les 3-5 ans ou choix de bois autoclavé classe 3. Le bardage composite ou fibrociment offre une alternative sans entretien.`,
    (name) => `En ${name}, l'installation d'une pompe à chaleur air-eau est particulièrement rentable : les hivers doux garantissent un COP élevé toute l'année. Les économies atteignent 60-70% par rapport au chauffage électrique.`,
  ],
  'continental': [
    (name) => `Les hivers rigoureux de ${name} nécessitent une isolation performante (R ≥ 6 en combles). Faites vérifier votre chauffage et protégez les canalisations extérieures. Planifiez les chantiers extérieurs entre mars et novembre.`,
    (name) => `En ${name}, les écarts de température sollicitent les matériaux. Privilégiez les revêtements extérieurs souples et le double vitrage à isolation renforcée. Les artisans maîtrisent ces techniques d'adaptation au climat continental.`,
    (name) => `Le chauffage représente le premier poste de dépense en ${name}. Avant de changer de chaudière, faites réaliser un audit énergétique : l'isolation des combles (15-25 €/m²) offre le meilleur retour sur investissement.`,
    (name) => `Les caves et sous-sols en ${name} sont exposés au gel et à l'humidité. Un cuvelage étanche associé à une ventilation mécanique protège vos fondations et valorise cet espace habitable de 800 à 1 200 €/m².`,
    (name) => `En ${name}, programmez l'entretien de votre chaudière entre septembre et novembre pour être prêt avant les grands froids. Le ramonage est obligatoire une à deux fois par an selon la réglementation locale.`,
  ],
  'mediterraneen': [
    (name) => `Le soleil de ${name} est un atout mais aussi une contrainte. Protégez vos intérieurs avec des volets et stores extérieurs. Pour les extérieurs, choisissez des enduits minéraux et peintures résistantes aux UV.`,
    (name) => `En ${name}, préparez la saison des pluies : vérifiez gouttières, étanchéité et drainage dès septembre. Une isolation par l'extérieur réduit de 5 à 8°C la température intérieure en été.`,
    (name) => `La pergola bioclimatique est l'aménagement extérieur le plus demandé en ${name} : lames orientables pour moduler l'ombre, intégration de brumisateurs et éclairage LED. Comptez 8 000 à 15 000 € posée par un artisan qualifié.`,
    (name) => `En ${name}, le solaire photovoltaïque bénéficie d'un ensoleillement favorable (2 000 à 2 800 heures/an selon la zone). Une installation de 3 kWc peut produire 3 500 à 4 000 kWh/an. Le retour sur investissement dépend du taux d'autoconsommation et des aides disponibles.`,
    (name) => `Les piscines en ${name} nécessitent un entretien spécifique : filtration renforcée contre le calcaire, traitement anti-algues et vérification de l'étanchéité du liner tous les 10 ans. Faites appel à un pisciniste certifié.`,
  ],
  'montagnard': [
    (name) => `En altitude en ${name}, l'isolation doit être exceptionnelle (R > 7 en combles). Le bois nécessite un traitement régulier. Planifiez les travaux entre mai et octobre — les artisans optimisent la fenêtre d'intervention estivale.`,
    (name) => `Les constructions en ${name} doivent supporter neige et gel. Choisissez des charpentes dimensionnées pour la charge de neige locale. Le chauffage au bois ou pompe à chaleur est performant avec les dernières générations d'équipements.`,
    (name) => `En ${name}, le poêle à granulés est le complément idéal du chauffage central : rendement de 90%, programmable et autonome 24-48h. L'approvisionnement en granulés est facilité par la proximité des forêts.`,
    (name) => `La toiture en lauze ou ardoise, traditionnelle en ${name}, requiert des artisans couvreurs spécialisés. Le coût de rénovation est élevé (150-250 €/m²) mais la durée de vie dépasse 80 ans avec un entretien minimal.`,
    (name) => `Les accès aux chantiers en ${name} peuvent être difficiles en hiver. Prévoyez les livraisons de matériaux lourds avant les premières neiges et réservez les artisans dès le printemps — les carnets se remplissent vite en zone montagne.`,
  ],
  'semi-oceanique': [
    (name) => `Le climat tempéré de ${name} permet des travaux quasiment toute l'année, avec une pause en décembre-janvier pour l'extérieur. L'humidité modérée justifie une bonne ventilation. Profitez du printemps et de l'automne pour les ravalements.`,
    (name) => `En ${name}, l'équilibre entre isolation et ventilation est crucial. Installez une VMC hygroréglable et aérez quotidiennement. Préférez une approche globale plutôt que des interventions ponctuelles.`,
    (name) => `Le ravalement de façade en ${name} est recommandé tous les 10-15 ans. Profitez-en pour ajouter une isolation par l'extérieur : le surcoût de 30-40% est couvert en partie par les aides et s'amortit en 8-12 ans.`,
    (name) => `En ${name}, les maisons à colombages et les constructions en tuffeau nécessitent des artisans formés aux techniques patrimoniales. Évitez les enduits ciment sur les murs anciens : la chaux est indispensable pour laisser respirer le bâti.`,
    (name) => `La domotique et les objets connectés gagnent du terrain en ${name} : thermostat intelligent, volets automatisés, détecteurs de fuite. Un électricien domoticien peut réduire votre facture énergétique de 15 à 25%.`,
  ],
  'tropical': [
    (name) => `En ${name}, la construction doit résister aux cyclones et à l'humidité. Privilégiez les structures béton armé, les menuiseries aluminium anticorrosion et les peintures fongicides. Climatisation à entretenir trimestriellement.`,
    (name) => `Le climat tropical de ${name} demande un entretien fréquent. Traitez les bois contre les termites, vérifiez l'étanchéité avant les pluies, et protégez les métaux contre la corrosion saline.`,
    (name) => `L'isolation thermique en ${name} vise le confort d'été : toiture ventilée avec sous-face réfléchissante, murs en parpaings isolés par l'extérieur. La casquette solaire au-dessus des fenêtres réduit la chaleur intérieure de 3 à 5°C.`,
    (name) => `Les chauffe-eau solaires sont particulièrement rentables en ${name} avec un ensoleillement quasi permanent. L'installation couvre 80-100% des besoins en eau chaude et se rentabilise en 4-6 ans.`,
    (name) => `En ${name}, faites vérifier votre installation électrique tous les 5 ans : l'humidité et la salinité accélèrent la corrosion des connexions. Un tableau électrique aux normes NF C 15-100 avec protection différentielle 30 mA est impératif.`,
  ],
}

const REGION_FAQ_POOL: { q: (name: string) => string; a: (name: string, deptCount: number, cityCount: number, climate: string, facts: string[]) => string }[] = [
  { q: (name) => `Comment trouver un artisan en ${name} ?`, a: (name, deptCount, cityCount) => `Parcourez les ${deptCount} départements de ${name} ou sélectionnez parmi les ${cityCount} villes. Choisissez le service et accédez aux artisans identifiés via les données SIREN. Devis gratuits.` },
  { q: (name) => `Combien coûte un artisan en ${name} ?`, a: (name) => `Les tarifs en ${name} varient selon le métier (45-90 €/h), la complexité et la zone. Les zones urbaines sont +10-25% vs rurales. Demandez plusieurs devis.` },
  { q: (name) => `Quels travaux prioritaires en ${name} ?`, a: (name, _deptCount, _cityCount, climate, facts) => `Le ${climate.toLowerCase()} de ${name} détermine les priorités : ${facts.slice(0, 2).join(' ; ').toLowerCase()}. L'isolation et la rénovation énergétique sont les investissements les plus rentables.` },
  { q: (name) => `Les devis sont-ils gratuits en ${name} ?`, a: (name) => `Oui, tous les devis via ServicesArtisans pour ${name} sont 100% gratuits et sans engagement. Jusqu'à 3 propositions de professionnels qualifiés.` },
  { q: (name) => `Quelles aides à la rénovation en ${name} ?`, a: (name) => `En ${name} : MaPrimeRénov' Parcours accompagné (montant variable selon revenus et travaux), éco-PTZ (jusqu'à 50 000 €), CEE, TVA réduite à 5,5%, et aides régionales. Artisan RGE requis pour les aides énergétiques.` },
  { q: (name) => `Comment le climat impacte le bâti en ${name} ?`, a: (name, _deptCount, _cityCount, climate, facts) => `Le ${climate.toLowerCase()} de ${name} a un impact direct : ${facts.slice(0, 3).join(' ; ').toLowerCase()}. Les artisans adaptent techniques et matériaux.` },
  { q: (name) => `Urgence artisan en ${name} ?`, a: (name) => `Certains artisans en ${name} proposent des interventions d'urgence, y compris le soir et le week-end : fuite, panne électrique, serrure, chauffage. Délais variables selon disponibilité et localisation.` },
  { q: (name) => `D'où proviennent les données artisans en ${name} ?`, a: (name) => `Les artisans en ${name} proviennent des données SIREN officielles. Chaque professionnel dispose d'un SIREN actif et d'une activité déclarée dans le bâtiment.` },
  { q: (name) => `Meilleure saison pour rénover en ${name} ?`, a: (name, _deptCount, _cityCount, climate) => `En ${name}, le ${climate.toLowerCase()} influence le calendrier. Extérieurs optimaux au printemps/été. Intérieurs toute l'année. Planifiez 2-3 mois à l'avance.` },
  { q: (name) => `Comment vérifier un artisan en ${name} ?`, a: (name) => `Contrôlez le SIRET sur l'INSEE, demandez assurance décennale et RC pro, vérifiez certifications (RGE, Qualibat), et consultez les avis pour les artisans de ${name}.` },
  { q: (name) => `Certifications importantes en ${name} ?`, a: (name) => `En ${name} : RGE (indispensable pour les aides), Qualibat (qualification), QualiPV/QualiSol (solaire), QualiBois/QualiPAC (chauffage). Labels garantissant un niveau de compétence vérifié.` },
  { q: (name) => `Combien de départements en ${name} ?`, a: (name, deptCount, cityCount) => `${name} regroupe ${deptCount} départements et ${cityCount} villes référencées. Chaque département dispose d'une page dédiée avec artisans par spécialité.` },
  { q: (name) => `Permis de construire pour rénover en ${name} ?`, a: (name) => `En ${name}, les travaux intérieurs sans modification de structure ne nécessitent aucune autorisation. Modifications de façade ou extensions > 5 m² : déclaration préalable. Secteurs protégés : aval ABF.` },
  { q: (name) => `Comment comparer les devis en ${name} ?`, a: (name) => `Pour comparer en ${name} : même périmètre, vérifiez détail des prestations, marques, délais, prix HT/TTC, conditions de paiement, assurances. Le moins cher n'est pas toujours le meilleur.` },
  { q: (name) => `Artisans les plus demandés en ${name} ?`, a: (name, _deptCount, _cityCount, climate) => `En ${name}, avec le ${climate.toLowerCase()}, plombiers, électriciens et chauffagistes dominent les urgences. Pour les projets planifiés : peintres, menuisiers et maçons.` },
]

function getRegionProfile(region: import('@/lib/data/france').Region): RegionProfile {
  const seed = Math.abs(hashCode(`region-${region.slug}`))

  const climateKey = REGION_CLIMATE[region.name] || 'semi-oceanique'
  const climate = CLIMATES.find(c => c.key === climateKey) || CLIMATES[4]
  const geoKey = REGION_GEO[region.slug] || 'mixte-geo'
  const geo = GEO_TYPES.find(g => g.key === geoKey) || GEO_TYPES[4]
  const ecoKey = REGION_ECONOMY[region.slug] || 'economie-diversifiee'
  const economy = REGIONAL_ECONOMIES_LIST.find(e => e.key === ecoKey) || REGIONAL_ECONOMIES_LIST[4]

  const topSlugs = DEPT_SERVICE_PRIORITY[climate.key]
  const facts = GEO_FACTS[geo.key]
  const climateIssues = CLIMATE_ISSUES[climate.key]
  const mixedFacts = [...facts.slice(0, 3), climateIssues[seed % climateIssues.length], climateIssues[(seed + 1) % climateIssues.length]]

  return {
    climate: climate.key, climateLabel: climate.label,
    geoType: geo.key, geoLabel: geo.label,
    economy: economy.key, economyLabel: economy.label,
    topServiceSlugs: topSlugs, keyFacts: mixedFacts,
  }
}

export function generateRegionContent(region: import('@/lib/data/france').Region, cityCountOverride?: number): RegionContent {
  const seed = Math.abs(hashCode(`region-${region.slug}`))
  const profile = getRegionProfile(region)
  const deptCount = region.departments.length
  const cityCount = cityCountOverride ?? region.departments.reduce((acc, d) => acc + d.cities.length, 0)

  const introFn = REGION_INTROS[seed % REGION_INTROS.length]
  const intro = introFn(region.name, deptCount, cityCount, profile.climateLabel, profile.geoLabel, profile.economyLabel)

  const ctxTemplates = REGION_CONTEXTS[profile.economy]
  const contexteRegional = ctxTemplates[Math.abs(hashCode(`ctx-region-${region.slug}`)) % ctxTemplates.length](region.name, deptCount, cityCount)

  const multiplier = getRegionalMultiplier(region.name)
  const pricingLines = profile.topServiceSlugs.slice(0, 5).map(slug => {
    const t = getTradeContent(slug)
    if (!t) return null
    const min = Math.round(t.priceRange.min * multiplier)
    const max = Math.round(t.priceRange.max * multiplier)
    return `${t.name} : ${min}–${max} ${t.priceRange.unit}`
  }).filter(Boolean)

  const servicesPrioritaires = `En ${region.name}, le ${profile.climateLabel.toLowerCase()} et la ${profile.geoLabel.toLowerCase()} orientent les besoins. Services les plus sollicités : ${pricingLines.join(' · ')}. Tarifs variant selon département, zone et complexité.`

  const tipTemplates = REGION_TIPS[profile.climate]
  const conseilsRegion = tipTemplates[Math.abs(hashCode(`tips-region-${region.slug}`)) % tipTemplates.length](region.name)

  const faqIndices: number[] = []
  let faqSeed = Math.abs(hashCode(`faq-region-${region.slug}`))
  while (faqIndices.length < 4) {
    const idx = faqSeed % REGION_FAQ_POOL.length
    if (!faqIndices.includes(idx)) faqIndices.push(idx)
    faqSeed = Math.abs(hashCode(`faq${faqSeed}-region-${faqIndices.length}`))
  }
  const faqItems = faqIndices.map(idx => {
    const f = REGION_FAQ_POOL[idx]
    return { question: f.q(region.name), answer: f.a(region.name, deptCount, cityCount, profile.climateLabel, profile.keyFacts) }
  })

  return { profile, intro, contexteRegional, servicesPrioritaires, conseilsRegion, faqItems }
}

// ===========================================================================
// VILLE (CITY) CONTENT GENERATOR
// ===========================================================================

type CitySize = 'metropole' | 'grande-ville' | 'ville-moyenne' | 'petite-ville'

const CITY_SIZES: { key: CitySize; label: string; minPop: number }[] = [
  { key: 'metropole', label: 'Métropole', minPop: 200000 },
  { key: 'grande-ville', label: 'Grande ville', minPop: 50000 },
  { key: 'ville-moyenne', label: 'Ville moyenne', minPop: 10000 },
  { key: 'petite-ville', label: 'Petite ville', minPop: 0 },
]

function parsePop(pop: string): number {
  return parseInt(pop.replace(/[\s.]/g, ''), 10) || 0
}

function getCitySize(pop: string): { key: CitySize; label: string } {
  const n = parsePop(pop)
  const match = CITY_SIZES.find(s => n >= s.minPop) || CITY_SIZES[3]
  return { key: match.key, label: match.label }
}

const CITY_HABITAT: Record<CitySize, string[]> = {
  'metropole': [
    'Parc immobilier dense composé majoritairement d\'immeubles haussmanniens, de résidences modernes et de quelques maisons de ville.',
    'Habitat urbain mixte : copropriétés anciennes nécessitant rénovation, immeubles récents aux normes, et quartiers résidentiels en périphérie.',
    'Forte densité de logements collectifs, avec un parc ancien (avant 1970) représentant plus de la moitié du bâti, souvent énergivore.',
    'Immeubles de standing en centre-ville côtoient des logements sociaux en périphérie, créant des besoins en rénovation très diversifiés.',
    'Copropriétés des années 1960-1970 en cours de réhabilitation thermique, immeubles anciens rénovés et programmes neufs aux normes RE2020.',
  ],
  'grande-ville': [
    'Tissu urbain équilibré entre collectif et individuel, avec un centre historique dense et des lotissements pavillonnaires en périphérie.',
    'Parc immobilier diversifié : immeubles de centre-ville, zones pavillonnaires des années 60-80, et programmes neufs en développement.',
    'Habitat mixte avec une part importante de maisons individuelles et des quartiers de logements collectifs en rénovation urbaine.',
    'Centre-ville patrimonial avec immeubles à rénover et couronnes périurbaines en plein développement résidentiel.',
    'Quartiers anciens en voie de gentrification et zones d\'activité transformées en logements, générant une forte demande artisanale.',
  ],
  'ville-moyenne': [
    'Prédominance de maisons individuelles avec jardins, complétée par quelques résidences collectives en centre-ville.',
    'Bâti traditionnel régional en centre ancien, entouré de lotissements résidentiels plus récents aux normes thermiques actuelles.',
    'Habitat principalement pavillonnaire avec un noyau urbain ancien nécessitant souvent des travaux de rénovation énergétique.',
    'Maisons de ville mitoyennes en centre-bourg et pavillons des années 1980-2000 en périphérie, avec des besoins croissants en isolation.',
    'Logements individuels à rénover constituant l\'essentiel du parc, avec quelques résidences collectives récentes près des commerces.',
  ],
  'petite-ville': [
    'Bâti essentiellement constitué de maisons individuelles et de corps de ferme rénovés, avec quelques petits collectifs.',
    'Habitat traditionnel régional en pierre ou en brique, souvent antérieur aux années 1950, nécessitant des travaux d\'isolation et de mise aux normes.',
    'Patrimoine bâti ancien à forte valeur architecturale, avec des enjeux de rénovation respectueuse des matériaux d\'origine.',
    'Maisons de bourg et anciennes dépendances agricoles transformées en habitations, avec des matériaux traditionnels locaux.',
    'Habitat rural rénové mêlant constructions anciennes en matériaux locaux et pavillons récents, nécessitant des artisans polyvalents.',
  ],
}

export interface VilleProfile {
  climate: ClimateZone
  climateLabel: string
  citySize: CitySize
  citySizeLabel: string
  topServiceSlugs: string[]
  climaticIssues: string[]
  habitatDescription: string
}

export interface VilleContent {
  profile: VilleProfile
  intro: string
  contexteUrbain: string
  servicesPrioritaires: string
  conseilsVille: string
  faqItems: { question: string; answer: string }[]
}

function getVilleProfile(ville: import('@/lib/data/france').Ville): VilleProfile {
  const seed = Math.abs(hashCode(`ville-${ville.slug}`))
  const regionClimate = REGION_CLIMATE[ville.region] || 'semi-oceanique'
  const climate = CLIMATES.find(c => c.key === regionClimate) || CLIMATES[4]

  const mountainDepts = ['73', '74', '05', '38', '09', '65', '04']
  const finalClimate = mountainDepts.includes(ville.departementCode) ? (CLIMATES.find(c => c.key === 'montagnard') || climate) : climate

  const size = getCitySize(ville.population)
  const topSlugs = DEPT_SERVICE_PRIORITY[finalClimate.key]
  const habitats = CITY_HABITAT[size.key]
  const habitatDescription = habitats[seed % habitats.length]

  // Hash-select 5 issues from 8 for variety across cities
  const allIssues = CLIMATE_ISSUES[finalClimate.key]
  const issueSeed = Math.abs(hashCode(`ville-issues-${ville.slug}`))
  const selectedIssues: string[] = []
  const usedIdx = new Set<number>()
  let is = issueSeed
  while (selectedIssues.length < 5 && selectedIssues.length < allIssues.length) {
    const idx = is % allIssues.length
    if (!usedIdx.has(idx)) { usedIdx.add(idx); selectedIssues.push(allIssues[idx]) }
    is = Math.abs(hashCode(`vi${is}-${selectedIssues.length}`))
  }

  return {
    climate: finalClimate.key, climateLabel: finalClimate.label,
    citySize: size.key, citySizeLabel: size.label,
    topServiceSlugs: topSlugs,
    climaticIssues: selectedIssues,
    habitatDescription,
  }
}

interface VilleIntroParams { name: string; dept: string; deptCode: string; pop: string; region: string; climate: string; sizeLabel: string }

const VILLE_INTROS: ((p: VilleIntroParams) => string)[] = [
  (p) => `${p.sizeLabel} de ${p.region}, ${p.name} (${p.deptCode}) compte ${p.pop} habitants et se distingue par son climat ${p.climate.toLowerCase()}. Les artisans locaux connaissent les spécificités du bâti et interviennent rapidement pour tous vos travaux.`,
  (p) => `Située dans le ${p.dept} (${p.deptCode}), ${p.name} rassemble ${p.pop} habitants dans un environnement ${p.climate.toLowerCase()}. Que vous ayez besoin de rénovation, d'entretien ou de dépannage urgent, les professionnels référencés sur notre plateforme couvrent l'ensemble de la commune.`,
  (p) => `Avec ses ${p.pop} habitants, ${p.name} est une ${p.sizeLabel.toLowerCase()} du ${p.dept} en ${p.region}. Le climat ${p.climate.toLowerCase()} de la zone influence directement les besoins en matière de travaux et d'entretien du bâti.`,
  (p) => `${p.name} (${p.deptCode}), ${p.pop} habitants, bénéficie d'artisans qualifiés intervenant sur l'ensemble de la commune et ses quartiers. En ${p.region}, le climat ${p.climate.toLowerCase()} impose des exigences spécifiques que nos professionnels maîtrisent parfaitement.`,
  (p) => `Dans le ${p.dept} (${p.region}), ${p.name} et ses ${p.pop} habitants profitent d'un réseau d'artisans de confiance. Le contexte ${p.climate.toLowerCase()} local oriente les priorités en matière d'entretien et de rénovation des logements.`,
  (p) => `${p.name}, ${p.sizeLabel.toLowerCase()} de ${p.pop} habitants dans le ${p.dept} (${p.deptCode}), dispose d'un parc immobilier aux besoins spécifiques liés au climat ${p.climate.toLowerCase()} de ${p.region}.`,
  (p) => `Commune de ${p.pop} habitants en ${p.region}, ${p.name} fait partie du ${p.dept} (${p.deptCode}). Les artisans y intervenant connaissent les contraintes du climat ${p.climate.toLowerCase()} et adaptent leurs prestations en conséquence.`,
  (p) => `En plein cœur du ${p.dept}, ${p.name} (${p.pop} hab.) offre un cadre de vie ${p.climate.toLowerCase()} typique de ${p.region}. Nos artisans référencés assurent tous types de travaux, du dépannage à la rénovation complète.`,
  (p) => `${p.name} compte ${p.pop} habitants dans le département ${p.dept} (${p.deptCode}). ${p.sizeLabel} au climat ${p.climate.toLowerCase()}, elle nécessite des artisans expérimentés pour répondre aux défis propres à son habitat.`,
  (p) => `Implantée en ${p.region}, ${p.name} (${p.deptCode}) réunit ${p.pop} habitants. Le climat ${p.climate.toLowerCase()} et les caractéristiques du bâti local définissent les besoins prioritaires en artisanat du bâtiment.`,
]

interface VilleCtxParams { name: string; pop: string; qc: number }

const VILLE_CONTEXTS: Record<CitySize, ((p: VilleCtxParams) => string)[]> = {
  'metropole': [
    (p) => `Avec ${p.pop} habitants répartis sur ${p.qc > 0 ? p.qc + ' quartiers' : 'de nombreux quartiers'}, ${p.name} présente une forte demande en rénovation d'immeubles anciens, mise aux normes électriques et plomberie de copropriété. Les délais d'intervention sont courts grâce à la densité de professionnels disponibles.`,
    (p) => `Métropole de ${p.pop} habitants, ${p.name} concentre des enjeux majeurs : rénovation énergétique des logements collectifs, entretien des installations communes et adaptation aux nouvelles réglementations thermiques (RE2020).`,
    (p) => `À ${p.name}, la densité urbaine et les ${p.pop} habitants génèrent une demande soutenue en services d'artisanat. Les immeubles anciens nécessitent des interventions régulières, tandis que les constructions neuves requièrent des finitions de qualité.`,
    (p) => `Le marché du bâtiment à ${p.name} (${p.pop} hab.) est structuré autour des copropriétés : réfection des parties communes, mise en conformité des colonnes montantes, ravalement de façade et rénovation des ascenseurs mobilisent régulièrement les artisans.`,
    (p) => `${p.name} connaît une dynamique de rénovation soutenue : DPE obligatoire, interdiction progressive des passoires thermiques et exigences de copropriété poussent les ${p.pop} habitants à solliciter des artisans qualifiés pour améliorer la performance énergétique de leur logement.`,
  ],
  'grande-ville': [
    (p) => `Grande ville de ${p.pop} habitants${p.qc > 0 ? ` avec ${p.qc} quartiers identifiés` : ''}, ${p.name} combine des besoins variés : entretien du parc ancien en centre-ville et travaux neufs dans les zones d'extension urbaine.`,
    (p) => `${p.name} et ses ${p.pop} habitants constituent un bassin d'activité artisanale dynamique. La diversité du bâti — du centre historique aux lotissements périphériques — appelle des compétences variées.`,
    (p) => `Avec ${p.pop} habitants, ${p.name} offre un marché artisanal équilibré entre rénovation et construction neuve. Les professionnels locaux interviennent aussi bien en centre-ville que dans les quartiers résidentiels.`,
    (p) => `À ${p.name}${p.qc > 0 ? ` et ses ${p.qc} quartiers` : ''}, la transformation urbaine génère des besoins multiples : réhabilitation de friches, aménagement de logements et entretien d'un parc immobilier vieillissant pour les ${p.pop} habitants.`,
    (p) => `Les ${p.pop} habitants de ${p.name} bénéficient d'un tissu artisanal dense et spécialisé. Entre rénovation du centre historique et aménagement des zones résidentielles périphériques, les professionnels du bâtiment sont très sollicités.`,
  ],
  'ville-moyenne': [
    (p) => `Ville moyenne de ${p.pop} habitants, ${p.name} se caractérise par un habitat principalement pavillonnaire. Les besoins portent sur l'entretien courant, la rénovation énergétique et l'amélioration du confort des maisons individuelles.`,
    (p) => `À ${p.name} (${p.pop} hab.), le parc immobilier mêle constructions traditionnelles et pavillons plus récents. Les artisans locaux sont sollicités pour des travaux d'isolation, de chauffage et de mise aux normes.`,
    (p) => `Commune de ${p.pop} habitants, ${p.name} présente un tissu résidentiel à taille humaine. Les propriétaires y privilégient les artisans de proximité pour leurs travaux de rénovation et d'entretien.`,
    (p) => `${p.name} (${p.pop} hab.) offre un cadre de vie résidentiel où les maisons individuelles dominent. Les demandes portent sur l'extension de logements, la rénovation de cuisines et salles de bain, et l'amélioration de l'isolation thermique.`,
    (p) => `Avec ${p.pop} habitants, ${p.name} connaît un renouvellement progressif de son parc immobilier. Les propriétaires investissent dans la modernisation du chauffage, l'isolation par l'extérieur et la réfection des toitures vieillissantes.`,
  ],
  'petite-ville': [
    (p) => `Petite commune de ${p.pop} habitants, ${p.name} possède un patrimoine bâti souvent ancien nécessitant des compétences spécifiques en rénovation. Les artisans intervenant sur la commune connaissent les matériaux traditionnels locaux.`,
    (p) => `À ${p.name} (${p.pop} hab.), l'habitat traditionnel prédomine. Les travaux portent principalement sur la rénovation, l'isolation et la mise aux normes des installations existantes.`,
    (p) => `Commune de ${p.pop} habitants, ${p.name} bénéficie d'artisans polyvalents capables d'intervenir sur des bâtis anciens comme sur des constructions plus récentes. La proximité est un atout majeur pour la réactivité.`,
    (p) => `${p.name} et ses ${p.pop} habitants comptent sur des artisans de proximité pour entretenir un patrimoine bâti où le charme de l'ancien côtoie les exigences de confort moderne : isolation, chauffage performant et mise aux normes électriques.`,
    (p) => `Dans cette commune de ${p.pop} habitants, les chantiers de rénovation sont variés : restauration de façades en matériaux locaux, remplacement de menuiseries, réfection de toitures et création d'extensions pour adapter les logements aux besoins actuels.`,
  ],
}

const VILLE_TIPS: Record<ClimateZone, ((name: string) => string)[]> = {
  'oceanique': [
    (name) => `À ${name}, le climat océanique entraîne une humidité importante. Faites vérifier l'étanchéité de votre toiture chaque automne et traitez les murs contre les remontées capillaires. Les façades doivent être nettoyées et imperméabilisées tous les 10 ans.`,
    (name) => `En climat océanique à ${name}, privilégiez les matériaux résistants à l'humidité pour vos menuiseries extérieures. Le PVC ou l'aluminium offrent une meilleure longévité que le bois non traité dans ces conditions.`,
    (name) => `L'air marin à ${name} accélère la corrosion des métaux. Optez pour des gouttières en zinc ou en PVC plutôt qu'en acier, et faites traiter les garde-corps et ferronneries avec une peinture antirouille marine tous les 5 ans.`,
    (name) => `À ${name}, la VMC est essentielle pour évacuer l'excès d'humidité intérieure. Faites nettoyer les bouches d'extraction chaque année et vérifiez le bon fonctionnement du caisson moteur pour prévenir les moisissures.`,
    (name) => `Le climat de ${name} favorise la pousse de mousses sur les toitures et terrasses. Un nettoyage basse pression suivi d'un traitement anti-mousse au printemps prolonge la durée de vie de vos revêtements extérieurs.`,
  ],
  'continental': [
    (name) => `À ${name}, les écarts de température entre été et hiver sollicitent fortement les façades et les joints. Prévoyez un contrôle de chaudière avant l'hiver et vérifiez l'isolation des combles pour réduire votre facture énergétique.`,
    (name) => `Le climat continental de ${name} commande une vigilance particulière sur les canalisations en période de gel. Pensez à purger les circuits extérieurs et à calorifuger les tuyaux exposés avant les premières gelées.`,
    (name) => `À ${name}, les dallages extérieurs souffrent des cycles gel-dégel. Privilégiez des matériaux résistants au gel (grès cérame, pierre naturelle) et prévoyez des joints souples pour absorber les dilatations thermiques.`,
    (name) => `En hiver à ${name}, la consommation de chauffage peut représenter jusqu'à 70% de la facture énergétique. L'isolation des combles perdus est le premier investissement à réaliser pour un retour rapide.`,
    (name) => `Les étés chauds et les hivers froids à ${name} sollicitent les volets roulants et les fermetures. Faites réviser les mécanismes chaque automne et graissez les rails pour éviter les blocages en plein hiver.`,
  ],
  'mediterraneen': [
    (name) => `À ${name}, la chaleur estivale rend la climatisation indispensable. Faites entretenir votre système chaque printemps et vérifiez que l'isolation de vos combles limite les surchauffes. Les volets roulants sont un investissement rentable.`,
    (name) => `En climat méditerranéen à ${name}, les épisodes cévenols peuvent causer des infiltrations. Vérifiez régulièrement l'état de vos gouttières et de l'étanchéité de votre toiture, surtout en automne.`,
    (name) => `À ${name}, le soleil intense dégrade rapidement les peintures extérieures. Optez pour des peintures acryliques haute résistance UV et prévoyez un rafraîchissement des façades tous les 8 à 10 ans.`,
    (name) => `La sécheresse à ${name} provoque un retrait des argiles qui peut fissurer les fondations. Surveillez l'apparition de fissures sur vos murs et consultez un maçon si elles évoluent, surtout après un été sec.`,
    (name) => `En été à ${name}, les stores et brise-soleil sont sollicités quotidiennement. Faites réviser les mécanismes de vos volets chaque printemps et vérifiez la tension des toiles de store pour garantir leur longévité.`,
  ],
  'montagnard': [
    (name) => `À ${name}, le poids de la neige sur les toitures nécessite une charpente renforcée et un déneigement régulier. Faites inspecter votre couverture au printemps pour repérer les dégâts causés par le gel et la neige.`,
    (name) => `En zone de montagne à ${name}, l'isolation thermique est primordiale. Les doubles ou triples vitrages et l'isolation des combles par l'extérieur permettent de réduire significativement les dépenses de chauffage.`,
    (name) => `À ${name}, les gouttières et descentes d'eau sont mises à rude épreuve par le gel. Installez des câbles chauffants dans les chéneaux pour éviter la formation de barrages de glace qui endommagent les toitures.`,
    (name) => `Le bois de charpente à ${name} subit d'importants écarts d'humidité entre saisons. Un traitement fongicide et insecticide tous les 10 ans protège la structure contre les champignons et les insectes xylophages.`,
    (name) => `En altitude à ${name}, les fondations sont exposées aux mouvements de terrain liés au dégel. Assurez un drainage efficace autour de votre maison et vérifiez l'état des regards et caniveaux chaque printemps.`,
  ],
  'semi-oceanique': [
    (name) => `À ${name}, le climat semi-océanique combine humidité modérée et hivers frais. Un entretien annuel de la chaudière et une vérification de la VMC garantissent un confort optimal toute l'année.`,
    (name) => `En climat semi-océanique à ${name}, les façades sont exposées aux pluies fréquentes mais modérées. Un ravalement tous les 15 ans et un traitement hydrofuge préventif protègent durablement votre bien.`,
    (name) => `À ${name}, l'humidité modérée mais constante favorise la condensation dans les pièces mal ventilées. Vérifiez que votre VMC fonctionne correctement et aérez quotidiennement, même en hiver, pour prévenir les moisissures.`,
    (name) => `Le climat de ${name} sollicite modérément mais régulièrement les toitures. Un contrôle visuel annuel des tuiles et de la zinguerie permet de détecter les petites réparations avant qu'elles ne deviennent coûteuses.`,
    (name) => `À ${name}, les peintures extérieures tiennent généralement 10 à 12 ans grâce au climat tempéré. Profitez du printemps pour inspecter les boiseries, volets et portails et planifier les retouches nécessaires.`,
  ],
  'tropical': [
    (name) => `À ${name}, le climat tropical nécessite des matériaux résistants à l'humidité et aux termites. Privilégiez les traitements préventifs du bois et une ventilation naturelle efficace pour limiter la climatisation.`,
    (name) => `En climat tropical à ${name}, les cyclones nécessitent des menuiseries renforcées et une toiture solidement ancrée. Faites vérifier les fixations de votre charpente avant chaque saison cyclonique.`,
    (name) => `À ${name}, la climatisation fonctionne souvent en continu. Un entretien trimestriel des filtres et un contrôle annuel du circuit frigorifique par un professionnel certifié prolongent la durée de vie de l'appareil.`,
    (name) => `L'air salin à ${name} corrode rapidement les installations électriques extérieures. Faites vérifier les coffrets et les protections différentielles chaque année par un électricien pour garantir votre sécurité.`,
    (name) => `En zone tropicale à ${name}, les peintures et enduits extérieurs se dégradent en 3 à 5 ans. Choisissez des produits spécifiques tropicaux et planifiez un rafraîchissement régulier pour protéger votre maçonnerie.`,
  ],
}

interface VilleFaqParams { name: string; pop: string; dept: string; region: string; climate: string; qc: number }

const VILLE_FAQ_POOL: { q: (name: string) => string; a: (p: VilleFaqParams) => string }[] = [
  {
    q: (name) => `Comment trouver un artisan de confiance à ${name} ?`,
    a: (p) => `Sur ServicesArtisans, tous les artisans référencés à ${p.name} disposent d'un numéro SIREN vérifié. Sélectionnez le corps de métier souhaité, consultez les profils et demandez jusqu'à 3 devis gratuits pour comparer les offres.`,
  },
  {
    q: (name) => `Quels types de travaux peut-on réaliser à ${name} ?`,
    a: (p) => `À ${p.name} (${p.dept}), nos artisans interviennent sur les principaux corps de métier du bâtiment : plomberie, électricité, serrurerie, chauffage, climatisation, couverture, maçonnerie, peinture, menuiserie, carrelage, façade, vitrerie, terrassement, aménagement paysager et domotique.`,
  },
  {
    q: (name) => `Comment obtenir un devis gratuit à ${name} ?`,
    a: (p) => `Cliquez sur "Demander un devis gratuit", décrivez votre projet en quelques clics, et recevez jusqu'à 3 devis personnalisés d'artisans qualifiés intervenant à ${p.name}. Le service est 100% gratuit et sans engagement.`,
  },
  {
    q: (name) => `Les artisans à ${name} interviennent-ils en urgence ?`,
    a: (p) => `Certains artisans référencés à ${p.name} proposent des interventions d'urgence, notamment les plombiers, serruriers et électriciens. Les disponibilités varient selon les professionnels. Consultez notre page urgence pour trouver un dépannage rapide.`,
  },
  {
    q: (name) => `Quel est le prix moyen d'un artisan à ${name} ?`,
    a: (p) => `Les tarifs varient selon le corps de métier et la complexité des travaux. À ${p.name} (${p.dept}), les prix sont ${getRegionalLabel(p.region)} compte tenu de la zone géographique. Demandez plusieurs devis pour comparer.`,
  },
  {
    q: (name) => `D'où proviennent les données des artisans à ${name} ?`,
    a: (p) => `Les artisans référencés sur ServicesArtisans sont répertoriés à partir des données SIREN officielles de l'INSEE. Chaque professionnel listé à ${p.name} dispose d'un numéro SIREN enregistré et vérifiable.`,
  },
  {
    q: (name) => `Quels sont les quartiers desservis à ${name} ?`,
    a: (p) => p.qc > 0
      ? `Nos artisans interviennent dans les ${p.qc} quartiers de ${p.name}. Consultez la section "Quartiers desservis" sur cette page pour voir la liste complète et accéder aux pages quartier dédiées.`
      : `Nos artisans couvrent l'ensemble de la commune de ${p.name} et ses environs. Quel que soit votre secteur, vous pouvez demander un devis gratuit.`,
  },
  {
    q: (name) => `Comment choisir entre plusieurs artisans à ${name} ?`,
    a: (p) => `Comparez les devis reçus en tenant compte du prix, des délais, des garanties proposées et de l'expérience. À ${p.name}, privilégiez les artisans ayant une bonne connaissance du bâti local et du climat ${p.climate.toLowerCase()}.`,
  },
  {
    q: (name) => `Faut-il un permis de construire pour des travaux à ${name} ?`,
    a: (p) => `Cela dépend de la nature des travaux. À ${p.name}, les travaux modifiant l'aspect extérieur (façade, toiture, extension) nécessitent généralement une déclaration préalable en mairie. Pour les extensions de plus de 20 m², un permis de construire est requis.`,
  },
  {
    q: (name) => `Quelles aides financières pour les travaux à ${name} ?`,
    a: (p) => `Les habitants de ${p.name} (${p.dept}) peuvent bénéficier de MaPrimeRénov', de l'éco-PTZ, des CEE et des aides de l'ANAH pour la rénovation énergétique. Certaines collectivités locales proposent des aides complémentaires.`,
  },
  {
    q: (name) => `Quel artisan pour une rénovation énergétique à ${name} ?`,
    a: (p) => `Pour une rénovation énergétique à ${p.name}, faites appel à un artisan RGE (Reconnu Garant de l'Environnement). Cela conditionne l'accès aux aides publiques. Les travaux courants incluent l'isolation, le chauffage et la ventilation.`,
  },
  {
    q: (name) => `Les artisans à ${name} sont-ils assurés ?`,
    a: (p) => `Les artisans du bâtiment à ${p.name} sont tenus de souscrire une assurance décennale couvrant les dommages pendant 10 ans. Demandez systématiquement une attestation d'assurance avant le début des travaux.`,
  },
  {
    q: (name) => `Combien de temps durent les travaux courants à ${name} ?`,
    a: (p) => `La durée varie selon le type d'intervention : un dépannage plomberie ou serrurerie prend généralement 1 à 2 heures, une rénovation de salle de bain 1 à 2 semaines, et une rénovation complète de maison à ${p.name} peut s'étendre sur plusieurs mois.`,
  },
  {
    q: (name) => `Peut-on faire intervenir un artisan le week-end à ${name} ?`,
    a: (p) => `Certains artisans à ${p.name} proposent des interventions le week-end, notamment pour les urgences (plombier, serrurier, électricien). Un supplément de 20 à 50% est généralement appliqué pour les interventions hors heures ouvrées.`,
  },
  {
    q: (name) => `Comment signaler un problème avec un artisan à ${name} ?`,
    a: (p) => `En cas de litige avec un artisan à ${p.name}, commencez par une réclamation écrite. Si le différend persiste, contactez le médiateur de la consommation ou la DGCCRF du ${p.dept}. L'assurance décennale couvre les malfaçons structurelles.`,
  },
]

export function generateVilleContent(ville: import('@/lib/data/france').Ville): VilleContent {
  const seed = Math.abs(hashCode(`ville-${ville.slug}`))
  const profile = getVilleProfile(ville)
  const quartierCount = ville.quartiers?.length || 0

  const introFn = VILLE_INTROS[seed % VILLE_INTROS.length]
  const intro = introFn({ name: ville.name, dept: ville.departement, deptCode: ville.departementCode, pop: ville.population, region: ville.region, climate: profile.climateLabel.replace(/^Climat\s+/i, ''), sizeLabel: profile.citySizeLabel })

  const ctxTemplates = VILLE_CONTEXTS[profile.citySize]
  const contexteUrbain = ctxTemplates[Math.abs(hashCode(`ctx-ville-${ville.slug}`)) % ctxTemplates.length]({ name: ville.name, pop: ville.population, qc: quartierCount })

  const multiplier = getRegionalMultiplier(ville.region)
  const pricingLines = profile.topServiceSlugs.slice(0, 5).map(slug => {
    const t = getTradeContent(slug)
    if (!t) return null
    const min = Math.round(t.priceRange.min * multiplier)
    const max = Math.round(t.priceRange.max * multiplier)
    return `${t.name} : ${min}–${max} ${t.priceRange.unit}`
  }).filter(Boolean)

  const servicesPrioritaires = `À ${ville.name}, le ${profile.climateLabel.toLowerCase()} oriente les besoins en artisanat. Services les plus sollicités : ${pricingLines.join(' · ')}. Tarifs indicatifs ajustés à la zone géographique.`

  const tipTemplates = VILLE_TIPS[profile.climate]
  const conseilsVille = tipTemplates[Math.abs(hashCode(`tips-ville-${ville.slug}`)) % tipTemplates.length](ville.name)

  const faqIndices: number[] = []
  let faqSeed = Math.abs(hashCode(`faq-ville-${ville.slug}`))
  while (faqIndices.length < 4) {
    const idx = faqSeed % VILLE_FAQ_POOL.length
    if (!faqIndices.includes(idx)) faqIndices.push(idx)
    faqSeed = Math.abs(hashCode(`faq${faqSeed}-ville-${faqIndices.length}`))
  }
  const faqItems = faqIndices.map(idx => {
    const f = VILLE_FAQ_POOL[idx]
    return { question: f.q(ville.name), answer: f.a({ name: ville.name, pop: ville.population, dept: ville.departement, region: ville.region, climate: profile.climateLabel.replace(/^Climat\s+/i, ''), qc: quartierCount }) }
  })

  return { profile, intro, contexteUrbain, servicesPrioritaires, conseilsVille, faqItems }
}
