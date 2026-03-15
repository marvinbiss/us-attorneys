import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'My Favorites',
  description: 'View your saved attorneys on US Attorneys.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/my-favorites` },
}

export default function MesFavorisLayout({ children }: { children: React.ReactNode }) {
  return children
}
