-- ============================================================================
-- Migration 408: Featured/Boost Listings
-- P2.18: Allows attorneys to be featured and boosted in search results
-- ============================================================================

-- ============================================================================
-- 1. Add featured/boost columns to attorneys
-- ============================================================================
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS boost_level INTEGER DEFAULT 0;

-- ============================================================================
-- 2. Partial index for featured attorney queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_attorneys_featured
  ON attorneys(is_featured, boost_level DESC)
  WHERE is_featured = true;
