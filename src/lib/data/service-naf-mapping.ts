/**
 * Maps service slugs to NAF/APE codes for SIRENE API queries.
 * Used by enrichment scripts to count active businesses per trade per commune.
 *
 * Source: INSEE nomenclature d'activités française (NAF rév. 2)
 * Division 41: Construction de bâtiments
 * Division 43: Travaux de construction spécialisés
 */

/** NAF codes associated with each service slug */
export const SERVICE_TO_NAF: Record<string, string[]> = {
  // Core BTP trades
  plombier: ['4322A'],                        // Travaux d'installation d'eau et de gaz
  electricien: ['4321A', '4321B'],            // Installation électrique
  chauffagiste: ['4322B'],                    // Équipements thermiques et climatisation
  climaticien: ['4322B'],                     // Same NAF as chauffagiste
  'peintre-en-batiment': ['4334Z'],           // Peinture et vitrerie
  menuisier: ['4332A'],                       // Menuiserie bois et PVC
  serrurier: ['4332B'],                       // Menuiserie métallique et serrurerie
  carreleur: ['4333Z'],                       // Revêtement des sols et murs
  couvreur: ['4391B'],                        // Couverture par éléments
  macon: ['4399C'],                           // Maçonnerie générale
  vitrier: ['4334Z'],                         // Peinture et vitrerie (same NAF)

  // Specialized trades
  jardinier: ['8130Z'],                       // Services d'aménagement paysager
  paysagiste: ['7111Z', '8130Z'],             // Architecture + aménagement paysager
  cuisiniste: ['4332C', '3102Z'],             // Agencement + fabrication meubles cuisine
  solier: ['4333Z'],                          // Revêtement des sols et murs
  nettoyage: ['8121Z', '8122Z'],              // Nettoyage de bâtiments
  terrassier: ['4312A', '4312B'],             // Terrassement
  charpentier: ['4391A'],                     // Charpente
  zingueur: ['4391B'],                        // Couverture (zinguerie = sous-spécialité)
  etancheiste: ['4399A'],                     // Étanchéification
  facadier: ['4334Z', '4399C'],               // Peinture + maçonnerie
  platrier: ['4331Z'],                        // Plâtrerie
  metallier: ['4332B', '2511Z'],              // Menuiserie métallique + structures
  ferronnier: ['2511Z'],                      // Fabrication de structures métalliques
  'poseur-de-parquet': ['4333Z'],             // Revêtement des sols
  miroitier: ['4334Z'],                       // Vitrerie
  storiste: ['4332A'],                        // Menuiserie (stores = sous-catégorie)

  // Bathroom/Interior
  'salle-de-bain': ['4322A', '4333Z'],        // Plomberie + revêtement
  'architecte-interieur': ['7111Z'],          // Architecture
  'decorateur-interieur': ['7410Z'],          // Design spécialisé

  // Tech/Smart home
  domoticien: ['4321A'],                      // Installation électrique
  'borne-recharge': ['4321A'],                // Installation électrique

  // Energy renovation
  'pompe-a-chaleur': ['4322B'],               // Équipements thermiques
  'panneaux-solaires': ['4321A', '4322B'],    // Électricité + thermique
  'isolation-thermique': ['4329A'],           // Isolation
  'renovation-energetique': ['4329A', '4322B'], // Isolation + thermique

  // Maintenance
  ramoneur: ['8129B'],                        // Autres services de nettoyage
  pisciniste: ['4322A'],                      // Installation d'eau

  // Security
  'alarme-securite': ['4321A', '8020Z'],      // Installation électrique + systèmes de sécurité
  antenniste: ['4321A'],                      // Installation électrique

  // Other
  ascensoriste: ['4329B'],                    // Autres travaux d'installation
  diagnostiqueur: ['7120B'],                  // Analyses techniques
  geometre: ['7112A', '7112B'],                // Géomètre-expert + ingénierie
  desinsectisation: ['8129A'],                // Désinfection, désinsectisation
  deratisation: ['8129A'],                    // Désinfection, désinsectisation
  demenageur: ['4942Z'],                      // Déménagement
}

/** Get all NAF codes for a service slug */
export function getNafCodesForService(serviceSlug: string): string[] {
  return SERVICE_TO_NAF[serviceSlug] || []
}

/** Get the primary (first) NAF code for a service slug */
export function getPrimaryNafCode(serviceSlug: string): string | null {
  const codes = SERVICE_TO_NAF[serviceSlug]
  return codes?.[0] || null
}
