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
  Euro,
  Hammer,
  Send,
} from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch } from '@/hooks/admin/useAdminFetch'

interface DevisRequest {
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
  provider_id: string
  provider_name: string
}

interface DevisResponse {
  demandes: DevisRequest[]
  assignments: Record<string, Assignment[]>
  totalPages: number
  total: number
}

const STATUS_FILTERS = ['all', 'pending', 'sent', 'accepted', 'refused', 'completed'] as const

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: 'En attente' },
  sent: { variant: 'default', label: 'Envoyé' },
  accepted: { variant: 'success', label: 'Accepté' },
  refused: { variant: 'error', label: 'Refusé' },
  completed: { variant: 'success', label: 'Terminé' },
}

const URGENCY_CONFIG: Record<string, { variant: 'error' | 'warning' | 'default'; label: string }> = {
  tres_urgent: { variant: 'error', label: 'Très urgent' },
  urgent: { variant: 'warning', label: 'Urgent' },
  normal: { variant: 'default', label: 'Normal' },
}

const ASSIGNMENT_STATUS: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
  viewed: { cls: 'bg-blue-100 text-blue-800', label: 'Vu' },
  quoted: { cls: 'bg-green-100 text-green-800', label: 'Devis envoyé' },
  declined: { cls: 'bg-red-100 text-red-800', label: 'Décliné' },
}

const BUDGET_LABELS: Record<string, string> = {
  'moins-500': '< 500 €',
  '500-2000': '500 – 2 000 €',
  '2000-5000': '2 000 – 5 000 €',
  'plus-5000': '> 5 000 €',
  'ne-sais-pas': 'Non précisé',
}

export default function AdminDevisPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<typeof STATUS_FILTERS[number]>('all')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const url = `/api/admin/quotes?page=${page}&limit=20&status=${status}&search=${encodeURIComponent(search)}`
  const { data, isLoading, error, mutate } = useAdminFetch<DevisResponse>(url)

  const demandes = data?.demandes || []
  const assignments = data?.assignments || {}
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Demandes de devis</h1>
          <p className="text-gray-500 mt-1">{total} demande{total > 1 ? 's' : ''} au total</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, service, ville, code postal..."
                aria-label="Rechercher une demande"
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
                  {s === 'all' ? 'Tous' : STATUS_CONFIG[s]?.label || s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && <ErrorBanner message={error.message} onDismiss={() => {}} onRetry={() => mutate()} />}

        {/* Demandes List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : demandes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune demande trouvée</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {demandes.map((demande) => {
                  const isExpanded = expandedId === demande.id
                  const statusConf = STATUS_CONFIG[demande.status] || STATUS_CONFIG.pending
                  const urgencyConf = URGENCY_CONFIG[demande.urgency] || URGENCY_CONFIG.normal
                  const demandeAssignments = assignments[demande.id] || []

                  return (
                    <div key={demande.id} className="hover:bg-gray-50 transition-colors">
                      {/* Main row — clickable */}
                      <button
                        onClick={() => toggleExpand(demande.id)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{demande.service_name}</h3>
                              <StatusBadge variant={statusConf.variant}>{statusConf.label}</StatusBadge>
                              <StatusBadge variant={urgencyConf.variant}>{urgencyConf.label}</StatusBadge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {demande.client_name}
                              </span>
                              {(demande.city || demande.postal_code) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {demande.city ? `${demande.city} (${demande.postal_code})` : demande.postal_code}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(demande.created_at)}
                              </span>
                            </div>

                            {/* Artisan(s) assigné(s) — visible sans expand */}
                            {demandeAssignments.length > 0 ? (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <Hammer className="w-4 h-4 text-gray-400" />
                                {demandeAssignments.map((a) => {
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
                                Non assigné
                              </div>
                            )}

                            {/* Description preview (truncated) */}
                            {demande.description && !isExpanded && (
                              <p className="mt-2 text-sm text-gray-600 line-clamp-1">
                                {demande.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                            {demande.urgency !== 'normal' && (
                              <AlertCircle className={`w-5 h-5 ${
                                demande.urgency === 'tres_urgent' ? 'text-red-500' : 'text-amber-500'
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
                            {/* Message complet */}
                            <div className="md:col-span-2">
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Message du client</h4>
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                  {demande.description || 'Aucune description fournie'}
                                </p>
                              </div>
                            </div>

                            {/* Coordonnées client */}
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Coordonnées</h4>
                              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{demande.client_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <a href={`mailto:${demande.client_email}`} className="text-blue-600 hover:underline">
                                    {demande.client_email}
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <a href={`tel:${demande.client_phone}`} className="text-blue-600 hover:underline">
                                    {demande.client_phone}
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Détails demande */}
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Détails</h4>
                              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Service</span>
                                  <span className="font-medium text-gray-900">{demande.service_name}</span>
                                </div>
                                {(demande.city || demande.postal_code) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Localisation</span>
                                    <span className="font-medium text-gray-900">
                                      {demande.city ? `${demande.city} (${demande.postal_code})` : demande.postal_code}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Budget</span>
                                  <span className="font-medium text-gray-900 flex items-center gap-1">
                                    <Euro className="w-3.5 h-3.5" />
                                    {demande.budget ? (BUDGET_LABELS[demande.budget] || demande.budget) : 'Non précisé'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Urgence</span>
                                  <StatusBadge variant={urgencyConf.variant}>{urgencyConf.label}</StatusBadge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Statut</span>
                                  <StatusBadge variant={statusConf.variant}>{statusConf.label}</StatusBadge>
                                </div>
                              </div>
                            </div>

                            {/* Artisan(s) assigné(s) — détail */}
                            <div className="md:col-span-2">
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Artisan{demandeAssignments.length > 1 ? 's' : ''} assigné{demandeAssignments.length > 1 ? 's' : ''}
                              </h4>
                              {demandeAssignments.length > 0 ? (
                                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                                  {demandeAssignments.map((a) => {
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
                                  Aucun artisan assigné à cette demande
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ID for reference */}
                          <p className="mt-3 text-xs text-gray-400 font-mono">ID: {demande.id}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} sur {totalPages}
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
