'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  X,
  Bell,
  Mail,
  Check,
  Loader2,
  LogIn,
  Shield,
  Clock,
  AlertTriangle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeadlineReminderProps {
  isOpen: boolean
  onClose: () => void
  specialtySlug: string
  specialtyLabel: string
  stateCode: string
  stateName: string
  incidentDate: string
  deadlineDate: string
  daysRemaining: number
}

type ReminderStatus = 'idle' | 'loading' | 'success' | 'auth-required' | 'error'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeadlineReminder({
  isOpen,
  onClose,
  specialtySlug,
  specialtyLabel,
  stateCode,
  stateName,
  incidentDate,
  deadlineDate,
  daysRemaining,
}: DeadlineReminderProps) {
  const [status, setStatus] = useState<ReminderStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const prefersReducedMotion = useReducedMotion()
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const formattedDeadline = new Date(deadlineDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Calculate which reminders will fire
  const reminders = [
    { days: 180, label: '6 months before', active: daysRemaining > 180 },
    { days: 90, label: '90 days before', active: daysRemaining > 90 },
    { days: 30, label: '30 days before', active: daysRemaining > 30 },
    { days: 7, label: '7 days before', active: daysRemaining > 7 },
    { days: 1, label: '1 day before', active: daysRemaining > 1 },
  ]

  const activeReminders = reminders.filter(r => r.active)

  const handleSave = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/deadline-tracker/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialtySlug,
          stateCode,
          incidentDate,
          deadlineDate,
        }),
      })

      if (response.status === 401) {
        setStatus('auth-required')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save reminder')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }, [specialtySlug, stateCode, incidentDate, deadlineDate])

  const handleLoginRedirect = useCallback(() => {
    const returnUrl = `/tools/deadline-tracker?specialty=${specialtySlug}&state=${stateCode}`
    window.location.href = `/login?redirect=${encodeURIComponent(returnUrl)}`
  }, [specialtySlug, stateCode])

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus first focusable element
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const first = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        first?.focus()
      }
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reminder-title"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 id="reminder-title" className="text-lg font-bold text-gray-900 dark:text-white">
                    Set Deadline Reminder
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Status: Idle — show reminder details */}
                {(status === 'idle' || status === 'loading') && (
                  <>
                    {/* Deadline summary */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Your deadline</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {daysRemaining} days left
                        </span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{formattedDeadline}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {specialtyLabel} in {stateName}
                      </p>
                    </div>

                    {/* Reminder schedule */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Reminder Schedule
                      </h3>
                      <div className="space-y-2">
                        {reminders.map((reminder) => (
                          <div
                            key={reminder.days}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                              reminder.active
                                ? 'bg-blue-50 dark:bg-blue-950/20'
                                : 'bg-gray-50 dark:bg-gray-800 opacity-50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                reminder.active
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {reminder.active && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span
                              className={`text-sm ${
                                reminder.active
                                  ? 'text-gray-700 dark:text-gray-300 font-medium'
                                  : 'text-gray-400 dark:text-gray-500 line-through'
                              }`}
                            >
                              {reminder.label}
                            </span>
                            {!reminder.active && (
                              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                                already passed
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notification channels */}
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span>Reminders will be sent via email and push notification.</span>
                    </div>

                    {activeReminders.length === 0 && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Your deadline is very close. No future reminders available, but we will save it for your records.</span>
                      </div>
                    )}
                  </>
                )}

                {/* Status: Auth required */}
                {status === 'auth-required' && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Sign In to Save Reminders
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Create a free account to receive deadline reminders via email and push
                      notifications. Your deadline will be saved automatically after signing in.
                    </p>
                    <button
                      onClick={handleLoginRedirect}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign In or Create Account
                    </button>
                  </div>
                )}

                {/* Status: Success */}
                {status === 'success' && (
                  <div className="text-center py-4">
                    <motion.div
                      initial={prefersReducedMotion ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Reminder Saved
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      You will receive notifications at 30, 7, and 1 day before your deadline on{' '}
                      <strong className="text-gray-700 dark:text-gray-300">{formattedDeadline}</strong>.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 mt-4">
                      <Shield className="w-4 h-4" />
                      <span>We will never spam you. Only deadline-related notifications.</span>
                    </div>
                  </div>
                )}

                {/* Status: Error */}
                {status === 'error' && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Something Went Wrong
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                      {errorMessage}
                    </p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
                {(status === 'idle' || status === 'loading') && (
                  <>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={status === 'loading'}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm transition-colors"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" />
                          Save Reminder
                        </>
                      )}
                    </button>
                  </>
                )}
                {(status === 'success' || status === 'error' || status === 'auth-required') && (
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
