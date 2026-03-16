import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Search,
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/guides/eviter-arnaques-artisan`

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Legal Scams: How to Spot and Protect Yourself",
  description:
    "The most common legal scams: fake attorneys, inflated fees, unlicensed practitioners. Warning signs, verification tips, and recourse if you are a victim.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Legal Scams: How to Spot and Protect Yourself",
    description:
      "Complete guide to identifying and avoiding legal scams. Warning signs, verification, and recourse.",
    url: PAGE_URL,
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal Scams: How to Spot and Protect Yourself",
    description:
      "Complete guide to identifying and avoiding legal scams. Warning signs, verification, and recourse.",
  },
}

const faqItems: { question: string; answer: string }[] = []

const breadcrumbItems = [
  { label: "Guides", href: "/guides" },
  { label: "Avoid Scams" },
]

export default function AvoidScamsPage() {
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
        name: "Avoid Scams",
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

      <div className="min-h-screen bg-gradient-to-b from-red-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <ShieldAlert className="w-4 h-4" />
            Protection Guide
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            Legal Scams: How to Spot and Protect Yourself
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Coming soon.
          </p>
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-blue-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 group"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-blue-700 transition-colors">
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              Find a verified attorney, avoid bad surprises
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              All attorneys in our directory are listed with verified credentials. Check their profile with full transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/verify-attorney"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
                Verify an attorney
              </Link>
              <Link
                href="/attorneys"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                <Search className="w-5 h-5" />
                Browse the directory
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
