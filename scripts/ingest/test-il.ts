/**
 * Illinois ARDC Attorney Scraping - FINAL PROOF
 *
 * PROVEN METHOD (pure HTTP, no browser needed):
 * 1. GET /Lawyer/Search -> cookies + __RequestVerificationToken
 * 2. POST /Lawyer/SearchResults -> PageKey
 * 3. POST /Lawyer/SearchGrid -> paginated HTML table (10/page)
 * 4. POST /Lawyer/Details/{GUID} -> full attorney profile modal
 *
 * Usage: npx tsx scripts/ingest/test-il.ts
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

interface AttorneyRecord {
  guid: string
  name: string
  city: string
  state: string
  date_admitted: string
  authorized: string
  // From detail page
  ardc_number?: string
  full_address?: string
  phone?: string
  email?: string
  firm?: string
  law_school?: string
  full_status?: string
  county?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== Illinois ARDC Attorney Scraping - PROOF OF CONCEPT ===')
  console.log(`Date: ${new Date().toISOString()}\n`)

  // --- STEP 1: Session ---
  const s1 = await fetch('https://www.iardc.org/Lawyer/Search', {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' },
  })
  const cookies = (s1.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ')
  const s1Html = await s1.text()
  const token1 = (s1Html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)
    || s1Html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/))?.[1] || ''
  console.log('[1] Session: OK')

  // --- STEP 2: Search results page ---
  const s2 = await fetch('https://www.iardc.org/Lawyer/SearchResults', {
    method: 'POST',
    headers: {
      'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies, 'Referer': 'https://www.iardc.org/Lawyer/Search', 'Origin': 'https://www.iardc.org',
    },
    body: new URLSearchParams({
      LastName: 'Smith', FirstName: '', IsRecentSearch: 'false',
      IncludeFormerNames: 'false', __RequestVerificationToken: token1,
    }).toString(),
  })
  const nc = s2.headers.getSetCookie?.() || []
  let allCookies = cookies
  if (nc.length > 0) {
    const m = new Map(cookies.split('; ').map(c => { const [k, ...v] = c.split('='); return [k, v.join('=')] as [string, string] }))
    nc.forEach(c => { const [kv] = c.split(';'); const [k, ...v] = kv.split('='); m.set(k, v.join('=')) })
    allCookies = [...m].map(([k, v]) => `${k}=${v}`).join('; ')
  }
  const s2Html = await s2.text()
  const pageKey = s2Html.match(/PageKey:\s*"([^"]+)"/)?.[1] || ''
  const token2 = (s2Html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)
    || s2Html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/))?.[1] || token1
  console.log(`[2] SearchResults: OK (PageKey: ${pageKey.substring(0, 12)}...)`)

  // --- STEP 3: Grid data (6 pages = 60 records) ---
  const gridParams = new URLSearchParams({
    PageKey: pageKey, LastName: 'Smith', LastNameMatch: '0', IncludeFormerNames: 'false',
    FirstName: '', Status: '1', City: '', State: '', Country: '',
    StatusChangeTimeFrame: '0', BusinessLocation: '0', County: '', LawyerCounty: '',
    JudicialCircuit: '', JudicialDistrict: '', IsRecentSearch: 'false',
    StatusLastName: '', __RequestVerificationToken: token2,
  })

  const allRecords: AttorneyRecord[] = []
  for (let page = 1; allRecords.length < 55; page++) {
    const url = page === 1
      ? 'https://www.iardc.org/Lawyer/SearchGrid'
      : `https://www.iardc.org/Lawyer/SearchGrid?page=${page}&rows=10`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': UA, 'Accept': '*/*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': allCookies, 'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.iardc.org/Lawyer/SearchResults', 'Origin': 'https://www.iardc.org',
      },
      body: gridParams.toString(),
    })
    if (res.status !== 200) break
    const html = await res.text()
    if (page === 1) {
      const total = html.match(/data-total-results="(\d+)"/)
      if (total) console.log(`[3] Grid: Total "Smith" attorneys: ${total[1]}`)
    }
    const records = parseGridPage(html)
    if (records.length === 0) break
    allRecords.push(...records)
    if (records.length < 10) break
    await sleep(200)
  }
  console.log(`    Fetched ${allRecords.length} records from grid`)

  // --- STEP 4: Detail for first 5 records ---
  console.log('\n[4] Fetching full detail for first 5 records...')
  for (let i = 0; i < Math.min(5, allRecords.length); i++) {
    const r = allRecords[i]
    try {
      const detRes = await fetch(`https://www.iardc.org/Lawyer/Details/${r.guid}`, {
        method: 'POST',
        headers: {
          'User-Agent': UA, 'Accept': '*/*',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': allCookies, 'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.iardc.org/Lawyer/SearchResults', 'Origin': 'https://www.iardc.org',
        },
        body: new URLSearchParams({
          id: r.guid, includeFormerNames: 'false', __RequestVerificationToken: token2,
        }).toString(),
      })

      if (detRes.status === 200) {
        const html = await detRes.text()
        parseDetailInto(html, r)
      }
      await sleep(300)
    } catch (err: any) {
      console.log(`    Error fetching detail for ${r.name}: ${err.message}`)
    }
  }

  // --- FINAL OUTPUT ---
  console.log('\n========================================')
  console.log(`RESULTS: ${allRecords.length} attorneys scraped`)
  console.log('========================================\n')

  console.log('First 5 records (with full detail):')
  allRecords.slice(0, 5).forEach((r, i) => {
    console.log(`\n--- [${i + 1}] ${r.name} ---`)
    if (r.ardc_number) console.log(`  ARDC Registration #: ${r.ardc_number}`)
    console.log(`  GUID: ${r.guid}`)
    console.log(`  City: ${r.city}, State: ${r.state}`)
    console.log(`  Date Admitted: ${r.date_admitted}`)
    console.log(`  Authorized: ${r.authorized}`)
    if (r.full_status) console.log(`  Full Status: ${r.full_status}`)
    if (r.firm) console.log(`  Firm: ${r.firm}`)
    if (r.full_address) console.log(`  Address: ${r.full_address}`)
    if (r.phone) console.log(`  Phone: ${r.phone}`)
    if (r.email) console.log(`  Email: ${r.email}`)
    if (r.law_school) console.log(`  Law School: ${r.law_school}`)
    if (r.county) console.log(`  County: ${r.county}`)
  })

  console.log('\n\nRecords 6-10 (grid data only):')
  allRecords.slice(5, 10).forEach((r, i) => {
    console.log(`  [${i + 6}] ${r.name} | ${r.city}, ${r.state} | Admitted: ${r.date_admitted} | Auth: ${r.authorized}`)
  })

  console.log('\n========================================')
  console.log('METHOD PROVEN')
  console.log('========================================')
  console.log('Flow: GET /Lawyer/Search -> POST /Lawyer/SearchResults -> POST /Lawyer/SearchGrid -> POST /Lawyer/Details/{GUID}')
  console.log(`Grid: ${allRecords.length} records fetched (name, city, state, date_admitted, authorized)`)
  console.log('Detail: Full profile (ARDC#, firm, address, phone, email, law_school, status)')
  console.log('Scale: Search by last-name prefix A-Z for all ~95K attorneys')
}

function parseGridPage(html: string): AttorneyRecord[] {
  const records: AttorneyRecord[] = []
  const columns: string[] = []
  const headerMatch = html.match(/<thead>([\s\S]*?)<\/thead>/)
  if (headerMatch) {
    let m; const p = /data-name="([^"]+)"/g
    while ((m = p.exec(headerMatch[1])) !== null) columns.push(m[1])
  }

  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/)
  const rowsHtml = tbodyMatch ? tbodyMatch[1] : html
  const rowPattern = /<tr>[\s\S]*?<\/tr>/g
  let rowMatch
  while ((rowMatch = rowPattern.exec(rowsHtml)) !== null) {
    const row = rowMatch[0]
    if (row.includes('<th')) continue
    const cells: string[] = [], cellHtmls: string[] = []
    let tdMatch; const tdP = /<td[^>]*>([\s\S]*?)<\/td>/g
    while ((tdMatch = tdP.exec(row)) !== null) { cellHtmls.push(tdMatch[1]); cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim()) }
    if (cells.length < 5 || columns.length < 5) continue

    const nameIdx = columns.indexOf('name')
    const name = cells[nameIdx] || ''
    if (!name || name === 'False' || name.length < 3) continue

    const guidMatch = cellHtmls[nameIdx]?.match(/data-id='([^']+)'/)
    records.push({
      guid: guidMatch?.[1] || cells[columns.indexOf('id')] || '',
      name,
      city: cells[columns.indexOf('city')] || '',
      state: cells[columns.indexOf('state')] || '',
      date_admitted: cells[columns.indexOf('date-admitted')] || '',
      authorized: cells[columns.indexOf('authorized-to-practice')] || '',
    })
  }
  return records
}

function parseDetailInto(html: string, record: AttorneyRecord) {
  // Helper to extract label-value pairs from the detail modal
  // The modal uses Bootstrap form-horizontal with form-groups
  // Pattern: <label>Label</label> ... <p>Value</p> or <span>Value</span>

  // Registration Number
  const regMatch = html.match(/Registration\s*Number[\s\S]*?<[^>]*>(\d{7})</)
    || html.match(/(?:ARDC|Registration)\s*(?:#|Number|No)[^<]*<[^>]*>\s*(\d+)\s*</)
    || html.match(/>\s*(\d{7})\s*</)
  if (regMatch) record.ardc_number = regMatch[1]

  // Full status
  const statusMatch = html.match(/(?:Lawyer\s*)?Status[\s\S]{0,200}?<[^>]*class="[^"]*"[^>]*>([^<]+)</)
  if (statusMatch) record.full_status = statusMatch[1].trim()

  // Firm
  const firmMatch = html.match(/Firm[\s\S]{0,200}?<p[^>]*>([^<]+)</)
    || html.match(/Employer[\s\S]{0,200}?<p[^>]*>([^<]+)</)
  if (firmMatch) record.firm = firmMatch[1].trim()

  // Address
  const addrMatch = html.match(/Address[\s\S]{0,300}?<p[^>]*>([\s\S]*?)<\/p>/)
  if (addrMatch) record.full_address = addrMatch[1].replace(/<br\s*\/?>/g, ', ').replace(/<[^>]+>/g, '').trim()

  // Phone
  const phoneMatch = html.match(/Phone[\s\S]{0,200}?<[^>]*>([^<]*\d{3}[^<]*)</)
  if (phoneMatch) record.phone = phoneMatch[1].trim()

  // Email
  const emailMatch = html.match(/mailto:([^"]+)"/)
    || html.match(/Email[\s\S]{0,200}?<[^>]*>([^<]+@[^<]+)</)
  if (emailMatch) record.email = emailMatch[1].trim()

  // Law School
  const schoolMatch = html.match(/Law\s*School[\s\S]{0,200}?<p[^>]*>([^<]+)</)
    || html.match(/School[\s\S]{0,200}?<p[^>]*>([^<]+)</)
  if (schoolMatch) record.law_school = schoolMatch[1].trim()

  // County
  const countyMatch = html.match(/County[\s\S]{0,200}?<p[^>]*>([^<]+)</)
  if (countyMatch) record.county = countyMatch[1].trim()

  // If we didn't find registration number, try more aggressively
  if (!record.ardc_number) {
    // Look for any 7-digit number that's not a phone number
    const allNums = html.match(/\b\d{7}\b/g)
    if (allNums) {
      // Filter out likely phone fragments
      const candidates = allNums.filter(n => !html.includes(`${n}-`) && !html.includes(`-${n}`))
      if (candidates.length > 0) record.ardc_number = candidates[0]
    }
  }

  // Parse all form-group label/value pairs for complete data extraction
  const groupPattern = /vertical-header[\s\S]*?form-control-static[^>]*>([^<]+)<[\s\S]*?vertical-body[\s\S]*?form-control-static[^>]*>([\s\S]*?)<\/p>/g
  let gm
  const fields: Record<string, string> = {}
  while ((gm = groupPattern.exec(html)) !== null) {
    const label = gm[1].trim()
    const value = gm[2].replace(/<[^>]+>/g, '').trim()
    fields[label] = value
  }

  // Also try simpler pattern for direct label-value pairs
  const labelPattern = /<label[^>]*>([^<]+)<\/label>[\s\S]*?<p[^>]*class="form-control-static"[^>]*>([\s\S]*?)<\/p>/g
  while ((gm = labelPattern.exec(html)) !== null) {
    const label = gm[1].trim()
    const value = gm[2].replace(/<[^>]+>/g, '').trim()
    if (!fields[label]) fields[label] = value
  }

  // Log all extracted fields for debugging
  if (Object.keys(fields).length > 0) {
    // Apply fields to record
    for (const [label, value] of Object.entries(fields)) {
      if (/registration\s*number/i.test(label)) record.ardc_number = value
      if (/status/i.test(label)) record.full_status = value
      if (/law\s*school/i.test(label)) record.law_school = value
      if (/firm|employer/i.test(label)) record.firm = value
      if (/county/i.test(label)) record.county = value
    }
  }

  // Extract address from the specific section
  const addrSection = html.match(/Registered\s*Address[\s\S]*?<\/div>[\s\S]*?<\/div>/i)
  if (addrSection) {
    const addrText = addrSection[0].replace(/<br\s*\/?>/g, ', ').replace(/<[^>]+>/g, '').trim()
    const cleanAddr = addrText.replace(/Registered\s*Address/i, '').trim()
    if (cleanAddr) record.full_address = cleanAddr
  }

  // Try to extract firm name from the address line (often the first line)
  if (!record.firm && record.full_address) {
    // If address starts with a company name (not a number), that's likely the firm
    const lines = record.full_address.split(',').map(l => l.trim())
    if (lines[0] && !/^\d/.test(lines[0]) && !lines[0].match(/^(East|West|North|South|New|Saint|Fort|San)\s/i)) {
      record.firm = lines[0]
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
