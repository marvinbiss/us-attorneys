export interface FormData {
  service: string
  city: string
  description: string
  urgency: string
  budget: string
  name: string
  phone: string
  email: string
  consent: boolean
}

export const initialFormData: FormData = {
  service: '',
  city: '',
  description: '',
  urgency: '',
  budget: '',
  name: '',
  phone: '',
  email: '',
  consent: false,
}

export const urgencyOptions = [
  { value: 'flexible', label: 'Not urgent' },
  { value: 'month', label: 'This month' },
  { value: 'week', label: 'This week' },
  { value: 'urgent', label: 'Urgent (within 24h)' },
]

export const budgetOptions = [
  { value: 'under-500', label: 'Under $500' },
  { value: '500-2000', label: '$500\u2013$2,000' },
  { value: '2000-5000', label: '$2,000\u2013$5,000' },
  { value: 'over-5000', label: 'Over $5,000' },
  { value: 'unknown', label: "I don't know" },
]

/** Common case types per practice area for quick selection */
export const serviceSubcategories: Record<string, string[]> = {
  'personal-injury': ['Car accident', 'Slip and fall', 'Medical malpractice', 'Wrongful death', 'Workers compensation', 'Product liability'],
  'criminal-defense': ['DUI/DWI', 'Drug charges', 'Assault', 'Theft/Fraud', 'White collar crime', 'Federal charges'],
  'family-law': ['Divorce', 'Child custody', 'Child support', 'Prenuptial agreement', 'Adoption'],
  'estate-planning': ['Will drafting', 'Trust creation', 'Probate', 'Power of attorney', 'Estate administration'],
  'business-law': ['Business formation', 'Contract disputes', 'Partnership issues', 'Mergers & acquisitions', 'Compliance'],
  'immigration': ['Green card', 'Work visa', 'Citizenship', 'Deportation defense', 'Family sponsorship'],
  'real-estate': ['Home purchase', 'Commercial lease', 'Zoning issues', 'Title disputes', 'Foreclosure'],
  'employment-law': ['Wrongful termination', 'Discrimination', 'Harassment', 'Wage disputes', 'Non-compete'],
  'bankruptcy': ['Chapter 7', 'Chapter 13', 'Debt negotiation', 'Creditor harassment', 'Asset protection'],
  'tax-law': ['Tax audit', 'IRS disputes', 'Tax planning', 'Back taxes', 'Tax liens'],
}

export function isValidUSPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, '')
  if (/^\d{10}$/.test(cleaned)) return true
  if (/^\+1\d{10}$/.test(cleaned)) return true
  if (/^1\d{10}$/.test(cleaned)) return true
  return false
}

export const STORAGE_KEY = 'sa:quote-draft'
