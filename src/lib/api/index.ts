/**
 * Centralized API Exports
 * World-class API infrastructure for ServicesArtisans
 */

// ============================================
// UTILITIES
// ============================================
export * from '../utils/errors'
export * from '../utils/retry'
export * from '../utils/cache'
export { logger, apiLogger, dbLogger, authLogger, paymentLogger } from '@/lib/logger'

// ============================================
// API Clients
// ============================================

// Pappers - Business data
export {
  getEntrepriseParSiret,
  getEntrepriseParSiren,
  rechercherEntreprises,
  verifierSanteEntreprise,
  getBadgeConfiance,
  validateSiren,
  validateSiret,
  formaterMontant,
  formaterAnciennete,
  formaterSiret,
  formaterSiren,
  CODES_NAF_ARTISANS,
  type EntrepriseComplete,
  type RechercheResultat,
} from './pappers'

// SIRENE - Official French business registry
export {
  getEtablissementBySiret,
  getUniteLegaleBySiren,
  rechercherEtablissements,
  verifierSiret,
  formatAdresseEtablissement,
  getLibelleTrancheEffectifs,
  TRANCHES_EFFECTIFS,
  type EtablissementSirene,
  type UniteLegaleSirene,
} from './sirene'

// Adresse - French address API
export {
  autocompleteAdresse,
  autocompleteVille,
  geocoder,
  reverseGeocode,
  getLocationsByCodePostal,
  geocodeBatch,
  calculerDistance,
  filterByRadius,
  sortByDistance,
  isValidCodePostal,
  getDepartementFromCodePostal,
  formaterAdresse,
  parseAdresse,
  DEPARTEMENTS,
  type AdresseSuggestion,
  type GeocodageResult,
} from './adresse'

// Stripe - Payments
export {
  createCustomer,
  getCustomer,
  updateCustomer,
  findCustomerByEmail,
  createSubscription,
  getSubscription,
  cancelSubscription,
  updateSubscription,
  listSubscriptions,
  createPaymentIntent,
  getPaymentIntent,
  confirmPaymentIntent,
  createRefund,
  getInvoice,
  listInvoices,
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  formatAmount,
  getSubscriptionStatusLabel,
  type CreateCustomerParams,
  type CreateSubscriptionParams,
  type CreatePaymentIntentParams,
} from './stripe-client'

// Resend - Email
export {
  sendEmail,
  sendBatchEmails,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendQuoteRequestEmail,
  type EmailParams,
  type EmailResult,
  type BatchEmailParams,
} from './resend-client'

// Mapbox, Twilio — removed in v2 cleanup

// ============================================
// SERVICES
// ============================================
export {
  verifyEntreprise,
  quickVerify,
  verifySiren,
  batchVerify,
  calculateTrustScore,
  getVerificationSummary,
  type VerificationResult,
  type QuickVerificationResult,
} from '../services/verification.service'

// ============================================
// HOOKS (Client-side)
// ============================================
// Note: These are exported separately for client components
// Import from '@/lib/hooks/useAutocomplete' in client components

// ============================================
// AUDIT
// ============================================
export {
  logAuditEvent,
  getAdminInfo,
  auditUserAction,
  auditProviderAction,
  auditReviewAction,
  auditPaymentAction,
  auditReportAction,
  auditGdprAction,
  type AuditAction,
  type EntityType,
} from '../audit-logger'
