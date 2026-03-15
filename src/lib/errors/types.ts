/**
 * Error Types - US Attorneys
 * Standardized error responses for all API routes
 *
 * NOTE: AppError classes (AppError, ValidationError, NotFoundError, etc.) live in
 * src/lib/errors.ts — that is the single source of truth for error classes.
 * They are re-exported below for convenience.
 *
 * @deprecated For AppError class hierarchy, import directly from '@/lib/errors'.
 */

// Re-export AppError class hierarchy from the canonical source
export {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ExternalServiceError,
  ConflictError,
  PaymentError,
  isAppError,
  toAppError,
  formatErrorResponse,
} from '@/lib/errors'

export enum ErrorCode {
  // Authentication errors (1xxx)
  UNAUTHORIZED = 1001,
  INVALID_TOKEN = 1002,
  TOKEN_EXPIRED = 1003,
  INSUFFICIENT_PERMISSIONS = 1004,

  // Validation errors (2xxx)
  VALIDATION_ERROR = 2001,
  MISSING_REQUIRED_FIELD = 2002,
  INVALID_FORMAT = 2003,
  VALUE_OUT_OF_RANGE = 2004,

  // Resource errors (3xxx)
  NOT_FOUND = 3001,
  ALREADY_EXISTS = 3002,
  RESOURCE_LOCKED = 3003,
  RESOURCE_DELETED = 3004,

  // Business logic errors (4xxx)
  BOOKING_CONFLICT = 4001,
  SLOT_UNAVAILABLE = 4002,
  CANCELLATION_TOO_LATE = 4003,
  PAYMENT_REQUIRED = 4004,
  REVIEW_ALREADY_EXISTS = 4005,

  // Payment errors (5xxx)
  PAYMENT_FAILED = 5001,
  INVALID_PAYMENT_METHOD = 5002,
  REFUND_FAILED = 5003,

  // Server errors (9xxx)
  INTERNAL_ERROR = 9001,
  DATABASE_ERROR = 9002,
  EXTERNAL_SERVICE_ERROR = 9003,
  RATE_LIMIT_EXCEEDED = 9004,
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  field?: string
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  field?: string
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      field,
    },
  }
}

export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
  }
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.INVALID_TOKEN]: 'Invalid token',
  [ErrorCode.TOKEN_EXPIRED]: 'Session expired',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid data',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Missing required field',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format',
  [ErrorCode.VALUE_OUT_OF_RANGE]: 'Value out of range',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.ALREADY_EXISTS]: 'This resource already exists',
  [ErrorCode.RESOURCE_LOCKED]: 'Resource locked',
  [ErrorCode.RESOURCE_DELETED]: 'Resource deleted',
  [ErrorCode.BOOKING_CONFLICT]: 'Booking conflict',
  [ErrorCode.SLOT_UNAVAILABLE]: 'Slot unavailable',
  [ErrorCode.CANCELLATION_TOO_LATE]: 'Cancellation no longer possible',
  [ErrorCode.PAYMENT_REQUIRED]: 'Payment required',
  [ErrorCode.REVIEW_ALREADY_EXISTS]: 'Review already submitted',
  [ErrorCode.PAYMENT_FAILED]: 'Payment failed',
  [ErrorCode.INVALID_PAYMENT_METHOD]: 'Invalid payment method',
  [ErrorCode.REFUND_FAILED]: 'Refund failed',
  [ErrorCode.INTERNAL_ERROR]: 'Internal error',
  [ErrorCode.DATABASE_ERROR]: 'Database error',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
}

export function getHttpStatus(code: ErrorCode): number {
  if (code >= 1001 && code <= 1003) return 401
  if (code === ErrorCode.INSUFFICIENT_PERMISSIONS) return 403
  if (code >= 2001 && code <= 2004) return 400
  if (code === ErrorCode.NOT_FOUND) return 404
  if (code === ErrorCode.ALREADY_EXISTS) return 409
  if (code >= 4001 && code <= 4005) return 422
  if (code >= 5001 && code <= 5003) return 402
  if (code === ErrorCode.RATE_LIMIT_EXCEEDED) return 429
  return 500
}
