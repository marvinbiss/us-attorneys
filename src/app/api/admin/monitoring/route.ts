/**
 * Admin Monitoring Dashboard API
 *
 * Aggregates system health, cache metrics, recent errors, and cron status
 * into a single JSON endpoint for a future monitoring dashboard UI.
 *
 * Requires admin authentication.
 */

import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { getCacheMetrics, getCacheStats } from '@/lib/cache'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Admin auth check
  const authResult = await requirePermission('system' as never, 'read')
  if (!authResult.success) {
    return authResult.error
  }

  const startTime = Date.now()

  try {
    // ── 1. Cache Metrics ──
    const cacheMetrics = getCacheMetrics()
    const cacheStats = getCacheStats()

    // ── 2. Database Stats ──
    let dbStats: Record<string, unknown> = {}
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const [attorneys, locations, specialties, reviews] = await Promise.all([
        supabase.from('attorneys').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('locations_us').select('*', { count: 'exact', head: true }),
        supabase.from('specialties').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
      ])

      dbStats = {
        activeAttorneys: attorneys.count ?? 0,
        locations: locations.count ?? 0,
        activeSpecialties: specialties.count ?? 0,
        reviews: reviews.count ?? 0,
      }
    } catch (err) {
      dbStats = { error: err instanceof Error ? err.message : 'Failed to query database' }
    }

    // ── 3. Health Check (internal call) ──
    let healthStatus: Record<string, unknown> = {}
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const healthRes = await fetch(`${siteUrl}/api/health`, {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      })
      healthStatus = await healthRes.json()
    } catch {
      healthStatus = { status: 'unknown', error: 'Could not reach health endpoint' }
    }

    // ── 4. Environment Info ──
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasSlackWebhook: !!process.env.SLACK_WEBHOOK_URL,
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasAlertEmail: !!(process.env.ALERT_EMAIL || process.env.ADMIN_EMAILS),
      hasSentryDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      hasStripe: !!process.env.STRIPE_SECRET_KEY,
      hasCronSecret: !!process.env.CRON_SECRET,
    }

    // ── 5. Runtime Info ──
    const runtime = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime,
      cache: {
        metrics: cacheMetrics,
        l1Keys: cacheStats.keys.length,
        l1TopKeys: cacheStats.keys.slice(0, 20),
      },
      database: dbStats,
      health: healthStatus,
      environment: envInfo,
      runtime,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error: unknown) {
    logger.error('[Admin][Monitoring] Error building monitoring report', error as Error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate monitoring report' } },
      { status: 500 }
    )
  }
}
