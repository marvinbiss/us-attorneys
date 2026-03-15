import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { QuickSiteLinks } from '@/components/InternalLinks'

export default function FacturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            items={[
              { label: 'Client Dashboard', href: '/client-dashboard' },
              { label: 'Invoices & Payments' }
            ]}
            className="mb-4"
          />
          <div className="flex items-center gap-4">
            <Link href="/client-dashboard/mes-demandes" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoices & Payments</h1>
              <p className="text-gray-600">Your transaction history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <FileText className="w-14 h-14 text-gray-300 mx-auto mb-5" />
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Feature Under Development
          </h2>
          <p className="text-gray-600">
            Invoices will be available soon.
          </p>
        </div>

        <QuickSiteLinks className="mt-8" />
      </div>
    </div>
  )
}
