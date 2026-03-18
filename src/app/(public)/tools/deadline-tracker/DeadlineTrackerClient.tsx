'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Scale,
  MapPin,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Users,
  Star,
  MapPinIcon,
  RotateCcw,
} from 'lucide-react'
import DeadlineResult from '@/components/tools/DeadlineResult'
import DeadlineReminder from '@/components/tools/DeadlineReminder'
import { TRACKER_SPECIALTIES, US_STATES } from '@/lib/deadline-tracker'
import type { UrgencyLevel } from '@/lib/deadline-tracker'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DeadlineResultData {
  deadline: string
  daysRemaining: number
  urgencyLevel: UrgencyLevel
  years: number
  exceptions: string[]
  discoveryRule: boolean
  discoveryDeadline?: string
  discoveryDaysRemaining?: number
  discoveryUrgencyLevel?: UrgencyLevel
  description: string
  sourceUrl: string
  incidentDate: string
  stateCode: string
  specialtySlug: string
  attorneyCount?: number
}

interface RelatedAttorney {
  id: string
  name: string
  slug: string
  rating_average: number | null
  review_count: number
  firm_name: string | null
  address_city: string | null
  address_state: string | null
  primary_specialty_name?: string | null
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Legal Issue', icon: Scale },
    { num: 2, label: 'State', icon: MapPin },
    { num: 3, label: 'Incident Date', icon: Calendar },
  ]

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= step.num
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {step.num}
            </div>
            <span
              className={`hidden sm:inline text-sm font-medium transition-colors ${
                currentStep >= step.num
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-0.5 transition-colors ${
                currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Related Attorney Card ──────────────────────────────────────────────────

function AttorneyMiniCard({ attorney }: { attorney: RelatedAttorney }) {
  return (
    <Link
      href={`/attorneys/${attorney.slug}`}
      className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {attorney.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {attorney.name}
          </h4>
          {attorney.firm_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{attorney.firm_name}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {attorney.rating_average && attorney.rating_average > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {attorney.rating_average.toFixed(1)}
                </span>
                {attorney.review_count > 0 && (
                  <span className="text-xs text-gray-400">({attorney.review_count})</span>
                )}
              </div>
            )}
            {attorney.address_city && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MapPinIcon className="w-3 h-3" aria-hidden="true" />
                <span className="truncate">
                  {attorney.address_city}, {attorney.address_state}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Client Component ──────────────────────────────────────────────────

export default function DeadlineTrackerClient() {
  const prefersReducedMotion = useReducedMotion()
  const [step, setStep] = useState(1)
  const [specialtySlug, setSpecialtySlug] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [discoveryDate, setDiscoveryDate] = useState('')
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<DeadlineResultData | null>(null)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [relatedAttorneys, setRelatedAttorneys] = useState<RelatedAttorney[]>([])
  const [stateFilter, setStateFilter] = useState('')

  // Group specialties by category
  const specialtiesByCategory = TRACKER_SPECIALTIES.reduce<Record<string, typeof TRACKER_SPECIALTIES>>(
    (acc, spec) => {
      if (!acc[spec.category]) acc[spec.category] = []
      acc[spec.category].push(spec)
      return acc
    },
    {}
  )

  const selectedSpecialty = TRACKER_SPECIALTIES.find(s => s.slug === specialtySlug)
  const selectedState = US_STATES.find(s => s.code === stateCode)

  // Filter states
  const filteredStates = stateFilter
    ? US_STATES.filter(
        s =>
          s.name.toLowerCase().includes(stateFilter.toLowerCase()) ||
          s.code.toLowerCase().includes(stateFilter.toLowerCase())
      )
    : US_STATES

  // Fetch related attorneys when result is available
  useEffect(() => {
    if (!result) {
      setRelatedAttorneys([])
      return
    }

    const fetchAttorneys = async () => {
      try {
        const res = await fetch(
          `/api/attorneys/by-city?state=${result.stateCode}&limit=3&specialty=${result.specialtySlug}`
        )
        if (res.ok) {
          const data = await res.json()
          setRelatedAttorneys(
            (data.attorneys || data.data || data || []).slice(0, 3)
          )
        }
      } catch {
        // Non-critical — fail silently
      }
    }
    fetchAttorneys()
  }, [result])

  const handleCalculate = useCallback(async () => {
    if (!specialtySlug || !stateCode || !incidentDate) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/deadline-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialtySlug,
          stateCode,
          incidentDate,
          discoveryDate: showDiscovery && discoveryDate ? discoveryDate : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to calculate deadline')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [specialtySlug, stateCode, incidentDate, discoveryDate, showDiscovery])

  const handleReset = useCallback(() => {
    setStep(1)
    setSpecialtySlug('')
    setStateCode('')
    setIncidentDate('')
    setDiscoveryDate('')
    setShowDiscovery(false)
    setResult(null)
    setError('')
    setRelatedAttorneys([])
    setStateFilter('')
  }, [])

  // Max date for incident = today
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        {!result && <StepIndicator currentStep={step} />}

        <AnimatePresence mode="wait">
          {/* ──────── Step 1: Select Legal Issue ──────── */}
          {step === 1 && !result && (
            <motion.div
              key="step1"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    What type of legal issue?
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select the category that best describes your situation
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(specialtiesByCategory).map(([category, specs]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {specs.map(spec => (
                        <button
                          key={spec.slug}
                          onClick={() => {
                            setSpecialtySlug(spec.slug)
                            setStep(2)
                          }}
                          className={`text-left px-4 py-3 rounded-lg border transition-all ${
                            specialtySlug === spec.slug
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {spec.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ──────── Step 2: Select State ──────── */}
          {step === 2 && !result && (
            <motion.div
              key="step2"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    In which state did the incident occur?
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    For:{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {selectedSpecialty?.label}
                    </span>{' '}
                    <button
                      onClick={() => setStep(1)}
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> change
                    </button>
                  </p>
                </div>
              </div>

              {/* State search / select */}
              <div className="mb-4">
                <label htmlFor="state-search" className="sr-only">Search states</label>
                <input
                  type="text"
                  id="state-search"
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  placeholder="Search state name or code..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
                {filteredStates.map(state => (
                  <button
                    key={state.code}
                    onClick={() => {
                      setStateCode(state.code)
                      setStep(3)
                    }}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      stateCode === state.code
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                    title={state.name}
                  >
                    {state.code}
                  </button>
                ))}
                {filteredStates.length === 0 && (
                  <p className="col-span-full text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                    No states match your search.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ──────── Step 3: Enter Date ──────── */}
          {step === 3 && !result && (
            <motion.div
              key="step3"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    When did the incident occur?
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedSpecialty?.label} in {selectedState?.name}{' '}
                    <button
                      onClick={() => setStep(2)}
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> change
                    </button>
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label
                    htmlFor="incident-date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Incident Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="incident-date"
                    value={incidentDate}
                    onChange={e => setIncidentDate(e.target.value)}
                    max={today}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    aria-required="true"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The date the incident, injury, or breach occurred.
                  </p>
                </div>

                {/* Discovery Date (optional) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowDiscovery(!showDiscovery)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showDiscovery
                      ? 'Hide discovery date'
                      : 'Was the injury discovered later? (optional)'}
                  </button>

                  <AnimatePresence>
                    {showDiscovery && (
                      <motion.div
                        initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2">
                          <label
                            htmlFor="discovery-date"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Discovery Date
                          </label>
                          <input
                            type="date"
                            id="discovery-date"
                            value={discoveryDate}
                            onChange={e => setDiscoveryDate(e.target.value)}
                            max={today}
                            min={incidentDate || undefined}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            The date you first became aware of the injury or harm. If applicable, the
                            discovery rule may extend your filing deadline.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 rounded-lg p-3"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleCalculate}
                  disabled={!incidentDate || loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold transition-colors disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      Calculate My Deadline
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ──────── Result ──────── */}
          {result && (
            <motion.div
              key="result"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            >
              {/* Header with reset */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Your Legal Deadline
                </h2>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Calculate another
                </button>
              </div>

              {/* Deadline result component */}
              <DeadlineResult
                result={result}
                specialtyLabel={selectedSpecialty?.label || result.specialtySlug}
                stateName={selectedState?.name || result.stateCode}
                onSaveReminder={() => setReminderOpen(true)}
              />

              {/* Related Attorneys Section */}
              {relatedAttorneys.length > 0 && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4, duration: 0.3 }}
                  className="mt-8"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedSpecialty?.label || 'Related'} Attorneys in{' '}
                        {selectedState?.name || result.stateCode}
                      </h3>
                    </div>
                    <Link
                      href={`/practice-areas/${result.specialtySlug}?state=${result.stateCode.toLowerCase()}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {relatedAttorneys.map(attorney => (
                      <AttorneyMiniCard key={attorney.id} attorney={attorney} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* State comparison teaser */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5, duration: 0.3 }}
                className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-100 dark:border-indigo-900"
              >
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  <strong>Did you know?</strong> The statute of limitations for{' '}
                  {selectedSpecialty?.label?.toLowerCase() || 'this claim type'} varies
                  significantly by state — from as little as 1 year to as many as 10+ years. If
                  the incident occurred across state lines, the applicable deadline may differ.
                  An attorney can help determine which state's laws apply.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reminder Modal */}
      {result && (
        <DeadlineReminder
          isOpen={reminderOpen}
          onClose={() => setReminderOpen(false)}
          specialtySlug={result.specialtySlug}
          specialtyLabel={selectedSpecialty?.label || result.specialtySlug}
          stateCode={result.stateCode}
          stateName={selectedState?.name || result.stateCode}
          incidentDate={result.incidentDate}
          deadlineDate={result.deadline}
          daysRemaining={result.daysRemaining}
        />
      )}
    </>
  )
}
