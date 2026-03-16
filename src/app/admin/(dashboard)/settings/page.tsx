'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Users,
  Mail,
  Bell,
  Shield,
  Globe,
  Save,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import { adminMutate } from '@/hooks/admin/useAdminFetch'

interface PlatformSettings {
  siteName: string
  contactEmail: string
  supportEmail: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  maxQuotesPerDay: number
  requireEmailVerification: boolean
  commissionRate: number
}

const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: 'US Attorneys',
  contactEmail: 'contact@us-attorneys.com',
  supportEmail: 'support@us-attorneys.com',
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
  maxQuotesPerDay: 10,
  requireEmailVerification: true,
  commissionRate: 10,
}

export default function AdminParametresPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [resetModal, setResetModal] = useState(false)
  const [statsResetModal, setStatsResetModal] = useState(false)
  const [clearCacheModal, setClearCacheModal] = useState(false)

  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        const merged = { ...DEFAULT_SETTINGS, ...data.settings }
        setSettings(merged)
        setOriginalSettings(merged)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setOriginalSettings(settings)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
    setResetModal(false)
  }

  const handleAction = async (action: 'reset-stats' | 'clear-cache') => {
    try {
      const result = await adminMutate<{ message: string }>('/api/admin/actions', {
        method: 'POST',
        body: { action },
      })
      setActionSuccess(result.message)
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unexpected error')
      setTimeout(() => setActionError(null), 5000)
    } finally {
      if (action === 'reset-stats') setStatsResetModal(false)
      if (action === 'clear-cache') setClearCacheModal(false)
    }
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  const sections = [
    {
      title: 'General',
      icon: Globe,
      fields: [
        {
          label: 'Site name',
          key: 'siteName',
          type: 'text',
          description: 'The name displayed on the site',
          maxLength: 200,
        },
        {
          label: 'Contact email',
          key: 'contactEmail',
          type: 'email',
          description: 'Primary contact email',
          maxLength: 254,
        },
        {
          label: 'Support email',
          key: 'supportEmail',
          type: 'email',
          description: 'Customer support email',
          maxLength: 254,
        },
      ],
    },
    {
      title: 'Registration',
      icon: Users,
      fields: [
        {
          label: 'Registration enabled',
          key: 'registrationEnabled',
          type: 'toggle',
          description: 'Allow new users to register',
        },
        {
          label: 'Email verification required',
          key: 'requireEmailVerification',
          type: 'toggle',
          description: 'Users must verify their email',
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      fields: [
        {
          label: 'Email notifications',
          key: 'emailNotifications',
          type: 'toggle',
          description: 'Send email notifications',
        },
        {
          label: 'SMS notifications',
          key: 'smsNotifications',
          type: 'toggle',
          description: 'Send SMS notifications (requires Twilio)',
        },
      ],
    },
    {
      title: 'Quotes',
      icon: Settings,
      fields: [
        {
          label: 'Max quotes per day',
          key: 'maxQuotesPerDay',
          type: 'number',
          description: 'Maximum number of quote requests per user per day',
          min: 1,
          max: 100,
        },
        {
          label: 'Commission (%)',
          key: 'commissionRate',
          type: 'number',
          description: 'Commission rate charged on transactions',
          min: 0,
          max: 100,
          step: 0.1,
        },
      ],
    },
    {
      title: 'Maintenance',
      icon: AlertTriangle,
      fields: [
        {
          label: 'Maintenance mode',
          key: 'maintenanceMode',
          type: 'toggle',
          description: 'Enable maintenance mode (site inaccessible to users)',
          warning: true,
        },
      ],
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Platform configuration</p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Saved
              </span>
            )}
            {hasChanges && (
              <button
                onClick={() => setResetModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Action feedback */}
        {actionSuccess && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/admin/settings/admins')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Administrators</p>
              <p className="text-sm text-gray-500">Manage admin roles</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/settings/emails')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Email Templates</p>
              <p className="text-sm text-gray-500">Customize emails</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/audit')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Audit Logs</p>
              <p className="text-sm text-gray-500">Action history</p>
            </div>
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.title} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                </div>
                <div className="p-6 space-y-6">
                  {section.fields.map((field) => (
                    <div key={field.key} className="flex items-start justify-between">
                      <div className="flex-1">
                        <label className="block font-medium text-gray-900">{field.label}</label>
                        <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                      </div>
                      <div className="ml-4">
                        {field.type === 'toggle' ? (
                          <button
                            onClick={() => setSettings({
                              ...settings,
                              [field.key]: !settings[field.key as keyof PlatformSettings],
                            })}
                            role="switch"
                            aria-checked={!!settings[field.key as keyof PlatformSettings]}
                            aria-label={field.label}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              settings[field.key as keyof PlatformSettings]
                                ? ('warning' in field && field.warning) ? 'bg-red-600' : 'bg-blue-600'
                                : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                settings[field.key as keyof PlatformSettings] ? 'translate-x-6' : ''
                              }`}
                            />
                          </button>
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            value={settings[field.key as keyof PlatformSettings] as number}
                            onChange={(e) => setSettings({
                              ...settings,
                              [field.key]: parseFloat(e.target.value) || 0,
                            })}
                            aria-label={field.label}
                            {...('min' in field ? { min: field.min } : {})}
                            {...('max' in field ? { max: field.max } : {})}
                            {...('step' in field ? { step: field.step } : {})}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={settings[field.key as keyof PlatformSettings] as string}
                            onChange={(e) => setSettings({
                              ...settings,
                              [field.key]: e.target.value,
                            })}
                            aria-label={field.label}
                            {...('maxLength' in field ? { maxLength: field.maxLength } : {})}
                            className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">Reset statistics</p>
                <p className="text-sm text-gray-500 mt-1">
                  Reset all platform statistics to zero. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setStatsResetModal(true)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Reset
              </button>
            </div>
            <div className="flex items-start justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Clear cache</p>
                <p className="text-sm text-gray-500 mt-1">
                  Delete all cached files. May temporarily slow down the site.
                </p>
              </div>
              <button
                onClick={() => setClearCacheModal(true)}
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
              >
                Clear cache
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      <ConfirmationModal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        onConfirm={handleReset}
        title="Reset changes"
        message="Do you want to discard all unsaved changes?"
        confirmText="Reset"
        variant="warning"
      />

      {/* Stats Reset Modal */}
      <ConfirmationModal
        isOpen={statsResetModal}
        onClose={() => setStatsResetModal(false)}
        onConfirm={() => handleAction('reset-stats')}
        title="Reset statistics"
        message="Are you sure you want to reset all statistics? This action cannot be undone."
        confirmText="Reset"
        variant="danger"
      />

      {/* Clear Cache Modal */}
      <ConfirmationModal
        isOpen={clearCacheModal}
        onClose={() => setClearCacheModal(false)}
        onConfirm={() => handleAction('clear-cache')}
        title="Clear cache"
        message="Are you sure you want to clear the cache? This may temporarily slow down the site."
        confirmText="Clear cache"
        variant="warning"
      />
    </div>
  )
}
