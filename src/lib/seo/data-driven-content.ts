/**
 * Data-driven content generator for service+location pages.
 *
 * Produces unique, factual paragraphs for each city x practice area
 * combination using Census ACS data, state legal market data,
 * practice area cost ranges, and statute of limitations.
 *
 * Every paragraph is unique because it embeds real numeric data
 * and uses a hash-based template selection system to vary phrasing.
 */

import type { LocationData } from '@/lib/data/location-data'
import { formatNumber, formatUSD } from '@/lib/data/location-data'
import {
  getStatuteOfLimitations,
  getStateName,
  getStateAttorneyCount,
  getStateAvgHourlyRate,
  PA_TO_SOL_CATEGORY,
  type SOLCategory,
} from '@/lib/data/state-legal-data'
import { getAttorneyContent } from '@/lib/data/trade-content'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataDrivenContent {
  /** Data-rich introduction paragraph */
  intro: string
  /** Socio-economic context paragraph */
  socioEconomic: string | null
  /** Real estate market context */
  realEstate: string | null
  /** Local legal market (law firms + certifications) */
  legalMarket: string | null
  /** Legal aid and pro bono context */
  legalAid: string | null
  /** Climate-driven advice with real data */
  climatData: string | null
  /** Service-specific local demand analysis (always generated) */
  localDemand: string
  /** Service-specific regulatory/standards context (always generated) */
  regulations: string
  /** Data-enriched FAQ items (replace template FAQs when data available) */
  faqItems: { question: string; answer: string }[]
  /** E-E-A-T data sources citation */
  dataSources: string[]
}

// ---------------------------------------------------------------------------
// Deterministic hash (same as programmatic-seo.ts)
// ---------------------------------------------------------------------------

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash)
}

/** Pick a template deterministically based on city+specialty combo */
function pick<T>(templates: T[], city: string, specialty: string, salt: string = ''): T {
  const idx = hashCode(`${city}|${specialty}|${salt}`) % templates.length
  return templates[idx]
}

// ---------------------------------------------------------------------------
// SOL category → human-readable label
// ---------------------------------------------------------------------------

const SOL_CATEGORY_LABELS: Record<SOLCategory, string> = {
  'personal-injury': 'personal injury',
  'medical-malpractice': 'medical malpractice',
  'property-damage': 'property damage',
  'written-contract': 'written contracts',
  'oral-contract': 'oral contracts',
  'fraud': 'fraud',
  'employment': 'employment disputes',
  'wrongful-death': 'wrongful death',
  'product-liability': 'product liability',
  'defamation': 'defamation',
  'professional-malpractice': 'professional malpractice',
  'real-estate': 'real estate disputes',
  'debt-collection': 'debt collection',
}

// ---------------------------------------------------------------------------
// Practice area → demand driver descriptions
// Grouped by broad category to avoid repeating the same logic for 200 PAs
// ---------------------------------------------------------------------------

const DEMAND_CATEGORIES: Record<string, string[]> = {
  'personal-injury': [
    'Motor vehicle accidents, workplace incidents, and premises liability claims drive consistent demand for personal injury representation.',
    'Population density and traffic volume correlate directly with the frequency of accident-related legal claims.',
    'Slip-and-fall incidents, dog bites, and product-related injuries create steady caseloads for personal injury attorneys.',
  ],
  'medical-malpractice': [
    'The presence of hospitals, surgical centers, and urgent care facilities generates a baseline of medical malpractice inquiries.',
    'Diagnostic errors, surgical complications, and medication mistakes remain leading categories of medical malpractice claims.',
    'Residents who receive care at local hospitals and clinics may encounter situations where professional negligence requires legal evaluation.',
  ],
  'employment': [
    'Local employers across retail, healthcare, and services sectors create a steady volume of employment disputes including wrongful termination and wage claims.',
    'Workplace discrimination, harassment, and retaliation claims are common in communities with diverse workforces.',
    'As the gig economy expands, worker misclassification and wage-hour violations are increasingly common employment law matters.',
  ],
  'written-contract': [
    'Business formation, partnership disputes, and contract enforcement drive demand for attorneys versed in commercial law.',
    'Small businesses and entrepreneurs frequently need contract review, negotiation, and enforcement services.',
    'Commercial lease disputes, vendor agreements, and non-compete enforcement are common business law matters in growing communities.',
  ],
  'real-estate': [
    'Property transactions, boundary disputes, and landlord-tenant matters create ongoing need for real estate legal representation.',
    'Homeownership rates and housing market activity directly influence demand for real estate attorneys.',
    'Zoning changes, title disputes, and HOA conflicts are common legal issues tied to local property markets.',
  ],
  'fraud': [
    'Tax disputes, consumer fraud, and white-collar investigations drive demand for attorneys with financial litigation experience.',
    'Identity theft, investment fraud, and insurance fraud cases have increased alongside digital transaction volume.',
    'Complex financial structures and increasing regulatory scrutiny generate a growing need for fraud defense and prosecution attorneys.',
  ],
  'wrongful-death': [
    'Fatal accidents, medical negligence resulting in death, and workplace fatalities drive wrongful death litigation.',
    'Families who lose a loved one due to another party\'s negligence have a limited window to pursue compensation.',
    'Wrongful death claims often involve complex valuation of lost earnings, companionship, and future support.',
  ],
  'product-liability': [
    'Defective consumer products, pharmaceutical side effects, and medical device failures drive product liability claims.',
    'Residents harmed by dangerous products may be entitled to compensation from manufacturers, distributors, or retailers.',
    'Mass tort and class action cases related to product defects often originate from individual injury reports in local communities.',
  ],
  'defamation': [
    'Online defamation, business disparagement, and social media-related reputation harm are growing areas of litigation.',
    'The rise of digital communication has increased the frequency and severity of defamation claims.',
    'Business owners and professionals who suffer reputational harm from false statements increasingly seek legal remedies.',
  ],
  'professional-malpractice': [
    'Legal malpractice, accounting errors, and fiduciary breaches generate professional liability claims in growing communities.',
    'Professionals who fail to meet their duty of care may face malpractice lawsuits from affected clients.',
    'As professional services complexity grows, so does the frequency of malpractice allegations across licensed professions.',
  ],
  'debt-collection': [
    'Consumer debt disputes, creditor harassment, and bankruptcy filings reflect economic pressures on local residents.',
    'Rising consumer debt levels and aggressive collection practices drive demand for debtor-side legal representation.',
    'Bankruptcy filings and debt collection defense are closely tied to local economic conditions and employment stability.',
  ],
}

// ---------------------------------------------------------------------------
// Income bracket classification
// ---------------------------------------------------------------------------

function incomeLevel(medianIncome: number): 'low' | 'moderate' | 'middle' | 'upper-middle' | 'high' {
  if (medianIncome < 35000) return 'low'
  if (medianIncome < 50000) return 'moderate'
  if (medianIncome < 75000) return 'middle'
  if (medianIncome < 120000) return 'upper-middle'
  return 'high'
}

function incomeLevelLabel(level: string): string {
  switch (level) {
    case 'low': return 'a below-average'
    case 'moderate': return 'a moderate'
    case 'middle': return 'a middle-range'
    case 'upper-middle': return 'an above-average'
    case 'high': return 'a high'
    default: return 'a moderate'
  }
}

// ---------------------------------------------------------------------------
// Population tier classification
// ---------------------------------------------------------------------------

function populationTier(pop: number): string {
  if (pop < 10000) return 'small town'
  if (pop < 50000) return 'mid-size city'
  if (pop < 200000) return 'large city'
  if (pop < 1000000) return 'major metropolitan area'
  return 'large metropolitan area'
}

// ---------------------------------------------------------------------------
// Attorney density classification
// ---------------------------------------------------------------------------

function attorneyDensityLabel(attorneysPerCapita: number): string {
  if (attorneysPerCapita < 1) return 'underserved'
  if (attorneysPerCapita < 3) return 'moderately served'
  if (attorneysPerCapita < 6) return 'well-served'
  return 'highly competitive'
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateDataDrivenContent(
  location: LocationData,
  specialtySlug: string,
  specialtyName: string,
  attorneyCount: number,
): DataDrivenContent {
  const cityName = location.name
  const stateAbbr = location.departement_code || ''
  const stateName = getStateName(stateAbbr) || location.departement_name || stateAbbr
  const population = location.census_data?.population || location.population || 0
  const census = location.census_data
  const stateAttorneys = getStateAttorneyCount(stateAbbr)
  const stateHourlyRate = getStateAvgHourlyRate(stateAbbr)
  const solYears = getStatuteOfLimitations(specialtySlug, stateAbbr)
  const solCategory = PA_TO_SOL_CATEGORY[specialtySlug] ?? 'personal-injury'
  const solLabel = SOL_CATEGORY_LABELS[solCategory] || solCategory.replace(/-/g, ' ')
  const tradeData = getAttorneyContent(specialtySlug)

  const dataSources: string[] = []

  // ------ INTRO ------
  const introTemplates = [
    `${cityName}, ${stateName} is a ${populationTier(population)} with a population of ${formatNumber(population)} residents. The local legal market includes ${attorneyCount > 0 ? formatNumber(attorneyCount) : 'several'} ${specialtyName.toLowerCase()} attorney${attorneyCount !== 1 ? 's' : ''} serving the community. ${stateName} is home to approximately ${formatNumber(stateAttorneys)} licensed attorneys statewide, with an average hourly rate of ${formatUSD(stateHourlyRate)}.`,
    `With ${formatNumber(population)} residents, ${cityName} represents a ${populationTier(population)} in ${stateName} where ${attorneyCount > 0 ? formatNumber(attorneyCount) : 'multiple'} ${specialtyName.toLowerCase()} attorney${attorneyCount !== 1 ? 's' : ''} practice. Across ${stateName}, there are roughly ${formatNumber(stateAttorneys)} active attorneys, and hourly rates average ${formatUSD(stateHourlyRate)}.`,
    `${cityName} is home to ${formatNumber(population)} people in ${stateName}. The city\'s legal market includes ${attorneyCount > 0 ? formatNumber(attorneyCount) : 'a number of'} ${specialtyName.toLowerCase()} practitioner${attorneyCount !== 1 ? 's' : ''}. Statewide, ${stateName} has approximately ${formatNumber(stateAttorneys)} licensed attorneys, with a typical hourly rate of ${formatUSD(stateHourlyRate)}.`,
  ]
  const intro = pick(introTemplates, cityName, specialtySlug, 'intro')

  // ------ SOCIO-ECONOMIC ------
  let socioEconomic: string | null = null
  if (census?.median_household_income || census?.unemployment_rate || census?.poverty_rate) {
    const medianIncome = census.median_household_income || 0
    const level = incomeLevel(medianIncome)
    const parts: string[] = []

    if (medianIncome > 0) {
      parts.push(`${cityName} has ${incomeLevelLabel(level)} median household income of ${formatUSD(medianIncome)}`)
      dataSources.push('U.S. Census Bureau ACS 5-Year Estimates')
    }
    if (census.unemployment_rate != null) {
      parts.push(`the local unemployment rate is ${census.unemployment_rate.toFixed(1)}%`)
    }
    if (census.poverty_rate != null) {
      parts.push(`approximately ${census.poverty_rate.toFixed(1)}% of residents live below the poverty line`)
    }
    if (census.median_age != null) {
      parts.push(`the median age is ${census.median_age.toFixed(1)} years`)
    }

    const prefix = pick([
      'Understanding local economic conditions helps evaluate legal service costs.',
      'Economic factors directly affect both the need for and accessibility of legal services.',
      'Local demographics and economics shape the legal market in meaningful ways.',
    ], cityName, specialtySlug, 'socio-prefix')

    const incomeContext = level === 'low' || level === 'moderate'
      ? ` Residents in this income bracket may benefit from attorneys who offer sliding-scale fees, payment plans, or pro bono services.`
      : level === 'high' || level === 'upper-middle'
        ? ` Higher local incomes often correlate with more complex legal matters involving real estate, business interests, and estate planning.`
        : ` This income level is typical for communities where legal expenses represent a meaningful household consideration.`

    socioEconomic = `${prefix} ${parts.join('; ')}.${incomeContext}`
  }

  // ------ REAL ESTATE ------
  let realEstate: string | null = null
  if (location.prix_m2_moyen || location.nb_transactions_annuelles || (census?.owner_occupied_pct != null)) {
    const reParts: string[] = []
    if (census?.owner_occupied_pct != null) {
      reParts.push(`${census.owner_occupied_pct.toFixed(0)}% of housing units are owner-occupied`)
    }
    if (location.nb_transactions_annuelles) {
      reParts.push(`approximately ${formatNumber(location.nb_transactions_annuelles)} real estate transactions occur annually`)
    }
    if (census?.total_households) {
      reParts.push(`the city has roughly ${formatNumber(census.total_households)} households`)
    }

    const reContextTemplates = [
      `The real estate landscape in ${cityName} shapes demand for property-related legal services.`,
      `Housing market dynamics in ${cityName} directly influence the need for legal counsel.`,
      `Real estate activity in ${cityName} generates ongoing demand for attorney services.`,
    ]
    const reContext = pick(reContextTemplates, cityName, specialtySlug, 're')
    const reRelation = (specialtySlug.includes('real-estate') || specialtySlug.includes('landlord') || specialtySlug.includes('construction') || specialtySlug.includes('foreclosure') || specialtySlug.includes('hoa'))
      ? ` This market activity directly drives demand for ${specialtyName.toLowerCase()} services.`
      : (specialtySlug.includes('estate-planning') || specialtySlug.includes('probate') || specialtySlug.includes('trust'))
        ? ` Property ownership is a key factor in estate planning and probate matters.`
        : ''

    if (reParts.length > 0) {
      realEstate = `${reContext} In ${cityName}, ${reParts.join(', and ')}.${reRelation}`
    }
  }

  // ------ LEGAL MARKET ------
  let legalMarket: string | null = null
  {
    const density = population > 0 ? (attorneyCount / population) * 1000 : 0
    const densityLabel = attorneyDensityLabel(density)
    const marketTemplates = [
      `The ${specialtyName.toLowerCase()} market in ${cityName} is ${densityLabel}, with ${attorneyCount > 0 ? formatNumber(attorneyCount) : 'a limited number of'} practitioner${attorneyCount !== 1 ? 's' : ''} serving a population of ${formatNumber(population)}. Statewide, ${stateName} attorneys charge an average of ${formatUSD(stateHourlyRate)} per hour.`,
      `${cityName} has ${attorneyCount > 0 ? formatNumber(attorneyCount) : 'few'} ${specialtyName.toLowerCase()} attorney${attorneyCount !== 1 ? 's' : ''} for ${formatNumber(population)} residents, making it a ${densityLabel} market. The average hourly rate in ${stateName} is ${formatUSD(stateHourlyRate)}.`,
      `With ${attorneyCount > 0 ? formatNumber(attorneyCount) : 'limited'} ${specialtyName.toLowerCase()} attorney${attorneyCount !== 1 ? 's' : ''} and ${formatNumber(population)} residents, ${cityName} is a ${densityLabel} legal market. Attorneys in ${stateName} typically charge around ${formatUSD(stateHourlyRate)} per hour.`,
    ]
    legalMarket = pick(marketTemplates, cityName, specialtySlug, 'market')

    if (tradeData) {
      const feeNote = tradeData.contingencyAvailable
        ? ` Many ${specialtyName.toLowerCase()} attorneys offer contingency fee arrangements${tradeData.priceRange.contingencyFee ? ` (typically ${tradeData.priceRange.contingencyFee})` : ''}, meaning clients pay nothing unless they recover compensation.`
        : tradeData.freeConsultation
          ? ` Many ${specialtyName.toLowerCase()} attorneys offer free initial consultations, allowing prospective clients to discuss their case before committing.`
          : ` Hourly rates for ${specialtyName.toLowerCase()} attorneys typically range from ${formatUSD(tradeData.priceRange.min)} to ${formatUSD(tradeData.priceRange.max)} ${tradeData.priceRange.unit}.`
      legalMarket += feeNote
    }

    if (location.nb_law_firms) {
      legalMarket += ` The city has approximately ${formatNumber(location.nb_law_firms)} law firms.`
    }
  }

  // ------ LEGAL AID ------
  let legalAid: string | null = null
  if (census?.poverty_rate != null && census.poverty_rate > 10) {
    const aidTemplates = [
      `With a poverty rate of ${census.poverty_rate.toFixed(1)}%, a significant portion of ${cityName} residents may qualify for legal aid services. ${stateName} legal aid organizations and pro bono programs can help connect low-income individuals with ${specialtyName.toLowerCase()} representation.`,
      `Approximately ${census.poverty_rate.toFixed(1)}% of ${cityName} residents live below the poverty line, indicating substantial demand for affordable legal options. Many ${specialtyName.toLowerCase()} attorneys in ${stateName} participate in pro bono programs or offer reduced-fee arrangements for qualifying clients.`,
      `Given that ${census.poverty_rate.toFixed(1)}% of the population in ${cityName} falls below the poverty threshold, access to affordable ${specialtyName.toLowerCase()} services is a community priority. Local bar associations and legal aid societies can help match eligible residents with pro bono or reduced-cost representation.`,
    ]
    legalAid = pick(aidTemplates, cityName, specialtySlug, 'aid')
    if (tradeData?.proBonoAvailable) {
      legalAid += ` Pro bono services are commonly available in this practice area.`
    }
  }

  // ------ CLIMATE DATA ------
  // This field maps to climate/seasonal considerations. For a legal directory,
  // we repurpose this for seasonal legal demand patterns.
  let climatData: string | null = null
  if (location.jours_gel_annuels != null || location.precipitation_annuelle != null || location.temperature_moyenne_hiver != null) {
    const climateParts: string[] = []
    if (location.jours_gel_annuels != null) {
      climateParts.push(`${location.jours_gel_annuels} frost days per year`)
    }
    if (location.precipitation_annuelle != null) {
      climateParts.push(`${formatNumber(location.precipitation_annuelle)} mm of annual precipitation`)
    }
    if (location.temperature_moyenne_hiver != null && location.temperature_moyenne_ete != null) {
      climateParts.push(`winter temperatures averaging ${location.temperature_moyenne_hiver.toFixed(1)}\u00B0C and summer averaging ${location.temperature_moyenne_ete.toFixed(1)}\u00B0C`)
    }

    if (climateParts.length > 0) {
      const climateIntro = pick([
        `Local climate conditions in ${cityName} include ${climateParts.join(', ')}.`,
        `${cityName} experiences ${climateParts.join(', ')}.`,
        `The climate in ${cityName} features ${climateParts.join(', ')}.`,
      ], cityName, specialtySlug, 'climate')

      const climateRelevance = specialtySlug.includes('construction') || specialtySlug.includes('premises') || specialtySlug.includes('slip-and-fall')
        ? ' Weather patterns directly influence premises liability and construction accident claims, with icy conditions and storm damage creating seasonal spikes in certain case types.'
        : specialtySlug.includes('car-accident') || specialtySlug.includes('truck') || specialtySlug.includes('motorcycle')
          ? ' Adverse weather conditions are a contributing factor in many vehicle accidents, particularly during winter months or heavy rain periods.'
          : ' Seasonal patterns may affect the timing and nature of legal matters in the community.'

      climatData = climateIntro + climateRelevance
    }
  }

  // ------ LOCAL DEMAND ------
  const demandCategory = PA_TO_SOL_CATEGORY[specialtySlug] ?? 'personal-injury'
  const demandTemplatesForCategory = DEMAND_CATEGORIES[demandCategory] || DEMAND_CATEGORIES['personal-injury']
  const baseDemand = pick(demandTemplatesForCategory, cityName, specialtySlug, 'demand')

  let localDemandExtra = ''
  // Add Spanish-speaker context for immigration-related PAs
  if (
    census?.spanish_speakers != null && census.spanish_speakers > 5 &&
    (specialtySlug.includes('immigration') || specialtySlug.includes('visa') || specialtySlug.includes('asylum') ||
     specialtySlug.includes('deportation') || specialtySlug.includes('daca') || specialtySlug.includes('green-card') ||
     specialtySlug.includes('citizenship'))
  ) {
    localDemandExtra = ` Notably, approximately ${census.spanish_speakers.toFixed(0)}% of ${cityName} residents speak Spanish at home, indicating significant demand for bilingual ${specialtyName.toLowerCase()} attorneys who can serve the community effectively.`
  } else if (census?.spanish_speakers != null && census.spanish_speakers > 15) {
    localDemandExtra = ` With ${census.spanish_speakers.toFixed(0)}% of residents speaking Spanish at home, bilingual legal services are an important consideration when choosing an attorney in ${cityName}.`
  }

  // Add education context for IP/business law
  if (
    census?.bachelor_degree_pct != null && census.bachelor_degree_pct > 35 &&
    (specialtySlug.includes('intellectual-property') || specialtySlug.includes('patent') || specialtySlug.includes('trademark') ||
     specialtySlug.includes('startup') || specialtySlug.includes('venture') || specialtySlug.includes('corporate'))
  ) {
    localDemandExtra += ` The city\'s highly educated workforce (${census.bachelor_degree_pct.toFixed(0)}% with a bachelor\'s degree or higher) correlates with strong demand for business and intellectual property legal services.`
  }

  // Add population density context
  if (location.densite_population != null && location.densite_population > 5000) {
    localDemandExtra += ` As a densely populated area (${formatNumber(Math.round(location.densite_population))} people per square mile), ${cityName} generates a high volume of legal matters per capita.`
  }

  const localDemand = `${baseDemand}${localDemandExtra} In ${cityName}, with ${formatNumber(population)} residents and ${attorneyCount > 0 ? formatNumber(attorneyCount) : 'a growing number of'} listed ${specialtyName.toLowerCase()} attorney${attorneyCount !== 1 ? 's' : ''}, clients have ${attorneyCount > 3 ? 'meaningful options' : 'limited but accessible options'} when seeking representation.`

  // ------ REGULATIONS & SOL ------
  const solNote = `In ${stateName}, the statute of limitations for ${solLabel} cases is ${solYears} year${solYears !== 1 ? 's' : ''} from the date of injury or discovery.`

  const regulationTemplates = [
    `${solNote} Missing this deadline generally bars the claim entirely. All attorneys practicing in ${stateName} must be admitted to the ${stateName} Bar and maintain good standing. Verify any attorney's status through the ${stateName} Bar Association before retaining their services.`,
    `${stateName} law sets the statute of limitations for ${solLabel} at ${solYears} year${solYears !== 1 ? 's' : ''}. This is a strict deadline — failing to file before it expires typically eliminates your legal recourse. Attorneys in ${cityName} must hold active ${stateName} Bar membership, which you can confirm through the state bar directory.`,
    `Under ${stateName} law, ${solLabel} claims must be filed within ${solYears} year${solYears !== 1 ? 's' : ''}. This statutory deadline makes timely consultation with a qualified attorney essential. All ${specialtyName.toLowerCase()} attorneys in ${cityName} should be licensed and in good standing with the ${stateName} Bar.`,
  ]
  let regulations = pick(regulationTemplates, cityName, specialtySlug, 'reg')

  if (tradeData?.certifications && tradeData.certifications.length > 0) {
    const certs = tradeData.certifications.slice(0, 3)
    regulations += ` Key credentials to look for include: ${certs.join(', ')}.`
  }

  if (tradeData?.relevantLaws && tradeData.relevantLaws.length > 0) {
    const laws = tradeData.relevantLaws.slice(0, 3)
    regulations += ` Relevant legal frameworks include ${laws.join(', ')}.`
  }

  // ------ FAQ ITEMS ------
  const faqItems: { question: string; answer: string }[] = []

  // FAQ 1: Cost
  if (tradeData) {
    faqItems.push({
      question: `How much does a ${specialtyName.toLowerCase()} attorney cost in ${cityName}, ${stateAbbr}?`,
      answer: `In ${stateName}, ${specialtyName.toLowerCase()} attorneys typically charge between ${formatUSD(tradeData.priceRange.min)} and ${formatUSD(tradeData.priceRange.max)} ${tradeData.priceRange.unit}. The statewide average hourly rate is ${formatUSD(stateHourlyRate)}.${tradeData.contingencyAvailable ? ` Many ${specialtyName.toLowerCase()} attorneys work on contingency (${tradeData.priceRange.contingencyFee || '33-40% of recovery'}), so you pay nothing unless you win.` : ''}${tradeData.freeConsultation ? ' Free initial consultations are commonly available.' : ''} Rates in ${cityName} may vary based on case complexity and attorney experience.`,
    })
  }

  // FAQ 2: SOL
  faqItems.push({
    question: `What is the statute of limitations for ${solLabel} cases in ${stateName}?`,
    answer: `In ${stateName}, the statute of limitations for ${solLabel} is ${solYears} year${solYears !== 1 ? 's' : ''} from the date of injury or discovery. Once this deadline passes, you generally cannot file a lawsuit. Some exceptions may apply, such as the discovery rule (the clock starts when you knew or should have known about the injury) or tolling for minors. Consult a ${specialtyName.toLowerCase()} attorney in ${cityName} promptly to protect your rights.`,
  })

  // FAQ 3: How to choose
  faqItems.push({
    question: `How do I choose the best ${specialtyName.toLowerCase()} attorney in ${cityName}?`,
    answer: `When selecting a ${specialtyName.toLowerCase()} attorney in ${cityName}, verify their ${stateName} Bar membership and check for disciplinary history. Look for experience specifically in ${specialtyName.toLowerCase()} cases, not just general practice. ${attorneyCount > 3 ? `With ${formatNumber(attorneyCount)} practitioners listed in ${cityName}, you have options to compare.` : `While options may be limited in ${cityName}, nearby areas may offer additional choices.`} Schedule consultations with 2-3 attorneys to evaluate their approach, communication style, and fee structure.${tradeData?.certifications && tradeData.certifications.length > 0 ? ` Board certifications like ${tradeData.certifications[0]} signal specialized expertise.` : ''}`,
  })

  // FAQ 4: Income-aware access (only if census data shows low/moderate income)
  if (census?.median_household_income && census.median_household_income < 50000) {
    faqItems.push({
      question: `Are there affordable ${specialtyName.toLowerCase()} attorneys in ${cityName}?`,
      answer: `With a median household income of ${formatUSD(census.median_household_income)} in ${cityName}, affordability is a key concern. Options include: legal aid organizations in ${stateName} that serve residents below 125-200% of the federal poverty level; attorneys who offer sliding-scale fees based on income; payment plan arrangements; and pro bono programs through the ${stateName} Bar Association.${tradeData?.contingencyAvailable ? ` Many ${specialtyName.toLowerCase()} attorneys work on contingency, requiring no upfront payment.` : ''}`,
    })
  }

  // FAQ 5: Spanish speakers context (if relevant)
  if (census?.spanish_speakers != null && census.spanish_speakers > 10) {
    faqItems.push({
      question: `Are there Spanish-speaking ${specialtyName.toLowerCase()} attorneys in ${cityName}?`,
      answer: `With approximately ${census.spanish_speakers.toFixed(0)}% of ${cityName} residents speaking Spanish at home, bilingual legal services are important. You can search our directory for Spanish-speaking ${specialtyName.toLowerCase()} attorneys in ${cityName}. Many firms also provide interpreters or bilingual paralegals to ensure clear communication throughout the legal process.`,
    })
  }

  // ------ DATA SOURCES ------
  if (census?.acs_year) {
    dataSources.push(`U.S. Census Bureau ACS ${census.acs_year} 5-Year Estimates`)
  } else if (census?.population) {
    dataSources.push('U.S. Census Bureau American Community Survey')
  }
  dataSources.push(`${stateName} Bar Association`)
  if (location.nb_transactions_annuelles) {
    dataSources.push('Local real estate transaction records')
  }
  if (location.nb_law_firms) {
    dataSources.push('Local business registry data')
  }
  dataSources.push('US-Attorneys.com directory data')

  return {
    intro,
    socioEconomic,
    realEstate,
    legalMarket,
    legalAid,
    climatData,
    localDemand,
    regulations,
    faqItems,
    dataSources,
  }
}
