/**
 * POST /api/notifications/:id/read — Mark a single notification as read
 * Private route, user can only mark their own notifications.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
})

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rawParams = await params
    const validation = paramsSchema.safeParse(rawParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.issues[0]?.message || 'Invalid input',
          },
        },
        { status: 400 }
      )
    }
    const { id } = validation.data
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // RLS ensures user can only update their own notifications
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Mark read error:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Server error' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Notification read POST error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
