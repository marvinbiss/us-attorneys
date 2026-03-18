-- ============================================================================
-- Migration 425: Non-concurrent refresh RPC for mv_attorney_stats
-- Fallback used by /api/cron/refresh-mv when CONCURRENTLY fails
-- (e.g., if unique index is missing or being rebuilt)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_mv_attorney_stats_standard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_attorney_stats;
END;
$$;
