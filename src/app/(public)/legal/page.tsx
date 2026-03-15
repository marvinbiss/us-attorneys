import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Notice | US Attorneys',
  robots: { index: false },
}

export default function LegalPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Legal Notice</h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
