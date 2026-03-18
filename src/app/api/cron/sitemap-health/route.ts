import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'
import { verifyCronSecret } from '@/lib/cron-auth'
import { validateFetchUrl, filterSafeUrls } from '@/lib/url-validation'
import { sendAlert } from '@/lib/monitoring/alerts'
import { logger } from '@/lib/logger'

/**
 * Daily cron: Verify all sitemaps return HTTP 200 with valid XML.
 * Alerts via structured logging (visible in Vercel logs).
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate the sitemap index URL before fetching
  const sitemapIndexUrl = `${SITE_URL}/sitemap.xml`
  const indexValidation = validateFetchUrl(sitemapIndexUrl)
  if (!indexValidation.valid) {
    console.error('[sitemap-health] CRITICAL: sitemap index URL blocked by SSRF filter:', indexValidation.reason)
    return NextResponse.json({ error: 'Invalid sitemap index URL', reason: indexValidation.reason }, { status: 500 })
  }

  // Fetch sitemap index to get all child sitemaps
  const indexRes = await fetch(sitemapIndexUrl, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!indexRes.ok) {
    logger.error('[sitemap-health] CRITICAL: sitemap index returned non-200', new Error(`HTTP ${indexRes.status}`))
    await sendAlert({
      level: 'critical',
      title: 'Sitemap index unreachable',
      message: `Sitemap index at ${sitemapIndexUrl} returned HTTP ${indexRes.status}`,
      source: 'cron:sitemap-health',
      metadata: { statusCode: indexRes.status },
    })
    return NextResponse.json({ error: 'Sitemap index failed', status: indexRes.status }, { status: 500 })
  }

  const indexXml = await indexRes.text()
  const locRegex = /<loc>(.*?)<\/loc>/g
  const rawUrls: string[] = []
  let match
  while ((match = locRegex.exec(indexXml)) !== null) {
    rawUrls.push(match[1])
  }

  // Validate all extracted URLs against SSRF whitelist (own domain only)
  const sitemapUrls = filterSafeUrls(rawUrls, 'sitemap-health')

  if (sitemapUrls.length < rawUrls.length) {
    console.warn(`[sitemap-health] SSRF filter blocked ${rawUrls.length - sitemapUrls.length} URLs out of ${rawUrls.length}`)
  }

  // Check each child sitemap
  const results: { url: string; status: number; urls: number; ok: boolean }[] = []
  const failures: string[] = []

  // Check in parallel batches of 5 to avoid overwhelming the server
  for (let i = 0; i < sitemapUrls.length; i += 5) {
    const batch = sitemapUrls.slice(i, i + 5)
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
          const text = res.ok ? await res.text() : ''
          const urlCount = (text.match(/<url>/g) || []).length
          const ok = res.ok && urlCount > 0
          if (!ok) failures.push(url)
          return { url, status: res.status, urls: urlCount, ok }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          console.error(`[sitemap-health] Fetch failed for ${url}: ${message}`)
          failures.push(url)
          return { url, status: 0, urls: 0, ok: false }
        }
      })
    )
    results.push(...batchResults)
  }

  const totalUrls = results.reduce((sum, r) => sum + r.urls, 0)
  const allOk = failures.length === 0

  if (!allOk) {
    logger.error('[sitemap-health] Sitemaps failed', new Error(`${failures.length} sitemaps failed`), { failures })
    await sendAlert({
      level: failures.length > 3 ? 'critical' : 'warning',
      title: `${failures.length} sitemap(s) unhealthy`,
      message: `Failed sitemaps:\n${failures.join('\n')}`,
      source: 'cron:sitemap-health',
      metadata: { failedCount: failures.length, totalChecked: results.length, totalUrls },
    })
  } else {
    logger.info(`[sitemap-health] OK: ${results.length} sitemaps healthy, ${totalUrls} total URLs`)
  }

  return NextResponse.json({
    healthy: allOk,
    checked: results.length,
    totalUrls,
    failures: failures.length > 0 ? failures : undefined,
    timestamp: new Date().toISOString(),
  })
}
