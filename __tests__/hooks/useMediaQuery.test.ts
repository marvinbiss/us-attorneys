import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery, useIsMobile, useIsDesktop } from '@/hooks/use-media-query'

// ---------------------------------------------------------------------------
// matchMedia mock
// ---------------------------------------------------------------------------

type MediaQueryListener = (e: MediaQueryListEvent) => void

const listeners = new Map<string, MediaQueryListener>()

function mockMatchMedia(initialMatches: Record<string, boolean> = {}) {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query: string) => {
      const matches = initialMatches[query] ?? false
      return {
        matches,
        media: query,
        addEventListener: vi.fn((_event: string, cb: MediaQueryListener) => {
          listeners.set(query, cb)
        }),
        removeEventListener: vi.fn((_event: string, _cb: MediaQueryListener) => {
          listeners.delete(query)
        }),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      }
    }),
    writable: true,
    configurable: true,
  })
}

function triggerMediaChange(query: string, matches: boolean) {
  const listener = listeners.get(query)
  if (listener) {
    listener({ matches, media: query } as MediaQueryListEvent)
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMediaQuery', () => {
  beforeEach(() => {
    listeners.clear()
    vi.clearAllMocks()
    mockMatchMedia()
  })

  it('returns false initially by default', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('returns true when media query matches', () => {
    mockMatchMedia({ '(min-width: 768px)': true })

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('updates when media query changes', () => {
    mockMatchMedia({ '(min-width: 768px)': false })

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)

    act(() => {
      triggerMediaChange('(min-width: 768px)', true)
    })

    expect(result.current).toBe(true)
  })

  it('updates when media query stops matching', () => {
    mockMatchMedia({ '(min-width: 768px)': true })

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)

    act(() => {
      triggerMediaChange('(min-width: 768px)', false)
    })

    expect(result.current).toBe(false)
  })

  it('registers a change event listener', () => {
    mockMatchMedia()
    renderHook(() => useMediaQuery('(min-width: 1024px)'))

    const mql = (window.matchMedia as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes listener on unmount', () => {
    mockMatchMedia()
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 600px)'))

    const mql = (window.matchMedia as ReturnType<typeof vi.fn>).mock.results[0].value
    unmount()

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('re-creates listener when query changes', () => {
    mockMatchMedia({ '(min-width: 768px)': false, '(min-width: 1024px)': true })

    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 768px)' } }
    )

    expect(result.current).toBe(false)

    rerender({ query: '(min-width: 1024px)' })
    expect(result.current).toBe(true)
  })

  it('calls matchMedia with the exact query string', () => {
    mockMatchMedia()
    renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })
})

// ---------------------------------------------------------------------------
// Convenience hooks
// ---------------------------------------------------------------------------

describe('useIsMobile', () => {
  beforeEach(() => {
    listeners.clear()
    vi.clearAllMocks()
  })

  it('returns true when viewport is mobile-sized', () => {
    mockMatchMedia({ '(max-width: 767px)': true })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when viewport is larger than mobile', () => {
    mockMatchMedia({ '(max-width: 767px)': false })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('uses the correct breakpoint query', () => {
    mockMatchMedia()
    renderHook(() => useIsMobile())
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })
})

describe('useIsDesktop', () => {
  beforeEach(() => {
    listeners.clear()
    vi.clearAllMocks()
  })

  it('returns true when viewport is desktop-sized', () => {
    mockMatchMedia({ '(min-width: 1024px)': true })
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })

  it('returns false when viewport is smaller than desktop', () => {
    mockMatchMedia({ '(min-width: 1024px)': false })
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(false)
  })

  it('uses the correct breakpoint query', () => {
    mockMatchMedia()
    renderHook(() => useIsDesktop())
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
  })
})
