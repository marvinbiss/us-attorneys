/**
 * Client Messages API
 * GET: Fetch conversations and messages for client
 * POST: Send a new message
 */

import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { withTimeout, isTimeoutError } from '@/lib/api/timeout'
import { z } from 'zod'

// GET query params schema
const messagesQuerySchema = z.object({
  conversation_id: z.string().uuid().optional(),
})

// POST request schema
const sendMessageSchema = z.object({
  conversation_id: z.string().uuid().optional().nullable(),
  attorney_id: z.string().uuid().optional().nullable(),
  content: z.string().min(1).max(5000),
})

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const queryParams = {
      conversation_id: searchParams.get('conversation_id') || undefined,
    }
    const result = messagesQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Invalid parameters', 400)
    }
    const conversationId = result.data.conversation_id

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('AUTHENTICATION_ERROR', 'Not authenticated', 401)
    }

    if (conversationId) {
      // Verify conversation belongs to this client
      const { data: conversation } = await withTimeout(
        supabase
          .from('conversations')
          .select('id, client_id, attorney_id')
          .eq('id', conversationId)
          .eq('client_id', user.id)
          .single()
      )

      if (!conversation) {
        return apiError('NOT_FOUND', 'Conversation not found', 404)
      }

      // Fetch messages for this conversation
      const { data: messages, error: messagesError } = await withTimeout(
        supabase
          .from('messages')
          .select('id, conversation_id, sender_id, sender_type, content, read_at, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
      )

      if (messagesError) {
        logger.error('Error fetching messages:', messagesError)
        return apiError('DATABASE_ERROR', 'Error retrieving messages', 500)
      }

      // Mark messages sent by attorney as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'attorney')
        .is('read_at', null)

      return apiSuccess({ messages: messages || [], currentUserId: user.id })
    }

    // Fetch all conversations for this client
    const { data: conversations, error: convsError } = await withTimeout(
      supabase
        .from('conversations')
        .select(`
          id,
          client_id,
          attorney_id,
          status,
          created_at,
          booking_id,
          attorney:attorneys!attorney_id(id, name),
          booking:bookings!booking_id(service_name)
        `)
        .eq('client_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
    )

    if (convsError) {
      logger.error('Error fetching conversations:', convsError)
      return apiError('DATABASE_ERROR', 'Error retrieving conversations', 500)
    }

    // For each conversation, get the last message and unread count
    const conversationsWithMeta = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_type, read_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_type', 'attorney')
          .is('read_at', null)

        return {
          id: conv.id,
          partner: conv.attorney,
          lastMessage: lastMessages?.[0] || null,
          unreadCount: unreadCount || 0,
          // Supabase embedded join: booking resolves to single object at runtime
          service: ((Array.isArray(conv.booking) ? conv.booking[0] : conv.booking) as { service_name: string } | null)?.service_name || null,
        }
      })
    )

    return apiSuccess({ conversations: conversationsWithMeta })
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      logger.error('Client Messages GET timeout:', error)
      return apiError('GATEWAY_TIMEOUT', 'The request timed out. Please try again.', 504)
    }
    logger.error('Client Messages GET error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError('AUTHENTICATION_ERROR', 'Not authenticated', 401)
    }

    const body = await request.json()
    const result = sendMessageSchema.safeParse(body)
    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'Validation error', 400)
    }
    const { conversation_id, attorney_id, content } = result.data

    let resolvedConversationId = conversation_id

    if (!resolvedConversationId) {
      // Try to find existing conversation or create one
      if (!attorney_id) {
        return apiError('VALIDATION_ERROR', 'conversation_id or attorney_id required', 400)
      }

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', user.id)
        .eq('attorney_id', attorney_id)
        .single()

      if (existingConv) {
        resolvedConversationId = existingConv.id
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ client_id: user.id, attorney_id })
          .select('id')
          .single()

        if (convError || !newConv) {
          logger.error('Error creating conversation:', convError)
          return apiError('DATABASE_ERROR', 'Error creating conversation', 500)
        }
        resolvedConversationId = newConv.id
      }
    } else {
      // Verify conversation belongs to this client
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', resolvedConversationId)
        .eq('client_id', user.id)
        .single()

      if (!conversation) {
        return apiError('AUTHORIZATION_ERROR', 'Conversation not found or unauthorized', 403)
      }
    }

    // Insert new message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: resolvedConversationId,
        sender_id: user.id,
        sender_type: 'client',
        content,
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Error sending message:', insertError)
      return apiError('DATABASE_ERROR', 'Error sending message', 500)
    }

    return apiSuccess({ message })
  } catch (error: unknown) {
    if (isTimeoutError(error)) {
      logger.error('Client Messages POST timeout:', error)
      return apiError('GATEWAY_TIMEOUT', 'The request timed out. Please try again.', 504)
    }
    logger.error('Client Messages POST error:', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}
