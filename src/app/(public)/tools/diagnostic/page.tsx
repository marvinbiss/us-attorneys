import { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import DiagnosticClient from './DiagnosticClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Which Attorney Do You Need? Free 30-Second Diagnostic',
  description:
    'Answer 3 questions to find out which attorney you need. Personal injury, family law, criminal defense... Our tool guides you to the right professional.',
  alternates: {
    canonical: `${SITE_URL}/tools/diagnostic`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    locale: 'en_US',
    title: 'Which Attorney Do You Need? Free 30-Second Diagnostic',
    description:
      'Answer 3 questions to find out which attorney you need. Personal injury, family law, criminal defense... Our tool guides you to the right professional.',
    url: `${SITE_URL}/tools/diagnostic`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'USAttorneys — Free attorney diagnostic',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Which Attorney Do You Need? Free 30-Second Diagnostic',
    description:
      'Answer 3 questions to find the right attorney. Personal injury, family law, criminal defense, and more.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const diagnosticFAQs = [
  {
    question: 'How do I know which attorney to call for my issue?',
    answer:
      'Our diagnostic tool asks you 3 simple questions about your issue (category, details, urgency) and recommends the most suitable type of attorney, along with a fee estimate and practical advice.',
  },
  {
    question: 'Is the diagnostic really free?',
    answer:
      'Yes, our diagnostic tool is completely free with no obligation. It guides you to the right type of professional in under 30 seconds.',
  },
  {
    question: 'What is the difference between a personal injury lawyer and a general practice attorney?',
    answer:
      'A personal injury lawyer specializes in cases involving physical harm or negligence — car accidents, slip and falls, medical malpractice. A general practice attorney handles a broader range of legal matters including contracts, real estate, and minor disputes.',
  },
  {
    question: 'Should I hire a criminal defense attorney or a civil litigation attorney?',
    answer:
      'A criminal defense attorney represents you when you are charged with a crime. A civil litigation attorney handles non-criminal disputes such as breach of contract, property disputes, or debt collection. If you are facing criminal charges, you need a criminal defense attorney.',
  },
  {
    question: 'How do I find an attorney for an urgent matter?',
    answer:
      'During the diagnostic, indicate that your issue is urgent. We will redirect you to our dedicated emergency page with attorneys available on short notice. In case of immediate danger, call 911 first.',
  },
]

export default function DiagnosticPage() {
  const breadcrumbItems = [
    { label: 'Tools', href: '/tools/diagnostic' },
    { label: 'Diagnostic' },
  ]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools/diagnostic' },
    { name: 'Diagnostic', url: '/tools/diagnostic' },
  ])

  const faqSchema = getFAQSchema(
    diagnosticFAQs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    }))
  )

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <Breadcrumb items={breadcrumbItems} className="mb-4 text-blue-200 [&_a]:text-blue-200 [&_a:hover]:text-white [&_svg]:text-blue-300 [&>ol>li:last-child_span]:text-white" />
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading mb-3">
              Which Attorney Do You Need?
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              Answer 3 simple questions and find the right professional for your issue. Free and takes only 30 seconds.
            </p>
          </div>
        </div>

        {/* Quiz section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <DiagnosticClient />
        </div>

        {/* FAQ section */}
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl font-bold text-gray-900 font-heading mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {diagnosticFAQs.map((faq, index) => (
                <div key={index} className="border-b border-gray-100 pb-6 last:border-0">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
