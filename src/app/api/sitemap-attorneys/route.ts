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
 * Uses cursor-based pagination to avoid O(n) OFFSET scans:
 *   1. For batch 0: ORDER BY id ASC LIMIT 5000 (no WHERE)
 *   2. For batch N>0: find the cursor ID (last ID of the previous batch)
 *      with a single-row query, then WHERE id > cursor LIMIT 5000.
 *
 * The cursor lookup uses .range(offset-1, offset-1) which is a single OFFSET
 * query but only fetches 1 row (the boundary ID), then the main query uses
 * efficient keyset pagination. This is O(1) for the main data fetch.
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

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    let cursor: string | null = null

    if (batchIndex > 0) {
      // Find the boundary: get the last ID of the previous batch.
      // Single-row fetch at position (batchIndex * batchSize - 1).
      // This is a small OFFSET for the boundary lookup only (1 row),
      // while the actual data query below uses keyset (no OFFSET).
      const boundaryOffset = batchIndex * ATTORNEY_BATCH_SIZE - 1
      const { data: boundaryRow } = await supabase
        .from('attorneys')
        .select('id')
        .eq('is_active', true)
        .eq('noindex', false)
        .order('id', { ascending: true })
        .range(boundaryOffset, boundaryOffset)

      if (boundaryRow && boundaryRow.length > 0) {
        cursor = boundaryRow[0].id
      } else {
        // Batch index out of range — return empty sitemap
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>',
          { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } }
        )
      }
    }

    // Main data fetch: keyset pagination (WHERE id > cursor ORDER BY id ASC LIMIT N)
    // This is O(log n) via B-tree index seek — no sequential scan.
    let query = supabase
      .from('attorneys')
      .select('id, slug, stable_id, updated_at')
      .eq('is_active', true)
      .eq('noindex', false)
      .order('id', { ascending: true })
      .limit(ATTORNEY_BATCH_SIZE)

    if (cursor) {
      query = query.gt('id', cursor)
    }

    const { data: attorneys, error } = await query

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
