import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SITE_URL } from '@/lib/seo/config'
import { verifyCronSecret } from '@/lib/cron-auth'

const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || ''

const indexNowSchema = z.object({
  urls: z.array(z.string().url()).min(1, 'At least one URL is required').max(10000),
})

/**
 * POST /api/indexnow — Submit URLs to IndexNow (Bing, Yandex, etc.)
 * Called by the sitemap health cron or manually after deploys.
 */
export async function POST(request: Request) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = indexNowSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid request body' } },
      { status: 400 }
    )
  }

  const urls = parsed.data.urls

  // IndexNow API - submit to Bing (which shares with Yandex, Seznam, etc.)
  const payload = {
    host: 'lawtendr.com',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, 10000), // IndexNow limit: 10K URLs per request
  }

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000), // 15s timeout
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
