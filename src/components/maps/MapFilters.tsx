'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Search, Filter, Shield, Zap, Layers, List, Map as MapIcon
} from 'lucide-react'
import Link from 'next/link'

export interface Filters {
  service: string
  minRating: number
  verified: boolean
  emergency: boolean
}

export const SERVICES = [
  { value: 'personal-injury', label: 'Personal Injury', icon: '🏥' },
  { value: 'criminal-defense', label: 'Criminal Defense', icon: '⚖️' },
  { value: 'family-law', label: 'Family Law', icon: '👨‍👩‍👧' },
  { value: 'estate-planning', label: 'Estate Planning', icon: '📜' },
  { value: 'business-law', label: 'Business Law', icon: '🏢' },
  { value: 'immigration', label: 'Immigration', icon: '🌍' },
  { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
  { value: 'employment-law', label: 'Employment Law', icon: '💼' },
  { value: 'bankruptcy', label: 'Bankruptcy', icon: '📊' },
  { value: 'tax-law', label: 'Tax Law', icon: '💰' },
]

interface MapFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  showFilters: boolean
  onToggleFilters: () => void
  activeFilterCount: number
  viewMode: 'split' | 'map' | 'list'
  onViewModeChange: (mode: 'split' | 'map' | 'list') => void
}

export default function MapFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  activeFilterCount,
  viewMode,
  onViewModeChange,
}: MapFiltersProps) {
  const reducedMotion = useReducedMotion()
  return (
    <div className="bg-white border-b shadow-sm z-30 relative">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Logo/Back */}
          <Link href="/" className="flex-shrink-0 hidden md:block">
            <span className="text-xl font-bold text-blue-600">US Attorneys</span>
          </Link>

          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for an attorney, a practice area..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            />
          </div>

          {/* Quick Service Filters */}
          <div className="hidden lg:flex items-center gap-2">
            {SERVICES.slice(0, 5).map((service) => (
              <button
                key={service.value}
                onClick={() => onFiltersChange({
                  ...filters,
                  service: filters.service === service.value ? '' : service.value
                })}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.service === service.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{service.icon}</span>
                {service.label}
              </button>
            ))}
          </div>

          {/* Filter Button */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-full transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-500 text-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View Mode Toggle (Desktop) */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => onViewModeChange('split')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'split' ? 'bg-white shadow' : ''}`}
              title="Split view"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              title="List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('map')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'map' ? 'bg-white shadow' : ''}`}
              title="Map"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={reducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pb-2">
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Service Dropdown */}
                  <select
                    value={filters.service}
                    onChange={(e) => onFiltersChange({ ...filters, service: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All practice areas</option>
                    {SERVICES.map((service) => (
                      <option key={service.value} value={service.value}>
                        {service.icon} {service.label}
                      </option>
                    ))}
                  </select>

                  {/* Rating Filter */}
                  <select
                    value={filters.minRating}
                    onChange={(e) => onFiltersChange({ ...filters, minRating: Number(e.target.value) })}
                    className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={0}>All ratings</option>
                    <option value={3}>⭐ 3+</option>
                    <option value={4}>⭐ 4+</option>
                    <option value={4.5}>⭐ 4.5+</option>
                  </select>

                  {/* Toggle Filters */}
                  <button
                    onClick={() => onFiltersChange({ ...filters, verified: !filters.verified })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      filters.verified
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Verified
                  </button>

                  <button
                    onClick={() => onFiltersChange({ ...filters, emergency: !filters.emergency })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      filters.emergency
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    24/7 Emergency
                  </button>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => onFiltersChange({
                        service: '',
                        minRating: 0,
                        verified: false,
                        emergency: false
                      })}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
