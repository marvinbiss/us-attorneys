'use client'

import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ExternalLink,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react'
import type { BarAdmissionRecord } from '@/lib/verification/bar-verify'
import { STATE_BAR_URLS } from '@/lib/verification/bar-verify'

// ─── Types ──────────────────────────────────────────────────────────

type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'suspended' | 'disbarred'

interface VerificationBadgeDetailedProps {
  /** Overall verification status */
  status: VerificationStatus
  /** Primary state of admission */
  primaryState?: string
  /** Year of admission (for "since [Year]" display) */
  admissionYear?: number
  /** All bar admissions for multi-state attorneys */
  barAdmissions?: BarAdmissionRecord[]
  /** Compact variant (no admissions list) */
  compact?: boolean
}

// ─── Status Config ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<VerificationStatus, {
  icon: typeof ShieldCheck
  label: string
  description: string
  containerClass: string
  iconClass: string
  textClass: string
  borderClass: string
}> = {
  verified: {
    icon: ShieldCheck,
    label: 'Verified',
    description: 'Active license confirmed through state bar records',
    containerClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    textClass: 'text-emerald-800 dark:text-emerald-200',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  pending: {
    icon: Clock,
    label: 'Pending Verification',
    description: 'Verification is in progress — check back soon',
    containerClass: 'bg-amber-50 dark:bg-amber-950/40',
    iconClass: 'text-amber-600 dark:text-amber-400',
    textClass: 'text-amber-800 dark:text-amber-200',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  unverified: {
    icon: ShieldQuestion,
    label: 'Could Not Verify',
    description: 'Automated verification unavailable — check state bar website directly',
    containerClass: 'bg-red-50 dark:bg-red-950/40',
    iconClass: 'text-red-600 dark:text-red-400',
    textClass: 'text-red-800 dark:text-red-200',
    borderClass: 'border-red-200 dark:border-red-800',
  },
  suspended: {
    icon: ShieldAlert,
    label: 'License Suspended',
    description: 'This license is currently suspended by the state bar',
    containerClass: 'bg-orange-50 dark:bg-orange-950/40',
    iconClass: 'text-orange-600 dark:text-orange-400',
    textClass: 'text-orange-800 dark:text-orange-200',
    borderClass: 'border-orange-200 dark:border-orange-800',
  },
  disbarred: {
    icon: AlertTriangle,
    label: 'Disbarred',
    description: 'This attorney has been disbarred',
    containerClass: 'bg-red-50 dark:bg-red-950/40',
    iconClass: 'text-red-700 dark:text-red-400',
    textClass: 'text-red-900 dark:text-red-200',
    borderClass: 'border-red-300 dark:border-red-800',
  },
}

// ─── Component ──────────────────────────────────────────────────────

export function VerificationBadgeDetailed({
  status,
  primaryState,
  admissionYear,
  barAdmissions = [],
  compact = false,
}: VerificationBadgeDetailedProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const stateInfo = primaryState ? STATE_BAR_URLS[primaryState] : undefined

  // Build main label
  let mainLabel = config.label
  if (status === 'verified' && primaryState && stateInfo) {
    mainLabel = `Verified — Active license in ${stateInfo.name}`
    if (admissionYear) {
      mainLabel += ` since ${admissionYear}`
    }
  }

  return (
    <div className={`rounded-2xl border ${config.borderClass} ${config.containerClass} overflow-hidden`}>
      {/* Primary badge */}
      <div className="px-5 py-4 flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          status === 'verified'
            ? 'bg-emerald-100 dark:bg-emerald-900/50'
            : status === 'pending'
              ? 'bg-amber-100 dark:bg-amber-900/50'
              : 'bg-red-100 dark:bg-red-900/50'
        }`}>
          <Icon className={`w-5 h-5 ${config.iconClass}`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${config.textClass}`}>
            {mainLabel}
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            {config.description}
          </p>
        </div>
      </div>

      {/* Multi-state admissions list */}
      {!compact && barAdmissions.length > 0 && (
        <div className="border-t border-slate-200/60 dark:border-gray-700/60 px-5 py-3.5 bg-white/50 dark:bg-gray-900/30">
          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            Bar Admissions ({barAdmissions.length} state{barAdmissions.length !== 1 ? 's' : ''})
          </p>
          <ul className="space-y-2" role="list" aria-label="Bar admissions by state">
            {barAdmissions.map((adm) => (
              <li
                key={adm.id || `${adm.state}-${adm.barNumber}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AdmissionStatusDot status={adm.status} />
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {adm.stateName || adm.state}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">
                    #{adm.barNumber}
                  </span>
                  {adm.admissionDate && (
                    <span className="text-xs text-slate-400 dark:text-gray-500 hidden sm:inline">
                      ({new Date(adm.admissionDate).getFullYear()})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <AdmissionStatusPill status={adm.status} />
                  {adm.stateBarUrl && (
                    <a
                      href={adm.stateBarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                      aria-label={`Verify on ${adm.stateName || adm.state} state bar website`}
                      title="Independently verify"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Independent verification CTA */}
      {!compact && stateInfo?.lookupUrl && (
        <div className="border-t border-slate-200/60 dark:border-gray-700/60 px-5 py-3 bg-white/30 dark:bg-gray-900/20">
          <a
            href={stateInfo.lookupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Independently verify on {stateInfo.name} State Bar
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function AdmissionStatusDot({ status }: { status: string }) {
  const colorClass =
    status === 'active'
      ? 'bg-emerald-500'
      : status === 'inactive'
        ? 'bg-gray-400'
        : status === 'suspended'
          ? 'bg-orange-500'
          : status === 'disbarred'
            ? 'bg-red-600'
            : 'bg-gray-300'

  return (
    <span
      className={`w-2 h-2 rounded-full flex-shrink-0 ${colorClass}`}
      aria-hidden="true"
    />
  )
}

function AdmissionStatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', label: 'Active' },
    inactive: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', label: 'Inactive' },
    suspended: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', label: 'Suspended' },
    disbarred: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: 'Disbarred' },
  }

  const c = config[status] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', label: status }

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text} uppercase tracking-wide`}>
      {c.label}
    </span>
  )
}

export default VerificationBadgeDetailed
