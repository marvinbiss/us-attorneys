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
    role: "Redactrice specialisee habitat et renovation",
    bio: "Journaliste et redactrice specialisee dans le secteur de la renovation et de l'habitat depuis plus de 8 ans. Sophie accompagne les particuliers dans leurs projets en vulgarisant les aspects techniques et reglementaires des travaux du batiment.",
    expertise: ['Renovation', 'Habitat', 'Reglementation', 'Conseils travaux'],
    certifications: ['DU Journalisme scientifique et technique'],
    yearsExperience: 8,
    image: '/images/authors/sophie-martin.svg',
  },
  'claire-dubois': {
    slug: 'claire-dubois',
    name: 'Claire Dubois',
    role: "Experte en economie de la construction",
    bio: "Economiste de la construction certifiee, Claire analyse les prix du marche et les dispositifs d'aides financieres depuis plus de 12 ans. Elle conseille les particuliers sur l'optimisation de leur budget travaux et le cumul des aides a la renovation.",
    expertise: ['Economie de la construction', 'Aides financieres', 'Prix du marche', 'Budget travaux'],
    certifications: ['OPQTECC', 'Expert en economie de la construction'],
    yearsExperience: 12,
    image: '/images/authors/claire-dubois.svg',
  },
  'marc-lefebvre': {
    slug: 'marc-lefebvre',
    name: 'Marc Lefebvre',
    role: "Expert en electricite et domotique",
    bio: "Electricien certifie et formateur en domotique, Marc possede plus de 18 ans d'experience dans l'installation electrique residentielle et les systemes connectes. Il partage son expertise technique pour aider les particuliers a comprendre leurs installations.",
    expertise: ['Electricite', 'Domotique', 'Normes electriques', 'Energies renouvelables'],
    certifications: ['Qualifelec', 'IRVE', 'Habilitation electrique BR'],
    yearsExperience: 18,
    image: '/images/authors/marc-lefebvre.svg',
  },
  'jean-pierre-duval': {
    slug: 'jean-pierre-duval',
    name: 'Jean-Pierre Duval',
    role: "Expert en plomberie et chauffage",
    bio: "Plombier-chauffagiste certifie avec plus de 20 ans d'experience, Jean-Pierre est specialise dans les installations thermiques et sanitaires. Il intervient regulierement comme formateur aupres des apprentis du CFA du batiment.",
    expertise: ['Plomberie', 'Chauffage', 'Sanitaire', 'Pompes a chaleur'],
    certifications: ['RGE QualiPAC', 'Qualibat', 'PG Professionnel du Gaz'],
    yearsExperience: 20,
    image: '/images/authors/jean-pierre-duval.svg',
  },
  'thomas-bernard': {
    slug: 'thomas-bernard',
    name: 'Thomas Bernard',
    role: "Architecte d'interieur et consultant en renovation",
    bio: "Architecte d'interieur diplome, Thomas conseille les proprietaires sur l'optimisation de leur habitat depuis plus de 10 ans. Specialise en renovation de cuisines et salles de bain, il allie esthetique et fonctionnalite dans chacun de ses projets.",
    expertise: ['Architecture interieure', 'Renovation', 'Design', 'Menuiserie'],
    certifications: ['CFAI', 'Diplome ENSAD'],
    yearsExperience: 10,
    image: '/images/authors/thomas-bernard.svg',
  },
  'isabelle-renault': {
    slug: 'isabelle-renault',
    name: 'Isabelle Renault',
    role: "Experte en peinture et revetements",
    bio: "Peintre en batiment et decoratrice certifiee, Isabelle possede 14 ans d'experience dans les revetements interieurs et exterieurs. Elle conseille les particuliers sur le choix des materiaux, les techniques d'application et les tendances couleur.",
    expertise: ['Peinture', 'Revetements', 'Decoration', 'Isolation thermique'],
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
