-- Migration 339: Enable RLS on unprotected tables
-- Adds row-level security policies to remaining tables without RLS.
-- Uses DROP POLICY IF EXISTS before CREATE POLICY for idempotence.
-- service_role always bypasses RLS automatically.

--------------------------------------------------------------------------------
-- 1. admin_roles - deny all (service_role bypass only)
--------------------------------------------------------------------------------
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 2. cms_pages - public read WHERE status='published' AND is_active=true
--------------------------------------------------------------------------------
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published CMS pages" ON cms_pages;
CREATE POLICY "Public can view published CMS pages" ON cms_pages
  FOR SELECT USING (status = 'published' AND is_active = true);

DROP POLICY IF EXISTS "Service role full access on cms_pages" ON cms_pages;
CREATE POLICY "Service role full access on cms_pages" ON cms_pages
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- 3. cms_page_versions - deny all (service_role bypass only)
--------------------------------------------------------------------------------
ALTER TABLE cms_page_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on cms_page_versions" ON cms_page_versions;
CREATE POLICY "Service role full access on cms_page_versions" ON cms_page_versions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- 4. email_suppressions - deny all (service_role bypass only)
--------------------------------------------------------------------------------
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on email_suppressions" ON email_suppressions;
CREATE POLICY "Service role full access on email_suppressions" ON email_suppressions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- 5. gift_card_transactions - read via gift_card ownership
--------------------------------------------------------------------------------
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own gift card transactions" ON gift_card_transactions;
CREATE POLICY "Users can view own gift card transactions" ON gift_card_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gift_cards gc
        JOIN profiles p ON p.id = auth.uid()
       WHERE gc.id = gift_card_transactions.gift_card_id
         AND (gc.sender_email = p.email OR gc.recipient_email = p.email)
    )
  );

DROP POLICY IF EXISTS "Service role full access on gift_card_transactions" ON gift_card_transactions;
CREATE POLICY "Service role full access on gift_card_transactions" ON gift_card_transactions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- 6. moderation_logs - deny all (service_role bypass only)
--------------------------------------------------------------------------------
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 7. oauth_states - user_id = auth.uid()
--------------------------------------------------------------------------------
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own oauth states" ON oauth_states;
CREATE POLICY "Users can manage own oauth states" ON oauth_states
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

--------------------------------------------------------------------------------
-- 8. platform_stats - public read
--------------------------------------------------------------------------------
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view platform stats" ON platform_stats;
CREATE POLICY "Anyone can view platform stats" ON platform_stats
  FOR SELECT USING (true);

--------------------------------------------------------------------------------
-- 9. artisan_slot_stats - public read
--------------------------------------------------------------------------------
ALTER TABLE artisan_slot_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view artisan slot stats" ON artisan_slot_stats;
CREATE POLICY "Anyone can view artisan slot stats" ON artisan_slot_stats
  FOR SELECT USING (true);

--------------------------------------------------------------------------------
-- 10. client_booking_history - own data via email match
--------------------------------------------------------------------------------
ALTER TABLE client_booking_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own booking history" ON client_booking_history;
CREATE POLICY "Users can view own booking history" ON client_booking_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
       WHERE p.id = auth.uid()
         AND p.email = client_booking_history.client_email
    )
  );

DROP POLICY IF EXISTS "Service role full access on client_booking_history" ON client_booking_history;
CREATE POLICY "Service role full access on client_booking_history" ON client_booking_history
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

--------------------------------------------------------------------------------
-- 11. analytics_events - deny all; drop overly permissive legacy policies
--------------------------------------------------------------------------------
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Providers can view their analytics" ON analytics_events;
DROP POLICY IF EXISTS "System can insert analytics" ON analytics_events;
