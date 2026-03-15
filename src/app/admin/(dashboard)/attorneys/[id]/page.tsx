'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Star,
  Ban,
  CheckCircle,
  Trash2,
  Briefcase,
  Clock,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import { getAttorneyUrl } from '@/lib/utils'

interface AttorneyProfile {
  id: string
  stable_id?: string | null
  email: string
  name: string | null
  full_name: string | null
  slug: string | null
  phone: string | null
  siret: string | null
  description: string | null
  bio: string | null
  specialty: string | null
  address_street: string | null
  address_city: string | null
  address_postal_code: string | null
  address_region: string | null
  is_verified: boolean
  is_active: boolean
  rating_average: number | null
  review_count: number
  created_at: string
  updated_at: string | null
}

export default function AdminArtisanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const attorneyId = params.id as string

  const [artisan, setArtisan] = useState<AttorneyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal states
  const [verifyModal, setVerifyModal] = useState(false)
  const [suspendModal, setSuspendModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  useEffect(() => {
    fetchArtisan()
  }, [attorneyId])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const fetchArtisan = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/providers/${attorneyId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setArtisan(data.provider)
      } else {
        router.push('/admin/attorneys')
      }
    } catch (error) {
      console.error('Failed to fetch artisan:', error)
      router.push('/admin/attorneys')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    try {
      const response = await fetch(`/api/admin/providers/${attorneyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: true }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setVerifyModal(false)
        await fetchArtisan()
      } else {
        setToast({ type: 'error', message: data.error || 'Verification failed' })
      }
    } catch (error) {
      console.error('Verify failed:', error)
      setToast({ type: 'error', message: 'Connection error' })
    }
  }

  const handleSuspend = async () => {
    try {
      const response = await fetch(`/api/admin/providers/${attorneyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !artisan?.is_active }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuspendModal(false)
        await fetchArtisan()
      } else {
        setToast({ type: 'error', message: data.error || 'Action failed' })
      }
    } catch (error) {
      console.error('Suspend failed:', error)
      setToast({ type: 'error', message: 'Connection error' })
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/providers/${attorneyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push('/admin/attorneys')
      } else {
        setToast({ type: 'error', message: data.error || 'Deletion failed' })
      }
    } catch (error) {
      console.error('Delete failed:', error)
      setToast({ type: 'error', message: 'Connection error' })
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!artisan) {
    return null
  }

  const getStatusBadge = () => {
    if (!artisan.is_active) {
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Suspended</span>
    }
    if (!artisan.is_verified) {
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">Pending verification</span>
    }
    return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Verified</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/attorneys')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </button>

          <div className="flex flex-wrap items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {artisan.name || 'No name'}
                </h1>

              </div>
              <p className="text-gray-500 mt-1">{artisan.email}</p>
              <div className="flex items-center gap-3 mt-3">
                {getStatusBadge()}
                {artisan.specialty && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {artisan.specialty}
                  </span>
                )}
                {artisan.rating_average != null && artisan.review_count > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{artisan.rating_average.toFixed(1)}</span>
                    <span className="text-gray-500">({artisan.review_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={getAttorneyUrl({ stable_id: artisan?.stable_id || attorneyId, slug: artisan?.slug || undefined, specialty: artisan?.specialty || undefined, city: artisan?.address_city || undefined })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" />
                View public page
              </a>
              <button
                onClick={() => router.push(`/admin/attorneys/${attorneyId}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{artisan.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{artisan.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">
                      {[artisan.address_street, artisan.address_postal_code, artisan.address_city].filter(Boolean).join(', ') || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">SIRET</p>
                    <p className="text-gray-900 font-mono">{artisan.siret || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spécialité */}
            {artisan.specialty && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  Specialty
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {artisan.specialty}
                </span>
              </div>
            )}

            {/* Description */}
            {artisan.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{artisan.description}</p>
              </div>
            )}

            {/* Bio */}
            {artisan.bio && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Bio</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{artisan.bio}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Average rating</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    {artisan.rating_average ? (
                      <>
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {artisan.rating_average.toFixed(1)}
                      </>
                    ) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Number of reviews</span>
                  <span className="font-semibold text-gray-900">
                    {artisan.review_count || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Registered on {formatDate(artisan.created_at)}
                </p>
                {artisan.updated_at && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    Modified on {formatDate(artisan.updated_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {!artisan.is_verified && (
                  <button
                    onClick={() => setVerifyModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    <Shield className="w-4 h-4" />
                    Verify attorney
                  </button>
                )}
                <button
                  onClick={() => setSuspendModal(true)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                    artisan.is_active
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {artisan.is_active ? (
                    <>
                      <Ban className="w-4 h-4" />
                      Suspend
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Reactivate
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeleteModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div role="status" aria-live="polite" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-current opacity-50 hover:opacity-100" aria-label="Close">×</button>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      <ConfirmationModal
        isOpen={verifyModal}
        onClose={() => setVerifyModal(false)}
        onConfirm={handleVerify}
        title="Verify attorney"
        message={`Do you confirm the verification of ${artisan.name}? The verified badge will be displayed on their profile.`}
        confirmText="Verify"
        variant="success"
      />

      {/* Suspend Modal */}
      <ConfirmationModal
        isOpen={suspendModal}
        onClose={() => setSuspendModal(false)}
        onConfirm={handleSuspend}
        title={artisan.is_active ? "Suspend attorney" : "Reactivate attorney"}
        message={
          artisan.is_active
            ? `Are you sure you want to suspend ${artisan.name}? Their profile will no longer be visible.`
            : `Do you want to reactivate ${artisan.name}'s account?`
        }
        confirmText={artisan.is_active ? 'Suspend' : 'Reactivate'}
        variant={artisan.is_active ? 'warning' : 'success'}
      />

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete attorney"
        message={`Are you sure you want to delete ${artisan.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        requireConfirmation="DELETE"
      />
    </div>
  )
}
