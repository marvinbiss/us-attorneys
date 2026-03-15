"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import {
  Shield,
  Search,
  Loader2,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface FaqItem {
  question: string
  answer: string
}

interface VerifierClientProps {
  faqItems: FaqItem[]
}

// ─── Component ──────────────────────────────────────────────────────

export default function VerifierClient({ faqItems }: VerifierClientProps) {
  const [barNumber, setBarNumber] = useState("")
  const [state, setState] = useState("")
  const [loading, setLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!barNumber.trim() || !state) return
    setLoading(true)
    // TODO: integrate with state bar association APIs
    setTimeout(() => setLoading(false), 1500)
  }

  const states = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
    "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
  ]

  return (
    <div>
      {/* ─── Hero Section ──────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">
              Free attorney verification
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Verify an attorney in seconds
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
            Enter a bar number and state to verify that an attorney is
            licensed and in good standing.
          </p>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="px-4 py-4 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg bg-white"
                  aria-label="State"
                >
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    placeholder="Enter bar number"
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                    autoComplete="off"
                    aria-label="Bar number"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !barNumber.trim() || !state}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Verify
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-blue-200 text-sm">
            This tool will check against state bar association records.
            Feature coming soon.
          </p>
        </div>
      </section>

      {/* ─── CTA Section ─────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/attorneys"
              className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  Find verified attorneys
                </p>
                <p className="text-sm text-gray-500">
                  Near you
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </Link>
            <Link
              href="/quotes"
              className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  Request a free consultation
                </p>
                <p className="text-sm text-gray-500">
                  Compare offers
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ───────────────────────────────────── */}
      {faqItems.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently asked questions
            </h2>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setOpenFaq(openFaq === index ? null : index)
                    }
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={openFaq === index}
                  >
                    <span className="font-medium text-gray-900 pr-4">
                      {item.question}
                    </span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Final CTA ─────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
            Find a verified attorney on US Attorneys
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Thousands of attorneys verified through state bar association
            records across the United States.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/attorneys"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              <Search className="w-5 h-5" />
              Find an attorney
            </Link>
            <Link
              href="/quotes"
              className="inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-green-600 transition-colors shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Free consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
