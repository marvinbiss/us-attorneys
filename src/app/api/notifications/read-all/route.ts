/**
 * POST /api/notifications/read-all — Mark all notifications as read
 * Private route, user can only mark their own notifications.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Non authentifié' } }, { status: 401 })
    }

    // RLS ensures user can only update their own notifications
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      logger.error('Mark all read error:', error)
      return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Read-all POST error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
