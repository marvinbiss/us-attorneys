import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { resumeCampaign } from '@/lib/prospection/message-queue'

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

    if (campaign.status !== 'paused') {
      return NextResponse.json(
        { success: false, error: { message: 'Only paused campaigns can be resumed' } },
        { status: 400 }
      )
    }

    await resumeCampaign(id)

    await logAdminAction(authResult.admin.id, 'campaign.resume', 'prospection_campaign', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Resume campaign error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
