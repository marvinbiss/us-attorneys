-- Migration 433: Structured reviews with composite scoring (Doctolib pattern)
-- Rate on 3 axes: communication, result, responsiveness
-- Overall rating becomes the computed average of the 3 sub-ratings

-- 1. Add structured rating columns to reviews table
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS rating_communication SMALLINT,
  ADD COLUMN IF NOT EXISTS rating_result SMALLINT,
  ADD COLUMN IF NOT EXISTS rating_responsiveness SMALLINT;

-- 2. CHECK constraints (1-5 range for each axis)
-- Use DO block to avoid errors if constraints already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_communication_range'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT chk_rating_communication_range
      CHECK (rating_communication IS NULL OR (rating_communication >= 1 AND rating_communication <= 5));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_result_range'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT chk_rating_result_range
      CHECK (rating_result IS NULL OR (rating_result >= 1 AND rating_result <= 5));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rating_responsiveness_range'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT chk_rating_responsiveness_range
      CHECK (rating_responsiveness IS NULL OR (rating_responsiveness >= 1 AND rating_responsiveness <= 5));
  END IF;
END $$;

-- 3. Composite index on (attorney_id, status) for efficient queries on attorney profile pages
--    Only create if attorney_id column exists (schema may still use artisan_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'attorney_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_attorney_status
      ON reviews (attorney_id, status);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'artisan_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_artisan_status
      ON reviews (artisan_id, status);
  END IF;
END $$;

-- 4. Trigger to auto-compute overall rating from sub-ratings on INSERT/UPDATE
--    If all 3 sub-ratings are provided, rating = ROUND(AVG(sub-ratings))
--    Otherwise, keep the manually provided rating
CREATE OR REPLACE FUNCTION compute_review_composite_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating_communication IS NOT NULL
     AND NEW.rating_result IS NOT NULL
     AND NEW.rating_responsiveness IS NOT NULL
  THEN
    NEW.rating := ROUND(
      (NEW.rating_communication + NEW.rating_result + NEW.rating_responsiveness)::numeric / 3
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_composite_rating ON reviews;

CREATE TRIGGER trg_compute_composite_rating
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION compute_review_composite_rating();

-- 5. Backfill: for existing reviews that only have an overall rating,
--    set all 3 sub-ratings equal to the overall rating
--    (This preserves existing data and ensures consistent display)
UPDATE reviews
SET
  rating_communication = rating,
  rating_result = rating,
  rating_responsiveness = rating
WHERE rating IS NOT NULL
  AND rating_communication IS NULL
  AND rating_result IS NULL
  AND rating_responsiveness IS NULL;
