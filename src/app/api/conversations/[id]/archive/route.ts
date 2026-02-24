/**
 * Conversation Archive API
 * POST: Archive/unarchive conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const archiveSchema = z.object({
  is_archived: z.boolean(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Non autorisé' } }, { status: 401 })
    }

    const body = await request.json()
    const parsed = archiveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Données invalides' } },
        { status: 400 }
      )
    }

    // Verify user has access to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { message: 'Conversation non trouvée' } },
        { status: 404 }
      )
    }

    // Update conversation status (conversation_settings table removed in migration 100)
    const newStatus = parsed.data.is_archived ? 'archived' : 'active'
    const { data, error } = await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('id', conversationId)
      .select('id, status')
      .single()

    if (error) {
      logger.error('Archive conversation error', error)
      return NextResponse.json(
        { success: false, error: { message: 'Impossible d\'archiver la conversation' } },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Archive error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
