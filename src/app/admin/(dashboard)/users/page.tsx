'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Eye,
  Ban,
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-gray-500">{total} total users</p>
          </div>
          {/* Add user button removed — no /admin/users/nouveau page exists */}
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                aria-label="Search for a user"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'clients' ? 'Clients' : 'Attorneys'}
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
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]" aria-label="Users list">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Role
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
                        Registered
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
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
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phone_e164 && (
                              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                <Phone className="h-3 w-3" />
                                {user.phone_e164}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.role === 'attorney' ? (
                              <Shield className="h-4 w-4 text-blue-500" />
                            ) : (
                              <User className="h-4 w-4 text-gray-400" />
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
                              className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                              title="View profile"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() =>
                                setBanModal({
                                  open: true,
                                  userId: user.id,
                                  userName: user.full_name || user.email,
                                })
                              }
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Ban"
                            >
                              <Ban className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:px-6">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({total} results)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
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
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => {
                setBanModal({ open: false, userId: '', userName: '' })
                setBanReason('')
              }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ban-modal-title"
              className="relative w-full max-w-[95vw] rounded-xl bg-white p-6 shadow-xl sm:max-w-md"
            >
              <h3 id="ban-modal-title" className="mb-2 text-lg font-semibold text-gray-900">
                Ban user
              </h3>
              <p className="mb-4 text-gray-600">
                {`Are you sure you want to ban ${banModal.userName}? The user will no longer be able to access the platform.`}
              </p>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reason for ban
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the reason for the ban..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setBanModal({ open: false, userId: '', userName: '' })
                    setBanReason('')
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanAction}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
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
