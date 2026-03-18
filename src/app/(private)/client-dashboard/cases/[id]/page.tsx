'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Shield,
  Phone,
  Mail,
  User,
  Briefcase,
  ExternalLink,
  CheckCircle,
  Upload,
  Trash2,
  Eye,
  Share2,
} from 'lucide-react'
import ClientSidebar from '@/components/client/ClientSidebar'
import { CaseTimeline } from '@/components/client-dashboard/CaseTimeline'
import { DocumentUploader } from '@/components/client-dashboard/DocumentUploader'
import type { CaseTimelineEvent, CaseEventType } from '@/components/client-dashboard/CaseTimeline'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AttorneyInfo {
  id: string
  name: string
  slug: string
  specialty: string | null
  city: string | null
  phone: string | null
  email: string | null
  rating_average: number | null
  is_verified: boolean
}

interface CaseDocument {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
  shared_with_attorney: boolean
  created_at: string
  download_url: string
}

interface CaseNote {
  id: string
  content: string
  created_at: string
  author: string
}

interface CaseDetail {
  id: string
  type: 'lead' | 'booking'
  practice_area: string
  description: string
  status: string
  status_label: string
  city: string | null
  created_at: string
  last_activity: string
  next_deadline: string | null
  attorney: AttorneyInfo | null
  notes: CaseNote[]
}

// ─── Status Steps ────────────────────────────────────────────────────────────

const CASE_STAGES = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'attorney_assigned', label: 'Attorney Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
]

function getStageIndex(status: string): number {
  switch (status) {
    case 'pending': return 0
    case 'active': return 1
    case 'in_progress': return 2
    case 'resolved':
    case 'completed': return 3
    default: return 0
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function mapLeadEventToTimelineEvent(event: { id: string; event_type: string; metadata: Record<string, unknown>; created_at: string }): CaseTimelineEvent {
  const eventTypeMap: Record<string, CaseEventType> = {
    created: 'submitted',
    dispatched: 'attorney_assigned',
    viewed: 'viewed',
    quoted: 'quote_received',
    accepted: 'quote_accepted',
    completed: 'completed',
    expired: 'cancelled',
    refused: 'cancelled',
    declined: 'cancelled',
    reassigned: 'attorney_assigned',
  }

  const titleMap: Record<string, string> = {
    created: 'Case submitted',
    dispatched: 'Attorney notified',
    viewed: 'Attorney reviewed your case',
    quoted: 'Quote received',
    accepted: 'Quote accepted',
    completed: 'Case completed',
    expired: 'Case expired',
    refused: 'Quote declined',
    declined: 'Attorney declined',
    reassigned: 'Case reassigned',
  }

  return {
    id: event.id,
    event_type: eventTypeMap[event.event_type] || 'submitted',
    title: titleMap[event.event_type] || event.event_type,
    description: event.metadata?.amount ? `Amount: $${event.metadata.amount}` : undefined,
    date: event.created_at,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const caseType = (searchParams.get('type') || 'lead') as 'lead' | 'booking'

  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<CaseTimelineEvent[]>([])
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)
  const [showUploader, setShowUploader] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      // Fetch case detail from existing lead endpoint or build from cases
      const [leadRes, docsRes] = await Promise.all([
        caseType === 'lead'
          ? fetch(`/api/client/leads/${id}`)
          : fetch(`/api/bookings/my-bookings`),
        fetch(`/api/client/documents?case_id=${id}`),
      ])

      // Process lead/case data
      if (caseType === 'lead') {
        if (!leadRes.ok) {
          if (leadRes.status === 401) {
            window.location.href = '/login?redirect=/client-dashboard/cases'
            return
          }
          throw new Error('Failed to load case')
        }
        const leadData = await leadRes.json()
        const lead = leadData.lead
        const events = leadData.events || []
        const quotes = leadData.quotes || []

        // Build attorney info from quotes
        let attorney: AttorneyInfo | null = null
        const acceptedQuote = quotes.find((q: { status: string; provider: { name: string } | null }) => q.status === 'accepted')
        const firstQuote = quotes[0]
        const quoteWithProvider = acceptedQuote || firstQuote
        if (quoteWithProvider?.provider) {
          attorney = {
            id: '',
            name: quoteWithProvider.provider.name,
            slug: '',
            specialty: quoteWithProvider.provider.specialty || null,
            city: quoteWithProvider.provider.city || null,
            phone: null,
            email: null,
            rating_average: quoteWithProvider.provider.rating_average || null,
            is_verified: false,
          }
        }

        // Build notes from quotes descriptions
        const notes: CaseNote[] = quotes
          .filter((q: { description: string }) => q.description)
          .map((q: { id: string; description: string; created_at: string; provider: { name: string } | null }) => ({
            id: q.id,
            content: q.description,
            created_at: q.created_at,
            author: q.provider?.name || 'Attorney',
          }))

        // Derive status
        const statusMap: Record<string, string> = {
          pending: 'pending',
          in_progress: 'active',
          quotes_received: 'active',
          accepted: 'in_progress',
          completed: 'completed',
          expired: 'cancelled',
          declined: 'cancelled',
        }

        const derivedStatus = events.length > 0
          ? deriveLeadStatus(events)
          : 'pending'

        setCaseDetail({
          id: lead.id,
          type: 'lead',
          practice_area: lead.service_name,
          description: lead.description,
          status: statusMap[derivedStatus] || 'pending',
          status_label: lead.status || derivedStatus,
          city: lead.city,
          created_at: lead.created_at,
          last_activity: events.length > 0 ? events[0].created_at : lead.created_at,
          next_deadline: null,
          attorney,
          notes,
        })

        // Map events to timeline
        setTimelineEvents(events.map(mapLeadEventToTimelineEvent))
      } else {
        // Booking type
        if (!leadRes.ok) {
          throw new Error('Failed to load consultation')
        }
        const bookingData = await leadRes.json()
        const bookings = bookingData?.data?.bookings || bookingData?.bookings || []
        const booking = bookings.find((b: { id: string }) => b.id === id)

        if (!booking) {
          throw new Error('Consultation not found')
        }

        const statusMap: Record<string, string> = {
          pending: 'pending',
          confirmed: 'active',
          completed: 'completed',
          cancelled: 'cancelled',
          no_show: 'cancelled',
        }

        setCaseDetail({
          id: booking.id,
          type: 'booking',
          practice_area: booking.specialty_name || 'Video Consultation',
          description: booking.notes || 'Video consultation with attorney',
          status: statusMap[booking.status] || 'pending',
          status_label: booking.status,
          city: null,
          created_at: booking.created_at,
          last_activity: booking.scheduled_at || booking.created_at,
          next_deadline: booking.status === 'confirmed' ? booking.scheduled_at : null,
          attorney: {
            id: booking.attorney_id,
            name: booking.attorney_name,
            slug: '',
            specialty: booking.specialty_name || null,
            city: null,
            phone: null,
            email: null,
            rating_average: null,
            is_verified: false,
          },
          notes: [],
        })

        // Build timeline for booking
        const bookingEvents: CaseTimelineEvent[] = [
          {
            id: `${booking.id}-created`,
            event_type: 'submitted',
            title: 'Consultation booked',
            date: booking.created_at,
          },
        ]
        if (booking.status === 'confirmed') {
          bookingEvents.push({
            id: `${booking.id}-confirmed`,
            event_type: 'in_progress',
            title: 'Consultation confirmed',
            description: `Scheduled for ${new Date(booking.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
            date: booking.created_at,
          })
        }
        if (booking.status === 'completed') {
          bookingEvents.push({
            id: `${booking.id}-completed`,
            event_type: 'completed',
            title: 'Consultation completed',
            date: booking.scheduled_at,
          })
        }
        setTimelineEvents(bookingEvents)
      }

      // Process documents
      if (docsRes.ok) {
        const docsData = await docsRes.json()
        setDocuments(docsData.data?.documents || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error')
    } finally {
      setLoading(false)
    }
  }, [id, caseType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    setDeletingDoc(docId)
    try {
      const res = await fetch(`/api/client/documents?id=${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId))
      }
    } catch {
      // Silent error handling
    } finally {
      setDeletingDoc(null)
    }
  }

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading case details...</p>
        </div>
      </div>
    )
  }

  // ─── Error state ───────────────────────────────────────────────────────────

  if (error && !caseDetail) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-8 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          <Link href="/client-dashboard/cases" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-4 block">
            Back to Cases
          </Link>
        </div>
      </div>
    )
  }

  if (!caseDetail) return null

  const stageIndex = getStageIndex(caseDetail.status)
  const isCancelled = caseDetail.status === 'cancelled'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header / Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/client-dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">Client Dashboard</Link>
            <span>/</span>
            <Link href="/client-dashboard/cases" className="hover:text-gray-900 dark:hover:text-gray-200">Cases</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs">{caseDetail.practice_area}</span>
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
              href="/client-dashboard/cases"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cases
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ─── Left column ────────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">
                {/* Case header card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{caseDetail.practice_area}</h1>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Status pipeline */}
                    {!isCancelled && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          {CASE_STAGES.map((stage, idx) => (
                            <div key={stage.key} className="flex items-center gap-1.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx <= stageIndex
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                              }`}>
                                {idx < stageIndex ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <span className={`text-xs hidden sm:inline ${
                                idx <= stageIndex
                                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                {stage.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${((stageIndex + 1) / CASE_STAGES.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-400 font-medium">This case has been cancelled or expired.</span>
                      </div>
                    )}

                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{caseDetail.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Created</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(caseDetail.created_at)}</p>
                        </div>
                      </div>
                      {caseDetail.city && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">Location</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{caseDetail.city}</p>
                          </div>
                        </div>
                      )}
                      {caseDetail.next_deadline && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="text-xs text-orange-500">Next Deadline</p>
                            <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">{formatDate(caseDetail.next_deadline)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attorney info card */}
                {caseDetail.attorney && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      Your Attorney
                    </h2>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 dark:text-blue-400 font-bold text-lg">
                          {caseDetail.attorney.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{caseDetail.attorney.name}</h3>
                          {caseDetail.attorney.is_verified && (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        {caseDetail.attorney.specialty && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{caseDetail.attorney.specialty}</p>
                        )}
                        {caseDetail.attorney.city && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {caseDetail.attorney.city}
                          </p>
                        )}
                        {caseDetail.attorney.rating_average && (
                          <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                            Rating: {caseDetail.attorney.rating_average.toFixed(1)} / 5
                          </p>
                        )}

                        {/* Contact buttons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Link
                            href="/client-dashboard/messages"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message
                          </Link>
                          {caseDetail.attorney.phone && (
                            <a
                              href={`tel:${caseDetail.attorney.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Call
                            </a>
                          )}
                          {caseDetail.attorney.email && (
                            <a
                              href={`mailto:${caseDetail.attorney.email}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Email
                            </a>
                          )}
                          {caseDetail.attorney.slug && (
                            <Link
                              href={`/attorneys/${caseDetail.attorney.slug}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Profile
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      Documents
                      {documents.length > 0 && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full">
                          {documents.length}
                        </span>
                      )}
                    </h2>
                    <button
                      onClick={() => setShowUploader(!showUploader)}
                      className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      {showUploader ? 'Hide Uploader' : 'Upload'}
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {showUploader && (
                      <DocumentUploader
                        caseId={id}
                        caseType={caseDetail.type}
                        onUploadComplete={() => {
                          fetchData()
                          setShowUploader(false)
                        }}
                      />
                    )}

                    {documents.length === 0 && !showUploader ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No documents yet</p>
                        <button
                          onClick={() => setShowUploader(true)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                        >
                          Upload your first document
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 py-3">
                            <div className="flex-shrink-0">
                              {doc.mime_type.startsWith('image/')
                                ? <Eye className="w-5 h-5 text-green-500" />
                                : <FileText className="w-5 h-5 text-blue-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.file_name}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>{formatFileSize(doc.file_size)}</span>
                                <span>{formatDate(doc.created_at)}</span>
                                {doc.shared_with_attorney && (
                                  <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                                    <Share2 className="w-3 h-3" /> Shared
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={deletingDoc === doc.id}
                                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                aria-label={`Delete ${doc.file_name}`}
                              >
                                {deletingDoc === doc.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Case notes (read-only, from attorney) */}
                {caseDetail.notes.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        Attorney Notes
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {caseDetail.notes.map((note) => (
                        <div key={note.id} className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{note.author}</span>
                            <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message shortcut */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-6">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Need Help?
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Have questions about this case? Reach out through secure messaging.
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

              {/* ─── Right column: Timeline + info ──────────────────── */}
              <div className="space-y-6">
                {/* Case timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    Case Timeline
                  </h3>
                  <CaseTimeline events={timelineEvents} compact />
                </div>

                {/* Info card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    Case Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Reference</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Type</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{caseDetail.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{caseDetail.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Documents</span>
                      <span className="text-gray-700 dark:text-gray-300">{documents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Events</span>
                      <span className="text-gray-700 dark:text-gray-300">{timelineEvents.length}</span>
                    </div>
                  </div>
                </div>

                {/* Appointment notice */}
                {caseDetail.next_deadline && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Next Appointment</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-0.5">
                          {new Date(caseDetail.next_deadline).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-update notice */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      This timeline is updated automatically as your case progresses.
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

// Helper: derive status from lead events (same logic as the leads API)
function deriveLeadStatus(events: Array<{ event_type: string }>): string {
  const types = new Set(events.map(e => e.event_type))
  if (types.has('completed')) return 'completed'
  if (types.has('expired')) return 'expired'
  if (types.has('accepted')) return 'accepted'
  if (types.has('refused')) return 'declined'
  if (types.has('quoted')) return 'quotes_received'
  if (types.has('dispatched') || types.has('viewed') || types.has('declined') || types.has('reassigned')) return 'in_progress'
  return 'pending'
}
