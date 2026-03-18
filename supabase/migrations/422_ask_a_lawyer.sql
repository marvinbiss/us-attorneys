-- Migration 422: Ask a Lawyer — Q&A Platform enhancements
-- Adds qa_votes table, full-text search, vote_count on questions
-- Complements migration 410 (legal_questions + legal_answers)

-- ─── qa_votes table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES legal_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES legal_answers(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Exactly one of question_id or answer_id must be set
  CONSTRAINT chk_vote_target CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL)
  ),
  -- One vote per user per target
  CONSTRAINT uq_vote_question UNIQUE (user_id, question_id),
  CONSTRAINT uq_vote_answer UNIQUE (user_id, answer_id)
);

-- ─── Add vote_count to legal_questions if missing ────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_questions' AND column_name = 'vote_count'
  ) THEN
    ALTER TABLE legal_questions ADD COLUMN vote_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ─── Full-text search on questions ───────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_questions' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE legal_questions ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(body, '')), 'B')
      ) STORED;
  END IF;
END $$;

-- Index for full-text search
CREATE INDEX IF NOT EXISTS idx_questions_search ON legal_questions USING GIN (search_vector);

-- ─── Additional indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_created ON legal_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_status_created ON legal_questions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_question ON qa_votes(question_id) WHERE question_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_answer ON qa_votes(answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_user ON qa_votes(user_id);

-- ─── RLS for qa_votes ────────────────────────────────────────────────────────
ALTER TABLE qa_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read votes' AND tablename = 'qa_votes') THEN
    CREATE POLICY "Public can read votes" ON qa_votes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can vote' AND tablename = 'qa_votes') THEN
    CREATE POLICY "Authenticated can vote" ON qa_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can change own votes' AND tablename = 'qa_votes') THEN
    CREATE POLICY "Users can change own votes" ON qa_votes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── Function to update vote counts ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.question_id IS NOT NULL THEN
      UPDATE legal_questions SET vote_count = vote_count + (CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END)
      WHERE id = NEW.question_id;
    END IF;
    IF NEW.answer_id IS NOT NULL THEN
      UPDATE legal_answers SET upvotes = upvotes + (CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END)
      WHERE id = NEW.answer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.question_id IS NOT NULL THEN
      UPDATE legal_questions SET vote_count = vote_count - (CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE -1 END)
      WHERE id = OLD.question_id;
    END IF;
    IF OLD.answer_id IS NOT NULL THEN
      UPDATE legal_answers SET upvotes = upvotes - (CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE -1 END)
      WHERE id = OLD.answer_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vote_counts ON qa_votes;
CREATE TRIGGER trg_vote_counts
  AFTER INSERT OR DELETE ON qa_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_counts();
