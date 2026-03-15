import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'

export const maxDuration = 60

const ATTORNEY_BATCH_SIZE = 5_000

/** Escape XML special characters in sitemap URLs */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Dynamic API route for attorney sitemaps.
 * Serves /sitemap/attorneys-{id}.xml via next.config.js rewrite.
 *
 * Runs at request time with 1-hour CDN caching.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')

  if (!id || !/^\d+$/.test(id)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const batchIndex = parseInt(id, 10)
  const offset = batchIndex * ATTORNEY_BATCH_SIZE

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data: attorneys, error } = await supabase
      .from('attorneys')
      .select('id, slug, stable_id, updated_at')
      .eq('is_active', true)
      .eq('noindex', false)
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + ATTORNEY_BATCH_SIZE - 1)

    if (error) throw error

    const urls = (attorneys || [])
      .filter((a) => a.slug || a.stable_id)
      .map((a) => {
        const publicId = a.slug || a.stable_id || a.id
        const lastmod = a.updated_at ? new Date(a.updated_at).toISOString().split('T')[0] : undefined
        // TODO: Build full practice-areas/specialty/location/publicId URL when specialty+location data is connected
        const loc = escapeXml(`${SITE_URL}/attorneys/${publicId}`)
        return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
      })

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
    ].join('\n')

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>'
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60',
      },
    })
  }
}
