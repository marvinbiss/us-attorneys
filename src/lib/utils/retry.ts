/**
 * Retry Utility with Exponential Backoff
 * World-class retry mechanism for API resilience
 */

import { isRetryableError, RateLimitError, AppError, ErrorCode } from './errors'

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number
  /** Initial delay in milliseconds */
  initialDelay?: number
  /** Maximum delay in milliseconds */
  maxDelay?: number
  /** Backoff multiplier */
  backoffMultiplier?: number
  /** Add random jitter to prevent thundering herd */
  jitter?: boolean
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean
  /** Callback on each retry attempt */
  onRetry?: (error: unknown, attempt: number, delay: number) => void
  /** Timeout for each attempt in milliseconds */
  timeout?: number
  /** Abort signal for cancellation */
  signal?: AbortSignal
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'timeout' | 'signal' | 'isRetryable'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  options: Required<Omit<RetryOptions, 'onRetry' | 'timeout' | 'signal' | 'isRetryable'>>
): number {
  const exponentialDelay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1)
  const boundedDelay = Math.min(exponentialDelay, options.maxDelay)

  if (options.jitter) {
    // Add random jitter between 0% and 25% of the delay
    const jitterFactor = 1 + Math.random() * 0.25
    return Math.floor(boundedDelay * jitterFactor)
  }

  return boundedDelay
}

/**
 * Sleep for specified duration with abort support
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timeoutId = setTimeout(resolve, ms)

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

/**
 * Wrap function with timeout
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout: number,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController()

  // Link to parent signal
  signal?.addEventListener('abort', () => controller.abort(), { once: true })

  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const result = await fn()
    clearTimeout(timeoutId)
    return result
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    if (controller.signal.aborted && !signal?.aborted) {
      throw new AppError({
        code: ErrorCode.API_TIMEOUT,
        message: `Operation timed out after ${timeout}ms`,
        retryable: true,
      })
    }
    throw error
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const checkRetryable = options.isRetryable || isRetryableError

  let lastError: unknown

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Check if aborted
      if (opts.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      // Execute with optional timeout
      const result = opts.timeout
        ? await withTimeout(fn, opts.timeout, opts.signal)
        : await fn()

      return result
    } catch (error: unknown) {
      lastError = error

      // Don't retry if aborted
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }

      // Check if we should retry
      const shouldRetry = attempt < opts.maxAttempts && checkRetryable(error)

      if (!shouldRetry) {
        throw error
      }

      // Handle rate limit with specific retry-after
      let delay: number
      if (error instanceof RateLimitError && error.retryAfter) {
        delay = error.retryAfter * 1000
      } else {
        delay = calculateDelay(attempt, opts)
      }

      // Call retry callback
      if (opts.onRetry) {
        opts.onRetry(error, attempt, delay)
      }

      // Wait before retrying
      await sleep(delay, opts.signal)
    }
  }

  throw lastError
}

/**
 * Create a retryable version of a function
 */
export function withRetry<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => retry(() => fn(...args), options)
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private failures: number = 0
  private lastFailure: number = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly options: {
      failureThreshold: number
      resetTimeout: number
      halfOpenRequests: number
    } = {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 1,
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.options.resetTimeout) {
        this.state = 'half-open'
      } else {
        throw new AppError({
          code: ErrorCode.API_ERROR,
          message: 'Circuit breaker is open',
          retryable: true,
        })
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error: unknown) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailure = Date.now()

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open'
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }

  reset(): void {
    this.failures = 0
    this.lastFailure = 0
    this.state = 'closed'
  }
}

/**
 * Batch requests with concurrency limit
 */
export async function batchRetry<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: RetryOptions & { concurrency?: number } = {}
): Promise<Array<{ success: true; result: R } | { success: false; error: unknown }>> {
  const { concurrency = 5, ...retryOptions } = options
  const results: Array<{ success: true; result: R } | { success: false; error: unknown }> = []

  // Process in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await retry(() => fn(item), retryOptions)
          return { success: true as const, result }
        } catch (error: unknown) {
          return { success: false as const, error }
        }
      })
    )
    results.push(...batchResults)
  }

  return results
}
