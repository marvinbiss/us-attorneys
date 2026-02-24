/**
 * NAF Codes Configuration for Artisan Collection
 *
 * 30 NAF codes × 101 departments = 3,030 collection tasks
 * Each task paginates through all results (25 per page)
 */

// NAF codes for artisan trades
export const CODES_NAF: Record<string, string> = {
  // Division 43 — Travaux de construction spécialisés (existing)
  '43.21A': "Travaux d'installation électrique dans tous locaux",
  '43.21B': "Travaux d'installation électrique sur la voie publique",
  '43.22A': "Travaux d'installation d'eau et de gaz en tous locaux",
  '43.22B': "Travaux d'installation d'équipements thermiques et de climatisation",
  '43.29A': "Travaux d'isolation",
  '43.29B': "Autres travaux d'installation n.c.a.",
  '43.31Z': 'Travaux de plâtrerie',
  '43.32A': 'Travaux de menuiserie bois et PVC',
  '43.32B': 'Travaux de menuiserie métallique et serrurerie',
  '43.32C': 'Agencement de lieux de vente',
  '43.33Z': 'Travaux de revêtement des sols et des murs',
  '43.34Z': 'Travaux de peinture et vitrerie',
  '43.39Z': 'Autres travaux de finition',
  '43.12A': 'Travaux de terrassement courants et travaux préparatoires',
  '43.12B': 'Travaux de terrassement spécialisés ou de grande masse',
  '43.91A': 'Travaux de charpente',
  '43.91B': 'Travaux de couverture par éléments',
  '43.99A': "Travaux d'étanchéification",
  '43.99C': 'Travaux de maçonnerie générale et gros oeuvre de bâtiment',

  // Division 25 — Produits métalliques
  '25.11Z': 'Fabrication de structures métalliques et de parties de structures',

  // Division 31 — Fabrication de meubles
  '31.02Z': 'Fabrication de meubles de cuisine',

  // Division 49 — Transports terrestres
  '49.42Z': 'Services de déménagement',

  // Division 71 — Architecture et ingénierie
  '71.11Z': "Activités d'architecture",
  '71.12B': 'Ingénierie, études techniques',
  '71.20B': 'Analyses, essais et inspections techniques',

  // Division 74 — Autres activités spécialisées
  '74.10Z': 'Activités spécialisées de design',

  // Division 81 — Services relatifs aux bâtiments et aménagement paysager
  '81.21Z': 'Nettoyage courant des bâtiments',
  '81.22Z': 'Autres activités de nettoyage des bâtiments et nettoyage industriel',
  '81.29A': 'Désinfection, désinsectisation, dératisation',
  '81.29B': 'Autres activités de nettoyage n.c.a.',
  '81.30Z': "Services d'aménagement paysager",
}

// Map NAF codes to our service specialties (must match service slugs exactly)
export const NAF_TO_SPECIALTY: Record<string, string> = {
  // Division 43
  '43.21A': 'electricien',
  '43.21B': 'electricien',
  '43.22A': 'plombier',
  '43.22B': 'chauffagiste',
  '43.29A': 'isolation-thermique',
  '43.29B': 'ascensoriste',
  '43.31Z': 'platrier',
  '43.32A': 'menuisier',
  '43.32B': 'serrurier',
  '43.32C': 'cuisiniste',
  '43.33Z': 'carreleur',
  '43.34Z': 'peintre-en-batiment',
  '43.39Z': 'solier',
  '43.12A': 'terrassier',
  '43.12B': 'terrassier',
  '43.91A': 'charpentier',
  '43.91B': 'couvreur',
  '43.99A': 'etancheiste',
  '43.99C': 'macon',
  // Division 25
  '25.11Z': 'metallier',
  // Division 31
  '31.02Z': 'cuisiniste',
  // Division 49
  '49.42Z': 'demenageur',
  // Division 71
  '71.11Z': 'architecte-interieur',
  '71.12B': 'geometre',
  '71.20B': 'diagnostiqueur',
  // Division 74
  '74.10Z': 'decorateur',
  // Division 81
  '81.21Z': 'nettoyage',
  '81.22Z': 'nettoyage',
  '81.29A': 'desinsectisation',
  '81.29B': 'ramoneur',
  '81.30Z': 'paysagiste',
}

// All French departments (métropole + DOM)
export const DEPARTEMENTS: string[] = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '23', '24', '25', '26', '27', '28', '29',
  '2A', '2B',
  '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
  '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
  '60', '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
  '80', '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '90', '91', '92', '93', '94', '95',
  '971', '972', '973', '974', '976',
]

export const DEPARTEMENT_NAMES: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier',
  '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes',
  '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube',
  '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados',
  '15': 'Cantal', '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher',
  '19': 'Corrèze', '21': "Côte-d'Or", '22': "Côtes-d'Armor", '23': 'Creuse',
  '24': 'Dordogne', '25': 'Doubs', '26': 'Drôme', '27': 'Eure',
  '28': 'Eure-et-Loir', '29': 'Finistère', '2A': 'Corse-du-Sud', '2B': 'Haute-Corse',
  '30': 'Gard', '31': 'Haute-Garonne', '32': 'Gers', '33': 'Gironde',
  '34': 'Hérault', '35': 'Ille-et-Vilaine', '36': 'Indre', '37': 'Indre-et-Loire',
  '38': 'Isère', '39': 'Jura', '40': 'Landes', '41': 'Loir-et-Cher',
  '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique', '45': 'Loiret',
  '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire',
  '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne',
  '54': 'Meurthe-et-Moselle', '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle',
  '58': 'Nièvre', '59': 'Nord', '60': 'Oise', '61': 'Orne',
  '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques',
  '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin',
  '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône', '71': 'Saône-et-Loire',
  '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie', '75': 'Paris',
  '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines',
  '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne',
  '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne',
  '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne',
  '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': "Val-d'Oise",
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
  '974': 'La Réunion', '976': 'Mayotte',
}

// Extract department from postal code
export function getDepartmentFromPostalCode(postalCode: string): string | null {
  if (!postalCode || postalCode.length !== 5) return null
  if (postalCode.startsWith('97') || postalCode.startsWith('98')) {
    return postalCode.substring(0, 3)
  }
  if (postalCode.startsWith('20')) {
    const num = parseInt(postalCode.substring(2, 5))
    return num < 200 ? '2A' : '2B'
  }
  return postalCode.substring(0, 2)
}

// Get the region for a department
export function getRegionForDepartment(dept: string): string {
  const regionMap: Record<string, string> = {
    '01': 'Auvergne-Rhône-Alpes', '03': 'Auvergne-Rhône-Alpes', '07': 'Auvergne-Rhône-Alpes',
    '15': 'Auvergne-Rhône-Alpes', '26': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes',
    '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes', '63': 'Auvergne-Rhône-Alpes',
    '69': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes', '74': 'Auvergne-Rhône-Alpes',
    '21': 'Bourgogne-Franche-Comté', '25': 'Bourgogne-Franche-Comté', '39': 'Bourgogne-Franche-Comté',
    '58': 'Bourgogne-Franche-Comté', '70': 'Bourgogne-Franche-Comté', '71': 'Bourgogne-Franche-Comté',
    '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
    '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
    '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire',
    '37': 'Centre-Val de Loire', '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
    '2A': 'Corse', '2B': 'Corse',
    '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est',
    '54': 'Grand Est', '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est', '68': 'Grand Est', '88': 'Grand Est',
    '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France',
    '62': 'Hauts-de-France', '80': 'Hauts-de-France',
    '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
    '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
    '94': 'Île-de-France', '95': 'Île-de-France',
    '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
    '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine',
    '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine',
    '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
    '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
    '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie',
    '31': 'Occitanie', '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie',
    '48': 'Occitanie', '65': 'Occitanie', '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
    '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire',
    '72': 'Pays de la Loire', '85': 'Pays de la Loire',
    '04': "Provence-Alpes-Côte d'Azur", '05': "Provence-Alpes-Côte d'Azur",
    '06': "Provence-Alpes-Côte d'Azur", '13': "Provence-Alpes-Côte d'Azur",
    '83': "Provence-Alpes-Côte d'Azur", '84': "Provence-Alpes-Côte d'Azur",
    '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
    '974': 'La Réunion', '976': 'Mayotte',
  }
  return regionMap[dept] || 'Inconnue'
}

/**
 * Generate all collection tasks: NAF × Department pairs
 * Returns flat array of { codeNaf, departement } to process
 */
export function generateCollectionTasks(): Array<{ codeNaf: string; departement: string }> {
  const tasks: Array<{ codeNaf: string; departement: string }> = []
  for (const codeNaf of Object.keys(CODES_NAF)) {
    for (const dept of DEPARTEMENTS) {
      tasks.push({ codeNaf, departement: dept })
    }
  }
  return tasks
}

/**
 * Total number of collection tasks
 */
export const TOTAL_COLLECTION_TASKS = Object.keys(CODES_NAF).length * DEPARTEMENTS.length
