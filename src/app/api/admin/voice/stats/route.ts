import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ request }) => {
  const authResult = await requirePermission('prospection', 'read')
  if (!authResult.success) return authResult.error!

  const supabase = createAdminClient()
  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  // Get daily stats
  let statsQuery = supabase
    .from('voice_stats_daily')
    .select('*')
    .order('date', { ascending: false })
    .limit(30)

  if (from) statsQuery = statsQuery.gte('date', from)
  if (to) statsQuery = statsQuery.lte('date', to)

  const { data: dailyStats } = await statsQuery

  // Get real-time totals from voice_calls
  const [totalResult, scoreAResult, scoreBResult, scoreCResult, disqualifiedResult] = await Promise.all([
    supabase.from('voice_calls').select('*', { count: 'exact', head: true }),
    supabase.from('voice_calls').select('*', { count: 'exact', head: true }).eq('qualification_score', 'A'),
    supabase.from('voice_calls').select('*', { count: 'exact', head: true }).eq('qualification_score', 'B'),
    supabase.from('voice_calls').select('*', { count: 'exact', head: true }).eq('qualification_score', 'C'),
    supabase.from('voice_calls').select('*', { count: 'exact', head: true }).eq('qualification_score', 'disqualified'),
  ])

  const totalCalls = totalResult.count || 0
  const qualifiedA = scoreAResult.count || 0
  const qualifiedB = scoreBResult.count || 0
  const qualifiedC = scoreCResult.count || 0
  const disqualifiedCount = disqualifiedResult.count || 0

  return NextResponse.json({
    success: true,
    data: {
      totals: {
        total_calls: totalCalls,
        qualified_a: qualifiedA,
        qualified_b: qualifiedB,
        qualified_c: qualifiedC,
        disqualified: disqualifiedCount,
        qualification_rate: totalCalls
          ? Math.round((qualifiedA + qualifiedB + qualifiedC) / totalCalls * 100)
          : 0,
      },
      daily: dailyStats || [],
    },
  })
})
