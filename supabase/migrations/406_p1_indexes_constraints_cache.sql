-- ============================================================================
-- Migration 406: P1 Database Fixes — Indexes & Constraints
-- P1.11: Missing index on attorney_availability lookup
-- P1.12: Missing CHECK constraints on bar_admissions, zip_codes, bookings, case_results
-- ============================================================================

-- ============================================================================
-- P1.11 — Composite index for availability lookup queries
-- Covers the common query pattern: WHERE attorney_id = ? AND day_of_week = ? AND start_time = ?
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_attorney_availability_lookup
  ON attorney_availability(attorney_id, day_of_week, start_time);

-- ============================================================================
-- P1.12 — CHECK constraints with idempotent DO blocks
-- ============================================================================

-- bar_admissions.state must be 2 uppercase letters
-- (column is "state" not "bar_state" per migration 400)
DO $$ BEGIN
  ALTER TABLE bar_admissions ADD CONSTRAINT chk_bar_state_format
    CHECK (state ~ '^[A-Z]{2}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- zip_codes.code must be exactly 5 digits
DO $$ BEGIN
  ALTER TABLE zip_codes ADD CONSTRAINT chk_zip_format
    CHECK (code ~ '^\d{5}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- bookings.booking_fee must be non-negative
-- (column is "booking_fee" not "amount" per migration 404)
DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT chk_booking_fee_positive
    CHECK (booking_fee IS NULL OR booking_fee >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- case_results.amount must be non-negative
DO $$ BEGIN
  ALTER TABLE case_results ADD CONSTRAINT chk_case_amount_positive
    CHECK (amount IS NULL OR amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
