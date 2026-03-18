import { NextResponse } from 'next/server'
import { createApiHandler } from '@/lib/api/handler'
import { apiLogger } from '@/lib/logger'
import { getCacheMetrics } from '@/lib/cache'

export const dynamic = 'force-dynamic'

type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy'
type CheckResult = { status: ServiceStatus; latency?: number; error?: string; details?: Record<string, unknown> }

// Critical env vars that MUST be set for the app to function
const CRITICAL_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const IMPORTANT_ENV_VARS = [
  'CRON_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'RESEND_API_KEY',
  'STRIPE_SECRET_KEY',
  'UPSTASH_REDIS_REST_URL',
] as const

/**
 * Health check — NEVER returns 500.
 * 200 = healthy or degraded (at least one service up)
 * 503 = unhealthy (any critical dependency is down)
 */
export const GET = createApiHandler(async () => {
  const startTime = Date.now()
  const checks: Record<string, CheckResult> = {}

  // ── Environment Variables ──
  const missingCritical: string[] = []
  const missingImportant: string[] = []

  for (const key of CRITICAL_ENV_VARS) {
    if (!process.env[key]) missingCritical.push(key)
  }
  for (const key of IMPORTANT_ENV_VARS) {
    if (!process.env[key]) missingImportant.push(key)
  }

  if (missingCritical.length > 0) {
    checks.environment = {
      status: 'unhealthy',
      error: `Missing critical env vars: ${missingCritical.join(', ')}`,
    }
  } else if (missingImportant.length > 0) {
    checks.environment = {
      status: 'degraded',
      error: `Missing optional env vars: ${missingImportant.join(', ')}`,
    }
  } else {
    checks.environment = { status: 'healthy' }
  }

  // ── Supabase Connectivity ──
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const dbStart = Date.now()
    const { count, error } = await supabase.from('states').select('*', { count: 'exact', head: true })
    const dbLatency = Date.now() - dbStart

    if (error) {
      checks.database = { status: 'unhealthy', latency: dbLatency, error: error.message }
    } else if (dbLatency > 5000) {
      checks.database = { status: 'degraded', latency: dbLatency, error: 'High latency (>5s)' }
    } else {
      checks.database = { status: 'healthy', latency: dbLatency, details: { statesCount: count } }
    }
  } catch (err: unknown) {
    checks.database = {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown database error',
    }
  }

  // ── Redis Connectivity (PING) ──
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl && redisToken) {
    try {
      const redisStart = Date.now()
      const res = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        signal: AbortSignal.timeout(3000),
        cache: 'no-store',
      })
      const redisLatency = Date.now() - redisStart

      if (res.ok) {
        const body = await res.json()
        const pong = body?.result === 'PONG'
        checks.redis = pong
          ? { status: 'healthy', latency: redisLatency }
          : { status: 'degraded', latency: redisLatency, error: `Unexpected PING response: ${body?.result}` }
      } else {
        checks.redis = { status: 'degraded', latency: redisLatency, error: `HTTP ${res.status}` }
      }
    } catch (err: unknown) {
      checks.redis = {
        status: 'degraded',
        error: err instanceof Error ? err.message : 'Redis unreachable',
      }
    }
  } else {
    checks.redis = { status: 'degraded', error: 'Redis not configured' }
  }

  // ── Stripe Config ──
  const stripeKey = process.env.STRIPE_SECRET_KEY
  checks.stripe = stripeKey
    ? { status: 'healthy' }
    : { status: 'degraded', error: 'Stripe keys not configured' }

  // ── Cache Metrics ──
  const cacheMetrics = getCacheMetrics()
  checks.cache = {
    status: 'healthy',
    details: {
      l1Size: cacheMetrics.l1.size,
      l1HitRate: `${cacheMetrics.l1.hitRate}%`,
      l2HitRate: `${cacheMetrics.l2.hitRate}%`,
      totalRequests: cacheMetrics.total.requests,
      evictions: cacheMetrics.l1.evictions,
    },
  }

  // ── Overall Status ──
  const statuses = Object.values(checks).map(c => c.status)
  // 503 if ANY critical dependency is unhealthy (database or environment)
  const criticalDown = checks.database?.status === 'unhealthy' || checks.environment?.status === 'unhealthy'
  const anyDegraded = statuses.some(s => s === 'degraded')
  const anyUnhealthy = statuses.some(s => s === 'unhealthy')

  let overallStatus: ServiceStatus = 'healthy'
  if (criticalDown) {
    overallStatus = 'unhealthy'
  } else if (anyUnhealthy || anyDegraded) {
    overallStatus = 'degraded'
  }

  const totalLatency = Date.now() - startTime

  if (overallStatus !== 'healthy') {
    apiLogger.warn('Health check degraded', { overallStatus, checks, totalLatency })
  }

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'

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
}, {})
