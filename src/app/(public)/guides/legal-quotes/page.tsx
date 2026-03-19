import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { REVALIDATE } from '@/lib/cache'
import { FileText, Search, FileCheck, HelpCircle } from 'lucide-react'

const PAGE_URL = `${SITE_URL}/guides/quotes-travaux`

export const revalidate = REVALIDATE.serviceLocation

export const metadata: Metadata = {
  title: 'Legal Quotes: A Complete Guide to Comparing Fees',
  description:
    'How to obtain and compare legal fee quotes: required disclosures, how many quotes to request, negotiation tips, and how to choose the right attorney.',
  alternates: { canonical: PAGE_URL },
  robots: { index: false },
  openGraph: {
    title: 'Legal Quotes: A Complete Guide to Comparing Fees',
    description: 'Complete guide to obtaining, comparing and negotiating legal fee quotes.',
    url: PAGE_URL,
    type: 'article',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal Quotes: A Complete Guide to Comparing Fees',
    description: 'Complete guide to obtaining, comparing and negotiating legal fee quotes.',
  },
}

const requiredDisclosures: { name: string; icon: typeof FileText; description: string }[] = []

const services: { label: string; href: string; icon: typeof FileText }[] = []

const faqItems: { question: string; answer: string }[] = []

const breadcrumbItems = [{ label: 'Guides', href: '/guides' }, { label: 'Legal Quotes' }]

export default function DevisTravauxPage() {
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
        name: 'Legal Quotes',
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

      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-12 text-center md:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
            <FileText className="h-4 w-4" />
            Legal Quotes Guide
          </div>
          <h1 className="mb-6 font-heading text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl lg:text-5xl">
            Legal Quotes: A Complete Guide
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
            Coming soon.
          </p>
        </section>

        {/* Required disclosures */}
        {requiredDisclosures.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-10">
            <h2 className="mb-8 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
              Required Disclosures
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {requiredDisclosures.map((m) => {
                const Icon = m.icon
                return (
                  <div
                    key={m.name}
                    className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                        <Icon className="h-5 w-5 text-amber-700" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                    </div>
                    <p className="text-gray-600">{m.description}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Related services */}
        {services.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-10">
            <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
              Request quotes by practice area
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {services.map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 transition-colors group-hover:bg-amber-100">
                      <Icon className="h-5 w-5 text-amber-600" />
                    </div>
                    <span className="font-semibold text-gray-900 transition-colors group-hover:text-amber-700">
                      {s.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-10">
            <h2 className="mb-8 flex items-center gap-3 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
              <HelpCircle className="h-8 w-8 text-amber-600" />
              Frequently Asked Questions about Legal Quotes
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details
                  key={index}
                  className="group rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between p-6 font-semibold text-gray-900 transition-colors hover:text-amber-700">
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
          <div className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 p-8 text-center text-white md:p-12">
            <h2 className="mb-4 font-heading text-2xl font-bold md:text-3xl">
              Ready to request quotes?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-amber-100">
              Find qualified attorneys near you and compare consultations for free.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-amber-700 transition-colors hover:bg-amber-50"
              >
                <Search className="h-5 w-5" />
                Find an attorney
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400 bg-amber-500 px-8 py-3.5 font-bold text-white transition-colors hover:bg-amber-400"
              >
                <FileCheck className="h-5 w-5" />
                Request a free consultation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
