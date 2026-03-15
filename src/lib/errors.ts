/**
 * Custom error classes for US Attorneys
 */

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid data') {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number = 60) {
    super(
      `Too many requests. Retry in ${retryAfterSeconds} seconds.`,
      'RATE_LIMIT_ERROR',
      429
    )
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(specialtyName: string, details?: string) {
    super(
      `External service error: ${specialtyName}${details ? `: ${details}` : ''}`,
      'EXTERNAL_SERVICE_ERROR',
      502
    )
    this.name = 'ExternalServiceError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Data conflict') {
    super(message, 'CONFLICT_ERROR', 409)
    this.name = 'ConflictError'
  }
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment error') {
    super(message, 'PAYMENT_ERROR', 402)
    this.name = 'PaymentError'
  }
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500)
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500)
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown) {
  const appError = toAppError(error)

  return {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
    },
  }
}
