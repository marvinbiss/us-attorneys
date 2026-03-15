'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, ArrowLeft,
  User, Mail, Phone, Lock, Bell, Shield, Trash2, Download,
  Globe, Palette
} from 'lucide-react'
import usePushNotifications from '@/hooks/usePushNotifications'
import Breadcrumb from '@/components/Breadcrumb'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'

interface NotificationPreferences {
  email_booking_confirmation: boolean
  email_booking_reminder: boolean
  email_marketing: boolean
  email_newsletter: boolean
  push_enabled: boolean
  push_booking_updates: boolean
  push_messages: boolean
  push_promotions: boolean
  sms_booking_reminder: boolean
  sms_marketing: boolean
}

interface PrivacyPreferences {
  profile_public: boolean
  show_online_status: boolean
  allow_reviews: boolean
}

interface DisplayPreferences {
  language: string
  theme: string
  timezone: string
  currency: string
}

export default function ParametresClientPage() {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
  })

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_booking_confirmation: true,
    email_booking_reminder: true,
    email_marketing: false,
    email_newsletter: false,
    push_enabled: false,
    push_booking_updates: true,
    push_messages: true,
    push_promotions: false,
    sms_booking_reminder: false,
    sms_marketing: false,
  })

  const [privacy, setPrivacy] = useState<PrivacyPreferences>({
    profile_public: true,
    show_online_status: true,
    allow_reviews: true,
  })

  const [display, setDisplay] = useState<DisplayPreferences>({
    language: 'en',
    theme: 'light',
    timezone: 'America/New_York',
    currency: 'USD',
  })

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'display' | 'data'>('profile')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [deletionStatus, setDeletionStatus] = useState<{ status: string; scheduled_deletion_at?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const pushNotifications = usePushNotifications(userId)

  useEffect(() => {
    loadUserData()
    loadDeletionStatus()
  }, [])

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.userId) setUserId(data.userId)
        if (data.preferences) {
          const p = data.preferences
          setNotifications({
            email_booking_confirmation: p.email_booking_confirmation ?? true,
            email_booking_reminder: p.email_booking_reminder ?? true,
            email_marketing: p.email_marketing ?? false,
            email_newsletter: p.email_newsletter ?? false,
            push_enabled: p.push_enabled ?? false,
            push_booking_updates: p.push_booking_updates ?? true,
            push_messages: p.push_messages ?? true,
            push_promotions: p.push_promotions ?? false,
            sms_booking_reminder: p.sms_booking_reminder ?? false,
            sms_marketing: p.sms_marketing ?? false,
          })
          setPrivacy({
            profile_public: p.profile_public ?? true,
            show_online_status: p.show_online_status ?? true,
            allow_reviews: p.allow_reviews ?? true,
          })
          setDisplay({
            language: p.language ?? 'en',
            theme: p.theme ?? 'light',
            timezone: p.timezone ?? 'America/New_York',
            currency: p.currency ?? 'USD',
          })
        }
      }

      // Load profile data
      const profileResponse = await fetch('/api/client/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.profile) {
          const nameParts = (profileData.profile.full_name || '').split(' ')
          const prenom = nameParts[0] || ''
          const nom = nameParts.slice(1).join(' ')
          setFormData(prev => ({
            ...prev,
            prenom,
            nom,
            email: profileData.profile.email || '',
            telephone: profileData.profile.phone_e164 || '',
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDeletionStatus = async () => {
    try {
      const response = await fetch('/api/gdpr/delete')
      if (response.ok) {
        const data = await response.json()
        setDeletionStatus(data.deletionRequest)
      }
    } catch (error) {
      console.error('Failed to load deletion status:', error)
    }
  }

  const savePreferences = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications, privacy, display }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: [formData.prenom, formData.nom].filter(Boolean).join(' ').trim() || undefined,
          phone: formData.telephone || undefined,
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePushToggle = async () => {
    if (notifications.push_enabled) {
      await pushNotifications.unsubscribe()
      setNotifications({ ...notifications, push_enabled: false })
    } else {
      const success = await pushNotifications.subscribe()
      if (success) {
        setNotifications({ ...notifications, push_enabled: true })
      }
    }
  }

  const requestDataExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' }),
      })

      if (response.ok) {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const requestAccountDeletion = async () => {
    try {
      const response = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deleteReason,
          password: deletePassword,
          confirmText: deleteConfirmText,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDeletionStatus(data)
        setShowDeleteModal(false)
        setDeleteConfirmText('')
        setDeletePassword('')
        setDeleteReason('')
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Failed to request deletion:', error)
    }
  }

  const cancelDeletion = async () => {
    try {
      const response = await fetch('/api/gdpr/delete', { method: 'DELETE' })
      if (response.ok) {
        setDeletionStatus(null)
      }
    } catch (error) {
      console.error('Failed to cancel deletion:', error)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'data', label: 'My Data', icon: Download },
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            items={[
              { label: 'Client Dashboard', href: '/client-dashboard' },
              { label: 'Settings' }
            ]}
            className="mb-4"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/client-dashboard/mes-demandes" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your information and preferences</p>
              </div>
            </div>
            {saveSuccess && (
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <nav className="bg-white rounded-xl shadow-sm p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
              <hr className="my-2" />
              <Link
                href="/client-dashboard/mes-demandes"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-5 h-5" />
                My Cases
              </Link>
              <LogoutButton />
            </nav>
            <QuickSiteLinks />
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                      </h2>
                      <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={formData.prenom}
                              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={formData.nom}
                              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4 inline mr-2" />
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.telephone}
                            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Password
                      </h2>
                      <form className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="********"
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="********"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="********"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Change Password
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Email Notifications
                      </h2>
                      <div className="space-y-4">
                        <ToggleSetting
                          label="Booking Confirmation"
                          description="Receive a confirmation email for each booking"
                          checked={notifications.email_booking_confirmation}
                          onChange={(checked) =>
                            setNotifications({ ...notifications, email_booking_confirmation: checked })
                          }
                        />
                        <ToggleSetting
                          label="Appointment Reminders"
                          description="Reminder 24h before your appointment"
                          checked={notifications.email_booking_reminder}
                          onChange={(checked) =>
                            setNotifications({ ...notifications, email_booking_reminder: checked })
                          }
                        />
                        <ToggleSetting
                          label="Offers and News"
                          description="Promotions and updates from attorneys"
                          checked={notifications.email_marketing}
                          onChange={(checked) =>
                            setNotifications({ ...notifications, email_marketing: checked })
                          }
                        />
                        <ToggleSetting
                          label="Newsletter"
                          description="Receive our monthly newsletter"
                          checked={notifications.email_newsletter}
                          onChange={(checked) =>
                            setNotifications({ ...notifications, email_newsletter: checked })
                          }
                        />
                      </div>
                    </div>

                    <hr />

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Push Notifications
                      </h2>
                      {!pushNotifications.isSupported ? (
                        <p className="text-sm text-gray-500">
                          Push notifications are not supported by your browser.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <ToggleSetting
                            label="Enable Push Notifications"
                            description="Receive real-time notifications"
                            checked={notifications.push_enabled}
                            onChange={handlePushToggle}
                            loading={pushNotifications.isLoading}
                          />
                          {notifications.push_enabled && (
                            <>
                              <ToggleSetting
                                label="Booking Updates"
                                description="Confirmations, changes, and reminders"
                                checked={notifications.push_booking_updates}
                                onChange={(checked) =>
                                  setNotifications({ ...notifications, push_booking_updates: checked })
                                }
                              />
                              <ToggleSetting
                                label="Messages"
                                description="New messages from attorneys"
                                checked={notifications.push_messages}
                                onChange={(checked) =>
                                  setNotifications({ ...notifications, push_messages: checked })
                                }
                              />
                              <ToggleSetting
                                label="Promotions"
                                description="Special offers and discounts"
                                checked={notifications.push_promotions}
                                onChange={(checked) =>
                                  setNotifications({ ...notifications, push_promotions: checked })
                                }
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <hr />

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        SMS Notifications
                      </h2>
                      <div className="space-y-4">
                        <ToggleSetting
                          label="Appointment Reminders"
                          description="SMS reminder 2h before your appointment"
                          checked={notifications.sms_booking_reminder}
                          onChange={(checked) =>
                            setNotifications({ ...notifications, sms_booking_reminder: checked })
                          }
                        />
                        <ToggleSetting
                          label="SMS Offers"
                          description="Promotions and special offers via SMS"
                          checked={notifications.sms_marketing}
                          onChange={(checked) =>
                            setNotifications({ ...notifications, sms_marketing: checked })
                          }
                        />
                      </div>
                    </div>

                    <button
                      onClick={savePreferences}
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Privacy Settings
                    </h2>
                    <div className="space-y-4">
                      <ToggleSetting
                        label="Public Profile"
                        description="Attorneys can see your profile"
                        checked={privacy.profile_public}
                        onChange={(checked) =>
                          setPrivacy({ ...privacy, profile_public: checked })
                        }
                      />
                      <ToggleSetting
                        label="Online Status Visible"
                        description="Attorneys can see if you are online"
                        checked={privacy.show_online_status}
                        onChange={(checked) =>
                          setPrivacy({ ...privacy, show_online_status: checked })
                        }
                      />
                      <ToggleSetting
                        label="Allow Reviews"
                        description="Attorneys can leave reviews about you"
                        checked={privacy.allow_reviews}
                        onChange={(checked) =>
                          setPrivacy({ ...privacy, allow_reviews: checked })
                        }
                      />
                    </div>

                    <button
                      onClick={savePreferences}
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}

                {/* Display Tab */}
                {activeTab === 'display' && (
                  <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Display Preferences
                    </h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        Language
                      </label>
                      <select
                        value={display.language}
                        onChange={(e) =>
                          setDisplay({ ...display, language: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="fr">French</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['light', 'dark', 'system'] as const).map((theme) => (
                          <button
                            key={theme}
                            onClick={() => setDisplay({ ...display, theme })}
                            className={`rounded-lg border-2 p-4 text-center transition-all ${
                              display.theme === theme
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-2xl mb-1">
                              {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
                            </div>
                            <div className="text-sm font-medium">
                              {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={display.timezone}
                        onChange={(e) =>
                          setDisplay({ ...display, timezone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={display.currency}
                        onChange={(e) =>
                          setDisplay({ ...display, currency: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EUR">EUR — Euro</option>
                        <option value="USD">USD — Dollar</option>
                        <option value="GBP">GBP — British Pound</option>
                      </select>
                    </div>

                    <button
                      onClick={savePreferences}
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}

                {/* Data Tab (GDPR) */}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Export My Data
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Download a copy of all your personal data in compliance with privacy regulations.
                        The file contains your profile, bookings, reviews, and messages.
                      </p>
                      <button
                        onClick={requestDataExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isExporting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download My Data
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
                      <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Delete My Account
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Account deletion is irreversible. All your data will be
                        permanently erased after a 30-day period, during which you
                        can cancel your request.
                      </p>

                      {deletionStatus?.status === 'scheduled' ? (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                          <p className="text-sm text-red-700 mb-3">
                            Your account is scheduled for deletion on{' '}
                            <strong>
                              {new Date(deletionStatus.scheduled_deletion_at ?? '').toLocaleDateString('en-US')}
                            </strong>.
                          </p>
                          <button
                            onClick={cancelDeletion}
                            className="rounded-lg bg-white border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                          >
                            Cancel Deletion
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className="flex items-center gap-2 text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete My Account
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Delete Your Account
            </h2>
            <p className="text-gray-600 mb-6">
              This action is irreversible. Your account will be deleted in 30 days.
              You can cancel during this period.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why are you leaving? (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  rows={2}
                  placeholder="Your feedback helps us improve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="********"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <strong>DELETE MY ACCOUNT</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={requestAccountDeletion}
                disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || !deletePassword}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Toggle Setting Component
function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  loading,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={loading}
          className="peer sr-only"
        />
        <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-disabled:opacity-50"></div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        )}
      </label>
    </div>
  )
}
