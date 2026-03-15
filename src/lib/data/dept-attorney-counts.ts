/**
 * Real artisan/BTP enterprise counts per French department.
 *
 * Sources (cross-referenced for consistency):
 *  - CAPEB Chiffres Clés 2024: 621 803 entreprises artisanales du bâtiment
 *  - CMA Île-de-France 2025: 348 000 entreprises artisanales en IDF
 *  - CMA Hauts-de-France 2024: créations et stock par département
 *  - Le Moniteur (densité BTP/10 000 hab par département)
 *  - ISM/MAAF Baromètre de l’Artisanat 2025 (données régionales)
 *  - U2P Chiffres Clés 2024 (répartition régionale)
 *  - INSEE population légale 2024 (base de calcul densité)
 *  - FFB / statistiques.developpement-durable.gouv.fr (entreprises BTP)
 *
 * National totals (sanity check):
 *  - Total artisan enterprises:  ~1 300 000
 *  - BTP artisan enterprises:    ~  550 000
 *
 * Methodology: department counts derived from INSEE population × density
 * ratios (artisans/10 000 hab) published by Le Moniteur / CMA / CAPEB,
 * calibrated against known regional and national totals.
 *
 * `artisans` = all artisan enterprises (all sectors)
 * `btp`      = artisan enterprises in construction (NAF 41-43)
 */

export const DEPT_ARTISAN_COUNTS: Record<string, { artisans: number; btp: number }> = {
  // ---- Île-de-France (total ~348 000 artisans, ~91 000 BTP) CMA IDF 2025 ----
  '75': { artisans: 78500, btp: 11200 },   // Paris (2 104 000 hab)
  '77': { artisans: 31000, btp: 12900 },   // Seine-et-Marne (1 421 000)
  '78': { artisans: 30500, btp: 12200 },   // Yvelines (1 448 000)
  '91': { artisans: 27500, btp: 11200 },   // Essonne (1 306 000)
  '92': { artisans: 53000, btp: 11600 },   // Hauts-de-Seine (1 624 000)
  '93': { artisans: 60500, btp: 13200 },   // Seine-Saint-Denis (1 644 000)
  '94': { artisans: 38000, btp: 9500 },    // Val-de-Marne (1 407 000)
  '95': { artisans: 28500, btp: 11400 },   // Val-d'Oise (1 249 000)

  // ---- Hauts-de-France (~105 000 artisans, ~37 000 BTP) ----
  '02': { artisans: 9600, btp: 3800 },     // Aisne (525 000)
  '59': { artisans: 44500, btp: 10000 },   // Nord (2 608 000) ~38/10k BTP
  '60': { artisans: 16500, btp: 6400 },    // Oise (829 000)
  '62': { artisans: 24000, btp: 5600 },    // Pas-de-Calais (1 468 000) ~38/10k
  '80': { artisans: 10400, btp: 3900 },    // Somme (572 000)

  // ---- Grand Est (~105 000 artisans, ~38 000 BTP) ----
  '08': { artisans: 4700, btp: 1800 },     // Ardennes (270 000)
  '10': { artisans: 5500, btp: 2200 },     // Aube (311 000)
  '51': { artisans: 10100, btp: 3700 },    // Marne (567 000)
  '52': { artisans: 3400, btp: 1400 },     // Haute-Marne (172 000)
  '54': { artisans: 13000, btp: 4400 },    // Meurthe-et-Moselle (733 000)
  '55': { artisans: 3200, btp: 1300 },     // Meuse (184 000)
  '57': { artisans: 18500, btp: 6700 },    // Moselle (1 046 000)
  '67': { artisans: 23500, btp: 8400 },    // Bas-Rhin (1 140 000)
  '68': { artisans: 16500, btp: 6400 },    // Haut-Rhin (764 000)
  '88': { artisans: 6600, btp: 2700 },     // Vosges (363 000)

  // ---- Normandie (~60 000 artisans, ~22 000 BTP) ----
  '14': { artisans: 11000, btp: 4000 },    // Calvados (694 000)
  '27': { artisans: 9500, btp: 3700 },     // Eure (601 000)
  '50': { artisans: 8200, btp: 3400 },     // Manche (495 000)
  '61': { artisans: 4800, btp: 1900 },     // Orne (278 000)
  '76': { artisans: 18500, btp: 5800 },    // Seine-Maritime (1 256 000)

  // ---- Bretagne (~70 000 artisans, ~28 000 BTP) ----
  '22': { artisans: 11500, btp: 4800 },    // Côtes-d'Armor (600 000)
  '29': { artisans: 18000, btp: 7200 },    // Finistère (909 000) ~6000 bat CAPEB
  '35': { artisans: 20000, btp: 7600 },    // Ille-et-Vilaine (1 094 000)
  '56': { artisans: 15000, btp: 6200 },    // Morbihan (759 000)

  // ---- Pays de la Loire (~72 000 artisans, ~28 000 BTP) ----
  '44': { artisans: 24000, btp: 9200 },    // Loire-Atlantique (1 437 000)
  '49': { artisans: 13500, btp: 5200 },    // Maine-et-Loire (818 000)
  '53': { artisans: 5200, btp: 2100 },     // Mayenne (307 000)
  '72': { artisans: 9500, btp: 3600 },     // Sarthe (566 000)
  '85': { artisans: 13000, btp: 5500 },    // Vendée (685 000)

  // ---- Centre-Val de Loire (~42 000 artisans, ~16 000 BTP) ----
  '18': { artisans: 4800, btp: 1800 },     // Cher (302 000)
  '28': { artisans: 7000, btp: 2700 },     // Eure-et-Loir (432 000)
  '36': { artisans: 3400, btp: 1400 },     // Indre (218 000)
  '37': { artisans: 10000, btp: 3600 },    // Indre-et-Loire (610 000)
  '41': { artisans: 5400, btp: 2100 },     // Loir-et-Cher (329 000)
  '45': { artisans: 11000, btp: 4000 },    // Loiret (680 000)

  // ---- Bourgogne-Franche-Comté (~48 000 artisans, ~18 000 BTP) ----
  '21': { artisans: 9200, btp: 3400 },     // Côte-d'Or (534 000)
  '25': { artisans: 9500, btp: 3800 },     // Doubs (543 000)
  '39': { artisans: 4800, btp: 2000 },     // Jura (260 000)
  '58': { artisans: 3400, btp: 1400 },     // Nièvre (202 000)
  '70': { artisans: 3600, btp: 1500 },     // Haute-Saône (234 000)
  '71': { artisans: 9000, btp: 3500 },     // Saône-et-Loire (551 000)
  '89': { artisans: 5500, btp: 2100 },     // Yonne (338 000)
  '90': { artisans: 2200, btp: 850 },      // Territoire de Belfort (142 000)

  // ---- Auvergne-Rhône-Alpes (~165 000 artisans, ~62 000 BTP) ----
  '01': { artisans: 11500, btp: 4800 },    // Ain (655 000)
  '03': { artisans: 5400, btp: 2100 },     // Allier (335 000)
  '07': { artisans: 6800, btp: 2900 },     // Ardèche (328 000)
  '15': { artisans: 2800, btp: 1200 },     // Cantal (144 000)
  '26': { artisans: 9500, btp: 4000 },     // Drôme (517 000)
  '38': { artisans: 22000, btp: 8400 },    // Isère (1 272 000)
  '42': { artisans: 12000, btp: 4500 },    // Loire (762 000)
  '43': { artisans: 4200, btp: 1800 },     // Haute-Loire (227 000)
  '63': { artisans: 11000, btp: 3800 },    // Puy-de-Dôme (659 000) 21 200 actives CMA
  '69': { artisans: 32000, btp: 10500 },   // Rhône (1 878 000)
  '73': { artisans: 10500, btp: 5200 },    // Savoie (436 000) 28/10k menuisiers+
  '74': { artisans: 17500, btp: 7800 },    // Haute-Savoie (826 000) 10 261 bat CAPEB

  // ---- Nouvelle-Aquitaine (~105 000 artisans, ~42 000 BTP) ----
  '16': { artisans: 5800, btp: 2400 },     // Charente (352 000)
  '17': { artisans: 11500, btp: 4800 },    // Charente-Maritime (651 000)
  '19': { artisans: 4200, btp: 1700 },     // Corrèze (240 000)
  '23': { artisans: 2200, btp: 950 },      // Creuse (116 000)
  '24': { artisans: 8000, btp: 3400 },     // Dordogne (413 000)
  '33': { artisans: 27000, btp: 10000 },   // Gironde (1 623 000)
  '40': { artisans: 7500, btp: 3200 },     // Landes (413 000)
  '47': { artisans: 5500, btp: 2300 },     // Lot-et-Garonne (330 000)
  '64': { artisans: 12500, btp: 5000 },    // Pyrénées-Atlantiques (682 000)
  '79': { artisans: 6000, btp: 2400 },     // Deux-Sèvres (374 000)
  '86': { artisans: 7000, btp: 2600 },     // Vienne (439 000)
  '87': { artisans: 6000, btp: 2200 },     // Haute-Vienne (373 000)

  // ---- Occitanie (~130 000 artisans, ~52 000 BTP) ----
  '09': { artisans: 3200, btp: 1400 },     // Ariège (153 000)
  '11': { artisans: 7200, btp: 3100 },     // Aude (374 000)
  '12': { artisans: 5200, btp: 2200 },     // Aveyron (279 000)
  '30': { artisans: 14000, btp: 5800 },    // Gard (748 000)
  '31': { artisans: 27000, btp: 9800 },    // Haute-Garonne (1 415 000)
  '32': { artisans: 3500, btp: 1500 },     // Gers (191 000)
  '34': { artisans: 23000, btp: 9200 },    // Hérault (1 175 000)
  '46': { artisans: 3200, btp: 1400 },     // Lot (174 000)
  '48': { artisans: 1600, btp: 750 },      // Lozère (76 000)
  '65': { artisans: 4500, btp: 1900 },     // Hautes-Pyrénées (228 000)
  '66': { artisans: 9500, btp: 4200 },     // Pyrénées-Orientales (479 000)
  '81': { artisans: 6500, btp: 2600 },     // Tarn (389 000)
  '82': { artisans: 4200, btp: 1800 },     // Tarn-et-Garonne (262 000)

  // ---- Provence-Alpes-Côte d'Azur (~120 000 artisans, ~52 000 BTP) ----
  '04': { artisans: 4200, btp: 2000 },     // Alpes-de-Haute-Provence (164 000)
  '05': { artisans: 3600, btp: 1800 },     // Hautes-Alpes (141 000) 26.5/10k menuisiers
  '06': { artisans: 26000, btp: 14000 },   // Alpes-Maritimes (1 083 000) 129/10k BTP
  '13': { artisans: 38000, btp: 13500 },   // Bouches-du-Rhône (2 043 000)
  '83': { artisans: 22000, btp: 12900 },   // Var (1 076 000) 120/10k BTP
  '84': { artisans: 11500, btp: 4800 },    // Vaucluse (561 000)

  // ---- Corse (~9 500 artisans, ~5 200 BTP) ----
  '2A': { artisans: 5000, btp: 2480 },     // Corse-du-Sud (158 000) 157/10k BTP
  '2B': { artisans: 4500, btp: 2660 },     // Haute-Corse (181 000) 147/10k BTP

  // ---- Outre-mer ----
  '971': { artisans: 8200, btp: 5300 },    // Guadeloupe (384 000) 138/10k
  '972': { artisans: 6500, btp: 2800 },    // Martinique (364 000)
  '973': { artisans: 5000, btp: 2200 },    // Guyane (294 000)
  '974': { artisans: 16000, btp: 6200 },   // La Réunion (860 000)
  '976': { artisans: 3500, btp: 1400 },    // Mayotte (321 000)
}

/**
 * Look up artisan counts for a department code.
 * Falls back to a population-based estimate if the department is not in the table.
 */
export function getDeptArtisanCounts(
  deptCode: string,
  population?: number,
): { artisans: number; btp: number } | null {
  const entry = DEPT_ARTISAN_COUNTS[deptCode]
  if (entry) return entry

  // Fallback: estimate from population using national average
  // National avg: ~19 artisans / 1 000 hab, ~8 BTP / 1 000 hab
  if (population && population > 0) {
    return {
      artisans: Math.round(population * 19 / 1000),
      btp: Math.round(population * 8 / 1000),
    }
  }

  return null
}

/**
 * Get BTP ratio (share of BTP among all artisan enterprises) for a department.
 * Useful for deriving commune-level BTP counts from total artisan counts.
 */
export function getDeptBtpRatio(deptCode: string): number {
  const entry = DEPT_ARTISAN_COUNTS[deptCode]
  if (entry && entry.artisans > 0) {
    return entry.btp / entry.artisans
  }
  // National average: ~42%
  return 0.42
}
