/**
 * Company Identity — Single Source of Truth
 *
 * CHARTER.md Source Hierarchy:
 *   Level 1 (Legal docs): siret, legalName, address, phone, rcs, tva
 *   Level 5 (UI copy): description, tagline
 *
 * RULE: Any field that is `null` MUST NOT appear in:
 *   - Structured data (JSON-LD)
 *   - Mentions légales
 *   - Footer contact section
 *
 * When the company is registered, update the null fields here.
 * Every page that imports this file will automatically reflect the change.
 */

export const companyIdentity = {
  // Brand (Level 5 — UI copy only)
  name: 'ServicesArtisans' as const,
  tagline: 'Trouvez des artisans qualifiés près de chez vous',
  description:
    'Des artisans référencés dans toute la France grâce aux données SIREN officielles. Comparez, contactez et trouvez le bon professionnel en quelques clics.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://servicesartisans.fr',

  // Legal identity (Level 1 — from env vars, null until company registration)
  legalName: process.env.COMPANY_LEGAL_NAME || null,
  formeJuridique: process.env.COMPANY_FORME_JURIDIQUE || null,
  capitalSocial: process.env.COMPANY_CAPITAL_SOCIAL || null,
  siret: process.env.COMPANY_SIRET || null,
  rcs: process.env.COMPANY_RCS || null,
  tvaIntracom: process.env.COMPANY_TVA || null,
  address: process.env.COMPANY_ADDRESS || null,
  phone: process.env.COMPANY_PHONE || '06 51 85 89 30',
  directeurPublication: process.env.COMPANY_DIRECTEUR_PUBLICATION || null,
  foundingDate: process.env.COMPANY_FOUNDING_DATE || null,

  // Contact (real and functional)
  email: 'contact@servicesartisans.fr',
  supportEmail: 'support@servicesartisans.fr',
  dpoEmail: 'dpo@servicesartisans.fr',
  presseEmail: 'presse@servicesartisans.fr',
  partenairesEmail: 'partenaires@servicesartisans.fr',
  careersEmail: 'careers@servicesartisans.fr',

  // Social (real profiles)
  social: {
    facebook: 'https://facebook.com/servicesartisans',
    instagram: 'https://instagram.com/servicesartisans',
    linkedin: 'https://linkedin.com/company/servicesartisans',
    twitter: 'https://twitter.com/servicesartisans',
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
  artisanCount: 'SIREN',
  artisanCountShort: 'SIREN',
  cityCount: '1 000+',
  serviceCount: '46',
  responseTime: 'Variable',
} as const

/** True when SIRET, legal name, and address are all filled. */
export function isCompanyRegistered(): boolean {
  return (
    companyIdentity.siret !== null &&
    companyIdentity.legalName !== null &&
    companyIdentity.address !== null
  )
}

/** True once the platform has real artisans / is live. */
export function isPlatformLaunched(): boolean {
  return companyIdentity.status === 'launched'
}

/** Non-null social profile URLs for schema.org sameAs. */
export function getSocialLinks(): string[] {
  return Object.values(companyIdentity.social).filter(Boolean)
}
