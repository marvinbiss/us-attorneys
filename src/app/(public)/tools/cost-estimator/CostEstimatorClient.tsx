'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Scale,
  Search,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import CostEstimateResult from '@/components/tools/CostEstimateResult'
import {
  estimateLegalCost,
  getFeeStructuresForPA,
  getStateAverageComparison,
  STATE_NAMES,
  type Complexity,
} from '@/lib/cost-estimator'
import { PRACTICE_AREAS_200, CATEGORY_ORDER, type PracticeArea } from '@/lib/data/practice-areas-200'

// ── Types ────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

// ── Grouped practice areas ───────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  'personal-injury': 'Personal Injury',
  'criminal-defense': 'Criminal Defense',
  'family-law': 'Family Law',
  'business-corporate': 'Business & Corporate',
  'intellectual-property': 'Intellectual Property',
  'real-estate': 'Real Estate',
  immigration: 'Immigration',
  'estate-planning': 'Estate Planning & Probate',
  employment: 'Employment & Labor',
  bankruptcy: 'Bankruptcy & Debt',
  tax: 'Tax Law',
  specialized: 'Specialized',
  'government-administrative': 'Government & Administrative',
  'technology-cyber': 'Technology & Cyber',
  'personal-family-additional': 'Personal & Family (Additional)',
}

// Only show top-level (parent) practice areas for cleaner selection
const TOP_PRACTICE_AREAS = PRACTICE_AREAS_200.filter((pa) => pa.parentSlug === null)

// Group by category
function groupByCategory(areas: PracticeArea[]): { category: string; label: string; areas: PracticeArea[] }[] {
  const groups = new Map<string, PracticeArea[]>()
  for (const pa of areas) {
    const existing = groups.get(pa.category) || []
    existing.push(pa)
    groups.set(pa.category, existing)
  }
  return CATEGORY_ORDER
    .filter((cat) => groups.has(cat))
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      areas: groups.get(cat) || [],
    }))
}

// State list sorted by name
const STATE_LIST = Object.entries(STATE_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

// ── Main Client Component ────────────────────────────────────────────

export default function CostEstimatorClient() {
  const [step, setStep] = useState<Step>(1)
  const [selectedPA, setSelectedPA] = useState<PracticeArea | null>(null)
  const [selectedState, setSelectedState] = useState<{ code: string; name: string } | null>(null)
  const [complexity, setComplexity] = useState<Complexity>('moderate')
  const [searchQuery, setSearchQuery] = useState('')
  const [stateSearchQuery, setStateSearchQuery] = useState('')
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  // Animation helper
  const goToStep = useCallback((newStep: Step, dir: 'forward' | 'backward' = 'forward') => {
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setAnimating(false)
    }, 150)
  }, [])

  // Handlers
  const handlePASelect = (pa: PracticeArea) => {
    setSelectedPA(pa)
    goToStep(2, 'forward')
  }

  const handleStateSelect = (state: { code: string; name: string }) => {
    setSelectedState(state)
    goToStep(3, 'forward')
  }

  const handleComplexitySelect = (c: Complexity) => {
    setComplexity(c)
    goToStep(4, 'forward')
  }

  const handleBack = () => {
    if (step === 2) {
      setSelectedState(null)
      goToStep(1, 'backward')
    } else if (step === 3) {
      setComplexity('moderate')
      goToStep(2, 'backward')
    } else if (step === 4) {
      goToStep(3, 'backward')
    }
  }

  const handleReset = () => {
    setSelectedPA(null)
    setSelectedState(null)
    setComplexity('moderate')
    setSearchQuery('')
    setStateSearchQuery('')
    goToStep(1, 'backward')
  }

  const handleComplexityChange = (c: Complexity) => {
    setComplexity(c)
  }

  // Filtered practice areas
  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return groupByCategory(TOP_PRACTICE_AREAS)

    const filtered = TOP_PRACTICE_AREAS.filter(
      (pa) =>
        pa.name.toLowerCase().includes(query) ||
        pa.aliases.some((a) => a.toLowerCase().includes(query))
    )
    return groupByCategory(filtered)
  }, [searchQuery])

  // Filtered states
  const filteredStates = useMemo(() => {
    const query = stateSearchQuery.toLowerCase().trim()
    if (!query) return STATE_LIST
    return STATE_LIST.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
    )
  }, [stateSearchQuery])

  // Compute estimate for step 4
  const estimate = useMemo(() => {
    if (!selectedPA || !selectedState) return null
    return estimateLegalCost(selectedPA.slug, selectedState.code, complexity)
  }, [selectedPA, selectedState, complexity])

  const feeStructures = useMemo(() => {
    if (!selectedPA || !selectedState) return []
    return getFeeStructuresForPA(selectedPA.slug, selectedState.code)
  }, [selectedPA, selectedState])

  const stateComparison = useMemo(() => {
    if (!selectedPA || !selectedState) return []
    return getStateAverageComparison(selectedPA.slug, selectedState.code)
  }, [selectedPA, selectedState])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Step {step} of 4
          </span>
          <div className="flex items-center gap-3">
            {step > 1 && step < 4 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step === 4 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        {/* Selection summary */}
        {(selectedPA || selectedState) && step < 4 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedPA && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <Scale className="w-3 h-3" />
                {selectedPA.name}
              </span>
            )}
            {selectedState && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                <MapPin className="w-3 h-3" />
                {selectedState.name}
              </span>
            )}
          </div>
        )}
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
        {/* Step 1: Select practice area */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
              What type of legal matter?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select the practice area to get an accurate cost estimate.
            </p>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search practice areas (e.g., divorce, DUI, bankruptcy)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Search practice areas"
              />
            </div>

            {/* Practice area groups */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
              {filteredGroups.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No practice areas found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.areas.map((pa) => (
                        <button
                          key={pa.slug}
                          onClick={() => handlePASelect(pa)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                        >
                          <span className="text-lg">{pa.icon === 'Shield' ? '\u{1F6E1}' : '\u{2696}'}</span>
                          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                            {pa.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select state */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
              Where are you located?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Legal costs vary significantly by state. Select your state for accurate estimates.
            </p>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={stateSearchQuery}
                onChange={(e) => setStateSearchQuery(e.target.value)}
                placeholder="Search states (e.g., California, TX)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Search states"
              />
            </div>

            {/* State grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredStates.map((state) => (
                <button
                  key={state.code}
                  onClick={() => handleStateSelect(state)}
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-6">{state.code}</span>
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 truncate">
                    {state.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Case complexity */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
              How complex is your case?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Case complexity is the biggest factor in determining legal costs.
            </p>

            <div className="space-y-4">
              {([
                {
                  value: 'simple' as Complexity,
                  title: 'Simple',
                  description: 'Straightforward matter with few disputes. Uncontested divorce, simple will, traffic ticket, basic contract review.',
                  estimate: '5-20 hours',
                  icon: '\u{2705}',
                },
                {
                  value: 'moderate' as Complexity,
                  title: 'Moderate',
                  description: 'Typical complexity. Contested divorce, DUI defense, small business litigation, estate planning with trusts.',
                  estimate: '20-60 hours',
                  icon: '\u{26A0}\u{FE0F}',
                },
                {
                  value: 'complex' as Complexity,
                  title: 'Complex',
                  description: 'High-stakes matter. Multi-party litigation, federal crimes, complex corporate disputes, serious injury trial.',
                  estimate: '60-200+ hours',
                  icon: '\u{1F534}',
                },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleComplexitySelect(opt.value)}
                  className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all text-left group"
                >
                  <span className="text-2xl mt-0.5">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {opt.title}
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ~{opt.estimate}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {opt.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 mt-1.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && estimate && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Your Cost Estimate
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Based on {estimate.practiceAreaLabel} in {estimate.stateName} ({complexity} complexity)
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                New Estimate
              </button>
            </div>

            <CostEstimateResult
              estimate={estimate}
              feeStructures={feeStructures}
              stateComparison={stateComparison}
              onComplexityChange={handleComplexityChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
