import { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'Contact Us | US Attorneys',
  description: 'Contact the US Attorneys team. Questions, support, partnerships. We are here to help.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact Us | US Attorneys',
    description: 'Contact the US Attorneys team for any questions or inquiries.',
    url: `${SITE_URL}/contact`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  )
}
