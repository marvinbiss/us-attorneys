/**
 * Ohio Supreme Court Attorney Search - API Research & Test Script
 *
 * DISCOVERY via Wayback Machine analysis of Ember.js 1.13 SPA source (site.js, 2021 snapshot).
 *
 * Endpoint: POST https://www.supremecourt.ohio.gov/AttorneySearch/Ajax.ashx
 * Auth:     X-CSRF-TOKEN header (value from <meta name="csrf-token"> on HTML page)
 * Content:  application/x-www-form-urlencoded
 *
 * SearchAttorney action:
 *   Request:  action, attyReg, firstName, lastName, middleName, address, city, state, employerZip, county
 *   Response: { MySearchResults: [{AttorneyNumber, FirstName, LastName, MiddleName, Name, City, Employer, Status}], TooManyResults, NoResults }
 *
 * GetAttyInfo action:
 *   Request:  action, regNumber
 *   Response: AttorneyNumber, FormalName, Employer, Address, City, State, ZipCode, County,
 *             JobTitle, LawSchool, AdmittedBy, AdmissionDate, Status, BusinessPhoneNumber,
 *             HasDiscipline, MyDisciplines, MyPreviousNames, MySanctions, HasSanctions,
 *             IsInvalidAddress, HasBusinessPhoneNumber
 *
 * GetAttyDiscipline action:
 *   Request:  action, attyNumber
 *   Response: AttorneyNumber, EffectiveDate, Action, Description, CMSCaseId, SCCaseNumber, Comment1-3
 *
 * BLOCKER: supremecourt.ohio.gov unreachable from this network (connection timeout).
 */

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
}

const BASE_URL = 'https://www.supremecourt.ohio.gov/AttorneySearch'
const AJAX_URL = `${BASE_URL}/Ajax.ashx`

interface OHAttorneyRecord {
  attorneyNumber: string
  formalName: string
  firstName: string
  lastName: string
  middleName: string
  employer: string
  address: string
  city: string
  state: string
  zipCode: string
  county: string
  jobTitle: string
  lawSchool: string
  admittedBy: string
  admissionDate: string
  status: string
  businessPhoneNumber: string
  hasDiscipline: boolean
  source: string
}

// ============================================================================
// STEP 1: Get CSRF token and cookies from search page
// ============================================================================
async function getSessionInfo(): Promise<{ csrfToken: string; cookies: string }> {
  console.log('Fetching search page for CSRF token and cookies...')
  const res = await fetch(BASE_URL + '/', {
    headers: {
      ...BROWSER_HEADERS,
      'Accept': 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch search page: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  console.log(`  Page fetched: ${html.length} bytes`)

  // Extract CSRF token
  const csrfMatch = html.match(/csrf-token['"]\s+content=['"](.*?)['"]/)
  if (!csrfMatch) {
    console.log('  WARNING: No CSRF token found in page')
    console.log(`  Page preview: ${html.substring(0, 500)}`)
  }
  const csrfToken = csrfMatch?.[1] || ''
  console.log(`  CSRF Token: ${csrfToken ? csrfToken.substring(0, 20) + '...' : 'NOT FOUND'}`)

  // Extract cookies
  const setCookies = res.headers.getSetCookie?.() || []
  const cookies = setCookies.map(c => c.split(';')[0]).join('; ')
  console.log(`  Cookies: ${cookies || 'none'}`)

  return { csrfToken, cookies }
}

// ============================================================================
// STEP 2: Search attorneys by last name
// ============================================================================
async function searchAttorneys(
  lastName: string,
  csrfToken: string,
  cookies: string
): Promise<any[]> {
  const formData = new URLSearchParams({
    action: 'SearchAttorney',
    attyReg: '',
    firstName: '',
    lastName: lastName,
    middleName: '',
    address: '',
    city: '',
    state: '',
    employerZip: '',
    county: '',
  })

  const res = await fetch(AJAX_URL, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRF-TOKEN': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.supremecourt.ohio.gov',
      'Referer': BASE_URL + '/#/search',
      ...(cookies ? { 'Cookie': cookies } : {}),
    },
    body: formData.toString(),
  })

  console.log(`  Search "${lastName}": ${res.status} ${res.statusText}`)
  const text = await res.text()
  console.log(`  Response length: ${text.length}`)

  if (!res.ok) {
    console.log(`  Error response: ${text.substring(0, 500)}`)
    return []
  }

  try {
    const data = JSON.parse(text)
    if (Array.isArray(data)) {
      return data
    }
    // Could be object with results array
    console.log(`  Response keys: ${Object.keys(data).join(', ')}`)
    return data.results || data.data || data.attorneys || data.SearchResults || []
  } catch {
    console.log(`  Non-JSON response: ${text.substring(0, 500)}`)
    return []
  }
}

// ============================================================================
// STEP 2b: Search by attorney registration number
// ============================================================================
async function searchByRegNumber(
  regNumber: string,
  csrfToken: string,
  cookies: string
): Promise<any[]> {
  const formData = new URLSearchParams({
    action: 'SearchAttorney',
    attyReg: regNumber,
    firstName: '',
    lastName: '',
    middleName: '',
    address: '',
    city: '',
    state: '',
    employerZip: '',
    county: '',
  })

  const res = await fetch(AJAX_URL, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRF-TOKEN': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.supremecourt.ohio.gov',
      'Referer': BASE_URL + '/#/search',
      ...(cookies ? { 'Cookie': cookies } : {}),
    },
    body: formData.toString(),
  })

  const text = await res.text()
  if (!res.ok) return []

  try {
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : data.results || data.data || []
  } catch {
    return []
  }
}

// ============================================================================
// STEP 3: Get detailed attorney info
// ============================================================================
async function getAttyInfo(
  regNumber: string,
  csrfToken: string,
  cookies: string
): Promise<any | null> {
  const formData = new URLSearchParams({
    action: 'GetAttyInfo',
    regNumber: regNumber,
    attyNumber: regNumber,
  })

  const res = await fetch(AJAX_URL, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRF-TOKEN': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.supremecourt.ohio.gov',
      'Referer': BASE_URL + '/#/search',
      ...(cookies ? { 'Cookie': cookies } : {}),
    },
    body: formData.toString(),
  })

  if (!res.ok) return null

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ============================================================================
// ALTERNATIVE: Try JSON POST instead of form data
// ============================================================================
async function searchAttorneysJson(
  lastName: string,
  csrfToken: string,
  cookies: string
): Promise<any[]> {
  const body = {
    action: 'SearchAttorney',
    attyReg: '',
    firstName: '',
    lastName: lastName,
    middleName: '',
    address: '',
    city: '',
    state: '',
    employerZip: '',
    county: '',
  }

  const res = await fetch(AJAX_URL, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.supremecourt.ohio.gov',
      'Referer': BASE_URL + '/#/search',
      ...(cookies ? { 'Cookie': cookies } : {}),
    },
    body: JSON.stringify(body),
  })

  console.log(`  JSON search "${lastName}": ${res.status}`)
  const text = await res.text()
  console.log(`  Response: ${text.substring(0, 300)}`)

  if (!res.ok) return []

  try {
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : data.results || data.data || []
  } catch {
    return []
  }
}

// ============================================================================
// ALTERNATIVE: Try the original api/search endpoint with correct fields
// ============================================================================
async function tryOriginalApiSearch(
  lastName: string,
  csrfToken: string,
  cookies: string
): Promise<any[]> {
  console.log('\n--- Trying /api/search endpoint with correct field names ---')

  const endpoints = [
    `${BASE_URL}/api/search`,
    `${BASE_URL}/api/Search`,
    `${BASE_URL}/api/attorney/search`,
  ]

  for (const endpoint of endpoints) {
    try {
      const formData = new URLSearchParams({
        action: 'SearchAttorney',
        lastName: lastName,
      })

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...BROWSER_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': 'https://www.supremecourt.ohio.gov',
          'Referer': BASE_URL + '/#/search',
          ...(cookies ? { 'Cookie': cookies } : {}),
        },
        body: formData.toString(),
      })

      console.log(`  ${endpoint} -> ${res.status}`)
      if (res.ok) {
        const text = await res.text()
        console.log(`  Response: ${text.substring(0, 300)}`)
        try {
          const data = JSON.parse(text)
          const arr = Array.isArray(data) ? data : data.results || data.data || []
          if (arr.length > 0) return arr
        } catch {}
      }
    } catch (e: any) {
      console.log(`  ${endpoint} -> Error: ${e.message}`)
    }
  }

  return []
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('=== Ohio Supreme Court Attorney Search - API Test ===')
  console.log(`Date: ${new Date().toISOString()}`)
  console.log()
  console.log('Source: OH Supreme Court Attorney Search (Ember.js SPA)')
  console.log(`API: ${AJAX_URL}`)
  console.log()

  const allRecords: any[] = []

  // Step 1: Get session
  let csrfToken = ''
  let cookies = ''

  try {
    const session = await getSessionInfo()
    csrfToken = session.csrfToken
    cookies = session.cookies
  } catch (err: any) {
    console.log(`\nFailed to get session: ${err.message}`)
    console.log('The OH Supreme Court site may be unreachable from this network.')
    console.log('Trying without session...\n')
    // Use the token from Wayback Machine as fallback
    csrfToken = 'O5PSZaoU*ltwzVxPfJuFWJhHWn@&h#'
  }

  // Step 2: Try form-encoded search (the actual method used by the SPA)
  console.log('\n=== METHOD A: Form-encoded POST to Ajax.ashx ===')
  const searchNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson']

  for (const name of searchNames) {
    if (allRecords.length >= 60) break

    try {
      const results = await searchAttorneys(name, csrfToken, cookies)
      if (results.length > 0) {
        console.log(`  -> ${results.length} results!`)
        console.log(`  Sample: ${JSON.stringify(results[0], null, 2).substring(0, 300)}`)
        allRecords.push(...results)
      }
    } catch (err: any) {
      console.log(`  Error for "${name}": ${err.message}`)
    }

    await sleep(500)

    // If first search failed, try JSON variant
    if (allRecords.length === 0 && name === 'Smith') {
      console.log('\n  Form-encoded failed, trying JSON...')
      try {
        const jsonResults = await searchAttorneysJson(name, csrfToken, cookies)
        if (jsonResults.length > 0) {
          console.log(`  -> JSON got ${jsonResults.length} results!`)
          allRecords.push(...jsonResults)
        }
      } catch (err: any) {
        console.log(`  JSON error: ${err.message}`)
      }
      await sleep(500)
    }

    // If still nothing, try alternate endpoints
    if (allRecords.length === 0 && name === 'Smith') {
      const altResults = await tryOriginalApiSearch(name, csrfToken, cookies)
      if (altResults.length > 0) {
        allRecords.push(...altResults)
      }
    }

    // If nothing works, stop trying
    if (allRecords.length === 0 && name === 'Johnson') {
      console.log('\n  No results after 2 names. API may be unreachable.')
      break
    }
  }

  // Step 3: If search worked, try getting detailed info for some records
  if (allRecords.length > 0) {
    console.log('\n=== Getting detailed info for first few records ===')
    const toEnrich = allRecords.slice(0, 5)
    for (const record of toEnrich) {
      const regNum = record.AttorneyNumber || record.attorneyNumber || record.RegNumber || record.regNumber
      if (!regNum) continue

      try {
        const detail = await getAttyInfo(regNum, csrfToken, cookies)
        if (detail) {
          console.log(`\n  Detail for #${regNum}:`)
          console.log(`    ${JSON.stringify(detail, null, 2).substring(0, 500)}`)
        }
      } catch (err: any) {
        console.log(`  Detail error for #${regNum}: ${err.message}`)
      }
      await sleep(300)
    }
  }

  // Step 4: If nothing worked, try searching by reg number ranges
  if (allRecords.length === 0) {
    console.log('\n=== METHOD B: Search by registration number ranges ===')
    const testNumbers = [
      '10000', '20000', '30000', '40000', '50000',
      '60000', '70000', '80000', '90000', '100000',
    ]

    for (const num of testNumbers) {
      try {
        const results = await searchByRegNumber(num, csrfToken, cookies)
        if (results.length > 0) {
          console.log(`  Reg #${num}: ${results.length} results`)
          allRecords.push(...results)
        } else {
          // Also try GetAttyInfo directly
          const detail = await getAttyInfo(num, csrfToken, cookies)
          if (detail && (detail.FormalName || detail.AttorneyNumber)) {
            console.log(`  Direct info for #${num}: ${detail.FormalName}`)
            allRecords.push(detail)
          } else {
            console.log(`  Reg #${num}: no results`)
          }
        }
      } catch (err: any) {
        console.log(`  Reg #${num}: ${err.message}`)
      }
      await sleep(300)

      if (allRecords.length >= 50) break
    }
  }

  // ============================================================================
  // RESULTS
  // ============================================================================
  console.log('\n' + '='.repeat(60))
  console.log(`  RESULTS: ${allRecords.length} attorney records`)
  console.log('='.repeat(60))

  if (allRecords.length > 0) {
    // Show first 5
    console.log('\n--- First 5 Records ---\n')
    for (let i = 0; i < Math.min(5, allRecords.length); i++) {
      console.log(`[${i + 1}] ${JSON.stringify(allRecords[i], null, 2)}`)
      console.log()
    }

    // All keys across records
    const allKeys = new Set<string>()
    allRecords.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)))
    console.log(`\nAll record keys: ${[...allKeys].join(', ')}`)
  } else {
    console.log('\n*** NO RECORDS COLLECTED ***')
    console.log()
    console.log('Root cause: The OH Supreme Court website (supremecourt.ohio.gov)')
    console.log('is unreachable from this network (connection timeout on port 443).')
    console.log()
    console.log('CONFIRMED API structure (from Wayback Machine source code analysis):')
    console.log('  Technology: Ember.js 1.13 SPA')
    console.log('  Endpoint: POST /AttorneySearch/Ajax.ashx')
    console.log('  Content-Type: application/x-www-form-urlencoded')
    console.log('  Required header: X-CSRF-TOKEN (from <meta name="csrf-token"> on search page)')
    console.log()
    console.log('  Action "SearchAttorney":')
    console.log('    Request: action, attyReg, firstName, lastName, middleName, address, city, state, employerZip, county')
    console.log('    Response: { MySearchResults: [...], TooManyResults: bool, NoResults: bool }')
    console.log('    Each result: { AttorneyNumber, FirstName, LastName, MiddleName, Name, City, Employer, Status }')
    console.log('    Client-side pagination: 25 per page, sorted by LastName asc')
    console.log()
    console.log('  Action "GetAttyInfo":')
    console.log('    Request: action, regNumber (the AttorneyNumber)')
    console.log('    Response: { AttorneyNumber, FormalName, Employer, Address, City, State, ZipCode, County,')
    console.log('               JobTitle, LawSchool, AdmittedBy, AdmissionDate, Status, BusinessPhoneNumber,')
    console.log('               HasDiscipline, MyDisciplines, MyPreviousNames, MySanctions, HasSanctions,')
    console.log('               IsInvalidAddress, HasBusinessPhoneNumber, ShowSactionsButton }')
    console.log()
    console.log('  Action "GetAttyDiscipline":')
    console.log('    Request: action, attyNumber')
    console.log('    Response: { AttorneyNumber, EffectiveDate, Action, Description, CMSCaseId, SCCaseNumber, Comment1-3 }')
    console.log()
    console.log('  Route: /#/:reg_number/attyinfo  (detail page route)')
    console.log()
    console.log('RECOMMENDATION:')
    console.log('  1. Run from a network that can reach supremecourt.ohio.gov (Vercel/cloud server)')
    console.log('  2. Or use Playwright to handle the Ember SPA rendering')
    console.log('  3. Update oh-attorneys.ts to use Ajax.ashx instead of /api/search')
    console.log('  4. Strategy: search A-Z by lastName, then GetAttyInfo for each to get full profile')
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
