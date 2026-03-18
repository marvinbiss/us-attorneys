-- Migration 443: Unified Notification Center
-- Extends the notifications table (created in 107) with new types, expiration,
-- and activity-feed support. Adds auto-cleanup for old notifications.

-- ============================================================
-- 1. Add new columns to notifications table
-- ============================================================

-- Add body column (alias for message, used by new notification center)
-- Keep "message" for backward compat; "body" is the canonical field going forward.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;

-- Backfill body from message for existing rows
UPDATE notifications SET body = message WHERE body IS NULL;

-- Add read_at timestamp (nullable = unread, set = read)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Backfill read_at from read boolean
UPDATE notifications SET read_at = created_at WHERE read = TRUE AND read_at IS NULL;

-- Add expires_at for auto-expiring notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add data JSONB for structured payload (links, entity IDs, etc.)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';

-- Backfill data from metadata for existing rows
UPDATE notifications SET data = metadata WHERE metadata != '{}' AND data = '{}';

-- ============================================================
-- 2. Expand notification types via new CHECK constraint
-- ============================================================

-- Drop old CHECK constraint on type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add expanded CHECK with all unified notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  -- Original types (backward compat)
  'lead_created', 'lead_dispatched', 'lead_viewed',
  'quote_received', 'lead_closed', 'system',
  -- New unified types
  'booking_confirmed', 'booking_reminder', 'booking_cancelled',
  'booking_rescheduled',
  'new_message',
  'new_lead',
  'review_received', 'review_request',
  'payment_success', 'payment_failed',
  'deadline_reminder',
  'profile_view',
  'claim_approved', 'claim_rejected'
));

-- ============================================================
-- 3. Improved indexes for the notification center
-- ============================================================

-- Composite index for fetching user notifications (read status + chronological)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications(user_id, read_at NULLS FIRST, created_at DESC);

-- Index for auto-cleanup of expired notifications
CREATE INDEX IF NOT EXISTS idx_notifications_expires
  ON notifications(expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================================================
-- 4. Auto-cleanup: delete notifications older than 90 days
--    (to be called by a cron job or pg_cron)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired notifications
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete notifications older than 90 days
  DELETE FROM notifications
  WHERE created_at < now() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Removes expired and 90-day-old notifications. Call via cron.';

-- ============================================================
-- 5. RLS policy for DELETE (users can delete their own)
-- ============================================================

DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
CREATE POLICY "Users delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 6. Comments
-- ============================================================
COMMENT ON COLUMN notifications.body IS 'Notification body text (canonical field, replaces message)';
COMMENT ON COLUMN notifications.read_at IS 'When the notification was read (NULL = unread)';
COMMENT ON COLUMN notifications.expires_at IS 'Auto-expiration timestamp (NULL = never expires)';
COMMENT ON COLUMN notifications.data IS 'Structured payload: links, entity IDs, action data';
