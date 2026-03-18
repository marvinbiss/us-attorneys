'use client'

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
  }
}

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
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - range && i <= page + range)
    ) {
      pages.push(i)
    } else if (
      pages.length > 0 &&
      pages[pages.length - 1] !== 'ellipsis'
    ) {
      pages.push('ellipsis')
    }
  }

  return (
    <nav
      aria-label="Search results pagination"
      className={cn(
        'flex items-center justify-center gap-1.5 mt-10',
        isPending && 'opacity-60 pointer-events-none'
      )}
    >
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 py-2 text-gray-400 dark:text-gray-500 text-sm"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={cn(
              'min-w-[40px] h-10 rounded-xl text-sm font-medium transition-all',
              p === page
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
        className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <SearchX className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        No attorneys found
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
        {query
          ? `We couldn't find any attorneys matching "${query}". Try broadening your search or adjusting filters.`
          : 'Try searching by name, practice area, or city to find attorneys near you.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="/practice-areas"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Scale className="w-4 h-4" />
          Browse practice areas
        </a>
        <a
          href="/search"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Clear search
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
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
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total > 0 ? (
                <>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {total.toLocaleString()}
                  </span>{' '}
                  attorney{total !== 1 ? 's' : ''} found
                  {query && (
                    <>
                      {' '}for{' '}
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
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <Suspense>
                <SearchFilters />
              </Suspense>
            </div>
          </aside>

          {/* Results list */}
          <main className="flex-1 min-w-0">
            {attorneys.length > 0 ? (
              <>
                <div className="space-y-4">
                  {attorneys.map((attorney, index) => (
                    <SearchResultCard
                      key={attorney.id}
                      attorney={attorney}
                      index={(page - 1) * limit + index}
                    />
                  ))}
                </div>
                <Pagination
                  page={page}
                  total={total}
                  limit={limit}
                  hasMore={hasMore}
                />
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
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-gray-50 dark:bg-gray-900 overflow-y-auto shadow-2xl animate-slide-in-right">
            {/* Drawer header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Filters
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                aria-label="Close filters"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <Suspense>
                <SearchFilters />
              </Suspense>
            </div>
            {/* Apply button (closes drawer) */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-safe">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
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
