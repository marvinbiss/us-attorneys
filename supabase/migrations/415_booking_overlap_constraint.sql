-- P0.7: Prevent double-booking at database level
-- Uses a plpgsql function for atomic overlap prevention (defense-in-depth)

-- Create extension if not exists (needed for exclusion constraints)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add a function to check booking overlap
CREATE OR REPLACE FUNCTION check_booking_overlap(
  p_attorney_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_duration_minutes INTEGER,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE attorney_id = p_attorney_id
      AND status NOT IN ('cancelled', 'no_show')
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND scheduled_at < (p_scheduled_at + (p_duration_minutes || ' minutes')::interval)
      AND (scheduled_at + (COALESCE(duration_minutes, 30) || ' minutes')::interval) > p_scheduled_at
  );
END;
$$ LANGUAGE plpgsql;
