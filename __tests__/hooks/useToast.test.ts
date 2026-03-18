import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty toasts array', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('addToast adds a toast and returns an id', () => {
    const { result } = renderHook(() => useToast())

    let id: string = ''
    act(() => {
      id = result.current.addToast({ type: 'info', title: 'Hello' })
    })

    expect(id).toBeTruthy()
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Hello')
    expect(result.current.toasts[0].type).toBe('info')
  })

  it('removeToast removes a specific toast', () => {
    const { result } = renderHook(() => useToast())

    let id: string = ''
    act(() => {
      id = result.current.addToast({ type: 'info', title: 'Remove me' })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.removeToast(id)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('clearToasts removes all toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({ type: 'info', title: 'One' })
      result.current.addToast({ type: 'warning', title: 'Two' })
      result.current.addToast({ type: 'error', title: 'Three' })
    })

    expect(result.current.toasts).toHaveLength(3)

    act(() => {
      result.current.clearToasts()
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('auto-removes toast after default duration (5000ms)', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({ type: 'info', title: 'Auto-dismiss' })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('auto-removes toast after custom duration', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({ type: 'info', title: 'Quick', duration: 1000 })
    })

    act(() => {
      vi.advanceTimersByTime(999)
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('does not auto-remove toast when duration is 0', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({ type: 'info', title: 'Sticky', duration: 0 })
    })

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(result.current.toasts).toHaveLength(1)
  })

  it('success() creates a success toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Done!', 'All good')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].type).toBe('success')
    expect(result.current.toasts[0].title).toBe('Done!')
    expect(result.current.toasts[0].message).toBe('All good')
  })

  it('error() creates an error toast with 8000ms duration', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.error('Failed')
    })

    expect(result.current.toasts[0].type).toBe('error')

    // Should still be visible after 5s
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.toasts).toHaveLength(1)

    // Should be removed after 8s
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('warning() creates a warning toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.warning('Watch out')
    })

    expect(result.current.toasts[0].type).toBe('warning')
    expect(result.current.toasts[0].title).toBe('Watch out')
  })

  it('info() creates an info toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.info('FYI', 'Details here')
    })

    expect(result.current.toasts[0].type).toBe('info')
    expect(result.current.toasts[0].title).toBe('FYI')
    expect(result.current.toasts[0].message).toBe('Details here')
  })

  it('supports toast with action', () => {
    const onClick = vi.fn()
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({
        type: 'info',
        title: 'Undo?',
        action: { label: 'Undo', onClick },
      })
    })

    expect(result.current.toasts[0].action?.label).toBe('Undo')
    result.current.toasts[0].action?.onClick()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('clears timers on unmount to prevent memory leaks', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    const { result, unmount } = renderHook(() => useToast())

    act(() => {
      result.current.addToast({ type: 'info', title: 'A' })
      result.current.addToast({ type: 'info', title: 'B' })
    })

    unmount()

    // clearTimeout should have been called for each active timer
    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
