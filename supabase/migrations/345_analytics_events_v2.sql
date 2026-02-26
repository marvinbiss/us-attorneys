-- Migration 345: Recreate analytics_events for profile/phone tracking
-- Original table was dropped in migration 100.
-- 2026-02-26

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    session_id TEXT,
    source TEXT,
    metadata JSONB DEFAULT '{}',
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for dashboard queries (provider + event type + time range)
CREATE INDEX IF NOT EXISTS idx_analytics_events_provider_type
    ON analytics_events(provider_id, event_type, created_at DESC);

-- Index for global event queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
    ON analytics_events(event_type, created_at DESC);

-- RLS: deny all for anon/authenticated; service_role bypasses automatically
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
