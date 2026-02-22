-- Migration 330: Fix noindex column default and backfill
-- =============================================================================
-- ROOT CAUSE: Migration 100 created noindex with DEFAULT TRUE.
-- Migration 315 tried to change it via ADD COLUMN IF NOT EXISTS noindex DEFAULT false,
-- but IF NOT EXISTS is a no-op when the column already exists — the DEFAULT stayed TRUE.
--
-- IMPACT: ~710 active providers have noindex=true, blocking them from Google indexing.
-- These pages serve <meta name="robots" content="noindex"> and are excluded from sitemaps.
--
-- FIX: Change the column default to false and backfill all active providers in batches
-- to avoid statement_timeout on large tables (743K+ rows).
-- Only inactive/dead businesses should remain noindex=true.
-- =============================================================================

-- 1. Change the default for new providers (instant, no row scan)
ALTER TABLE providers ALTER COLUMN noindex SET DEFAULT false;

-- 2. Backfill in batches of 10,000 to avoid statement_timeout
-- Each batch targets the smallest set possible via the partial index
DO $$
DECLARE
  rows_updated INTEGER;
  total_updated INTEGER := 0;
  batch_size INTEGER := 10000;
BEGIN
  LOOP
    UPDATE providers
    SET noindex = false
    WHERE id IN (
      SELECT id FROM providers
      WHERE is_active = true AND noindex = true
      LIMIT batch_size
    );

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    total_updated := total_updated + rows_updated;

    -- Exit when no more rows to update
    EXIT WHEN rows_updated = 0;

    -- Brief pause to let other queries through
    PERFORM pg_sleep(0.1);
  END LOOP;

  RAISE NOTICE 'Migration 330: Set noindex=false for % active providers', total_updated;
END $$;

-- 3. Ensure inactive providers remain noindex=true (small set)
UPDATE providers SET noindex = true WHERE is_active = false AND noindex = false;
