import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Guarantee | US Attorneys',
  robots: { index: false },
}

export default function GuaranteePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Guarantee</h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
