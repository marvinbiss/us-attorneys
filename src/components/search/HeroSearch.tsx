'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, X, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { slugify } from '@/lib/utils'
import { cities } from '@/lib/data/usa'
import { ServiceDropdown } from './ServiceDropdown'
import { LocationDropdown } from './LocationDropdown'
import {
  services,
  normalizeText,
  searchCities,
  iconMap,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  popularCities,
  type Service,
} from './search-data'

export function HeroSearch() {
  const reducedMotion = useReducedMotion()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [activeField, setActiveField] = useState<'service' | 'location' | null>(null)
  const [highlightedServiceIndex, setHighlightedServiceIndex] = useState(-1)
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(-1)
  const [isLocating, setIsLocating] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const serviceInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveField(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Filter services ────────────────────────────────────────────────
  const filteredServices = useMemo(() => {
    if (!query) return services
    const normalized = normalizeText(query)
    return services.filter(s => normalizeText(s.name).includes(normalized))
  }, [query])

  // ── Fuzzy city search ──────────────────────────────────────────────
  const filteredCities = useMemo(() => searchCities(location, 8), [location])

  const hasTypedCity = location.trim().length >= 2
  const hasNoResults = hasTypedCity && filteredCities.length === 0

  // Reset highlighted index when suggestions change
  useEffect(() => { setHighlightedServiceIndex(-1) }, [filteredServices.length])
  useEffect(() => { setHighlightedCityIndex(-1) }, [filteredCities.length])

  // ── Navigable city items for keyboard ──────────────────────────────
  const navigableCityItems = useMemo(() => {
    if (filteredCities.length > 0) return filteredCities
    if (!hasTypedCity && recentSearches.length > 0) {
      return recentSearches.map(name => {
        const match = cities.find(v => normalizeText(v.name) === normalizeText(name))
        return match || { name, slug: slugify(name), stateCode: '', stateName: '', county: '', population: '', zipCode: '', description: '', neighborhoods: [], latitude: 0, longitude: 0, metroArea: '' } as typeof cities[0]
      })
    }
    return popularCities.map(pc => {
      const match = cities.find(v => v.slug === pc.slug)
      return match || { name: pc.name, slug: pc.slug, stateCode: '', stateName: '', county: '', population: '', zipCode: '', description: '', neighborhoods: [], latitude: 0, longitude: 0, metroArea: '' } as typeof cities[0]
    })
  }, [filteredCities, hasTypedCity, recentSearches])

  // ── Geolocation ────────────────────────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lon=${position.coords.longitude}&lat=${position.coords.latitude}`
          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            const city = data.address?.city || data.address?.town
            if (city) {
              setLocation(city)
              addRecentSearch(city)
              setRecentSearches(getRecentSearches())
              setActiveField(null)
            } else {
              setLocation('Near me')
              setActiveField(null)
            }
          }
        } catch {
          setLocation('Near me')
          setActiveField(null)
        } finally {
          setIsLocating(false)
        }
      },
      () => setIsLocating(false),
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    const specialtySlug = services.find(s => normalizeText(s.name) === normalizeText(query))?.slug || slugify(query)
    const cityMatch = cities.find(v => normalizeText(v.name) === normalizeText(location))
    const citySlug = cityMatch?.slug || slugify(location)

    if (location.trim()) {
      addRecentSearch(location.trim())
      setRecentSearches(getRecentSearches())
    }

    if (query && location) {
      router.push(`/practice-areas/${specialtySlug}/${citySlug}`)
    } else if (query) {
      router.push(`/practice-areas/${specialtySlug}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`)
    }
  }, [query, location, router])

  // ── Select handlers ────────────────────────────────────────────────
  const selectService = useCallback((service: Service) => {
    setQuery(service.name)
    setActiveField('location')
    setHighlightedServiceIndex(-1)
    setTimeout(() => locationInputRef.current?.focus(), 50)
  }, [])

  const selectCity = useCallback((cityName: string) => {
    setLocation(cityName)
    addRecentSearch(cityName)
    setRecentSearches(getRecentSearches())
    setActiveField(null)
    setHighlightedCityIndex(-1)
  }, [])

  const handleRemoveRecent = useCallback((city: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeRecentSearch(city)
    setRecentSearches(getRecentSearches())
  }, [])

  // ── Keyboard nav: services ─────────────────────────────────────────
  const handleServiceKeyDown = useCallback((e: React.KeyboardEvent) => {
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
          selectService(items[highlightedServiceIndex])
        } else if (query) {
          setActiveField('location')
          setTimeout(() => locationInputRef.current?.focus(), 50)
        }
        break
      case 'Escape':
        setActiveField(null)
        serviceInputRef.current?.blur()
        break
      case 'Tab':
        if (!e.shiftKey) {
          e.preventDefault()
          setActiveField('location')
          locationInputRef.current?.focus()
        }
        break
    }
  }, [filteredServices, highlightedServiceIndex, query, selectService])

  // ── Keyboard nav: cities ───────────────────────────────────────────
  const handleLocationKeyDown = useCallback((e: React.KeyboardEvent) => {
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
          selectCity(items[highlightedCityIndex].name)
        } else if (location.trim()) {
          handleSubmit()
        }
        break
      case 'Escape':
        setActiveField(null)
        locationInputRef.current?.blur()
        break
      case 'Tab':
        if (e.shiftKey) {
          e.preventDefault()
          setActiveField('service')
          serviceInputRef.current?.focus()
        } else {
          setActiveField(null)
        }
        break
    }
  }, [navigableCityItems, highlightedCityIndex, selectCity, handleSubmit, location])

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto">
      {/* Search Box */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 overflow-visible relative"
      >
        <form onSubmit={handleSubmit} role="search" aria-label="Search for an attorney">
          <div className="flex flex-col md:flex-row">
            {/* ── SERVICE FIELD ──────────────────────────────────── */}
            <div className="flex-1 relative">
              <div
                className={`p-4 md:p-5 cursor-text border-b md:border-b-0 md:border-r transition-all duration-200 ${
                  activeField === 'service'
                    ? 'bg-slate-50 border-blue-200'
                    : 'hover:bg-slate-50/50 border-slate-200'
                }`}
                onClick={() => {
                  setActiveField('service')
                  serviceInputRef.current?.focus()
                }}
              >
                <label className="block text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">
                  What service?
                </label>
                <div className="flex items-center gap-3">
                  <Search className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                    activeField === 'service' ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <input
                    ref={serviceInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setActiveField('service')}
                    onKeyDown={handleServiceKeyDown}
                    placeholder="Personal injury, family law, criminal..."
                    aria-label="Type of service"
                    aria-expanded={activeField === 'service'}
                    aria-haspopup="listbox"
                    autoComplete="off"
                    className="w-full bg-transparent text-base md:text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setQuery('')
                        serviceInputRef.current?.focus()
                      }}
                      className="flex-shrink-0 w-7 h-7 min-h-[28px] rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                      aria-label="Clear service"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>

              <ServiceDropdown
                isOpen={activeField === 'service'}
                filteredServices={filteredServices}
                query={query}
                highlightedIndex={highlightedServiceIndex}
                onHighlight={setHighlightedServiceIndex}
                onSelect={selectService}
              />
            </div>

            {/* ── LOCATION FIELD ─────────────────────────────────── */}
            <div className="flex-1 relative">
              <div
                className={`p-4 md:p-5 cursor-text transition-all duration-200 ${
                  activeField === 'location'
                    ? 'bg-slate-50 border-blue-200'
                    : 'hover:bg-slate-50/50'
                }`}
                onClick={() => {
                  setActiveField('location')
                  locationInputRef.current?.focus()
                }}
              >
                <label className="block text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">
                  Where?
                </label>
                <div className="flex items-center gap-3">
                  <MapPin className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                    activeField === 'location' ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onFocus={() => setActiveField('location')}
                    onKeyDown={handleLocationKeyDown}
                    placeholder="City, ZIP code..."
                    aria-label="City or ZIP code"
                    aria-expanded={activeField === 'location'}
                    aria-haspopup="listbox"
                    autoComplete="off"
                    className="w-full bg-transparent text-base md:text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {location && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLocation('')
                        locationInputRef.current?.focus()
                      }}
                      className="flex-shrink-0 w-7 h-7 min-h-[28px] rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                      aria-label="Clear city"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>

              <LocationDropdown
                isOpen={activeField === 'location'}
                location={location}
                filteredCities={filteredCities}
                hasTypedCity={hasTypedCity}
                hasNoResults={hasNoResults}
                recentSearches={recentSearches}
                highlightedIndex={highlightedCityIndex}
                isLocating={isLocating}
                onHighlight={setHighlightedCityIndex}
                onSelectCity={selectCity}
                onGeolocate={handleGeolocate}
                onRemoveRecent={handleRemoveRecent}
              />
            </div>

            {/* ── SUBMIT BUTTON ──────────────────────────────────── */}
            <div className="p-3 md:p-2 md:pr-3 flex items-center">
              <motion.button
                type="submit"
                whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                aria-label="Search"
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Search className="w-5 h-5" />
                <span className="md:hidden lg:inline">Search</span>
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.3 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-3"
      >
        <span className="text-sm text-white/60">Popular:</span>
        {services.slice(0, 4).map((service) => {
          const IconComponent = iconMap[service.icon] || Wrench
          return (
            <button
              key={service.slug}
              onClick={() => {
                setQuery(service.name)
                setActiveField('location')
                setTimeout(() => locationInputRef.current?.focus(), 50)
              }}
              className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2.5 min-h-[44px] rounded-full transition-all duration-200 flex items-center gap-1.5 backdrop-blur-sm"
            >
              <IconComponent className="w-3.5 h-3.5" />
              {service.name}
            </button>
          )
        })}
      </motion.div>
    </div>
  )
}
