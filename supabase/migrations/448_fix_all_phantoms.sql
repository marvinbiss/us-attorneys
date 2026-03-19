-- ============================================================================
-- Migration 448: Fix All Phantom Columns, Tables, RPC, RLS, and Indexes
-- Comprehensive cleanup: rename legacy columns, create missing tables,
-- fix create_booking_atomic RPC, add missing RLS policies, add indexes.
-- Safe to run multiple times (idempotent with IF EXISTS / IF NOT EXISTS).
-- ============================================================================

-- ############################################################################
-- 1. RENAME LEGACY COLUMNS (provider_id -> attorney_id, artisan_id -> attorney_id)
-- ############################################################################

-- 1a. lead_assignments.provider_id -> attorney_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lead_assignments'
      AND column_name = 'provider_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lead_assignments'
      AND column_name = 'attorney_id'
  ) THEN
    ALTER TABLE lead_assignments RENAME COLUMN provider_id TO attorney_id;
    RAISE NOTICE 'Renamed lead_assignments.provider_id -> attorney_id';
  ELSE
    RAISE NOTICE 'lead_assignments: rename not needed (column missing or already renamed)';
  END IF;
END
$$;

-- 1b. lead_events.provider_id -> attorney_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lead_events'
      AND column_name = 'provider_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lead_events'
      AND column_name = 'attorney_id'
  ) THEN
    ALTER TABLE lead_events RENAME COLUMN provider_id TO attorney_id;
    RAISE NOTICE 'Renamed lead_events.provider_id -> attorney_id';
  ELSE
    RAISE NOTICE 'lead_events: rename not needed (column missing or already renamed)';
  END IF;
END
$$;

-- 1c. team_members.artisan_id -> attorney_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'team_members'
      AND column_name = 'artisan_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'team_members'
      AND column_name = 'attorney_id'
  ) THEN
    ALTER TABLE team_members RENAME COLUMN artisan_id TO attorney_id;
    RAISE NOTICE 'Renamed team_members.artisan_id -> attorney_id';
  ELSE
    RAISE NOTICE 'team_members: rename not needed (column missing or already renamed)';
  END IF;
END
$$;


-- ############################################################################
-- 2. CREATE MISSING PHANTOM TABLES
-- ############################################################################

-- 2a. availability_slots
-- Referenced by migration 019 (create_booking_atomic) but never created.
-- Provides specific date-based slots (complementary to attorney_availability
-- which is recurring weekly patterns).
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, date, start_time)
);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Public can read availability to display open slots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'availability_slots' AND policyname = 'Public read availability_slots'
  ) THEN
    CREATE POLICY "Public read availability_slots" ON availability_slots
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Attorneys can manage their own slots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'availability_slots' AND policyname = 'Attorneys manage own slots'
  ) THEN
    CREATE POLICY "Attorneys manage own slots" ON availability_slots
      FOR ALL USING (
        attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      );
  END IF;
END
$$;

COMMENT ON TABLE availability_slots IS 'Specific date-based availability slots for attorneys. Complements attorney_availability (recurring weekly).';

-- 2b. platform_settings
-- Key-value store for admin-configurable platform settings.
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (feature flags, site config)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'platform_settings' AND policyname = 'Public read platform_settings'
  ) THEN
    CREATE POLICY "Public read platform_settings" ON platform_settings
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Only admins can modify settings (enforced via service_role in API)
-- No INSERT/UPDATE/DELETE policy for regular users by design.

COMMENT ON TABLE platform_settings IS 'Admin-configurable key-value platform settings. Managed via service_role (admin API).';

-- 2c. access_logs
-- Migration 106 created indexes on this table but never created the table itself.
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT,
  resource TEXT,
  path TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read access logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'access_logs' AND policyname = 'Admins read access_logs'
  ) THEN
    CREATE POLICY "Admins read access_logs" ON access_logs
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END
$$;

-- Service role inserts logs (no INSERT policy needed for users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'access_logs' AND policyname = 'Service insert access_logs'
  ) THEN
    CREATE POLICY "Service insert access_logs" ON access_logs
      FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

COMMENT ON TABLE access_logs IS 'Page/action access tracking for audit and analytics.';

-- Recreate indexes that migration 106 tried to create on the non-existent table
CREATE INDEX IF NOT EXISTS idx_access_logs_path ON access_logs(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;


-- ############################################################################
-- 3. FIX RPC create_booking_atomic
-- The old function (migration 019) uses artisan_id, slot_id, and columns that
-- don't match the bookings table from migration 404/446.
-- Recreate to match actual schema: attorney_id, scheduled_at, etc.
-- ############################################################################

DROP FUNCTION IF EXISTS create_booking_atomic(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_attorney_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT DEFAULT NULL,
  p_specialty_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 30,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_booking_fee NUMERIC DEFAULT 19.00
) RETURNS JSON AS $$
DECLARE
  v_booking_id UUID;
  v_existing RECORD;
  v_slot_key TEXT;
BEGIN
  -- Build a unique key for the attorney + timeslot to prevent race conditions
  v_slot_key := p_attorney_id::text || '::' || p_scheduled_at::text;
  PERFORM pg_advisory_xact_lock(hashtext(v_slot_key));

  -- Check for existing confirmed/pending booking at same time for same attorney
  SELECT id INTO v_existing
  FROM bookings
  WHERE attorney_id = p_attorney_id
    AND scheduled_at = p_scheduled_at
    AND status IN ('confirmed', 'pending')
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SLOT_UNAVAILABLE',
      'message', 'This time slot is no longer available'
    );
  END IF;

  -- Check for duplicate booking by same client at same time
  SELECT id INTO v_existing
  FROM bookings
  WHERE attorney_id = p_attorney_id
    AND scheduled_at = p_scheduled_at
    AND LOWER(client_email) = LOWER(p_client_email)
    AND status IN ('confirmed', 'pending')
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DUPLICATE_BOOKING',
      'message', 'You already have a booking for this time slot'
    );
  END IF;

  -- Create the booking
  INSERT INTO bookings (
    attorney_id,
    scheduled_at,
    duration_minutes,
    client_name,
    client_email,
    client_phone,
    specialty_id,
    notes,
    stripe_payment_intent_id,
    booking_fee,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_attorney_id,
    p_scheduled_at,
    p_duration_minutes,
    p_client_name,
    LOWER(p_client_email),
    p_client_phone,
    p_specialty_id,
    p_notes,
    p_stripe_payment_intent_id,
    p_booking_fee,
    'confirmed',
    now(),
    now()
  )
  RETURNING id INTO v_booking_id;

  -- If there's a matching availability_slot, mark it unavailable
  UPDATE availability_slots
  SET is_available = false
  WHERE attorney_id = p_attorney_id
    AND date = (p_scheduled_at AT TIME ZONE 'UTC')::date
    AND start_time = (p_scheduled_at AT TIME ZONE 'UTC')::time
    AND is_available = true;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'scheduled_at', p_scheduled_at,
    'attorney_id', p_attorney_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_booking_atomic IS 'Atomic booking creation with advisory lock to prevent double-booking. Matches migration 404 bookings schema.';


-- ############################################################################
-- 4. ADD MISSING RLS POLICIES
-- ############################################################################

-- 4a. Bookings: UPDATE policy for attorneys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Attorneys update own bookings'
  ) THEN
    CREATE POLICY "Attorneys update own bookings" ON bookings
      FOR UPDATE USING (
        attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      );
    RAISE NOTICE 'Created: Attorneys update own bookings policy';
  END IF;
END
$$;

-- 4b. Bookings: UPDATE policy for clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Clients update own bookings'
  ) THEN
    CREATE POLICY "Clients update own bookings" ON bookings
      FOR UPDATE USING (client_id = auth.uid());
    RAISE NOTICE 'Created: Clients update own bookings policy';
  END IF;
END
$$;

-- 4c. Bookings: DELETE policy for attorneys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Attorneys delete own bookings'
  ) THEN
    CREATE POLICY "Attorneys delete own bookings" ON bookings
      FOR DELETE USING (
        attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      );
    RAISE NOTICE 'Created: Attorneys delete own bookings policy';
  END IF;
END
$$;

-- 4d. Bookings: DELETE policy for clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Clients delete own bookings'
  ) THEN
    CREATE POLICY "Clients delete own bookings" ON bookings
      FOR DELETE USING (client_id = auth.uid());
    RAISE NOTICE 'Created: Clients delete own bookings policy';
  END IF;
END
$$;

-- 4e. Leads: UPDATE policy (assigned attorney or admin)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'Attorneys update assigned leads'
  ) THEN
    CREATE POLICY "Attorneys update assigned leads" ON leads
      FOR UPDATE USING (
        assigned_attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      );
    RAISE NOTICE 'Created: Attorneys update assigned leads policy';
  END IF;
END
$$;

-- 4f. Leads: SELECT policy for assigned attorneys
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'Attorneys view assigned leads'
  ) THEN
    CREATE POLICY "Attorneys view assigned leads" ON leads
      FOR SELECT USING (
        assigned_attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      );
    RAISE NOTICE 'Created: Attorneys view assigned leads policy';
  END IF;
END
$$;

-- 4g. Conversations: UPDATE policy for participants (migration 441 already has this,
--     but migration 005 may have created the table first without it)
-- Already covered by migration 441 "conversations_update_participant" — skip if exists.

-- 4h. Messages: UPDATE policy for participants
-- Already covered by migration 441 "messages_update_own" — skip if exists.


-- ############################################################################
-- 5. ADD MISSING COMPOSITE INDEXES
-- ############################################################################

-- 5a. bookings(attorney_id, scheduled_at DESC) — without partial filter
--     Migration 447 has a partial version; this covers all statuses
CREATE INDEX IF NOT EXISTS idx_bookings_attorney_scheduled_all
  ON bookings (attorney_id, scheduled_at DESC);

-- 5b. reviews(attorney_id, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_reviews_attorney_created
  ON reviews (attorney_id, created_at DESC);

-- 5c. availability_slots(attorney_id, date)
CREATE INDEX IF NOT EXISTS idx_availability_slots_attorney_date
  ON availability_slots (attorney_id, date);

-- 5d. attorney_availability(attorney_id, day_of_week) WHERE is_active = true
--     Migration 406 has idx_attorney_availability_lookup on (attorney_id, day_of_week, start_time);
--     this is a more targeted partial index for active-only lookups.
CREATE INDEX IF NOT EXISTS idx_attorney_availability_active_day
  ON attorney_availability (attorney_id, day_of_week)
  WHERE is_active = true;


-- ============================================================================
-- Done. Migration 448 complete.
-- ============================================================================
