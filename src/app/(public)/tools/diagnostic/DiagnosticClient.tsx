'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MapPin, Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react'
import {
  diagnosticCategories,
  serviceLabels,
  serviceIcons,
  type DiagnosticCategory,
  type DiagnosticSubProblem,
} from '@/lib/data/diagnostic-tree'

type Step = 1 | 2 | 3 | 4

export default function DiagnosticClient() {
  const [step, setStep] = useState<Step>(1)
  const [selectedCategory, setSelectedCategory] = useState<DiagnosticCategory | null>(null)
  const [selectedProblem, setSelectedProblem] = useState<DiagnosticSubProblem | null>(null)
  const [isUrgent, setIsUrgent] = useState<boolean | null>(null)
  const [city, setCity] = useState('')

  // Animation direction: "forward" or "backward"
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [animating, setAnimating] = useState(false)

  const goToStep = useCallback((newStep: Step, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir)
    setAnimating(true)
    // Small delay for the fade-out, then switch
    setTimeout(() => {
      setStep(newStep)
      setAnimating(false)
    }, 150)
  }, [])

  const handleCategorySelect = (category: DiagnosticCategory) => {
    setSelectedCategory(category)
    goToStep(2, 'forward')
  }

  const handleProblemSelect = (problem: DiagnosticSubProblem) => {
    setSelectedProblem(problem)
    goToStep(3, 'forward')
  }

  const handleUrgencySelect = (urgent: boolean) => {
    setIsUrgent(urgent)
    goToStep(4, 'forward')
  }

  const handleBack = () => {
    if (step === 2) {
      setSelectedCategory(null)
      goToStep(1, 'backward')
    } else if (step === 3) {
      setSelectedProblem(null)
      goToStep(2, 'backward')
    } else if (step === 4) {
      setIsUrgent(null)
      goToStep(3, 'backward')
    }
  }

  const handleReset = () => {
    setSelectedCategory(null)
    setSelectedProblem(null)
    setIsUrgent(null)
    setCity('')
    goToStep(1, 'backward')
  }

  const specialtySlug = selectedProblem?.recommendedService || ''
  const serviceLabel = serviceLabels[specialtySlug] || specialtySlug
  const serviceIcon = serviceIcons[specialtySlug] || '🔧'

  const getResultLink = () => {
    if (isUrgent) {
      return `/emergency/${specialtySlug}`
    }
    if (city.trim()) {
      const citySlug = city.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      return `/practice-areas/${specialtySlug}/${citySlug}`
    }
    return `/practice-areas/${specialtySlug}`
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {step} of {step === 4 ? '4' : '3'}
          </span>
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content with animation */}
      <div
        className={`transition-all duration-150 ease-in-out ${
          animating
            ? direction === 'forward'
              ? 'opacity-0 translate-x-4'
              : 'opacity-0 -translate-x-4'
            : 'opacity-100 translate-x-0'
        }`}
      >
        {/* Step 1: Category selection */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
              What is your legal issue?
            </h2>
            <p className="text-gray-600 mb-6">
              Select the category that best matches your situation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {diagnosticCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="group relative flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <span className="text-3xl flex-shrink-0" role="img" aria-hidden="true">
                    {category.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {category.label}
                    </span>
                    <span className="block text-sm text-gray-500 mt-0.5">
                      {category.subProblems.length} common issues
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Sub-problem selection */}
        {step === 2 && selectedCategory && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
              More specifically...
            </h2>
            <p className="text-gray-600 mb-6">
              <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 px-3 py-1 rounded-full mr-2">
                <span role="img" aria-hidden="true">{selectedCategory.icon}</span>
                {selectedCategory.label}
              </span>
              Describe your issue in more detail.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {selectedCategory.subProblems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => handleProblemSelect(problem)}
                  className="group flex items-start gap-4 p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {problem.label}
                    </span>
                    <span className="block text-sm text-gray-500 mt-1">
                      {problem.description}
                    </span>
                    {problem.estimatedPriceRange && (
                      <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        Estimate: {problem.estimatedPriceRange}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Urgency */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
              Is this urgent?
            </h2>
            <p className="text-gray-600 mb-6">
              This helps us direct you to the right resources.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleUrgencySelect(true)}
                className="group flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-red-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors block">
                    Yes, it&apos;s urgent
                  </span>
                  <span className="text-sm text-gray-500 mt-1 block">
                    I need help today or tomorrow
                  </span>
                </div>
              </button>
              <button
                onClick={() => handleUrgencySelect(false)}
                className="group flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Clock className="w-7 h-7 text-green-600" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors block">
                    No, I&apos;m planning ahead
                  </span>
                  <span className="text-sm text-gray-500 mt-1 block">
                    I want to take time to compare attorneys
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && selectedProblem && (
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 sm:p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl" role="img" aria-hidden="true">
                  {serviceIcon}
                </span>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Our recommendation</p>
                  <h2 className="text-2xl font-bold text-gray-900 font-heading">
                    You need a {serviceLabel}
                  </h2>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                For your issue with <strong>{selectedProblem.label.toLowerCase()}</strong>,
                a <strong>{serviceLabel.toLowerCase()}</strong> is the best professional for your situation.
              </p>

              {selectedProblem.estimatedPriceRange && (
                <div className="flex items-center gap-2 mb-4 bg-white/60 rounded-lg px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">Estimated fee range:</span>
                  <span className="font-bold text-blue-700">{selectedProblem.estimatedPriceRange}</span>
                </div>
              )}

              {isUrgent && selectedProblem.urgencyTip && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Emergency tip</p>
                    <p className="text-amber-700 text-sm">{selectedProblem.urgencyTip}</p>
                  </div>
                </div>
              )}

              {/* Main CTA */}
              <Link
                href={getResultLink()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] w-full sm:w-auto justify-center"
              >
                {isUrgent ? (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    Find an emergency {serviceLabel.toLowerCase()}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    View available {serviceLabel.toLowerCase()}s
                  </>
                )}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* City input for non-urgent */}
            {!isUrgent && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold text-gray-900">Specify your city (optional)</span>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., New York, Chicago, Houston..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                  {city.trim() && (
                    <Link
                      href={getResultLink()}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <MapPin className="w-4 h-4" />
                      Search
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Alternative services */}
            {selectedProblem.alternativeServices && selectedProblem.alternativeServices.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                <p className="font-semibold text-gray-900 mb-3">Possible alternatives</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProblem.alternativeServices.map((altSlug) => (
                    <Link
                      key={altSlug}
                      href={`/practice-areas/${altSlug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-sm"
                    >
                      <span role="img" aria-hidden="true">{serviceIcons[altSlug] || '🔧'}</span>
                      <span className="font-medium text-gray-700">
                        {serviceLabels[altSlug] || altSlug}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tips section */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Tips for choosing the right attorney</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Verify the attorney&apos;s bar number with the state bar association.
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Always request a detailed fee agreement before engaging services.
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Compare at least 3 consultations for the same type of case.
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Make sure the attorney carries professional liability (malpractice) insurance.
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  For complex cases, ask about the attorney&apos;s relevant experience and track record.
                </li>
              </ul>
            </div>

            {/* Restart button */}
            <div className="text-center">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Restart diagnostic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
