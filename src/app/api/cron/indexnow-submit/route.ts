import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'
import { services } from '@/lib/data/usa'
import { verifyCronSecret } from '@/lib/cron-auth'
import { validateFetchUrl } from '@/lib/url-validation'
import { logger } from '@/lib/logger'

const TOP_CITIES = ['new-york', 'los-angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san-antonio', 'san-diego', 'dallas', 'austin']

/**
 * Cron job: Submit strategic URLs to IndexNow after each deploy.
 * Runs daily to ensure Bing always has fresh data.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Build list of strategic URLs to submit
  const urls: string[] = [
    SITE_URL,
    `${SITE_URL}/services`,
  ]

  // Top services x top cities
  for (const service of services.slice(0, 10)) {
    urls.push(`${SITE_URL}/practice-areas/${service.slug}`)
    for (const city of TOP_CITIES) {
      urls.push(`${SITE_URL}/practice-areas/${service.slug}/${city}`)
      urls.push(`${SITE_URL}/quotes/${service.slug}/${city}`)
    }
  }

  // Validate the IndexNow API URL before fetching (SSRF prevention)
  const indexNowUrl = `${SITE_URL}/api/indexnow`
  const validation = validateFetchUrl(indexNowUrl)
  if (!validation.valid) {
    logger.error('[indexnow-submit] SSRF blocked', null, { action: 'ssrf-check', component: 'cron' })
    return NextResponse.json({ error: 'Invalid IndexNow URL', reason: validation.reason }, { status: 500 })
  }

  // Submit to IndexNow
  const response = await fetch(indexNowUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({ urls }),
    signal: AbortSignal.timeout(30000), // 30s timeout
  })

  const result = await response.json()
  return NextResponse.json({ ...result, urlCount: urls.length })
}
