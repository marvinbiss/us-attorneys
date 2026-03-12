-- Voice Qualification System for ServicesArtisans
-- ElevenLabs + Vapi.ai + Claude API vocal lead qualification

-- 1. Add 'voice' to prospection_conversations channel CHECK
ALTER TABLE prospection_conversations
  DROP CONSTRAINT IF EXISTS prospection_conversations_channel_check;
ALTER TABLE prospection_conversations
  ADD CONSTRAINT prospection_conversations_channel_check
  CHECK (channel IN ('email','sms','whatsapp','voice'));

-- 2. Voice calls table
CREATE TABLE IF NOT EXISTS public.voice_calls (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES prospection_conversations(id) ON DELETE SET NULL,
  contact_id      uuid REFERENCES prospection_contacts(id) ON DELETE SET NULL,
  lead_id         uuid,
  vapi_call_id    text UNIQUE NOT NULL,
  twilio_call_sid text,
  caller_phone    text NOT NULL,
  direction       text NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound','outbound')),
  status          text NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress','completed','failed','no_answer','voicemail')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  duration_seconds integer,
  recording_url   text,
  transcription   text,
  summary         text,
  qualification_score text CHECK (qualification_score IN ('A','B','C','disqualified')),
  qualification_data  jsonb DEFAULT '{}'::jsonb,
  vapi_cost       numeric(8,4) DEFAULT 0,
  consent_recording boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_calls_contact ON voice_calls(contact_id);
CREATE INDEX idx_voice_calls_vapi ON voice_calls(vapi_call_id);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_calls_score ON voice_calls(qualification_score) WHERE qualification_score IS NOT NULL;
CREATE INDEX idx_voice_calls_created ON voice_calls(created_at DESC);

-- 3. Lead pricing per vertical
CREATE TABLE IF NOT EXISTS public.voice_lead_pricing (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical    text NOT NULL UNIQUE CHECK (vertical IN ('pac','toiture','isolation')),
  price_a     numeric(8,2) NOT NULL DEFAULT 150,
  price_b     numeric(8,2) NOT NULL DEFAULT 100,
  price_c     numeric(8,2) NOT NULL DEFAULT 50,
  is_active   boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO voice_lead_pricing (vertical, price_a, price_b, price_c) VALUES
  ('pac', 150, 100, 50),
  ('toiture', 120, 80, 40),
  ('isolation', 130, 90, 45);

-- 4. Daily stats aggregation
CREATE TABLE IF NOT EXISTS public.voice_stats_daily (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                date NOT NULL UNIQUE,
  total_calls         integer DEFAULT 0,
  completed_calls     integer DEFAULT 0,
  avg_duration_seconds integer DEFAULT 0,
  qualified_a         integer DEFAULT 0,
  qualified_b         integer DEFAULT 0,
  qualified_c         integer DEFAULT 0,
  disqualified        integer DEFAULT 0,
  leads_created       integer DEFAULT 0,
  leads_dispatched    integer DEFAULT 0,
  total_revenue       numeric(10,2) DEFAULT 0,
  total_vapi_cost     numeric(10,2) DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS policies
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_lead_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_stats_daily ENABLE ROW LEVEL SECURITY;

-- Admin-only access (service_role bypasses RLS)
CREATE POLICY "voice_calls_admin" ON voice_calls FOR ALL USING (false);
CREATE POLICY "voice_lead_pricing_admin" ON voice_lead_pricing FOR ALL USING (false);
CREATE POLICY "voice_stats_daily_admin" ON voice_stats_daily FOR ALL USING (false);
