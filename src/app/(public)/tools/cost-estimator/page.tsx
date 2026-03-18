import { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import CostEstimatorClient from './CostEstimatorClient'

export const revalidate = REVALIDATE.staticPages

const PAGE_URL = `${SITE_URL}/tools/cost-estimator`
const PAGE_TITLE = 'How Much Does a Lawyer Cost? Free Legal Cost Estimator'
const PAGE_DESCRIPTION =
  'Estimate attorney fees by practice area, state, and case complexity. Compare hourly rates, flat fees, contingency fees, and retainers. Free cost calculator for 75+ legal specialties across all 50 states.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
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
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'US Attorneys — Free Legal Cost Estimator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description:
      'Estimate attorney fees by practice area and state. Hourly rates, flat fees, contingency. Free calculator.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const costEstimatorFAQs = [
  {
    question: 'How much does a lawyer cost per hour?',
    answer:
      'Attorney hourly rates in the United States typically range from $150 to $700 per hour, depending on the practice area, geographic location, and attorney experience. In high-cost markets like New York City and San Francisco, rates often exceed $400/hr. In lower-cost states like Mississippi and Arkansas, rates may be as low as $150-$225/hr. Our cost estimator provides state-specific estimates for 75+ practice areas.',
  },
  {
    question: 'What is a contingency fee, and when is it used?',
    answer:
      'A contingency fee means the attorney only gets paid if you win your case. The fee is typically 25-40% of your settlement or verdict amount. This fee structure is most common in personal injury cases, car accidents, medical malpractice, wrongful death, and employment discrimination cases. You pay nothing upfront, though you may still be responsible for court costs and filing fees.',
  },
  {
    question: 'Is it cheaper to hire a lawyer in a rural area vs. a big city?',
    answer:
      'Yes, significantly. Attorneys in major metropolitan areas (New York, Los Angeles, Chicago, Washington DC) typically charge 40-100% more than attorneys in rural areas or smaller cities. Our estimator applies regional cost adjustments based on your state. For example, a personal injury attorney may charge $200/hr in Alabama but $400+/hr in California.',
  },
  {
    question: 'How much does a divorce lawyer cost?',
    answer:
      'Divorce attorney costs vary widely based on whether the divorce is contested or uncontested. An uncontested divorce may cost $1,000-$5,000 as a flat fee. A contested divorce with custody disputes can cost $10,000-$50,000+ with hourly rates of $150-$550/hr. Factors include asset complexity, custody disputes, need for forensic accountants, and number of court appearances.',
  },
  {
    question: 'Do most lawyers offer free consultations?',
    answer:
      'Many attorneys offer free initial consultations, especially in practice areas like personal injury, criminal defense, family law, and immigration. During this consultation (typically 30-60 minutes), the attorney evaluates your case, explains your options, and discusses fees. Use our directory to find attorneys offering free consultations in your area.',
  },
  {
    question: 'What factors affect how much a lawyer charges?',
    answer:
      'The main factors affecting legal costs are: (1) Case complexity — simple matters cost far less than complex multi-party litigation. (2) Attorney experience — senior partners charge 50-100% more than junior associates. (3) Geographic location — big-city attorneys charge significantly more. (4) Fee structure — hourly, flat fee, contingency, or retainer. (5) Whether the case goes to trial vs. settles. (6) Law firm size — BigLaw firms bill $400-$1,500+/hr while solo practitioners charge $150-$350/hr.',
  },
  {
    question: 'What is a retainer fee?',
    answer:
      'A retainer is an upfront deposit placed in a trust account. The attorney bills against this retainer as work is performed. If the retainer is depleted, you may need to replenish it. Typical retainer amounts range from $2,000 to $25,000 depending on the practice area and case complexity. The retainer is not an additional fee — it is an advance payment toward hourly billing.',
  },
  {
    question: 'How accurate is this cost estimator?',
    answer:
      'Our estimates are based on public legal industry surveys (Clio Legal Trends Report, Martindale-Hubbell, state bar fee schedules) and represent typical 2025-2026 market rates. They should be used as a starting point for budgeting. Actual costs vary based on individual case circumstances, attorney reputation, and local market conditions. We recommend getting quotes from 2-3 attorneys for the most accurate pricing.',
  },
]

export default function CostEstimatorPage() {
  const breadcrumbItems = [
    { label: 'Tools', href: '/tools/cost-estimator' },
    { label: 'Legal Cost Estimator' },
  ]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools/cost-estimator' },
    { name: 'Legal Cost Estimator', url: '/tools/cost-estimator' },
  ])

  const faqSchema = getFAQSchema(
    costEstimatorFAQs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    }))
  )

  // WebApplication schema for the tool itself
  const toolSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Legal Cost Estimator',
    url: PAGE_URL,
    description: PAGE_DESCRIPTION,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: 'US Attorneys',
      url: SITE_URL,
    },
    featureList: [
      'Cost estimates for 75+ legal practice areas',
      'State-specific pricing with regional adjustments',
      'Fee structure comparison (hourly, flat fee, contingency, retainer)',
      'Case complexity calculator',
      'State-by-state cost comparison charts',
    ],
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema, toolSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {/* Header section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <Breadcrumb
              items={breadcrumbItems}
              className="mb-4 text-blue-200 [&_a]:text-blue-200 [&_a:hover]:text-white [&_svg]:text-blue-300 [&>ol>li:last-child_span]:text-white"
            />
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading mb-3">
              How Much Does a Lawyer Cost?
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              Get a personalized cost estimate in 3 steps. Select your practice area, state, and case
              complexity to see expected attorney fees, fee structures, and state comparisons.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-blue-200">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                75+ practice areas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                All 50 states + DC
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Free, no signup required
              </span>
            </div>
          </div>
        </div>

        {/* Tool section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <CostEstimatorClient />
        </div>

        {/* SEO content section */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading mb-6 text-center">
              Understanding Legal Costs in the United States
            </h2>
            <div className="prose prose-blue dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
              <p>
                Legal fees vary dramatically based on practice area, geographic location, attorney experience,
                and case complexity. The national average hourly rate for attorneys in 2025 is approximately
                $275/hour, but ranges from $150/hour in rural areas to $700+/hour in major metropolitan markets.
              </p>
              <p>
                Understanding the different fee structures is critical when budgeting for legal services.{' '}
                <strong>Hourly billing</strong> is the most common arrangement, used in about 60% of legal matters.{' '}
                <strong>Flat fees</strong> provide cost certainty for routine work like wills, bankruptcies, or
                business formation. <strong>Contingency fees</strong> (25-40% of recovery) are standard for
                personal injury and employment discrimination cases, meaning you pay nothing upfront.{' '}
                <strong>Retainers</strong> are advance deposits against future hourly billing.
              </p>
              <p>
                Our cost estimator uses data from public legal industry surveys, state bar fee schedules,
                and market research to provide realistic estimates. For the most accurate pricing, we recommend
                requesting quotes from 2-3 attorneys in your area through our free consultation matching service.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading mb-8 text-center">
              Frequently Asked Questions About Legal Costs
            </h2>
            <div className="space-y-6">
              {costEstimatorFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
