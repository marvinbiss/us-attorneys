/**
 * Push Notification Templates — US Attorneys
 * Centralized notification payloads for all booking lifecycle events.
 *
 * Each template returns a PushNotificationPayload (defined in @/lib/push/send)
 * ready to be passed to sendPushToUser().
 */

import type { PushNotificationPayload } from '@/lib/push/send'

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

function formatTimeForDisplay(time: string): string {
  // Accepts "HH:MM" or "HH:MM:SS" and returns "h:mm AM/PM"
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const NOTIFICATION_TEMPLATES = {
  /**
   * Sent immediately after a booking is confirmed.
   */
  BOOKING_CONFIRMED: (
    attorneyName: string,
    date: string,
    time: string,
  ): PushNotificationPayload => ({
    title: 'Consultation Confirmed',
    body: `Your consultation with ${attorneyName} is scheduled for ${date} at ${formatTimeForDisplay(time)}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'booking-confirmed',
    vibrate: [100, 50, 100],
    data: { url: '/client-dashboard/consultations' },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'calendar', title: 'Add to Calendar' },
    ],
  }),

  /**
   * Sent ~24 hours before the appointment.
   */
  BOOKING_REMINDER_24H: (
    attorneyName: string,
    date: string,
    time: string,
  ): PushNotificationPayload => ({
    title: 'Appointment Tomorrow',
    body: `Reminder: consultation with ${attorneyName} tomorrow, ${date} at ${formatTimeForDisplay(time)}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'booking-reminder-24h',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: '/client-dashboard/consultations' },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'reschedule', title: 'Reschedule' },
    ],
  }),

  /**
   * Sent ~1 hour before the appointment.
   */
  BOOKING_REMINDER_1H: (
    attorneyName: string,
    time: string,
  ): PushNotificationPayload => ({
    title: 'Starting Soon',
    body: `Your consultation with ${attorneyName} starts at ${formatTimeForDisplay(time)} — in about 1 hour`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'booking-reminder-1h',
    requireInteraction: true,
    vibrate: [300, 100, 300],
    data: { url: '/client-dashboard/consultations' },
    actions: [
      { action: 'join', title: 'Join Call' },
      { action: 'view', title: 'View' },
    ],
  }),

  /**
   * Sent when a booking is cancelled (to the other party).
   */
  BOOKING_CANCELLED: (
    attorneyName: string,
    date: string,
    cancelledBy: 'client' | 'attorney',
  ): PushNotificationPayload => ({
    title: 'Consultation Cancelled',
    body: cancelledBy === 'client'
      ? `Your consultation with ${attorneyName} on ${date} has been cancelled`
      : `${attorneyName} cancelled your consultation on ${date}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'booking-cancelled',
    data: { url: '/client-dashboard/consultations' },
    actions: [{ action: 'rebook', title: 'Rebook' }],
  }),

  /**
   * Sent when a booking is rescheduled.
   */
  BOOKING_RESCHEDULED: (
    attorneyName: string,
    newDate: string,
    newTime: string,
  ): PushNotificationPayload => ({
    title: 'Consultation Rescheduled',
    body: `Your consultation with ${attorneyName} has been moved to ${newDate} at ${formatTimeForDisplay(newTime)}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'booking-rescheduled',
    vibrate: [100, 50, 100],
    data: { url: '/client-dashboard/consultations' },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'calendar', title: 'Update Calendar' },
    ],
  }),

  /**
   * Sent when a new chat message is received.
   */
  NEW_MESSAGE: (
    senderName: string,
    preview?: string,
  ): PushNotificationPayload => ({
    title: 'New Message',
    body: preview
      ? `${senderName}: ${preview.slice(0, 100)}`
      : `${senderName} sent you a message`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'new-message',
    data: { url: '/client-dashboard/messages' },
    actions: [{ action: 'reply', title: 'Reply' }],
  }),

  /**
   * Sent ~48 hours after a completed consultation to request a review.
   */
  REVIEW_REQUEST: (
    attorneyName: string,
    bookingId: string,
  ): PushNotificationPayload => ({
    title: 'How Was Your Consultation?',
    body: `Share your experience with ${attorneyName} to help others find the right attorney`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `review-request-${bookingId}`,
    data: { url: `/leave-review/${bookingId}` },
    actions: [
      { action: 'review', title: 'Leave Review' },
      { action: 'dismiss', title: 'Later' },
    ],
  }),

  /**
   * Sent to attorneys when a new client books a consultation.
   */
  ATTORNEY_NEW_LEAD: (
    clientName: string,
    serviceName: string,
    date: string,
    time: string,
  ): PushNotificationPayload => ({
    title: 'New Consultation Request',
    body: `${clientName} booked a ${serviceName} consultation on ${date} at ${formatTimeForDisplay(time)}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'attorney-new-lead',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: { url: '/attorney-dashboard/bookings' },
    actions: [
      { action: 'accept', title: 'View Booking' },
    ],
  }),
} as const
