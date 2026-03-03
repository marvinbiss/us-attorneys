-- Migration 346: Add visitor tracking to analytics_events
-- 2026-03-03
-- Enables persistent anonymous visitor identification and page view tracking

-- Add visitor_id for cross-session visitor tracking (anonymous UUID cookie)
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- Add page_path for page view tracking
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS page_path TEXT;

-- Index for unique visitor queries (daily/weekly unique counts)
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor
    ON analytics_events(visitor_id, created_at DESC)
    WHERE visitor_id IS NOT NULL;

-- Index for top pages queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path
    ON analytics_events(page_path, created_at DESC)
    WHERE page_path IS NOT NULL;

-- Composite index for session reconstruction (visitor journey)
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_pages
    ON analytics_events(session_id, created_at ASC)
    WHERE event_type = 'page_view' AND session_id IS NOT NULL;
