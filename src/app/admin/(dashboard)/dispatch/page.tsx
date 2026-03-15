'use client'

import { useState } from 'react'
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Clock,
  Eye,
  Send,
  Inbox,
  Trash2,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusTabs } from '@/components/dashboard/StatusTabs'
import { Pagination } from '@/components/dashboard/Pagination'
import { STATUS_META } from '@/types/leads'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface DispatchAssignment {
  id: string
  status: string
  assigned_at: string
  viewed_at: string | null
  lead: {
    id: string
    service_name: string
    city: string
    urgency: string
    status: string
    created_at: string
  } | null
  provider: {
    id: string
    name: string
    specialty: string
    address_city: string
  } | null
}

interface DispatchData {
  assignments: DispatchAssignment[]
  stats: {
    pending: number
    viewed: number
    quoted: number
    declined?: number
    total: number
  }
  page: number
  pageSize: number
}

type StatusFilter = 'all' | 'pending' | 'viewed' | 'quoted' | 'declined'

export default function AdminDispatchPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const params = new URLSearchParams({ page: String(page) })
  if (statusFilter !== 'all') params.set('status', statusFilter)

  const { data, isLoading, error: fetchError, mutate } = useAdminFetch<DispatchData>(
    `/api/admin/dispatch?${params}`
  )

  const error = fetchError || (mutationError ? new Error(mutationError) : undefined)

  const handleReplay = async (assignmentId: string) => {
    setActionLoading(assignmentId)
    try {
      setMutationError(null)
      await adminMutate('/api/admin/dispatch', {
        method: 'POST',
        body: { action: 'replay', assignmentId },
      })
      mutate()
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    setActionLoading(id)
    try {
      setMutationError(null)
      await adminMutate('/api/admin/dispatch', {
        method: 'DELETE',
        body: { id },
      })
      setConfirmDeleteId(null)
      mutate()
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Error')
    } finally {
      setActionLoading(null)
    }
  }

  const statusTabs = [
    { key: 'all', label: 'All', count: data?.stats.total || 0 },
    { key: 'pending', label: 'Pending', count: data?.stats.pending || 0 },
    { key: 'viewed', label: 'Viewed', count: data?.stats.viewed || 0 },
    { key: 'quoted', label: 'Quoted', count: data?.stats.quoted || 0 },
    { key: 'declined', label: 'Declined', count: data?.stats.declined || 0 },
  ]

  const responseRate = data && data.stats.total > 0
    ? Math.round(((data.stats.viewed + data.stats.quoted) / data.stats.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dispatch Tracking</h1>
            <p className="text-gray-500 mt-1">Real-time assignment tracking</p>
          </div>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard
            title="Total assignments"
            value={data?.stats.total || 0}
            icon={<Inbox className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={data?.stats.pending || 0}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
          />
          <StatCard
            title="Quotes sent"
            value={data?.stats.quoted || 0}
            icon={<Send className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Response rate"
            value={`${responseRate}%`}
            icon={<Eye className="w-5 h-5" />}
            color="blue"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-sm">{error.message}</p>
          </div>
        )}

        {/* Status filter */}
        <div className="mb-6">
          <StatusTabs
            tabs={statusTabs}
            activeTab={statusFilter}
            onTabChange={(k) => { setStatusFilter(k as StatusFilter); setPage(1) }}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : data ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] sm:min-w-[700px] text-sm" aria-label="Dispatch assignments list">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Lead</th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Attorney</th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Assigned on</th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Viewed on</th>
                    <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        <ArrowRight className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        No assignments
                      </td>
                    </tr>
                  ) : (
                    data.assignments.map((a) => {
                      const st = STATUS_META[a.status] || STATUS_META.pending
                      return (
                        <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">
                              {a.lead?.service_name || '—'}
                            </span>
                            {a.lead?.city && (
                              <p className="text-xs text-gray-400 mt-0.5">{a.lead.city}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-700">{a.provider?.name || '—'}</span>
                            {a.provider?.specialty && (
                              <p className="text-xs text-gray-400 mt-0.5">{a.provider.specialty}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {new Date(a.assigned_at).toLocaleString('en-US', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {a.viewed_at
                              ? new Date(a.viewed_at).toLocaleString('en-US', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {a.status === 'pending' && (
                                <button
                                  onClick={() => handleReplay(a.id)}
                                  disabled={actionLoading === a.id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                >
                                  {actionLoading === a.id && confirmDeleteId !== a.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                  Retry
                                </button>
                              )}
                              {confirmDeleteId === a.id ? (
                                <>
                                  <button
                                    onClick={() => handleDelete(a.id)}
                                    disabled={actionLoading === a.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                  >
                                    {actionLoading === a.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(a.id)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {data.assignments.length >= data.pageSize && (
              <Pagination
                page={page}
                totalPages={Math.ceil((data.stats.total || 1) / data.pageSize)}
                onPageChange={setPage}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
