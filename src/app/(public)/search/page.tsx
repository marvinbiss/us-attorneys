import type { Metadata } from 'next'
import { HeroSearch } from '@/components/search/HeroSearch'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Find an Attorney | US Attorneys',
  robots: { index: false },
  alternates: { canonical: `${SITE_URL}/search` },
}

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Find an Attorney</h1>
      <HeroSearch />
    </div>
  )
}
