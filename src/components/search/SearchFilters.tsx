'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Star,
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Briefcase,
  SlidersHorizontal,
  CheckCircle,
  Award,
  CalendarCheck,
  Globe,
  Navigation,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchServices as practiceAreas, searchStates as states } from '@/lib/data/usa-search-data'
import { useGeolocation } from '@/hooks/useGeolocation'

interface FilterState {
  pa: string
  state: string
  city: string
  rating: string
  sort: string
  free_consultation: string
  verified: string
  radius: string
  available: string
  lang: string
}

interface SearchFiltersProps {
  className?: string
}

const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '3', label: '3+ stars' },
  { value: '3.5', label: '3.5+ stars' },
  { value: '4', label: '4+ stars' },
  { value: '4.5', label: '4.5+ stars' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'distance', label: 'Nearest', geoRequired: true },
  { value: 'available', label: 'Available soonest' },
  { value: 'experience', label: 'Most experienced' },
]

const DISTANCE_OPTIONS = [
  { value: '5', label: '5 mi' },
  { value: '10', label: '10 mi' },
  { value: '25', label: '25 mi' },
  { value: '50', label: '50 mi' },
  { value: '100', label: '100 mi' },
]

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'Chinese',
  'French',
  'Arabic',
  'Hindi',
  'Portuguese',
  'Korean',
  'Vietnamese',
  'Russian',
  'Tagalog',
  'German',
  'Japanese',
  'Italian',
  'Polish',
]

// Top practice areas for quick access (subset of all 75)
const TOP_PRACTICE_AREAS = [
  'personal-injury', 'criminal-defense', 'family-law', 'immigration',
  'real-estate', 'employment-law', 'estate-planning', 'bankruptcy',
  'business-law', 'tax-law', 'divorce', 'dui-dwi',
  'medical-malpractice', 'workers-compensation', 'civil-rights',
]

export function SearchFilters({ className }: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const geo = useGeolocation()

  const currentFilters: FilterState = {
    pa: searchParams.get('pa') || '',
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || 'relevance',
    free_consultation: searchParams.get('free_consultation') || '',
    verified: searchParams.get('verified') || '',
    radius: searchParams.get('radius') || '',
    available: searchParams.get('available') || '',
    lang: searchParams.get('lang') || '',
  }

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['practice-area', 'location', 'rating', 'quick-filters'])
  )

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 when filters change
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  const updateMultipleFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  const resetFilters = useCallback(() => {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    if (q) params.set('q', q)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [router, pathname, searchParams])

  const activeCount = [
    currentFilters.pa,
    currentFilters.state,
    currentFilters.city,
    currentFilters.rating,
    currentFilters.free_consultation,
    currentFilters.verified,
    currentFilters.radius,
    currentFilters.available,
    currentFilters.lang,
  ].filter(Boolean).length

  // Sorted practice areas for dropdown
  const sortedPracticeAreas = [...practiceAreas].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  // Top practice areas with their full data
  const topPAs = TOP_PRACTICE_AREAS.map((slug) =>
    practiceAreas.find((pa) => pa.slug === slug)
  ).filter(Boolean)

  // Handle "Use my location" — request geolocation then apply lat/lng to URL
  const handleUseMyLocation = useCallback(() => {
    geo.requestPermission()
  }, [geo])

  // When geo resolves, set lat/lng params
  const hasGeo = geo.hasLocation

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden',
        isPending && 'opacity-70 pointer-events-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="font-semibold text-gray-900 dark:text-white">Filters</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Quick Toggle Filters ─────────────────────────────────────── */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('quick-filters')}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Quick Filters
            </span>
          </div>
          {expandedSections.has('quick-filters') ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {expandedSections.has('quick-filters') && (
          <div className="px-5 pb-5 space-y-3">
            {/* Free consultation toggle */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Free consultation</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={currentFilters.free_consultation === '1'}
                onClick={() => updateFilter('free_consultation', currentFilters.free_consultation === '1' ? '' : '1')}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
                  currentFilters.free_consultation === '1'
                    ? 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    currentFilters.free_consultation === '1' ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </label>

            {/* Verified only toggle */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Verified only</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={currentFilters.verified === '1'}
                onClick={() => updateFilter('verified', currentFilters.verified === '1' ? '' : '1')}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
                  currentFilters.verified === '1'
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    currentFilters.verified === '1' ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </label>

            {/* Available this week toggle */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-violet-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Available this week</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={currentFilters.available === '1'}
                onClick={() => updateFilter('available', currentFilters.available === '1' ? '' : '1')}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
                  currentFilters.available === '1'
                    ? 'bg-violet-500'
                    : 'bg-gray-200 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    currentFilters.available === '1' ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </label>

            {/* Use my location button */}
            {!hasGeo && (
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geo.loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
              >
                {geo.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {geo.loading ? 'Locating...' : 'Use my location'}
              </button>
            )}
            {hasGeo && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  Location active
                </span>
              </div>
            )}
            {geo.error && (
              <p className="text-xs text-red-500 dark:text-red-400">{geo.error}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Distance Radius (only if geolocation available) ──────────── */}
      {hasGeo && (
        <div className="border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => toggleSection('distance')}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Distance
              </span>
              {currentFilters.radius && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {currentFilters.radius} mi
                </span>
              )}
            </div>
            {expandedSections.has('distance') ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.has('distance') && (
            <div className="px-5 pb-5">
              <div className="flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const newRadius = currentFilters.radius === opt.value ? '' : opt.value
                      // When setting radius, also push lat/lng to URL
                      updateMultipleFilters({
                        radius: newRadius,
                      })
                    }}
                    className={cn(
                      'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                      currentFilters.radius === opt.value
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Practice Area */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('practice-area')}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Practice Area
            </span>
            {currentFilters.pa && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate max-w-[120px]">
                {practiceAreas.find((p) => p.slug === currentFilters.pa)?.name || currentFilters.pa}
              </span>
            )}
          </div>
          {expandedSections.has('practice-area') ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {expandedSections.has('practice-area') && (
          <div className="px-5 pb-5 space-y-3">
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {topPAs.map((pa) =>
                pa ? (
                  <button
                    key={pa.slug}
                    onClick={() =>
                      updateFilter('pa', currentFilters.pa === pa.slug ? '' : pa.slug)
                    }
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                      currentFilters.pa === pa.slug
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {pa.name}
                  </button>
                ) : null
              )}
            </div>
            {/* Full dropdown */}
            <select
              value={currentFilters.pa}
              onChange={(e) => updateFilter('pa', e.target.value)}
              className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All practice areas</option>
              {sortedPracticeAreas.map((pa) => (
                <option key={pa.slug} value={pa.slug}>
                  {pa.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Location -- State */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('location')}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</span>
            {(currentFilters.state || currentFilters.city) && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[120px]">
                {[currentFilters.city, currentFilters.state].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          {expandedSections.has('location') ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {expandedSections.has('location') && (
          <div className="px-5 pb-5 space-y-3">
            <select
              value={currentFilters.state}
              onChange={(e) => updateFilter('state', e.target.value)}
              className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                type="text"
                value={currentFilters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
                placeholder="City name..."
                className="w-full p-2.5 pl-9 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {currentFilters.city && (
                <button
                  onClick={() => updateFilter('city', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rating</span>
            {currentFilters.rating && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {currentFilters.rating}+ stars
              </span>
            )}
          </div>
          {expandedSections.has('rating') ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {expandedSections.has('rating') && (
          <div className="px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter('rating', currentFilters.rating === opt.value ? '' : opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    currentFilters.rating === opt.value
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {opt.value && <Star className="w-3.5 h-3.5 fill-current" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Languages ────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('languages')}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Languages</span>
            {currentFilters.lang && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[120px]">
                {currentFilters.lang}
              </span>
            )}
          </div>
          {expandedSections.has('languages') ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {expandedSections.has('languages') && (
          <div className="px-5 pb-5">
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => updateFilter('lang', currentFilters.lang === lang ? '' : lang)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    currentFilters.lang === lang
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="p-5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5 block">
          Sort by
        </label>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS
            .filter((opt) => !opt.geoRequired || hasGeo)
            .map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilter('sort', opt.value)}
              className={cn(
                'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                currentFilters.sort === opt.value
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SearchFilters
