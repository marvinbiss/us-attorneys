/**
 * Centralized Error Handling
 * World-class error management with proper typing and logging
 */

export enum ErrorCode {
  // API Errors
  API_ERROR = 'API_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_VALIDATION = 'API_VALIDATION',

  // Business Errors
  BAR_NUMBER_INVALID = 'BAR_NUMBER_INVALID',
  ATTORNEY_NOT_FOUND = 'ATTORNEY_NOT_FOUND',
  ATTORNEY_INACTIVE = 'ATTORNEY_INACTIVE',

  // Payment Errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',

  // Auth Errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // Infrastructure Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface ErrorDetails {
  code: ErrorCode
  message: string
  statusCode?: number
  retryable?: boolean
  context?: Record<string, unknown>
  originalError?: Error
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly retryable: boolean
  public readonly context: Record<string, unknown>
  public readonly originalError?: Error
  public readonly timestamp: Date

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = 'AppError'
    this.code = details.code
    this.statusCode = details.statusCode || 500
    this.retryable = details.retryable ?? false
    this.context = details.context || {}
    this.originalError = details.originalError
    this.timestamp = new Date()

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    }
  }
}

/**
 * API Error - for external API failures
 */
export class APIError extends AppError {
  public readonly apiName: string
  public readonly endpoint?: string

  constructor(
    apiName: string,
    message: string,
    options: {
      code?: ErrorCode
      statusCode?: number
      endpoint?: string
      retryable?: boolean
      context?: Record<string, unknown>
      originalError?: Error
    } = {}
  ) {
    super({
      code: options.code || ErrorCode.API_ERROR,
      message: `[${apiName}] ${message}`,
      statusCode: options.statusCode || 500,
      retryable: options.retryable ?? true,
      context: { ...options.context, apiName, endpoint: options.endpoint },
      originalError: options.originalError,
    })
    this.name = 'APIError'
    this.apiName = apiName
    this.endpoint = options.endpoint
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  public readonly field?: string
  public readonly value?: unknown

  constructor(
    message: string,
    options: {
      field?: string
      value?: unknown
      context?: Record<string, unknown>
    } = {}
  ) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: 400,
      retryable: false,
      context: { ...options.context, field: options.field },
    })
    this.name = 'ValidationError'
    this.field = options.field
    this.value = options.value
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(
    apiName: string,
    options: {
      retryAfter?: number
      context?: Record<string, unknown>
    } = {}
  ) {
    super({
      code: ErrorCode.API_RATE_LIMIT,
      message: `[${apiName}] Rate limit exceeded`,
      statusCode: 429,
      retryable: true,
      context: { ...options.context, apiName, retryAfter: options.retryAfter },
    })
    this.name = 'RateLimitError'
    this.retryAfter = options.retryAfter
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  public readonly resourceType: string
  public readonly resourceId?: string

  constructor(
    resourceType: string,
    resourceId?: string,
    options: { context?: Record<string, unknown> } = {}
  ) {
    super({
      code: ErrorCode.API_NOT_FOUND,
      message: resourceId
        ? `${resourceType} not found: ${resourceId}`
        : `${resourceType} not found`,
      statusCode: 404,
      retryable: false,
      context: { ...options.context, resourceType, resourceId },
    })
    this.name = 'NotFoundError'
    this.resourceType = resourceType
    this.resourceId = resourceId
  }
}

/**
 * Authorization Error
 */
export class AuthError extends AppError {
  constructor(
    message: string = 'Authentication required',
    options: {
      code?: ErrorCode
      context?: Record<string, unknown>
    } = {}
  ) {
    super({
      code: options.code || ErrorCode.AUTH_REQUIRED,
      message,
      statusCode: 401,
      retryable: false,
      context: options.context,
    })
    this.name = 'AuthError'
  }
}

/**
 * Permission Error
 */
export class PermissionError extends AppError {
  public readonly requiredPermission?: string

  constructor(
    message: string = 'Permission denied',
    options: {
      requiredPermission?: string
      context?: Record<string, unknown>
    } = {}
  ) {
    super({
      code: ErrorCode.PERMISSION_DENIED,
      message,
      statusCode: 403,
      retryable: false,
      context: { ...options.context, requiredPermission: options.requiredPermission },
    })
    this.name = 'PermissionError'
    this.requiredPermission = options.requiredPermission
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up')
    )
  }

  return false
}

/**
 * Normalize any error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      originalError: error,
    })
  }

  return new AppError({
    code: ErrorCode.UNKNOWN_ERROR,
    message: String(error),
  })
}

/**
 * Extract HTTP status from error
 */
export function getHttpStatus(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode
  }
  return 500
}

/**
 * Create user-friendly error message
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message
  }

  if (error instanceof NotFoundError) {
    return `${error.resourceType} not found`
  }

  if (error instanceof RateLimitError) {
    return 'Service temporarily unavailable. Please try again in a few moments.'
  }

  if (error instanceof AuthError) {
    return 'Please log in to continue.'
  }

  if (error instanceof PermissionError) {
    return "You do not have the required permissions for this action."
  }

  if (error instanceof APIError) {
    return 'A technical error occurred. Please try again.'
  }

  return 'An unexpected error occurred.'
}
