/**
 * GSC Lexical Audit Script
 *
 * Usage:
 *   1. Export GSC Search Performance CSV (28 days, Pages + Queries)
 *   2. Run: npx tsx scripts/gsc-lexical-audit.ts <path-to-csv>
 *
 * Output:
 *   - Queries with impressions > 10, position 5-30, CTR < 5%
 *   - Lexical match check: does the page title/H1/intro contain the query terms?
 *   - Actionable patches needed
 */

import { readFileSync, writeFileSync } from 'fs'
import { services, villes } from '../src/lib/data/france'
import { getTradeContent } from '../src/lib/data/trade-content'
import { NATURAL_TERMS } from '../src/lib/seo/natural-terms'

interface GscRow {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

function parseCsv(filePath: string): GscRow[] {
  const raw = readFileSync(filePath, 'utf-8')
  const lines = raw.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
  const qIdx = headers.findIndex(h => h.includes('query') || h.includes('requête'))
  const pIdx = headers.findIndex(h => h.includes('page') || h.includes('url'))
  const cIdx = headers.findIndex(h => h.includes('click'))
  const iIdx = headers.findIndex(h => h.includes('impression'))
  const ctrIdx = headers.findIndex(h => h.includes('ctr'))
  const posIdx = headers.findIndex(h => h.includes('position'))

  if (qIdx === -1 || pIdx === -1) {
    console.error('CSV headers not recognized. Expected: query/requête, page/url, clicks, impressions, ctr, position')
    console.error('Found headers:', headers)
    process.exit(1)
  }

  return lines.slice(1).map(line => {
    // Handle quoted CSV fields
    const cols: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue }
      if (char === ',' && !inQuotes) { cols.push(current.trim()); current = ''; continue }
      current += char
    }
    cols.push(current.trim())

    return {
      query: cols[qIdx] || '',
      page: cols[pIdx] || '',
      clicks: parseFloat(cols[cIdx] || '0'),
      impressions: parseFloat(cols[iIdx] || '0'),
      ctr: parseFloat((cols[ctrIdx] || '0').replace('%', '')) / (cols[ctrIdx]?.includes('%') ? 100 : 1),
      position: parseFloat(cols[posIdx] || '0'),
    }
  }).filter(r => r.query && r.page)
}

function extractServiceAndCity(url: string): { service: string; city: string } | null {
  const match = url.match(/\/services\/([^/]+)\/([^/]+)/)
  if (!match) return null
  return { service: match[1], city: match[2] }
}

function checkLexicalMatch(query: string, serviceSlug: string, citySlug: string): {
  titleMatch: boolean
  naturalTermMatch: boolean
  missingTerms: string[]
} {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  const service = services.find(s => s.slug === serviceSlug)
  const ville = villes.find(v => v.slug === citySlug)
  const trade = getTradeContent(serviceSlug)
  const natural = NATURAL_TERMS[serviceSlug]

  const titleContent = [
    service?.name?.toLowerCase() || '',
    ville?.name?.toLowerCase() || '',
    'artisans', 'vérifiés', 'devis', 'gratuit',
  ].join(' ')

  const naturalContent = natural
    ? [natural.singular, natural.plural, ...natural.synonyms, ...natural.qualifiers].join(' ').toLowerCase()
    : ''

  const tradeContent = trade
    ? [...trade.commonTasks, ...trade.faq.map(f => f.q), ...trade.faq.map(f => f.a)].join(' ').toLowerCase()
    : ''

  const allContent = `${titleContent} ${naturalContent} ${tradeContent}`

  const missingTerms = terms.filter(t => !allContent.includes(t))

  return {
    titleMatch: terms.every(t => titleContent.includes(t)),
    naturalTermMatch: terms.every(t => `${titleContent} ${naturalContent}`.includes(t)),
    missingTerms,
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

const csvPath = process.argv[2]
if (!csvPath) {
  console.log('Usage: npx tsx scripts/gsc-lexical-audit.ts <gsc-export.csv>')
  console.log('')
  console.log('Steps:')
  console.log('  1. Go to GSC > Search Performance > Pages + Queries')
  console.log('  2. Date range: Last 28 days')
  console.log('  3. Export CSV')
  console.log('  4. Run this script with the CSV path')
  process.exit(0)
}

const rows = parseCsv(csvPath)
console.log(`\nParsed ${rows.length} rows from GSC export\n`)

// Filter: impressions > 10, position 5-30, CTR < 5%
const candidates = rows
  .filter(r => r.impressions >= 10 && r.position >= 5 && r.position <= 30 && r.ctr < 0.05)
  .sort((a, b) => b.impressions * (1 - b.ctr) - a.impressions * (1 - a.ctr))

console.log(`Found ${candidates.length} candidate queries (impressions>=10, pos 5-30, CTR<5%)\n`)

// Analyze each candidate
const results: {
  query: string
  page: string
  impressions: number
  position: number
  ctr: string
  titleMatch: string
  missingTerms: string
  action: string
}[] = []

const citySet = new Set<string>()
const boostPages = new Set<string>()

for (const row of candidates) {
  const parsed = extractServiceAndCity(row.page)
  if (!parsed) continue

  const { service, city } = parsed
  const check = checkLexicalMatch(row.query, service, city)

  // Collect GSC priority cities
  citySet.add(city)

  // Collect boost pages (position 5-20)
  if (row.position >= 5 && row.position <= 20 && row.impressions >= 50) {
    const path = `/services/${service}/${city}`
    boostPages.add(path)
  }

  const action = check.titleMatch
    ? 'OK'
    : check.naturalTermMatch
      ? 'NATURAL_TERMS_COVER'
      : check.missingTerms.length > 0
        ? `ADD: ${check.missingTerms.join(', ')}`
        : 'REVIEW'

  results.push({
    query: row.query,
    page: row.page,
    impressions: row.impressions,
    position: Math.round(row.position * 10) / 10,
    ctr: (row.ctr * 100).toFixed(1) + '%',
    titleMatch: check.titleMatch ? 'YES' : 'NO',
    missingTerms: check.missingTerms.join(', '),
    action,
  })
}

// Output results
console.log('=== LEXICAL AUDIT RESULTS ===\n')
console.log('Query | Impressions | Position | CTR | Title Match | Missing Terms | Action')
console.log('-'.repeat(100))
for (const r of results.slice(0, 50)) {
  console.log(`${r.query} | ${r.impressions} | ${r.position} | ${r.ctr} | ${r.titleMatch} | ${r.missingTerms} | ${r.action}`)
}

if (results.length > 50) {
  console.log(`\n... and ${results.length - 50} more rows`)
}

// Output GSC priority cities
console.log('\n\n=== GSC PRIORITY CITIES (for gsc-priority-cities.ts) ===\n')
const top300Slugs = new Set(villes.slice(0, 300).map(v => v.slug))
const gscOnlyCities = [...citySet].filter(c => !top300Slugs.has(c))
if (gscOnlyCities.length > 0) {
  console.log('Add these to GSC_PRIORITY_CITIES:\n')
  console.log(`export const GSC_PRIORITY_CITIES: string[] = [`)
  for (const city of gscOnlyCities) {
    console.log(`  '${city}',`)
  }
  console.log(`]`)
} else {
  console.log('All GSC cities are already in the top 300. No additions needed.')
}

// Output boost pages
console.log('\n\n=== GSC BOOST PAGES (for gsc-priority-cities.ts) ===\n')
if (boostPages.size > 0) {
  console.log('Add these to GSC_BOOST_PAGES:\n')
  console.log(`export const GSC_BOOST_PAGES: string[] = [`)
  for (const page of boostPages) {
    console.log(`  '${page}',`)
  }
  console.log(`]`)
} else {
  console.log('No pages with position 5-20 and impressions >= 50 found.')
}

// Save full results to JSON
const outputPath = csvPath.replace(/\.csv$/i, '-audit.json')
writeFileSync(outputPath, JSON.stringify({ results, gscOnlyCities, boostPages: [...boostPages] }, null, 2))
console.log(`\n\nFull results saved to: ${outputPath}`)

// Summary stats
const needAction = results.filter(r => r.action !== 'OK' && r.action !== 'NATURAL_TERMS_COVER')
console.log(`\n=== SUMMARY ===`)
console.log(`Total candidates: ${results.length}`)
console.log(`Title match OK: ${results.filter(r => r.titleMatch === 'YES').length}`)
console.log(`Covered by natural terms: ${results.filter(r => r.action === 'NATURAL_TERMS_COVER').length}`)
console.log(`Need lexical patch: ${needAction.length}`)
console.log(`GSC cities outside top 300: ${gscOnlyCities.length}`)
console.log(`Boost-eligible pages: ${boostPages.size}`)
