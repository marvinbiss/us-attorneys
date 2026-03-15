'use client'

/**
 * Autocomplete Hooks
 * React hooks for address and city autocomplete with debouncing
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { autocompleteAdresse, autocompleteVille, type AdresseSuggestion } from '../api/adresse'

interface UseAutocompleteOptions {
  /** Minimum characters before searching */
  minLength?: number
  /** Debounce delay in ms */
  debounce?: number
  /** Maximum results to return */
  limit?: number
  /** Filter by type */
  type?: 'housenumber' | 'street' | 'locality' | 'municipality'
  /** Filter by postal code */
  postcode?: string
  /** Proximity coordinates for relevance */
  proximity?: { lat: number; lon: number }
}

interface UseAutocompleteResult {
  /** Current query value */
  query: string
  /** Set query value */
  setQuery: (value: string) => void
  /** Autocomplete suggestions */
  suggestions: AdresseSuggestion[]
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Selected suggestion */
  selected: AdresseSuggestion | null
  /** Select a suggestion */
  select: (suggestion: AdresseSuggestion) => void
  /** Clear everything */
  clear: () => void
  /** Is dropdown open */
  isOpen: boolean
  /** Set dropdown open state */
  setIsOpen: (open: boolean) => void
}

/**
 * Hook for address autocomplete
 */
export function useAddressAutocomplete(
  options: UseAutocompleteOptions = {}
): UseAutocompleteResult {
  const {
    minLength = 3,
    debounce: debounceMs = 300,
    limit = 5,
    type,
    postcode,
    proximity,
  } = options

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AdresseSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selected, setSelected] = useState<AdresseSuggestion | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Fetch suggestions with debounce
  useEffect(() => {
    // Cancel previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Don't search if query too short
    if (query.length < minLength) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Debounce the search
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      abortControllerRef.current = new AbortController()

      try {
        const results = await autocompleteAdresse(query, {
          limit,
          type,
          postcode,
          lat: proximity?.lat,
          lon: proximity?.lon,
        })

        setSuggestions(results)
        setIsOpen(results.length > 0)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err as Error)
          setSuggestions([])
        }
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)
  }, [query, minLength, debounceMs, limit, type, postcode, proximity?.lat, proximity?.lon])

  const select = useCallback((suggestion: AdresseSuggestion) => {
    setSelected(suggestion)
    setQuery(suggestion.label)
    setSuggestions([])
    setIsOpen(false)
  }, [])

  const clear = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setSelected(null)
    setError(null)
    setIsOpen(false)
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    selected,
    select,
    clear,
    isOpen,
    setIsOpen,
  }
}

/**
 * Hook for city-only autocomplete
 */
export function useCityAutocomplete(
  options: Omit<UseAutocompleteOptions, 'type'> = {}
): UseAutocompleteResult {
  const {
    minLength = 2,
    debounce: debounceMs = 300,
    limit = 10,
  } = options

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AdresseSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selected, setSelected] = useState<AdresseSuggestion | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length < minLength) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const results = await autocompleteVille(query, limit)
        setSuggestions(results)
        setIsOpen(results.length > 0)
      } catch (err) {
        setError(err as Error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)
  }, [query, minLength, debounceMs, limit])

  const select = useCallback((suggestion: AdresseSuggestion) => {
    setSelected(suggestion)
    setQuery(suggestion.city || suggestion.label)
    setSuggestions([])
    setIsOpen(false)
  }, [])

  const clear = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setSelected(null)
    setError(null)
    setIsOpen(false)
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    selected,
    select,
    clear,
    isOpen,
    setIsOpen,
  }
}

/**
 * Hook for postal code lookup
 */
export function usePostalCodeLookup() {
  const [postalCode, setPostalCode] = useState('')
  const [cities, setCities] = useState<AdresseSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (postalCode.length !== 5) {
      setCities([])
      return
    }

    const lookup = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { getLocationsByCodePostal } = await import('../api/adresse')
        const results = await getLocationsByCodePostal(postalCode)
        setCities(results)
      } catch (err) {
        setError(err as Error)
        setCities([])
      } finally {
        setIsLoading(false)
      }
    }

    lookup()
  }, [postalCode])

  return {
    postalCode,
    setPostalCode,
    cities,
    isLoading,
    error,
    clear: () => {
      setPostalCode('')
      setCities([])
      setError(null)
    },
  }
}

/**
 * Hook for SIRET validation with API verification
 */
export function useSiretValidation() {
  const [siret, setSiret] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyInfo, setCompanyInfo] = useState<{
    name: string
    active: boolean
  } | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Clean SIRET
    const cleanSiret = siret.replace(/\s/g, '')

    // Reset if not complete
    if (cleanSiret.length !== 14) {
      setIsValid(null)
      setError(null)
      setCompanyInfo(null)
      return
    }

    // Basic format check
    if (!/^\d{14}$/.test(cleanSiret)) {
      setIsValid(false)
      setError('Le SIRET doit contenir 14 chiffres')
      return
    }

    // Debounce API call
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { quickVerify } = await import('../services/verification.service')
        const result = await quickVerify(cleanSiret)

        setIsValid(result.valid)
        setError(result.valid ? null : result.message)
        setCompanyInfo(
          result.valid && result.companyName
            ? { name: result.companyName, active: result.active }
            : null
        )
      } catch (_err) {
        setIsValid(null)
        setError('Erreur de vérification')
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }, [siret])

  // Format SIRET as user types
  const setFormattedSiret = useCallback((value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '').slice(0, 14)

    // Format with spaces: XXX XXX XXX XXXXX
    if (digits.length <= 3) {
      setSiret(digits)
    } else if (digits.length <= 6) {
      setSiret(`${digits.slice(0, 3)} ${digits.slice(3)}`)
    } else if (digits.length <= 9) {
      setSiret(`${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`)
    } else {
      setSiret(`${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`)
    }
  }, [])

  return {
    siret,
    setSiret: setFormattedSiret,
    rawSiret: siret.replace(/\s/g, ''),
    isValid,
    isLoading,
    error,
    companyInfo,
    clear: () => {
      setSiret('')
      setIsValid(null)
      setError(null)
      setCompanyInfo(null)
    },
  }
}

/**
 * Hook for geolocation
 */
export function useGeolocation() {
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }
        setCoordinates(coords)

        // Reverse geocode
        try {
          const { reverseGeocode } = await import('../api/adresse')
          const result = await reverseGeocode(coords.lon, coords.lat)
          if (result) {
            setAddress(result.label)
          }
        } catch {
          // Ignore geocoding errors
        }

        setIsLoading(false)
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Accès à la géolocalisation refusé')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Position indisponible')
            break
          case err.TIMEOUT:
            setError('Délai de géolocalisation dépassé')
            break
          default:
            setError('Erreur de géolocalisation')
        }
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  return {
    coordinates,
    address,
    isLoading,
    error,
    getCurrentPosition,
    clear: () => {
      setCoordinates(null)
      setAddress(null)
      setError(null)
    },
  }
}
