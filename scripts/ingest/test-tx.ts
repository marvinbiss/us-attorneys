/**
 * Texas Bar Attorney Scraping - PROVEN WORKING
 *
 * CRITICAL: Do NOT include County or PracticeArea as empty params - it breaks the search.
 * Only include: Submitted=1, ShowPrinter=1, Find=1, LastName, FirstName, BarCardNumber, City, State, Zip
 *
 * Usage: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/ingest/test-tx.ts
 */

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
}

const TX_BAR_PHONE = '(877) 953-5535'
const SEARCH_URL = 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&Template=/CustomSource/MemberDirectory/Search_Form_Client_Main.cfm'
const RESULT_URL = 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&Template=/CustomSource/MemberDirectory/Result_form_client.cfm'

interface Attorney {
  name: string
  firstName: string
  lastName: string
  contactId: string
  barNumber: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  firmName: string | null
  lawSchool: string | null
  dateAdmitted: string | null
  status: string | null
  practiceAreas: string | null
  firmSize: string | null
}

async function getSession(): Promise<string> {
  const res = await fetch(SEARCH_URL, { headers: BROWSER_HEADERS, redirect: 'follow' })
  return (res.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ')
}

async function searchByLastName(lastName: string, cookies: string): Promise<Attorney[]> {
  // CRITICAL: Only these fields. Do NOT add County or PracticeArea with empty values.
  const body = new URLSearchParams({
    Submitted: '1',
    ShowPrinter: '1',
    Find: '1',
    LastName: lastName,
    FirstName: '',
    BarCardNumber: '',
    City: '',
    State: '',
    Zip: '',
  })

  const res = await fetch(RESULT_URL, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
      'Referer': SEARCH_URL,
      'Origin': 'https://www.texasbar.com',
    },
    body: body.toString(),
    redirect: 'follow',
  })

  const html = await res.text()

  // Extract unique ContactIDs
  const idSet = new Set<string>()
  const idRegex = /ContactID=(\d+)/gi
  let m: RegExpExecArray | null
  while ((m = idRegex.exec(html)) !== null) idSet.add(m[1])
  const uniqueIds = [...idSet]

  // Parse each attorney from the results page
  const attorneys: Attorney[] = []

  for (const cid of uniqueIds) {
    // Find the block of HTML for this attorney
    // The pattern: each attorney is in an <article class="lawyer"> block
    // Find the nearest given-name/family-name spans before this ContactID's first occurrence
    const cidIdx = html.indexOf(`ContactID=${cid}`)
    if (cidIdx < 0) continue

    // Search backwards for the article start
    const articleStart = html.lastIndexOf('<article', cidIdx)
    if (articleStart < 0) continue
    const articleEnd = html.indexOf('</article>', cidIdx)
    const block = html.substring(articleStart, articleEnd > 0 ? articleEnd : cidIdx + 500)

    // Name
    const givenM = block.match(/<span\s+class="given-name">([^<]+)<\/span>/i)
    const familyM = block.match(/<span\s+class="family-name">([^<]+)<\/span>/i)
    const firstName = givenM ? givenM[1].trim() : ''
    const lastName2 = familyM ? familyM[1].trim() : ''
    const name = `${firstName} ${lastName2}`.trim()
    if (!name) continue

    // Location
    let city: string | null = null
    let state: string | null = null
    const locM = block.match(/Primary\s+Practice\s+Location:<\/strong>\s*([\s\S]*?)(?:<\/p>|<br|<a\s)/i)
    if (locM) {
      const locText = locM[1].replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim()
      const parts = locText.split(',').map(s => s.trim())
      if (parts.length >= 2) { city = parts[0]; state = parts[1] }
      else if (parts[0]) city = parts[0]
    }

    // Practice areas
    let practiceAreas: string | null = null
    const paM = block.match(/Practice\s+Areas:<\/strong>\s*([\s\S]*?)(?:<\/p>|<br|<a\s)/i)
    if (paM) {
      const pa = paM[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (!pa.includes('None Specified') && !pa.includes('None Reported') && pa.length > 2) {
        practiceAreas = pa
      }
    }

    attorneys.push({
      name, firstName, lastName: lastName2, contactId: cid,
      barNumber: null, city, state, phone: null, email: null,
      firmName: null, lawSchool: null, dateAdmitted: null,
      status: null, practiceAreas, firmSize: null,
    })
  }

  return attorneys
}

async function enrichDetail(a: Attorney, cookies: string): Promise<void> {
  const url = `https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&template=/Customsource/MemberDirectory/MemberDirectoryDetail.cfm&ContactID=${a.contactId}`
  const res = await fetch(url, { headers: { ...BROWSER_HEADERS, 'Cookie': cookies }, redirect: 'follow' })
  const html = await res.text()

  // Bar Card Number
  const barM = html.match(/Bar\s*Card\s*Number:<\/strong>\s*(\d{5,10})/i)
  if (barM) a.barNumber = barM[1]

  // Status
  if (/Eligible\s+to\s+Practice/i.test(html)) a.status = 'Active'
  else if (/Currently\s+Active/i.test(html)) a.status = 'Active'
  else if (/Deceased/i.test(html)) a.status = 'Deceased'
  else if (/Not\s+Eligible/i.test(html)) a.status = 'Not Eligible'
  else if (/Inactive/i.test(html)) a.status = 'Inactive'
  else if (/Suspended/i.test(html)) a.status = 'Suspended'
  else if (/Disbarred/i.test(html)) a.status = 'Disbarred'
  else if (/Resigned/i.test(html)) a.status = 'Resigned'

  // Location (override from detail - more precise)
  const locM = html.match(/Primary\s+Practice\s+Location:<\/strong>\s*([^<]+)/i)
  if (locM) {
    const parts = locM[1].replace(/&nbsp;/g, ' ').trim().split(/\s*,\s*/)
    if (parts.length >= 2) { a.city = parts[0].trim(); a.state = parts[1].trim() }
  }

  // Phone
  const phoneM = html.match(/tel:\+?1?(\d{10})/i)
  if (phoneM) {
    const d = phoneM[1]
    const fmt = `(${d.substring(0, 3)}) ${d.substring(3, 6)}-${d.substring(6)}`
    if (fmt !== TX_BAR_PHONE) a.phone = fmt
  }

  // Email
  const emailM = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
  if (emailM) a.email = emailM[1]

  // Firm
  const firmM = html.match(/Firm:<\/strong>\s*([^<]+)/i) || html.match(/Company:<\/strong>\s*([^<]+)/i)
  if (firmM) {
    const f = firmM[1].trim()
    if (f !== 'None Reported By Attorney' && f.length > 1) a.firmName = f
  }

  // Firm Size
  const sizeM = html.match(/Firm\s*Size[:\s]*<\/strong>\s*([^<]+)/i)
  if (sizeM) a.firmSize = sizeM[1].trim()

  // Law School (table pattern)
  const schoolM = html.match(/<td[^>]*>\s*([^<]{5,80}?)\s*<\/td>\s*<td[^>]*>\s*[^<]*(?:Juris|J\.?D|LL\.?[BM]|Doctor of Jur)[^<]*<\/td>\s*<td[^>]*>\s*(\d{2}\/\d{4})\s*<\/td>/i)
  if (schoolM) {
    a.lawSchool = schoolM[1].trim()
    if (!a.dateAdmitted) a.dateAdmitted = schoolM[2]
  }
  if (!a.lawSchool) {
    const simpleS = html.match(/<td[^>]*>\s*([A-Z][^<]{5,80})\s*<\/td>\s*<td[^>]*>\s*[^<]*(?:Juris|J\.?D|LL\.?[BM]|Doctor)[^<]*<\/td>/i)
    if (simpleS) a.lawSchool = simpleS[1].trim()
  }

  // License date
  const licM = html.match(/(\d{2}\/\d{2}\/\d{4})/i)
  if (licM && !a.dateAdmitted) a.dateAdmitted = licM[1]

  // Practice areas (detail page may have more)
  const paM = html.match(/Practice\s+Areas?:<\/strong>\s*([^<]+)/i)
  if (paM) {
    const pa = paM[1].trim()
    if (!pa.includes('None Reported') && !pa.includes('None Specified') && pa.length > 2) {
      a.practiceAreas = pa
    }
  }
}

async function main() {
  console.log('=== TEXAS BAR ATTORNEY SCRAPING ===\n')

  // Session
  console.log('Getting session...')
  const cookies = await getSession()
  console.log('OK\n')

  // Search
  const allAttorneys: Attorney[] = []
  const seenIds = new Set<string>()
  const terms = ['Garcia', 'Smith', 'Johnson', 'Williams', 'Brown', 'Martinez']

  for (const term of terms) {
    if (allAttorneys.length >= 60) break
    console.log(`Searching "${term}"...`)
    try {
      const results = await searchByLastName(term, cookies)
      let added = 0
      for (const r of results) {
        if (!seenIds.has(r.contactId)) {
          seenIds.add(r.contactId)
          allAttorneys.push(r)
          added++
        }
      }
      console.log(`  -> ${results.length} found, ${added} new (total: ${allAttorneys.length})`)
      await sleep(600)
    } catch (err: any) {
      console.log(`  Error: ${err.message}`)
    }
  }

  console.log(`\nTotal: ${allAttorneys.length} unique attorneys\n`)

  if (allAttorneys.length === 0) {
    console.log('ERROR: No attorneys found.')
    return
  }

  // Enrich
  console.log('Fetching detail pages...\n')
  const toEnrich = allAttorneys.slice(0, 55)

  for (let i = 0; i < toEnrich.length; i++) {
    const a = toEnrich[i]
    process.stdout.write(`  [${i + 1}/${toEnrich.length}] ${a.name.padEnd(30)} `)
    try {
      await enrichDetail(a, cookies)
      process.stdout.write(`Bar#${a.barNumber || '???'} | ${a.status || '?'} | ${a.city || '?'}\n`)
    } catch (err: any) {
      process.stdout.write(`ERROR\n`)
    }
    await sleep(400)
  }

  // ============================================================================
  // RESULTS
  // ============================================================================
  const withBar = toEnrich.filter(a => a.barNumber)

  console.log('\n' + '='.repeat(60))
  console.log(`  TOTAL: ${allAttorneys.length} attorneys from search`)
  console.log(`  ENRICHED: ${toEnrich.length} detail pages fetched`)
  console.log(`  WITH BAR#: ${withBar.length}`)
  console.log('='.repeat(60))

  console.log('\n--- First 5 Complete Records ---\n')
  for (let i = 0; i < Math.min(5, withBar.length); i++) {
    const a = withBar[i]
    console.log(`[${i + 1}] ${a.name}`)
    console.log(`    Contact ID:     ${a.contactId}`)
    console.log(`    Bar Number:     ${a.barNumber}`)
    console.log(`    Status:         ${a.status || 'N/A'}`)
    console.log(`    City/State:     ${a.city || 'N/A'}, ${a.state || 'N/A'}`)
    console.log(`    Phone:          ${a.phone || 'N/A'}`)
    console.log(`    Email:          ${a.email || 'N/A'}`)
    console.log(`    Firm:           ${a.firmName || 'N/A'}`)
    console.log(`    Firm Size:      ${a.firmSize || 'N/A'}`)
    console.log(`    Law School:     ${a.lawSchool || 'N/A'}`)
    console.log(`    Admitted:       ${a.dateAdmitted || 'N/A'}`)
    console.log(`    Practice Areas: ${a.practiceAreas || 'N/A'}`)
    console.log()
  }

  // Stats
  const t = toEnrich.length
  const pct = (c: number) => `${c}/${t} (${Math.round(c / t * 100)}%)`
  console.log('--- Data Coverage ---')
  console.log(`  Bar #:        ${pct(withBar.length)}`)
  console.log(`  Status:       ${pct(toEnrich.filter(a => a.status).length)}`)
  console.log(`  City:         ${pct(toEnrich.filter(a => a.city).length)}`)
  console.log(`  Phone:        ${pct(toEnrich.filter(a => a.phone).length)}`)
  console.log(`  Email:        ${pct(toEnrich.filter(a => a.email).length)}`)
  console.log(`  Firm:         ${pct(toEnrich.filter(a => a.firmName).length)}`)
  console.log(`  Law School:   ${pct(toEnrich.filter(a => a.lawSchool).length)}`)
  console.log(`  Admitted:     ${pct(toEnrich.filter(a => a.dateAdmitted).length)}`)
  console.log(`  Practice:     ${pct(toEnrich.filter(a => a.practiceAreas).length)}`)

  const statusDist: Record<string, number> = {}
  toEnrich.forEach(a => { statusDist[a.status || 'Unknown'] = (statusDist[a.status || 'Unknown'] || 0) + 1 })
  console.log('\n--- Status Distribution ---')
  Object.entries(statusDist).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`  ${s}: ${c}`))
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
