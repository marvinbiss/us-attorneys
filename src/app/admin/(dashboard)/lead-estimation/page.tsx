'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
  Eye,
  X,
  Download,
} from 'lucide-react'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EstimationLead {
  id: string
  name: string | null
  phone: string
  email: string | null
  specialty: string
  city: string
  state: string
  project_description: string | null
  estimation_min: number | null
  estimation_max: number | null
  source: 'chat' | 'callback'
  conversation_history: Array<{ role: string; content: string }> | null
  page_url: string | null
  attorney_public_id: string | null
  created_at: string
}

interface ApiResponse {
  success: boolean
  data: EstimationLead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    total: number
    today: number
    chat: number
    callback: number
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 10) {
    return clean.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminEstimationLeadsPage() {
  // --- State ---------------------------------------------------------------
  const [page, setPage] = useState(1)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'chat' | 'callback'>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedLead, setSelectedLead] = useState<EstimationLead | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // --- Data fetching -------------------------------------------------------
  const params = new URLSearchParams({
    page: String(page),
    limit: '20',
    source: sourceFilter,
  })
  if (search) params.set('search', search)

  const { data, isLoading, error, mutate } = useAdminFetch<ApiResponse>(
    `/api/admin/lead-estimation?${params.toString()}`
  )

  const leads = data?.data ?? []
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 }
  const stats = data?.stats ?? { total: 0, today: 0, chat: 0, callback: 0 }

  // --- Handlers ------------------------------------------------------------

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead? This action cannot be undone.')) return
    try {
      await adminMutate('/api/admin/lead-estimation', {
        method: 'DELETE',
        body: { id },
      })
      setToast({ message: 'Lead deleted', type: 'success' })
      mutate()
    } catch {
      setToast({ message: 'Error deleting lead', type: 'error' })
    }
  }

  const handleExportCSV = () => {
    if (!leads.length) return
    const headers = [
      'Date',
      'Source',
      'Name',
      'Phone',
      'Email',
      'Specialty',
      'City',
      'State',
      'Attorney ID',
    ]
    const rows = leads.map((l) => [
      formatDate(l.created_at),
      l.source,
      l.name || '',
      l.phone,
      l.email || '',
      l.specialty,
      l.city,
      l.state,
      l.attorney_public_id || '',
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estimation-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Render --------------------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
          onClick={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Estimation Leads</h1>
          <p className="mt-1 text-sm text-gray-500">{stats.total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!leads.length}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total leads</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Today</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.today}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MessageSquare className="h-3.5 w-3.5" /> Via chat
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.chat}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Phone className="h-3.5 w-3.5" /> Callback
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.callback}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Source filter */}
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            {(['all', 'chat', 'callback'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSourceFilter(s)
                  setPage(1)
                }}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  sourceFilter === s
                    ? 'bg-[#E07040] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'all' ? 'All' : s === 'chat' ? 'Chat' : 'Callback'}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, phone, email, city..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#E07040] focus:outline-none focus:ring-2 focus:ring-[#E07040]/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#E07040] px-4 py-2 text-sm font-medium text-white hover:bg-[#c9603a]"
            >
              Filter
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSearchInput('')
                  setPage(1)
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#E07040]" />
        </div>
      ) : leads.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium">No leads yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Source</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Specialty</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">City</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Attorney</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          lead.source === 'chat'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {lead.source === 'chat' ? (
                          <>
                            <MessageSquare className="h-3 w-3" /> Chat
                          </>
                        ) : (
                          <>
                            <Phone className="h-3 w-3" /> Callback
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {lead.name || <span className="italic text-gray-400">Anonymous</span>}
                      </div>
                      <div className="text-gray-500">{formatPhone(lead.phone)}</div>
                      {lead.email && <div className="text-xs text-gray-400">{lead.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{lead.specialty}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{lead.city}</span>
                      {lead.state && <span className="ml-1 text-gray-400">({lead.state})</span>}
                    </td>
                    <td className="px-4 py-3">
                      {lead.attorney_public_id ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {lead.attorney_public_id}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lead.conversation_history && lead.conversation_history.length > 0 && (
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="View conversation"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <a
                          href={`tel:${lead.phone}`}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm font-medium text-gray-700">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="rounded-lg p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversation Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="font-semibold text-gray-900">Conversation</h3>
                <p className="text-xs text-gray-500">
                  {selectedLead.name || 'Anonymous'} · {selectedLead.specialty} ·{' '}
                  {selectedLead.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-lg p-1.5 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {selectedLead.conversation_history?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-[#E07040] text-white'
                        : 'rounded-tl-sm bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
              <p className="text-xs text-gray-400">
                {formatDate(selectedLead.created_at)}
                {selectedLead.page_url && (
                  <>
                    {' '}
                    ·{' '}
                    <a
                      href={selectedLead.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {selectedLead.page_url}
                    </a>
                  </>
                )}
              </p>
              <a
                href={`tel:${selectedLead.phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
