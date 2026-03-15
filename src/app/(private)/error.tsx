'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Espace privé — erreur:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          Une erreur est survenue
        </h1>
        <p className="text-gray-600 mb-8">
          Impossible de charger cette page. Réessayez ou revenez à votre tableau de bord.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </button>
          <Link
            href="/client-dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Mon espace
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-sm text-gray-400">
            Code erreur : {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
