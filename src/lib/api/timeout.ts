/**
 * Query Timeout Utility
 * Wraps Supabase queries (or any Promise) with a timeout to prevent
 * API routes from hanging indefinitely when the database is slow or unreachable.
 *
 * Usage:
 *   const { data, error } = await withTimeout(supabase.from('table').select('*'))
 *   const { data, error } = await withTimeout(supabase.from('table').select('*'), 15_000)
 */

import { logger } from '@/lib/logger'

/** Default timeout durations by route category (milliseconds) */
export const TIMEOUTS = {
  /** Standard API routes (admin, attorney, client, bookings, reviews) */
  DEFAULT: 8_000,
  /** Payment and webhook routes (Stripe, etc.) */
  PAYMENT: 15_000,
  /** Cron jobs and batch operations */
  CRON: 30_000,
} as const

/**
 * Wrap a promise with a timeout. If the promise does not resolve
 * within `ms` milliseconds, rejects with a descriptive error.
 *
 * @param promise - The promise to wrap (e.g. a Supabase query)
 * @param ms - Timeout in milliseconds (default: 8000)
 * @returns The resolved value of the original promise
 * @throws Error with message `Query timeout after ${ms}ms`
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number = TIMEOUTS.DEFAULT
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Query timeout after ${ms}ms`))
    }, ms)
  })

  try {
    // Wrap in Promise.resolve() to handle PromiseLike (e.g. Supabase query builders)
    const result = await Promise.race([Promise.resolve(promise), timeoutPromise])
    return result
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Query timeout')) {
      logger.error('Database query timeout', { timeoutMs: ms })
    }
    throw error
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Check if an error is a timeout error (for use in catch blocks).
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('Query timeout')
}
