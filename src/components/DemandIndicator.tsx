/**
 * @deprecated DELETED — This component displayed fabricated demand data (fake "views today",
 * fake "requests this week") using seeded pseudo-random numbers with zero real data backing.
 * This is a dark pattern (fake social proof) and especially harmful on a legal services site
 * where user trust is paramount. Removed 2026-03-18.
 *
 * If you need a real demand indicator, build one backed by actual analytics data
 * (e.g., real page views from the analytics table, real quote request counts).
 */

interface DemandIndicatorProps {
  specialtySlug: string
  cityName?: string
  variant?: 'inline' | 'banner'
}

export default function DemandIndicator(_props: DemandIndicatorProps) {
  // Component intentionally renders nothing — dark pattern removed
  return null
}
