'use client'

import useSWR, { type SWRConfiguration, type KeyedMutator } from 'swr'

/**
 * Generic admin data fetcher — wraps SWR for instant navigation.
 *
 * Features:
 * - 30s deduplication (same URL called twice within 30s → single request)
 * - Stale data shown instantly, revalidated in background
 * - Automatic retry on error (3 attempts)
 * - No revalidation on window focus (admin pages are long-lived)
 * - Manual mutate() for optimistic updates after mutations
 */

const FETCH_TIMEOUT_MS = 30_000

const adminFetcher = async (url: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: { message: 'Network error' } }))
      const error = new Error(body?.error?.message || `Error ${res.status}`)
      ;(error as unknown as Record<string, unknown>).status = res.status
      throw error
    }
    return res.json()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out (30s). Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

const DEFAULT_CONFIG: SWRConfiguration = {
  fetcher: adminFetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30_000, // 30 seconds
  errorRetryCount: 2,
  keepPreviousData: true, // Show old data while loading new page
}

export interface UseAdminFetchResult<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | undefined
  mutate: KeyedMutator<T>
  isValidating: boolean
}

/**
 * Hook for admin data fetching with SWR caching.
 *
 * @param url - API endpoint (null/undefined to skip fetching)
 * @param config - Optional SWR configuration overrides
 *
 * @example
 * ```tsx
 * const { data, isLoading, mutate } = useAdminFetch<StatsResponse>('/api/admin/stats')
 * ```
 *
 * @example With dynamic URL
 * ```tsx
 * const url = page ? `/api/admin/providers?page=${page}&filter=${filter}` : null
 * const { data, isLoading } = useAdminFetch<ProvidersResponse>(url)
 * ```
 */
export function useAdminFetch<T = unknown>(
  url: string | null | undefined,
  config?: SWRConfiguration
): UseAdminFetchResult<T> {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url ?? null,
    { ...DEFAULT_CONFIG, ...config }
  )

  return { data, isLoading, error, mutate, isValidating }
}

/**
 * Perform a mutation (POST/PATCH/DELETE) and revalidate related caches.
 * Returns the JSON response body.
 *
 * @example
 * ```tsx
 * const result = await adminMutate('/api/admin/providers/123', {
 *   method: 'PATCH',
 *   body: { is_verified: true },
 * })
 * mutate() // revalidate SWR cache
 * ```
 */
export async function adminMutate<T = unknown>(
  url: string,
  options: {
    method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
  }
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: options.method,
      headers: { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.error?.message || `Error ${res.status}`)
    }

    return data as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out (30s). Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
