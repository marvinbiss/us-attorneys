'use client'

import Link from 'next/link'

export default function ServiceDetailError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <span className="text-2xl text-orange-600">!</span>
        </div>
        <h1 className="mb-2 font-heading text-2xl font-bold text-gray-900">
          Service temporarily unavailable
        </h1>
        <p className="mb-8 text-gray-500">
          We're experiencing a technical issue. Please try again in a moment.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Try again
          </button>
          <Link
            href="/practice-areas"
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-gray-50"
          >
            View all services
          </Link>
        </div>
      </div>
    </div>
  )
}
