import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce, useDebouncedCallback, useThrottledCallback } from '@/hooks/useDebounce'

// ---------------------------------------------------------------------------
// useDebounce
// ---------------------------------------------------------------------------

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('does not update the debounced value before the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    )

    rerender({ value: 'b', delay: 500 })
    act(() => { vi.advanceTimersByTime(200) })

    expect(result.current).toBe('a')
  })

  it('updates the debounced value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    )

    rerender({ value: 'b', delay: 300 })
    act(() => { vi.advanceTimersByTime(300) })

    expect(result.current).toBe('b')
  })

  it('resets the timer when value changes before delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(200) })

    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(200) })

    // Only 200ms since last change, should still be 'a'
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('c')
  })

  it('uses default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 1 } }
    )

    rerender({ value: 2 })
    act(() => { vi.advanceTimersByTime(299) })
    expect(result.current).toBe(1)

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe(2)
  })

  it('handles numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    )

    rerender({ value: 42 })
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe(42)
  })

  it('handles object values', () => {
    const obj1 = { x: 1 }
    const obj2 = { x: 2 }

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: obj1 } }
    )

    rerender({ value: obj2 })
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toEqual({ x: 2 })
  })

  it('handles null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'test' as string | null } }
    )

    rerender({ value: null })
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBeNull()
  })

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('respects delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    )

    rerender({ value: 'b', delay: 100 })
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('b')
  })
})

// ---------------------------------------------------------------------------
// useDebouncedCallback
// ---------------------------------------------------------------------------

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call the callback before the delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    act(() => { result.current('arg1') })
    expect(callback).not.toHaveBeenCalled()
  })

  it('calls the callback after the delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    act(() => { result.current('arg1') })
    act(() => { vi.advanceTimersByTime(300) })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith('arg1')
  })

  it('resets the timer on rapid calls', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    act(() => { result.current('a') })
    act(() => { vi.advanceTimersByTime(200) })
    act(() => { result.current('b') })
    act(() => { vi.advanceTimersByTime(300) })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith('b')
  })

  it('cleans up timeout on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300))

    act(() => { result.current('test') })
    unmount()

    act(() => { vi.advanceTimersByTime(300) })
    expect(callback).not.toHaveBeenCalled()
  })

  it('uses default delay of 300ms', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback))

    act(() => { result.current() })
    act(() => { vi.advanceTimersByTime(300) })

    expect(callback).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// useThrottledCallback
// ---------------------------------------------------------------------------

describe('useThrottledCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls the callback immediately on first invocation', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottledCallback(callback, 300))

    act(() => { result.current('first') })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith('first')
  })

  it('throttles subsequent calls within the limit', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottledCallback(callback, 300))

    act(() => { result.current('a') })
    act(() => { result.current('b') })
    act(() => { result.current('c') })

    // Only the first call should fire immediately
    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith('a')
  })

  it('calls the last queued invocation after the throttle period', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottledCallback(callback, 300))

    act(() => { result.current('a') })
    act(() => { result.current('b') })
    act(() => { result.current('c') })

    act(() => { vi.advanceTimersByTime(300) })

    // First call + trailing call with last args
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('c')
  })

  it('uses default limit of 300ms', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottledCallback(callback))

    act(() => { result.current() })
    act(() => { result.current() })

    expect(callback).toHaveBeenCalledOnce()

    act(() => { vi.advanceTimersByTime(300) })
    expect(callback).toHaveBeenCalledTimes(2)
  })
})
