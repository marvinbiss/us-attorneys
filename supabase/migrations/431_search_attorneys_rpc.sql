-- ============================================================================
-- search_attorneys_v1: Combined full-text search + geo-radius + filters
-- Uses the existing search_vector tsvector (GIN-indexed) and geo GEOGRAPHY(POINT)
-- Returns rows + total_count for pagination
-- ============================================================================

CREATE OR REPLACE FUNCTION search_attorneys_v1(
  search_query TEXT DEFAULT NULL,
  filter_specialty_ids UUID[] DEFAULT NULL,
  filter_state TEXT DEFAULT NULL,
  filter_city TEXT DEFAULT NULL,
  filter_rating_min NUMERIC DEFAULT NULL,
  geo_lat DOUBLE PRECISION DEFAULT NULL,
  geo_lng DOUBLE PRECISION DEFAULT NULL,
  geo_radius_miles DOUBLE PRECISION DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  stable_id TEXT,
  name TEXT,
  slug TEXT,
  primary_specialty_id UUID,
  specialty_slug TEXT,
  specialty_name TEXT,
  address_line1 TEXT,
  address_zip TEXT,
  address_city TEXT,
  address_state CHAR(2),
  address_county TEXT,
  is_verified BOOLEAN,
  is_active BOOLEAN,
  noindex BOOLEAN,
  rating_average NUMERIC,
  review_count INTEGER,
  phone TEXT,
  bar_number TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_featured BOOLEAN,
  boost_level INTEGER,
  rank REAL,
  distance_miles DOUBLE PRECISION,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  tsq TSQUERY := NULL;
  geo_point GEOGRAPHY := NULL;
  geo_radius_meters DOUBLE PRECISION := NULL;
BEGIN
  -- Build tsquery from search text (safe: plainto_tsquery handles special chars)
  IF search_query IS NOT NULL AND LENGTH(TRIM(search_query)) >= 2 THEN
    tsq := plainto_tsquery('english', TRIM(search_query));
  END IF;

  -- Build geography point for radius search
  IF geo_lat IS NOT NULL AND geo_lng IS NOT NULL THEN
    geo_point := ST_SetSRID(ST_MakePoint(geo_lng, geo_lat), 4326)::GEOGRAPHY;
    -- Convert miles to meters (1 mile = 1609.344 meters)
    geo_radius_meters := COALESCE(geo_radius_miles, 25.0) * 1609.344;
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      a.id,
      a.stable_id,
      a.name,
      a.slug,
      a.primary_specialty_id,
      s.slug AS specialty_slug,
      s.name AS specialty_name,
      a.address_line1,
      a.address_zip,
      a.address_city,
      a.address_state,
      a.address_county,
      a.is_verified,
      a.is_active,
      a.noindex,
      a.rating_average,
      a.review_count,
      a.phone,
      a.bar_number,
      a.latitude,
      a.longitude,
      a.created_at,
      a.updated_at,
      a.is_featured,
      a.boost_level,
      -- Full-text relevance rank (0 if no text query)
      CASE
        WHEN tsq IS NOT NULL THEN ts_rank(
          a.search_vector,
          tsq,
          32 -- normalization: rank / (rank + 1)
        )
        ELSE 0.0
      END::REAL AS rank,
      -- Distance in miles (NULL if no geo query)
      CASE
        WHEN geo_point IS NOT NULL AND a.geo IS NOT NULL
        THEN ST_Distance(a.geo, geo_point) / 1609.344
        ELSE NULL
      END AS distance_miles
    FROM attorneys a
    LEFT JOIN specialties s ON s.id = a.primary_specialty_id
    WHERE
      a.is_active = TRUE
      AND a.canonical_attorney_id IS NULL
      -- Full-text filter
      AND (tsq IS NULL OR a.search_vector @@ tsq)
      -- Geo radius filter
      AND (geo_point IS NULL OR (
        a.geo IS NOT NULL
        AND ST_DWithin(a.geo, geo_point, geo_radius_meters)
      ))
      -- Specialty filter
      AND (filter_specialty_ids IS NULL OR a.primary_specialty_id = ANY(filter_specialty_ids))
      -- State filter
      AND (filter_state IS NULL OR a.address_state = filter_state)
      -- City filter (case-insensitive)
      AND (filter_city IS NULL OR LOWER(a.address_city) = LOWER(filter_city))
      -- Rating filter
      AND (filter_rating_min IS NULL OR a.rating_average >= filter_rating_min)
  ),
  counted AS (
    SELECT COUNT(*) AS cnt FROM filtered
  )
  SELECT
    f.id,
    f.stable_id,
    f.name,
    f.slug,
    f.primary_specialty_id,
    f.specialty_slug,
    f.specialty_name,
    f.address_line1,
    f.address_zip,
    f.address_city,
    f.address_state,
    f.address_county,
    f.is_verified,
    f.is_active,
    f.noindex,
    f.rating_average,
    f.review_count,
    f.phone,
    f.bar_number,
    f.latitude,
    f.longitude,
    f.created_at,
    f.updated_at,
    f.is_featured,
    f.boost_level,
    f.rank,
    f.distance_miles,
    c.cnt AS total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY
    CASE WHEN sort_by = 'relevance' THEN f.rank END DESC NULLS LAST,
    CASE WHEN sort_by = 'distance' THEN f.distance_miles END ASC NULLS LAST,
    CASE WHEN sort_by = 'rating' THEN f.rating_average END DESC NULLS LAST,
    -- Secondary sort: featured/boost/verified/name
    f.is_featured DESC NULLS LAST,
    f.boost_level DESC NULLS LAST,
    f.name ASC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION search_attorneys_v1 TO anon, authenticated;
