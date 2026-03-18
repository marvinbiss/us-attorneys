/**
 * Resilience Utilities — Barrel Export
 *
 * Production-grade reliability patterns for US Attorneys.
 * All utilities are zero-dependency and work in Node.js, Edge Runtime, and Vercel serverless.
 *
 * Usage:
 *   import { withCircuitBreaker, withRetry, withTimeout } from '@/lib/resilience'
 */

// Circuit Breaker
export {
  withCircuitBreaker,
  configureCircuitBreaker,
  getCircuitBreakerState,
  resetCircuitBreaker,
  CircuitState,
  type CircuitBreakerConfig,
} from './circuit-breaker'

// Retry with Exponential Backoff + Jitter
export {
  withRetry,
  isNetworkError,
  type RetryOptions,
} from './retry'

// Timeout
export {
  withTimeout,
  fetchWithTimeout,
  TimeoutError,
} from './timeout'
