'use client'

import { useState, useCallback } from 'react'
import { trackEvent } from '@/lib/analytics/tracking'
import { isValidUSPhone } from '../utils'
import type { EstimationContext, ChatMessage } from '../utils'

export interface UseLeadSubmitReturn {
  // Lead form
  leadName: string
  setLeadName: (v: string) => void
  leadPhone: string
  setLeadPhone: (v: string) => void
  leadEmail: string
  setLeadEmail: (v: string) => void
  leadPhoneError: string
  leadLoading: boolean
  leadError: boolean
  leadSubmitted: boolean
  privacyConsent: boolean
  setPrivacyConsent: (v: boolean) => void
  handleLeadSubmit: (e: React.FormEvent) => void
  // Callback
  callbackPhone: string
  setCallbackPhone: (v: string) => void
  callbackPhoneError: string
  callbackLoading: boolean
  callbackError: boolean
  callbackSubmitted: boolean
  privacyCallbackConsent: boolean
  setPrivacyCallbackConsent: (v: boolean) => void
  handleCallbackSubmit: (e: React.FormEvent) => void
}

export function useLeadSubmit(
  context: EstimationContext,
  messages: ChatMessage[],
  onLeadSubmitted?: (confirmationMsg: string) => void,
  onCallbackSubmitted?: () => void,
): UseLeadSubmitReturn {
  // Lead form fields
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhoneError, setLeadPhoneError] = useState('')
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadError, setLeadError] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)

  // Callback fields
  const [callbackPhone, setCallbackPhone] = useState('')
  const [callbackPhoneError, setCallbackPhoneError] = useState('')
  const [callbackLoading, setCallbackLoading] = useState(false)
  const [callbackError, setCallbackError] = useState(false)
  const [callbackSubmitted, setCallbackSubmitted] = useState(false)
  const [privacyCallbackConsent, setPrivacyCallbackConsent] = useState(false)

  const handleLeadSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!leadPhone.trim()) return
      if (!privacyConsent) return

      if (!isValidUSPhone(leadPhone)) {
        setLeadPhoneError('Invalid phone number (e.g., (555) 123-4567)')
        return
      }
      setLeadPhoneError('')

      setLeadLoading(true)
      setLeadError(false)
      try {
        const response = await fetch('/api/estimation/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: leadName || undefined,
            phone: leadPhone,
            email: leadEmail || undefined,
            specialty: context.metier,
            city: context.ville,
            state: context.departement || undefined,
            source: 'chat' as const,
            conversation_history: messages,
            page_url: context.pageUrl,
            artisan_public_id: context.artisan?.publicId, // DB field: artisan_public_id (legacy name for attorney_public_id)
          }),
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        trackEvent('estimation_lead_submitted', {
          source: 'chat',
          metier: context.metierSlug,
          ville: context.ville,
          has_email: !!leadEmail,
        })

        setLeadSubmitted(true)

        const confirmationMsg = context.artisan
          ? `Your request has been sent to ${context.attorney.name}. They will contact you as soon as possible.`
          : `Your request has been submitted. A qualified ${context.metier.toLowerCase()} attorney in ${context.ville} will contact you as soon as possible.`

        onLeadSubmitted?.(confirmationMsg)
      } catch (error) {
        console.error('Lead submission error:', error)
        setLeadError(true)
      } finally {
        setLeadLoading(false)
      }
    },
    [leadPhone, leadName, leadEmail, privacyConsent, context, messages, onLeadSubmitted],
  )

  const handleCallbackSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!callbackPhone.trim()) return
      if (!privacyCallbackConsent) return

      if (!isValidUSPhone(callbackPhone)) {
        setCallbackPhoneError('Invalid phone number (e.g., (555) 123-4567)')
        return
      }
      setCallbackPhoneError('')

      setCallbackLoading(true)
      setCallbackError(false)
      try {
        const response = await fetch('/api/estimation/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: callbackPhone,
            specialty: context.metier,
            city: context.ville,
            state: context.departement || undefined,
            source: 'callback' as const,
            page_url: context.pageUrl,
            artisan_public_id: context.artisan?.publicId, // DB field: artisan_public_id (legacy name for attorney_public_id)
          }),
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        trackEvent('estimation_lead_submitted', {
          source: 'callback',
          metier: context.metierSlug,
          ville: context.ville,
        })

        setCallbackSubmitted(true)
        onCallbackSubmitted?.()
      } catch (error) {
        console.error('Callback submission error:', error)
        setCallbackError(true)
      } finally {
        setCallbackLoading(false)
      }
    },
    [callbackPhone, privacyCallbackConsent, context, onCallbackSubmitted],
  )

  return {
    leadName,
    setLeadName,
    leadPhone,
    setLeadPhone,
    leadEmail,
    setLeadEmail,
    leadPhoneError,
    leadLoading,
    leadError,
    leadSubmitted,
    privacyConsent,
    setPrivacyConsent,
    handleLeadSubmit,
    callbackPhone,
    setCallbackPhone,
    callbackPhoneError,
    callbackLoading,
    callbackError,
    callbackSubmitted,
    privacyCallbackConsent,
    setPrivacyCallbackConsent,
    handleCallbackSubmit,
  }
}
