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
  const [attorneyId, setProviderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [attorneyInfo, setProviderInfo] = useState<{
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
    if (!attorneyId.trim()) return
    setLoading(true)
    setError(null)
    setProviderInfo(null)

    try {
      const res = await fetch(`/api/admin/providers/${attorneyId.trim()}`)
      if (res.ok) {
        const data = await res.json()
        setProviderInfo({
          id: data.id || data.provider?.id,
          name: data.name || data.provider?.name || 'Unknown',
          is_active: data.is_active ?? data.provider?.is_active ?? false,
          is_verified: data.is_verified ?? data.provider?.is_verified ?? false,
        })
      } else {
        setError('Attorney not found')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  const toggleProvider = async (action: 'enable' | 'disable') => {
    if (!attorneyInfo) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/providers/${attorneyInfo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: action === 'enable',
        }),
      })
      if (res.ok) {
        setSuccess(`Attorney ${action === 'enable' ? 'enabled' : 'disabled'}`)
        setProviderInfo((prev) =>
          prev ? { ...prev, is_active: action === 'enable' } : prev
        )
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Error')
      }
    } catch {
      setError('Connection error')
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
        setSuccess('Dispatch replayed successfully')
        setAssignmentId('')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Error')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Tools</h1>
        <p className="text-gray-500 mb-8">Attorney management and dispatch</p>

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
            Enable / Disable an attorney
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={attorneyId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="Attorney UUID"
              aria-label="Attorney UUID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={lookupProvider}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>

          {attorneyInfo && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{attorneyInfo.name}</p>
                  <p className="text-xs text-gray-400">{attorneyInfo.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    attorneyInfo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {attorneyInfo.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    attorneyInfo.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {attorneyInfo.is_verified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {attorneyInfo.is_active ? (
                  <button
                    onClick={() => setDisableModal(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <PowerOff className="w-4 h-4" />
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={() => toggleProvider('enable')}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <Power className="w-4 h-4" />
                    Enable
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
            Replay a dispatch
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Re-run dispatch for an existing assignment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              placeholder="Assignment ID to replay"
              aria-label="Assignment ID to replay"
              onKeyDown={(e) => e.key === 'Enter' && replayDispatch()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={replayDispatch}
              disabled={loading || !assignmentId.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Replay dispatch
            </button>
          </div>
        </div>
      </div>

      {attorneyInfo && (
        <ConfirmationModal
          isOpen={disableModal}
          onClose={() => setDisableModal(false)}
          onConfirm={() => { setDisableModal(false); toggleProvider('disable') }}
          title="Disable attorney"
          message={`Are you sure you want to disable the attorney "${attorneyInfo.name}"?`}
          confirmText="Disable"
          variant="warning"
        />
      )}
    </div>
  )
}
