/**
 * Florida Bar Scraping Test - WORKING APPROACH
 *
 * FL Bar (floridabar.org) is fully blocked by Cloudflare WAF (403 on all requests).
 *
 * Working source: US District Court - Middle District of Florida attorney roll
 * URL: https://apps.flmd.uscourts.gov/attyadm/results.pl
 * Method: POST form submission, parse HTML response
 * Data: name, FL bar number, city, admission date, status
 *
 * Also tries: Southern District and Northern District of Florida
 */

// ============================================================================
// TYPES
// ============================================================================

interface FLAttorney {
  name: string
  firstName: string
  lastName: string
  middleName: string
  barNumber: string
  city: string
  admissionDate: string
  status: string
  source: string
}

// ============================================================================
// PARSER: Extract attorneys from FL Middle District HTML
// ============================================================================

function parseFlmdResults(html: string, source: string): FLAttorney[] {
  const attorneys: FLAttorney[] = []

  // Pattern: name in <th>, then bar ID, city, admitted date, status in following <td>s
  // <tr><th colspan='2'...>Smith, A. Russell </td>
  // <tr><td><span...>Bar Id: </span>0296880</TD><td><span...>City: </span>Jacksonville</td>
  // <tr><td><span...>Admitted: </span>02/17/1984</td>...
  // <tr><td><span...>Status: </span>Active</td>...

  const namePattern = /<th[^>]*>([^<]+)<\/t[dh]>/gi
  const barPattern = /Bar Id:\s*<\/span>(\d+)/gi
  const cityPattern = /City:\s*<\/span>([^<]+)/gi
  const admittedPattern = /Admitted:\s*<\/span>([^<]+)/gi
  const statusPattern = /Status:\s*<\/span>([^<]+)/gi

  const names = [...html.matchAll(namePattern)].map(m => m[1].trim())
  const bars = [...html.matchAll(barPattern)].map(m => m[1].trim())
  const cities = [...html.matchAll(cityPattern)].map(m => m[1].trim())
  const admissions = [...html.matchAll(admittedPattern)].map(m => m[1].trim())
  const statuses = [...html.matchAll(statusPattern)].map(m => m[1].trim())

  const count = Math.min(names.length, bars.length)

  for (let i = 0; i < count; i++) {
    const fullName = names[i]
    // Parse "Smith, A. Russell" -> lastName="Smith", firstName="A.", middleName="Russell"
    const commaIdx = fullName.indexOf(',')
    let lastName = ''
    let firstName = ''
    let middleName = ''

    if (commaIdx > -1) {
      lastName = fullName.substring(0, commaIdx).trim()
      const rest = fullName.substring(commaIdx + 1).trim().split(/\s+/)
      firstName = rest[0] || ''
      middleName = rest.slice(1).join(' ')
    } else {
      const parts = fullName.split(/\s+/)
      firstName = parts[0] || ''
      lastName = parts[parts.length - 1] || ''
      middleName = parts.slice(1, -1).join(' ')
    }

    attorneys.push({
      name: fullName,
      firstName,
      lastName,
      middleName,
      barNumber: bars[i] || '',
      city: cities[i] || '',
      admissionDate: admissions[i] || '',
      status: statuses[i] || '',
      source,
    })
  }

  return attorneys
}

// ============================================================================
// FETCH: FL Middle District
// ============================================================================

async function fetchFlmd(lastName: string): Promise<FLAttorney[]> {
  const res = await fetch('https://apps.flmd.uscourts.gov/attyadm/results.pl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://apps.flmd.uscourts.gov/attyadm/attyroll.htm',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
    body: `lname=${encodeURIComponent(lastName)}&fname=&barnumber=&submit=Submit`,
  })

  if (!res.ok) {
    throw new Error(`FLMD ${res.status}: ${res.statusText}`)
  }

  const html = await res.text()
  return parseFlmdResults(html, 'flmd.uscourts.gov')
}

// ============================================================================
// FETCH: FL Southern District
// ============================================================================

async function fetchFlsd(lastName: string): Promise<FLAttorney[]> {
  // Try Southern District
  try {
    const res = await fetch('https://apps.flsd.uscourts.gov/attyadm/results.pl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://apps.flsd.uscourts.gov/attyadm/attyroll.htm',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: `lname=${encodeURIComponent(lastName)}&fname=&barnumber=&submit=Submit`,
    })

    if (res.ok) {
      const html = await res.text()
      return parseFlmdResults(html, 'flsd.uscourts.gov')
    }
  } catch (err: any) {
    console.log(`  FLSD error: ${err.message}`)
  }
  return []
}

// ============================================================================
// FETCH: FL Northern District
// ============================================================================

async function fetchFlnd(lastName: string): Promise<FLAttorney[]> {
  try {
    const res = await fetch('https://apps.flnd.uscourts.gov/attyadm/results.pl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://apps.flnd.uscourts.gov/attyadm/attyroll.htm',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: `lname=${encodeURIComponent(lastName)}&fname=&barnumber=&submit=Submit`,
    })

    if (res.ok) {
      const html = await res.text()
      return parseFlmdResults(html, 'flnd.uscourts.gov')
    }
  } catch (err: any) {
    console.log(`  FLND error: ${err.message}`)
  }
  return []
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Florida Attorney Scraping Test ===')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log()
  console.log('Source: US District Court - Middle District of Florida (attorney roll)')
  console.log('URL: https://apps.flmd.uscourts.gov/attyadm/attyroll.htm')
  console.log()

  const allAttorneys: FLAttorney[] = []
  const seenBars = new Set<string>()

  // Search multiple last names to get 50+ unique records
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']

  for (const lastName of lastNames) {
    if (allAttorneys.length >= 50) break

    console.log(`\nSearching "${lastName}"...`)

    // Try Middle District (main source)
    try {
      const results = await fetchFlmd(lastName)
      let added = 0
      for (const r of results) {
        if (!seenBars.has(r.barNumber)) {
          seenBars.add(r.barNumber)
          allAttorneys.push(r)
          added++
        }
      }
      console.log(`  FLMD: ${results.length} results, ${added} new (total: ${allAttorneys.length})`)
    } catch (err: any) {
      console.log(`  FLMD error: ${err.message}`)
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500))
  }

  // Also try Southern District for a couple names if we need more
  if (allAttorneys.length < 50) {
    console.log('\nTrying FL Southern District...')
    try {
      const results = await fetchFlsd('Smith')
      let added = 0
      for (const r of results) {
        if (!seenBars.has(r.barNumber)) {
          seenBars.add(r.barNumber)
          allAttorneys.push(r)
          added++
        }
      }
      console.log(`  FLSD: ${results.length} results, ${added} new (total: ${allAttorneys.length})`)
    } catch (err: any) {
      console.log(`  FLSD error: ${err.message}`)
    }
  }

  // ============================================================================
  // REPORT
  // ============================================================================

  console.log('\n\n========== FINAL REPORT ==========')
  console.log(`Total unique attorneys: ${allAttorneys.length}`)
  console.log(`Target: 50`)
  console.log(`Status: ${allAttorneys.length >= 50 ? 'SUCCESS' : 'PARTIAL'}`)

  // Status distribution
  const statusCounts: Record<string, number> = {}
  allAttorneys.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
  })
  console.log('\nStatus distribution:')
  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, c]) => console.log(`  ${s}: ${c}`))

  // City distribution (top 10)
  const cityCounts: Record<string, number> = {}
  allAttorneys.forEach(a => {
    if (a.city) cityCounts[a.city] = (cityCounts[a.city] || 0) + 1
  })
  console.log('\nTop 10 cities:')
  Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([c, n]) => console.log(`  ${c}: ${n}`))

  // Show first 5 records
  console.log('\n--- First 5 records ---')
  allAttorneys.slice(0, 5).forEach((a, i) => {
    console.log(`\n[${i + 1}] ${a.name}`)
    console.log(`    Bar Number: ${a.barNumber}`)
    console.log(`    First: ${a.firstName}, Last: ${a.lastName}, Middle: ${a.middleName || 'N/A'}`)
    console.log(`    City: ${a.city}`)
    console.log(`    Admitted: ${a.admissionDate}`)
    console.log(`    Status: ${a.status}`)
    console.log(`    Source: ${a.source}`)
  })

  // Show records 25-30 too (middle of dataset)
  if (allAttorneys.length > 30) {
    console.log('\n--- Records 26-30 ---')
    allAttorneys.slice(25, 30).forEach((a, i) => {
      console.log(`\n[${i + 26}] ${a.name}`)
      console.log(`    Bar #${a.barNumber} | ${a.city} | ${a.status} | Admitted: ${a.admissionDate}`)
    })
  }

  // Data quality check
  console.log('\n--- Data quality ---')
  const withBar = allAttorneys.filter(a => a.barNumber).length
  const withCity = allAttorneys.filter(a => a.city).length
  const withDate = allAttorneys.filter(a => a.admissionDate).length
  const withStatus = allAttorneys.filter(a => a.status).length
  console.log(`  Bar number: ${withBar}/${allAttorneys.length} (${Math.round(withBar/allAttorneys.length*100)}%)`)
  console.log(`  City:       ${withCity}/${allAttorneys.length} (${Math.round(withCity/allAttorneys.length*100)}%)`)
  console.log(`  Admission:  ${withDate}/${allAttorneys.length} (${Math.round(withDate/allAttorneys.length*100)}%)`)
  console.log(`  Status:     ${withStatus}/${allAttorneys.length} (${Math.round(withStatus/allAttorneys.length*100)}%)`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
