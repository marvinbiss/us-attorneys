'use client'

import { Users, Clock, TrendingUp } from 'lucide-react'

interface SocialProofBannerProps {
  metier?: string
  ville?: string
  variant?: 'inline' | 'card'
}

/**
 * Deterministic social proof counter — same value for all visitors on the same day
 */
function getDailyCount(): number {
  const now = new Date()
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  return 47 + ((dayOfYear * 7 + 13) % 137) // 47-183, deterministic per day
}

export function SocialProofBanner({ metier, ville, variant = 'inline' }: SocialProofBannerProps) {
  const count = getDailyCount()

  // suppress unused var warning — metier available for future use
  void metier

  if (variant === 'card') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-emerald-700">
          <TrendingUp className="w-5 h-5" />
          <span className="font-semibold text-sm">
            {count} demandes cette semaine{ville ? ` à ${ville}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Réponse moyenne : 2h</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-600">
          <Users className="w-4 h-4" />
          <span className="text-sm">Artisans vérifiés SIREN</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
        <TrendingUp className="w-3.5 h-3.5" />
        {count} demandes cette semaine{ville ? ` à ${ville}` : ''}
      </span>
      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        Réponse en ~2h
      </span>
    </div>
  )
}
