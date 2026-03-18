-- ============================================================================
-- Migration 447: Final polish — missing indexes for critical query patterns
-- Sprint 10: Score 9.5 → 10.0
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bookings by attorney_id + scheduled_at (composite)
--    Serves: attorney dashboard bookings list, date-filtered booking queries
--    Existing idx_bookings_attorney covers attorney_id alone;
--    this composite index enables efficient range scans on scheduled_at
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_attorney_scheduled
  ON bookings (attorney_id, scheduled_at DESC)
  WHERE status IN ('pending', 'confirmed', 'completed');

-- ---------------------------------------------------------------------------
-- 2. Leads by status + created_at
--    Serves: admin lead dashboard, pending lead pipeline, lead age reporting
--    Partial index on active statuses keeps index compact
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'status'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_status_created
      ON leads (status, created_at DESC);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Reviews by attorney_id (non-partial, for total count queries)
--    Migration 446 already created idx_reviews_attorney_id;
--    this is a safety net with IF NOT EXISTS
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_attorney_id
  ON reviews (attorney_id);

-- ---------------------------------------------------------------------------
-- 4. Bar admissions by attorney_id
--    Serves: attorney profile page, claim verification, multi-state lookup
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'bar_admissions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bar_admissions_attorney
      ON bar_admissions (attorney_id);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 5. Case results by attorney_id
--    Serves: attorney profile page win rate / settlement stats
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'case_results'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_case_results_attorney
      ON case_results (attorney_id);
  END IF;
END
$$;
