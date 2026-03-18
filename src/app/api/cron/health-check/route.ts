/**
 * Cron: Health Check Monitoring
 * Runs every 5 minutes via Vercel cron (see vercel.json).
 *
 * Checks:
 * 1. DB connectivity — simple query to `states` table
 * 2. Critical tables accessible — attorneys, specialties, locations_us
 * 3. Health endpoint responds
 * 4. Key API routes return 200
 *
 * Logs structured results and sends alerts on degradation.
 * Must complete within Vercel's 60s function timeout.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/cron-auth'
import { sendAlert } from '@/lib/monitoring/alerts'
import { SITE_URL } from '@/lib/seo/config'
import { validateFetchUrl } from '@/lib/url-validation'

export const dynamic = 'force-dynamic'

type CheckStatus = 'pass' | 'fail' | 'warn'

interface HealthCheck {
  name: string
  status: CheckStatus
  latencyMs: number
  details?: string
}

/**
 * Check DB connectivity by querying a lightweight table.
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('states')
      .select('*', { count: 'exact', head: true })

    const latencyMs = Date.now() - start

    if (error) {
      return { name: 'database', status: 'fail', latencyMs, details: error.message }
    }
    if (latencyMs > 5000) {
      return { name: 'database', status: 'warn', latencyMs, details: `High latency. States count: ${count}` }
    }
    return { name: 'database', status: 'pass', latencyMs, details: `States count: ${count}` }
  } catch (err: unknown) {
    return {
      name: 'database',
      status: 'fail',
      latencyMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Check that critical tables are accessible and have expected row counts.
 */
async function checkCriticalTables(): Promise<HealthCheck> {
  const start = Date.now()
  const issues: string[] = []

  try {
    const supabase = createAdminClient()

    const tables = [
      { name: 'attorneys', minCount: 100 },
      { name: 'specialties', minCount: 10 },
      { name: 'locations_us', minCount: 100 },
    ] as const

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })

      if (error) {
        issues.push(`${table.name}: ${error.message}`)
      } else if ((count ?? 0) < table.minCount) {
        issues.push(`${table.name}: only ${count} rows (expected >= ${table.minCount})`)
      }
    }

    const latencyMs = Date.now() - start

    if (issues.length > 0) {
      return { name: 'critical_tables', status: 'fail', latencyMs, details: issues.join('; ') }
    }
    return { name: 'critical_tables', status: 'pass', latencyMs }
  } catch (err: unknown) {
    return {
      name: 'critical_tables',
      status: 'fail',
      latencyMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Check that the /api/health endpoint responds with a healthy or degraded status.
 */
async function checkHealthEndpoint(): Promise<HealthCheck> {
  const start = Date.now()
  const url = `${SITE_URL}/api/health`

  const validation = validateFetchUrl(url)
  if (!validation.valid) {
    return { name: 'health_endpoint', status: 'fail', latencyMs: 0, details: `SSRF blocked: ${validation.reason}` }
  }

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    const latencyMs = Date.now() - start
    const body = await res.json()

    if (res.status === 503) {
      return { name: 'health_endpoint', status: 'fail', latencyMs, details: `Unhealthy: ${body?.status}` }
    }
    if (body?.status === 'degraded') {
      return { name: 'health_endpoint', status: 'warn', latencyMs, details: 'Degraded' }
    }
    if (!res.ok) {
      return { name: 'health_endpoint', status: 'fail', latencyMs, details: `HTTP ${res.status}` }
    }
    return { name: 'health_endpoint', status: 'pass', latencyMs }
  } catch (err: unknown) {
    return {
      name: 'health_endpoint',
      status: 'fail',
      latencyMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Check that the sitemap index is reachable.
 */
async function checkSitemap(): Promise<HealthCheck> {
  const start = Date.now()
  const url = `${SITE_URL}/sitemap.xml`

  const validation = validateFetchUrl(url)
  if (!validation.valid) {
    return { name: 'sitemap', status: 'fail', latencyMs: 0, details: `SSRF blocked: ${validation.reason}` }
  }

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    const latencyMs = Date.now() - start

    if (!res.ok) {
      return { name: 'sitemap', status: 'fail', latencyMs, details: `HTTP ${res.status}` }
    }

    const text = await res.text()
    const hasSitemapIndex = text.includes('<sitemapindex') || text.includes('<urlset')
    if (!hasSitemapIndex) {
      return { name: 'sitemap', status: 'warn', latencyMs, details: 'Response does not contain valid sitemap XML' }
    }

    return { name: 'sitemap', status: 'pass', latencyMs }
  } catch (err: unknown) {
    return {
      name: 'sitemap',
      status: 'fail',
      latencyMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    )
  }

  logger.info('[Cron] Starting health check monitoring')
  const startTime = Date.now()

  // Run all checks in parallel for speed
  const checks = await Promise.all([
    checkDatabase(),
    checkCriticalTables(),
    checkHealthEndpoint(),
    checkSitemap(),
  ])

  const totalDuration = Date.now() - startTime
  const failures = checks.filter(c => c.status === 'fail')
  const warnings = checks.filter(c => c.status === 'warn')
  const allPassed = failures.length === 0 && warnings.length === 0

  // Log results
  for (const check of checks) {
    if (check.status === 'fail') {
      logger.error(`[Cron][HealthCheck] FAIL: ${check.name}`, new Error(check.details || 'Check failed'), {
        latencyMs: check.latencyMs,
      })
    } else if (check.status === 'warn') {
      logger.warn(`[Cron][HealthCheck] WARN: ${check.name} — ${check.details}`, {
        latencyMs: check.latencyMs,
      })
    } else {
      logger.info(`[Cron][HealthCheck] PASS: ${check.name} (${check.latencyMs}ms)`)
    }
  }

  // Send alert if any checks failed
  if (failures.length > 0) {
    const failDetails = failures.map(f => `${f.name}: ${f.details || 'failed'}`).join('\n')
    await sendAlert({
      level: 'critical',
      title: `Health check: ${failures.length} failure(s)`,
      message: failDetails,
      source: 'cron:health-check',
      metadata: {
        failedChecks: failures.map(f => f.name),
        totalDurationMs: totalDuration,
        checksRun: checks.length,
      },
    })
  } else if (warnings.length > 0) {
    const warnDetails = warnings.map(w => `${w.name}: ${w.details || 'warning'}`).join('\n')
    await sendAlert({
      level: 'warning',
      title: `Health check: ${warnings.length} warning(s)`,
      message: warnDetails,
      source: 'cron:health-check',
      metadata: {
        warningChecks: warnings.map(w => w.name),
        totalDurationMs: totalDuration,
        checksRun: checks.length,
      },
    })
  }

  logger.info('[Cron] Health check monitoring complete', {
    durationMs: totalDuration,
    passed: checks.filter(c => c.status === 'pass').length,
    warnings: warnings.length,
    failures: failures.length,
  })

  return NextResponse.json({
    success: true,
    healthy: allPassed,
    timestamp: new Date().toISOString(),
    durationMs: totalDuration,
    summary: {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      warnings: warnings.length,
      failures: failures.length,
    },
    checks,
  })
}
