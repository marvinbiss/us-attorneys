'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Award, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

// ── Types ───────────────────────────────────────────────────────────

interface Specialty {
  id: string
  name: string
  slug: string
}

interface EndorseButtonProps {
  /** The attorney being endorsed */
  endorsedAttorneyId: string
  endorsedAttorneyName: string
  /** Available specialties for endorsement selection */
  specialties?: Specialty[]
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

// ── Component ───────────────────────────────────────────────────────

export function EndorseButton({
  endorsedAttorneyId,
  endorsedAttorneyName,
  specialties = [],
}: EndorseButtonProps) {
  const reducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [comment, setComment] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isAttorney, setIsAttorney] = useState(false)

  // Check if current user is an attorney (and not self)
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: attorney } = await supabase
          .from('attorneys')
          .select('id, is_verified')
          .eq('user_id', user.id)
          .single()

        if (attorney && attorney.is_verified && attorney.id !== endorsedAttorneyId) {
          setIsAttorney(true)
        }
      } catch {
        // Not authenticated or not an attorney
      }
    }
    checkAuth()
  }, [endorsedAttorneyId])

  // Don't render if user is not a verified attorney or is viewing own profile
  if (!isAttorney) return null

  async function handleSubmit() {
    if (!selectedSpecialty) {
      setErrorMessage('Please select a specialty to endorse')
      return
    }

    setSubmitState('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/attorney/endorsements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endorsed_attorney_id: endorsedAttorneyId,
          specialty_id: selectedSpecialty,
          comment: comment.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setErrorMessage(json.error || 'Failed to submit endorsement')
        setSubmitState('error')
        return
      }

      setSubmitState('success')
      // Reset and close after delay
      setTimeout(() => {
        setIsOpen(false)
        setSubmitState('idle')
        setSelectedSpecialty('')
        setComment('')
        // Trigger a refresh of the endorsements list
        window.dispatchEvent(new CustomEvent('endorsement-created'))
      }, 2000)
    } catch {
      setErrorMessage('Network error. Please try again.')
      setSubmitState('error')
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors border border-blue-200 hover:border-blue-300"
      >
        <Award className="w-4 h-4" aria-hidden="true" />
        Endorse this attorney
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => submitState !== 'loading' && setIsOpen(false)}
            />

            {/* Modal content */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Award className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 font-heading">
                      Endorse Attorney
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {endorsedAttorneyName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => submitState !== 'loading' && setIsOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Success state */}
              {submitState === 'success' ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    Endorsement Submitted
                  </h4>
                  <p className="text-sm text-slate-500">
                    Your endorsement of {endorsedAttorneyName} is now visible on their profile.
                  </p>
                </div>
              ) : (
                /* Form */
                <div className="p-5 space-y-4" aria-busy={submitState === 'loading'}>
                  {/* Specialty selection */}
                  <div>
                    <label htmlFor="endorsement-specialty" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Specialty to endorse <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="endorsement-specialty"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={submitState === 'loading'}
                    >
                      <option value="">Select a specialty...</option>
                      {specialties.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Comment */}
                  <div>
                    <label htmlFor="endorsement-comment" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Short recommendation <span className="text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      id="endorsement-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 200))}
                      placeholder="e.g., Outstanding litigator with deep expertise in this area..."
                      rows={3}
                      maxLength={200}
                      className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={submitState === 'loading'}
                    />
                    <p className="text-xs text-slate-400 mt-1 text-right">
                      {comment.length}/200
                    </p>
                  </div>

                  {/* Error message */}
                  {errorMessage && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitState === 'loading' || !selectedSpecialty}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {submitState === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        Submit Endorsement
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    Your name, photo, and practice area will be displayed with this endorsement.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
