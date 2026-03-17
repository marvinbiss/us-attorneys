import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { SITE_URL } from '@/lib/seo/config'
import { Loader2 } from 'lucide-react'
import { REVALIDATE } from '@/lib/cache'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: '600px' }}>
      <div className="text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
      </div>
    </div>
  ),
})

export const metadata: Metadata = {
  title: 'Attorney Map',
  robots: { index: false },
  alternates: {
    canonical: `${SITE_URL}/attorney-map`,
  },
}

export const revalidate = REVALIDATE.attorneyProfile

export default function AttorneyMapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-extrabold font-heading mb-6">
          Attorney Map
        </h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ErrorBoundary fallback={
          <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: '600px' }}>
            <p className="text-gray-500">Unable to load the map. Please refresh the page.</p>
          </div>
        }>
          <MapClient />
        </ErrorBoundary>
      </div>
    </div>
  )
}
