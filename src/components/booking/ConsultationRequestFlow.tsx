'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Video,
  Phone,
  MapPin,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  User,
  Mail,
  FileText,
} from 'lucide-react'
import { BookingCalendar } from './BookingCalendar'
import { cn } from '@/lib/utils'

// --- Types ---

export type ConsultationType = 'video' | 'phone' | 'in_person'

export interface ConsultationAttorney {
  id: string
  name: string
  slug: string
  specialty?: string | null
}

interface ConsultationFormData {
  consultationType: ConsultationType | null
  selectedDate: Date | null
  selectedTime: string | null
  clientName: string
  clientEmail: string
  clientPhone: string
  legalIssue: string
}

interface ConsultationRequestFlowProps {
  attorney: ConsultationAttorney
  onComplete?: (data: ConsultationFormData) => void
  onClose?: () => void
  className?: string
}

// --- Step indicator ---

function ProgressBar({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: 'Type', number: 1 },
    { label: 'Time', number: 2 },
    { label: 'Details', number: 3 },
  ]

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
      {steps.map((step, i) => {
        const isCompleted = currentStep > step.number
        const isCurrent = currentStep === step.number

        return (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  isCompleted && 'bg-emerald-500 text-white',
                  isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40',
                  !isCompleted && !isCurrent && 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
              </span>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:inline transition-colors',
                  isCurrent && 'text-blue-600 dark:text-blue-400',
                  isCompleted && 'text-emerald-600 dark:text-emerald-400',
                  !isCompleted && !isCurrent && 'text-gray-400 dark:text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 mx-3">
                <div className="h-0.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Consultation type cards ---

const CONSULTATION_TYPES: {
  type: ConsultationType
  icon: typeof Video
  label: string
  description: string
  color: string
  activeColor: string
}[] = [
  {
    type: 'video',
    icon: Video,
    label: 'Video Call',
    description: 'Face-to-face from anywhere',
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
    activeColor: 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/40',
  },
  {
    type: 'phone',
    icon: Phone,
    label: 'Phone Call',
    description: 'Quick and convenient',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700',
    activeColor: 'ring-2 ring-emerald-500 border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/40',
  },
  {
    type: 'in_person',
    icon: MapPin,
    label: 'In-Person',
    description: 'Meet at the office',
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700',
    activeColor: 'ring-2 ring-amber-500 border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/40',
  },
]

// --- Main component ---

export function ConsultationRequestFlow({
  attorney,
  onComplete,
  onClose,
  className = '',
}: ConsultationRequestFlowProps) {
  const reducedMotion = useReducedMotion()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ConsultationFormData>({
    consultationType: null,
    selectedDate: null,
    selectedTime: null,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    legalIssue: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Refs for focus management
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Focus name input when step 3 opens
  useEffect(() => {
    if (step === 3 && nameInputRef.current) {
      // Small delay to let animation start
      const timer = setTimeout(() => nameInputRef.current?.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [step])

  const slideVariants = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 },
      }

  // --- Step 1: Select type ---
  const handleTypeSelect = useCallback((type: ConsultationType) => {
    setFormData((prev) => ({ ...prev, consultationType: type }))
    setStep(2)
  }, [])

  // --- Step 2: Calendar slot selection ---
  const handleSlotConfirm = useCallback((date: Date, time: string) => {
    setFormData((prev) => ({ ...prev, selectedDate: date, selectedTime: time }))
    setStep(3)
  }, [])

  // --- Step 3: Submit form ---
  const handleSubmit = useCallback(async () => {
    // Basic client-side validation
    if (!formData.clientName.trim() || !formData.clientEmail.trim() || !formData.clientPhone.trim()) {
      setSubmitError('Please fill in all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.clientEmail)) {
      setSubmitError('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const body = {
        attorneyId: attorney.id,
        consultationType: formData.consultationType,
        preferredDate: formData.selectedDate?.toISOString().split('T')[0] || null,
        preferredTime: formData.selectedTime || null,
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim().toLowerCase(),
        clientPhone: formData.clientPhone.trim(),
        legalIssue: formData.legalIssue.trim() || null,
      }

      const res = await fetch('/api/consultations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error?.message || 'Failed to submit consultation request.')
      }

      setIsSuccess(true)
      onComplete?.(formData)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, attorney.id, onComplete])

  const goBack = useCallback(() => {
    setSubmitError(null)
    setStep((prev) => Math.max(1, prev - 1))
  }, [])

  // --- Success screen ---
  if (isSuccess) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-2xl overflow-hidden', className)}>
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 sm:p-12 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Request sent!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-2 max-w-sm mx-auto">
            Your consultation request has been sent to{' '}
            <span className="font-semibold">{attorney.name}</span>.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            You will receive a confirmation email shortly.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Done
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-2xl overflow-hidden flex flex-col', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white px-6 py-4">
        <h2 className="text-lg font-bold">Request a Consultation</h2>
        <p className="text-blue-100 text-sm mt-0.5">
          with {attorney.name}
          {attorney.specialty && ` -- ${attorney.specialty}`}
        </p>
      </div>

      {/* Progress bar */}
      <ProgressBar currentStep={step} />

      {/* Steps */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Consultation type */}
          {step === 1 && (
            <motion.div
              key="step1"
              {...slideVariants}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.25 }}
              className="p-5 sm:p-6"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                How would you like to meet?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Choose your preferred consultation format.
              </p>

              <div className="grid gap-3">
                {CONSULTATION_TYPES.map((ct) => {
                  const Icon = ct.icon
                  const isSelected = formData.consultationType === ct.type

                  return (
                    <button
                      key={ct.type}
                      onClick={() => handleTypeSelect(ct.type)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
                        isSelected ? ct.activeColor : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      )}
                      aria-label={`Select ${ct.label} consultation`}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                          ct.color
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {ct.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ct.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Pick a time */}
          {step === 2 && (
            <motion.div
              key="step2"
              {...slideVariants}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.25 }}
              className="p-5 sm:p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Go back to consultation type"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Pick a preferred time
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select your preferred date and time slot.
                  </p>
                </div>
              </div>

              <BookingCalendar
                attorneyId={attorney.id}
                attorneyName={attorney.name}
                specialtyName={attorney.specialty || 'Consultation'}
                onConfirm={handleSlotConfirm}
                className="shadow-none border-0"
              />
            </motion.div>
          )}

          {/* Step 3: Contact details */}
          {step === 3 && (
            <motion.div
              key="step3"
              {...slideVariants}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.25 }}
              className="p-5 sm:p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Go back to time selection"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Your details
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We just need a few details to confirm your request.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="consultation-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={nameInputRef}
                      id="consultation-name"
                      type="text"
                      autoComplete="name"
                      value={formData.clientName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, clientName: e.target.value }))
                      }
                      placeholder="John Smith"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="consultation-email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="consultation-email"
                      type="email"
                      autoComplete="email"
                      value={formData.clientEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))
                      }
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="consultation-phone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="consultation-phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.clientPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))
                      }
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Legal issue */}
                <div>
                  <label
                    htmlFor="consultation-issue"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Brief description of your legal issue
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      id="consultation-issue"
                      value={formData.legalIssue}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, legalIssue: e.target.value }))
                      }
                      placeholder="Briefly describe your situation..."
                      maxLength={500}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                    {formData.legalIssue.length}/500
                  </p>
                </div>

                {/* Error message */}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </motion.div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Send Request
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  By submitting, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">
                    Privacy Policy
                  </a>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
