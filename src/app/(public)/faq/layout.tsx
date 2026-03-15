import { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | US Attorneys',
  description: 'Find answers to your questions about US Attorneys. How to request a consultation, choose an attorney, guarantees, and more.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: 'FAQ - Frequently Asked Questions | US Attorneys',
    description: 'Find answers to your questions about US Attorneys.',
    url: `${SITE_URL}/faq`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  )
}
