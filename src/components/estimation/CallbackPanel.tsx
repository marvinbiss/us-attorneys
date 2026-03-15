'use client'

import React, { memo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Phone, Check, Loader2, Clock, ShieldCheck } from 'lucide-react'
import type { EstimationContext } from './utils'
import type { UseLeadSubmitReturn } from './hooks/useLeadSubmit'

interface CallbackPanelProps {
  context: EstimationContext
  lead: UseLeadSubmitReturn
}

/** Fire canvas-confetti from the bottom of the widget */
async function fireConfetti() {
  try {
    const confetti = (await import('canvas-confetti')).default
    // Burst from bottom-center
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.5, y: 0.9 },
      colors: ['#E07040', '#f59e0b', '#22c55e', '#c9603a', '#fbbf24'],
      startVelocity: 30,
      gravity: 1.2,
      ticks: 120,
      disableForReducedMotion: true,
    })
  } catch {
    // Silently fail — confetti is non-critical
  }
}

export const CallbackPanel = memo(function CallbackPanel({
  context,
  lead,
}: CallbackPanelProps) {
  const confettiFired = useRef(false)

  // Fire confetti once on successful submission
  useEffect(() => {
    if (lead.callbackSubmitted && !confettiFired.current) {
      confettiFired.current = true
      fireConfetti()
    }
  }, [lead.callbackSubmitted])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      {!lead.callbackSubmitted ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-5"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E07040]/10">
            <Phone className="h-7 w-7 text-[#E07040]" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">
              {context.artisan
                ? `Get a callback from ${context.artisan.name}`
                : 'Request a callback'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {context.artisan ? (
                <>
                  <strong>{context.artisan.name}</strong> will
                  call you back as soon as possible
                </>
              ) : (
                <>
                  A verified{' '}
                  <strong>
                    {context.metier.toLowerCase()}
                  </strong>{' '}
                  in{' '}
                  <strong>{context.ville}</strong> will
                  call you back as soon as possible
                </>
              )}
            </p>
          </div>
          <form
            onSubmit={lead.handleCallbackSubmit}
            className="space-y-3"
          >
            <div>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="(555) 123-4567"
                value={lead.callbackPhone}
                onChange={(e) => {
                  lead.setCallbackPhone(e.target.value)
                }}
                className={
                  'w-full rounded-lg border px-4 py-3 text-center text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ' +
                  (lead.callbackPhoneError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#E07040] focus:ring-[#E07040]')
                }
                style={{ fontSize: '16px' }}
              />
              {lead.callbackPhoneError && (
                <p className="text-xs text-red-600 mt-1 text-center">
                  {lead.callbackPhoneError}
                </p>
              )}
            </div>
            {/* RGPD consent */}
            <label className="flex items-start gap-2 text-xs text-gray-500 text-left">
              <input
                type="checkbox"
                checked={lead.rgpdCallbackConsent}
                onChange={(e) => lead.setRgpdCallbackConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I agree to have my data processed to receive a callback.{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  className="underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            {lead.callbackError && (
              <p className="text-xs text-red-600 text-center">
                An error occurred. Please try again.
              </p>
            )}
            <button
              type="submit"
              disabled={
                lead.callbackLoading || !lead.callbackPhone.trim() || !lead.rgpdCallbackConsent
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E07040] px-4 py-3 text-sm font-semibold text-white hover:bg-[#c9603a] transition-colors disabled:opacity-50"
            >
              {lead.callbackLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  Request a callback
                </>
              )}
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm text-center space-y-5"
        >
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.25 }}
            >
              <Check className="h-8 w-8 text-green-600" />
            </motion.div>
          </motion.div>

          <div>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base font-semibold text-gray-900"
            >
              Request sent!
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-1 text-sm text-gray-600"
            >
              Your request has been sent! An attorney will contact you within 24h.
            </motion.p>
          </div>

          {/* Reassurance stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex items-center justify-center gap-4 text-xs text-gray-500"
          >
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-green-500" />
              Quick response
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              Verified attorney
            </span>
          </motion.div>

          {/* Subtle satisfaction message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-gray-400"
          >
            98% of our clients are contacted back within 2 hours
          </motion.p>
        </motion.div>
      )}
    </div>
  )
})
