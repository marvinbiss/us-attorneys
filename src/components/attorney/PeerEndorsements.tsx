'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Award, Shield, MessageSquare, MapPin, ChevronDown, User } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────

interface EndorserInfo {
  id: string
  name: string | null
  slug: string | null
  profile_image_url: string | null
  address_city: string | null
  address_state: string | null
  is_verified: boolean | null
}

interface SpecialtyInfo {
  id: string
  name: string | null
  slug: string | null
}

interface Endorsement {
  id: string
  comment: string | null
  created_at: string
  specialty_id: string | null
  endorser: EndorserInfo | null
  specialty: SpecialtyInfo | null
}

interface PeerEndorsementsProps {
  attorneyId: string
  endorsementCount?: number
  /** Compact mode for sidebar / card display */
  compact?: boolean
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1d ago'
    if (diffDays < 30) return `${diffDays}d ago`
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months}mo ago`
    }
    const years = Math.floor(diffDays / 365)
    return `${years}y ago`
  } catch {
    return ''
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ── Component ───────────────────────────────────────────────────────

const MAX_VISIBLE = 4

export default function PeerEndorsements({
  attorneyId,
  endorsementCount = 0,
  compact = false,
}: PeerEndorsementsProps) {
  const reducedMotion = useReducedMotion()
  const [endorsements, setEndorsements] = useState<Endorsement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const fetchEndorsements = useCallback(async () => {
    try {
      const res = await fetch(`/api/attorney/endorsements?attorneyId=${attorneyId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setEndorsements(json.data)
      }
    } catch {
      // Silently fail — endorsements are non-critical
    } finally {
      setLoading(false)
    }
  }, [attorneyId])

  useEffect(() => {
    if (!attorneyId) {
      setLoading(false)
      return
    }
    // In compact mode, only fetch if we already know there are endorsements
    if (compact && endorsementCount === 0) {
      setLoading(false)
      return
    }
    fetchEndorsements()
  }, [attorneyId, endorsementCount, compact, fetchEndorsements])

  // Nothing to show
  if (!loading && endorsements.length === 0 && endorsementCount === 0) {
    return null
  }

  // Compact badge for sidebar/card display
  if (compact) {
    if (endorsementCount === 0) return null
    return (
      <div className="flex items-center gap-1.5 text-sm text-blue-700">
        <Award className="w-4 h-4" aria-hidden="true" />
        <span className="font-medium">
          {endorsementCount} Peer Endorsement{endorsementCount !== 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  const visibleEndorsements = showAll ? endorsements : endorsements.slice(0, MAX_VISIBLE)
  const hasMore = endorsements.length > MAX_VISIBLE
  const totalCount = endorsements.length || endorsementCount

  return (
    <div className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Award className="w-5 h-5 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 font-heading">
              Peer Endorsements
            </h3>
            <p className="text-sm text-slate-500">
              Recognized by fellow attorneys
            </p>
          </div>
        </div>

        {/* Count badge */}
        {totalCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <Award className="w-3.5 h-3.5" aria-hidden="true" />
            {totalCount} endorsement{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start gap-3 p-4 bg-white rounded-xl border border-stone-100">
              <div className="w-11 h-11 bg-sand-300 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-sand-300 rounded w-1/3" />
                <div className="h-3 bg-sand-300 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Endorsement cards */}
      {!loading && endorsements.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleEndorsements.map((endorsement, idx) => {
              const endorser = endorsement.endorser
              if (!endorser) return null

              return (
                <motion.div
                  key={endorsement.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
                  transition={reducedMotion ? { duration: 0 } : { delay: idx * 0.05 }}
                  className="flex gap-3 p-4 bg-white rounded-xl border border-stone-100 hover:border-blue-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {endorser.profile_image_url ? (
                      <Image
                        src={endorser.profile_image_url}
                        alt={endorser.name || 'Attorney'}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover border-2 border-blue-100"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100">
                        {endorser.name ? (
                          <span className="text-blue-600 font-semibold text-sm">
                            {getInitials(endorser.name)}
                          </span>
                        ) : (
                          <User className="w-5 h-5 text-blue-400" aria-hidden="true" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {endorser.slug ? (
                        <Link
                          href={`/practice-areas/${endorsement.specialty?.slug || 'attorney'}/${endorser.address_city?.toLowerCase().replace(/\s+/g, '-') || 'us'}/${endorser.slug}`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm truncate"
                        >
                          {endorser.name || 'Attorney'}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {endorser.name || 'Attorney'}
                        </span>
                      )}
                      {endorser.is_verified && (
                        <span title="Verified Attorney">
                          <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    {(endorser.address_city || endorser.address_state) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        <span className="text-xs text-slate-500">
                          {[endorser.address_city, endorser.address_state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Specialty endorsed */}
                    {endorsement.specialty?.name && (
                      <span className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {endorsement.specialty.name}
                      </span>
                    )}

                    {/* Comment */}
                    {endorsement.comment && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                          &ldquo;{endorsement.comment}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="flex-shrink-0 text-xs text-slate-400 mt-0.5">
                    {formatRelativeDate(endorsement.created_at)}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Show more/less */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1.5 mx-auto mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${endorsements.length} endorsements`}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      )}

      {/* Fallback for count-only display */}
      {!loading && endorsements.length === 0 && endorsementCount > 0 && (
        <p className="text-sm text-slate-500 italic">
          This attorney has {endorsementCount} peer endorsement{endorsementCount !== 1 ? 's' : ''} from other licensed lawyers.
        </p>
      )}
    </div>
  )
}
