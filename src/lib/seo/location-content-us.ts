/**
 * US-specific location content generator for attorney pages.
 *
 * Provides 20 FAQ templates, regional pricing, city classification,
 * climate/regional tips, and content generation functions — all parameterized
 * by city, state, specialty, and market data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FAQParams {
  city: string
  state: string
  stateAbbr: string
  specialty: string
  specialtyName: string
  avgCost: number
  winRate: number
  attorneyCount: number
  population: number
  countyName: string
}

export interface FAQItem {
  question: string
  answer: string
}

export type CitySize =
  | 'major-metro'
  | 'large-city'
  | 'mid-size'
  | 'small-city'
  | 'small-town'

// ---------------------------------------------------------------------------
// Deterministic hash (same as location-content.ts)
// ---------------------------------------------------------------------------

function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// ---------------------------------------------------------------------------
// City size classifier
// ---------------------------------------------------------------------------

export function classifyCitySize(population: number): CitySize {
  if (population >= 500_000) return 'major-metro'
  if (population >= 100_000) return 'large-city'
  if (population >= 30_000) return 'mid-size'
  if (population >= 10_000) return 'small-city'
  return 'small-town'
}

export function getCitySizeLabel(size: CitySize): string {
  const labels: Record<CitySize, string> = {
    'major-metro': 'Major Metropolitan Area',
    'large-city': 'Large City',
    'mid-size': 'Mid-Size City',
    'small-city': 'Small City',
    'small-town': 'Small Town',
  }
  return labels[size]
}

// ---------------------------------------------------------------------------
// Regional pricing multipliers — all 50 states + DC
// ---------------------------------------------------------------------------

const REGIONAL_MULTIPLIERS: Record<string, number> = {
  AL: 0.82, AK: 1.25, AZ: 0.95, AR: 0.78, CA: 1.35,
  CO: 1.05, CT: 1.25, DE: 1.05, DC: 1.45, FL: 1.00,
  GA: 0.92, HI: 1.40, ID: 0.85, IL: 1.10, IN: 0.85,
  IA: 0.82, KS: 0.83, KY: 0.80, LA: 0.85, ME: 0.92,
  MD: 1.15, MA: 1.30, MI: 0.90, MN: 0.98, MS: 0.75,
  MO: 0.85, MT: 0.88, NE: 0.83, NV: 1.00, NH: 1.05,
  NJ: 1.25, NM: 0.85, NY: 1.40, NC: 0.90, ND: 0.82,
  OH: 0.88, OK: 0.80, OR: 1.02, PA: 1.00, RI: 1.05,
  SC: 0.85, SD: 0.80, TN: 0.85, TX: 0.95, UT: 0.90,
  VT: 0.98, VA: 1.05, WA: 1.15, WV: 0.78, WI: 0.90,
  WY: 0.88,
}

export function getRegionalPricingMultiplier(stateAbbr: string): number {
  return REGIONAL_MULTIPLIERS[stateAbbr.toUpperCase()] ?? 1.0
}

// ---------------------------------------------------------------------------
// State bar verification URLs — all 50 states + DC
// ---------------------------------------------------------------------------

export const STATE_BAR_URLS: Record<string, string> = {
  AL: 'https://www.alabar.org/membership/member-directory/',
  AK: 'https://www.alaskabar.org/for-the-public/find-a-lawyer/',
  AZ: 'https://www.azbar.org/for-the-public/find-a-lawyer/',
  AR: 'https://www.arkbar.com/for-the-public/find-a-lawyer',
  CA: 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch',
  CO: 'https://www.cobar.org/Find-a-Lawyer',
  CT: 'https://www.jud.ct.gov/attorneyfirminquiry/AttorneyFirmInquiry.aspx',
  DC: 'https://www.dcbar.org/for-the-public/find-a-member',
  DE: 'https://courts.delaware.gov/boi/',
  FL: 'https://www.floridabar.org/directories/find-mbr/',
  GA: 'https://www.gabar.org/membersearchresults.cfm',
  HI: 'https://dbhawaii.org/search/',
  ID: 'https://isb.idaho.gov/licensing/find-a-lawyer/',
  IL: 'https://www.iardc.org/LRSearch.asp',
  IN: 'https://courtapps.in.gov/rollofattorneys',
  IA: 'https://www.iacourtcommissions.org/agency/attorney_search.asp',
  KS: 'https://www.kscourts.org/Attorney-Roster',
  KY: 'https://www.kybar.org/search/custom.asp?id=2913',
  LA: 'https://www.ladb.org/ODBPublic/IndividualSearch',
  ME: 'https://www.mebaroverseers.org/attorney_registration/bar_roster.html',
  MD: 'https://www.courts.state.md.us/attygrievance/attorneysearch',
  MA: 'https://massbbo.org/bbolookup.php',
  MI: 'https://www.michbar.org/member/directory',
  MN: 'https://www.lrbd.state.mn.us/',
  MS: 'https://www.msbar.org/for-the-public/find-a-lawyer/',
  MO: 'https://www.courts.mo.gov/cnet/attorney.do',
  MT: 'https://www.montanabar.org/page/FindLawyer',
  NE: 'https://www.nebar.com/search/custom.asp?id=2016',
  NV: 'https://www.nvbar.org/find-a-lawyer/',
  NH: 'https://www.nhbar.org/find-a-lawyer/',
  NJ: 'https://portal.njcourts.gov/webe00/AttorneyRegPublic',
  NM: 'https://www.sbnm.org/For-Public/Find-A-Lawyer',
  NY: 'https://iapps.courts.state.ny.us/attorneyservices/search',
  NC: 'https://www.ncbar.gov/for-the-public/find-a-lawyer/',
  ND: 'https://www.sband.org/page/findlawyer',
  OH: 'https://www.supremecourt.ohio.gov/AttorneySearch/',
  OK: 'https://www.okbar.org/freelegalinfo/findlawyer/',
  OR: 'https://www.osbar.org/members/membersearch.asp',
  PA: 'https://www.padisciplinaryboard.org/for-the-public/find-attorney',
  RI: 'https://www.courts.ri.gov/AttorneyReg/Pages/default.aspx',
  SC: 'https://www.scbar.org/public/lawyer-referral-service/',
  SD: 'https://www.statebarofsouthdakota.com/page/find-a-lawyer',
  TN: 'https://www.tbpr.org/attorneys/find-an-attorney',
  TX: 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer',
  UT: 'https://www.utahbar.org/public-services/find-a-lawyer/',
  VT: 'https://www.vtbar.org/FOR%20THE%20PUBLIC/Find%20a%20Vermont%20Lawyer/',
  VA: 'https://www.vsb.org/vlrs/',
  WA: 'https://www.mywsba.org/PersonifyEbusiness/LegalDirectory.aspx',
  WV: 'https://www.wvodc.org/search-lawyers',
  WI: 'https://www.wisbar.org/forPublic/FindaLawyer/Pages/Find-a-Lawyer.aspx',
  WY: 'https://www.wyomingbar.org/for-the-public/find-a-lawyer/',
}

export function getStateBarVerificationUrl(stateAbbr: string): string | null {
  return STATE_BAR_URLS[stateAbbr.toUpperCase()] ?? null
}

// ---------------------------------------------------------------------------
// Climate / regional tip generator
// ---------------------------------------------------------------------------

interface RegionalTipSet {
  region: string
  tips: string[]
}

const REGIONAL_TIPS: RegionalTipSet[] = [
  {
    region: 'hurricane',
    tips: [
      'Hurricane-prone areas see a surge in insurance claim disputes after storm season. Having an attorney on retainer can accelerate claims processing.',
      'After major storms, contractor fraud cases spike significantly. Document all repair work and verify contractor licenses before signing contracts.',
      'Federal disaster relief programs have strict filing deadlines. An attorney can help ensure you meet FEMA application windows.',
    ],
  },
  {
    region: 'tornado',
    tips: [
      'Tornado alley states see frequent insurance disputes over wind damage classifications. An attorney can challenge underpaid claims effectively.',
      'Mobile home and manufactured housing regulations vary by county in tornado-prone areas. Legal counsel can help navigate local building code compliance.',
    ],
  },
  {
    region: 'cold',
    tips: [
      'Slip and fall claims increase dramatically during winter months. Property owners have a legal duty to maintain safe walkways in icy conditions.',
      'Frozen pipe damage disputes between tenants and landlords are common. Understanding your lease terms and local habitability laws is critical.',
      'Snow removal liability varies by municipality. Some local ordinances hold property owners liable within specific timeframes after snowfall ends.',
    ],
  },
  {
    region: 'wildfire',
    tips: [
      'Wildfire-prone areas face complex insurance issues around fire coverage exclusions. Review your policy with an attorney before fire season.',
      'Utility company liability for wildfires is an evolving area of law. Class action and individual claims can yield significant settlements.',
      'Evacuation order compliance and property protection rights intersect in ways most homeowners do not anticipate. Know your legal options in advance.',
    ],
  },
  {
    region: 'flood',
    tips: [
      'Flood insurance through the National Flood Insurance Program (NFIP) has specific claims procedures that differ from standard homeowner policies.',
      'Flood zone remapping can drastically affect property values and insurance requirements. An attorney can help challenge incorrect designations.',
    ],
  },
  {
    region: 'earthquake',
    tips: [
      'Earthquake insurance is typically a separate policy in seismically active states. Coverage gaps between earthquake and standard policies can be significant.',
      'Post-earthquake building condemnation and red-tag disputes require immediate legal attention to preserve your rights as a property owner.',
    ],
  },
  {
    region: 'drought',
    tips: [
      'Water rights litigation is increasingly common in drought-prone states. Agricultural and residential users often have competing legal claims.',
      'Drought-related crop loss claims and agricultural insurance disputes require attorneys familiar with both federal and state agricultural law.',
    ],
  },
  {
    region: 'coastal',
    tips: [
      'Coastal erosion and beach access disputes involve complex interplay between state tidelands law and private property rights.',
      'Maritime law and admiralty jurisdiction apply in many coastal injury and property cases, which can affect your choice of attorney and court.',
    ],
  },
  {
    region: 'urban',
    tips: [
      'Tenant rights and rent control regulations vary significantly by city. Local attorneys understand the specific ordinances that apply to your situation.',
      'Construction defect and noise complaint litigation is particularly common in densely built urban environments.',
    ],
  },
  {
    region: 'rural',
    tips: [
      'Agricultural law, land use, and water rights are the primary legal concerns in rural communities. Attorneys who understand farming operations can be invaluable.',
      'Access to legal services can be limited in rural areas. Many attorneys offer virtual consultations and can represent clients in nearby county courts.',
    ],
  },
]

const STATE_REGIONS: Record<string, string[]> = {
  FL: ['hurricane', 'coastal', 'flood'],
  TX: ['hurricane', 'tornado', 'drought'],
  LA: ['hurricane', 'flood', 'coastal'],
  MS: ['hurricane', 'flood'],
  AL: ['hurricane', 'tornado'],
  GA: ['hurricane', 'tornado'],
  SC: ['hurricane', 'coastal'],
  NC: ['hurricane', 'coastal'],
  OK: ['tornado', 'drought'],
  KS: ['tornado', 'drought'],
  NE: ['tornado', 'flood'],
  IA: ['tornado', 'flood'],
  MO: ['tornado', 'flood'],
  AR: ['tornado', 'flood'],
  CA: ['wildfire', 'earthquake', 'drought', 'coastal'],
  OR: ['wildfire', 'earthquake', 'coastal'],
  WA: ['wildfire', 'earthquake', 'coastal'],
  CO: ['wildfire', 'drought'],
  AZ: ['wildfire', 'drought'],
  NM: ['wildfire', 'drought'],
  MT: ['wildfire', 'cold'],
  ID: ['wildfire', 'cold'],
  UT: ['wildfire', 'drought'],
  NV: ['wildfire', 'drought'],
  WY: ['cold', 'drought'],
  ND: ['cold', 'tornado', 'flood'],
  SD: ['cold', 'tornado'],
  MN: ['cold', 'tornado'],
  WI: ['cold', 'flood'],
  MI: ['cold', 'flood'],
  IL: ['cold', 'tornado', 'urban'],
  IN: ['cold', 'tornado'],
  OH: ['cold', 'flood'],
  PA: ['cold', 'flood'],
  NY: ['cold', 'urban', 'coastal'],
  NJ: ['cold', 'coastal', 'urban', 'flood'],
  CT: ['cold', 'coastal'],
  MA: ['cold', 'coastal', 'urban'],
  RI: ['cold', 'coastal'],
  NH: ['cold'],
  VT: ['cold'],
  ME: ['cold', 'coastal'],
  MD: ['coastal', 'flood'],
  VA: ['hurricane', 'coastal'],
  DE: ['coastal', 'flood'],
  WV: ['flood', 'rural'],
  KY: ['flood', 'rural'],
  TN: ['tornado', 'flood'],
  HI: ['hurricane', 'coastal', 'earthquake'],
  AK: ['cold', 'earthquake', 'coastal'],
  DC: ['urban'],
}

export function getRegionalTips(stateAbbr: string, maxTips: number = 3): string[] {
  const regions = STATE_REGIONS[stateAbbr.toUpperCase()] ?? ['urban']
  const tips: string[] = []

  for (const regionKey of regions) {
    const tipSet = REGIONAL_TIPS.find((r) => r.region === regionKey)
    if (tipSet) {
      tips.push(...tipSet.tips)
    }
  }

  // Deterministic selection using state hash
  const seed = hashCode(stateAbbr)
  const selected: string[] = []
  const available = [...tips]

  for (let i = 0; i < Math.min(maxTips, available.length); i++) {
    const idx = (seed + i * 7) % available.length
    selected.push(available[idx])
    available.splice(idx, 1)
  }

  return selected
}

// ---------------------------------------------------------------------------
// 20 FAQ template functions
// ---------------------------------------------------------------------------

type FAQTemplateFunction = (params: FAQParams) => FAQItem

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

const faqCost: FAQTemplateFunction = (p) => ({
  question: `How much does a ${p.specialtyName} lawyer cost in ${p.city}?`,
  answer: `The average cost of hiring a ${p.specialtyName} attorney in ${p.city}, ${p.state} is approximately ${fmtCurrency(p.avgCost)} for a standard case. However, fees can vary significantly based on the complexity of your matter, the attorney's experience level, and the billing arrangement. In ${p.city}, many ${p.specialtyName} lawyers charge between ${fmtCurrency(p.avgCost * 0.6)} and ${fmtCurrency(p.avgCost * 1.8)} depending on these factors. Some attorneys offer flat-fee arrangements for straightforward cases, while others bill hourly at rates ranging from ${fmtCurrency(p.avgCost * 0.3)}/hour to ${fmtCurrency(p.avgCost * 0.8)}/hour. The regional cost of living in ${p.state} affects legal fees, with the statewide multiplier sitting at ${getRegionalPricingMultiplier(p.stateAbbr).toFixed(2)}x the national average. Always request a detailed fee agreement in writing before engaging any attorney.`,
})

const faqFindBest: FAQTemplateFunction = (p) => ({
  question: `How do I find the best ${p.specialtyName} attorney in ${p.city}?`,
  answer: `Finding the best ${p.specialtyName} attorney in ${p.city} starts with researching credentials and track records. Look for attorneys who specialize specifically in ${p.specialtyName} rather than general practitioners, as specialized knowledge significantly impacts case outcomes. In ${p.city}, there are currently ${fmtNumber(p.attorneyCount)} licensed ${p.specialtyName} attorneys to choose from. Check their standing with the ${p.state} State Bar, read verified client reviews, and ask about their success rate — the average win rate for ${p.specialtyName} cases in this area is approximately ${p.winRate}%. Schedule consultations with at least 2-3 attorneys before making your decision. Ask about their experience with cases similar to yours, their communication style, and who will actually handle your case day-to-day. Local attorneys in ${p.city} often have valuable relationships with ${p.countyName} County courts and opposing counsel that can benefit your case.`,
})

const faqDIY: FAQTemplateFunction = (p) => ({
  question: `Do I need a ${p.specialtyName} lawyer in ${p.city} or can I handle it myself?`,
  answer: `Whether you need a ${p.specialtyName} attorney in ${p.city} depends on the complexity and stakes of your case. For simple, uncontested matters, self-representation may be feasible — ${p.state} courts generally allow pro se representation. However, ${p.specialtyName} law involves nuanced state-specific statutes, procedural requirements, and potential pitfalls that can significantly impact outcomes. Statistics show that individuals with legal representation in ${p.specialtyName} cases achieve favorable outcomes approximately ${p.winRate}% of the time, compared to significantly lower rates for those without counsel. In ${p.countyName} County, court procedures may have local rules that only practicing attorneys would know. Consider at minimum a one-time consultation (many ${p.city} attorneys offer these for ${fmtCurrency(p.avgCost * 0.15)} or less) to understand your rights and the potential consequences of self-representation before making your decision.`,
})

const faqWhatToLookFor: FAQTemplateFunction = (p) => ({
  question: `What should I look for when hiring a ${p.specialtyName} attorney in ${p.city}?`,
  answer: `When hiring a ${p.specialtyName} attorney in ${p.city}, prioritize these key factors: First, verify they are licensed and in good standing with the ${p.state} State Bar — you can check this through the official bar verification portal. Second, look for demonstrated experience in ${p.specialtyName} specifically, not just general practice. Ask how many similar cases they have handled and their outcomes. Third, evaluate their familiarity with ${p.countyName} County courts and local judges, which can provide strategic advantages. Fourth, assess their communication style during your initial consultation — will they return calls within 24 hours? Fifth, understand their fee structure clearly: do they charge ${fmtCurrency(p.avgCost * 0.3)}-${fmtCurrency(p.avgCost * 0.8)}/hour or offer flat fees? Sixth, ask for references from past ${p.specialtyName} clients. Finally, consider their caseload — an attorney handling too many cases simultaneously may not give yours adequate attention. In ${p.city}'s legal market with ${fmtNumber(p.attorneyCount)} ${p.specialtyName} practitioners, you have options to find the right fit.`,
})

const faqCaseDuration: FAQTemplateFunction = (p) => ({
  question: `How long does a typical ${p.specialtyName} case take in ${p.state}?`,
  answer: `The duration of a ${p.specialtyName} case in ${p.state} varies widely based on complexity, court caseloads, and whether the matter settles or goes to trial. Simple ${p.specialtyName} matters may resolve in 2-4 months, while complex cases can take 12-24 months or longer. In ${p.state} specifically, court backlogs and procedural timelines affect case duration. Discovery periods typically run 3-6 months, and if mediation is required (as many ${p.state} courts mandate), add another 1-2 months. Cases that proceed to trial face additional scheduling delays depending on ${p.countyName} County court calendars. Settlement negotiations can shorten the timeline significantly — approximately ${Math.round(100 - (p.winRate * 0.3 + 30))}% of ${p.specialtyName} cases in ${p.state} resolve before trial. Your attorney should provide a realistic timeline estimate based on the specifics of your case during your initial consultation, factoring in ${p.state}'s particular procedural requirements and current court conditions.`,
})

const faqFreeConsultation: FAQTemplateFunction = (p) => ({
  question: `Are there free ${p.specialtyName} consultations available in ${p.city}?`,
  answer: `Yes, many ${p.specialtyName} attorneys in ${p.city} offer free initial consultations, typically lasting 15-30 minutes. These consultations allow you to explain your situation, understand your legal options, and evaluate whether the attorney is a good fit — all before committing financially. Out of the ${fmtNumber(p.attorneyCount)} ${p.specialtyName} attorneys practicing in ${p.city}, a significant number offer complimentary first meetings either in-person or via video call. Some attorneys charge a nominal fee (${fmtCurrency(p.avgCost * 0.1)}-${fmtCurrency(p.avgCost * 0.2)}) for more in-depth initial consultations that include preliminary case analysis. Additionally, ${p.state} offers several free legal resources: the ${p.state} State Bar lawyer referral service can connect you with attorneys offering reduced-rate consultations, and ${p.countyName} County may have legal aid organizations providing free assistance to qualifying individuals. Local law school clinics in ${p.city} and surrounding areas may also provide free legal guidance for certain ${p.specialtyName} matters.`,
})

const faqAverageSettlement: FAQTemplateFunction = (p) => ({
  question: `What is the average settlement for ${p.specialtyName} cases in ${p.state}?`,
  answer: `Settlement amounts for ${p.specialtyName} cases in ${p.state} vary dramatically based on the type and severity of the matter. While it is difficult to provide a single average that is meaningful across all ${p.specialtyName} cases, outcomes in ${p.state} are influenced by the regional cost of living (multiplier: ${getRegionalPricingMultiplier(p.stateAbbr).toFixed(2)}x national average), local jury tendencies, and ${p.state}-specific statutory limits. Cases handled by experienced ${p.specialtyName} attorneys tend to result in higher settlements — the current win rate for represented parties in the ${p.city} area is approximately ${p.winRate}%. Factors that significantly affect settlement value include the strength of evidence, damages documentation, the defendant's ability to pay, and the jurisdiction within ${p.state}. ${p.countyName} County courts have their own tendencies regarding case valuations. Your attorney should be able to provide case-specific estimates based on comparable ${p.specialtyName} outcomes in ${p.state} after reviewing the details of your situation.`,
})

const faqHowMany: FAQTemplateFunction = (p) => ({
  question: `How many ${p.specialtyName} lawyers are there in ${p.city}?`,
  answer: `${p.city}, ${p.state} currently has approximately ${fmtNumber(p.attorneyCount)} licensed attorneys who practice ${p.specialtyName} law. This number reflects the active legal professionals listed in our directory who serve the ${p.city} metropolitan area, including those based in ${p.countyName} County and surrounding communities. With a population of ${fmtNumber(p.population)}, this gives ${p.city} a ratio of roughly one ${p.specialtyName} attorney for every ${fmtNumber(Math.round(p.population / Math.max(p.attorneyCount, 1)))} residents. This ${p.attorneyCount > p.population / 5000 ? 'relatively robust' : 'somewhat limited'} legal market means ${p.attorneyCount > p.population / 5000 ? 'you have multiple options to compare and find the right attorney for your needs' : 'demand may outpace supply, so booking consultations early is advisable'}. The concentration of ${p.specialtyName} lawyers in ${p.city} is ${getRegionalPricingMultiplier(p.stateAbbr) > 1.1 ? 'above' : getRegionalPricingMultiplier(p.stateAbbr) < 0.9 ? 'below' : 'near'} the national average, which ${getRegionalPricingMultiplier(p.stateAbbr) > 1.1 ? 'generally means more competition and potentially better rates' : 'may affect both availability and pricing'}.`,
})

const faqStateLaws: FAQTemplateFunction = (p) => ({
  question: `What are the ${p.state} specific laws for ${p.specialtyName} cases?`,
  answer: `${p.state} has its own body of statutes, regulations, and case law that govern ${p.specialtyName} matters, which can differ significantly from other states. ${p.state} courts follow specific procedural rules, filing requirements, and statutory frameworks that a local ${p.specialtyName} attorney will navigate daily. Key considerations include ${p.state}'s statute of limitations periods, mandatory disclosure requirements, and any state-specific regulatory agencies that oversee ${p.specialtyName}-related matters. ${p.state} may also have unique provisions regarding damages caps, mediation requirements, or alternative dispute resolution procedures for ${p.specialtyName} cases. Local rules in ${p.countyName} County can add additional procedural requirements beyond the state-level rules. It is critical to work with an attorney licensed in ${p.state} who understands these nuances — legal advice based on another state's laws could be not only unhelpful but potentially harmful. You can verify any attorney's ${p.state} bar membership through the state bar's attorney search tool.`,
})

const faqSwitchAttorney: FAQTemplateFunction = (p) => ({
  question: `Can I switch my ${p.specialtyName} attorney in ${p.city} if I'm not happy?`,
  answer: `Yes, you have the absolute right to change your ${p.specialtyName} attorney at any time in ${p.state}. Client dissatisfaction with communication, strategy, or results is a legitimate reason to seek new counsel. To switch attorneys in ${p.city}, first review your existing fee agreement for any provisions regarding termination — ${p.state} law generally requires attorneys to return unearned fees and your case file upon request. Send a written notice to your current attorney requesting file transfer. Then, engage your new ${p.specialtyName} attorney, who can handle the transition and send a substitution of counsel filing with the ${p.countyName} County court if your case is already in litigation. Be aware of timing considerations: switching mid-case can cause delays, and you may owe your previous attorney for work already performed. With ${fmtNumber(p.attorneyCount)} ${p.specialtyName} attorneys practicing in ${p.city}, you have options. Many attorneys are willing to take over existing cases and can evaluate whether a change of strategy would benefit your outcome.`,
})

const faqFirstMeeting: FAQTemplateFunction = (p) => ({
  question: `What happens at the first meeting with a ${p.specialtyName} lawyer?`,
  answer: `Your first meeting with a ${p.specialtyName} attorney in ${p.city} typically lasts 30-60 minutes and follows a structured format. The attorney will ask you to describe your situation in detail, including the timeline of events, parties involved, and your desired outcome. They will review any documents you bring and ask targeted questions to assess the merits of your case under ${p.state} law. The attorney should then explain the relevant legal framework for your ${p.specialtyName} matter, outline potential strategies, discuss likely timelines in ${p.countyName} County courts, and provide a realistic assessment of possible outcomes. They will also explain their fee structure — whether hourly (typically ${fmtCurrency(p.avgCost * 0.3)}-${fmtCurrency(p.avgCost * 0.8)}/hour in ${p.city}), flat fee, or contingency-based. This meeting is also your opportunity to evaluate the attorney: their expertise, communication style, and whether you feel comfortable working with them. Prepare specific questions about their experience with similar ${p.specialtyName} cases and their approach to your particular situation.`,
})

const faqPaymentPlans: FAQTemplateFunction = (p) => ({
  question: `Do ${p.specialtyName} lawyers in ${p.city} offer payment plans?`,
  answer: `Many ${p.specialtyName} attorneys in ${p.city} recognize that legal fees can be substantial and offer flexible payment arrangements to make representation accessible. Common options include: monthly payment plans that spread the total cost over the duration of your case; phased billing where you pay for each stage of representation separately; sliding scale fees based on your income level; and credit card payments. Some ${p.specialtyName} attorneys in ${p.state} also offer contingency fee arrangements, where you pay nothing upfront and the attorney receives a percentage (typically 25-40%) of any recovery. The average cost for ${p.specialtyName} representation in ${p.city} is approximately ${fmtCurrency(p.avgCost)}, which can be managed through these payment structures. Additionally, ${p.state} legal aid organizations and ${p.countyName} County bar association programs may offer reduced-fee representation for qualifying individuals. When consulting with any of the ${fmtNumber(p.attorneyCount)} ${p.specialtyName} attorneys in ${p.city}, ask about payment flexibility during your initial consultation — most attorneys are willing to discuss arrangements that work for both parties.`,
})

const faqDocuments: FAQTemplateFunction = (p) => ({
  question: `What documents should I bring to a ${p.specialtyName} consultation?`,
  answer: `Bringing organized documentation to your ${p.specialtyName} consultation in ${p.city} allows your attorney to provide more accurate advice and case assessment. Essential documents include: any correspondence related to your matter (emails, letters, notices), relevant contracts or agreements, court documents if any have been filed in ${p.countyName} County or elsewhere, photographs or evidence supporting your position, a written timeline of key events, identification documents, and insurance policies if applicable. For ${p.specialtyName} cases specifically, gather any specialized documentation such as financial records, medical records, property documents, or government notices that pertain to your situation. Also bring a list of questions you want answered and the names and contact information of all parties involved. Organize everything chronologically in a folder or binder. This preparation demonstrates to your ${p.city} attorney that you take your case seriously and allows them to use the consultation time efficiently, providing you with better preliminary advice and a more accurate fee estimate for your ${p.specialtyName} matter.`,
})

const faqVerifyLicense: FAQTemplateFunction = (p) => {
  const barUrl = getStateBarVerificationUrl(p.stateAbbr)
  return {
    question: `How do I verify a ${p.specialtyName} attorney's license in ${p.state}?`,
    answer: `Verifying a ${p.specialtyName} attorney's license in ${p.state} is straightforward and strongly recommended before hiring any lawyer. The ${p.state} State Bar maintains a public attorney search tool${barUrl ? ` at ${barUrl}` : ''} where you can confirm an attorney's active license status, admission date, and whether they have any disciplinary history. Simply search by the attorney's name or bar number. An active status means the attorney is currently authorized to practice law in ${p.state}. Also check for any public disciplinary actions, malpractice claims, or ethics violations on record. Beyond state bar verification, you can look up federal court admissions if your ${p.specialtyName} case may involve federal courts. For ${p.city} attorneys specifically, you might also check ${p.countyName} County court records for their litigation history. Cross-reference their claimed specialization in ${p.specialtyName} with any board certifications — ${p.state} may have specialty certification programs that require additional examinations and demonstrated expertise. This due diligence takes only minutes and can prevent costly mistakes.`,
  }
}

const faqStatuteOfLimitations: FAQTemplateFunction = (p) => ({
  question: `What is the statute of limitations for ${p.specialtyName} cases in ${p.state}?`,
  answer: `The statute of limitations for ${p.specialtyName} cases in ${p.state} sets the maximum time after an event within which you may file a lawsuit. Missing this deadline almost certainly means losing your right to legal remedy, regardless of the merits of your case. Statutes of limitations in ${p.state} vary by the specific type of ${p.specialtyName} claim — they can range from 1 year to 6 years or more depending on whether the action involves personal injury, property damage, contracts, or other categories under ${p.state} law. Some ${p.specialtyName} claims have special rules: the "discovery rule" may toll the deadline until you knew or should have known about the issue, and claims against government entities in ${p.state} often have shorter notice requirements (sometimes as little as 90 days). Minors and individuals with certain disabilities may have extended deadlines. Given these complexities, consult a ${p.specialtyName} attorney in ${p.city} as soon as possible after your issue arises. The ${fmtNumber(p.attorneyCount)} attorneys in ${p.city} can quickly determine which specific limitation period applies to your situation under ${p.state} law.`,
})

const faqLocalVsBigFirm: FAQTemplateFunction = (p) => {
  const citySize = classifyCitySize(p.population)
  return {
    question: `Should I hire a local ${p.specialtyName} lawyer in ${p.city} or a big firm?`,
    answer: `Choosing between a local ${p.specialtyName} attorney in ${p.city} and a large firm depends on your case's complexity, budget, and specific needs. Local attorneys in ${p.city} offer several advantages: they know ${p.countyName} County judges and court staff personally, understand local legal culture, are often more accessible for in-person meetings, and typically charge ${citySize === 'small-town' || citySize === 'small-city' ? 'significantly less' : 'somewhat less'} than big-firm attorneys (average of ${fmtCurrency(p.avgCost)} vs. ${fmtCurrency(p.avgCost * 1.8)}-${fmtCurrency(p.avgCost * 3)} at large firms). They also tend to provide more personalized attention, as they handle fewer cases simultaneously. Large firms offer deeper resources: extensive legal research teams, multiple specialists for complex multi-faceted ${p.specialtyName} cases, and broader geographic reach if your matter crosses state lines. For most ${p.specialtyName} cases in ${p.city} — particularly those confined to ${p.state} courts — a skilled local attorney provides excellent representation at a better value. Reserve big-firm resources for exceptionally complex or high-stakes matters where their additional infrastructure justifies the premium cost.`,
  }
}

const faqTrialPercentage: FAQTemplateFunction = (p) => ({
  question: `What percentage of ${p.specialtyName} cases in ${p.state} go to trial?`,
  answer: `Nationwide, only approximately 3-5% of civil cases reach trial, and ${p.specialtyName} cases in ${p.state} follow a similar pattern. The vast majority resolve through negotiation, mediation, or other forms of alternative dispute resolution before a trial begins. In ${p.state}, courts actively encourage settlement through mandatory mediation programs and pre-trial settlement conferences, particularly in ${p.countyName} County. Several factors influence whether your ${p.specialtyName} case might go to trial: the strength of evidence on both sides, the amount in dispute, insurance company involvement, and each party's willingness to negotiate. Cases with clear liability and quantifiable damages tend to settle faster. An experienced ${p.specialtyName} attorney in ${p.city} (current win rate: ${p.winRate}%) will prepare your case as if it will go to trial — this thorough preparation often leads to better settlement offers. However, if settlement negotiations fail to produce a fair outcome, having an attorney with trial experience in ${p.state} courts is invaluable. Ask prospective attorneys about their trial experience and recent courtroom results.`,
})

const faqFeeStructure: FAQTemplateFunction = (p) => ({
  question: `How do ${p.specialtyName} attorney fees work — hourly vs contingency?`,
  answer: `${p.specialtyName} attorneys in ${p.city} typically offer several fee structures, and understanding each is essential for budgeting your legal matter. Hourly billing is the most common arrangement: attorneys charge ${fmtCurrency(p.avgCost * 0.3)}-${fmtCurrency(p.avgCost * 0.8)} per hour in the ${p.city} market, with junior associates billing at lower rates than senior partners. You will typically pay a retainer upfront (${fmtCurrency(p.avgCost * 0.5)}-${fmtCurrency(p.avgCost * 1.5)}) from which hourly charges are deducted. Contingency fees, where the attorney takes a percentage (usually 25-40%) of any recovery, are common in certain ${p.specialtyName} cases — you pay nothing if there is no recovery. Flat fees work well for straightforward ${p.specialtyName} matters with predictable scope, such as document preparation or simple filings. Some ${p.city} attorneys use hybrid arrangements combining a reduced hourly rate with a smaller contingency percentage. In ${p.state}, attorneys are required by ethics rules to clearly explain their fee structure in writing. The average total cost for ${p.specialtyName} representation in ${p.city} is approximately ${fmtCurrency(p.avgCost)}, though complex cases can exceed this significantly.`,
})

const faqClientRights: FAQTemplateFunction = (p) => ({
  question: `What are my rights when working with a ${p.specialtyName} attorney in ${p.state}?`,
  answer: `As a client working with a ${p.specialtyName} attorney in ${p.state}, you have several fundamental rights protected by the ${p.state} Rules of Professional Conduct. First, the right to competent representation — your attorney must possess the knowledge and skill necessary for your ${p.specialtyName} matter. Second, the right to be kept informed — your attorney must promptly communicate significant developments and respond to reasonable requests for information. Third, the right to confidentiality — attorney-client privilege protects your communications, and your lawyer cannot disclose your information without consent. Fourth, the right to make key decisions about your case, including whether to accept a settlement offer. Fifth, the right to receive an itemized accounting of all fees and expenses. Sixth, the right to terminate the relationship at any time (though you may owe fees for work completed). Seventh, the right to a conflict-free representation — your attorney must not have interests that conflict with yours. In ${p.city}, the ${p.countyName} County Bar Association and the ${p.state} State Bar can help if you believe any of these rights have been violated. These protections apply equally whether you have hired one of the ${fmtNumber(p.attorneyCount)} local practitioners or an out-of-area attorney licensed in ${p.state}.`,
})

const faqFileComplaint: FAQTemplateFunction = (p) => {
  const barUrl = getStateBarVerificationUrl(p.stateAbbr)
  return {
    question: `How do I file a complaint against a ${p.specialtyName} lawyer in ${p.state}?`,
    answer: `If you believe a ${p.specialtyName} attorney in ${p.city} has acted unethically or incompetently, ${p.state} provides a formal complaint process through the State Bar's disciplinary system. To file a complaint, contact the ${p.state} State Bar's Office of Disciplinary Counsel${barUrl ? ` (accessible via ${barUrl})` : ''}. You will need to submit a written complaint describing the attorney's conduct, including dates, details of the alleged misconduct, and supporting documentation. Common grounds for complaints include: failure to communicate, mishandling of client funds, conflicts of interest, incompetent representation, overbilling, and abandonment of cases. The disciplinary process in ${p.state} typically involves an initial screening, investigation, and potentially a hearing before a disciplinary panel. Outcomes range from dismissal to private reprimand, public censure, suspension, or disbarment depending on the severity. You can also file a fee dispute through the ${p.countyName} County Bar Association's fee arbitration program if your complaint is specifically about billing. Note that filing a complaint is separate from a malpractice lawsuit — for financial recovery due to attorney negligence, you would need to consult another ${p.specialtyName} attorney in ${p.city} about a potential malpractice claim.`,
  }
}

// ---------------------------------------------------------------------------
// All 20 FAQ templates in an array
// ---------------------------------------------------------------------------

const ALL_FAQ_TEMPLATES: FAQTemplateFunction[] = [
  faqCost,
  faqFindBest,
  faqDIY,
  faqWhatToLookFor,
  faqCaseDuration,
  faqFreeConsultation,
  faqAverageSettlement,
  faqHowMany,
  faqStateLaws,
  faqSwitchAttorney,
  faqFirstMeeting,
  faqPaymentPlans,
  faqDocuments,
  faqVerifyLicense,
  faqStatuteOfLimitations,
  faqLocalVsBigFirm,
  faqTrialPercentage,
  faqFeeStructure,
  faqClientRights,
  faqFileComplaint,
]

// ---------------------------------------------------------------------------
// generateLocationFAQ — deterministic 5-8 FAQ selection
// ---------------------------------------------------------------------------

export function generateLocationFAQ(params: FAQParams): FAQItem[] {
  const seed = hashCode(`${params.city}:${params.specialty}`)

  // Determine count: 5-8 based on hash
  const count = 5 + (seed % 4) // 5, 6, 7, or 8

  // Select indices deterministically
  const selectedIndices: number[] = []
  const totalTemplates = ALL_FAQ_TEMPLATES.length

  // Always include cost FAQ (index 0) and find-best FAQ (index 1) as they are most useful
  selectedIndices.push(0, 1)

  // Fill remaining slots with deterministic selection
  let attempt = 0
  while (selectedIndices.length < count && attempt < 100) {
    const idx = (seed + attempt * 13 + attempt * attempt * 7) % totalTemplates
    if (!selectedIndices.includes(idx)) {
      selectedIndices.push(idx)
    }
    attempt++
  }

  // Sort so the order is consistent and logical (cost/find first, then by template order)
  selectedIndices.sort((a, b) => a - b)

  return selectedIndices.map((idx) => ALL_FAQ_TEMPLATES[idx](params))
}

// ---------------------------------------------------------------------------
// generateLocationIntro — 2-3 paragraph specialty+city intro
// ---------------------------------------------------------------------------

export function generateLocationIntro(params: FAQParams): string {
  const citySize = classifyCitySize(params.population)
  const citySizeLabel = getCitySizeLabel(citySize).toLowerCase()
  const multiplier = getRegionalPricingMultiplier(params.stateAbbr)
  const costContext =
    multiplier > 1.1
      ? `a higher-than-average cost of living that is reflected in legal fees`
      : multiplier < 0.9
        ? `a lower cost of living that generally translates to more affordable legal fees`
        : `a cost of living near the national average, with legal fees priced accordingly`

  const para1 = `If you are searching for a qualified ${params.specialtyName} attorney in ${params.city}, ${params.state}, you have come to the right place. ${params.city} is a ${citySizeLabel} in ${params.countyName} County with a population of ${fmtNumber(params.population)}, and is home to ${fmtNumber(params.attorneyCount)} licensed ${params.specialtyName} practitioners ready to serve your legal needs. Whether you are facing a complex legal challenge or seeking preventive counsel, finding the right attorney with proven expertise in ${params.specialtyName} law can make a decisive difference in your outcome.`

  const para2 = `The ${params.specialtyName} legal landscape in ${params.city} reflects ${params.state}'s ${costContext}. The average cost for ${params.specialtyName} representation in this area is approximately ${fmtCurrency(params.avgCost)}, with experienced attorneys achieving a win rate of around ${params.winRate}% for their clients. Local attorneys bring valuable familiarity with ${params.countyName} County court procedures, judges, and opposing counsel — advantages that can significantly influence case strategy and outcomes.`

  const para3 =
    citySize === 'major-metro' || citySize === 'large-city'
      ? `As a major legal market in ${params.state}, ${params.city} offers a competitive selection of ${params.specialtyName} attorneys ranging from solo practitioners to large multi-attorney firms. This competition benefits consumers through varied fee structures, specialization depth, and service options including evening and weekend consultations, virtual meetings, and multilingual support.`
      : `While ${params.city} may be ${citySize === 'small-town' ? 'a smaller community' : 'a mid-size market'}, local ${params.specialtyName} attorneys offer the advantage of personalized attention and deep roots in the ${params.countyName} County legal community. Many attorneys in ${params.city} also leverage modern technology to offer virtual consultations, expanding access to legal services regardless of geographic constraints.`

  return `${para1}\n\n${para2}\n\n${para3}`
}

// ---------------------------------------------------------------------------
// generateLocationPricingNote — pricing context by city size + region
// ---------------------------------------------------------------------------

export function generateLocationPricingNote(params: FAQParams): string {
  const citySize = classifyCitySize(params.population)
  const multiplier = getRegionalPricingMultiplier(params.stateAbbr)

  const costRange = {
    low: fmtCurrency(params.avgCost * 0.6),
    mid: fmtCurrency(params.avgCost),
    high: fmtCurrency(params.avgCost * 1.8),
    hourlyLow: fmtCurrency(params.avgCost * 0.3),
    hourlyHigh: fmtCurrency(params.avgCost * 0.8),
  }

  let sizeContext: string
  switch (citySize) {
    case 'major-metro':
      sizeContext = `As a major metropolitan area, ${params.city} sits at the higher end of ${params.state}'s legal fee spectrum. Competition among ${fmtNumber(params.attorneyCount)} ${params.specialtyName} attorneys helps moderate prices, but overhead costs for downtown office space and large support staffs contribute to elevated rates.`
      break
    case 'large-city':
      sizeContext = `${params.city}'s sizable legal market offers a good balance between attorney availability and competitive pricing. With ${fmtNumber(params.attorneyCount)} ${params.specialtyName} practitioners, clients can compare options and negotiate fee arrangements.`
      break
    case 'mid-size':
      sizeContext = `Mid-size markets like ${params.city} often provide the best value in legal services — lower overhead than major metros while still offering a meaningful selection of ${fmtNumber(params.attorneyCount)} ${params.specialtyName} attorneys with diverse experience levels.`
      break
    case 'small-city':
      sizeContext = `In a smaller legal market like ${params.city}, you may find fewer ${params.specialtyName} specialists, but attorneys here typically charge less than their big-city counterparts and offer more personalized service.`
      break
    case 'small-town':
      sizeContext = `Small-town legal markets like ${params.city} generally have the most affordable rates in ${params.state}. While the selection of ${params.specialtyName} specialists may be limited, nearby cities and virtual consultations expand your options significantly.`
      break
  }

  const regionalNote =
    multiplier > 1.15
      ? `${params.state} ranks among the higher-cost states for legal services nationally (${multiplier.toFixed(2)}x the national average), which is reflected in local attorney rates.`
      : multiplier < 0.85
        ? `${params.state} is one of the more affordable states for legal services (${multiplier.toFixed(2)}x the national average), making quality ${params.specialtyName} representation accessible to more residents.`
        : `${params.state}'s legal fees track close to the national average (${multiplier.toFixed(2)}x), offering a balanced market for ${params.specialtyName} services.`

  return `${sizeContext} Expect to pay between ${costRange.low} and ${costRange.high} for ${params.specialtyName} representation in ${params.city}, with hourly rates ranging from ${costRange.hourlyLow} to ${costRange.hourlyHigh}. ${regionalNote}`
}

// ---------------------------------------------------------------------------
// Statute of Limitations — by legal category × 51 states (years)
// ---------------------------------------------------------------------------

type SOLCategory =
  | 'personal-injury'
  | 'medical-malpractice'
  | 'property-damage'
  | 'written-contract'
  | 'oral-contract'
  | 'fraud'
  | 'employment'
  | 'wrongful-death'
  | 'product-liability'
  | 'defamation'
  | 'professional-malpractice'
  | 'real-estate'
  | 'debt-collection'

const STATE_SOL: Record<string, Record<string, number>> = {
  'personal-injury': {
    AL: 2, AK: 2, AZ: 2, AR: 3, CA: 2, CO: 2, CT: 2, DE: 2, DC: 3, FL: 4,
    GA: 2, HI: 2, ID: 2, IL: 2, IN: 2, IA: 2, KS: 2, KY: 1, LA: 1, ME: 6,
    MD: 3, MA: 3, MI: 3, MN: 6, MS: 3, MO: 5, MT: 3, NE: 4, NV: 2, NH: 3,
    NJ: 2, NM: 3, NY: 3, NC: 3, ND: 6, OH: 2, OK: 2, OR: 2, PA: 2, RI: 3,
    SC: 3, SD: 3, TN: 1, TX: 2, UT: 4, VT: 3, VA: 2, WA: 3, WV: 2, WI: 3, WY: 4,
  },
  'medical-malpractice': {
    AL: 2, AK: 2, AZ: 2, AR: 2, CA: 1, CO: 2, CT: 2, DE: 2, DC: 3, FL: 2,
    GA: 2, HI: 2, ID: 2, IL: 2, IN: 2, IA: 2, KS: 2, KY: 1, LA: 1, ME: 3,
    MD: 3, MA: 3, MI: 2, MN: 4, MS: 2, MO: 2, MT: 3, NE: 2, NV: 3, NH: 2,
    NJ: 2, NM: 3, NY: 2, NC: 3, ND: 2, OH: 1, OK: 2, OR: 2, PA: 2, RI: 3,
    SC: 3, SD: 2, TN: 1, TX: 2, UT: 2, VT: 3, VA: 2, WA: 3, WV: 2, WI: 3, WY: 2,
  },
  'property-damage': {
    AL: 6, AK: 6, AZ: 2, AR: 3, CA: 3, CO: 2, CT: 2, DE: 2, DC: 3, FL: 4,
    GA: 4, HI: 2, ID: 3, IL: 5, IN: 2, IA: 5, KS: 2, KY: 2, LA: 1, ME: 6,
    MD: 3, MA: 3, MI: 3, MN: 6, MS: 3, MO: 5, MT: 2, NE: 4, NV: 3, NH: 3,
    NJ: 6, NM: 4, NY: 3, NC: 3, ND: 6, OH: 2, OK: 2, OR: 6, PA: 2, RI: 3,
    SC: 3, SD: 6, TN: 3, TX: 2, UT: 3, VT: 3, VA: 5, WA: 3, WV: 2, WI: 6, WY: 4,
  },
  'written-contract': {
    AL: 6, AK: 3, AZ: 6, AR: 5, CA: 4, CO: 6, CT: 6, DE: 3, DC: 3, FL: 5,
    GA: 6, HI: 6, ID: 5, IL: 10, IN: 6, IA: 10, KS: 5, KY: 15, LA: 10, ME: 6,
    MD: 3, MA: 6, MI: 6, MN: 6, MS: 3, MO: 10, MT: 5, NE: 5, NV: 6, NH: 3,
    NJ: 6, NM: 6, NY: 6, NC: 3, ND: 6, OH: 6, OK: 5, OR: 6, PA: 4, RI: 10,
    SC: 3, SD: 6, TN: 6, TX: 4, UT: 6, VT: 6, VA: 5, WA: 6, WV: 10, WI: 6, WY: 10,
  },
  'oral-contract': {
    AL: 6, AK: 3, AZ: 3, AR: 3, CA: 2, CO: 6, CT: 3, DE: 3, DC: 3, FL: 4,
    GA: 4, HI: 6, ID: 4, IL: 5, IN: 6, IA: 5, KS: 3, KY: 5, LA: 10, ME: 6,
    MD: 3, MA: 6, MI: 6, MN: 6, MS: 3, MO: 5, MT: 5, NE: 4, NV: 4, NH: 3,
    NJ: 6, NM: 4, NY: 6, NC: 3, ND: 6, OH: 6, OK: 3, OR: 6, PA: 4, RI: 10,
    SC: 3, SD: 6, TN: 6, TX: 4, UT: 4, VT: 6, VA: 3, WA: 3, WV: 5, WI: 6, WY: 8,
  },
  'fraud': {
    AL: 2, AK: 2, AZ: 3, AR: 3, CA: 3, CO: 3, CT: 3, DE: 3, DC: 3, FL: 4,
    GA: 4, HI: 6, ID: 3, IL: 5, IN: 2, IA: 5, KS: 2, KY: 5, LA: 1, ME: 6,
    MD: 3, MA: 3, MI: 6, MN: 6, MS: 3, MO: 5, MT: 2, NE: 4, NV: 3, NH: 3,
    NJ: 6, NM: 4, NY: 6, NC: 3, ND: 6, OH: 4, OK: 2, OR: 2, PA: 2, RI: 3,
    SC: 3, SD: 6, TN: 3, TX: 4, UT: 3, VT: 6, VA: 2, WA: 3, WV: 2, WI: 6, WY: 4,
  },
  'employment': {
    AL: 2, AK: 2, AZ: 1, AR: 1, CA: 3, CO: 3, CT: 2, DE: 2, DC: 1, FL: 1,
    GA: 2, HI: 2, ID: 1, IL: 2, IN: 2, IA: 2, KS: 2, KY: 1, LA: 1, ME: 2,
    MD: 2, MA: 3, MI: 3, MN: 1, MS: 2, MO: 2, MT: 1, NE: 2, NV: 2, NH: 3,
    NJ: 2, NM: 2, NY: 3, NC: 3, ND: 2, OH: 2, OK: 2, OR: 1, PA: 2, RI: 1,
    SC: 1, SD: 2, TN: 1, TX: 2, UT: 2, VT: 3, VA: 2, WA: 3, WV: 2, WI: 1, WY: 2,
  },
  'wrongful-death': {
    AL: 2, AK: 2, AZ: 2, AR: 3, CA: 2, CO: 2, CT: 2, DE: 2, DC: 2, FL: 2,
    GA: 2, HI: 2, ID: 2, IL: 2, IN: 2, IA: 2, KS: 2, KY: 1, LA: 1, ME: 2,
    MD: 3, MA: 3, MI: 3, MN: 3, MS: 3, MO: 3, MT: 3, NE: 2, NV: 2, NH: 3,
    NJ: 2, NM: 3, NY: 2, NC: 2, ND: 2, OH: 2, OK: 2, OR: 3, PA: 2, RI: 3,
    SC: 3, SD: 3, TN: 1, TX: 2, UT: 2, VT: 3, VA: 2, WA: 3, WV: 2, WI: 3, WY: 2,
  },
  'product-liability': {
    AL: 2, AK: 2, AZ: 2, AR: 3, CA: 2, CO: 2, CT: 3, DE: 2, DC: 3, FL: 4,
    GA: 2, HI: 2, ID: 2, IL: 2, IN: 2, IA: 2, KS: 2, KY: 1, LA: 1, ME: 6,
    MD: 3, MA: 3, MI: 3, MN: 4, MS: 3, MO: 5, MT: 3, NE: 4, NV: 2, NH: 3,
    NJ: 2, NM: 3, NY: 3, NC: 6, ND: 6, OH: 2, OK: 2, OR: 2, PA: 2, RI: 3,
    SC: 3, SD: 3, TN: 1, TX: 2, UT: 2, VT: 3, VA: 2, WA: 3, WV: 2, WI: 3, WY: 4,
  },
  'defamation': {
    AL: 2, AK: 2, AZ: 1, AR: 1, CA: 1, CO: 1, CT: 2, DE: 2, DC: 1, FL: 2,
    GA: 1, HI: 2, ID: 2, IL: 1, IN: 2, IA: 2, KS: 1, KY: 1, LA: 1, ME: 2,
    MD: 1, MA: 3, MI: 1, MN: 2, MS: 1, MO: 2, MT: 2, NE: 1, NV: 2, NH: 3,
    NJ: 1, NM: 3, NY: 1, NC: 1, ND: 2, OH: 1, OK: 1, OR: 1, PA: 1, RI: 1,
    SC: 2, SD: 2, TN: 1, TX: 1, UT: 1, VT: 3, VA: 1, WA: 2, WV: 1, WI: 2, WY: 1,
  },
  'professional-malpractice': {
    AL: 2, AK: 2, AZ: 2, AR: 3, CA: 1, CO: 2, CT: 3, DE: 2, DC: 3, FL: 2,
    GA: 2, HI: 6, ID: 2, IL: 2, IN: 2, IA: 5, KS: 2, KY: 1, LA: 1, ME: 6,
    MD: 3, MA: 3, MI: 2, MN: 6, MS: 3, MO: 5, MT: 3, NE: 4, NV: 4, NH: 3,
    NJ: 6, NM: 4, NY: 3, NC: 3, ND: 6, OH: 1, OK: 2, OR: 2, PA: 2, RI: 3,
    SC: 3, SD: 3, TN: 1, TX: 2, UT: 4, VT: 6, VA: 2, WA: 3, WV: 2, WI: 3, WY: 4,
  },
  'real-estate': {
    AL: 6, AK: 10, AZ: 6, AR: 5, CA: 5, CO: 6, CT: 6, DE: 3, DC: 3, FL: 5,
    GA: 6, HI: 6, ID: 5, IL: 10, IN: 6, IA: 10, KS: 5, KY: 15, LA: 10, ME: 6,
    MD: 3, MA: 6, MI: 6, MN: 6, MS: 6, MO: 10, MT: 5, NE: 5, NV: 6, NH: 3,
    NJ: 6, NM: 6, NY: 6, NC: 3, ND: 6, OH: 6, OK: 5, OR: 6, PA: 4, RI: 10,
    SC: 10, SD: 6, TN: 6, TX: 4, UT: 6, VT: 6, VA: 5, WA: 6, WV: 10, WI: 6, WY: 10,
  },
  'debt-collection': {
    AL: 6, AK: 3, AZ: 6, AR: 5, CA: 4, CO: 6, CT: 6, DE: 3, DC: 3, FL: 5,
    GA: 6, HI: 6, ID: 5, IL: 5, IN: 6, IA: 10, KS: 5, KY: 5, LA: 3, ME: 6,
    MD: 3, MA: 6, MI: 6, MN: 6, MS: 3, MO: 5, MT: 5, NE: 5, NV: 6, NH: 3,
    NJ: 6, NM: 6, NY: 6, NC: 3, ND: 6, OH: 6, OK: 5, OR: 6, PA: 4, RI: 10,
    SC: 3, SD: 6, TN: 6, TX: 4, UT: 6, VT: 6, VA: 5, WA: 6, WV: 10, WI: 6, WY: 8,
  },
}

// ---------------------------------------------------------------------------
// Practice area slug → SOL category mapping
// ---------------------------------------------------------------------------

const PA_TO_SOL_CATEGORY: Record<string, SOLCategory> = {
  'personal-injury': 'personal-injury',
  'car-accidents': 'personal-injury',
  'truck-accidents': 'personal-injury',
  'motorcycle-accidents': 'personal-injury',
  'slip-and-fall': 'personal-injury',
  'dog-bites': 'personal-injury',
  'bicycle-accidents': 'personal-injury',
  'pedestrian-accidents': 'personal-injury',
  'boat-accidents': 'personal-injury',
  'bus-accidents': 'personal-injury',
  'aviation-accidents': 'personal-injury',
  'brain-injury': 'personal-injury',
  'spinal-cord-injury': 'personal-injury',
  'burn-injury': 'personal-injury',
  'catastrophic-injury': 'personal-injury',
  'construction-accidents': 'personal-injury',
  'premises-liability': 'personal-injury',
  'nursing-home-abuse': 'personal-injury',
  'uber-lyft-accidents': 'personal-injury',
  'rideshare-accidents': 'personal-injury',
  'electric-scooter-accidents': 'personal-injury',
  'delivery-driver-accidents': 'personal-injury',
  'medical-malpractice': 'medical-malpractice',
  'birth-injury': 'medical-malpractice',
  'surgical-errors': 'medical-malpractice',
  'misdiagnosis': 'medical-malpractice',
  'medication-errors': 'medical-malpractice',
  'dental-malpractice': 'medical-malpractice',
  'hospital-negligence': 'medical-malpractice',
  'wrongful-death': 'wrongful-death',
  'product-liability': 'product-liability',
  'defective-drugs': 'product-liability',
  'defective-medical-devices': 'product-liability',
  'toxic-torts': 'product-liability',
  'asbestos-mesothelioma': 'product-liability',
  'workers-compensation': 'employment',
  'employment-law': 'employment',
  'wrongful-termination': 'employment',
  'workplace-discrimination': 'employment',
  'sexual-harassment': 'employment',
  'wage-hour-claims': 'employment',
  'whistleblower': 'employment',
  'ada-violations': 'employment',
  'family-law': 'personal-injury',
  'divorce': 'personal-injury',
  'child-custody': 'personal-injury',
  'child-support': 'personal-injury',
  'adoption': 'personal-injury',
  'alimony-spousal-support': 'personal-injury',
  'domestic-violence': 'personal-injury',
  'paternity': 'personal-injury',
  'prenuptial-agreements': 'written-contract',
  'criminal-defense': 'personal-injury',
  'dui-dwi': 'personal-injury',
  'drug-crimes': 'personal-injury',
  'assault-battery': 'personal-injury',
  'theft-crimes': 'personal-injury',
  'white-collar-crimes': 'fraud',
  'federal-crimes': 'personal-injury',
  'juvenile-defense': 'personal-injury',
  'sex-crimes': 'personal-injury',
  'domestic-violence-defense': 'personal-injury',
  'expungement': 'personal-injury',
  'probation-violations': 'personal-injury',
  'conspiracy': 'personal-injury',
  'homicide': 'personal-injury',
  'business-law': 'written-contract',
  'business-litigation': 'written-contract',
  'contract-law': 'written-contract',
  'corporate-law': 'written-contract',
  'mergers-acquisitions': 'written-contract',
  'partnership-disputes': 'written-contract',
  'franchise-law': 'written-contract',
  'commercial-lease': 'written-contract',
  'non-compete-agreements': 'written-contract',
  'business-bankruptcy': 'debt-collection',
  'real-estate': 'real-estate',
  'commercial-real-estate': 'real-estate',
  'boundary-disputes': 'real-estate',
  'landlord-tenant': 'real-estate',
  'construction-law': 'real-estate',
  'zoning-land-use': 'real-estate',
  'foreclosure-defense': 'real-estate',
  'hoa-disputes': 'real-estate',
  'title-disputes': 'real-estate',
  'eminent-domain': 'real-estate',
  'immigration': 'personal-injury',
  'deportation-defense': 'personal-injury',
  'visa-applications': 'personal-injury',
  'asylum': 'personal-injury',
  'citizenship-naturalization': 'personal-injury',
  'green-card': 'personal-injury',
  'daca': 'personal-injury',
  'estate-planning': 'real-estate',
  'probate': 'real-estate',
  'trusts': 'real-estate',
  'wills': 'real-estate',
  'guardianship': 'real-estate',
  'elder-law': 'real-estate',
  'bankruptcy': 'debt-collection',
  'chapter-7-bankruptcy': 'debt-collection',
  'chapter-13-bankruptcy': 'debt-collection',
  'intellectual-property': 'written-contract',
  'patent-law': 'written-contract',
  'trademark-law': 'written-contract',
  'copyright-law': 'written-contract',
  'trade-secrets': 'written-contract',
  'tax-law': 'fraud',
  'irs-audit-defense': 'fraud',
  'tax-litigation': 'fraud',
  'back-taxes': 'fraud',
  'tax-fraud-defense': 'fraud',
  'consumer-protection': 'fraud',
  'lemon-law': 'product-liability',
  'insurance-claims': 'written-contract',
  'insurance-bad-faith': 'written-contract',
  'class-action': 'personal-injury',
  'civil-rights': 'personal-injury',
  'defamation': 'defamation',
  'internet-defamation': 'defamation',
  'privacy-law': 'personal-injury',
  'cybersecurity-law': 'written-contract',
  'ai-law': 'written-contract',
  'cannabis-law': 'personal-injury',
  'environmental-law': 'property-damage',
  'maritime-law': 'personal-injury',
  'aviation-law': 'personal-injury',
  'military-law': 'personal-injury',
  'veterans-benefits': 'personal-injury',
  'social-security-disability': 'personal-injury',
  'appeals': 'personal-injury',
  'arbitration-mediation': 'personal-injury',
  'administrative-law': 'personal-injury',
  'agricultural-law': 'real-estate',
  'animal-law': 'personal-injury',
  'church-abuse': 'personal-injury',
  'education-law': 'personal-injury',
  'entertainment-law': 'written-contract',
  'health-care-law': 'professional-malpractice',
  'hospitality-law': 'written-contract',
  'international-law': 'written-contract',
  'nonprofit-law': 'written-contract',
  'sports-law': 'written-contract',
  'telecommunications-law': 'written-contract',
  'transportation-law': 'personal-injury',
  'utilities-energy-law': 'written-contract',
  'water-rights': 'real-estate',
  'government-contracts': 'written-contract',
  'election-law': 'personal-injury',
  'lobbying-law': 'personal-injury',
}

/**
 * Get the statute of limitations (in years) for a practice area in a given state.
 * Returns 0 if not applicable or unknown.
 */
export function getStatuteOfLimitations(paSlug: string, stateAbbr: string): number {
  const category = PA_TO_SOL_CATEGORY[paSlug] ?? 'personal-injury'
  return STATE_SOL[category]?.[stateAbbr.toUpperCase()] ?? 2
}

// ---------------------------------------------------------------------------
// State names lookup
// ---------------------------------------------------------------------------

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin',
  WY: 'Wyoming',
}

export function getStateName(stateAbbr: string): string {
  return STATE_NAMES[stateAbbr.toUpperCase()] ?? stateAbbr
}

// ---------------------------------------------------------------------------
// State free legal resources
// ---------------------------------------------------------------------------

const STATE_LEGAL_AID: Record<string, string[]> = {
  AL: ['Legal Services Alabama (LSA)', 'Alabama State Bar Volunteer Lawyers Program', 'Alabama Legal Help (alabamalegalhelp.org)'],
  AK: ['Alaska Legal Services Corporation', 'Alaska Bar Association Pro Bono Program', 'Alaska Law Help (alaskalawhelp.org)'],
  AZ: ['Community Legal Services (CLS)', 'Arizona Foundation for Legal Services', 'Arizona Law Help (azlawhelp.org)'],
  AR: ['Center for Arkansas Legal Services', 'Legal Aid of Arkansas', 'Arkansas Legal Services Online (arlegalservices.org)'],
  CA: ['Legal Aid Foundation of Los Angeles', 'Bay Area Legal Aid', 'California Courts Self-Help Center (courts.ca.gov/selfhelp)'],
  CO: ['Colorado Legal Services', 'Colorado Bar Association Pro Bono Project', 'Colorado Legal Help (coloradolegalservices.org)'],
  CT: ['Connecticut Legal Services', 'Statewide Legal Services of Connecticut', 'CT Law Help (ctlawhelp.org)'],
  DE: ['Delaware Volunteer Legal Services', 'Community Legal Aid Society (CLASI)', 'Delaware Law Help (delawaylawhelp.org)'],
  DC: ['Legal Aid Society of the District of Columbia', 'DC Bar Pro Bono Center', 'LawHelp DC (lawhelp.org/dc)'],
  FL: ['Florida Legal Services', 'Florida Bar Foundation', 'Florida Law Help (floridalawhelp.org)'],
  GA: ['Georgia Legal Services Program', 'Atlanta Legal Aid Society', 'Georgia Law Help (georgialegalaid.org)'],
  HI: ['Legal Aid Society of Hawaii', 'Volunteer Legal Services Hawaii', 'Hawaii Law Help (lawhelp.org/hi)'],
  ID: ['Idaho Legal Aid Services', 'Idaho Volunteer Lawyers Program', 'Idaho Law Help (idaholegalaid.org)'],
  IL: ['Legal Aid Chicago', 'Prairie State Legal Services', 'Illinois Law Help (illinoislegalaid.org)'],
  IN: ['Indiana Legal Services', 'Indiana Bar Foundation Pro Bono Program', 'Indiana Law Help (indianalegalhelp.org)'],
  IA: ['Iowa Legal Aid', 'Iowa State Bar Volunteer Lawyers Project', 'Iowa Law Help (iowalegalaid.org)'],
  KS: ['Kansas Legal Services', 'Kansas Bar Association Pro Bono Program', 'Kansas Law Help (kansaslegalservices.org)'],
  KY: ['Legal Aid of the Bluegrass', 'Kentucky Legal Aid', 'Kentucky Law Help (klaid.org)'],
  LA: ['Southeast Louisiana Legal Services', 'Acadiana Legal Service Corporation', 'Louisiana Law Help (lalawhelp.org)'],
  ME: ['Pine Tree Legal Assistance', 'Volunteer Lawyers Project (Maine)', 'Maine Law Help (ptla.org)'],
  MD: ['Maryland Legal Aid', 'Pro Bono Resource Center of Maryland', 'Maryland Law Help (mdlab.org)'],
  MA: ['Greater Boston Legal Services', 'Massachusetts Legal Aid (mlac.org)', 'Mass Law Help (masslegalhelp.org)'],
  MI: ['Michigan Legal Help', 'Legal Aid of Western Michigan', 'Michigan Law Help (michiganlegalhelp.org)'],
  MN: ['Legal Aid State Support (Minnesota)', 'Volunteer Lawyers Network', 'Minnesota Law Help (lawhelpmn.org)'],
  MS: ['Mississippi Center for Legal Services', 'North Mississippi Rural Legal Services', 'Mississippi Law Help (mslegalservices.org)'],
  MO: ['Legal Services of Eastern Missouri', 'Legal Aid of Western Missouri', 'Missouri Law Help (mobar.org/public)'],
  MT: ['Montana Legal Services Association', 'State Bar of Montana Pro Bono Program', 'Montana Law Help (montanalawhelp.org)'],
  NE: ['Legal Aid of Nebraska', 'Nebraska State Bar Volunteer Lawyers Project', 'Nebraska Law Help (nebraskalegalaid.org)'],
  NV: ['Nevada Legal Services', 'Legal Aid Center of Southern Nevada', 'Nevada Law Help (nevadalegalservices.org)'],
  NH: ['New Hampshire Legal Assistance', 'NH Pro Bono Referral Program', 'NH Law Help (nhlegalaid.org)'],
  NJ: ['Legal Services of New Jersey', 'NJ Volunteer Lawyers for Justice', 'NJ Law Help (lsnj.org)'],
  NM: ['New Mexico Legal Aid', 'State Bar of New Mexico Pro Bono Program', 'NM Law Help (newmexicolegalaid.org)'],
  NY: ['Legal Aid Society of New York', 'NY Legal Assistance Group (NYLAG)', 'NY Law Help (lawhelpny.org)'],
  NC: ['Legal Aid of North Carolina', 'NC Pro Bono Resource Center', 'NC Law Help (legalaidnc.org)'],
  ND: ['Legal Services of North Dakota', 'ND State Bar Lawyer Referral', 'ND Law Help (legalassist.org)'],
  OH: ['Legal Aid Society of Cleveland', 'Ohio State Legal Services', 'Ohio Law Help (ohiolegalhelp.org)'],
  OK: ['Legal Aid Services of Oklahoma', 'Oklahoma Indian Legal Services', 'OK Law Help (oklaw.org)'],
  OR: ['Legal Aid Services of Oregon', 'Oregon State Bar Pro Bono Program', 'Oregon Law Help (oregonlawhelp.org)'],
  PA: ['Legal Aid of Southeastern PA', 'Neighborhood Legal Services (Pittsburgh)', 'PA Law Help (palawhelp.org)'],
  RI: ['Rhode Island Legal Services', 'RI Bar Pro Bono Program', 'RI Law Help (helprilaw.org)'],
  SC: ['South Carolina Legal Services', 'SC Bar Pro Bono Program', 'SC Law Help (lawhelp.org/sc)'],
  SD: ['East River Legal Services', 'Dakota Plains Legal Services', 'SD Law Help (sdlawhelp.org)'],
  TN: ['Legal Aid Society of Middle TN', 'Memphis Area Legal Services', 'Tennessee Law Help (tals.org)'],
  TX: ['Lone Star Legal Aid', 'Texas RioGrande Legal Aid', 'Texas Law Help (texaslawhelp.org)'],
  UT: ['Utah Legal Services', 'Utah State Bar Pro Bono Program', 'Utah Law Help (utahlegalservices.org)'],
  VT: ['Legal Services Vermont', 'Vermont Volunteer Lawyers Project', 'VT Law Help (vtlegalaid.org)'],
  VA: ['Legal Aid Justice Center (Virginia)', 'Virginia Legal Aid Society', 'VA Law Help (valegalaid.org)'],
  WA: ['Northwest Justice Project', 'King County Bar Pro Bono Services', 'WA Law Help (washingtonlawhelp.org)'],
  WV: ['Legal Aid of West Virginia', 'WV Senior Legal Aid', 'WV Law Help (lawhelp.org/wv)'],
  WI: ['Legal Action of Wisconsin', 'Wisconsin Judicare', 'WI Law Help (wilawlibrary.gov/selfhelp)'],
  WY: ['Legal Aid of Wyoming', 'Wyoming State Bar Pro Bono Program', 'WY Law Help (wyominglaw help.org)'],
}

export function getStateLegalAid(stateAbbr: string): string[] {
  return STATE_LEGAL_AID[stateAbbr.toUpperCase()] ?? []
}

// ---------------------------------------------------------------------------
// State bar complaint info
// ---------------------------------------------------------------------------

const STATE_BAR_COMPLAINT: Record<string, { body: string; phone: string }> = {
  AL: { body: 'Alabama State Bar Disciplinary Commission', phone: '(334) 269-1515' },
  AK: { body: 'Alaska Bar Association', phone: '(907) 272-7469' },
  AZ: { body: 'State Bar of Arizona', phone: '(602) 252-4804' },
  AR: { body: 'Arkansas Supreme Court Committee on Professional Conduct', phone: '(501) 376-0313' },
  CA: { body: 'State Bar of California Office of Chief Trial Counsel', phone: '(800) 843-9053' },
  CO: { body: 'Colorado Supreme Court Attorney Regulation Counsel', phone: '(303) 457-5800' },
  CT: { body: 'Connecticut Statewide Grievance Committee', phone: '(860) 568-5157' },
  DE: { body: 'Delaware Office of Disciplinary Counsel', phone: '(302) 651-3925' },
  DC: { body: 'DC Office of Disciplinary Counsel', phone: '(202) 638-1501' },
  FL: { body: 'Florida Bar Attorney Consumer Assistance Program', phone: '(866) 352-0707' },
  GA: { body: 'State Bar of Georgia Office of General Counsel', phone: '(404) 527-8720' },
  HI: { body: 'Hawaii Office of Disciplinary Counsel', phone: '(808) 521-4591' },
  ID: { body: 'Idaho State Bar Counsel', phone: '(208) 334-4500' },
  IL: { body: 'Illinois Attorney Registration and Disciplinary Commission', phone: '(312) 565-2600' },
  IN: { body: 'Indiana Supreme Court Disciplinary Commission', phone: '(317) 232-1807' },
  IA: { body: 'Iowa Supreme Court Attorney Disciplinary Board', phone: '(515) 725-8017' },
  KS: { body: 'Kansas Disciplinary Administrator Office', phone: '(785) 296-2486' },
  KY: { body: 'Kentucky Bar Association Office of Bar Counsel', phone: '(502) 564-3795' },
  LA: { body: 'Louisiana Attorney Disciplinary Board', phone: '(504) 834-1488' },
  ME: { body: 'Maine Board of Overseers of the Bar', phone: '(207) 623-1121' },
  MD: { body: 'Maryland Attorney Grievance Commission', phone: '(410) 514-7051' },
  MA: { body: 'Massachusetts Board of Bar Overseers', phone: '(617) 728-8750' },
  MI: { body: 'Michigan Attorney Grievance Commission', phone: '(313) 961-6585' },
  MN: { body: 'Minnesota Office of Lawyers Professional Responsibility', phone: '(651) 296-3952' },
  MS: { body: 'Mississippi Bar General Counsel', phone: '(601) 948-4471' },
  MO: { body: 'Missouri Office of Chief Disciplinary Counsel', phone: '(573) 635-7400' },
  MT: { body: 'Montana Office of Disciplinary Counsel', phone: '(406) 841-2952' },
  NE: { body: 'Nebraska Counsel for Discipline', phone: '(402) 471-2024' },
  NV: { body: 'State Bar of Nevada Office of Bar Counsel', phone: '(702) 382-2200' },
  NH: { body: 'New Hampshire Attorney Discipline Office', phone: '(603) 224-5828' },
  NJ: { body: 'New Jersey Office of Attorney Ethics', phone: '(609) 403-7800' },
  NM: { body: 'New Mexico Disciplinary Board', phone: '(505) 842-5781' },
  NY: { body: 'New York Attorney Grievance Committee', phone: '(212) 401-0800' },
  NC: { body: 'North Carolina State Bar', phone: '(919) 828-4620' },
  ND: { body: 'North Dakota Disciplinary Board', phone: '(701) 328-3925' },
  OH: { body: 'Ohio Office of Disciplinary Counsel', phone: '(614) 461-0256' },
  OK: { body: 'Oklahoma Bar Association Office of General Counsel', phone: '(405) 416-7007' },
  OR: { body: 'Oregon State Bar Disciplinary Counsel', phone: '(503) 620-0222' },
  PA: { body: 'Pennsylvania Disciplinary Board', phone: '(717) 231-3380' },
  RI: { body: 'Rhode Island Supreme Court Disciplinary Counsel', phone: '(401) 222-3270' },
  SC: { body: 'South Carolina Office of Disciplinary Counsel', phone: '(803) 734-2038' },
  SD: { body: 'South Dakota Disciplinary Board', phone: '(605) 224-7554' },
  TN: { body: 'Tennessee Board of Professional Responsibility', phone: '(615) 361-7500' },
  TX: { body: 'State Bar of Texas Office of Chief Disciplinary Counsel', phone: '(800) 932-1900' },
  UT: { body: 'Utah State Bar Office of Professional Conduct', phone: '(801) 531-9110' },
  VT: { body: 'Vermont Professional Responsibility Board', phone: '(802) 859-3000' },
  VA: { body: 'Virginia State Bar', phone: '(804) 775-0500' },
  WA: { body: 'Washington State Bar Association Office of Disciplinary Counsel', phone: '(206) 727-8207' },
  WV: { body: 'West Virginia Office of Disciplinary Counsel', phone: '(304) 558-7999' },
  WI: { body: 'Wisconsin Office of Lawyer Regulation', phone: '(608) 267-7274' },
  WY: { body: 'Wyoming State Bar Disciplinary Department', phone: '(307) 632-9061' },
}

export function getStateBarComplaint(stateAbbr: string): { body: string; phone: string } | undefined {
  return STATE_BAR_COMPLAINT[stateAbbr.toUpperCase()]
}

// ---------------------------------------------------------------------------
// Estimated active attorneys per state (approximate, for content generation)
// ---------------------------------------------------------------------------

const STATE_ATTORNEY_COUNTS: Record<string, number> = {
  AL: 16500, AK: 3200, AZ: 22000, AR: 8500, CA: 190000,
  CO: 28000, CT: 22000, DE: 4500, DC: 56000, FL: 108000,
  GA: 40000, HI: 5500, ID: 5000, IL: 97000, IN: 20000,
  IA: 10000, KS: 9500, KY: 14000, LA: 22000, ME: 5000,
  MD: 38000, MA: 50000, MI: 38000, MN: 27000, MS: 9000,
  MO: 30000, MT: 3500, NE: 7000, NV: 10000, NH: 5000,
  NJ: 72000, NM: 6500, NY: 180000, NC: 30000, ND: 2500,
  OH: 46000, OK: 15000, OR: 16000, PA: 70000, RI: 6000,
  SC: 13000, SD: 3000, TN: 24000, TX: 105000, UT: 11000,
  VT: 3200, VA: 35000, WA: 36000, WV: 5500, WI: 20000, WY: 2200,
}

export function getStateAttorneyCount(stateAbbr: string): number {
  return STATE_ATTORNEY_COUNTS[stateAbbr.toUpperCase()] ?? 5000
}

// ---------------------------------------------------------------------------
// Average attorney cost per state (hourly rate in USD)
// ---------------------------------------------------------------------------

const STATE_AVG_HOURLY_RATE: Record<string, number> = {
  AL: 225, AK: 300, AZ: 275, AR: 200, CA: 400,
  CO: 300, CT: 350, DE: 300, DC: 425, FL: 300,
  GA: 275, HI: 350, ID: 225, IL: 325, IN: 225,
  IA: 225, KS: 225, KY: 225, LA: 250, ME: 250,
  MD: 325, MA: 375, MI: 275, MN: 275, MS: 200,
  MO: 250, MT: 225, NE: 225, NV: 300, NH: 275,
  NJ: 350, NM: 225, NY: 400, NC: 275, ND: 225,
  OH: 250, OK: 225, OR: 275, PA: 300, RI: 275,
  SC: 250, SD: 225, TN: 250, TX: 300, UT: 250,
  VT: 250, VA: 300, WA: 325, WV: 200, WI: 250, WY: 225,
}

export function getStateAvgHourlyRate(stateAbbr: string): number {
  return STATE_AVG_HOURLY_RATE[stateAbbr.toUpperCase()] ?? 275
}

// ---------------------------------------------------------------------------
// 3 PA × State FAQ templates (enable 22,950 pages: 3 × 51 × 150)
// ---------------------------------------------------------------------------

export interface PAStateFAQParams {
  stateAbbr: string
  stateName: string
  specialtySlug: string
  specialtyName: string
}

export interface PAStateFAQItem {
  slug: string
  question: string
  answer: string
}

function faqDoINeed(p: PAStateFAQParams): PAStateFAQItem {
  const sol = getStatuteOfLimitations(p.specialtySlug, p.stateAbbr)
  const rate = getStateAvgHourlyRate(p.stateAbbr)
  const multiplier = getRegionalPricingMultiplier(p.stateAbbr)
  const count = getStateAttorneyCount(p.stateAbbr)
  const paCount = Math.round(count * 0.08)
  const barUrl = getStateBarVerificationUrl(p.stateAbbr)
  const barRef = barUrl ? ` You can verify credentials through the ${p.stateName} State Bar directory.` : ''

  return {
    slug: `do-i-need-${p.specialtySlug}-lawyer-${p.stateAbbr.toLowerCase()}`,
    question: `Do I need a ${p.specialtyName} lawyer in ${p.stateName}?`,
    answer: `Whether you need a ${p.specialtyName} attorney in ${p.stateName} depends on the complexity of your situation and what is at stake. ${p.stateName} has specific laws governing ${p.specialtyName} matters that differ from other states, and navigating them without legal expertise can be risky. The statute of limitations for most ${p.specialtyName} claims in ${p.stateName} is ${sol} year${sol !== 1 ? 's' : ''}, meaning you must take legal action within that window or lose your right to pursue your case entirely. With approximately ${fmtNumber(paCount)} ${p.specialtyName} attorneys actively practicing in ${p.stateName}, you have multiple options for representation. Average hourly rates for ${p.specialtyName} lawyers in ${p.stateName} range from ${fmtCurrency(rate * 0.6)} to ${fmtCurrency(rate * 1.5)} per hour, which is ${multiplier > 1.1 ? 'above' : multiplier < 0.9 ? 'below' : 'near'} the national average. Many ${p.specialtyName} attorneys in ${p.stateName} offer free initial consultations, allowing you to discuss your situation and understand your options before making any financial commitment. If your case involves significant financial stakes, potential criminal penalties, custody of children, or complex regulatory requirements, hiring a qualified ${p.specialtyName} attorney is strongly recommended.${barRef} Even for seemingly straightforward matters, a brief consultation can reveal legal nuances specific to ${p.stateName} that could significantly affect your outcome.`,
  }
}

function faqWhatDoesLawyerDo(p: PAStateFAQParams): PAStateFAQItem {
  const sol = getStatuteOfLimitations(p.specialtySlug, p.stateAbbr)
  const rate = getStateAvgHourlyRate(p.stateAbbr)
  const count = getStateAttorneyCount(p.stateAbbr)
  const paCount = Math.round(count * 0.08)
  const resources = getStateLegalAid(p.stateAbbr)
  const resourceMention = resources.length > 0 ? ` Free resources like ${resources[0]} may also provide initial guidance.` : ''

  return {
    slug: `what-does-${p.specialtySlug}-lawyer-do-${p.stateAbbr.toLowerCase()}`,
    question: `What does a ${p.specialtyName} lawyer do in ${p.stateName}?`,
    answer: `A ${p.specialtyName} attorney in ${p.stateName} provides specialized legal representation tailored to ${p.stateName}'s specific statutory framework and court procedures. Their core responsibilities include: evaluating the merits of your case under ${p.stateName} law, advising you on your legal rights and options, preparing and filing court documents in compliance with ${p.stateName} procedural rules, negotiating with opposing parties or their attorneys, and representing you in court proceedings if necessary. In ${p.stateName}, ${p.specialtyName} cases are subject to a ${sol}-year statute of limitations, and your attorney will ensure all deadlines are met. They will also handle discovery — the process of gathering evidence — and work with expert witnesses when needed. ${p.stateName} has approximately ${fmtNumber(paCount)} practicing ${p.specialtyName} attorneys, with average fees of ${fmtCurrency(rate)} per hour. Beyond litigation, ${p.specialtyName} lawyers in ${p.stateName} also provide preventive counsel: reviewing contracts, ensuring regulatory compliance, and helping you avoid legal pitfalls specific to ${p.stateName}'s legal environment.${resourceMention} A good ${p.specialtyName} attorney will also keep you informed about recent changes in ${p.stateName} law that may affect your case and provide realistic expectations about timelines and outcomes based on their experience with local courts.`,
  }
}

function faqHowToFind(p: PAStateFAQParams): PAStateFAQItem {
  const rate = getStateAvgHourlyRate(p.stateAbbr)
  const count = getStateAttorneyCount(p.stateAbbr)
  const paCount = Math.round(count * 0.08)
  const barUrl = getStateBarVerificationUrl(p.stateAbbr)
  const resources = getStateLegalAid(p.stateAbbr)
  const complaint = getStateBarComplaint(p.stateAbbr)
  const barRef = barUrl ? `Start by checking the ${p.stateName} State Bar's official directory at ${barUrl} to verify any attorney's license status and disciplinary record. ` : `Start by checking the ${p.stateName} State Bar's official directory to verify any attorney's license status. `
  const resourceList = resources.length > 0 ? ` For those who cannot afford private counsel, ${p.stateName} offers free legal resources including ${resources.slice(0, 2).join(' and ')}.` : ''
  const complaintRef = complaint ? ` If you ever need to file a complaint, contact the ${complaint.body} at ${complaint.phone}.` : ''

  return {
    slug: `how-to-find-${p.specialtySlug}-lawyer-${p.stateAbbr.toLowerCase()}`,
    question: `How to find a ${p.specialtyName} lawyer in ${p.stateName}?`,
    answer: `Finding the right ${p.specialtyName} attorney in ${p.stateName} requires a systematic approach. ${barRef}${p.stateName} has approximately ${fmtNumber(paCount)} attorneys who practice ${p.specialtyName} law, giving you a solid pool of candidates. Key steps to find the best fit: First, identify attorneys who specialize specifically in ${p.specialtyName} rather than general practitioners — specialization significantly impacts case quality. Second, check online reviews and ratings on legal directories while keeping in mind that no review source is perfect. Third, schedule consultations with at least 2-3 candidates (many offer free initial meetings). Fourth, during consultations, ask about their experience with ${p.specialtyName} cases in ${p.stateName}, their fee structure (average hourly rate: ${fmtCurrency(rate)}), who will handle your case day-to-day, and their communication practices. Fifth, verify their standing with the ${p.stateName} State Bar and check for any disciplinary actions.${resourceList}${complaintRef} Look for attorneys with board certifications, bar association leadership roles, or peer-recognition awards in ${p.specialtyName}. Personal referrals from trusted friends or other attorneys remain one of the most reliable ways to find quality representation.`,
  }
}

/**
 * Generate the 3 PA × State FAQ items for a given specialty and state.
 * These power 22,950 dedicated FAQ pages (3 questions × 51 states × 150 PAs).
 */
export function generatePracticeAreaStateFAQ(specialtySlug: string, specialtyName: string, stateAbbr: string): PAStateFAQItem[] {
  const params: PAStateFAQParams = {
    stateAbbr: stateAbbr.toUpperCase(),
    stateName: getStateName(stateAbbr),
    specialtySlug,
    specialtyName,
  }
  return [
    faqDoINeed(params),
    faqWhatDoesLawyerDo(params),
    faqHowToFind(params),
  ]
}

/**
 * Generate a single PA × State FAQ by question type index (0, 1, or 2).
 */
export function generateSinglePAStateFAQ(
  specialtySlug: string,
  specialtyName: string,
  stateAbbr: string,
  questionIndex: 0 | 1 | 2
): PAStateFAQItem {
  const params: PAStateFAQParams = {
    stateAbbr: stateAbbr.toUpperCase(),
    stateName: getStateName(stateAbbr),
    specialtySlug,
    specialtyName,
  }
  const generators = [faqDoINeed, faqWhatDoesLawyerDo, faqHowToFind]
  return generators[questionIndex](params)
}

// ---------------------------------------------------------------------------
// Exports summary
// ---------------------------------------------------------------------------

export {
  ALL_FAQ_TEMPLATES,
  hashCode,
  STATE_NAMES,
}

export type { FAQTemplateFunction, RegionalTipSet, SOLCategory }
