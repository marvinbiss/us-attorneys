import { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import CaseEstimatorClient from './CaseEstimatorClient'

export const revalidate = REVALIDATE.staticPages

const PAGE_URL = `${SITE_URL}/tools/case-estimator`

export const metadata: Metadata = {
  title: 'Free Case Outcome Estimator — Predict Your Legal Case Results',
  description:
    'Get an AI-powered estimate of your legal case outcome based on historical case data. See win rates, average settlements, and time to resolution for your case type and state.',
  alternates: {
    canonical: PAGE_URL,
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
    title: 'Free Case Outcome Estimator — Predict Your Legal Case Results',
    description:
      'Get an AI-powered estimate of your legal case outcome. See win rates, settlement ranges, and resolution timelines based on real case data.',
    url: PAGE_URL,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'USAttorneys — Case Outcome Estimator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Case Outcome Estimator — Predict Your Legal Case Results',
    description:
      'AI-powered case outcome predictor. See win rates, settlement ranges, and resolution timelines.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const faqs = [
  {
    question: 'How does the Case Outcome Estimator work?',
    answer:
      'Our estimator analyzes historical case results from public court records and attorney-reported data. It looks at cases with similar characteristics (case type, state, outcome) to compute win rates, average settlements, and resolution timelines. The more data available, the higher the confidence level of the estimate.',
  },
  {
    question: 'Is the case estimate accurate?',
    answer:
      'The estimates are based on historical data and statistical averages. They provide a useful benchmark but should not be treated as a prediction. Every case is unique, and actual outcomes depend on specific facts, evidence quality, attorney skill, and many other factors. Always consult a qualified attorney for advice about your specific situation.',
  },
  {
    question: 'Is this tool free to use?',
    answer:
      'Yes, our Case Outcome Estimator is completely free with no obligation. You can use it as many times as you need to understand potential outcomes for different case types and states.',
  },
  {
    question: 'What does "confidence level" mean?',
    answer:
      'The confidence level reflects the amount of data behind the estimate. High confidence means the estimate is based on over 100 similar cases. Medium confidence is based on 20 to 100 cases. Low confidence means fewer than 20 cases were available, so the estimate should be taken with more caution.',
  },
  {
    question: 'Does using this tool constitute legal advice?',
    answer:
      'No. This tool provides informational estimates only. It does not constitute legal advice and does not create an attorney-client relationship. For advice specific to your situation, please consult a licensed attorney in your state.',
  },
  {
    question: 'What types of cases can I estimate?',
    answer:
      'You can estimate outcomes for personal injury (car accidents, medical malpractice, slip and fall, etc.), criminal defense, family law, employment disputes, business litigation, real estate disputes, bankruptcy, and immigration cases across all 50 US states and DC.',
  },
]

export default function CaseEstimatorPage() {
  const breadcrumbItems = [
    { label: 'Tools', href: '/tools/diagnostic' },
    { label: 'Case Outcome Estimator' },
  ]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tools', url: `${SITE_URL}/tools/diagnostic` },
    { name: 'Case Outcome Estimator', url: PAGE_URL },
  ])

  const faqSchema = getFAQSchema(faqs)

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema].filter(Boolean) as Record<string, unknown>[]} />

      <div className="min-h-screen bg-gray-950">
        {/* ── Hero Section ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <Breadcrumb items={breadcrumbItems} />

            <div className="mt-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                AI-Powered Analysis
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                Case Outcome Estimator
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl">
                Get a data-driven estimate of your legal case outcome. Our tool analyzes thousands
                of historical case results to show you win rates, settlement ranges, and resolution
                timelines — completely free.
              </p>
            </div>
          </div>
        </section>

        {/* ── Disclaimer ────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/80">
            <strong className="text-amber-300">Disclaimer:</strong> This tool provides estimates
            based on historical data and is <strong>NOT legal advice</strong>. Every case is unique.
            Consult a qualified attorney for guidance specific to your situation.
          </div>
        </section>

        {/* ── Tool ──────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <CaseEstimatorClient />
        </section>

        {/* ── FAQ Section ───────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-gray-700 bg-gray-800/30 overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium hover:text-indigo-300 transition-colors list-none">
                    <span>{faq.question}</span>
                    <svg
                      className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-700/50 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
