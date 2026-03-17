import { NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { isValidUuid } from '@/lib/sanitize'
import { enqueueCampaignMessages, processBatch } from '@/lib/prospection/message-queue'

export const dynamic = 'force-dynamic'

export const POST = createApiHandler(async (ctx) => {
  const id = ctx.params?.id
  if (!id || !isValidUuid(id)) {
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

  await logAdminAction(ctx.user!.id, 'campaign.send', 'prospection_campaign', id, {
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
}, { requireAdmin: true })
