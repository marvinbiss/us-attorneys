'use client'

import { useRef, useEffect, useCallback } from 'react'
import { MapPin, Navigation, Clock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { City } from '@/lib/data/usa'
import {
  dropdownVariants,
  HighlightedText,
  formatPopulation,
  fallbackCities,
  popularCities,
} from './search-data'

interface LocationDropdownProps {
  isOpen: boolean
  location: string
  filteredCities: City[]
  hasTypedCity: boolean
  hasNoResults: boolean
  recentSearches: string[]
  highlightedIndex: number
  isLocating: boolean
  onHighlight: (index: number) => void
  onSelectCity: (name: string) => void
  onGeolocate: () => void
  onRemoveRecent: (city: string, e: React.MouseEvent) => void
}

export function LocationDropdown({
  isOpen,
  location,
  filteredCities,
  hasTypedCity,
  hasNoResults,
  recentSearches,
  highlightedIndex,
  isLocating,
  onHighlight,
  onSelectCity,
  onGeolocate,
  onRemoveRecent,
}: LocationDropdownProps) {
  const reducedMotion = useReducedMotion()
  const cityListRef = useRef<HTMLDivElement>(null)

  const showRecentSearches = !hasTypedCity && recentSearches.length > 0
  const showPopularCities = !hasTypedCity && recentSearches.length === 0

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && cityListRef.current) {
      const items = cityListRef.current.querySelectorAll('[data-city-item]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const handleGeolocateClick = useCallback(() => {
    onGeolocate()
  }, [onGeolocate])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={reducedMotion ? undefined : dropdownVariants}
          initial={reducedMotion ? false : "initial"}
          animate="animate"
          exit="exit"
          transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden max-h-[460px] overflow-y-auto"
          role="listbox"
          aria-label="Available cities"
        >
          {/* Geolocation button */}
          <button
            type="button"
            onClick={handleGeolocateClick}
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
                const isHighlighted = idx === highlightedIndex
                return (
                  <button
                    key={`recent-${cityName}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    data-city-item
                    onClick={() => onSelectCity(cityName)}
                    onMouseEnter={() => onHighlight(idx)}
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
                      onClick={(e) => onRemoveRecent(cityName, e)}
                      className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
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
                const isHighlighted = idx === highlightedIndex
                return (
                  <button
                    key={city.slug}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    data-city-item
                    onClick={() => onSelectCity(city.name)}
                    onMouseEnter={() => onHighlight(idx)}
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
                      onClick={() => onSelectCity(fc.name)}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2.5 rounded-full transition-colors font-medium min-h-[44px]"
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
                  const isHighlighted = idx === highlightedIndex
                  return (
                    <button
                      key={city.slug}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      data-city-item
                      onClick={() => onSelectCity(city.name)}
                      onMouseEnter={() => onHighlight(idx)}
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
  )
}
