'use client'

import { Fragment } from 'react'
import {
  X,
  Star,
  MapPin,
  Shield,
  Phone,
  CheckCircle,
  XCircle,
  FileText,
  MapPinned,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useCompare } from '@/components/compare/CompareProvider'
import type { CompareProvider } from '@/components/compare/CompareProvider'

interface CompareViewProps {
  onClose: () => void
}

function ProviderAvatar({
  provider,
  index,
}: {
  provider: CompareProvider
  index: number
}) {
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500']
  return (
    <div
      className={clsx(
        'w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md',
        colors[index % colors.length],
      )}
    >
      {provider.name.charAt(0).toUpperCase()}
    </div>
  )
}

function BooleanCell({ value }: { value: boolean | undefined }) {
  if (value) {
    return <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
  }
  return <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
}

function RatingCell({ provider }: { provider: CompareProvider }) {
  if (!provider.rating_average) {
    return <span className="text-gray-400 text-sm">Not yet rated</span>
  }
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
      <span className="font-bold text-gray-900">
        {Number(provider.rating_average).toFixed(1)}
      </span>
      {provider.review_count != null && provider.review_count > 0 && (
        <span className="text-gray-500 text-xs">
          ({provider.review_count} reviews)
        </span>
      )}
    </div>
  )
}

interface CompareRowProps {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  providers: CompareProvider[]
}

function CompareRow({ label, icon, children }: CompareRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] md:grid-cols-[180px_1fr] items-start border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2 py-3 px-4 bg-gray-50 font-medium text-sm text-gray-600 self-stretch">
        {icon}
        {label}
      </div>
      <div className="py-3 px-4">{children}</div>
    </div>
  )
}

function AttorneyGrid({
  providers,
  children,
}: {
  providers: CompareProvider[]
  children: (provider: CompareProvider, index: number) => React.ReactNode
}) {
  return (
    <div
      className={clsx(
        'grid gap-4',
        providers.length === 2 && 'grid-cols-2',
        providers.length === 3 && 'grid-cols-3',
      )}
    >
      {providers.map((p, i) => (
        <div key={p.id} className="text-center text-sm">
          {children(p, i)}
        </div>
      ))}
    </div>
  )
}

export function CompareView({ onClose }: CompareViewProps) {
  const { compareList, removeFromCompare } = useCompare()

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 md:pt-16 overflow-y-auto">
        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2
              id="compare-title"
              className="text-xl font-bold text-gray-900 font-heading"
            >
              Compare attorneys
            </h2>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Provider headers */}
          <div className="p-6 border-b border-gray-100">
            <AttorneyGrid providers={compareList}>
              {(provider, index) => (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <ProviderAvatar provider={provider} index={index} />
                    <button
                      onClick={() => removeFromCompare(provider.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                      aria-label={`Remove ${provider.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {provider.name}
                    </h3>
                    {provider.specialty && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        {provider.specialty}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </AttorneyGrid>
          </div>

          {/* Comparison table */}
          <div className="divide-y divide-gray-100">
            {/* Rating */}
            <CompareRow
              label="Rating"
              icon={<Star className="w-4 h-4 text-amber-500" />}
              providers={compareList}
            >
              <AttorneyGrid providers={compareList}>
                {(provider) => <RatingCell provider={provider} />}
              </AttorneyGrid>
            </CompareRow>

            {/* Location */}
            <CompareRow
              label="City"
              icon={<MapPin className="w-4 h-4 text-gray-400" />}
              providers={compareList}
            >
              <AttorneyGrid providers={compareList}>
                {(provider) => (
                  <span className="text-gray-700">
                    {provider.address_city || '-'}
                    {provider.address_region && (
                      <span className="text-gray-400 text-xs block">
                        {provider.address_region}
                      </span>
                    )}
                  </span>
                )}
              </AttorneyGrid>
            </CompareRow>

            {/* Verified */}
            <CompareRow
              label="Verified"
              icon={<Shield className="w-4 h-4 text-green-500" />}
              providers={compareList}
            >
              <AttorneyGrid providers={compareList}>
                {(provider) => <BooleanCell value={provider.is_verified} />}
              </AttorneyGrid>
            </CompareRow>

            {/* Phone */}
            <CompareRow
              label="Phone"
              icon={<Phone className="w-4 h-4 text-gray-400" />}
              providers={compareList}
            >
              <AttorneyGrid providers={compareList}>
                {(provider) => (
                  <span className="text-gray-700">
                    {provider.phone ? (
                      <a
                        href={`tel:${provider.phone.replace(/\s/g, '')}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {provider.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </span>
                )}
              </AttorneyGrid>
            </CompareRow>

            {/* Bar Number */}
            <CompareRow
              label="Bar Number"
              icon={<FileText className="w-4 h-4 text-gray-400" />}
              providers={compareList}
            >
              <AttorneyGrid providers={compareList}>
                {(provider) => (
                  <span className="text-gray-700 text-xs font-mono">
                    {provider.siret || '-'}
                  </span>
                )}
              </AttorneyGrid>
            </CompareRow>

            {/* Postal code */}
            <CompareRow
              label="ZIP code"
              icon={<MapPinned className="w-4 h-4 text-gray-400" />}
              providers={compareList}
            >
              <AttorneyGrid providers={compareList}>
                {(provider) => (
                  <span className="text-gray-700">
                    {provider.address_postal_code || '-'}
                  </span>
                )}
              </AttorneyGrid>
            </CompareRow>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-500 text-center">
              The information displayed is provided by attorneys and
              verified when available. Contact each attorney
              directly for a personalized consultation.
            </p>
          </div>
        </div>
      </div>
    </Fragment>
  )
}

export default CompareView
