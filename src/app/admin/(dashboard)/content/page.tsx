'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileEdit, ChevronLeft, ChevronRight } from 'lucide-react'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch } from '@/hooks/admin/useAdminFetch'
import type { CmsPage } from '@/types/cms'

type CMSPageListItem = Pick<
  CmsPage,
  'id' | 'title' | 'slug' | 'page_type' | 'status' | 'updated_at' | 'is_active'
>

interface CMSResponse {
  success: boolean
  data: CMSPageListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const PAGE_TYPES = [
  { value: '', label: 'All' },
  { value: 'static', label: 'Static' },
  { value: 'blog', label: 'Blog' },
  { value: 'service', label: 'Services' },
  { value: 'location', label: 'Location' },
  { value: 'homepage', label: 'Home' },
  { value: 'faq', label: 'FAQ' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const statusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return { label: 'Draft', classes: 'bg-yellow-100 text-yellow-800' }
    case 'published':
      return { label: 'Published', classes: 'bg-green-100 text-green-800' }
    case 'archived':
      return { label: 'Archived', classes: 'bg-gray-100 text-gray-800' }
    default:
      return { label: status, classes: 'bg-gray-100 text-gray-600' }
  }
}

const typeBadge = (type: string) => {
  switch (type) {
    case 'static':
      return { label: 'Static', classes: 'bg-blue-100 text-blue-800' }
    case 'blog':
      return { label: 'Blog', classes: 'bg-blue-100 text-blue-800' }
    case 'service':
      return { label: 'Service', classes: 'bg-green-100 text-green-800' }
    case 'location':
      return { label: 'Location', classes: 'bg-amber-100 text-amber-800' }
    case 'homepage':
      return { label: 'Home', classes: 'bg-red-100 text-red-800' }
    case 'faq':
      return { label: 'FAQ', classes: 'bg-blue-100 text-blue-800' }
    default:
      return { label: type, classes: 'bg-gray-100 text-gray-600' }
  }
}

export default function AdminContentPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageType, setPageType] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<NodeJS.Timeout>()
  const pageSize = 20

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value)
      setCurrentPage(1)
    }, 300)
  }

  // Build URL dynamically from state
  const params = new URLSearchParams({
    page: String(currentPage),
    pageSize: String(pageSize),
  })
  if (pageType) params.set('page_type', pageType)
  if (status) params.set('status', status)
  if (search) params.set('search', search)

  const { data, isLoading, error, mutate } = useAdminFetch<CMSResponse>(`/api/admin/cms?${params}`)

  const pages = data?.data || []
  const total = data?.pagination?.total || 0

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [pageType, status])

  const totalPages = Math.ceil(total / pageSize)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
            <p className="mt-1 text-gray-500">
              {total} page{total !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/admin/content/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New page
          </Link>
        </div>

        {/* Tab filters for page_type */}
        <div className="mb-4 flex flex-wrap gap-1">
          {PAGE_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setPageType(pt.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pageType === pt.value
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>

        {/* Search and status filter */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages..."
                aria-label="Search pages"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                maxLength={200}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorBanner message={error.message} onRetry={() => mutate()} />
            </div>
          ) : pages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileEdit className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No pages found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  className="w-full min-w-[400px] sm:min-w-[700px]"
                  aria-label="CMS pages list"
                >
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Title
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Last modified
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pages.map((page) => {
                      const sb = statusBadge(page.status)
                      const tb = typeBadge(page.page_type)
                      return (
                        <tr
                          key={page.id}
                          onClick={() => router.push(`/admin/content/${page.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              router.push(`/admin/content/${page.id}`)
                            }
                          }}
                          tabIndex={0}
                          role="link"
                          className="cursor-pointer transition-colors hover:bg-gray-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {page.title}
                                {!page.is_active && (
                                  <span className="ml-2 text-xs text-red-500">(deleted)</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">/{page.slug}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tb.classes}`}
                            >
                              {tb.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sb.classes}`}
                            >
                              {sb.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(page.updated_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/content/${page.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:px-6">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages} ({total} results)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
