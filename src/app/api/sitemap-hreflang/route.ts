import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo/config'
import { practiceAreas, cities } from '@/lib/data/usa'
import { SPANISH_PA_SLUGS, INTENT_MAP } from '@/lib/seo/hreflang'

/**
 * Dedicated hreflang sitemap for EN<->ES page mappings.
 *
 * Serves /sitemap/hreflang-{id}.xml via next.config.js rewrite.
 * Each batch contains max 5,000 <url> entries with xhtml:link alternates.
 *
 * Covers:
 *   - /practice-areas/{pa}/{city} <-> /abogados/{pa-es}/{city}
 *   - /hire/{pa}/{city} <-> /contratar/{pa-es}/{city}
 *   - /pricing/{pa}/{city} <-> /costo/{pa-es}/{city}
 *   - /reviews/{pa}/{city} <-> /opiniones/{pa-es}/{city}
 *   - /emergency/{pa}/{city} <-> /emergencia/{pa-es}/{city}
 *   - /practice-areas/{pa} <-> /abogados/{pa-es}  (hub pages)
 */

// Each pair generates 2 <url> entries (EN + ES), so use 2,500 pairs per batch
// to stay at max 5,000 <url> elements per sitemap file.
const HREFLANG_BATCH_SIZE = 2_500

// Phase 1: top 200 Hispanic-population cities (same as main sitemap)
const TOP_HISPANIC_CITIES = 200

// Intent pairs: [English prefix, Spanish prefix]
const INTENT_PAIRS: [string, string][] = [
  ['practice-areas', INTENT_MAP['practice-areas']],
  ['hire', INTENT_MAP['hire']],
  ['cost', INTENT_MAP['cost']],
  ['reviews', INTENT_MAP['reviews']],
  ['emergency', INTENT_MAP['emergency']],
]

/** Escape XML special characters */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generate all hreflang URL pairs.
 * Returns array of { enUrl, esUrl } objects.
 */
function generateHreflangPairs(): { enUrl: string; esUrl: string }[] {
  const hispanicCities = cities.slice(0, TOP_HISPANIC_CITIES)
  const pairs: { enUrl: string; esUrl: string }[] = []

  for (const [enPrefix, esPrefix] of INTENT_PAIRS) {
    // Hub pages: /practice-areas/{pa} <-> /abogados/{pa-es}
    for (const pa of practiceAreas) {
      const esPaSlug = SPANISH_PA_SLUGS[pa.slug] || pa.slug
      pairs.push({
        enUrl: `${SITE_URL}/${enPrefix}/${pa.slug}`,
        esUrl: `${SITE_URL}/${esPrefix}/${esPaSlug}`,
      })
    }

    // City pages: /practice-areas/{pa}/{city} <-> /abogados/{pa-es}/{city}
    for (const pa of practiceAreas) {
      const esPaSlug = SPANISH_PA_SLUGS[pa.slug] || pa.slug
      for (const city of hispanicCities) {
        pairs.push({
          enUrl: `${SITE_URL}/${enPrefix}/${pa.slug}/${city.slug}`,
          esUrl: `${SITE_URL}/${esPrefix}/${esPaSlug}/${city.slug}`,
        })
      }
    }
  }

  return pairs
}

/** Total hreflang pair count for batch calculation */
function getTotalPairCount(): number {
  const hispanicCities = TOP_HISPANIC_CITIES
  const pa = practiceAreas.length
  const intents = INTENT_PAIRS.length
  // Hub pages + city pages per intent
  return intents * (pa + pa * hispanicCities)
}

/** Number of batches needed */
export function getHreflangBatchCount(): number {
  return Math.max(1, Math.ceil(getTotalPairCount() / HREFLANG_BATCH_SIZE))
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')

  if (!id || !/^\d+$/.test(id)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const batchIndex = parseInt(id, 10)
  const totalBatches = getHreflangBatchCount()

  if (batchIndex >= totalBatches) {
    return new NextResponse('Not found', { status: 404 })
  }

  const start = batchIndex * HREFLANG_BATCH_SIZE
  const end = start + HREFLANG_BATCH_SIZE

  // Generate all pairs and slice to batch
  const allPairs = generateHreflangPairs()
  const batchPairs = allPairs.slice(start, end)

  const urlEntries = batchPairs.map(({ enUrl, esUrl }) => {
    const enLoc = escapeXml(enUrl)
    const esLoc = escapeXml(esUrl)
    return [
      '  <url>',
      `    <loc>${enLoc}</loc>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}"/>`,
      `    <xhtml:link rel="alternate" hreflang="es" href="${esLoc}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${enLoc}"/>`,
      '  </url>',
      '  <url>',
      `    <loc>${esLoc}</loc>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}"/>`,
      `    <xhtml:link rel="alternate" hreflang="es" href="${esLoc}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${enLoc}"/>`,
      '  </url>',
    ].join('\n')
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urlEntries,
    '</urlset>',
  ].join('\n')

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
