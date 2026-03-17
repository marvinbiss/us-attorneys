-- ============================================================================
-- Migration 404: Video Booking System
-- Tables for video consultation bookings, attorney availability, blocked dates
-- ============================================================================

-- ============================================================================
-- 1. BOOKINGS TABLE (video consultations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  specialty_id UUID REFERENCES specialties(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  daily_room_url TEXT,
  daily_room_name TEXT,
  stripe_payment_intent_id TEXT,
  booking_fee NUMERIC(10,2) NOT NULL DEFAULT 19.00,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  notes TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookings_attorney ON bookings(attorney_id);
CREATE INDEX idx_bookings_client ON bookings(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_bookings_status ON bookings(status) WHERE status IN ('pending', 'confirmed');
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_reminder ON bookings(scheduled_at) WHERE status = 'confirmed' AND reminder_sent = false;
CREATE INDEX idx_bookings_stripe ON bookings(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attorneys see own bookings" ON bookings FOR SELECT
  USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
CREATE POLICY "Clients see own bookings" ON bookings FOR SELECT
  USING (client_id = auth.uid());
CREATE POLICY "Public can create bookings" ON bookings FOR INSERT
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_bookings_updated_at();

-- ============================================================================
-- 2. ATTORNEY AVAILABILITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorney_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, day_of_week, start_time)
);

CREATE INDEX idx_attorney_availability_attorney ON attorney_availability(attorney_id) WHERE is_active = true;

ALTER TABLE attorney_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read availability" ON attorney_availability FOR SELECT USING (true);
CREATE POLICY "Attorneys manage own availability" ON attorney_availability FOR ALL
  USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));

-- ============================================================================
-- 3. BLOCKED DATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS attorney_bookings_blocked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, blocked_date)
);

CREATE INDEX idx_blocked_attorney ON attorney_bookings_blocked(attorney_id);

ALTER TABLE attorney_bookings_blocked ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blocked dates" ON attorney_bookings_blocked FOR SELECT USING (true);
CREATE POLICY "Attorneys manage own blocked" ON attorney_bookings_blocked FOR ALL
  USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));
