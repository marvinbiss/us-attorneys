-- Migration 427: Add missing claimant columns to attorney_claims
-- P0-2: The attorney_claims table (migration 400) is missing claimant contact
-- fields needed for anonymous claim flow. The claim API inserts claimant_name,
-- claimant_email, claimant_phone, claimant_position but these columns don't exist.
-- Also: user_id must be nullable for anonymous claims.
-- Date: 2026-03-18

BEGIN;

-- Make user_id nullable (anonymous claims have no user at submission time)
ALTER TABLE attorney_claims ALTER COLUMN user_id DROP NOT NULL;

-- Add claimant contact fields for anonymous claims
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS claimant_name TEXT;
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS claimant_email TEXT;
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS claimant_phone TEXT;
ALTER TABLE attorney_claims ADD COLUMN IF NOT EXISTS claimant_position TEXT;

-- Index on claimant_email for duplicate-check queries on anonymous claims
CREATE INDEX IF NOT EXISTS idx_attorney_claims_claimant_email
  ON attorney_claims(claimant_email)
  WHERE claimant_email IS NOT NULL AND status = 'pending';

COMMIT;
