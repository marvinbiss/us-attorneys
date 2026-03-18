'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle,
  Clock,
  Search,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────

type VerificationStep = 'submitted' | 'checking' | 'verified' | 'not_found' | 'suspended' | 'manual_review' | 'error'

interface VerificationStatusProps {
  /** Current verification status */
  status: VerificationStep
  /** Attorney name returned by verification (if any) */
  attorneyName?: string
  /** Bar number being verified */
  barNumber?: string
  /** State code (2 letters) */
  stateCode?: string
  /** Practice status from state bar (e.g., "Active") */
  practiceStatus?: string
  /** Admission date from state bar */
  admissionDate?: string
  /** Source of verification (e.g., "ny_open_data", "calbar") */
  source?: string
  /** When verification was last performed */
  verifiedAt?: string
  /** URL to state bar website for independent verification */
  barAssociationUrl?: string
  /** Callback to re-trigger verification */
  onRefresh?: () => void | Promise<void>
  /** Whether a refresh is in progress */
  refreshing?: boolean
  /** Additional CSS classes */
  className?: string
}

// ─── Step Configuration ─────────────────────────────────────────────

interface StepConfig {
  label: string
  description: string
  icon: typeof CheckCircle
  color: string
  bgColor: string
  borderColor: string
  iconColor: string
}

const STEP_CONFIGS: Record<VerificationStep, StepConfig> = {
  submitted: {
    label: 'Submitted',
    description: 'Your claim has been received.',
    icon: Clock,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  checking: {
    label: 'Verifying',
    description: 'Checking bar license with state bar records...',
    icon: Search,
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  verified: {
    label: 'Verified',
    description: 'Bar license confirmed active in state bar records.',
    icon: CheckCircle,
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  not_found: {
    label: 'Not Found',
    description: 'Bar number was not found in state bar records.',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  suspended: {
    label: 'Suspended',
    description: 'Bar license is currently suspended.',
    icon: AlertTriangle,
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-500 dark:text-orange-400',
  },
  manual_review: {
    label: 'Under Review',
    description: 'Queued for manual verification by an administrator.',
    icon: Clock,
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    borderColor: 'border-slate-200 dark:border-slate-800',
    iconColor: 'text-slate-500 dark:text-slate-400',
  },
  error: {
    label: 'Error',
    description: 'Automated verification is temporarily unavailable. An admin will review manually.',
    icon: AlertTriangle,
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-50 dark:bg-slate-900/20',
    borderColor: 'border-slate-200 dark:border-slate-800',
    iconColor: 'text-slate-500 dark:text-slate-400',
  },
}

// ─── Timeline Steps ─────────────────────────────────────────────────

const TIMELINE_STEPS: VerificationStep[] = ['submitted', 'checking', 'verified']

function getTimelineProgress(status: VerificationStep): number {
  if (status === 'verified') return 3
  if (status === 'checking') return 2
  if (status === 'submitted') return 1
  // For error/not_found/suspended/manual_review, show as stuck at step 2
  return 2
}

// ─── Component ──────────────────────────────────────────────────────

export function VerificationStatus({
  status,
  attorneyName,
  barNumber,
  stateCode,
  practiceStatus,
  admissionDate,
  source,
  verifiedAt,
  barAssociationUrl,
  onRefresh,
  refreshing = false,
  className,
}: VerificationStatusProps) {
  const config = STEP_CONFIGS[status]
  const Icon = config.icon
  const progress = getTimelineProgress(status)
  const [animatedStep, setAnimatedStep] = useState(0)

  // Animate timeline steps sequentially
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animatedStep < progress) {
        setAnimatedStep(prev => prev + 1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [animatedStep, progress])

  const handleRefresh = useCallback(async () => {
    if (onRefresh && !refreshing) {
      await onRefresh()
    }
  }, [onRefresh, refreshing])

  return (
    <div
      className={cn(
        'rounded-2xl border shadow-soft overflow-hidden',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0',
              status === 'verified'
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                : status === 'checking'
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                  : 'bg-gradient-to-br from-slate-400 to-slate-600'
            )}
          >
            {status === 'checking' || refreshing ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" aria-hidden="true" />
            ) : (
              <Icon className="w-5 h-5 text-white" aria-hidden="true" />
            )}
          </div>
          <div>
            <h3 className={cn('text-lg font-semibold font-heading', config.color)}>
              {config.label}
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {config.description}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        {onRefresh && status !== 'checking' && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
              'border transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              refreshing
                ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 focus:ring-blue-500'
            )}
            aria-label="Re-check verification status"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} aria-hidden="true" />
            Re-check
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-0" role="progressbar" aria-valuenow={progress} aria-valuemin={1} aria-valuemax={3}>
          {TIMELINE_STEPS.map((step, index) => {
            const stepNumber = index + 1
            const isActive = animatedStep >= stepNumber
            const isCurrent = stepNumber === progress && status !== 'verified'
            const isError = stepNumber === 2 && ['not_found', 'suspended', 'error'].includes(status)
            const StepIcon = STEP_CONFIGS[step].icon

            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                {/* Step circle */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500',
                    isError
                      ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700'
                      : isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 dark:border-emerald-600'
                        : isCurrent
                          ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 animate-pulse'
                          : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                  )}
                >
                  {isError ? (
                    <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
                  ) : isActive ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" aria-hidden="true" />
                  ) : (
                    <StepIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    'ml-2 text-xs font-medium whitespace-nowrap',
                    isError ? 'text-red-600 dark:text-red-400' :
                    isActive ? 'text-emerald-600 dark:text-emerald-400' :
                    isCurrent ? 'text-amber-600 dark:text-amber-400' :
                    'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {STEP_CONFIGS[step].label}
                </span>

                {/* Connector line */}
                {index < TIMELINE_STEPS.length - 1 && (
                  <div className="flex-1 mx-3 h-0.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700 ease-out',
                        animatedStep > stepNumber
                          ? 'w-full bg-emerald-400'
                          : animatedStep === stepNumber && isCurrent
                            ? 'w-1/2 bg-amber-400 animate-pulse'
                            : 'w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Details (shown when verified or when bar details available) */}
      {(status === 'verified' || attorneyName || practiceStatus || admissionDate) && (
        <div className="px-6 pb-5 pt-2 border-t border-white/30 dark:border-gray-700/30">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {attorneyName && (
              <div>
                <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                  Name on Record
                </dt>
                <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
                  {attorneyName}
                </dd>
              </div>
            )}

            {barNumber && (
              <div>
                <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                  Bar Number
                </dt>
                <dd className="mt-0.5 font-mono font-medium text-gray-900 dark:text-gray-100 tracking-wider">
                  {barNumber}
                </dd>
              </div>
            )}

            {practiceStatus && (
              <div>
                <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                  Status
                </dt>
                <dd className="mt-0.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                      status === 'verified'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : status === 'suspended'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <Shield className="w-3 h-3" aria-hidden="true" />
                    {practiceStatus}
                  </span>
                </dd>
              </div>
            )}

            {admissionDate && (
              <div>
                <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                  Admission Date
                </dt>
                <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(admissionDate)}
                </dd>
              </div>
            )}

            {source && (
              <div>
                <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                  Source
                </dt>
                <dd className="mt-0.5 font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {formatSource(source)}
                </dd>
              </div>
            )}

            {verifiedAt && (
              <div>
                <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                  Last Verified
                </dt>
                <dd className="mt-0.5 font-medium text-gray-600 dark:text-gray-400">
                  {formatDate(verifiedAt)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* State bar verification link */}
      {barAssociationUrl && stateCode && (
        <div className="px-6 pb-5">
          <a
            href={barAssociationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
              'text-blue-700 dark:text-blue-300',
              'bg-blue-50/80 dark:bg-blue-900/20',
              'border border-blue-200 dark:border-blue-800',
              'hover:bg-blue-100 dark:hover:bg-blue-900/40',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
            aria-label={`Verify independently on the ${stateCode} state bar website`}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            Verify on state bar website
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatSource(source: string): string {
  const labels: Record<string, string> = {
    ny_open_data: 'NY Open Data',
    calbar: 'California Bar',
    texasbar: 'Texas Bar',
    floridabar: 'Florida Bar',
    iardc: 'IL ARDC',
    pa_disciplinary: 'PA Disciplinary Board',
    nj_courts: 'NJ Courts',
    ohio_supreme_court: 'Ohio Supreme Court',
    gabar: 'Georgia Bar',
    massbbo: 'MA Board of Bar Overseers',
    manual: 'Manual Review',
    api_lookup: 'Automated Lookup',
  }
  return labels[source] || source.replace(/_/g, ' ')
}

export default VerificationStatus
