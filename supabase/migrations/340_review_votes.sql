-- Migration 340: review_votes table for vote deduplication
-- Uses voter_fingerprint (user:{id} or ip:{address}) + UNIQUE constraint

CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  is_helpful BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, voter_fingerprint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id
  ON review_votes(review_id);

CREATE INDEX IF NOT EXISTS idx_review_votes_fingerprint
  ON review_votes(voter_fingerprint);

-- RLS
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert review votes" ON review_votes;
CREATE POLICY "Anyone can insert review votes"
  ON review_votes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read review votes" ON review_votes;
CREATE POLICY "Anyone can read review votes"
  ON review_votes FOR SELECT
  USING (true);

-- Trigger: auto-update reviews.helpful_count on insert/delete
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = (
    SELECT COUNT(*)
    FROM review_votes
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
    AND is_helpful = true
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_helpful_count ON review_votes;
CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR DELETE ON review_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_count();
