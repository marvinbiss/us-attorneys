import { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import AssessmentClient from './AssessmentClient'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Free Legal Assessment — Find the Right Attorney | US Attorneys',
  description:
    'Answer 5 quick questions to identify what type of attorney you need. Get matched with top-rated lawyers in your area, deadline warnings, and a consultation preparation checklist.',
  alternates: {
    canonical: `${SITE_URL}/tools/legal-assessment`,
  },
  openGraph: {
    title: 'Free Legal Assessment — Find the Right Attorney',
    description:
      'Not sure what kind of lawyer you need? Our free 5-question assessment helps you identify the right practice area, understand deadlines, and prepare for your first consultation.',
    url: `${SITE_URL}/tools/legal-assessment`,
    type: 'website',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Legal Assessment — Find the Right Attorney',
    description:
      'Answer 5 quick questions to find the right attorney for your legal issue. Free, fast, and confidential.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const breadcrumbItems = [
  { label: 'Tools', href: '/tools/legal-assessment' },
  { label: 'Legal Assessment' },
]

const breadcrumbSchemaItems = [
  { name: 'Home', url: '/' },
  { name: 'Tools', url: '/tools/legal-assessment' },
  { name: 'Legal Assessment', url: '/tools/legal-assessment' },
]

function getHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Find the Right Attorney for Your Legal Issue',
    description:
      'A guided 5-step assessment that helps you identify the type of attorney you need, understand important deadlines, and prepare for your first consultation.',
    totalTime: 'PT3M',
    tool: {
      '@type': 'HowToTool',
      name: 'US Attorneys Legal Assessment Tool',
    },
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Identify Your Legal Category',
        text: 'Select the broad category that best matches your legal issue: Personal/Family, Business, Criminal, Immigration, Real Estate, Employment, or Other.',
        url: `${SITE_URL}/tools/legal-assessment`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Describe Your Specific Issue',
        text: 'Choose the specific sub-category that most closely matches your situation for a more accurate attorney recommendation.',
        url: `${SITE_URL}/tools/legal-assessment`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Provide Your Timeline',
        text: 'Indicate when your legal issue occurred to help assess any potential statute of limitations deadlines.',
        url: `${SITE_URL}/tools/legal-assessment`,
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Select Your State',
        text: 'Choose your state to receive location-specific attorney recommendations and jurisdiction-relevant information.',
        url: `${SITE_URL}/tools/legal-assessment`,
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Indicate Urgency Level',
        text: 'Tell us how urgent your legal matter is so we can prioritize accordingly and flag any immediate deadline concerns.',
        url: `${SITE_URL}/tools/legal-assessment`,
      },
    ],
  }
}

function getFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is this legal assessment tool free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, the legal assessment is completely free, confidential, and requires no account or personal information to use.',
        },
      },
      {
        '@type': 'Question',
        name: 'How accurate is this legal assessment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'This tool provides general guidance based on common legal categories and is designed to point you in the right direction. It is not a substitute for professional legal advice. An attorney can provide a definitive assessment of your specific situation.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens after I complete the assessment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You will receive a recommended practice area with a confidence score, links to matching attorneys in your area, important deadline information, and a checklist of what to prepare for your first consultation.',
        },
      },
    ],
  }
}

export default function LegalAssessmentPage() {
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbSchemaItems)
  const howToSchema = getHowToSchema()
  const faqSchema = getFaqSchema()

  return (
    <>
      <JsonLd data={[breadcrumbSchema, howToSchema, faqSchema]} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero header */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <Breadcrumb items={breadcrumbItems} className="mb-6 text-gray-400" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight mb-4">
              Free Legal Assessment
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl">
              Not sure what kind of attorney you need? Answer 5 quick questions and we will
              recommend the right practice area, flag important deadlines, and help you
              prepare for your first consultation.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                100% Free
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                No Account Required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Takes Under 3 Minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Confidential
              </span>
            </div>
          </div>
        </section>

        {/* Assessment body */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <AssessmentClient />
        </section>

        {/* FAQ section (visible for SEO and users) */}
        <section className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Is this legal assessment tool free?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Yes, the legal assessment is completely free, confidential, and requires no account or personal information to use.
                  Your answers are processed entirely in your browser and are not stored on our servers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  How accurate is this legal assessment?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  This tool provides general guidance based on common legal categories and is designed to point you in the right direction.
                  It is not a substitute for professional legal advice. An attorney can provide a definitive assessment of your specific situation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  What happens after I complete the assessment?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You will receive a recommended practice area with a confidence score, links to matching attorneys in your area,
                  important deadline information, and a checklist of what to prepare for your first consultation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Does this tool provide legal advice?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No. This assessment tool is for informational purposes only and does not constitute legal advice. It helps you
                  identify the type of attorney who may be able to assist you. For specific legal guidance, please consult with a
                  licensed attorney.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  What are statutes of limitations?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Statutes of limitations are legal deadlines for filing a lawsuit or taking legal action. They vary by state and type
                  of case. Missing these deadlines can permanently bar your right to seek legal relief. This tool provides general
                  estimates, but an attorney can tell you the exact deadline for your situation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
