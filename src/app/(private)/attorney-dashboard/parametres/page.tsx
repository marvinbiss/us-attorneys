'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  Shield,
  Bell,
  Trash2,
  Download,
  Mail,
  Settings,
  X,
  BadgeCheck,
  Calendar,
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'

interface SettingsData {
  profile: {
    id: string
    email: string
    full_name: string | null
    role?: string
    created_at?: string
  } | null
  provider: {
    id: string
    name: string
    phone: string | null
    email: string | null
    is_active: boolean
    is_verified: boolean
  } | null
}

// TODO: Persist to API when notification preferences endpoint is available
interface NotificationPreferences {
  nouveauxLeads: boolean
  nouveauxAvis: boolean
  messages: boolean
  rappelsRdv: boolean
}

const NOTIF_STORAGE_KEY = 'artisan_notification_prefs'

function getDefaultNotifPrefs(): NotificationPreferences {
  return {
    nouveauxLeads: true,
    nouveauxAvis: true,
    messages: true,
    rappelsRdv: true,
  }
}

function loadNotifPrefs(): NotificationPreferences {
  if (typeof window === 'undefined') return getDefaultNotifPrefs()
  try {
    const stored = localStorage.getItem(NOTIF_STORAGE_KEY)
    if (stored) return { ...getDefaultNotifPrefs(), ...JSON.parse(stored) }
  } catch {
    // ignore parse errors
  }
  return getDefaultNotifPrefs()
}

function saveNotifPrefs(prefs: NotificationPreferences) {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore storage errors
  }
}

export default function AttorneySettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Password reset
  const [resetLoading, setResetLoading] = useState(false)

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(getDefaultNotifPrefs)

  // GDPR - Export
  const [exportLoading, setExportLoading] = useState(false)

  // GDPR - Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Toast
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast()

  // Load notification preferences from localStorage
  useEffect(() => {
    setNotifPrefs(loadNotifPrefs())
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/attorney/settings')
      const result = await res.json()
      if (res.ok) {
        setData(result)
        setName(result.provider?.name || result.profile?.full_name || '')
        setPhone(result.provider?.phone || '')
      } else if (res.status === 401) {
        window.location.href = '/login?redirect=/attorney-dashboard/parametres'
        return
      } else {
        setError(result.error || 'Error')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/attorney/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      if (res.ok) {
        setSuccess('Settings saved')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const result = await res.json()
        setError(result.error || 'Error')
      }
    } catch {
      setError('Connection error')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    const email = data?.profile?.email
    if (!email) {
      toastError('Error', 'Email not found')
      return
    }

    setResetLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toastSuccess('Email sent', 'A password reset email has been sent to you')
      } else {
        toastError('Error', 'Unable to send reset email')
      }
    } catch {
      toastError('Error', 'Connection error')
    } finally {
      setResetLoading(false)
    }
  }

  const handleNotifToggle = (key: keyof NotificationPreferences) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      saveNotifPrefs(updated)
      return updated
    })
  }

  const handleExportData = async () => {
    setExportLoading(true)
    try {
      const res = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' }),
      })
      if (res.ok) {
        const result = await res.json()
        // Download as JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `my-data-us-attorneys-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toastSuccess('Export successful', 'Your data has been downloaded')
      } else {
        const result = await res.json()
        toastError('Error', result.error?.message || 'Unable to export your data')
      }
    } catch {
      toastError('Error', 'Connection error')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return

    setDeleteLoading(true)
    try {
      const res = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmText: 'SUPPRIMER MON COMPTE',
          password: deletePassword,
          reason: deleteReason || undefined,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        toastSuccess('Request submitted', result.message || 'Your account will be deleted within 30 days.')
        setShowDeleteModal(false)
        setDeleteConfirmText('')
        setDeletePassword('')
        setDeleteReason('')
      } else {
        toastError('Error', result.error?.message || 'Unable to process the request')
      }
    } catch {
      toastError('Error', 'Connection error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const memberSince = data?.profile?.created_at
    ? new Date(data.profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

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
          <Link href="/attorney-dashboard" className="hover:text-gray-900">Attorney Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Settings</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Settings className="w-7 h-7 text-gray-400" />
          Settings
        </h1>
        {memberSince && (
          <p className="text-sm text-gray-500 mb-8 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Member since {memberSince}
          </p>
        )}
        {!memberSince && <div className="mb-8" />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Section 1: Informations du compte */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Account Information
          </h2>

          {/* Account status badge */}
          {data?.provider?.is_verified && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 rounded-lg w-fit">
              <BadgeCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Verified Attorney (Bar Number)</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email - read only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={data?.profile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">
                To change your email, contact support
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name / Firm Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Section 2: Sécurité */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Security
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            You can reset your password by receiving an email with a secure link.
          </p>

          <button
            onClick={handlePasswordReset}
            disabled={resetLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {resetLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Change My Password
          </button>
        </div>

        {/* Section 3: Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            Notifications
          </h2>

          <div className="space-y-4">
            {([
              { key: 'nouveauxLeads' as const, label: 'New Leads', desc: 'Get notified for each new case request' },
              { key: 'nouveauxAvis' as const, label: 'New Reviews', desc: 'Be informed when a client leaves a review' },
              { key: 'messages' as const, label: 'Messages', desc: 'Notifications for new messages' },
              { key: 'rappelsRdv' as const, label: 'Appointment Reminders', desc: 'Reminders before your scheduled appointments' },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={notifPrefs[item.key]}
                  onClick={() => handleNotifToggle(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifPrefs[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPrefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Données personnelles (RGPD) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Personal Data (Privacy)
          </h2>

          <div className="space-y-4">
            {/* Export data */}
            <div className="flex items-start justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Export My Data</p>
                <p className="text-xs text-gray-500">Download a copy of all your personal data</p>
              </div>
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export
              </button>
            </div>

            <hr className="border-gray-100" />

            {/* Delete account */}
            <div className="flex items-start justify-between py-2">
              <div>
                <p className="text-sm font-medium text-red-600">Delete My Account</p>
                <p className="text-xs text-gray-500">Permanently delete your account and all your data</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Delete My Account
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                  setDeletePassword('')
                  setDeleteReason('')
                }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium">
                This action is irreversible. All your data will be deleted.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Your account will be scheduled for deletion within 30 days. You can cancel this request during that period.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Tell us why you're leaving..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="DELETE"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                  setDeletePassword('')
                  setDeleteReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || !deletePassword || deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}
