'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Eye,
  Edit2,
  Ban,
  CheckCircle,
  Star,
  MapPin,
  Mail,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import { Toast } from '@/components/admin/Toast'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface Provider {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  address_city: string
  address_state: string
  specialty: string
  is_verified: boolean
  is_active: boolean
  rating_average: number
  review_count: number
  created_at: string
  source?: string
  bar_number?: string
}

interface ProvidersResponse {
  success: boolean
  providers: Provider[]
  totalPages: number
  total: number
}

export default function AdminProvidersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'suspended'>('all')
  const [page, setPage] = useState(1)

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; attorneyId: string }>({
    open: false,
    attorneyId: '',
  })

  // Debounce search
  const [searchDebounce, setSearchDebounce] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const url = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      filter,
      search: searchDebounce,
    })
    return `/api/admin/providers?${params}`
  }, [page, filter, searchDebounce])

  const { data, isLoading, mutate } = useAdminFetch<ProvidersResponse>(url)

  const providers = data?.providers ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0
  const loading = isLoading

  const handleAction = async (attorneyId: string, action: 'verify' | 'suspend' | 'activate') => {
    // Prevent double-click
    if (actionLoading) return

    // Confirmation for destructive actions via modal
    if (action === 'suspend') {
      setSuspendModal({ open: true, attorneyId })
      return
    }

    await executeAction(attorneyId, action)
  }

  const executeAction = async (attorneyId: string, action: 'verify' | 'suspend' | 'activate') => {
    try {
      setActionLoading(attorneyId)

      const updates: Record<string, unknown> = {}
      if (action === 'verify') updates.is_verified = true
      if (action === 'suspend') updates.is_active = false
      if (action === 'activate') updates.is_active = true

      await adminMutate(`/api/admin/providers/${attorneyId}`, {
        method: 'PATCH',
        body: updates,
      })

      const actionText = action === 'verify' ? 'verified' : action === 'suspend' ? 'suspended' : 'reactivated'
      setToast({ message: `Attorney ${actionText} successfully!`, type: 'success' })

      mutate()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed'
      setToast({ message: `Error: ${message}`, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefresh = () => {
    mutate()
  }

  const getStatusBadge = (provider: Provider) => {
    if (!provider.is_active) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Suspended</span>
    }
    if (!provider.is_verified) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Verified</span>
  }

  return (
    <div className="min-h-screen bg-gray-50" aria-label="Attorney Management">
      {/* Toast notification */}
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attorney Management</h1>
            <p className="text-gray-500 mt-1">
              {total > 0 ? `${total} attorney${total > 1 ? 's' : ''} total` : 'Manage attorney profiles and verifications'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, city, bar number..."
                aria-label="Search for an attorney"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'verified', 'pending', 'suspended'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    if (filter !== f) {
                      setFilter(f)
                      setPage(1) // Reset to first page on filter change
                    }
                  }}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {f === 'all' ? 'All' :
                   f === 'verified' ? 'Verified' :
                   f === 'pending' ? 'Pending' : 'Suspended'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading && providers.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
              <p className="text-gray-500 mt-4">Loading attorneys...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attorneys found</h3>
              <p className="text-gray-500 mb-4">
                {filter !== 'all' || search
                  ? 'No results for this search. Try adjusting your filters.'
                  : 'Start by importing attorneys'}
              </p>
              {filter === 'all' && !search && (
                <Link
                  href="/admin/import"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Import Attorneys
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto relative">
                <table className="w-full min-w-[500px] sm:min-w-[900px]" aria-label="Attorney list">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attorney
                      </th>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Specialty
                      </th>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reviews
                      </th>
                      <th scope="col" className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {providers.map((provider) => (
                      <tr
                        key={provider.id}
                        className={`hover:bg-gray-50 transition-colors ${actionLoading === provider.id ? 'opacity-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{provider.name}</p>
                            </div>
                            {provider.email ? (
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <Mail className="w-3 h-3" />
                                {provider.email}
                              </div>
                            ) : provider.bar_number ? (
                              <div className="mt-1 text-sm text-gray-400 font-mono">
                                Bar #: {provider.bar_number}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{provider.specialty}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{provider.address_city || 'Not specified'}</span>
                          </div>
                          {provider.address_state && (
                            <p className="text-sm text-gray-500">{provider.address_state}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(provider)}</td>
                        <td className="px-6 py-4">
                          {provider.review_count > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{provider.rating_average}</span>
                              <span className="text-gray-500 text-sm">({provider.review_count})</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No reviews</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* View button */}
                            <button
                              onClick={() => router.push(`/admin/attorneys/${provider.id}`)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View profile"
                              aria-label="View profile"
                            >
                              <Eye className="w-5 h-5" />
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => router.push(`/admin/attorneys/${provider.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                              aria-label="Edit"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>

                            {/* Verify button - only show if not verified */}
                            {!provider.is_verified && (
                              <button
                                onClick={() => handleAction(provider.id, 'verify')}
                                disabled={actionLoading === provider.id}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Verify this attorney"
                                aria-label="Verify this attorney"
                              >
                                {actionLoading === provider.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                              </button>
                            )}

                            {/* Suspend/Activate button */}
                            {provider.is_active ? (
                              <button
                                onClick={() => handleAction(provider.id, 'suspend')}
                                disabled={actionLoading === provider.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Suspend"
                                aria-label="Suspend"
                              >
                                {actionLoading === provider.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Ban className="w-5 h-5" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(provider.id, 'activate')}
                                disabled={actionLoading === provider.id}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reactivate"
                                aria-label="Reactivate"
                              >
                                {actionLoading === provider.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({total} result{total > 1 ? 's' : ''})
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1 || loading}
                    aria-label="Previous page"
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || loading}
                    aria-label="Next page"
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      <ConfirmationModal
        isOpen={suspendModal.open}
        onClose={() => setSuspendModal({ open: false, attorneyId: '' })}
        onConfirm={async () => {
          setSuspendModal({ open: false, attorneyId: '' })
          await executeAction(suspendModal.attorneyId, 'suspend')
        }}
        title="Suspend Attorney"
        message="Are you sure you want to suspend this attorney? They will no longer be visible on the platform."
        confirmText="Suspend"
        variant="danger"
      />
    </div>
  )
}
