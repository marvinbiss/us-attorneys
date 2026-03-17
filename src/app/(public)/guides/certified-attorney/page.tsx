import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ShieldCheck,
  Search,
  FileCheck,
  HelpCircle,
  ArrowRight,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/certified-attorney`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Certified Attorney: Find a Verified Professional",
  description:
    "Everything you need to know about attorney certifications: how to verify credentials, bar admissions, specializations, and how to find a qualified attorney.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Certified Attorney: Find a Verified Professional",
    description:
      "Complete guide to attorney certifications: verification, credentials, and finding qualified professionals.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Certified Attorney: Find a Verified Professional",
    description:
      "Complete guide to attorney certifications: verification, credentials, and finding qualified professionals.",
  },
}

const qualifications: { name: string; icon: typeof ShieldCheck; description: string; travaux: string }[] = []

const services: { label: string; href: string; icon: typeof ShieldCheck }[] = []

const faqItems: { question: string; answer: string }[] = []

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Certified Attorney" },
]

export default function AttorneyVerifiedPage() {
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
        name: "Certified Attorney",
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

      <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Certification Guide
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            Certified Attorney: How to Verify and Find a Qualified Professional
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Coming soon.
          </p>
        </section>

        {/* Qualifications */}
        {qualifications.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
              Attorney Certifications
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {qualifications.map((q) => {
                const Icon = q.icon
                return (
                  <div key={q.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-green-700" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{q.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{q.description}</p>
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
          <section className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-heading">
              Find a certified attorney by practice area
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Browse our directory to find a certified professional in your area of need.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((s) => {
                const Icon = s.icon
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                      {s.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
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
              <HelpCircle className="w-8 h-8 text-green-600" />
              Frequently Asked Questions about Certified Attorneys
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 group"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-green-700 transition-colors">
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
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              Need a certified attorney for your case?
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Find certified professionals near you and request a free consultation for your legal needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-8 py-3.5 rounded-xl font-bold hover:bg-green-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                Verify an attorney
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-green-400 transition-colors border border-green-400"
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
