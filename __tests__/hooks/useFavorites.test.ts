import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '@/hooks/useFavorites'

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'sa_favorites'

let store: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { store = {} }),
  get length() { return Object.keys(store).length },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFavorites', () => {
  beforeEach(() => {
    store = {}
    vi.clearAllMocks()
  })

  it('returns empty favorites initially', () => {
    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('hydrates from localStorage on mount', () => {
    store[STORAGE_KEY] = JSON.stringify(['att-1', 'att-2'])

    const { result } = renderHook(() => useFavorites())

    // useEffect runs asynchronously, so favorites will be populated after mount
    expect(result.current.favorites).toEqual(['att-1', 'att-2'])
    expect(result.current.count).toBe(2)
  })

  it('toggleFavorite adds an attorney', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => { result.current.toggleFavorite('att-1') })

    expect(result.current.favorites).toContain('att-1')
    expect(result.current.count).toBe(1)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(['att-1'])
    )
  })

  it('toggleFavorite removes an existing attorney', () => {
    store[STORAGE_KEY] = JSON.stringify(['att-1', 'att-2'])

    const { result } = renderHook(() => useFavorites())

    act(() => { result.current.toggleFavorite('att-1') })

    expect(result.current.favorites).toEqual(['att-2'])
    expect(result.current.count).toBe(1)
  })

  it('isFavorite returns true for favorited attorneys', () => {
    store[STORAGE_KEY] = JSON.stringify(['att-1'])

    const { result } = renderHook(() => useFavorites())

    expect(result.current.isFavorite('att-1')).toBe(true)
    expect(result.current.isFavorite('att-2')).toBe(false)
  })

  it('clearFavorites removes all favorites', () => {
    store[STORAGE_KEY] = JSON.stringify(['att-1', 'att-2', 'att-3'])

    const { result } = renderHook(() => useFavorites())

    act(() => { result.current.clearFavorites() })

    expect(result.current.favorites).toEqual([])
    expect(result.current.count).toBe(0)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, '[]')
  })

  it('handles corrupted localStorage data gracefully', () => {
    store[STORAGE_KEY] = 'not-valid-json{'

    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('handles non-array localStorage data gracefully', () => {
    store[STORAGE_KEY] = JSON.stringify({ key: 'value' })

    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual([])
  })

  it('dispatches custom event when favorites change', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const { result } = renderHook(() => useFavorites())

    act(() => { result.current.toggleFavorite('att-1') })

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sa_favorites_changed' })
    )

    dispatchSpy.mockRestore()
  })

  it('responds to custom events from other components', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => {
      window.dispatchEvent(
        new CustomEvent('sa_favorites_changed', { detail: ['ext-1', 'ext-2'] })
      )
    })

    expect(result.current.favorites).toEqual(['ext-1', 'ext-2'])
  })

  it('responds to storage events from other tabs', () => {
    store[STORAGE_KEY] = JSON.stringify(['cross-tab-1'])

    const { result } = renderHook(() => useFavorites())

    // Simulate storage event from another tab
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(['cross-tab-1']) })
      )
    })

    expect(result.current.favorites).toEqual(['cross-tab-1'])
  })

  it('ignores storage events for other keys', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => { result.current.toggleFavorite('att-1') })

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'other_key', newValue: '[]' })
      )
    })

    // Favorites should remain unchanged
    expect(result.current.favorites).toContain('att-1')
  })

  it('cleans up event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useFavorites())
    unmount()

    const calledTypes = removeSpy.mock.calls.map(c => c[0])
    expect(calledTypes).toContain('sa_favorites_changed')
    expect(calledTypes).toContain('storage')

    removeSpy.mockRestore()
  })
})
