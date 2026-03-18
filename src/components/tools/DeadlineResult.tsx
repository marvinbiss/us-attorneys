'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  AlertTriangle,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  Bell,
  XCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'
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
}

interface DeadlineResultProps {
  result: DeadlineResultData
  specialtyLabel: string
  stateName: string
  onSaveReminder?: () => void
}

// ─── Urgency Styling ────────────────────────────────────────────────────────

function getUrgencyConfig(level: UrgencyLevel) {
  switch (level) {
    case 'expired':
      return {
        icon: XCircle,
        bg: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
        text: 'text-gray-700 dark:text-gray-300',
        badge: 'bg-gray-600 text-white',
        meterColor: 'bg-gray-400',
        meterWidth: '100%',
        label: 'Deadline Passed',
      }
    case 'critical':
      return {
        icon: AlertTriangle,
        bg: 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800',
        text: 'text-red-700 dark:text-red-400',
        badge: 'bg-red-600 text-white',
        meterColor: 'bg-red-500',
        meterWidth: '95%',
        label: 'Critical — Act Immediately',
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-400',
        badge: 'bg-amber-600 text-white',
        meterColor: 'bg-amber-500',
        meterWidth: '70%',
        label: 'Warning — Time Running Out',
      }
    case 'caution':
      return {
        icon: Clock,
        bg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-400',
        badge: 'bg-yellow-600 text-white',
        meterColor: 'bg-yellow-500',
        meterWidth: '40%',
        label: 'Caution — Plan Ahead',
      }
    case 'safe':
      return {
        icon: CheckCircle2,
        bg: 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800',
        text: 'text-green-700 dark:text-green-400',
        badge: 'bg-green-600 text-white',
        meterColor: 'bg-green-500',
        meterWidth: '15%',
        label: 'Safe — You Have Time',
      }
  }
}

// ─── Countdown Timer ────────────────────────────────────────────────────────

function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    function calc() {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ]

  return (
    <div className="flex gap-3 justify-center" aria-live="polite" aria-label="Time remaining countdown">
      {units.map(({ value, label }) => (
        <div key={label} className="text-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-2 min-w-[60px]">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
              {String(value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DeadlineResult({
  result,
  specialtyLabel,
  stateName,
  onSaveReminder,
}: DeadlineResultProps) {
  const [showExceptions, setShowExceptions] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const config = getUrgencyConfig(result.urgencyLevel)
  const UrgencyIcon = config.icon

  const formattedDeadline = new Date(result.deadline).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedIncident = new Date(result.incidentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
      className="space-y-6"
    >
      {/* Urgency Banner */}
      <div className={`rounded-xl border-2 p-6 ${config.bg}`} role="alert">
        <div className="flex items-center gap-3 mb-4">
          <UrgencyIcon className={`w-6 h-6 ${config.text}`} aria-hidden="true" />
          <span className={`text-lg font-bold ${config.text}`}>{config.label}</span>
          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${config.badge}`}>
            {result.daysRemaining < 0
              ? `${Math.abs(result.daysRemaining)} days overdue`
              : `${result.daysRemaining} days left`}
          </span>
        </div>

        {/* Urgency Meter */}
        <div
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4"
          role="meter"
          aria-label="Urgency level"
          aria-valuenow={Math.max(0, result.daysRemaining)}
          aria-valuemin={0}
          aria-valuemax={365}
        >
          <motion.div
            className={`h-full rounded-full ${config.meterColor}`}
            initial={prefersReducedMotion ? false : { width: 0 }}
            animate={{ width: config.meterWidth }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Countdown */}
        {result.daysRemaining > 0 && <Countdown deadline={result.deadline} />}
      </div>

      {/* Deadline Details Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {specialtyLabel} in {stateName}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Statute of Limitations</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {result.years} {result.years === 1 ? 'year' : 'years'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Filing Deadline</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formattedDeadline}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Incident Date</p>
            <p className="text-base text-gray-700 dark:text-gray-300">{formattedIncident}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Discovery Rule</p>
            <p className="text-base text-gray-700 dark:text-gray-300">
              {result.discoveryRule ? 'Yes — deadline may extend from date of discovery' : 'No'}
            </p>
          </div>
        </div>

        {/* Statute Citation */}
        {result.description && (
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{result.description}</span>
          </div>
        )}

        {/* Source Link */}
        {result.sourceUrl && (
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            View source statute
          </a>
        )}

        {/* Discovery Rule Deadline */}
        <AnimatePresence>
          {result.discoveryDeadline && result.discoveryDaysRemaining !== undefined && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">Discovery Rule Deadline</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                If the injury was discovered later than the incident, the deadline may be extended to{' '}
                <strong>
                  {new Date(result.discoveryDeadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </strong>{' '}
                ({result.discoveryDaysRemaining > 0
                  ? `${result.discoveryDaysRemaining} days remaining`
                  : 'expired'}).
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exceptions Accordion */}
        {result.exceptions.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowExceptions(!showExceptions)}
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              aria-expanded={showExceptions}
              aria-controls="exceptions-panel"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Exceptions & Special Rules ({result.exceptions.length})
              </span>
              {showExceptions
                ? <ChevronUp className="w-5 h-5 text-gray-400" aria-hidden="true" />
                : <ChevronDown className="w-5 h-5 text-gray-400" aria-hidden="true" />}
            </button>
            <AnimatePresence>
              {showExceptions && (
                <motion.div
                  id="exceptions-panel"
                  initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="px-4 py-3 space-y-2">
                    {result.exceptions.map((ex, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" aria-hidden="true" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* CTA Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Save Reminder CTA */}
        <button
          onClick={onSaveReminder}
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-blue-700 dark:text-blue-300">Save This Deadline</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Get reminders at 30, 7, and 1 day before
            </p>
          </div>
        </button>

        {/* Find Attorney CTA */}
        <Link
          href={`/practice-areas/${result.specialtySlug}?state=${result.stateCode.toLowerCase()}`}
          className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Search className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-green-700 dark:text-green-300">
              Find an Attorney Before Your Deadline
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {specialtyLabel} attorneys in {stateName}
            </p>
          </div>
        </Link>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
        <p className="font-semibold mb-1">Legal Disclaimer</p>
        <p>
          This tool provides general information about statutes of limitations only. It is not legal
          advice and should not be relied upon as such. Statutes of limitations can be affected by
          many factors including tolling provisions, discovery rules, minority status, and other
          exceptions. Consult a qualified attorney in your jurisdiction for advice specific to your
          situation. Filing deadlines may be earlier than the statute of limitations due to
          administrative requirements.
        </p>
      </div>
    </motion.div>
  )
}
