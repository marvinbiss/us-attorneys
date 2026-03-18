import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/use-local-storage'

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

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

describe('useLocalStorage', () => {
  beforeEach(() => {
    store = {}
    vi.clearAllMocks()
  })

  it('returns the initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    expect(result.current[0]).toBe('default')
  })

  it('returns the stored value when one exists', () => {
    store['test-key'] = JSON.stringify('stored-value')

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    expect(result.current[0]).toBe('stored-value')
  })

  it('stores a new value in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('updated'))
  })

  it('supports function updater', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0))

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })

    expect(result.current[0]).toBe(1)
  })

  it('handles object values', () => {
    const initialObj = { name: 'test', count: 0 }
    const { result } = renderHook(() => useLocalStorage('obj-key', initialObj))

    expect(result.current[0]).toEqual(initialObj)

    act(() => {
      result.current[1]({ name: 'updated', count: 5 })
    })

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 })
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'obj-key',
      JSON.stringify({ name: 'updated', count: 5 })
    )
  })

  it('handles array values', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('arr-key', []))

    act(() => {
      result.current[1](['a', 'b'])
    })

    expect(result.current[0]).toEqual(['a', 'b'])
  })

  it('handles boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('bool-key', false))

    act(() => {
      result.current[1](true)
    })

    expect(result.current[0]).toBe(true)
  })

  it('returns initial value when localStorage has invalid JSON', () => {
    store['bad-key'] = '{invalid json'

    const { result } = renderHook(() => useLocalStorage('bad-key', 'fallback'))

    expect(result.current[0]).toBe('fallback')
  })

  it('handles null initial value', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('nullable', null))

    expect(result.current[0]).toBeNull()

    act(() => {
      result.current[1]('not null')
    })

    expect(result.current[0]).toBe('not null')
  })

  it('uses the correct key for storage operations', () => {
    const { result } = renderHook(() => useLocalStorage('specific-key', 'value'))

    act(() => {
      result.current[1]('new-value')
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('specific-key', expect.any(String))
  })

  it('reads from localStorage on initial render', () => {
    store['existing'] = JSON.stringify(42)

    renderHook(() => useLocalStorage('existing', 0))

    expect(localStorageMock.getItem).toHaveBeenCalledWith('existing')
  })
})
