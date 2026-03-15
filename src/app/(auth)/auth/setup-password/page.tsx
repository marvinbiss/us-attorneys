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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">
            This link does not contain the required information.
            Contact us at <a href="mailto:support@us-attorneys.com" className="text-amber-600 underline">support@us-attorneys.com</a>.
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
          ? 'This link has expired. Contact support@us-attorneys.com to receive a new link.'
          : `Error: ${verifyError.message}`)
        setLoading(false)
        return
      }

      // Session is now active — redirect to password setup
      router.push('/definir-mot-de-passe')
    } catch {
      setError('Unexpected error. Please try again.')
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
          Welcome to US Attorneys!
        </h1>
        <p className="text-gray-600 mb-6">
          Your attorney profile has been approved. Click the button below to set your password and access your dashboard.
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
              Verifying...
            </>
          ) : (
            'Set My Password'
          )}
        </button>
        <p className="mt-4 text-xs text-gray-400">
          This link expires in 24 hours.
        </p>
      </div>
    </div>
  )
}
