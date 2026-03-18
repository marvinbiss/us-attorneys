'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ChevronDown } from 'lucide-react'
import { searchServices as services, searchCities as cities, type SearchCity as City } from '@/lib/data/usa-search-data'
import { trackEvent } from '@/lib/analytics/tracking'

interface SearchBarProps {
  size?: 'compact' | 'large'
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// ── Format population for display ───────────────────────────────────
function formatPopulation(pop: string): string {
  const cleaned = pop.replace(/\s/g, '')
  const num = parseInt(cleaned, 10)
  if (isNaN(num)) return pop
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.0', '')}M pop.`
  if (num >= 1_000) return `${Math.round(num / 1_000).toLocaleString('en-US')}k pop.`
  return `${num.toLocaleString('en-US')} pop.`
}

// ── Fuzzy city search with prioritized matching ─────────────────────
function searchCities(query: string, limit = 6): City[] {
  if (!query || query.length < 1) return []

  const normalized = normalizeText(query)

  const prefixMatches: City[] = []
  const containsMatches: City[] = []
  const postalMatches: City[] = []
  const deptMatches: City[] = []

  for (const v of cities) {
    const normalizedName = normalizeText(v.name)

    if (normalizedName.startsWith(normalized)) {
      prefixMatches.push(v)
    } else if (normalizedName.includes(normalized)) {
      containsMatches.push(v)
    } else if (v.zipCode.startsWith(query.trim())) {
      postalMatches.push(v)
    } else if (normalizeText(v.stateName).includes(normalized)) {
      deptMatches.push(v)
    }
  }

  const sortByPop = (a: City, b: City) => {
    const popA = parseInt(a.population.replace(/\s/g, ''), 10) || 0
    const popB = parseInt(b.population.replace(/\s/g, ''), 10) || 0
    return popB - popA
  }

  prefixMatches.sort(sortByPop)
  containsMatches.sort(sortByPop)
  postalMatches.sort(sortByPop)
  deptMatches.sort(sortByPop)

  return [...prefixMatches, ...containsMatches, ...postalMatches, ...deptMatches].slice(0, limit)
}

// ── Highlight matching text in a city name ──────────────────────────
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 1) return <>{text}</>

  const normalizedQuery = normalizeText(query)
  const normalizedText = normalizeText(text)
  const matchIndex = normalizedText.indexOf(normalizedQuery)

  if (matchIndex === -1) return <>{text}</>

  const before = text.slice(0, matchIndex)
  const match = text.slice(matchIndex, matchIndex + query.length)
  const after = text.slice(matchIndex + query.length)

  return (
    <>
      {before}
      <span className="font-bold text-blue-600">{match}</span>
      {after}
    </>
  )
}

// ── Popular cities for empty state ──────────────────────────────────
const popularCities: { name: string; slug: string; stateName: string; pop: string }[] = [
  { name: 'New York', slug: 'new-york', stateName: 'New York (NY)', pop: '8.3M' },
  { name: 'Los Angeles', slug: 'los-angeles', stateName: 'California (CA)', pop: '3.9M' },
  { name: 'Chicago', slug: 'chicago', stateName: 'Illinois (IL)', pop: '2.7M' },
  { name: 'Houston', slug: 'houston', stateName: 'Texas (TX)', pop: '2.3M' },
  { name: 'Phoenix', slug: 'phoenix', stateName: 'Arizona (AZ)', pop: '1.6M' },
  { name: 'Miami', slug: 'miami', stateName: 'Florida (FL)', pop: '442k' },
]

// ── Fallback cities for "no results" state ──────────────────────────
const fallbackCities = [
  { name: 'New York', dept: 'NY' },
  { name: 'Los Angeles', dept: 'CA' },
  { name: 'Chicago', dept: 'IL' },
  { name: 'Houston', dept: 'TX' },
  { name: 'Phoenix', dept: 'AZ' },
  { name: 'Miami', dept: 'FL' },
]

export default function SearchBar({ size = 'compact' }: SearchBarProps) {
  const router = useRouter()

  const [selectedService, setSelectedService] = useState('')
  const [specialtySlug, setServiceSlug] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [highlightedServiceIndex, setHighlightedServiceIndex] = useState(-1)
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const serviceButtonRef = useRef<HTMLButtonElement>(null)
  const serviceFilterRef = useRef<HTMLInputElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)

  // Filter services based on inline filter text
  const filteredServices = useMemo(() => {
    if (!serviceFilter.trim()) return services
    const normalized = normalizeText(serviceFilter)
    return services.filter(s =>
      normalizeText(s.name).includes(normalized) ||
      normalizeText(s.slug).includes(normalized)
    )
  }, [serviceFilter])

  // Filter cities based on query using prioritized fuzzy search
  const filteredCities = useMemo(() => {
    return searchCities(cityQuery, 6)
  }, [cityQuery])

  // Derived state for city dropdown display modes
  const hasTypedCity = cityQuery.trim().length >= 1
  const hasNoResults = hasTypedCity && filteredCities.length === 0

  // Navigable items for keyboard navigation (works across all dropdown states)
  const navigableCityItems = useMemo(() => {
    if (filteredCities.length > 0) return filteredCities
    if (!hasTypedCity) {
      // Return popular cities mapped to City objects
      return popularCities.map(pc => {
        const match = cities.find(v => v.slug === pc.slug)
        return match || { name: pc.name, slug: pc.slug, stateCode: '', stateName: '', population: '', zipCode: '' } as City
      })
    }
    return []
  }, [filteredCities, hasTypedCity])

  // Reset highlighted indices when lists change
  useEffect(() => {
    setHighlightedServiceIndex(-1)
  }, [filteredServices.length])

  useEffect(() => {
    setHighlightedCityIndex(-1)
  }, [filteredCities.length])

  // Focus filter input when dropdown opens
  useEffect(() => {
    if (showServiceDropdown && serviceFilterRef.current) {
      serviceFilterRef.current.focus()
    }
  }, [showServiceDropdown])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowServiceDropdown(false)
        setShowCityDropdown(false)
        setServiceFilter('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectService = useCallback((service: typeof services[0]) => {
    setSelectedService(service.name)
    setServiceSlug(service.slug)
    setShowServiceDropdown(false)
    setServiceFilter('')
    setHighlightedServiceIndex(-1)
    // Auto-focus city input
    setTimeout(() => cityInputRef.current?.focus(), 50)
  }, [])

  const handleSelectCity = useCallback((cityName: string) => {
    setCityQuery(cityName)
    setShowCityDropdown(false)
    setHighlightedCityIndex(-1)
  }, [])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!specialtySlug || !cityQuery.trim()) return

    const cityMatch = cities.find(
      v => normalizeText(v.name) === normalizeText(cityQuery.trim())
    )
    const citySlugValue = cityMatch ? cityMatch.slug : cityQuery.trim().toLowerCase()

    trackEvent('search_query', {
      service: specialtySlug,
      city: citySlugValue,
      service_name: selectedService,
      city_query: cityQuery.trim(),
    })

    router.push(`/practice-areas/${specialtySlug}/${citySlugValue}`)
    setShowServiceDropdown(false)
    setShowCityDropdown(false)
    setServiceFilter('')
  }, [specialtySlug, cityQuery, selectedService, router])

  // Keyboard navigation for service dropdown
  const handleServiceKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showServiceDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setShowServiceDropdown(true)
        return
      }
      return
    }

    const items = filteredServices
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedServiceIndex(prev => prev < items.length - 1 ? prev + 1 : 0)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedServiceIndex(prev => prev > 0 ? prev - 1 : items.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedServiceIndex >= 0 && items[highlightedServiceIndex]) {
          handleSelectService(items[highlightedServiceIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowServiceDropdown(false)
        setServiceFilter('')
        serviceButtonRef.current?.focus()
        break
      case 'Tab':
        setShowServiceDropdown(false)
        setServiceFilter('')
        break
    }
  }, [showServiceDropdown, filteredServices, highlightedServiceIndex, handleSelectService])

  // Keyboard navigation for city dropdown
  const handleCityKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showCityDropdown || navigableCityItems.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
      return
    }

    const items = navigableCityItems
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedCityIndex(prev => prev < items.length - 1 ? prev + 1 : 0)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedCityIndex(prev => prev > 0 ? prev - 1 : items.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedCityIndex >= 0 && items[highlightedCityIndex]) {
          handleSelectCity(items[highlightedCityIndex].name)
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowCityDropdown(false)
        break
    }
  }, [showCityDropdown, navigableCityItems, highlightedCityIndex, handleSelectCity, handleSubmit])

  const isLarge = size === 'large'

  return (
    <div ref={containerRef} className={`w-full ${isLarge ? 'max-w-3xl mx-auto' : ''}`}>
      <form onSubmit={handleSubmit} role="search" aria-label="Search for an attorney">
        <div
          className={`
            flex bg-white
            ${isLarge
              ? 'flex-col sm:flex-row rounded-2xl p-2 gap-2 shadow-lg'
              : 'flex-row rounded-full p-1 gap-1 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 focus-within:border-blue-400 focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-100 transition-all'
            }
          `}
        >
          {/* Service Dropdown */}
          <div className={`relative ${isLarge ? 'flex-1' : 'flex-1 min-w-0'}`}>
            <button
              ref={serviceButtonRef}
              type="button"
              onClick={() => {
                setShowServiceDropdown(!showServiceDropdown)
                setShowCityDropdown(false)
              }}
              onKeyDown={handleServiceKeyDown}
              aria-label="Choose a service"
              aria-expanded={showServiceDropdown}
              aria-haspopup="listbox"
              className={`
                w-full flex items-center gap-2 text-left transition-all
                ${isLarge
                  ? 'rounded-xl px-4 py-4 text-base border border-gray-200 bg-gray-50 hover:bg-gray-100'
                  : 'rounded-l-full pl-4 pr-2 py-2 text-sm bg-transparent hover:bg-gray-50'
                }
              `}
            >
              <Search className={`text-gray-400 flex-shrink-0 ${isLarge ? 'w-5 h-5' : 'w-4 h-4'}`} />
              <span className={`truncate ${selectedService ? 'text-gray-900 font-medium' : 'text-gray-400'} ${isLarge ? '' : 'text-sm'}`}>
                {selectedService || 'Practice area?'}
              </span>
              <ChevronDown className={`ml-auto text-gray-400 flex-shrink-0 transition-transform duration-200 ${showServiceDropdown ? 'rotate-180' : ''} ${isLarge ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
            </button>

            {/* Service Dropdown List */}
            {showServiceDropdown && (
              <div className={`absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden ${
                isLarge ? 'right-0 p-2' : 'w-64 p-1.5'
              }`}>
                {/* Inline filter */}
                <div className={`px-2 pb-1.5 ${isLarge ? 'pt-1' : 'pt-0.5'}`}>
                  <input
                    ref={serviceFilterRef}
                    type="text"
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    onKeyDown={handleServiceKeyDown}
                    placeholder="Filter..."
                    autoComplete="off"
                    className={`w-full bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 ${
                      isLarge ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'
                    }`}
                  />
                </div>
                <div className={`max-h-56 overflow-y-auto ${isLarge ? '' : 'max-h-48'}`}>
                  {filteredServices.length === 0 && (
                    <div className="px-3 py-4 text-center text-gray-400 text-xs">
                      No service found
                    </div>
                  )}
                  {filteredServices.map((service, idx) => {
                    const isHighlighted = idx === highlightedServiceIndex
                    return (
                      <button
                        key={service.slug}
                        type="button"
                        onClick={() => handleSelectService(service)}
                        onMouseEnter={() => setHighlightedServiceIndex(idx)}
                        className={`
                          w-full text-left rounded-lg transition-all duration-100
                          ${isHighlighted
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : specialtySlug === service.slug
                              ? 'bg-blue-50/50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }
                          ${isLarge ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'}
                        `}
                      >
                        {service.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Separator (compact mode only) */}
          {!isLarge && (
            <div className="w-px h-6 bg-gray-200 flex-shrink-0 self-center" />
          )}

          {/* City Autocomplete */}
          <div className={`relative ${isLarge ? 'flex-1' : 'flex-1 min-w-0'}`}>
            <div className="relative">
              <MapPin className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isLarge ? 'left-4 w-5 h-5' : 'left-3 w-4 h-4'}`} />
              <input
                ref={cityInputRef}
                type="text"
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value)
                  setShowCityDropdown(true)
                  setShowServiceDropdown(false)
                }}
                onFocus={() => {
                  setShowCityDropdown(true)
                  setShowServiceDropdown(false)
                }}
                onKeyDown={handleCityKeyDown}
                placeholder={isLarge ? 'Where? (city)' : 'City...'}
                autoComplete="off"
                aria-label="City or ZIP code"
                className={`
                  w-full transition-all outline-none text-gray-900 placeholder:text-gray-400
                  ${isLarge
                    ? 'rounded-xl pl-11 pr-4 py-4 text-base border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    : 'rounded-none pl-9 pr-3 py-2 text-sm bg-transparent'
                  }
                `}
              />
            </div>

            {/* City Suggestions Dropdown */}
            {showCityDropdown && (
              <div className={`absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-72 overflow-y-auto ${
                isLarge ? 'right-0 p-2' : 'w-72 right-0 p-1.5'
              }`}>
                {/* Popular cities (empty input state) */}
                {!hasTypedCity && (
                  <>
                    <div className={`text-gray-400 font-medium ${isLarge ? 'px-3 py-2 text-xs' : 'px-2.5 py-1.5 text-[11px]'}`}>
                      Popular cities
                    </div>
                    {popularCities.map((city, idx) => {
                      const isHighlighted = idx === highlightedCityIndex
                      return (
                        <button
                          key={city.slug}
                          type="button"
                          onClick={() => handleSelectCity(city.name)}
                          onMouseEnter={() => setHighlightedCityIndex(idx)}
                          className={`
                            w-full flex items-center justify-between rounded-lg transition-all duration-100
                            ${isHighlighted ? 'bg-blue-50' : 'hover:bg-gray-50'}
                            ${isLarge ? 'px-3 py-2.5' : 'px-2.5 py-2'}
                          `}
                        >
                          <div className="text-left">
                            <span className={`font-medium transition-colors ${isHighlighted ? 'text-blue-700' : 'text-gray-900'} ${isLarge ? 'text-base' : 'text-sm'}`}>
                              {city.name}
                            </span>
                            <div className={`text-gray-400 ${isLarge ? 'text-xs' : 'text-[11px]'}`}>
                              {city.stateName}
                            </div>
                          </div>
                          <span className={`text-gray-400 ${isLarge ? 'text-xs' : 'text-[11px]'}`}>{city.pop}</span>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Search results with text highlighting */}
                {hasTypedCity && filteredCities.length > 0 && (
                  <>
                    <div className={`text-gray-400 font-medium ${isLarge ? 'px-3 py-2 text-xs' : 'px-2.5 py-1.5 text-[11px]'}`}>
                      {filteredCities.length} cit{filteredCities.length > 1 ? 'ies' : 'y'} found
                    </div>
                    {filteredCities.map((city, idx) => {
                      const isHighlighted = idx === highlightedCityIndex
                      return (
                        <button
                          key={city.slug}
                          type="button"
                          onClick={() => handleSelectCity(city.name)}
                          onMouseEnter={() => setHighlightedCityIndex(idx)}
                          className={`
                            w-full flex items-center gap-2 rounded-lg transition-all duration-100
                            ${isHighlighted ? 'bg-blue-50' : 'hover:bg-gray-50'}
                            ${isLarge ? 'px-3 py-2.5' : 'px-2.5 py-2'}
                          `}
                        >
                          <div className="flex-1 text-left min-w-0">
                            <div className={`font-medium transition-colors truncate ${isHighlighted ? 'text-blue-700' : 'text-gray-900'} ${isLarge ? 'text-base' : 'text-sm'}`}>
                              <HighlightedText text={city.name} query={cityQuery} />
                              <span className={`font-normal ml-1 ${isLarge ? 'text-xs' : 'text-[11px]'} text-gray-400`}>({city.stateCode})</span>
                            </div>
                            <div className={`text-gray-500 truncate ${isLarge ? 'text-xs' : 'text-[11px]'}`}>
                              {city.stateName} &middot; {formatPopulation(city.population)}
                            </div>
                          </div>
                          <span className={`text-gray-400 bg-gray-100 rounded-full flex-shrink-0 ${isLarge ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5'}`}>
                            {city.zipCode}
                          </span>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* No results fallback */}
                {hasNoResults && (
                  <div className={`text-center ${isLarge ? 'py-4 px-3' : 'py-3 px-2.5'}`}>
                    <div className={`text-gray-500 mb-1 ${isLarge ? 'text-sm' : 'text-xs'}`}>
                      No city found for <span className="font-semibold text-gray-700">&ldquo;{cityQuery}&rdquo;</span>
                    </div>
                    <div className={`text-gray-400 mb-3 ${isLarge ? 'text-xs' : 'text-[11px]'}`}>
                      Try a nearby city:
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {fallbackCities.map((fc) => (
                        <button
                          key={fc.name}
                          type="button"
                          onClick={() => handleSelectCity(fc.name)}
                          className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors font-medium ${
                            isLarge ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          {fc.name} ({fc.dept})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className={`
              bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center gap-2 flex-shrink-0
              ${isLarge
                ? 'rounded-xl px-8 py-4 text-base shadow-md hover:shadow-lg'
                : 'rounded-full w-9 h-9 m-0.5 shadow-sm hover:shadow-md hover:scale-105'
              }
            `}
          >
            <Search className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} />
            {isLarge && <span>Search</span>}
          </button>
        </div>
      </form>
    </div>
  )
}
