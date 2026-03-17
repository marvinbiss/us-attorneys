/**
 * US Geography mappings
 * ZIP codes -> States -> Regions
 */
import { slugify } from '@/lib/utils'
export { slugify }

// Mapping of state abbreviations to full names
export const US_STATES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
  // US Territories
  'PR': 'Puerto Rico', 'GU': 'Guam', 'VI': 'U.S. Virgin Islands',
  'AS': 'American Samoa', 'MP': 'Northern Mariana Islands', 'UM': 'U.S. Minor Outlying Islands',
}
// Backward compatibility alias
export const DEPARTMENTS = US_STATES

// Mapping of state abbreviations to US Census regions
export const STATE_TO_REGION: Record<string, string> = {
  'CT': 'Northeast', 'ME': 'Northeast', 'MA': 'Northeast', 'NH': 'Northeast',
  'RI': 'Northeast', 'VT': 'Northeast', 'NJ': 'Northeast', 'NY': 'Northeast', 'PA': 'Northeast',
  'IL': 'Midwest', 'IN': 'Midwest', 'MI': 'Midwest', 'OH': 'Midwest', 'WI': 'Midwest',
  'IA': 'Midwest', 'KS': 'Midwest', 'MN': 'Midwest', 'MO': 'Midwest',
  'NE': 'Midwest', 'ND': 'Midwest', 'SD': 'Midwest',
  'DE': 'South', 'FL': 'South', 'GA': 'South', 'MD': 'South', 'NC': 'South',
  'SC': 'South', 'VA': 'South', 'DC': 'South', 'WV': 'South',
  'AL': 'South', 'KY': 'South', 'MS': 'South', 'TN': 'South',
  'AR': 'South', 'LA': 'South', 'OK': 'South', 'TX': 'South',
  'AZ': 'West', 'CO': 'West', 'ID': 'West', 'MT': 'West', 'NV': 'West',
  'NM': 'West', 'UT': 'West', 'WY': 'West',
  'AK': 'West', 'CA': 'West', 'HI': 'West', 'OR': 'West', 'WA': 'West',
  // US Territories
  'PR': 'Territory', 'GU': 'Territory', 'VI': 'Territory',
  'AS': 'Territory', 'MP': 'Territory', 'UM': 'Territory',
}
// Backward compatibility alias
export const DEPT_TO_REGION = STATE_TO_REGION

/**
 * Extracts state abbreviation from a US ZIP code (approximate ranges)
 */
export function getStateFromZip(zipCode: string): string | null {
  // US ZIP code ranges (approximate)
  const zip = parseInt(zipCode?.substring(0, 3) || '0', 10)
  if (zip >= 100 && zip <= 149) return 'NY'
  if (zip >= 150 && zip <= 196) return 'PA'
  if (zip >= 200 && zip <= 205) return 'DC'
  if (zip >= 206 && zip <= 219) return 'MD'
  if (zip >= 220 && zip <= 246) return 'VA'
  if (zip >= 247 && zip <= 268) return 'WV'
  if (zip >= 270 && zip <= 289) return 'NC'
  if (zip >= 290 && zip <= 299) return 'SC'
  if (zip >= 300 && zip <= 319) return 'GA'
  if (zip >= 320 && zip <= 349) return 'FL'
  if (zip >= 350 && zip <= 369) return 'AL'
  if (zip >= 370 && zip <= 385) return 'TN'
  if (zip >= 386 && zip <= 397) return 'MS'
  if (zip >= 400 && zip <= 427) return 'KY'
  if (zip >= 430 && zip <= 458) return 'OH'
  if (zip >= 460 && zip <= 479) return 'IN'
  if (zip >= 480 && zip <= 499) return 'MI'
  if (zip >= 500 && zip <= 528) return 'IA'
  if (zip >= 530 && zip <= 549) return 'WI'
  if (zip >= 550 && zip <= 567) return 'MN'
  if (zip >= 570 && zip <= 577) return 'SD'
  if (zip >= 580 && zip <= 588) return 'ND'
  if (zip >= 590 && zip <= 599) return 'MT'
  if (zip >= 600 && zip <= 629) return 'IL'
  if (zip >= 630 && zip <= 658) return 'MO'
  if (zip >= 660 && zip <= 679) return 'KS'
  if (zip >= 680 && zip <= 693) return 'NE'
  if (zip >= 700 && zip <= 714) return 'LA'
  if (zip >= 716 && zip <= 729) return 'AR'
  if (zip >= 730 && zip <= 749) return 'OK'
  if (zip >= 750 && zip <= 799) return 'TX'
  if (zip >= 800 && zip <= 816) return 'CO'
  if (zip >= 820 && zip <= 831) return 'WY'
  if (zip >= 832 && zip <= 838) return 'ID'
  if (zip >= 840 && zip <= 847) return 'UT'
  if (zip >= 850 && zip <= 865) return 'AZ'
  if (zip >= 870 && zip <= 884) return 'NM'
  if (zip >= 889 && zip <= 898) return 'NV'
  if (zip >= 900 && zip <= 966) return 'CA'
  if (zip >= 967 && zip <= 968) return 'HI'
  if (zip >= 970 && zip <= 979) return 'OR'
  if (zip >= 980 && zip <= 994) return 'WA'
  if (zip >= 995 && zip <= 999) return 'AK'
  return null
}
/** @deprecated Use getStateFromZip() instead */
export function getDeptCodeFromPostal(postalCode: string | null | undefined): string | null {
  if (!postalCode) return null
  return getStateFromZip(postalCode)
}

/**
 * Gets the full state name from a state abbreviation or ZIP code
 */
export function getStateName(codeOrPostal: string | null | undefined): string | null {
  if (!codeOrPostal) return null

  // If it's already a state name, return it
  if (codeOrPostal.length > 3 && !codeOrPostal.match(/^\d+$/)) {
    return codeOrPostal
  }

  // If it's a ZIP code, extract the state abbreviation
  const stateCode = codeOrPostal.length >= 5
    ? getStateFromZip(codeOrPostal)
    : codeOrPostal

  return stateCode ? (US_STATES[stateCode] || null) : null
}

/**
 * Gets the region name from a state abbreviation or ZIP code
 */
export function getRegionName(codeOrPostal: string | null | undefined): string | null {
  if (!codeOrPostal) return null

  // If it's already a region name, return it
  if (codeOrPostal.length > 3 && !codeOrPostal.match(/^\d+$/)) {
    return codeOrPostal
  }

  // If it's a ZIP code, extract the state abbreviation
  const stateCode = codeOrPostal.length >= 5
    ? getStateFromZip(codeOrPostal)
    : codeOrPostal

  return stateCode ? (STATE_TO_REGION[stateCode] || null) : null
}

/**
 * Gets all geographic info from a ZIP code
 */
export function getGeographyFromPostal(postalCode: string | null | undefined): {
  stateCode: string | null
  stateName: string | null
  regionName: string | null
  /** @deprecated Use stateCode instead */
  departmentCode: string | null
  /** @deprecated Use stateName instead */
  departmentName: string | null
} {
  const stateCode = postalCode ? getStateFromZip(postalCode) : null
  const stateName = stateCode ? US_STATES[stateCode] || null : null
  return {
    stateCode,
    stateName,
    regionName: stateCode ? STATE_TO_REGION[stateCode] || null : null,
    // Backward compat aliases
    departmentCode: stateCode,
    departmentName: stateName,
  }
}

/** @deprecated Use getStateName() instead */
export const getDepartmentName = getStateName

// slugify imported from '@/lib/utils' (canonical implementation)

/**
 * List of regions with their slugs
 */
export const REGIONS = Object.values(STATE_TO_REGION)
  .filter((v, i, a) => a.indexOf(v) === i)
  .map(name => ({
    name,
    slug: slugify(name),
  }))
