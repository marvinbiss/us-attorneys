/**
 * Centralized API Error Handling — US Attorneys
 *
 * Provides a unified error class hierarchy and handler utilities for all API routes.
 * Every API error flows through this module to guarantee a consistent JSON envelope:
 *
 *   { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }
 *
 * Usage:
 *   throw new NotFoundError('Attorney')
 *   throw new ValidationError('Invalid email', { fields: { email: 'Required' } })
 *   export const POST = withErrorHandler(async (req) => { ... })
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { isTimeoutError } from '@/lib/api/timeout'

// ============================================
// Error codes (machine-readable, stable API contract)
// ============================================

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CONFLICT'
  | 'PAYMENT_REQUIRED'
  | 'UNPROCESSABLE_ENTITY'
  | 'GATEWAY_TIMEOUT'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR'

// ============================================
// Base API Error
// ============================================

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: ApiErrorCode
  public readonly details?: Record<string, unknown>

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Serialize to the standard JSON envelope (without HTTP wrapping).
   */
  toJSON() {
    const payload: Record<string, unknown> = {
      code: this.code,
      message: this.message,
    }
    if (this.details && Object.keys(this.details).length > 0) {
      payload.details = this.details
    }
    return { error: payload }
  }
}

// ============================================
// Concrete error classes
// ============================================

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource', details?: Record<string, unknown>) {
    super(404, 'NOT_FOUND', `${resource} not found`, details)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Invalid data', details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message, details)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required', details?: Record<string, unknown>) {
    super(401, 'UNAUTHORIZED', message, details)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Insufficient permissions', details?: Record<string, unknown>) {
    super(403, 'FORBIDDEN', message, details)
    this.name = 'ForbiddenError'
  }
}

export class RateLimitError extends ApiError {
  public readonly retryAfterSeconds: number

  constructor(retryAfterSeconds = 60, details?: Record<string, unknown>) {
    super(
      429,
      'RATE_LIMIT_EXCEEDED',
      `Too many requests. Retry in ${retryAfterSeconds} seconds.`,
      details,
    )
    this.name = 'RateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details?: Record<string, unknown>) {
    super(409, 'CONFLICT', message, details)
    this.name = 'ConflictError'
  }
}

export class PaymentRequiredError extends ApiError {
  constructor(message = 'Payment required', details?: Record<string, unknown>) {
    super(402, 'PAYMENT_REQUIRED', message, details)
    this.name = 'PaymentRequiredError'
  }
}

export class ExternalServiceError extends ApiError {
  constructor(serviceName: string, details?: Record<string, unknown>) {
    super(502, 'EXTERNAL_SERVICE_ERROR', `External service error: ${serviceName}`, details)
    this.name = 'ExternalServiceError'
  }
}

// ============================================
// Error conversion
// ============================================

/**
 * Convert any thrown value to an ApiError instance.
 * Recognizes:
 *   - ApiError subclasses (pass-through)
 *   - Legacy AppError from src/lib/errors.ts (maps code + statusCode)
 *   - Timeout errors (504)
 *   - Generic Error / unknown
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  // Timeout detection (from withTimeout utility)
  if (isTimeoutError(error)) {
    return new ApiError(504, 'GATEWAY_TIMEOUT', 'The request timed out. Please try again.')
  }

  // Legacy AppError from src/lib/errors.ts
  if (
    error instanceof Error &&
    'code' in error &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number'
  ) {
    const legacy = error as Error & { code: string; statusCode: number }
    return new ApiError(
      legacy.statusCode,
      mapLegacyCode(legacy.code),
      legacy.message,
    )
  }

  if (error instanceof Error) {
    return new ApiError(500, 'INTERNAL_ERROR', error.message)
  }

  return new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
}

/** Map legacy string codes from src/lib/errors.ts to ApiErrorCode. */
function mapLegacyCode(code: string): ApiErrorCode {
  const map: Record<string, ApiErrorCode> = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    AUTHENTICATION_ERROR: 'UNAUTHORIZED',
    AUTHORIZATION_ERROR: 'FORBIDDEN',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_EXCEEDED',
    CONFLICT_ERROR: 'CONFLICT',
    PAYMENT_ERROR: 'PAYMENT_REQUIRED',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  }
  return map[code] ?? 'INTERNAL_ERROR'
}

// ============================================
// handleApiError — builds a consistent NextResponse
// ============================================

/**
 * Convert any error to a properly formatted JSON NextResponse.
 *
 * @example
 *   catch (err) { return handleApiError(err) }
 */
export function handleApiError(error: unknown): NextResponse {
  const apiError = toApiError(error)

  // Log server errors; skip client errors (4xx) from polluting logs
  if (apiError.statusCode >= 500) {
    logger.error(`API ${apiError.statusCode}`, error as Error)
  }

  const headers: Record<string, string> = {}
  if (apiError instanceof RateLimitError) {
    headers['Retry-After'] = String(apiError.retryAfterSeconds)
  }

  return NextResponse.json(apiError.toJSON(), {
    status: apiError.statusCode,
    headers,
  })
}

// ============================================
// withErrorHandler — HOF wrapping route handlers
// ============================================

type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> },
) => Promise<NextResponse>

/**
 * Higher-order function that wraps a Next.js route handler with
 * try/catch and consistent error formatting.
 *
 * @example
 *   export const GET = withErrorHandler(async (req) => {
 *     const data = await fetchSomething()
 *     return apiSuccess(data)
 *   })
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      return await handler(request, context)
    } catch (error: unknown) {
      return handleApiError(error)
    }
  }
}
