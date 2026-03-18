-- ============================================================================
-- Migration 440: Deadline Reminders for Legal Deadline Tracker
-- ============================================================================

CREATE TABLE IF NOT EXISTS deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty_slug TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,
  incident_date DATE NOT NULL,
  deadline_date DATE NOT NULL,
  reminded_30d BOOLEAN NOT NULL DEFAULT false,
  reminded_7d BOOLEAN NOT NULL DEFAULT false,
  reminded_1d BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, specialty_slug, state_code, incident_date)
);

CREATE INDEX idx_deadline_reminders_user ON deadline_reminders(user_id);
CREATE INDEX idx_deadline_reminders_deadline ON deadline_reminders(deadline_date);
CREATE INDEX idx_deadline_reminders_pending ON deadline_reminders(deadline_date)
  WHERE reminded_30d = false OR reminded_7d = false OR reminded_1d = false;

-- RLS
ALTER TABLE deadline_reminders ENABLE ROW LEVEL SECURITY;

-- Users can read their own reminders
CREATE POLICY "Users read own deadline_reminders"
  ON deadline_reminders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reminders
CREATE POLICY "Users insert own deadline_reminders"
  ON deadline_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reminders
CREATE POLICY "Users delete own deadline_reminders"
  ON deadline_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can update (for cron reminder flags)
-- No user UPDATE policy needed — only cron updates reminded_* flags
