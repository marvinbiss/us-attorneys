/**
 * Circuit Breaker Pattern — Production-grade resilience for external services.
 *
 * States:
 *   CLOSED   — Normal operation. Failures are counted.
 *   OPEN     — Service is down. Reject fast, return fallback.
 *   HALF_OPEN — Testing recovery. Allow limited requests through.
 *
 * When failure count reaches threshold in CLOSED state → switch to OPEN.
 * After resetTimeout in OPEN state → switch to HALF_OPEN.
 * In HALF_OPEN: if a request succeeds → CLOSED; if it fails → back to OPEN.
 *
 * Zero dependencies. Works in Node.js, Edge Runtime, and Vercel serverless.
 */

import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit. Default: 5 */
  failureThreshold: number
  /** Time in ms to wait before transitioning from OPEN → HALF_OPEN. Default: 30_000 (30s) */
  resetTimeout: number
  /** Max requests allowed through in HALF_OPEN state before deciding. Default: 3 */
  halfOpenMaxAttempts: number
}

interface CircuitBreakerState {
  state: CircuitState
  failureCount: number
  lastFailureTime: number
  halfOpenAttempts: number
  halfOpenSuccesses: number
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30_000,
  halfOpenMaxAttempts: 3,
}

// ---------------------------------------------------------------------------
// Registry — one breaker per service name (module-scoped, survives within a
// single Lambda/serverless invocation)
// ---------------------------------------------------------------------------

const breakers = new Map<string, CircuitBreakerState>()
const configs = new Map<string, CircuitBreakerConfig>()

const cbLogger = logger.child({ component: 'circuit-breaker' })

function getOrCreateBreaker(name: string): CircuitBreakerState {
  let breaker = breakers.get(name)
  if (!breaker) {
    breaker = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      halfOpenAttempts: 0,
      halfOpenSuccesses: 0,
    }
    breakers.set(name, breaker)
  }
  return breaker
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

function transitionTo(name: string, breaker: CircuitBreakerState, newState: CircuitState): void {
  const oldState = breaker.state
  if (oldState === newState) return

  breaker.state = newState

  // Reset counters on transition
  if (newState === CircuitState.CLOSED) {
    breaker.failureCount = 0
    breaker.halfOpenAttempts = 0
    breaker.halfOpenSuccesses = 0
  } else if (newState === CircuitState.HALF_OPEN) {
    breaker.halfOpenAttempts = 0
    breaker.halfOpenSuccesses = 0
  }

  cbLogger.warn(`[${name}] ${oldState} → ${newState}`, {
    failureCount: breaker.failureCount,
  })
}

function recordSuccess(name: string, breaker: CircuitBreakerState, config: CircuitBreakerConfig): void {
  if (breaker.state === CircuitState.HALF_OPEN) {
    breaker.halfOpenSuccesses++
    if (breaker.halfOpenSuccesses >= config.halfOpenMaxAttempts) {
      transitionTo(name, breaker, CircuitState.CLOSED)
    }
  } else if (breaker.state === CircuitState.CLOSED) {
    // Reset failure count on success (consecutive failures pattern)
    breaker.failureCount = 0
  }
}

function recordFailure(name: string, breaker: CircuitBreakerState, config: CircuitBreakerConfig): void {
  breaker.lastFailureTime = Date.now()

  if (breaker.state === CircuitState.HALF_OPEN) {
    // Any failure in half-open → back to open
    transitionTo(name, breaker, CircuitState.OPEN)
  } else if (breaker.state === CircuitState.CLOSED) {
    breaker.failureCount++
    if (breaker.failureCount >= config.failureThreshold) {
      transitionTo(name, breaker, CircuitState.OPEN)
    }
  }
}

function shouldAllowRequest(name: string, breaker: CircuitBreakerState, config: CircuitBreakerConfig): boolean {
  if (breaker.state === CircuitState.CLOSED) {
    return true
  }

  if (breaker.state === CircuitState.OPEN) {
    // Check if enough time has passed to try half-open
    const elapsed = Date.now() - breaker.lastFailureTime
    if (elapsed >= config.resetTimeout) {
      transitionTo(name, breaker, CircuitState.HALF_OPEN)
      return true
    }
    return false
  }

  // HALF_OPEN: allow up to halfOpenMaxAttempts
  if (breaker.state === CircuitState.HALF_OPEN) {
    breaker.halfOpenAttempts++
    return breaker.halfOpenAttempts <= config.halfOpenMaxAttempts
  }

  return false
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Configure a named circuit breaker (optional — defaults apply if not called).
 */
export function configureCircuitBreaker(name: string, config: Partial<CircuitBreakerConfig>): void {
  configs.set(name, { ...DEFAULT_CONFIG, ...config })
}

/**
 * Get the current state of a named circuit breaker (for monitoring / health checks).
 */
export function getCircuitBreakerState(name: string): { state: CircuitState; failureCount: number } {
  const breaker = getOrCreateBreaker(name)
  return { state: breaker.state, failureCount: breaker.failureCount }
}

/**
 * Manually reset a circuit breaker to CLOSED state (e.g., after a deploy fix).
 */
export function resetCircuitBreaker(name: string): void {
  const breaker = getOrCreateBreaker(name)
  transitionTo(name, breaker, CircuitState.CLOSED)
}

/**
 * Execute a function with circuit breaker protection.
 *
 * @param name     — Unique service identifier (e.g., 'supabase', 'stripe')
 * @param fn       — The async function to execute
 * @param fallback — Optional fallback value/function when circuit is OPEN
 * @returns The result of fn() or the fallback value
 *
 * @example
 * const attorneys = await withCircuitBreaker(
 *   'supabase',
 *   () => supabase.from('attorneys').select('*'),
 *   () => getCachedAttorneys(), // serve stale cache when DB is down
 * )
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  fallback?: T | (() => T | Promise<T>),
): Promise<T> {
  const config = configs.get(name) ?? DEFAULT_CONFIG
  const breaker = getOrCreateBreaker(name)

  if (!shouldAllowRequest(name, breaker, config)) {
    // Circuit is OPEN — return fallback or throw
    if (fallback !== undefined) {
      cbLogger.warn(`[${name}] Circuit OPEN — returning fallback`, {
        failureCount: breaker.failureCount,
      })
      return typeof fallback === 'function' ? await (fallback as () => T | Promise<T>)() : fallback
    }
    throw new Error(`[CircuitBreaker] ${name} circuit is OPEN — service unavailable`)
  }

  try {
    const result = await fn()
    recordSuccess(name, breaker, config)
    return result
  } catch (error) {
    recordFailure(name, breaker, config)

    // If circuit just opened and we have a fallback, use it
    if (fallback !== undefined && breaker.state === CircuitState.OPEN) {
      cbLogger.warn(`[${name}] Request failed, circuit now OPEN — returning fallback`, {
        error: error instanceof Error ? error.message : String(error),
      })
      return typeof fallback === 'function' ? await (fallback as () => T | Promise<T>)() : fallback
    }

    throw error
  }
}
