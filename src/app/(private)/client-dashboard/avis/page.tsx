'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, MessageSquare, Star, Settings, ArrowLeft, Edit2, Trash2, Loader2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'

interface AvisPublie {
  id: string
  artisan: string
  attorney_id: string
  service: string | null
  date: string
  note: number
  commentaire: string
  reponse?: string
}

interface AvisEnAttente {
  id: string
  artisan: string
  attorney_id: string
  service: string | null
  date: string
  booking_id: string
}

export default function AvisClientPage() {
  const [avisPublies, setAvisPublies] = useState<AvisPublie[]>([])
  const [avisEnAttente, setAvisEnAttente] = useState<AvisEnAttente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedAvis, setSelectedAvis] = useState<AvisEnAttente | null>(null)
  const [editingAvis, setEditingAvis] = useState<AvisPublie | null>(null)
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAvis()
  }, [])

  const fetchAvis = async () => {
    try {
      const response = await fetch('/api/client/reviews')
      if (response.ok) {
        const data = await response.json()
        setAvisPublies(data.avisPublies || [])
        setAvisEnAttente(data.avisEnAttente || [])
      }
    } catch (error) {
      console.error('Error fetching avis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAvis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAvis && !editingAvis) return

    setSubmitting(true)
    try {
      if (editingAvis) {
        // Update existing review
        const response = await fetch('/api/client/reviews', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            review_id: editingAvis.id,
            rating: note,
            comment: commentaire,
          }),
        })

        if (response.ok) {
          await fetchAvis()
          setShowModal(false)
          setEditingAvis(null)
        }
      } else if (selectedAvis) {
        // Create new review
        const response = await fetch('/api/client/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attorney_id: selectedAvis.attorney_id,
            booking_id: selectedAvis.booking_id,
            rating: note,
            comment: commentaire,
          }),
        })

        if (response.ok) {
          await fetchAvis()
          setShowModal(false)
          setSelectedAvis(null)
        }
      }
    } catch (error) {
      console.error('Error submitting avis:', error)
    } finally {
      setSubmitting(false)
      setNote(5)
      setCommentaire('')
    }
  }

  const handleDeleteAvis = async (avisId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`/api/client/reviews?id=${avisId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAvis()
      }
    } catch (error) {
      console.error('Error deleting avis:', error)
    }
  }

  const openModal = (avis: AvisEnAttente) => {
    setSelectedAvis(avis)
    setEditingAvis(null)
    setNote(5)
    setCommentaire('')
    setShowModal(true)
  }

  const openEditModal = (avis: AvisPublie) => {
    setEditingAvis(avis)
    setSelectedAvis(null)
    setNote(avis.note)
    setCommentaire(avis.commentaire)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
              { label: 'My Dashboard', href: '/client-dashboard' },
              { label: 'My Reviews' }
            ]}
            className="mb-4"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/client-dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
                <p className="text-gray-600">Manage your reviews of attorneys</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <nav className="bg-white rounded-xl shadow-sm p-4 space-y-1">
              <Link
                href="/client-dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-5 h-5" />
                My Cases
              </Link>
              <Link
                href="/client-dashboard/messages"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <MessageSquare className="w-5 h-5" />
                Messages
              </Link>
              <Link
                href="/client-dashboard/reviews"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium"
              >
                <Star className="w-5 h-5" />
                My Reviews
              </Link>
              <Link
                href="/client-dashboard/parametres"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <LogoutButton />
            </nav>
            <QuickSiteLinks />
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* En attente */}
            {avisEnAttente.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Reviews ({avisEnAttente.length})
                </h2>
                <div className="space-y-4">
                  {avisEnAttente.map((avis) => (
                    <div
                      key={avis.id}
                      className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{avis.artisan}</h3>
                          <p className="text-sm text-gray-600">{avis.service}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Service on {new Date(avis.date).toLocaleDateString('en-US')}
                          </p>
                        </div>
                        <button
                          onClick={() => openModal(avis)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                        >
                          Leave a Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avis publiés */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Published Reviews ({avisPublies.length})
              </h2>
              {avisPublies.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  You haven&apos;t published any reviews yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {avisPublies.map((avis) => (
                    <div
                      key={avis.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{avis.artisan}</h3>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < avis.note ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{avis.service}</p>
                          <p className="text-gray-700">{avis.commentaire}</p>
                          {avis.reponse && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Attorney&apos;s response:</p>
                              <p className="text-sm text-gray-600">{avis.reponse}</p>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Published on {new Date(avis.date).toLocaleDateString('en-US')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(avis)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAvis(avis.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (selectedAvis || editingAvis) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingAvis ? 'Edit Your Review' : `Leave a Review for ${selectedAvis?.artisan}`}
            </h2>
            <p className="text-gray-600 mb-6">
              Service: {editingAvis?.service || selectedAvis?.service}
            </p>

            <form onSubmit={handleSubmitAvis} className="space-y-6">
              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNote(value)}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          value <= note ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Comment
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your experience with this attorney..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedAvis(null)
                    setEditingAvis(null)
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAvis ? 'Update' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
