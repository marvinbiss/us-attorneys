import { cities } from '@/lib/data/usa'
import { ArrowRight, ArrowLeft, MapPin } from 'lucide-react'
import type { FormData } from './types'

interface QuoteFormStep2Props {
  formData: FormData
  errors: Partial<Record<keyof FormData, string>>
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
  cityQuery: string
  setCityQuery: (value: string) => void
  showCitySuggestions: boolean
  setShowCitySuggestions: (value: boolean) => void
  setSelectedCityZip: (value: string) => void
  geoLoading: boolean
  handleGeolocation: () => void
  onNext: () => void
  onPrev: () => void
}

export function QuoteFormStep2({
  formData,
  errors,
  updateField,
  cityQuery,
  setCityQuery,
  showCitySuggestions,
  setShowCitySuggestions,
  setSelectedCityZip,
  geoLoading,
  handleGeolocation,
  onNext,
  onPrev,
}: QuoteFormStep2Props) {
  const filteredCities =
    cityQuery.length >= 2
      ? cities
          .filter(
            (v) =>
              v.name.toLowerCase().includes(cityQuery.toLowerCase()) ||
              v.zipCode.startsWith(cityQuery)
          )
          .slice(0, 8)
      : []

  return (
    <div className="space-y-6">
      <h3 className="mb-1 font-heading text-xl font-bold text-slate-900">
        Where is your case located?
      </h3>
      <p className="mb-4 text-sm text-slate-500">Enter your city to find attorneys near you.</p>

      <div>
        <label htmlFor="city" className="mb-2 block text-sm font-semibold text-slate-700">
          City <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="city"
            type="text"
            autoComplete="address-level2"
            placeholder="E.g.: New York, Los Angeles, Chicago..."
            value={cityQuery}
            onChange={(e) => {
              const newValue = e.target.value
              setCityQuery(newValue)
              setShowCitySuggestions(true)
              if (formData.city && newValue !== formData.city) {
                updateField('city', '')
                setSelectedCityZip('')
              }
            }}
            onFocus={() => setShowCitySuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowCitySuggestions(false), 200)
            }}
            aria-describedby={errors.city ? 'city-error' : undefined}
            aria-invalid={!!errors.city}
            style={{ fontSize: '16px' }}
            className={`w-full rounded-xl border ${
              errors.city ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
            } bg-white px-4 py-3 text-slate-900 transition-all placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
          />
          {showCitySuggestions && filteredCities.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {filteredCities.map((v) => (
                <li key={v.slug}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-blue-50"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      updateField('city', v.name)
                      setCityQuery(v.name)
                      setSelectedCityZip(v.zipCode)
                      setShowCitySuggestions(false)
                    }}
                  >
                    <span className="font-medium text-slate-900">{v.name}</span>
                    <span className="ml-2 text-gray-400">
                      ({v.stateName}, {v.zipCode})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={handleGeolocation}
          disabled={geoLoading}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 disabled:opacity-50"
        >
          <MapPin className="h-4 w-4" />
          {geoLoading ? 'Locating...' : 'Use my location'}
        </button>
        {errors.city && (
          <p id="city-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.city}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3.5 font-semibold text-slate-700 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" /> Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
        >
          Next <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
