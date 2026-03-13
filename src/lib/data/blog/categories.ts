/**
 * Blog category utilities — slug ↔ label mapping for crawlable category pages.
 */

export interface BlogCategory {
  slug: string
  label: string
  description: string
  metaTitle: string
  metaDescription: string
}

/** All blog categories with SEO metadata */
export const blogCategories: BlogCategory[] = [
  {
    slug: 'conseils',
    label: 'Conseils',
    description: 'Conseils pratiques pour vos travaux de rénovation, entretien et amélioration de votre habitat.',
    metaTitle: 'Conseils Travaux & Rénovation — Blog ServicesArtisans',
    metaDescription: 'Conseils d\'experts pour réussir vos travaux : entretien maison, choix de matériaux, préparation de chantier. Guides pratiques et astuces de professionnels.',
  },
  {
    slug: 'tarifs',
    label: 'Tarifs',
    description: 'Guides de prix détaillés pour tous les corps de métier du bâtiment en 2026.',
    metaTitle: 'Prix & Tarifs Artisans 2026 — Blog ServicesArtisans',
    metaDescription: 'Prix détaillés par métier en 2026 : plombier, électricien, maçon, couvreur et plus. Tarifs horaires, coûts d\'intervention et budgets travaux.',
  },
  {
    slug: 'fiches-metier',
    label: 'Fiches métier',
    description: 'Guides complets pour choisir le bon artisan : compétences, certifications, questions à poser.',
    metaTitle: 'Fiches Métier Artisans — Comment Choisir | ServicesArtisans',
    metaDescription: 'Comment choisir un plombier, électricien, maçon ? Fiches métier complètes : certifications, compétences, red flags et conseils d\'experts.',
  },
  {
    slug: 'guides',
    label: 'Guides',
    description: 'Guides complets pour vos projets de rénovation, construction et aménagement.',
    metaTitle: 'Guides Travaux & Rénovation 2026 | ServicesArtisans',
    metaDescription: 'Guides complets pour vos projets : rénovation maison, extension, isolation, toiture. Étapes, budget et conseils de professionnels.',
  },
  {
    slug: 'reglementation',
    label: 'Réglementation',
    description: 'Normes, obligations légales et réglementation du bâtiment expliquées simplement.',
    metaTitle: 'Réglementation Travaux & Bâtiment 2026 | ServicesArtisans',
    metaDescription: 'Réglementation travaux 2026 : permis de construire, garantie décennale, normes électriques, RE2020. Vos droits et obligations expliqués.',
  },
  {
    slug: 'aides-subventions',
    label: 'Aides & Subventions',
    description: 'MaPrimeRénov\', CEE, éco-PTZ : toutes les aides à la rénovation énergétique en 2026.',
    metaTitle: 'Aides Rénovation 2026 — MaPrimeRénov\', CEE, PTZ | ServicesArtisans',
    metaDescription: 'Toutes les aides rénovation 2026 : MaPrimeRénov\', CEE, éco-PTZ, TVA réduite. Montants, conditions et guide de cumul.',
  },
  {
    slug: 'saisonnier',
    label: 'Saisonnier',
    description: 'Travaux saisonniers : préparer sa maison pour l\'hiver, le printemps, l\'été.',
    metaTitle: 'Travaux Saisonniers — Entretien Maison | ServicesArtisans',
    metaDescription: 'Quels travaux faire à chaque saison ? Check-lists saisonnières, entretien préventif et conseils pour protéger votre maison toute l\'année.',
  },
  {
    slug: 'securite',
    label: 'Sécurité',
    description: 'Sécurité du logement : alarmes, serrures, protection incendie, normes électriques.',
    metaTitle: 'Sécurité Maison — Guides & Conseils | ServicesArtisans',
    metaDescription: 'Sécurisez votre maison : alarmes, serrures, protection cambriolage, normes électriques. Conseils d\'experts et solutions adaptées.',
  },
  {
    slug: 'energie',
    label: 'Énergie',
    description: 'Économies d\'énergie, isolation, pompes à chaleur, panneaux solaires.',
    metaTitle: 'Énergie & Isolation — Guides 2026 | ServicesArtisans',
    metaDescription: 'Réduisez votre facture énergie : isolation, pompe à chaleur, panneaux solaires, VMC. Guides complets et comparatifs 2026.',
  },
  {
    slug: 'diy',
    label: 'DIY',
    description: 'Travaux à faire soi-même : tutoriels, outils nécessaires et limites du bricolage.',
    metaTitle: 'DIY & Bricolage — Tutoriels Travaux | ServicesArtisans',
    metaDescription: 'Quels travaux faire soi-même ? Tutoriels bricolage, outils nécessaires et quand faire appel à un professionnel.',
  },
  {
    slug: 'inspiration',
    label: 'Inspiration',
    description: 'Tendances déco, aménagement intérieur, idées de rénovation.',
    metaTitle: 'Inspiration Déco & Aménagement 2026 | ServicesArtisans',
    metaDescription: 'Tendances déco 2026, idées d\'aménagement et inspiration rénovation. Salle de bain, cuisine, extérieur : les styles qui marquent.',
  },
  {
    slug: 'materiaux',
    label: 'Matériaux',
    description: 'Comparatifs et guides de choix de matériaux pour vos travaux de construction et rénovation.',
    metaTitle: 'Matériaux de Construction & Rénovation — Comparatifs 2026 | ServicesArtisans',
    metaDescription: 'Comparatifs matériaux 2026 : carrelage, parquet, isolation, plomberie. Guides de choix, prix et conseils pour bien sélectionner vos matériaux.',
  },
  {
    slug: 'urgences',
    label: 'Urgences',
    description: 'Que faire en cas d\'urgence : fuite d\'eau, panne électrique, serrure bloquée. Réflexes et contacts.',
    metaTitle: 'Urgences Maison — Réflexes & Dépannage | ServicesArtisans',
    metaDescription: 'Urgences maison : fuite d\'eau, panne électrique, serrure bloquée. Les bons réflexes, quand appeler un artisan et comment éviter les arnaques.',
  },
]

/** Slugify a category label for URL usage */
export function categoryToSlug(label: string): string {
  const found = blogCategories.find(c => c.label === label)
  if (found) return found.slug
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Find a category by its URL slug */
export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return blogCategories.find(c => c.slug === slug)
}

/** Map a category label to its normalized form (handles accent variants) */
const categoryNormalize: Record<string, string> = {
  'Securite': 'Sécurité',
  'Energie': 'Énergie',
  'Materiaux': 'Matériaux',
}

export function normalizeCategory(category: string): string {
  return categoryNormalize[category] || category
}
