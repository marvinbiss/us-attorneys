'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronRight,
  Search,
  Inbox,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import ClientSidebar from '@/components/client/ClientSidebar'
import { StatusTabs } from '@/components/dashboard/StatusTabs'
import { Pagination } from '@/components/dashboard/Pagination'
import { StatCard } from '@/components/dashboard/StatCard'
import { URGENCY_META } from '@/types/leads'

interface ClientLead {
  id: string
  service_name: string
  city: string | null
  postal_code: string | null
  description: string
  budget: string | null
  urgency: string
  created_at: string
  derived_status: string
  derived_status_label: string
  last_activity: string
  event_count: number
}

interface Stats {
  total: number
  en_attente: number
  en_traitement: number
  devis_recus: number
  termine: number
}

interface PaginationData {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
}

type StatusFilter = 'all' | 'en_attente' | 'en_traitement' | 'devis_recus' | 'termine'

const STATUS_COLORS: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  en_traitement: 'bg-blue-100 text-blue-700',
  devis_recus: 'bg-green-100 text-green-700',
  accepte: 'bg-emerald-100 text-emerald-700',
  termine: 'bg-green-100 text-green-800',
  expire: 'bg-orange-100 text-orange-700',
  refuse: 'bg-red-100 text-red-700',
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export default function MyCasesPage() {
  const [leads, setLeads] = useState<ClientLead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const fetchLeads = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '15',
        status: statusFilter,
      })
      const res = await fetch(`/api/client/leads?${params}`)
      const data = await res.json()

      if (res.ok) {
        setLeads(data.leads || [])
        setStats(data.stats || null)
        setPagination(data.pagination || null)
      } else if (res.status === 401) {
        window.location.href = '/login?redirect=/client-dashboard/my-cases'
        return
      } else {
        setError(data.error || 'Failed to load data')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Client-side search filter on loaded results
  const filtered = searchQuery
    ? leads.filter((l) => {
        const q = searchQuery.toLowerCase()
        return (
          l.service_name.toLowerCase().includes(q) ||
          (l.city || '').toLowerCase().includes(q) ||
          (l.postal_code || '').includes(q)
        )
      })
    : leads

  const tabs = [
    { key: 'all', label: 'All', count: stats?.total || 0 },
    { key: 'en_attente', label: 'Pending', count: stats?.en_attente || 0 },
    { key: 'en_traitement', label: 'In Progress', count: stats?.en_traitement || 0 },
    { key: 'devis_recus', label: 'Quotes Received', count: stats?.devis_recus || 0 },
    { key: 'termine', label: 'Completed', count: stats?.termine || 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/client-dashboard" className="hover:text-gray-900">Client Dashboard</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">My Cases</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Consultation Requests</h1>
            </div>
            <button
              onClick={fetchLeads}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
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
                  title="Total"
                  value={stats.total}
                  icon={<Inbox className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="Pending"
                  value={stats.en_attente}
                  icon={<Clock className="w-5 h-5" />}
                  color="yellow"
                />
                <StatCard
                  title="Quotes Received"
                  value={stats.devis_recus}
                  icon={<FileText className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="Completed"
                  value={stats.termine}
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
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-56 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">No cases</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchQuery
                    ? 'No results for this search.'
                    : 'Your consultation requests will appear here.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filtered.map((lead) => {
                    const urg = URGENCY_META[lead.urgency] || URGENCY_META.normal
                    const statusColor = STATUS_COLORS[lead.derived_status] || 'bg-gray-100 text-gray-700'

                    return (
                      <Link
                        key={lead.id}
                        href={`/client-dashboard/my-cases/${lead.id}`}
                        className="block bg-white rounded-xl border border-gray-100 transition-all hover:shadow-md hover:border-blue-200 group"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {lead.service_name}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urg.cls}`}>
                                  {urg.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                  {lead.derived_status_label}
                                </span>
                              </div>

                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {lead.description}
                              </p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatRelative(lead.last_activity)}
                                </span>
                                {lead.city && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {lead.city} {lead.postal_code && `(${lead.postal_code})`}
                                  </span>
                                )}
                                {lead.event_count > 0 && (
                                  <span className="text-gray-400">
                                    {lead.event_count} event{lead.event_count > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
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
