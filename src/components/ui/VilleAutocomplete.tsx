'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, Navigation, X } from 'lucide-react'

// Simple client-side city autocomplete
interface CitySuggestion {
  id: string
  city: string
  context: string
  label: string
  postcode: string
  coordinates: [number, number]
}

// TODO: Replace with US geocoding service (Census Geocoder, Google Places, or Mapbox)
// French data.gouv.fr API removed — does not serve US locations
async function searchCities(_query: string): Promise<CitySuggestion[]> {
  return []
}

async function getLocationFromCoords(_lon: number, _lat: number): Promise<CitySuggestion | null> {
  return null
}

interface CityAutocompleteProps {
  value?: string
  placeholder?: string
  onSelect: (city: string, zipCode: string, coords?: [number, number]) => void
  onClear?: () => void
  showGeolocation?: boolean
  className?: string
  inputClassName?: string
  disabled?: boolean
}

export function CityAutocomplete({
  value = '',
  placeholder = 'City, state, or ZIP code...',
  onSelect,
  onClear,
  showGeolocation = true,
  className = '',
  inputClassName = '',
  disabled = false
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with external value
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search - direct API call
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      const results = await searchCities(query)
      setSuggestions(results)
      setIsOpen(results.length > 0)
      setHighlightedIndex(-1)
      setIsLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Handle selection
  const handleSelect = useCallback((suggestion: CitySuggestion) => {
    setQuery(suggestion.city)
    setIsOpen(false)
    setSuggestions([])
    onSelect(suggestion.city, suggestion.postcode, suggestion.coordinates)
  }, [onSelect])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Geolocation
  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await getLocationFromCoords(
            position.coords.longitude,
            position.coords.latitude
          )

          if (result) {
            setQuery(result.city)
            onSelect(result.city, result.postcode, result.coordinates)
          }
        } catch {
          // Ignore errors
        } finally {
          setIsLocating(false)
        }
      },
      () => {
        setIsLocating(false)
        alert('Unable to get your location')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Clear input
  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
    onClear?.()
  }

  // Popular cities for quick selection
  const popularCities = [
    { name: 'New York', postcode: '10001' },
    { name: 'Los Angeles', postcode: '90001' },
    { name: 'Chicago', postcode: '60601' },
    { name: 'Houston', postcode: '77001' },
    { name: 'Miami', postcode: '33101' },
    { name: 'Dallas', postcode: '75201' },
  ]

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.length >= 2) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLocating}
          className={`
            w-full pl-10 pr-20 py-3
            bg-white border border-gray-200 rounded-xl
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            placeholder:text-gray-400 text-gray-900
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-all
            ${inputClassName}
          `}
          autoComplete="off"
        />

        {/* Left icon */}
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

        {/* Right actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Loading indicator */}
          {isLoading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          )}

          {/* Clear button */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Clear"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Geolocation button */}
          {showGeolocation && (
            <button
              type="button"
              onClick={handleGeolocation}
              disabled={isLocating || disabled}
              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Use my location"
              title="Use my location"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-blue-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul
          className="
            absolute z-50 w-full mt-1
            bg-white border border-gray-200 rounded-xl
            shadow-lg max-h-64 overflow-y-auto
          "
          role="listbox"
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  px-4 py-3 cursor-pointer
                  flex items-center gap-3
                  transition-colors
                  ${index === highlightedIndex
                    ? 'bg-blue-50 text-blue-900'
                    : 'hover:bg-gray-50 text-gray-900'
                  }
                  ${index === 0 ? 'rounded-t-xl' : ''}
                  ${index === suggestions.length - 1 ? 'rounded-b-xl' : ''}
                `}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <MapPin className={`w-4 h-4 flex-shrink-0 ${
                  index === highlightedIndex ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {suggestion.city}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.postcode} - {suggestion.context}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Popular cities
              </div>
              <div className="grid grid-cols-2 gap-1">
                {popularCities.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => {
                      setQuery(city.name)
                      setIsOpen(false)
                      onSelect(city.name, city.postcode)
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg text-left transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{city.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </ul>
      )}
    </div>
  )
}
