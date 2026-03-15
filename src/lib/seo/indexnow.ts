import { SITE_URL } from '@/lib/seo/config'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow'
const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || '55e191c6b56d89e07bbf8fcba3552fcd'

const BATCH_SIZE = 10_000

interface IndexNowResult {
  submitted: number
  success: boolean
  error?: string
}

/**
 * Submit URLs to IndexNow (Bing, Yandex, and other participating search engines).
 * Batches up to 10,000 URLs per call per the IndexNow spec.
 * Should only be called server-side (API routes, cron jobs).
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (!INDEXNOW_KEY || urls.length === 0) {
    return { submitted: 0, success: false, error: 'No key or empty URL list' }
  }

  const absoluteUrls = urls.map(u => u.startsWith('http') ? u : `${SITE_URL}${u}`)

  let totalSubmitted = 0

  for (let i = 0; i < absoluteUrls.length; i += BATCH_SIZE) {
    const batch = absoluteUrls.slice(i, i + BATCH_SIZE)

    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: new URL(SITE_URL).hostname,
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: batch,
        }),
      })

      // IndexNow returns 200, 202, or 204 on success
      if (response.ok || response.status === 202) {
        totalSubmitted += batch.length
      }
    } catch {
      // Continue with next batch rather than failing entirely
    }
  }

  return { submitted: totalSubmitted, success: totalSubmitted > 0 }
}

/**
 * Build the list of affected URLs when a provider changes.
 * Notifies: the provider page, the service+ville hub page, and the city page.
 */
export function getAttorneyAffectedUrls(
  specialtySlug: string,
  villeSlug: string,
  providerPublicId?: string
): string[] {
  const urls = [
    `/practice-areas/${specialtySlug}/${villeSlug}`,
    `/cities/${villeSlug}`,
  ]
  if (providerPublicId) {
    urls.push(`/practice-areas/${specialtySlug}/${villeSlug}/${providerPublicId}`)
  }
  return urls
}
