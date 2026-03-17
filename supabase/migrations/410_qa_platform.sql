-- Migration 410: Q&A Platform ("Ask a Lawyer")
-- Enables user-generated legal questions answered by verified attorneys
-- Target: +500K-2M UGC pages for SEO

CREATE TABLE IF NOT EXISTS legal_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  specialty_id UUID REFERENCES specialties(id),
  state_code CHAR(2),
  city TEXT,
  asked_by UUID REFERENCES profiles(id),
  asked_by_name TEXT DEFAULT 'Anonymous',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed', 'flagged')),
  view_count INTEGER DEFAULT 0,
  answer_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES legal_questions(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES attorneys(id),
  body TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_questions_specialty ON legal_questions(specialty_id, status);
CREATE INDEX idx_questions_state ON legal_questions(state_code, status);
CREATE INDEX idx_questions_slug ON legal_questions(slug);
CREATE INDEX idx_answers_question ON legal_answers(question_id, created_at);
CREATE INDEX idx_answers_attorney ON legal_answers(attorney_id);

-- RLS
ALTER TABLE legal_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read questions" ON legal_questions FOR SELECT USING (status != 'flagged');
CREATE POLICY "Authenticated can ask" ON legal_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors update own" ON legal_questions FOR UPDATE USING (asked_by = auth.uid());

CREATE POLICY "Public can read answers" ON legal_answers FOR SELECT USING (true);
CREATE POLICY "Attorneys can answer" ON legal_answers FOR INSERT WITH CHECK (
  attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
);
CREATE POLICY "Attorneys update own answers" ON legal_answers FOR UPDATE USING (
  attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
);
