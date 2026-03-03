'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

interface ArtisanData {
  id: string
  user_id: string
  email: string
  full_name: string | null
  name: string | null
  phone: string | null
  siret: string | null
  specialty: string | null
  description: string | null
  bio: string | null
  address_street: string | null
  address_city: string | null
  address_postal_code: string | null
  address_region: string | null
  is_verified: boolean
  is_active: boolean
  rating_average: number | null
  review_count: number
  updated_at: string | null
}

export default function EditArtisanPage() {
  const router = useRouter()
  const params = useParams()
  const artisanId = params.id as string

  const [artisan, setArtisan] = useState<ArtisanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    siret: '',
    specialty: '',
    description: '',
    bio: '',
    address_street: '',
    address_city: '',
    address_postal_code: '',
    address_region: '',
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
        return !value.trim() ? 'Le nom est requis' : null
      case 'phone':
        return value && !/^(\+33|0)[1-9][\d\s.-]{7,13}$/.test(value.replace(/\s/g, ''))
          ? 'Numéro de téléphone invalide' : null
      case 'address_postal_code':
        return value && !/^\d{5}$/.test(value)
          ? 'Le code postal doit contenir 5 chiffres' : null
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

  const fetchArtisan = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/providers/${artisanId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.provider) {
          setArtisan(data.provider)
          setFormData({
            email: data.provider.email || '',
            full_name: data.provider.full_name || data.provider.name || '',
            phone: data.provider.phone || '',
            siret: data.provider.siret || '',
            specialty: data.provider.specialty || '',
            description: data.provider.description || '',
            bio: data.provider.bio || '',
            address_street: data.provider.address_street || '',
            address_city: data.provider.address_city || '',
            address_postal_code: data.provider.address_postal_code || '',
            address_region: data.provider.address_region || '',
            is_verified: data.provider.is_verified || false,
            is_active: data.provider.is_active ?? true,
          })
          setHasChanges(false)
        } else {
          setToast({ message: 'Artisan non trouvé', type: 'error' })
        }
      } else {
        setToast({ message: 'Erreur lors du chargement', type: 'error' })
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setToast({ message: 'Erreur de connexion', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [artisanId])

  useEffect(() => {
    fetchArtisan()
  }, [fetchArtisan])

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
      ['address_postal_code', formData.address_postal_code],
    ]
    const errors: Record<string, string> = {}
    for (const [name, value] of fieldsToValidate) {
      const error = validateField(name, value)
      if (error) errors[name] = error
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setToast({ message: 'Veuillez corriger les erreurs dans le formulaire', type: 'error' })
      return
    }

    try {
      setSaving(true)

      // Prepare data for API
      const payload = { ...formData }

      const response = await fetch(`/api/admin/providers/${artisanId}`, {
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
        setToast({ message: 'Artisan mis \u00e0 jour avec succ\u00e8s !', type: 'success' })
        setHasChanges(false)

        // Redirect after a short delay with full page reload to clear cache
        setTimeout(() => {
          window.location.href = `/admin/artisans/${artisanId}`
        }, 1500)
      } else {
        const errorMsg = data.error || data.message || 'Erreur de sauvegarde'
        setToast({ message: errorMsg, type: 'error' })
      }
    } catch (err) {
      console.error('Save exception:', err)
      setToast({ message: 'Erreur de connexion au serveur', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 mt-4">Chargement de l&apos;artisan...</p>
        </div>
      </div>
    )
  }

  if (!artisan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Artisan non trouvé</h2>
          <p className="text-gray-500 mb-4">L&apos;artisan demandé n&apos;existe pas ou a été supprimé.</p>
          <button
            onClick={() => router.push('/admin/artisans')}
            className="text-blue-600 hover:underline"
          >
            Retour à la liste
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
              onClick={() => router.push('/admin/artisans')}
              className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour à la liste
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;artisan</h1>
            <p className="text-gray-500 mt-1">{artisan.full_name}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer
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
              Informations générales
            </h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => { updateFormData({ full_name: e.target.value }); clearFieldError('full_name') }}
                    onBlur={(e) => handleBlur('full_name', e.target.value)}
                    placeholder="Jean Dupont"
                    maxLength={200}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${fieldErrors.full_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                  {fieldErrors.full_name && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialité
                  </label>
                  <input
                    id="specialty"
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => updateFormData({ specialty: e.target.value })}
                    placeholder="Plombier, Électricien..."
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
                    placeholder="contact@entreprise.fr"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Téléphone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => { updateFormData({ phone: e.target.value }); clearFieldError('phone') }}
                    onBlur={(e) => handleBlur('phone', e.target.value)}
                    placeholder="01 23 45 67 89"
                    maxLength={20}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${fieldErrors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-1">
                  SIRET
                </label>
                <input
                  id="siret"
                  type="text"
                  value={formData.siret}
                  onChange={(e) => updateFormData({ siret: e.target.value })}
                  placeholder="123 456 789 00012"
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
                  placeholder="Décrivez l'entreprise, ses services, son expertise..."
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
                  placeholder="Bio courte de l'artisan..."
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
              Adresse
            </h2>
            <div className="grid gap-4">
              <div>
                <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse complète
                </label>
                <input
                  id="address_street"
                  type="text"
                  value={formData.address_street}
                  onChange={(e) => updateFormData({ address_street: e.target.value })}
                  placeholder="123 rue de la République"
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="address_postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal
                  </label>
                  <input
                    id="address_postal_code"
                    type="text"
                    value={formData.address_postal_code}
                    onChange={(e) => { updateFormData({ address_postal_code: e.target.value }); clearFieldError('address_postal_code') }}
                    onBlur={(e) => handleBlur('address_postal_code', e.target.value)}
                    placeholder="75001"
                    maxLength={10}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${fieldErrors.address_postal_code ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                  {fieldErrors.address_postal_code && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.address_postal_code}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="address_city" className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    id="address_city"
                    type="text"
                    value={formData.address_city}
                    onChange={(e) => updateFormData({ address_city: e.target.value })}
                    placeholder="Paris"
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="address_region" className="block text-sm font-medium text-gray-700 mb-1">
                    Région
                  </label>
                  <input
                    id="address_region"
                    type="text"
                    value={formData.address_region}
                    onChange={(e) => updateFormData({ address_region: e.target.value })}
                    placeholder="Île-de-France"
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
              Statut
            </h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vérifié
                  </label>
                  <button
                    type="button"
                    onClick={() => updateFormData({ is_verified: !formData.is_verified })}
                    role="switch"
                    aria-checked={formData.is_verified}
                    aria-label="Vérifié"
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
                    Actif
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
              {artisan && (
                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-600">
                      Note: {artisan.rating_average?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {artisan.review_count} avis
                  </div>
                  {artisan.updated_at && (
                    <div className="text-sm text-gray-400">
                      Dernière modification: {new Date(artisan.updated_at).toLocaleDateString('fr-FR')}
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
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
