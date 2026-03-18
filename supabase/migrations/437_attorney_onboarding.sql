-- Migration 437: Attorney onboarding tracking
-- Adds onboarding progress columns to attorneys table

-- Step tracker (0 = not started, 1-6 = current step, 6 = completed)
ALTER TABLE attorneys
  ADD COLUMN IF NOT EXISTS onboarding_step SMALLINT NOT NULL DEFAULT 0;

-- Timestamp when onboarding was fully completed
ALTER TABLE attorneys
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Profile completion percentage (0-100), updated via trigger
ALTER TABLE attorneys
  ADD COLUMN IF NOT EXISTS profile_completion_pct SMALLINT NOT NULL DEFAULT 0;

-- Onboarding step data (partial saves per step)
ALTER TABLE attorneys
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';

-- Index for quickly finding incomplete onboarding
CREATE INDEX IF NOT EXISTS idx_attorneys_onboarding_incomplete
  ON attorneys (onboarding_step)
  WHERE onboarding_completed_at IS NULL;

-- Function to compute profile_completion_pct based on filled fields
CREATE OR REPLACE FUNCTION compute_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  pct SMALLINT := 0;
  total INT := 10;
  filled INT := 0;
BEGIN
  -- Check each relevant field
  IF NEW.name IS NOT NULL AND length(trim(NEW.name)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.bar_number IS NOT NULL AND length(trim(NEW.bar_number)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.address_city IS NOT NULL AND length(trim(NEW.address_city)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.address_state IS NOT NULL AND length(trim(NEW.address_state)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.description IS NOT NULL AND length(trim(NEW.description)) > 10 THEN filled := filled + 1; END IF;
  IF NEW.is_verified = true THEN filled := filled + 1; END IF;
  IF NEW.primary_specialty_id IS NOT NULL THEN filled := filled + 1; END IF;
  IF NEW.firm_name IS NOT NULL AND length(trim(NEW.firm_name)) > 0 THEN filled := filled + 1; END IF;
  IF NEW.onboarding_completed_at IS NOT NULL THEN filled := filled + 1; END IF;

  pct := ((filled::NUMERIC / total) * 100)::SMALLINT;
  NEW.profile_completion_pct := pct;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update profile_completion_pct on INSERT or UPDATE
DROP TRIGGER IF EXISTS trg_compute_profile_completion ON attorneys;
CREATE TRIGGER trg_compute_profile_completion
  BEFORE INSERT OR UPDATE ON attorneys
  FOR EACH ROW
  EXECUTE FUNCTION compute_profile_completion();

-- Comment
COMMENT ON COLUMN attorneys.onboarding_step IS 'Current onboarding wizard step (0=not started, 1-6=in progress, 6=done)';
COMMENT ON COLUMN attorneys.onboarding_completed_at IS 'Timestamp when attorney completed the full onboarding wizard';
COMMENT ON COLUMN attorneys.profile_completion_pct IS 'Auto-computed profile completion percentage (0-100)';
COMMENT ON COLUMN attorneys.onboarding_data IS 'Partial onboarding data saved per step (JSONB)';
