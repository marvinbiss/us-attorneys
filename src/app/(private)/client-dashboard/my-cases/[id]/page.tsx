'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Euro,
  Calendar,
  Clock,
  FileText,
  History,
  MessageSquare,
  Shield,
  Star,
  Check,
  X,
  Users,
  Eye,
  CheckCircle,
} from 'lucide-react'
import ClientSidebar from '@/components/client/ClientSidebar'
import { EventTimeline } from '@/components/dashboard/EventTimeline'
import { URGENCY_META } from '@/types/leads'
import type { LeadEventType } from '@/types/leads'

interface ProviderInfo {
  name: string
  specialty: string | null
  city: string | null
  rating_average: number | null
}

interface Quote {
  id: string
  amount: number
  description: string
  valid_until: string | null
  status: 'pending' | 'accepted' | 'refused' | 'expired'
  created_at: string
  provider: ProviderInfo | null
}

interface LeadDetail {
  id: string
  service_name: string
  city: string | null
  postal_code: string | null
  description: string
  budget: string | null
  urgency: string
  status: string
  client_name: string
  client_email: string | null
  client_phone: string
  created_at: string
}

interface ClientEvent {
  id: string
  event_type: LeadEventType
  label: string
  metadata: Record<string, unknown>
  created_at: string
}

interface LeadStats {
  artisans_notified: number
  artisans_viewed: number
  quotes_count: number
}

const QUOTE_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepted', cls: 'bg-emerald-100 text-emerald-700' },
  refused: { label: 'Declined', cls: 'bg-red-100 text-red-700' },
  expired: { label: 'Expired', cls: 'bg-orange-100 text-orange-700' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function StarRating({ value }: { value: number | null }) {
  if (!value) return null
  return (
    <span className="flex items-center gap-1 text-sm text-amber-600">
      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
      {value.toFixed(1)}
    </span>
  )
}

export default function LeadDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch(`/api/client/leads/${id}`)
      const data = await res.json()

      if (res.ok) {
        setLead(data.lead)
        setQuotes(data.quotes || [])
        setEvents(data.events || [])
        setStats(data.stats || null)
      } else if (res.status === 401) {
        window.location.href = '/login?redirect=/client-dashboard/my-cases'
        return
      } else {
        setError(data.error || 'Error')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAccept = async (quoteId: string) => {
    setActionLoading(quoteId)
    setActionError(null)
    setActionSuccess(null)
    try {
      const res = await fetch(`/api/client/leads/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionSuccess('Quote accepted successfully. The attorney will contact you.')
        await fetchData()
      } else {
        setActionError(data.error || 'Error accepting quote')
      }
    } catch {
      setActionError('Connection error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefuse = async (quoteId: string) => {
    setActionLoading(`refuse-${quoteId}`)
    setActionError(null)
    setActionSuccess(null)
    try {
      const res = await fetch(`/api/client/leads/${id}/refuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionSuccess('Quote declined.')
        await fetchData()
      } else {
        setActionError(data.error || 'Error declining quote')
      }
    } catch {
      setActionError('Connection error')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <Link href="/client-dashboard/my-cases" className="text-blue-600 hover:underline text-sm mt-4 block">
            Back to My Cases
          </Link>
        </div>
      </div>
    )
  }

  if (!lead) return null

  const urg = URGENCY_META[lead.urgency] || URGENCY_META.normal
  const pendingQuotes = quotes.filter(q => q.status === 'pending')
  const hasAcceptedQuote = quotes.some(q => q.status === 'accepted')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/client-dashboard" className="hover:text-gray-900">Client Dashboard</Link>
            <span>/</span>
            <Link href="/client-dashboard/my-cases" className="hover:text-gray-900">My Cases</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{lead.service_name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <ClientSidebar activePage="my-cases" />

          {/* Main content */}
          <div className="lg:col-span-3">
            <Link
              href="/client-dashboard/my-cases"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Cases
            </Link>

            {/* Action feedback banners */}
            {actionSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="text-emerald-700 text-sm font-medium">{actionSuccess}</p>
              </div>
            )}
            {actionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{actionError}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: lead details + quotes */}
              <div className="lg:col-span-2 space-y-6">
                {/* Lead header card */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold text-gray-900">{lead.service_name}</h1>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${urg.cls}`}>
                        {urg.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-700 leading-relaxed mb-6">{lead.description}</p>

                    {lead.budget && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                        <Euro className="w-4 h-4 text-green-600" />
                        <span><strong>Estimated Budget:</strong> {lead.budget}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Created on</p>
                          <p className="text-sm text-gray-700">
                            {new Date(lead.created_at).toLocaleDateString('en-US', {
                              day: 'numeric', month: 'long', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      {lead.city && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">Location</p>
                            <p className="text-sm text-gray-700">
                              {lead.city} {lead.postal_code && `(${lead.postal_code})`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats bar */}
                {stats && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-xs">Contacted</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.artisans_notified}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">Interested</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.artisans_viewed}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1.5 text-gray-400 mb-1">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">Quotes Received</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.quotes_count}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quotes section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">Quotes Received</h2>
                    {quotes.length > 0 && (
                      <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {quotes.length}
                      </span>
                    )}
                  </div>

                  {quotes.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-600">Awaiting quotes from attorneys</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Interested attorneys will send their proposals within 24-48 hours.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {quotes.map((quote) => {
                        const statusCfg = QUOTE_STATUS_CONFIG[quote.status] || QUOTE_STATUS_CONFIG.pending
                        const isAccepting = actionLoading === quote.id
                        const isRefusing = actionLoading === `refuse-${quote.id}`
                        const anyLoading = actionLoading !== null

                        return (
                          <div
                            key={quote.id}
                            className={`p-6 transition-colors ${
                              quote.status === 'accepted' ? 'bg-emerald-50' : ''
                            }`}
                          >
                            {/* Quote header */}
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-2xl font-bold text-gray-900">
                                    {Number(quote.amount).toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                    })}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>
                                    {statusCfg.label}
                                  </span>
                                </div>
                                {quote.valid_until && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Valid until {formatDate(quote.valid_until)}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 whitespace-nowrap">
                                {formatDate(quote.created_at)}
                              </p>
                            </div>

                            {/* Provider info */}
                            {quote.provider && (
                              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-700 font-bold text-sm">
                                    {quote.provider.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {quote.provider.name}
                                  </p>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {quote.provider.specialty && (
                                      <span className="text-xs text-gray-500">{quote.provider.specialty}</span>
                                    )}
                                    {quote.provider.city && (
                                      <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                        <MapPin className="w-3 h-3" />
                                        {quote.provider.city}
                                      </span>
                                    )}
                                    <StarRating value={quote.provider.rating_average} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Quote description */}
                            {quote.description && (
                              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                {quote.description}
                              </p>
                            )}

                            {/* Actions — only for pending quotes when no quote has been accepted yet */}
                            {quote.status === 'pending' && !hasAcceptedQuote && (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleAccept(quote.id)}
                                  disabled={anyLoading}
                                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isAccepting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  Accept Quote
                                </button>
                                <button
                                  onClick={() => handleRefuse(quote.id)}
                                  disabled={anyLoading}
                                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isRefusing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                  Decline
                                </button>
                              </div>
                            )}

                            {/* Accepted confirmation banner */}
                            {quote.status === 'accepted' && (
                              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                You accepted this quote — the attorney will contact you.
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Contact CTA */}
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                  <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Need Help?
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    If you have questions about this case, contact us through messaging.
                  </p>
                  <Link
                    href="/client-dashboard/messages"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Messages
                  </Link>
                </div>
              </div>

              {/* Right column: Timeline + info */}
              <div className="space-y-6">
                {/* Event timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    Case Timeline
                  </h3>
                  <EventTimeline events={events} compact />
                </div>

                {/* Info card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference</span>
                      <span className="text-gray-700 font-mono text-xs">{id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Urgency</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urg.cls}`}>
                        {urg.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Events</span>
                      <span className="text-gray-700">{events.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quotes Received</span>
                      <span className="text-gray-700">{quotes.length}</span>
                    </div>
                    {pendingQuotes.length > 0 && !hasAcceptedQuote && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pending</span>
                        <span className="text-blue-700 font-medium">{pendingQuotes.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Read-only notice */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Timeline is updated automatically. Attorneys typically respond
                      within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
