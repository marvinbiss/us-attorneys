import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Review Policy | US Attorneys',
  alternates: {
    canonical: `${SITE_URL}/review-policy`,
  },
  robots: { index: false },
}

export default function ReviewPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Review Policy</h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
