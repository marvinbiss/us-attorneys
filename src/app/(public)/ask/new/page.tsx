import { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import AskForm from '@/components/qa/AskForm'

export const metadata: Metadata = {
  title: `Ask a Legal Question — Free Attorney Answers | ${SITE_NAME}`,
  description:
    'Ask your legal question and get free answers from licensed attorneys. Personal injury, family law, criminal defense, immigration, and more.',
  alternates: {
    canonical: `${SITE_URL}/ask/new`,
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Ask a Legal Question — Free Attorney Answers',
    description:
      'Ask your legal question and get free answers from licensed attorneys across all 50 states.',
    url: `${SITE_URL}/ask/new`,
    type: 'website',
  },
}

export default function AskNewPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Ask a Lawyer', url: '/ask' },
    { name: 'Ask a Question', url: '/ask/new' },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={breadcrumbSchema} />

      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb
            items={[
              { label: 'Ask a Lawyer', href: '/ask' },
              { label: 'Ask a Question' },
            ]}
            className="mb-4"
          />
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Ask a Legal Question
          </h1>
          <p className="mt-3 text-gray-600">
            Describe your legal situation and get free answers from licensed attorneys.
            The more detail you provide, the better answers you will receive.
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <AskForm />
        </div>
      </div>
    </div>
  )
}
