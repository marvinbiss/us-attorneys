-- ============================================================================
-- Migration 430: Write Policies on Enrichment Tables
-- Restricts INSERT/UPDATE/DELETE on attorney enrichment tables to service_role.
-- These tables are populated exclusively by ingestion scripts and admin tools,
-- never by end users directly.
--
-- Tables: attorney_education, attorney_awards, disciplinary_actions,
--         attorney_publications
--
-- Idempotent: uses DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$
-- ============================================================================

-- ============================================================================
-- 1. attorney_education — write policies
-- ============================================================================
DO $$ BEGIN
  CREATE POLICY "Service role insert attorney education"
    ON attorney_education FOR INSERT
    TO service_role
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update attorney education"
    ON attorney_education FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete attorney education"
    ON attorney_education FOR DELETE
    TO service_role
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. attorney_awards — write policies
-- ============================================================================
DO $$ BEGIN
  CREATE POLICY "Service role insert attorney awards"
    ON attorney_awards FOR INSERT
    TO service_role
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update attorney awards"
    ON attorney_awards FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete attorney awards"
    ON attorney_awards FOR DELETE
    TO service_role
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. disciplinary_actions — write policies
-- ============================================================================
DO $$ BEGIN
  CREATE POLICY "Service role insert disciplinary actions"
    ON disciplinary_actions FOR INSERT
    TO service_role
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update disciplinary actions"
    ON disciplinary_actions FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete disciplinary actions"
    ON disciplinary_actions FOR DELETE
    TO service_role
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 4. attorney_publications — write policies
-- ============================================================================
DO $$ BEGIN
  CREATE POLICY "Service role insert attorney publications"
    ON attorney_publications FOR INSERT
    TO service_role
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update attorney publications"
    ON attorney_publications FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete attorney publications"
    ON attorney_publications FOR DELETE
    TO service_role
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
