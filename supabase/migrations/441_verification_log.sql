-- Migration 441: Verification logs for automated bar license verification
-- Tracks every bar license verification attempt (automated + manual) with
-- full response data for audit trail and debugging.
-- Date: 2026-03-18

BEGIN;

-- ============================================================================
-- 1. VERIFICATION_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  bar_number TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'not_found', 'suspended', 'disbarred', 'manual_review', 'error')),
  response_data JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'api_lookup', -- api_lookup, manual, cache
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index for looking up verification history per attorney + state
CREATE INDEX idx_verification_logs_attorney_state
  ON verification_logs(attorney_id, state_code)
  WHERE attorney_id IS NOT NULL;

-- Index for recent verifications (cache lookup)
CREATE INDEX idx_verification_logs_recent
  ON verification_logs(bar_number, state_code, created_at DESC)
  WHERE status IN ('verified', 'not_found', 'suspended', 'disbarred');

-- Index for monitoring/audit: verification errors
CREATE INDEX idx_verification_logs_errors
  ON verification_logs(created_at DESC)
  WHERE status = 'error';

-- ============================================================================
-- 2. RLS POLICIES
-- ============================================================================
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- Public read for verified statuses (transparency)
CREATE POLICY "Public read verified logs" ON verification_logs
  FOR SELECT USING (status IN ('verified', 'suspended', 'disbarred'));

-- Service role can insert (API routes use adminClient)
-- No user-level insert policy needed since all writes go through service_role

-- ============================================================================
-- 3. UPDATE attorney_claims: add verification_status column
-- ============================================================================
ALTER TABLE attorney_claims
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'not_found', 'suspended', 'manual_review', 'error')),
  ADD COLUMN IF NOT EXISTS verification_log_id UUID REFERENCES verification_logs(id),
  ADD COLUMN IF NOT EXISTS auto_verified_at TIMESTAMPTZ;

COMMIT;
