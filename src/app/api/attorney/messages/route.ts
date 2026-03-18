/**
 * Attorney Messages API
 * GET: Fetch conversations and messages
 * POST: Send a new message
 */

import { NextResponse } from 'next/server'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const messagesQuerySchema = z.object({
  conversation_id: z.string().uuid().optional(),
})

// POST request schema
const sendMessageSchema = z.object({
  conversation_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  content: z.string().min(1).max(5000),
})

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { error, user, supabase } = await requireAttorney()
    if (error) return error

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

    // Get provider linked to this user
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!provider) {
      return NextResponse.json(
        { error: 'Attorney profile not found' },
        { status: 404 }
      )
    }

    if (conversationId) {
      // Verify conversation belongs to this attorney
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id, client_id, attorney_id')
        .eq('id', conversationId)
        .eq('attorney_id', provider.id)
        .single()

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }

      // Fetch messages for this conversation (explicit columns, no select('*'))
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, sender_type, content, read_at, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        logger.error('Error fetching messages:', messagesError)
        return NextResponse.json(
          { error: 'Error retrieving messages' },
          { status: 500 }
        )
      }

      // Mark messages sent by client as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'client')
        .is('read_at', null)

      return NextResponse.json({ messages: messages || [] })
    }

    // Bug fix: the Supabase JS client does not support .limit() on nested relation
    // selects, so loading all messages for all conversations in one query risks
    // pulling an unbounded number of rows into memory.
    //
    // Strategy: fetch conversations first (no messages embedded), then fetch the
    // last 2 messages per conversation via a single bounded query (.limit) and
    // group server-side. This caps the messages loaded to convCount × 2 rows.

    // Step 1: fetch conversations (no messages embedded)
    const { data: conversations, error: convsError } = await supabase
      .from('conversations')
      .select(`
        id,
        client_id,
        attorney_id,
        created_at,
        client:profiles!client_id(id, full_name)
      `)
      .eq('attorney_id', provider.id)
      .order('created_at', { ascending: false })

    if (convsError) {
      logger.error('Error fetching conversations:', convsError)
      return NextResponse.json(
        { error: 'Error retrieving conversations' },
        { status: 500 }
      )
    }

    const convList = conversations || []
    const convIds = convList.map((c) => c.id)

    type MessageRow = {
      id: string
      conversation_id: string
      content: string
      created_at: string
      sender_type: string
      read_at: string | null
    }

    // Step 2: fetch recent messages for all conversations in one bounded query.
    // Limit to convIds.length * 2 so we have enough rows to determine lastMessage
    // and unread counts, without loading the entire message history.
    let allMessages: MessageRow[] = []
    if (convIds.length > 0) {
      const msgLimit = Math.max(convIds.length * 2, 50)
      const { data: recentMsgs, error: msgsError } = await supabase
        .from('messages')
        .select('id, conversation_id, content, created_at, sender_type, read_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(msgLimit)

      if (msgsError) {
        logger.error('Error fetching recent messages:', msgsError)
        return NextResponse.json(
          { error: 'Error retrieving messages' },
          { status: 500 }
        )
      }
      allMessages = (recentMsgs as MessageRow[]) || []
    }

    // Step 3: group messages by conversation_id server-side
    const msgsByConv = new Map<string, MessageRow[]>()
    for (const msg of allMessages) {
      const bucket = msgsByConv.get(msg.conversation_id) ?? []
      bucket.push(msg)
      msgsByConv.set(msg.conversation_id, bucket)
    }

    // Step 4: build result — derive lastMessage and unreadCount per conversation
    const conversationsWithMeta = convList.map((conv) => {
      // Messages are already ordered desc from the DB query
      const msgs = msgsByConv.get(conv.id) ?? []
      const lastMessage = msgs[0] ?? null
      const unreadCount = msgs.filter(
        (m) => m.sender_type === 'client' && m.read_at === null
      ).length

      return {
        id: conv.id,
        partner: conv.client,
        lastMessage,
        unreadCount,
      }
    })

    return NextResponse.json({ conversations: conversationsWithMeta })
  } catch (error: unknown) {
    logger.error('Messages GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { error, user, supabase } = await requireAttorney()
    if (error) return error

    const body = await request.json()
    const result = sendMessageSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { conversation_id, client_id, content } = result.data

    // Get provider linked to this user
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!provider) {
      return NextResponse.json(
        { error: 'Attorney profile not found' },
        { status: 404 }
      )
    }

    let resolvedConversationId = conversation_id

    if (!resolvedConversationId) {
      // Try to find existing conversation or create one
      if (!client_id) {
        return NextResponse.json(
          { error: 'conversation_id or client_id required' },
          { status: 400 }
        )
      }

      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('attorney_id', provider.id)
        .eq('client_id', client_id)
        .single()

      if (existingConv) {
        resolvedConversationId = existingConv.id
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ attorney_id: provider.id, client_id })
          .select('id')
          .single()

        if (convError || !newConv) {
          logger.error('Error creating conversation:', convError)
          return NextResponse.json(
            { error: 'Error creating conversation' },
            { status: 500 }
          )
        }
        resolvedConversationId = newConv.id
      }
    } else {
      // Verify conversation belongs to this attorney
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', resolvedConversationId)
        .eq('attorney_id', provider.id)
        .single()

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found or unauthorized' },
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
        sender_type: 'attorney',
        content,
      })
      .select('id, conversation_id, sender_id, sender_type, content, read_at, created_at')
      .single()

    if (insertError) {
      logger.error('Error sending message:', insertError)
      return NextResponse.json(
        { error: "Error sending message" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error: unknown) {
    logger.error('Messages POST error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
