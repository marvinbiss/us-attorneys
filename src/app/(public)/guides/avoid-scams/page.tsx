import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { REVALIDATE } from '@/lib/cache'
import { ShieldAlert, ShieldCheck, HelpCircle, Search } from 'lucide-react'

const PAGE_URL = `${SITE_URL}/guides/avoid-scams`

export const revalidate = REVALIDATE.staticPages

export const metadata: Metadata = {
  title: 'Legal Scams: How to Spot and Protect Yourself',
  description:
    'The most common legal scams: fake attorneys, inflated fees, unlicensed practitioners. Warning signs, verification tips, and recourse if you are a victim.',
  alternates: { canonical: PAGE_URL },
  robots: { index: false },
  openGraph: {
    title: 'Legal Scams: How to Spot and Protect Yourself',
    description:
      'Complete guide to identifying and avoiding legal scams. Warning signs, verification, and recourse.',
    url: PAGE_URL,
    type: 'article',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal Scams: How to Spot and Protect Yourself',
    description:
      'Complete guide to identifying and avoiding legal scams. Warning signs, verification, and recourse.',
  },
}

const faqItems: { question: string; answer: string }[] = []

const breadcrumbItems = [{ label: 'Guides', href: '/guides' }, { label: 'Avoid Scams' }]

export default function AvoidScamsPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: `${SITE_URL}/guides`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Avoid Scams',
        item: PAGE_URL,
      },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
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
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-red-50/60 to-white">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-12 text-center md:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800">
            <ShieldAlert className="h-4 w-4" />
            Protection Guide
          </div>
          <h1 className="mb-6 font-heading text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl lg:text-5xl">
            Legal Scams: How to Spot and Protect Yourself
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
            Coming soon.
          </p>
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-10">
            <h2 className="mb-8 flex items-center gap-3 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
              <HelpCircle className="h-8 w-8 text-blue-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details
                  key={index}
                  className="group rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between p-6 font-semibold text-gray-900 transition-colors hover:text-blue-700">
                    {item.question}
                    <span className="ml-4 text-2xl text-gray-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="border-t border-gray-50 px-6 pb-6 pt-4 leading-relaxed text-gray-600">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white md:p-12">
            <h2 className="mb-4 font-heading text-2xl font-bold md:text-3xl">
              Find a verified attorney, avoid bad surprises
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
              All attorneys in our directory are listed with verified credentials. Check their
              profile with full transparency.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-blue-700 transition-colors hover:bg-blue-50"
              >
                <ShieldCheck className="h-5 w-5" />
                Verify an attorney
              </Link>
              <Link
                href="/attorneys"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400 bg-blue-500 px-8 py-3.5 font-bold text-white transition-colors hover:bg-blue-400"
              >
                <Search className="h-5 w-5" />
                Browse the directory
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
