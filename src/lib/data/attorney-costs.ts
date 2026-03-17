/**
 * Attorney cost data helper.
 *
 * Fee ranges by practice area category, fee structure types,
 * and regional cost adjustments. Used by cost pages to generate
 * accurate, location-aware pricing information.
 *
 * Data sourced from public legal industry surveys (Clio Legal Trends,
 * Martindale-Hubbell, state bar fee schedules). Ranges represent
 * typical 2025-2026 market rates.
 */

// ── Fee structure types ─────────────────────────────────────────────

export type FeeStructure = 'hourly' | 'flat_fee' | 'contingency' | 'retainer'

export interface FeeStructureInfo {
  type: FeeStructure
  label: string
  description: string
  /** When this fee structure is typically used */
  commonUses: string[]
  /** Typical percentage or range descriptor */
  typicalRange: string
}

export const FEE_STRUCTURES: Record<FeeStructure, FeeStructureInfo> = {
  hourly: {
    type: 'hourly',
    label: 'Hourly Rate',
    description:
      'You pay for each hour (or fraction) the attorney works on your case. Most common fee structure. You may also be billed for paralegal time at a lower rate.',
    commonUses: [
      'Criminal defense',
      'Family law (divorce, custody)',
      'Business litigation',
      'Estate planning',
      'Real estate transactions',
    ],
    typicalRange: '$150–$700/hr',
  },
  flat_fee: {
    type: 'flat_fee',
    label: 'Flat Fee',
    description:
      'A fixed price for the entire matter, agreed upon upfront. Gives cost certainty. Common for routine legal work with predictable scope.',
    commonUses: [
      'Simple divorce (uncontested)',
      'Bankruptcy filing',
      'Will drafting',
      'Business formation (LLC/Corp)',
      'Traffic ticket defense',
      'Real estate closing',
    ],
    typicalRange: '$500–$10,000',
  },
  contingency: {
    type: 'contingency',
    label: 'Contingency Fee',
    description:
      'The attorney only gets paid if you win or settle your case. The fee is a percentage of the recovery. You pay nothing upfront, but may still owe court costs.',
    commonUses: [
      'Personal injury',
      'Car/truck accidents',
      'Medical malpractice',
      'Wrongful death',
      'Workers compensation',
      'Employment discrimination',
    ],
    typicalRange: '25%–40% of settlement',
  },
  retainer: {
    type: 'retainer',
    label: 'Retainer',
    description:
      'An upfront deposit placed in a trust account. The attorney bills against this retainer as work is performed. You may need to replenish the retainer if depleted.',
    commonUses: [
      'Ongoing business counsel',
      'Complex litigation',
      'Criminal defense (serious charges)',
      'Custody battles',
      'Corporate compliance',
    ],
    typicalRange: '$2,000–$25,000 initial deposit',
  },
}

// ── Practice area category fee ranges ───────────────────────────────

export interface CategoryFeeRange {
  category: string
  label: string
  hourlyLow: number
  hourlyMid: number
  hourlyHigh: number
  /** Primary fee structure for this category */
  primaryFeeType: FeeStructure
  /** Typical flat fee range (if applicable) */
  flatFeeLow?: number
  flatFeeHigh?: number
  /** Typical contingency percentage (if applicable) */
  contingencyLow?: number
  contingencyHigh?: number
  /** Typical retainer range (if applicable) */
  retainerLow?: number
  retainerHigh?: number
  /** Cost factors specific to this category */
  costFactors: string[]
}

export const CATEGORY_FEE_RANGES: Record<string, CategoryFeeRange> = {
  criminal: {
    category: 'criminal',
    label: 'Criminal Law',
    hourlyLow: 150,
    hourlyMid: 300,
    hourlyHigh: 700,
    primaryFeeType: 'hourly',
    flatFeeLow: 1500,
    flatFeeHigh: 15000,
    retainerLow: 2500,
    retainerHigh: 25000,
    costFactors: [
      'Severity of charges (misdemeanor vs. felony)',
      'Whether the case goes to trial',
      'Number of charges',
      'Need for expert witnesses',
      'Complexity of evidence (forensics, digital evidence)',
    ],
  },
  injury: {
    category: 'injury',
    label: 'Personal Injury',
    hourlyLow: 200,
    hourlyMid: 350,
    hourlyHigh: 600,
    primaryFeeType: 'contingency',
    contingencyLow: 25,
    contingencyHigh: 40,
    costFactors: [
      'Severity of injuries and medical costs',
      'Whether liability is disputed',
      'Number of defendants',
      'Need for medical expert testimony',
      'Whether case settles or goes to trial',
    ],
  },
  family: {
    category: 'family',
    label: 'Family Law',
    hourlyLow: 150,
    hourlyMid: 300,
    hourlyHigh: 550,
    primaryFeeType: 'hourly',
    flatFeeLow: 1000,
    flatFeeHigh: 7500,
    retainerLow: 2000,
    retainerHigh: 15000,
    costFactors: [
      'Whether the matter is contested or uncontested',
      'Complexity of asset division',
      'Custody disputes and evaluations',
      'Need for forensic accountants',
      'Number of court appearances',
    ],
  },
  business: {
    category: 'business',
    label: 'Business & Corporate',
    hourlyLow: 200,
    hourlyMid: 400,
    hourlyHigh: 800,
    primaryFeeType: 'hourly',
    flatFeeLow: 500,
    flatFeeHigh: 15000,
    retainerLow: 3000,
    retainerHigh: 25000,
    costFactors: [
      'Type of business entity and complexity',
      'Regulatory requirements',
      'Number of contracts to review',
      'Industry-specific compliance needs',
      'Cross-border or multi-state operations',
    ],
  },
  immigration: {
    category: 'immigration',
    label: 'Immigration',
    hourlyLow: 150,
    hourlyMid: 300,
    hourlyHigh: 500,
    primaryFeeType: 'flat_fee',
    flatFeeLow: 1500,
    flatFeeHigh: 12000,
    costFactors: [
      'Type of visa or petition',
      'Deportation defense complexity',
      'USCIS filing fees (government fees in addition)',
      'Need for appeals or waivers',
      'Asylum complexity and documentation',
    ],
  },
  estate: {
    category: 'estate',
    label: 'Estate Planning & Probate',
    hourlyLow: 150,
    hourlyMid: 300,
    hourlyHigh: 500,
    primaryFeeType: 'flat_fee',
    flatFeeLow: 300,
    flatFeeHigh: 5000,
    costFactors: [
      'Size and complexity of the estate',
      'Number of beneficiaries',
      'Whether a trust is needed',
      'Tax planning requirements',
      'Contested probate issues',
    ],
  },
  employment: {
    category: 'employment',
    label: 'Employment & Labor',
    hourlyLow: 200,
    hourlyMid: 350,
    hourlyHigh: 600,
    primaryFeeType: 'contingency',
    contingencyLow: 25,
    contingencyHigh: 40,
    costFactors: [
      'Type of claim (discrimination, wrongful termination, wage theft)',
      'Number of claimants (class action potential)',
      'EEOC filing and investigation',
      'Need for forensic evidence',
      'Employer size and resources',
    ],
  },
  ip: {
    category: 'ip',
    label: 'Intellectual Property',
    hourlyLow: 250,
    hourlyMid: 450,
    hourlyHigh: 900,
    primaryFeeType: 'hourly',
    flatFeeLow: 1500,
    flatFeeHigh: 20000,
    costFactors: [
      'Type of IP (patent, trademark, copyright)',
      'Patent prosecution complexity',
      'Infringement litigation scope',
      'Number of claims or marks',
      'International filings',
    ],
  },
  realestate: {
    category: 'realestate',
    label: 'Real Estate',
    hourlyLow: 150,
    hourlyMid: 300,
    hourlyHigh: 500,
    primaryFeeType: 'flat_fee',
    flatFeeLow: 500,
    flatFeeHigh: 5000,
    costFactors: [
      'Transaction type (residential vs. commercial)',
      'Title issues or disputes',
      'Zoning and land use complexity',
      'Environmental concerns',
      'Foreclosure defense needs',
    ],
  },
  bankruptcy: {
    category: 'bankruptcy',
    label: 'Bankruptcy',
    hourlyLow: 150,
    hourlyMid: 300,
    hourlyHigh: 500,
    primaryFeeType: 'flat_fee',
    flatFeeLow: 1000,
    flatFeeHigh: 8000,
    costFactors: [
      'Chapter 7 vs. Chapter 13 vs. Chapter 11',
      'Complexity of debts and assets',
      'Number of creditors',
      'Business vs. personal bankruptcy',
      'Need for adversary proceedings',
    ],
  },
  general: {
    category: 'general',
    label: 'General Practice',
    hourlyLow: 150,
    hourlyMid: 300,
    hourlyHigh: 500,
    primaryFeeType: 'hourly',
    flatFeeLow: 500,
    flatFeeHigh: 5000,
    retainerLow: 1500,
    retainerHigh: 10000,
    costFactors: [
      'Complexity of the legal matter',
      'Attorney experience and reputation',
      'Geographic location',
      'Whether litigation is involved',
      'Amount of research and document preparation',
    ],
  },
}

// ── Specialty to category mapping ───────────────────────────────────

const SPECIALTY_CATEGORY_MAP: Record<string, string> = {
  'criminal-defense': 'criminal',
  'dui-dwi': 'criminal',
  'drug-crimes': 'criminal',
  'white-collar-crime': 'criminal',
  'federal-crimes': 'criminal',
  'juvenile-crimes': 'criminal',
  'sex-crimes': 'criminal',
  'theft-robbery': 'criminal',
  'violent-crimes': 'criminal',
  'traffic-violations': 'criminal',
  'personal-injury': 'injury',
  'car-accidents': 'injury',
  'truck-accidents': 'injury',
  'motorcycle-accidents': 'injury',
  'slip-and-fall': 'injury',
  'medical-malpractice': 'injury',
  'wrongful-death': 'injury',
  'product-liability': 'injury',
  'workers-compensation': 'injury',
  'nursing-home-abuse': 'injury',
  'divorce': 'family',
  'child-custody': 'family',
  'child-support': 'family',
  'adoption': 'family',
  'alimony-spousal-support': 'family',
  'domestic-violence': 'family',
  'prenuptial-agreements': 'family',
  'paternity': 'family',
  'immigration': 'immigration',
  'green-card': 'immigration',
  'deportation-defense': 'immigration',
  'employment-visa': 'immigration',
  'asylum': 'immigration',
  'naturalization': 'immigration',
  'estate-planning': 'estate',
  'probate': 'estate',
  'wills-trusts': 'estate',
  'elder-law': 'estate',
  'guardianship': 'estate',
  'employment-law': 'employment',
  'wrongful-termination': 'employment',
  'workplace-discrimination': 'employment',
  'sexual-harassment': 'employment',
  'wage-disputes': 'employment',
  'business-law': 'business',
  'contract-law': 'business',
  'corporate-law': 'business',
  'mergers-acquisitions': 'business',
  'business-formation': 'business',
  'partnership-disputes': 'business',
  'intellectual-property': 'ip',
  'patent-law': 'ip',
  'trademark-law': 'ip',
  'copyright-law': 'ip',
  'real-estate': 'realestate',
  'real-estate-law': 'realestate',
  'landlord-tenant': 'realestate',
  'foreclosure': 'realestate',
  'zoning-land-use': 'realestate',
  'bankruptcy': 'bankruptcy',
  'chapter-7-bankruptcy': 'bankruptcy',
  'chapter-13-bankruptcy': 'bankruptcy',
  'debt-collection': 'bankruptcy',
  'tax-law': 'business',
  'civil-rights': 'employment',
  'consumer-protection': 'general',
  'government-law': 'general',
  'environmental-law': 'general',
  'entertainment-law': 'ip',
  'health-care-law': 'business',
  'military-law': 'general',
  'social-security-disability': 'general',
  'animal-law': 'general',
  'education-law': 'general',
  'maritime-law': 'general',
  'appellate': 'general',
}

/**
 * Get the fee category for a given specialty slug.
 * Returns 'general' if the specialty is not mapped.
 */
export function getCategoryForSpecialty(specialtySlug: string): string {
  return SPECIALTY_CATEGORY_MAP[specialtySlug] || 'general'
}

/**
 * Get the fee range data for a specialty slug.
 */
export function getFeeRangeForSpecialty(specialtySlug: string): CategoryFeeRange {
  const category = getCategoryForSpecialty(specialtySlug)
  return CATEGORY_FEE_RANGES[category] || CATEGORY_FEE_RANGES.general
}

// ── Regional cost adjustments ───────────────────────────────────────

export type CostTier = 'high' | 'medium' | 'low'

export interface RegionalAdjustment {
  tier: CostTier
  multiplier: number
  label: string
  description: string
}

const REGIONAL_ADJUSTMENTS: Record<CostTier, RegionalAdjustment> = {
  high: {
    tier: 'high',
    multiplier: 1.4,
    label: 'High Cost Market',
    description: 'Major metropolitan areas with higher cost of living and more competitive legal markets.',
  },
  medium: {
    tier: 'medium',
    multiplier: 1.0,
    label: 'Average Cost Market',
    description: 'Mid-size cities and suburban areas with average legal market pricing.',
  },
  low: {
    tier: 'low',
    multiplier: 0.75,
    label: 'Lower Cost Market',
    description: 'Rural areas and smaller cities with lower cost of living and legal fees.',
  },
}

/** Maps US state codes to cost tiers */
const STATE_COST_TIERS: Record<string, CostTier> = {
  // High cost states
  NY: 'high', CA: 'high', DC: 'high', CT: 'high', MA: 'high',
  NJ: 'high', IL: 'high', WA: 'high', CO: 'high', HI: 'high',
  // Medium cost states
  TX: 'medium', FL: 'medium', PA: 'medium', OH: 'medium', GA: 'medium',
  NC: 'medium', MI: 'medium', VA: 'medium', AZ: 'medium', MN: 'medium',
  MD: 'medium', OR: 'medium', WI: 'medium', MO: 'medium', TN: 'medium',
  IN: 'medium', NV: 'medium', SC: 'medium', UT: 'medium', NH: 'medium',
  RI: 'medium', DE: 'medium', VT: 'medium', ME: 'medium',
  // Low cost states
  AL: 'low', AK: 'low', AR: 'low', IA: 'low', ID: 'low',
  KS: 'low', KY: 'low', LA: 'low', MS: 'low', MT: 'low',
  NE: 'low', NM: 'low', ND: 'low', OK: 'low', SD: 'low',
  WV: 'low', WY: 'low',
}

/**
 * Get the cost tier for a state code.
 */
export function getStateCostTier(stateCode: string): CostTier {
  return STATE_COST_TIERS[stateCode.toUpperCase()] || 'medium'
}

/**
 * Get the regional cost adjustment for a state code.
 */
export function getRegionalAdjustment(stateCode: string): RegionalAdjustment {
  const tier = getStateCostTier(stateCode)
  return REGIONAL_ADJUSTMENTS[tier]
}

/**
 * Calculate adjusted fee range for a specialty in a specific state.
 */
export function getAdjustedFees(specialtySlug: string, stateCode: string) {
  const feeRange = getFeeRangeForSpecialty(specialtySlug)
  const adjustment = getRegionalAdjustment(stateCode)
  const m = adjustment.multiplier

  return {
    category: feeRange,
    adjustment,
    hourly: {
      low: Math.round(feeRange.hourlyLow * m),
      mid: Math.round(feeRange.hourlyMid * m),
      high: Math.round(feeRange.hourlyHigh * m),
    },
    flatFee: feeRange.flatFeeLow != null
      ? {
          low: Math.round(feeRange.flatFeeLow * m),
          high: Math.round(feeRange.flatFeeHigh! * m),
        }
      : null,
    contingency: feeRange.contingencyLow != null
      ? {
          low: feeRange.contingencyLow,
          high: feeRange.contingencyHigh!,
        }
      : null,
    retainer: feeRange.retainerLow != null
      ? {
          low: Math.round(feeRange.retainerLow * m),
          high: Math.round(feeRange.retainerHigh! * m),
        }
      : null,
  }
}

// ── General cost factors ────────────────────────────────────────────

export const GENERAL_COST_FACTORS = [
  {
    factor: 'Attorney Experience',
    description: 'Attorneys with 20+ years of experience or partner-level positions typically charge 50-100% more than junior associates.',
    impact: 'high' as const,
  },
  {
    factor: 'Case Complexity',
    description: 'Simple matters like traffic tickets cost far less than complex multi-party litigation or federal cases.',
    impact: 'high' as const,
  },
  {
    factor: 'Geographic Location',
    description: 'Attorneys in major metros (NYC, LA, SF, DC) charge significantly more than those in smaller cities or rural areas.',
    impact: 'high' as const,
  },
  {
    factor: 'Law Firm Size',
    description: 'Large firms (BigLaw) bill $400-$1,500+/hr. Mid-size firms $250-$500/hr. Solo practitioners $150-$350/hr.',
    impact: 'medium' as const,
  },
  {
    factor: 'Urgency',
    description: 'Rush filings, emergency motions, and time-sensitive matters may incur premium rates or additional fees.',
    impact: 'medium' as const,
  },
  {
    factor: 'Trial vs. Settlement',
    description: 'Cases that go to trial cost significantly more (2-5x) than those resolved through negotiation or mediation.',
    impact: 'high' as const,
  },
]
