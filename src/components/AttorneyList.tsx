'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Provider } from '@/types'

import AttorneyCard from './AttorneyCard'
import SearchFilters from './SearchFilters'
import { AttorneyListSkeleton } from '@/components/ui/Skeleton'

interface AttorneyListProps {
  providers: Provider[]
  onProviderHover?: (provider: Provider | null) => void
  isLoading?: boolean
  totalCount?: number
  searchQuery?: string
  sortOrder?: 'default' | 'name' | 'rating'
  highlightedProviderId?: string | null
}

interface FilterState {
  verified: boolean
  minRating: number | null
  sortBy: 'relevance' | 'rating' | 'name'
}

export default function AttorneyList({
  providers,
  onProviderHover,
  isLoading = false,
  totalCount,
  searchQuery = '',
  sortOrder,
  highlightedProviderId,
}: AttorneyListProps) {
  const [filters, setFilters] = useState<FilterState>({
    verified: false,
    minRating: null,
    sortBy: 'relevance',
  })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll to highlighted card when map pin is hovered
  useEffect(() => {
    if (!highlightedProviderId || !listRef.current) return
    const el = listRef.current.querySelector(`[data-provider-id="${highlightedProviderId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [highlightedProviderId])

  // Merge external sortOrder prop into filters
  const effectiveSortBy =
    sortOrder === 'name' ? 'name' : sortOrder === 'rating' ? 'rating' : filters.sortBy

  const displayedProviders = useMemo(() => {
    // Apply filters
    const filtered = providers.filter((p) => {
      if (filters.verified && !p.is_verified) return false
      if (filters.minRating !== null && (p.rating_average ?? 0) < filters.minRating) return false
      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const nameMatch = p.name.toLowerCase().includes(q)
        const specialtyMatch = p.specialty?.name?.toLowerCase().includes(q) ?? false
        const cityMatch = p.address_city?.toLowerCase().includes(q) ?? false
        if (!nameMatch && !specialtyMatch && !cityMatch) return false
      }
      return true
    })

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (effectiveSortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return (b.rating_average ?? 0) - (a.rating_average ?? 0)
        case 'relevance':
        default: {
          // STRICT RULE: providers with phone always rank above those without
          const aPhone = !!a.phone
          const bPhone = !!b.phone
          if (aPhone !== bPhone) return aPhone ? -1 : 1
          if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1
          return 0
        }
      }
    })
  }, [providers, filters, searchQuery, effectiveSortBy])

  return (
    <div className="flex h-full flex-col">
      {/* Filters */}
      <SearchFilters
        onFilterChange={setFilters}
        totalResults={isLoading ? 0 : (totalCount ?? displayedProviders.length)}
      />

      {/* Provider list */}
      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
        role="region"
        aria-label="Attorney listing"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <AttorneyListSkeleton count={5} />
        ) : displayedProviders.length > 0 ? (
          <ul className="space-y-4" role="list">
            {displayedProviders.map((provider) => (
              <li
                key={provider.id}
                data-provider-id={provider.id}
                onMouseEnter={() => {
                  setHoveredId(provider.id)
                  onProviderHover?.(provider)
                }}
                onMouseLeave={() => {
                  setHoveredId(null)
                  onProviderHover?.(null)
                }}
                onFocus={() => {
                  setHoveredId(provider.id)
                  onProviderHover?.(provider)
                }}
                onBlur={() => {
                  setHoveredId(null)
                  onProviderHover?.(null)
                }}
              >
                <AttorneyCard
                  provider={provider}
                  isHovered={hoveredId === provider.id || highlightedProviderId === provider.id}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-12 text-center" role="status" aria-live="polite">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <svg
                className="h-8 w-8 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
              No attorneys found matching your search
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try broadening your search or adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
