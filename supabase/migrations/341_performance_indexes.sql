-- ============================================================================
-- Migration 341: Performance indexes for API query patterns
-- ============================================================================
-- Adds missing indexes identified by auditing all Supabase .eq()/.order()/.gte()
-- query patterns in src/app/api/ against existing CREATE INDEX statements.
-- Every index uses IF NOT EXISTS for idempotency.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- BOOKINGS
-- ────────────────────────────────────────────────────────────────────────────

-- Cron jobs (send-reminders, send-review-requests, send-reminders-1h) filter:
--   .eq('status', 'confirmed').gte('scheduled_date', ...).lte('scheduled_date', ...)
-- Composite covers the WHERE + range scan in a single B-tree lookup.
CREATE INDEX IF NOT EXISTS idx_bookings_status_scheduled_date
  ON bookings(status, scheduled_date);

-- Admin stats: .gte('created_at', todayStart), .order('created_at', { ascending: false })
-- Also used for time-series chart queries and activity feed.
CREATE INDEX IF NOT EXISTS idx_bookings_created_at
  ON bookings(created_at DESC);

-- Admin stats: .eq('payment_status', 'paid').gte('created_at', ...)
-- Partial index keeps it small — only paid bookings are counted for revenue.
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status_paid
  ON bookings(created_at DESC) WHERE payment_status = 'paid';

-- ────────────────────────────────────────────────────────────────────────────
-- MESSAGES
-- ────────────────────────────────────────────────────────────────────────────

-- Client/artisan message routes: .eq('conversation_id', ...).eq('sender_type', 'client')
-- for unread count. Also used for mark-as-read bulk updates.
-- Existing idx_messages_conversation_created covers (conversation_id, created_at)
-- but not sender_type filtering. This composite avoids a filter step.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender_type
  ON messages(conversation_id, sender_type);

-- messages/[id]/read route: .is('read_at', null) for unread message updates.
-- Partial index on unread messages only — very selective once most are read.
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(conversation_id, sender_type) WHERE read_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- CONVERSATIONS
-- ────────────────────────────────────────────────────────────────────────────

-- Client messages route: .eq('client_id', ...).eq('status', 'active')
-- Existing idx_conversations_client covers client_id alone.
-- Adding status lets the planner avoid a filter step.
CREATE INDEX IF NOT EXISTS idx_conversations_client_status
  ON conversations(client_id, status);

-- Client/artisan "find or create" pattern:
--   .eq('client_id', ...).eq('provider_id', ...)
-- Both artisan and client message routes use this to check if conversation exists.
CREATE INDEX IF NOT EXISTS idx_conversations_client_provider
  ON conversations(client_id, provider_id);

-- ────────────────────────────────────────────────────────────────────────────
-- DEVIS_REQUESTS
-- ────────────────────────────────────────────────────────────────────────────

-- Admin KPIs: .gte('created_at', todayStart/weekStart/monthStart)
-- Client leads route: .order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_devis_requests_created_at
  ON devis_requests(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- REVIEWS
-- ────────────────────────────────────────────────────────────────────────────

-- Admin user detail + GDPR export: .eq('client_email', ...)
CREATE INDEX IF NOT EXISTS idx_reviews_client_email
  ON reviews(client_email) WHERE client_email IS NOT NULL;

-- Very common pattern across multiple routes:
--   .eq('artisan_id', ...).eq('status', 'published').order('created_at', ...)
-- Existing idx_reviews_artisan covers artisan_id alone;
-- this composite lets the planner do an index-only scan for published reviews.
CREATE INDEX IF NOT EXISTS idx_reviews_artisan_status_created
  ON reviews(artisan_id, status, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- LEAD_ASSIGNMENTS
-- ────────────────────────────────────────────────────────────────────────────

-- Artisan leads route: .eq('provider_id', ...).order('assigned_at', { ascending: false })
-- Artisan stats route: .eq('provider_id', ...).order('assigned_at', ...)
CREATE INDEX IF NOT EXISTS idx_lead_assignments_provider_assigned
  ON lead_assignments(provider_id, assigned_at DESC);

-- Admin dispatch + KPI routes: .eq('status', 'pending'/'viewed'/'quoted'/'declined') with count
-- Combined with provider_id for artisan-specific status queries.
CREATE INDEX IF NOT EXISTS idx_lead_assignments_provider_status
  ON lead_assignments(provider_id, status);

-- ────────────────────────────────────────────────────────────────────────────
-- PROVIDER_CLAIMS
-- ────────────────────────────────────────────────────────────────────────────

-- Artisan claim route: .eq('user_id', ...).eq('status', 'pending')
-- Existing indexes cover provider_id and status separately, but not user_id.
CREATE INDEX IF NOT EXISTS idx_provider_claims_user_id
  ON provider_claims(user_id);

-- Composite for the common "does this user have a pending claim?" check.
CREATE INDEX IF NOT EXISTS idx_provider_claims_user_pending
  ON provider_claims(user_id) WHERE status = 'pending';

-- ────────────────────────────────────────────────────────────────────────────
-- NOTIFICATION_LOGS
-- ────────────────────────────────────────────────────────────────────────────

-- Cron dedup queries: .in('booking_id', ...).eq('type', '...').eq('status', 'sent')
-- Existing indexes cover booking_id and type separately.
-- Composite with partial on status='sent' makes dedup lookups fast.
CREATE INDEX IF NOT EXISTS idx_notification_logs_booking_type_sent
  ON notification_logs(booking_id, type) WHERE status = 'sent';

-- ────────────────────────────────────────────────────────────────────────────
-- QUOTES
-- ────────────────────────────────────────────────────────────────────────────

-- Admin quotes route: .eq('status', ...).order('created_at', ...)
CREATE INDEX IF NOT EXISTS idx_quotes_status
  ON quotes(status);

-- Artisan devis route: .order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_quotes_created_at
  ON quotes(created_at DESC);

-- Very common pattern: .eq('request_id', ...).eq('provider_id', ...)
-- Used in artisan devis create (duplicate check) and client lead accept/refuse.
CREATE INDEX IF NOT EXISTS idx_quotes_request_provider
  ON quotes(request_id, provider_id);

-- ────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────────────────────

-- Auth signup: .eq('email', email.toLowerCase()) — duplicate check.
-- NOTE: app.profiles has a unique index in migration 110, but public.profiles does not.
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email) WHERE email IS NOT NULL;

-- Admin stats: .gte('created_at', todayStart/thisMonthStart/lastMonthStart)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON profiles(created_at DESC);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
