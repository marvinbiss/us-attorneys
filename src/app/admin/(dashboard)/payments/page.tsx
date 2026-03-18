import { CreditCard, Clock } from 'lucide-react'

export default function AdminPaymentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-500 mt-1">Revenue, subscriptions, refunds</p>
          </div>
        </div>

        {/* Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-amber-50 rounded-full">
              <CreditCard className="w-12 h-12 text-amber-400" />
            </div>
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-lg">
              <Clock className="w-5 h-5" />
              Coming soon
            </div>
            <p className="text-gray-500 max-w-md">
              Stripe integration is being configured.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
