'use client'

import { useState, useCallback, useEffect } from 'react'
import { trackEvent, trackConversion } from '@/lib/analytics/tracking'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { StepIndicator } from '@/components/quote/StepIndicator'
import { QuoteFormStep1 } from '@/components/quote/QuoteFormStep1'
import { QuoteFormStep2 } from '@/components/quote/QuoteFormStep2'
import { QuoteFormStep3 } from '@/components/quote/QuoteFormStep3'
import { QuoteFormStep4 } from '@/components/quote/QuoteFormStep4'
import { QuoteFormConfirmation } from '@/components/quote/QuoteFormConfirmation'
import { type FormData, initialFormData, isValidUSPhone, STORAGE_KEY } from '@/components/quote/types'

interface ConsultationRequestFormProps {
  prefilledService?: string
  prefilledCity?: string
  prefilledCityPostal?: string
}

export default function ConsultationRequestForm({
  prefilledService,
  prefilledCity,
  prefilledCityPostal,
}: ConsultationRequestFormProps = {}) {
  const isPrefilled = !!(prefilledService && prefilledCity)

  // Restore saved form progress from localStorage
  const savedState = typeof window !== 'undefined' ? (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })() : null

  const [step, setStep] = useState<1 | 2 | 3 | 4>(
    isPrefilled ? 3 : (savedState?.step || 1) as 1 | 2 | 3 | 4
  )
  const [formData, setFormData] = useState<FormData>(
    isPrefilled
      ? { ...initialFormData, service: prefilledService || '', city: prefilledCity || '' }
      : (savedState?.formData || initialFormData)
  )
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [cityQuery, setCityQuery] = useState(prefilledCity || savedState?.cityQuery || '')
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [selectedCityZip, setSelectedCityZip] = useState(prefilledCityPostal || savedState?.selectedCityZip || '')
  const [geoLoading, setGeoLoading] = useState(false)
  const { toasts, removeToast, success: toastSuccess } = useToast()

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    []
  )

  const validateField = useCallback((field: keyof FormData) => {
    setErrors((prev) => {
      const next = { ...prev }
      switch (field) {
        case 'name':
          if (!formData.name.trim()) next.name = 'Please enter your name'
          else delete next.name
          break
        case 'phone':
          if (!formData.phone.trim()) next.phone = 'Please enter your phone number'
          else if (!isValidUSPhone(formData.phone.trim())) next.phone = 'Please enter a valid US phone number'
          else delete next.phone
          break
        case 'email':
          if (!formData.email.trim()) next.email = 'Please enter your email address'
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) next.email = 'Please enter a valid email address'
          else delete next.email
          break
        default:
          break
      }
      return next
    })
  }, [formData])

  // Persist form progress to localStorage
  useEffect(() => {
    if (submitted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, step, cityQuery, selectedCityZip }))
    } catch {}
  }, [formData, step, cityQuery, selectedCityZip, submitted])

  const handleGeolocation = useCallback(async () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      const { latitude, longitude } = position.coords
      // TODO: Replace with US geocoding service (Census Geocoder, Google Places, or Mapbox)
      void latitude
      void longitude
    } catch {
      // Silently fail - user can still type manually
    } finally {
      setGeoLoading(false)
    }
  }, [updateField])

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.service) newErrors.service = 'Please choose a service'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.city) newErrors.city = 'Please enter your city'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.urgency) newErrors.urgency = 'Please indicate your preferred timeline'
    if (formData.description.trim().length > 0 && formData.description.trim().length < 10) {
      newErrors.description = 'Please provide more detail (10 characters minimum) or leave the field empty'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep4 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.name.trim()) newErrors.name = 'Please enter your name'
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number'
    } else if (!isValidUSPhone(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid US phone number'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.consent) {
      newErrors.consent = "Please agree to be contacted by attorneys"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      trackEvent('form_started', {
        service: formData.service || '',
        source: 'quote_form',
      })
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    } else if (step === 3 && validateStep3()) {
      setStep(4)
    }
  }

  const handlePrev = () => {
    if (step === 2) setStep(1)
    else if (step === 3) {
      if (isPrefilled) return
      setStep(2)
    }
    else if (step === 4) setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep4()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: formData.service,
          urgency: formData.urgency,
          budget: formData.budget,
          description: formData.description,
          zipCode: selectedCityZip,
          city: formData.city,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || "Error sending request")
      }

      trackEvent('quote_submitted', {
        service: formData.service || '',
        city: formData.city || '',
        postalCode: selectedCityZip || '',
        urgency: formData.urgency || '',
        source: 'quote_form',
        value: 45,
        currency: 'USD',
      })
      trackConversion('generate_lead', 45, 'USD', {
        event_label: `quote_${formData.service}_${formData.city}`,
        service: formData.service,
        city: formData.city,
      })
      setSubmitted(true)
      toastSuccess('Request submitted!', 'Attorneys will contact you within 24 hours.')
      localStorage.removeItem(STORAGE_KEY)
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <QuoteFormConfirmation />
      </>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
      className="bg-white rounded-2xl shadow-xl p-6 md:p-10 max-w-2xl mx-auto"
    >
      <p className="text-center text-sm text-gray-500 mb-4">
        Quick form — less than 60 seconds
      </p>
      <StepIndicator currentStep={step} />

      {/* Step 1: Service */}
      <div className={`transition-all duration-300 ${step === 1 ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
        {step === 1 && (
          <QuoteFormStep1
            formData={formData}
            errors={errors}
            updateField={updateField}
            onNext={handleNext}
          />
        )}
      </div>

      {/* Step 2: City */}
      <div className={`transition-all duration-300 ${step === 2 ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
        {step === 2 && (
          <QuoteFormStep2
            formData={formData}
            errors={errors}
            updateField={updateField}
            cityQuery={cityQuery}
            setCityQuery={setCityQuery}
            showCitySuggestions={showCitySuggestions}
            setShowCitySuggestions={setShowCitySuggestions}
            setSelectedCityZip={setSelectedCityZip}
            geoLoading={geoLoading}
            handleGeolocation={handleGeolocation}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </div>

      {/* Step 3: Details */}
      <div className={`transition-all duration-300 ${step === 3 ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
        {step === 3 && (
          <QuoteFormStep3
            formData={formData}
            errors={errors}
            updateField={updateField}
            isPrefilled={isPrefilled}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </div>

      {/* Step 4: Contact */}
      <div className={`transition-all duration-300 ${step === 4 ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'}`}>
        {step === 4 && (
          <QuoteFormStep4
            formData={formData}
            errors={errors}
            updateField={updateField}
            validateField={validateField}
            submitting={submitting}
            submitError={submitError}
            onPrev={handlePrev}
          />
        )}
      </div>
    </form>
  )
}
