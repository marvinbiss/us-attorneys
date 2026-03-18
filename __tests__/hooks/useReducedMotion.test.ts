import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// ---------------------------------------------------------------------------
// matchMedia mock
// ---------------------------------------------------------------------------

type MediaQueryListener = (e: MediaQueryListEvent) => void

let currentMatches = false
let changeListener: MediaQueryListener | null = null

function mockMatchMedia(matches: boolean) {
  currentMatches = matches
  changeListener = null

  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query: string) => ({
      matches: currentMatches,
      media: query,
      addEventListener: vi.fn((_event: string, cb: MediaQueryListener) => {
        changeListener = cb
      }),
      removeEventListener: vi.fn((_event: string, _cb: MediaQueryListener) => {
        changeListener = null
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
    writable: true,
    configurable: true,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useReducedMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchMedia(false)
  })

  afterEach(() => {
    changeListener = null
  })

  it('returns false by default (no reduced motion preference)', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when user prefers reduced motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('queries the correct media query', () => {
    mockMatchMedia(false)
    renderHook(() => useReducedMotion())
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('updates when the preference changes to true', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)

    // Simulate the user toggling reduced motion on
    act(() => {
      changeListener?.({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
      } as MediaQueryListEvent)
    })

    expect(result.current).toBe(true)
  })

  it('updates when the preference changes to false', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(true)

    act(() => {
      changeListener?.({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
      } as MediaQueryListEvent)
    })

    expect(result.current).toBe(false)
  })

  it('registers a change event listener', () => {
    mockMatchMedia(false)
    renderHook(() => useReducedMotion())

    const mql = (window.matchMedia as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes the event listener on unmount', () => {
    mockMatchMedia(false)
    const { unmount } = renderHook(() => useReducedMotion())

    const mql = (window.matchMedia as ReturnType<typeof vi.fn>).mock.results[0].value
    unmount()

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('handles missing matchMedia gracefully', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    // Restore
    mockMatchMedia(false)
  })
})
