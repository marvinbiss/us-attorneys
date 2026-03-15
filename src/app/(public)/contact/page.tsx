import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import ContactPageClient from './ContactPageClient'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact the USAttorneys team for any questions about our attorney directory. Contact form, email, and fast support.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: 'Contact Us',
    description: 'Contact the USAttorneys team for any questions about our attorney directory.',
    url: `${SITE_URL}/contact`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'USAttorneys — Contact' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us',
    description: 'Contact the USAttorneys team for any questions about our attorney directory.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 86400

export default async function ContactPage() {
  const cmsPage = await getPageContent('contact', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Contact', url: '/contact' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'Contact' }]} className="mb-4" />
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <>
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Contact', url: '/contact' },
      ])} />
      <ContactPageClient />
    </>
  )
}
