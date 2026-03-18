-- Migration 434: Push Subscriptions table for Web Push Notifications
-- Stores browser PushSubscription objects per user for VAPID-based push.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One subscription endpoint per user (browser re-subscribes may update keys)
  CONSTRAINT uq_push_subscriptions_user_endpoint UNIQUE (user_id, endpoint)
);

-- Fast lookup by user_id (most common query pattern)
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions (user_id);

-- Cleanup stale subscriptions (> 90 days unused)
CREATE INDEX idx_push_subscriptions_last_used ON push_subscriptions (last_used_at);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can create own push subscriptions"
  ON push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions (key rotation)
CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own subscriptions (unsubscribe)
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE push_subscriptions IS 'Browser push notification subscriptions (Web Push / VAPID)';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service URL (e.g., fcm.googleapis.com/...)';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Client public key for payload encryption (base64url)';
COMMENT ON COLUMN push_subscriptions.auth IS 'Shared authentication secret (base64url)';
COMMENT ON COLUMN push_subscriptions.last_used_at IS 'Last time a notification was successfully sent to this subscription';
