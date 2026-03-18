import { Briefcase, Clock, DollarSign, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { LegacyAttorney } from '@/types/legacy'
import { slugify } from '@/lib/utils'
import { RequestConsultationButton } from './RequestConsultationButton'

interface AttorneyServicesProps {
  attorney: LegacyAttorney
}

export function AttorneyServices({ attorney }: AttorneyServicesProps) {
  const hasServices = attorney.services.length > 0
  const hasPrices = attorney.service_prices.length > 0

  if (!hasServices && !hasPrices) return null

  return (
    <div
      className="bg-[#FFFCF8] dark:bg-gray-800 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 overflow-hidden"
    >
      {/* Section header */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-heading flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-clay-50 dark:bg-clay-900/30 flex items-center justify-center">
            <Briefcase className="w-4.5 h-4.5 text-clay-400" aria-hidden="true" />
          </div>
          Practice Areas
        </h2>
      </div>

      <div className="px-6 pb-6">
        {/* Practice area tags/chips with links */}
        {hasServices && (
          <div className="flex flex-wrap gap-2 mb-6 mt-4" role="list" aria-label="Practice areas">
            {attorney.services.map((service, i) => {
              const serviceSlug = slugify(service)
              const citySlug = attorney.city_slug || slugify(attorney.city)
              const href = serviceSlug && citySlug
                ? `/practice-areas/${serviceSlug}/${citySlug}`
                : serviceSlug
                ? `/practice-areas/${serviceSlug}`
                : null

              return href ? (
                <Link
                  key={i}
                  href={href}
                  role="listitem"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sand-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 text-sm font-medium border border-sand-300 dark:border-gray-600 hover:bg-clay-50 dark:hover:bg-clay-900/30 hover:border-clay-200 dark:hover:border-clay-700 hover:text-clay-700 dark:hover:text-clay-300 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-clay-400 flex-shrink-0" aria-hidden="true" />
                  {service}
                </Link>
              ) : (
                <span
                  key={i}
                  role="listitem"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sand-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 text-sm font-medium border border-sand-300 dark:border-gray-600"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-clay-400 flex-shrink-0" aria-hidden="true" />
                  {service}
                </span>
              )
            })}
          </div>
        )}

        {/* Pricing table — only show real prices from the attorney */}
        {hasPrices ? (
          <div className="space-y-2.5 mt-4" role="list" aria-label="Service fees">
            {attorney.service_prices[0]?.price?.startsWith('Starting') && (
              <p className="text-xs text-slate-400 dark:text-gray-500 italic mb-3">* Indicative fees, the final price depends on the exact nature of the consultation. Request a consultation for a precise quote.</p>
            )}
            {attorney.service_prices.map((service, index) => (
              <div
                key={index}
                role="listitem"
                className="flex items-center justify-between p-4 rounded-xl bg-sand-50 dark:bg-gray-700/50 border border-sand-200 dark:border-gray-600 group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">{service.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 ml-4">
                  {service.duration && (
                    <div className="hidden sm:flex items-center gap-1 text-sm text-slate-400 dark:text-gray-500" aria-label={`Duration: ${service.duration}`}>
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>{service.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-lg font-bold text-clay-600 dark:text-clay-300 whitespace-nowrap bg-clay-50 dark:bg-clay-900/30 px-3 py-1 rounded-lg" aria-label={`Price: ${service.price}`}>
                    <DollarSign className="w-4 h-4" aria-hidden="true" />
                    <span>{service.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !hasServices ? (
          <div className="bg-clay-50 dark:bg-clay-900/30 rounded-xl border border-clay-200 dark:border-clay-700 p-6 text-center mt-4">
            <p className="text-slate-700 dark:text-gray-200 font-medium mb-2">Fees upon consultation</p>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">This attorney offers fees tailored to each case. Request a free consultation to learn their rates.</p>
            <RequestConsultationButton />
          </div>
        ) : null}
      </div>
    </div>
  )
}
