/**
 * /api/notifications — Unified Notification Center API
 *
 * GET    — List notifications for current user (paginated)
 * PATCH  — Mark as read (single or bulk)
 * DELETE — Delete notification(s)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const notifLogger = logger.child({ component: 'notifications-api' })

// ---------------------------------------------------------------------------
// GET — List notifications
// ---------------------------------------------------------------------------

const getQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  unread: z.enum(['true', 'false']).default('false'),
  type: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const url = request.nextUrl
    const parsed = getQuerySchema.safeParse({
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
      unread: url.searchParams.get('unread') ?? undefined,
      type: url.searchParams.get('type') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid query parameters' } }, { status: 400 })
    }

    const { limit, offset, unread, type } = parsed.data
    const unreadOnly = unread === 'true'

    let query = supabase
      .from('notifications')
      .select('id, type, title, message, body, link, read, read_at, metadata, data, created_at, expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: notifications, error } = await query

    if (error) {
      notifLogger.error('Notifications fetch error', error, { userId: user.id })
      return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
    }

    // Count unread
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      notifications: notifications ?? [],
      unreadCount: count ?? 0,
    })
  } catch (error: unknown) {
    notifLogger.error('Notifications GET error', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH — Mark as read (single or bulk)
// ---------------------------------------------------------------------------

const patchBodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
})

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const body = await request.json()
    const parsed = patchBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid body: ids[] required' } }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: now })
      .in('id', parsed.data.ids)
      .eq('user_id', user.id)

    if (error) {
      notifLogger.error('Bulk mark read error', error, { userId: user.id })
      return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    notifLogger.error('Notifications PATCH error', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — Delete notification(s)
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const url = request.nextUrl
    const id = url.searchParams.get('id')
    const deleteOld = url.searchParams.get('deleteOld') === 'true'

    if (deleteOld) {
      // Delete all read notifications for this user
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('read', true)

      if (error) {
        notifLogger.error('Delete old read error', error, { userId: user.id })
        return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Missing id parameter' } }, { status: 400 })
    }

    // RLS ensures user can only delete their own
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      notifLogger.error('Delete notification error', error, { userId: user.id, notificationId: id })
      return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    notifLogger.error('Notifications DELETE error', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
