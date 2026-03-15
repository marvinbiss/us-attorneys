/**
 * Message Read Receipt API
 * POST: Mark message as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    // Verify user has access to the conversation
    const { data: message } = await supabase
      .from('messages')
      .select('conversation_id, sender_id')
      .eq('id', messageId)
      .single()

    if (!message) {
      return NextResponse.json(
        { success: false, error: { message: 'Message not found' } },
        { status: 404 }
      )
    }

    // Don't mark own messages as read
    if (message.sender_id === user.id) {
      return NextResponse.json({ success: true, own_message: true })
    }

    // Mark message as read by updating read_at on messages table
    // (message_read_receipts table was dropped in migration 100)
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('read_at', null)

    if (error) {
      logger.error('Error marking message as read', error)
      return NextResponse.json(
        { success: false, error: { message: 'Unable to mark as read' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Mark as read error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
