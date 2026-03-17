import { NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { isValidUuid } from '@/lib/sanitize'
import { pauseCampaign } from '@/lib/prospection/message-queue'

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

  if (campaign.status !== 'sending') {
    return NextResponse.json(
      { success: false, error: { message: 'Only campaigns currently sending can be paused' } },
      { status: 400 }
    )
  }

  await pauseCampaign(id)

  await logAdminAction(ctx.user!.id, 'campaign.pause', 'prospection_campaign', id)

  return NextResponse.json({ success: true })
}, { requireAdmin: true })
