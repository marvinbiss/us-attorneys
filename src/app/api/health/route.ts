import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy'
type CheckResult = { status: ServiceStatus; latency?: number; error?: string }

/**
 * Health check — NEVER returns 500.
 * 200 = healthy or degraded (at least one service up)
 * 503 = unhealthy (ALL services down)
 */
export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, CheckResult> = {}

  // Lazy-import env to catch Zod errors instead of crashing the module
  let env: Record<string, string | undefined> | null = null
  try {
    env = (await import('@/lib/env')).env as unknown as Record<string, string | undefined>
    checks.environment = { status: 'healthy' }
  } catch (err) {
    checks.environment = {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Env validation failed',
    }
  }

  // Check Supabase
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const dbStart = Date.now()
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    const dbLatency = Date.now() - dbStart

    if (error) {
      checks.database = { status: 'unhealthy', latency: dbLatency, error: error.message }
    } else if (dbLatency > 5000) {
      checks.database = { status: 'degraded', latency: dbLatency, error: 'High latency' }
    } else {
      checks.database = { status: 'healthy', latency: dbLatency }
    }
  } catch (err) {
    checks.database = {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown database error',
    }
  }

  // Check Stripe (config only)
  const stripeKey = env?.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY
  checks.stripe = stripeKey
    ? { status: 'healthy' }
    : { status: 'degraded', error: 'Stripe keys not configured' }

  // Check Redis (optional)
  const redisUrl = env?.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const redisToken = env?.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl) {
    try {
      const redisStart = Date.now()
      const res = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        signal: AbortSignal.timeout(3000),
      })
      const redisLatency = Date.now() - redisStart
      checks.redis = res.ok
        ? { status: 'healthy', latency: redisLatency }
        : { status: 'degraded', error: `HTTP ${res.status}`, latency: redisLatency }
    } catch (err) {
      checks.redis = {
        status: 'degraded',
        error: err instanceof Error ? err.message : 'Redis unreachable',
      }
    }
  }

  // Overall status
  const statuses = Object.values(checks).map(c => c.status)
  const allUnhealthy = statuses.length > 0 && statuses.every(s => s === 'unhealthy')
  const anyUnhealthy = statuses.some(s => s === 'unhealthy')
  const anyDegraded = statuses.some(s => s === 'degraded')

  let overallStatus: ServiceStatus = 'healthy'
  if (allUnhealthy) {
    overallStatus = 'unhealthy'
  } else if (anyUnhealthy || anyDegraded) {
    overallStatus = 'degraded'
  }

  const totalLatency = Date.now() - startTime

  if (overallStatus !== 'healthy') {
    logger.warn('Health check degraded', { overallStatus, checks, totalLatency })
  }

  const appVersion = env?.NEXT_PUBLIC_APP_VERSION ?? process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: appVersion,
    uptime: process.uptime(),
    latency: totalLatency,
    checks,
  }, {
    status: overallStatus === 'unhealthy' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
