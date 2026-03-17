/**
 * CalBar Scraping Research - Final Working Script
 * Tests two proven approaches and extracts ~50 real attorney records.
 *
 * Usage: npx tsx scripts/ingest/test-ca.ts
 */

interface CalBarRecord {
  barNumber: string
  name: string
  firstName: string
  lastName: string
  status: string
  address: string
  firmName: string
  city: string
  state: string
  zip: string
  phone: string
  fax: string
  email: string
  website: string
  admitDate: string
  source: string
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// APPROACH A: Parse search results page (gets bar# + name for 500 at a time)
// Then fetch individual profiles for full data
// ============================================================================
async function approachA_searchThenDetail(): Promise<CalBarRecord[]> {
  console.log('\n' + '='.repeat(70))
  console.log('APPROACH A: Search results -> individual profile pages')
  console.log('='.repeat(70))

  // Step 1: Get list of bar numbers from search
  const searchUrl = 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch?FreeText=Smith&SortBy=name'
  console.log(`\n  Step 1: Fetching search results from ${searchUrl}`)

  const searchRes = await fetch(searchUrl, {
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  const searchHtml = await searchRes.text()

  // Extract bar numbers and names from detail links
  const detailLinks = [...searchHtml.matchAll(/href="[^"]*Licensee\/Detail\/(\d+)[^"]*"[^>]*>([^<]*)/gi)]
  console.log(`  Found ${detailLinks.length} attorney links in search results`)

  // Take first 55 to get ~50 valid
  const targets = detailLinks.slice(0, 55).map(m => ({
    barNumber: m[1],
    searchName: m[2].trim(),
  }))

  console.log(`  Will fetch ${targets.length} individual profiles...\n`)

  // Step 2: Fetch each profile
  const records: CalBarRecord[] = []

  for (const target of targets) {
    try {
      const record = await fetchAndParseProfile(parseInt(target.barNumber))
      if (record && record.name) {
        records.push(record)
        if (records.length <= 5 || records.length % 10 === 0) {
          console.log(`  [${records.length}] Bar #${record.barNumber}: ${record.name} (${record.status}) - ${record.city || 'N/A'}`)
        }
      }
    } catch (err: any) {
      // skip silently
    }
    await sleep(200)

    if (records.length >= 50) break
  }

  return records
}

// ============================================================================
// APPROACH B: Sequential bar numbers with profile parsing
// ============================================================================
async function approachB_sequentialBarNumbers(): Promise<CalBarRecord[]> {
  console.log('\n' + '='.repeat(70))
  console.log('APPROACH B: Sequential bar numbers (200001+)')
  console.log('='.repeat(70))

  const records: CalBarRecord[] = []
  const startNum = 200001

  for (let barNum = startNum; barNum <= startNum + 80 && records.length < 50; barNum++) {
    try {
      const record = await fetchAndParseProfile(barNum)
      if (record && record.name) {
        records.push(record)
        if (records.length <= 5 || records.length % 10 === 0) {
          console.log(`  [${records.length}] Bar #${record.barNumber}: ${record.name} (${record.status}) - ${record.city || 'N/A'}`)
        }
      }
    } catch {
      // skip
    }
    await sleep(200)
  }

  return records
}

// ============================================================================
// Profile page parser (based on actual CalBar HTML structure analysis)
// ============================================================================
async function fetchAndParseProfile(barNum: number): Promise<CalBarRecord | null> {
  const url = `https://apps.calbar.ca.gov/attorney/Licensee/Detail/${barNum}`
  const res = await fetch(url, {
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  if (res.status !== 200) return null
  const html = await res.text()

  // Check this is a real profile page (not redirect to search)
  if (!html.includes('moduleMemberDetail') && !html.includes('License Status')) return null

  // === NAME ===
  // Pattern: <h3><b> FirstName MiddleName LastName \n #XXXXX </b></h3>
  const nameMatch = html.match(/<h3>\s*<b>\s*([\s\S]*?)#(\d+)\s*<\/b>\s*<\/h3>/)
  let fullName = ''
  if (nameMatch) {
    fullName = nameMatch[1].replace(/\s+/g, ' ').trim()
  }

  // === STATUS ===
  // Active = plain text: "License Status:\r\n                    Active"
  // Other statuses (Inactive, Resigned, etc.) = in <span style="background-color:...">
  // Must restrict to the status section only (before "<!-- End: Name and status -->")
  let status = ''
  const statusSection = html.match(/License Status:([\s\S]*?)<!-- End: Name and status -->/i)
  if (statusSection) {
    const section = statusSection[1]
    // Check for <span> with background-color (non-Active statuses)
    const spanMatch = section.match(/<span\s+style="background-color[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
    if (spanMatch) {
      status = spanMatch[1].replace(/&nbsp;/g, '').replace(/<[^>]*>/g, '').trim()
    } else {
      // Active status is plain text
      const plainMatch = section.match(/\s+([A-Za-z][A-Za-z ]+[A-Za-z])\s/)
      if (plainMatch) {
        status = plainMatch[1].trim()
      }
    }
  }

  // === ADDRESS ===
  // Pattern: Address: FirmName, Street, City, ST ZIP
  const addressMatch = html.match(/Address:\s*([\s\S]*?)\s*<\/p>/i)
  let address = '', firmName = '', city = '', state = '', zip = ''
  if (addressMatch) {
    address = addressMatch[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Parse address: "FirmName, Street, City, ST ZIP"
    const parts = address.split(',').map(p => p.trim())
    if (parts.length >= 3) {
      // Last part should be "ST ZIP" or "City, ST ZIP"
      const lastPart = parts[parts.length - 1].trim()
      const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/)
      if (stateZipMatch) {
        state = stateZipMatch[1]
        zip = stateZipMatch[2]
        // City is the part before state/zip
        const cityPart = parts[parts.length - 2]?.trim() || ''
        city = cityPart
      }
      // First part is typically firm name
      if (parts.length >= 4) {
        firmName = parts[0]
      }
    }
  }

  // === PHONE & FAX ===
  const phoneMatch = html.match(/Phone:\s*([0-9()\s.-]+)/i)
  const phone = phoneMatch ? phoneMatch[1].trim() : ''
  const faxMatch = html.match(/Fax:\s*([0-9()\s.-]+)/i)
  const fax = faxMatch ? faxMatch[1].trim() : ''

  // === EMAIL ===
  let email = ''
  const emailSection = html.match(/Email:\s*([\s\S]{0,200})/i)
  if (emailSection) {
    const emailAddr = emailSection[1].match(/[\w.-]+@[\w.-]+\.\w{2,}/)
    if (emailAddr) {
      email = emailAddr[0]
    } else if (emailSection[1].includes('Not Available')) {
      email = ''
    }
  }

  // === WEBSITE ===
  const websiteMatch = html.match(/var memberWebsite\s*=\s*'([^']+)'/)
  const website = websiteMatch ? websiteMatch[1].replace(/^https?:\/\//, '') : ''

  // === ADMISSION DATE ===
  // Pattern: <td><strong>12/20/1974</strong></td>\n<td colspan="3">Admitted to the State Bar
  const admitMatch = html.match(/<td><strong>(\d{1,2}\/\d{1,2}\/\d{4})<\/strong><\/td>\s*<td[^>]*>Admitted to/i)
  const admitDate = admitMatch ? admitMatch[1] : ''

  // Parse first/last name
  const nameParts = fullName.split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''

  if (!fullName && !status) return null

  return {
    barNumber: String(barNum),
    name: fullName,
    firstName,
    lastName,
    status,
    address,
    firmName,
    city,
    state,
    zip,
    phone,
    fax,
    email,
    website,
    admitDate,
    source: 'calbar_profile',
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('========================================================')
  console.log('  CalBar Scraping Research - Working Approaches')
  console.log('========================================================')

  // Try approach A first (search -> details)
  const recordsA = await approachA_searchThenDetail()

  console.log(`\n  Approach A yielded ${recordsA.length} records`)

  let finalRecords = recordsA

  // If approach A didn't get 50, supplement with approach B
  if (recordsA.length < 50) {
    const recordsB = await approachB_sequentialBarNumbers()
    console.log(`\n  Approach B yielded ${recordsB.length} records`)

    // Merge, dedup by barNumber
    const seen = new Set(recordsA.map(r => r.barNumber))
    for (const r of recordsB) {
      if (!seen.has(r.barNumber)) {
        finalRecords.push(r)
        seen.add(r.barNumber)
      }
    }
  }

  // ==================== FINAL REPORT ====================
  console.log('\n' + '='.repeat(70))
  console.log('FINAL REPORT')
  console.log('='.repeat(70))
  console.log(`Total records: ${finalRecords.length}`)

  // Stats
  const statusCounts: Record<string, number> = {}
  let withPhone = 0, withEmail = 0, withFirm = 0, withAdmit = 0, withCity = 0
  for (const r of finalRecords) {
    statusCounts[r.status || 'UNKNOWN'] = (statusCounts[r.status || 'UNKNOWN'] || 0) + 1
    if (r.phone) withPhone++
    if (r.email) withEmail++
    if (r.firmName) withFirm++
    if (r.admitDate) withAdmit++
    if (r.city) withCity++
  }

  console.log('\nStatus distribution:')
  for (const [s, c] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${c}`)
  }

  console.log(`\nField coverage (out of ${finalRecords.length}):`)
  console.log(`  Phone:     ${withPhone} (${Math.round(withPhone / finalRecords.length * 100)}%)`)
  console.log(`  Email:     ${withEmail} (${Math.round(withEmail / finalRecords.length * 100)}%)`)
  console.log(`  Firm:      ${withFirm} (${Math.round(withFirm / finalRecords.length * 100)}%)`)
  console.log(`  City:      ${withCity} (${Math.round(withCity / finalRecords.length * 100)}%)`)
  console.log(`  Admit:     ${withAdmit} (${Math.round(withAdmit / finalRecords.length * 100)}%)`)

  console.log('\n--- First 5 records (full detail) ---')
  for (let i = 0; i < Math.min(5, finalRecords.length); i++) {
    const r = finalRecords[i]
    console.log(`\n  [${i + 1}] ${r.name} (Bar #${r.barNumber})`)
    console.log(`      Status:  ${r.status}`)
    console.log(`      Address: ${r.address || 'N/A'}`)
    console.log(`      City:    ${r.city || 'N/A'}, ${r.state || 'N/A'} ${r.zip || 'N/A'}`)
    console.log(`      Phone:   ${r.phone || 'N/A'}`)
    console.log(`      Fax:     ${r.fax || 'N/A'}`)
    console.log(`      Email:   ${r.email || 'N/A'}`)
    console.log(`      Website: ${r.website || 'N/A'}`)
    console.log(`      Firm:    ${r.firmName || 'N/A'}`)
    console.log(`      Admit:   ${r.admitDate || 'N/A'}`)
  }

  console.log('\n--- CONCLUSION ---')
  if (finalRecords.length >= 50) {
    console.log('SUCCESS: Got 50+ attorney records from CalBar profile pages.')
    console.log('Method: Fetch individual /attorney/Licensee/Detail/{barNumber} pages')
    console.log('Scale strategy: Search page yields 500 bar numbers per query,')
    console.log('  then fetch each profile. With 2-letter last name prefixes,')
    console.log('  we can enumerate all ~190K attorneys.')
  } else {
    console.log(`Got ${finalRecords.length} records. Parsing may need refinement.`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
