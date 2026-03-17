import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Yesterday's date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  const dayStart = `${dateStr}T00:00:00.000Z`
  const dayEnd = `${dateStr}T23:59:59.999Z`

  // Fetch all calls from yesterday
  const { data: calls } = await supabase
    .from('voice_calls')
    .select('status, duration_seconds, qualification_score, vapi_cost, lead_id')
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd)

  if (!calls || calls.length === 0) {
    logger.info('voice-stats: no calls yesterday', { date: dateStr })
    return NextResponse.json({ success: true, data: { date: dateStr, total: 0 } })
  }

  const completed = calls.filter(c => c.status === 'completed')
  const durations = completed.map(c => c.duration_seconds || 0)
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

  const stats = {
    date: dateStr,
    total_calls: calls.length,
    completed_calls: completed.length,
    avg_duration_seconds: avgDuration,
    qualified_a: calls.filter(c => c.qualification_score === 'A').length,
    qualified_b: calls.filter(c => c.qualification_score === 'B').length,
    qualified_c: calls.filter(c => c.qualification_score === 'C').length,
    disqualified: calls.filter(c => c.qualification_score === 'disqualified').length,
    leads_created: calls.filter(c => c.lead_id !== null).length,
    leads_dispatched: 0, // Would need to join with lead_assignments
    total_revenue: 0, // Calculated later when leads are sold
    total_vapi_cost: calls.reduce((sum, c) => sum + (Number(c.vapi_cost) || 0), 0),
  }

  // Upsert into voice_stats_daily
  const { error } = await supabase
    .from('voice_stats_daily')
    .upsert(stats, { onConflict: 'date' })

  if (error) {
    logger.error('voice-stats: upsert error', { error })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  logger.info('voice-stats completed', { date: dateStr, total: stats.total_calls, qualified: stats.qualified_a + stats.qualified_b })

  return NextResponse.json({ success: true, data: stats })
}
