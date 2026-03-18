-- =============================================================================
-- Migration 432: Data Retention Policy
-- US Attorneys — 2026-03-18
-- =============================================================================
-- Implements automated data retention to comply with data minimization principles:
--   - audit_logs: 90 days retention
--   - analytics_events: 6 months retention
--   - Deleted user data: anonymized after 30-day GDPR grace period
--
-- The retention_cleanup() function is called monthly via a Vercel cron job.
-- =============================================================================

-- Data Retention Policy:
-- +-----------------------+------------+----------------------------------------+
-- | Data Category         | Retention  | Action                                 |
-- +-----------------------+------------+----------------------------------------+
-- | audit_logs            | 90 days    | Hard delete                            |
-- | analytics_events      | 6 months   | Hard delete                            |
-- | security_logs         | 90 days    | Hard delete                            |
-- | Deleted user profiles | 30 days    | Anonymize PII (GDPR grace period)      |
-- | deletion_requests     | 90 days    | Hard delete completed/cancelled        |
-- +-----------------------+------------+----------------------------------------+

CREATE OR REPLACE FUNCTION retention_cleanup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_deleted BIGINT := 0;
  v_analytics_deleted BIGINT := 0;
  v_security_deleted BIGINT := 0;
  v_profiles_anonymized BIGINT := 0;
  v_deletion_requests_deleted BIGINT := 0;
  v_start TIMESTAMPTZ := clock_timestamp();
BEGIN
  -- 1. Delete audit_logs older than 90 days
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;

  -- 2. Delete analytics_events older than 6 months
  DELETE FROM analytics_events
  WHERE created_at < NOW() - INTERVAL '6 months';
  GET DIAGNOSTICS v_analytics_deleted = ROW_COUNT;

  -- 3. Delete security_logs older than 90 days
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'security_logs'
  ) THEN
    DELETE FROM security_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_security_deleted = ROW_COUNT;
  END IF;

  -- 4. Anonymize deleted user data after 30-day GDPR grace period
  --    Users who have completed deletion requests older than 30 days
  --    get their PII wiped from profiles (but the row is kept for FK integrity).
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'deletion_requests'
  ) THEN
    UPDATE profiles p
    SET
      full_name = 'Deleted User',
      email = 'deleted-' || p.id || '@redacted.local',
      phone = NULL,
      avatar_url = NULL,
      address = NULL,
      updated_at = NOW()
    FROM deletion_requests dr
    WHERE dr.user_id = p.id
      AND dr.status = 'completed'
      AND dr.scheduled_deletion_at < NOW() - INTERVAL '30 days'
      AND p.full_name != 'Deleted User';  -- Idempotent: skip already anonymized
    GET DIAGNOSTICS v_profiles_anonymized = ROW_COUNT;

    -- 5. Clean up old completed/cancelled deletion requests (90 days)
    DELETE FROM deletion_requests
    WHERE status IN ('completed', 'cancelled')
      AND created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_deletion_requests_deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'audit_logs_deleted', v_audit_deleted,
    'analytics_events_deleted', v_analytics_deleted,
    'security_logs_deleted', v_security_deleted,
    'profiles_anonymized', v_profiles_anonymized,
    'deletion_requests_deleted', v_deletion_requests_deleted,
    'duration_ms', EXTRACT(MILLISECOND FROM clock_timestamp() - v_start)::int
  );
END;
$$;

COMMENT ON FUNCTION retention_cleanup() IS
  'Monthly data retention cleanup. Deletes audit_logs (>90d), analytics_events (>6mo), security_logs (>90d), anonymizes GDPR-deleted users (>30d grace), cleans old deletion_requests (>90d). Called via /api/cron/data-retention.';
