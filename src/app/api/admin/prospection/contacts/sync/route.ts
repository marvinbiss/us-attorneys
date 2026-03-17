import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { syncAttorneysFromDatabase } from '@/lib/prospection/import-service'
import { z } from 'zod'

const syncSchema = z.object({
  department: z.string().max(10).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'write')
    if (!authResult.success || !authResult.admin) return authResult.error

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      rawBody = {}
    }

    const parsed = syncSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid data' } }, { status: 400 })
    }

    const department = parsed.data.department

    const result = await syncAttorneysFromDatabase({ department })

    await logAdminAction(authResult.admin.id, 'contact.sync', 'prospection_contact', 'bulk', {
      department: department || 'all',
      result,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Sync attorneys error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
