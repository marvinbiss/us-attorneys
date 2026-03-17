'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ChevronDown, Info } from 'lucide-react'
import {
  FACTOR_LABELS,
  FACTOR_DESCRIPTIONS,
  WEIGHTS,
  type TrustFactor,
} from '@/lib/trust-score'

// ── Types ───────────────────────────────────────────────────────────

interface TrustScoreProps {
  score: number
  breakdown?: Record<string, number>
  /** Compact badge mode for listing cards */
  variant?: 'full' | 'badge'
}

// ── Helpers ─────────────────────────────────────────────────────────

function getScoreColor(score: number): {
  text: string
  bg: string
  bar: string
  border: string
  ring: string
} {
  if (score >= 7) {
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
      border: 'border-emerald-200',
      ring: 'ring-emerald-100',
    }
  }
  if (score >= 4) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
      border: 'border-amber-200',
      ring: 'ring-amber-100',
    }
  }
  return {
    text: 'text-red-700',
    bg: 'bg-red-50',
    bar: 'bg-gradient-to-r from-red-400 to-red-500',
    border: 'border-red-200',
    ring: 'ring-red-100',
  }
}

function getScoreLabel(score: number): string {
  if (score >= 9) return 'Exceptional'
  if (score >= 7) return 'Highly Trusted'
  if (score >= 5) return 'Trusted'
  if (score >= 3) return 'Building Trust'
  return 'New Profile'
}

// ── Badge variant (for AttorneyCard listings) ───────────────────────

function TrustScoreBadge({ score }: { score: number }) {
  const colors = getScoreColor(score)

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg} ${colors.border} border text-xs font-semibold ${colors.text}`}
      title={`Trust Score: ${score}/10 - ${getScoreLabel(score)}`}
      aria-label={`Trust Score ${score} out of 10`}
    >
      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{score}</span>
      <span className="text-[10px] font-normal opacity-70">/10</span>
    </div>
  )
}

// ── Factor bar (single row in breakdown) ────────────────────────────

function FactorBar({
  factor,
  value,
}: {
  factor: TrustFactor
  value: number
}) {
  const label = FACTOR_LABELS[factor]
  const description = FACTOR_DESCRIPTIONS[factor]
  const weight = WEIGHTS[factor]
  const percentage = (value / 10) * 100
  const colors = getScoreColor(value)

  return (
    <div className="group" title={description}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-700 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-normal">
            weight {weight}x
          </span>
          <span className={`text-sm font-semibold ${colors.text}`}>
            {value.toFixed(0)}/10
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${colors.bar}`}
        />
      </div>
    </div>
  )
}

// ── Full variant (for attorney profile page) ────────────────────────

function TrustScoreFull({
  score,
  breakdown,
}: {
  score: number
  breakdown?: Record<string, number>
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const colors = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)
  const percentage = (score / 10) * 100

  // Order factors by weight (highest first)
  const orderedFactors = Object.keys(WEIGHTS).sort(
    (a, b) => WEIGHTS[b as TrustFactor] - WEIGHTS[a as TrustFactor],
  ) as TrustFactor[]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-xl font-semibold text-gray-900 font-heading flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-clay-50 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-clay-400" aria-hidden="true" />
          </div>
          Trust Score
        </h2>
      </div>

      <div className="px-6 pb-6 pt-3">
        {/* Score display */}
        <div className="flex items-center gap-6 mb-4">
          {/* Large score number */}
          <div
            className={`flex items-baseline gap-1 ${colors.text}`}
            aria-label={`Trust Score: ${score} out of 10`}
          >
            <span className="text-5xl font-bold tracking-tight">{score.toFixed(1)}</span>
            <span className="text-lg font-medium text-slate-400">/ 10</span>
          </div>

          {/* Progress bar + label */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-semibold ${colors.text}`}>
                {scoreLabel}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${colors.bar}`}
              />
            </div>
          </div>
        </div>

        {/* How is this calculated? */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-clay-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 rounded-lg px-2 py-1.5 -ml-2"
          aria-expanded={isExpanded}
          aria-controls="trust-score-breakdown"
        >
          <Info className="w-4 h-4" aria-hidden="true" />
          How is this calculated?
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Expandable breakdown */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              id="trust-score-breakdown"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 pt-4 border-t border-stone-200/60">
                <p className="text-xs text-slate-500 mb-3">
                  This score is calculated from publicly verifiable data. No
                  payment can influence it.
                </p>
                {orderedFactors.map((factor) => (
                  <FactorBar
                    key={factor}
                    factor={factor}
                    value={breakdown?.[factor] ?? 0}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Exported component ──────────────────────────────────────────────

export function TrustScore({ score, breakdown, variant = 'full' }: TrustScoreProps) {
  if (score <= 0) return null

  if (variant === 'badge') {
    return <TrustScoreBadge score={score} />
  }

  return <TrustScoreFull score={score} breakdown={breakdown} />
}

export default TrustScore
