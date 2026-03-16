import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Request a Free Consultation | US Attorneys',
  description: 'Request a free consultation and receive up to 3 proposals from qualified attorneys near you. 100% free with no obligation.',
  alternates: {
    canonical: `${SITE_URL}/quotes`,
  },
  openGraph: {
    title: 'Request a Free Consultation | US Attorneys',
    description: 'Receive up to 3 proposals from qualified attorneys. Free with no obligation.',
    url: `${SITE_URL}/quotes`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
}

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
