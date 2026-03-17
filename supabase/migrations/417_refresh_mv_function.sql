-- ============================================================================
-- Migration 407: RPC function to refresh mv_attorney_stats
-- Called by /api/cron/data-refresh
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_mv_attorney_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_attorney_stats;
END;
$$;
