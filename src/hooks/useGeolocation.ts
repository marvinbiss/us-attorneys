import { useState, useCallback, useEffect } from 'react'

const SESSION_KEY = 'us-attorneys:geolocation'

export interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
}

function getCachedLocation(): GeolocationState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Cache valid for 30 minutes
    if (Date.now() - parsed._ts > 30 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      accuracy: parsed.accuracy,
      error: null,
      loading: false,
    }
  } catch {
    return null
  }
}

function setCachedLocation(lat: number, lng: number, accuracy: number) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ latitude: lat, longitude: lng, accuracy, _ts: Date.now() })
    )
  } catch {
    // sessionStorage full or blocked — ignore
  }
}

/**
 * World-class geolocation hook with error handling and sessionStorage caching.
 * Does NOT auto-prompt — call `requestPermission()` on user action only.
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes browser cache
    watch = false,
  } = options

  const [state, setState] = useState<GeolocationState>(() => {
    const cached = getCachedLocation()
    return cached || {
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
      loading: false,
    }
  })

  const [watchId, setWatchId] = useState<number | null>(null)

  // Hydrate from sessionStorage on mount (SSR-safe)
  useEffect(() => {
    const cached = getCachedLocation()
    if (cached && cached.latitude !== null) {
      setState(cached)
    }
  }, [])

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords
    setCachedLocation(latitude, longitude, accuracy)
    setState({
      latitude,
      longitude,
      accuracy,
      error: null,
      loading: false,
    })
  }, [])

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'An error occurred while retrieving your location'

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'You have denied access to your location. Please enable geolocation in your browser settings.'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Your position is currently unavailable.'
        break
      case error.TIMEOUT:
        errorMessage = 'The geolocation request timed out. Please try again.'
        break
    }

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }))
  }, [])

  /**
   * Explicitly request geolocation permission — call this from a button click only.
   * Never auto-invoked.
   */
  const requestPermission = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    if (watch) {
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      )
      setWatchId(id)
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      )
    }
  }, [enableHighAccuracy, timeout, maximumAge, watch, handleSuccess, handleError])

  const clearWatch = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [watchId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearWatch()
    }
  }, [clearWatch])

  // Convenience aliases
  const lat = state.latitude
  const lng = state.longitude
  const hasLocation = lat !== null && lng !== null

  return {
    ...state,
    lat,
    lng,
    hasLocation,
    requestPermission,
    /** @deprecated Use requestPermission() instead */
    getLocation: requestPermission,
    clearWatch,
    isWatching: watchId !== null,
  }
}
