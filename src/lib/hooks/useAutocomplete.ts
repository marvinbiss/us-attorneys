'use client'

/**
 * STUB — Autocomplete hooks (originally used French gov API adresse.data.gouv.fr).
 * All hooks return no-op values for backward compatibility.
 * TODO: Replace with US address/geocoding APIs (USPS, Google Places, etc.)
 */

import { useState, useCallback } from 'react'

// Minimal type stubs for backward compatibility
interface AdresseSuggestion {
  id: string
  label: string
  name: string
  city: string
  postcode: string
  citycode: string
  context: string
  type: 'housenumber' | 'street' | 'locality' | 'municipality'
  coordinates: [number, number]
  importance: number
  score: number
}

interface UseAutocompleteResult {
  query: string
  setQuery: (value: string) => void
  suggestions: AdresseSuggestion[]
  isLoading: boolean
  error: Error | null
  selected: AdresseSuggestion | null
  select: (suggestion: AdresseSuggestion) => void
  clear: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

interface UseAutocompleteOptions {
  minLength?: number
  debounce?: number
  limit?: number
  type?: 'housenumber' | 'street' | 'locality' | 'municipality'
  postcode?: string
  proximity?: { lat: number; lon: number }
}

function useNoopAutocomplete(): UseAutocompleteResult {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  return {
    query,
    setQuery,
    suggestions: [],
    isLoading: false,
    error: null,
    selected: null,
    select: () => {},
    clear: useCallback(() => { setQuery(''); setIsOpen(false) }, []),
    isOpen,
    setIsOpen,
  }
}

export function useAddressAutocomplete(_options?: UseAutocompleteOptions): UseAutocompleteResult {
  return useNoopAutocomplete()
}

export function useCityAutocomplete(_options?: Omit<UseAutocompleteOptions, 'type'>): UseAutocompleteResult {
  return useNoopAutocomplete()
}

export function usePostalCodeLookup() {
  const [postalCode, setPostalCode] = useState('')
  return {
    postalCode,
    setPostalCode,
    cities: [] as AdresseSuggestion[],
    isLoading: false,
    error: null as Error | null,
    clear: () => setPostalCode(''),
  }
}

export function useBarNumberValidation() {
  const [barNumber, setBarNumber] = useState('')
  return {
    barNumber,
    setBarNumber: (value: string) => setBarNumber(value.replace(/\D/g, '').slice(0, 14)),
    rawBarNumber: barNumber.replace(/\s/g, ''),
    isValid: null as boolean | null,
    isLoading: false,
    error: null as string | null,
    companyInfo: null as { name: string; active: boolean } | null,
    clear: () => setBarNumber(''),
  }
}

/** @deprecated Use useBarNumberValidation instead */
export const useSiretValidation = useBarNumberValidation

export function useGeolocation() {
  return {
    coordinates: null as { lat: number; lon: number } | null,
    address: null as string | null,
    isLoading: false,
    error: null as string | null,
    getCurrentPosition: () => {},
    clear: () => {},
  }
}
