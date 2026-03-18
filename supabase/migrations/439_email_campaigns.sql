-- ============================================================================
-- Migration 439: Email Drip Campaign System
-- Tracks email sends for drip campaigns + attorney email preferences.
-- Prevents duplicate sends via unique constraint on (attorney_id, campaign, step).
-- ============================================================================

-- ============================================================================
-- 1. email_sends — tracks every drip email sent to attorneys
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_sends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id     UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  campaign        TEXT NOT NULL,  -- 'trial_onboarding', 'post_conversion', 'win_back'
  step            TEXT NOT NULL,  -- 'day_0', 'day_1', 'month_1', etc.
  template        TEXT NOT NULL,  -- template key for debugging
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  resend_id       TEXT,           -- Resend message ID for tracking
  error           TEXT,           -- NULL if sent successfully

  CONSTRAINT uq_email_sends_attorney_campaign_step
    UNIQUE (attorney_id, campaign, step)
);

-- Indexes
CREATE INDEX idx_email_sends_attorney ON email_sends(attorney_id, campaign);
CREATE INDEX idx_email_sends_sent_at ON email_sends(sent_at DESC);
CREATE INDEX idx_email_sends_campaign ON email_sends(campaign, step);

-- RLS
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- Attorneys can view their own email history
CREATE POLICY "Attorneys can view own email sends"
  ON email_sends FOR SELECT
  USING (
    attorney_id IN (
      SELECT id FROM attorneys WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage email sends"
  ON email_sends FOR ALL
  USING (is_admin());

-- ============================================================================
-- 2. email_preferences — attorney-level opt-in/opt-out
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_preferences (
  attorney_id       UUID PRIMARY KEY REFERENCES attorneys(id) ON DELETE CASCADE,
  marketing_emails  BOOLEAN NOT NULL DEFAULT true,
  product_updates   BOOLEAN NOT NULL DEFAULT true,
  weekly_stats      BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at   TIMESTAMPTZ,  -- NULL = still subscribed; set = global unsubscribe timestamp
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Attorneys can view and update their own preferences
CREATE POLICY "Attorneys can view own email preferences"
  ON email_preferences FOR SELECT
  USING (
    attorney_id IN (
      SELECT id FROM attorneys WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Attorneys can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (
    attorney_id IN (
      SELECT id FROM attorneys WHERE user_id = auth.uid()
    )
  );

-- Allow inserts (for first-time preference creation)
CREATE POLICY "Attorneys can insert own email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (
    attorney_id IN (
      SELECT id FROM attorneys WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage email preferences"
  ON email_preferences FOR ALL
  USING (is_admin());

-- ============================================================================
-- 3. Add trial tracking columns to attorneys (if not already present)
-- ============================================================================
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS churned_at TIMESTAMPTZ;

-- Index for drip campaign queries
CREATE INDEX IF NOT EXISTS idx_attorneys_trial_started ON attorneys(trial_started_at)
  WHERE trial_started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attorneys_churned ON attorneys(churned_at)
  WHERE churned_at IS NOT NULL;

-- ============================================================================
-- 4. Comments
-- ============================================================================
COMMENT ON TABLE email_sends IS 'Tracks every drip campaign email sent to attorneys. Unique constraint prevents duplicate sends.';
COMMENT ON TABLE email_preferences IS 'Attorney-level email opt-in/opt-out preferences for drip campaigns.';
COMMENT ON COLUMN email_sends.campaign IS 'Campaign type: trial_onboarding, post_conversion, win_back';
COMMENT ON COLUMN email_sends.step IS 'Campaign step: day_0, day_1, day_3, day_7, day_10, day_13, month_1, month_2, month_3';
COMMENT ON COLUMN email_sends.resend_id IS 'Resend API message ID for open/click tracking';
COMMENT ON COLUMN email_preferences.unsubscribed_at IS 'Global unsubscribe timestamp. If set, no drip emails are sent.';
COMMENT ON COLUMN attorneys.trial_started_at IS 'When the attorney started their free trial';
COMMENT ON COLUMN attorneys.trial_ends_at IS 'When the trial expires (trial_started_at + 14 days)';
COMMENT ON COLUMN attorneys.churned_at IS 'When the attorney cancelled their paid subscription';
