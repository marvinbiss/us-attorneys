import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { getCampaignStats } from '@/lib/prospection/analytics'
import { getQueueStats } from '@/lib/prospection/message-queue'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const [stats, queueStats] = await Promise.all([
      getCampaignStats(id),
      getQueueStats(id),
    ])

    return NextResponse.json({
      success: true,
      data: { ...stats, queue: queueStats },
    })
  } catch (error) {
    logger.error('Campaign stats error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
