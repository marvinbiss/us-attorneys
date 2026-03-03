'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, MessageSquare, ArrowLeft, Filter, Calendar, MapPin, ChevronRight, Eye, Send, Loader2, X, Phone } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import ArtisanSidebar from '@/components/artisan-dashboard/ArtisanSidebar'
import { getArtisanUrl } from '@/lib/utils'
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

interface Lead {
  id: string
  status: string
  assigned_at: string
  viewed_at: string | null
  lead: LeadRequest | null
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
  quoted: { label: 'Devis envoyé', color: 'bg-blue-100 text-blue-700' },
  declined: { label: 'Refusé', color: 'bg-gray-100 text-gray-700' },
  accepted: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
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
  const [devisForm, setDevisForm] = useState({
    amount: '',
    description: '',
    validity_days: 30,
  })

  const fetchLeads = useCallback(async (page: number, status: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (status !== 'all') params.set('status', status)
      const response = await fetch(`/api/artisan/leads?${params.toString()}`)
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
        const response = await fetch('/api/artisan/stats')
        const data = await response.json()
        if (response.ok && data.provider) {
          const url = getArtisanUrl({
            stable_id: data.provider.stable_id ?? null,
            slug: data.provider.slug ?? null,
            specialty: data.provider.specialty ?? null,
            city: data.provider.address_city ?? null,
          })
          setPublicUrl(url)
        }
      } catch {
        // Silently fail — link just won't show
      }
    }
    fetchPublicUrl()
  }, [])

  const handlePageChange = (page: number) => {
    fetchLeads(page, filterStatus)
  }

  const handleFilterChange = (status: string) => {
    setFilterStatus(status)
    // fetchLeads will be called by the useEffect on filterStatus change
  }

  const openDevisModal = (lead: Lead) => {
    setSelectedLead(lead)
    setDevisForm({ amount: '', description: '', validity_days: 30 })
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

      const response = await fetch('/api/artisan/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: selectedLead.lead.id,
          amount: parseFloat(devisForm.amount),
          description: devisForm.description,
          valid_until: validUntil.toISOString().split('T')[0],
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowDevisModal(false)
        setSelectedLead(null)
        await fetchLeads(pagination.page, filterStatus)
        setToast({ message: 'Devis envoyé avec succès !', type: 'success' })
      } else {
        setToast({ message: data.error || 'Erreur lors de l\'envoi du devis', type: 'error' })
      }
    } catch (error) {
      console.error('Error sending devis:', error)
      setToast({ message: 'Erreur lors de l\'envoi du devis', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleContact = () => {
    router.push('/espace-artisan/messages')
  }

  const pendingCount = leads.filter(l => l.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[
            { label: 'Espace Artisan', href: '/espace-artisan' },
            { label: 'Demandes reçues' }
          ]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/espace-artisan/dashboard" className="text-white/80 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Demandes reçues</h1>
              <p className="text-blue-100">Gérez vos demandes entrantes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <ArtisanSidebar
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
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Toutes ({filterStatus === 'all' ? totalItems : '—'})
                  </button>
                  <button
                    onClick={() => handleFilterChange('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Nouvelles
                  </button>
                  <button
                    onClick={() => handleFilterChange('quoted')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === 'quoted' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Devis envoyés
                  </button>
                  <button
                    onClick={() => handleFilterChange('accepted')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === 'accepted' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Acceptées
                  </button>
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
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
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
                                  Très urgent
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">{lead.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{lead.client_name}</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {lead.city || lead.postal_code || 'Non précisé'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openDevisModal(item)}
                                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                  Envoyer devis
                                </button>
                                <button
                                  onClick={() => openDetailModal(item)}
                                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {(item.status === 'viewed' || item.status === 'quoted') && (
                              <button
                                onClick={handleContact}
                                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Contacter
                              </button>
                            )}
                            {item.status === 'accepted' && (
                              <span className="text-green-600 font-medium">Mission confirmée</span>
                            )}
                            {item.status === 'declined' && (
                              <span className="text-gray-500 font-medium">Refusé</span>
                            )}
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
                    <p className="text-gray-500">Aucune demande ne correspond à ce filtre.</p>
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

      {/* Modal Envoyer Devis */}
      {showDevisModal && selectedLead?.lead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Envoyer un devis
              </h2>
              <button
                onClick={() => setShowDevisModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{selectedLead.lead.service_name}</h3>
              <p className="text-sm text-gray-600 mb-2">{selectedLead.lead.description}</p>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{selectedLead.lead.client_name}</span> — {selectedLead.lead.city || selectedLead.lead.postal_code || 'Non précisé'}
              </div>
            </div>

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
                  Description / Détails du devis
                </label>
                <textarea
                  value={devisForm.description}
                  onChange={(e) => setDevisForm({ ...devisForm, description: e.target.value })}
                  rows={3}
                  placeholder="Détaillez les prestations incluses..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validité du devis
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
                  Envoyer le devis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailModal && selectedLead?.lead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Détails de la demande
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
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
                <p className="text-gray-600">{selectedLead.lead.description || 'Non précisé'}</p>
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
                    {selectedLead.lead.city || selectedLead.lead.postal_code || 'Non précisé'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500">Urgence</span>
                  <p className="font-medium text-gray-900 capitalize">{selectedLead.lead.urgency || 'Non précisé'}</p>
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

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
                {selectedLead.status === 'pending' && (
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
