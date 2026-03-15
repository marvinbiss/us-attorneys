import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { enqueueCampaignMessages, processBatch } from '@/lib/prospection/message-queue'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'send')
    if (!authResult.success || !authResult.admin) return authResult.error

    const { id } = await params
    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data: campaign } = await supabase.from('prospection_campaigns').select('id, status').eq('id', id).single()
    if (!campaign) {
      return NextResponse.json({ success: false, error: { message: 'Campaign not found' } }, { status: 404 })
    }

    if (!['draft', 'scheduled'].includes(campaign.status)) {
      return NextResponse.json(
        { success: false, error: { message: `Cannot send a campaign with status "${campaign.status}"` } },
        { status: 400 }
      )
    }

    // Enqueue the messages
    const enqueueResult = await enqueueCampaignMessages(id)

    // Launch the first batch (the rest will be processed by cron or polling)
    const batchResult = await processBatch(id, 100)

    await logAdminAction(authResult.admin.id, 'campaign.send', 'prospection_campaign', id, {
      enqueued: enqueueResult.enqueued,
      skipped: enqueueResult.skipped,
    })

    return NextResponse.json({
      success: true,
      data: {
        enqueued: enqueueResult.enqueued,
        skipped: enqueueResult.skipped,
        first_batch: batchResult,
      },
    })
  } catch (error) {
    logger.error('Send campaign error', error as Error)
    return NextResponse.json(
      { success: false, error: { message: (error as Error).message || 'Server error' } },
      { status: 500 }
    )
  }
}
