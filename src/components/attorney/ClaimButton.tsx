'use client'

import { useState, useEffect } from 'react'
import { Shield, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'

interface ClaimButtonProps {
  attorneyId: string
  attorneyName: string
  hasBarNumber: boolean
}

export function ClaimButton({ attorneyId, attorneyName, hasBarNumber }: ClaimButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [barNumber, setBarNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Best-effort prefill from profile if user is logged in (non-blocking)
  useEffect(() => {
    if (!showModal || profileLoaded) return
    setProfileLoaded(true)
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          if (data.user.fullName && !fullName) setFullName(data.user.fullName)
          if (data.user.email && !email) setEmail(data.user.email)
          if (data.user.phone && !phone) setPhone(data.user.phone)
        }
      })
      .catch(() => { /* not logged in — that's fine */ })
  }, [showModal, profileLoaded, fullName, email, phone])

  // Format bar number for display
  const formatBarNumber = (value: string) => {
    return value.trim()
  }

  const handleBarNumberChange = (value: string) => {
    setBarNumber(value.trim())
    setError(null)
  }

  const formatPhone = (value: string) => {
    return value.replace(/[^\d+]/g, '').slice(0, 15)
  }

  const isFormValid =
    barNumber.length >= 1 &&
    fullName.trim().length >= 2 &&
    email.includes('@') &&
    phone.replace(/\D/g, '').length >= 10 &&
    position.trim().length >= 2

  const handleClaim = async () => {
    if (!barNumber.trim()) {
      setError('Bar number is required')
      return
    }
    if (fullName.trim().length < 2) {
      setError('Please enter your full name')
      return
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number')
      return
    }
    if (position.trim().length < 2) {
      setError('Please indicate your role at the firm')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/attorney/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attorneyId,
          bar_number: barNumber,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          position: position.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const debugInfo = data.debug ? ` [DEBUG: ${JSON.stringify(data.debug)}]` : ''
        setError((data.error || 'Error claiming profile') + debugInfo)
        return
      }

      setSuccess(true)
    } catch {
      setError('Server connection error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasBarNumber) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Are you this attorney?</p>
            <p className="text-sm text-amber-700 mt-1">
              This profile cannot yet be claimed automatically.
              Contact us at{' '}
              <a href="mailto:support@us-attorneys.com" className="underline font-medium">
                support@us-attorneys.com
              </a>{' '}
              with a copy of your bar admission certificate.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-500/20"
      >
        <Shield className="w-5 h-5" />
        Are you this attorney? Claim this profile
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isLoading && setShowModal(false)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => !isLoading && setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              // Success state
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Request sent!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your claim request for <strong>{attorneyName}</strong> has been submitted.
                  An administrator will review it within 24 to 48 hours.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              // Form state
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Claim this profile
                    </h3>
                    <p className="text-sm text-gray-500">{attorneyName}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Fill in your details and bar number to verify that you are this attorney.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Full name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setError(null) }}
                      placeholder="John Smith"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Professional email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null) }}
                      placeholder="john@lawfirm.com"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(formatPhone(e.target.value)); setError(null) }}
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position / Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => { setPosition(e.target.value); setError(null) }}
                      placeholder="Partner, Associate, Managing Attorney..."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Bar Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formatBarNumber(barNumber)}
                      onChange={(e) => handleBarNumberChange(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-lg tracking-wider font-mono"
                      disabled={isLoading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Your bar number can be found on your state bar association website or{' '}
                      <a
                        href="https://www.americanbar.org"
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="text-amber-600 hover:underline"
                      >
                        americanbar.org
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClaim}
                    disabled={isLoading || !isFormValid}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Send my request'
                    )}
                  </button>
                </div>

                <p className="mt-4 text-xs text-gray-400 text-center">
                  An administrator will verify and approve your request within 24 to 48 hours.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
