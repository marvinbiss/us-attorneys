'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import ClientSidebar from '@/components/client/ClientSidebar'
import { StatusTabs } from '@/components/dashboard/StatusTabs'
import { Pagination } from '@/components/dashboard/Pagination'
import { StatCard } from '@/components/dashboard/StatCard'
import { CaseCard } from '@/components/client-dashboard/CaseCard'
import type { CaseCardData } from '@/components/client-dashboard/CaseCard'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  total: number
  active: number
  pending: number
  completed: number
  cancelled: number
}

interface PaginationData {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
}

type StatusFilter = 'all' | 'active' | 'pending' | 'completed' | 'cancelled'

// ─── Component ───────────────────────────────────────────────────────────────

export default function CasesPage() {
  const [cases, setCases] = useState<CaseCardData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const fetchCases = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '15',
        status: statusFilter,
      })
      const res = await fetch(`/api/client/cases?${params}`)
      const data = await res.json()

      if (res.ok && data.success) {
        setCases(data.data?.cases || [])
        setStats(data.data?.stats || null)
        setPagination(data.data?.pagination || null)
      } else if (res.status === 401) {
        window.location.href = '/login?redirect=/client-dashboard/cases'
        return
      } else {
        setError(data.error?.message || 'Failed to load cases')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  // Client-side search filter
  const filtered = searchQuery
    ? cases.filter((c) => {
        const q = searchQuery.toLowerCase()
        return (
          (c.practice_area || '').toLowerCase().includes(q) ||
          (c.attorney_name || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        )
      })
    : cases

  const tabs = [
    { key: 'all', label: 'All', count: stats?.total || 0 },
    { key: 'active', label: 'Active', count: stats?.active || 0 },
    { key: 'pending', label: 'Pending', count: stats?.pending || 0 },
    { key: 'completed', label: 'Completed', count: stats?.completed || 0 },
    { key: 'cancelled', label: 'Cancelled', count: stats?.cancelled || 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Link href="/client-dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
                  Client Dashboard
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">Cases</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Cases</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track your legal matters, consultations, and case progress
              </p>
            </div>
            <button
              onClick={fetchCases}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              aria-label="Refresh cases"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <ClientSidebar activePage="my-cases" />

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  title="Total Cases"
                  value={stats.total}
                  icon={<Briefcase className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="Active"
                  value={stats.active}
                  icon={<Clock className="w-5 h-5" />}
                  color="indigo"
                />
                <StatCard
                  title="Pending"
                  value={stats.pending}
                  icon={<AlertCircle className="w-5 h-5" />}
                  color="yellow"
                />
                <StatCard
                  title="Completed"
                  value={stats.completed}
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="green"
                />
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <StatusTabs
                  tabs={tabs}
                  activeTab={statusFilter}
                  onTabChange={(k) => { setStatusFilter(k as StatusFilter); setPage(1) }}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-56 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Search cases"
                />
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading your cases...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {searchQuery ? (
                    <Search className="w-7 h-7 text-gray-400" />
                  ) : (
                    <Inbox className="w-7 h-7 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                  {searchQuery ? 'No matching cases' : 'No cases yet'}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : 'Your legal cases and consultations will appear here.'}
                </p>
                {!searchQuery && (
                  <Link
                    href="/attorneys"
                    className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Find an Attorney
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filtered.map((caseItem) => (
                    <CaseCard key={caseItem.id} caseData={caseItem} />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
