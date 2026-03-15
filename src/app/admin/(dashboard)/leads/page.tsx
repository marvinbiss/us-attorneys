'use client'

import { useState } from 'react'
import {
  FileText,
  Users,
  ArrowRight,
  Loader2,
  MapPin,
  Wrench,
  CheckCircle,
  Search,
  AlertCircle,
  Clock,
  Send,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { Pagination } from '@/components/dashboard/Pagination'
import { URGENCY_META, STATUS_META } from '@/types/leads'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface ArtisanRow {
  id: string
  stable_id: string | null
  name: string
  slug: string
  specialty: string
  address_city: string | null
  is_verified: boolean
  last_lead_assigned_at: string | null
}

interface LeadRow {
  id: string
  service_name: string
  city: string | null
  postal_code: string | null
  urgency: string
  client_name: string
  status: string
  created_at: string
}

interface AssignmentRow {
  id: string
  lead_id: string
  attorney_id: string
  status: string
  assigned_at: string
  viewed_at: string | null
}

type ViewTab = 'leads' | 'attorneys'

interface LeadsResponse {
  leads: LeadRow[]
  assignments: AssignmentRow[]
  attorneyNames: Record<string, string>
  stats: { totalLeads: number; pendingAssignments: number; dispatchedToday: number }
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

interface AttorneysResponse {
  attorneys: ArtisanRow[]
}

export default function AdminLeadsPage() {
  const [city, setCity] = useState('')
  const [service, setService] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [tab, setTab] = useState<ViewTab>('leads')
  const [page, setPage] = useState(1)
  const [mutationError, setMutationError] = useState<string | null>(null)

  // Dispatch state
  const [dispatchLeadId, setDispatchLeadId] = useState<string | null>(null)
  const [dispatchLoading, setDispatchLoading] = useState(false)

  // Build leads URL
  const leadsParams = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (city) leadsParams.set('city', city)
  if (service) leadsParams.set('service', service)
  if (searchQuery) leadsParams.set('search', searchQuery)
  if (urgencyFilter) leadsParams.set('urgency', urgencyFilter)

  const { data: leadsData, isLoading, error: leadsError, mutate: mutateLeads } = useAdminFetch<LeadsResponse>(
    `/api/admin/leads?${leadsParams}`
  )

  // Build attorneys URL
  const attorneysParams = new URLSearchParams()
  if (city) attorneysParams.set('city', city)
  if (service) attorneysParams.set('service', service)

  const { data: attorneysData, mutate: mutateAttorneys } = useAdminFetch<AttorneysResponse>(
    `/api/admin/leads?${attorneysParams}`
  )

  const leads = leadsData?.leads || []
  const assignments = leadsData?.assignments || []
  const attorneyNames = leadsData?.attorneyNames || {}
  const stats = leadsData?.stats || { totalLeads: 0, pendingAssignments: 0, dispatchedToday: 0 }
  const pagination = leadsData?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 }
  const attorneys = attorneysData?.attorneys || []
  const error = leadsError || (mutationError ? new Error(mutationError) : undefined)

  const revalidateAll = () => {
    mutateLeads()
    mutateAttorneys()
  }

  const handleDispatch = async (leadId: string) => {
    setDispatchLeadId(leadId)
    setDispatchLoading(true)
    try {
      setMutationError(null)
      await adminMutate('/api/admin/dispatch', {
        method: 'POST',
        body: { leadId },
      })
      revalidateAll()
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Dispatch error')
    } finally {
      setDispatchLoading(false)
      setDispatchLeadId(null)
    }
  }

  // Get assignments for a specific lead
  const getLeadAssignments = (leadId: string) => assignments.filter((a) => a.lead_id === leadId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads — Overview</h1>
            <p className="text-gray-500 mt-1">Lead management and dispatch</p>
          </div>
          <button
            onClick={revalidateAll}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard
            title="Total leads"
            value={stats.totalLeads}
            icon={<Inbox className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={stats.pendingAssignments}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
          />
          <StatCard
            title="Dispatched today"
            value={stats.dispatchedToday}
            icon={<Send className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Active attorneys"
            value={attorneys.length}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-40"
                  placeholder="Paris"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Specialty</label>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-40"
                  placeholder="Attorney"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48"
                  placeholder="Name, service..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Urgency</label>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                aria-label="Filter by urgency"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="tres_urgent">Very urgent</option>
              </select>
            </div>
            <button
              onClick={() => { revalidateAll(); setPage(1) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-sm">{error.message}</p>
          </div>
        )}

        {/* Tab toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('leads')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'leads' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Leads
          </button>
          <button
            onClick={() => setTab('attorneys')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'attorneys' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1.5" />
            Attorneys ({attorneys.length})
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Leads table */}
            {tab === 'leads' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px] sm:min-w-[800px] text-sm" aria-label="Leads list">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Service</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Location</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Urgency</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Assignments</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            No leads found
                          </td>
                        </tr>
                      ) : (
                        leads.map((lead) => {
                          const urg = URGENCY_META[lead.urgency] || URGENCY_META.normal
                          const leadAssignments = getLeadAssignments(lead.id)

                          return (
                            <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-medium text-gray-900">{lead.service_name}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {lead.city ? (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    {lead.city} {lead.postal_code && `(${lead.postal_code})`}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-600">{lead.client_name}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urg.cls}`}>
                                  {urg.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {leadAssignments.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {leadAssignments.map((a) => {
                                      const st = STATUS_META[a.status] || STATUS_META.pending
                                      return (
                                        <span key={a.id} className={`px-1.5 py-0.5 rounded text-xs font-medium ${st.cls}`}>
                                          {attorneyNames[a.attorney_id]?.split(' ')[0] || a.attorney_id.slice(0, 6)}: {st.label}
                                        </span>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">Unassigned</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                {new Date(lead.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleDispatch(lead.id)}
                                  disabled={dispatchLoading && dispatchLeadId === lead.id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                >
                                  {dispatchLoading && dispatchLeadId === lead.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <ArrowRight className="w-3 h-3" />
                                  )}
                                  Dispatcher
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            )}

            {/* Attorneys table */}
            {tab === 'attorneys' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px] sm:min-w-[600px] text-sm" aria-label="Attorneys list for dispatch">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Specialty</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">City</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Verified</th>
                        <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Last lead</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attorneys.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            No attorneys found
                          </td>
                        </tr>
                      ) : (
                        attorneys.map((a) => (
                          <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                            <td className="px-4 py-3 text-gray-600">{a.specialty}</td>
                            <td className="px-4 py-3 text-gray-600">{a.address_city || '—'}</td>
                            <td className="px-4 py-3">
                              {a.is_verified ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="text-gray-400 text-xs">No</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {a.last_lead_assigned_at
                                ? new Date(a.last_lead_assigned_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                                : 'Never'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
