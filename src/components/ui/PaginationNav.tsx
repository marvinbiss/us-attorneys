import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

const ITEMS_PER_PAGE = 20

interface PaginationNavProps {
  currentPage: number
  totalItems: number
  perPage?: number
  /** Base path without query string, e.g. "/practice-areas/family-law/houston" */
  basePath: string
  /** Existing URL params to preserve (e.g. { q: 'smith', sort: 'rating' }) */
  preserveParams?: Record<string, string>
  className?: string
}

/**
 * Server-component-compatible pagination using <Link> tags.
 * Supports dark mode, aria-labels, rel=prev/next, ellipsis, and param preservation.
 */
export function PaginationNav({
  currentPage,
  totalItems,
  perPage = ITEMS_PER_PAGE,
  basePath,
  preserveParams = {},
  className,
}: PaginationNavProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  if (totalPages <= 1) return null

  // Build URL for a given page number
  const getPageUrl = (page: number): string => {
    const params = new URLSearchParams()
    // Preserve existing params
    for (const [key, value] of Object.entries(preserveParams)) {
      if (value) params.set(key, value)
    }
    // Add page param only if > 1
    if (page > 1) {
      params.set('page', String(page))
    } else {
      params.delete('page')
    }
    const qs = params.toString()
    return `${basePath}${qs ? `?${qs}` : ''}`
  }

  // Build page number array with ellipsis
  const pages: (number | 'ellipsis')[] = []
  const range = 2 // pages around current

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - range && i <= currentPage + range)
    ) {
      pages.push(i)
    } else if (pages.length > 0 && pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  // Showing range
  const from = (currentPage - 1) * perPage + 1
  const to = Math.min(currentPage * perPage, totalItems)

  return (
    <div className={clsx('flex flex-col items-center gap-4', className)}>
      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{from}-{to}</span> of{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{totalItems.toLocaleString()}</span> results
      </p>

      <nav
        className="flex items-center justify-center gap-1.5"
        aria-label="Pagination navigation"
        role="navigation"
      >
        {/* Previous */}
        {currentPage > 1 ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            rel="prev"
            className="flex items-center gap-1 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Go to page ${currentPage - 1}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Link>
        ) : (
          <span
            className="flex items-center gap-1 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed"
            aria-disabled="true"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </span>
        )}

        {/* Page numbers */}
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-gray-400 dark:text-gray-500 text-sm select-none"
              aria-hidden="true"
            >
              &hellip;
            </span>
          ) : (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={clsx(
                'min-w-[40px] h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all',
                page === currentPage
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          )
        )}

        {/* Next */}
        {currentPage < totalPages ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            rel="next"
            className="flex items-center gap-1 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Go to page ${currentPage + 1}`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span
            className="flex items-center gap-1 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed"
            aria-disabled="true"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </nav>
    </div>
  )
}

export default PaginationNav
