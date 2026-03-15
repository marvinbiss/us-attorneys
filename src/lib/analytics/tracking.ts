/**
 * Analytics & Conversion Tracking - ServicesArtisans
 * World-class tracking for conversion optimization
 * Based on best practices from Calendly, Acuity, and Booksy
 */

import { getVisitorId } from './visitor'

// Event types for booking funnel
export type BookingEvent =
  | 'page_view'
  | 'artisan_profile_view'
  | 'phone_reveal'
  | 'phone_click'
  | 'calendar_opened'
  | 'date_selected'
  | 'slot_selected'
  | 'form_started'
  | 'form_completed'
  | 'booking_initiated'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'review_submitted'
  | 'waitlist_joined'
  | 'reminder_sent'
  | 'reminder_clicked'
  | 'devis_submitted'
  | 'chat_opened'
  | 'chat_message_sent'
  | 'chat_lead_form_shown'
  | 'estimation_lead_submitted'
  | 'artisan_devis_click'
  | 'artisan_email_click'
  | 'artisan_website_click'
  | 'blog_cta_click'
  | 'header_devis_click'
  | 'search_query'
  | 'service_click'
  | 'city_click'
  | 'quote_request_submitted'
  | 'callback_requested'
  | 'cta_click'
  | 'sticky_cta_click'
  | 'exit_intent_shown'
  | 'exit_intent_click'
  | 'generate_lead'
  | 'purchase'
  | 'sign_up'
  | 'contact'

export interface TrackingData {
  event: BookingEvent
  properties?: Record<string, unknown>
  userId?: string
  sessionId?: string
  visitorId?: string
  timestamp?: string
}

// Generate unique session ID
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create session ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('sa_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('sa_session_id', sessionId)
  }
  return sessionId
}

// Track event (client-side)
export function trackEvent(event: BookingEvent, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  const data: TrackingData = {
    event,
    properties: {
      ...properties,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    },
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    timestamp: new Date().toISOString(),
  }

  // Send to analytics endpoint
  sendToAnalytics(data)

  // Check consent before sending to GA
  const prefs = typeof window !== 'undefined' ? localStorage.getItem('cookie_preferences') : null
  const hasConsent = prefs ? JSON.parse(prefs)?.analytics : false
  if (hasConsent && typeof window !== 'undefined' && window.gtag) {
    const gaId = process.env.NEXT_PUBLIC_GA_ID || ''
    const gtagParams: Record<string, unknown> = {
      ...data.properties,
      ...(gaId ? { send_to: gaId } : {}),
    }
    // Forward conversion value to GA4
    if (properties?.value) {
      gtagParams.value = properties.value
      gtagParams.currency = properties?.currency || 'EUR'
    }
    window.gtag('event', event, gtagParams)
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties)
  }
}

// Send to analytics backend
async function sendToAnalytics(data: TrackingData) {
  try {
    // Use sendBeacon for reliability (doesn't block page unload)
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon('/api/analytics', JSON.stringify(data))
      if (!sent) {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {})
      }
    } else {
      // Fallback to fetch
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      })
    }
  } catch (error) {
    console.error('Analytics error:', error)
  }
}

/**
 * Track a conversion event with monetary value for GA4
 * These events should be marked as conversions in GA4 admin
 */
export function trackConversion(
  event: 'generate_lead' | 'purchase' | 'sign_up' | 'contact',
  value: number,
  currency: string = 'EUR',
  properties?: Record<string, unknown>
) {
  // Always send conversions to backend
  trackEvent(event, { ...properties, value, currency })

  // Send to GA4 with proper ecommerce format
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, {
      value,
      currency,
      ...properties,
    })
  }
}

// Booking funnel tracking
export const BookingFunnel = {
  // Step 1: User views artisan profile
  viewProfile: (attorneyId: string, attorneyName: string, source?: string) => {
    trackEvent('artisan_profile_view', {
      attorneyId,
      attorneyName,
      source,
      funnelStep: 1,
    })
  },

  // Step 1b: User reveals phone number
  revealPhone: (attorneyId: string, attorneyName: string, source: string) => {
    trackEvent('phone_reveal', {
      attorneyId,
      attorneyName,
      source,
      value: 5,
      currency: 'EUR',
    })
  },

  // Step 1c: User clicks to call
  clickPhone: (attorneyId: string, attorneyName: string, source: string) => {
    trackEvent('phone_click', {
      attorneyId,
      attorneyName,
      source,
      value: 15,
      currency: 'EUR',
    })
  },

  // Step 2: User opens calendar
  openCalendar: (attorneyId: string) => {
    trackEvent('calendar_opened', {
      attorneyId,
      funnelStep: 2,
    })
  },

  // Step 3: User selects a date
  selectDate: (attorneyId: string, date: string) => {
    trackEvent('date_selected', {
      attorneyId,
      date,
      dayOfWeek: new Date(date).getDay(),
      funnelStep: 3,
    })
  },

  // Step 4: User selects a time slot
  selectSlot: (attorneyId: string, date: string, time: string, slotId: string) => {
    trackEvent('slot_selected', {
      attorneyId,
      date,
      time,
      slotId,
      funnelStep: 4,
    })
  },

  // Step 5: User starts filling form
  startForm: (attorneyId: string) => {
    trackEvent('form_started', {
      attorneyId,
      funnelStep: 5,
    })
  },

  // Step 6: User completes form
  completeForm: (attorneyId: string, hasMessage: boolean) => {
    trackEvent('form_completed', {
      attorneyId,
      hasMessage,
      funnelStep: 6,
    })
  },

  // Step 7: Booking initiated (submit clicked)
  initiateBooking: (attorneyId: string, specialtyName: string) => {
    trackEvent('booking_initiated', {
      attorneyId,
      specialtyName,
      funnelStep: 7,
    })
  },

  // Step 8: Booking completed successfully
  completeBooking: (
    bookingId: string,
    attorneyId: string,
    specialtyName: string,
    date: string,
    time: string,
    depositAmount?: number
  ) => {
    trackEvent('booking_completed', {
      bookingId,
      attorneyId,
      specialtyName,
      date,
      time,
      depositAmount,
      funnelStep: 8,
      conversionValue: depositAmount || 0,
    })
  },
}

// Conversion rate calculation
export function calculateConversionRate(
  profileViews: number,
  completedBookings: number
): number {
  if (profileViews === 0) return 0
  return Math.round((completedBookings / profileViews) * 100 * 100) / 100
}

// Funnel drop-off analysis
export interface FunnelAnalysis {
  step: string
  count: number
  dropOffRate: number
}

export function analyzeFunnel(stepCounts: number[]): FunnelAnalysis[] {
  const steps = [
    'Profile View',
    'Calendar Opened',
    'Date Selected',
    'Slot Selected',
    'Form Started',
    'Form Completed',
    'Booking Initiated',
    'Booking Completed',
  ]

  return steps.map((step, index) => ({
    step,
    count: stepCounts[index] || 0,
    dropOffRate:
      index === 0
        ? 0
        : stepCounts[index - 1] > 0
        ? Math.round(
            ((stepCounts[index - 1] - stepCounts[index]) / stepCounts[index - 1]) * 100
          )
        : 0,
  }))
}

// A/B Testing helper
export function getVariant(experimentId: string, variants: string[]): string {
  if (typeof window === 'undefined') return variants[0]

  const storageKey = `ab_${experimentId}`
  let variant = localStorage.getItem(storageKey)

  if (!variant || !variants.includes(variant)) {
    // Randomly assign variant
    variant = variants[Math.floor(Math.random() * variants.length)]
    localStorage.setItem(storageKey, variant)
  }

  // Track variant assignment
  trackEvent('page_view', {
    experimentId,
    variant,
  })

  return variant
}

// Type declaration for gtag (defined in @/types/index.ts)
