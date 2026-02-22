-- Migration 330: Fix noindex column default and backfill
-- =============================================================================
-- ROOT CAUSE: Migration 100 created noindex with DEFAULT TRUE.
-- Migration 315 tried to change it via ADD COLUMN IF NOT EXISTS noindex DEFAULT false,
-- but IF NOT EXISTS is a no-op when the column already exists — the DEFAULT stayed TRUE.
--
-- IMPACT: ~710 active providers have noindex=true, blocking them from Google indexing.
-- These pages serve <meta name="robots" content="noindex"> and are excluded from sitemaps.
--
-- FIX: Change the column default to false and backfill all active providers.
-- Only inactive/dead businesses should remain noindex=true.
-- =============================================================================

-- 1. Change the default for new providers
ALTER TABLE providers ALTER COLUMN noindex SET DEFAULT false;

-- 2. Backfill: Make ALL active providers indexable
-- This fixes providers stuck with noindex=true from the original DEFAULT TRUE
UPDATE providers SET noindex = false WHERE is_active = true AND noindex = true;

-- 3. Ensure inactive providers remain noindex=true
UPDATE providers SET noindex = true WHERE is_active = false AND noindex = false;
