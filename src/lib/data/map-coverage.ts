/**
 * Donnees de couverture geographique pour la carte interactive attorneys.
 * Coordonnees approximatives des principales cities francaises
 * avec un nombre estime d'artisans par ville (base sur la population).
 */

export interface CityMarker {
  slug: string
  name: string
  lat: number
  lng: number
  attorneyCount: number
  region: string
  departement: string
  population: number
}

/**
 * Top 150 cities francaises avec coordonnees et estimations d'artisans.
 * Le nombre d'artisans est estime proportionnellement a la population
 * (environ 1 artisan pour 60 habitants dans les zones urbaines).
 */
export const cityMarkers: CityMarker[] = [
  { slug: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522, attorneyCount: 35000, region: 'Île-de-France', departement: 'Paris', population: 2104000 },
  { slug: 'marseille', name: 'Marseille', lat: 43.2965, lng: 5.3698, attorneyCount: 14800, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Bouches-du-Rhône', population: 886000 },
  { slug: 'lyon', name: 'Lyon', lat: 45.7640, lng: 4.8357, attorneyCount: 8650, region: 'Auvergne-Rhône-Alpes', departement: 'Rhône', population: 519000 },
  { slug: 'toulouse', name: 'Toulouse', lat: 43.6047, lng: 1.4442, attorneyCount: 8580, region: 'Occitanie', departement: 'Haute-Garonne', population: 515000 },
  { slug: 'nice', name: 'Nice', lat: 43.7102, lng: 7.2620, attorneyCount: 5970, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Alpes-Maritimes', population: 358000 },
  { slug: 'nantes', name: 'Nantes', lat: 47.2184, lng: -1.5536, attorneyCount: 5470, region: 'Pays de la Loire', departement: 'Loire-Atlantique', population: 328000 },
  { slug: 'montpellier', name: 'Montpellier', lat: 43.6108, lng: 3.8767, attorneyCount: 5170, region: 'Occitanie', departement: 'Hérault', population: 310000 },
  { slug: 'strasbourg', name: 'Strasbourg', lat: 48.5734, lng: 7.7521, attorneyCount: 4900, region: 'Grand Est', departement: 'Bas-Rhin', population: 294000 },
  { slug: 'bordeaux', name: 'Bordeaux', lat: 44.8378, lng: -0.5792, attorneyCount: 4470, region: 'Nouvelle-Aquitaine', departement: 'Gironde', population: 268000 },
  { slug: 'lille', name: 'Lille', lat: 50.6292, lng: 3.0573, attorneyCount: 3970, region: 'Hauts-de-France', departement: 'Nord', population: 238000 },
  { slug: 'rennes', name: 'Rennes', lat: 48.1173, lng: -1.6778, attorneyCount: 3850, region: 'Bretagne', departement: 'Ille-et-Vilaine', population: 231000 },
  { slug: 'toulon', name: 'Toulon', lat: 43.1242, lng: 5.9280, attorneyCount: 2980, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Var', population: 179000 },
  { slug: 'reims', name: 'Reims', lat: 49.2583, lng: 3.2583, attorneyCount: 2970, region: 'Grand Est', departement: 'Marne', population: 178000 },
  { slug: 'saint-etienne', name: 'Saint-Étienne', lat: 45.4397, lng: 4.3872, attorneyCount: 2880, region: 'Auvergne-Rhône-Alpes', departement: 'Loire', population: 173000 },
  { slug: 'le-havre', name: 'Le Havre', lat: 49.4944, lng: 0.1079, attorneyCount: 2780, region: 'Normandie', departement: 'Seine-Maritime', population: 167000 },
  { slug: 'dijon', name: 'Dijon', lat: 47.3220, lng: 5.0415, attorneyCount: 2620, region: 'Bourgogne-Franche-Comté', departement: 'Côte-d\'Or', population: 157000 },
  { slug: 'grenoble', name: 'Grenoble', lat: 45.1885, lng: 5.7245, attorneyCount: 2600, region: 'Auvergne-Rhône-Alpes', departement: 'Isère', population: 156000 },
  { slug: 'angers', name: 'Angers', lat: 47.4784, lng: -0.5632, attorneyCount: 2530, region: 'Pays de la Loire', departement: 'Maine-et-Loire', population: 152000 },
  { slug: 'nimes', name: 'Nîmes', lat: 43.8367, lng: 4.3601, attorneyCount: 2480, region: 'Occitanie', departement: 'Gard', population: 149000 },
  { slug: 'villeurbanne', name: 'Villeurbanne', lat: 45.7667, lng: 4.8800, attorneyCount: 2730, region: 'Auvergne-Rhône-Alpes', departement: 'Rhône', population: 164000 },
  { slug: 'clermont-ferrand', name: 'Clermont-Ferrand', lat: 45.7772, lng: 3.0870, attorneyCount: 2380, region: 'Auvergne-Rhône-Alpes', departement: 'Puy-de-Dôme', population: 143000 },
  { slug: 'aix-en-provence', name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474, attorneyCount: 2380, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Bouches-du-Rhône', population: 143000 },
  { slug: 'brest', name: 'Brest', lat: 48.3904, lng: -4.4861, attorneyCount: 2370, region: 'Bretagne', departement: 'Finistère', population: 142000 },
  { slug: 'tours', name: 'Tours', lat: 47.3941, lng: 0.6848, attorneyCount: 2280, region: 'Centre-Val de Loire', departement: 'Indre-et-Loire', population: 137000 },
  { slug: 'amiens', name: 'Amiens', lat: 49.8941, lng: 2.2958, attorneyCount: 2230, region: 'Hauts-de-France', departement: 'Somme', population: 134000 },
  { slug: 'limoges', name: 'Limoges', lat: 45.8336, lng: 1.2611, attorneyCount: 2200, region: 'Nouvelle-Aquitaine', departement: 'Haute-Vienne', population: 132000 },
  { slug: 'metz', name: 'Metz', lat: 49.1193, lng: 6.1757, attorneyCount: 1920, region: 'Grand Est', departement: 'Moselle', population: 115000 },
  { slug: 'besancon', name: 'Besançon', lat: 47.2378, lng: 6.0241, attorneyCount: 1900, region: 'Bourgogne-Franche-Comté', departement: 'Doubs', population: 114000 },
  { slug: 'perpignan', name: 'Perpignan', lat: 42.6887, lng: 2.8948, attorneyCount: 1870, region: 'Occitanie', departement: 'Pyrénées-Orientales', population: 112000 },
  { slug: 'orleans', name: 'Orléans', lat: 47.9029, lng: 1.9092, attorneyCount: 1870, region: 'Centre-Val de Loire', departement: 'Loiret', population: 112000 },
  { slug: 'rouen', name: 'Rouen', lat: 49.4432, lng: 1.0999, attorneyCount: 1850, region: 'Normandie', departement: 'Seine-Maritime', population: 111000 },
  { slug: 'mulhouse', name: 'Mulhouse', lat: 47.7508, lng: 7.3359, attorneyCount: 1800, region: 'Grand Est', departement: 'Haut-Rhin', population: 108000 },
  { slug: 'caen', name: 'Caen', lat: 49.1829, lng: -0.3707, attorneyCount: 1780, region: 'Normandie', departement: 'Calvados', population: 107000 },
  { slug: 'nancy', name: 'Nancy', lat: 48.6921, lng: 6.1844, attorneyCount: 1770, region: 'Grand Est', departement: 'Meurthe-et-Moselle', population: 106000 },
  { slug: 'argenteuil', name: 'Argenteuil', lat: 48.9472, lng: 2.2467, attorneyCount: 1750, region: 'Île-de-France', departement: 'Val-d\'Oise', population: 105000 },
  { slug: 'saint-denis', name: 'Saint-Denis', lat: 48.9362, lng: 2.3574, attorneyCount: 1730, region: 'Île-de-France', departement: 'Seine-Saint-Denis', population: 104000 },
  { slug: 'montreuil', name: 'Montreuil', lat: 48.8638, lng: 2.4414, attorneyCount: 1720, region: 'Île-de-France', departement: 'Seine-Saint-Denis', population: 103000 },
  { slug: 'roubaix', name: 'Roubaix', lat: 50.6942, lng: 3.1746, attorneyCount: 1590, region: 'Hauts-de-France', departement: 'Nord', population: 96000 },
  { slug: 'avignon', name: 'Avignon', lat: 43.9493, lng: 4.8055, attorneyCount: 1530, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Vaucluse', population: 92000 },
  { slug: 'pau', name: 'Pau', lat: 43.2951, lng: -0.3708, attorneyCount: 1320, region: 'Nouvelle-Aquitaine', departement: 'Pyrénées-Atlantiques', population: 79000 },
  { slug: 'la-rochelle', name: 'La Rochelle', lat: 46.1603, lng: -1.1511, attorneyCount: 1300, region: 'Nouvelle-Aquitaine', departement: 'Charente-Maritime', population: 78000 },
  { slug: 'cannes', name: 'Cannes', lat: 43.5528, lng: 7.0174, attorneyCount: 1230, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Alpes-Maritimes', population: 74000 },
  { slug: 'annecy', name: 'Annecy', lat: 45.8992, lng: 6.1294, attorneyCount: 2170, region: 'Auvergne-Rhône-Alpes', departement: 'Haute-Savoie', population: 130000 },
  { slug: 'versailles', name: 'Versailles', lat: 48.8014, lng: 2.1301, attorneyCount: 1430, region: 'Île-de-France', departement: 'Yvelines', population: 86000 },
  { slug: 'boulogne-billancourt', name: 'Boulogne-Billancourt', lat: 48.8352, lng: 2.2401, attorneyCount: 1930, region: 'Île-de-France', departement: 'Hauts-de-Seine', population: 116000 },
  { slug: 'nanterre', name: 'Nanterre', lat: 48.8924, lng: 2.2071, attorneyCount: 1550, region: 'Île-de-France', departement: 'Hauts-de-Seine', population: 93000 },
  { slug: 'creteil', name: 'Créteil', lat: 48.7900, lng: 2.4550, attorneyCount: 1500, region: 'Île-de-France', departement: 'Val-de-Marne', population: 90000 },
  { slug: 'poitiers', name: 'Poitiers', lat: 46.5802, lng: 0.3404, attorneyCount: 1430, region: 'Nouvelle-Aquitaine', departement: 'Vienne', population: 86000 },
  { slug: 'antibes', name: 'Antibes', lat: 43.5804, lng: 7.1251, attorneyCount: 1250, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Alpes-Maritimes', population: 75000 },
  { slug: 'saint-nazaire', name: 'Saint-Nazaire', lat: 47.2743, lng: -2.2137, attorneyCount: 1220, region: 'Pays de la Loire', departement: 'Loire-Atlantique', population: 73000 },
  { slug: 'bayonne', name: 'Bayonne', lat: 43.4929, lng: -1.4748, attorneyCount: 820, region: 'Nouvelle-Aquitaine', departement: 'Pyrénées-Atlantiques', population: 49000 },
  { slug: 'ajaccio', name: 'Ajaccio', lat: 41.9192, lng: 8.7386, attorneyCount: 1130, region: 'Corse', departement: 'Corse-du-Sud', population: 68000 },
  { slug: 'bastia', name: 'Bastia', lat: 42.6977, lng: 9.4509, attorneyCount: 730, region: 'Corse', departement: 'Haute-Corse', population: 44000 },
  { slug: 'calais', name: 'Calais', lat: 50.9513, lng: 1.8587, attorneyCount: 1230, region: 'Hauts-de-France', departement: 'Pas-de-Calais', population: 74000 },
  { slug: 'vannes', name: 'Vannes', lat: 47.6583, lng: -2.7608, attorneyCount: 900, region: 'Bretagne', departement: 'Morbihan', population: 54000 },
  { slug: 'meaux', name: 'Meaux', lat: 48.9604, lng: 2.8787, attorneyCount: 920, region: 'Île-de-France', departement: 'Seine-et-Marne', population: 55000 },
  { slug: 'melun', name: 'Melun', lat: 48.5424, lng: 2.6554, attorneyCount: 680, region: 'Île-de-France', departement: 'Seine-et-Marne', population: 41000 },
  { slug: 'evry-courcouronnes', name: 'Évry-Courcouronnes', lat: 48.6253, lng: 2.4298, attorneyCount: 1120, region: 'Île-de-France', departement: 'Essonne', population: 67000 },
  { slug: 'cergy', name: 'Cergy', lat: 49.0361, lng: 2.0600, attorneyCount: 1050, region: 'Île-de-France', departement: 'Val-d\'Oise', population: 63000 },
  { slug: 'valence', name: 'Valence', lat: 44.9334, lng: 4.8924, attorneyCount: 1050, region: 'Auvergne-Rhône-Alpes', departement: 'Drôme', population: 63000 },
  { slug: 'troyes', name: 'Troyes', lat: 48.2973, lng: 4.0744, attorneyCount: 1020, region: 'Grand Est', departement: 'Aube', population: 61000 },
  { slug: 'chambery', name: 'Chambéry', lat: 45.5646, lng: 5.9178, attorneyCount: 1000, region: 'Auvergne-Rhône-Alpes', departement: 'Savoie', population: 60000 },
  { slug: 'lorient', name: 'Lorient', lat: 47.7485, lng: -3.3700, attorneyCount: 960, region: 'Bretagne', departement: 'Morbihan', population: 58000 },
  { slug: 'saint-quentin', name: 'Saint-Quentin', lat: 49.8474, lng: 3.2874, attorneyCount: 920, region: 'Hauts-de-France', departement: 'Aisne', population: 55000 },
  { slug: 'la-seyne-sur-mer', name: 'La Seyne-sur-Mer', lat: 43.1010, lng: 5.8830, attorneyCount: 1050, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Var', population: 63000 },
  { slug: 'sete', name: 'Sète', lat: 43.4075, lng: 3.6960, attorneyCount: 720, region: 'Occitanie', departement: 'Hérault', population: 43000 },
  { slug: 'quimper', name: 'Quimper', lat: 47.9960, lng: -4.0970, attorneyCount: 1100, region: 'Bretagne', departement: 'Finistère', population: 66000 },
  { slug: 'beziers', name: 'Béziers', lat: 43.3440, lng: 3.2190, attorneyCount: 1230, region: 'Occitanie', departement: 'Hérault', population: 74000 },
  { slug: 'bourges', name: 'Bourges', lat: 47.0810, lng: 2.3990, attorneyCount: 1070, region: 'Centre-Val de Loire', departement: 'Cher', population: 64000 },
  { slug: 'colmar', name: 'Colmar', lat: 48.0794, lng: 7.3584, attorneyCount: 1130, region: 'Grand Est', departement: 'Haut-Rhin', population: 68000 },
  { slug: 'charleville-mezieres', name: 'Charleville-Mézières', lat: 49.7710, lng: 4.7190, attorneyCount: 770, region: 'Grand Est', departement: 'Ardennes', population: 46000 },
  { slug: 'beauvais', name: 'Beauvais', lat: 49.4299, lng: 2.0864, attorneyCount: 920, region: 'Hauts-de-France', departement: 'Oise', population: 55000 },
  { slug: 'cholet', name: 'Cholet', lat: 47.0597, lng: -0.8783, attorneyCount: 910, region: 'Pays de la Loire', departement: 'Maine-et-Loire', population: 55000 },
  { slug: 'blois', name: 'Blois', lat: 47.5860, lng: 1.3311, attorneyCount: 770, region: 'Centre-Val de Loire', departement: 'Loir-et-Cher', population: 46000 },
  { slug: 'laval', name: 'Laval', lat: 48.0784, lng: -0.7678, attorneyCount: 850, region: 'Pays de la Loire', departement: 'Mayenne', population: 51000 },
  { slug: 'le-mans', name: 'Le Mans', lat: 48.0061, lng: 0.1996, attorneyCount: 2380, region: 'Pays de la Loire', departement: 'Sarthe', population: 143000 },
  { slug: 'dunkerque', name: 'Dunkerque', lat: 51.0343, lng: 2.3768, attorneyCount: 1500, region: 'Hauts-de-France', departement: 'Nord', population: 90000 },
  { slug: 'tourcoing', name: 'Tourcoing', lat: 50.7238, lng: 3.1593, attorneyCount: 1590, region: 'Hauts-de-France', departement: 'Nord', population: 96000 },
  { slug: 'saint-malo', name: 'Saint-Malo', lat: 48.6493, lng: -2.0076, attorneyCount: 780, region: 'Bretagne', departement: 'Ille-et-Vilaine', population: 47000 },
  { slug: 'la-roche-sur-yon', name: 'La Roche-sur-Yon', lat: 46.6707, lng: -1.4268, attorneyCount: 910, region: 'Pays de la Loire', departement: 'Vendée', population: 55000 },
  { slug: 'niort', name: 'Niort', lat: 46.3256, lng: -0.4568, attorneyCount: 960, region: 'Nouvelle-Aquitaine', departement: 'Deux-Sèvres', population: 58000 },
  { slug: 'angouleme', name: 'Angoulême', lat: 45.6500, lng: 0.1500, attorneyCount: 700, region: 'Nouvelle-Aquitaine', departement: 'Charente', population: 42000 },
  { slug: 'tarbes', name: 'Tarbes', lat: 43.2330, lng: 0.0780, attorneyCount: 720, region: 'Occitanie', departement: 'Hautes-Pyrénées', population: 43000 },
  { slug: 'agen', name: 'Agen', lat: 44.2033, lng: 0.6166, attorneyCount: 550, region: 'Nouvelle-Aquitaine', departement: 'Lot-et-Garonne', population: 33000 },
  { slug: 'saint-brieuc', name: 'Saint-Brieuc', lat: 48.5131, lng: -2.7609, attorneyCount: 770, region: 'Bretagne', departement: 'Côtes-d\'Armor', population: 46000 },
  { slug: 'arles', name: 'Arles', lat: 43.6768, lng: 4.6289, attorneyCount: 870, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Bouches-du-Rhône', population: 52000 },
  { slug: 'compiegne', name: 'Compiègne', lat: 49.4175, lng: 2.8260, attorneyCount: 680, region: 'Hauts-de-France', departement: 'Oise', population: 41000 },
  { slug: 'frejus', name: 'Fréjus', lat: 43.4332, lng: 6.7370, attorneyCount: 880, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Var', population: 53000 },
  { slug: 'gap', name: 'Gap', lat: 44.5595, lng: 6.0795, attorneyCount: 680, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Hautes-Alpes', population: 41000 },
  { slug: 'montauban', name: 'Montauban', lat: 44.0176, lng: 1.3543, attorneyCount: 1000, region: 'Occitanie', departement: 'Tarn-et-Garonne', population: 60000 },
  { slug: 'albi', name: 'Albi', lat: 43.9265, lng: 2.1474, attorneyCount: 830, region: 'Occitanie', departement: 'Tarn', population: 50000 },
  { slug: 'carcassonne', name: 'Carcassonne', lat: 43.2130, lng: 2.3491, attorneyCount: 760, region: 'Occitanie', departement: 'Aude', population: 46000 },
  { slug: 'auxerre', name: 'Auxerre', lat: 47.7984, lng: 3.5671, attorneyCount: 580, region: 'Bourgogne-Franche-Comté', departement: 'Yonne', population: 35000 },
  { slug: 'macon', name: 'Mâcon', lat: 46.3068, lng: 4.8283, attorneyCount: 560, region: 'Bourgogne-Franche-Comté', departement: 'Saône-et-Loire', population: 34000 },
  { slug: 'chalons-en-champagne', name: 'Châlons-en-Champagne', lat: 48.9576, lng: 4.3631, attorneyCount: 760, region: 'Grand Est', departement: 'Marne', population: 46000 },
  { slug: 'epinal', name: 'Épinal', lat: 48.1725, lng: 6.4499, attorneyCount: 530, region: 'Grand Est', departement: 'Vosges', population: 32000 },
  { slug: 'brive-la-gaillarde', name: 'Brive-la-Gaillarde', lat: 45.1509, lng: 1.5320, attorneyCount: 780, region: 'Nouvelle-Aquitaine', departement: 'Corrèze', population: 47000 },
  { slug: 'rodez', name: 'Rodez', lat: 44.3507, lng: 2.5756, attorneyCount: 410, region: 'Occitanie', departement: 'Aveyron', population: 25000 },
  { slug: 'cherbourg-en-cotentin', name: 'Cherbourg-en-Cotentin', lat: 49.6337, lng: -1.6222, attorneyCount: 1330, region: 'Normandie', departement: 'Manche', population: 80000 },
  { slug: 'chalon-sur-saone', name: 'Chalon-sur-Saône', lat: 46.7806, lng: 4.8537, attorneyCount: 770, region: 'Bourgogne-Franche-Comté', departement: 'Saône-et-Loire', population: 46000 },
  { slug: 'nevers', name: 'Nevers', lat: 46.9896, lng: 3.1590, attorneyCount: 550, region: 'Bourgogne-Franche-Comté', departement: 'Nièvre', population: 33000 },
  { slug: 'belfort', name: 'Belfort', lat: 47.6400, lng: 6.8600, attorneyCount: 830, region: 'Bourgogne-Franche-Comté', departement: 'Territoire de Belfort', population: 50000 },
  { slug: 'dax', name: 'Dax', lat: 43.7100, lng: -1.0500, attorneyCount: 340, region: 'Nouvelle-Aquitaine', departement: 'Landes', population: 20000 },
  { slug: 'perigueux', name: 'Périgueux', lat: 45.1837, lng: 0.7210, attorneyCount: 490, region: 'Nouvelle-Aquitaine', departement: 'Dordogne', population: 30000 },
  { slug: 'mont-de-marsan', name: 'Mont-de-Marsan', lat: 43.8900, lng: -0.4990, attorneyCount: 510, region: 'Nouvelle-Aquitaine', departement: 'Landes', population: 31000 },
  { slug: 'hyeres', name: 'Hyères', lat: 43.1204, lng: 6.1286, attorneyCount: 920, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Var', population: 55000 },
  { slug: 'chartres', name: 'Chartres', lat: 48.4470, lng: 1.4880, attorneyCount: 640, region: 'Centre-Val de Loire', departement: 'Eure-et-Loir', population: 39000 },
  { slug: 'draguignan', name: 'Draguignan', lat: 43.5390, lng: 6.4640, attorneyCount: 630, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Var', population: 38000 },
  { slug: 'ales', name: 'Alès', lat: 44.1240, lng: 4.0810, attorneyCount: 680, region: 'Occitanie', departement: 'Gard', population: 41000 },
  { slug: 'salon-de-provence', name: 'Salon-de-Provence', lat: 43.6405, lng: 5.0980, attorneyCount: 730, region: 'Provence-Alpes-Côte d\'Azur', departement: 'Bouches-du-Rhône', population: 44000 },
]

/** Toutes les regions francaises pour le filtre */
export const mapRegions = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Provence-Alpes-Côte d\'Azur',
  'Occitanie',
  'Nouvelle-Aquitaine',
  'Hauts-de-France',
  'Grand Est',
  'Pays de la Loire',
  'Bretagne',
  'Normandie',
  'Bourgogne-Franche-Comté',
  'Centre-Val de Loire',
  'Corse',
]

/**
 * Determine la couleur du marqueur selon la densite d'artisans.
 * Vert = forte couverture, Orange = moyenne, Rouge = faible.
 */
export function getMarkerColor(attorneyCount: number): string {
  if (attorneyCount >= 3000) return '#16a34a'  // green-600
  if (attorneyCount >= 1000) return '#f59e0b'  // amber-500
  return '#ef4444'                               // red-500
}

/**
 * Determine le rayon du cercle proportionnel au nombre d'artisans.
 */
export function getMarkerRadius(attorneyCount: number): number {
  if (attorneyCount >= 10000) return 20
  if (attorneyCount >= 5000) return 16
  if (attorneyCount >= 3000) return 13
  if (attorneyCount >= 1000) return 10
  if (attorneyCount >= 500) return 8
  return 6
}
