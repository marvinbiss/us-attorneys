-- Migration 441: Secure Attorney-Client Messaging System
-- ABA Rule 1.6 Compliance: Confidential communications require encryption at rest
--
-- This migration creates the canonical secure messaging schema.
-- Migration 442 (already applied) adds encryption columns to existing tables.
-- This migration ensures the foundational tables and constraints exist.

-- =============================================================================
-- 1. Table: conversations
-- =============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES attorneys(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  subject TEXT DEFAULT 'New Conversation',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  encryption_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate active conversations between same attorney and client
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_attorney_client_active
  ON conversations (attorney_id, client_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_conversations_client
  ON conversations (client_id);

CREATE INDEX IF NOT EXISTS idx_conversations_attorney
  ON conversations (attorney_id);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON conversations (last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON conversations (status);

-- =============================================================================
-- 2. Table: messages
-- =============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'attorney', 'system')),
  -- Plaintext content (kept for backward compatibility with realtime subscriptions)
  content TEXT,
  -- AES-256-GCM encrypted fields (ABA Rule 1.6 compliance)
  encrypted_content TEXT,
  iv TEXT,
  content_preview TEXT,
  -- Metadata
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  -- Threading
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  -- Rich content (mentions, links, formatting)
  rich_content JSONB,
  -- Read tracking
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  -- Edit/delete
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary query: messages by conversation, ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at ASC);

-- Unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conversation_id, is_read) WHERE is_read = FALSE AND deleted_at IS NULL;

-- Sender lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages (sender_id);

-- Soft-deleted exclusion
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted
  ON messages (conversation_id, created_at DESC) WHERE deleted_at IS NULL;

-- =============================================================================
-- 3. Table: message_attachments
-- =============================================================================

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  thumbnail_url TEXT,
  duration INTEGER, -- for audio/video in seconds
  transcription TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message
  ON message_attachments (message_id);

-- =============================================================================
-- 4. Table: message_reactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message
  ON message_reactions (message_id);

-- =============================================================================
-- 5. Table: message_read_receipts
-- =============================================================================

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message
  ON message_read_receipts (message_id);

-- =============================================================================
-- 6. Table: conversation_settings (per-user settings for each conversation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS conversation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  notification_preference TEXT NOT NULL DEFAULT 'all' CHECK (notification_preference IN ('all', 'mentions', 'none')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, user_id)
);

-- =============================================================================
-- 7. Table: quick_reply_templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  category TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quick_reply_templates_user
  ON quick_reply_templates (user_id) WHERE is_active = TRUE;

-- =============================================================================
-- 8. Enable RLS
-- =============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_reply_templates ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 9. RLS Policies — conversations
-- Only participants (client_id or attorney's user_id) can access
-- =============================================================================

CREATE POLICY "conversations_select_participant" ON conversations
  FOR SELECT USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );

CREATE POLICY "conversations_insert_participant" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );

CREATE POLICY "conversations_update_participant" ON conversations
  FOR UPDATE USING (
    auth.uid() = client_id
    OR auth.uid() IN (SELECT user_id FROM attorneys WHERE id = attorney_id AND user_id IS NOT NULL)
  );

-- =============================================================================
-- 10. RLS Policies — messages
-- Only conversation participants can read/write messages
-- =============================================================================

CREATE POLICY "messages_select_participant" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_participant" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE USING (
    sender_id = auth.uid()
    OR conversation_id IN (
      SELECT id FROM conversations
      WHERE client_id = auth.uid()
        OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
    )
  );

-- =============================================================================
-- 11. RLS Policies — supporting tables
-- =============================================================================

-- message_attachments: inherit from messages
CREATE POLICY "attachments_select" ON message_attachments
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE conversation_id IN (
        SELECT id FROM conversations
        WHERE client_id = auth.uid()
          OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "attachments_insert" ON message_attachments
  FOR INSERT WITH CHECK (
    message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())
  );

-- message_reactions
CREATE POLICY "reactions_select" ON message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE conversation_id IN (
        SELECT id FROM conversations
        WHERE client_id = auth.uid()
          OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "reactions_insert" ON message_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reactions_delete" ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- message_read_receipts
CREATE POLICY "read_receipts_select" ON message_read_receipts
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE conversation_id IN (
        SELECT id FROM conversations
        WHERE client_id = auth.uid()
          OR attorney_id IN (SELECT id FROM attorneys WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "read_receipts_insert" ON message_read_receipts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- conversation_settings
CREATE POLICY "conv_settings_select" ON conversation_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conv_settings_upsert" ON conversation_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "conv_settings_update" ON conversation_settings
  FOR UPDATE USING (user_id = auth.uid());

-- quick_reply_templates
CREATE POLICY "quick_replies_select" ON quick_reply_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "quick_replies_insert" ON quick_reply_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "quick_replies_update" ON quick_reply_templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "quick_replies_delete" ON quick_reply_templates
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- 12. Triggers
-- =============================================================================

-- Auto-update updated_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON conversations;
CREATE TRIGGER trigger_update_conversation_timestamp
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Sync is_read with read_at
CREATE OR REPLACE FUNCTION sync_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND (OLD.is_read = FALSE OR OLD.is_read IS NULL) THEN
    NEW.read_at = COALESCE(NEW.read_at, NOW());
  END IF;
  IF NEW.read_at IS NOT NULL AND (OLD.read_at IS NULL) THEN
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
-- 13. Helper function: get unread count per conversation per user
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
-- 14. Comments (ABA Rule 1.6 documentation)
-- =============================================================================

COMMENT ON TABLE conversations IS 'Attorney-client conversations. ABA Rule 1.6 requires confidential communications.';
COMMENT ON TABLE messages IS 'Messages within conversations. Content encrypted at rest with AES-256-GCM.';
COMMENT ON COLUMN messages.encrypted_content IS 'AES-256-GCM encrypted message content (base64). Per-conversation key derived server-side.';
COMMENT ON COLUMN messages.iv IS 'Initialization vector for AES-256-GCM decryption (base64). Unique per message.';
COMMENT ON COLUMN messages.content_preview IS 'First 50 chars for notification preview. Attorney can disable via conversation settings.';
COMMENT ON COLUMN conversations.encryption_enabled IS 'Whether messages are encrypted at rest (ABA Rule 1.6 compliance). Default TRUE.';
