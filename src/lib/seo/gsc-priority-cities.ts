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
  '/services/deratisation/rosny-sous-bois',
  '/services/deratisation/plaisir',
  '/services/deratisation/montigny-le-bretonneux',
  '/services/deratisation/gosier',
  '/services/deratisation/montluel',
  '/services/deratisation/cabasse',
  '/services/deratisation/voiron',
  '/services/deratisation/villejuif',
  '/services/demenageur/croissy-sur-seine',
  '/services/demenageur/domont',
  '/services/demenageur/carqueiranne',
  '/services/electricien/courbevoie',
  '/services/antenniste/juvignac',
  '/services/alarme-securite/saran',
  '/services/vitrier/stains',
  '/services/peintre-en-batiment/le-plessis-trevise',
  // High-volume queries (pos 20-28) — internal boost can push to page 1
  '/services/deratisation/trappes',
  '/services/deratisation/villemoisson-sur-orge',
  '/services/deratisation/ermont',
  '/services/deratisation/montgeron',
  '/services/deratisation/vaucresson',
  '/services/deratisation/thiais',
  '/services/deratisation/la-londe-les-maures',
  '/services/deratisation/fresnes',
]
