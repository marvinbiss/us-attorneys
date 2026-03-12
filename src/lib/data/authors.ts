export interface Author {
  slug: string
  name: string
  role: string
  bio: string
  expertise: string[]
  certifications: string[]
  yearsExperience: number
  image: string
  social?: {
    linkedin?: string
  }
}

export const authors: Record<string, Author> = {
  'sophie-martin': {
    slug: 'sophie-martin',
    name: 'Sophie Martin',
    role: "Rédactrice spécialisée habitat et rénovation",
    bio: "Journaliste et rédactrice spécialisée dans le secteur de la rénovation et de l'habitat depuis plus de 8 ans. Sophie accompagne les particuliers dans leurs projets en vulgarisant les aspects techniques et réglementaires des travaux du bâtiment.",
    expertise: ['Rénovation', 'Habitat', 'Réglementation', 'Conseils travaux'],
    certifications: ['DU Journalisme scientifique et technique'],
    yearsExperience: 8,
    image: '/images/authors/sophie-martin.svg',
  },
  'claire-dubois': {
    slug: 'claire-dubois',
    name: 'Claire Dubois',
    role: "Experte en économie de la construction",
    bio: "Économiste de la construction certifiée, Claire analyse les prix du marché et les dispositifs d'aides financières depuis plus de 12 ans. Elle conseille les particuliers sur l'optimisation de leur budget travaux et le cumul des aides à la rénovation.",
    expertise: ['Économie de la construction', 'Aides financières', 'Prix du marché', 'Budget travaux'],
    certifications: ['OPQTECC', 'Expert en économie de la construction'],
    yearsExperience: 12,
    image: '/images/authors/claire-dubois.svg',
  },
  'marc-lefebvre': {
    slug: 'marc-lefebvre',
    name: 'Marc Lefebvre',
    role: "Expert en électricité et domotique",
    bio: "Électricien certifié et formateur en domotique, Marc possède plus de 18 ans d'expérience dans l'installation électrique résidentielle et les systèmes connectés. Il partage son expertise technique pour aider les particuliers à comprendre leurs installations.",
    expertise: ['Électricité', 'Domotique', 'Normes électriques', 'Énergies renouvelables'],
    certifications: ['Qualifelec', 'IRVE', 'Habilitation électrique BR'],
    yearsExperience: 18,
    image: '/images/authors/marc-lefebvre.svg',
  },
  'jean-pierre-duval': {
    slug: 'jean-pierre-duval',
    name: 'Jean-Pierre Duval',
    role: "Expert en plomberie et chauffage",
    bio: "Plombier-chauffagiste certifié avec plus de 20 ans d'expérience, Jean-Pierre est spécialisé dans les installations thermiques et sanitaires. Il intervient régulièrement comme formateur auprès des apprentis du CFA du bâtiment.",
    expertise: ['Plomberie', 'Chauffage', 'Sanitaire', 'Pompes à chaleur'],
    certifications: ['RGE QualiPAC', 'Qualibat', 'PG Professionnel du Gaz'],
    yearsExperience: 20,
    image: '/images/authors/jean-pierre-duval.svg',
  },
  'thomas-bernard': {
    slug: 'thomas-bernard',
    name: 'Thomas Bernard',
    role: "Architecte d'intérieur et consultant en rénovation",
    bio: "Architecte d'intérieur diplômé, Thomas conseille les propriétaires sur l'optimisation de leur habitat depuis plus de 10 ans. Spécialisé en rénovation de cuisines et salles de bain, il allie esthétique et fonctionnalité dans chacun de ses projets.",
    expertise: ['Architecture intérieure', 'Rénovation', 'Design', 'Menuiserie'],
    certifications: ['CFAI', 'Diplôme ENSAD'],
    yearsExperience: 10,
    image: '/images/authors/thomas-bernard.svg',
  },
  'isabelle-renault': {
    slug: 'isabelle-renault',
    name: 'Isabelle Renault',
    role: "Experte en peinture et revêtements",
    bio: "Peintre en bâtiment et décoratrice certifiée, Isabelle possède 14 ans d'expérience dans les revêtements intérieurs et extérieurs. Elle conseille les particuliers sur le choix des matériaux, les techniques d'application et les tendances couleur.",
    expertise: ['Peinture', 'Revêtements', 'Décoration', 'Isolation thermique'],
    certifications: ['Qualibat 6111', 'Certification Peintre AFNOR'],
    yearsExperience: 14,
    image: '/images/authors/isabelle-renault.svg',
  },
}

/**
 * Find an author by their display name (as used in articles).
 * Returns undefined for "ServicesArtisans" or unknown names.
 */
export function getAuthorByName(name: string): Author | undefined {
  return Object.values(authors).find(a => a.name === name)
}
