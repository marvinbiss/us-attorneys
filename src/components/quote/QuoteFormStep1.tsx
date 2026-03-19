import { services } from '@/lib/data/usa'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { FormData } from './types'

interface QuoteFormStep1Props {
  formData: FormData
  errors: Partial<Record<keyof FormData, string>>
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
  onNext: () => void
}

export function QuoteFormStep1({ formData, errors, updateField, onNext }: QuoteFormStep1Props) {
  return (
    <div className="space-y-6">
      <h3 className="mb-1 font-heading text-xl font-bold text-slate-900">
        What service are you looking for?
      </h3>
      <p className="mb-4 text-sm text-slate-500">Select the type of legal service you need.</p>

      <div>
        <label htmlFor="service" className="mb-2 block text-sm font-semibold text-slate-700">
          Service type <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="service"
            value={formData.service}
            onChange={(e) => updateField('service', e.target.value)}
            aria-describedby={errors.service ? 'service-error' : undefined}
            aria-invalid={!!errors.service}
            style={{ fontSize: '16px' }}
            className={`w-full appearance-none rounded-xl border ${
              errors.service ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
            } bg-white px-4 py-3 pr-10 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
          >
            <option value="">Choose a service...</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>
        {errors.service && (
          <p id="service-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.service}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
      >
        Next <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  )
}
