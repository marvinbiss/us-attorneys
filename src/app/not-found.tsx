import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-blue-600 opacity-20">404</div>
          <div className="text-6xl -mt-20 mb-4">{'\u2696\uFE0F'}</div>
        </div>

        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
          <Link
            href="/practice-areas"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5" />
            Find an Attorney
          </Link>
        </div>

        {/* Search bar */}
        <form action="/search" method="GET" className="mt-8 flex items-center gap-2 max-w-sm mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              placeholder="Search for a practice area..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Suggestions */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            You might be looking for:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/practice-areas/personal-injury" className="text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-full transition-colors">
              Personal Injury
            </Link>
            <Link href="/practice-areas/criminal-defense" className="text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-full transition-colors">
              Criminal Defense
            </Link>
            <Link href="/practice-areas/family-law" className="text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-full transition-colors">
              Family Law
            </Link>
            <Link href="/practice-areas/immigration" className="text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-full transition-colors">
              Immigration
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
