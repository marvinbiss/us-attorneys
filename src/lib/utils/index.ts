/**
 * US Attorneys - Utility Functions
 * Barrel exports for all shared utilities
 */

// Cache utilities
export { MemoryCache, cacheAside, memoize, apiCache, searchCache, geocodeCache } from './cache'
export type { CacheOptions } from './cache'

// Error handling
export {
  ErrorCode,
  AppError,
  APIError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  AuthError,
  PermissionError,
  isRetryableError,
  normalizeError,
  getHttpStatus,
  getUserMessage,
} from './errors'
export type { ErrorDetails } from './errors'

// Formatting
export {
  formatPhone,
  maskPhone,
  formatPrice,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  truncate,
  capitalizeFirst,
  formatFileSize,
  formatBarNumber,
} from './format'

// Retry & resilience
export { retry, withRetry, CircuitBreaker, batchRetry } from './retry'
export type { RetryOptions } from './retry'
