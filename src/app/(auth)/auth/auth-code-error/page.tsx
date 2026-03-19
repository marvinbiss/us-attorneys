import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication Error | US Attorneys',
  robots: { index: false, follow: false },
}

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Authentication Failed</h1>
        <p className="mb-8 text-gray-600">
          We were unable to complete the sign-in process. This can happen if the link expired or was
          already used. Please try signing in again.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-700 hover:to-blue-800"
        >
          Try Again
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          If this problem persists, please{' '}
          <Link href="/contact" className="text-blue-600 hover:underline">
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
