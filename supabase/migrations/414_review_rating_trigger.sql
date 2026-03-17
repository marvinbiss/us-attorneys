-- P0.6: Atomic review rating aggregation trigger
-- Prevents race conditions when concurrent reviews are submitted
-- Replaces stale rating_average and review_count on attorneys table

-- Function to recalculate attorney rating stats
CREATE OR REPLACE FUNCTION update_attorney_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_attorney_id UUID;
BEGIN
  -- Determine which attorney_id to recalculate
  IF TG_OP = 'DELETE' THEN
    target_attorney_id := OLD.attorney_id;
  ELSE
    target_attorney_id := NEW.attorney_id;
  END IF;

  -- Atomic update using subquery (no race condition)
  UPDATE attorneys
  SET
    rating_average = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 2)
       FROM reviews
       WHERE attorney_id = target_attorney_id
         AND status = 'published'),
      0
    ),
    review_count = COALESCE(
      (SELECT COUNT(*)
       FROM reviews
       WHERE attorney_id = target_attorney_id
         AND status = 'published'),
      0
    )
  WHERE id = target_attorney_id;

  -- Also handle the old attorney if attorney_id changed on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.attorney_id != NEW.attorney_id THEN
    UPDATE attorneys
    SET
      rating_average = COALESCE(
        (SELECT ROUND(AVG(rating)::numeric, 2)
         FROM reviews
         WHERE attorney_id = OLD.attorney_id
           AND status = 'published'),
        0
      ),
      review_count = COALESCE(
        (SELECT COUNT(*)
         FROM reviews
         WHERE attorney_id = OLD.attorney_id
           AND status = 'published'),
        0
      )
    WHERE id = OLD.attorney_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_update_attorney_rating ON reviews;

-- Create trigger on reviews table
CREATE TRIGGER trg_update_attorney_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_attorney_rating_stats();

-- Also fire when review status changes (e.g., pending → published)
-- This is already covered by the UPDATE trigger above since status is a column on reviews
