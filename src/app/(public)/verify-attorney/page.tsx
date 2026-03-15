import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import VerifierClient from './VerifierClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Verify an Attorney | US Attorneys',
  robots: { index: false },
  alternates: { canonical: `${SITE_URL}/verify-attorney` },
}

export default function VerifyAttorneyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Verify an Attorney</h1>
      <VerifierClient faqItems={[]} />
    </div>
  )
}
