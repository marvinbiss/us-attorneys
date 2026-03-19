import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export function QuoteFormConfirmation() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-xl md:p-12">
      <div className="mx-auto mb-6 flex h-20 w-20 animate-[bounce_0.6s_ease-in-out] items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="mb-4 font-heading text-2xl font-bold text-slate-900 md:text-3xl">
        Your request has been submitted!
      </h3>

      {/* Timeline next steps */}
      <div className="mx-auto mb-8 mt-6 max-w-sm space-y-4 text-left">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-bold text-blue-600">1</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Reviewing your request</p>
            <p className="text-xs text-slate-500">
              We are finding the best attorneys for your case
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-bold text-blue-600">2</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Receive consultations within 24h</p>
            <p className="text-xs text-slate-500">
              Up to 3 qualified attorneys will contact you by email or phone
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-bold text-blue-600">3</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Compare and choose</p>
            <p className="text-xs text-slate-500">
              Compare consultations, read reviews, and choose freely
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
        <Link
          href="/practice-areas"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Find more attorneys
        </Link>
        <Link
          href="/"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 font-semibold text-slate-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
