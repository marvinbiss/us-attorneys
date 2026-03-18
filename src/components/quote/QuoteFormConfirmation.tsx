import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export function QuoteFormConfirmation() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_0.6s_ease-in-out]">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h3 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-4">
        Your request has been submitted!
      </h3>

      {/* Timeline next steps */}
      <div className="text-left max-w-sm mx-auto mt-6 mb-8 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sm font-bold text-blue-600">1</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Reviewing your request</p>
            <p className="text-xs text-slate-500">We are finding the best attorneys for your case</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sm font-bold text-blue-600">2</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Receive consultations within 24h</p>
            <p className="text-xs text-slate-500">Up to 3 qualified attorneys will contact you by email or phone</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sm font-bold text-blue-600">3</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Compare and choose</p>
            <p className="text-xs text-slate-500">Compare consultations, read reviews, and choose freely</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Link
          href="/services"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Find more attorneys
        </Link>
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
