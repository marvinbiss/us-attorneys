import { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import BadgeClient from './BadgeClient'

export const metadata: Metadata = {
  title: `Verified Attorney Badge | ${SITE_NAME}`,
  robots: { index: false },
  alternates: { canonical: `${SITE_URL}/attorney-badge` },
}

export const revalidate = false

export default function BadgeArtisanPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading text-3xl font-bold text-gray-900">
          Verified Attorney Badge
        </h1>
      </div>
      <BadgeClient faqItems={[]} />
    </div>
  )
}
