'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Clock,
  MapPin,
  Phone,
  Loader2,
  AlertCircle,
  ChevronRight,
  Search,
  Inbox,
  Eye,
  Send,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { URGENCY_META, STATUS_META } from '@/types/leads'
import { StatusTabs } from '@/components/dashboard/StatusTabs'
import { Pagination } from '@/components/dashboard/Pagination'
import { StatCard } from '@/components/dashboard/StatCard'

interface LeadData {
  id: string
  service_name: string
  city: string | null
  postal_code: string | null
  description: string
  urgency: string
  client_name: string
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

type StatusFilter = 'all' | 'pending' | 'viewed' | 'quoted' | 'declined'

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `il y a ${diffD}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function AttorneyLeadsInbox() {
  const [leads, setLeads] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const fetchLeads = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await fetch('/api/attorney/leads')
      const data = await response.json()

      if (response.ok) {
        setLeads(data.leads || [])
      } else if (response.status === 401) {
        window.location.href = '/login?redirect=/attorney-dashboard/leads'
        return
      } else {
        setError(data.error || 'Erreur lors du chargement')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Filter and search
  const filtered = leads.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const lead = a.lead
      return (
        lead.service_name.toLowerCase().includes(q) ||
        lead.client_name.toLowerCase().includes(q) ||
        (lead.city || '').toLowerCase().includes(q) ||
        (lead.postal_code || '').includes(q)
      )
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const statusCounts = {
    all: leads.length,
    pending: leads.filter((a) => a.status === 'pending').length,
    viewed: leads.filter((a) => a.status === 'viewed').length,
    quoted: leads.filter((a) => a.status === 'quoted').length,
    declined: leads.filter((a) => a.status === 'declined').length,
  }

  const tabs = [
    { key: 'all', label: 'Tous', count: statusCounts.all },
    { key: 'pending', label: 'Nouveaux', count: statusCounts.pending },
    { key: 'viewed', label: 'Consultés', count: statusCounts.viewed },
    { key: 'quoted', label: 'Devis envoyé', count: statusCounts.quoted },
    { key: 'declined', label: 'Déclinés', count: statusCounts.declined },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Chargement des opportunités...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/attorney-dashboard" className="hover:text-gray-900">Espace Artisan</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Opportunités</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/attorney-dashboard/leads/statistiques"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                Statistiques
              </Link>
              <button
                onClick={fetchLeads}
                aria-label="Actualiser les opportunités"
                title="Actualiser"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            title="Total reçus"
            value={statusCounts.all}
            icon={<Inbox className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Nouveaux"
            value={statusCounts.pending}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
          />
          <StatCard
            title="Devis envoyés"
            value={statusCounts.quoted}
            icon={<Send className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Taux réponse"
            value={`${statusCounts.all > 0 ? Math.round(((statusCounts.quoted + statusCounts.viewed) / statusCounts.all) * 100) : 0}%`}
            icon={<Eye className="w-5 h-5" />}
            color="indigo"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              aria-label="Rechercher des demandes"
              className="pl-9 pr-4 py-2 w-full sm:w-56 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Lead list */}
        {paginated.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium text-lg">Aucune opportunité</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery ? 'Aucun résultat pour cette recherche.' : 'Les demandes de devis vous seront attribuées automatiquement.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((assignment) => {
                const lead = assignment.lead
                const urg = URGENCY_META[lead.urgency] || URGENCY_META.normal
                const st = STATUS_META[assignment.status] || STATUS_META.pending
                const isNew = assignment.status === 'pending'

                return (
                  <Link
                    key={assignment.id}
                    href={`/attorney-dashboard/leads/${assignment.id}`}
                    className={`block bg-white rounded-xl border transition-all hover:shadow-md group ${
                      isNew ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isNew && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {lead.service_name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urg.cls}`}>
                              {urg.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                              {st.label}
                            </span>
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {lead.description}
                          </p>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatRelative(lead.created_at)}
                            </span>
                            {lead.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {lead.city} {lead.postal_code && `(${lead.postal_code})`}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {lead.client_name}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
