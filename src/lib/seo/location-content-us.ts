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
// Exports summary
// ---------------------------------------------------------------------------

export {
  ALL_FAQ_TEMPLATES,
  hashCode,
}

export type { FAQTemplateFunction, RegionalTipSet }
