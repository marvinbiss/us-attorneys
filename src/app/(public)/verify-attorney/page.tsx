import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import VerifierClient from './VerifierClient'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.staticPages

export const metadata: Metadata = {
  title: "Verify an Attorney's License | US Attorneys",
  description:
    'Free attorney bar license verification. Search by bar number and state to check if a lawyer is licensed and in good standing. Cross-referenced with official state bar records.',
  alternates: { canonical: `${SITE_URL}/verify-attorney` },
  openGraph: {
    title: "Verify an Attorney's License | US Attorneys",
    description:
      'Check any attorney\'s bar license status for free. Verified against official state bar records across all 50 states.',
    url: `${SITE_URL}/verify-attorney`,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

const FAQ_ITEMS = [
  {
    question: 'How does attorney verification work?',
    answer:
      'We check the attorney\'s bar number against official state bar records. For the largest states (NY, CA, TX, FL, IL, PA, NJ, OH, GA, MA), this is done automatically via state bar APIs. For other states, we cross-reference our database of bar admissions.',
  },
  {
    question: 'Is this verification service free?',
    answer:
      'Yes, attorney verification is completely free. You can perform up to 10 checks per hour. For bulk verification needs, please contact us.',
  },
  {
    question: 'What does "Verified" mean?',
    answer:
      'A "Verified" status means the attorney holds an active bar license in the specified state, confirmed through official state bar records. This does not constitute a legal opinion or endorsement.',
  },
  {
    question: 'What if the verification shows "Could not verify"?',
    answer:
      'This may happen if the bar number is incorrect, the state bar website is temporarily unavailable, or the attorney is admitted in a state without automated verification. We always provide a direct link to the official state bar website so you can verify independently.',
  },
  {
    question: 'Can I verify attorneys in any state?',
    answer:
      'We support verification across all 50 states plus DC. Automated real-time verification is available for the 10 largest states. For other jurisdictions, we check our bar admissions database and provide a link to the official state bar for manual verification.',
  },
  {
    question: 'How current is the verification data?',
    answer:
      'Automated verification checks state bar records in real time. Database results are updated periodically. We always recommend verifying directly with the state bar for the most up-to-date information, especially for time-sensitive matters.',
  },
]

export default function VerifyAttorneyPage() {
  // FAQ structured data for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026'),
        }}
      />
      <VerifierClient faqItems={FAQ_ITEMS} />
    </>
  )
}
