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
  'editorial-team': {
    slug: 'editorial-team',
    name: 'Editorial Team',
    role: 'Legal content team',
    bio: 'Our editorial team produces and verifies all content on US Attorneys, ensuring accuracy and compliance with current legal standards.',
    expertise: ['Legal Writing', 'Research', 'Compliance'],
    certifications: [],
    yearsExperience: 10,
    image: '/images/authors/editorial-team.svg',
  },
}

/**
 * Find an author by their display name (as used in articles).
 * Returns undefined for "US Attorneys" or unknown names.
 */
export function getAuthorByName(name: string): Author | undefined {
  return Object.values(authors).find(a => a.name === name)
}
