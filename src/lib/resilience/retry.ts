/**
 * Retry with Exponential Backoff + Jitter
 *
 * Prevents thundering herds by adding randomized jitter to the backoff delay.
 * Formula: delay = min(maxDelay, baseDelay * 2^attempt) + random(0, baseDelay)
 *
 * Zero dependencies. Works in Node.js, Edge Runtime, and Vercel serverless.
 */

import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetryOptions {
  /** Maximum number of retry attempts (not counting the initial call). Default: 3 */
  maxRetries: number
  /** Base delay in ms for exponential backoff. Default: 500 */
  baseDelay: number
  /** Maximum delay cap in ms. Default: 10_000 (10s) */
  maxDelay: number
  /** Function to determine if an error is retryable. Default: all errors are retryable */
  isRetryable: (error: unknown) => boolean
  /** Label for logging. Default: 'unknown' */
  label: string
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 500,
  maxDelay: 10_000,
  isRetryable: () => true,
  label: 'unknown',
}

/**
 * Common retryable error patterns for Supabase / network calls.
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()
  return (
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    msg.includes('network request failed') ||
    msg.includes('upstream request timeout') ||
    msg.includes('statement timeout') ||
    msg.includes('57014') ||
    msg.includes('canceling statement') ||
    msg.includes('timed out') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('429')
  )
}

const retryLogger = logger.child({ component: 'retry' })

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Execute a function with retry logic using exponential backoff + jitter.
 *
 * @param fn      — The async function to execute
 * @param options — Partial retry configuration (merged with defaults)
 * @returns The result of fn()
 *
 * @example
 * const data = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, baseDelay: 1000, label: 'fetchData' }
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.isRetryable(error)) {
        throw error
      }

      // Exponential backoff with full jitter
      // delay = random(0, min(maxDelay, baseDelay * 2^attempt))
      const exponentialDelay = Math.min(opts.maxDelay, opts.baseDelay * Math.pow(2, attempt))
      const jitter = Math.random() * opts.baseDelay
      const delay = exponentialDelay + jitter

      retryLogger.warn(
        `[${opts.label}] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed, retrying in ${Math.round(delay)}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
          attempt: attempt + 1,
          maxRetries: opts.maxRetries + 1,
          delay: Math.round(delay),
        },
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError
}
