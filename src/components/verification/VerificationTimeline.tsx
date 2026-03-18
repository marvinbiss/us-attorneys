'use client'

import {
  FileText,
  ShieldCheck,
  UserCheck,
  BadgeCheck,
  Check,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────

export interface VerificationStep {
  id: string
  label: string
  description: string
  completedAt?: string
  status: 'completed' | 'current' | 'upcoming'
}

interface VerificationTimelineProps {
  steps?: VerificationStep[]
  /** If provided, auto-generates default steps based on current step index (0-3) */
  currentStepIndex?: number
  /** Dates for each step (parallel to the default 4 steps) */
  stepDates?: (string | undefined)[]
  /** Compact: single-line summary instead of full timeline */
  compact?: boolean
}

// ─── Default Steps ──────────────────────────────────────────────────

const DEFAULT_STEPS = [
  {
    id: 'submitted',
    label: 'Claim Submitted',
    description: 'Attorney submitted a profile claim with bar credentials',
    icon: FileText,
  },
  {
    id: 'bar_check',
    label: 'Bar License Check',
    description: 'Verified against official state bar records',
    icon: ShieldCheck,
  },
  {
    id: 'identity',
    label: 'Identity Verified',
    description: 'Attorney identity confirmed through supporting documentation',
    icon: UserCheck,
  },
  {
    id: 'profile',
    label: 'Profile Verified',
    description: 'Complete profile review and public badge issued',
    icon: BadgeCheck,
  },
]

// ─── Component ──────────────────────────────────────────────────────

export function VerificationTimeline({
  steps,
  currentStepIndex,
  stepDates,
  compact = false,
}: VerificationTimelineProps) {
  // Build steps from props or defaults
  const resolvedSteps: VerificationStep[] = steps || DEFAULT_STEPS.map((def, i) => {
    const idx = currentStepIndex ?? -1
    let status: VerificationStep['status'] = 'upcoming'
    if (i < idx) status = 'completed'
    else if (i === idx) status = 'current'

    return {
      id: def.id,
      label: def.label,
      description: def.description,
      completedAt: stepDates?.[i] || undefined,
      status,
    }
  })

  const completedCount = resolvedSteps.filter((s) => s.status === 'completed').length
  const totalSteps = resolvedSteps.length
  const progressPct = totalSteps > 0 ? Math.round(((completedCount + (resolvedSteps.some(s => s.status === 'current') ? 0.5 : 0)) / totalSteps) * 100) : 0

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-gray-400 whitespace-nowrap">
          {completedCount}/{totalSteps} steps
        </span>
      </div>
    )
  }

  return (
    <div
      className="bg-[#FFFCF8] dark:bg-gray-900 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 overflow-hidden"
      role="list"
      aria-label="Verification progress"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200/40 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-clay-400" aria-hidden="true" />
          Verification Progress
        </h3>
        <span className="text-xs font-medium text-slate-400 dark:text-gray-500">
          {completedCount} of {totalSteps} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Verification ${progressPct}% complete`}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 py-5">
        <ol className="relative space-y-0">
          {resolvedSteps.map((step, i) => {
            const isLast = i === resolvedSteps.length - 1
            const StepIcon = DEFAULT_STEPS[i]?.icon || ShieldCheck

            return (
              <li
                key={step.id}
                role="listitem"
                className="relative flex gap-4"
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`absolute left-[17px] top-10 w-0.5 h-[calc(100%-16px)] ${
                      step.status === 'completed'
                        ? 'bg-emerald-300 dark:bg-emerald-700'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    aria-hidden="true"
                  />
                )}

                {/* Step indicator */}
                <div className="flex-shrink-0 z-10">
                  {step.status === 'completed' ? (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center ring-4 ring-[#FFFCF8] dark:ring-gray-900">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    </div>
                  ) : step.status === 'current' ? (
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center ring-4 ring-[#FFFCF8] dark:ring-gray-900 animate-pulse">
                      <StepIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-4 ring-[#FFFCF8] dark:ring-gray-900">
                      <StepIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${
                      step.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : step.status === 'current'
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {step.status === 'current' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    step.status === 'upcoming'
                      ? 'text-gray-400 dark:text-gray-600'
                      : 'text-slate-500 dark:text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                  {step.completedAt && (
                    <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">
                      {formatDate(step.completedAt)}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export default VerificationTimeline
