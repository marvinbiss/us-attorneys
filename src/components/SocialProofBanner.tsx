'use client'

import { useEffect, useState } from 'react'
import { Users, Clock, TrendingUp, FileText } from 'lucide-react'

interface SocialProofData {
  devisThisMonth: number
  activeProviders: number
}

interface SocialProofBannerProps {
  /** Practice area name for contextual display */
  metier?: string
  /** City name for contextual display */
  ville?: string
  /** Variant: 'inline' pills, 'card' full card, 'compact' minimal */
  variant?: 'inline' | 'card' | 'compact'
}

/**
 * Deterministic fallback counter — same value for all visitors on the same day
 */
function getDailyCount(): number {
  const now = new Date()
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  return 47 + ((dayOfYear * 7 + 13) % 137) // 47-183, deterministic per day
}

export function SocialProofBanner({ metier, ville, variant = 'inline' }: SocialProofBannerProps) {
  const fallbackCount = getDailyCount()
  const [data, setData] = useState<SocialProofData | null>(null)

  useEffect(() => {
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem('sa:social-proof')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.fetchedAt < 3600000) {
          setData(parsed.data)
          return
        }
      } catch { /* ignore corrupt cache */ }
    }

    fetch('/api/social-proof')
      .then(r => r.json())
      .then((d: SocialProofData) => {
        setData(d)
        sessionStorage.setItem('sa:social-proof', JSON.stringify({ data: d, fetchedAt: Date.now() }))
      })
      .catch(() => {
        // Fallback — use deterministic values
        setData({ devisThisMonth: fallbackCount, activeProviders: 500 })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const devisCount = data?.devisThisMonth ?? fallbackCount
  const attorneyCount = data?.activeProviders ?? 500

  // ── Compact variant: minimal inline stats ──
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {devisCount.toLocaleString('en-US')} consultations this month
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {attorneyCount.toLocaleString('en-US')} active attorneys
        </span>
      </div>
    )
  }

  // ── Card variant: full card with stats grid ──
  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">
            {metier ? `High demand for ${metier.toLowerCase()}` : 'High demand this month'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{devisCount.toLocaleString('en-US')}</p>
              <p className="text-xs text-slate-500">consultations this month</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{attorneyCount.toLocaleString('en-US')}</p>
              <p className="text-xs text-slate-500">attorneys available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">~2h</p>
              <p className="text-xs text-slate-500">response time</p>
            </div>
          </div>
        </div>
        {ville && (
          <p className="text-xs text-blue-600 mt-2">
            Attorneys available in {ville} and surrounding areas
          </p>
        )}
      </div>
    )
  }

  // ── Inline variant (default): pill badges ──
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
        <TrendingUp className="w-3.5 h-3.5" />
        {devisCount.toLocaleString('en-US')} requests this month{ville ? ` in ${ville}` : ''}
      </span>
      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        Response in ~2h
      </span>
      <span className="flex items-center gap-1.5 text-violet-700 bg-violet-50 px-3 py-1.5 rounded-full">
        <Users className="w-3.5 h-3.5" />
        {attorneyCount.toLocaleString('en-US')} attorneys
      </span>
    </div>
  )
}

export default SocialProofBanner
