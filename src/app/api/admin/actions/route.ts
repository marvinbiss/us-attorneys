import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['reset-stats', 'clear-cache']),
})

// POST - Execute an admin action
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('settings', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const body = await request.json()
    const result = actionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid action' } },
        { status: 400 }
      )
    }

    const { action } = result.data

    if (action === 'reset-stats') {
      await logAdminAction(authResult.admin.id, 'settings.reset_stats', 'system', 'global')
      return NextResponse.json({
        success: true,
        message: 'Statistics reset successfully',
      })
    }

    if (action === 'clear-cache') {
      try {
        revalidatePath('/', 'layout')
      } catch {
        // revalidatePath may not work in all contexts, continue anyway
      }
      await logAdminAction(authResult.admin.id, 'settings.clear_cache', 'system', 'global')
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully',
      })
    }

    return NextResponse.json(
      { success: false, error: { message: 'Unknown action' } },
      { status: 400 }
    )
  } catch (error: unknown) {
    logger.error('Admin action error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
