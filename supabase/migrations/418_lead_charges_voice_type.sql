-- ============================================================================
-- Migration 418: Add 'voice' to lead_charges.lead_type CHECK constraint
-- Supports billing for Vapi voice-qualified leads at $75/lead
-- ============================================================================

ALTER TABLE lead_charges
  DROP CONSTRAINT IF EXISTS lead_charges_lead_type_check;

ALTER TABLE lead_charges
  ADD CONSTRAINT lead_charges_lead_type_check
  CHECK (lead_type IN ('standard', 'premium', 'voice', 'exclusive'));
