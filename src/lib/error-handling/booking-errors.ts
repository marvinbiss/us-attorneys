/**
 * Error Handling System - US Attorneys
 * World-class error handling with user-friendly messages
 * Includes retry logic, offline detection, and error tracking
 */

import { logger } from '@/lib/logger'

// Error types
export type BookingErrorCode =
  | 'SLOT_UNAVAILABLE'
  | 'BOOKING_CONFLICT'
  | 'ATTORNEY_UNAVAILABLE'
  | 'INVALID_DATA'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'

export interface BookingError {
  code: BookingErrorCode
  message: string
  userMessage: string
  recoverable: boolean
  retryable: boolean
  action?: string
  details?: Record<string, unknown>
}

// User-friendly error messages
const errorMessages: Record<BookingErrorCode, { message: string; action?: string }> = {
  SLOT_UNAVAILABLE: {
    message: "Sorry, this slot has just been booked by someone else.",
    action: 'Please choose another slot.',
  },
  BOOKING_CONFLICT: {
    message: 'You already have a booking at this date/time.',
    action: 'Check your existing bookings.',
  },
  ATTORNEY_UNAVAILABLE: {
    message: "The attorney is no longer available for this date.",
    action: 'Try another date or a different attorney.',
  },
  INVALID_DATA: {
    message: 'Some information is incorrect.',
    action: 'Check the form fields.',
  },
  PAYMENT_FAILED: {
    message: "The payment could not be processed.",
    action: 'Check your payment information and try again.',
  },
  PAYMENT_CANCELLED: {
    message: 'The payment has been cancelled.',
    action: 'You can try again at any time.',
  },
  NETWORK_ERROR: {
    message: 'Internet connection problem.',
    action: 'Check your connection and try again.',
  },
  SERVER_ERROR: {
    message: 'A technical error occurred.',
    action: 'Please try again in a few moments.',
  },
  UNAUTHORIZED: {
    message: 'Session expired.',
    action: 'Please log in again.',
  },
  NOT_FOUND: {
    message: 'This resource could not be found.',
    action: 'It may have been deleted.',
  },
  RATE_LIMITED: {
    message: 'Too many requests.',
    action: 'Please wait a few seconds.',
  },
  VALIDATION_ERROR: {
    message: 'The entered data is invalid.',
    action: 'Check the form.',
  },
  UNKNOWN: {
    message: 'An unexpected error occurred.',
    action: "Contact support if the problem persists.",
  },
}

// Create a BookingError from various error types
export function createBookingError(
  error: unknown,
  context?: Record<string, unknown>
): BookingError {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      userMessage: errorMessages.NETWORK_ERROR.message,
      action: errorMessages.NETWORK_ERROR.action,
      recoverable: true,
      retryable: true,
      details: context,
    }
  }

  // API response errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status
    const message = (error as { message?: string }).message || ''

    switch (status) {
      case 400:
        // Check for specific error codes
        if (message.includes('slot') || message.includes('slot')) {
          return {
            code: 'SLOT_UNAVAILABLE',
            message,
            userMessage: errorMessages.SLOT_UNAVAILABLE.message,
            action: errorMessages.SLOT_UNAVAILABLE.action,
            recoverable: true,
            retryable: false,
            details: context,
          }
        }
        return {
          code: 'VALIDATION_ERROR',
          message,
          userMessage: errorMessages.VALIDATION_ERROR.message,
          action: errorMessages.VALIDATION_ERROR.action,
          recoverable: true,
          retryable: false,
          details: context,
        }

      case 401:
        return {
          code: 'UNAUTHORIZED',
          message,
          userMessage: errorMessages.UNAUTHORIZED.message,
          action: errorMessages.UNAUTHORIZED.action,
          recoverable: true,
          retryable: false,
          details: context,
        }

      case 404:
        return {
          code: 'NOT_FOUND',
          message,
          userMessage: errorMessages.NOT_FOUND.message,
          action: errorMessages.NOT_FOUND.action,
          recoverable: false,
          retryable: false,
          details: context,
        }

      case 429:
        return {
          code: 'RATE_LIMITED',
          message,
          userMessage: errorMessages.RATE_LIMITED.message,
          action: errorMessages.RATE_LIMITED.action,
          recoverable: true,
          retryable: true,
          details: context,
        }

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVER_ERROR',
          message,
          userMessage: errorMessages.SERVER_ERROR.message,
          action: errorMessages.SERVER_ERROR.action,
          recoverable: true,
          retryable: true,
          details: context,
        }
    }
  }

  // Default unknown error
  return {
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : String(error),
    userMessage: errorMessages.UNKNOWN.message,
    action: errorMessages.UNKNOWN.action,
    recoverable: false,
    retryable: false,
    details: context,
  }
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
}

// Exponential backoff with jitter
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)
  const jitter = Math.random() * 1000
  return Math.min(exponentialDelay + jitter, config.maxDelay)
}

// Retry wrapper for async operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config }
  let lastError: BookingError | null = null

  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = createBookingError(error, { attempt })

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        throw lastError
      }

      // Don't retry if max attempts reached
      if (attempt === finalConfig.maxRetries - 1) {
        throw lastError
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, finalConfig)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Offline detection
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Safe fetch wrapper with error handling
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: BookingError | null }> {
  // Check if online first
  if (!isOnline()) {
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: 'No internet connection',
        userMessage: errorMessages.NETWORK_ERROR.message,
        action: errorMessages.NETWORK_ERROR.action,
        recoverable: true,
        retryable: true,
      },
    }
  }

  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      let errorMessage = response.statusText
      try {
        const errorData = await response.json() as { error?: string }
        errorMessage = errorData.error || response.statusText
      } catch {
        // Ignore JSON parse errors
      }

      const error = createBookingError(
        { status: response.status, message: errorMessage },
        { url, status: response.status }
      )

      return { data: null, error }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: createBookingError(error, { url }),
    }
  }
}

// Error logging (can be connected to analytics)
export function logError(error: BookingError, context?: Record<string, unknown>): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    recoverable: error.recoverable,
    retryable: error.retryable,
    ...context,
  }

  // Log using structured logger
  logger.error('[BookingError]', new Error(error.message), errorLog)

  // In production, send to analytics/error tracking service
  // Example: sendToSentry(errorLog)
}

// User-friendly error component data
export function getErrorDisplayData(error: BookingError): {
  title: string
  description: string
  action?: string
  icon: 'warning' | 'error' | 'info'
  showRetry: boolean
} {
  const isWarning =
    error.code === 'SLOT_UNAVAILABLE' ||
    error.code === 'BOOKING_CONFLICT' ||
    error.code === 'RATE_LIMITED'

  return {
    title: isWarning ? 'Warning' : 'Error',
    description: error.userMessage,
    action: error.action,
    icon: isWarning ? 'warning' : 'error',
    showRetry: error.retryable,
  }
}
