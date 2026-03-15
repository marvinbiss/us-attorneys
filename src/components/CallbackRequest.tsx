'use client'

import { useState } from 'react'
import { Phone, CheckCircle, Loader2 } from 'lucide-react'
import { trackEvent, trackConversion } from '@/lib/analytics/tracking'

interface CallbackRequestProps {
  specialtySlug?: string
  cityName?: string
}

function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, '')
  if (/^0[1-9]\d{8}$/.test(cleaned)) return true
  if (/^\+33[1-9]\d{8}$/.test(cleaned)) return true
  return false
}

export default function CallbackRequest({ specialtySlug, cityName }: CallbackRequestProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phone.trim()) {
      setError('Veuillez entrer votre numéro')
      return
    }
    if (!isValidFrenchPhone(phone.trim())) {
      setError('Numéro de téléphone français invalide')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: specialtySlug || 'general',
          ville: cityName || '',
          telephone: phone.trim(),
          nom: '',
          email: '',
          description: 'Demande de rappel',
          urgency: 'semaine',
          budget: '',
          codePostal: '',
        }),
      })

      if (!res.ok) throw new Error('Erreur')

      trackEvent('devis_submitted', {
        source: 'callback_request',
        service: specialtySlug || '',
        city: cityName || '',
        value: 30,
        currency: 'EUR',
      })
      trackConversion('generate_lead', 30)

      setSuccess(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-green-900">Demande envoyée !</p>
        <p className="text-xs text-green-700 mt-1">Un artisan vous rappellera sous 24h.</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Phone className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-900">Être rappelé gratuitement</span>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setError('') }}
          style={{ fontSize: '16px' }}
          className={`flex-1 rounded-lg border ${error ? 'border-red-400' : 'border-amber-300'} bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500`}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rappel gratuit'}
        </button>
      </form>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      <p className="text-[10px] text-amber-700/60 mt-2">
        Gratuit et sans engagement. Vos données restent confidentielles.
      </p>
    </div>
  )
}
