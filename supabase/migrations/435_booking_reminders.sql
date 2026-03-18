-- Migration 435: Booking Reminders — push notification tracking columns
-- Replaces single reminder_sent with granular 24h/1h tracking + notification timestamp.
-- Recreates push_subscriptions table (dropped in migration 100).

-- ============================================================================
-- 1. BOOKING REMINDER COLUMNS
-- ============================================================================

-- Add granular reminder tracking (idempotent)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_1h_sent  BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- Backfill: if old reminder_sent was true, assume 24h was sent
UPDATE bookings
SET reminder_24h_sent = true
WHERE reminder_sent = true AND reminder_24h_sent = false;

-- Index for cron: find confirmed bookings needing 24h or 1h reminder
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_24h
  ON bookings (scheduled_at)
  WHERE status = 'confirmed' AND reminder_24h_sent = false;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_1h
  ON bookings (scheduled_at)
  WHERE status = 'confirmed' AND reminder_1h_sent = false;

-- ============================================================================
-- 2. PUSH SUBSCRIPTIONS TABLE (recreate — dropped in migration 100)
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Service role needs full access for cron jobs sending notifications
CREATE POLICY "Service role full access push subscriptions" ON push_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
