import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGeolocation } from '@/hooks/useGeolocation'

// ---------------------------------------------------------------------------
// Mock geolocation API
// ---------------------------------------------------------------------------

const mockGetCurrentPosition = vi.fn()
const mockWatchPosition = vi.fn()
const mockClearWatch = vi.fn()

function setupGeolocation() {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: mockGetCurrentPosition,
      watchPosition: mockWatchPosition,
      clearWatch: mockClearWatch,
    },
    writable: true,
    configurable: true,
  })
}

function removeGeolocation() {
  Object.defineProperty(navigator, 'geolocation', {
    value: undefined,
    writable: true,
    configurable: true,
  })
}

function makePosition(lat: number, lng: number, accuracy: number = 10): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({
        latitude: lat,
        longitude: lng,
        accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      }),
    },
    timestamp: Date.now(),
    toJSON() {
      return { coords: this.coords, timestamp: this.timestamp }
    },
  }
}

function makeError(code: number): GeolocationPositionError {
  return {
    code,
    message: 'mock error',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupGeolocation()
  })

  afterEach(() => {
    setupGeolocation() // restore for safety
  })

  it('returns correct initial state', () => {
    const { result } = renderHook(() => useGeolocation())

    expect(result.current.latitude).toBeNull()
    expect(result.current.longitude).toBeNull()
    expect(result.current.accuracy).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.isWatching).toBe(false)
    expect(typeof result.current.getLocation).toBe('function')
    expect(typeof result.current.clearWatch).toBe('function')
  })

  it('sets loading to true when getLocation is called', () => {
    mockGetCurrentPosition.mockImplementation(() => {
      // do not call success/error — keep loading
    })

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.getLocation()
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('updates state on successful position', () => {
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
      success(makePosition(40.7128, -74.006, 15))
    })

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.getLocation()
    })

    expect(result.current.latitude).toBe(40.7128)
    expect(result.current.longitude).toBe(-74.006)
    expect(result.current.accuracy).toBe(15)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles PERMISSION_DENIED error', () => {
    mockGetCurrentPosition.mockImplementation(
      (_s: PositionCallback, error: PositionErrorCallback) => {
        error(makeError(1))
      }
    )

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.getLocation()
    })

    expect(result.current.error).toContain('denied access')
    expect(result.current.loading).toBe(false)
  })

  it('handles POSITION_UNAVAILABLE error', () => {
    mockGetCurrentPosition.mockImplementation(
      (_s: PositionCallback, error: PositionErrorCallback) => {
        error(makeError(2))
      }
    )

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.getLocation()
    })

    expect(result.current.error).toContain('unavailable')
    expect(result.current.loading).toBe(false)
  })

  it('handles TIMEOUT error', () => {
    mockGetCurrentPosition.mockImplementation(
      (_s: PositionCallback, error: PositionErrorCallback) => {
        error(makeError(3))
      }
    )

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.getLocation()
    })

    expect(result.current.error).toContain('timed out')
    expect(result.current.loading).toBe(false)
  })

  it('handles browser without geolocation support', () => {
    removeGeolocation()

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.getLocation()
    })

    expect(result.current.error).toContain('not supported')
    expect(result.current.loading).toBe(false)

    // Restore for other tests
    setupGeolocation()
  })

  it('passes options to getCurrentPosition', () => {
    mockGetCurrentPosition.mockImplementation(() => {})

    const { result } = renderHook(() =>
      useGeolocation({ enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 })
    )

    act(() => {
      result.current.getLocation()
    })

    expect(mockGetCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    )
  })

  it('uses watchPosition when watch option is true', () => {
    mockWatchPosition.mockReturnValue(42)

    const { result } = renderHook(() => useGeolocation({ watch: true }))

    act(() => {
      result.current.getLocation()
    })

    expect(mockWatchPosition).toHaveBeenCalled()
    expect(mockGetCurrentPosition).not.toHaveBeenCalled()
  })

  it('clearWatch stops watching', () => {
    mockWatchPosition.mockReturnValue(42)

    const { result } = renderHook(() => useGeolocation({ watch: true }))

    act(() => {
      result.current.getLocation()
    })

    // After getLocation, isWatching should become true on next render
    // clearWatch should call navigator.geolocation.clearWatch
    act(() => {
      result.current.clearWatch()
    })

    expect(mockClearWatch).toHaveBeenCalledWith(42)
  })

  it('cleans up watch on unmount', () => {
    mockWatchPosition.mockReturnValue(99)

    const { result, unmount } = renderHook(() => useGeolocation({ watch: true }))

    act(() => {
      result.current.getLocation()
    })
    unmount()

    expect(mockClearWatch).toHaveBeenCalledWith(99)
  })

  it('preserves previous coordinates on error', () => {
    // First: success
    mockGetCurrentPosition.mockImplementationOnce((success: PositionCallback) => {
      success(makePosition(34.0522, -118.2437))
    })

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.getLocation()
    })
    expect(result.current.latitude).toBe(34.0522)

    // Second: error — lat/lng are reset because handleError spreads prev
    mockGetCurrentPosition.mockImplementationOnce(
      (_s: PositionCallback, error: PositionErrorCallback) => {
        error(makeError(3))
      }
    )

    act(() => {
      result.current.getLocation()
    })

    // The error handler uses ...prev, so coords remain
    expect(result.current.latitude).toBe(34.0522)
    expect(result.current.error).toContain('timed out')
  })
})
