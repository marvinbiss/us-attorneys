-- ============================================================================
-- Migration 423: Fix P0-5 — Bookings RLS: require auth + enforce client_id
-- ============================================================================
-- PROBLEM:
--   Multiple overlapping INSERT policies on bookings from migrations 101, 404, 405:
--   - Migration 101: "Clients can create bookings" WITH CHECK (TRUE) — PUBLIC INSERT
--   - Migration 404: "Public can create bookings" WITH CHECK (true) — PUBLIC INSERT
--   - Migration 405: "Authenticated users create bookings" WITH CHECK (auth.role() = 'authenticated')
--     ^ This was a partial fix but:
--       (a) it did NOT drop the 101 policy "Clients can create bookings" WITH CHECK (TRUE)
--       (b) it did NOT enforce client_id = auth.uid(), so any authenticated user
--           could impersonate another user by setting a different client_id
--
-- FIX:
--   1. Drop ALL existing INSERT policies on bookings
--   2. Create a single INSERT policy requiring auth AND client_id = auth.uid()
--   3. Tighten UPDATE policies to prevent status manipulation
--   4. Ensure SELECT policies are properly scoped (they already are)
-- ============================================================================

-- ============================================================================
-- 1. DROP all existing INSERT policies (defensive — covers every migration)
-- ============================================================================
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users create bookings" ON bookings;

-- ============================================================================
-- 2. CREATE new INSERT policy: authenticated + client_id must match auth.uid()
-- ============================================================================
-- This ensures:
--   (a) Anonymous/unauthenticated users cannot insert (prevents spam/fraud)
--   (b) Authenticated users can only create bookings for themselves
--       (prevents impersonation — a user cannot set client_id to someone else's ID)
-- Note: service_role (used by API routes with createAdminClient) bypasses RLS entirely,
--       so server-side booking creation is unaffected.
CREATE POLICY "Authenticated users create own bookings" ON bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND client_id = auth.uid()
  );

-- ============================================================================
-- 3. TIGHTEN UPDATE policies
-- ============================================================================
-- Migration 405 added UPDATE policies but without WITH CHECK on the client side,
-- which could allow a client to reassign their booking to another client_id.
-- Drop and recreate with proper WITH CHECK constraints.

DROP POLICY IF EXISTS "Clients update own bookings" ON bookings;
DROP POLICY IF EXISTS "Attorneys update own bookings" ON bookings;
DROP POLICY IF EXISTS "Participants can update bookings" ON bookings;

-- Clients can only update their own bookings and cannot change client_id
CREATE POLICY "Clients update own bookings" ON bookings
  FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Attorneys can update bookings assigned to them (status, room URL, notes, etc.)
-- and cannot reassign the booking to a different attorney
CREATE POLICY "Attorneys update own bookings" ON bookings
  FOR UPDATE
  USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()))
  WITH CHECK (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()));

-- ============================================================================
-- 4. SELECT policies — verify they are properly scoped (no changes needed)
-- ============================================================================
-- Migration 404 created:
--   "Attorneys see own bookings" — USING (attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid()))
--   "Clients see own bookings" — USING (client_id = auth.uid())
-- Migration 101 created:
--   "Clients can view own bookings" — USING (client_id = auth.uid() OR client_email = ...)
--   "Artisans can view their bookings" — USING (artisan_id = auth.uid())  [legacy column]
--   "Admins can manage bookings" — FOR ALL USING (is_admin())
-- All SELECT policies are properly scoped — no fix needed.

-- ============================================================================
-- 5. DELETE policy — ensure none exists (bookings should never be deleted,
--    only cancelled via status UPDATE)
-- ============================================================================
-- No DELETE policy exists — this is correct by design.
-- Cancellation is handled by updating status to 'cancelled'.
