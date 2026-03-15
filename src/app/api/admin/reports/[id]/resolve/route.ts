import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// POST request schema
const resolveReportSchema = z.object({
  action: z.enum(['resolve', 'dismiss']),
  resolution: z.string().max(1000).optional(),
})

export const dynamic = 'force-dynamic'

// POST - Resolve or reject a report
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin with reviews:write permission
    const authResult = await requirePermission('reviews', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const result = resolveReportSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { action, resolution } = result.data

    const newStatus = action === 'resolve' ? 'reviewed' : 'dismissed'

    const { data, error } = await supabase
      .from('user_reports')
      .update({
        status: newStatus,
        reviewed_by: authResult.admin.id,
        resolution: resolution || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      logger.error('Report resolve failed', { code: error.code, message: error.message })
      return NextResponse.json(
        { success: false, error: { message: 'Impossible de traiter le signalement' } },
        { status: 500 }
      )
    }

    // Log d'audit
    await logAdminAction(
      authResult.admin.id,
      `report.${action}`,
      'report',
      params.id,
      { status: newStatus, resolution }
    )

    return NextResponse.json({
      success: true,
      report: data,
      message: action === 'resolve' ? 'Report resolved' : 'Report rejected',
    })
  } catch (error) {
    logger.error('Admin report resolve error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
