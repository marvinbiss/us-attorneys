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
    role: "Legal content writer specializing in property and real estate law",
    bio: "Journalist and content writer specializing in the property and real estate sector for over 8 years. Sophie helps individuals with their projects by making the technical and regulatory aspects of legal matters accessible.",
    expertise: ['Real Estate', 'Property', 'Regulations', 'Legal Advice'],
    certifications: ['DU Journalisme scientifique et technique'],
    yearsExperience: 8,
    image: '/images/authors/sophie-martin.svg',
  },
  'claire-dubois': {
    slug: 'claire-dubois',
    name: 'Claire Dubois',
    role: "Expert in construction economics",
    bio: "Certified construction economist, Claire has been analyzing market prices and financial aid programs for over 12 years. She advises individuals on optimizing their project budgets and combining renovation aid programs.",
    expertise: ['Construction Economics', 'Financial Aid', 'Market Prices', 'Project Budgets'],
    certifications: ['OPQTECC', 'Construction Economics Expert'],
    yearsExperience: 12,
    image: '/images/authors/claire-dubois.svg',
  },
  'marc-lefebvre': {
    slug: 'marc-lefebvre',
    name: 'Marc Lefebvre',
    role: "Expert in electrical systems and smart home technology",
    bio: "Certified electrician and smart home trainer, Marc has over 18 years of experience in residential electrical installations and connected systems. He shares his technical expertise to help individuals understand their installations.",
    expertise: ['Electrical Systems', 'Smart Home', 'Electrical Standards', 'Renewable Energy'],
    certifications: ['Qualifelec', 'IRVE', 'Electrical Authorization BR'],
    yearsExperience: 18,
    image: '/images/authors/marc-lefebvre.svg',
  },
  'jean-pierre-duval': {
    slug: 'jean-pierre-duval',
    name: 'Jean-Pierre Duval',
    role: "Expert en plomberie et chauffage",
    bio: "Certified plumber and heating engineer with over 20 years of experience, Jean-Pierre specializes in thermal and sanitary installations. He regularly serves as a trainer for building trade apprentices.",
    expertise: ['Plumbing', 'Heating', 'Sanitary', 'Heat Pumps'],
    certifications: ['RGE QualiPAC', 'Qualibat', 'PG Professionnel du Gaz'],
    yearsExperience: 20,
    image: '/images/authors/jean-pierre-duval.svg',
  },
  'thomas-bernard': {
    slug: 'thomas-bernard',
    name: 'Thomas Bernard',
    role: "Interior architect and renovation consultant",
    bio: "Graduate interior architect, Thomas has been advising homeowners on optimizing their living spaces for over 10 years. Specializing in kitchen and bathroom renovations, he combines aesthetics and functionality in each of his projects.",
    expertise: ['Interior Architecture', 'Renovation', 'Design', 'Carpentry'],
    certifications: ['CFAI', 'ENSAD Diploma'],
    yearsExperience: 10,
    image: '/images/authors/thomas-bernard.svg',
  },
  'isabelle-renault': {
    slug: 'isabelle-renault',
    name: 'Isabelle Renault',
    role: "Expert in painting and coatings",
    bio: "Certified building painter and decorator, Isabelle has 14 years of experience in interior and exterior coatings. She advises individuals on material selection, application techniques, and color trends.",
    expertise: ['Painting', 'Coatings', 'Decoration', 'Thermal Insulation'],
    certifications: ['Qualibat 6111', 'Certification Peintre AFNOR'],
    yearsExperience: 14,
    image: '/images/authors/isabelle-renault.svg',
  },
}

/**
 * Find an author by their display name (as used in articles).
 * Returns undefined for "US Attorneys" or unknown names.
 */
export function getAuthorByName(name: string): Author | undefined {
  return Object.values(authors).find(a => a.name === name)
}
