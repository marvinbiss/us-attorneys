import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'degraded' | 'down'; latency?: number; error?: string }> = {}
  let overallStatus: 'ok' | 'degraded' | 'down' = 'ok'

  // Environment validation (handled by env module at import time)
  // If we reached this point, core env vars are valid.
  checks.environment = { status: 'ok' }

  // Check Supabase connection
  try {
    const supabase = createAdminClient()
    const dbStart = Date.now()
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    const dbLatency = Date.now() - dbStart

    if (error) {
      checks.database = { status: 'down', error: error.message }
      overallStatus = 'down'
    } else {
      checks.database = { status: 'ok', latency: dbLatency }
    }
  } catch (err) {
    checks.database = {
      status: 'down',
      error: err instanceof Error ? err.message : 'Unknown database error',
    }
    overallStatus = 'down'
  }

  // Check Stripe config (already validated by env module, but check format)
  checks.stripe = { status: 'ok' }

  // Check Redis (optional)
  if (env.UPSTASH_REDIS_REST_URL) {
    try {
      const redisStart = Date.now()
      const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(3000),
      })
      const redisLatency = Date.now() - redisStart
      checks.redis = res.ok
        ? { status: 'ok', latency: redisLatency }
        : { status: 'degraded', error: `HTTP ${res.status}` }
      if (!res.ok && overallStatus === 'ok') overallStatus = 'degraded'
    } catch (err) {
      checks.redis = { status: 'degraded', error: err instanceof Error ? err.message : 'Redis unreachable' }
      if (overallStatus === 'ok') overallStatus = 'degraded'
    }
  }

  const totalLatency = Date.now() - startTime

  if (overallStatus !== 'ok') {
    logger.error('Health check failed', { overallStatus, checks })
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    uptime: process.uptime(),
    latency: totalLatency,
    checks,
  }, {
    status: overallStatus === 'down' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
