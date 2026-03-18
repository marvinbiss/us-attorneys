'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import OnboardingStep from '@/components/attorney-dashboard/OnboardingStep'
import {
  Sparkles,
  Shield,
  UserCircle,
  Scale,
  Clock,
  CreditCard,
  Search,
  Check,
  Loader2,
  PartyPopper,
  Camera,
  Phone,
  MapPin,
  Building2,
  FileText,
  Star,
  Crown,
  Zap,
  Sun,
  Sunset,
  Moon,
  Home,
  X,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface OnboardingProgress {
  currentStep: number
  completedAt: string | null
  profileCompletionPct: number
  stepsCompleted: Record<string, boolean>
  onboardingData: Record<string, unknown>
  attorney: {
    id: string
    name: string | null
    barNumber: string | null
    barState: string | null
    phone: string | null
    addressCity: string | null
    addressState: string | null
    addressZip: string | null
    description: string | null
    firmName: string | null
    isVerified: boolean
    primarySpecialtyId: string | null
  }
}

interface Specialty {
  id: string
  name: string
  slug: string
  category: string | null
}

interface DayAvailability {
  morning: boolean
  afternoon: boolean
  evening: boolean
}

type WeekSchedule = Record<string, DayAvailability>

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: Sparkles },
  { id: 'bar_verification', label: 'Bar Verification', icon: Shield },
  { id: 'profile_basics', label: 'Profile Basics', icon: UserCircle },
  { id: 'practice_areas', label: 'Practice Areas', icon: Scale },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'choose_plan', label: 'Choose Plan', icon: CreditCard },
] as const

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
] as const

const DEFAULT_SCHEDULE: WeekSchedule = Object.fromEntries(
  DAYS.map(day => [day, { morning: true, afternoon: true, evening: false }])
)

// ─── Progress Bar Component ─────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const reducedMotion = useReducedMotion()
  const pct = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Step {current} of {total}
        </span>
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
          initial={reducedMotion ? { width: `${pct}%` } : { width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      {/* Step dots */}
      <div className="flex items-center justify-between mt-3 px-1">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon
          const isCompleted = i + 1 < current
          const isCurrent = i + 1 === current
          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-1"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                    : isCurrent
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-300 dark:ring-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <StepIcon className="w-4 h-4" aria-hidden="true" />
                )}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Confetti Effect ────────────────────────────────────────────────────────

function useConfetti() {
  const firedRef = useRef(false)

  const fire = useCallback(() => {
    if (firedRef.current) return
    firedRef.current = true

    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default
      // Left burst
      confetti({ particleCount: 80, spread: 70, origin: { x: 0.2, y: 0.6 } })
      // Right burst
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { x: 0.8, y: 0.6 } })
      }, 150)
      // Center rain
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 100, origin: { x: 0.5, y: 0.4 }, gravity: 0.8 })
      }, 300)
    })
  }, [])

  return fire
}

// ─── Step 1: Welcome ────────────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <div className="text-center max-w-xl mx-auto">
      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
        <Scale className="w-12 h-12 text-white" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        Welcome to US Attorneys!
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
        Let&apos;s set up your profile in about 5 minutes. A complete profile helps you
        appear higher in search results and builds trust with potential clients.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        {[
          { icon: Shield, title: 'Verified Badge', desc: 'Verify your bar number for a trusted profile' },
          { icon: Search, title: 'Get Found', desc: 'Appear in search results for your practice areas' },
          { icon: Star, title: 'Build Trust', desc: 'Showcase your expertise and collect reviews' },
        ].map((item) => (
          <div key={item.title} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Bar Verification ───────────────────────────────────────────────

function BarVerificationStep({
  barNumber,
  barState,
  onBarNumberChange,
  onBarStateChange,
}: {
  barNumber: string
  barState: string
  onBarNumberChange: (v: string) => void
  onBarStateChange: (v: string) => void
}) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Verifying your bar number earns you a <strong>Verified Attorney</strong> badge,
          boosting your credibility and search ranking.
        </p>
      </div>

      <div>
        <label htmlFor="bar-state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Bar Admission State
        </label>
        <select
          id="bar-state"
          value={barState}
          onChange={(e) => onBarStateChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select state...</option>
          {US_STATES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bar-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Bar Number
        </label>
        <input
          id="bar-number"
          type="text"
          value={barNumber}
          onChange={(e) => onBarNumberChange(e.target.value)}
          placeholder="e.g., 12345678"
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Your bar number will be verified against public state bar records.
        You can also <Link href="/attorney-dashboard/profile" className="text-blue-600 hover:underline">claim an existing profile</Link> if one already exists.
      </p>
    </div>
  )
}

// ─── Step 3: Profile Basics ─────────────────────────────────────────────────

function ProfileBasicsStep({
  name, phone, bio, addressCity, addressState, addressZip, firmName,
  onChange,
}: {
  name: string; phone: string; bio: string; addressCity: string; addressState: string; addressZip: string; firmName: string
  onChange: (field: string, value: string) => void
}) {
  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Photo placeholder */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <Camera className="w-6 h-6 text-gray-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Photo</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            You can upload a photo later from your profile settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ob-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <UserCircle className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
            Full Name *
          </label>
          <input
            id="ob-name"
            type="text"
            value={name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="John Smith"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="ob-firm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <Building2 className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
            Firm Name
          </label>
          <input
            id="ob-firm"
            type="text"
            value={firmName}
            onChange={(e) => onChange('firmName', e.target.value)}
            placeholder="Smith & Associates"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ob-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <Phone className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
          Phone Number *
        </label>
        <input
          id="ob-phone"
          type="tel"
          value={phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="(555) 123-4567"
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="ob-city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <MapPin className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
            City *
          </label>
          <input
            id="ob-city"
            type="text"
            value={addressCity}
            onChange={(e) => onChange('addressCity', e.target.value)}
            placeholder="New York"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="ob-state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            State
          </label>
          <select
            id="ob-state"
            value={addressState}
            onChange={(e) => onChange('addressState', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">State</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ob-zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            ZIP Code
          </label>
          <input
            id="ob-zip"
            type="text"
            value={addressZip}
            onChange={(e) => onChange('addressZip', e.target.value)}
            placeholder="10001"
            maxLength={10}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ob-bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <FileText className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
          Short Bio
        </label>
        <textarea
          id="ob-bio"
          value={bio}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder="Describe your practice, experience, and what makes you stand out..."
          rows={4}
          maxLength={2000}
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{bio.length}/2000 characters</p>
      </div>
    </div>
  )
}

// ─── Step 4: Practice Areas ─────────────────────────────────────────────────

function PracticeAreasStep({
  specialties,
  selectedIds,
  primaryId,
  searchTerm,
  onSearchChange,
  onToggle,
  onSetPrimary,
  loading,
}: {
  specialties: Specialty[]
  selectedIds: Set<string>
  primaryId: string | null
  searchTerm: string
  onSearchChange: (v: string) => void
  onToggle: (id: string) => void
  onSetPrimary: (id: string) => void
  loading: boolean
}) {
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return specialties
    const lower = searchTerm.toLowerCase()
    return specialties.filter(s => s.name.toLowerCase().includes(lower) || (s.category?.toLowerCase().includes(lower) ?? false))
  }, [specialties, searchTerm])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Specialty[]>()
    for (const s of filtered) {
      const cat = s.category || 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(s)
    }
    return map
  }, [filtered])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search practice areas..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
        />
      </div>

      {/* Selected count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {selectedIds.size} selected
        {primaryId && ' (click star to change primary)'}
      </p>

      {/* Practice areas grid */}
      <div className="max-h-[400px] overflow-y-auto space-y-6 pr-1 scrollbar-thin">
        {Array.from(grouped.entries()).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              {category}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((specialty) => {
                const selected = selectedIds.has(specialty.id)
                const isPrimary = specialty.id === primaryId
                return (
                  <button
                    key={specialty.id}
                    type="button"
                    onClick={() => onToggle(specialty.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all border ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      selected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selected && <Check className="w-3 h-3" aria-hidden="true" />}
                    </span>
                    <span className="flex-1 truncate">{specialty.name}</span>
                    {selected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSetPrimary(specialty.id)
                        }}
                        className={`p-1 rounded transition-colors ${
                          isPrimary ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                        }`}
                        title={isPrimary ? 'Primary specialty' : 'Set as primary'}
                        aria-label={isPrimary ? `${specialty.name} is your primary specialty` : `Set ${specialty.name} as primary`}
                      >
                        <Star className={`w-4 h-4 ${isPrimary ? 'fill-current' : ''}`} aria-hidden="true" />
                      </button>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No practice areas matching &ldquo;{searchTerm}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Step 5: Availability ───────────────────────────────────────────────────

function AvailabilityStep({
  schedule,
  onToggle,
}: {
  schedule: WeekSchedule
  onToggle: (day: string, slot: 'morning' | 'afternoon' | 'evening') => void
}) {
  const slots = [
    { key: 'morning' as const, label: 'Morning', sublabel: '8am-12pm', icon: Sun },
    { key: 'afternoon' as const, label: 'Afternoon', sublabel: '12pm-5pm', icon: Sunset },
    { key: 'evening' as const, label: 'Evening', sublabel: '5pm-8pm', icon: Moon },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
        Set your weekly availability so clients know when they can reach you.
      </p>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div />
          {slots.map((slot) => (
            <div key={slot.key} className="text-center">
              <slot.icon className="w-4 h-4 mx-auto mb-1 text-gray-400" aria-hidden="true" />
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{slot.label}</p>
              <p className="text-[10px] text-gray-400">{slot.sublabel}</p>
            </div>
          ))}
        </div>

        {DAYS.map((day) => (
          <div key={day} className="grid grid-cols-4 gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{day}</span>
            </div>
            {slots.map((slot) => {
              const active = schedule[day]?.[slot.key] ?? false
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => onToggle(day, slot.key)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                    active
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-green-200'
                  }`}
                  aria-pressed={active}
                  aria-label={`${day} ${slot.label}: ${active ? 'available' : 'unavailable'}`}
                >
                  {active ? 'Available' : '-'}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {DAYS.map((day) => (
          <div key={day} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{day}</p>
            <div className="flex gap-2">
              {slots.map((slot) => {
                const active = schedule[day]?.[slot.key] ?? false
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => onToggle(day, slot.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                      active
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                    }`}
                    aria-pressed={active}
                  >
                    <slot.icon className="w-3.5 h-3.5 mx-auto mb-0.5" aria-hidden="true" />
                    {slot.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 6: Choose Plan ────────────────────────────────────────────────────

function ChoosePlanStep({
  selectedPlan,
  onSelect,
}: {
  selectedPlan: string
  onSelect: (plan: string) => void
}) {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      icon: Zap,
      badge: null,
      features: [
        'Receive leads and consultation requests',
        'Send quotes to clients',
        'Messaging with clients',
        'Portfolio photos of your work',
        'Client review management',
        'Verified profile badge',
        'Activity statistics',
        'Email support',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$49',
      period: '/month',
      icon: Star,
      badge: 'Most Popular',
      features: [
        'Everything in Free plan',
        'Featured placement in search results',
        '"Pro Attorney" badge on profile',
        'Advanced statistics and reports',
        'Priority on leads in your area',
        'Priority phone support',
      ],
      cta: 'Start 14-Day Trial',
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$99',
      period: '/month',
      icon: Crown,
      badge: null,
      features: [
        'Everything in Pro plan',
        'Guaranteed top position in results',
        'Gold "Premium Attorney" badge',
        'Exclusive leads in your area',
        'Custom profile page',
        'Dedicated account manager',
        'Early access to new features',
      ],
      cta: 'Start 14-Day Trial',
      popular: false,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const Icon = plan.icon
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                  : plan.popular
                  ? 'border-blue-200 dark:border-blue-800 hover:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} aria-hidden="true" />
                <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
              </div>

              <div className="mb-4">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className={`w-full py-2 rounded-lg text-center text-sm font-semibold transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {isSelected ? 'Selected' : plan.cta}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
        You can change your plan at any time from account settings. No credit card required for the free plan.
      </p>
    </div>
  )
}

// ─── Completion Screen ──────────────────────────────────────────────────────

function CompletionScreen() {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
      className="text-center max-w-lg mx-auto py-12"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
        <PartyPopper className="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        You&apos;re All Set!
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
        Your profile is now live. Clients in your area can find you, send consultation requests,
        and book appointments. Keep your profile updated for the best results.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/attorney-dashboard/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Go to Dashboard
        </Link>
        <Link
          href="/attorney-dashboard/profile"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <UserCircle className="w-4 h-4" aria-hidden="true" />
          Edit Profile
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Main Onboarding Page ───────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fireConfetti = useConfetti()
  const reducedMotion = useReducedMotion()

  // State
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Step 2: Bar verification
  const [barNumber, setBarNumber] = useState('')
  const [barState, setBarState] = useState('')

  // Step 3: Profile basics
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressState, setAddressState] = useState('')
  const [addressZip, setAddressZip] = useState('')
  const [firmName, setFirmName] = useState('')

  // Step 4: Practice areas
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [selectedPAs, setSelectedPAs] = useState<Set<string>>(new Set())
  const [primaryPA, setPrimaryPA] = useState<string | null>(null)
  const [paSearch, setPaSearch] = useState('')
  const [paLoading, setPaLoading] = useState(false)

  // Step 5: Availability
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE)

  // Step 6: Plan
  const [selectedPlan, setSelectedPlan] = useState('free')

  // ─── Load onboarding progress ─────────────────────────────────────────────

  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch('/api/attorney/onboarding')
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login?redirect=/attorney-dashboard/onboarding')
            return
          }
          throw new Error('Failed to load')
        }
        const result = await res.json()
        if (!result.success) throw new Error(result.error?.message || 'Failed')

        const data = result.data as OnboardingProgress

        // If already completed, redirect to dashboard
        if (data.completedAt) {
          router.push('/attorney-dashboard/dashboard')
          return
        }

        // Restore saved data
        const att = data.attorney
        if (att.barNumber) setBarNumber(att.barNumber)
        if (att.barState) setBarState(att.barState)
        if (att.name) setName(att.name)
        if (att.phone) setPhone(att.phone)
        if (att.description) setBio(att.description)
        if (att.addressCity) setAddressCity(att.addressCity)
        if (att.addressState) setAddressState(att.addressState)
        if (att.addressZip) setAddressZip(att.addressZip)
        if (att.firmName) setFirmName(att.firmName)
        if (att.primarySpecialtyId) {
          setPrimaryPA(att.primarySpecialtyId)
          setSelectedPAs(new Set([att.primarySpecialtyId]))
        }

        // Restore availability from onboarding data
        const obData = data.onboardingData
        if (obData.availability && typeof obData.availability === 'object') {
          const avail = obData.availability as Record<string, unknown>
          if (avail.schedule) setSchedule(avail.schedule as WeekSchedule)
        }
        if (obData.choose_plan && typeof obData.choose_plan === 'object') {
          const planData = obData.choose_plan as Record<string, unknown>
          if (planData.plan) setSelectedPlan(planData.plan as string)
        }

        // Resume from URL param or saved step
        const urlStep = searchParams.get('step')
        if (urlStep) {
          const parsed = parseInt(urlStep, 10)
          if (parsed >= 1 && parsed <= 6) {
            setCurrentStep(parsed)
          }
        } else if (data.currentStep > 0 && data.currentStep < 6) {
          setCurrentStep(data.currentStep + 1)
        }
      } catch {
        // If error, start from step 1
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [router, searchParams])

  // ─── Load specialties for step 4 ──────────────────────────────────────────

  useEffect(() => {
    if (currentStep === 4 && specialties.length === 0) {
      setPaLoading(true)
      fetch('/api/specialties')
        .then(res => res.json())
        .then(result => {
          const list = result.data || result.specialties || result
          if (Array.isArray(list)) setSpecialties(list)
        })
        .catch(() => {
          // Silently fail, user can retry
        })
        .finally(() => setPaLoading(false))
    }
  }, [currentStep, specialties.length])

  // ─── Save step data ───────────────────────────────────────────────────────

  const saveStep = useCallback(async (step: number, data?: Record<string, unknown>, isComplete = false) => {
    setSaving(true)
    try {
      const res = await fetch('/api/attorney/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          data,
          completed: isComplete,
        }),
      })
      return res.ok
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goNext = useCallback(async () => {
    setDirection('forward')
    let stepData: Record<string, unknown> | undefined

    switch (currentStep) {
      case 1:
        stepData = { acknowledged: true }
        break
      case 2:
        stepData = { barNumber, barState }
        break
      case 3:
        stepData = { name, phone, bio, addressCity, addressState, addressZip, firmName }
        break
      case 4:
        stepData = {
          primarySpecialtyId: primaryPA,
          selectedIds: Array.from(selectedPAs),
        }
        break
      case 5:
        stepData = { schedule }
        break
      case 6:
        stepData = { plan: selectedPlan }
        break
    }

    const isLast = currentStep === 6
    const saved = await saveStep(currentStep, stepData, isLast)

    if (saved) {
      if (isLast) {
        setCompleted(true)
        if (!reducedMotion) {
          fireConfetti()
        }
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 6))
      }
    }
  }, [currentStep, barNumber, barState, name, phone, bio, addressCity, addressState, addressZip, firmName, primaryPA, selectedPAs, schedule, selectedPlan, saveStep, reducedMotion, fireConfetti])

  const goBack = useCallback(() => {
    setDirection('backward')
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  const skipStep = useCallback(async () => {
    setDirection('forward')
    await saveStep(currentStep)
    setCurrentStep(prev => Math.min(prev + 1, 6))
  }, [currentStep, saveStep])

  const handleCompleteLater = useCallback(async () => {
    await saveStep(currentStep)
    router.push('/attorney-dashboard/dashboard')
  }, [currentStep, saveStep, router])

  // ─── Profile basics change handler ────────────────────────────────────────

  const handleProfileChange = useCallback((field: string, value: string) => {
    switch (field) {
      case 'name': setName(value); break
      case 'phone': setPhone(value); break
      case 'bio': setBio(value); break
      case 'addressCity': setAddressCity(value); break
      case 'addressState': setAddressState(value); break
      case 'addressZip': setAddressZip(value); break
      case 'firmName': setFirmName(value); break
    }
  }, [])

  // ─── Practice area handlers ───────────────────────────────────────────────

  const togglePA = useCallback((id: string) => {
    setSelectedPAs(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (primaryPA === id) setPrimaryPA(null)
      } else {
        next.add(id)
        if (!primaryPA) setPrimaryPA(id)
      }
      return next
    })
  }, [primaryPA])

  const setPrimaryPAHandler = useCallback((id: string) => {
    setPrimaryPA(id)
    setSelectedPAs(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  // ─── Availability handler ─────────────────────────────────────────────────

  const toggleAvailability = useCallback((day: string, slot: 'morning' | 'afternoon' | 'evening') => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: !prev[day]?.[slot],
      },
    }))
  }, [])

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading onboarding...</p>
        </div>
      </div>
    )
  }

  // ─── Completed state ──────────────────────────────────────────────────────

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <CompletionScreen />
        </div>
      </div>
    )
  }

  // ─── Step content ─────────────────────────────────────────────────────────

  const stepConfig = STEPS[currentStep - 1]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/attorney-dashboard/dashboard"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Exit Setup</span>
            </Link>
            <button
              type="button"
              onClick={handleCompleteLater}
              disabled={saving}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors"
            >
              Complete Later
            </button>
          </div>
          <ProgressBar current={currentStep} total={6} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <OnboardingStep
          stepNumber={currentStep}
          totalSteps={6}
          title={
            currentStep === 1 ? 'Get Started' :
            currentStep === 2 ? 'Verify Your Bar License' :
            currentStep === 3 ? 'Your Profile' :
            currentStep === 4 ? 'Practice Areas' :
            currentStep === 5 ? 'Your Availability' :
            'Choose Your Plan'
          }
          description={
            currentStep === 1 ? "Let's set up your profile in about 5 minutes" :
            currentStep === 2 ? 'Enter your bar number and state for a verified badge' :
            currentStep === 3 ? 'Add your contact info and a short bio' :
            currentStep === 4 ? 'Select your practice areas and mark your primary specialty' :
            currentStep === 5 ? 'Set your weekly schedule so clients know when to reach you' :
            'Select the plan that works best for your practice'
          }
          icon={stepConfig.icon}
          onNext={goNext}
          onBack={goBack}
          onSkip={skipStep}
          isFirst={currentStep === 1}
          isLast={currentStep === 6}
          nextDisabled={saving}
          nextLoading={saving}
          skippable={currentStep >= 2 && currentStep <= 5}
          direction={direction}
          nextLabel={currentStep === 1 ? "Let's Go!" : currentStep === 6 ? 'Complete Setup' : undefined}
        >
          {currentStep === 1 && <WelcomeStep />}

          {currentStep === 2 && (
            <BarVerificationStep
              barNumber={barNumber}
              barState={barState}
              onBarNumberChange={setBarNumber}
              onBarStateChange={setBarState}
            />
          )}

          {currentStep === 3 && (
            <ProfileBasicsStep
              name={name}
              phone={phone}
              bio={bio}
              addressCity={addressCity}
              addressState={addressState}
              addressZip={addressZip}
              firmName={firmName}
              onChange={handleProfileChange}
            />
          )}

          {currentStep === 4 && (
            <PracticeAreasStep
              specialties={specialties}
              selectedIds={selectedPAs}
              primaryId={primaryPA}
              searchTerm={paSearch}
              onSearchChange={setPaSearch}
              onToggle={togglePA}
              onSetPrimary={setPrimaryPAHandler}
              loading={paLoading}
            />
          )}

          {currentStep === 5 && (
            <AvailabilityStep
              schedule={schedule}
              onToggle={toggleAvailability}
            />
          )}

          {currentStep === 6 && (
            <ChoosePlanStep
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
            />
          )}
        </OnboardingStep>
      </div>
    </div>
  )
}
