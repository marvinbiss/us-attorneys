import { supabase } from '@/lib/supabase'
import { dbLogger } from '@/lib/logger'

// ============================================================================
// Attorney Enrichment Data Types
// Maps to migration 429 tables: attorney_education, attorney_awards,
// disciplinary_actions, attorney_publications
// ============================================================================

export interface AttorneyEducation {
  id: string
  attorney_id: string
  institution: string
  degree: string
  graduation_year: number | null
  honors: string | null
  is_verified: boolean
  source_url: string | null
  created_at: string
  updated_at: string
}

export interface AttorneyAward {
  id: string
  attorney_id: string
  title: string
  issuer: string
  year: number | null
  specialty_id: string | null
  url: string | null
  is_verified: boolean
  created_at: string
}

export interface DisciplinaryAction {
  id: string
  attorney_id: string
  state: string
  action_type: string
  effective_date: string | null
  end_date: string | null
  description: string | null
  docket_number: string | null
  source_url: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface AttorneyPublication {
  id: string
  attorney_id: string
  title: string
  publication_type: string
  publisher: string | null
  published_date: string | null
  url: string | null
  doi: string | null
  specialty_id: string | null
  is_verified: boolean
  created_at: string
}

export interface AttorneyEnrichmentData {
  education: AttorneyEducation[]
  awards: AttorneyAward[]
  publications: AttorneyPublication[]
  disciplinary: DisciplinaryAction[]
}

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

/**
 * Fetch all enrichment data for an attorney in parallel.
 * Returns empty arrays if no data or during build phase.
 */
export async function getAttorneyEnrichment(attorneyId: string): Promise<AttorneyEnrichmentData> {
  if (IS_BUILD || !supabase) {
    return { education: [], awards: [], publications: [], disciplinary: [] }
  }

  try {
    const [educationResult, awardsResult, publicationsResult, disciplinaryResult] = await Promise.all([
      supabase
        .from('attorney_education')
        .select('*')
        .eq('attorney_id', attorneyId)
        .order('graduation_year', { ascending: false }),
      supabase
        .from('attorney_awards')
        .select('*')
        .eq('attorney_id', attorneyId)
        .order('year', { ascending: false }),
      supabase
        .from('attorney_publications')
        .select('*')
        .eq('attorney_id', attorneyId)
        .order('published_date', { ascending: false })
        .limit(10),
      supabase
        .from('disciplinary_actions')
        .select('*')
        .eq('attorney_id', attorneyId)
        .eq('is_public', true)
        .order('effective_date', { ascending: false }),
    ])

    if (educationResult.error) {
      dbLogger.warn('Failed to fetch attorney education', { attorneyId, error: educationResult.error.message })
    }
    if (awardsResult.error) {
      dbLogger.warn('Failed to fetch attorney awards', { attorneyId, error: awardsResult.error.message })
    }
    if (publicationsResult.error) {
      dbLogger.warn('Failed to fetch attorney publications', { attorneyId, error: publicationsResult.error.message })
    }
    if (disciplinaryResult.error) {
      dbLogger.warn('Failed to fetch disciplinary actions', { attorneyId, error: disciplinaryResult.error.message })
    }

    return {
      education: (educationResult.data as AttorneyEducation[]) || [],
      awards: (awardsResult.data as AttorneyAward[]) || [],
      publications: (publicationsResult.data as AttorneyPublication[]) || [],
      disciplinary: (disciplinaryResult.data as DisciplinaryAction[]) || [],
    }
  } catch (error) {
    dbLogger.error('Failed to fetch attorney enrichment data', { attorneyId, error })
    return { education: [], awards: [], publications: [], disciplinary: [] }
  }
}

// ============================================================================
// Human-readable labels for disciplinary action types
// ============================================================================

export const ACTION_TYPE_LABELS: Record<string, string> = {
  private_reprimand: 'Private Reprimand',
  public_reprimand: 'Public Reprimand',
  suspension: 'Suspension',
  disbarment: 'Disbarment',
  probation: 'Probation',
  censure: 'Censure',
  reinstatement: 'Reinstatement',
  resignation: 'Resignation',
  other: 'Other Action',
}

export const PUBLICATION_TYPE_LABELS: Record<string, string> = {
  article: 'Article',
  book: 'Book',
  book_chapter: 'Book Chapter',
  law_review: 'Law Review',
  blog_post: 'Blog Post',
  speaking: 'Speaking',
  testimony: 'Testimony',
  amicus_brief: 'Amicus Brief',
  other: 'Publication',
}
