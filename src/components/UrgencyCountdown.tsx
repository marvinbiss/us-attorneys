/**
 * @deprecated DELETED — This component used fake urgency data (random response times,
 * fabricated request counts) which constitutes a dark pattern, especially unethical
 * on a legal services site. Removed 2026-03-18.
 *
 * If you need a real response-time indicator, build one backed by actual booking data
 * from the attorney_availability / bookings tables.
 */

interface UrgencyCountdownProps {
  specialtyName: string
  cityName?: string
}

export default function UrgencyCountdown(_props: UrgencyCountdownProps) {
  // Component intentionally renders nothing — dark pattern removed
  return null
}
