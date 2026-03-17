import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'
import { verifyCronSecret } from '@/lib/cron-auth'

/**
 * Daily cron: Verify all sitemaps return HTTP 200 with valid XML.
 * Alerts via structured logging (visible in Vercel logs).
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch sitemap index to get all child sitemaps
  const indexRes = await fetch(`${SITE_URL}/sitemap.xml`, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!indexRes.ok) {
    console.error('[sitemap-health] CRITICAL: sitemap index returned', indexRes.status)
    return NextResponse.json({ error: 'Sitemap index failed', status: indexRes.status }, { status: 500 })
  }

  const indexXml = await indexRes.text()
  const locRegex = /<loc>(.*?)<\/loc>/g
  const sitemapUrls: string[] = []
  let match
  while ((match = locRegex.exec(indexXml)) !== null) {
    sitemapUrls.push(match[1])
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
        } catch {
          failures.push(url)
          return { url, status: 0, urls: 0, ok: false }
        }
      })
    )
    results.push(...batchResults)
  }

  // Also check special sitemaps
  for (const special of [`${SITE_URL}/image-sitemap.xml`, `${SITE_URL}/news-sitemap.xml`]) {
    try {
      const res = await fetch(special, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
      // news-sitemap can legitimately be empty (0 articles in last 48h)
      const ok = res.ok
      if (!ok) failures.push(special)
      results.push({ url: special, status: res.status, urls: 0, ok })
    } catch {
      failures.push(special)
      results.push({ url: special, status: 0, urls: 0, ok: false })
    }
  }

  const totalUrls = results.reduce((sum, r) => sum + r.urls, 0)
  const allOk = failures.length === 0

  if (!allOk) {
    console.error(`[sitemap-health] ALERT: ${failures.length} sitemaps failed:`, failures)
  } else {
    console.log(`[sitemap-health] OK: ${results.length} sitemaps healthy, ${totalUrls} total URLs`)
  }

  return NextResponse.json({
    healthy: allOk,
    checked: results.length,
    totalUrls,
    failures: failures.length > 0 ? failures : undefined,
    timestamp: new Date().toISOString(),
  })
}
