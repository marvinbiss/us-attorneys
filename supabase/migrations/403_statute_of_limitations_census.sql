-- ============================================================================
-- Migration 403: Statute of Limitations + Census Data
-- ============================================================================

-- 1. STATUTE OF LIMITATIONS TABLE
-- Sources: Justia, Nolo, official state codes
-- 75 practice areas × 51 jurisdictions = up to 3,825 entries
CREATE TABLE IF NOT EXISTS statute_of_limitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code CHAR(2) NOT NULL,
  specialty_slug TEXT NOT NULL,
  years NUMERIC(4,1) NOT NULL,
  exceptions TEXT[] DEFAULT '{}',
  discovery_rule BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(state_code, specialty_slug)
);

CREATE INDEX idx_sol_state ON statute_of_limitations(state_code);
CREATE INDEX idx_sol_specialty ON statute_of_limitations(specialty_slug);
CREATE INDEX idx_sol_years ON statute_of_limitations(years);

-- RLS
ALTER TABLE statute_of_limitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read statute_of_limitations" ON statute_of_limitations FOR SELECT USING (true);

-- 2. ADD census_data JSONB TO locations_us
-- Stores: population, median_household_income, unemployment_rate, hispanic_pct, median_age
-- Source: Census Bureau ACS 5-year estimates
ALTER TABLE locations_us ADD COLUMN IF NOT EXISTS census_data JSONB;

CREATE INDEX idx_locations_us_census ON locations_us USING GIN(census_data) WHERE census_data IS NOT NULL;
