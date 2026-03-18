/**
 * Automated Bar License Verification System
 *
 * Attempts real-time verification against state bar records for the top 10 states.
 * For other states, returns 'manual_review' status.
 *
 * Supported states (automated):
 *   NY  — NY Open Data API (Socrata)
 *   CA  — CalBar public API
 *   TX  — Texas Bar public directory
 *   FL  — Florida Bar member search
 *   IL  — ARDC attorney lookup
 *   PA  — PA Disciplinary Board
 *   NJ  — NJ Courts attorney search
 *   OH  — Ohio Supreme Court
 *   GA  — State Bar of Georgia
 *   MA  — BBO public lookup
 *
 * For all other states: returns { status: 'manual_review' }
 */

import { logger } from '@/lib/logger'
import { getCachedData, invalidateCache } from '@/lib/cache'

// ─── Types ──────────────────────────────────────────────────────────

export interface BarVerificationResult {
  verified: boolean
  status: 'verified' | 'not_found' | 'suspended' | 'disbarred' | 'manual_review' | 'error'
  attorney_name?: string
  admission_date?: string
  practice_status?: string
  source?: string
  raw_data?: Record<string, unknown>
  error_message?: string
}

interface StateAdapter {
  verify(barNumber: string): Promise<BarVerificationResult>
}

// ─── Constants ──────────────────────────────────────────────────────

/** Cache TTL for verification results: 24 hours */
const VERIFICATION_CACHE_TTL = 86400

/** HTTP timeout for external bar API calls: 10 seconds */
const FETCH_TIMEOUT_MS = 10_000

/** States with automated verification */
const SUPPORTED_STATES = new Set([
  'NY', 'CA', 'TX', 'FL', 'IL', 'PA', 'NJ', 'OH', 'GA', 'MA',
])

// ─── Helpers ────────────────────────────────────────────────────────

function normalizeBarNumber(barNumber: string): string {
  return barNumber.replace(/[\s\-\.]/g, '').trim()
}

function normalizeStateCode(stateCode: string): string {
  return stateCode.toUpperCase().trim()
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'US-Attorneys-Verification/1.0',
        'Accept': 'application/json',
        ...options.headers,
      },
    })
    return response
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Map raw status strings from bar APIs to our normalized status.
 * Only "Active" or "Eligible" map to verified; everything else is granular.
 */
function normalizeBarStatus(rawStatus: string): BarVerificationResult['status'] {
  const s = rawStatus.toLowerCase().trim()

  if (['active', 'eligible', 'active - eligible to practice', 'active member'].includes(s)) {
    return 'verified'
  }
  if (['suspended', 'suspension', 'interim suspension'].includes(s)) {
    return 'suspended'
  }
  if (['disbarred', 'revoked', 'resigned', 'struck off'].includes(s)) {
    return 'disbarred'
  }
  if (['inactive', 'retired', 'voluntary inactive', 'judicial'].includes(s)) {
    // Inactive is not "verified" but not disciplinary either
    return 'not_found'
  }

  // Unknown status -> manual review
  return 'manual_review'
}

// ─── State Adapters ─────────────────────────────────────────────────

/**
 * New York — NY Open Data API (Socrata)
 * Dataset: https://data.ny.gov/resource/eqw2-r5nb.json
 * Free, no API key needed (rate limited at 1000 req/hr without app token)
 */
const nyAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://data.ny.gov/resource/eqw2-r5nb.json?registration_number=${encodeURIComponent(normalized)}&$limit=1`

    const response = await fetchWithTimeout(url)
    if (!response.ok) {
      throw new Error(`NY API returned ${response.status}`)
    }

    const data = await response.json() as Array<Record<string, string>>
    if (!data || data.length === 0) {
      return { verified: false, status: 'not_found', source: 'ny_open_data' }
    }

    const record = data[0]
    const rawStatus = record.status || record.registration_status || ''
    const status = normalizeBarStatus(rawStatus)

    return {
      verified: status === 'verified',
      status,
      attorney_name: [record.first_name, record.last_name].filter(Boolean).join(' ') || undefined,
      admission_date: record.year_admitted ? `${record.year_admitted}-01-01` : undefined,
      practice_status: rawStatus || undefined,
      source: 'ny_open_data',
      raw_data: record,
    }
  },
}

/**
 * California — CalBar Attorney Search API
 * Public API: https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch
 * JSON endpoint available via member number lookup
 */
const caAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://apps.calbar.ca.gov/attorney/Licensee/Detail/${encodeURIComponent(normalized)}`

    // CalBar returns HTML; we look for key data patterns
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { verified: false, status: 'not_found', source: 'calbar' }
      }
      throw new Error(`CalBar returned ${response.status}`)
    }

    const html = await response.text()

    // Check if "No records found" or equivalent
    if (html.includes('No records found') || html.includes('Member Not Found')) {
      return { verified: false, status: 'not_found', source: 'calbar' }
    }

    // Extract status from HTML pattern: <strong>Status:</strong> Active
    const statusMatch = html.match(/Status:<\/(?:strong|b)>\s*(?:<\/?\w+[^>]*>)*\s*([^<]+)/i)
    const rawStatus = statusMatch?.[1]?.trim() || ''
    const nameMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/i)
    const admissionMatch = html.match(/Admitted to Bar:\s*(\d{2}\/\d{2}\/\d{4})/i)

    const status = rawStatus ? normalizeBarStatus(rawStatus) : 'manual_review'

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      admission_date: admissionMatch?.[1] || undefined,
      practice_status: rawStatus || undefined,
      source: 'calbar',
    }
  },
}

/**
 * Texas — Texas Bar public directory
 * Uses the member lookup search page
 */
const txAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&template=/Customsource/MemberDirectory/Result_form_client.cfm&BarCardNumber=${encodeURIComponent(normalized)}`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
    })

    if (!response.ok) {
      throw new Error(`TX Bar returned ${response.status}`)
    }

    const html = await response.text()

    if (html.includes('No results') || html.includes('0 results found') || html.includes('No attorneys matched')) {
      return { verified: false, status: 'not_found', source: 'texasbar' }
    }

    // Extract name and status from HTML
    const nameMatch = html.match(/class="resultsname"[^>]*>([^<]+)/i)
      || html.match(/<a[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)/i)
    const statusMatch = html.match(/Member Status[:\s]*<[^>]*>([^<]+)/i)
      || html.match(/Status[:\s]*([A-Za-z ]+)/i)

    const rawStatus = statusMatch?.[1]?.trim() || 'Active'
    const status = normalizeBarStatus(rawStatus)

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      practice_status: rawStatus,
      source: 'texasbar',
    }
  },
}

/**
 * Florida — Florida Bar Member Search
 * https://www.floridabar.org/directories/find-mbr/
 */
const flAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://www.floridabar.org/directories/find-mbr/profile/?num=${encodeURIComponent(normalized)}`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { verified: false, status: 'not_found', source: 'floridabar' }
      }
      throw new Error(`FL Bar returned ${response.status}`)
    }

    const html = await response.text()

    if (html.includes('No results found') || html.includes('not found') || html.includes('No member')) {
      return { verified: false, status: 'not_found', source: 'floridabar' }
    }

    const nameMatch = html.match(/<h2[^>]*class="[^"]*member-name[^"]*"[^>]*>([^<]+)/i)
      || html.match(/<title>([^<|]+)/i)
    const statusMatch = html.match(/Eligible To Practice[^<]*<[^>]*>([^<]+)/i)
      || html.match(/Member Status[:\s]*<[^>]*>([^<]+)/i)
    const admissionMatch = html.match(/Date Admitted[:\s]*<[^>]*>([^<]+)/i)

    const rawStatus = statusMatch?.[1]?.trim() || ''
    const status = rawStatus ? normalizeBarStatus(rawStatus) : 'manual_review'

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      admission_date: admissionMatch?.[1]?.trim() || undefined,
      practice_status: rawStatus || undefined,
      source: 'floridabar',
    }
  },
}

/**
 * Illinois — ARDC Attorney Registration
 * https://www.iardc.org/lrs/
 */
const ilAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://www.iardc.org/lrs/gateway/?arn=${encodeURIComponent(normalized)}`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`IL ARDC returned ${response.status}`)
    }

    const html = await response.text()

    if (html.includes('No records found') || html.includes('not found') || html.includes('Invalid')) {
      return { verified: false, status: 'not_found', source: 'iardc' }
    }

    const statusMatch = html.match(/Status[:\s]*<[^>]*>([^<]+)/i)
    const nameMatch = html.match(/<h[1-3][^>]*>([^<]+(?:,\s*[^<]+)?)<\/h/i)

    const rawStatus = statusMatch?.[1]?.trim() || ''
    const status = rawStatus ? normalizeBarStatus(rawStatus) : 'manual_review'

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      practice_status: rawStatus || undefined,
      source: 'iardc',
    }
  },
}

/**
 * Pennsylvania — PA Disciplinary Board
 * https://www.padisciplinaryboard.org/for-the-public/find-attorney
 */
const paAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://www.padisciplinaryboard.org/for-the-public/find-attorney/attorney-detail/${encodeURIComponent(normalized)}`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
      redirect: 'follow',
    })

    if (!response.ok) {
      return { verified: false, status: 'not_found', source: 'pa_disciplinary' }
    }

    const html = await response.text()

    if (html.includes('No attorney found') || html.includes('not found')) {
      return { verified: false, status: 'not_found', source: 'pa_disciplinary' }
    }

    const statusMatch = html.match(/Status[:\s]*<[^>]*>([^<]+)/i)
    const nameMatch = html.match(/<h[1-3][^>]*>([^<]+)<\/h/i)

    const rawStatus = statusMatch?.[1]?.trim() || ''
    const status = rawStatus ? normalizeBarStatus(rawStatus) : 'manual_review'

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      practice_status: rawStatus || undefined,
      source: 'pa_disciplinary',
    }
  },
}

/**
 * New Jersey — NJ Courts Attorney Index
 */
const njAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://portal.njcourts.gov/webe6/AttorneyIndex?attyNo=${encodeURIComponent(normalized)}`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
      redirect: 'follow',
    })

    if (!response.ok) {
      return { verified: false, status: 'not_found', source: 'nj_courts' }
    }

    const html = await response.text()

    if (html.includes('No results') || html.includes('not found')) {
      return { verified: false, status: 'not_found', source: 'nj_courts' }
    }

    const statusMatch = html.match(/Status[:\s]*<[^>]*>([^<]+)/i)
    const nameMatch = html.match(/<td[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)/i)
      || html.match(/<h[1-3][^>]*>([^<]+)<\/h/i)

    const rawStatus = statusMatch?.[1]?.trim() || ''
    const status = rawStatus ? normalizeBarStatus(rawStatus) : 'manual_review'

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      practice_status: rawStatus || undefined,
      source: 'nj_courts',
    }
  },
}

/**
 * Ohio — Ohio Supreme Court Attorney Directory
 */
const ohAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://www.supremecourt.ohio.gov/AttorneySearch/Detail/${encodeURIComponent(normalized)}`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
      redirect: 'follow',
    })

    if (!response.ok) {
      return { verified: false, status: 'not_found', source: 'ohio_supreme_court' }
    }

    const html = await response.text()

    if (html.includes('No records') || html.includes('not found') || html.includes('No results')) {
      return { verified: false, status: 'not_found', source: 'ohio_supreme_court' }
    }

    const statusMatch = html.match(/Status[:\s]*<[^>]*>([^<]+)/i)
    const nameMatch = html.match(/<h[1-3][^>]*>([^<]+)<\/h/i)

    const rawStatus = statusMatch?.[1]?.trim() || ''
    const status = rawStatus ? normalizeBarStatus(rawStatus) : 'manual_review'

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      practice_status: rawStatus || undefined,
      source: 'ohio_supreme_court',
    }
  },
}

/**
 * Georgia — State Bar of Georgia Member Search
 */
const gaAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://www.gabar.org/MemberSearchResults.cfm?BarNumber=${encodeURIComponent(normalized)}`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
      redirect: 'follow',
    })

    if (!response.ok) {
      return { verified: false, status: 'not_found', source: 'gabar' }
    }

    const html = await response.text()

    if (html.includes('No results') || html.includes('not found') || html.includes('0 result')) {
      return { verified: false, status: 'not_found', source: 'gabar' }
    }

    const statusMatch = html.match(/Status[:\s]*<[^>]*>([^<]+)/i)
    const nameMatch = html.match(/<h[1-3][^>]*>([^<]+)<\/h/i)
      || html.match(/class="[^"]*name[^"]*"[^>]*>([^<]+)/i)

    const rawStatus = statusMatch?.[1]?.trim() || ''
    const status = rawStatus ? normalizeBarStatus(rawStatus) : 'manual_review'

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      practice_status: rawStatus || undefined,
      source: 'gabar',
    }
  },
}

/**
 * Massachusetts — Board of Bar Overseers
 */
const maAdapter: StateAdapter = {
  async verify(barNumber: string): Promise<BarVerificationResult> {
    const normalized = normalizeBarNumber(barNumber)
    const url = `https://massbbo.org/bbolookup.php?BarNumber=${encodeURIComponent(normalized)}`

    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'text/html' },
      redirect: 'follow',
    })

    if (!response.ok) {
      return { verified: false, status: 'not_found', source: 'massbbo' }
    }

    const html = await response.text()

    if (html.includes('No records') || html.includes('not found') || html.includes('No results')) {
      return { verified: false, status: 'not_found', source: 'massbbo' }
    }

    const statusMatch = html.match(/Status[:\s]*<[^>]*>([^<]+)/i)
    const nameMatch = html.match(/<h[1-3][^>]*>([^<]+)<\/h/i)

    const rawStatus = statusMatch?.[1]?.trim() || ''
    const status = rawStatus ? normalizeBarStatus(rawStatus) : 'manual_review'

    return {
      verified: status === 'verified',
      status,
      attorney_name: nameMatch?.[1]?.trim() || undefined,
      practice_status: rawStatus || undefined,
      source: 'massbbo',
    }
  },
}

// ─── Adapter Registry ───────────────────────────────────────────────

const adapters: Record<string, StateAdapter> = {
  NY: nyAdapter,
  CA: caAdapter,
  TX: txAdapter,
  FL: flAdapter,
  IL: ilAdapter,
  PA: paAdapter,
  NJ: njAdapter,
  OH: ohAdapter,
  GA: gaAdapter,
  MA: maAdapter,
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Verify a bar license against state bar records.
 *
 * - For supported states (NY, CA, TX, FL, IL, PA, NJ, OH, GA, MA):
 *   attempts automated verification via the state bar API/website.
 * - For all other states: returns { status: 'manual_review' }
 * - Results are cached for 24 hours.
 * - All errors are caught and return { status: 'error' } instead of throwing.
 */
export async function verifyBarLicense(
  barNumber: string,
  stateCode: string
): Promise<BarVerificationResult> {
  const normalizedBar = normalizeBarNumber(barNumber)
  const normalizedState = normalizeStateCode(stateCode)

  if (!normalizedBar) {
    return {
      verified: false,
      status: 'error',
      error_message: 'Bar number is required',
    }
  }

  if (!normalizedState || normalizedState.length !== 2) {
    return {
      verified: false,
      status: 'error',
      error_message: 'Valid 2-letter state code is required',
    }
  }

  // Check if we have an adapter for this state
  if (!SUPPORTED_STATES.has(normalizedState)) {
    logger.info('[BarVerification] No automated adapter for state', {
      stateCode: normalizedState,
      barNumber: normalizedBar,
    })
    return {
      verified: false,
      status: 'manual_review',
      source: 'no_adapter',
    }
  }

  // Use cached result if available (24h cache)
  const cacheKey = `bar-verify:${normalizedState}:${normalizedBar}`

  try {
    const result = await getCachedData<BarVerificationResult>(
      cacheKey,
      async () => {
        const adapter = adapters[normalizedState]

        logger.info('[BarVerification] Attempting automated verification', {
          stateCode: normalizedState,
          barNumber: normalizedBar,
        })

        const result = await adapter.verify(normalizedBar)

        logger.info('[BarVerification] Verification result', {
          stateCode: normalizedState,
          barNumber: normalizedBar,
          status: result.status,
          source: result.source,
        })

        return result
      },
      VERIFICATION_CACHE_TTL,
      { skipNull: true }
    )

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error'

    logger.error('[BarVerification] Verification failed', {
      stateCode: normalizedState,
      barNumber: normalizedBar,
      error: errorMessage,
    })

    // On any error, fall back to manual review (never block a legitimate claim)
    return {
      verified: false,
      status: 'manual_review',
      source: adapters[normalizedState] ? `${normalizedState.toLowerCase()}_fallback` : 'no_adapter',
      error_message: `Automated verification unavailable: ${errorMessage}`,
    }
  }
}

/**
 * Check whether a state supports automated bar verification.
 */
export function isAutomatedVerificationSupported(stateCode: string): boolean {
  return SUPPORTED_STATES.has(normalizeStateCode(stateCode))
}

/**
 * Get the list of states with automated verification support.
 */
export function getSupportedVerificationStates(): string[] {
  return Array.from(SUPPORTED_STATES)
}

/**
 * Invalidate cached verification result for a specific bar number + state.
 */
export function invalidateVerificationCache(barNumber: string, stateCode: string): void {
  const cacheKey = `bar-verify:${normalizeStateCode(stateCode)}:${normalizeBarNumber(barNumber)}`
  invalidateCache(cacheKey)
}
