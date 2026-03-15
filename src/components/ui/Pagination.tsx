'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageUrl = (page: number) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const url = new URL(baseUrl, origin)
    url.searchParams.set('page', String(page))
    return `${url.pathname}${url.search}`
  }

  const pages: (number | 'ellipsis')[] = []

  // Always show first page
  pages.push(1)

  // Add ellipsis if needed
  if (currentPage > 3) {
    pages.push('ellipsis')
  }

  // Add pages around current
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  // Add ellipsis if needed
  if (currentPage < totalPages - 2) {
    pages.push('ellipsis')
  }

  // Always show last page
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages)
  }

  return (
    <nav
      className={clsx('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={clsx(
                'min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 cursor-not-allowed">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  )
}

export default Pagination
