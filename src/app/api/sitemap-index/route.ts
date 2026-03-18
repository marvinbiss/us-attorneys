import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'
import { generateSitemaps } from '@/app/sitemap'
import { getHreflangBatchCount } from '@/app/api/sitemap-hreflang/route'

const ATTORNEY_BATCH_SIZE = 5_000
// Max attorney sitemaps to avoid declaring hundreds of broken sitemaps
const MAX_ATTORNEY_SITEMAPS = 20

/**
 * Sitemap index generator — workaround for Next.js 14.2 not auto-generating
 * the sitemap index at /sitemap.xml when using generateSitemaps().
 *
 * This route is rewritten from /sitemap.xml via next.config.js.
 *
 * SINGLE SOURCE OF TRUTH: imports generateSitemaps() from sitemap.ts
 * so the index always matches the actual sitemap handlers.
 * Attorney sitemaps are appended dynamically from the DB.
 */
export async function GET() {
  // ── Static/programmatic sitemaps from generateSitemaps() ──────────────
  const staticSitemaps = await generateSitemaps()
  const ids: string[] = staticSitemaps.map(s => s.id)

  // ── Attorney sitemaps (DB-dependent, served via /api/sitemap-attorneys) ──
  // These use "attorneys-{i}" naming to match next.config.js rewrite:
  //   /sitemap/attorneys-:id.xml → /api/sitemap-attorneys?id=:id
  // The sitemap-attorneys route uses keyset/cursor pagination internally
  // (ORDER BY id ASC, LIMIT N with a single OFFSET to find the start cursor),
  // avoiding the O(n) full-scan problem of deep OFFSET pagination.
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('noindex', false)

    if (!error && count && count > 0) {
      const batchCount = Math.min(Math.ceil(count / ATTORNEY_BATCH_SIZE), MAX_ATTORNEY_SITEMAPS)
      for (let i = 0; i < batchCount; i++) {
        ids.push(`attorneys-${i}`)
      }
    }
  } catch {
    // DB unavailable — omit attorney sitemaps from index
  }

  // ── Hreflang sitemaps (EN<->ES mappings) ──────────────────────────────
  const hreflangBatches = getHreflangBatchCount()
  for (let i = 0; i < hreflangBatches; i++) {
    ids.push(`hreflang-${i}`)
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ids.map(id => `  <sitemap><loc>${SITE_URL}/sitemap/${id}.xml</loc></sitemap>`),
    '</sitemapindex>',
  ].join('\n')

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
