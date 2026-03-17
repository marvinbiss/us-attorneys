-- ============================================================================
-- Migration 419: Deduplication Support
-- Adds canonical_attorney_id to attorneys table for multi-state dedup linking.
-- When set, this attorney is a duplicate — the canonical record is the primary one.
-- ============================================================================

-- Add canonical_attorney_id column (self-referencing FK)
DO $$ BEGIN
  ALTER TABLE attorneys
    ADD COLUMN canonical_attorney_id UUID REFERENCES attorneys(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Index for fast lookup of duplicates and filtering them out
CREATE INDEX IF NOT EXISTS idx_attorneys_canonical
  ON attorneys(canonical_attorney_id)
  WHERE canonical_attorney_id IS NOT NULL;

-- Partial index for listing queries: only show non-duplicate active attorneys
CREATE INDEX IF NOT EXISTS idx_attorneys_active_canonical
  ON attorneys(is_active, noindex)
  WHERE is_active = true AND canonical_attorney_id IS NULL;
