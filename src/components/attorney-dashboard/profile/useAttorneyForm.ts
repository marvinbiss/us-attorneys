'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Provider } from '@/types'

interface ProviderData {
  [key: string]: unknown
}

const SAVE_TIMEOUT_MS = 15000

/**
 * Form hook for attorney profile sections.
 * Accepts Record<string, unknown> for runtime compatibility, but constrains
 * field names to keyof Provider for compile-time safety.
 */
export function useAttorneyForm(provider: ProviderData, fields: readonly (keyof Provider)[]) {
  // Extract initial values for the specified fields
  const getInitialValues = useCallback(() => {
    const values: Record<string, unknown> = {}
    for (const field of fields) {
      values[field] = provider[field] ?? null
    }
    return values
  }, [provider, fields])

  const [formData, setFormData] = useState<Record<string, unknown>>(getInitialValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const abortControllerRef = useRef<AbortController>()

  // Reset form when provider data changes
  useEffect(() => {
    setFormData(getInitialValues())
  }, [getInitialValues])

  // Cleanup timeouts and abort controller on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  const setField = useCallback((field: keyof Provider, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }, [])

  // Compare current formData with initial values to determine dirty state
  const isDirty = JSON.stringify(formData) !== JSON.stringify(getInitialValues())

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers ignore custom messages but still show a prompt
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave this page?'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleSave = useCallback(async (): Promise<Record<string, unknown> | null> => {
    if (!isDirty) return null

    // Abort any in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort()

    const controller = new AbortController()
    abortControllerRef.current = controller

    // Timeout: abort after SAVE_TIMEOUT_MS
    const timeoutId = setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS)

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/attorney/provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error saving changes')
      }

      setSuccess('Changes saved')
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = setTimeout(() => setSuccess(null), 3000)

      return data.provider
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Check your connection and try again.')
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Unable to reach the server. Check your internet connection.')
      } else {
        setError(err instanceof Error ? err.message : 'Save error')
      }
      return null
    } finally {
      clearTimeout(timeoutId)
      setSaving(false)
    }
  }, [formData, isDirty])

  return { formData, setField, isDirty, saving, error, success, handleSave }
}
