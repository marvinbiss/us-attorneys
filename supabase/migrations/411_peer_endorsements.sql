-- 411: Peer Endorsements
-- Attorneys can endorse other attorneys in their practice area.
-- Differentiator: transparent peer recognition (like LinkedIn endorsements for lawyers).
-- Used in trust score calculation (weight 0.5).

CREATE TABLE IF NOT EXISTS peer_endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endorser_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  endorsed_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(endorser_id, endorsed_id),
  -- Cannot self-endorse
  CONSTRAINT no_self_endorsement CHECK (endorser_id <> endorsed_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_peer_endorsements_endorsed ON peer_endorsements(endorsed_id);
CREATE INDEX IF NOT EXISTS idx_peer_endorsements_endorser ON peer_endorsements(endorser_id);

-- RLS
ALTER TABLE peer_endorsements ENABLE ROW LEVEL SECURITY;

-- Anyone can read endorsements (public data)
CREATE POLICY "Public read endorsements"
  ON peer_endorsements FOR SELECT
  USING (true);

-- Only verified attorneys can create endorsements for others
CREATE POLICY "Verified attorneys endorse"
  ON peer_endorsements FOR INSERT
  WITH CHECK (
    endorser_id IN (
      SELECT id FROM attorneys
      WHERE user_id = auth.uid()
        AND is_verified = true
    )
  );

-- Endorser can delete their own endorsement
CREATE POLICY "Endorser can delete own"
  ON peer_endorsements FOR DELETE
  USING (
    endorser_id IN (
      SELECT id FROM attorneys
      WHERE user_id = auth.uid()
    )
  );

-- Denormalized count on attorneys for fast queries and sorting
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;

-- Function to keep endorsement_count in sync
CREATE OR REPLACE FUNCTION update_endorsement_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE attorneys SET endorsement_count = endorsement_count + 1
    WHERE id = NEW.endorsed_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE attorneys SET endorsement_count = GREATEST(0, endorsement_count - 1)
    WHERE id = OLD.endorsed_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_endorsement_count_insert
  AFTER INSERT ON peer_endorsements
  FOR EACH ROW EXECUTE FUNCTION update_endorsement_count();

CREATE TRIGGER trg_endorsement_count_delete
  AFTER DELETE ON peer_endorsements
  FOR EACH ROW EXECUTE FUNCTION update_endorsement_count();
