/**
 * Centralized API Exports
 * World-class API infrastructure for US Attorneys
 */

// ============================================
// CENTRALIZED API LAYER (v2)
// ============================================
export {
  ApiError,
  NotFoundError,
  ValidationError as ApiValidationError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError as ApiRateLimitError,
  ConflictError as ApiConflictError,
  PaymentRequiredError,
  ExternalServiceError as ApiExternalServiceError,
  handleApiError,
  withErrorHandler,
  toApiError,
} from './errors'

export {
  apiSuccess as apiSuccessV2,
  apiPaginated,
  apiCreated,
  apiNoContent,
} from './response'

export { validateBody, validateQuery } from './validation'

// ============================================
// UTILITIES
// ============================================
export * from '../utils/errors'
export * from '../utils/retry'
export * from '../utils/cache'
export { withTimeout, isTimeoutError, TIMEOUTS } from './timeout'
export { logger, apiLogger, dbLogger, authLogger, paymentLogger } from '@/lib/logger'

// ============================================
// API Clients
// ============================================

// French APIs removed: Pappers, SIRENE, Adresse (data.gouv.fr)
// TODO: Replace with US equivalents (state bar APIs, USPS address API, etc.)

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

// French verification service removed (was based on Pappers/SIRENE/Adresse APIs)
// TODO: Replace with US bar verification service

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
