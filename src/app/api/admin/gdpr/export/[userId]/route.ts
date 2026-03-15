import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'

// POST - Export user data (GDPR)
export async function POST(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate userId parameter
    if (!isValidUuid(params.userId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    // Verify admin with users:read permission (GDPR export)
    const authResult = await requirePermission('users', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()
    const userId = params.userId

    // Retrieve all user data
    const [
      { data: profile },
      { data: bookings },
      { data: reviews },
    ] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, is_admin, role, phone_e164, average_rating, review_count').eq('id', userId).single(),
      supabase.from('bookings').select('id, attorney_id, client_id, status, scheduled_date, notes, created_at').or(`attorney_id.eq.${userId},client_id.eq.${userId}`),
      supabase.from('reviews').select('id, booking_id, attorney_id, client_name, client_email, rating, comment, status, created_at').eq('attorney_id', userId),
    ])

    const exportData = {
      profile,
      bookings: bookings || [],
      reviews: reviews || [],
      // La table conversations n'est pas disponible dans ce contexte d'export.
      conversations: null,
      _note: 'Conversation data not available in this export',
      exportedAt: new Date().toISOString(),
      exportedBy: authResult.admin.id,
    }

    // Log d'audit
    await logAdminAction(authResult.admin.id, 'gdpr.export', 'user', userId)

    return NextResponse.json({
      success: true,
      data: exportData,
      message: 'GDPR export generated',
    })
  } catch (error) {
    logger.error('Admin GDPR export error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
