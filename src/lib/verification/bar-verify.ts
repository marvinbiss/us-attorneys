/**
 * Bar License Verification — Extended API
 *
 * Provides high-level verification functions:
 *   - verifyBarLicense(barNumber, state)  — delegate to bar-verification.ts
 *   - getBarStatus(barNumber, state)      — enriched status from bar_admissions + live check
 *   - generateVerificationReport(id)      — full multi-state report for an attorney
 *   - STATE_BAR_URLS                      — manual verification fallback URLs
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  verifyBarLicense as verifyBarLicenseLive,
  type BarVerificationResult,
} from './bar-verification'

// ─── Types ──────────────────────────────────────────────────────────

export interface BarStatusResult {
  verified: boolean
  status:
    | 'verified'
    | 'not_found'
    | 'suspended'
    | 'disbarred'
    | 'manual_review'
    | 'error'
    | 'inactive'
  name?: string
  admissionDate?: string
  practiceStatus?: string
  disciplinaryHistory: DisciplinaryNote[]
  source?: string
  stateBarUrl?: string
  barNumber?: string
  state?: string
}

export interface DisciplinaryNote {
  actionType: string
  effectiveDate?: string
  description?: string
  docketNumber?: string
  state: string
}

export interface BarAdmissionRecord {
  id: string
  state: string
  barNumber: string
  status: string
  admissionDate?: string
  verified: boolean
  source?: string
  stateBarUrl: string
  stateName: string
}

export interface VerificationReport {
  attorneyId: string
  attorneyName: string
  barAdmissions: BarAdmissionRecord[]
  overallVerified: boolean
  activeStates: string[]
  totalAdmissions: number
  lastVerifiedAt?: string
  generatedAt: string
}

// ─── State Bar Association URLs ─────────────────────────────────────

/**
 * Official state bar lookup URLs for independent manual verification.
 * Sourced from the `states` table seed (migration 401).
 */
export const STATE_BAR_URLS: Record<string, { name: string; barUrl: string; lookupUrl: string }> = {
  AL: {
    name: 'Alabama',
    barUrl: 'https://www.alabar.org/',
    lookupUrl: 'https://www.alabar.org/membership/member-directory/',
  },
  AK: {
    name: 'Alaska',
    barUrl: 'https://www.alaskabar.org/',
    lookupUrl: 'https://www.alaskabar.org/for-lawyers/lawyer-directory/',
  },
  AZ: {
    name: 'Arizona',
    barUrl: 'https://www.azbar.org/',
    lookupUrl: 'https://www.azbar.org/find-a-lawyer/',
  },
  AR: {
    name: 'Arkansas',
    barUrl: 'https://www.arkbar.com/',
    lookupUrl: 'https://www.arcourts.gov/courts/professional-conduct',
  },
  CA: {
    name: 'California',
    barUrl: 'https://www.calbar.ca.gov/',
    lookupUrl: 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch',
  },
  CO: {
    name: 'Colorado',
    barUrl: 'https://www.cobar.org/',
    lookupUrl: 'https://www.cobar.org/Find-a-Lawyer',
  },
  CT: {
    name: 'Connecticut',
    barUrl: 'https://www.ctbar.org/',
    lookupUrl: 'https://www.jud.ct.gov/attorneyfirminquiry/AttorneyFirmInquiry.aspx',
  },
  DE: {
    name: 'Delaware',
    barUrl: 'https://www.dsba.org/',
    lookupUrl: 'https://courts.delaware.gov/odc/attorney_search.aspx',
  },
  DC: {
    name: 'District of Columbia',
    barUrl: 'https://www.dcbar.org/',
    lookupUrl: 'https://www.dcbar.org/attorney-search',
  },
  FL: {
    name: 'Florida',
    barUrl: 'https://www.floridabar.org/',
    lookupUrl: 'https://www.floridabar.org/directories/find-mbr/',
  },
  GA: {
    name: 'Georgia',
    barUrl: 'https://www.gabar.org/',
    lookupUrl: 'https://www.gabar.org/membership/membersearch.cfm',
  },
  HI: {
    name: 'Hawaii',
    barUrl: 'https://hsba.org/',
    lookupUrl:
      'https://hsba.org/HSBA_2020/Lawyer_Referral_Service/HSBA_2020/Lawyer_Referral/LRS.aspx',
  },
  ID: {
    name: 'Idaho',
    barUrl: 'https://isb.idaho.gov/',
    lookupUrl: 'https://isb.idaho.gov/licensing/attorney-roster/',
  },
  IL: {
    name: 'Illinois',
    barUrl: 'https://www.isba.org/',
    lookupUrl: 'https://www.iardc.org/lawyersearch.asp',
  },
  IN: {
    name: 'Indiana',
    barUrl: 'https://www.inbar.org/',
    lookupUrl: 'https://courtapps.indianacourts.us/ISC/rollofattorneys',
  },
  IA: {
    name: 'Iowa',
    barUrl: 'https://www.iowabar.org/',
    lookupUrl: 'https://www.iacourtcommissions.org/agency/attorney-search',
  },
  KS: {
    name: 'Kansas',
    barUrl: 'https://www.ksbar.org/',
    lookupUrl: 'https://www.kscourts.org/Attorney',
  },
  KY: {
    name: 'Kentucky',
    barUrl: 'https://www.kybar.org/',
    lookupUrl: 'https://www.kybar.org/search/custom.asp?id=2962',
  },
  LA: {
    name: 'Louisiana',
    barUrl: 'https://www.lsba.org/',
    lookupUrl: 'https://www.ladb.org/Attorney/Search',
  },
  ME: {
    name: 'Maine',
    barUrl: 'https://www.mainebar.org/',
    lookupUrl: 'https://www.mebaroverseers.org/attorney_search.html',
  },
  MD: {
    name: 'Maryland',
    barUrl: 'https://www.msba.org/',
    lookupUrl: 'https://www.courts.state.md.us/cpd/attorneysearch',
  },
  MA: {
    name: 'Massachusetts',
    barUrl: 'https://www.massbar.org/',
    lookupUrl: 'https://www.massbbo.org/AttorneySearch',
  },
  MI: {
    name: 'Michigan',
    barUrl: 'https://www.michbar.org/',
    lookupUrl: 'https://www.zeekbeek.com/SBM',
  },
  MN: {
    name: 'Minnesota',
    barUrl: 'https://www.mnbar.org/',
    lookupUrl: 'https://www.mnbar.org/member-directory',
  },
  MS: {
    name: 'Mississippi',
    barUrl: 'https://www.msbar.org/',
    lookupUrl: 'https://www.msbar.org/for-the-public/attorney-directory/',
  },
  MO: {
    name: 'Missouri',
    barUrl: 'https://www.mobar.org/',
    lookupUrl: 'https://www.momosec.org/mobar/',
  },
  MT: {
    name: 'Montana',
    barUrl: 'https://www.montanabar.org/',
    lookupUrl: 'https://www.montanabar.org/page/MemberDirectory',
  },
  NE: {
    name: 'Nebraska',
    barUrl: 'https://www.nebar.com/',
    lookupUrl: 'https://www.nebar.com/search/custom.asp?id=2016',
  },
  NV: {
    name: 'Nevada',
    barUrl: 'https://www.nvbar.org/',
    lookupUrl: 'https://www.nvbar.org/find-a-lawyer/',
  },
  NH: {
    name: 'New Hampshire',
    barUrl: 'https://www.nhbar.org/',
    lookupUrl: 'https://www.nhbar.org/member-directory',
  },
  NJ: {
    name: 'New Jersey',
    barUrl: 'https://www.njsba.com/',
    lookupUrl: 'https://portal.njcourts.gov/webe7/AttorneyIndex/search',
  },
  NM: {
    name: 'New Mexico',
    barUrl: 'https://www.sbnm.org/',
    lookupUrl: 'https://nmsupremecourt.nmcourts.gov/attorney-search.aspx',
  },
  NY: {
    name: 'New York',
    barUrl: 'https://www.nysba.org/',
    lookupUrl: 'https://iapps.courts.state.ny.us/attorneyservices/search',
  },
  NC: {
    name: 'North Carolina',
    barUrl: 'https://www.ncbar.org/',
    lookupUrl: 'https://www.ncbar.gov/member-directory/',
  },
  ND: {
    name: 'North Dakota',
    barUrl: 'https://www.sband.org/',
    lookupUrl: 'https://www.sband.org/page/MemberDirectory',
  },
  OH: {
    name: 'Ohio',
    barUrl: 'https://www.ohiobar.org/',
    lookupUrl: 'https://www.supremecourt.ohio.gov/AttorneySearch/',
  },
  OK: {
    name: 'Oklahoma',
    barUrl: 'https://www.okbar.org/',
    lookupUrl: 'https://www.okbar.org/membersearch/',
  },
  OR: {
    name: 'Oregon',
    barUrl: 'https://www.osbar.org/',
    lookupUrl: 'https://www.osbar.org/members/membersearch.asp',
  },
  PA: {
    name: 'Pennsylvania',
    barUrl: 'https://www.pabar.org/',
    lookupUrl: 'https://www.padisciplinaryboard.org/for-the-public/find-attorney',
  },
  RI: {
    name: 'Rhode Island',
    barUrl: 'https://www.ribar.com/',
    lookupUrl: 'https://www.courts.ri.gov/AttorneyResources/Pages/Attorney%20Directory.aspx',
  },
  SC: {
    name: 'South Carolina',
    barUrl: 'https://www.scbar.org/',
    lookupUrl: 'https://www.scbar.org/public/lawyer-finder/',
  },
  SD: {
    name: 'South Dakota',
    barUrl: 'https://www.sdbar.org/',
    lookupUrl: 'https://www.sdbar.org/Members/Directory/',
  },
  TN: {
    name: 'Tennessee',
    barUrl: 'https://www.tba.org/',
    lookupUrl: 'https://www.tbpr.org/attorneys',
  },
  TX: {
    name: 'Texas',
    barUrl: 'https://www.texasbar.com/',
    lookupUrl: 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer',
  },
  UT: {
    name: 'Utah',
    barUrl: 'https://www.utahbar.org/',
    lookupUrl: 'https://www.utahbar.org/member-directory/',
  },
  VT: {
    name: 'Vermont',
    barUrl: 'https://www.vtbar.org/',
    lookupUrl: 'https://www.vermontjudiciary.org/attorneys',
  },
  VA: { name: 'Virginia', barUrl: 'https://www.vsb.org/', lookupUrl: 'https://www.vsb.org/vlrs/' },
  WA: {
    name: 'Washington',
    barUrl: 'https://www.wsba.org/',
    lookupUrl: 'https://www.mywsba.org/LawyerDirectory/LawyerDirectory.aspx',
  },
  WV: {
    name: 'West Virginia',
    barUrl: 'https://www.wvbar.org/',
    lookupUrl: 'https://www.wvodc.org/Search/Search',
  },
  WI: {
    name: 'Wisconsin',
    barUrl: 'https://www.wisbar.org/',
    lookupUrl: 'https://www.wisbar.org/forPublic/FindaLawyer/',
  },
  WY: {
    name: 'Wyoming',
    barUrl: 'https://www.wyomingbar.org/',
    lookupUrl: 'https://www.wyomingbar.org/for-the-public/lawyer-directory/',
  },
}

// State code -> full name mapping (used when states table isn't available)
const STATE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_BAR_URLS).map(([code, { name }]) => [code, name])
)

// ─── Core Functions ─────────────────────────────────────────────────

/**
 * Get enriched bar status by checking our `bar_admissions` table first,
 * then falling back to a live state bar check if needed.
 */
export async function getBarStatus(barNumber: string, stateCode: string): Promise<BarStatusResult> {
  const normalizedBar = barNumber.replace(/[\s\-.]/g, '').trim()
  const normalizedState = stateCode.toUpperCase().trim()

  if (!normalizedBar || normalizedState.length !== 2) {
    return {
      verified: false,
      status: 'error',
      disciplinaryHistory: [],
    }
  }

  const stateBarInfo = STATE_BAR_URLS[normalizedState]

  try {
    const adminClient = createAdminClient()

    // 1. Check our bar_admissions table
    const { data: admission } = await adminClient
      .from('bar_admissions')
      .select('attorney_id, state, bar_number, status, admission_date, verified, source')
      .eq('state', normalizedState)
      .eq('bar_number', normalizedBar)
      .single()

    if (admission) {
      // Fetch attorney name
      const { data: attorney } = await adminClient
        .from('attorneys')
        .select('name')
        .eq('id', admission.attorney_id)
        .single()

      // Fetch disciplinary records if any
      const disciplinaryHistory = await getDisciplinaryHistory(admission.attorney_id, adminClient)

      const statusMap: Record<string, BarStatusResult['status']> = {
        active: 'verified',
        inactive: 'inactive',
        suspended: 'suspended',
        disbarred: 'disbarred',
      }

      return {
        verified: admission.status === 'active' && admission.verified === true,
        status: statusMap[admission.status] || 'manual_review',
        name: attorney?.name || undefined,
        admissionDate: admission.admission_date || undefined,
        practiceStatus: admission.status,
        disciplinaryHistory,
        source: admission.source || 'database',
        stateBarUrl: stateBarInfo?.lookupUrl,
        barNumber: normalizedBar,
        state: normalizedState,
      }
    }

    // 2. Not in our DB — try live verification
    const liveResult = await verifyBarLicenseLive(normalizedBar, normalizedState)

    return {
      verified: liveResult.verified,
      status:
        liveResult.status === 'verified'
          ? 'verified'
          : (liveResult.status as BarStatusResult['status']),
      name: liveResult.attorney_name,
      admissionDate: liveResult.admission_date,
      practiceStatus: liveResult.practice_status,
      disciplinaryHistory: [],
      source: liveResult.source,
      stateBarUrl: stateBarInfo?.lookupUrl,
      barNumber: normalizedBar,
      state: normalizedState,
    }
  } catch (error) {
    logger.error('[BarVerify] getBarStatus failed', {
      barNumber: normalizedBar,
      state: normalizedState,
      error: error instanceof Error ? error.message : 'Unknown',
    })

    return {
      verified: false,
      status: 'error',
      disciplinaryHistory: [],
      stateBarUrl: stateBarInfo?.lookupUrl,
      barNumber: normalizedBar,
      state: normalizedState,
    }
  }
}

/**
 * Generate a full verification report for an attorney across all bar admissions.
 */
export async function generateVerificationReport(
  attorneyId: string
): Promise<VerificationReport | null> {
  try {
    const adminClient = createAdminClient()

    // Fetch attorney basic info
    const { data: attorney } = await adminClient
      .from('attorneys')
      .select('id, name, is_verified')
      .eq('id', attorneyId)
      .single()

    if (!attorney) {
      logger.warn('[BarVerify] Attorney not found for report', { attorneyId })
      return null
    }

    // Fetch all bar admissions
    const { data: admissions } = await adminClient
      .from('bar_admissions')
      .select('id, state, bar_number, status, admission_date, verified, source, created_at')
      .eq('attorney_id', attorneyId)
      .order('state', { ascending: true })

    const barAdmissions: BarAdmissionRecord[] = (admissions || []).map((adm) => {
      const stateInfo = STATE_BAR_URLS[adm.state]
      return {
        id: adm.id,
        state: adm.state,
        barNumber: adm.bar_number,
        status: adm.status,
        admissionDate: adm.admission_date || undefined,
        verified: adm.verified === true,
        source: adm.source || undefined,
        stateBarUrl: stateInfo?.lookupUrl || '',
        stateName: stateInfo?.name || STATE_NAMES[adm.state] || adm.state,
      }
    })

    const activeStates = barAdmissions
      .filter((a) => a.status === 'active' && a.verified)
      .map((a) => a.state)

    // Find latest verification timestamp
    const { data: lastLog } = await adminClient
      .from('verification_logs')
      .select('verified_at')
      .eq('attorney_id', attorneyId)
      .not('verified_at', 'is', null)
      .order('verified_at', { ascending: false })
      .limit(1)
      .single()

    return {
      attorneyId,
      attorneyName: attorney.name,
      barAdmissions,
      overallVerified: attorney.is_verified === true && activeStates.length > 0,
      activeStates,
      totalAdmissions: barAdmissions.length,
      lastVerifiedAt: lastLog?.verified_at || undefined,
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('[BarVerify] generateVerificationReport failed', {
      attorneyId,
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return null
  }
}

/**
 * Get the state bar lookup URL for a given state code.
 */
export function getStateBarLookupUrl(stateCode: string): string | undefined {
  return STATE_BAR_URLS[stateCode.toUpperCase()]?.lookupUrl
}

/**
 * Get state name from state code.
 */
export function getStateName(stateCode: string): string {
  return STATE_NAMES[stateCode.toUpperCase()] || stateCode
}

// ─── Internal Helpers ───────────────────────────────────────────────

async function getDisciplinaryHistory(
  attorneyId: string,
  client: ReturnType<typeof createAdminClient>
): Promise<DisciplinaryNote[]> {
  try {
    const { data } = await client
      .from('attorney_enrichment')
      .select('enrichment_data')
      .eq('attorney_id', attorneyId)
      .eq('enrichment_type', 'disciplinary')

    if (!data || data.length === 0) return []

    return data.flatMap((row: { enrichment_data: Record<string, unknown> }) => {
      const d = row.enrichment_data
      return [
        {
          actionType: (d.action_type as string) || 'Unknown',
          effectiveDate: (d.effective_date as string) || undefined,
          description: (d.description as string) || undefined,
          docketNumber: (d.docket_number as string) || undefined,
          state: (d.state as string) || '',
        },
      ]
    })
  } catch {
    return []
  }
}

// Re-export for convenience
export { verifyBarLicenseLive as verifyBarLicense }
export type { BarVerificationResult }
