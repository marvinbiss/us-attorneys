-- =============================================================================
-- Migration 344: Make provider_claims.user_id nullable (anonymous claims)
-- ServicesArtisans — 2026-02-24
-- =============================================================================
-- Artisans can now submit a claim WITHOUT having an account.
-- user_id is set later when the admin approves and the system creates the account.
-- =============================================================================

-- 1. Drop NOT NULL constraint on user_id
ALTER TABLE provider_claims ALTER COLUMN user_id DROP NOT NULL;

-- 2. Replace the old UNIQUE constraint with partial indexes
-- (the old constraint: UNIQUE(provider_id, user_id) from migration 314)
DROP INDEX IF EXISTS provider_claims_provider_id_user_id_key;

-- a) Authenticated claims: one pending claim per user per provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_claims_user_pending
  ON provider_claims(provider_id, user_id)
  WHERE user_id IS NOT NULL AND status = 'pending';

-- b) Anonymous claims: one pending claim per email per provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_claims_email_pending
  ON provider_claims(provider_id, claimant_email)
  WHERE user_id IS NULL AND status = 'pending';
