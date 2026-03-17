import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Verification Process | US Attorneys',
  alternates: {
    canonical: `${SITE_URL}/verification-process`,
  },
  robots: { index: false },
}

export default function VerificationProcessPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Process</h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
