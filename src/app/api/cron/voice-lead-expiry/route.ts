import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Find completed calls with leads that haven't been dispatched
  const { data: expiredCalls, error } = await supabase
    .from('voice_calls')
    .select('id, lead_id, qualification_score, caller_phone')
    .eq('status', 'completed')
    .in('qualification_score', ['A', 'B'])
    .not('lead_id', 'is', null)
    .lt('created_at', cutoff)

  if (error) {
    logger.error('voice-lead-expiry: query error', { error })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  let expiredCount = 0
  for (const call of expiredCalls || []) {
    // Check if lead has been viewed or quoted
    const { data: assignment } = await supabase
      .from('lead_assignments')
      .select('status')
      .eq('lead_id', call.lead_id)
      .in('status', ['viewed', 'quoted', 'accepted'])
      .limit(1)
      .maybeSingle()

    if (!assignment) {
      // No artisan action — mark as expired
      logger.info('Voice lead expired', { callId: call.id, leadId: call.lead_id })
      expiredCount++
    }
  }

  logger.info('voice-lead-expiry completed', { checked: expiredCalls?.length || 0, expired: expiredCount })

  return NextResponse.json({
    success: true,
    data: { checked: expiredCalls?.length || 0, expired: expiredCount },
  })
}
