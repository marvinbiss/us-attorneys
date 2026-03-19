import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function PracticeAreaNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-blue-600 opacity-20">404</div>
          <div className="text-6xl -mt-20 mb-4">{'\u2696\uFE0F'}</div>
        </div>

        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          Practice Area Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          The practice area you&apos;re looking for doesn&apos;t exist or has been renamed.
          Please browse our full list of practice areas below.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/practice-areas"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Search className="w-5 h-5" />
            All Practice Areas
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Popular practice areas:
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
