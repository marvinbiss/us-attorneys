'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ArrowRight, Clock, TrendingUp, X, Navigation, Wrench } from 'lucide-react'
import { searchServices as allServices } from '@/lib/data/usa-search-data'

// ── Autocomplete types ──────────────────────────────────────────────
interface AutocompleteResult {
  attorneys: Array<{
    type: 'attorney'
    name: string
    slug: string
    stable_id: string | null
    city: string | null
    state: string | null
    specialty: string | null
  }>
  locations: Array<{
    type: 'location'
    name: string
    slug: string
    state_name: string | null
    state_abbr: string | null
    population: number | null
  }>
  specialties: Array<{
    type: 'specialty'
    name: string
    slug: string
    category: string | null
  }>
}

interface CitySuggestion {
  city: string
  context: string
  label: string
  postcode: string
  slug?: string
}

/**
 * Call the autocomplete API and map location results to CitySuggestion format.
 * Returns locations from the DB (real cities with state context).
 */
async function searchCities(query: string): Promise<CitySuggestion[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query.trim())}`)
    if (!response.ok) return []

    const data: AutocompleteResult = await response.json()

    return (data.locations || []).map((loc) => ({
      city: loc.name,
      context: loc.state_name ? `${loc.state_name} (${loc.state_abbr})` : '',
      label: loc.state_abbr ? `${loc.name}, ${loc.state_abbr}` : loc.name,
      postcode: '',
      slug: loc.slug,
    }))
  } catch {
    return []
  }
}

/**
 * Reverse geocode coordinates to a city name using Nominatim.
 */
async function getLocationFromCoords(lon: number, lat: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lon=${lon}&lat=${lat}`
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.address?.city || data.address?.town || null
  } catch {
    return null
  }
}

interface SearchBarProps {
  variant?: 'hero' | 'header' | 'page'
  className?: string
  onSearch?: (query: string, location: string) => void
}

// Normalize text for fuzzy matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
}

// Get recent searches from localStorage
function getRecentSearches(): Array<{ service: string; location: string }> {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('recentSearches')
    return stored ? JSON.parse(stored).slice(0, 5) : []
  } catch {
    return []
  }
}

// Save search to localStorage
function saveRecentSearch(service: string, location: string) {
  if (typeof window === 'undefined' || (!service && !location)) return
  try {
    const searches = getRecentSearches()
    const newSearch = { service, location }
    const filtered = searches.filter(
      s => s.service !== service || s.location !== location
    )
    const updated = [newSearch, ...filtered].slice(0, 5)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  } catch {
    // Ignore storage errors
  }
}

export function SearchBar({ variant = 'hero', className = '', onSearch }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [serviceSuggestions, setServiceSuggestions] = useState<typeof allServices>([])
  const [locationSuggestions, setLocationSuggestions] = useState<CitySuggestion[]>([])
  const [highlightedServiceIndex, setHighlightedServiceIndex] = useState(-1)
  const [highlightedLocationIndex, setHighlightedLocationIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<Array<{ service: string; location: string }>>([])

  const serviceInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowServiceSuggestions(false)
        setShowLocationSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter services based on query
  useEffect(() => {
    if (!query.trim()) {
      setServiceSuggestions([])
      return
    }

    const normalized = normalizeText(query)
    const filtered = allServices.filter(s =>
      normalizeText(s.name).includes(normalized) ||
      normalizeText(s.slug).includes(normalized)
    ).slice(0, 6)

    setServiceSuggestions(filtered)
    setHighlightedServiceIndex(-1)
  }, [query])

  // Debounced location search via API
  useEffect(() => {
    if (location.length < 2) {
      setLocationSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(location)
        setLocationSuggestions(results)
        setHighlightedLocationIndex(-1)
      } catch {
        setLocationSuggestions([])
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [location])

  // Geolocation
  const handleGeolocate = useCallback(async () => {
    if (!navigator.geolocation) return

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const city = await getLocationFromCoords(
            position.coords.longitude,
            position.coords.latitude
          )
          if (city) {
            setLocation(city)
            setShowLocationSuggestions(false)
          }
        } catch {
          // Ignore errors
        } finally {
          setIsLocating(false)
        }
      },
      () => {
        setIsLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  // Submit handler
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()

    if (onSearch) {
      onSearch(query, location)
    } else {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (location) params.set('location', location)

      if (query || location) {
        saveRecentSearch(query, location)
        setRecentSearches(getRecentSearches())
        router.push(`/search?${params.toString()}`)
      }
    }

    setShowServiceSuggestions(false)
    setShowLocationSuggestions(false)
  }, [query, location, onSearch, router])

  // Select a service
  const selectService = useCallback((service: typeof allServices[0]) => {
    setQuery(service.name)
    setShowServiceSuggestions(false)
    setServiceSuggestions([])
    locationInputRef.current?.focus()
  }, [])

  // Select a location
  const selectLocation = useCallback((loc: CitySuggestion) => {
    setLocation(loc.city)
    setShowLocationSuggestions(false)
    setLocationSuggestions([])
    // Auto-submit after location selection
    setTimeout(() => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      params.set('location', loc.city)
      saveRecentSearch(query, loc.city)
      setRecentSearches(getRecentSearches())
      router.push(`/search?${params.toString()}`)
    }, 100)
  }, [query, router])

  // Apply recent search
  const applyRecentSearch = useCallback((search: { service: string; location: string }) => {
    setQuery(search.service)
    setLocation(search.location)
    const params = new URLSearchParams()
    if (search.service) params.set('q', search.service)
    if (search.location) params.set('location', search.location)
    router.push(`/search?${params.toString()}`)
    setShowServiceSuggestions(false)
    setShowLocationSuggestions(false)
  }, [router])

  // Keyboard navigation for service input
  const handleServiceKeyDown = (e: React.KeyboardEvent) => {
    const suggestions = serviceSuggestions.length > 0 ? serviceSuggestions : []

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedServiceIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedServiceIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedServiceIndex >= 0 && suggestions[highlightedServiceIndex]) {
          selectService(suggestions[highlightedServiceIndex])
        } else if (!showServiceSuggestions || suggestions.length === 0) {
          handleSubmit()
        }
        break
      case 'Escape':
        setShowServiceSuggestions(false)
        break
      case 'Tab':
        setShowServiceSuggestions(false)
        break
    }
  }

  // Keyboard navigation for location input
  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedLocationIndex(prev =>
          prev < locationSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedLocationIndex(prev =>
          prev > 0 ? prev - 1 : locationSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedLocationIndex >= 0 && locationSuggestions[highlightedLocationIndex]) {
          selectLocation(locationSuggestions[highlightedLocationIndex])
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        setShowLocationSuggestions(false)
        break
    }
  }

  const isHero = variant === 'hero'

  // Popular services for initial display
  const popularServices = allServices.slice(0, 6)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className={`
          ${isHero ? 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-4 md:p-5 border border-white/20 dark:border-gray-700/50' : ''}
          ${variant === 'page' ? 'bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 border border-gray-100 dark:border-gray-700' : ''}
        `}>
          <div className="flex flex-col md:flex-row gap-3">
            {/* Service field */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={serviceInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowServiceSuggestions(true)}
                onKeyDown={handleServiceKeyDown}
                placeholder="What service are you looking for?"
                className="w-full pl-12 pr-10 py-4 bg-gray-100/80 dark:bg-gray-700/80 border-2 border-transparent rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    serviceInputRef.current?.focus()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Service suggestions dropdown */}
              {showServiceSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                  {/* Recent searches */}
                  {recentSearches.length > 0 && !query && (
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        <Clock className="w-3 h-3" />
                        Recent searches
                      </div>
                      {recentSearches.slice(0, 3).map((search, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyRecentSearch(search)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-left transition-colors"
                        >
                          <Clock className="w-4 h-4 text-gray-300 dark:text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {search.service || 'All'}{search.location && ` · ${search.location}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Service suggestions */}
                  {serviceSuggestions.length > 0 ? (
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {serviceSuggestions.map((service, idx) => (
                        <button
                          key={service.slug}
                          type="button"
                          onClick={() => selectService(service)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                            idx === highlightedServiceIndex
                              ? 'bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            idx === highlightedServiceIndex ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <Wrench className={`w-5 h-5 ${idx === highlightedServiceIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${idx === highlightedServiceIndex ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                              {service.name}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : !query && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        <TrendingUp className="w-3 h-3" />
                        Popular services
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {popularServices.map((service) => (
                          <button
                            key={service.slug}
                            type="button"
                            onClick={() => selectService(service)}
                            className="flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-left transition-colors"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 rounded-lg flex items-center justify-center">
                              <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{service.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location field */}
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={locationInputRef}
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  setShowLocationSuggestions(true)
                }}
                onFocus={() => setShowLocationSuggestions(true)}
                onKeyDown={handleLocationKeyDown}
                placeholder="City or ZIP code"
                className="w-full pl-12 pr-12 py-4 bg-gray-100/80 dark:bg-gray-700/80 border-2 border-transparent rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                autoComplete="off"
              />

              {/* Geolocation button */}
              <button
                type="button"
                onClick={handleGeolocate}
                disabled={isLocating}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                title="Use my location"
              >
                {isLocating ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
              </button>

              {/* Location suggestions dropdown */}
              {showLocationSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                  {locationSuggestions.length > 0 ? (
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {locationSuggestions.map((loc, idx) => (
                        <button
                          key={loc.label}
                          type="button"
                          onClick={() => selectLocation(loc)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                            idx === highlightedLocationIndex
                              ? 'bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            idx === highlightedLocationIndex ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <MapPin className={`w-5 h-5 ${idx === highlightedLocationIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${idx === highlightedLocationIndex ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                              {loc.city}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{loc.context}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Popular cities when empty */
                    <div className="p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        <MapPin className="w-3 h-3" />
                        Popular cities
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { name: 'New York', slug: 'new-york' },
                          { name: 'Los Angeles', slug: 'los-angeles' },
                          { name: 'Chicago', slug: 'chicago' },
                          { name: 'Houston', slug: 'houston' },
                          { name: 'Phoenix', slug: 'phoenix' },
                          { name: 'Philadelphia', slug: 'philadelphia' },
                          { name: 'San Antonio', slug: 'san-antonio' },
                          { name: 'San Diego', slug: 'san-diego' },
                        ].map((city) => (
                          <button
                            key={city.slug}
                            type="button"
                            onClick={() => {
                              setLocation(city.name)
                              setShowLocationSuggestions(false)
                              // Auto-submit
                              setTimeout(() => {
                                const params = new URLSearchParams()
                                if (query) params.set('q', query)
                                params.set('location', city.name)
                                saveRecentSearch(query, city.name)
                                setRecentSearches(getRecentSearches())
                                router.push(`/search?${params.toString()}`)
                              }, 100)
                            }}
                            className="flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-left transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{city.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="relative">Search</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
