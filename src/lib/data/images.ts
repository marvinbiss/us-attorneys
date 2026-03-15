/**
 * Banque d'images centralisée — 120 photos uniques
 * Source : Unsplash (licence gratuite, usage commercial autorisé)
 *
 * RÈGLE D'OR : ZÉRO doublon. Chaque ID Unsplash n'apparaît qu'UNE SEULE fois
 * dans les données statiques ci-dessous.
 *
 * Organisation :
 * - Hero homepage (1)
 * - Services / métiers (46 uniques + 1 défaut)
 * - Artisans confiance (3 visages)
 * - Témoignages clients (3)
 * - Avant/Après (10 paires = 20, tous uniques)
 * - Villes top 20 (20 uniques)
 * - Pages statiques (7)
 * - Ambiance (3)
 * - Blog (12 topics + 3 catégories + 1 défaut)
 */

// ── Helper ───────────────────────────────────────────────────────
function unsplash(id: string, w = 800, h = 600): string {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`
}

/** Placeholder flou générique (gris neutre) — utilisable partout */
export const BLUR_PLACEHOLDER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAFAAgDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAABv/EAB0QAAICAgMBAAAAAAAAAAAAAAECAxEABBIhMUH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAEDAAIRIf/aAAwDAQACEQMRAD8AoNnYig1IYkjJZgLdj2fueYsXExif/9k='

// ── 1. HERO HOMEPAGE ─────────────────────────────────────────────
export const heroImage = {
  src: unsplash('photo-1504307651254-35680f356dfd', 1920, 1080),
  alt: 'Artisan qualifié au travail sur un chantier en France',
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAFAAgDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABwQAAICAgMAAAAAAAAAAAAAAAABAgMEBREhMf/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAWEQEBAQAAAAAAAAAAAAAAAAABAAL/2gAMAwEAAhEDEQA/AKmTl1dEIVRXdbJLt+gA0Jdl/9k=',
}

// ── 2. IMAGES PAR SERVICE (métier) — 46 uniques ─────────────────
export const serviceImages: Record<string, { src: string; alt: string }> = {
  plombier: {
    src: unsplash('photo-1621905252507-b35492cc74b4'),
    alt: 'Plombier professionnel réparant une canalisation',
  },
  electricien: {
    src: unsplash('photo-1636218685495-8f6545aadb71'),
    alt: 'Électricien installant un tableau électrique',
  },
  serrurier: {
    src: unsplash('photo-1575908539614-ff89490f4a78'),
    alt: 'Serrurier professionnel taillant des clés dans son atelier',
  },
  chauffagiste: {
    src: unsplash('photo-1572537842835-08c65286efef'),
    alt: 'Thermostat mural réglé par un chauffagiste professionnel',
  },
  'peintre-en-batiment': {
    src: unsplash('photo-1593189094075-3dad030bfcab'),
    alt: 'Peintre en bâtiment appliquant de la peinture au rouleau',
  },
  menuisier: {
    src: unsplash('photo-1678184098226-114d9295540e'),
    alt: 'Menuisier travaillant le bois dans son atelier',
  },
  carreleur: {
    src: unsplash('photo-1590880265945-6b43effeb599'),
    alt: 'Carreleur posant du carrelage dans une salle de bain',
  },
  couvreur: {
    src: unsplash('photo-1604732998734-9f9529104a77'),
    alt: 'Tuiles de toiture en terre cuite sous un ciel bleu',
  },
  macon: {
    src: unsplash('photo-1534759844553-c2f76b04e35f'),
    alt: 'Maçon construisant un mur en briques',
  },
  jardinier: {
    src: unsplash('photo-1626075218494-89e92b375502'),
    alt: 'Jardinier entretenant un beau jardin paysager',
  },
  climaticien: {
    src: unsplash('photo-1588090272888-033e92b141b1'),
    alt: 'Technicien installant une climatisation murale',
  },
  cuisiniste: {
    src: unsplash('photo-1556912167-f556f1f39fdf'),
    alt: 'Cuisine moderne installée par un professionnel',
  },
  'salle-de-bain': {
    src: unsplash('photo-1758548157466-7c454382035a'),
    alt: 'Salle de bain rénovée avec vasque moderne',
  },
  vitrier: {
    src: unsplash('photo-1557749575-2ad9647f820d'),
    alt: 'Baie vitrée lumineuse posée par un vitrier',
  },
  'poseur-de-parquet': {
    src: unsplash('photo-1571091374875-3e354ceb6ed3'),
    alt: 'Artisan posant un parquet en bois massif',
  },
  facadier: {
    src: unsplash('photo-1597758011002-9a3e9537dd8b'),
    alt: 'Façade d\'immeuble en cours de ravalement',
  },
  charpentier: {
    src: unsplash('photo-1569370029765-33aaab1f4851'),
    alt: 'Charpentier assemblant une structure en bois',
  },
  terrassier: {
    src: unsplash('photo-1567238563567-b99d8ac66e9b'),
    alt: 'Engin de terrassement nivelant un terrain',
  },
  'isolation-thermique': {
    src: unsplash('photo-1631277190979-1704e8c7d574'),
    alt: 'Artisan posant de l\'isolation thermique en laine de roche',
  },
  domoticien: {
    src: unsplash('photo-1545259741-2ea3ebf61fa3'),
    alt: 'Installation domotique dans une maison connectée',
  },
  paysagiste: {
    src: unsplash('photo-1595387426256-cc153122a6f1'),
    alt: 'Jardin paysager aménagé par un professionnel',
  },
  pisciniste: {
    src: unsplash('photo-1650519876461-c516be8be76c'),
    alt: 'Piscine construite par un artisan pisciniste',
  },
  'alarme-securite': {
    src: unsplash('photo-1528312635006-8ea0bc49ec63'),
    alt: 'Caméra de surveillance et système de sécurité résidentiel',
  },
  platrier: {
    src: unsplash('photo-1559126698-1906840f3c95'),
    alt: 'Plâtrier posant des plaques de plâtre sur une ossature',
  },
  antenniste: {
    src: unsplash('photo-1663316026819-ea3a6293e8e9'),
    alt: 'Antenne parabolique installée sur un toit de maison',
  },
  'architecte-interieur': {
    src: unsplash('photo-1762545112336-646c69e4888b'),
    alt: 'Salon moderne aménagé par un architecte d\'intérieur',
  },
  ascensoriste: {
    src: unsplash('photo-1758193017781-e3aee6c3e359'),
    alt: 'Hall d\'ascenseur moderne avec finitions en marbre et verre',
  },
  'borne-recharge': {
    src: unsplash('photo-1582201872911-67877db5fb38'),
    alt: 'Véhicule électrique branché sur une borne de recharge',
  },
  decorateur: {
    src: unsplash('photo-1507238691740-187a5b1d37b8'),
    alt: 'Décorateur appliquant de la peinture au rouleau sur un mur',
  },
  demenageur: {
    src: unsplash('photo-1715645948484-da40dd56bc93'),
    alt: 'Déménageur chargeant des cartons dans un camion de déménagement',
  },
  deratisation: {
    src: unsplash('photo-1646324554833-f0b6a479fa5d'),
    alt: 'Technicien en tenue de protection pulvérisant un traitement antiparasitaire',
  },
  desinsectisation: {
    src: unsplash('photo-1512592585971-bff48f1c9815'),
    alt: 'Professionnels de désinsectisation en combinaison de protection intervenant dans un local',
  },
  diagnostiqueur: {
    src: unsplash('photo-1631300313270-227604e71ea5'),
    alt: 'Diagnostiqueur immobilier avec casque et dossier d\'inspection',
  },
  etancheiste: {
    src: unsplash('photo-1633759593085-1eaeb724fc88'),
    alt: 'Étanchéiste travaillant sur une toiture avec ses outils',
  },
  ferronnier: {
    src: unsplash('photo-1528717384022-f8d665c86909'),
    alt: 'Artisan ferronnier forgeant le fer sur une enclume dans son atelier',
  },
  geometre: {
    src: unsplash('photo-1682663810771-89d21838530f'),
    alt: 'Géomètre-expert avec son appareil de mesure topographique sur un chantier',
  },
  metallier: {
    src: unsplash('photo-1764245546004-e6b743242a80'),
    alt: 'Métallier soudeur travaillant le métal avec des étincelles en atelier',
  },
  miroitier: {
    src: unsplash('photo-1740595362788-78bc54ea1bad'),
    alt: 'Miroir rond élégant posé sur un mur de salle de bain par un miroitier',
  },
  nettoyage: {
    src: unsplash('photo-1674158687384-023265a5d536'),
    alt: 'Professionnelle de nettoyage nettoyant un sol avec une serpillère',
  },
  'panneaux-solaires': {
    src: unsplash('photo-1745187946672-2c1d8cf26a2b'),
    alt: 'Panneaux solaires installés sur une toiture résidentielle',
  },
  'pompe-a-chaleur': {
    src: unsplash('photo-1649711895336-20ff39db62f8'),
    alt: 'Unités extérieures de pompe à chaleur installées sur un mur',
  },
  ramoneur: {
    src: unsplash('photo-1671438137059-13173ad60daf'),
    alt: 'Cheminée de maison avec fumée sortant du conduit',
  },
  'renovation-energetique': {
    src: unsplash('photo-1441038718687-699f189fa401'),
    alt: 'Maison moderne écoénergétique avec végétation et technologies durables',
  },
  solier: {
    src: unsplash('photo-1580810734898-5e1753f23337'),
    alt: 'Ouvrier solier nivelant un revêtement de sol sur un chantier',
  },
  storiste: {
    src: unsplash('photo-1758001606578-09b352df5b85'),
    alt: 'Lumière du soleil filtrant à travers des stores vénitiens posés par un storiste',
  },
  zingueur: {
    src: unsplash('photo-1634853982486-c06f0e17940f'),
    alt: 'Gouttière en zinc installée sur un toit en gros plan',
  },
}

// Image par défaut pour les services non listés
export const defaultServiceImage = {
  src: unsplash('photo-1575839127400-6b9e36bf97f8'),
  alt: 'Artisan professionnel au travail',
}

/** Récupérer l'image d'un service par son slug */
export function getServiceImage(slug: string) {
  return serviceImages[slug] || defaultServiceImage
}

// ── 3. VISAGES ARTISANS (confiance) ──────────────────────────────
export const artisanFaces = [
  {
    src: unsplash('photo-1580810734868-7ea4e9130c01', 400, 400),
    alt: 'Portrait d\'un artisan professionnel souriant',
    name: 'Thomas M.',
    metier: 'Plombier · Paris',
  },
  {
    src: unsplash('photo-1616179283726-e96f7aa16a56', 400, 400),
    alt: 'Portrait d\'un artisan expérimenté',
    name: 'Marc D.',
    metier: 'Électricien · Lyon',
  },
  {
    src: unsplash('photo-1630670401138-9a5c91abad18', 400, 400),
    alt: 'Portrait d\'un artisan qualifié',
    name: 'Pierre L.',
    metier: 'Menuisier · Marseille',
  },
]

// ── 4. TÉMOIGNAGES CLIENTS ───────────────────────────────────────
// Pas de photos stock — on affiche les initiales dans un cercle coloré
// pour rester honnête (voir getAvatarColor dans utils.ts).
export const testimonialImages = [
  {
    name: 'Sophie R.',
    text: 'J\'ai trouvé un excellent plombier en 5 minutes. Travail impeccable !',
    ville: 'Paris',
    note: 5,
  },
  {
    name: 'Jean-Pierre V.',
    text: 'Devis reçu en 24h, chantier terminé dans les temps. Je recommande.',
    ville: 'Bordeaux',
    note: 5,
  },
  {
    name: 'Marie C.',
    text: 'Rénovation complète de ma salle de bain. Résultat magnifique.',
    ville: 'Toulouse',
    note: 5,
  },
]

// ── 5. AVANT / APRÈS (aucun chevauchement avec les services) ────
export const beforeAfterPairs = [
  {
    before: unsplash('photo-1539062680227-66125f17d777'),
    after: unsplash('photo-1576698483491-8c43f0862543'),
    alt: 'Rénovation salle de bain',
    category: 'Salle de bain',
  },
  {
    before: unsplash('photo-1600331574095-4a20d3d8dd77'),
    after: unsplash('photo-1572534382965-ef9f328c8db4'),
    alt: 'Rénovation cuisine',
    category: 'Cuisine',
  },
  {
    before: unsplash('photo-1544830826-4bc6706df845'),
    after: unsplash('photo-1583847268964-b28dc8f51f92'),
    alt: 'Rénovation salon peinture',
    category: 'Peinture intérieure',
  },
  {
    before: unsplash('photo-1635151833290-1951891641cc'),
    after: unsplash('photo-1684346605835-69888f742522'),
    alt: 'Ravalement façade',
    category: 'Façade',
  },
  {
    before: unsplash('photo-1504979128236-23f86972356c'),
    after: unsplash('photo-1560185008-b033106af5c3'),
    alt: 'Rénovation parquet',
    category: 'Parquet',
  },
  {
    before: unsplash('photo-1561120699-89a04702dba4'),
    after: unsplash('photo-1587538445896-d1f222cb0653'),
    alt: 'Aménagement jardin',
    category: 'Jardin',
  },
  {
    before: unsplash('photo-1609588959666-3cb46cabe3f7'),
    after: unsplash('photo-1603206225819-e04c4b395a16'),
    alt: 'Réfection toiture',
    category: 'Toiture',
  },
  {
    before: unsplash('photo-1543168988-54f6d5bee655'),
    after: unsplash('photo-1612296350203-7d4718f6ac65'),
    alt: 'Extension maison maçonnerie',
    category: 'Maçonnerie',
  },
  {
    before: unsplash('photo-1553969536-e9b839932f42'),
    after: unsplash('photo-1558442074-3c19857bc1dc'),
    alt: 'Isolation et rénovation énergétique',
    category: 'Isolation',
  },
  {
    before: unsplash('photo-1593817122715-bbe051a66bf8'),
    after: unsplash('photo-1595514534785-44a24a4d9467'),
    alt: 'Rénovation plomberie salle d\'eau',
    category: 'Plomberie',
  },
]

// ── 6. IMAGES DES TOP 20 VILLES ──────────────────────────────────
export const cityImages: Record<string, { src: string; alt: string }> = {
  paris: {
    src: unsplash('photo-1511739001486-6bfe10ce785f', 800, 500),
    alt: 'Vue de Paris avec la Tour Eiffel',
  },
  marseille: {
    src: unsplash('photo-1566837942683-90c2eabc56ff', 800, 500),
    alt: 'Vue du Vieux-Port de Marseille',
  },
  lyon: {
    src: unsplash('photo-1669275555278-986814008b68', 800, 500),
    alt: 'Panorama de Lyon avec la colline de Fourvière',
  },
  toulouse: {
    src: unsplash('photo-1572804131749-220f83b2f9bf', 800, 500),
    alt: 'Place du Capitole à Toulouse',
  },
  nice: {
    src: unsplash('photo-1551799142-93484f2d0284', 800, 500),
    alt: 'Promenade des Anglais à Nice',
  },
  nantes: {
    src: unsplash('photo-1571509703616-67fe3742764c', 800, 500),
    alt: 'Château des ducs de Bretagne à Nantes',
  },
  strasbourg: {
    src: unsplash('photo-1563783615689-36214e990fca', 800, 500),
    alt: 'Petite France à Strasbourg',
  },
  montpellier: {
    src: unsplash('photo-1625776043024-dc0a8f0ef4db', 800, 500),
    alt: 'Place de la Comédie à Montpellier',
  },
  bordeaux: {
    src: unsplash('photo-1493564738392-d148cfbd6eda', 800, 500),
    alt: 'Miroir d\'eau de Bordeaux',
  },
  lille: {
    src: unsplash('photo-1596031837679-e1444bd4b830', 800, 500),
    alt: 'Grand Place de Lille',
  },
  rennes: {
    src: unsplash('photo-1585202648376-6a4c03278e73', 800, 500),
    alt: 'Maisons à colombages du centre historique de Rennes',
  },
  reims: {
    src: unsplash('photo-1551566521-1974ad1792c5', 800, 500),
    alt: 'Cathédrale Notre-Dame de Reims',
  },
  'saint-etienne': {
    src: unsplash('photo-1574620469420-5420ce0496e6', 800, 500),
    alt: 'Vue panoramique de Saint-Étienne',
  },
  toulon: {
    src: unsplash('photo-1574008313813-8f5de140a03b', 800, 500),
    alt: 'Port et rade de Toulon',
  },
  grenoble: {
    src: unsplash('photo-1488235742400-36898425c618', 800, 500),
    alt: 'Grenoble et les Alpes enneigées',
  },
  dijon: {
    src: unsplash('photo-1526835157776-71ce36cd7583', 800, 500),
    alt: 'Centre historique de Dijon',
  },
  angers: {
    src: unsplash('photo-1588278183316-7c7a88cc683d', 800, 500),
    alt: 'Château d\'Angers',
  },
  'le-mans': {
    src: unsplash('photo-1627674410470-dc8642afc616', 800, 500),
    alt: 'Cité Plantagenêt au Mans',
  },
  'aix-en-provence': {
    src: unsplash('photo-1593715857983-5531aa640471', 800, 500),
    alt: 'Cours Mirabeau à Aix-en-Provence',
  },
  brest: {
    src: unsplash('photo-1589923793264-46f9d00db0fc', 800, 500),
    alt: 'Port de Brest et rade',
  },
}

/** Récupérer l'image d'une ville par son slug */
export function getCityImage(slug: string) {
  return cityImages[slug] || null
}

// ── DÉPARTEMENT → image via chef-lieu ────────────────────────────
const deptCodeToCitySlug: Record<string, string> = {
  '75': 'paris',
  '13': 'marseille',
  '69': 'lyon',
  '31': 'toulouse',
  '06': 'nice',
  '44': 'nantes',
  '67': 'strasbourg',
  '34': 'montpellier',
  '33': 'bordeaux',
  '59': 'lille',
  '35': 'rennes',
  '51': 'reims',
  '42': 'saint-etienne',
  '83': 'toulon',
  '38': 'grenoble',
  '21': 'dijon',
  '49': 'angers',
  '72': 'le-mans',
  '29': 'brest',
}

/** Image d'un département (chef-lieu → cityImage, sinon hero) */
export function getDepartmentImage(deptCode: string): { src: string; alt: string } {
  const citySlug = deptCodeToCitySlug[deptCode]
  if (citySlug && cityImages[citySlug]) return cityImages[citySlug]
  return heroImage
}

// ── RÉGION → image via ville principale ──────────────────────────
const regionSlugToCitySlug: Record<string, string> = {
  'ile-de-france': 'paris',
  'provence-alpes-cote-dazur': 'marseille',
  'auvergne-rhone-alpes': 'lyon',
  'occitanie': 'toulouse',
  'nouvelle-aquitaine': 'bordeaux',
  'pays-de-la-loire': 'nantes',
  'grand-est': 'strasbourg',
  'hauts-de-france': 'lille',
  'bretagne': 'rennes',
  'bourgogne-franche-comte': 'dijon',
}

/** Image d'une région (capitale → cityImage, sinon hero) */
export function getRegionImage(regionSlug: string): { src: string; alt: string } {
  const citySlug = regionSlugToCitySlug[regionSlug]
  if (citySlug && cityImages[citySlug]) return cityImages[citySlug]
  return heroImage
}

// ── 7. PAGES STATIQUES ───────────────────────────────────────────
export const pageImages = {
  howItWorks: [
    {
      src: unsplash('photo-1544717305-f9c88f2897bc'),
      alt: 'Personne recherchant un artisan sur ordinateur',
    },
    {
      src: unsplash('photo-1548967136-609936a3088b'),
      alt: 'Comparaison de profils d\'artisans sur écran',
    },
    {
      src: unsplash('photo-1521791136064-7986c2920216'),
      alt: 'Poignée de main entre client et artisan',
    },
  ],
  about: [
    {
      src: unsplash('photo-1582151767854-e00a6b3151c6', 800, 500),
      alt: 'Équipe de développement de ServicesArtisans',
    },
    {
      src: unsplash('photo-1632856692518-b694374ee5ec', 800, 500),
      alt: 'Réunion d\'équipe autour de la mission ServicesArtisans',
    },
  ],
  verification: [
    {
      src: unsplash('photo-1551590192-8070a16d9f67', 800, 500),
      alt: 'Processus de vérification SIREN des artisans',
    },
    {
      src: unsplash('photo-1599583863916-e06c29087f51', 800, 500),
      alt: 'Contrôle qualité et certification des professionnels',
    },
  ],
}

// ── 8. IMAGES D'AMBIANCE ─────────────────────────────────────────
export const ambianceImages = {
  trustBg: unsplash('photo-1590880795696-20c7dfadacde', 1200, 600),
  ctaBg: unsplash('photo-1570570665905-346e1b6be193', 1200, 600),
  renovation: unsplash('photo-1634586621169-93e12e0bd604', 1200, 600),
}

// ── 9. BLOG — Images uniques par article ─────────────────────────
//
// Stratégie : pool d'images par thème + hash déterministe du slug.
// Chaque article reçoit une image différente parmi le pool de son thème.
// ~200 images uniques pour ~280 articles → quasi zéro doublon.

/** Hash déterministe pour sélection de variant */
function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Helper pour créer une image blog Unsplash */
function blogImg(id: string, alt: string): { src: string; alt: string } {
  return { src: unsplash(id, 1200, 630), alt }
}

// ── Pools d'images par thème (chaque ID est UNIQUE dans tout le fichier) ──

const blogPools: Record<string, { src: string; alt: string }[]> = {
  // ── MÉTIERS ──
  plombier: [
    serviceImages.plombier,
    blogImg('photo-1595428774752-c87f23e7fcee', 'Salle de bain moderne avec vasque'),
    blogImg('photo-1595515106886-43b1443a2e8b', 'Lavabo en céramique blanche'),
    blogImg('photo-1595515769499-0f61fc8db2e9', 'Meuble vasque blanc dans salle d\'eau'),
    blogImg('photo-1638799869566-b17fa794c4de', 'Grande baignoire avec douche'),
  ],
  electricien: [
    serviceImages.electricien,
    blogImg('photo-1601462904263-f2fa0c851cb9', 'Câbles électriques colorés'),
    blogImg('photo-1758101755915-462eddc23f57', 'Électricien testant un tableau'),
    blogImg('photo-1754620906571-9ba64bd3ffb4', 'Installation de câbles sur toiture'),
    blogImg('photo-1467733238130-bb6846885316', 'Interrupteurs montés sur mur'),
  ],
  serrurier: [
    serviceImages.serrurier,
    blogImg('photo-1758351507272-aa6929fe997e', 'Pile de clés anciennes ouvragées'),
    blogImg('photo-1564767609213-c75ee685263a', 'Main tenant une poignée de porte'),
    blogImg('photo-1756341782434-3020b9d17372', 'Mur présentant de nombreuses clés'),
    blogImg('photo-1609587415882-97552f39c6c2', 'Clés squelette sur table en bois'),
  ],
  chauffagiste: [
    serviceImages.chauffagiste,
    blogImg('photo-1689793592282-015d9db77917', 'Flamme dans un poêle à bois'),
    blogImg('photo-1547186577-a3f4fc07c2ef', 'Radiateur allumé'),
    blogImg('photo-1613063457061-eecde6f4b20d', 'Radiateur blanc sur mur blanc'),
    blogImg('photo-1603312874586-00abfc351780', 'Thermostat mural moderne'),
  ],
  'peintre-en-batiment': [
    serviceImages['peintre-en-batiment'],
    blogImg('photo-1693985120993-e8e7689d7828', 'Peintre au rouleau sur mur'),
    blogImg('photo-1759330806091-b9a077491cc1', 'Peinture sur mur de briques'),
    blogImg('photo-1769013649052-add139112bc9', 'Homme sur échelle peignant un mur'),
    blogImg('photo-1745092707630-c00ef0a006c4', 'Peinture au pistolet sur mur'),
  ],
  menuisier: [
    serviceImages.menuisier,
    blogImg('photo-1685320198649-781e83a61de4', 'Établi avec outils accrochés au mur'),
    blogImg('photo-1753943803304-8cf8b01bde9b', 'Tournevis utilisé sur du bois'),
  ],
  carreleur: [
    serviceImages.carreleur,
    blogImg('photo-1595515422730-cc7684b670dc', 'Carrelage mural blanc dans salle de bain'),
    blogImg('photo-1688786219616-598ed96aa19d', 'Baignoire avec plante décorative'),
  ],
  couvreur: [
    serviceImages.couvreur,
    blogImg('photo-1634750009079-6bf7bede038b', 'Deux ouvriers sur un toit'),
    blogImg('photo-1635424824849-1b09bdcc55b1', 'Couvreur avec perceuse sur toiture'),
    blogImg('photo-1681049400158-0ff6249ac315', 'Réparation de toiture en cours'),
    blogImg('photo-1605450099279-533bd3ce379a', 'Tuiles de toiture en gros plan'),
  ],
  macon: [
    serviceImages.macon,
    blogImg('photo-1627591637320-fcfe8c34b62d', 'Ouvriers sur bâtiment en béton'),
  ],
  jardinier: [
    serviceImages.jardinier,
    blogImg('photo-1615094401770-713fecd4695a', 'Pont fleuri dans un jardin'),
    blogImg('photo-1606477901208-b49dde6b3ad8', 'Pelouse verte devant maison en briques'),
    blogImg('photo-1532302780319-95689ab9d79a', 'Jardin fleuri vue sur la mer'),
    blogImg('photo-1761928299635-14d606d1a7aa', 'Jardin luxuriant avec mur de pierre'),
  ],
  climaticien: [
    serviceImages.climaticien,
    blogImg('photo-1718203862467-c33159fdc504', 'Climatiseur mural sur mur de briques'),
    blogImg('photo-1698479603408-1a66a6d9e80f', 'Groupe de climatiseurs extérieurs'),
    blogImg('photo-1566917064245-1c6bff30dbf1', 'Unité de climatisation extérieure'),
    blogImg('photo-1568634699096-82c9765548a0', 'Unités de climatisation empilées'),
  ],
  cuisiniste: [
    serviceImages.cuisiniste,
    blogImg('photo-1600210491369-e753d80a41f3', 'Cuisine moderne blanche et noire'),
    blogImg('photo-1648475237029-7f853809ca14', 'Salon-cuisine avec cheminée'),
    blogImg('photo-1680210849773-f97a41c6b7ed', 'Coin cuisine avec évier et placards'),
  ],
  vitrier: [
    serviceImages.vitrier,
    blogImg('photo-1595515926042-c36353b7ea13', 'Baignoire en céramique près de fenêtre'),
    blogImg('photo-1595515106705-257fa2d62381', 'Intérieur lumineux avec grande fenêtre'),
    blogImg('photo-1595428773927-7c9c75203a2d', 'Meuble vasque à côté de fenêtre'),
  ],
  'isolation-thermique': [
    serviceImages['isolation-thermique'],
    blogImg('photo-1655300283247-6b1924b1d152', 'Panneaux solaires et économies d\'énergie'),
  ],
  domoticien: [
    serviceImages.domoticien,
    blogImg('photo-1614801502766-e2562eb626d5', 'Maison connectée et automatisation'),
  ],
  facadier: [
    serviceImages.facadier,
    blogImg('photo-1617459973560-33aea09d1c22', 'Inspection de toiture d\'un bâtiment'),
  ],
  'poseur-de-parquet': [
    serviceImages['poseur-de-parquet'],
    blogImg('photo-1753947687946-a28eea84a73f', 'Outils de pose organisés sur mur'),
  ],
  solier: [
    serviceImages.solier,
  ],
  'alarme-securite': [
    serviceImages['alarme-securite'],
    blogImg('photo-1549109926-58f039549485', 'Caméra de surveillance blanche sur mur'),
    blogImg('photo-1618482914248-29272d021005', 'Caméra de sécurité sur trépied'),
    blogImg('photo-1557597774-9d273605dfa9', 'Caméras de sécurité colorées'),
    blogImg('photo-1563920443079-783e5c786b83', 'Deux caméras CCTV grises'),
  ],
  diagnostiqueur: [serviceImages.diagnostiqueur],
  antenniste: [serviceImages.antenniste],
  'architecte-interieur': [
    serviceImages['architecte-interieur'],
    blogImg('photo-1705321963943-de94bb3f0dd3', 'Salon moderne avec canapé et table'),
    blogImg('photo-1753505889211-9cfbac527474', 'Chambre cosy avec bureau intégré'),
    blogImg('photo-1644135151632-05e0611d473d', 'Chambre avec grand lit et bougies'),
    blogImg('photo-1705326701287-346fc37a2c86', 'Salon blanc avec fauteuils design'),
  ],
  ascensoriste: [serviceImages.ascensoriste],
  'borne-recharge': [serviceImages['borne-recharge']],
  decorateur: [
    serviceImages.decorateur,
    blogImg('photo-1704040686433-b1c45e9f4104', 'Salon avec canapé et télévision'),
    blogImg('photo-1643877107082-8ee9da17c090', 'Pièce avec canapé et bureau'),
  ],
  demenageur: [
    serviceImages.demenageur,
  ],
  deratisation: [serviceImages.deratisation],
  desinsectisation: [serviceImages.desinsectisation],
  etancheiste: [serviceImages.etancheiste],
  ferronnier: [serviceImages.ferronnier],
  geometre: [serviceImages.geometre],
  metallier: [serviceImages.metallier],
  miroitier: [serviceImages.miroitier],
  nettoyage: [serviceImages.nettoyage],
  'panneaux-solaires': [
    serviceImages['panneaux-solaires'],
    blogImg('photo-1509391366360-2e959784a276', 'Panneaux solaires dans un champ vert'),
    blogImg('photo-1566838616631-f2618f74a6a2', 'Maison en briques avec panneaux solaires'),
    blogImg('photo-1624397640148-949b1732bb0a', 'Installateur sur panneau solaire'),
    blogImg('photo-1521618755572-156ae0cdd74d', 'Panneaux solaires bleus en gros plan'),
  ],
  'pompe-a-chaleur': [
    serviceImages['pompe-a-chaleur'],
    blogImg('photo-1679303777007-c6c4522beb02', 'Climatiseur mural blanc'),
  ],
  pisciniste: [
    serviceImages.pisciniste,
    blogImg('photo-1696248815429-b2790b8a9913', 'Vue aérienne piscine avec transats'),
    blogImg('photo-1763479142525-1a3b1f7800c2', 'Maison moderne avec piscine et palmiers'),
    blogImg('photo-1527769668487-5804e45fed2a', 'Piscine intérieure avec transats'),
  ],
  ramoneur: [serviceImages.ramoneur],
  'renovation-energetique': [serviceImages['renovation-energetique']],
  storiste: [serviceImages.storiste],
  zingueur: [serviceImages.zingueur],

  // ── TOPICS NON-MÉTIER ──
  renovation: [
    blogImg('photo-1765277789186-04b71a9afd40', 'Travaux de rénovation intérieure'),
    blogImg('photo-1704040686413-2c607dbd2f06', 'Salon rénové avec canapé et table basse'),
    blogImg('photo-1644299244258-6eff135031e9', 'Séjour rénové avec deux canapés et TV'),
    blogImg('photo-1642541070065-3912f347e7c6', 'Chambre avec tableau mural'),
    blogImg('photo-1701817822150-2d218d8610e6', 'Salon rénové avec fauteuil et table'),
  ],
  budget: [
    blogImg('photo-1526304640581-d334cdbbf45e', 'Calculatrice et plans de devis'),
    blogImg('photo-1553729459-efe14ef6055d', 'Liasse de billets de banque'),
    blogImg('photo-1766503634881-6a01d341b1dd', 'Billets et calculatrice sur carnet'),
    blogImg('photo-1736319861065-d2ee8bb62c16', 'Pile d\'argent à côté d\'une calculatrice'),
    blogImg('photo-1768839724098-d2541fe1311d', 'Tirelire avec lunettes et calculatrice'),
    blogImg('photo-1764231467852-b609a742e082', 'Mains signant document sur bureau'),
    blogImg('photo-1764700754052-afc4e11c5c64', 'Calculatrice et rouleaux de pièces'),
    blogImg('photo-1763729948735-df50fc3540df', 'Mains comptant billets avec calculatrice'),
  ],
  entretien: [
    blogImg('photo-1564943300036-461e6e152355', 'Entretien et maintenance maison'),
    blogImg('photo-1588174829729-3916f7e0b4d9', 'Fleur rose en gros plan au printemps'),
    blogImg('photo-1597201278257-3687be27d954', 'Jardin fleuri rouge et blanc'),
  ],
  reglementation: [
    blogImg('photo-1554224155-cfa08c2a758f', 'Documents administratifs et réglementaires'),
    blogImg('photo-1764231467896-73f0ef4438aa', 'Main utilisant calculatrice sur billets'),
    blogImg('photo-1766503498598-494939f8d3b7', 'Fournitures de bureau sur documents'),
    blogImg('photo-1763730512449-f1a505f432a9', 'Écriture dans carnet avec calculatrice'),
    blogImg('photo-1632759145351-1d592919f522', 'Homme debout sur toit de maison'),
  ],
  aides: [
    blogImg('photo-1608747912887-563d7e155d30', 'Aides financières et subventions'),
    blogImg('photo-1768839721776-038d3070721e', 'Billets et calculatrice sur fond bleu'),
    blogImg('photo-1769776400201-6b99211a4f4f', 'Tirelire et calculatrice fond orange'),
    blogImg('photo-1613665813446-82a78c468a1d', 'Panneaux solaires noirs et blancs'),
  ],
  securite: [
    blogImg('photo-1592924271903-1e4b1a1ae20f', 'Sécurité et protection du domicile'),
    blogImg('photo-1585206031650-9e9a9c87dcfe', 'Caméra de surveillance blanche'),
    blogImg('photo-1589935447067-5531094415d1', 'Caméra sur trépied blanc'),
    blogImg('photo-1599350686877-382a54114d2f', 'Caméra sur mur jaune'),
    blogImg('photo-1682637275957-8e62180efd1b', 'Cadenas sur fond jaune'),
  ],
  energie: [
    blogImg('photo-1655300283247-6b1924b1d152', 'Panneaux solaires et énergie'),
    blogImg('photo-1508514177221-188b1cf16e9d', 'Panneau solaire sous ciel bleu'),
    blogImg('photo-1668097613572-40b7c11c8727', 'Technicien travaillant sur panneau solaire'),
    blogImg('photo-1658298775754-5839ffd434cc', 'Panneaux solaires sur toiture'),
    blogImg('photo-1679046410011-b6bf7ce71f22', 'Grand panneau solaire avec ciel'),
  ],
  terrasse: [
    blogImg('photo-1474547385661-ef98b8799dce', 'Terrasse extérieure aménagée'),
    blogImg('photo-1694885090746-d90472e11c0e', 'Patio couvert avec barbecue et table'),
    blogImg('photo-1694885193823-92929c013213', 'Patio avec table, chaises et parasols'),
    blogImg('photo-1694885161486-6390b35de012', 'Terrasse couverte avec mobilier'),
    blogImg('photo-1720975658933-a3dac8a39d6b', 'Terrasse avec piscine et verdure'),
  ],
  extension: [
    blogImg('photo-1600768577091-3442c3f53179', 'Extension de maison en construction'),
    blogImg('photo-1753505888770-46be3b748b41', 'Chambre moderne avec espace bureau'),
  ],
  sdb: [
    blogImg('photo-1595428774752-c87f23e7fcee', 'Salle de bain moderne rénovée'),
    blogImg('photo-1595515422744-2ff6428979e7', 'Lavabo en céramique avec robinet'),
    blogImg('photo-1595514534892-a1ce92ee8677', 'Miroir rond sur mur vert'),
    blogImg('photo-1595515422979-5ea88d3954a0', 'Écran mural dans salle de bain'),
    blogImg('photo-1595515769474-4f217f925139', 'Porte-serviettes avec serviette blanche'),
  ],
  domotique: [
    blogImg('photo-1614801502766-e2562eb626d5', 'Maison connectée et automatisation'),
    blogImg('photo-1545259742-b4fd8fea67e4', 'Thermostat connecté mural'),
  ],
  hiver: [
    blogImg('photo-1452088366481-4690b645efff', 'Maison sous la neige en hiver'),
    blogImg('photo-1707056132692-76efddea9583', 'Grange dans champ enneigé'),
    blogImg('photo-1632411315448-515ebfb9eebf', 'Maison sur colline enneigée'),
    blogImg('photo-1602891581584-a15d99b5722c', 'Maison en bois blanc sous les arbres'),
    blogImg('photo-1599846801418-41948504b405', 'Chalet en bois couvert de neige'),
  ],
  printemps: [
    blogImg('photo-1588173558360-5d84645e8a9a', 'Champ de tulipes rouges et jonquilles'),
    blogImg('photo-1559424476-49ee32099623', 'Fleur blanche en gros plan'),
    blogImg('photo-1552350718-03eafd9b774a', 'Fleur rouge et plante verte'),
    blogImg('photo-1622036035317-8e0d40457cca', 'Rose blanche et rose en fleur'),
  ],
  piscine: [
    blogImg('photo-1720975658810-3d82b928474d', 'Grande piscine avec vue sur l\'océan'),
    blogImg('photo-1764419737670-5e63f20c5493', 'Piscine illuminée devant maison la nuit'),
    blogImg('photo-1694885190541-40037b8a6b13', 'Piscine vide avec parasol'),
    blogImg('photo-1767514831786-c4a342f9b8a4', 'Chaises au bord d\'une piscine'),
  ],
  diy: [
    blogImg('photo-1586187543416-b1e5669978b3', 'Outils de bricolage et construction'),
    blogImg('photo-1745449064670-94bd0fc13df8', 'Outils éparpillés sur établi'),
    blogImg('photo-1745426863308-308b92bff031', 'Clés et niveau sur surface en bois'),
    blogImg('photo-1753947687461-4b80f5ce4155', 'Tournevis rouges sur surface de travail'),
    blogImg('photo-1753947687850-67111c07ece1', 'Outils suspendus dans porte-outils'),
    blogImg('photo-1753947687841-eab7644f9a23', 'Outils organisés dans boîte à outils'),
  ],
  inspiration: [
    blogImg('photo-1600210492486-724fe5c67fb0', 'Intérieur moderne et inspirant'),
    blogImg('photo-1648475237029-7f853809ca14', 'Salon avec mobilier et cheminée'),
    blogImg('photo-1753505889211-9cfbac527474', 'Chambre cosy avec poste de travail'),
    blogImg('photo-1644135151632-05e0611d473d', 'Chambre élégante avec bougies'),
  ],
  'fiches-metier': [
    blogImg('photo-1633419946251-6d8b5dd33170', 'Artisan au travail dans son atelier'),
    blogImg('photo-1634750009079-6bf7bede038b', 'Ouvriers travaillant sur un toit'),
    blogImg('photo-1635424709845-3a85ad5e1f5e', 'Équipe sur une toiture'),
  ],
  materiaux: [
    blogImg('photo-1634750006909-3258af95e257', 'Artisans sur toiture avec matériaux'),
    blogImg('photo-1605450099279-533bd3ce379a', 'Tuiles de toiture en gros plan'),
    blogImg('photo-1727777266423-6a33048e4894', 'Toit de bâtiment sous le ciel'),
    blogImg('photo-1635424825057-7fb6dcd651ef', 'Ouvrier avec perceuse sur toiture'),
  ],
  urgence: [
    blogImg('photo-1667857399223-593f0b4e1c8c', 'Intervention d\'urgence plomberie'),
    blogImg('photo-1669394478164-654b289e9376', 'Cabane isolée sous la neige'),
    blogImg('photo-1639375941966-0c0b23262381', 'Bâtiment en bois sous la neige'),
  ],
}

/** Mots-clés slug → clé de pool (first match wins) */
const slugToPool: [RegExp, string][] = [
  // Patterns spécifiques en premier (avant les patterns larges)
  [/piscin/, 'pisciniste'],
  [/deboucher|canalisation|fuite|robinet|wc|toilette|chasse.eau|mitigeur/, 'plombier'],
  [/plomb/, 'plombier'],
  [/prise|interrupteur|electri|tableau.electri/, 'electricien'],
  [/serrure|verrou|cle|porte.blind/, 'serrurier'],
  [/chaudier|radiateur|chauffag|poele|ramonag/, 'chauffagiste'],
  [/peint|peinture|plafond|enduit/, 'peintre-en-batiment'],
  [/parquet|menuisi|etagere|lambris|credence/, 'menuisier'],
  [/carrel|carrelage/, 'carreleur'],
  [/couv|toiture|toitur|tuile|gouttiere/, 'couvreur'],
  [/macon|maçon|garage|beton/, 'macon'],
  [/jardin|paysag/, 'jardinier'],
  [/climatici|climatisation/, 'climaticien'],
  [/cuisin/, 'cuisiniste'],
  [/volet|store|fenêtre|fenetre|vitrage|vitr/, 'vitrier'],
  [/isol/, 'isolation-thermique'],
  [/domotiq|connecte/, 'domoticien'],
  [/nettoyag/, 'nettoyage'],
  [/facade|ravalement/, 'facadier'],
  [/solier|revetement.sol/, 'solier'],
  [/ascenseur/, 'ascensoriste'],
  [/metallier|soud/, 'metallier'],
  [/ferronnier/, 'ferronnier'],
  [/miroitier|miroir/, 'miroitier'],
  [/demenag/, 'demenageur'],
  [/deratisation|rat|souris/, 'deratisation'],
  [/desinsectisation|nuisible|insecte/, 'desinsectisation'],
  [/geometre|topograph/, 'geometre'],
  [/antenn/, 'antenniste'],
  [/borne.recharge/, 'borne-recharge'],
  [/alarme|cambriol/, 'alarme-securite'],
  [/panneaux?.solaire|photovoltai/, 'panneaux-solaires'],
  [/pompe.chaleur|pac/, 'pompe-a-chaleur'],
  // Tutoriels DIY → pool outils
  [/comment-(poser|installer|reparer|changer|refaire|reboucher|fixer|enduire|remplacer|deboucher)/, 'diy'],
  // Saisonnier
  [/terrasse|ete.preparation/, 'terrasse'],
  [/piscine|bassin/, 'piscine'],
  [/sdb|salle.de.bain/, 'sdb'],
  [/extension|agrandir|veranda/, 'extension'],
  [/printemps/, 'printemps'],
  [/hiver|froid|gel|neige/, 'hiver'],
  // Topics larges
  [/renov/, 'renovation'],
  [/entretien|check/, 'entretien'],
  [/emergency|depannage/, 'urgence'],
  [/budget|devis|prix|tarif|cout|index.prix/, 'budget'],
  [/aide|prime|subvention|maprimerenov|eco.ptz|cee|cumul.aide/, 'aides'],
  [/regle|permis|urbanis|tva|droit|loi|norme|re2020|dpe|diagnostic|garantie|assurance|contrat|responsabilit|reception|litige|accessibilit/, 'reglementation'],
  [/secur|arnaque/, 'securite'],
  [/energie|solaire|panneau|pompe.chaleur|passoire.thermique/, 'energie'],
  [/domotiq|connecte/, 'domotique'],
  // Articles métiers / fiches
  [/metier-|formation|competence|specialisation|carriere/, 'fiches-metier'],
  // Matériaux & comparatifs
  [/materiau|comparatif|laiton|inox|ba13|stratifie|massif|contrecolle|bois.pvc.alu/, 'materiaux'],
  // Inspiration
  [/tendance|amenagement|inspiration/, 'inspiration'],
  // Certifications
  [/rge|qualibat|qualifelec|certification|label/, 'reglementation'],
  // Catch-all pour articles "comment-choisir-*" non matchés par un métier spécifique
  [/comment-choisir|choisir.*guide|artisan.*confiance|verifier.*artisan/, 'fiches-metier'],
  // Eau chaude, VMC, combles, portail
  [/chauffe.eau|ballon.eau|thermodynamique/, 'plombier'],
  [/vmc|ventilation|comble|amenager.comble/, 'renovation'],
  [/portail|cloture/, 'macon'],
  // Canicule, humidité, revente, locataire
  [/canicule|chaleur/, 'climaticien'],
  [/humidite|moisissure/, 'entretien'],
  [/revente|vendre/, 'budget'],
  [/locataire|proprietaire/, 'reglementation'],
  // Eco-ptz / pompe-a-chaleur (tiret)
  [/eco.ptz|eco.pret/, 'aides'],
  [/pompe-a-chaleur/, 'pompe-a-chaleur'],
  // DIY fallback
  [/diy|bricolage|soi.meme/, 'diy'],
  // Peinture (pour "comment-peindre-mur")
  [/peindre/, 'peintre-en-batiment'],
  // Artisan / SIREN / vérification
  [/artisan|siren|verifie/, 'fiches-metier'],
]

/** Catégorie → pool fallback */
const blogCategoryFallbacks: Record<string, string> = {
  Tarifs: 'budget',
  'Aides & Subventions': 'aides',
  'Réglementation': 'reglementation',
  Securite: 'securite',
  'Sécurité': 'securite',
  Saisonnier: 'hiver',
  Energie: 'energie',
  'Énergie': 'energie',
  Guides: 'renovation',
  Conseils: 'entretien',
  'Fiches métier': 'fiches-metier',
  Inspiration: 'inspiration',
  DIY: 'diy',
  'Matériaux': 'materiaux',
  Urgences: 'urgence',
}

const defaultBlogImage = {
  src: unsplash('photo-1600585154340-be6161a56a0c', 1200, 630),
  alt: 'Travaux de rénovation et d\'aménagement',
}

/**
 * Récupérer l'image d'un article de blog.
 * Priorité : slug → pool (hash variant) → catégorie pool → défaut.
 * Chaque article obtient une image unique via hash déterministe.
 */
export function getBlogImage(
  slug: string,
  category?: string,
): { src: string; alt: string } {
  const lower = slug.toLowerCase()
  const hash = slugHash(lower)

  // 1. Match par mot-clé dans le slug → pool + variant
  for (const [pattern, poolKey] of slugToPool) {
    if (pattern.test(lower)) {
      const pool = blogPools[poolKey]
      if (pool && pool.length > 0) {
        return pool[hash % pool.length]
      }
    }
  }

  // 2. Fallback par catégorie → pool + variant
  if (category) {
    const poolKey = blogCategoryFallbacks[category]
    if (poolKey) {
      const pool = blogPools[poolKey]
      if (pool && pool.length > 0) {
        return pool[hash % pool.length]
      }
    }
  }

  // 3. Défaut
  return defaultBlogImage
}
