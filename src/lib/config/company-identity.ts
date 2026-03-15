/**
 * Company Identity — Single Source of Truth
 *
 * CHARTER.md Source Hierarchy:
 *   Level 1 (Legal docs): ein, legalName, address, phone, stateRegistration, taxId
 *   Level 5 (UI copy): description, tagline
 *
 * RULE: Any field that is `null` MUST NOT appear in:
 *   - Structured data (JSON-LD)
 *   - Legal notices
 *   - Footer contact section
 *
 * When the company is registered, update the null fields here.
 * Every page that imports this file will automatically reflect the change.
 */

export const companyIdentity = {
  // Brand (Level 5 — UI copy only)
  name: 'US Attorneys' as const,
  tagline: 'Find Top-Rated Attorneys Near You',
  description:
    'US Attorneys is the leading attorney directory covering all 50 states. Find experienced lawyers by practice area, read verified reviews, and get free consultations.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com',

  // Legal identity (Level 1 — from env vars, null until company registration)
  legalName: process.env.COMPANY_LEGAL_NAME || null,
  legalEntityType: process.env.COMPANY_LEGAL_ENTITY_TYPE || null,
  capitalSocial: process.env.COMPANY_CAPITAL_SOCIAL || null,
  ein: process.env.COMPANY_EIN || null,
  stateRegistration: process.env.COMPANY_STATE_REGISTRATION || null,
  taxId: process.env.COMPANY_TAX_ID || null,
  address: process.env.COMPANY_ADDRESS || null,
  phone: process.env.COMPANY_PHONE || '(800) 555-0199',
  publishingDirector: process.env.COMPANY_PUBLISHING_DIRECTOR || null,
  foundingDate: process.env.COMPANY_FOUNDING_DATE || null,

  // Contact (real and functional)
  email: 'contact@us-attorneys.com',
  supportEmail: 'support@us-attorneys.com',
  dpoEmail: 'dpo@us-attorneys.com',
  pressEmail: 'press@us-attorneys.com',
  partnersEmail: 'partners@us-attorneys.com',
  careersEmail: 'careers@us-attorneys.com',

  // Social (real profiles)
  social: {
    facebook: 'https://facebook.com/usattorneys',
    instagram: 'https://instagram.com/usattorneys',
    linkedin: 'https://linkedin.com/company/usattorneys',
    twitter: 'https://twitter.com/usattorneys',
  },

  // Hosting (Level 1 — verifiable)
  hosting: {
    name: 'Vercel Inc.',
    address: '340 S Lemon Ave #4133, Walnut, CA 91789, USA',
    website: 'https://vercel.com',
  },

  // Platform status
  status: (process.env.COMPANY_STATUS as 'pre-launch' | 'launched') || 'launched',
}

/**
 * Centralized marketing statistics — Single Source of Truth.
 * Import this in any component that displays platform numbers.
 */
export const marketingStats = {
  attorneyCount: '50,000+',
  attorneyCountShort: '50K+',
  cityCount: '41,000+',
  specialtyCount: '75',
  responseTime: 'Variable',
} as const

/** True when EIN, legal name, and address are all filled. */
export function isCompanyRegistered(): boolean {
  return (
    companyIdentity.ein !== null &&
    companyIdentity.legalName !== null &&
    companyIdentity.address !== null
  )
}

/** True once the platform has real attorneys / is live. */
export function isPlatformLaunched(): boolean {
  return companyIdentity.status === 'launched'
}

/** Non-null social profile URLs for schema.org sameAs. */
export function getSocialLinks(): string[] {
  return Object.values(companyIdentity.social).filter(Boolean)
}
