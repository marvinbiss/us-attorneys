-- 421: Peer Endorsements — allow one endorsement per specialty pair
-- Migration 411 created the base table with UNIQUE(endorser_id, endorsed_id).
-- This migration changes the constraint to UNIQUE(endorser_id, endorsed_id, specialty_id)
-- so that an attorney can endorse the same peer in multiple specialties.

-- Drop the old unique constraint and recreate with specialty included
ALTER TABLE peer_endorsements DROP CONSTRAINT IF EXISTS peer_endorsements_endorser_id_endorsed_id_key;

-- Add comment length check
ALTER TABLE peer_endorsements ADD CONSTRAINT endorsement_comment_length CHECK (char_length(comment) <= 200);

-- New unique: one endorsement per (endorser, endorsed, specialty)
ALTER TABLE peer_endorsements ADD CONSTRAINT peer_endorsements_endorser_endorsed_specialty_key
  UNIQUE (endorser_id, endorsed_id, specialty_id);

-- Index for specialty-filtered queries on endorsement display
CREATE INDEX IF NOT EXISTS idx_peer_endorsements_specialty ON peer_endorsements(specialty_id)
  WHERE specialty_id IS NOT NULL;
