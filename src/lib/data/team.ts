import { authors, Author } from './authors'

export interface TeamMember {
  slug: string
  name: string
  role: string
  expertise: string[]
  bio: string
  shortBio: string // 1 sentence for bylines
}

export const teamMembers: TeamMember[] = []

export function getDefaultAuthor(): TeamMember | undefined {
  return teamMembers[0]
}

/** Get all individual author profiles for display on the team section */
export function getAllAuthors(): Author[] {
  return Object.values(authors)
}
