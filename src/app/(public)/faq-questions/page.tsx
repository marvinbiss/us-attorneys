import type { Metadata } from 'next'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Legal Questions & Answers | US Attorneys',
  robots: { index: false },
}

export default function FaqQuestionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
