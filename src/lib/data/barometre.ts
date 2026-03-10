/**
 * Données structurées pour le Baromètre des Prix de l'Artisanat 2026.
 * Page link bait destinée à attirer des backlinks de journalistes et blogueurs.
 */

export interface InterventionPricing {
  name: string
  prixMin: number
  prixMax: number
  unite: string
  tendance: "hausse" | "stable" | "baisse"
  variation: number // % YoY
}

export interface ServicePricing {
  service: string
  serviceName: string
  interventions: InterventionPricing[]
}

export interface RegionalIndex {
  region: string
  regionSlug: string
  index: number // 100 = moyenne nationale
  tendance: "hausse" | "stable" | "baisse"
}

// ---------------------------------------------------------------------------
// Prix par métier — top 10 services, 4-5 interventions chacun
// ---------------------------------------------------------------------------

export const servicePricings: ServicePricing[] = [
  {
    service: "plombier",
    serviceName: "Plombier",
    interventions: [
      { name: "Débouchage de canalisation", prixMin: 80, prixMax: 250, unite: "intervention", tendance: "hausse", variation: 3.2 },
      { name: "Remplacement de chauffe-eau", prixMin: 800, prixMax: 2500, unite: "intervention", tendance: "hausse", variation: 4.1 },
      { name: "Réparation de fuite", prixMin: 90, prixMax: 300, unite: "intervention", tendance: "stable", variation: 1.5 },
      { name: "Installation WC suspendu", prixMin: 400, prixMax: 1200, unite: "intervention", tendance: "hausse", variation: 2.8 },
      { name: "Remplacement robinetterie", prixMin: 80, prixMax: 250, unite: "intervention", tendance: "stable", variation: 0.9 },
    ],
  },
  {
    service: "electricien",
    serviceName: "Électricien",
    interventions: [
      { name: "Mise aux normes tableau électrique", prixMin: 800, prixMax: 2500, unite: "intervention", tendance: "hausse", variation: 3.8 },
      { name: "Installation point lumineux", prixMin: 80, prixMax: 200, unite: "point lumineux", tendance: "stable", variation: 1.2 },
      { name: "Pose prise électrique", prixMin: 60, prixMax: 150, unite: "intervention", tendance: "stable", variation: 0.8 },
      { name: "Installation borne de recharge", prixMin: 1200, prixMax: 2500, unite: "intervention", tendance: "baisse", variation: -5.2 },
      { name: "Rénovation complète (60 m²)", prixMin: 5000, prixMax: 10000, unite: "intervention", tendance: "hausse", variation: 4.5 },
    ],
  },
  {
    service: "serrurier",
    serviceName: "Serrurier",
    interventions: [
      { name: "Ouverture porte claquée", prixMin: 80, prixMax: 150, unite: "intervention", tendance: "stable", variation: 1.0 },
      { name: "Ouverture porte blindée", prixMin: 150, prixMax: 400, unite: "intervention", tendance: "hausse", variation: 2.5 },
      { name: "Changement serrure 3 points", prixMin: 200, prixMax: 600, unite: "intervention", tendance: "hausse", variation: 3.1 },
      { name: "Blindage de porte", prixMin: 800, prixMax: 2000, unite: "intervention", tendance: "hausse", variation: 4.0 },
      { name: "Installation serrure connectée", prixMin: 200, prixMax: 600, unite: "intervention", tendance: "baisse", variation: -3.5 },
    ],
  },
  {
    service: "chauffagiste",
    serviceName: "Chauffagiste",
    interventions: [
      { name: "Entretien chaudière annuel", prixMin: 90, prixMax: 180, unite: "intervention", tendance: "stable", variation: 1.8 },
      { name: "Installation pompe à chaleur", prixMin: 8000, prixMax: 16000, unite: "intervention", tendance: "baisse", variation: -2.3 },
      { name: "Remplacement chaudière gaz", prixMin: 3000, prixMax: 7000, unite: "intervention", tendance: "hausse", variation: 5.2 },
      { name: "Installation plancher chauffant", prixMin: 50, prixMax: 120, unite: "m²", tendance: "stable", variation: 1.1 },
      { name: "Désembouage radiateurs", prixMin: 300, prixMax: 800, unite: "intervention", tendance: "stable", variation: 0.5 },
    ],
  },
  {
    service: "peintre-en-batiment",
    serviceName: "Peintre en bâtiment",
    interventions: [
      { name: "Peinture murs et plafonds", prixMin: 20, prixMax: 45, unite: "m²", tendance: "hausse", variation: 3.5 },
      { name: "Ravalement de façade", prixMin: 30, prixMax: 80, unite: "m²", tendance: "hausse", variation: 4.8 },
      { name: "Pose de papier peint", prixMin: 15, prixMax: 40, unite: "m²", tendance: "stable", variation: 1.0 },
      { name: "Peinture boiseries et huisseries", prixMin: 15, prixMax: 35, unite: "ml", tendance: "stable", variation: 0.7 },
    ],
  },
  {
    service: "carreleur",
    serviceName: "Carreleur",
    interventions: [
      { name: "Pose carrelage sol", prixMin: 30, prixMax: 70, unite: "m²", tendance: "hausse", variation: 3.0 },
      { name: "Pose faïence murale", prixMin: 35, prixMax: 80, unite: "m²", tendance: "hausse", variation: 2.6 },
      { name: "Pose carrelage grand format", prixMin: 40, prixMax: 90, unite: "m²", tendance: "hausse", variation: 3.8 },
      { name: "Pose mosaïque", prixMin: 50, prixMax: 120, unite: "m²", tendance: "stable", variation: 1.5 },
      { name: "Ragréage et préparation sol", prixMin: 15, prixMax: 30, unite: "m²", tendance: "stable", variation: 0.9 },
    ],
  },
  {
    service: "menuisier",
    serviceName: "Menuisier",
    interventions: [
      { name: "Pose fenêtre double vitrage", prixMin: 300, prixMax: 800, unite: "intervention", tendance: "hausse", variation: 4.2 },
      { name: "Installation porte intérieure", prixMin: 150, prixMax: 450, unite: "intervention", tendance: "stable", variation: 1.3 },
      { name: "Pose parquet massif", prixMin: 40, prixMax: 100, unite: "m²", tendance: "hausse", variation: 3.9 },
      { name: "Fabrication meuble sur mesure", prixMin: 800, prixMax: 3000, unite: "intervention", tendance: "hausse", variation: 5.0 },
    ],
  },
  {
    service: "couvreur",
    serviceName: "Couvreur",
    interventions: [
      { name: "Réfection toiture complète", prixMin: 80, prixMax: 200, unite: "m²", tendance: "hausse", variation: 5.5 },
      { name: "Réparation fuite toiture", prixMin: 200, prixMax: 800, unite: "intervention", tendance: "hausse", variation: 3.2 },
      { name: "Pose gouttières", prixMin: 20, prixMax: 50, unite: "ml", tendance: "stable", variation: 1.4 },
      { name: "Nettoyage et démoussage", prixMin: 10, prixMax: 25, unite: "m²", tendance: "stable", variation: 0.6 },
      { name: "Installation velux", prixMin: 500, prixMax: 1500, unite: "intervention", tendance: "hausse", variation: 2.9 },
    ],
  },
  {
    service: "macon",
    serviceName: "Maçon",
    interventions: [
      { name: "Construction mur en parpaings", prixMin: 40, prixMax: 100, unite: "m²", tendance: "hausse", variation: 4.6 },
      { name: "Coulage dalle béton", prixMin: 50, prixMax: 120, unite: "m²", tendance: "hausse", variation: 3.8 },
      { name: "Ouverture dans mur porteur", prixMin: 1500, prixMax: 5000, unite: "intervention", tendance: "hausse", variation: 5.1 },
      { name: "Rejointoiement pierre", prixMin: 30, prixMax: 80, unite: "m²", tendance: "stable", variation: 1.7 },
    ],
  },
  {
    service: "plaquiste",
    serviceName: "Plaquiste",
    interventions: [
      { name: "Pose cloison placo BA13", prixMin: 25, prixMax: 55, unite: "m²", tendance: "hausse", variation: 2.9 },
      { name: "Faux plafond en placo", prixMin: 30, prixMax: 65, unite: "m²", tendance: "hausse", variation: 3.1 },
      { name: "Isolation par doublage", prixMin: 35, prixMax: 75, unite: "m²", tendance: "hausse", variation: 4.3 },
      { name: "Bandes et joints", prixMin: 8, prixMax: 15, unite: "m²", tendance: "stable", variation: 0.8 },
    ],
  },
]

// ---------------------------------------------------------------------------
// Indices régionaux — 13 régions métropolitaines + 5 DOM-TOM
// ---------------------------------------------------------------------------

export const regionalIndices: RegionalIndex[] = [
  { region: "Île-de-France", regionSlug: "ile-de-france", index: 130, tendance: "hausse" },
  { region: "Provence-Alpes-Côte d'Azur", regionSlug: "provence-alpes-cote-azur", index: 115, tendance: "hausse" },
  { region: "Auvergne-Rhône-Alpes", regionSlug: "auvergne-rhone-alpes", index: 110, tendance: "stable" },
  { region: "Occitanie", regionSlug: "occitanie", index: 105, tendance: "stable" },
  { region: "Nouvelle-Aquitaine", regionSlug: "nouvelle-aquitaine", index: 100, tendance: "stable" },
  { region: "Pays de la Loire", regionSlug: "pays-de-la-loire", index: 95, tendance: "stable" },
  { region: "Bretagne", regionSlug: "bretagne", index: 95, tendance: "stable" },
  { region: "Grand Est", regionSlug: "grand-est", index: 95, tendance: "baisse" },
  { region: "Normandie", regionSlug: "normandie", index: 95, tendance: "stable" },
  { region: "Hauts-de-France", regionSlug: "hauts-de-france", index: 90, tendance: "baisse" },
  { region: "Centre-Val de Loire", regionSlug: "centre-val-de-loire", index: 90, tendance: "stable" },
  { region: "Bourgogne-Franche-Comté", regionSlug: "bourgogne-franche-comte", index: 90, tendance: "stable" },
  { region: "Corse", regionSlug: "corse", index: 120, tendance: "hausse" },
  // DOM-TOM
  { region: "Guadeloupe", regionSlug: "guadeloupe", index: 130, tendance: "hausse" },
  { region: "Martinique", regionSlug: "martinique", index: 130, tendance: "hausse" },
  { region: "Guyane", regionSlug: "guyane", index: 135, tendance: "hausse" },
  { region: "La Réunion", regionSlug: "la-reunion", index: 125, tendance: "stable" },
  { region: "Mayotte", regionSlug: "mayotte", index: 140, tendance: "hausse" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Prix moyen national pondéré (moyenne des min+max de toutes les interventions) */
export function getPrixMoyenNational(): number {
  let total = 0
  let count = 0
  for (const sp of servicePricings) {
    for (const i of sp.interventions) {
      total += (i.prixMin + i.prixMax) / 2
      count++
    }
  }
  return Math.round(total / count)
}

/** Variation moyenne annuelle (%) */
export function getVariationMoyenne(): number {
  let total = 0
  let count = 0
  for (const sp of servicePricings) {
    for (const i of sp.interventions) {
      total += i.variation
      count++
    }
  }
  return Math.round((total / count) * 10) / 10
}

/** Nombre total de métiers analysés */
export function getNombreMetiers(): number {
  return servicePricings.length
}

/** Nombre de régions couvertes */
export function getNombreRegions(): number {
  return regionalIndices.length
}
