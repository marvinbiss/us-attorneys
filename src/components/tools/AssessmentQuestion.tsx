'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  ArrowLeft,
  Users, Briefcase, Shield, Globe, Home, Building, MoreHorizontal,
  Car, AlertTriangle, Stethoscope, HardHat, Package, Heart, FileText,
  Gavel, Baby, DollarSign, Scroll, ShieldCheck, FileCheck,
  Building2, Lightbulb, Calculator, Store, TrendingDown,
  AlertOctagon, ShieldAlert, ShieldOff,
  CreditCard, Flag, XCircle, Map, DoorOpen, Hammer, Lock,
  Megaphone, UserX, Ban, Leaf, Scale, GraduationCap, Music,
  Clock, Zap, Calendar, Trash2, Circle,
  type LucideIcon,
} from 'lucide-react'
import type { Category, SubCategory, UrgencyLevel } from '@/lib/diagnostic/assessment-engine'
import { US_STATES } from '@/lib/geography'

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Users, Briefcase, Shield, Globe, Home, Building, MoreHorizontal,
  Car, AlertTriangle, Stethoscope, HardHat, Package, Heart, FileText,
  Gavel, Baby, DollarSign, Scroll, ShieldCheck, FileCheck,
  Building2, Lightbulb, Calculator, Store, TrendingDown,
  AlertOctagon, ShieldAlert, ShieldOff,
  CreditCard, Flag, XCircle, Map, DoorOpen, Hammer, Lock,
  Megaphone, UserX, Ban, Leaf, Scale, GraduationCap, Music,
  // Fallback aliases for icons that may not exist in lucide-react v0.294:
  Wine: AlertTriangle, Pill: Circle, Eraser: Trash2,
  Combine: Building2, FileWarning: AlertTriangle, Banknote: DollarSign,
  Receipt: FileText, Accessibility: Users,
}

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || FileText
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  canGoBack: boolean
}

interface CategoryStepProps {
  categories: Category[]
  onSelect: (category: Category) => void
  direction: number
}

interface SubCategoryStepProps {
  category: Category
  onSelect: (subCategory: SubCategory) => void
  direction: number
}

interface TimelineStepProps {
  onSelect: (months: number) => void
  direction: number
}

interface StateStepProps {
  onSelect: (stateCode: string) => void
  direction: number
}

interface UrgencyStepProps {
  onSelect: (urgency: UrgencyLevel) => void
  direction: number
}

// ---------------------------------------------------------------------------
// Slide animation variants
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

const slideTransition = {
  x: { type: 'spring' as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

export function ProgressBar({ currentStep, totalSteps, onBack, canGoBack }: ProgressBarProps) {
  const prefersReducedMotion = useReducedMotion()
  const pct = ((currentStep) / totalSteps) * 100
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Step {currentStep} of {totalSteps}
        </span>
        {canGoBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-cta-600 hover:text-cta-700 dark:text-cta-400 dark:hover:text-cta-300 transition-colors"
            aria-label="Go back to previous step"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cta-500 to-cta-600 rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Category
// ---------------------------------------------------------------------------

export function CategoryStep({ categories, onSelect, direction }: CategoryStepProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key="category-step"
        custom={direction}
        variants={prefersReducedMotion ? undefined : slideVariants}
        initial={prefersReducedMotion ? false : "enter"}
        animate="center"
        exit={prefersReducedMotion ? undefined : "exit"}
        transition={prefersReducedMotion ? { duration: 0 } : slideTransition}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
          What area does your issue relate to?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Select the category that best matches your situation. We will narrow it down in the next step.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const Icon = getIcon(cat.icon)
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat)}
                className="group relative flex items-center gap-4 p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-cta-500 dark:hover:border-cta-400 hover:shadow-lg dark:hover:shadow-cta-900/20 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                aria-label={`${cat.label}: ${cat.description}`}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cta-50 dark:bg-cta-900/30 flex items-center justify-center group-hover:bg-cta-100 dark:group-hover:bg-cta-800/40 transition-colors">
                  <Icon className="w-6 h-6 text-cta-600 dark:text-cta-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-gray-900 dark:text-white group-hover:text-cta-700 dark:group-hover:text-cta-300 transition-colors block">
                    {cat.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 block mt-0.5 line-clamp-2">
                    {cat.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Sub-category
// ---------------------------------------------------------------------------

export function SubCategoryStep({ category, onSelect, direction }: SubCategoryStepProps) {
  const prefersReducedMotion = useReducedMotion()
  const CategoryIcon = getIcon(category.icon)
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key="subcategory-step"
        custom={direction}
        variants={prefersReducedMotion ? undefined : slideVariants}
        initial={prefersReducedMotion ? false : "enter"}
        animate="center"
        exit={prefersReducedMotion ? undefined : "exit"}
        transition={prefersReducedMotion ? { duration: 0 } : slideTransition}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
          What specifically is your issue?
        </h2>
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 text-sm bg-cta-50 dark:bg-cta-900/30 text-cta-700 dark:text-cta-300 px-3 py-1 rounded-full font-medium">
            <CategoryIcon className="w-3.5 h-3.5" />
            {category.label}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {category.subCategories.map((sub) => {
            const SubIcon = getIcon(sub.icon)
            return (
              <button
                key={sub.id}
                onClick={() => onSelect(sub)}
                className="group flex items-start gap-4 p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-cta-500 dark:hover:border-cta-400 hover:shadow-lg dark:hover:shadow-cta-900/20 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                aria-label={`${sub.label}: ${sub.description}`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-cta-50 dark:group-hover:bg-cta-900/30 transition-colors mt-0.5">
                  <SubIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-cta-600 dark:group-hover:text-cta-400 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-gray-900 dark:text-white group-hover:text-cta-700 dark:group-hover:text-cta-300 transition-colors block">
                    {sub.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 block">
                    {sub.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Timeline
// ---------------------------------------------------------------------------

const TIMELINE_OPTIONS = [
  { label: 'Less than 1 month ago', months: 1, icon: Zap, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  { label: '1 to 6 months ago', months: 3, icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  { label: '6 months to 1 year ago', months: 9, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
  { label: '1 to 2 years ago', months: 18, icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  { label: 'More than 2 years ago', months: 30, icon: Calendar, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-700' },
  { label: 'It hasn\'t happened yet (planning ahead)', months: 0, icon: Calendar, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
]

export function TimelineStep({ onSelect, direction }: TimelineStepProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key="timeline-step"
        custom={direction}
        variants={prefersReducedMotion ? undefined : slideVariants}
        initial={prefersReducedMotion ? false : "enter"}
        animate="center"
        exit={prefersReducedMotion ? undefined : "exit"}
        transition={prefersReducedMotion ? { duration: 0 } : slideTransition}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
          When did this happen?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This helps us assess any potential deadline for your case (statute of limitations).
        </p>
        <div className="grid grid-cols-1 gap-3">
          {TIMELINE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.months}
                onClick={() => onSelect(opt.months)}
                className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-cta-500 dark:hover:border-cta-400 hover:shadow-lg dark:hover:shadow-cta-900/20 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${opt.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <span className="font-medium text-gray-900 dark:text-white group-hover:text-cta-700 dark:group-hover:text-cta-300 transition-colors">
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Step 4: State
// ---------------------------------------------------------------------------

const TOP_STATES = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA']

export function StateStep({ onSelect, direction }: StateStepProps) {
  const prefersReducedMotion = useReducedMotion()
  const stateEntries = Object.entries(US_STATES).filter(([code]) => {
    // Exclude territories for the main list, they appear at the bottom
    return !['PR', 'GU', 'VI', 'AS', 'MP', 'UM'].includes(code)
  })

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key="state-step"
        custom={direction}
        variants={prefersReducedMotion ? undefined : slideVariants}
        initial={prefersReducedMotion ? false : "enter"}
        animate="center"
        exit={prefersReducedMotion ? undefined : "exit"}
        transition={prefersReducedMotion ? { duration: 0 } : slideTransition}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
          What state are you in?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your state affects jurisdiction, local laws, and statute of limitations.
        </p>

        {/* Popular states (quick picks) */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Most Common</p>
          <div className="flex flex-wrap gap-2">
            {TOP_STATES.map((code) => (
              <button
                key={code}
                onClick={() => onSelect(code)}
                className="px-4 py-2.5 bg-cta-50 dark:bg-cta-900/30 border border-cta-200 dark:border-cta-800 rounded-xl text-cta-700 dark:text-cta-300 font-medium text-sm hover:bg-cta-100 dark:hover:bg-cta-800/50 hover:border-cta-300 dark:hover:border-cta-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-500"
              >
                {US_STATES[code]}
              </button>
            ))}
          </div>
        </div>

        {/* All states dropdown */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">All States</p>
          <select
            onChange={(e) => { if (e.target.value) onSelect(e.target.value) }}
            defaultValue=""
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:border-cta-500 dark:focus:border-cta-400 focus:ring-2 focus:ring-cta-500/20 outline-none transition-all text-base appearance-none cursor-pointer"
            aria-label="Select your state"
          >
            <option value="" disabled>Select your state...</option>
            {stateEntries.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
            <option disabled>----</option>
            <option value="PR">Puerto Rico</option>
            <option value="GU">Guam</option>
            <option value="VI">U.S. Virgin Islands</option>
          </select>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Step 5: Urgency
// ---------------------------------------------------------------------------

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; description: string; icon: LucideIcon; colorClasses: string; bgClasses: string }[] = [
  {
    value: 'immediate',
    label: 'Immediate',
    description: 'I need legal help right now or within days',
    icon: Zap,
    colorClasses: 'text-red-600 dark:text-red-400',
    bgClasses: 'bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100 dark:group-hover:bg-red-800/40',
  },
  {
    value: 'within-weeks',
    label: 'Within weeks',
    description: 'I have some time but want to act soon',
    icon: Clock,
    colorClasses: 'text-orange-600 dark:text-orange-400',
    bgClasses: 'bg-orange-50 dark:bg-orange-900/30 group-hover:bg-orange-100 dark:group-hover:bg-orange-800/40',
  },
  {
    value: 'planning-ahead',
    label: 'Planning ahead',
    description: 'No immediate deadline — I want to be prepared',
    icon: Calendar,
    colorClasses: 'text-green-600 dark:text-green-400',
    bgClasses: 'bg-green-50 dark:bg-green-900/30 group-hover:bg-green-100 dark:group-hover:bg-green-800/40',
  },
]

export function UrgencyStep({ onSelect, direction }: UrgencyStepProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key="urgency-step"
        custom={direction}
        variants={prefersReducedMotion ? undefined : slideVariants}
        initial={prefersReducedMotion ? false : "enter"}
        animate="center"
        exit={prefersReducedMotion ? undefined : "exit"}
        transition={prefersReducedMotion ? { duration: 0 } : slideTransition}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
          How urgent is this?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This helps us prioritize your results and flag any deadline concerns.
        </p>
        <div className="grid grid-cols-1 gap-4">
          {URGENCY_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                className="group flex items-center gap-4 p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-cta-500 dark:hover:border-cta-400 hover:shadow-lg dark:hover:shadow-cta-900/20 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${opt.bgClasses} flex items-center justify-center transition-colors`}>
                  <Icon className={`w-6 h-6 ${opt.colorClasses}`} />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white group-hover:text-cta-700 dark:group-hover:text-cta-300 transition-colors block text-lg">
                    {opt.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 block">
                    {opt.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
