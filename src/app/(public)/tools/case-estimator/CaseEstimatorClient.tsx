'use client'

import { useState, useCallback } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Scale,
  MapPin,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import CaseEstimateResult from '@/components/tools/CaseEstimateResult'
import type { CaseEstimate } from '@/lib/case-estimator'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CASE_CATEGORIES = [
  {
    label: 'Personal Injury',
    slug: 'personal-injury',
    subcategories: [
      { label: 'Car Accidents', slug: 'car-accidents' },
      { label: 'Truck Accidents', slug: 'truck-accidents' },
      { label: 'Motorcycle Accidents', slug: 'motorcycle-accidents' },
      { label: 'Slip & Fall', slug: 'slip-and-fall' },
      { label: 'Medical Malpractice', slug: 'medical-malpractice' },
      { label: 'Wrongful Death', slug: 'wrongful-death' },
      { label: 'Product Liability', slug: 'product-liability' },
      { label: 'Workplace Injury', slug: 'workplace-injury' },
      { label: 'Dog Bites', slug: 'dog-bites' },
      { label: 'Nursing Home Abuse', slug: 'nursing-home-abuse' },
    ],
  },
  {
    label: 'Criminal Defense',
    slug: 'criminal-defense',
    subcategories: [
      { label: 'DUI/DWI', slug: 'dui-dwi' },
      { label: 'Drug Offenses', slug: 'drug-offenses' },
      { label: 'Assault', slug: 'assault' },
      { label: 'Theft', slug: 'theft' },
      { label: 'White Collar Crime', slug: 'white-collar-crime' },
      { label: 'Domestic Violence', slug: 'domestic-violence' },
    ],
  },
  {
    label: 'Family Law',
    slug: 'family-law',
    subcategories: [
      { label: 'Divorce', slug: 'divorce' },
      { label: 'Child Custody', slug: 'child-custody' },
      { label: 'Child Support', slug: 'child-support' },
      { label: 'Adoption', slug: 'adoption' },
      { label: 'Alimony', slug: 'alimony' },
    ],
  },
  {
    label: 'Employment Law',
    slug: 'employment-law',
    subcategories: [
      { label: 'Wrongful Termination', slug: 'wrongful-termination' },
      { label: 'Discrimination', slug: 'discrimination' },
      { label: 'Sexual Harassment', slug: 'sexual-harassment' },
      { label: 'Wage Disputes', slug: 'wage-disputes' },
    ],
  },
  {
    label: 'Business & Corporate',
    slug: 'business-law',
    subcategories: [
      { label: 'Contract Disputes', slug: 'contract-disputes' },
      { label: 'Business Litigation', slug: 'business-litigation' },
      { label: 'Partnership Disputes', slug: 'partnership-disputes' },
    ],
  },
  {
    label: 'Real Estate',
    slug: 'real-estate',
    subcategories: [
      { label: 'Landlord-Tenant', slug: 'landlord-tenant' },
      { label: 'Property Disputes', slug: 'property-disputes' },
      { label: 'Foreclosure', slug: 'foreclosure' },
    ],
  },
  {
    label: 'Bankruptcy',
    slug: 'bankruptcy',
    subcategories: [
      { label: 'Chapter 7', slug: 'chapter-7-bankruptcy' },
      { label: 'Chapter 13', slug: 'chapter-13-bankruptcy' },
      { label: 'Business Bankruptcy', slug: 'business-bankruptcy' },
    ],
  },
  {
    label: 'Immigration',
    slug: 'immigration',
    subcategories: [
      { label: 'Green Card', slug: 'green-card' },
      { label: 'Deportation Defense', slug: 'deportation-defense' },
      { label: 'Work Visas', slug: 'work-visas' },
      { label: 'Asylum', slug: 'asylum' },
    ],
  },
]

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

const INJURY_TYPES = [
  { id: 'physical', label: 'Physical injuries (broken bones, spinal, TBI)' },
  { id: 'emotional', label: 'Emotional distress / PTSD' },
  { id: 'financial', label: 'Financial losses (lost wages, medical bills)' },
  { id: 'property', label: 'Property damage' },
  { id: 'permanent', label: 'Permanent disability or disfigurement' },
  { id: 'death', label: 'Wrongful death of a family member' },
  { id: 'medical', label: 'Ongoing medical treatment required' },
  { id: 'none', label: 'No physical injury (legal/contractual matter)' },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4 | 'results'

interface FormState {
  category: string | null
  subcategory: string | null
  categoryLabel: string
  subcategoryLabel: string
  stateCode: string
  stateName: string
  description: string
  injuries: string[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CaseEstimatorClient() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>({
    category: null,
    subcategory: null,
    categoryLabel: '',
    subcategoryLabel: '',
    stateCode: '',
    stateName: '',
    description: '',
    injuries: [],
  })
  const [estimate, setEstimate] = useState<CaseEstimate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const goTo = useCallback((s: Step) => {
    setStep(s)
    setError(null)
  }, [])

  // Step 1: select category + subcategory
  const handleCategorySelect = (catSlug: string, catLabel: string) => {
    setForm((f) => ({ ...f, category: catSlug, categoryLabel: catLabel, subcategory: null, subcategoryLabel: '' }))
  }

  const handleSubcategorySelect = (subSlug: string, subLabel: string) => {
    setForm((f) => ({ ...f, subcategory: subSlug, subcategoryLabel: subLabel }))
    goTo(2)
  }

  // Step 2: select state
  const handleStateSelect = (code: string, name: string) => {
    setForm((f) => ({ ...f, stateCode: code, stateName: name }))
    goTo(3)
  }

  // Step 3: description (optional, proceed)
  const handleDescriptionNext = () => goTo(4)

  // Step 4: injuries + submit
  const toggleInjury = (id: string) => {
    setForm((f) => ({
      ...f,
      injuries: f.injuries.includes(id)
        ? f.injuries.filter((i) => i !== id)
        : [...f.injuries, id],
    }))
  }

  const handleSubmit = async () => {
    const slug = form.subcategory || form.category
    if (!slug || !form.stateCode) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        specialty: slug,
        state: form.stateCode,
      })
      const res = await fetch(`/api/tools/case-estimate?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to get estimate')
      }
      const data = await res.json()
      setEstimate(data.statistics)
      goTo('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Progress
  const stepNum = step === 'results' ? 4 : step
  const progress = (stepNum / 4) * 100

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Progress Bar ──────────────────────────────────────────────── */}
      {step !== 'results' && (
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Step {stepNum} of 4</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Step 1: Case Type ─────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Scale className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">What type of case do you have?</h2>
              <p className="text-sm text-gray-400">Select the category that best describes your legal matter.</p>
            </div>
          </div>

          {!form.category ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {CASE_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategorySelect(cat.slug, cat.label)}
                  className="text-left p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                >
                  <span className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                    {cat.label}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {cat.subcategories.length} subcategories
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setForm((f) => ({ ...f, category: null, subcategory: null }))}
                className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to categories
              </button>
              <p className="text-sm text-gray-400 mb-3">
                Selected: <span className="text-white font-medium">{form.categoryLabel}</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {CASE_CATEGORIES.find((c) => c.slug === form.category)?.subcategories.map((sub) => (
                  <button
                    key={sub.slug}
                    onClick={() => handleSubcategorySelect(sub.slug, sub.label)}
                    className="text-left p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                  >
                    <span className="font-medium text-white">{sub.label}</span>
                  </button>
                ))}
                {/* Use parent category directly */}
                <button
                  onClick={() => handleSubcategorySelect(form.category!, form.categoryLabel)}
                  className="text-left p-4 rounded-xl border border-dashed border-gray-600 bg-gray-800/30 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                >
                  <span className="font-medium text-gray-300">Other {form.categoryLabel}</span>
                  <span className="block text-xs text-gray-500 mt-1">General category</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: State ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <button
            onClick={() => goTo(1)}
            className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <MapPin className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Where is your case located?</h2>
              <p className="text-sm text-gray-400">Case outcomes vary significantly by state. Select yours below.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[450px] overflow-y-auto pr-2">
            {US_STATES.map((s) => (
              <button
                key={s.code}
                onClick={() => handleStateSelect(s.code, s.name)}
                className={`text-left p-3 rounded-lg border transition-all text-sm ${
                  form.stateCode === s.code
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-gray-700 bg-gray-800/50 hover:border-indigo-500/50 text-gray-300 hover:text-white'
                }`}
              >
                <span className="font-medium">{s.code}</span>
                <span className="block text-xs text-gray-500 truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Description ───────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <button
            onClick={() => goTo(2)}
            className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Describe your case (optional)</h2>
              <p className="text-sm text-gray-400">
                A brief description helps refine the estimate. You can skip this step.
              </p>
            </div>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="e.g., I was rear-ended at a red light and suffered whiplash and a herniated disc. The other driver was texting..."
            className="w-full h-40 p-4 rounded-xl border border-gray-700 bg-gray-800/50 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-colors"
            maxLength={2000}
            aria-label="Case description"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{form.description.length}/2000 characters</span>
            <button
              onClick={handleDescriptionNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-colors"
            >
              {form.description.length > 0 ? 'Continue' : 'Skip'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Injuries/Damages + Submit ─────────────────────────── */}
      {step === 4 && (
        <div>
          <button
            onClick={() => goTo(3)}
            className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <AlertCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Any injuries or damages?</h2>
              <p className="text-sm text-gray-400">Select all that apply. This is optional.</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {INJURY_TYPES.map((injury) => (
              <label
                key={injury.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  form.injuries.includes(injury.id)
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.injuries.includes(injury.id)}
                  onChange={() => toggleInjury(injury.id)}
                  className="w-4 h-4 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 bg-gray-700"
                />
                <span className="text-sm text-gray-300">{injury.label}</span>
              </label>
            ))}
          </div>

          {/* Summary before submit */}
          <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Your Case Summary</h3>
            <ul className="text-sm space-y-1">
              <li className="text-white">
                <span className="text-gray-400">Case Type:</span>{' '}
                {form.subcategoryLabel || form.categoryLabel}
              </li>
              <li className="text-white">
                <span className="text-gray-400">State:</span> {form.stateName} ({form.stateCode})
              </li>
              {form.description && (
                <li className="text-white">
                  <span className="text-gray-400">Description:</span>{' '}
                  {form.description.slice(0, 100)}
                  {form.description.length > 100 ? '...' : ''}
                </li>
              )}
              {form.injuries.length > 0 && (
                <li className="text-white">
                  <span className="text-gray-400">Injuries:</span>{' '}
                  {form.injuries
                    .map((id) => INJURY_TYPES.find((i) => i.id === id)?.label.split('(')[0].trim())
                    .join(', ')}
                </li>
              )}
            </ul>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 mb-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing cases...
              </>
            ) : (
              <>
                <Scale className="w-5 h-5" />
                Get My Case Estimate
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────── */}
      {step === 'results' && estimate && (
        <div>
          <button
            onClick={() => goTo(4)}
            className="text-sm text-indigo-400 hover:text-indigo-300 mb-6 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Modify my inputs
          </button>
          <CaseEstimateResult
            estimate={estimate}
            specialtySlug={form.subcategory || form.category || ''}
            specialtyName={form.subcategoryLabel || form.categoryLabel}
            stateCode={form.stateCode}
            stateName={form.stateName}
          />
        </div>
      )}
    </div>
  )
}
