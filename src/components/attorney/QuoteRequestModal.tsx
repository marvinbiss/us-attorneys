'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle, Loader2, User, Mail, Phone, FileText } from 'lucide-react'
import { Artisan, getDisplayName } from './types'
import { submitLead } from '@/app/actions/lead'
import { trackEvent, trackConversion } from '@/lib/analytics/tracking'

interface QuoteRequestModalProps {
  artisan: Artisan
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  name: string
  email: string
  phone: string
  description: string
  urgency: 'normal' | 'urgent' | 'flexible'
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  description: '',
  urgency: 'normal',
}

export function QuoteRequestModal({ artisan, isOpen, onClose }: QuoteRequestModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const displayName = getDisplayName(artisan)

  // Focus trap: Tab cycles through focusable elements inside the modal
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return
    const focusableEls = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusableEls.length === 0) return
    const firstEl = focusableEls[0]
    const lastEl = focusableEls[focusableEls.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      }
    } else {
      if (document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleFocusTrap)
    // Focus first focusable element on open
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const first = modalRef.current.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        first?.focus()
      }
    }, 100)
    return () => {
      document.removeEventListener('keydown', handleFocusTrap)
      clearTimeout(timer)
    }
  }, [isOpen, handleFocusTrap])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Your name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Your email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Your phone number is required'
    } else if (!/^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Describe your needs'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description too short (min 10 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setServerError(null)

    try {
      const fd = new window.FormData()
      fd.set('attorneyId', artisan.id)
      fd.set('specialtyName', artisan.specialty || 'Service')
      fd.set('name', formData.name)
      fd.set('email', formData.email)
      fd.set('phone', formData.phone.replace(/\s/g, ''))
      fd.set('postalCode', artisan.postal_code || '')
      fd.set('city', artisan.city || '')
      fd.set('description', formData.description)
      fd.set('urgency', formData.urgency)

      const result = await submitLead({ success: false }, fd)

      if (result.success) {
        trackEvent('quote_request_submitted', {
          artisan_slug: artisan.slug,
          service: artisan.specialty || '',
          city: artisan.city || '',
          urgency: formData.urgency,
        })
        trackConversion('generate_lead', 40, 'USD', {
          attorney_id: artisan.id,
          artisan_name: displayName,
          service: artisan.specialty || '',
          city: artisan.city || '',
        })
        setIsSuccess(true)
        setTimeout(() => {
          setFormData(initialFormData)
          setIsSuccess(false)
          onClose()
        }, 5000)
      } else {
        setServerError(result.error || 'Error sending request')
      }
    } catch {
      setServerError('Connection error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-modal-title"
          aria-describedby="quote-modal-description"
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 id="quote-modal-title" className="text-xl font-bold text-gray-900">Request a Consultation</h2>
                <p id="quote-modal-description" className="text-sm text-gray-500">
                  Send to {displayName}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400"
                aria-label="Close form"
              >
                <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                  role="status"
                  aria-live="polite"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-16 h-16 bg-clay-50 rounded-full flex items-center justify-center mx-auto mb-4"
                    aria-hidden="true"
                  >
                    <CheckCircle className="w-8 h-8 text-clay-500" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Request sent!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {displayName} will respond as soon as possible.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(initialFormData)
                      setIsSuccess(false)
                      onClose()
                    }}
                    className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-slate-700 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {serverError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
                      {serverError}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label htmlFor="quote-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your name <span aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                      <input
                        id="quote-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="John Smith"
                        aria-required="true"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'quote-name-error' : undefined}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } focus:ring-2 focus:ring-clay-400 focus:border-transparent transition-colors`}
                      />
                    </div>
                    {errors.name && (
                      <p id="quote-name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="quote-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your email <span aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                      <input
                        id="quote-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="john@email.com"
                        aria-required="true"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'quote-email-error' : undefined}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } focus:ring-2 focus:ring-clay-400 focus:border-transparent transition-colors`}
                      />
                    </div>
                    {errors.email && (
                      <p id="quote-email-error" className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="quote-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your phone <span aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                      <input
                        id="quote-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        aria-required="true"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'quote-phone-error' : undefined}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } focus:ring-2 focus:ring-clay-400 focus:border-transparent transition-colors`}
                      />
                    </div>
                    {errors.phone && (
                      <p id="quote-phone-error" className="mt-1 text-sm text-red-600" role="alert">{errors.phone}</p>
                    )}
                  </div>

                  {/* Urgency */}
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-1.5">
                      Desired timeline
                    </legend>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Desired timeline">
                      {[
                        { value: 'urgent', label: 'Urgent', sublabel: '< 48h' },
                        { value: 'normal', label: 'Normal', sublabel: '1-2 weeks' },
                        { value: 'flexible', label: 'Flexible', sublabel: 'No rush' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={formData.urgency === option.value}
                          onClick={() => handleChange('urgency', option.value)}
                          className={`p-3 rounded-xl border-2 text-center transition-all focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-1 ${
                            formData.urgency === option.value
                              ? 'border-clay-400 bg-clay-50 text-clay-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.sublabel}</div>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Description */}
                  <div>
                    <label htmlFor="quote-description" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Describe your needs <span aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden="true" />
                      <textarea
                        id="quote-description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Describe your legal matter, context, and any specific requirements..."
                        rows={4}
                        aria-required="true"
                        aria-invalid={!!errors.description}
                        aria-describedby={errors.description ? 'quote-description-error' : 'quote-description-hint'}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                          errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } focus:ring-2 focus:ring-clay-400 focus:border-transparent transition-colors resize-none`}
                      />
                    </div>
                    {errors.description && (
                      <p id="quote-description-error" className="mt-1 text-sm text-red-600" role="alert">{errors.description}</p>
                    )}
                    <p id="quote-description-hint" className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-clay-400 to-clay-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-glow-clay hover:shadow-glow-clay transition-shadow disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" aria-hidden="true" />
                        <span>Send my request</span>
                      </>
                    )}
                  </motion.button>

                  {/* Privacy note */}
                  <p className="text-xs text-gray-500 text-center">
                    By submitting this form, you agree to be contacted by {displayName}.
                    Your data is protected in accordance with our privacy policy.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
