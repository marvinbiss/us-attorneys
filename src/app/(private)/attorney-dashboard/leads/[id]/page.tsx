'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  FileText,
  Eye,
  Send,
  X,
  Euro,
  History,
  User,
  Calendar,
} from 'lucide-react'
import { EventTimeline } from '@/components/dashboard/EventTimeline'
import { URGENCY_META, STATUS_META } from '@/types/leads'
import type { LeadEventType } from '@/types/leads'

interface LeadData {
  id: string
  service_name: string
  city: string | null
  postal_code: string | null
  description: string
  budget: string | null
  urgency: string
  client_name: string
  client_email: string | null
  client_phone: string
  created_at: string
  status: string
}

interface Assignment {
  id: string
  status: string
  assigned_at: string
  viewed_at: string | null
  lead: LeadData
}

interface TimelineEvent {
  id: string
  event_type: LeadEventType
  metadata: Record<string, unknown>
  created_at: string
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteDesc, setQuoteDesc] = useState('')

  const fetchLead = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/attorney/leads/${id}`)
      const data = await res.json()
      if (res.ok) {
        setAssignment(data.assignment)
      } else if (res.status === 401) {
        window.location.href = '/login?redirect=/attorney-dashboard/leads'
        return
      } else {
        setError(data.error || 'Erreur')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/attorney/leads/${id}/history`)
      const data = await res.json()
      if (res.ok) {
        setEvents(data.events || [])
      }
    } catch {
      // Non-blocking
    } finally {
      setEventsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchLead()
    fetchEvents()
  }, [fetchLead, fetchEvents])

  // Auto-mark as viewed on first load
  useEffect(() => {
    if (assignment && assignment.status === 'pending') {
      fetch(`/api/attorney/leads/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' }),
      }).then(() => {
        setAssignment((prev) =>
          prev ? { ...prev, status: 'viewed', viewed_at: new Date().toISOString() } : prev
        )
        fetchEvents()
      })
    }
  }, [assignment?.status, id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (action: string, extraData?: Record<string, unknown>) => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/attorney/leads/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      })
      if (res.ok) {
        router.push('/attorney-dashboard/leads')
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleQuoteSubmit = () => {
    const amount = parseFloat(quoteAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Montant invalide')
      return
    }
    handleAction('quote', { amount, description: quoteDesc })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <Link href="/attorney-dashboard/leads" className="text-blue-600 hover:underline text-sm mt-4 block">
            Retour aux opportunités
          </Link>
        </div>
      </div>
    )
  }

  if (!assignment) return null
  const lead = assignment.lead
  const urg = URGENCY_META[lead.urgency] || URGENCY_META.normal
  const st = STATUS_META[assignment.status] || STATUS_META.pending

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/attorney-dashboard" className="hover:text-gray-900">Espace Artisan</Link>
            <span>/</span>
            <Link href="/attorney-dashboard/leads" className="hover:text-gray-900">Opportunités</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Détail</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link
          href="/attorney-dashboard/leads"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux opportunités
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead header card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{lead.service_name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${urg.cls}`}>
                    {urg.label}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-6">{lead.description}</p>

                {lead.budget && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <Euro className="w-4 h-4 text-green-600" />
                    <span><strong>Budget indicatif :</strong> {lead.budget}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Reçu le</p>
                      <p className="text-sm text-gray-700">
                        {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {lead.city && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Localisation</p>
                        <p className="text-sm text-gray-700">
                          {lead.city} {lead.postal_code && `(${lead.postal_code})`}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Client</p>
                      <p className="text-sm text-gray-700">{lead.client_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Téléphone</p>
                      <p className="text-sm text-gray-700">{lead.client_phone}</p>
                    </div>
                  </div>
                  {lead.client_email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg sm:col-span-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm text-gray-700">{lead.client_email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {assignment.status !== 'quoted' && assignment.status !== 'declined' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  Actions
                </h2>

                {showQuoteForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Montant du devis (€)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ex: 350.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description du devis
                      </label>
                      <textarea
                        value={quoteDesc}
                        onChange={(e) => setQuoteDesc(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Détails de l'intervention, matériaux, délais..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleQuoteSubmit}
                        disabled={actionLoading === 'quote'}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === 'quote' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Envoyer le devis
                      </button>
                      <button
                        onClick={() => setShowQuoteForm(false)}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {assignment.status === 'pending' && (
                      <button
                        onClick={() => handleAction('view')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-medium hover:bg-yellow-100 disabled:opacity-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Marquer comme vu
                      </button>
                    )}
                    <button
                      onClick={() => setShowQuoteForm(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Envoyer un devis
                    </button>
                    <button
                      onClick={() => handleAction('decline')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'decline' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Décliner
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Timeline */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                Historique
              </h3>
              {eventsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <EventTimeline events={events} compact />
              )}
            </div>

            {/* Quick info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID Assignment</span>
                  <span className="text-gray-700 font-mono text-xs">{id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigné le</span>
                  <span className="text-gray-700">
                    {new Date(assignment.assigned_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short'
                    })}
                  </span>
                </div>
                {assignment.viewed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vu le</span>
                    <span className="text-gray-700">
                      {new Date(assignment.viewed_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
