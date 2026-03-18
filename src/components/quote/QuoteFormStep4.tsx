import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import type { FormData } from './types'

interface QuoteFormStep4Props {
  formData: FormData
  errors: Partial<Record<keyof FormData, string>>
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
  validateField: (field: keyof FormData) => void
  submitting: boolean
  submitError: string | null
  onPrev: () => void
}

export function QuoteFormStep4({
  formData,
  errors,
  updateField,
  validateField,
  submitting,
  submitError,
  onPrev,
}: QuoteFormStep4Props) {
  return (
    <div className="space-y-6">
      <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
        Your contact information
      </h3>
      <p className="text-slate-500 text-sm mb-4">
        So attorneys can reach out to you with their consultations.
      </p>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
          Full name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="John Smith"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            onBlur={() => validateField('name')}
            disabled={submitting}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
            style={{ fontSize: '16px' }}
            className={`w-full rounded-xl border ${
              errors.name ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
            } bg-white px-4 py-3 pr-10 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
          />
          {formData.name.trim() && !errors.name && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className="w-4 h-4" />
            </span>
          )}
        </div>
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
          Phone <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            onBlur={() => validateField('phone')}
            disabled={submitting}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            aria-invalid={!!errors.phone}
            style={{ fontSize: '16px' }}
            className={`w-full rounded-xl border ${
              errors.phone ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
            } bg-white px-4 py-3 pr-10 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
          />
          {formData.phone.trim() && !errors.phone && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className="w-4 h-4" />
            </span>
          )}
        </div>
        {errors.phone && (
          <p id="phone-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
          Email address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="john.smith@email.com"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            onBlur={() => validateField('email')}
            disabled={submitting}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            style={{ fontSize: '16px' }}
            className={`w-full rounded-xl border ${
              errors.email ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
            } bg-white px-4 py-3 pr-10 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
          />
          {formData.email.trim() && !errors.email && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className="w-4 h-4" />
            </span>
          )}
        </div>
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Consent checkbox */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consent}
            onChange={(e) => updateField('consent', e.target.checked)}
            disabled={submitting}
            className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600 leading-relaxed">
            I agree to be contacted by attorneys to receive consultations
            related to my request.{' '}
            <span className="text-gray-400">Only your name, phone number, and case description are shared with matched attorneys.</span>
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.consent}</p>
        )}
      </div>

      {submitError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" /> Previous
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70"
        >
          {submitting ? 'Submitting...' : 'Get my free consultations'} {!submitting && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">
        Free, no obligation · Response within 24h · Your data stays confidential
      </p>
    </div>
  )
}
