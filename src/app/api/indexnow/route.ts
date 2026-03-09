import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'

const INDEXNOW_KEY = '55e191c6b56d89e07bbf8fcba3552fcd'

/**
 * POST /api/indexnow — Submit URLs to IndexNow (Bing, Yandex, etc.)
 * Called by the sitemap health cron or manually after deploys.
 */
export async function POST(request: Request) {
  // Verify this is an internal call (simple auth check)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const urls: string[] = body?.urls || []

  if (urls.length === 0) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
  }

  // IndexNow API - submit to Bing (which shares with Yandex, Seznam, etc.)
  const payload = {
    host: 'servicesartisans.fr',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, 10000), // IndexNow limit: 10K URLs per request
  }

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })

    return NextResponse.json({
      status: response.status,
      submitted: urls.length,
      message: response.status === 200 ? 'URLs submitted successfully' : 'Submission acknowledged',
    })
  } catch {
    return NextResponse.json({ error: 'IndexNow API error' }, { status: 502 })
  }
}
