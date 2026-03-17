/**
 * Shared state-level legal data — single source of truth.
 *
 * Used by:
 *  - src/lib/seo/location-content-us.ts
 *  - src/lib/data/attorney-content.ts
 *
 * Contains: statute-of-limitations tables, PA→SOL mapping,
 * state names, attorney counts, and average hourly rates.
 */

// ---------------------------------------------------------------------------
// SOL category type (13 categories)
// ---------------------------------------------------------------------------

export type SOLCategory =
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

// ---------------------------------------------------------------------------
// Statute of limitations by SOL category × state (years)
// ---------------------------------------------------------------------------

export const STATE_SOL: Record<SOLCategory, Record<string, number>> = {
  // FL personal-injury/property-damage/product-liability updated to 2 per HB 837 (eff. 2023-03-24)
  'personal-injury': {
    AL: 2, AK: 2, AZ: 2, AR: 3, CA: 2, CO: 2, CT: 2, DE: 2, DC: 3, FL: 2,
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
    AL: 6, AK: 6, AZ: 2, AR: 3, CA: 3, CO: 2, CT: 2, DE: 2, DC: 3, FL: 2,
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
    AL: 2, AK: 2, AZ: 2, AR: 3, CA: 2, CO: 2, CT: 3, DE: 2, DC: 3, FL: 2,
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

export const PA_TO_SOL_CATEGORY: Record<string, SOLCategory> = {
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

  // --- 91 missing slugs from attorneyContent (added for full coverage) ---

  // Personal injury related
  'dog-bite': 'personal-injury',
  'hit-and-run': 'personal-injury',
  'swimming-pool-accidents': 'personal-injury',
  'railroad-injury': 'personal-injury',
  'uninsured-motorist': 'personal-injury',
  'rideshare-law': 'personal-injury',
  'workplace-injury': 'personal-injury',

  // Medical malpractice
  'nursing-malpractice': 'medical-malpractice',
  'medical-device-injury': 'medical-malpractice',
  'medical-license-defense': 'professional-malpractice',
  'nursing-license-defense': 'professional-malpractice',

  // Product liability / toxic
  'mesothelioma': 'product-liability',
  'toxic-exposure': 'product-liability',

  // Employment
  'fmla-violations': 'employment',
  'retaliation': 'employment',
  'non-compete-employment': 'employment',
  'executive-compensation': 'employment',
  'unemployment-claims': 'employment',

  // Business / contracts / IP / corporate
  'small-business-law': 'written-contract',
  'startup-law': 'written-contract',
  'venture-capital': 'written-contract',
  'securities-law': 'written-contract',
  'shareholder-disputes': 'written-contract',
  'licensing-agreements': 'written-contract',
  'licensing-permits': 'written-contract',
  'regulatory-compliance': 'written-contract',
  'insurance-law': 'written-contract',
  'ip-litigation': 'written-contract',
  'patent': 'written-contract',
  'trademark': 'written-contract',
  'trade-dress': 'written-contract',
  'copyright': 'written-contract',
  'software-ip': 'written-contract',
  'e-commerce-law': 'written-contract',
  'cryptocurrency-law': 'written-contract',
  'cyber-law': 'written-contract',
  'data-privacy': 'written-contract',
  'internet-law': 'written-contract',
  'social-media-law': 'written-contract',
  'energy-law': 'written-contract',
  'municipal-law': 'written-contract',
  'government-ethics': 'written-contract',

  // Real estate / property / estate / elder / trusts
  'real-estate-law': 'real-estate',
  'foreclosure': 'real-estate',
  'estate-litigation': 'real-estate',
  'estate-tax': 'real-estate',
  'living-trusts': 'real-estate',
  'trust-administration': 'real-estate',
  'wills-trusts': 'real-estate',
  'power-of-attorney': 'real-estate',
  'medicaid-planning': 'real-estate',

  // Bankruptcy / debt
  'debt-relief': 'debt-collection',
  'debt-collection-defense': 'debt-collection',
  'student-loan-debt': 'debt-collection',

  // Tax / fraud / consumer
  'fraud': 'fraud',
  'tax-planning': 'fraud',
  'international-tax': 'fraud',
  'irs-disputes': 'fraud',
  'embezzlement': 'fraud',
  'white-collar-crime': 'fraud',

  // Defamation (none missing)

  // Criminal defense
  'domestic-assault': 'personal-injury',
  'gun-charges': 'personal-injury',
  'manslaughter': 'personal-injury',
  'violent-crimes': 'personal-injury',
  'theft-robbery': 'personal-injury',
  'traffic-violations': 'personal-injury',
  'juvenile-crimes': 'personal-injury',
  'military-defense': 'personal-injury',

  // Family law
  'father-rights': 'personal-injury',
  'mother-rights': 'personal-injury',
  'grandparents-rights': 'personal-injury',
  'same-sex-divorce': 'personal-injury',
  'military-divorce': 'personal-injury',
  'modification-orders': 'personal-injury',
  'relocation-custody': 'personal-injury',
  'restraining-orders': 'personal-injury',
  'surrogacy-law': 'personal-injury',
  'egg-donor-law': 'personal-injury',
  'gender-marker-change': 'personal-injury',
  'name-change': 'personal-injury',

  // Immigration
  'immigration-law': 'personal-injury',
  'immigration-appeals': 'personal-injury',
  'immigration-detention': 'personal-injury',
  'family-immigration': 'personal-injury',
  'investor-visas': 'personal-injury',
  'green-cards': 'personal-injury',
  'work-permits': 'personal-injury',

  // Other / miscellaneous
  'mediation-arbitration': 'personal-injury',
  'native-american-law': 'personal-injury',
  'public-records': 'personal-injury',
  'foia-requests': 'personal-injury',
}

// ---------------------------------------------------------------------------
// State names lookup — 50 states + DC
// ---------------------------------------------------------------------------

export const STATE_NAMES: Record<string, string> = {
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

// ---------------------------------------------------------------------------
// Estimated active attorneys per state (approximate, for content generation)
// ---------------------------------------------------------------------------

export const STATE_ATTORNEY_COUNTS: Record<string, number> = {
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

// ---------------------------------------------------------------------------
// Average attorney cost per state (hourly rate in USD)
// ---------------------------------------------------------------------------

export const STATE_AVG_HOURLY_RATE: Record<string, number> = {
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

// ---------------------------------------------------------------------------
// Getter functions
// ---------------------------------------------------------------------------

/**
 * Get the statute of limitations (in years) for a practice area in a given state.
 * Returns 2 if not applicable or unknown.
 */
export function getStatuteOfLimitations(paSlug: string, stateAbbr: string): number {
  const category = PA_TO_SOL_CATEGORY[paSlug] ?? 'personal-injury'
  return STATE_SOL[category]?.[stateAbbr.toUpperCase()] ?? 2
}

export function getStateName(stateAbbr: string): string {
  return STATE_NAMES[stateAbbr.toUpperCase()] ?? stateAbbr
}

export function getStateAttorneyCount(stateAbbr: string): number {
  return STATE_ATTORNEY_COUNTS[stateAbbr.toUpperCase()] ?? 5000
}

export function getStateAvgHourlyRate(stateAbbr: string): number {
  return STATE_AVG_HOURLY_RATE[stateAbbr.toUpperCase()] ?? 275
}
