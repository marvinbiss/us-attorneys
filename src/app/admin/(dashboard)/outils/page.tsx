'use client'

import { useState } from 'react'
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Shield,
} from 'lucide-react'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'

export default function AdminToolsPage() {
  const [providerId, setProviderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [providerInfo, setProviderInfo] = useState<{
    id: string
    name: string
    is_active: boolean
    is_verified: boolean
  } | null>(null)

  // Dispatch replay
  const [assignmentId, setAssignmentId] = useState('')

  // Confirmation modal for disable action
  const [disableModal, setDisableModal] = useState(false)

  const lookupProvider = async () => {
    if (!providerId.trim()) return
    setLoading(true)
    setError(null)
    setProviderInfo(null)

    try {
      const res = await fetch(`/api/admin/providers/${providerId.trim()}`)
      if (res.ok) {
        const data = await res.json()
        setProviderInfo({
          id: data.id || data.provider?.id,
          name: data.name || data.provider?.name || 'Inconnu',
          is_active: data.is_active ?? data.provider?.is_active ?? false,
          is_verified: data.is_verified ?? data.provider?.is_verified ?? false,
        })
      } else {
        setError('Artisan non trouvé')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const toggleProvider = async (action: 'enable' | 'disable') => {
    if (!providerInfo) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/providers/${providerInfo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: action === 'enable',
        }),
      })
      if (res.ok) {
        setSuccess(`Artisan ${action === 'enable' ? 'activé' : 'désactivé'}`)
        setProviderInfo((prev) =>
          prev ? { ...prev, is_active: action === 'enable' } : prev
        )
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const replayDispatch = async () => {
    if (!assignmentId.trim()) return

    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'replay', assignmentId: assignmentId.trim() }),
      })
      if (res.ok) {
        setSuccess('Dispatch rejoué avec succès')
        setAssignmentId('')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Outils Admin</h1>
        <p className="text-gray-500 mb-8">Gestion des artisans et dispatch</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Provider lookup & toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Activer / Désactiver un artisan
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="UUID de l'artisan"
              aria-label="UUID de l'artisan"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={lookupProvider}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Rechercher
            </button>
          </div>

          {providerInfo && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{providerInfo.name}</p>
                  <p className="text-xs text-gray-400">{providerInfo.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    providerInfo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {providerInfo.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    providerInfo.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {providerInfo.is_verified ? 'Référencé' : 'Non référencé'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {providerInfo.is_active ? (
                  <button
                    onClick={() => setDisableModal(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <PowerOff className="w-4 h-4" />
                    Désactiver
                  </button>
                ) : (
                  <button
                    onClick={() => toggleProvider('enable')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <Power className="w-4 h-4" />
                    Activer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Replay dispatch */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-400" />
            Rejouer un dispatch
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Relance le round-robin pour une assignation existante. Un nouvel artisan sera sélectionné automatiquement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              placeholder="ID de l'assignation à rejouer"
              aria-label="ID de l'assignation à rejouer"
              onKeyDown={(e) => e.key === 'Enter' && replayDispatch()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={replayDispatch}
              disabled={loading || !assignmentId.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Relancer la répartition
            </button>
          </div>
        </div>
      </div>

      {providerInfo && (
        <ConfirmationModal
          isOpen={disableModal}
          onClose={() => setDisableModal(false)}
          onConfirm={() => { setDisableModal(false); toggleProvider('disable') }}
          title="Désactiver l'artisan"
          message={`Êtes-vous sûr de vouloir désactiver l'artisan « ${providerInfo.name} » ?`}
          confirmText="Désactiver"
          variant="warning"
        />
      )}
    </div>
  )
}
