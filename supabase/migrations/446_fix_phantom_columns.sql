-- ============================================================================
-- Migration 446: Fix Phantom Columns
-- Adds missing columns/tables referenced by application code
-- ============================================================================

-- Add attorney_id to reviews (US attorneys reference)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS attorney_id UUID REFERENCES attorneys(id);
CREATE INDEX IF NOT EXISTS idx_reviews_attorney_id ON reviews(attorney_id);

-- Add response_time_hours to attorneys
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS response_time_hours NUMERIC(6,2);

-- Add boost_level to attorneys (subscription tier: 0=free, 1=pro, 2=premium)
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS boost_level INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_attorneys_boost_level ON attorneys(boost_level DESC NULLS LAST);

-- Add is_featured to attorneys
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create client_documents table
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES attorneys(id),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON client_documents FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can insert own documents" ON client_documents FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can delete own documents" ON client_documents FOR DELETE USING (auth.uid() = client_id);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_attorney ON client_documents(attorney_id);
