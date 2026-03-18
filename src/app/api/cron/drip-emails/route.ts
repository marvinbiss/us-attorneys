/**
 * Cron: Drip Email Campaigns — US Attorneys
 *
 * Runs daily (recommended: 9 AM ET via Vercel cron or external scheduler).
 * Processes three campaign types:
 *   - trial_onboarding: Days 0, 1, 3, 7, 10, 13 after trial start
 *   - post_conversion:  Months 1, 2, 3 after paid subscription start
 *   - win_back:         Days 1, 7, 30 after churn
 *
 * Protected by CRON_SECRET Bearer token.
 * Idempotent: DB unique constraint prevents duplicate sends.
 */

import { NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { logger } from '@/lib/logger'
import {
  CAMPAIGNS,
  findTrialOnboardingEligible,
  findPostConversionEligible,
  findWinBackEligible,
  sendDripEmail,
  getAttorneyStats,
  type DripEmailData,
  type SendResult,
} from '@/lib/email/drip-campaigns'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 2 minutes — may process many attorneys

// ── Main handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Auth check
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: SendResult[] = []

  const stats = {
    trial_onboarding: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
    post_conversion: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
    win_back: { eligible: 0, sent: 0, skipped: 0, failed: 0 },
  }

  try {
    // ── 1. Trial Onboarding ───────────────────────────────────────────────

    const trialEligible = await findTrialOnboardingEligible()
    for (const [stepKey, attorneys] of Array.from(trialEligible.entries())) {
      const stepDef = CAMPAIGNS.trial_onboarding.find(s => s.step === stepKey)
      if (!stepDef) continue

      stats.trial_onboarding.eligible += attorneys.length

      for (const attorney of attorneys) {
        try {
          const attorneyStats = await getAttorneyStats(attorney.id)
          const data: DripEmailData = {
            attorneyId: attorney.id,
            attorneyName: attorney.name,
            attorneyEmail: attorney.email,
            profileViews: attorneyStats.profileViews,
            leadsCount: attorneyStats.leadsCount,
            leadsPerMonth: 12, // Platform average for social proof
          }

          const result = await sendDripEmail(attorney.id, 'trial_onboarding', stepDef, data)
          results.push(result)

          if (result.skipped) {
            stats.trial_onboarding.skipped++
          } else if (result.success) {
            stats.trial_onboarding.sent++
          } else {
            stats.trial_onboarding.failed++
          }
        } catch (err) {
          logger.error('[Cron:DripEmails] Error processing trial attorney', {
            attorneyId: attorney.id,
            step: stepKey,
            error: String(err),
          })
          stats.trial_onboarding.failed++
        }
      }
    }

    // ── 2. Post-Conversion ────────────────────────────────────────────────

    const conversionEligible = await findPostConversionEligible()
    for (const [stepKey, attorneys] of Array.from(conversionEligible.entries())) {
      const stepDef = CAMPAIGNS.post_conversion.find(s => s.step === stepKey)
      if (!stepDef) continue

      stats.post_conversion.eligible += attorneys.length

      for (const attorney of attorneys) {
        try {
          const attorneyStats = await getAttorneyStats(attorney.id)
          const data: DripEmailData = {
            attorneyId: attorney.id,
            attorneyName: attorney.name,
            attorneyEmail: attorney.email,
            profileViews: attorneyStats.profileViews,
            leadsCount: attorneyStats.leadsCount,
          }

          const result = await sendDripEmail(attorney.id, 'post_conversion', stepDef, data)
          results.push(result)

          if (result.skipped) {
            stats.post_conversion.skipped++
          } else if (result.success) {
            stats.post_conversion.sent++
          } else {
            stats.post_conversion.failed++
          }
        } catch (err) {
          logger.error('[Cron:DripEmails] Error processing converted attorney', {
            attorneyId: attorney.id,
            step: stepKey,
            error: String(err),
          })
          stats.post_conversion.failed++
        }
      }
    }

    // ── 3. Win-Back ───────────────────────────────────────────────────────

    const winBackEligible = await findWinBackEligible()
    for (const [stepKey, attorneys] of Array.from(winBackEligible.entries())) {
      const stepDef = CAMPAIGNS.win_back.find(s => s.step === stepKey)
      if (!stepDef) continue

      stats.win_back.eligible += attorneys.length

      for (const attorney of attorneys) {
        try {
          const attorneyStats = await getAttorneyStats(attorney.id)
          const data: DripEmailData = {
            attorneyId: attorney.id,
            attorneyName: attorney.name,
            attorneyEmail: attorney.email,
            profileViews: attorneyStats.profileViews,
            leadsCount: attorneyStats.leadsCount,
          }

          const result = await sendDripEmail(attorney.id, 'win_back', stepDef, data)
          results.push(result)

          if (result.skipped) {
            stats.win_back.skipped++
          } else if (result.success) {
            stats.win_back.sent++
          } else {
            stats.win_back.failed++
          }
        } catch (err) {
          logger.error('[Cron:DripEmails] Error processing churned attorney', {
            attorneyId: attorney.id,
            step: stepKey,
            error: String(err),
          })
          stats.win_back.failed++
        }
      }
    }

    const duration = Date.now() - startTime
    const totalSent = stats.trial_onboarding.sent + stats.post_conversion.sent + stats.win_back.sent
    const totalFailed = stats.trial_onboarding.failed + stats.post_conversion.failed + stats.win_back.failed

    logger.info('[Cron:DripEmails] Completed', {
      duration: `${duration}ms`,
      totalSent,
      totalFailed,
      stats,
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      totalSent,
      totalFailed,
      stats,
    })
  } catch (err) {
    logger.error('[Cron:DripEmails] Unexpected error', err instanceof Error ? err : new Error(String(err)))
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 },
    )
  }
}
