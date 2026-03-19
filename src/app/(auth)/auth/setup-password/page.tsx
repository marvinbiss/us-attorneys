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
  const token =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold text-gray-900">Invalid Link</h1>
          <p className="text-gray-600">
            This link does not contain the required information. Contact us at{' '}
            <a href="mailto:support@us-attorneys.com" className="text-amber-600 underline">
              support@us-attorneys.com
            </a>
            .
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
        setError(
          verifyError.message === 'Token has expired or is invalid'
            ? 'This link has expired. Contact support@us-attorneys.com to receive a new link.'
            : `Error: ${verifyError.message}`
        )
        setLoading(false)
        return
      }

      // Session is now active — redirect to password setup
      router.push('/set-password')
    } catch {
      setError('Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
          <Wrench className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Welcome to US Attorneys!</h1>
        <p className="mb-6 text-gray-600">
          Your attorney profile has been approved. Click the button below to set your password and
          access your dashboard.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Verifying...
            </>
          ) : (
            'Set My Password'
          )}
        </button>
        <p className="mt-4 text-xs text-gray-400">This link expires in 24 hours.</p>
      </div>
    </div>
  )
}
