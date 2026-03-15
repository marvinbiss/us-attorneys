'use client'

import Link from 'next/link'

export default function ServiceDetailError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-orange-50 flex items-center justify-center">
          <span className="text-2xl text-orange-600">!</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">
          Service temporarily unavailable
        </h1>
        <p className="text-gray-500 mb-8">
          We're experiencing a technical issue. Please try again in a moment.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/services"
            className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-blue-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            View all services
          </Link>
        </div>
      </div>
    </div>
  )
}
