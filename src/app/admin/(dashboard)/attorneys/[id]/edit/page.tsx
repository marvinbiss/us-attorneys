'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { logger } from '@/lib/logger'
import {
  ChevronLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Toast } from '@/components/admin/Toast'

interface AttorneyData {
  id: string
  user_id: string
  email: string
  full_name: string | null
  name: string | null
  phone: string | null
  bar_number: string | null
  specialty: string | null
  description: string | null
  bio: string | null
  address_line1: string | null
  address_city: string | null
  address_zip: string | null
  address_state: string | null
  is_verified: boolean
  is_active: boolean
  rating_average: number | null
  review_count: number
  updated_at: string | null
}

export default function EditAttorneyPage() {
  const router = useRouter()
  const params = useParams()
  const attorneyId = params.id as string

  const [attorney, setAttorney] = useState<AttorneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    bar_number: '',
    specialty: '',
    description: '',
    bio: '',
    address_line1: '',
    address_city: '',
    address_zip: '',
    address_state: '',
    is_verified: false,
    is_active: true,
  })

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false)

  // Inline field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Field validation
  function validateField(name: string, value: string): string | null {
    switch (name) {
      case 'full_name':
        return !value.trim() ? 'Name is required' : null
      case 'phone':
        return value && !/^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/.test(value.replace(/[\s.-]/g, ''))
          ? 'Invalid phone number' : null
      case 'address_zip':
        return value && !/^\d{5}$/.test(value)
          ? 'ZIP code must be 5 digits' : null
      default:
        return null
    }
  }

  function handleBlur(name: string, value: string) {
    const error = validateField(name, value)
    setFieldErrors(prev => {
      if (error) return { ...prev, [name]: error }
      const { [name]: _, ...rest } = prev
      return rest
    })
  }

  function clearFieldError(name: string) {
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const { [name]: _, ...rest } = prev
        return rest
      })
    }
  }

  const fetchAttorney = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/providers/${attorneyId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.provider) {
          setAttorney(data.provider)
          setFormData({
            email: data.provider.email || '',
            full_name: data.provider.full_name || data.provider.name || '',
            phone: data.provider.phone || '',
            bar_number: data.provider.bar_number || '',
            specialty: data.provider.specialty || '',
            description: data.provider.description || '',
            bio: data.provider.bio || '',
            address_line1: data.provider.address_line1 || '',
            address_city: data.provider.address_city || '',
            address_zip: data.provider.address_zip || '',
            address_state: data.provider.address_state || '',
            is_verified: data.provider.is_verified || false,
            is_active: data.provider.is_active ?? true,
          })
          setHasChanges(false)
        } else {
          setToast({ message: 'Attorney not found', type: 'error' })
        }
      } else {
        setToast({ message: 'Failed to load data', type: 'error' })
      }
    } catch (err: unknown) {
      logger.error('Fetch error', err)
      setToast({ message: 'Connection error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [attorneyId])

  useEffect(() => {
    fetchAttorney()
  }, [fetchAttorney])

  // Track form changes
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (saving) return

    // Validate all fields before saving
    const fieldsToValidate: [string, string][] = [
      ['full_name', formData.full_name],
      ['phone', formData.phone],
      ['address_zip', formData.address_zip],
    ]
    const errors: Record<string, string> = {}
    for (const [name, value] of fieldsToValidate) {
      const error = validateField(name, value)
      if (error) errors[name] = error
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setToast({ message: 'Please fix the form errors before saving', type: 'error' })
      return
    }

    try {
      setSaving(true)

      // Prepare data for API
      const payload = { ...formData }

      const response = await fetch(`/api/admin/providers/${attorneyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setToast({ message: 'Attorney updated successfully!', type: 'success' })
        setHasChanges(false)

        // Redirect after a short delay with full page reload to clear cache
        setTimeout(() => {
          window.location.href = `/admin/attorneys/${attorneyId}`
        }, 1500)
      } else {
        const errorMsg = data.error || data.message || 'Failed to save'
        setToast({ message: errorMsg, type: 'error' })
      }
    } catch (err: unknown) {
      logger.error('Save exception', err)
      setToast({ message: 'Server connection error', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 mt-4">Loading attorney...</p>
        </div>
      </div>
    )
  }

  if (!attorney) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Attorney not found</h2>
          <p className="text-gray-500 mb-4">The requested attorney does not exist or has been deleted.</p>
          <button
            onClick={() => router.push('/admin/attorneys')}
            className="text-blue-600 hover:underline"
          >
            Back to list
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/admin/attorneys')}
              className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to list
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Attorney</h1>
            <p className="text-gray-500 mt-1">{attorney.full_name}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save
              </>
            )}
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              General Information
            </h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => { updateFormData({ full_name: e.target.value }); clearFieldError('full_name') }}
                    onBlur={(e) => handleBlur('full_name', e.target.value)}
                    placeholder="John Smith"
                    maxLength={200}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${fieldErrors.full_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                  {fieldErrors.full_name && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                    Specialty
                  </label>
                  <input
                    id="specialty"
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => updateFormData({ specialty: e.target.value })}
                    placeholder="Personal Injury, Criminal Defense..."
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    placeholder="contact@lawfirm.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => { updateFormData({ phone: e.target.value }); clearFieldError('phone') }}
                    onBlur={(e) => handleBlur('phone', e.target.value)}
                    placeholder="(212) 555-1234"
                    maxLength={20}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${fieldErrors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="bar_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Bar Number
                </label>
                <input
                  id="bar_number"
                  type="text"
                  value={formData.bar_number}
                  onChange={(e) => updateFormData({ bar_number: e.target.value })}
                  placeholder="123456"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  rows={4}
                  placeholder="Describe the attorney's practice, services, expertise..."
                  maxLength={5000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => updateFormData({ bio: e.target.value })}
                  rows={3}
                  placeholder="Short bio of the attorney..."
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Address
            </h2>
            <div className="grid gap-4">
              <div>
                <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  id="address_line1"
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => updateFormData({ address_line1: e.target.value })}
                  placeholder="123 Main Street"
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="address_zip" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    id="address_zip"
                    type="text"
                    value={formData.address_zip}
                    onChange={(e) => { updateFormData({ address_zip: e.target.value }); clearFieldError('address_zip') }}
                    onBlur={(e) => handleBlur('address_zip', e.target.value)}
                    placeholder="10001"
                    maxLength={10}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${fieldErrors.address_zip ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                  {fieldErrors.address_zip && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.address_zip}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="address_city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    id="address_city"
                    type="text"
                    value={formData.address_city}
                    onChange={(e) => updateFormData({ address_city: e.target.value })}
                    placeholder="New York"
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="address_state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    id="address_state"
                    type="text"
                    value={formData.address_state}
                    onChange={(e) => updateFormData({ address_state: e.target.value })}
                    placeholder="New York"
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-400" />
              Status
            </h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verified
                  </label>
                  <button
                    type="button"
                    onClick={() => updateFormData({ is_verified: !formData.is_verified })}
                    role="switch"
                    aria-checked={formData.is_verified}
                    aria-label="Verified"
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      formData.is_verified ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform shadow ${
                        formData.is_verified ? 'translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => updateFormData({ is_active: !formData.is_active })}
                    role="switch"
                    aria-checked={formData.is_active}
                    aria-label="Actif"
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      formData.is_active ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform shadow ${
                        formData.is_active ? 'translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
              {attorney && (
                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-600">
                      Rating: {attorney.rating_average?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {attorney.review_count} reviews
                  </div>
                  {attorney.updated_at && (
                    <div className="text-sm text-gray-400">
                      Last updated: {new Date(attorney.updated_at).toLocaleDateString('en-US')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky save button for mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
