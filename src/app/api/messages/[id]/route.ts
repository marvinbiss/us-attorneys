/**
 * Message API - Edit and Delete
 * PATCH: Edit a message
 * DELETE: Soft delete a message
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const editMessageSchema = z.object({
  content: z.string().min(1).max(5000),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const body = await request.json()
    const parsed = editMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    // Update message (RLS will verify ownership)
    const { data, error } = await supabase
      .from('messages')
      .update({
        content: parsed.data.content,
      })
      .eq('id', id)
      .eq('sender_id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Error editing message', error)
      return NextResponse.json(
        { success: false, error: { message: 'Impossible de modifier le message' } },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: { message: 'Message not found or unauthorized' } },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Edit message error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    // Hard delete message (RLS will verify ownership)
    // Note: deleted_at column was removed in migration 102, using hard delete
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('sender_id', user.id)

    if (error) {
      logger.error('Error deleting message', error)
      return NextResponse.json(
        { success: false, error: { message: 'Impossible de supprimer le message' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Delete message error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
