'use client'

import { useState } from 'react'
import {
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  AlertCircle,
  User,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Hammer,
  Send,
  Trash2,
  Loader2,
} from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface QuoteRequest {
  id: string
  client_id: string | null
  service_name: string
  postal_code: string
  city: string | null
  description: string | null
  budget: string | null
  urgency: string
  client_name: string
  client_email: string
  client_phone: string
  status: 'pending' | 'sent' | 'accepted' | 'refused' | 'completed'
  created_at: string
}

interface Assignment {
  id: string
  status: string
  assigned_at: string
  attorney_id: string
  provider_name: string
}

interface QuoteListResponse {
  demandes: QuoteRequest[]
  assignments: Record<string, Assignment[]>
  totalPages: number
  total: number
}

const STATUS_FILTERS = ['all', 'pending', 'sent', 'accepted', 'refused', 'completed'] as const

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  sent: { variant: 'default', label: 'Sent' },
  accepted: { variant: 'success', label: 'Accepted' },
  refused: { variant: 'error', label: 'Refused' },
  completed: { variant: 'success', label: 'Completed' },
}

const URGENCY_CONFIG: Record<string, { variant: 'error' | 'warning' | 'default'; label: string }> = {
  very_urgent: { variant: 'error', label: 'Very urgent' },
  urgent: { variant: 'warning', label: 'Urgent' },
  normal: { variant: 'default', label: 'Normal' },
}

const ASSIGNMENT_STATUS: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  viewed: { cls: 'bg-blue-100 text-blue-800', label: 'Viewed' },
  quoted: { cls: 'bg-green-100 text-green-800', label: 'Quote sent' },
  declined: { cls: 'bg-red-100 text-red-800', label: 'Declined' },
}

const BUDGET_LABELS: Record<string, string> = {
  'moins-500': '< $500',
  'under-500': '< $500',
  '500-2000': '$500 – $2,000',
  '2000-5000': '$2,000 – $5,000',
  'plus-5000': '> $5,000',
  'over-5000': '> $5,000',
  'ne-sais-pas': 'Not specified',
  'not-sure': 'Not specified',
}

export default function AdminQuoteRequestsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<typeof STATUS_FILTERS[number]>('all')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const url = `/api/admin/quotes?page=${page}&limit=20&status=${status}&search=${encodeURIComponent(search)}`
  const { data, isLoading, error, mutate } = useAdminFetch<QuoteListResponse>(url)

  const requests = data?.demandes || [] // API field name
  const assignments = data?.assignments || {}
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await adminMutate('/api/admin/quotes', {
        method: 'DELETE',
        body: { id },
      })
      setConfirmDeleteId(null)
      setExpandedId(null)
      mutate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting request')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
          <p className="text-gray-500 mt-1">{total} total request{total > 1 ? 's' : ''}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, service, city, zip code..."
                aria-label="Search requests"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s)
                    setPage(1)
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && <ErrorBanner message={error.message} onDismiss={() => {}} onRetry={() => mutate()} />}

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No requests found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {requests.map((request) => {
                  const isExpanded = expandedId === request.id
                  const statusConf = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending
                  const urgencyConf = URGENCY_CONFIG[request.urgency] || URGENCY_CONFIG.normal
                  const requestAssignments = assignments[request.id] || []

                  return (
                    <div key={request.id} className="hover:bg-gray-50 transition-colors">
                      {/* Main row — clickable */}
                      <button
                        onClick={() => toggleExpand(request.id)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{request.service_name}</h3>
                              <StatusBadge variant={statusConf.variant}>{statusConf.label}</StatusBadge>
                              <StatusBadge variant={urgencyConf.variant}>{urgencyConf.label}</StatusBadge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {request.client_name}
                              </span>
                              {(request.city || request.postal_code) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {request.city ? `${request.city} (${request.postal_code})` : request.postal_code}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(request.created_at)}
                              </span>
                            </div>

                            {/* Assigned attorneys */}
                            {requestAssignments.length > 0 ? (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <Hammer className="w-4 h-4 text-gray-400" />
                                {requestAssignments.map((a) => {
                                  const st = ASSIGNMENT_STATUS[a.status] || ASSIGNMENT_STATUS.pending
                                  return (
                                    <span key={a.id} className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                                      {a.provider_name}
                                    </span>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                                <Send className="w-3.5 h-3.5" />
                                Unassigned
                              </div>
                            )}

                            {/* Description preview (truncated) */}
                            {request.description && !isExpanded && (
                              <p className="mt-2 text-sm text-gray-600 line-clamp-1">
                                {request.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                            {request.urgency !== 'normal' && (
                              <AlertCircle className={`w-5 h-5 ${
                                request.urgency === 'very_urgent' ? 'text-red-500' : 'text-amber-500'
                              }`} />
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="md:col-span-2">
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Client message</h4>
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                  {request.description || 'No description provided'}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Contact info</h4>
                              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{request.client_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <a href={`mailto:${request.client_email}`} className="text-blue-600 hover:underline">
                                    {request.client_email}
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <a href={`tel:${request.client_phone}`} className="text-blue-600 hover:underline">
                                    {request.client_phone}
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Details</h4>
                              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Service</span>
                                  <span className="font-medium text-gray-900">{request.service_name}</span>
                                </div>
                                {(request.city || request.postal_code) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Location</span>
                                    <span className="font-medium text-gray-900">
                                      {request.city ? `${request.city} (${request.postal_code})` : request.postal_code}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Budget</span>
                                  <span className="font-medium text-gray-900 flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    {request.budget ? (BUDGET_LABELS[request.budget] || request.budget) : 'Not specified'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Urgency</span>
                                  <StatusBadge variant={urgencyConf.variant}>{urgencyConf.label}</StatusBadge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Status</span>
                                  <StatusBadge variant={statusConf.variant}>{statusConf.label}</StatusBadge>
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Assigned attorney{requestAssignments.length > 1 ? 's' : ''}
                              </h4>
                              {requestAssignments.length > 0 ? (
                                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                                  {requestAssignments.map((a) => {
                                    const st = ASSIGNMENT_STATUS[a.status] || ASSIGNMENT_STATUS.pending
                                    return (
                                      <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Hammer className="w-4 h-4 text-gray-400" />
                                          <span className="font-medium text-gray-900 text-sm">{a.provider_name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs text-gray-400">
                                            {formatDate(a.assigned_at)}
                                          </span>
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                                            {st.label}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-400 flex items-center gap-2">
                                  <Send className="w-4 h-4" />
                                  No attorney assigned to this request
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ID + Delete */}
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-gray-400 font-mono">ID: {request.id}</p>
                            {confirmDeleteId === request.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-red-600 font-medium">Delete this request?</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(request.id) }}
                                  disabled={deletingId === request.id}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                  {deletingId === request.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                  Confirm
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(request.id) }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
