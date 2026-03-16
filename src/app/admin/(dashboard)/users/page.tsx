'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Eye,
  Ban,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  User,
  Shield,
} from 'lucide-react'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { UserStatusBadge } from '@/components/admin/StatusBadge'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone_e164: string | null
  role: string | null
  created_at: string
}

interface UsersResponse {
  users: UserProfile[]
  totalPages: number
  total: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'clients' | 'attorneys'>('all')
  const [page, setPage] = useState(1)

  // Modal state (kept for future use — ban endpoint not yet active)
  const [banModal, setBanModal] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: '',
  })
  const [banReason, setBanReason] = useState('')

  const url = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      filter,
      search,
    })
    return `/api/admin/users?${params}`
  }, [page, filter, search])

  const { data, isLoading, error, mutate } = useAdminFetch<UsersResponse>(url)

  const users = data?.users ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const handleBanAction = async () => {
    try {
      await adminMutate(`/api/admin/users/${banModal.userId}/ban`, {
        method: 'POST',
        body: { action: 'ban', reason: banReason },
      })
      setBanModal({ open: false, userId: '', userName: '' })
      setBanReason('')
      mutate()
    } catch {
      // Error will surface via SWR's error state on next revalidation
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">{total} total users</p>
          </div>
          <button
            onClick={() => router.push('/admin/users/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            New user
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                aria-label="Search for a user"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type filter */}
            <div className="flex gap-2">
              {(['all', 'clients', 'attorneys'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f)
                    setPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' :
                   f === 'clients' ? 'Clients' : 'Attorneys'}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <ErrorBanner
            message={error.message}
            onDismiss={() => mutate()}
            onRetry={() => mutate()}
          />
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]" aria-label="Users list">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                      <th scope="col" className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.full_name || 'No name'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.phone_e164 && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <Phone className="w-3 h-3" />
                                {user.phone_e164}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.role === 'artisan' ? (
                              <Shield className="w-4 h-4 text-blue-500" />
                            ) : (
                              <User className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="capitalize">{user.role || 'client'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <UserStatusBadge status="active" />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View profile"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setBanModal({
                                open: true,
                                userId: user.id,
                                userName: user.full_name || user.email,
                              })}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Ban"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
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
                  Page {page} of {totalPages} ({total} results)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
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

      {/* Ban Modal */}
      {banModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => {
              setBanModal({ open: false, userId: '', userName: '' })
              setBanReason('')
            }} />
            <div role="dialog" aria-modal="true" aria-labelledby="ban-modal-title" className="relative bg-white rounded-xl shadow-xl max-w-[95vw] sm:max-w-md w-full p-6">
              <h3 id="ban-modal-title" className="text-lg font-semibold text-gray-900 mb-2">
                Ban user
              </h3>
              <p className="text-gray-600 mb-4">
                {`Are you sure you want to ban ${banModal.userName}? The user will no longer be able to access the platform.`}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for ban
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter the reason for the ban..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setBanModal({ open: false, userId: '', userName: '' })
                    setBanReason('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanAction}
                  className="px-4 py-2 text-white rounded-lg transition-colors bg-red-600 hover:bg-red-700"
                >
                  Ban
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
