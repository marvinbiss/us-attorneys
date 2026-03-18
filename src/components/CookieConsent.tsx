'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface CookiePreferences {
  necessary: boolean // Always true
  analytics: boolean
  marketing: boolean
  personalization: boolean
}

const COOKIE_CONSENT_KEY = 'cookie_consent'
const COOKIE_PREFERENCES_KEY = 'cookie_preferences'

/** Extend Window to include Clarity's global function */
interface WindowWithClarity extends Window {
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] }
}

/** Load Microsoft Clarity script — only called after analytics consent */
function enableClarity() {
  const win = (typeof window !== 'undefined' ? window : undefined) as WindowWithClarity | undefined
  if (win && !win.clarity) {
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID
    if (clarityId) {
      win.clarity = function (...args: unknown[]) {
        (win.clarity!.q = win.clarity!.q || []).push(args)
      }
      const t = document.createElement('script') as HTMLScriptElement
      t.async = true
      t.src = 'https://www.clarity.ms/tag/' + clarityId
      const y = document.getElementsByTagName('script')[0]
      y.parentNode?.insertBefore(t, y)
    }
  }
}

export default function CookieConsent() {
  const reducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  })

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    } else {
      // Load saved preferences and re-enable consented services
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY)
      if (savedPrefs) {
        const parsed: CookiePreferences = JSON.parse(savedPrefs)
        setPreferences(parsed)
        // Re-initialize Clarity if analytics was previously consented
        if (parsed.analytics) {
          enableClarity()
        }
      }
    }
  }, [])

  const saveConsent = async (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString())
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
    setIsVisible(false)

    // Save to server for GDPR compliance
    try {
      await fetch('/api/gdpr/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: prefs,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      })
    } catch (error: unknown) {
      console.error('Failed to save consent to server:', error)
    }

    // Apply preferences
    if (prefs.analytics) {
      enableAnalytics()
    }
    if (prefs.marketing) {
      enableMarketing()
    }
  }

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    }
    setPreferences(allAccepted)
    saveConsent(allAccepted)
  }

  const acceptNecessaryOnly = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false,
    }
    setPreferences(necessaryOnly)
    saveConsent(necessaryOnly)
  }

  const saveCustomPreferences = () => {
    saveConsent(preferences)
  }

  const enableAnalytics = () => {
    // Initialize analytics (Google Analytics, etc.)
    if (typeof window !== 'undefined') {
      window.gtag?.('consent', 'update', {
        analytics_storage: 'granted',
      })
      // Initialize Microsoft Clarity (RGPD: only after consent)
      enableClarity()
    }
  }

  const enableMarketing = () => {
    // Initialize marketing cookies
    if (typeof window !== 'undefined') {
      window.gtag?.('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      })
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={reducedMotion ? false : { y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={reducedMotion ? { duration: 0 } : undefined}
        className="fixed bottom-20 md:bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="mx-auto max-w-4xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700" role="dialog" aria-label="Cookie management" aria-modal="false">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    We respect your privacy
                  </h3>
                  <p className="text-sm text-gray-500">
                    GDPR Compliance
                  </p>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="mt-4">
              <p className="text-gray-600 text-sm">
                We use cookies to improve your experience, analyze traffic, and personalize content.
                You can choose which cookies you accept.
              </p>
            </div>

            {/* Detailed preferences */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={reducedMotion ? { duration: 0 } : undefined}
                  className="mt-6 space-y-4 overflow-hidden"
                >
                  {/* Necessary cookies */}
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Essential cookies</h4>
                      <p className="text-sm text-gray-500">
                        Required for the site to function (authentication, security)
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="h-5 w-5 rounded text-blue-600"
                      />
                      <span className="ml-2 text-xs text-gray-400">Required</span>
                    </div>
                  </div>

                  {/* Analytics cookies */}
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Analytics cookies</h4>
                      <p className="text-sm text-gray-500">
                        Help us understand how you use the site
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Marketing cookies */}
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Marketing cookies</h4>
                      <p className="text-sm text-gray-500">
                        Used to show you relevant advertisements
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  {/* Personalization cookies */}
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Personalization cookies</h4>
                      <p className="text-sm text-gray-500">
                        Allow us to remember your preferences
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences.personalization}
                        onChange={(e) =>
                          setPreferences({ ...preferences, personalization: e.target.checked })
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={acceptAll}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Accept all
              </button>
              <button
                onClick={acceptNecessaryOnly}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reject all
              </button>
              {showDetails ? (
                <button
                  onClick={saveCustomPreferences}
                  className="rounded-lg border border-blue-300 bg-blue-50 px-6 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Save my choices
                </button>
              ) : (
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 underline"
                >
                  Customize
                </button>
              )}
            </div>

            {/* Links */}
            <div className="mt-4 flex gap-4 text-xs text-gray-500">
              <a href="/privacy" className="hover:text-blue-600 hover:underline">
                Privacy policy
              </a>
              <a href="/legal" className="hover:text-blue-600 hover:underline">
                Legal notice
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook to check cookie consent status
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null)

  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (hasConsent) {
      const prefs = localStorage.getItem(COOKIE_PREFERENCES_KEY)
      if (prefs) {
        setConsent(JSON.parse(prefs))
      }
    }
  }, [])

  return consent
}
