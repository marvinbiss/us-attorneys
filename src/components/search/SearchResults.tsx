'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useState, useCallback, Suspense } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  SearchX,
  Scale,
  ArrowRight,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchResultCard, type SearchAttorney } from './SearchResultCard'
import { SearchFilters } from './SearchFilters'

interface SearchResultsProps {
  attorneys: SearchAttorney[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  query: string
  filters: {
    pa?: string
    state?: string
    city?: string
    rating?: string
    sort?: string
    free_consultation?: string
    verified?: string
    radius?: string
    available?: string
    lang?: string
  }
}

const INLINE_SORT_OPTIONS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'available', label: 'Available soonest' },
]

function Pagination({
  page,
  total,
  limit,
  hasMore,
}: {
  page: number
  total: number
  limit: number
  hasMore: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newPage > 1) {
        params.set('page', String(newPage))
      } else {
        params.delete('page')
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: true })
      })
    },
    [router, pathname, searchParams]
  )

  if (totalPages <= 1) return null

  // Build page numbers to display
  const pages: (number | 'ellipsis')[] = []
  const range = 2 // pages around current
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - range && i <= page + range)) {
      pages.push(i)
    } else if (pages.length > 0 && pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <nav
      aria-label="Search results pagination"
      className={cn(
        'mt-10 flex items-center justify-center gap-1.5',
        isPending && 'pointer-events-none opacity-60'
      )}
    >
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 py-2 text-sm text-gray-400 dark:text-gray-500"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={cn(
              'h-10 min-w-[40px] rounded-xl text-sm font-medium transition-all',
              p === page
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(page + 1)}
        disabled={!hasMore}
        className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
        <SearchX className="h-10 w-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">No attorneys found</h2>
      <p className="mx-auto mb-8 max-w-md text-gray-500 dark:text-gray-400">
        {query
          ? `We couldn't find any attorneys matching "${query}". Try broadening your search or adjusting filters.`
          : 'Try searching by name, practice area, or city to find attorneys near you.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/practice-areas"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Scale className="h-4 w-4" />
          Browse practice areas
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Clear search
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function SortBar({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'relevance') {
        params.set('sort', value)
      } else {
        params.delete('sort')
      }
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  return (
    <div
      className={cn(
        'scrollbar-hide mb-4 flex items-center gap-2 overflow-x-auto border-b border-gray-100 pb-4 dark:border-gray-700',
        isPending && 'pointer-events-none opacity-60'
      )}
    >
      <ArrowUpDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
      <span className="hidden flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 sm:inline">
        Sort:
      </span>
      {INLINE_SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleSort(opt.value)}
          className={cn(
            'min-h-[44px] flex-shrink-0 touch-manipulation whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-medium transition-all',
            currentSort === opt.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function SearchResults({
  attorneys,
  total,
  page,
  limit,
  hasMore,
  query,
  filters,
}: SearchResultsProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const activeFilterCount = [
    filters.pa,
    filters.state,
    filters.city,
    filters.rating,
    filters.free_consultation,
    filters.verified,
    filters.radius,
    filters.available,
    filters.lang,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Results header */}
        <div className="mb-6 flex items-center justify-between">
          <div aria-live="polite" aria-atomic="true">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total > 0 ? (
                <>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {total.toLocaleString()}
                  </span>{' '}
                  attorney{total !== 1 ? 's' : ''} found
                  {query && (
                    <>
                      {' '}
                      for{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        &ldquo;{query}&rdquo;
                      </span>
                    </>
                  )}
                </>
              ) : (
                'No results'
              )}
            </p>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar filters */}
          <aside className="hidden w-80 flex-shrink-0 lg:block">
            <div className="sticky top-24">
              <Suspense>
                <SearchFilters />
              </Suspense>
            </div>
          </aside>

          {/* Results list */}
          <main className="min-w-0 flex-1">
            {attorneys.length > 0 ? (
              <>
                {/* Inline sort bar */}
                <SortBar currentSort={filters.sort || 'relevance'} />
                <div className="space-y-4">
                  {attorneys.map((attorney, index) => (
                    <SearchResultCard
                      key={attorney.id}
                      attorney={attorney}
                      index={(page - 1) * limit + index}
                    />
                  ))}
                </div>
                <Pagination page={page} total={total} limit={limit} hasMore={hasMore} />
              </>
            ) : (
              <EmptyState query={query} />
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer (overlay) */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-full max-w-sm animate-slide-in-right overflow-y-auto bg-gray-50 shadow-2xl dark:bg-gray-900">
            {/* Drawer header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close filters"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <Suspense>
                <SearchFilters />
              </Suspense>
            </div>
            {/* Apply button (closes drawer) */}
            <div className="pb-safe sticky bottom-0 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in animation */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default SearchResults
