-- =============================================================================
-- Migration 343: Add contact fields to provider_claims
-- ServicesArtisans — 2026-02-24
-- =============================================================================
-- The claim form now collects name, email, phone, and position
-- so the admin can verify claimant identity before approval.
-- =============================================================================

ALTER TABLE provider_claims ADD COLUMN IF NOT EXISTS claimant_name TEXT;
ALTER TABLE provider_claims ADD COLUMN IF NOT EXISTS claimant_email TEXT;
ALTER TABLE provider_claims ADD COLUMN IF NOT EXISTS claimant_phone TEXT;
ALTER TABLE provider_claims ADD COLUMN IF NOT EXISTS claimant_position TEXT;
