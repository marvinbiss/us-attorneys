'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Loader2,
  Activity,
} from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { StatCard } from '@/components/dashboard/StatCard'
import type { LeadEventType } from '@/types/leads'

interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  admin?: {
    email: string
    full_name: string | null
  }
}

interface LeadEvent {
  id: string
  lead_id: string
  attorney_id: string | null
  actor_id: string | null
  event_type: LeadEventType
  metadata: Record<string, unknown>
  created_at: string
}

const ENTITY_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'user', label: 'Users' },
  { value: 'provider', label: 'Attorneys' },
  { value: 'review', label: 'Reviews' },
  { value: 'payment', label: 'Payments' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'booking', label: 'Bookings' },
  { value: 'service', label: 'Services' },
  { value: 'report', label: 'Reports' },
]

const eventTypeLabels: Record<string, string> = {
  'created': 'Created',
  'dispatched': 'Dispatched',
  'viewed': 'Viewed',
  'quoted': 'Quote sent',
  'declined': 'Declined',
  'accepted': 'Accepted',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'expired': 'Expired',
  'pending': 'Pending',
  'reassigned': 'Reassigned',
  'refused': 'Refused',
}

type AuditTab = 'audit_logs' | 'lead_events'

export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState<AuditTab>('lead_events')

  // Audit logs state
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotalPages, setLogsTotalPages] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)
  const [entityType, setEntityType] = useState('all')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Lead events state
  const [leadEvents, setLeadEvents] = useState<LeadEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsPage, setEventsPage] = useState(1)
  const [eventsTotalPages, setEventsTotalPages] = useState(1)
  const [eventsTotal, setEventsTotal] = useState(0)
  const [eventTypeCounts, setEventTypeCounts] = useState<Record<string, number>>({})
  const [eventTypeFilter, setEventTypeFilter] = useState('')

  // Fetch audit logs
  useEffect(() => {
    if (activeTab !== 'audit_logs') return
    const fetchLogs = async () => {
      try {
        setLogsLoading(true)
        const params = new URLSearchParams({
          page: String(logsPage),
          limit: '50',
          entityType,
          action,
          dateFrom,
          dateTo,
        })
        const response = await fetch(`/api/admin/audit?${params}`)
        if (response.ok) {
          const data = await response.json()
          setLogs(data.logs || [])
          setLogsTotalPages(data.totalPages || 1)
          setLogsTotal(data.total || 0)
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
      } finally {
        setLogsLoading(false)
      }
    }
    fetchLogs()
  }, [activeTab, logsPage, entityType, action, dateFrom, dateTo])

  // Fetch lead events from dispatch endpoint (lead_assignments with pagination)
  useEffect(() => {
    if (activeTab !== 'lead_events') return
    const fetchEvents = async () => {
      try {
        setEventsLoading(true)
        const params = new URLSearchParams({
          page: String(eventsPage),
        })

        const response = await fetch(`/api/admin/dispatch?${params}`)
        if (response.ok) {
          const data = await response.json()
          // Map lead_assignments to LeadEvent shape
          const assignments: LeadEvent[] = (data.assignments || []).map(
            (a: { id: string; lead_id: string; attorney_id: string | null; status: string; assigned_at: string }) => ({
              id: a.id,
              lead_id: a.lead_id,
              attorney_id: a.attorney_id ?? null,
              actor_id: null,
              event_type: (a.status as LeadEventType) || 'dispatched',
              metadata: {},
              created_at: a.assigned_at,
            })
          )
          setLeadEvents(assignments)
          const stats: { pending: number; viewed: number; quoted: number; total: number } = data.stats || {}
          setEventsTotal(stats.total || 0)
          setEventsTotalPages(Math.ceil((stats.total || 0) / 20) || 1)
          // Build type counts from stats
          const counts: Record<string, number> = {}
          if (stats.pending) counts['pending'] = stats.pending
          if (stats.viewed) counts['viewed'] = stats.viewed
          if (stats.quoted) counts['quoted'] = stats.quoted
          setEventTypeCounts(counts)
        }
      } catch (error) {
        console.error('Failed to fetch lead events:', error)
      } finally {
        setEventsLoading(false)
      }
    }
    fetchEvents()
  }, [activeTab, eventsPage, eventTypeFilter])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  const getActionBadge = (action: string) => {
    if (action.includes('create')) return <StatusBadge variant="success">Create</StatusBadge>
    if (action.includes('update') || action.includes('change')) return <StatusBadge variant="info">Modification</StatusBadge>
    if (action.includes('delete') || action.includes('cancel')) return <StatusBadge variant="error">Suppression</StatusBadge>
    if (action.includes('ban')) return <StatusBadge variant="error">Ban</StatusBadge>
    if (action.includes('refund')) return <StatusBadge variant="warning">Remboursement</StatusBadge>
    return <StatusBadge variant="default">Action</StatusBadge>
  }

  const totalEventsAll = Object.values(eventTypeCounts).reduce((s, c) => s + c, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Audit & Events</h1>
          <p className="text-gray-500 mt-1">Append-only audit trail</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard
            title="Lead events"
            value={totalEventsAll}
            icon={<Activity className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Logs admin"
            value={logsTotal}
            icon={<Shield className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Event types"
            value={Object.keys(eventTypeCounts).length}
            icon={<FileText className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Immutability"
            value="STRICT"
            subtitle="No mutations"
            icon={<Shield className="w-5 h-5" />}
            color="green"
          />
        </div>

        {/* Tab toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('lead_events')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'lead_events' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-1.5" />
            Lead Events
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'audit_logs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-1.5" />
            Logs Admin
          </button>
        </div>

        {/* Lead events tab */}
        {activeTab === 'lead_events' && (
          <>
            {/* Event type filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setEventTypeFilter(''); setEventsPage(1) }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    !eventTypeFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tous ({totalEventsAll})
                </button>
                {Object.entries(eventTypeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => { setEventTypeFilter(type); setEventsPage(1) }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      eventTypeFilter === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {eventTypeLabels[type] || type} ({count})
                  </button>
                ))}
              </div>
            </div>

            {eventsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px] sm:min-w-[700px] text-sm" aria-label="Lead events">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Type</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Lead ID</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Attorney ID</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Metadata</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leadEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            No events found
                          </td>
                        </tr>
                      ) : (
                        leadEvents.map((e) => (
                          <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(e.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                e.event_type === 'created' ? 'bg-blue-100 text-blue-700' :
                                e.event_type === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                                e.event_type === 'viewed' ? 'bg-yellow-100 text-yellow-700' :
                                e.event_type === 'quoted' ? 'bg-green-100 text-green-700' :
                                e.event_type === 'declined' ? 'bg-gray-100 text-gray-600' :
                                e.event_type === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                e.event_type === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {eventTypeLabels[e.event_type] || e.event_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">
                              {e.lead_id.slice(0, 8)}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">
                              {e.attorney_id ? e.attorney_id.slice(0, 8) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {Object.keys(e.metadata).length > 0 && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                                    {Object.keys(e.metadata).length} champ(s)
                                  </summary>
                                  <pre className="mt-2 p-2 bg-gray-50 rounded text-gray-600 overflow-x-auto max-w-xs text-xs">
                                    {JSON.stringify(e.metadata, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {eventsTotalPages > 1 && (
                  <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Page {eventsPage} / {eventsTotalPages} ({eventsTotal} events)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEventsPage(Math.max(1, eventsPage - 1))}
                        disabled={eventsPage === 1}
                        className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEventsPage(Math.min(eventsTotalPages, eventsPage + 1))}
                        disabled={eventsPage === eventsTotalPages}
                        className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Audit logs tab */}
        {activeTab === 'audit_logs' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Entity type</label>
                  <select
                    value={entityType}
                    onChange={(e) => { setEntityType(e.target.value); setLogsPage(1) }}
                    aria-label="Filter by entity type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {ENTITY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Action</label>
                  <input
                    type="text"
                    value={action}
                    onChange={(e) => { setAction(e.target.value); setLogsPage(1) }}
                    placeholder="ban, refund..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Start</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setLogsPage(1) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Fin</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setLogsPage(1) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {logsLoading ? (
                <div className="p-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : logs.length === 0 ? (
                <div className="p-16 text-center text-gray-500">
                  <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px] sm:min-w-[700px] text-sm" aria-label="Logs d'audit administrateur">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                          <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Admin</th>
                          <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Action</th>
                          <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Entity</th>
                          <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(log.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <div>
                                  <p className="text-sm text-gray-900">{log.admin?.full_name || 'Admin'}</p>
                                  <p className="text-xs text-gray-400">{log.admin?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {getActionBadge(log.action)}
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{log.action}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-700 capitalize">{log.resource_type}</p>
                              {log.resource_id && (
                                <p className="text-xs text-gray-400 font-mono">{log.resource_id.slice(0, 8)}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {log.new_value && Object.keys(log.new_value).length > 0 && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                                    Data
                                  </summary>
                                  <pre className="mt-2 p-2 bg-gray-50 rounded text-gray-600 overflow-x-auto max-w-xs text-xs">
                                    {JSON.stringify(log.new_value, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Page {logsPage} / {logsTotalPages} ({logsTotal} logs)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLogsPage(Math.max(1, logsPage - 1))}
                        disabled={logsPage === 1}
                        className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setLogsPage(Math.min(logsTotalPages, logsPage + 1))}
                        disabled={logsPage === logsTotalPages}
                        className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
