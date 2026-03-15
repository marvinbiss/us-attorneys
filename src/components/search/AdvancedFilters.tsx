'use client'

import { useState } from 'react'
import {
  Filter,
  Star,
  MapPin,
  Euro,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import RadiusSlider from './RadiusSlider'
import PriceRangeFilter from './PriceRangeFilter'
import AvailabilityFilter from './AvailabilityFilter'

export interface FilterValues {
  minRating?: number
  maxPrice?: number
  minPrice?: number
  radius?: number
  availability?: 'today' | 'tomorrow' | 'this_week' | 'any'
  verified?: boolean
  sortBy?: 'relevance' | 'rating' | 'distance' | 'price_low' | 'price_high'
}

interface AdvancedFiltersProps {
  values: FilterValues
  onChange: (values: FilterValues) => void
  onReset: () => void
  userLocation?: { lat: number; lon: number }
  className?: string
}

export function AdvancedFilters({
  values,
  onChange,
  onReset,
  userLocation,
  className,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['rating']))

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections)
    if (newSections.has(section)) {
      newSections.delete(section)
    } else {
      newSections.add(section)
    }
    setExpandedSections(newSections)
  }

  const handleChange = (key: keyof FilterValues, value: FilterValues[keyof FilterValues]) => {
    onChange({ ...values, [key]: value })
  }

  const activeFiltersCount = Object.entries(values).filter(
    ([, val]) => val !== undefined && val !== 'any' && val !== null
  ).length

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            Advanced filters
          </span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Rating filter */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('rating')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Minimum rating</span>
              </div>
              {expandedSections.has('rating') ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has('rating') && (
              <div className="px-4 pb-4">
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleChange('minRating', rating === 0 ? undefined : rating)}
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        (values.minRating || 0) === rating
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {rating === 0 ? (
                        'All'
                      ) : (
                        <>
                          <Star className="w-3 h-3 fill-current" />
                          {rating}+
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Distance filter */}
          {userLocation && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleSection('distance')}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Distance ({values.radius || 25} km)
                  </span>
                </div>
                {expandedSections.has('distance') ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.has('distance') && (
                <div className="px-4 pb-4">
                  <RadiusSlider
                    value={values.radius || 25}
                    onChange={(radius) => handleChange('radius', radius)}
                    min={5}
                    max={100}
                  />
                </div>
              )}
            </div>
          )}

          {/* Price filter */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hourly rate</span>
              </div>
              {expandedSections.has('price') ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has('price') && (
              <div className="px-4 pb-4">
                <PriceRangeFilter
                  minValue={values.minPrice}
                  maxValue={values.maxPrice}
                  onChange={(min, max) => {
                    handleChange('minPrice', min)
                    handleChange('maxPrice', max)
                  }}
                />
              </div>
            )}
          </div>

          {/* Availability filter */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('availability')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Availability</span>
              </div>
              {expandedSections.has('availability') ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has('availability') && (
              <div className="px-4 pb-4">
                <AvailabilityFilter
                  value={values.availability || 'any'}
                  onChange={(availability) => handleChange('availability', availability === 'any' ? undefined : availability)}
                />
              </div>
            )}
          </div>

          {/* Verified only toggle */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Verified attorneys only
            </span>
            <button
              onClick={() => handleChange('verified', !values.verified)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                values.verified ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow',
                  values.verified && 'translate-x-5'
                )}
              />
            </button>
          </div>

          {/* Sort by */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Sort by
            </label>
            <select
              value={values.sortBy || 'relevance'}
              onChange={(e) => handleChange('sortBy', e.target.value as FilterValues['sortBy'])}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Highest rated</option>
              <option value="distance">Distance</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
              Reset filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFilters
