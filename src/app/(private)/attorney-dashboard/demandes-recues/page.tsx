'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, MessageSquare, ArrowLeft, Filter, Calendar, MapPin, ChevronRight, Eye, Send, Loader2, X, Phone, CheckCircle2, Euro, Clock, Pencil } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { getAttorneyUrl } from '@/lib/utils'
import { Pagination } from '@/components/dashboard/Pagination'

interface LeadRequest {
  id: string
  service_name: string
  city: string | null
  postal_code: string
  description: string
  urgency: string
  client_name: string
  client_phone: string
  created_at: string
  status: string
}

interface QuoteInfo {
  id: string
  amount: number
  description: string
  valid_until: string
  status: string
  created_at: string
}

interface Lead {
  id: string
  status: string
  assigned_at: string
  viewed_at: string | null
  lead: LeadRequest | null
  quote: QuoteInfo | null
}

interface PaginationInfo {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Nouveau', color: 'bg-red-100 text-red-700' },
  viewed: { label: 'Vu', color: 'bg-yellow-100 text-yellow-700' },
  quoted: { label: 'Devis envoy\u00e9', color: 'bg-green-100 text-green-700' },
  declined: { label: 'Refus\u00e9', color: 'bg-gray-100 text-gray-700' },
  accepted: { label: 'Accept\u00e9', color: 'bg-green-100 text-green-700' },
}

const quoteStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50' },
  accepted: { label: 'Accept\u00e9', color: 'text-green-600 bg-green-50' },
  refused: { label: 'Refus\u00e9', color: 'text-red-600 bg-red-50' },
  expired: { label: 'Expir\u00e9', color: 'text-gray-500 bg-gray-50' },
}

export default function DemandesRecuesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0,
  })
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDevisModal, setShowDevisModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isRevising, setIsRevising] = useState(false)
  const [devisForm, setDevisForm] = useState({
    amount: '',
    description: '',
    validity_days: 30,
  })

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const fetchLeads = useCallback(async (page: number, status: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (status !== 'all') params.set('status', status)
      const response = await fetch(`/api/attorney/leads?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setLeads(data.leads || [])
        setTotalItems(data.count ?? 0)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads(1, filterStatus)
  }, [filterStatus, fetchLeads])

  useEffect(() => {
    const fetchPublicUrl = async () => {
      try {
        const response = await fetch('/api/attorney/stats')
        const data = await response.json()
        if (response.ok && data.provider) {
          const url = getAttorneyUrl({
            stable_id: data.provider.stable_id ?? null,
            slug: data.provider.slug ?? null,
            specialty: data.provider.specialty ?? null,
            city: data.provider.address_city ?? null,
          })
          setPublicUrl(url)
        }
      } catch {
        // Silently fail
      }
    }
    fetchPublicUrl()
  }, [])

  const handlePageChange = (page: number) => {
    fetchLeads(page, filterStatus)
  }

  const handleFilterChange = (status: string) => {
    setFilterStatus(status)
  }

  const openDevisModal = (lead: Lead) => {
    setSelectedLead(lead)
    setIsRevising(false)
    setDevisForm({ amount: '', description: '', validity_days: 30 })
    setShowDevisModal(true)
  }

  const openReviseModal = (lead: Lead) => {
    setSelectedLead(lead)
    setIsRevising(true)
    setDevisForm({
      amount: lead.quote ? String(lead.quote.amount) : '',
      description: lead.quote?.description || '',
      validity_days: 30,
    })
    setShowDetailModal(false)
    setShowDevisModal(true)
  }

  const openDetailModal = (lead: Lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  const handleSendDevis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead?.lead || !devisForm.amount) return

    setSubmitting(true)
    try {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + devisForm.validity_days)
      const validUntilStr = validUntil.toISOString().split('T')[0]
      const amount = parseFloat(devisForm.amount)

      if (isRevising && selectedLead.quote) {
        // PUT to update existing quote
        const response = await fetch('/api/attorney/quotes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedLead.quote.id,
            amount,
            description: devisForm.description,
            valid_until: validUntilStr,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          // Optimistic UI: update the lead in local state
          setLeads(prev => prev.map(l => {
            if (l.id !== selectedLead.id || !l.quote) return l
            return {
              ...l,
              quote: {
                ...l.quote,
                amount,
                description: devisForm.description,
                valid_until: validUntilStr,
              },
            }
          }))
          setShowDevisModal(false)
          setSelectedLead(null)
          setToast({ message: 'Devis mis \u00e0 jour avec succ\u00e8s !', type: 'success' })
        } else {
          const errorMsg = data.error?.message || data.error || 'Erreur lors de la mise \u00e0 jour du devis'
          setToast({ message: errorMsg, type: 'error' })
        }
      } else {
        // POST new quote
        const response = await fetch('/api/attorney/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id: selectedLead.lead.id,
            amount,
            description: devisForm.description,
            valid_until: validUntilStr,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          // Optimistic UI: update the lead status and attach quote info locally
          const newQuote: QuoteInfo = {
            id: data.devis?.id || '',
            amount,
            description: devisForm.description,
            valid_until: validUntilStr,
            status: 'pending',
            created_at: new Date().toISOString(),
          }

          setLeads(prev => prev.map(l => {
            if (l.id !== selectedLead.id) return l
            return { ...l, status: 'quoted', quote: newQuote }
          }))

          setShowDevisModal(false)
          setSelectedLead(null)
          setToast({ message: 'Devis envoy\u00e9 avec succ\u00e8s !', type: 'success' })

          // Background refetch to sync with server (non-blocking)
          fetchLeads(pagination.page, filterStatus)
        } else {
          const errorMsg = data.error?.message || data.error || 'Erreur lors de l\'envoi du devis'
          setToast({ message: errorMsg, type: 'error' })
        }
      }
    } catch (error) {
      console.error('Error sending devis:', error)
      setToast({ message: 'Erreur lors de l\'envoi du devis', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleContact = () => {
    router.push('/attorney-dashboard/messages')
  }

  const pendingCount = leads.filter(l => l.status === 'pending').length

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Fermer la notification" className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[
            { label: 'Espace Artisan', href: '/attorney-dashboard' },
            { label: 'Demandes re\u00e7ues' }
          ]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/attorney-dashboard/dashboard" className="text-white/80 hover:text-white" aria-label="Retour au tableau de bord">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Demandes re\u00e7ues</h1>
              <p className="text-blue-100">G\u00e9rez vos demandes entrantes et suivez vos devis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AttorneySidebar
            activePage="demandes-recues"
            newDemandesCount={pendingCount}
            publicUrl={publicUrl}
          />

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: `Toutes (${filterStatus === 'all' ? totalItems : '\u2014'})` },
                    { key: 'pending', label: 'Nouvelles' },
                    { key: 'quoted', label: 'Devis envoy\u00e9s' },
                    { key: 'accepted', label: 'Accept\u00e9es' },
                    { key: 'declined', label: 'Refus\u00e9es' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleFilterChange(key)}
                      aria-pressed={filterStatus === key}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Leads list */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Chargement des demandes...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {leads.map((item) => {
                    const lead = item.lead
                    if (!lead) return null
                    const statusInfo = statusConfig[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700' }
                    const quote = item.quote
                    const isQuoted = item.status === 'quoted' && quote != null
                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer ${
                          isQuoted ? 'border-l-4 border-green-500' : ''
                        }`}
                        onClick={() => openDetailModal(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') openDetailModal(item) }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{lead.service_name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                              {lead.urgency === 'urgent' && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                  Urgent
                                </span>
                              )}
                              {lead.urgency === 'tres_urgent' && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  Tr\u00e8s urgent
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{lead.description}</p>

                            {/* Quote summary on card */}
                            {isQuoted && quote && (
                              <div className="flex flex-wrap items-center gap-3 mb-3 p-2 bg-green-50 rounded-lg">
                                <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                                  <Euro className="w-4 h-4" />
                                  {formatAmount(quote.amount)}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  Envoy\u00e9 le {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  Valide jusqu&apos;au {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
                                </span>
                                {quoteStatusLabels[quote.status] && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${quoteStatusLabels[quote.status].color}`}>
                                    {quoteStatusLabels[quote.status].label}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{lead.client_name}</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {lead.city || lead.postal_code || 'Non pr\u00e9cis\u00e9'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0" onClick={(e) => e.stopPropagation()} role="group">
                            {(item.status === 'pending' || item.status === 'viewed') && (
                              <button
                                onClick={() => openDevisModal(item)}
                                aria-label="Envoyer un devis"
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                              >
                                <Send className="w-4 h-4" />
                                <span className="hidden sm:inline">Envoyer devis</span>
                              </button>
                            )}
                            {item.status === 'quoted' && (
                              <span className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Devis envoy\u00e9</span>
                              </span>
                            )}
                            {(item.status === 'viewed' || item.status === 'quoted') && (
                              <button
                                onClick={handleContact}
                                aria-label="Contacter le client"
                                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span className="hidden sm:inline">Contacter</span>
                              </button>
                            )}
                            {item.status === 'accepted' && (
                              <span className="text-green-600 font-medium">Mission confirm\u00e9e</span>
                            )}
                            {item.status === 'declined' && (
                              <span className="text-gray-500 font-medium">Refus\u00e9</span>
                            )}
                            <button
                              onClick={() => openDetailModal(item)}
                              aria-label="Voir les d\u00e9tails"
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {leads.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Aucune demande</h3>
                    <p className="text-gray-500">Aucune demande ne correspond \u00e0 ce filtre.</p>
                  </div>
                )}

                {pagination.totalPages > 1 && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Envoyer / R\u00e9viser Devis */}
      {showDevisModal && selectedLead?.lead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-[95vw] sm:max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {isRevising ? 'R\u00e9viser le devis' : 'Envoyer un devis'}
              </h2>
              <button
                onClick={() => setShowDevisModal(false)}
                aria-label="Fermer"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{selectedLead.lead.service_name}</h3>
              <p className="text-sm text-gray-600 mb-2">{selectedLead.lead.description}</p>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{selectedLead.lead.client_name}</span> &mdash; {selectedLead.lead.city || selectedLead.lead.postal_code || 'Non pr\u00e9cis\u00e9'}
              </div>
            </div>

            {isRevising && selectedLead.quote && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                Devis actuel : {formatAmount(selectedLead.quote.amount)} &mdash; Envoyez une version r\u00e9vis\u00e9e ci-dessous.
              </div>
            )}

            <form onSubmit={handleSendDevis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant du devis (EUR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={devisForm.amount}
                  onChange={(e) => setDevisForm({ ...devisForm, amount: e.target.value })}
                  placeholder="Ex: 250.00"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description / D\u00e9tails du devis
                </label>
                <textarea
                  value={devisForm.description}
                  onChange={(e) => setDevisForm({ ...devisForm, description: e.target.value })}
                  rows={3}
                  placeholder="D\u00e9taillez les prestations incluses..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validit\u00e9 du devis
                </label>
                <select
                  value={devisForm.validity_days}
                  onChange={(e) => setDevisForm({ ...devisForm, validity_days: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>7 jours</option>
                  <option value={15}>15 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDevisModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Send className="w-4 h-4" />
                  {isRevising ? 'Mettre \u00e0 jour' : 'Envoyer le devis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal D\u00e9tails (with quote info) */}
      {showDetailModal && selectedLead?.lead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-[95vw] sm:max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                D\u00e9tails de la demande
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                aria-label="Fermer"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{selectedLead.lead.service_name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[selectedLead.status]?.color || 'bg-gray-100'}`}>
                  {statusConfig[selectedLead.status]?.label || selectedLead.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600">{selectedLead.lead.description || 'Non pr\u00e9cis\u00e9'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Contact client</h4>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{selectedLead.lead.client_name}</p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${selectedLead.lead.client_phone}`} className="text-blue-600 hover:underline">
                      {selectedLead.lead.client_phone}
                    </a>
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {selectedLead.lead.city || selectedLead.lead.postal_code || 'Non pr\u00e9cis\u00e9'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500">Urgence</span>
                  <p className="font-medium text-gray-900 capitalize">{selectedLead.lead.urgency || 'Non pr\u00e9cis\u00e9'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500">Date de demande</span>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedLead.lead.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Quote details section */}
              {selectedLead.quote && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Votre devis
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Montant</span>
                      <span className="text-lg font-bold text-green-700">
                        {formatAmount(selectedLead.quote.amount)}
                      </span>
                    </div>
                    {selectedLead.quote.description && (
                      <div>
                        <span className="text-sm text-gray-600">D\u00e9tails</span>
                        <p className="text-sm text-gray-800 mt-1">{selectedLead.quote.description}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Envoy\u00e9 le</span>
                      <span className="text-gray-800">
                        {new Date(selectedLead.quote.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Valide jusqu&apos;au</span>
                      <span className="text-gray-800">
                        {new Date(selectedLead.quote.valid_until).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Statut</span>
                      {quoteStatusLabels[selectedLead.quote.status] && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${quoteStatusLabels[selectedLead.quote.status].color}`}>
                          {quoteStatusLabels[selectedLead.quote.status].label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
                {(selectedLead.status === 'pending' || selectedLead.status === 'viewed') && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      openDevisModal(selectedLead)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer un devis
                  </button>
                )}
                {selectedLead.status === 'quoted' && selectedLead.quote?.status === 'pending' && (
                  <button
                    onClick={() => openReviseModal(selectedLead)}
                    className="flex-1 bg-yellow-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    R\u00e9viser le devis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
