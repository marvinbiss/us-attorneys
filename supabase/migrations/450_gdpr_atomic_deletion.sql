-- ============================================================
-- Migration 450: GDPR Atomic Deletion RPC
-- Wraps all user data anonymization/deletion in a single
-- transaction so there is never a partial deletion state.
-- ============================================================

CREATE OR REPLACE FUNCTION gdpr_delete_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  profile_email TEXT;
  attorney_record_id UUID;
  reviews_anonymized INT := 0;
  bookings_anonymized INT := 0;
  leads_anonymized INT := 0;
  claims_deleted INT := 0;
  messages_anonymized INT := 0;
  notifications_deleted INT := 0;
BEGIN
  -- Step 1: Fetch current profile email (needed to find reviews by email)
  SELECT email INTO profile_email
  FROM profiles
  WHERE id = target_user_id;

  IF profile_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found for id: ' || target_user_id::TEXT
    );
  END IF;

  -- Step 2: Check if user is an attorney
  SELECT id INTO attorney_record_id
  FROM attorneys
  WHERE user_id = target_user_id
  LIMIT 1;

  -- Step 3: Anonymize profile
  UPDATE profiles SET
    email = 'deleted-' || target_user_id::TEXT || '@redacted.com',
    full_name = 'Deleted User',
    phone_e164 = NULL,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Step 4: Anonymize reviews where user is the client (by email or client_id)
  WITH updated AS (
    UPDATE reviews SET
      client_name = 'Deleted User',
      client_email = 'redacted@redacted.com',
      comment = '[Deleted]'
    WHERE client_email = profile_email
       OR client_id = target_user_id
    RETURNING id
  )
  SELECT COUNT(*) INTO reviews_anonymized FROM updated;

  -- Step 5: If user is an attorney, clear attorney responses on their reviews
  IF attorney_record_id IS NOT NULL THEN
    UPDATE reviews SET
      artisan_response = NULL,
      artisan_responded_at = NULL
    WHERE attorney_id = attorney_record_id;
  END IF;

  -- Step 6: Anonymize bookings (client PII)
  WITH updated AS (
    UPDATE bookings SET
      client_email = 'redacted@redacted.com',
      client_name = 'Deleted User',
      client_phone = NULL,
      notes = NULL
    WHERE client_id = target_user_id
       OR client_email = profile_email
    RETURNING id
  )
  SELECT COUNT(*) INTO bookings_anonymized FROM updated;

  -- Step 7: Anonymize leads (contact PII)
  WITH updated AS (
    UPDATE leads SET
      contact_name = 'Deleted User',
      contact_email = 'redacted@redacted.com',
      contact_phone = NULL,
      description = '[Deleted]'
    WHERE contact_email = profile_email
    RETURNING id
  )
  SELECT COUNT(*) INTO leads_anonymized FROM updated;

  -- Step 8: Delete attorney claims where user is claimant
  WITH deleted AS (
    DELETE FROM attorney_claims
    WHERE user_id = target_user_id
    RETURNING id
  )
  SELECT COUNT(*) INTO claims_deleted FROM deleted;

  -- Step 9: Anonymize chat messages sent by user
  WITH updated AS (
    UPDATE messages SET
      content = '[Deleted]'
    WHERE sender_id = target_user_id
    RETURNING id
  )
  SELECT COUNT(*) INTO messages_anonymized FROM updated;

  -- Step 10: Delete notifications (no PII value, just cleanup)
  WITH deleted AS (
    DELETE FROM notifications
    WHERE user_id = target_user_id
    RETURNING id
  )
  SELECT COUNT(*) INTO notifications_deleted FROM deleted;

  -- Step 11: Deactivate attorney profile if applicable
  IF attorney_record_id IS NOT NULL THEN
    UPDATE attorneys SET
      is_active = false,
      updated_at = NOW()
    WHERE id = attorney_record_id;
  END IF;

  -- Step 12: Mark deletion request as completed
  UPDATE deletion_requests SET
    status = 'completed',
    completed_at = NOW()
  WHERE user_id = target_user_id
    AND status = 'scheduled';

  -- Build audit trail result
  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'profile_anonymized', true,
    'reviews_anonymized', reviews_anonymized,
    'bookings_anonymized', bookings_anonymized,
    'leads_anonymized', leads_anonymized,
    'claims_deleted', claims_deleted,
    'messages_anonymized', messages_anonymized,
    'notifications_deleted', notifications_deleted,
    'attorney_deactivated', attorney_record_id IS NOT NULL,
    'completed_at', NOW()
  );

  RETURN result;
END;
$$;

-- Grant execute to service_role only (admin client)
REVOKE ALL ON FUNCTION gdpr_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION gdpr_delete_user(UUID) TO service_role;
