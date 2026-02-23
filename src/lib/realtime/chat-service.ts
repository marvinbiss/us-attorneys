/**
 * Real-time Chat Service using Supabase Realtime
 * WebSocket-based messaging between clients and artisans
 * Enhanced with edit, delete, reactions, threading, and file upload
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'artisan'
  content: string
  message_type: 'text' | 'image' | 'file' | 'system' | 'voice'
  file_url?: string
  read_at?: string
  created_at: string
  // Enhanced fields
  edited_at?: string
  deleted_at?: string
  reply_to_message_id?: string
  rich_content?: {
    mentions?: string[]
    links?: string[]
    formatted?: boolean
  }
  // Related data
  reply_to?: ChatMessage
  attachments?: MessageAttachment[]
  reactions?: MessageReaction[]
  read_receipts?: ReadReceipt[]
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_url: string
  file_name: string
  file_size: number
  mime_type: string
  thumbnail_url?: string
  duration?: number
  transcription?: string
  created_at: string
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface ReadReceipt {
  id: string
  message_id: string
  user_id: string
  read_at: string
}

export interface Conversation {
  id: string
  client_id: string
  provider_id: string
  quote_id?: string
  booking_id?: string
  status: 'active' | 'archived' | 'blocked'
  last_message_at: string
  unread_count: number
  created_at: string
  // Settings
  settings?: ConversationSettings
}

export interface ConversationSettings {
  is_muted: boolean
  is_archived: boolean
  is_pinned: boolean
  notification_preference: 'all' | 'mentions' | 'none'
}

export interface TypingIndicator {
  user_id: string
  user_type: 'client' | 'artisan'
  is_typing: boolean
  timestamp: number
}

export interface QuickReplyTemplate {
  id: string
  user_id: string
  title: string
  content: string
  shortcut?: string
  category?: string
  usage_count: number
  is_active: boolean
  created_at: string
}

class ChatService {
  private _supabase: ReturnType<typeof getSupabaseClient> | null = null
  private get supabase() {
    if (!this._supabase) {
      this._supabase = getSupabaseClient()
    }
    return this._supabase
  }
  private channels: Map<string, RealtimeChannel> = new Map()
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Subscribe to a conversation for real-time messages
   */
  subscribeToConversation(
    conversationId: string,
    callbacks: {
      onMessage: (message: ChatMessage) => void
      onMessageUpdate?: (message: ChatMessage) => void
      onMessageDelete?: (messageId: string) => void
      onReaction?: (reaction: MessageReaction, action: 'add' | 'remove') => void
      onTyping?: (indicator: TypingIndicator) => void
      onPresence?: (users: string[]) => void
      onReadReceipt?: (receipt: ReadReceipt) => void
    }
  ): () => void {
    const channelName = `conversation:${conversationId}`

    // Unsubscribe if already subscribed
    this.unsubscribeFromConversation(conversationId)

    const channel = this.supabase
      .channel(channelName)
      // New messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callbacks.onMessage(payload.new as ChatMessage)
        }
      )
      // Message updates (edits)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as ChatMessage
          if (message.deleted_at && callbacks.onMessageDelete) {
            callbacks.onMessageDelete(message.id)
          } else if (callbacks.onMessageUpdate) {
            callbacks.onMessageUpdate(message)
          }
        }
      )
      // Reactions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          if (callbacks.onReaction) {
            callbacks.onReaction(payload.new as MessageReaction, 'add')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          if (callbacks.onReaction) {
            callbacks.onReaction(payload.old as MessageReaction, 'remove')
          }
        }
      )
      // Read receipts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_read_receipts',
        },
        (payload) => {
          if (callbacks.onReadReceipt) {
            callbacks.onReadReceipt(payload.new as ReadReceipt)
          }
        }
      )
      // Typing broadcast
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (callbacks.onTyping) {
          callbacks.onTyping(payload.payload as TypingIndicator)
        }
      })
      // Presence
      .on('presence', { event: 'sync' }, () => {
        if (callbacks.onPresence) {
          const state = channel.presenceState()
          const users = Object.keys(state)
          callbacks.onPresence(users)
        }
      })
      .subscribe()

    this.channels.set(conversationId, channel)

    // Return unsubscribe function
    return () => this.unsubscribeFromConversation(conversationId)
  }

  /**
   * Unsubscribe from a conversation
   */
  unsubscribeFromConversation(conversationId: string): void {
    const channel = this.channels.get(conversationId)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(conversationId)
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    content: string,
    senderId: string,
    senderType: 'client' | 'artisan',
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text',
    options?: {
      fileUrl?: string
      replyToMessageId?: string
      richContent?: ChatMessage['rich_content']
    }
  ): Promise<ChatMessage | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        content,
        message_type: messageType,
        file_url: options?.fileUrl,
        reply_to_message_id: options?.replyToMessageId,
        rich_content: options?.richContent,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error sending message', error)
      return null
    }

    // Update conversation last_message_at
    await this.supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return data as ChatMessage
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: string,
    newContent: string,
    userId: string
  ): Promise<ChatMessage | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .update({
        content: newContent,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', userId) // Only allow editing own messages
      .is('deleted_at', null) // Can't edit deleted messages
      .select()
      .single()

    if (error) {
      logger.error('Error editing message', error)
      return null
    }

    return data as ChatMessage
  }

  /**
   * Soft delete a message
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', userId) // Only allow deleting own messages

    if (error) {
      logger.error('Error deleting message', error)
      return false
    }

    return true
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<MessageReaction | null> {
    const { data, error } = await this.supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji,
      })
      .select()
      .single()

    if (error) {
      // Might be duplicate, which is fine
      if (error.code !== '23505') {
        logger.error('Error adding reaction', error)
      }
      return null
    }

    return data as MessageReaction
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)

    if (error) {
      logger.error('Error removing reaction', error)
      return false
    }

    return true
  }

  /**
   * Get reactions for a message
   */
  async getReactions(messageId: string): Promise<MessageReaction[]> {
    const { data, error } = await this.supabase
      .from('message_reactions')
      .select('id, message_id, user_id, emoji, created_at')
      .eq('message_id', messageId)

    if (error) {
      logger.error('Error fetching reactions', error)
      return []
    }

    return data as MessageReaction[]
  }

  /**
   * Broadcast typing indicator
   */
  sendTypingIndicator(
    conversationId: string,
    userId: string,
    userType: 'client' | 'artisan',
    isTyping: boolean
  ): void {
    const channel = this.channels.get(conversationId)
    if (!channel) return

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        user_type: userType,
        is_typing: isTyping,
        timestamp: Date.now(),
      },
    })

    // Auto-clear typing after 3 seconds
    if (isTyping) {
      const existingTimeout = this.typingTimeouts.get(conversationId)
      if (existingTimeout) clearTimeout(existingTimeout)

      const timeout = setTimeout(() => {
        this.sendTypingIndicator(conversationId, userId, userType, false)
      }, 3000)

      this.typingTimeouts.set(conversationId, timeout)
    }
  }

  /**
   * Mark a specific message as read
   */
  async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<ReadReceipt | null> {
    const { data, error } = await this.supabase
      .from('message_read_receipts')
      .insert({
        message_id: messageId,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      // Might be duplicate, which is fine
      if (error.code !== '23505') {
        logger.error('Error marking message as read', error)
      }
      return null
    }

    return data as ReadReceipt
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await this.supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null)
  }

  /**
   * Get conversation messages with pagination and attachments
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from('messages')
      .select(`
        id, conversation_id, sender_id, sender_type, content, message_type, file_url, read_at, created_at, edited_at, deleted_at, reply_to_message_id, rich_content,
        attachments:message_attachments(id, message_id, file_url, file_name, file_size, mime_type, thumbnail_url, duration, transcription, created_at),
        reactions:message_reactions(id, message_id, user_id, emoji, created_at),
        read_receipts:message_read_receipts(id, message_id, user_id, read_at)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching messages', error)
      return []
    }

    return (data as ChatMessage[]).reverse()
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    query: string,
    limit = 20
  ): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('id, conversation_id, sender_id, sender_type, content, message_type, file_url, read_at, created_at, edited_at, deleted_at, reply_to_message_id, rich_content')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .textSearch('search_vector', query, {
        config: 'french',
      })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error searching messages', error)
      return []
    }

    return data as ChatMessage[]
  }

  /**
   * Get or create conversation between client and provider
   */
  async getOrCreateConversation(
    clientId: string,
    providerId: string,
    quoteId?: string,
    bookingId?: string
  ): Promise<Conversation | null> {
    // Try to find existing conversation
    const { data: existing } = await this.supabase
      .from('conversations')
      .select('id, client_id, provider_id, quote_id, booking_id, status, last_message_at, unread_count, created_at')
      .eq('client_id', clientId)
      .eq('provider_id', providerId)
      .eq('status', 'active')
      .single()

    if (existing) return existing as Conversation

    // Create new conversation
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        client_id: clientId,
        provider_id: providerId,
        quote_id: quoteId,
        booking_id: bookingId,
        status: 'active',
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating conversation', error)
      return null
    }

    return data as Conversation
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(
    userId: string,
    userType: 'client' | 'artisan',
    options?: {
      includeArchived?: boolean
      pinnedFirst?: boolean
    }
  ): Promise<Conversation[]> {
    const column = userType === 'client' ? 'client_id' : 'provider_id'

    let query = this.supabase
      .from('conversations')
      .select(`
        id, client_id, provider_id, quote_id, booking_id, status, last_message_at, unread_count, created_at,
        client:profiles!client_id(id, full_name),
        provider:providers!provider_id(id, name, avatar_url),
        settings:conversation_settings(is_muted, is_archived, is_pinned, notification_preference)
      `)
      .eq(column, userId)

    if (!options?.includeArchived) {
      query = query.eq('status', 'active')
    }

    query = query.order('last_message_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching conversations', error)
      return []
    }

    let conversations = data as Conversation[]

    // Sort pinned first if requested
    if (options?.pinnedFirst) {
      conversations = conversations.sort((a, b) => {
        const aSettings = Array.isArray(a.settings) ? a.settings[0] : a.settings
        const bSettings = Array.isArray(b.settings) ? b.settings[0] : b.settings
        const aPinned = aSettings?.is_pinned || false
        const bPinned = bSettings?.is_pinned || false
        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1
        return 0
      })
    }

    return conversations
  }

  /**
   * Update conversation settings
   */
  async updateConversationSettings(
    conversationId: string,
    userId: string,
    settings: Partial<ConversationSettings>
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('conversation_settings')
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      logger.error('Error updating conversation settings', error)
      return false
    }

    return true
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    return this.updateConversationSettings(conversationId, userId, {
      is_archived: true,
    })
  }

  /**
   * Pin/unpin a conversation
   */
  async togglePinConversation(
    conversationId: string,
    userId: string,
    isPinned: boolean
  ): Promise<boolean> {
    return this.updateConversationSettings(conversationId, userId, {
      is_pinned: isPinned,
    })
  }

  /**
   * Mute/unmute a conversation
   */
  async toggleMuteConversation(
    conversationId: string,
    userId: string,
    isMuted: boolean
  ): Promise<boolean> {
    return this.updateConversationSettings(conversationId, userId, {
      is_muted: isMuted,
    })
  }

  /**
   * Upload a file attachment
   */
  async uploadAttachment(
    file: File,
    conversationId: string
  ): Promise<{ url: string; thumbnailUrl?: string } | null> {
    // Validate file size (10 MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      logger.error('File too large', { size: file.size, max: MAX_FILE_SIZE })
      return null
    }

    // Validate MIME type
    const ALLOWED_TYPES = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!ALLOWED_TYPES.includes(file.type)) {
      logger.error('File type not allowed', { type: file.type })
      return null
    }

    // Sanitize filename: keep only alphanumeric, dots, hyphens
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')
    const fileExt = safeName.split('.').pop()
    const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await this.supabase.storage
      .from('chat-attachments')
      .upload(fileName, file, { contentType: file.type })

    if (error) {
      logger.error('Error uploading attachment', error)
      return null
    }

    const { data: { publicUrl } } = this.supabase.storage
      .from('chat-attachments')
      .getPublicUrl(data.path)

    return { url: publicUrl }
  }

  /**
   * Get quick reply templates
   */
  async getQuickReplies(userId: string): Promise<QuickReplyTemplate[]> {
    const { data, error } = await this.supabase
      .from('quick_reply_templates')
      .select('id, user_id, title, content, shortcut, category, usage_count, is_active, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (error) {
      logger.error('Error fetching quick replies', error)
      return []
    }

    return data as QuickReplyTemplate[]
  }

  /**
   * Create a quick reply template
   */
  async createQuickReply(
    userId: string,
    template: Omit<QuickReplyTemplate, 'id' | 'user_id' | 'usage_count' | 'is_active' | 'created_at'>
  ): Promise<QuickReplyTemplate | null> {
    const { data, error } = await this.supabase
      .from('quick_reply_templates')
      .insert({
        user_id: userId,
        ...template,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating quick reply', error)
      return null
    }

    return data as QuickReplyTemplate
  }

  /**
   * Use a quick reply (increment usage count)
   */
  async useQuickReply(templateId: string): Promise<void> {
    await this.supabase
      .from('quick_reply_templates')
      .update({
        usage_count: this.supabase.rpc('increment', { row_id: templateId }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
  }

  /**
   * Delete a quick reply template
   */
  async deleteQuickReply(templateId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('quick_reply_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId)

    if (error) {
      logger.error('Error deleting quick reply', error)
      return false
    }

    return true
  }

  /**
   * Track user presence in conversation
   */
  async trackPresence(
    conversationId: string,
    userId: string,
    userType: 'client' | 'artisan'
  ): Promise<void> {
    const channel = this.channels.get(conversationId)
    if (!channel) return

    await channel.track({
      user_id: userId,
      user_type: userType,
      online_at: new Date().toISOString(),
    })
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.typingTimeouts.clear()
  }
}

// Singleton instance
export const chatService = new ChatService()

export default chatService
