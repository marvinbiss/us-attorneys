-- ============================================================================
-- Migration 429: Attorney Enrichment Tables
-- Adds 4 tables for attorney profile enrichment pipeline:
--   1. attorney_education    — Law school records
--   2. attorney_awards       — Professional recognitions
--   3. disciplinary_actions  — Bar discipline records (public record)
--   4. attorney_publications — Articles, books, speaking engagements
--
-- Sources: state bar sites, LinkedIn, Super Lawyers, Best Lawyers,
--          Martindale-Hubbell, SSRN, Google Scholar, law reviews
--
-- All tables are idempotent (IF NOT EXISTS / EXCEPTION WHEN duplicate_object)
-- ============================================================================

-- ============================================================================
-- 1. ATTORNEY EDUCATION
-- Law school education records (J.D., LL.M., S.J.D., etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorney_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL DEFAULT 'J.D.',
  graduation_year SMALLINT,
  honors TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: no duplicate education records
DO $$ BEGIN
  ALTER TABLE attorney_education ADD CONSTRAINT uq_attorney_education_record
    UNIQUE (attorney_id, institution, degree);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CHECK: graduation_year must be reasonable
DO $$ BEGIN
  ALTER TABLE attorney_education ADD CONSTRAINT chk_education_graduation_year
    CHECK (graduation_year IS NULL OR (graduation_year >= 1900 AND graduation_year <= 2100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attorney_education_attorney ON attorney_education(attorney_id);
CREATE INDEX IF NOT EXISTS idx_attorney_education_institution ON attorney_education(institution);

-- ============================================================================
-- 2. ATTORNEY AWARDS
-- Professional recognitions (Super Lawyers, Best Lawyers, Martindale-Hubbell)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorney_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  year SMALLINT,
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: no duplicate awards
DO $$ BEGIN
  ALTER TABLE attorney_awards ADD CONSTRAINT uq_attorney_award_record
    UNIQUE (attorney_id, title, issuer, year);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CHECK: year must be reasonable
DO $$ BEGIN
  ALTER TABLE attorney_awards ADD CONSTRAINT chk_award_year
    CHECK (year IS NULL OR (year >= 1950 AND year <= 2100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attorney_awards_attorney ON attorney_awards(attorney_id);
CREATE INDEX IF NOT EXISTS idx_attorney_awards_issuer_year ON attorney_awards(issuer, year);

-- ============================================================================
-- 3. DISCIPLINARY ACTIONS
-- Bar discipline records (public record). CRITICAL for legal credibility.
-- Zero tolerance for inaccuracy — source_url is NOT NULL (mandatory).
-- ============================================================================
CREATE TABLE IF NOT EXISTS disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  state CHAR(2) NOT NULL,
  action_type TEXT NOT NULL,
  effective_date DATE,
  end_date DATE,
  description TEXT,
  docket_number TEXT,
  source_url TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CHECK: state must be 2 uppercase letters
DO $$ BEGIN
  ALTER TABLE disciplinary_actions ADD CONSTRAINT chk_disciplinary_state_format
    CHECK (state ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CHECK: action_type must be one of the known types
DO $$ BEGIN
  ALTER TABLE disciplinary_actions ADD CONSTRAINT chk_disciplinary_action_type
    CHECK (action_type IN (
      'private_reprimand', 'public_reprimand', 'suspension', 'disbarment',
      'probation', 'censure', 'reinstatement', 'resignation', 'other'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CHECK: end_date must be >= effective_date when both are set
DO $$ BEGIN
  ALTER TABLE disciplinary_actions ADD CONSTRAINT chk_disciplinary_date_range
    CHECK (end_date IS NULL OR effective_date IS NULL OR end_date >= effective_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_attorney ON disciplinary_actions(attorney_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_state_type ON disciplinary_actions(state, action_type);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_effective_date ON disciplinary_actions(effective_date);

-- ============================================================================
-- 4. ATTORNEY PUBLICATIONS
-- Articles, books, speaking engagements, legal scholarship
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorney_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  publication_type TEXT NOT NULL,
  publisher TEXT,
  published_date DATE,
  url TEXT,
  doi TEXT,
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: no duplicate publications
DO $$ BEGIN
  ALTER TABLE attorney_publications ADD CONSTRAINT uq_attorney_publication_record
    UNIQUE (attorney_id, title, publisher);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CHECK: publication_type must be one of the known types
DO $$ BEGIN
  ALTER TABLE attorney_publications ADD CONSTRAINT chk_publication_type
    CHECK (publication_type IN (
      'article', 'book', 'book_chapter', 'law_review', 'blog_post',
      'speaking', 'testimony', 'amicus_brief', 'other'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attorney_publications_attorney ON attorney_publications(attorney_id);
CREATE INDEX IF NOT EXISTS idx_attorney_publications_type_date ON attorney_publications(publication_type, published_date);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE attorney_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_publications ENABLE ROW LEVEL SECURITY;

-- Public read access (attorney profile enrichment data is public)
DO $$ BEGIN
  CREATE POLICY "Public read attorney education" ON attorney_education FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read attorney awards" ON attorney_awards FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read disciplinary actions" ON disciplinary_actions FOR SELECT
    USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read attorney publications" ON attorney_publications FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
