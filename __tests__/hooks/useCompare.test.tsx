import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'

// Mock the Toast component to avoid rendering issues
vi.mock('@/components/ui/Toast', () => ({
  ToastContainer: () => null,
}))

import { useCompare } from '@/hooks/useCompare'
import { CompareProviderWrapper } from '@/components/compare/CompareProvider'
import type { CompareProvider } from '@/components/compare/CompareProvider'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAttorney(overrides: Partial<CompareProvider> = {}): CompareProvider {
  const id = overrides.id ?? `att-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    name: `Attorney ${id}`,
    slug: `attorney-${id}`,
    ...overrides,
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(CompareProviderWrapper, null, children)
}

// ---------------------------------------------------------------------------
// Without provider (noop context)
// ---------------------------------------------------------------------------

describe('useCompare (without provider)', () => {
  it('returns noop context when used outside provider', () => {
    const { result } = renderHook(() => useCompare())

    expect(result.current.compareList).toEqual([])
    expect(result.current.isInCompare('any-id')).toBe(false)
    expect(typeof result.current.addToCompare).toBe('function')
    expect(typeof result.current.removeFromCompare).toBe('function')
    expect(typeof result.current.clearCompare).toBe('function')
  })

  it('noop addToCompare does not throw', () => {
    const { result } = renderHook(() => useCompare())

    expect(() => {
      result.current.addToCompare(makeAttorney())
    }).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// With provider
// ---------------------------------------------------------------------------

describe('useCompare (with provider)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty compare list', () => {
    const { result } = renderHook(() => useCompare(), { wrapper })

    expect(result.current.compareList).toEqual([])
  })

  it('adds an attorney to the compare list', () => {
    const { result } = renderHook(() => useCompare(), { wrapper })
    const attorney = makeAttorney({ id: 'att-1', name: 'John Doe' })

    act(() => {
      result.current.addToCompare(attorney)
    })

    expect(result.current.compareList).toHaveLength(1)
    expect(result.current.compareList[0].id).toBe('att-1')
  })

  it('does not add duplicates', () => {
    const { result } = renderHook(() => useCompare(), { wrapper })
    const attorney = makeAttorney({ id: 'att-1' })

    act(() => {
      result.current.addToCompare(attorney)
      result.current.addToCompare(attorney)
    })

    expect(result.current.compareList).toHaveLength(1)
  })

  it('enforces maximum of 4 attorneys', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useCompare(), { wrapper })

    act(() => {
      result.current.addToCompare(makeAttorney({ id: '1' }))
      result.current.addToCompare(makeAttorney({ id: '2' }))
      result.current.addToCompare(makeAttorney({ id: '3' }))
      result.current.addToCompare(makeAttorney({ id: '4' }))
      result.current.addToCompare(makeAttorney({ id: '5' }))
    })

    // Flush the setTimeout used for the warning toast
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.compareList).toHaveLength(4)
    expect(result.current.compareList.map((a) => a.id)).toEqual(['1', '2', '3', '4'])

    vi.useRealTimers()
  })

  it('removes an attorney from the compare list', () => {
    const { result } = renderHook(() => useCompare(), { wrapper })

    act(() => {
      result.current.addToCompare(makeAttorney({ id: 'att-1' }))
      result.current.addToCompare(makeAttorney({ id: 'att-2' }))
    })

    act(() => {
      result.current.removeFromCompare('att-1')
    })

    expect(result.current.compareList).toHaveLength(1)
    expect(result.current.compareList[0].id).toBe('att-2')
  })

  it('isInCompare returns true for added attorneys', () => {
    const { result } = renderHook(() => useCompare(), { wrapper })

    act(() => {
      result.current.addToCompare(makeAttorney({ id: 'att-1' }))
    })

    expect(result.current.isInCompare('att-1')).toBe(true)
    expect(result.current.isInCompare('att-999')).toBe(false)
  })

  it('clearCompare removes all attorneys', () => {
    const { result } = renderHook(() => useCompare(), { wrapper })

    act(() => {
      result.current.addToCompare(makeAttorney({ id: '1' }))
      result.current.addToCompare(makeAttorney({ id: '2' }))
    })

    expect(result.current.compareList).toHaveLength(2)

    act(() => {
      result.current.clearCompare()
    })

    expect(result.current.compareList).toEqual([])
  })

  it('removeFromCompare is a no-op for non-existent attorney', () => {
    const { result } = renderHook(() => useCompare(), { wrapper })

    act(() => {
      result.current.addToCompare(makeAttorney({ id: 'att-1' }))
    })

    act(() => {
      result.current.removeFromCompare('non-existent')
    })

    expect(result.current.compareList).toHaveLength(1)
  })
})
