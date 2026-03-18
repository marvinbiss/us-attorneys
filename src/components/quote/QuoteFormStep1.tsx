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
      <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
        What service are you looking for?
      </h3>
      <p className="text-slate-500 text-sm mb-4">
        Select the type of legal service you need.
      </p>

      <div>
        <label htmlFor="service" className="block text-sm font-semibold text-slate-700 mb-2">
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
            } bg-white px-4 py-3 pr-10 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
          >
            <option value="">Choose a service...</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {errors.service && (
          <p id="service-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.service}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
      >
        Next <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
