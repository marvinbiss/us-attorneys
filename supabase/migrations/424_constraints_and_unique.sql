-- Migration 424: Add UNIQUE partial index and CHECK constraints on attorneys
-- P1-12: Unique constraint on (bar_number, bar_state)
-- P1-22: Data integrity CHECK constraints
-- Date: 2026-03-18

BEGIN;

-- ============================================================================
-- P1-12: UNIQUE constraint on (bar_number, bar_state)
-- ============================================================================
-- A given bar number within a state must be unique. We use a partial unique
-- index (WHERE bar_number IS NOT NULL) so that rows with NULL bar_number
-- are not constrained — multiple attorneys can have NULL bar_number.
-- Drop the existing non-unique index first, then create the unique one.
-- ============================================================================

DROP INDEX IF EXISTS idx_attorneys_bar;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attorneys_bar_unique
  ON attorneys (bar_number, bar_state)
  WHERE bar_number IS NOT NULL;

-- ============================================================================
-- P1-22: CHECK constraints on attorneys table
-- ============================================================================
-- Wrapped in DO $$ blocks so we can skip gracefully if constraints already exist.
-- ============================================================================

-- Email: basic RFC-like format validation
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_email
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rating average: must be between 0 and 5
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_rating_average
    CHECK (rating_average >= 0 AND rating_average <= 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Review count: must be non-negative
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_review_count
    CHECK (review_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Hourly rate: min must not exceed max (when both are set)
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_hourly_rate
    CHECK (hourly_rate_min IS NULL OR hourly_rate_max IS NULL OR hourly_rate_min <= hourly_rate_max);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Contingency percentage: must be between 0 and 100 (when set)
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_contingency_percentage
    CHECK (contingency_percentage IS NULL OR (contingency_percentage >= 0 AND contingency_percentage <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Slug: URL-safe lowercase format (a-z, 0-9, hyphens, no leading/trailing hyphen)
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_slug
    CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Bar state: exactly 2 uppercase letters (e.g. 'TX', 'CA')
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_bar_state
    CHECK (bar_state ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Address state: exactly 2 uppercase letters (e.g. 'TX', 'CA')
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_address_state
    CHECK (address_state ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Years of experience: must be non-negative (when set)
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_years_experience
    CHECK (years_experience IS NULL OR years_experience >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Cases handled: must be non-negative
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_cases_handled
    CHECK (cases_handled >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Win rate: must be between 0 and 100 (when set)
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_win_rate
    CHECK (win_rate IS NULL OR (win_rate >= 0 AND win_rate <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
