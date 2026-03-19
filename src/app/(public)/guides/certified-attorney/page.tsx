import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { REVALIDATE } from '@/lib/cache'
import { ShieldCheck, Search, FileCheck, HelpCircle, ArrowRight } from 'lucide-react'

const PAGE_URL = `${SITE_URL}/guides/certified-attorney`

export const revalidate = REVALIDATE.staticPages

export const metadata: Metadata = {
  title: 'Certified Attorney: Find a Verified Professional',
  description:
    'Everything you need to know about attorney certifications: how to verify credentials, bar admissions, specializations, and how to find a qualified attorney.',
  alternates: { canonical: PAGE_URL },
  robots: { index: false },
  openGraph: {
    title: 'Certified Attorney: Find a Verified Professional',
    description:
      'Complete guide to attorney certifications: verification, credentials, and finding qualified professionals.',
    url: PAGE_URL,
    type: 'article',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Certified Attorney: Find a Verified Professional',
    description:
      'Complete guide to attorney certifications: verification, credentials, and finding qualified professionals.',
  },
}

const qualifications: {
  name: string
  icon: typeof ShieldCheck
  description: string
  travaux: string
}[] = []

const services: { label: string; href: string; icon: typeof ShieldCheck }[] = []

const faqItems: { question: string; answer: string }[] = []

const breadcrumbItems = [{ label: 'Guides', href: '/guides' }, { label: 'Certified Attorney' }]

export default function AttorneyVerifiedPage() {
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
        name: 'Certified Attorney',
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

      <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-12 text-center md:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
            <ShieldCheck className="h-4 w-4" />
            Certification Guide
          </div>
          <h1 className="mb-6 font-heading text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl lg:text-5xl">
            Certified Attorney: How to Verify and Find a Qualified Professional
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
            Coming soon.
          </p>
        </section>

        {/* Qualifications */}
        {qualifications.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-10">
            <h2 className="mb-8 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
              Attorney Certifications
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {qualifications.map((q) => {
                const Icon = q.icon
                return (
                  <div
                    key={q.name}
                    className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <Icon className="h-5 w-5 text-green-700" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{q.name}</h3>
                    </div>
                    <p className="mb-3 text-gray-600">{q.description}</p>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Areas covered:</span> {q.travaux}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Find by practice area */}
        {services.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-10">
            <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
              Find a certified attorney by practice area
            </h2>
            <p className="mb-8 text-lg text-gray-600">
              Browse our directory to find a certified professional in your area of need.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {services.map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 transition-colors group-hover:bg-green-100">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="font-semibold text-gray-900 transition-colors group-hover:text-green-700">
                      {s.label}
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4 text-gray-400 transition-colors group-hover:text-green-600" />
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
              <HelpCircle className="h-8 w-8 text-green-600" />
              Frequently Asked Questions about Certified Attorneys
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details
                  key={index}
                  className="group rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between p-6 font-semibold text-gray-900 transition-colors hover:text-green-700">
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
          <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center text-white md:p-12">
            <h2 className="mb-4 font-heading text-2xl font-bold md:text-3xl">
              Need a certified attorney for your case?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-green-100">
              Find certified professionals near you and request a free consultation for your legal
              needs.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-green-700 transition-colors hover:bg-green-50"
              >
                <Search className="h-5 w-5" />
                Verify an attorney
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-400 bg-green-500 px-8 py-3.5 font-bold text-white transition-colors hover:bg-green-400"
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
