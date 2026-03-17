'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, X, MapPin, Star,
  History, TrendingUp, Sliders
} from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchSuggestion {
  text: string
  type: 'service' | 'attorney' | 'location'
  id?: string
  subtitle?: string
}

interface SearchFilters {
  service?: string
  location?: string
  minRating?: number
  minPrice?: number
  maxPrice?: number
  availability?: 'today' | 'week' | 'anytime'
  sortBy?: string
}

interface AdvancedSearchProps {
  initialQuery?: string
  initialFilters?: SearchFilters
  onSearch?: (query: string, filters: SearchFilters) => void
  showFilters?: boolean
  variant?: 'hero' | 'header' | 'page'
}

const serviceCategories = [
  'Personal Injury',
  'Criminal Defense',
  'Family Law',
  'Immigration',
  'Real Estate',
  'Employment Law',
  'Estate Planning',
  'Bankruptcy',
  'Business Law',
  'Tax Law',
  'Civil Litigation',
  'Intellectual Property',
]

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviews' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

export default function AdvancedSearch({
  initialQuery = '',
  initialFilters = {},
  onSearch,
  showFilters = true,
  variant = 'page',
}: AdvancedSearchProps) {
  const reducedMotion = useReducedMotion()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery || searchParams.get('q') || '')
  const [filters, setFilters] = useState<SearchFilters>({
    service: searchParams.get('service') || initialFilters.service,
    location: searchParams.get('location') || initialFilters.location,
    minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : initialFilters.minRating,
    availability: (searchParams.get('availability') as SearchFilters['availability']) || initialFilters.availability,
    sortBy: searchParams.get('sortBy') || initialFilters.sortBy || 'relevance',
    ...initialFilters,
  })

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [_isLoading, _setIsLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions || [])
          setRecentSearches(data.recentSearches || [])
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback(() => {
    setShowSuggestions(false)

    // Build URL params
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (filters.service) params.set('service', filters.service)
    if (filters.location) params.set('location', filters.location)
    if (filters.minRating) params.set('minRating', filters.minRating.toString())
    if (filters.availability) params.set('availability', filters.availability)
    if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy)

    // Save to search history
    if (query.length >= 2) {
      fetch('/api/search/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters }),
      }).catch(() => {})
    }

    if (onSearch) {
      onSearch(query, filters)
    } else {
      router.push(`/search?${params.toString()}`)
    }
  }, [query, filters, onSearch, router])

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'attorney' && suggestion.id) {
      router.push(`/search?q=${encodeURIComponent(suggestion.text)}`)
    } else if (suggestion.type === 'location') {
      setFilters({ ...filters, location: suggestion.text })
      setShowSuggestions(false)
    } else {
      setQuery(suggestion.text)
      setShowSuggestions(false)
      // Trigger search after setting query
      setTimeout(() => handleSearch(), 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const clearFilters = () => {
    setFilters({})
  }

  const activeFiltersCount = Object.values(filters).filter((v) => v && v !== 'relevance').length

  const containerClass = variant === 'hero'
    ? 'w-full max-w-3xl mx-auto'
    : variant === 'header'
    ? 'w-full max-w-xl'
    : 'w-full'

  return (
    <div className={containerClass}>
      {/* Search Input */}
      <div className="relative">
        <div className={`flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 ${
          variant === 'hero' ? 'p-2' : 'p-1'
        }`}>
          <div className="flex-1 flex items-center gap-3 px-4">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search for an attorney, a practice area..."
              className={`w-full outline-none text-gray-900 placeholder-gray-400 ${
                variant === 'hero' ? 'py-3 text-lg' : 'py-2'
              }`}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Location Input */}
          <div className="hidden md:flex items-center gap-2 px-4 border-l border-gray-200">
            <MapPin className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.location || ''}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              placeholder="City or ZIP code"
              className={`w-40 outline-none text-gray-900 placeholder-gray-400 ${
                variant === 'hero' ? 'py-3' : 'py-2'
              }`}
            />
          </div>

          {/* Filter Button */}
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`relative p-3 rounded-lg transition-colors ${
                showFilterPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Sliders className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className={`bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors ${
              variant === 'hero' ? 'px-8 py-3' : 'px-6 py-2'
            }`}
          >
            Search
          </button>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
            <motion.div
              ref={suggestionsRef}
              initial={reducedMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
            >
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <History className="w-4 h-4" />
                    Recent searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(search)
                          handleSearch()
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="py-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
                    >
                      {suggestion.type === 'service' && (
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                      )}
                      {suggestion.type === 'attorney' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {suggestion.text.charAt(0)}
                          </span>
                        </div>
                      )}
                      {suggestion.type === 'location' && (
                        <MapPin className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <div className="text-gray-900">{suggestion.text}</div>
                        {suggestion.subtitle && (
                          <div className="text-sm text-gray-500">{suggestion.subtitle}</div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 capitalize">
                        {suggestion.type === 'service' ? 'Service' :
                         suggestion.type === 'attorney' ? 'Attorney' : 'City'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && showFilters && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Service Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service category
                </label>
                <div className="flex flex-wrap gap-2">
                  {serviceCategories.map((service) => (
                    <button
                      key={service}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          service: filters.service === service ? undefined : service,
                        })
                      }
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.service === service
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            minRating: filters.minRating === rating ? undefined : rating,
                          })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          filters.minRating && filters.minRating <= rating
                            ? 'text-yellow-500'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        <Star
                          className="w-5 h-5"
                          fill={filters.minRating && filters.minRating <= rating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={filters.availability || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        availability: (e.target.value as SearchFilters['availability']) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any time</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by
                  </label>
                  <select
                    value={filters.sortBy || 'relevance'}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear filters
                </button>
                <button
                  onClick={() => {
                    setShowFilterPanel(false)
                    handleSearch()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
