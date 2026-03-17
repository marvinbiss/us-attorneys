import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'
import { services } from '@/lib/data/usa'
import { verifyCronSecret } from '@/lib/cron-auth'

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

  // Submit to IndexNow
  const response = await fetch(`${SITE_URL}/api/indexnow`, {
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
