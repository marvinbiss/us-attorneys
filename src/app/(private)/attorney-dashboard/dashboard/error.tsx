'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md w-full">
        <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-gray-600 mb-8 text-sm">
          Le tableau de bord n&apos;a pas pu être chargé. Cela peut être dû à un problème temporaire.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/attorney-dashboard"
            className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm py-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Retour à l&apos;espace artisan
          </Link>
        </div>
      </div>
    </div>
  )
}
