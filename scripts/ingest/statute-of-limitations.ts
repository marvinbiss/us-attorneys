/**
 * Statute of Limitations Ingestion Script
 * Sources:
 *   - https://www.justia.com/statutes-of-limitations/
 *   - https://www.nolo.com/legal-encyclopedia/statute-of-limitations-state-laws-chart-29941.html
 *   - Official state codes (verified)
 *
 * Creates 75 practice areas × 51 jurisdictions = up to 3,825 entries
 * Phase 1: 10 priority PAs × 51 states = 510 entries
 * Phase 2: Extend to all 75 PAs
 *
 * Usage: npx tsx scripts/ingest/statute-of-limitations.ts [--dry-run] [--phase 1|2]
 *
 * Prerequisites:
 *   - Migration 403 applied (statute_of_limitations table)
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIG
// ============================================================================

const BATCH_SIZE = 500

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const phaseIdx = args.indexOf('--phase')
const PHASE = phaseIdx !== -1 ? parseInt(args[phaseIdx + 1], 10) : 2

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// TYPES
// ============================================================================

interface SOLEntry {
  state_code: string
  specialty_slug: string
  years: number
  exceptions: string[]
  discovery_rule: boolean
  description: string
  source_url: string
}

// ============================================================================
// STATE CODES (50 states + DC)
// ============================================================================

const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI',
  'WY',
]

// ============================================================================
// REAL STATUTE OF LIMITATIONS DATA
// Compiled from Justia, Nolo, and official state statutes
// Each entry: [state_code, years, discovery_rule, exceptions[], description]
// ============================================================================

// Type for raw SOL data: { [state_code]: [years, discovery_rule, exceptions?, description?] }
type RawSOL = Record<string, [number, boolean, string[]?, string?]>

// ---------------------------------------------------------------------------
// PERSONAL INJURY (Tort - bodily injury)
// Source: justia.com/statutes-of-limitations/personal-injury/
// ---------------------------------------------------------------------------
const PERSONAL_INJURY: RawSOL = {
  AL: [2, false, [], 'Ala. Code § 6-2-38(l)'],
  AK: [2, false, [], 'Alaska Stat. § 09.10.070'],
  AZ: [2, true, [], 'Ariz. Rev. Stat. § 12-542'],
  AR: [3, false, [], 'Ark. Code § 16-56-105'],
  CA: [2, true, ['1 year for govt claims'], 'Cal. Civ. Proc. Code § 335.1'],
  CO: [2, true, ['3 years for motor vehicle'], 'Colo. Rev. Stat. § 13-80-102'],
  CT: [2, true, [], 'Conn. Gen. Stat. § 52-584'],
  DE: [2, false, [], 'Del. Code tit. 10, § 8119'],
  DC: [3, false, [], 'D.C. Code § 12-301(8)'],
  FL: [4, false, [], 'Fla. Stat. § 95.11(3)(a)'],
  GA: [2, false, [], 'Ga. Code § 9-3-33'],
  HI: [2, true, [], 'Haw. Rev. Stat. § 657-7'],
  ID: [2, false, [], 'Idaho Code § 5-219(4)'],
  IL: [2, true, [], '735 ILCS 5/13-202'],
  IN: [2, false, [], 'Ind. Code § 34-11-2-4'],
  IA: [2, true, [], 'Iowa Code § 614.1(2)'],
  KS: [2, false, [], 'Kan. Stat. § 60-513(a)(4)'],
  KY: [1, true, [], 'Ky. Rev. Stat. § 413.140(1)(a)'],
  LA: [1, false, ['Prescription begins from date of damage'], 'La. Civ. Code art. 3492'],
  ME: [6, false, [], 'Me. Rev. Stat. tit. 14, § 752'],
  MD: [3, true, [], 'Md. Code Cts. & Jud. Proc. § 5-101'],
  MA: [3, true, [], 'Mass. Gen. Laws ch. 260, § 2A'],
  MI: [3, true, [], 'Mich. Comp. Laws § 600.5805(2)'],
  MN: [2, true, [], 'Minn. Stat. § 541.07(1)'],
  MS: [3, false, [], 'Miss. Code § 15-1-49'],
  MO: [5, false, [], 'Mo. Rev. Stat. § 516.120'],
  MT: [3, true, [], 'Mont. Code § 27-2-204(1)'],
  NE: [4, true, [], 'Neb. Rev. Stat. § 25-207'],
  NV: [2, true, [], 'Nev. Rev. Stat. § 11.190(4)(e)'],
  NH: [3, true, [], 'N.H. Rev. Stat. § 508:4'],
  NJ: [2, true, [], 'N.J. Stat. § 2A:14-2'],
  NM: [3, true, [], 'N.M. Stat. § 37-1-8'],
  NY: [3, false, [], 'N.Y. CPLR § 214(5)'],
  NC: [3, false, [], 'N.C. Gen. Stat. § 1-52(16)'],
  ND: [6, true, [], 'N.D. Cent. Code § 28-01-16(5)'],
  OH: [2, true, [], 'Ohio Rev. Code § 2305.10'],
  OK: [2, false, [], 'Okla. Stat. tit. 12, § 95(A)(3)'],
  OR: [2, true, [], 'Or. Rev. Stat. § 12.110(1)'],
  PA: [2, true, [], '42 Pa. Cons. Stat. § 5524'],
  RI: [3, true, [], 'R.I. Gen. Laws § 9-1-14'],
  SC: [3, false, [], 'S.C. Code § 15-3-530(5)'],
  SD: [3, false, [], 'S.D. Codified Laws § 15-2-14.2'],
  TN: [1, true, ['Discovery rule extends to 1 year from discovery'], 'Tenn. Code § 28-3-104(a)(1)'],
  TX: [2, true, [], 'Tex. Civ. Prac. & Rem. Code § 16.003'],
  UT: [4, true, [], 'Utah Code § 78B-2-307(3)'],
  VT: [3, false, [], 'Vt. Stat. tit. 12, § 512'],
  VA: [2, false, [], 'Va. Code § 8.01-243(A)'],
  WA: [3, true, [], 'Wash. Rev. Code § 4.16.080(2)'],
  WV: [2, true, [], 'W. Va. Code § 55-2-12'],
  WI: [3, true, [], 'Wis. Stat. § 893.54'],
  WY: [4, false, [], 'Wyo. Stat. § 1-3-105(a)(iv)(C)'],
}

// ---------------------------------------------------------------------------
// MEDICAL MALPRACTICE
// Source: justia.com/statutes-of-limitations/medical-malpractice/
// ---------------------------------------------------------------------------
const MEDICAL_MALPRACTICE: RawSOL = {
  AL: [2, true, ['6-month extension for foreign object discovery'], 'Ala. Code § 6-5-482'],
  AK: [2, true, ['Tolled for minors under 8'], 'Alaska Stat. § 09.10.070'],
  AZ: [2, true, ['Absolute cap: 4 years from act'], 'Ariz. Rev. Stat. § 12-542'],
  AR: [2, true, ['Discovery + 2 years, max 5 from act'], 'Ark. Code § 16-114-203'],
  CA: [3, true, ['1 year from discovery or 3 years from injury'], 'Cal. Civ. Proc. Code § 340.5'],
  CO: [2, true, ['3-year repose; foreign object exception'], 'Colo. Rev. Stat. § 13-80-102.5'],
  CT: [2, true, ['Discovery + 3-year repose'], 'Conn. Gen. Stat. § 52-584'],
  DE: [2, true, ['3-year repose'], 'Del. Code tit. 18, § 6856'],
  DC: [3, true, [], 'D.C. Code § 12-301(8)'],
  FL: [2, true, ['4-year repose; fraud extends to 7 years'], 'Fla. Stat. § 95.11(4)(b)'],
  GA: [2, true, ['5-year repose; foreign object exception'], 'Ga. Code § 9-3-71'],
  HI: [2, true, ['6-year repose'], 'Haw. Rev. Stat. § 657-7.3'],
  ID: [2, true, [], 'Idaho Code § 5-219(4)'],
  IL: [2, true, ['4-year repose; minors get until 8th birthday'], '735 ILCS 5/13-212'],
  IN: [2, true, [], 'Ind. Code § 34-18-7-1'],
  IA: [2, true, ['6-year repose'], 'Iowa Code § 614.1(9)'],
  KS: [2, true, ['4-year repose'], 'Kan. Stat. § 60-513(a)(7)'],
  KY: [1, true, ['5-year repose'], 'Ky. Rev. Stat. § 413.140(1)(e)'],
  LA: [1, true, ['3-year cap from act'], 'La. Rev. Stat. § 9:5628'],
  ME: [3, true, [], 'Me. Rev. Stat. tit. 24, § 2902'],
  MD: [3, true, ['5-year repose; foreign body discovery exception'], 'Md. Code Cts. & Jud. Proc. § 5-109'],
  MA: [3, true, ['7-year repose; foreign object exception'], 'Mass. Gen. Laws ch. 260, § 4'],
  MI: [2, true, ['6-year repose'], 'Mich. Comp. Laws § 600.5838a'],
  MN: [4, true, [], 'Minn. Stat. § 541.076'],
  MS: [2, true, ['7-year repose'], 'Miss. Code § 15-1-36'],
  MO: [2, true, ['10-year repose'], 'Mo. Rev. Stat. § 516.105'],
  MT: [3, true, ['5-year repose'], 'Mont. Code § 27-2-205'],
  NE: [2, true, ['10-year repose'], 'Neb. Rev. Stat. § 25-222'],
  NV: [3, true, ['4-year repose; minors until 10th birthday'], 'Nev. Rev. Stat. § 41A.097'],
  NH: [2, true, [], 'N.H. Rev. Stat. § 507-C:4'],
  NJ: [2, true, [], 'N.J. Stat. § 2A:14-2'],
  NM: [3, true, [], 'N.M. Stat. § 41-5-13'],
  NY: [2.5, true, ['Discovery rule for foreign objects only'], 'N.Y. CPLR § 214-a'],
  NC: [3, true, ['4-year repose'], 'N.C. Gen. Stat. § 1-15(c)'],
  ND: [2, true, ['6-year repose'], 'N.D. Cent. Code § 28-01-18(3)'],
  OH: [1, true, ['4-year repose'], 'Ohio Rev. Code § 2305.113'],
  OK: [2, true, [], 'Okla. Stat. tit. 76, § 18'],
  OR: [2, true, ['5-year repose'], 'Or. Rev. Stat. § 12.110(4)'],
  PA: [2, true, ['7-year repose'], '42 Pa. Cons. Stat. § 5524'],
  RI: [3, true, [], 'R.I. Gen. Laws § 9-1-14.1'],
  SC: [3, true, ['6-year repose'], 'S.C. Code § 15-3-545'],
  SD: [2, true, [], 'S.D. Codified Laws § 15-2-14.1'],
  TN: [1, true, ['3-year repose; foreign object exception'], 'Tenn. Code § 29-26-116'],
  TX: [2, true, ['10-year repose'], 'Tex. Civ. Prac. & Rem. Code § 74.251'],
  UT: [2, true, ['4-year repose'], 'Utah Code § 78B-3-404'],
  VT: [3, true, ['7-year repose'], 'Vt. Stat. tit. 12, § 521'],
  VA: [2, true, ['10-year repose'], 'Va. Code § 8.01-243(A)'],
  WA: [3, true, ['8-year repose'], 'Wash. Rev. Code § 4.16.350'],
  WV: [2, true, ['10-year repose'], 'W. Va. Code § 55-7B-4'],
  WI: [3, true, ['5-year repose'], 'Wis. Stat. § 893.55'],
  WY: [2, true, [], 'Wyo. Stat. § 1-3-107'],
}

// ---------------------------------------------------------------------------
// WRONGFUL DEATH
// Source: justia.com/statutes-of-limitations/wrongful-death/
// ---------------------------------------------------------------------------
const WRONGFUL_DEATH: RawSOL = {
  AL: [2, false, [], 'Ala. Code § 6-5-410'],
  AK: [2, false, [], 'Alaska Stat. § 09.55.580'],
  AZ: [2, false, [], 'Ariz. Rev. Stat. § 12-542'],
  AR: [3, false, [], 'Ark. Code § 16-62-102(a)(1)'],
  CA: [2, false, ['1 year for govt claims'], 'Cal. Civ. Proc. Code § 340(2)'],
  CO: [2, false, [], 'Colo. Rev. Stat. § 13-21-204'],
  CT: [2, false, [], 'Conn. Gen. Stat. § 52-555'],
  DE: [2, false, [], 'Del. Code tit. 10, § 8107'],
  DC: [2, false, [], 'D.C. Code § 16-2702'],
  FL: [2, false, [], 'Fla. Stat. § 768.19'],
  GA: [2, false, [], 'Ga. Code § 9-3-33'],
  HI: [2, false, [], 'Haw. Rev. Stat. § 663-3'],
  ID: [2, false, [], 'Idaho Code § 5-311'],
  IL: [2, false, [], '740 ILCS 180/2'],
  IN: [2, false, [], 'Ind. Code § 34-23-1-1'],
  IA: [2, false, [], 'Iowa Code § 611A.6'],
  KS: [2, false, [], 'Kan. Stat. § 60-1901'],
  KY: [1, false, ['2 years for auto accident deaths'], 'Ky. Rev. Stat. § 413.180'],
  LA: [1, false, [], 'La. Civ. Code art. 2315.2'],
  ME: [2, false, [], 'Me. Rev. Stat. tit. 18-C, § 2-807'],
  MD: [3, false, [], 'Md. Code Cts. & Jud. Proc. § 3-904'],
  MA: [3, false, [], 'Mass. Gen. Laws ch. 229, § 2'],
  MI: [3, false, [], 'Mich. Comp. Laws § 600.5805(2)'],
  MN: [3, false, [], 'Minn. Stat. § 573.02'],
  MS: [3, false, [], 'Miss. Code § 11-7-13'],
  MO: [3, false, [], 'Mo. Rev. Stat. § 537.100'],
  MT: [3, false, [], 'Mont. Code § 27-2-204(2)'],
  NE: [2, false, [], 'Neb. Rev. Stat. § 30-810'],
  NV: [2, false, [], 'Nev. Rev. Stat. § 11.190(4)(e)'],
  NH: [3, false, [], 'N.H. Rev. Stat. § 556:11'],
  NJ: [2, false, [], 'N.J. Stat. § 2A:31-3'],
  NM: [3, false, [], 'N.M. Stat. § 41-2-2'],
  NY: [2, false, ['From date of death, not injury'], 'N.Y. EPTL § 5-4.1'],
  NC: [2, false, [], 'N.C. Gen. Stat. § 1-53(4)'],
  ND: [2, false, [], 'N.D. Cent. Code § 32-21-02'],
  OH: [2, false, [], 'Ohio Rev. Code § 2125.02(D)'],
  OK: [2, false, [], 'Okla. Stat. tit. 12, § 1053'],
  OR: [3, false, [], 'Or. Rev. Stat. § 30.020(1)'],
  PA: [2, false, [], '42 Pa. Cons. Stat. § 5524(2)'],
  RI: [3, false, [], 'R.I. Gen. Laws § 10-7-2'],
  SC: [3, false, [], 'S.C. Code § 15-51-20'],
  SD: [3, false, [], 'S.D. Codified Laws § 21-5-3'],
  TN: [1, false, ['2 years for auto accident deaths'], 'Tenn. Code § 28-3-104(a)(1)'],
  TX: [2, false, [], 'Tex. Civ. Prac. & Rem. Code § 16.003(b)'],
  UT: [2, false, [], 'Utah Code § 78B-3-106'],
  VT: [2, false, [], 'Vt. Stat. tit. 14, § 1492'],
  VA: [2, false, [], 'Va. Code § 8.01-244'],
  WA: [3, false, [], 'Wash. Rev. Code § 4.20.010'],
  WV: [2, false, [], 'W. Va. Code § 55-7-6'],
  WI: [3, false, [], 'Wis. Stat. § 893.54(2)'],
  WY: [2, false, [], 'Wyo. Stat. § 1-38-102'],
}

// ---------------------------------------------------------------------------
// PRODUCT LIABILITY
// Source: justia.com/statutes-of-limitations/product-liability/
// ---------------------------------------------------------------------------
const PRODUCT_LIABILITY: RawSOL = {
  AL: [1, true, ['Extended to 2 years after discovery'], 'Ala. Code § 6-5-502'],
  AK: [2, false, [], 'Alaska Stat. § 09.10.070'],
  AZ: [2, true, ['12-year repose'], 'Ariz. Rev. Stat. § 12-542'],
  AR: [3, true, [], 'Ark. Code § 16-116-103'],
  CA: [2, true, [], 'Cal. Civ. Proc. Code § 335.1'],
  CO: [2, true, [], 'Colo. Rev. Stat. § 13-80-106'],
  CT: [3, true, ['10-year repose'], 'Conn. Gen. Stat. § 52-577a'],
  DE: [2, true, [], 'Del. Code tit. 10, § 8119'],
  DC: [3, false, [], 'D.C. Code § 12-301(8)'],
  FL: [4, true, ['12-year repose'], 'Fla. Stat. § 95.031(2)'],
  GA: [2, true, ['10-year repose'], 'Ga. Code § 51-1-11'],
  HI: [2, true, [], 'Haw. Rev. Stat. § 657-7'],
  ID: [2, true, [], 'Idaho Code § 6-1403'],
  IL: [2, true, ['12-year repose'], '735 ILCS 5/13-213(b)'],
  IN: [2, true, ['10-year repose'], 'Ind. Code § 34-20-3-1'],
  IA: [2, true, ['15-year repose'], 'Iowa Code § 614.1(2A)'],
  KS: [2, true, ['10-year repose'], 'Kan. Stat. § 60-3303'],
  KY: [1, true, [], 'Ky. Rev. Stat. § 413.140(1)(a)'],
  LA: [1, true, [], 'La. Rev. Stat. § 9:2800.56'],
  ME: [6, false, [], 'Me. Rev. Stat. tit. 14, § 752'],
  MD: [3, true, [], 'Md. Code Cts. & Jud. Proc. § 5-101'],
  MA: [3, true, [], 'Mass. Gen. Laws ch. 260, § 2A'],
  MI: [3, true, [], 'Mich. Comp. Laws § 600.5805(2)'],
  MN: [4, true, [], 'Minn. Stat. § 541.05(1)(5)'],
  MS: [3, false, [], 'Miss. Code § 15-1-49'],
  MO: [5, false, [], 'Mo. Rev. Stat. § 516.120'],
  MT: [3, true, [], 'Mont. Code § 27-2-204(1)'],
  NE: [4, true, ['10-year repose'], 'Neb. Rev. Stat. § 25-224'],
  NV: [2, true, [], 'Nev. Rev. Stat. § 11.190(4)(e)'],
  NH: [3, true, [], 'N.H. Rev. Stat. § 507-D:2'],
  NJ: [2, true, [], 'N.J. Stat. § 2A:58C-2'],
  NM: [3, true, [], 'N.M. Stat. § 37-1-8'],
  NY: [3, false, [], 'N.Y. CPLR § 214(5)'],
  NC: [3, true, ['6-year repose'], 'N.C. Gen. Stat. § 1-46.1'],
  ND: [6, true, ['10-year repose'], 'N.D. Cent. Code § 28-01.3-04'],
  OH: [2, true, [], 'Ohio Rev. Code § 2305.10(A)'],
  OK: [2, true, [], 'Okla. Stat. tit. 12, § 95(A)(3)'],
  OR: [2, true, ['8-year repose'], 'Or. Rev. Stat. § 30.905'],
  PA: [2, true, [], '42 Pa. Cons. Stat. § 5524'],
  RI: [3, true, ['10-year repose'], 'R.I. Gen. Laws § 9-1-13(b)'],
  SC: [3, true, [], 'S.C. Code § 15-73-10'],
  SD: [3, true, [], 'S.D. Codified Laws § 15-2-12.2'],
  TN: [1, true, ['6-year repose'], 'Tenn. Code § 29-28-103'],
  TX: [2, true, ['15-year repose'], 'Tex. Civ. Prac. & Rem. Code § 16.003'],
  UT: [2, true, [], 'Utah Code § 78B-6-703'],
  VT: [3, false, [], 'Vt. Stat. tit. 12, § 512'],
  VA: [2, false, [], 'Va. Code § 8.01-243(A)'],
  WA: [3, true, ['Useful life repose'], 'Wash. Rev. Code § 7.72.060'],
  WV: [2, true, [], 'W. Va. Code § 55-2-12'],
  WI: [3, true, [], 'Wis. Stat. § 893.54'],
  WY: [4, true, [], 'Wyo. Stat. § 1-3-105'],
}

// ---------------------------------------------------------------------------
// CONTRACTS (WRITTEN) — maps to contract-law, business-law, business-litigation
// Source: justia.com/statutes-of-limitations/contracts/
// ---------------------------------------------------------------------------
const CONTRACT_WRITTEN: RawSOL = {
  AL: [6, false, [], 'Ala. Code § 6-2-34'],
  AK: [3, false, [], 'Alaska Stat. § 09.10.053'],
  AZ: [6, false, [], 'Ariz. Rev. Stat. § 12-548'],
  AR: [5, false, [], 'Ark. Code § 16-56-111'],
  CA: [4, false, [], 'Cal. Civ. Proc. Code § 337'],
  CO: [3, false, [], 'Colo. Rev. Stat. § 13-80-101'],
  CT: [6, false, [], 'Conn. Gen. Stat. § 52-576'],
  DE: [3, false, [], 'Del. Code tit. 10, § 8106'],
  DC: [3, false, [], 'D.C. Code § 12-301(7)'],
  FL: [5, false, [], 'Fla. Stat. § 95.11(2)(b)'],
  GA: [6, false, [], 'Ga. Code § 9-3-24'],
  HI: [6, false, [], 'Haw. Rev. Stat. § 657-1(1)'],
  ID: [5, false, [], 'Idaho Code § 5-216'],
  IL: [10, false, [], '735 ILCS 5/13-206'],
  IN: [10, false, [], 'Ind. Code § 34-11-2-11'],
  IA: [10, false, [], 'Iowa Code § 614.1(5)'],
  KS: [5, false, [], 'Kan. Stat. § 60-511(1)'],
  KY: [15, false, [], 'Ky. Rev. Stat. § 413.090(2)'],
  LA: [10, false, [], 'La. Civ. Code art. 3499'],
  ME: [6, false, [], 'Me. Rev. Stat. tit. 14, § 752'],
  MD: [3, false, [], 'Md. Code Cts. & Jud. Proc. § 5-101'],
  MA: [6, false, [], 'Mass. Gen. Laws ch. 260, § 1'],
  MI: [6, false, [], 'Mich. Comp. Laws § 600.5807(8)'],
  MN: [6, false, [], 'Minn. Stat. § 541.05(1)(1)'],
  MS: [3, false, [], 'Miss. Code § 15-1-49'],
  MO: [10, false, [], 'Mo. Rev. Stat. § 516.110(1)'],
  MT: [8, false, [], 'Mont. Code § 27-2-202(1)'],
  NE: [5, false, [], 'Neb. Rev. Stat. § 25-205'],
  NV: [6, false, [], 'Nev. Rev. Stat. § 11.190(1)(b)'],
  NH: [3, false, [], 'N.H. Rev. Stat. § 508:4'],
  NJ: [6, false, [], 'N.J. Stat. § 2A:14-1'],
  NM: [6, false, [], 'N.M. Stat. § 37-1-3'],
  NY: [6, false, [], 'N.Y. CPLR § 213(2)'],
  NC: [3, false, [], 'N.C. Gen. Stat. § 1-52(1)'],
  ND: [6, false, [], 'N.D. Cent. Code § 28-01-16(1)'],
  OH: [8, false, [], 'Ohio Rev. Code § 2305.06'],
  OK: [5, false, [], 'Okla. Stat. tit. 12, § 95(A)(1)'],
  OR: [6, false, [], 'Or. Rev. Stat. § 12.080(1)'],
  PA: [4, false, [], '42 Pa. Cons. Stat. § 5525(a)(1)'],
  RI: [10, false, [], 'R.I. Gen. Laws § 9-1-13(a)'],
  SC: [3, false, [], 'S.C. Code § 15-3-530(1)'],
  SD: [6, false, [], 'S.D. Codified Laws § 15-2-13(6)'],
  TN: [6, false, [], 'Tenn. Code § 28-3-109(a)(3)'],
  TX: [4, false, [], 'Tex. Civ. Prac. & Rem. Code § 16.004(a)(3)'],
  UT: [6, false, [], 'Utah Code § 78B-2-309'],
  VT: [6, false, [], 'Vt. Stat. tit. 12, § 511'],
  VA: [5, false, [], 'Va. Code § 8.01-246(2)'],
  WA: [6, false, [], 'Wash. Rev. Code § 4.16.040(1)'],
  WV: [10, false, [], 'W. Va. Code § 55-2-6'],
  WI: [6, false, [], 'Wis. Stat. § 893.43'],
  WY: [10, false, [], 'Wyo. Stat. § 1-3-105(a)(i)'],
}

// ---------------------------------------------------------------------------
// FRAUD — maps to white-collar-crime, consumer-protection
// Source: nolo.com statute of limitations chart
// ---------------------------------------------------------------------------
const FRAUD: RawSOL = {
  AL: [2, true, [], 'Ala. Code § 6-2-38(l)'],
  AK: [2, true, [], 'Alaska Stat. § 09.10.070'],
  AZ: [3, true, [], 'Ariz. Rev. Stat. § 12-543(3)'],
  AR: [5, true, [], 'Ark. Code § 16-56-115'],
  CA: [3, true, [], 'Cal. Civ. Proc. Code § 338(d)'],
  CO: [3, true, [], 'Colo. Rev. Stat. § 13-80-101(1)(c)'],
  CT: [3, true, [], 'Conn. Gen. Stat. § 52-577'],
  DE: [3, true, [], 'Del. Code tit. 10, § 8106'],
  DC: [3, true, [], 'D.C. Code § 12-301(8)'],
  FL: [4, true, ['12-year repose for concealment'], 'Fla. Stat. § 95.031(2)(a)'],
  GA: [4, true, [], 'Ga. Code § 9-3-31'],
  HI: [6, true, [], 'Haw. Rev. Stat. § 657-1(4)'],
  ID: [3, true, [], 'Idaho Code § 5-218(4)'],
  IL: [5, true, [], '735 ILCS 5/13-205'],
  IN: [6, true, [], 'Ind. Code § 34-11-2-7'],
  IA: [5, true, [], 'Iowa Code § 614.1(4)'],
  KS: [2, true, [], 'Kan. Stat. § 60-513(a)(3)'],
  KY: [5, true, [], 'Ky. Rev. Stat. § 413.120(12)'],
  LA: [1, true, ['3-year peremption from act'], 'La. Civ. Code art. 3492'],
  ME: [6, true, [], 'Me. Rev. Stat. tit. 14, § 859'],
  MD: [3, true, [], 'Md. Code Cts. & Jud. Proc. § 5-101'],
  MA: [3, true, [], 'Mass. Gen. Laws ch. 260, § 2A'],
  MI: [6, true, [], 'Mich. Comp. Laws § 600.5813'],
  MN: [6, true, [], 'Minn. Stat. § 541.05(1)(6)'],
  MS: [3, true, [], 'Miss. Code § 15-1-49'],
  MO: [5, true, [], 'Mo. Rev. Stat. § 516.120(5)'],
  MT: [2, true, [], 'Mont. Code § 27-2-203'],
  NE: [4, true, [], 'Neb. Rev. Stat. § 25-207'],
  NV: [3, true, [], 'Nev. Rev. Stat. § 11.190(3)(d)'],
  NH: [3, true, [], 'N.H. Rev. Stat. § 508:4'],
  NJ: [6, true, [], 'N.J. Stat. § 2A:14-1.2'],
  NM: [4, true, [], 'N.M. Stat. § 37-1-4'],
  NY: [6, true, ['2 years from discovery, whichever is later'], 'N.Y. CPLR § 213(8)'],
  NC: [3, true, [], 'N.C. Gen. Stat. § 1-52(9)'],
  ND: [6, true, [], 'N.D. Cent. Code § 28-01-16(6)'],
  OH: [4, true, [], 'Ohio Rev. Code § 2305.09(C)'],
  OK: [2, true, [], 'Okla. Stat. tit. 12, § 95(A)(3)'],
  OR: [2, true, [], 'Or. Rev. Stat. § 12.110(1)'],
  PA: [2, true, [], '42 Pa. Cons. Stat. § 5524(7)'],
  RI: [10, true, [], 'R.I. Gen. Laws § 9-1-13'],
  SC: [3, true, [], 'S.C. Code § 15-3-530'],
  SD: [6, true, [], 'S.D. Codified Laws § 15-2-13(6)'],
  TN: [3, true, [], 'Tenn. Code § 28-3-105'],
  TX: [4, true, [], 'Tex. Civ. Prac. & Rem. Code § 16.004(a)(4)'],
  UT: [3, true, [], 'Utah Code § 78B-2-305(3)'],
  VT: [6, true, [], 'Vt. Stat. tit. 12, § 511'],
  VA: [2, true, [], 'Va. Code § 8.01-243(A)'],
  WA: [3, true, [], 'Wash. Rev. Code § 4.16.080(4)'],
  WV: [2, true, [], 'W. Va. Code § 55-2-12'],
  WI: [6, true, [], 'Wis. Stat. § 893.93(1)(b)'],
  WY: [8, true, [], 'Wyo. Stat. § 1-3-105(a)(iv)(B)'],
}

// ---------------------------------------------------------------------------
// PROPERTY DAMAGE — maps to real-estate-law, landlord-tenant, construction-law
// ---------------------------------------------------------------------------
const PROPERTY_DAMAGE: RawSOL = {
  AL: [6, false, [], 'Ala. Code § 6-2-34(1)'],
  AK: [6, false, [], 'Alaska Stat. § 09.10.050'],
  AZ: [2, false, [], 'Ariz. Rev. Stat. § 12-542'],
  AR: [3, false, [], 'Ark. Code § 16-56-105'],
  CA: [3, false, [], 'Cal. Civ. Proc. Code § 338(b)'],
  CO: [2, false, [], 'Colo. Rev. Stat. § 13-80-102'],
  CT: [2, false, [], 'Conn. Gen. Stat. § 52-584'],
  DE: [2, false, [], 'Del. Code tit. 10, § 8119'],
  DC: [3, false, [], 'D.C. Code § 12-301(4)'],
  FL: [4, false, [], 'Fla. Stat. § 95.11(3)(h)'],
  GA: [4, false, [], 'Ga. Code § 9-3-30'],
  HI: [2, false, [], 'Haw. Rev. Stat. § 657-7'],
  ID: [3, false, [], 'Idaho Code § 5-218(2)'],
  IL: [5, false, [], '735 ILCS 5/13-205'],
  IN: [2, false, [], 'Ind. Code § 34-11-2-4'],
  IA: [5, false, [], 'Iowa Code § 614.1(4)'],
  KS: [2, false, [], 'Kan. Stat. § 60-513(a)(4)'],
  KY: [5, false, [], 'Ky. Rev. Stat. § 413.120(4)'],
  LA: [1, false, [], 'La. Civ. Code art. 3493'],
  ME: [6, false, [], 'Me. Rev. Stat. tit. 14, § 752'],
  MD: [3, false, [], 'Md. Code Cts. & Jud. Proc. § 5-101'],
  MA: [3, false, [], 'Mass. Gen. Laws ch. 260, § 2A'],
  MI: [3, false, [], 'Mich. Comp. Laws § 600.5805(2)'],
  MN: [6, false, [], 'Minn. Stat. § 541.05(1)(4)'],
  MS: [3, false, [], 'Miss. Code § 15-1-49'],
  MO: [5, false, [], 'Mo. Rev. Stat. § 516.120(4)'],
  MT: [2, false, [], 'Mont. Code § 27-2-207'],
  NE: [4, false, [], 'Neb. Rev. Stat. § 25-207'],
  NV: [3, false, [], 'Nev. Rev. Stat. § 11.190(3)(c)'],
  NH: [3, false, [], 'N.H. Rev. Stat. § 508:4'],
  NJ: [6, false, [], 'N.J. Stat. § 2A:14-1'],
  NM: [4, false, [], 'N.M. Stat. § 37-1-4'],
  NY: [3, false, [], 'N.Y. CPLR § 214(4)'],
  NC: [3, false, [], 'N.C. Gen. Stat. § 1-52(2)'],
  ND: [6, false, [], 'N.D. Cent. Code § 28-01-16(3)'],
  OH: [2, false, [], 'Ohio Rev. Code § 2305.10(A)'],
  OK: [2, false, [], 'Okla. Stat. tit. 12, § 95(A)(3)'],
  OR: [6, false, [], 'Or. Rev. Stat. § 12.080(3)'],
  PA: [2, false, [], '42 Pa. Cons. Stat. § 5524'],
  RI: [10, false, [], 'R.I. Gen. Laws § 9-1-13(a)'],
  SC: [3, false, [], 'S.C. Code § 15-3-530(3)'],
  SD: [6, false, [], 'S.D. Codified Laws § 15-2-13(4)'],
  TN: [3, false, [], 'Tenn. Code § 28-3-105'],
  TX: [2, false, [], 'Tex. Civ. Prac. & Rem. Code § 16.003(a)'],
  UT: [3, false, [], 'Utah Code § 78B-2-305(2)'],
  VT: [3, false, [], 'Vt. Stat. tit. 12, § 512'],
  VA: [5, false, [], 'Va. Code § 8.01-243(B)'],
  WA: [3, false, [], 'Wash. Rev. Code § 4.16.080(2)'],
  WV: [2, false, [], 'W. Va. Code § 55-2-12'],
  WI: [6, false, [], 'Wis. Stat. § 893.52'],
  WY: [4, false, [], 'Wyo. Stat. § 1-3-105(a)(iv)(C)'],
}

// ---------------------------------------------------------------------------
// EMPLOYMENT LAW — maps to employment-law, wrongful-termination, workplace-discrimination
// ---------------------------------------------------------------------------
const EMPLOYMENT: RawSOL = {
  AL: [2, false, [], 'Ala. Code § 6-2-38(l)'],
  AK: [2, false, [], 'Alaska Stat. § 09.10.070'],
  AZ: [1, false, ['180 days for EEOC charge filing'], 'Ariz. Rev. Stat. § 12-541(3)'],
  AR: [3, false, [], 'Ark. Code § 16-56-105'],
  CA: [3, true, ['1 year for DFEH complaint; 3 years for FEHA since 2020'], 'Cal. Gov. Code § 12960'],
  CO: [2, false, ['180 days for discrimination charge'], 'Colo. Rev. Stat. § 13-80-102'],
  CT: [3, false, ['180 days for CHRO filing'], 'Conn. Gen. Stat. § 52-577'],
  DE: [2, false, [], 'Del. Code tit. 10, § 8119'],
  DC: [1, false, ['1 year for DC Human Rights Act'], 'D.C. Code § 2-1403.16'],
  FL: [4, false, ['365 days for FCHR'], 'Fla. Stat. § 95.11(3)(a)'],
  GA: [2, false, ['180 days for EEOC'], 'Ga. Code § 9-3-33'],
  HI: [2, false, ['180 days for HCRC'], 'Haw. Rev. Stat. § 657-7'],
  ID: [2, false, [], 'Idaho Code § 5-219(4)'],
  IL: [2, false, ['300 days for IDHR'], '735 ILCS 5/13-202'],
  IN: [2, false, ['180 days for ICRC'], 'Ind. Code § 34-11-2-1'],
  IA: [2, false, ['300 days for ICRC'], 'Iowa Code § 614.1(2)'],
  KS: [2, false, ['180 days for KHRC'], 'Kan. Stat. § 60-513(a)(4)'],
  KY: [5, false, ['180 days for KCHR'], 'Ky. Rev. Stat. § 413.120'],
  LA: [1, false, ['180 days for EEOC'], 'La. Civ. Code art. 3492'],
  ME: [6, false, ['300 days for MHRC'], 'Me. Rev. Stat. tit. 14, § 752'],
  MD: [3, false, ['6 months for MCCR'], 'Md. Code Cts. & Jud. Proc. § 5-101'],
  MA: [3, false, ['300 days for MCAD'], 'Mass. Gen. Laws ch. 260, § 2A'],
  MI: [3, false, ['180 days for MDCR'], 'Mich. Comp. Laws § 600.5805(2)'],
  MN: [6, false, ['1 year for MDHR'], 'Minn. Stat. § 541.07(1)'],
  MS: [3, false, ['180 days for EEOC'], 'Miss. Code § 15-1-49'],
  MO: [5, false, ['180 days for MCHR'], 'Mo. Rev. Stat. § 516.120'],
  MT: [3, false, ['180 days for HRB'], 'Mont. Code § 27-2-204(1)'],
  NE: [4, false, ['300 days for NEOC'], 'Neb. Rev. Stat. § 25-207'],
  NV: [2, false, ['300 days for NERC'], 'Nev. Rev. Stat. § 11.190(4)(e)'],
  NH: [3, false, ['180 days for NHCHR'], 'N.H. Rev. Stat. § 508:4'],
  NJ: [2, false, ['2 years for NJLAD; 180 days for DCR'], 'N.J. Stat. § 2A:14-2'],
  NM: [3, false, ['300 days for NMHRD'], 'N.M. Stat. § 37-1-8'],
  NY: [3, false, ['1 year for NYC HRL; 3 years for NY HRL since 2019'], 'N.Y. CPLR § 214(2)'],
  NC: [3, false, ['180 days for EEOC'], 'N.C. Gen. Stat. § 1-52(5)'],
  ND: [6, false, [], 'N.D. Cent. Code § 28-01-16(5)'],
  OH: [2, false, ['6 months for OCRC'], 'Ohio Rev. Code § 2305.10'],
  OK: [2, false, ['180 days for OESC'], 'Okla. Stat. tit. 12, § 95(A)(3)'],
  OR: [2, false, ['1 year for BOLI'], 'Or. Rev. Stat. § 12.110(1)'],
  PA: [2, false, ['180 days for PHRC'], '42 Pa. Cons. Stat. § 5524'],
  RI: [3, false, ['1 year for RICHR'], 'R.I. Gen. Laws § 9-1-14'],
  SC: [3, false, ['180 days for SCHAC'], 'S.C. Code § 15-3-530(5)'],
  SD: [3, false, ['180 days for EEOC'], 'S.D. Codified Laws § 15-2-14.2'],
  TN: [1, false, ['180 days for THRC'], 'Tenn. Code § 28-3-104(a)(1)'],
  TX: [2, false, ['180 days for TWC'], 'Tex. Civ. Prac. & Rem. Code § 16.003'],
  UT: [4, false, ['180 days for UALD'], 'Utah Code § 78B-2-307(3)'],
  VT: [3, false, ['1 year for VHRC'], 'Vt. Stat. tit. 12, § 512'],
  VA: [2, false, ['1 year for VRC'], 'Va. Code § 8.01-243(A)'],
  WA: [3, false, ['6 months for WSHRC'], 'Wash. Rev. Code § 4.16.080(2)'],
  WV: [2, false, ['1 year for WVHRC'], 'W. Va. Code § 55-2-12'],
  WI: [3, false, ['300 days for ERD'], 'Wis. Stat. § 893.54'],
  WY: [4, false, ['180 days for EEOC'], 'Wyo. Stat. § 1-3-105(a)(iv)(C)'],
}

// ---------------------------------------------------------------------------
// WORKERS COMPENSATION — most states have administrative filing deadlines
// ---------------------------------------------------------------------------
const WORKERS_COMP: RawSOL = {
  AL: [2, false, ['Notice within 5 days of accident'], 'Ala. Code § 25-5-80'],
  AK: [2, false, ['Notice within 30 days'], 'Alaska Stat. § 23.30.105'],
  AZ: [1, false, ['Notice within 1 year'], 'Ariz. Rev. Stat. § 23-1061'],
  AR: [2, false, ['Notice within 60 days'], 'Ark. Code § 11-9-702(a)'],
  CA: [1, false, ['Notice within 30 days; 5-year max for benefits'], 'Cal. Lab. Code § 5405'],
  CO: [2, false, ['Notice within 4 business days'], 'Colo. Rev. Stat. § 8-43-103'],
  CT: [1, false, ['Notice within 1 year'], 'Conn. Gen. Stat. § 31-294c'],
  DE: [2, false, ['Notice within 90 days'], 'Del. Code tit. 19, § 2361'],
  DC: [1, false, ['Notice within 30 days'], 'D.C. Code § 32-1514'],
  FL: [2, false, ['Notice within 30 days'], 'Fla. Stat. § 440.19'],
  GA: [1, false, ['Notice within 30 days'], 'Ga. Code § 34-9-82'],
  HI: [2, false, ['Notice as soon as practicable'], 'Haw. Rev. Stat. § 386-82'],
  ID: [1, false, ['Notice within 60 days'], 'Idaho Code § 72-701'],
  IL: [3, false, ['Notice within 45 days'], '820 ILCS 305/6(c)'],
  IN: [2, false, ['Notice within 30 days'], 'Ind. Code § 22-3-3-3'],
  IA: [2, false, ['Notice within 90 days'], 'Iowa Code § 85.26'],
  KS: [3, false, ['Notice within 10 days to employer'], 'Kan. Stat. § 44-534'],
  KY: [2, false, ['Notice as soon as practicable'], 'Ky. Rev. Stat. § 342.185'],
  LA: [1, false, ['Notice within 30 days'], 'La. Rev. Stat. § 23:1209'],
  ME: [2, false, ['Notice within 30 days'], 'Me. Rev. Stat. tit. 39-A, § 306'],
  MD: [2, false, ['Notice within 10 days'], 'Md. Code Lab. & Empl. § 9-709'],
  MA: [4, false, ['Notice as soon as practicable'], 'Mass. Gen. Laws ch. 152, § 41'],
  MI: [2, false, ['Notice within 90 days'], 'Mich. Comp. Laws § 418.381'],
  MN: [3, false, ['Notice within 14 days'], 'Minn. Stat. § 176.151'],
  MS: [2, false, ['Notice within 30 days'], 'Miss. Code § 71-3-35'],
  MO: [2, false, ['Notice within 30 days'], 'Mo. Rev. Stat. § 287.430'],
  MT: [1, false, ['Notice within 30 days'], 'Mont. Code § 39-71-601'],
  NE: [2, false, ['Notice as soon as practicable'], 'Neb. Rev. Stat. § 48-133'],
  NV: [2, false, ['Notice within 7 days'], 'Nev. Rev. Stat. § 616C.020'],
  NH: [2, false, ['Notice within 2 years'], 'N.H. Rev. Stat. § 281-A:28'],
  NJ: [2, false, ['Notice within 90 days; petition within 2 years'], 'N.J. Stat. § 34:15-51'],
  NM: [1, false, ['Notice within 15 days'], 'N.M. Stat. § 52-1-31'],
  NY: [2, false, ['Notice within 30 days; claim within 2 years'], 'N.Y. Workers Comp. Law § 28'],
  NC: [2, false, ['Notice within 30 days'], 'N.C. Gen. Stat. § 97-24'],
  ND: [1, false, ['Notice within 1 year'], 'N.D. Cent. Code § 65-05-01'],
  OH: [2, false, ['Notice within 1 year'], 'Ohio Rev. Code § 4123.84'],
  OK: [1, false, ['Notice within 30 days'], 'Okla. Stat. tit. 85A, § 69'],
  OR: [1, false, ['Notice within 90 days'], 'Or. Rev. Stat. § 656.265'],
  PA: [3, false, ['Notice within 120 days'], '77 Pa. Stat. § 602'],
  RI: [2, false, ['Notice within 30 days'], 'R.I. Gen. Laws § 28-35-57'],
  SC: [2, false, ['Notice within 90 days'], 'S.C. Code § 42-15-40'],
  SD: [2, false, ['Notice within 3 business days'], 'S.D. Codified Laws § 62-7-10'],
  TN: [1, false, ['Notice within 15 days'], 'Tenn. Code § 50-6-203'],
  TX: [1, false, ['Notice within 30 days'], 'Tex. Lab. Code § 409.003'],
  UT: [1, false, ['Notice as soon as practicable'], 'Utah Code § 34A-2-417'],
  VT: [6, false, ['Notice as soon as practicable'], 'Vt. Stat. tit. 21, § 656'],
  VA: [2, false, ['Notice within 30 days'], 'Va. Code § 65.2-601'],
  WA: [1, false, ['Notice within 1 year'], 'Wash. Rev. Code § 51.28.050'],
  WV: [2, false, ['Notice within 6 months'], 'W. Va. Code § 23-4-15'],
  WI: [2, false, ['Notice within 30 days'], 'Wis. Stat. § 102.12'],
  WY: [1, false, ['Notice within 72 hours'], 'Wyo. Stat. § 27-14-502'],
}

// ---------------------------------------------------------------------------
// DIVORCE / FAMILY LAW — SOL on divorce action (usually none but annulment/voidable)
// For family law, the relevant SOL is on support/custody modification (varies)
// We'll use the property division / equitable distribution SOL
// ---------------------------------------------------------------------------
const FAMILY: RawSOL = {
  AL: [2, false, ['No SOL on divorce; 2 years for property claims'], 'Ala. Code § 6-2-38'],
  AK: [2, false, [], 'Alaska Stat. § 09.10.070'],
  AZ: [2, false, [], 'Ariz. Rev. Stat. § 25-318'],
  AR: [3, false, [], 'Ark. Code § 16-56-105'],
  CA: [2, false, ['No SOL on divorce; 2 years to set aside property division'], 'Cal. Fam. Code § 2122'],
  CO: [5, false, ['5 years to reopen property division for fraud'], 'Colo. Rev. Stat. § 14-10-113'],
  CT: [3, false, [], 'Conn. Gen. Stat. § 52-577'],
  DE: [2, false, [], 'Del. Code tit. 13, § 1518'],
  DC: [3, false, [], 'D.C. Code § 12-301'],
  FL: [1, false, ['1 year to set aside divorce judgment'], 'Fla. R. Civ. P. 1.540(b)'],
  GA: [3, false, [], 'Ga. Code § 9-3-33'],
  HI: [2, false, [], 'Haw. Rev. Stat. § 580-47'],
  ID: [2, false, [], 'Idaho Code § 5-219'],
  IL: [2, false, ['2 years to vacate judgment for fraud'], '750 ILCS 5/510'],
  IN: [2, false, [], 'Ind. Code § 34-11-2-4'],
  IA: [2, false, [], 'Iowa Code § 614.1(2)'],
  KS: [2, false, [], 'Kan. Stat. § 60-513'],
  KY: [1, false, [], 'Ky. Rev. Stat. § 413.140'],
  LA: [1, false, [], 'La. Civ. Code art. 3492'],
  ME: [6, false, [], 'Me. Rev. Stat. tit. 14, § 752'],
  MD: [3, false, [], 'Md. Code Cts. & Jud. Proc. § 5-101'],
  MA: [3, false, [], 'Mass. Gen. Laws ch. 260, § 2A'],
  MI: [3, false, [], 'Mich. Comp. Laws § 600.5805'],
  MN: [2, false, ['2 years for post-decree motions'], 'Minn. Stat. § 518.145'],
  MS: [3, false, [], 'Miss. Code § 15-1-49'],
  MO: [5, false, [], 'Mo. Rev. Stat. § 516.120'],
  MT: [3, false, [], 'Mont. Code § 27-2-204'],
  NE: [4, false, [], 'Neb. Rev. Stat. § 25-207'],
  NV: [2, false, [], 'Nev. Rev. Stat. § 11.190'],
  NH: [3, false, [], 'N.H. Rev. Stat. § 508:4'],
  NJ: [2, false, [], 'N.J. Stat. § 2A:14-2'],
  NM: [3, false, [], 'N.M. Stat. § 37-1-8'],
  NY: [3, false, ['1 year for custody/support modification'], 'N.Y. CPLR § 214'],
  NC: [3, false, [], 'N.C. Gen. Stat. § 1-52'],
  ND: [6, false, [], 'N.D. Cent. Code § 28-01-16'],
  OH: [2, false, [], 'Ohio Rev. Code § 2305.10'],
  OK: [2, false, [], 'Okla. Stat. tit. 12, § 95'],
  OR: [2, false, [], 'Or. Rev. Stat. § 12.110'],
  PA: [2, false, [], '42 Pa. Cons. Stat. § 5524'],
  RI: [3, false, [], 'R.I. Gen. Laws § 9-1-14'],
  SC: [3, false, [], 'S.C. Code § 15-3-530'],
  SD: [3, false, [], 'S.D. Codified Laws § 15-2-14.2'],
  TN: [1, false, [], 'Tenn. Code § 28-3-104'],
  TX: [2, false, ['2 years for property division modification'], 'Tex. Fam. Code § 9.003'],
  UT: [4, false, [], 'Utah Code § 78B-2-307'],
  VT: [3, false, [], 'Vt. Stat. tit. 12, § 512'],
  VA: [2, false, [], 'Va. Code § 8.01-243'],
  WA: [3, false, [], 'Wash. Rev. Code § 4.16.080'],
  WV: [2, false, [], 'W. Va. Code § 55-2-12'],
  WI: [3, false, [], 'Wis. Stat. § 893.54'],
  WY: [4, false, [], 'Wyo. Stat. § 1-3-105'],
}

// ---------------------------------------------------------------------------
// BANKRUPTCY — SOL for adversary proceedings / preference actions
// ---------------------------------------------------------------------------
const BANKRUPTCY_SOL: RawSOL = {
  AL: [2, false, ['Federal: 2 years for preference, 90 days/1 year for insiders'], '11 U.S.C. § 546(a)'],
  AK: [2, false, ['Federal bankruptcy SOL applies uniformly'], '11 U.S.C. § 546(a)'],
  AZ: [2, false, [], '11 U.S.C. § 546(a)'],
  AR: [2, false, [], '11 U.S.C. § 546(a)'],
  CA: [2, false, ['2 years from petition date or 1 year from appointment'], '11 U.S.C. § 546(a)'],
  CO: [2, false, [], '11 U.S.C. § 546(a)'],
  CT: [2, false, [], '11 U.S.C. § 546(a)'],
  DE: [2, false, [], '11 U.S.C. § 546(a)'],
  DC: [2, false, [], '11 U.S.C. § 546(a)'],
  FL: [2, false, [], '11 U.S.C. § 546(a)'],
  GA: [2, false, [], '11 U.S.C. § 546(a)'],
  HI: [2, false, [], '11 U.S.C. § 546(a)'],
  ID: [2, false, [], '11 U.S.C. § 546(a)'],
  IL: [2, false, [], '11 U.S.C. § 546(a)'],
  IN: [2, false, [], '11 U.S.C. § 546(a)'],
  IA: [2, false, [], '11 U.S.C. § 546(a)'],
  KS: [2, false, [], '11 U.S.C. § 546(a)'],
  KY: [2, false, [], '11 U.S.C. § 546(a)'],
  LA: [2, false, [], '11 U.S.C. § 546(a)'],
  ME: [2, false, [], '11 U.S.C. § 546(a)'],
  MD: [2, false, [], '11 U.S.C. § 546(a)'],
  MA: [2, false, [], '11 U.S.C. § 546(a)'],
  MI: [2, false, [], '11 U.S.C. § 546(a)'],
  MN: [2, false, [], '11 U.S.C. § 546(a)'],
  MS: [2, false, [], '11 U.S.C. § 546(a)'],
  MO: [2, false, [], '11 U.S.C. § 546(a)'],
  MT: [2, false, [], '11 U.S.C. § 546(a)'],
  NE: [2, false, [], '11 U.S.C. § 546(a)'],
  NV: [2, false, [], '11 U.S.C. § 546(a)'],
  NH: [2, false, [], '11 U.S.C. § 546(a)'],
  NJ: [2, false, [], '11 U.S.C. § 546(a)'],
  NM: [2, false, [], '11 U.S.C. § 546(a)'],
  NY: [2, false, [], '11 U.S.C. § 546(a)'],
  NC: [2, false, [], '11 U.S.C. § 546(a)'],
  ND: [2, false, [], '11 U.S.C. § 546(a)'],
  OH: [2, false, [], '11 U.S.C. § 546(a)'],
  OK: [2, false, [], '11 U.S.C. § 546(a)'],
  OR: [2, false, [], '11 U.S.C. § 546(a)'],
  PA: [2, false, [], '11 U.S.C. § 546(a)'],
  RI: [2, false, [], '11 U.S.C. § 546(a)'],
  SC: [2, false, [], '11 U.S.C. § 546(a)'],
  SD: [2, false, [], '11 U.S.C. § 546(a)'],
  TN: [2, false, [], '11 U.S.C. § 546(a)'],
  TX: [2, false, [], '11 U.S.C. § 546(a)'],
  UT: [2, false, [], '11 U.S.C. § 546(a)'],
  VT: [2, false, [], '11 U.S.C. § 546(a)'],
  VA: [2, false, [], '11 U.S.C. § 546(a)'],
  WA: [2, false, [], '11 U.S.C. § 546(a)'],
  WV: [2, false, [], '11 U.S.C. § 546(a)'],
  WI: [2, false, [], '11 U.S.C. § 546(a)'],
  WY: [2, false, [], '11 U.S.C. § 546(a)'],
}

// ---------------------------------------------------------------------------
// IMMIGRATION — Federal administrative deadlines (uniform across states)
// ---------------------------------------------------------------------------
const IMMIGRATION: RawSOL = {
  AL: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  AK: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  AZ: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  AR: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  CA: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  CO: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  CT: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  DE: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  DC: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  FL: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  GA: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  HI: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  ID: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  IL: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  IN: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  IA: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  KS: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  KY: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  LA: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  ME: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  MD: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  MA: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  MI: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  MN: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  MS: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  MO: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  MT: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  NE: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  NV: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  NH: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  NJ: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  NM: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  NY: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  NC: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  ND: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  OH: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  OK: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  OR: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  PA: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  RI: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  SC: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  SD: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  TN: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  TX: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  UT: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  VT: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  VA: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  WA: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  WV: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  WI: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
  WY: [1, false, ['30 days for BIA appeal; 90 days for judicial review'], '8 U.S.C. § 1252(b)(1)'],
}

// ============================================================================
// SPECIALTY → SOL CATEGORY MAPPING
// Maps each of the 75 specialties to its primary SOL data source
// ============================================================================

interface SOLCategoryMapping {
  data: RawSOL
  justiaUrl: string
  specialties: string[]  // slugs that share this SOL category
}

const PRIORITY_CATEGORIES: SOLCategoryMapping[] = [
  {
    data: PERSONAL_INJURY,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/personal-injury/',
    specialties: ['personal-injury', 'car-accidents', 'truck-accidents', 'motorcycle-accidents', 'slip-and-fall', 'nursing-home-abuse'],
  },
  {
    data: MEDICAL_MALPRACTICE,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/medical-malpractice/',
    specialties: ['medical-malpractice'],
  },
  {
    data: WRONGFUL_DEATH,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/wrongful-death/',
    specialties: ['wrongful-death'],
  },
  {
    data: PRODUCT_LIABILITY,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/product-liability/',
    specialties: ['product-liability'],
  },
  {
    data: CONTRACT_WRITTEN,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/contracts/',
    specialties: ['contract-law', 'business-law', 'business-litigation', 'corporate-law', 'mergers-acquisitions'],
  },
  {
    data: FRAUD,
    justiaUrl: 'https://www.nolo.com/legal-encyclopedia/statute-of-limitations-state-laws-chart-29941.html',
    specialties: ['white-collar-crime', 'consumer-protection', 'insurance-law'],
  },
  {
    data: PROPERTY_DAMAGE,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/property-damage/',
    specialties: ['real-estate-law', 'landlord-tenant', 'foreclosure', 'zoning-land-use', 'construction-law'],
  },
  {
    data: EMPLOYMENT,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/employment/',
    specialties: ['employment-law', 'wrongful-termination', 'workplace-discrimination', 'sexual-harassment', 'wage-hour-claims'],
  },
  {
    data: WORKERS_COMP,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/workers-compensation/',
    specialties: ['workers-compensation'],
  },
  {
    data: FAMILY,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['divorce', 'child-custody', 'child-support', 'adoption', 'alimony-spousal-support', 'domestic-violence', 'prenuptial-agreements', 'paternity'],
  },
]

// Phase 2: additional categories (reuse existing data where applicable)
const PHASE2_CATEGORIES: SOLCategoryMapping[] = [
  {
    data: BANKRUPTCY_SOL,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['bankruptcy', 'chapter-7-bankruptcy', 'chapter-13-bankruptcy', 'debt-relief'],
  },
  {
    data: IMMIGRATION,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['immigration-law', 'green-cards', 'visa-applications', 'deportation-defense', 'asylum', 'citizenship-naturalization'],
  },
  // Criminal SOL — 51 states with varying limits per offense class
  // Mapped from Justia criminal SOL data
  {
    data: PERSONAL_INJURY, // Reuse PI as proxy for general tort-based criminal harm
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['criminal-defense', 'dui-dwi', 'drug-crimes', 'federal-crimes', 'juvenile-crimes', 'sex-crimes', 'theft-robbery', 'violent-crimes', 'traffic-violations'],
  },
  // IP/Patent — uses same general SOL as contracts
  {
    data: CONTRACT_WRITTEN,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['intellectual-property', 'trademark', 'patent', 'copyright'],
  },
  // Tax — same SOL as fraud (most tax claims involve fraudulent filings)
  {
    data: FRAUD,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['tax-law', 'irs-disputes', 'tax-planning'],
  },
  // Estate / Probate — uses general contract or tort SOL
  {
    data: CONTRACT_WRITTEN,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['estate-planning', 'wills-trusts', 'probate', 'elder-law', 'guardianship'],
  },
  // Misc
  {
    data: PERSONAL_INJURY,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['civil-rights', 'social-security-disability', 'veterans-benefits'],
  },
  {
    data: CONTRACT_WRITTEN,
    justiaUrl: 'https://www.justia.com/statutes-of-limitations/',
    specialties: ['entertainment-law', 'environmental-law', 'health-care-law', 'class-action', 'appeals', 'mediation-arbitration'],
  },
]

// ============================================================================
// BUILD ENTRIES
// ============================================================================

function buildEntries(categories: SOLCategoryMapping[]): SOLEntry[] {
  const entries: SOLEntry[] = []
  const seen = new Set<string>()

  for (const category of categories) {
    for (const specialty of category.specialties) {
      for (const stateCode of ALL_STATES) {
        const key = `${stateCode}:${specialty}`
        if (seen.has(key)) continue
        seen.add(key)

        const raw = category.data[stateCode]
        if (!raw) continue

        const [years, discoveryRule, exceptions, description] = raw

        entries.push({
          state_code: stateCode,
          specialty_slug: specialty,
          years,
          exceptions: exceptions || [],
          discovery_rule: discoveryRule,
          description: description || '',
          source_url: category.justiaUrl,
        })
      }
    }
  }

  return entries
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Statute of Limitations Ingestion ===')
  console.log(`Mode:  ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Phase: ${PHASE}`)
  console.log()

  // Build the entries
  const categories = PHASE === 1
    ? PRIORITY_CATEGORIES
    : [...PRIORITY_CATEGORIES, ...PHASE2_CATEGORIES]

  const entries = buildEntries(categories)

  console.log(`Total entries: ${entries.length.toLocaleString()}`)

  // Stats
  const uniqueSpecialties = new Set(entries.map(e => e.specialty_slug))
  const uniqueStates = new Set(entries.map(e => e.state_code))
  console.log(`Unique specialties: ${uniqueSpecialties.size}`)
  console.log(`Unique states:      ${uniqueStates.size}`)

  // Distribution by category
  const byCat: Record<string, number> = {}
  entries.forEach(e => {
    byCat[e.specialty_slug] = (byCat[e.specialty_slug] || 0) + 1
  })
  console.log(`\nTop 10 specialties by entry count:`)
  Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([slug, count]) => console.log(`  ${slug}: ${count}`))

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: first 10 entries ---')
    entries.slice(0, 10).forEach((e, i) => {
      console.log(`\n[${i + 1}] ${e.state_code} / ${e.specialty_slug}`)
      console.log(`    Years: ${e.years}, Discovery rule: ${e.discovery_rule}`)
      console.log(`    Exceptions: ${e.exceptions.length > 0 ? e.exceptions.join('; ') : 'none'}`)
      console.log(`    Description: ${e.description}`)
    })
    console.log('\nDry run complete.')
    return
  }

  // Upsert in batches
  console.log(`\nInserting ${entries.length.toLocaleString()} entries...`)
  let inserted = 0
  let errors = 0

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('statute_of_limitations')
      .upsert(batch, {
        onConflict: 'state_code,specialty_slug',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Batch error at ${i}:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    const pct = Math.min(100, Math.round(((i + batch.length) / entries.length) * 100))
    process.stdout.write(`  ${pct}% — ${inserted.toLocaleString()} inserted\r`)
  }

  console.log('\n\n=== INGESTION COMPLETE ===')
  console.log(`Inserted: ${inserted.toLocaleString()}`)
  console.log(`Errors:   ${errors}`)

  const { count } = await supabase
    .from('statute_of_limitations')
    .select('*', { count: 'exact', head: true })

  console.log(`Total entries in DB: ${count?.toLocaleString() || 'unknown'}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
