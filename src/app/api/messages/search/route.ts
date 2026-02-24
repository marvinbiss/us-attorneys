/**
 * Message Search API
 * GET: Full-text search in conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const searchSchema = z.object({
  conversation_id: z.string().uuid(),
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Non autorisé' } }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      conversation_id: searchParams.get('conversation_id'),
      q: searchParams.get('q'),
      limit: searchParams.get('limit') || '20',
    }

    const parsed = searchSchema.safeParse(queryParams)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Paramètres invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { conversation_id, q, limit } = parsed.data

    // Verify user has access to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { message: 'Conversation non trouvée ou non autorisée' } },
        { status: 404 }
      )
    }

    // Search in message content using ilike (dropped columns: edited_at, deleted_at, reply_to_message_id, rich_content, search_vector)
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, sender_type, content, message_type, file_url, file_name, file_size, read_at, created_at')
      .eq('conversation_id', conversation_id)
      .ilike('content', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Message search error', error)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de recherche' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      results: messages,
      query: q,
      total: messages.length,
    })
  } catch (error) {
    logger.error('Search error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
