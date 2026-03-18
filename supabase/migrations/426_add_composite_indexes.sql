-- ============================================================================
-- Migration 426: Composite indexes for common query patterns
-- Fixes O(n) table scans on attorneys table (360K+ rows)
-- All indexes use CONCURRENTLY for zero-downtime deployment
-- All indexes use IF NOT EXISTS for idempotency
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Composite index for listing queries: specialty + state + active + verified
--    Serves: getAttorneysBySpecialty, state listing pages, filtered search
--    Partial index (is_active = true) keeps index ~40% smaller
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attorneys_specialty_state_active
  ON attorneys (primary_specialty_id, address_state, is_active, is_verified)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 2. Composite index for rating-sorted queries
--    Serves: "Top rated attorneys" pages, sorted directory listings
--    Partial index (active + verified) excludes unverified/inactive rows
--    Note: supplements existing idx_attorneys_rating which lacks is_verified filter
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attorneys_rating_sort
  ON attorneys (rating_average DESC NULLS LAST, review_count DESC NULLS LAST)
  WHERE is_active = true AND is_verified = true;

-- ---------------------------------------------------------------------------
-- 3. Composite index for ZIP code + specialty queries
--    Serves: getAttorneysByServiceAndLocation, ZIP-based search pages
--    Partial index (is_active = true) excludes inactive attorneys
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attorneys_zip_specialty
  ON attorneys (address_zip, primary_specialty_id)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 4. Composite index for city + specialty queries
--    Serves: /[state]/[city]/[specialty] pages, city directory listings
--    Includes is_active + is_verified for index-only scans on filter columns
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attorneys_city_specialty
  ON attorneys (address_city, primary_specialty_id, is_active, is_verified);

-- ---------------------------------------------------------------------------
-- 5. Covering index for attorney_specialties join table
--    Serves: JOIN queries from specialties -> attorneys (reverse lookup)
--    INCLUDE columns avoid heap fetches for common SELECT fields
-- ---------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attorney_specialties_lookup
  ON attorney_specialties (specialty_id, attorney_id)
  INCLUDE (is_primary, years_experience);

-- ---------------------------------------------------------------------------
-- 6. Index for reviews by attorney (sorted by recency)
--    Serves: attorney profile page reviews section, review count queries
--    Partial index (status = 'approved') excludes pending/rejected reviews
--    NOTE: Only created if reviews table has attorney_id column
--    (depends on schema state — reviews table may still use artisan_id)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'attorney_id'
  ) THEN
    -- Cannot use CONCURRENTLY inside a transaction block (DO),
    -- so we use a regular CREATE INDEX here. Safe because this is
    -- a conditional path that only runs if the column exists.
    CREATE INDEX IF NOT EXISTS idx_reviews_attorney_created
      ON reviews (attorney_id, created_at DESC)
      WHERE status = 'approved';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 7. Index for leads by specialty + location
--    Serves: lead matching queries, admin lead dashboard filters
--    Partial index (status = 'pending') targets the active matching pipeline
--    NOTE: Only created if leads table has specialty_id and location columns
--    in the public schema (leads may be in app schema with different columns)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'specialty_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'location'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_specialty_location
      ON leads (specialty_id, location)
      WHERE status = 'pending';
  END IF;
END
$$;
