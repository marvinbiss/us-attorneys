'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SetupPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract the hashed_token from query param
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token')
    : null

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600">
            Ce lien ne contient pas les informations nécessaires.
            Contactez-nous à <a href="mailto:support@us-attorneys.com" className="text-amber-600 underline">support@us-attorneys.com</a>.
          </p>
        </div>
      </div>
    )
  }

  const handleVerify = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      })

      if (verifyError) {
        setError(verifyError.message === 'Token has expired or is invalid'
          ? 'Ce lien a expiré. Contactez support@us-attorneys.com pour recevoir un nouveau lien.'
          : `Erreur : ${verifyError.message}`)
        setLoading(false)
        return
      }

      // Session is now active — redirect to password setup
      router.push('/definir-mot-de-passe')
    } catch {
      setError('Erreur inattendue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Bienvenue sur ServicesArtisans !
        </h1>
        <p className="text-gray-600 mb-6">
          Votre fiche artisan a été validée. Cliquez le bouton ci-dessous pour définir votre mot de passe et accéder à votre espace.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold transition-all shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/30 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Vérification en cours...
            </>
          ) : (
            'Définir mon mot de passe'
          )}
        </button>
        <p className="mt-4 text-xs text-gray-400">
          Ce lien expire dans 24 heures.
        </p>
      </div>
    </div>
  )
}
