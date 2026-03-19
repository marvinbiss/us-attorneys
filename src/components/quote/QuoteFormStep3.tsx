import { ArrowRight, ArrowLeft } from 'lucide-react'
import type { FormData } from './types'
import { urgencyOptions, budgetOptions, serviceSubcategories } from './types'

interface QuoteFormStep3Props {
  formData: FormData
  errors: Partial<Record<keyof FormData, string>>
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
  isPrefilled: boolean
  onNext: () => void
  onPrev: () => void
}

export function QuoteFormStep3({
  formData,
  errors,
  updateField,
  isPrefilled,
  onNext,
  onPrev,
}: QuoteFormStep3Props) {
  return (
    <div className="space-y-6">
      <h3 className="mb-1 font-heading text-xl font-bold text-slate-900">Case details</h3>
      <p className="mb-4 text-sm text-slate-500">
        Specify your needs to receive tailored consultations.
      </p>

      {/* Urgency */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-slate-700">
          Preferred timeline <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urgencyOptions.map((opt) => (
            <label
              key={opt.value}
              className={`relative flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                formData.urgency === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-slate-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="urgency"
                value={opt.value}
                checked={formData.urgency === opt.value}
                onChange={(e) => updateField('urgency', e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.urgency && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.urgency}
          </p>
        )}
      </div>

      {/* Quick project type selection */}
      {formData.service && serviceSubcategories[formData.service] && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Case type <span className="font-normal text-slate-400">(click to select)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {serviceSubcategories[formData.service].map((cat) => {
              const isSelected = formData.description.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      updateField(
                        'description',
                        formData.description
                          .replace(cat, '')
                          .replace(/,\s*,/g, ',')
                          .replace(/^,\s*|,\s*$/g, '')
                          .trim()
                      )
                    } else {
                      updateField(
                        'description',
                        formData.description ? `${formData.description}, ${cat}` : cat
                      )
                    }
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
          Describe your case <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder={
            formData.service && serviceSubcategories[formData.service]
              ? 'Additional details (optional)...'
              : 'E.g.: car accident injury, custody dispute...'
          }
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          aria-describedby={errors.description ? 'description-error' : undefined}
          aria-invalid={!!errors.description}
          style={{ fontSize: '16px' }}
          className={`w-full rounded-xl border ${
            errors.description ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
          } resize-none bg-white px-4 py-3 text-slate-900 transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
        />
        <div className="mt-1 flex justify-between">
          {errors.description ? (
            <p id="description-error" role="alert" className="text-sm text-red-600">
              {errors.description}
            </p>
          ) : (
            <span />
          )}
          {formData.description.length > 0 && (
            <span
              className={`text-xs ${
                formData.description.trim().length >= 10 ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {formData.description.length}/10 chars
            </span>
          )}
        </div>
      </div>

      {/* Budget -- optional */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-slate-700">
          Estimated budget <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {budgetOptions.map((opt) => (
            <label
              key={opt.value}
              className={`relative flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-center text-sm font-medium transition-all duration-200 ${
                formData.budget === opt.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-slate-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="budget"
                value={opt.value}
                checked={formData.budget === opt.value}
                onChange={(e) => updateField('budget', e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {!isPrefilled && (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3.5 font-semibold text-slate-700 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" /> Previous
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className={`${isPrefilled ? 'w-full' : 'flex-1'} inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl`}
        >
          Next <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
