/**
 * Cron: Recalculate Data Quality Scores
 * Runs daily at 04:00 UTC (see vercel.json)
 *
 * Recalculates data_quality_score for providers whose data has changed
 * since their last score calculation. Uses batch SQL updates for efficiency.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const BATCH_SIZE = 500

/**
 * Calculate data quality score for a provider record (0-100).
 * Mirrors the formula in scripts/lib/data-quality.ts.
 */
function calculateQualityScore(provider: Record<string, unknown>): {
  score: number
  flags: string[]
} {
  let score = 0
  const flags: string[] = []

  // Identity (30 points)
  if (provider.name) score += 10; else flags.push('missing_name')
  if (provider.siren) score += 10; else flags.push('missing_siren')
  if (provider.siret) score += 10; else flags.push('missing_siret')

  // Address (25 points)
  if (provider.address_street) score += 5; else flags.push('missing_street')
  if (provider.address_city) score += 5; else flags.push('missing_city')
  if (provider.address_postal_code) score += 5; else flags.push('missing_postal_code')
  if (provider.address_department) score += 5; else flags.push('missing_department')
  if (provider.latitude && provider.longitude) score += 5; else flags.push('missing_gps')

  // Contact (15 points)
  if (provider.phone) score += 10; else flags.push('missing_phone')
  if (provider.email) score += 5; else flags.push('missing_email')

  // Business info (10 points)
  if (provider.specialty) score += 10; else flags.push('missing_specialty')

  // Extras (5 points)
  if (provider.description) score += 5

  return { score: Math.min(100, score), flags }
}

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()

    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('[Cron] Unauthorized access attempt to recalculate-quality')
      return NextResponse.json({ success: false, error: { message: 'Non autorisé' } }, { status: 401 })
    }

    logger.info('[Cron] Starting data quality score recalculation')

    let totalUpdated = 0
    let totalErrors = 0
    let offset = 0
    let hasMore = true

    while (hasMore) {
      // Fetch active providers for quality score calculation
      const { data: providers, error } = await supabase
        .from('attorneys')
        .select('id, name, siren, siret, address_street, address_city, address_postal_code, address_department, latitude, longitude, phone, email, specialty, description, updated_at')
        .eq('is_active', true)
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id')

      if (error) {
        logger.error('[Cron] Error fetching providers for quality recalc:', error)
        totalErrors++
        break
      }

      if (!providers || providers.length === 0) {
        hasMore = false
        break
      }

      // Process batch: calculate scores and persist to DB
      for (const provider of providers) {
        const { score, flags } = calculateQualityScore(provider)

        const { error: updateError } = await supabase
          .from('attorneys')
          .update({
            data_quality_score: score,
            data_quality_flags: flags,
          })
          .eq('id', provider.id)

        if (updateError) {
          logger.error(`[Cron] Failed to update quality score for provider ${provider.id}:`, updateError)
          totalErrors++
        } else {
          logger.info(`[Cron] Provider ${provider.id}: score=${score} flags=${flags.join(',')}`)
          totalUpdated++
        }
      }

      if (providers.length < BATCH_SIZE) {
        hasMore = false
      } else {
        offset += BATCH_SIZE
      }
    }

    logger.info(
      `[Cron] Data quality recalculation complete: ${totalUpdated} updated, ${totalErrors} errors`
    )

    return NextResponse.json({
      success: true,
      message: 'Data quality scores recalculated',
      updated: totalUpdated,
      errors: totalErrors,
    })
  } catch (error) {
    logger.error('[Cron] Error in recalculate-quality:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur lors du recalcul des scores de qualité' } },
      { status: 500 }
    )
  }
}
