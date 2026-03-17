-- Migration 402: Add missing RLS to app.* tables
-- Security audit 2026-03-17: These 4 tables were created without RLS in 110_v3_full_schema.sql
-- Note: search_history and saved_searches were dropped in 100_v2_schema_cleanup.sql — skipped.
-- Note: PostgreSQL partitions inherit RLS from parent — no separate ALTER needed.

BEGIN;

-- ============================================================================
-- 1. ENABLE RLS on the 4 missing tables
-- ============================================================================

ALTER TABLE IF EXISTS app.outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app.artisan_monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app.artisan_merges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. app.outreach_messages — service_role only (internal outbound messages)
-- ============================================================================

CREATE POLICY outreach_service_role ON app.outreach_messages
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. app.events — service_role only (audit trail, written by backend)
-- ============================================================================

CREATE POLICY events_service_role ON app.events
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. app.artisan_monthly_usage — artisan reads own + service_role full access
--    (GRANT SELECT TO authenticated already exists in migration 110)
-- ============================================================================

CREATE POLICY usage_own_read ON app.artisan_monthly_usage
  FOR SELECT USING (artisan_id IN (
    SELECT id FROM app.artisans WHERE claimed_by = auth.uid()
  ));

CREATE POLICY usage_service_role ON app.artisan_monthly_usage
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 5. app.artisan_merges — service_role only (internal dedup chain)
-- ============================================================================

CREATE POLICY merges_service_role ON app.artisan_merges
  FOR ALL USING (auth.role() = 'service_role');

COMMIT;
