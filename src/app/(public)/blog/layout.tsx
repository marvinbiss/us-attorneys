import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Blog — Legal Tips and Insights | USAttorneys',
  description: 'Practical tips, guides, and news for all your legal needs. Practice areas, attorney selection, and legal processes.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Blog — Legal Tips and Insights | USAttorneys',
    description: 'Practical tips, guides, and news for all your legal needs.',
    url: `${SITE_URL}/blog`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
