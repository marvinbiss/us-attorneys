-- 409: Trust Score (public 1-10)
-- Transparent, explainable trust score for each attorney.
-- Differentiator vs Avvo/FindLaw: 100% verifiable, breakdown visible to users.

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trust_score NUMERIC(3,1) DEFAULT 0;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trust_score_breakdown JSONB DEFAULT '{}';
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS trust_score_updated_at TIMESTAMPTZ;

-- Partial index: only attorneys with a computed score (skips 0-default rows)
CREATE INDEX IF NOT EXISTS idx_attorneys_trust_score ON attorneys(trust_score DESC) WHERE trust_score > 0;

-- RLS: trust_score columns are public-readable (inherits existing attorneys RLS).
-- No additional policy needed — they are regular columns on an already-RLS-enabled table.
