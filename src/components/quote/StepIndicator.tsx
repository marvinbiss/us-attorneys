import { Check } from 'lucide-react'

const stepLabels = ['Service', 'City', 'Details', 'Contact']

export function StepIndicator({ currentStep }: { currentStep: number }) {
  const progress = Math.round(((currentStep - 1) / 3) * 100)
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-600">
          Step {currentStep} of 4
        </span>
        <span className="text-sm font-semibold text-blue-600">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Step circles */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  currentStep > s
                    ? 'bg-blue-600 text-white'
                    : currentStep === s
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  currentStep >= s ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 4 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 mb-5 transition-all duration-300 ${
                  currentStep > s ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
