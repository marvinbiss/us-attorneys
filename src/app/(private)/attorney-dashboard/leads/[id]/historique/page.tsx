'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Eye,
  Send,
  X,
  ArrowRight,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'

interface LeadEvent {
  id: string
  event_type: string
  metadata: Record<string, unknown>
  created_at: string
}

const EVENT_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  created: { label: 'Demande créée', icon: ArrowRight, color: 'text-blue-600 bg-blue-100' },
  dispatched: { label: 'Assigné', icon: ArrowRight, color: 'text-indigo-600 bg-indigo-100' },
  viewed: { label: 'Consulté', icon: Eye, color: 'text-yellow-600 bg-yellow-100' },
  quoted: { label: 'Devis envoyé', icon: Send, color: 'text-green-600 bg-green-100' },
  declined: { label: 'Décliné', icon: X, color: 'text-gray-600 bg-gray-100' },
  accepted: { label: 'Accepté', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
  refused: { label: 'Refusé', icon: X, color: 'text-red-600 bg-red-100' },
  completed: { label: 'Terminé', icon: CheckCircle, color: 'text-green-800 bg-green-200' },
  expired: { label: 'Expiré', icon: Clock, color: 'text-orange-600 bg-orange-100' },
  reassigned: { label: 'Réassigné', icon: RefreshCw, color: 'text-purple-600 bg-purple-100' },
}

export default function LeadHistoryPage() {
  const params = useParams()
  const id = params.id as string

  const [events, setEvents] = useState<LeadEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`/api/attorney/leads/${id}/history`)
      const data = await res.json()
      if (res.ok) {
        setEvents(data.events || [])
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

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 text-sm text-gray-500">
          <Link href="/attorney-dashboard" className="hover:text-gray-900">Espace Artisan</Link>
          <span className="mx-2">/</span>
          <Link href="/attorney-dashboard/leads" className="hover:text-gray-900">Opportunités</Link>
          <span className="mx-2">/</span>
          <Link href={`/attorney-dashboard/leads/${id}`} className="hover:text-gray-900">Détail</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Historique</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href={`/attorney-dashboard/leads/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au détail
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Historique de la demande</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun événement enregistré</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

            <div className="space-y-6">
              {events.map((event) => {
                const config = EVENT_CONFIG[event.event_type] || {
                  label: event.event_type,
                  icon: Clock,
                  color: 'text-gray-600 bg-gray-100',
                }
                const Icon = config.icon

                return (
                  <div key={event.id} className="relative flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{config.label}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(event.created_at).toLocaleString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          {'amount' in event.metadata && event.metadata.amount != null && (
                            <span>Montant : {String(event.metadata.amount)} €</span>
                          )}
                          {'reason' in event.metadata && event.metadata.reason != null && (
                            <span>Raison : {String(event.metadata.reason)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
