-- ============================================================================
-- Migration 438: Lead Matching & Assignment System for US Attorneys
-- Intelligent lead-to-attorney matching with scoring, round-robin distribution,
-- and monthly lead limit enforcement.
-- ============================================================================

-- ============================================================================
-- 1. attorney_lead_assignments table (US Attorneys version)
-- Replaces the old provider-based lead_assignments for the attorney schema.
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorney_lead_assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id               UUID NOT NULL,  -- References bookings.id (consultation requests)
  attorney_id           UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  score                 NUMERIC(8,2) NOT NULL DEFAULT 0,
  match_reasons         JSONB NOT NULL DEFAULT '[]'::jsonb,
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
  assigned_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at          TIMESTAMPTZ,
  response_time_seconds INTEGER,
  position              INTEGER NOT NULL DEFAULT 1,  -- Rank among matches for this lead

  CONSTRAINT uq_attorney_lead_assignments UNIQUE (lead_id, attorney_id)
);

-- Indexes
CREATE INDEX idx_atty_lead_assign_attorney_status
  ON attorney_lead_assignments(attorney_id, status);
CREATE INDEX idx_atty_lead_assign_lead
  ON attorney_lead_assignments(lead_id);
CREATE INDEX idx_atty_lead_assign_assigned
  ON attorney_lead_assignments(assigned_at DESC);
CREATE INDEX idx_atty_lead_assign_pending
  ON attorney_lead_assignments(status, assigned_at DESC)
  WHERE status = 'pending';

-- ============================================================================
-- 2. Add last_lead_assigned_at to attorneys (round-robin counter)
-- ============================================================================
ALTER TABLE attorneys
  ADD COLUMN IF NOT EXISTS last_lead_assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attorneys_last_lead
  ON attorneys(last_lead_assigned_at ASC NULLS FIRST)
  WHERE is_active = true;

-- ============================================================================
-- 3. Add matching_status to bookings (consultation requests as leads)
-- ============================================================================
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS matching_status TEXT DEFAULT 'unmatched'
    CHECK (matching_status IN ('unmatched', 'matched', 'assigned', 'manual_review'));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS matched_attorney_id UUID REFERENCES attorneys(id);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS practice_area_slug TEXT;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS client_state CHAR(2);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS client_city TEXT;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS client_zip CHAR(5);

CREATE INDEX IF NOT EXISTS idx_bookings_matching_status
  ON bookings(matching_status)
  WHERE matching_status IN ('unmatched', 'manual_review');

-- ============================================================================
-- 4. RLS policies
-- ============================================================================
ALTER TABLE attorney_lead_assignments ENABLE ROW LEVEL SECURITY;

-- Attorneys can view their own assignments
CREATE POLICY atty_lead_assign_attorney_select
  ON attorney_lead_assignments FOR SELECT
  USING (
    attorney_id IN (
      SELECT id FROM attorneys WHERE user_id = auth.uid()
    )
  );

-- Attorneys can update their own assignments (accept/decline)
CREATE POLICY atty_lead_assign_attorney_update
  ON attorney_lead_assignments FOR UPDATE
  USING (
    attorney_id IN (
      SELECT id FROM attorneys WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('accepted', 'declined')
  );

-- Admins can do everything
CREATE POLICY atty_lead_assign_admin_all
  ON attorney_lead_assignments FOR ALL
  USING (is_admin());

-- ============================================================================
-- 5. Comments
-- ============================================================================
COMMENT ON TABLE attorney_lead_assignments IS 'Lead-to-attorney matching assignments with scoring and response tracking';
COMMENT ON COLUMN attorney_lead_assignments.score IS 'Matching score (higher = better fit). Includes subscription tier multiplier.';
COMMENT ON COLUMN attorney_lead_assignments.match_reasons IS 'JSON array of reasons for the match (e.g., practice_area_exact, same_city, fast_responder)';
COMMENT ON COLUMN attorney_lead_assignments.response_time_seconds IS 'Time in seconds from assignment to first response (accept/decline)';
COMMENT ON COLUMN attorney_lead_assignments.position IS 'Rank of this attorney among all matches for the lead (1 = best match)';
