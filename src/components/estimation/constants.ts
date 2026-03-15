// ---------------------------------------------------------------------------
// Quick prompts per practice area
// ---------------------------------------------------------------------------

export const quickPrompts: Record<string, string[]> = {
  'personal-injury': [
    'I was in a car accident',
    'Slip and fall injury',
    'Medical malpractice',
    'Workers compensation claim',
  ],
  'criminal-defense': [
    'I need a criminal defense attorney',
    'DUI/DWI charge',
    'Drug possession charges',
    'Assault charges',
  ],
  'family-law': [
    'Filing for divorce',
    'Child custody dispute',
    'Child support modification',
    'Prenuptial agreement',
  ],
  immigration: [
    'Green card application',
    'Visa issues',
    'Deportation defense',
    'Citizenship application',
  ],
  'real-estate': [
    'Home purchase closing',
    'Property dispute',
    'Landlord-tenant issue',
    'Zoning problems',
  ],
  'employment-law': [
    'Wrongful termination',
    'Workplace discrimination',
    'Wage dispute',
    'Non-compete agreement',
  ],
  'estate-planning': [
    'Create a will',
    'Set up a trust',
    'Probate issues',
    'Power of attorney',
  ],
  bankruptcy: [
    'Chapter 7 bankruptcy',
    'Chapter 13 bankruptcy',
    'Debt relief options',
    'Creditor harassment',
  ],
  'business-law': [
    'LLC formation',
    'Partnership agreement',
    'Contract dispute',
    'Business litigation',
  ],
  'tax-law': [
    'IRS audit defense',
    'Tax debt resolution',
    'Back taxes owed',
    'Tax fraud charges',
  ],
}

export const defaultPrompts = [
  'Estimate my case',
  'Request a consultation',
  'Urgent matter',
  'Question about fees',
]

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

export const GREETING_STORAGE_KEY = 'sa_estimation_greeting_dismissed'
export const RETURN_VISITOR_KEY = 'sa_estimation_visited'
export const CONVERSATION_STORAGE_KEY = 'sa_estimation_conversation'

// ---------------------------------------------------------------------------
// Realistic starting fees per practice area for teaser
// ---------------------------------------------------------------------------

export const priceTeasers: Record<string, string> = {
  'personal-injury': 'Car accident case: Free consultation',
  'criminal-defense': 'DUI defense: Starting at $2,500',
  'family-law': 'Divorce filing: Starting at $1,500',
  immigration: 'Green card: Starting at $3,000',
  'real-estate': 'Home closing: Starting at $1,000',
  'employment-law': 'Wrongful termination: Free consultation',
  'estate-planning': 'Will preparation: Starting at $500',
  bankruptcy: 'Chapter 7: Starting at $1,200',
  'business-law': 'LLC formation: Starting at $800',
  'tax-law': 'IRS audit defense: Starting at $3,000',
}

// ---------------------------------------------------------------------------
// Lead form trigger keywords
// ---------------------------------------------------------------------------

export const LEAD_TRIGGER_KEYWORDS = [
  'connect me',
  'callback',
  'put me in touch',
  'contact an',
  'would you like',
]
