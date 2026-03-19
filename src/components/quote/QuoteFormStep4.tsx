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
      <h3 className="mb-1 font-heading text-xl font-bold text-slate-900">
        Your contact information
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        So attorneys can reach out to you with their consultations.
      </p>

      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
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
            } bg-white px-4 py-3 pr-10 text-slate-900 transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
          />
          {formData.name.trim() && !errors.name && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className="h-4 w-4" />
            </span>
          )}
        </div>
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-700">
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
            } bg-white px-4 py-3 pr-10 text-slate-900 transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
          />
          {formData.phone.trim() && !errors.phone && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className="h-4 w-4" />
            </span>
          )}
        </div>
        {errors.phone && (
          <p id="phone-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
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
            } bg-white px-4 py-3 pr-10 text-slate-900 transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
          />
          {formData.email.trim() && !errors.email && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className="h-4 w-4" />
            </span>
          )}
        </div>
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      {/* Consent checkbox */}
      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={formData.consent}
            onChange={(e) => updateField('consent', e.target.checked)}
            disabled={submitting}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm leading-relaxed text-slate-600">
            I agree to be contacted by attorneys to receive consultations related to my request.{' '}
            <span className="text-gray-400">
              Only your name, phone number, and case description are shared with matched attorneys.
            </span>
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.consent}
          </p>
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={submitting}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3.5 font-semibold text-slate-700 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-5 w-5" /> Previous
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:opacity-70"
        >
          {submitting ? 'Submitting...' : 'Get my free consultations'}{' '}
          {!submitting && <ArrowRight className="h-5 w-5" />}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">
        Free, no obligation · Response within 24h · Your data stays confidential
      </p>
    </div>
  )
}
