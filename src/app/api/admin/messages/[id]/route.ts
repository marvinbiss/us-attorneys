import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['active', 'archived', 'blocked']),
})

export const dynamic = 'force-dynamic'

// PATCH - Update conversation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('users', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const { id } = await params
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid conversation ID' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const result = updateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid status', details: result.error.flatten() } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { status } = result.data

    const { error } = await supabase
      .from('conversations')
      .update({ status })
      .eq('id', id)

    if (error) {
      logger.warn('Conversation update failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Error updating conversation' } },
        { status: 502 }
      )
    }

    await logAdminAction(authResult.admin.id, `conversation.${status}`, 'conversation', id)

    return NextResponse.json({
      success: true,
      message: status === 'archived' ? 'Conversation archived' : 'Conversation blocked',
    })
  } catch (error) {
    logger.error('Admin conversation update error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
