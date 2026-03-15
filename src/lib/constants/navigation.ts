// Navigation data - shared between server and client components

export const popularServices = [
  { name: 'Personal Injury', slug: 'personal-injury', icon: 'Wrench' },
  { name: 'Criminal Defense', slug: 'criminal-defense', icon: 'Zap' },
  { name: 'Family Law', slug: 'family-law', icon: 'Key' },
  { name: 'Estate Planning', slug: 'estate-planning', icon: 'Flame' },
  { name: 'Immigration', slug: 'immigration', icon: 'PaintBucket' },
  { name: 'Bankruptcy', slug: 'bankruptcy', icon: 'Hammer' },
  { name: 'Real Estate', slug: 'real-estate', icon: 'HardHat' },
  { name: 'Employment Law', slug: 'employment-law', icon: 'TreeDeciduous' },
]

export const popularCities = [
  { name: 'New York', slug: 'new-york', state: 'NY' },
  { name: 'Los Angeles', slug: 'los-angeles', state: 'CA' },
  { name: 'Chicago', slug: 'chicago', state: 'IL' },
  { name: 'Houston', slug: 'houston', state: 'TX' },
  { name: 'Phoenix', slug: 'phoenix', state: 'AZ' },
  { name: 'Philadelphia', slug: 'philadelphia', state: 'PA' },
  { name: 'San Antonio', slug: 'san-antonio', state: 'TX' },
  { name: 'San Diego', slug: 'san-diego', state: 'CA' },
  { name: 'Dallas', slug: 'dallas', state: 'TX' },
  { name: 'Miami', slug: 'miami', state: 'FL' },
]

export const relatedServices: Record<string, string[]> = {
  'personal-injury': ['medical-malpractice', 'workers-compensation', 'wrongful-death', 'product-liability', 'car-accident'],
  'criminal-defense': ['dui-dwi', 'drug-crimes', 'white-collar-crime', 'juvenile-law', 'domestic-violence'],
  'family-law': ['divorce', 'child-custody', 'adoption', 'child-support', 'domestic-violence'],
  'estate-planning': ['probate', 'trust-law', 'elder-law', 'wills', 'tax-law'],
  'immigration': ['visa', 'deportation-defense', 'asylum', 'naturalization', 'employment-immigration'],
  'bankruptcy': ['debt-relief', 'foreclosure-defense', 'creditor-rights', 'business-law', 'tax-law'],
  'real-estate': ['landlord-tenant', 'construction-law', 'zoning', 'property-disputes', 'foreclosure-defense'],
  'employment-law': ['workers-compensation', 'discrimination', 'wrongful-termination', 'wage-disputes', 'harassment'],
  'business-law': ['contracts', 'intellectual-property', 'mergers-acquisitions', 'corporate-law', 'tax-law'],
  'tax-law': ['estate-planning', 'business-law', 'irs-disputes', 'bankruptcy', 'corporate-law'],
  'divorce': ['family-law', 'child-custody', 'child-support', 'mediation', 'domestic-violence'],
  'medical-malpractice': ['personal-injury', 'wrongful-death', 'product-liability', 'nursing-home-abuse', 'insurance-claims'],
  'intellectual-property': ['trademark', 'patent', 'copyright', 'business-law', 'technology-law'],
  'environmental-law': ['land-use', 'regulatory-compliance', 'toxic-torts', 'construction-law', 'government-law'],
}

export const popularRegions = [
  { name: 'California', slug: 'california' },
  { name: 'Texas', slug: 'texas' },
  { name: 'Florida', slug: 'florida' },
  { name: 'New York', slug: 'new-york' },
  { name: 'Illinois', slug: 'illinois' },
  { name: 'Pennsylvania', slug: 'pennsylvania' },
]
