'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, TrendingUp, Zap, Wrench, Key, Flame, PaintBucket, Hammer, Grid3X3, Home, TreeDeciduous, Navigation, ChevronRight, Clock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { slugify } from '@/lib/utils'
import { cities, type City } from '@/lib/data/usa'

// ── Icon map ─────────────────────────────────────────────────────────
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench, Zap, Key, Flame, PaintBucket, Hammer, Grid3X3, Home, TreeDeciduous
}

// ── Services ─────────────────────────────────────────────────────────
const services = [
  { name: 'Personal Injury', slug: 'personal-injury', icon: 'Wrench', color: 'from-blue-500 to-blue-600', searches: '15k/mo', urgent: true },
  { name: 'Criminal Defense', slug: 'criminal-defense', icon: 'Zap', color: 'from-amber-500 to-amber-600', searches: '12k/mo', urgent: true },
  { name: 'Family Law', slug: 'family-law', icon: 'Key', color: 'from-slate-600 to-slate-700', searches: '9k/mo', urgent: true },
  { name: 'Immigration', slug: 'immigration', icon: 'Flame', color: 'from-orange-500 to-orange-600', searches: '7k/mo', urgent: false },
  { name: 'Real Estate', slug: 'real-estate', icon: 'PaintBucket', color: 'from-purple-500 to-purple-600', searches: '6k/mo', urgent: false },
  { name: 'Employment Law', slug: 'employment-law', icon: 'Hammer', color: 'from-amber-600 to-amber-700', searches: '5k/mo', urgent: false },
  { name: 'Estate Planning', slug: 'estate-planning', icon: 'Grid3X3', color: 'from-teal-500 to-teal-600', searches: '4k/mo', urgent: false },
  { name: 'Bankruptcy', slug: 'bankruptcy', icon: 'Home', color: 'from-red-500 to-red-600', searches: '4k/mo', urgent: false },
  { name: 'Business Law', slug: 'business-law', icon: 'Wrench', color: 'from-stone-500 to-stone-600', searches: '3k/mo', urgent: false },
  { name: 'Tax Law', slug: 'tax-law', icon: 'TreeDeciduous', color: 'from-green-500 to-green-600', searches: '3k/mo', urgent: false },
]

// ── Normalize text (strip accents, lowercase) ───────────────────────
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
function searchCities(query: string, limit = 8): City[] {
  if (!query || query.length < 2) return []

  const normalized = normalizeText(query)

  // 1) Exact prefix match (highest priority) — sorted by population desc
  const prefixMatches: City[] = []
  // 2) Contains match (inside the name but not prefix)
  const containsMatches: City[] = []
  // 3) Postal code match
  const postalMatches: City[] = []
  // 4) State name match
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

  // Sort each group by population descending for relevance
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
  if (!query || query.length < 2) return <>{text}</>

  const normalizedQuery = normalizeText(query)
  const normalizedText = normalizeText(text)
  const matchIndex = normalizedText.indexOf(normalizedQuery)

  if (matchIndex === -1) return <>{text}</>

  // Map normalized index back to the original text
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

// ── Recent searches (localStorage) ──────────────────────────────────
const RECENT_KEY = 'sa-recent-searches'

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5)
  } catch {
    return []
  }
}

function addRecentSearch(city: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentSearches().filter(s => s !== city)
    recent.unshift(city)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)))
  } catch {
    // localStorage may be full or disabled
  }
}

function removeRecentSearch(city: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentSearches().filter(s => s !== city)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch {
    // ignore
  }
}

// ── Large fallback cities for "no match" state ──────────────────────
const fallbackCities = [
  { name: 'New York', dept: 'NY' },
  { name: 'Los Angeles', dept: 'CA' },
  { name: 'Chicago', dept: 'IL' },
  { name: 'Houston', dept: 'TX' },
  { name: 'Phoenix', dept: 'AZ' },
  { name: 'Miami', dept: 'FL' },
]

// ── Popular cities for empty state ──────────────────────────────────
const popularCities = [
  { name: 'New York', slug: 'new-york', stateName: 'New York (NY)', pop: '8.3M' },
  { name: 'Los Angeles', slug: 'los-angeles', stateName: 'California (CA)', pop: '3.9M' },
  { name: 'Chicago', slug: 'chicago', stateName: 'Illinois (IL)', pop: '2.7M' },
  { name: 'Houston', slug: 'houston', stateName: 'Texas (TX)', pop: '2.3M' },
  { name: 'Phoenix', slug: 'phoenix', stateName: 'Arizona (AZ)', pop: '1.6M' },
  { name: 'Miami', slug: 'miami', stateName: 'Florida (FL)', pop: '442k' },
  { name: 'Dallas', slug: 'dallas', stateName: 'Texas (TX)', pop: '1.3M' },
  { name: 'San Francisco', slug: 'san-francisco', stateName: 'California (CA)', pop: '874k' },
]

// ── Dropdown animation variants ─────────────────────────────────────
const dropdownVariants = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export function HeroSearch() {
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
  const specialtyListRef = useRef<HTMLDivElement>(null)
  const cityListRef = useRef<HTMLDivElement>(null)

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

  // ── Fuzzy city search with prioritized matching ────────────────────
  const filteredCities = useMemo(() => {
    return searchCities(location, 8)
  }, [location])

  // Determine if user typed something but got no results
  const hasTypedCity = location.trim().length >= 2
  const hasNoResults = hasTypedCity && filteredCities.length === 0

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedServiceIndex(-1)
  }, [filteredServices.length])

  useEffect(() => {
    setHighlightedCityIndex(-1)
  }, [filteredCities.length])

  // Scroll highlighted service into view
  useEffect(() => {
    if (highlightedServiceIndex >= 0 && specialtyListRef.current) {
      const items = specialtyListRef.current.querySelectorAll('[data-service-item]')
      items[highlightedServiceIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedServiceIndex])

  // Scroll highlighted city into view
  useEffect(() => {
    if (highlightedCityIndex >= 0 && cityListRef.current) {
      const items = cityListRef.current.querySelectorAll('[data-city-item]')
      items[highlightedCityIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedCityIndex])

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

    // Save to recent searches
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

  // ── Select a service ───────────────────────────────────────────────
  const selectService = useCallback((service: typeof services[0]) => {
    setQuery(service.name)
    setActiveField('location')
    setHighlightedServiceIndex(-1)
    setTimeout(() => locationInputRef.current?.focus(), 50)
  }, [])

  // ── Select a city ──────────────────────────────────────────────────
  const selectCity = useCallback((cityName: string) => {
    setLocation(cityName)
    addRecentSearch(cityName)
    setRecentSearches(getRecentSearches())
    setActiveField(null)
    setHighlightedCityIndex(-1)
  }, [])

  // ── Remove a recent search ─────────────────────────────────────────
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

  // ── Compute the navigable city items for keyboard ──────────────────
  const navigableCityItems = useMemo(() => {
    if (filteredCities.length > 0) return filteredCities
    if (!hasTypedCity && recentSearches.length > 0) {
      // Map recent searches to city objects or placeholders
      return recentSearches.map(name => {
        const match = cities.find(v => normalizeText(v.name) === normalizeText(name))
        return match || { name, slug: slugify(name), stateCode: '', stateName: '', county: '', population: '', zipCode: '', description: '', neighborhoods: [], latitude: 0, longitude: 0, metroArea: '' } as City
      })
    }
    // Popular cities
    return popularCities.map(pc => {
      const match = cities.find(v => v.slug === pc.slug)
      return match || { name: pc.name, slug: pc.slug, stateCode: '', stateName: '', county: '', population: '', zipCode: '', description: '', neighborhoods: [], latitude: 0, longitude: 0, metroArea: '' } as City
    })
  }, [filteredCities, hasTypedCity, recentSearches])

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

  // ── Derived state for location dropdown ────────────────────────────
  const showCitySuggestions = activeField === 'location'
  const showRecentSearches = showCitySuggestions && !hasTypedCity && recentSearches.length > 0
  const showPopularCities = showCitySuggestions && !hasTypedCity && recentSearches.length === 0

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto">
      {/* Search Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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

              {/* Service Suggestions Dropdown */}
              <AnimatePresence>
                {activeField === 'service' && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden max-h-[420px] overflow-y-auto"
                    role="listbox"
                    aria-label="Available services"
                  >
                    {/* Emergency Banner */}
                    <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 text-white">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="font-medium text-sm">24/7 Emergency?</span>
                        <button
                          type="button"
                          onClick={() => router.push('/emergency')}
                          className="ml-auto text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors backdrop-blur-sm"
                        >
                          Find now
                          <ChevronRight className="w-3 h-3 inline ml-0.5" />
                        </button>
                      </div>
                    </div>

                    {/* Services List */}
                    <div className="p-2" ref={specialtyListRef}>
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {query ? `Results for "${query}"` : 'Popular services'}
                      </div>
                      {filteredServices.length === 0 && (
                        <div className="px-3 py-6 text-center text-slate-400 text-sm">
                          No service found. Try another term.
                        </div>
                      )}
                      {filteredServices.map((service, idx) => {
                        const IconComponent = iconMap[service.icon] || Wrench
                        const isHighlighted = idx === highlightedServiceIndex
                        return (
                          <button
                            key={service.slug}
                            type="button"
                            role="option"
                            aria-selected={isHighlighted}
                            data-service-item
                            onClick={() => selectService(service)}
                            onMouseEnter={() => setHighlightedServiceIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group min-h-[48px] ${
                              isHighlighted
                                ? 'bg-blue-50 shadow-sm'
                                : 'hover:bg-blue-50/60'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center shadow-sm transition-transform duration-150 ${
                              isHighlighted ? 'scale-110' : 'group-hover:scale-105'
                            }`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className={`font-medium transition-colors duration-150 ${
                                isHighlighted ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                              }`}>
                                {service.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {service.searches} searches
                              </div>
                            </div>
                            {service.urgent && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                24h Emergency
                              </span>
                            )}
                            <ChevronRight className={`w-4 h-4 transition-all duration-150 ${
                              isHighlighted ? 'text-blue-400 translate-x-0.5' : 'text-slate-300'
                            }`} />
                          </button>
                        )
                      })}
                    </div>

                    {/* Keyboard hint */}
                    <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Arrows</kbd>
                        navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Enter</kbd>
                        select
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Esc</kbd>
                        close
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

              {/* Location Suggestions Dropdown */}
              <AnimatePresence>
                {showCitySuggestions && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden max-h-[460px] overflow-y-auto"
                    role="listbox"
                    aria-label="Available cities"
                  >
                    {/* Geolocation button */}
                    <button
                      type="button"
                      onClick={handleGeolocate}
                      disabled={isLocating}
                      className="w-full flex items-center gap-3 p-4 hover:bg-blue-50 border-b border-slate-100 transition-all duration-150 min-h-[56px]"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isLocating ? 'bg-blue-200' : 'bg-blue-100'
                      }`}>
                        {isLocating ? (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Navigation className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">
                          {isLocating ? 'Locating...' : 'Use my location'}
                        </div>
                        <div className="text-sm text-slate-500">
                          Attorneys near you
                        </div>
                      </div>
                    </button>

                    {/* Recent searches */}
                    {showRecentSearches && (
                      <div className="p-2">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 font-medium">
                          <Clock className="w-3 h-3" />
                          Recent searches
                        </div>
                        {recentSearches.map((cityName, idx) => {
                          const isHighlighted = idx === highlightedCityIndex
                          return (
                            <button
                              key={`recent-${cityName}`}
                              type="button"
                              role="option"
                              aria-selected={isHighlighted}
                              data-city-item
                              onClick={() => selectCity(cityName)}
                              onMouseEnter={() => setHighlightedCityIndex(idx)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group min-h-[44px] ${
                                isHighlighted
                                  ? 'bg-blue-50 shadow-sm'
                                  : 'hover:bg-blue-50/60'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isHighlighted ? 'bg-blue-100' : 'bg-slate-100'
                              }`}>
                                <Clock className={`w-4 h-4 ${isHighlighted ? 'text-blue-600' : 'text-slate-400'}`} />
                              </div>
                              <span className={`flex-1 text-left font-medium transition-colors ${
                                isHighlighted ? 'text-blue-700' : 'text-slate-900'
                              }`}>
                                {cityName}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveRecent(cityName, e)}
                                className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                aria-label={`Remove ${cityName} from recent searches`}
                              >
                                <X className="w-3 h-3 text-slate-400" />
                              </button>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Filtered cities from usa.ts (fuzzy search results) */}
                    {filteredCities.length > 0 && (
                      <div className="p-2" ref={cityListRef}>
                        <div className="px-3 py-2 text-xs text-slate-500 font-medium">
                          {filteredCities.length} {filteredCities.length > 1 ? 'cities' : 'city'} found
                        </div>
                        {filteredCities.map((city, idx) => {
                          const isHighlighted = idx === highlightedCityIndex
                          return (
                            <button
                              key={city.slug}
                              type="button"
                              role="option"
                              aria-selected={isHighlighted}
                              data-city-item
                              onClick={() => selectCity(city.name)}
                              onMouseEnter={() => setHighlightedCityIndex(idx)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 min-h-[48px] ${
                                isHighlighted
                                  ? 'bg-blue-50 shadow-sm'
                                  : 'hover:bg-blue-50/60'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                                isHighlighted ? 'bg-blue-100' : 'bg-slate-100'
                              }`}>
                                <MapPin className={`w-4 h-4 ${isHighlighted ? 'text-blue-600' : 'text-slate-400'}`} />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className={`font-medium transition-colors truncate ${
                                  isHighlighted ? 'text-blue-700' : 'text-slate-900'
                                }`}>
                                  <HighlightedText text={city.name} query={location} />
                                  <span className="text-slate-400 font-normal ml-1">({city.stateCode})</span>
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                  {city.stateName} &middot; {formatPopulation(city.population)}
                                </div>
                              </div>
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                {city.zipCode}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* No-match state */}
                    {hasNoResults && (
                      <div className="p-4">
                        <div className="text-center py-3">
                          <div className="text-sm text-slate-500 mb-1">
                            No city found for <span className="font-semibold text-slate-700">&ldquo;{location}&rdquo;</span>
                          </div>
                          <div className="text-xs text-slate-400 mb-4">
                            We don&apos;t cover this area yet. Try a nearby city.
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {fallbackCities.map((fc) => (
                              <button
                                key={fc.name}
                                type="button"
                                onClick={() => selectCity(fc.name)}
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors font-medium min-h-[36px]"
                              >
                                <MapPin className="w-3 h-3" />
                                {fc.name} ({fc.dept})
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Popular cities (empty state, no recents) */}
                    {showPopularCities && (
                      <div className="p-2" ref={cityListRef}>
                        <div className="px-3 py-2 text-xs text-slate-500 font-medium">
                          Popular cities
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {popularCities.map((city, idx) => {
                            const isHighlighted = idx === highlightedCityIndex
                            return (
                              <button
                                key={city.slug}
                                type="button"
                                role="option"
                                aria-selected={isHighlighted}
                                data-city-item
                                onClick={() => selectCity(city.name)}
                                onMouseEnter={() => setHighlightedCityIndex(idx)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 min-h-[44px] ${
                                  isHighlighted
                                    ? 'bg-blue-50 shadow-sm'
                                    : 'hover:bg-blue-50/60'
                                }`}
                              >
                                <div className="text-left">
                                  <span className={`font-medium transition-colors ${
                                    isHighlighted ? 'text-blue-700' : 'text-slate-900'
                                  }`}>{city.name}</span>
                                  <div className="text-[11px] text-slate-400">{city.stateName}</div>
                                </div>
                                <span className="text-xs text-slate-400">{city.pop}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Keyboard hint */}
                    <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Arrows</kbd>
                        navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Enter</kbd>
                        select
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── SUBMIT BUTTON ──────────────────────────────────── */}
            <div className="p-3 md:p-2 md:pr-3 flex items-center">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
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
              className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 backdrop-blur-sm"
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
