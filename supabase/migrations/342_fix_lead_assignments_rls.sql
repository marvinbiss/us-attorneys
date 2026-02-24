-- =============================================================================
-- Migration 342: Fix lead_assignments RLS + FK + providers.user_id + backfill
-- ServicesArtisans — 2026-02-24
-- =============================================================================
-- Issues fixed:
--   0. providers.user_id column missing (never added to production)
--   1. lead_assignments_service_role policy uses USING(true) → disables RLS
--   2. lead_assignments_provider_update WITH CHECK misses 'quoted' status
--   3. lead_assignments.lead_id may lack FK to devis_requests(id)
--   4. profiles.role not set for approved artisans
--   5. profiles.role = 'user' (invalid per CHECK constraint)
-- =============================================================================

-- ─────────────────────────────────────────────────
-- 0. Add user_id column to providers if missing
-- This column is required for the entire artisan flow:
--   - Claim approval sets providers.user_id
--   - Artisan API routes join via providers.user_id = auth.uid()
--   - RLS policies reference providers.user_id
-- ─────────────────────────────────────────────────
ALTER TABLE providers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id) WHERE user_id IS NOT NULL;

-- Also add claimed_at and claimed_by if missing (from migration 314)
ALTER TABLE providers ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES profiles(id);

-- ─────────────────────────────────────────────────
-- 1. Drop the overly permissive policy from migration 202
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS lead_assignments_service_role ON lead_assignments;

-- ─────────────────────────────────────────────────
-- 2. Recreate lead_assignments_provider_update with 'quoted' included
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS lead_assignments_provider_update ON lead_assignments;

CREATE POLICY lead_assignments_provider_update
  ON lead_assignments FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('viewed', 'quoted', 'declined')
  );

-- ─────────────────────────────────────────────────
-- 3. Ensure FK exists on lead_assignments.lead_id → devis_requests(id)
-- ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc
      ON kcu.constraint_name = tc.constraint_name
      AND kcu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'lead_assignments'
      AND kcu.column_name = 'lead_id'
  ) THEN
    ALTER TABLE lead_assignments
      ADD CONSTRAINT lead_assignments_lead_id_fkey
        FOREIGN KEY (lead_id) REFERENCES devis_requests(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- 4. Create provider_claims table if missing (from migration 314)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  siret_provided  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by     UUID REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────
-- 5. Backfill profiles.role for approved artisans
-- ─────────────────────────────────────────────────
DO $$
BEGIN
  -- From provider_claims (if table has data)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'provider_claims'
  ) THEN
    UPDATE profiles
    SET role = 'artisan', updated_at = now()
    WHERE id IN (
      SELECT DISTINCT pc.user_id
      FROM provider_claims pc
      WHERE pc.status = 'approved'
    )
    AND (role IS NULL OR role NOT IN ('super_admin', 'admin', 'moderator', 'viewer', 'artisan'));
  END IF;

  -- From providers.user_id (artisans linked directly)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'user_id'
  ) THEN
    UPDATE profiles
    SET role = 'artisan', updated_at = now()
    WHERE id IN (
      SELECT DISTINCT p.user_id
      FROM providers p
      WHERE p.user_id IS NOT NULL AND p.is_active = true
    )
    AND (role IS NULL OR role NOT IN ('super_admin', 'admin', 'moderator', 'viewer', 'artisan'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- 6. Fix profiles with invalid role='user' → 'client'
-- ─────────────────────────────────────────────────
UPDATE profiles
SET role = 'client', updated_at = now()
WHERE role = 'user';
