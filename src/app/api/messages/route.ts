/**
 * Secure Messages API
 * GET: List conversations for authenticated user
 * POST: Create a new conversation or send first message
 *
 * ABA Rule 1.6 compliance: all messages encrypted at rest
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptMessage, generateContentPreview } from '@/lib/encryption/message-crypto'
import { sendPushToUser } from '@/lib/push/send' // Used in POST handler for push notifications
import { NOTIFICATION_TEMPLATES } from '@/lib/push/notifications' // Used in POST handler for push notifications
import { logger } from '@/lib/logger'
import { z } from 'zod'

// ─── GET: List conversations ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Determine user type
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const userType = profile?.user_type || 'client'

    // Get attorney ID if user is attorney
    let attorneyId: string | null = null
    if (userType === 'attorney') {
      const { data: attorney } = await admin
        .from('attorneys')
        .select('id')
        .eq('user_id', user.id)
        .single()
      attorneyId = attorney?.id || null
    }

    // Fetch conversations with last message preview
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'active'

    let query = admin
      .from('conversations')
      .select(`
        id,
        client_id,
        attorney_id,
        subject,
        status,
        encryption_enabled,
        last_message_at,
        created_at,
        client:profiles!client_id(id, full_name, email),
        attorney:attorneys!attorney_id(id, name, slug)
      `)
      .eq('status', status)
      .order('last_message_at', { ascending: false })

    if (userType === 'attorney' && attorneyId) {
      query = query.eq('attorney_id', attorneyId)
    } else {
      query = query.eq('client_id', user.id)
    }

    const { data: conversations, error } = await query

    if (error) {
      logger.error('Fetch conversations error', { error, userId: user.id })
      return NextResponse.json(
        { success: false, error: { message: 'Failed to fetch conversations' } },
        { status: 500 }
      )
    }

    // Batch: get unread counts + last messages for all conversations in parallel (2 queries total, not 2N)
    const convIds = (conversations || []).map(c => c.id)
    let unreadMap: Record<string, number> = {}
    let lastMsgMap: Record<string, { content_preview: string | null; content: string | null; sender_type: string | null }> = {}

    if (convIds.length > 0) {
      // Batch unread counts via Promise.all on the RPC (unavoidable per-conv RPC, but done in parallel)
      const [unreadResults, lastMsgResult] = await Promise.all([
        Promise.all(
          convIds.map(async (convId) => {
            const { data } = await admin.rpc('get_unread_count', {
              p_conversation_id: convId,
              p_user_id: user.id,
            })
            return { convId, count: data || 0 }
          })
        ),
        // Single query: get last message for all conversations using distinct on
        admin
          .from('messages')
          .select('conversation_id, content, content_preview, sender_type, created_at')
          .in('conversation_id', convIds)
          .is('deleted_at', null)
          .order('conversation_id')
          .order('created_at', { ascending: false })
      ])

      for (const { convId, count } of unreadResults) {
        unreadMap[convId] = count
      }

      // Group last messages by conversation (first per group = latest due to ordering)
      const seen = new Set<string>()
      for (const msg of lastMsgResult.data || []) {
        if (!seen.has(msg.conversation_id)) {
          seen.add(msg.conversation_id)
          lastMsgMap[msg.conversation_id] = {
            content_preview: msg.content_preview,
            content: msg.content,
            sender_type: msg.sender_type,
          }
        }
      }
    }

    const conversationsWithUnread = (conversations || []).map((conv) => {
      const lastMsg = lastMsgMap[conv.id]
      return {
        ...conv,
        unread_count: unreadMap[conv.id] || 0,
        last_message_preview: lastMsg?.content_preview || lastMsg?.content || null,
        last_message_sender_type: lastMsg?.sender_type || null,
      }
    })

    return NextResponse.json({
      success: true,
      conversations: conversationsWithUnread,
      currentUserId: user.id,
      userType,
    })
  } catch (error) {
    logger.error('Messages GET error', { error })
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// ─── POST: Create conversation + send first message ──────────────────────────

const createConversationSchema = z.object({
  attorney_id: z.string().uuid(),
  subject: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = createConversationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { attorney_id, subject, message } = parsed.data
    const admin = createAdminClient()

    // Verify attorney exists
    const { data: attorney } = await admin
      .from('attorneys')
      .select('id, name')
      .eq('id', attorney_id)
      .single()

    if (!attorney) {
      return NextResponse.json(
        { success: false, error: { message: 'Attorney not found' } },
        { status: 404 }
      )
    }

    // Check for existing conversation
    const { data: existingConv } = await admin
      .from('conversations')
      .select('id')
      .eq('client_id', user.id)
      .eq('attorney_id', attorney_id)
      .single()

    let conversationId: string

    if (existingConv) {
      conversationId = existingConv.id
      // Reactivate if archived
      await admin
        .from('conversations')
        .update({ status: 'active' })
        .eq('id', conversationId)
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await admin
        .from('conversations')
        .insert({
          client_id: user.id,
          attorney_id,
          subject: subject || `Consultation with ${attorney.name}`,
          status: 'active',
          encryption_enabled: true,
        })
        .select('id')
        .single()

      if (convError || !newConv) {
        logger.error('Create conversation error', { error: convError })
        return NextResponse.json(
          { success: false, error: { message: 'Failed to create conversation' } },
          { status: 500 }
        )
      }

      conversationId = newConv.id
    }

    // Encrypt and send the first message
    const { encrypted, iv } = encryptMessage(message, conversationId)
    const preview = generateContentPreview(message)

    const { data: newMessage, error: msgError } = await admin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: 'client',
        content: message, // Keep plaintext for backward compat with existing queries
        encrypted_content: encrypted,
        iv,
        content_preview: preview,
        message_type: 'text',
      })
      .select('id, created_at')
      .single()

    if (msgError) {
      logger.error('Send first message error', { error: msgError })
      return NextResponse.json(
        { success: false, error: { message: 'Failed to send message' } },
        { status: 500 }
      )
    }

    // Push notification to attorney on new conversation/first message
    try {
      const { data: attorneyData } = await admin
        .from('attorneys')
        .select('user_id, name')
        .eq('id', attorney_id)
        .single()

      if (attorneyData?.user_id) {
        const { data: senderProfile } = await admin
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const senderName = senderProfile?.full_name || 'A client'
        const pushNotification = NOTIFICATION_TEMPLATES.NEW_MESSAGE(senderName, preview)
        sendPushToUser(attorneyData.user_id, pushNotification).catch((pushErr) => {
          logger.warn('Push notification failed (non-blocking)', { error: pushErr })
        })
      }
    } catch (pushError) {
      logger.warn('Push notification error (non-blocking)', { error: pushError })
    }

    return NextResponse.json({
      success: true,
      conversation_id: conversationId,
      message_id: newMessage?.id,
    })
  } catch (error) {
    logger.error('Messages POST error', { error })
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
