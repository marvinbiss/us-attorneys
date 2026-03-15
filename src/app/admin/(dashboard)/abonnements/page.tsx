'use client'

import { CreditCard } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-500 mt-1">Track user subscription plans</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <CreditCard className="w-10 h-10 text-gray-400" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Subscription feature unavailable
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Subscription management is not yet configured for this platform.
            Please check back later or contact the technical team.
          </p>
        </div>
      </div>
    </div>
  )
}
