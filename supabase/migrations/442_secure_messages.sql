-- Migration 442: Secure Attorney-Client Messaging System
-- ABA Rule 1.6 compliance: encryption at rest for attorney-client privilege
-- Adds encryption columns to existing messages table, creates secure_conversations view

-- =============================================================================
-- 1. ALTER existing conversations table: add attorney_id, subject columns
-- =============================================================================

-- Add attorney_id (direct reference, replaces provider_id lookup pattern)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS attorney_id UUID REFERENCES attorneys(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill attorney_id from provider_id for any existing rows
-- (provider_id references the old "providers" table; attorney_id references "attorneys")
-- This is a no-op if no rows exist, which is the expected case.
UPDATE conversations c
SET attorney_id = a.id
FROM attorneys a
WHERE c.attorney_id IS NULL
  AND a.user_id IS NOT NULL
  AND c.provider_id IS NOT NULL
  AND a.user_id = (SELECT user_id FROM attorneys WHERE id = c.provider_id::uuid LIMIT 1);

-- =============================================================================
-- 2. ALTER existing messages table: add encryption columns
-- =============================================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
  ADD COLUMN IF NOT EXISTS iv TEXT,
  ADD COLUMN IF NOT EXISTS content_preview TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS file_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update sender_type CHECK to include 'attorney' (was 'artisan' from ServicesArtisans migration)
-- Drop old constraint, add new one
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check
  CHECK (sender_type IN ('client', 'attorney', 'artisan', 'system'));

-- Update message_type to support voice messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'file', 'voice', 'system'));

-- =============================================================================
-- 3. Indexes for secure messaging queries
-- =============================================================================

-- Composite index for fetching messages by conversation, ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at ASC);

-- Index for unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conversation_id, is_read) WHERE is_read = FALSE;

-- Index for attorney_id on conversations
CREATE INDEX IF NOT EXISTS idx_conversations_attorney
  ON conversations (attorney_id);

-- =============================================================================
-- 4. RLS Policies for secure messaging
-- =============================================================================

-- Drop old policies that reference provider_id via subquery (migration 005)
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages they sent" ON messages;

-- New RLS: conversations
-- Participants = client_id matches auth.uid() OR attorney's user_id matches auth.uid()
CREATE POLICY "secure_conversations_select" ON conversations
  FOR SELECT USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );

CREATE POLICY "secure_conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );

CREATE POLICY "secure_conversations_update" ON conversations
  FOR UPDATE USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );

-- New RLS: messages - only conversation participants can read/write
CREATE POLICY "secure_messages_select" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "secure_messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "secure_messages_update" ON messages
  FOR UPDATE USING (
    sender_id = auth.uid()
  );

-- =============================================================================
-- 5. Updated trigger: sync is_read with read_at
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When is_read changes, set read_at
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  -- When read_at changes, set is_read
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    NEW.is_read = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_message_read ON messages;
CREATE TRIGGER trigger_sync_message_read
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_message_read_status();

-- =============================================================================
-- 6. Function: get conversation unread count for a specific user
-- =============================================================================

CREATE OR REPLACE FUNCTION get_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE
    AND deleted_at IS NULL;
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- 7. Comments
-- =============================================================================

COMMENT ON COLUMN messages.encrypted_content IS 'AES-256-GCM encrypted message content (base64). NULL for legacy unencrypted messages.';
COMMENT ON COLUMN messages.iv IS 'Initialization vector for AES-256-GCM decryption (base64). NULL for legacy unencrypted messages.';
COMMENT ON COLUMN messages.content_preview IS 'Optional first 50 chars for notification preview. Attorney can disable this.';
COMMENT ON COLUMN conversations.encryption_enabled IS 'Whether messages in this conversation are encrypted at rest (ABA Rule 1.6 compliance).';
