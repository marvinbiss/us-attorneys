/**
 * Request Timeout Utility
 *
 * Races a function against a deadline. Supports AbortController for fetch
 * requests so the underlying HTTP connection is actually cancelled (not just
 * ignored).
 *
 * Zero dependencies. Works in Node.js, Edge Runtime, and Vercel serverless.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`[Timeout] ${label} timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Race a promise-returning function against a timeout.
 *
 * @param fn    — The async function to execute
 * @param ms    — Timeout in milliseconds
 * @param label — Label for error messages (optional)
 * @returns The result of fn()
 * @throws TimeoutError if the function doesn't resolve within ms
 *
 * @example
 * const data = await withTimeout(
 *   () => fetch('/api/data').then(r => r.json()),
 *   5000,
 *   'fetchData',
 * )
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  label = 'operation',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        reject(new TimeoutError(label, ms))
      }
    }, ms)

    fn().then(
      (value) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(value)
        }
      },
      (error) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          reject(error)
        }
      },
    )
  })
}

/**
 * Create an AbortController-powered fetch wrapper with timeout.
 * The AbortController actually cancels the underlying HTTP request,
 * unlike a simple Promise.race which only ignores the result.
 *
 * @param url     — Fetch URL
 * @param ms      — Timeout in milliseconds
 * @param init    — Optional fetch init (merged with signal)
 * @param label   — Label for error messages
 * @returns The fetch Response
 * @throws TimeoutError if the request doesn't complete within ms
 *
 * @example
 * const response = await fetchWithTimeout(
 *   'https://api.example.com/data',
 *   5000,
 *   { method: 'POST', body: JSON.stringify(payload) },
 *   'postData',
 * )
 */
export async function fetchWithTimeout(
  url: string | URL,
  ms: number,
  init?: RequestInit,
  label = 'fetch',
): Promise<Response> {
  const controller = new AbortController()

  const timer = setTimeout(() => {
    controller.abort()
  }, ms)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(label, ms)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
