import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import { REVALIDATE } from '@/lib/cache'
import {
  FileText,
  Search,
  FileCheck,
  HelpCircle,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/quotes-travaux`

export const revalidate = REVALIDATE.serviceLocation

export const metadata: Metadata = {
  title: "Legal Quotes: A Complete Guide to Comparing Fees",
  description:
    "How to obtain and compare legal fee quotes: required disclosures, how many quotes to request, negotiation tips, and how to choose the right attorney.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Legal Quotes: A Complete Guide to Comparing Fees",
    description:
      "Complete guide to obtaining, comparing and negotiating legal fee quotes.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal Quotes: A Complete Guide to Comparing Fees",
    description:
      "Complete guide to obtaining, comparing and negotiating legal fee quotes.",
  },
}

const requiredDisclosures: { name: string; icon: typeof FileText; description: string }[] = []

const services: { label: string; href: string; icon: typeof FileText }[] = []

const faqItems: { question: string; answer: string }[] = []

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Legal Quotes" },
]

export default function DevisTravauxPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${SITE_URL}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Legal Quotes",
        item: PAGE_URL,
      },
    ],
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, faqSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Legal Quotes Guide
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            Legal Quotes: A Complete Guide
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Coming soon.
          </p>
        </section>

        {/* Required disclosures */}
        {requiredDisclosures.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
              Required Disclosures
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {requiredDisclosures.map((m) => {
                const Icon = m.icon
                return (
                  <div key={m.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-amber-700" />
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
          <section className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
              Request quotes by practice area
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <Icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
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
          <section className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-amber-600" />
              Frequently Asked Questions about Legal Quotes
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 group"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-amber-700 transition-colors">
                    {item.question}
                    <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform text-2xl">+</span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              Ready to request quotes?
            </h2>
            <p className="text-amber-100 text-lg mb-8 max-w-2xl mx-auto">
              Find qualified attorneys near you and compare consultations for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 bg-white text-amber-700 px-8 py-3.5 rounded-xl font-bold hover:bg-amber-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                Find an attorney
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-400 transition-colors border border-amber-400"
              >
                <FileCheck className="w-5 h-5" />
                Request a free consultation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
