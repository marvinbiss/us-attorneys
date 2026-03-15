'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize?: number
  onPageChange: (page: number) => void
  showTotal?: boolean
  showPageSize?: boolean
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize = 20,
  onPageChange,
  showTotal = true,
  showPageSize = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
}: PaginationProps) {
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (page > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <nav className="px-6 py-4 border-t border-gray-100 flex items-center justify-between" aria-label="Pagination">
      <div className="flex items-center gap-4">
        {showTotal && (
          <p className="text-sm text-gray-500">
            {total > 0 ? (
              <>
                Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
              </>
            ) : (
              'No results'
            )}
          </p>
        )}
        {showPageSize && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Items per page"
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((pageNum, index) =>
            pageNum === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                aria-label={`Page ${pageNum}`}
                aria-current={page === pageNum ? 'page' : undefined}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}
