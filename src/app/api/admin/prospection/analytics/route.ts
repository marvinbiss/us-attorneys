import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { getOverviewStats, getChannelPerformance } from '@/lib/prospection/analytics'
import { z } from 'zod'

const querySchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const rawParams = {
      date_from: request.nextUrl.searchParams.get('date_from') || undefined,
      date_to: request.nextUrl.searchParams.get('date_to') || undefined,
    }

    const parsed = querySchema.safeParse(rawParams)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid date parameters', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const dateFrom = parsed.data.date_from
    const dateTo = parsed.data.date_to

    const [overview, channelPerf] = await Promise.all([
      getOverviewStats(dateFrom, dateTo),
      getChannelPerformance(dateFrom, dateTo),
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview,
        channels: channelPerf,
      },
    })
  } catch (error) {
    logger.error('Analytics error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
