import { TrendingUp, Users, Eye } from 'lucide-react'

interface DemandIndicatorProps {
  /** Service slug for deterministic seed */
  serviceSlug: string
  /** Optional city name for context */
  cityName?: string
  /** Variant: 'inline' for subtle, 'banner' for prominent */
  variant?: 'inline' | 'banner'
}

/**
 * Deterministic pseudo-random based on string seed + date.
 * Same input = same output for the same day (avoids hydration mismatch).
 */
function seededDailyNumber(seed: string, min: number, max: number): number {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const str = seed + today
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return min + Math.abs(hash % (max - min + 1))
}

export default function DemandIndicator({ serviceSlug, cityName, variant = 'inline' }: DemandIndicatorProps) {
  const weeklyRequests = seededDailyNumber(serviceSlug + '-requests', 8, 35)
  const viewsToday = seededDailyNumber(serviceSlug + '-views', 15, 85)

  if (variant === 'banner') {
    return (
      <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">
            {cityName ? `Forte demande à ${cityName}` : 'Forte demande cette semaine'}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-amber-800">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {weeklyRequests} demandes cette semaine
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {viewsToday} consultations aujourd&apos;hui
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        {weeklyRequests} demandes cette semaine
      </span>
      <span className="flex items-center gap-1">
        <Eye className="w-3 h-3" />
        {viewsToday} vues aujourd&apos;hui
      </span>
    </div>
  )
}
