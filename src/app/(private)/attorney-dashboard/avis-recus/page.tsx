'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ArrowLeft, ThumbsUp, MessageCircle, Loader2, X } from 'lucide-react'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'

interface Avis {
  id: string
  client_name: string
  created_at: string
  rating: number
  comment: string | null
  artisan_response: string | null
}

interface Stats {
  moyenne: number
  total: number
  distribution: { note: number; count: number }[]
}

export default function AvisRecusPage() {
  const [loading, setLoading] = useState(true)
  const [avis, setAvis] = useState<Avis[]>([])
  const [stats, setStats] = useState<Stats>({
    moyenne: 0,
    total: 0,
    distribution: [5, 4, 3, 2, 1].map(note => ({ note, count: 0 })),
  })
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  useEffect(() => {
    fetchAvis()
  }, [])

  const fetchAvis = async () => {
    try {
      const response = await fetch('/api/attorney/reviews')
      const data = await response.json()

      if (response.ok) {
        setAvis(data.avis || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching avis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return

    setSubmitting(true)
    setReplyError(null)
    try {
      const response = await fetch(`/api/attorney/reviews/${reviewId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: replyText.trim() }),
      })

      if (response.ok) {
        // Update local state
        setAvis(prev =>
          prev.map(a =>
            a.id === reviewId ? { ...a, artisan_response: replyText.trim() } : a
          )
        )
        setReplyingTo(null)
        setReplyText('')
      } else {
        const data = await response.json()
        setReplyError(data.error || 'Erreur lors de l\'envoi de la réponse')
      }
    } catch {
      setReplyError('Erreur lors de l\'envoi de la réponse')
    } finally {
      setSubmitting(false)
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des avis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/attorney-dashboard/dashboard" className="text-white/80 hover:text-white" aria-label="Retour au tableau de bord">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Avis reçus</h1>
              <p className="text-blue-100">Consultez et répondez aux avis de vos clients</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AttorneySidebar activePage="avis-recus" />

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">{Number(stats.moyenne).toFixed(1)}</div>
                  <div className="flex justify-center mb-2" aria-label={`Note : ${Number(stats.moyenne).toFixed(1)} sur 5`} role="img">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        aria-hidden="true"
                        className={`w-6 h-6 ${
                          i < Math.round(stats.moyenne) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-500">Basé sur {stats.total} avis</p>
                </div>
                <div className="space-y-2">
                  {stats.distribution.map((item) => (
                    <div key={item.note} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-12">{item.note} étoiles</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 rounded-full h-2"
                          style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Avis list */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Derniers avis
              </h2>
              <div className="space-y-6">
                {avis.map((item) => (
                  <div key={item.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-900">{item.client_name}</span>
                          <div className="flex" aria-label={`Note : ${item.rating} sur 5`} role="img">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                aria-hidden="true"
                                className={`w-4 h-4 ${
                                  i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {!item.artisan_response && (
                        <button
                          onClick={() => setReplyingTo(item.id)}
                          aria-label="Répondre à cet avis"
                          title="Répondre"
                          className="flex items-center gap-2 text-blue-600 text-sm hover:underline"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Répondre
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{item.comment}</p>

                    {/* Reply form */}
                    {replyingTo === item.id && (
                      <div className="bg-gray-50 rounded-lg p-4 ml-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-600 font-medium">Votre réponse :</p>
                          <button
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyText('')
                              setReplyError(null)
                            }}
                            aria-label="Annuler la réponse"
                            title="Annuler"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Écrivez votre réponse..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                          rows={3}
                        />
                        {replyError && (
                          <p className="text-red-600 text-sm mb-2">{replyError}</p>
                        )}
                        <button
                          onClick={() => handleReply(item.id)}
                          disabled={submitting || !replyText.trim()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                          Envoyer
                        </button>
                      </div>
                    )}

                    {item.artisan_response && (
                      <div className="bg-blue-50 rounded-lg p-4 ml-4">
                        <p className="text-sm text-blue-600 font-medium mb-1">Votre réponse :</p>
                        <p className="text-gray-700 text-sm">{item.artisan_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
              <div className="flex items-start gap-4">
                <ThumbsUp className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Conseil pour améliorer vos avis</h3>
                  <p className="text-green-100 text-sm">
                    Répondez rapidement aux avis de vos clients, même positifs. Cela montre votre professionnalisme
                    et encourage d'autres clients à laisser leur avis. Les artisans qui répondent aux avis
                    peuvent recevoir davantage de demandes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
