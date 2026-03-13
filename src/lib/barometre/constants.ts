/**
 * Constantes pour le Baromètre des Artisans
 * Métiers, régions, départements — mapping pour les URL propres
 */

// ---------------------------------------------------------------------------
// Métiers principaux (top 30 pour generateStaticParams)
// ---------------------------------------------------------------------------

export interface BarometreMetier {
  slug: string
  label: string
  icon: string
}

export const BAROMETRE_METIERS: BarometreMetier[] = [
  { slug: 'plombier', label: 'Plombier', icon: '🔧' },
  { slug: 'electricien', label: 'Électricien', icon: '⚡' },
  { slug: 'serrurier', label: 'Serrurier', icon: '🔑' },
  { slug: 'chauffagiste', label: 'Chauffagiste', icon: '🔥' },
  { slug: 'peintre-en-batiment', label: 'Peintre en bâtiment', icon: '🎨' },
  { slug: 'menuisier', label: 'Menuisier', icon: '🪚' },
  { slug: 'carreleur', label: 'Carreleur', icon: '🧱' },
  { slug: 'couvreur', label: 'Couvreur', icon: '🏠' },
  { slug: 'macon', label: 'Maçon', icon: '🏗️' },
  { slug: 'jardinier', label: 'Jardinier', icon: '🌿' },
  { slug: 'vitrier', label: 'Vitrier', icon: '🪟' },
  { slug: 'climaticien', label: 'Climaticien', icon: '❄️' },
  { slug: 'plaquiste', label: 'Plaquiste', icon: '📐' },
  { slug: 'charpentier', label: 'Charpentier', icon: '🪓' },
  { slug: 'terrassier', label: 'Terrassier', icon: '🚧' },
  { slug: 'facadier', label: 'Façadier', icon: '🏢' },
  { slug: 'paysagiste', label: 'Paysagiste', icon: '🌳' },
  { slug: 'zingueur', label: 'Zingueur', icon: '💧' },
  { slug: 'etancheiste', label: 'Étanchéiste', icon: '🛡️' },
  { slug: 'platrier', label: 'Plâtrier', icon: '🧱' },
  { slug: 'metallier', label: 'Métallier', icon: '⚙️' },
  { slug: 'ferronnier', label: 'Ferronnier', icon: '🔗' },
  { slug: 'poseur-de-parquet', label: 'Poseur de parquet', icon: '🧱' },
  { slug: 'cuisiniste', label: 'Cuisiniste', icon: '🍳' },
  { slug: 'storiste', label: 'Storiste', icon: '🌞' },
  { slug: 'domoticien', label: 'Domoticien', icon: '🤖' },
  { slug: 'ramoneur', label: 'Ramoneur', icon: '🏭' },
  { slug: 'pisciniste', label: 'Pisciniste', icon: '🏊' },
  { slug: 'diagnostiqueur', label: 'Diagnostiqueur', icon: '📋' },
  { slug: 'demenageur', label: 'Déménageur', icon: '🚚' },
]

export function getBarometreMetierBySlug(slug: string): BarometreMetier | undefined {
  return BAROMETRE_METIERS.find((m) => m.slug === slug)
}

// ---------------------------------------------------------------------------
// Régions métropolitaines (13 + 5 DOM-TOM)
// ---------------------------------------------------------------------------

export interface BarometreRegion {
  slug: string
  name: string
  departements: { code: string; nom: string }[]
}

export const BAROMETRE_REGIONS: BarometreRegion[] = [
  {
    slug: 'ile-de-france',
    name: 'Île-de-France',
    departements: [
      { code: '75', nom: 'Paris' },
      { code: '77', nom: 'Seine-et-Marne' },
      { code: '78', nom: 'Yvelines' },
      { code: '91', nom: 'Essonne' },
      { code: '92', nom: 'Hauts-de-Seine' },
      { code: '93', nom: 'Seine-Saint-Denis' },
      { code: '94', nom: 'Val-de-Marne' },
      { code: '95', nom: "Val-d'Oise" },
    ],
  },
  {
    slug: 'auvergne-rhone-alpes',
    name: 'Auvergne-Rhône-Alpes',
    departements: [
      { code: '01', nom: 'Ain' },
      { code: '03', nom: 'Allier' },
      { code: '07', nom: 'Ardèche' },
      { code: '15', nom: 'Cantal' },
      { code: '26', nom: 'Drôme' },
      { code: '38', nom: 'Isère' },
      { code: '42', nom: 'Loire' },
      { code: '43', nom: 'Haute-Loire' },
      { code: '63', nom: 'Puy-de-Dôme' },
      { code: '69', nom: 'Rhône' },
      { code: '73', nom: 'Savoie' },
      { code: '74', nom: 'Haute-Savoie' },
    ],
  },
  {
    slug: 'provence-alpes-cote-d-azur',
    name: "Provence-Alpes-Côte d'Azur",
    departements: [
      { code: '04', nom: 'Alpes-de-Haute-Provence' },
      { code: '05', nom: 'Hautes-Alpes' },
      { code: '06', nom: 'Alpes-Maritimes' },
      { code: '13', nom: 'Bouches-du-Rhône' },
      { code: '83', nom: 'Var' },
      { code: '84', nom: 'Vaucluse' },
    ],
  },
  {
    slug: 'occitanie',
    name: 'Occitanie',
    departements: [
      { code: '09', nom: 'Ariège' },
      { code: '11', nom: 'Aude' },
      { code: '12', nom: 'Aveyron' },
      { code: '30', nom: 'Gard' },
      { code: '31', nom: 'Haute-Garonne' },
      { code: '32', nom: 'Gers' },
      { code: '34', nom: 'Hérault' },
      { code: '46', nom: 'Lot' },
      { code: '48', nom: 'Lozère' },
      { code: '65', nom: 'Hautes-Pyrénées' },
      { code: '66', nom: 'Pyrénées-Orientales' },
      { code: '81', nom: 'Tarn' },
      { code: '82', nom: 'Tarn-et-Garonne' },
    ],
  },
  {
    slug: 'nouvelle-aquitaine',
    name: 'Nouvelle-Aquitaine',
    departements: [
      { code: '16', nom: 'Charente' },
      { code: '17', nom: 'Charente-Maritime' },
      { code: '19', nom: 'Corrèze' },
      { code: '23', nom: 'Creuse' },
      { code: '24', nom: 'Dordogne' },
      { code: '33', nom: 'Gironde' },
      { code: '40', nom: 'Landes' },
      { code: '47', nom: 'Lot-et-Garonne' },
      { code: '64', nom: 'Pyrénées-Atlantiques' },
      { code: '79', nom: 'Deux-Sèvres' },
      { code: '86', nom: 'Vienne' },
      { code: '87', nom: 'Haute-Vienne' },
    ],
  },
  {
    slug: 'pays-de-la-loire',
    name: 'Pays de la Loire',
    departements: [
      { code: '44', nom: 'Loire-Atlantique' },
      { code: '49', nom: 'Maine-et-Loire' },
      { code: '53', nom: 'Mayenne' },
      { code: '72', nom: 'Sarthe' },
      { code: '85', nom: 'Vendée' },
    ],
  },
  {
    slug: 'bretagne',
    name: 'Bretagne',
    departements: [
      { code: '22', nom: "Côtes-d'Armor" },
      { code: '29', nom: 'Finistère' },
      { code: '35', nom: 'Ille-et-Vilaine' },
      { code: '56', nom: 'Morbihan' },
    ],
  },
  {
    slug: 'grand-est',
    name: 'Grand Est',
    departements: [
      { code: '08', nom: 'Ardennes' },
      { code: '10', nom: 'Aube' },
      { code: '51', nom: 'Marne' },
      { code: '52', nom: 'Haute-Marne' },
      { code: '54', nom: 'Meurthe-et-Moselle' },
      { code: '55', nom: 'Meuse' },
      { code: '57', nom: 'Moselle' },
      { code: '67', nom: 'Bas-Rhin' },
      { code: '68', nom: 'Haut-Rhin' },
      { code: '88', nom: 'Vosges' },
    ],
  },
  {
    slug: 'normandie',
    name: 'Normandie',
    departements: [
      { code: '14', nom: 'Calvados' },
      { code: '27', nom: 'Eure' },
      { code: '50', nom: 'Manche' },
      { code: '61', nom: 'Orne' },
      { code: '76', nom: 'Seine-Maritime' },
    ],
  },
  {
    slug: 'hauts-de-france',
    name: 'Hauts-de-France',
    departements: [
      { code: '02', nom: 'Aisne' },
      { code: '59', nom: 'Nord' },
      { code: '60', nom: 'Oise' },
      { code: '62', nom: 'Pas-de-Calais' },
      { code: '80', nom: 'Somme' },
    ],
  },
  {
    slug: 'centre-val-de-loire',
    name: 'Centre-Val de Loire',
    departements: [
      { code: '18', nom: 'Cher' },
      { code: '28', nom: 'Eure-et-Loir' },
      { code: '36', nom: 'Indre' },
      { code: '37', nom: 'Indre-et-Loire' },
      { code: '41', nom: 'Loir-et-Cher' },
      { code: '45', nom: 'Loiret' },
    ],
  },
  {
    slug: 'bourgogne-franche-comte',
    name: 'Bourgogne-Franche-Comté',
    departements: [
      { code: '21', nom: "Côte-d'Or" },
      { code: '25', nom: 'Doubs' },
      { code: '39', nom: 'Jura' },
      { code: '58', nom: 'Nièvre' },
      { code: '70', nom: 'Haute-Saône' },
      { code: '71', nom: 'Saône-et-Loire' },
      { code: '89', nom: 'Yonne' },
      { code: '90', nom: 'Territoire de Belfort' },
    ],
  },
  {
    slug: 'corse',
    name: 'Corse',
    departements: [
      { code: '2A', nom: 'Corse-du-Sud' },
      { code: '2B', nom: 'Haute-Corse' },
    ],
  },
]

export function getBarometreRegionBySlug(slug: string): BarometreRegion | undefined {
  return BAROMETRE_REGIONS.find((r) => r.slug === slug)
}

// ---------------------------------------------------------------------------
// Top 20 villes pour le tableau sur les pages métier
// ---------------------------------------------------------------------------

export const TOP_VILLES = [
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice',
  'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille',
  'Rennes', 'Toulon', 'Reims', 'Saint-Étienne', 'Le Havre',
  'Dijon', 'Grenoble', 'Angers', 'Nîmes', 'Clermont-Ferrand',
]
