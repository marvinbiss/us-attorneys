import { NextResponse } from 'next/server'
import { logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { isValidUuid } from '@/lib/sanitize'
import { resumeCampaign } from '@/lib/prospection/message-queue'

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

  if (campaign.status !== 'paused') {
    return NextResponse.json(
      { success: false, error: { message: 'Only paused campaigns can be resumed' } },
      { status: 400 }
    )
  }

  await resumeCampaign(id)

  await logAdminAction(ctx.user!.id, 'campaign.resume', 'prospection_campaign', id)

  return NextResponse.json({ success: true })
}, { requireAdmin: true })
