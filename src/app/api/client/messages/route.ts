/**
 * Client Messages API
 * GET: Fetch conversations and messages for client
 * POST: Send a new message
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const messagesQuerySchema = z.object({
  conversation_id: z.string().uuid().optional(),
})

// POST request schema
const sendMessageSchema = z.object({
  conversation_id: z.string().uuid().optional().nullable(),
  provider_id: z.string().uuid().optional().nullable(),
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
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const conversationId = result.data.conversation_id

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    if (conversationId) {
      // Verify conversation belongs to this client
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id, client_id, provider_id')
        .eq('id', conversationId)
        .eq('client_id', user.id)
        .single()

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation non trouvée' },
          { status: 404 }
        )
      }

      // Fetch messages for this conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, sender_type, content, read_at, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        logger.error('Error fetching messages:', messagesError)
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des messages' },
          { status: 500 }
        )
      }

      // Mark messages sent by artisan as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'artisan')
        .is('read_at', null)

      return NextResponse.json({ messages: messages || [], currentUserId: user.id })
    }

    // Fetch all conversations for this client
    const { data: conversations, error: convsError } = await supabase
      .from('conversations')
      .select(`
        id,
        client_id,
        provider_id,
        status,
        created_at,
        booking_id,
        provider:providers!provider_id(id, name),
        booking:bookings!booking_id(service_name)
      `)
      .eq('client_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (convsError) {
      logger.error('Error fetching conversations:', convsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des conversations' },
        { status: 500 }
      )
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
          .eq('sender_type', 'artisan')
          .is('read_at', null)

        return {
          id: conv.id,
          partner: conv.provider,
          lastMessage: lastMessages?.[0] || null,
          unreadCount: unreadCount || 0,
          service: (conv.booking as unknown as { service_name: string } | null)?.service_name || null,
        }
      })
    )

    return NextResponse.json({ conversations: conversationsWithMeta })
  } catch (error) {
    logger.error('Client Messages GET error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = sendMessageSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { conversation_id, provider_id, content } = result.data

    let resolvedConversationId = conversation_id

    if (!resolvedConversationId) {
      // Try to find existing conversation or create one
      if (!provider_id) {
        return NextResponse.json(
          { error: 'conversation_id ou provider_id requis' },
          { status: 400 }
        )
      }

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', user.id)
        .eq('provider_id', provider_id)
        .single()

      if (existingConv) {
        resolvedConversationId = existingConv.id
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ client_id: user.id, provider_id })
          .select('id')
          .single()

        if (convError || !newConv) {
          logger.error('Error creating conversation:', convError)
          return NextResponse.json(
            { error: 'Erreur lors de la création de la conversation' },
            { status: 500 }
          )
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
        return NextResponse.json(
          { error: 'Conversation non trouvée ou non autorisée' },
          { status: 403 }
        )
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
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    logger.error('Client Messages POST error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
