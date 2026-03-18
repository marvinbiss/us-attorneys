import { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import DeadlineTrackerClient from './DeadlineTrackerClient'

export const revalidate = REVALIDATE.staticPages

// ─── Metadata ───────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Legal Deadline Calculator — Statute of Limitations by State | US Attorneys',
  description:
    'Free legal deadline calculator. Check the statute of limitations for your case type in any US state. Personal injury, medical malpractice, employment law, and more. Get instant results with days remaining and urgency alerts.',
  alternates: {
    canonical: `${SITE_URL}/tools/deadline-tracker`,
  },
  openGraph: {
    title: 'Legal Deadline Calculator — Statute of Limitations by State',
    description:
      'Free tool: calculate your legal filing deadline based on case type, state, and incident date. Know exactly how much time you have left.',
    url: `${SITE_URL}/tools/deadline-tracker`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'US Attorneys Legal Deadline Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal Deadline Calculator — Free SOL Checker',
    description:
      'Calculate your legal filing deadline for any case type in any US state. Free, instant results.',
    images: [`${SITE_URL}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
}

// ─── FAQ Data (for JSON-LD + rendered section) ──────────────────────────────

const faqs = [
  {
    question: 'What is a statute of limitations?',
    answer:
      'A statute of limitations is the maximum time after an event within which legal proceedings may be initiated. Once the statute of limitations expires, a claim can no longer be filed regardless of its merits. These deadlines are set by state law and vary significantly depending on the type of legal claim and the jurisdiction.',
  },
  {
    question: 'Does the statute of limitations vary by state?',
    answer:
      'Yes. Each US state sets its own statute of limitations for different types of legal claims. For example, the deadline for filing a personal injury lawsuit ranges from 1 year (in Kentucky, Louisiana, and Tennessee) to 6 years (in Maine and North Dakota). This is why it is critical to check the specific deadline for your state and case type.',
  },
  {
    question: 'What is the discovery rule?',
    answer:
      'The discovery rule is a legal doctrine that delays the start of the statute of limitations until the plaintiff discovers (or reasonably should have discovered) the injury or harm. This is particularly common in medical malpractice cases where the injury may not be immediately apparent. Not all states or case types recognize this rule.',
  },
  {
    question: 'Can the statute of limitations be extended?',
    answer:
      'In some cases, yes. Tolling provisions may pause or extend the deadline for reasons including: the plaintiff being a minor, the defendant leaving the state, mental incapacity, active military service, or fraudulent concealment of the cause of action. An attorney can help determine whether any tolling provisions apply to your situation.',
  },
  {
    question: 'What happens if I miss the statute of limitations?',
    answer:
      'If you miss the statute of limitations, you will almost certainly lose the right to file a lawsuit. The court will dismiss your case, regardless of how strong your claim may be. There are very limited exceptions, such as fraudulent concealment by the defendant. This is why it is critical to act before the deadline.',
  },
  {
    question: 'Should I rely on this calculator for my legal deadline?',
    answer:
      'This tool provides general information only and should not be used as a substitute for professional legal advice. While we source our data from official state statutes and reputable legal databases, many factors can affect your specific deadline including tolling provisions, administrative requirements, and recent legislative changes. Always consult a qualified attorney in your state before relying on any deadline.',
  },
  {
    question: 'What legal issues does this calculator cover?',
    answer:
      'Our calculator covers major categories including personal injury, medical malpractice, wrongful death, product liability, employment law, workers compensation, family law, business and contract disputes, fraud, real estate, construction, and consumer protection. Each category maps to the correct statute of limitations for all 50 states plus Washington DC.',
  },
]

// ─── Page Component ─────────────────────────────────────────────────────────

export default function DeadlineTrackerPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools/diagnostic' },
    { name: 'Deadline Calculator', url: '/tools/deadline-tracker' },
  ])

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Calculate Your Legal Filing Deadline',
    description:
      'Use this free tool to determine the statute of limitations for your legal case in any US state.',
    totalTime: 'PT2M',
    tool: {
      '@type': 'HowToTool',
      name: 'US Attorneys Legal Deadline Calculator',
    },
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Select your legal issue',
        text: 'Choose the type of legal issue from the list (e.g., personal injury, medical malpractice, employment law).',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Select your state',
        text: 'Choose the US state where the incident occurred.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Enter the incident date',
        text: 'Enter the date the incident or injury occurred.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'View your deadline',
        text: 'See your filing deadline, days remaining, urgency level, exceptions, and discovery rule information.',
      },
    ],
  }

  const faqSchema = getFAQSchema(faqs)

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Legal Deadline Calculator',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Free tool to calculate statute of limitations deadlines for legal cases across all 50 US states.',
    url: `${SITE_URL}/tools/deadline-tracker`,
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, howToSchema, faqSchema, softwareSchema].filter(Boolean)} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb
              items={[
                { label: 'Tools', href: '/tools/diagnostic' },
                { label: 'Deadline Calculator' },
              ]}
            />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-600 to-blue-800 dark:from-blue-900 dark:to-gray-950 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm text-blue-100 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Free tool — no account required
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-heading">
              Legal Deadline Calculator
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Calculate the statute of limitations for your legal case. Know exactly how much time
              you have to file — before it is too late.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-blue-200">
              <span>50 states + DC</span>
              <span className="hidden sm:inline">|</span>
              <span>25+ case types</span>
              <span className="hidden sm:inline">|</span>
              <span>Instant results</span>
              <span className="hidden sm:inline">|</span>
              <span>Free reminders</span>
            </div>
          </div>
        </div>

        {/* Main Tool */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
          <DeadlineTrackerClient />
        </div>

        {/* How It Works section */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center font-heading">
              How the Deadline Calculator Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Select Your Legal Issue',
                  description:
                    'Choose from 25+ categories including personal injury, medical malpractice, employment disputes, contract issues, and more.',
                },
                {
                  step: '2',
                  title: 'Choose Your State',
                  description:
                    'Select the state where the incident occurred. Every state has different statutes of limitations, so the location matters.',
                },
                {
                  step: '3',
                  title: 'Get Your Deadline',
                  description:
                    'Instantly see your filing deadline, days remaining, urgency level, applicable exceptions, and whether the discovery rule applies.',
                },
              ].map(item => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Deadlines Matter section */}
        <div className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-heading">
              Why Legal Deadlines Matter
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                Missing a statute of limitations is one of the most devastating mistakes in law. No
                matter how strong your case is — no matter how clear the evidence or how severe the
                harm — if you file even one day late, the court will almost certainly dismiss your
                claim. There are no second chances.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                The complexity is that these deadlines vary dramatically by both <strong>state</strong> and{' '}
                <strong>type of claim</strong>. A personal injury case in Tennessee must be filed
                within 1 year, while the same claim in Maine allows 6 years. Medical malpractice
                deadlines range from 1 year (California, Ohio) to 4+ years (Minnesota). Employment
                discrimination claims under federal law may require EEOC filing within just 180
                days.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Additional factors like the <strong>discovery rule</strong> (when you learned of the
                injury), <strong>tolling provisions</strong> (for minors or incapacitated persons),
                and <strong>government claim requirements</strong> (which can impose even shorter
                deadlines) make calculating the true deadline a nuanced legal question. Our
                calculator provides a reliable starting point, but we always recommend confirming
                with a qualified attorney in your state.
              </p>
            </div>

            {/* Internal links */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tools/diagnostic"
                className="text-sm px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                Free Attorney Diagnostic
              </Link>
              <Link
                href="/practice-areas"
                className="text-sm px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                Browse Practice Areas
              </Link>
              <Link
                href="/states"
                className="text-sm px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                Attorneys by State
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 font-heading">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
