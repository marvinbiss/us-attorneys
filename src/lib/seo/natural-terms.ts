export interface NaturalTerms {
  singular: string
  plural: string
  article: string
  feminin: boolean
  synonyms: string[]
  intentVerbs: string[]
  qualifiers: string[]
  commonQueries: string[]
}

const SHARED_VERBS: string[] = []

export const NATURAL_TERMS: Record<string, NaturalTerms> = {}

/** Get natural terms for a service slug, with safe fallback */
export function getNaturalTerm(specialtySlug: string): NaturalTerms {
  return NATURAL_TERMS[specialtySlug] ?? {
    singular: specialtySlug.replace(/-/g, ' '),
    plural: specialtySlug.replace(/-/g, ' ') + 's',
    article: `a ${specialtySlug.replace(/-/g, ' ')}`,
    feminin: false,
    synonyms: [],
    intentVerbs: SHARED_VERBS,
    qualifiers: [],
    commonQueries: [],
  }
}
