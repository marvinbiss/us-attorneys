'use client'

import { useState } from 'react'
import {
  Shield,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  User,
  Calendar,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { useAdminFetch, adminMutate } from '@/hooks/admin/useAdminFetch'

interface ProviderClaim {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  siret_provided: string
  claimant_name: string | null
  claimant_email: string | null
  claimant_phone: string | null
  claimant_position: string | null
  rejection_reason: string | null
  reviewed_at: string | null
  created_at: string
  provider: {
    id: string
    name: string
    siret: string
    address_city: string
    stable_id: string
  } | null
  user: {
    id: string
    email: string
    full_name: string
  } | null
}

interface ClaimsResponse {
  data: ProviderClaim[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminClaimsPage() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)

  const url = `/api/admin/claims?page=${page}&limit=20&status=${filter}`
  const { data, isLoading, error, mutate } = useAdminFetch<ClaimsResponse>(url)

  const claims = data?.data || []
  const totalPages = data?.pagination?.totalPages || 1

  const [actionModal, setActionModal] = useState<{
    open: boolean
    claimId: string
    action: 'approve' | 'reject'
    providerName: string
    userName: string
  }>({ open: false, claimId: '', action: 'approve', providerName: '', userName: '' })

  const [rejectionReason, setRejectionReason] = useState('')

  const confirmAction = async () => {
    try {
      setActionError(null)
      await adminMutate('/api/admin/claims', {
        method: 'PATCH',
        body: {
          claimId: actionModal.claimId,
          action: actionModal.action,
          ...(actionModal.action === 'reject' && rejectionReason ? { rejectionReason } : {}),
        },
      })
      setActionModal({ open: false, claimId: '', action: 'approve', providerName: '', userName: '' })
      setRejectionReason('')
      mutate()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur lors du traitement')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> En attente</span>
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Approuvée</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Rejetée</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-amber-500" />
            Revendications de fiches
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez les demandes de revendication des artisans
          </p>
        </div>
      </div>

      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: 'pending' as const, label: 'En attente' },
          { value: 'approved' as const, label: 'Approuvées' },
          { value: 'rejected' as const, label: 'Rejetées' },
          { value: 'all' as const, label: 'Toutes' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setFilter(value); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Claims list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-72 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-56 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorBanner message="Erreur lors du chargement des demandes" />
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune demande {filter !== 'all' ? `${filter === 'pending' ? 'en attente' : filter === 'approved' ? 'approuvée' : 'rejetée'}` : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  {/* Provider info */}
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{claim.provider?.name || 'Artisan inconnu'}</span>
                    {claim.provider?.address_city && (
                      <span className="text-gray-500 text-sm">— {claim.provider.address_city}</span>
                    )}
                  </div>

                  {/* Claimant contact info */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{claim.claimant_name || claim.user?.full_name || 'Utilisateur'}</span>
                      {claim.claimant_position && (
                        <span className="text-gray-500">— {claim.claimant_position}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${claim.claimant_email || claim.user?.email}`} className="text-blue-600 hover:underline">
                        {claim.claimant_email || claim.user?.email}
                      </a>
                    </div>
                    {claim.claimant_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${claim.claimant_phone}`} className="text-gray-700">{claim.claimant_phone}</a>
                      </div>
                    )}
                    {claim.claimant_position && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{claim.claimant_position}</span>
                      </div>
                    )}
                  </div>

                  {/* SIRET comparison */}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">SIRET en base :</span>{' '}
                      <span className="font-mono font-medium text-gray-900">
                        {claim.provider?.siret || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">SIRET fourni :</span>{' '}
                      <span className="font-mono font-medium text-gray-900">
                        {claim.siret_provided}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(claim.created_at)}
                  </div>

                  {/* Rejection reason */}
                  {claim.rejection_reason && (
                    <p className="text-sm rounded-lg p-2 text-red-600 bg-red-50">
                      Motif de rejet : {claim.rejection_reason}
                    </p>
                  )}
                </div>

                {/* Status + Actions */}
                <div className="flex flex-col items-end gap-3 ml-4">
                  {statusBadge(claim.status)}

                  {claim.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActionModal({
                          open: true,
                          claimId: claim.id,
                          action: 'approve',
                          providerName: claim.provider?.name || 'Artisan',
                          userName: claim.claimant_name || claim.user?.full_name || 'Utilisateur',
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approuver
                      </button>
                      <button
                        onClick={() => setActionModal({
                          open: true,
                          claimId: claim.id,
                          action: 'reject',
                          providerName: claim.provider?.name || 'Artisan',
                          userName: claim.claimant_name || claim.user?.full_name || 'Utilisateur',
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={actionModal.open}
        onClose={() => { setActionModal({ ...actionModal, open: false }); setRejectionReason('') }}
        onConfirm={confirmAction}
        title={actionModal.action === 'approve' ? 'Approuver la revendication' : 'Rejeter la revendication'}
        message={
          actionModal.action === 'approve'
            ? `Approuver la revendication de "${actionModal.providerName}" par ${actionModal.userName} ? La fiche sera attribuée. Si l'artisan n'a pas de compte, un compte sera créé et il recevra un email pour définir son mot de passe.`
            : `Rejeter la revendication de "${actionModal.providerName}" par ${actionModal.userName} ?`
        }
        confirmText={actionModal.action === 'approve' ? 'Approuver' : 'Rejeter'}
        variant={actionModal.action === 'approve' ? 'success' : 'danger'}
      >
        {actionModal.action === 'reject' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif du rejet (optionnel)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez pourquoi la demande est rejetée..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              maxLength={500}
            />
          </div>
        )}
      </ConfirmationModal>
    </div>
  )
}
