/**
 * Secure Conversation Messages API
 * GET:   Fetch messages in a conversation (decrypts server-side)
 * POST:  Send new message (encrypts server-side)
 * PATCH: Mark messages as read
 *
 * ABA Rule 1.6 compliance: all messages encrypted at rest with AES-256-GCM
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  encryptMessage,
  decryptMessage,
  generateContentPreview,
} from '@/lib/encryption/message-crypto'
import { sendPushToUser } from '@/lib/push/send' // Used in POST handler for push notifications
import { NOTIFICATION_TEMPLATES } from '@/lib/push/notifications' // Used in POST handler for push notifications
import { logger } from '@/lib/logger'
import { z } from 'zod'

type RouteParams = { params: Promise<{ conversationId: string }> }

/**
 * Verify user is a participant in the conversation.
 * Returns { userId, userType, conversationId } or null.
 */
async function verifyParticipant(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const admin = createAdminClient()

  // Get user profile type
  const { data: profile } = await admin
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  const userType = profile?.user_type || 'client'

  // Check conversation membership
  let query = admin
    .from('conversations')
    .select('id, client_id, attorney_id, encryption_enabled')
    .eq('id', conversationId)

  if (userType === 'attorney') {
    // Attorney: check via attorneys.user_id
    const { data: attorney } = await admin
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!attorney) return null
    query = query.eq('attorney_id', attorney.id)
  } else {
    query = query.eq('client_id', user.id)
  }

  const { data: conversation } = await query.single()
  if (!conversation) return null

  return {
    userId: user.id,
    userType: userType as 'client' | 'attorney',
    conversation,
  }
}

// ─── GET: Fetch messages ─────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params
    const participant = await verifyParticipant(conversationId)

    if (!participant) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized or conversation not found' } },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const before = searchParams.get('before') // cursor for pagination

    const admin = createAdminClient()

    let query = admin
      .from('messages')
      .select('id, conversation_id, sender_id, sender_type, content, encrypted_content, iv, content_preview, message_type, file_url, file_name, file_size, file_encrypted, read_at, is_read, reply_to_id, edited_at, deleted_at, created_at')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      logger.error('Fetch messages error', { error, conversationId })
      return NextResponse.json(
        { success: false, error: { message: 'Failed to fetch messages' } },
        { status: 500 }
      )
    }

    // Decrypt messages server-side before returning
    const decryptedMessages = (messages || []).map((msg) => {
      let decryptedContent = msg.content

      // If encrypted_content exists, decrypt it
      if (msg.encrypted_content && msg.iv) {
        try {
          decryptedContent = decryptMessage(msg.encrypted_content, msg.iv, conversationId)
        } catch {
          // Fallback to plaintext content if decryption fails
          logger.warn('Message decryption fallback', { messageId: msg.id })
          decryptedContent = msg.content || '[Encrypted message]'
        }
      }

      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_type: msg.sender_type,
        content: decryptedContent,
        message_type: msg.message_type,
        file_url: msg.file_url,
        file_name: msg.file_name,
        file_size: msg.file_size,
        is_read: msg.is_read,
        read_at: msg.read_at,
        reply_to_id: msg.reply_to_id,
        edited_at: msg.edited_at,
        created_at: msg.created_at,
        is_encrypted: !!msg.encrypted_content,
      }
    })

    // Return messages in ascending order (oldest first)
    decryptedMessages.reverse()

    return NextResponse.json({
      success: true,
      messages: decryptedMessages,
      currentUserId: participant.userId,
      userType: participant.userType,
      hasMore: (messages || []).length === limit,
      encryption_enabled: participant.conversation.encryption_enabled,
    })
  } catch (error) {
    logger.error('Conversation GET error', { error })
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// ─── POST: Send message ──────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  message_type: z.enum(['text', 'image', 'file', 'voice']).default('text'),
  file_url: z.string().url().optional(),
  file_name: z.string().max(255).optional(),
  file_size: z.number().int().positive().optional(),
  reply_to_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params
    const participant = await verifyParticipant(conversationId)

    if (!participant) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized or conversation not found' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = sendMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { content, message_type, file_url, file_name, file_size, reply_to_id } = parsed.data

    // Encrypt message content
    const { encrypted, iv } = encryptMessage(content, conversationId)
    const preview = generateContentPreview(content)

    const admin = createAdminClient()

    const { data: newMessage, error } = await admin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: participant.userId,
        sender_type: participant.userType,
        content, // Plaintext kept for backward compat with existing realtime subscriptions
        encrypted_content: encrypted,
        iv,
        content_preview: preview,
        message_type,
        file_url: file_url || null,
        file_name: file_name || null,
        file_size: file_size || null,
        reply_to_id: reply_to_id || null,
      })
      .select('id, sender_id, sender_type, message_type, created_at')
      .single()

    if (error) {
      logger.error('Send message error', { error, conversationId })
      return NextResponse.json(
        { success: false, error: { message: 'Failed to send message' } },
        { status: 500 }
      )
    }

    // Update conversation timestamp
    await admin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    // ─── Push notification to recipient ──────────────────────────────
    try {
      const { data: conv } = await admin
        .from('conversations')
        .select('client_id, attorney_id')
        .eq('id', conversationId)
        .single()

      if (conv) {
        let recipientUserId: string | null = null
        let senderName = 'Someone'

        if (participant.userType === 'client') {
          // Sender is client -> notify attorney
          const { data: attorney } = await admin
            .from('attorneys')
            .select('user_id, name')
            .eq('id', conv.attorney_id)
            .single()
          recipientUserId = attorney?.user_id || null

          const { data: senderProfile } = await admin
            .from('profiles')
            .select('full_name')
            .eq('id', participant.userId)
            .single()
          senderName = senderProfile?.full_name || 'A client'
        } else {
          // Sender is attorney -> notify client
          recipientUserId = conv.client_id

          const { data: attorney } = await admin
            .from('attorneys')
            .select('name')
            .eq('id', conv.attorney_id)
            .single()
          senderName = attorney?.name || 'Your attorney'
        }

        if (recipientUserId) {
          // Respect mute settings
          const { data: settings } = await admin
            .from('conversation_settings')
            .select('is_muted')
            .eq('conversation_id', conversationId)
            .eq('user_id', recipientUserId)
            .single()

          if (!settings?.is_muted) {
            const notification = NOTIFICATION_TEMPLATES.NEW_MESSAGE(senderName, preview)
            sendPushToUser(recipientUserId, notification).catch((pushErr) => {
              logger.warn('Push notification failed (non-blocking)', { error: pushErr })
            })
          }
        }
      }
    } catch (pushError) {
      // Push failure must never block the message response
      logger.warn('Push notification error (non-blocking)', { error: pushError })
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage?.id,
        content, // Return plaintext to sender
        sender_id: participant.userId,
        sender_type: participant.userType,
        message_type,
        created_at: newMessage?.created_at,
        is_encrypted: true,
      },
    })
  } catch (error) {
    logger.error('Conversation POST error', { error })
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// ─── PATCH: Mark messages as read ────────────────────────────────────────────

const markReadSchema = z.object({
  action: z.literal('mark_read'),
  message_ids: z.array(z.string().uuid()).optional(),
})

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params
    const participant = await verifyParticipant(conversationId)

    if (!participant) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized or conversation not found' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = markReadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data' } },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Mark all unread messages from the OTHER user as read
    let query = admin
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', participant.userId)
      .eq('is_read', false)

    if (parsed.data.message_ids && parsed.data.message_ids.length > 0) {
      query = query.in('id', parsed.data.message_ids)
    }

    const { error } = await query

    if (error) {
      logger.error('Mark read error', { error, conversationId })
      return NextResponse.json(
        { success: false, error: { message: 'Failed to mark messages as read' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Conversation PATCH error', { error })
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
