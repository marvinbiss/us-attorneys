import { authors, Author } from './authors'

export interface TeamMember {
  slug: string
  name: string
  role: string
  expertise: string[]
  bio: string
  shortBio: string // 1 phrase pour les bylines
}

export const teamMembers: TeamMember[] = [
  {
    slug: 'equipe-editoriale',
    name: 'Équipe éditoriale US Attorneys',
    role: 'Rédaction et vérification',
    expertise: ['Artisanat', 'BTP', 'Rénovation énergétique', 'Réglementation'],
    bio: 'Notre équipe éditoriale est composée de spécialistes du bâtiment et de l\'artisanat en France. Chaque article est vérifié par nos experts qui s\'appuient sur les données officielles (INSEE, ADEME, registre des métiers) et sur les retours de plus de 45 000 artisans référencés sur la plateforme.',
    shortBio: 'Contenu vérifié par notre équipe d\'experts en artisanat et BTP.',
  },
]

export function getDefaultAuthor(): TeamMember {
  return teamMembers[0]
}

/** Get all individual author profiles for display on the team section */
export function getAllAuthors(): Author[] {
  return Object.values(authors)
}
