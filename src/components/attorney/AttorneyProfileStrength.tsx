'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Check } from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'

interface CriterionResult {
  label: string
  met: boolean
  points: number
}

function computeProfileStrength(attorney: LegacyAttorney): { score: number; criteria: CriterionResult[] } {
  const criteria: CriterionResult[] = [
    { label: 'Name', met: !!attorney.business_name, points: 10 },
    { label: 'Description', met: !!attorney.description && attorney.description.length > 50, points: 15 },
    { label: 'Phone', met: !!attorney.phone, points: 10 },
    { label: 'Email', met: !!attorney.email, points: 5 },
    { label: 'Verified', met: !!attorney.is_verified, points: 15 },
    { label: 'Services', met: attorney.services.length > 0, points: 10 },
    { label: 'Fees', met: attorney.service_prices.length > 0, points: 10 },
    { label: 'Portfolio', met: !!(attorney.portfolio && attorney.portfolio.length > 0), points: 10 },
    { label: 'Reviews', met: attorney.average_rating > 0, points: 10 },
    { label: 'Experience', met: !!attorney.creation_date, points: 5 },
  ]

  const score = criteria.reduce((sum, c) => sum + (c.met ? c.points : 0), 0)
  return { score, criteria }
}

function getBarColor(score: number): string {
  if (score >= 90) return 'from-green-400 to-green-500'
  if (score >= 70) return 'from-clay-400 to-clay-500'
  return 'from-amber-400 to-amber-500'
}

function getTextColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-clay-600'
  return 'text-amber-600'
}

export function AttorneyProfileStrength({ attorney }: { attorney: LegacyAttorney }) {
  const reducedMotion = useReducedMotion()
  const { score, criteria } = useMemo(() => computeProfileStrength(attorney), [attorney])

  // Don't render for weak profiles
  if (score < 50) return null

  const metCriteria = criteria.filter(c => c.met)

  return (
    <div className="bg-[#FFFCF8] rounded-2xl border border-stone-200/60 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900">Profile strength</span>
        <span className={`text-sm font-bold ${getTextColor(score)}`}>{score}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-sand-200 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: `${score}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor(score)}`}
        />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {metCriteria.map(c => (
          <span
            key={c.label}
            className="inline-flex items-center gap-0.5 text-xs text-slate-500 bg-sand-100 rounded-full px-2 py-0.5"
          >
            <Check className="w-3 h-3 text-green-500" />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
