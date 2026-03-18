"use client"

import { useState, useCallback, FormEvent } from "react"
import Link from "next/link"
import {
  Shield,
  Search,
  Loader2,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Clock,
  Flag,
  CheckCircle2,
} from "lucide-react"
import { STATE_BAR_URLS } from "@/lib/verification/bar-verify"

// ─── Types ──────────────────────────────────────────────────────────

interface FaqItem {
  question: string
  answer: string
}

interface VerifierClientProps {
  faqItems: FaqItem[]
}

interface VerificationResult {
  verified: boolean
  status: string
  attorney_name?: string
  admission_date?: string
  practice_status?: string
  source?: string
  automated?: boolean
}

// ─── State codes for dropdown ───────────────────────────────────────

const STATE_OPTIONS = Object.entries(STATE_BAR_URLS)
  .map(([code, { name }]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

// ─── Status display config ──────────────────────────────────────────

function getStatusDisplay(status: string) {
  switch (status) {
    case 'verified':
      return {
        icon: ShieldCheck,
        label: 'Verified — Active License',
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        textClass: 'text-emerald-800 dark:text-emerald-200',
      }
    case 'suspended':
      return {
        icon: ShieldAlert,
        label: 'License Suspended',
        bgClass: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
        iconClass: 'text-orange-600 dark:text-orange-400',
        textClass: 'text-orange-800 dark:text-orange-200',
      }
    case 'disbarred':
      return {
        icon: ShieldAlert,
        label: 'Disbarred',
        bgClass: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
        iconClass: 'text-red-600 dark:text-red-400',
        textClass: 'text-red-800 dark:text-red-200',
      }
    case 'not_found':
      return {
        icon: ShieldQuestion,
        label: 'Not Found',
        bgClass: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        iconClass: 'text-gray-500 dark:text-gray-400',
        textClass: 'text-gray-700 dark:text-gray-300',
      }
    case 'manual_review':
      return {
        icon: Clock,
        label: 'Manual Review Required',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        iconClass: 'text-amber-600 dark:text-amber-400',
        textClass: 'text-amber-800 dark:text-amber-200',
      }
    default:
      return {
        icon: ShieldQuestion,
        label: 'Unknown Status',
        bgClass: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        iconClass: 'text-gray-500 dark:text-gray-400',
        textClass: 'text-gray-700 dark:text-gray-300',
      }
  }
}

// ─── Component ──────────────────────────────────────────────────────

export default function VerifierClient({ faqItems }: VerifierClientProps) {
  const [barNumber, setBarNumber] = useState("")
  const [state, setState] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)

  const selectedStateInfo = state ? STATE_BAR_URLS[state] : undefined

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    if (!barNumber.trim() || !state) return

    setLoading(true)
    setResult(null)
    setError(null)
    setShowReportForm(false)
    setReportSubmitted(false)

    try {
      const response = await fetch('/api/verification/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_number: barNumber.trim(),
          state_code: state,
        }),
      })

      if (response.status === 429) {
        const data = await response.json()
        setError(data.error || 'Rate limit exceeded. Please try again later.')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Verification request failed. Please try again.')
        return
      }

      const data = await response.json()
      if (data.success && data.verification) {
        setResult(data.verification)
      } else {
        setError('Unexpected response from verification service.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [barNumber, state])

  const handleReport = useCallback(() => {
    // In a real implementation, this would submit to an API
    setReportSubmitted(true)
    setShowReportForm(false)
  }, [])

  return (
    <div>
      {/* ─── Hero Section ──────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 dark:from-gray-900 dark:via-gray-950 dark:to-black text-white py-16 sm:py-20 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/10">
            <Shield className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-200">
              Free attorney verification
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Verify an Attorney&#39;s License
          </h1>
          <p className="text-gray-300 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Enter a bar number and state to verify that an attorney is
            licensed and in good standing with the state bar.
          </p>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto" role="search" aria-label="Attorney verification search">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={state}
                  onChange={(e) => { setState(e.target.value); setResult(null); setError(null) }}
                  className="px-4 py-4 rounded-xl text-gray-900 dark:text-gray-100 text-base focus:outline-none focus:ring-4 focus:ring-emerald-400/40 shadow-lg bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 min-w-[160px]"
                  aria-label="State"
                  required
                >
                  <option value="">Select state</option>
                  {STATE_OPTIONS.map((s) => (
                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                  <input
                    type="text"
                    value={barNumber}
                    onChange={(e) => { setBarNumber(e.target.value); setResult(null); setError(null) }}
                    placeholder="Enter bar number"
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 dark:text-gray-100 text-base placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/40 shadow-lg bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700"
                    autoComplete="off"
                    aria-label="Bar number"
                    required
                    maxLength={50}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !barNumber.trim() || !state}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 text-base focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" aria-hidden="true" />
                    Verify License
                  </>
                )}
              </button>
            </div>
          </form>

          {/* State bar direct link */}
          {selectedStateInfo && (
            <p className="mt-5 text-gray-400 text-sm flex items-center justify-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              Or verify directly on the{' '}
              <a
                href={selectedStateInfo.lookupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
              >
                {selectedStateInfo.name} State Bar website
              </a>
            </p>
          )}
        </div>
      </section>

      {/* ─── Results Section ────────────────────────────────── */}
      {(result || error) && (
        <section className="py-10 bg-white dark:bg-gray-950" aria-live="polite">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            {error ? (
              <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Verification Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            ) : result ? (
              <VerificationResultCard
                result={result}
                barNumber={barNumber}
                stateCode={state}
                stateName={selectedStateInfo?.name || state}
                stateBarUrl={selectedStateInfo?.lookupUrl}
                showReportForm={showReportForm}
                reportSubmitted={reportSubmitted}
                onReport={() => setShowReportForm(true)}
                onSubmitReport={handleReport}
                onCancelReport={() => setShowReportForm(false)}
              />
            ) : null}
          </div>
        </section>
      )}

      {/* ─── How it works ─────────────────────────────────── */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
            How Attorney Verification Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: '1. Enter Bar Details',
                description: 'Provide the attorney\'s bar number and the state where they are admitted.',
              },
              {
                icon: ShieldCheck,
                title: '2. We Check Records',
                description: 'We cross-reference against official state bar records and our database of 360,000+ attorneys.',
              },
              {
                icon: CheckCircle2,
                title: '3. Get Results',
                description: 'See the verification status, admission date, and a direct link to the state bar for independent confirmation.',
              },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800">
                  <step.icon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─────────────────────────────────── */}
      <section className="py-12 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/attorneys"
              className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all group"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Find verified attorneys
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Browse by practice area & location
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" aria-hidden="true" />
            </Link>
            <Link
              href="/quotes"
              className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all group"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Request a free consultation
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Compare offers from top attorneys
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ───────────────────────────────────── */}
      {faqItems.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaq(openFaq === index ? null : index)
                    }
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400"
                    aria-expanded={openFaq === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">
                      {item.question}
                    </span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div id={`faq-answer-${index}`} className="px-5 pb-5">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
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
      <section className="py-16 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-gray-900 dark:to-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
            Find a Verified Attorney on US Attorneys
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Over 360,000 attorneys verified through state bar association
            records across the United States.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/attorneys"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              Find an Attorney
            </Link>
            <Link
              href="/quotes"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg"
            >
              <FileText className="w-5 h-5" aria-hidden="true" />
              Free Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Verification Result Card ────────────────────────────────────────

function VerificationResultCard({
  result,
  barNumber,
  stateCode,
  stateName,
  stateBarUrl,
  showReportForm,
  reportSubmitted,
  onReport,
  onSubmitReport,
  onCancelReport,
}: {
  result: VerificationResult
  barNumber: string
  stateCode: string
  stateName: string
  stateBarUrl?: string
  showReportForm: boolean
  reportSubmitted: boolean
  onReport: () => void
  onSubmitReport: () => void
  onCancelReport: () => void
}) {
  const display = getStatusDisplay(result.status)
  const Icon = display.icon

  return (
    <div className={`rounded-2xl border ${display.bgClass} overflow-hidden`}>
      {/* Status header */}
      <div className="p-6 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          result.status === 'verified'
            ? 'bg-emerald-100 dark:bg-emerald-900/50'
            : result.status === 'suspended' || result.status === 'disbarred'
              ? 'bg-red-100 dark:bg-red-900/50'
              : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <Icon className={`w-6 h-6 ${display.iconClass}`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold ${display.textClass}`}>
            {display.label}
          </h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Bar Number <span className="font-mono font-semibold">{barNumber}</span> in {stateName} ({stateCode})
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 px-6 py-4 bg-white/60 dark:bg-gray-900/40">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {result.attorney_name && (
            <div>
              <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                Attorney Name
              </dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
                {result.attorney_name}
              </dd>
            </div>
          )}
          {result.practice_status && (
            <div>
              <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                Practice Status
              </dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100 capitalize">
                {result.practice_status}
              </dd>
            </div>
          )}
          {result.admission_date && (
            <div>
              <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                Admission Date
              </dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
                {formatAdmissionDate(result.admission_date)}
              </dd>
            </div>
          )}
          {result.source && (
            <div>
              <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                Data Source
              </dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
                {result.automated ? 'State Bar (Live)' : 'US Attorneys Database'}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Actions footer */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 px-6 py-4 bg-white/30 dark:bg-gray-900/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          {stateBarUrl && (
            <a
              href={stateBarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Verify on {stateName} State Bar
            </a>
          )}
        </div>
        <div>
          {reportSubmitted ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Report submitted
            </span>
          ) : showReportForm ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSubmitReport}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
              >
                Confirm report
              </button>
              <button
                type="button"
                onClick={onCancelReport}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onReport}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              Report an issue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatAdmissionDate(dateStr: string): string {
  try {
    // Handle year-only dates like "2005-01-01"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    // If the date is Jan 1, it's likely a year-only admission
    if (date.getMonth() === 0 && date.getDate() === 1) {
      return String(date.getFullYear())
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
