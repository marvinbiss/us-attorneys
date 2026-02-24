'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'

interface ClaimButtonProps {
  providerId: string
  providerName: string
  hasSiret: boolean
}

export function ClaimButton({ providerId, providerName, hasSiret }: ClaimButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [siret, setSiret] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check auth + prefill profile BEFORE opening modal
  const handleOpenClaim = async () => {
    setCheckingAuth(true)
    try {
      const res = await fetch('/api/auth/me')
      if (res.status === 401 || !res.ok) {
        // Not logged in — redirect to login, then back here
        router.push(`/connexion?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      const data = await res.json()
      if (data?.user) {
        if (data.user.fullName) setFullName(data.user.fullName)
        if (data.user.email) setEmail(data.user.email)
        if (data.user.phone) setPhone(data.user.phone)
      }
      setShowModal(true)
    } catch {
      // Network error — open modal anyway, submit will catch 401
      setShowModal(true)
    } finally {
      setCheckingAuth(false)
    }
  }

  // Format SIRET with spaces for display (XXX XXX XXX XXXXX)
  const formatSiret = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    const parts = []
    if (digits.length > 0) parts.push(digits.slice(0, 3))
    if (digits.length > 3) parts.push(digits.slice(3, 6))
    if (digits.length > 6) parts.push(digits.slice(6, 9))
    if (digits.length > 9) parts.push(digits.slice(9, 14))
    return parts.join(' ')
  }

  const handleSiretChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    setSiret(digits)
    setError(null)
  }

  const formatPhone = (value: string) => {
    return value.replace(/[^\d+]/g, '').slice(0, 15)
  }

  const isFormValid =
    siret.length === 14 &&
    fullName.trim().length >= 2 &&
    email.includes('@') &&
    phone.replace(/\D/g, '').length >= 10 &&
    position.trim().length >= 2

  const handleClaim = async () => {
    if (siret.length !== 14) {
      setError('Le SIRET doit contenir exactement 14 chiffres')
      return
    }
    if (fullName.trim().length < 2) {
      setError('Veuillez entrer votre nom complet')
      return
    }
    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Veuillez entrer un numéro de téléphone valide')
      return
    }
    if (position.trim().length < 2) {
      setError('Veuillez indiquer votre poste dans l\'entreprise')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/artisan/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          siret,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          position: position.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/connexion?redirect=${encodeURIComponent(window.location.pathname)}`)
          return
        }
        setError(data.error || 'Erreur lors de la revendication')
        return
      }

      setSuccess(true)
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasSiret) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Vous êtes cet artisan ?</p>
            <p className="text-sm text-amber-700 mt-1">
              Cette fiche ne peut pas encore être revendiquée automatiquement.
              Contactez-nous à{' '}
              <a href="mailto:support@servicesartisans.fr" className="underline font-medium">
                support@servicesartisans.fr
              </a>{' '}
              avec une copie de votre extrait Kbis.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleOpenClaim}
        disabled={checkingAuth}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-500/20 disabled:opacity-70"
      >
        {checkingAuth ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Shield className="w-5 h-5" />
        )}
        Vous êtes cet artisan ? Revendiquez cette fiche
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isLoading && setShowModal(false)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => !isLoading && setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              // Success state
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Demande envoyée !
                </h3>
                <p className="text-gray-600 mb-6">
                  Votre demande de revendication pour <strong>{providerName}</strong> a été soumise.
                  Un administrateur la validera sous 24 à 48 heures.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              // Form state
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Revendiquer cette fiche
                    </h3>
                    <p className="text-sm text-gray-500">{providerName}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Remplissez vos coordonnées et votre SIRET pour prouver que vous êtes le propriétaire de cette entreprise.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Nom complet */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError(null) }}
                      placeholder="Jean Dupont"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email professionnel <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null) }}
                      placeholder="jean@monentreprise.fr"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(formatPhone(e.target.value)); setError(null) }}
                      placeholder="06 12 34 56 78"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Poste */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poste / Fonction <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => { setPosition(e.target.value); setError(null) }}
                      placeholder="Gérant, Artisan plombier, Chef d'entreprise..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* SIRET */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro SIRET <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formatSiret(siret)}
                      onChange={(e) => handleSiretChange(e.target.value)}
                      placeholder="XXX XXX XXX XXXXX"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-lg tracking-wider font-mono"
                      maxLength={17}
                      disabled={isLoading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Votre SIRET figure sur votre extrait Kbis ou sur{' '}
                      <a
                        href="https://www.societe.com"
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="text-amber-600 hover:underline"
                      >
                        societe.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleClaim}
                    disabled={isLoading || !isFormValid}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Envoyer ma demande'
                    )}
                  </button>
                </div>

                <p className="mt-4 text-xs text-gray-400 text-center">
                  Un administrateur vérifiera et validera votre demande sous 24 à 48h.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
