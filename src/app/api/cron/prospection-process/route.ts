import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processBatch, reconcileOrphanedMessages } from '@/lib/prospection/message-queue'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

/**
 * Cron Job: Process prospection campaign batches
 * Runs every 2 minutes via Vercel Cron
 * Picks up active campaigns and sends the next batch of queued messages
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (timing-safe comparison)
    if (!verifyCronSecret(request.headers.get('authorization'))) {
      logger.warn('[Cron] Unauthorized access to prospection-process')
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
    }

    const supabase = createAdminClient()

    // 1. Reconcile orphaned messages (stuck in 'sending' for > 10 min)
    const reconciled = await reconcileOrphanedMessages(supabase)

    // 2. Find active campaigns (status = 'sending')
    const { data: campaigns, error } = await supabase
      .from('prospection_campaigns')
      .select('id, name, batch_size')
      .eq('status', 'sending')

    if (error) {
      logger.error('[Cron] Error fetching active campaigns', error)
      return NextResponse.json({ success: false, error: { message: 'Database error' } }, { status: 500 })
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        data: { campaigns_processed: 0, reconciled },
      })
    }

    // 3. Process one batch per active campaign
    const results = []
    for (const campaign of campaigns) {
      try {
        const batchResult = await processBatch(campaign.id, campaign.batch_size || 100)
        results.push({ campaign_id: campaign.id, name: campaign.name, ...batchResult })
      } catch (err: unknown) {
        logger.error(`[Cron] Error processing campaign ${campaign.id}`, err as Error)
        results.push({ campaign_id: campaign.id, name: campaign.name, error: 'processing_failed' })
      }
    }

    return NextResponse.json({
      success: true,
      data: { campaigns_processed: results.length, reconciled, results },
    })
  } catch (error: unknown) {
    logger.error('[Cron] prospection-process error', error as Error)
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}
