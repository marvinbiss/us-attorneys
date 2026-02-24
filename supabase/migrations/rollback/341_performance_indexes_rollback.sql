-- ============================================================================
-- Rollback for Migration 341: Performance indexes
-- ============================================================================
-- Drops all indexes created in 341_performance_indexes.sql.
-- Safe to run even if some indexes were not created (IF EXISTS).
-- ============================================================================

-- BOOKINGS
DROP INDEX IF EXISTS idx_bookings_status_scheduled_date;
DROP INDEX IF EXISTS idx_bookings_created_at;
DROP INDEX IF EXISTS idx_bookings_payment_status_paid;

-- MESSAGES
DROP INDEX IF EXISTS idx_messages_conversation_sender_type;
DROP INDEX IF EXISTS idx_messages_unread;

-- CONVERSATIONS
DROP INDEX IF EXISTS idx_conversations_client_status;
DROP INDEX IF EXISTS idx_conversations_client_provider;

-- DEVIS_REQUESTS
DROP INDEX IF EXISTS idx_devis_requests_created_at;

-- REVIEWS
DROP INDEX IF EXISTS idx_reviews_client_email;
DROP INDEX IF EXISTS idx_reviews_artisan_status_created;

-- LEAD_ASSIGNMENTS
DROP INDEX IF EXISTS idx_lead_assignments_provider_assigned;
DROP INDEX IF EXISTS idx_lead_assignments_provider_status;

-- PROVIDER_CLAIMS
DROP INDEX IF EXISTS idx_provider_claims_user_id;
DROP INDEX IF EXISTS idx_provider_claims_user_pending;

-- NOTIFICATION_LOGS
DROP INDEX IF EXISTS idx_notification_logs_booking_type_sent;

-- QUOTES
DROP INDEX IF EXISTS idx_quotes_status;
DROP INDEX IF EXISTS idx_quotes_created_at;
DROP INDEX IF EXISTS idx_quotes_request_provider;

-- PROFILES
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_created_at;

-- ============================================================================
-- END OF ROLLBACK
-- ============================================================================
