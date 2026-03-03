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

  // Also send to Google Analytics if available
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, data.properties)
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

// Booking funnel tracking
export const BookingFunnel = {
  // Step 1: User views artisan profile
  viewProfile: (artisanId: string, artisanName: string, source?: string) => {
    trackEvent('artisan_profile_view', {
      artisanId,
      artisanName,
      source,
      funnelStep: 1,
    })
  },

  // Step 1b: User reveals phone number
  revealPhone: (artisanId: string, artisanName: string, source: string) => {
    trackEvent('phone_reveal', {
      artisanId,
      artisanName,
      source,
    })
  },

  // Step 1c: User clicks to call
  clickPhone: (artisanId: string, artisanName: string, source: string) => {
    trackEvent('phone_click', {
      artisanId,
      artisanName,
      source,
    })
  },

  // Step 2: User opens calendar
  openCalendar: (artisanId: string) => {
    trackEvent('calendar_opened', {
      artisanId,
      funnelStep: 2,
    })
  },

  // Step 3: User selects a date
  selectDate: (artisanId: string, date: string) => {
    trackEvent('date_selected', {
      artisanId,
      date,
      dayOfWeek: new Date(date).getDay(),
      funnelStep: 3,
    })
  },

  // Step 4: User selects a time slot
  selectSlot: (artisanId: string, date: string, time: string, slotId: string) => {
    trackEvent('slot_selected', {
      artisanId,
      date,
      time,
      slotId,
      funnelStep: 4,
    })
  },

  // Step 5: User starts filling form
  startForm: (artisanId: string) => {
    trackEvent('form_started', {
      artisanId,
      funnelStep: 5,
    })
  },

  // Step 6: User completes form
  completeForm: (artisanId: string, hasMessage: boolean) => {
    trackEvent('form_completed', {
      artisanId,
      hasMessage,
      funnelStep: 6,
    })
  },

  // Step 7: Booking initiated (submit clicked)
  initiateBooking: (artisanId: string, serviceName: string) => {
    trackEvent('booking_initiated', {
      artisanId,
      serviceName,
      funnelStep: 7,
    })
  },

  // Step 8: Booking completed successfully
  completeBooking: (
    bookingId: string,
    artisanId: string,
    serviceName: string,
    date: string,
    time: string,
    depositAmount?: number
  ) => {
    trackEvent('booking_completed', {
      bookingId,
      artisanId,
      serviceName,
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
