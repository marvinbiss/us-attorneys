/**
 * GET /api/notifications — Fetch current user's in-app notifications
 * Private route, no public access. Read-only for client.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unread: z.enum(['true', 'false']).default('false'),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const url = request.nextUrl
    const parsed = notificationsQuerySchema.safeParse({
      limit: url.searchParams.get('limit') ?? undefined,
      unread: url.searchParams.get('unread') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid data' } }, { status: 400 })
    }

    const limit = parsed.data.limit
    const unreadOnly = parsed.data.unread === 'true'

    let query = supabase
      .from('notifications')
      .select('id, type, title, message, link, read, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      logger.error('Notifications fetch error:', error)
      return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
    }

    // Count unread
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: count || 0,
    })
  } catch (error) {
    logger.error('Notifications GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
