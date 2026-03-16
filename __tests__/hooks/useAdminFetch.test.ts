import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type { SWRConfiguration } from 'swr'

// ---------------------------------------------------------------------------
// We need to test `adminFetcher` which is NOT exported. Strategy: mock `swr`
// so that when `useAdminFetch` is imported the module-level DEFAULT_CONFIG
// (which contains the fetcher) is captured. We can then call the fetcher
// directly in our tests without exercising SWR behaviour.
// ---------------------------------------------------------------------------

let capturedConfig: SWRConfiguration | undefined

vi.mock('swr', () => ({
  __esModule: true,
  default: (_key: string | null, config?: SWRConfiguration) => {
    capturedConfig = config
    return {
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    }
  },
}))

// Must import AFTER the mock is registered so the module executes with our mock
// eslint-disable-next-line @typescript-eslint/no-require-imports
let adminMutate: typeof import('@/hooks/admin/useAdminFetch').adminMutate
let useAdminFetch: typeof import('@/hooks/admin/useAdminFetch').useAdminFetch
let adminFetcher: ((url: string) => Promise<unknown>) | undefined

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Response-like object for fetch mock */
function mockResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; jsonThrows?: boolean } = {}
) {
  const { ok = true, status = 200, jsonThrows = false } = init
  return {
    ok,
    status,
    json: jsonThrows
      ? () => Promise.reject(new SyntaxError('Unexpected token'))
      : () => Promise.resolve(body),
  } as unknown as Response
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(async () => {
  vi.restoreAllMocks()
  vi.stubGlobal('fetch', vi.fn())
  capturedConfig = undefined

  // Dynamically import to re-trigger module evaluation with fresh mocks
  const mod = await import('@/hooks/admin/useAdminFetch')
  adminMutate = mod.adminMutate
  useAdminFetch = mod.useAdminFetch

  // Trigger the hook so that DEFAULT_CONFIG is passed to our mock SWR
  useAdminFetch('/test')
  adminFetcher = (capturedConfig as unknown as Record<string, unknown>)?.fetcher as
    | ((url: string) => Promise<unknown>)
    | undefined
})

// ===================================================================
// adminFetcher (SWR fetcher)
// ===================================================================

describe('adminFetcher', () => {
  it('should be captured from the SWR config', () => {
    expect(adminFetcher).toBeDefined()
    expect(typeof adminFetcher).toBe('function')
  })

  // ---------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------

  it('returns parsed JSON on a successful response', async () => {
    const payload = { providers: [{ id: 1 }] }
    ;(fetch as Mock).mockResolvedValueOnce(mockResponse(payload))

    const result = await adminFetcher!('/api/admin/providers')

    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith('/api/admin/providers', {
      signal: expect.any(AbortSignal),
    })
    expect(result).toEqual(payload)
  })

  // ---------------------------------------------------------------
  // Error: API returns error body
  // ---------------------------------------------------------------

  it('throws Error with message from the error response body', async () => {
    const errorBody = { error: { message: 'Access denied' } }
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse(errorBody, { ok: false, status: 403 })
    )

    await expect(adminFetcher!('/api/admin/secret')).rejects.toThrow('Access denied')
  })

  it('attaches the HTTP status to the thrown error', async () => {
    const errorBody = { error: { message: 'Not found' } }
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse(errorBody, { ok: false, status: 404 })
    )

    try {
      await adminFetcher!('/api/admin/missing')
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as Record<string, unknown>).status).toBe(404)
    }
  })

  it('falls back to "Error {status}" when error body has no message', async () => {
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse({}, { ok: false, status: 500 })
    )

    await expect(adminFetcher!('/api/admin/broken')).rejects.toThrow('Error 500')
  })

  // ---------------------------------------------------------------
  // Error: response body parse fails (network-level error body)
  // ---------------------------------------------------------------

  it('throws "Network error" when the error response body is not valid JSON', async () => {
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse(null, { ok: false, status: 502, jsonThrows: true })
    )

    await expect(adminFetcher!('/api/admin/down')).rejects.toThrow('Network error')
  })

  // ---------------------------------------------------------------
  // Timeout / AbortError
  // ---------------------------------------------------------------

  it('throws a timeout error when the request is aborted', async () => {
    // Simulate an AbortError coming from fetch
    const abortError = new DOMException(
      'The operation was aborted.',
      'AbortError'
    )
    ;(fetch as Mock).mockRejectedValueOnce(abortError)

    await expect(adminFetcher!('/api/admin/slow')).rejects.toThrow(
      'Request timed out (30s). Please try again.'
    )
  })

  it('re-throws non-abort fetch errors as-is', async () => {
    const networkError = new TypeError('Failed to fetch')
    ;(fetch as Mock).mockRejectedValueOnce(networkError)

    await expect(adminFetcher!('/api/admin/offline')).rejects.toThrow(
      'Failed to fetch'
    )
  })

  // ---------------------------------------------------------------
  // Cleanup: clearTimeout is always called
  // ---------------------------------------------------------------

  it('clears the timeout on success', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    ;(fetch as Mock).mockResolvedValueOnce(mockResponse({ ok: true }))

    await adminFetcher!('/api/admin/ok')

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('clears the timeout on error', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse({ error: { message: 'fail' } }, { ok: false, status: 500 })
    )

    await adminFetcher!('/api/admin/fail').catch(() => {})

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})

// ===================================================================
// adminMutate
// ===================================================================

describe('adminMutate', () => {
  // ---------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------

  it('sends correct method, headers, and JSON body', async () => {
    const payload = { is_verified: true }
    const responseBody = { success: true }
    ;(fetch as Mock).mockResolvedValueOnce(mockResponse(responseBody))

    await adminMutate('/api/admin/providers/123', {
      method: 'PATCH',
      body: payload,
    })

    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith('/api/admin/providers/123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: expect.any(AbortSignal),
    })
  })

  it('returns parsed JSON on success', async () => {
    const responseBody = { id: 42, is_verified: true }
    ;(fetch as Mock).mockResolvedValueOnce(mockResponse(responseBody))

    const result = await adminMutate('/api/admin/providers/42', {
      method: 'PATCH',
      body: { is_verified: true },
    })

    expect(result).toEqual(responseBody)
  })

  it('sends request without body when body is undefined', async () => {
    ;(fetch as Mock).mockResolvedValueOnce(mockResponse({ deleted: true }))

    await adminMutate('/api/admin/providers/99', {
      method: 'DELETE',
    })

    expect(fetch).toHaveBeenCalledWith('/api/admin/providers/99', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: undefined,
      signal: expect.any(AbortSignal),
    })
  })

  it('supports POST method', async () => {
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse({ id: 1, name: 'New Provider' })
    )

    const result = await adminMutate('/api/admin/providers', {
      method: 'POST',
      body: { name: 'New Provider' },
    })

    expect(result).toEqual({ id: 1, name: 'New Provider' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/providers',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('supports PUT method', async () => {
    ;(fetch as Mock).mockResolvedValueOnce(mockResponse({ updated: true }))

    await adminMutate('/api/admin/providers/5', {
      method: 'PUT',
      body: { name: 'Updated' },
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/providers/5',
      expect.objectContaining({ method: 'PUT' })
    )
  })

  // ---------------------------------------------------------------
  // Error: API returns error body
  // ---------------------------------------------------------------

  it('throws Error with message from the error body on non-ok response', async () => {
    const errorBody = { error: { message: 'Provider not found' } }
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse(errorBody, { ok: false, status: 404 })
    )

    await expect(
      adminMutate('/api/admin/providers/999', {
        method: 'PATCH',
        body: { is_verified: true },
      })
    ).rejects.toThrow('Provider not found')
  })

  it('falls back to "Error {status}" when error body has no message', async () => {
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse({}, { ok: false, status: 422 })
    )

    await expect(
      adminMutate('/api/admin/providers/1', {
        method: 'PATCH',
        body: { invalid: true },
      })
    ).rejects.toThrow('Error 422')
  })

  it('falls back to "Error {status}" when error body has null error field', async () => {
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse({ error: null }, { ok: false, status: 500 })
    )

    await expect(
      adminMutate('/api/admin/providers/1', { method: 'DELETE' })
    ).rejects.toThrow('Error 500')
  })

  // ---------------------------------------------------------------
  // Timeout / AbortError
  // ---------------------------------------------------------------

  it('throws a timeout error when the request is aborted', async () => {
    const abortError = new DOMException(
      'The operation was aborted.',
      'AbortError'
    )
    ;(fetch as Mock).mockRejectedValueOnce(abortError)

    await expect(
      adminMutate('/api/admin/providers/1', {
        method: 'PATCH',
        body: { is_verified: true },
      })
    ).rejects.toThrow('Request timed out (30s). Please try again.')
  })

  it('re-throws non-abort errors as-is', async () => {
    const networkError = new TypeError('Failed to fetch')
    ;(fetch as Mock).mockRejectedValueOnce(networkError)

    await expect(
      adminMutate('/api/admin/providers/1', {
        method: 'PATCH',
        body: {},
      })
    ).rejects.toThrow('Failed to fetch')
  })

  // ---------------------------------------------------------------
  // Cleanup: clearTimeout is always called
  // ---------------------------------------------------------------

  it('clears the timeout on success', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    ;(fetch as Mock).mockResolvedValueOnce(mockResponse({ ok: true }))

    await adminMutate('/api/admin/ok', { method: 'POST', body: {} })

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('clears the timeout on error', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout')
    ;(fetch as Mock).mockResolvedValueOnce(
      mockResponse({ error: { message: 'fail' } }, { ok: false, status: 500 })
    )

    await adminMutate('/api/admin/fail', { method: 'POST', body: {} }).catch(
      () => {}
    )

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})
