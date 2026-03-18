'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Loader2,
  AlertCircle,
  Search,
  BarChart3,
  RefreshCw,
  Filter,
  SortAsc,
  LayoutGrid,
  List,
  Inbox,
  Clock,
  Send,
  Eye,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { LeadPipeline } from '@/components/attorney-dashboard/LeadPipeline'
import { LeadCard, type LeadCardData } from '@/components/attorney-dashboard/LeadCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { Pagination } from '@/components/dashboard/Pagination'

// ─── Types ──────────────────────────────────────────────────────────────────

interface LeadMeta {
  plan: string
  monthlyUsed: number
  monthlyLimit: number
  fullAccess: boolean
}

interface ApiResponse {
  data?: {
    leads: LeadCardData[]
    count: number
    pagination: {
      page: number
      pageSize: number
      totalPages: number
      totalItems: number
    }
    meta: LeadMeta
  }
  success?: boolean
  error?: { code?: string; message?: string }
}

type ViewMode = 'pipeline' | 'list'
type SortOption = 'newest' | 'priority' | 'response_deadline'

// ─── Filter Controls ────────────────────────────────────────────────────────

function FilterBar({
  searchQuery,
  onSearchChange,
  practiceArea,
  onPracticeAreaChange,
  priority,
  onPriorityChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
}: {
  searchQuery: string
  onSearchChange: (v: string) => void
  practiceArea: string
  onPracticeAreaChange: (v: string) => void
  priority: string
  onPriorityChange: (v: string) => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
  sortBy: SortOption
  onSortChange: (v: SortOption) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  showFilters: boolean
  onToggleFilters: () => void
}) {
  return (
    <div className="space-y-3">
      {/* Search bar + view toggle + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name, practice area, city..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search leads"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFilters}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
            }`}
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
            Filters
          </button>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange('pipeline')}
              aria-pressed={viewMode === 'pipeline'}
              className={`p-2.5 transition-colors ${
                viewMode === 'pipeline'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400'
              }`}
              title="Pipeline view"
              aria-label="Pipeline view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-pressed={viewMode === 'list'}
              className={`p-2.5 transition-colors border-l border-gray-200 dark:border-gray-700 ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400'
              }`}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div>
            <label htmlFor="filter-practice" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Practice Area
            </label>
            <input
              id="filter-practice"
              type="text"
              placeholder="e.g. Personal Injury"
              value={practiceArea}
              onChange={(e) => onPracticeAreaChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="filter-priority" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Priority
            </label>
            <select
              id="filter-priority"
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All priorities</option>
              <option value="emergency">Emergency</option>
              <option value="high">Urgent</option>
              <option value="medium">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-date-from" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              From
            </label>
            <input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="filter-date-to" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              To
            </label>
            <input
              id="filter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="filter-sort" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Sort by
            </label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" aria-hidden="true" />
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="newest">Newest first</option>
                <option value="priority">Priority score</option>
                <option value="response_deadline">Response deadline</option>
              </select>
            </div>
          </div>
          {(practiceArea || priority || dateFrom || dateTo) && (
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onPracticeAreaChange('')
                  onPriorityChange('')
                  onDateFromChange('')
                  onDateToChange('')
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-3 h-3" aria-hidden="true" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Lead Usage Meter ───────────────────────────────────────────────────────

function LeadUsageMeter({ used, limit, plan }: { used: number; limit: number; plan: string }) {
  const percentage = Math.min(100, Math.round((used / limit) * 100))
  const isNearLimit = percentage >= 80

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Monthly Lead Usage
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          plan === 'premium'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : plan === 'pro'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
        </span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
          {used}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">/ {limit} leads this month</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isNearLimit ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={`${used} of ${limit} leads used`}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
          {percentage >= 100
            ? 'Monthly lead limit reached. Upgrade your plan for more leads.'
            : 'Approaching monthly limit. Consider upgrading your plan.'}
        </p>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AttorneyLeadsPage() {
  const [leads, setLeads] = useState<LeadCardData[]>([])
  const [meta, setMeta] = useState<LeadMeta | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [practiceArea, setPracticeArea] = useState('')
  const [priority, setPriority] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline')
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Updating state
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  // ─── Fetch leads ────────────────────────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      params.set('sortBy', sortBy)
      if (practiceArea) params.set('practiceArea', practiceArea)
      if (priority) params.set('priority', priority)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/attorney/leads?${params.toString()}`)
      const result: ApiResponse = await response.json()

      if (response.ok && result.data) {
        setLeads(result.data.leads || [])
        setTotalCount(result.data.count || 0)
        setMeta(result.data.meta || null)
      } else if (response.status === 401) {
        window.location.href = '/login?redirect=/attorney-dashboard/leads'
        return
      } else {
        setError(result.error?.message || 'Error loading leads')
      }
    } catch {
      setError('Connection error. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, practiceArea, priority, dateFrom, dateTo, searchQuery])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // ─── Status change handler ──────────────────────────────────────────────

  const handleStatusChange = useCallback(async (assignmentId: string, newStatus: string) => {
    setUpdatingIds((prev) => new Set(prev).add(assignmentId))

    try {
      const response = await fetch('/api/attorney/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, status: newStatus }),
      })

      if (response.ok) {
        // Optimistic update
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === assignmentId
              ? {
                  ...lead,
                  status: newStatus,
                  viewed_at: newStatus === 'viewed' ? new Date().toISOString() : lead.viewed_at,
                  responded_at: ['quoted', 'declined', 'accepted', 'won', 'lost'].includes(newStatus)
                    ? new Date().toISOString()
                    : lead.responded_at,
                }
              : lead
          )
        )
      } else {
        const data = await response.json()
        setError(data.error?.message || 'Failed to update status')
      }
    } catch {
      setError('Connection error')
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(assignmentId)
        return next
      })
    }
  }, [])

  // ─── Stats ──────────────────────────────────────────────────────────────

  const statusCounts = useMemo(() => {
    const counts = { all: leads.length, pending: 0, viewed: 0, quoted: 0, accepted: 0, declined: 0 }
    for (const lead of leads) {
      const s = lead.status as keyof typeof counts
      if (s in counts) counts[s]++
    }
    return counts
  }, [leads])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading && leads.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" aria-hidden="true" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading leads...</p>
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/attorney-dashboard" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">Lead Pipeline</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/attorney-dashboard/leads/stats"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Statistics</span>
              </Link>
              <button
                type="button"
                onClick={fetchLeads}
                aria-label="Refresh leads"
                title="Refresh"
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick stats + usage meter */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              title="Total Leads"
              value={statusCounts.all}
              icon={<Inbox className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="New"
              value={statusCounts.pending}
              icon={<Clock className="w-5 h-5" />}
              color="yellow"
            />
            <StatCard
              title="Qualified"
              value={statusCounts.quoted}
              icon={<Send className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Response Rate"
              value={`${statusCounts.all > 0 ? Math.round(((statusCounts.quoted + statusCounts.viewed + statusCounts.accepted) / statusCounts.all) * 100) : 0}%`}
              icon={<Eye className="w-5 h-5" />}
              color="indigo"
            />
          </div>
          {meta && (
            <LeadUsageMeter
              used={meta.monthlyUsed}
              limit={meta.monthlyLimit}
              plan={meta.plan}
            />
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-red-700 dark:text-red-300 text-sm flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); setPage(1) }}
          practiceArea={practiceArea}
          onPracticeAreaChange={(v) => { setPracticeArea(v); setPage(1) }}
          priority={priority}
          onPriorityChange={(v) => { setPriority(v); setPage(1) }}
          dateFrom={dateFrom}
          onDateFromChange={(v) => { setDateFrom(v); setPage(1) }}
          dateTo={dateTo}
          onDateToChange={(v) => { setDateTo(v); setPage(1) }}
          sortBy={sortBy}
          onSortChange={(v) => { setSortBy(v); setPage(1) }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {/* Main content */}
        {leads.length === 0 && !loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No leads yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 max-w-md mx-auto">
              {searchQuery || practiceArea || priority || dateFrom || dateTo
                ? 'No leads match your current filters. Try adjusting your search criteria.'
                : 'Case inquiries will be assigned to you automatically based on your practice areas and location.'}
            </p>
          </div>
        ) : viewMode === 'pipeline' ? (
          <LeadPipeline
            leads={leads}
            onStatusChange={handleStatusChange}
            updatingIds={updatingIds}
          />
        ) : (
          <>
            <div className="space-y-3">
              {leads.map((assignment) => (
                <LeadCard
                  key={assignment.id}
                  assignment={assignment}
                  onStatusChange={handleStatusChange}
                  isUpdating={updatingIds.has(assignment.id)}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
