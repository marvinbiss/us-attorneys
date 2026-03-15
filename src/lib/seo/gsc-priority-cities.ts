/**
 * Cities with significant GSC impressions — prioritized in sitemap
 * regardless of population ranking.
 * Updated via weekly GSC audit loop.
 * Last update: 2026-02-25 (GSC Queries export)
 */
export const GSC_PRIORITY_CITIES: string[] = [
  // Île-de-France suburbs — strong dératisation/désinsectisation demand
  'trappes',
  'villemoisson-sur-orge',
  'stains',
  'le-plessis-trevise',
  'montgeron',
  'vaucresson',
  'montigny-le-bretonneux',
  'le-chesnay-rocquencourt',
  'bry-sur-marne',
  'rosny-sous-bois',
  'fresnes',
  'ermont',
  'thiais',
  'plaisir',
  'elancourt',
  'croissy-sur-seine',
  'tremblay-en-france',
  'gonesse',
  'le-perreux-sur-marne',
  'chatenay-malabry',
  'athis-mons',
  'etampes',
  'domont',
  'villepinte',
  'sannois',
  'les-lilas',
  'le-kremlin-bicetre',
  'bois-colombes',
  'saint-cloud',
  'saint-mande',
  'chatillon',
  'villiers-sur-marne',
  'deuil-la-barre',
  'guyancourt',
  'pontoise',
  'romainville',
  'villejuif',
  'sevran',
  'alfortville',
  'poissy',
  // Var / PACA — dératisation + déménagement
  'la-londe-les-maures',
  'vidauban',
  'cuers',
  'brignoles',
  'le-muy',
  'sollies-pont',
  'cabasse',
  'carqueiranne',
  // Autres régions
  'voiron',
  'montluel',
  'juvignac',
  'castelsarrasin',
  'gosier',
  'saran',
  'la-chapelle-saint-luc',
]

/**
 * Pages in position 5-20 with significant impressions.
 * Receive internal link boosts via CrossLinks.
 * Updated via weekly GSC audit loop.
 * Last update: 2026-02-25 (GSC Queries export)
 */
export const GSC_BOOST_PAGES: string[] = [
  // Position 5-20, impressions >= 5
  '/practice-areas/deratisation/rosny-sous-bois',
  '/practice-areas/deratisation/plaisir',
  '/practice-areas/deratisation/montigny-le-bretonneux',
  '/practice-areas/deratisation/gosier',
  '/practice-areas/deratisation/montluel',
  '/practice-areas/deratisation/cabasse',
  '/practice-areas/deratisation/voiron',
  '/practice-areas/deratisation/villejuif',
  '/practice-areas/demenageur/croissy-sur-seine',
  '/practice-areas/demenageur/domont',
  '/practice-areas/demenageur/carqueiranne',
  '/practice-areas/electricien/courbevoie',
  '/practice-areas/antenniste/juvignac',
  '/practice-areas/alarme-securite/saran',
  '/practice-areas/vitrier/stains',
  '/practice-areas/peintre-en-batiment/le-plessis-trevise',
  // High-volume queries (pos 20-28) — internal boost can push to page 1
  '/practice-areas/deratisation/trappes',
  '/practice-areas/deratisation/villemoisson-sur-orge',
  '/practice-areas/deratisation/ermont',
  '/practice-areas/deratisation/montgeron',
  '/practice-areas/deratisation/vaucresson',
  '/practice-areas/deratisation/thiais',
  '/practice-areas/deratisation/la-londe-les-maures',
  '/practice-areas/deratisation/fresnes',
]
