'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Award, Shield, MessageSquare } from 'lucide-react'

interface Endorser {
  id: string
  name: string
  slug: string | null
  avatar_url: string | null
  specialty: string | null
  address_city: string | null
  address_state: string | null
  is_verified: boolean | null
}

interface Endorsement {
  id: string
  comment: string | null
  created_at: string
  specialty_id: string | null
  endorser: Endorser
}

interface PeerEndorsementsProps {
  attorneyId: string
  endorsementCount?: number
  /** Compact mode for sidebar / card display */
  compact?: boolean
}

export default function PeerEndorsements({
  attorneyId,
  endorsementCount = 0,
  compact = false,
}: PeerEndorsementsProps) {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!attorneyId || endorsementCount === 0) {
      setLoading(false)
      return
    }

    async function fetchEndorsements() {
      try {
        const res = await fetch(`/api/endorsements?endorsed_id=${attorneyId}`)
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
    }

    fetchEndorsements()
  }, [attorneyId, endorsementCount])

  // Nothing to show
  if (!loading && endorsements.length === 0 && endorsementCount === 0) {
    return null
  }

  // Count badge only (for compact / card display)
  if (compact) {
    if (endorsementCount === 0) return null

    return (
      <div className="flex items-center gap-1.5 text-sm text-blue-700">
        <Award className="w-4 h-4" />
        <span className="font-medium">
          {endorsementCount} Peer Endorsement{endorsementCount !== 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Peer Endorsements
          </h3>
          {endorsementCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {endorsementCount}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Endorsements from other licensed attorneys who vouch for this lawyer&apos;s expertise and professionalism.
      </p>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Endorsements list */}
      {!loading && endorsements.length > 0 && (
        <div className="space-y-4">
          {endorsements.map((endorsement) => {
            const endorser = endorsement.endorser
            const profileUrl = endorser.slug
              ? `/attorneys/${endorser.specialty ? endorser.specialty.toLowerCase().replace(/\s+/g, '-') : 'attorney'}/${endorser.slug}`
              : null

            return (
              <div
                key={endorsement.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {endorser.avatar_url ? (
                    <Image
                      src={endorser.avatar_url}
                      alt={endorser.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {endorser.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {profileUrl ? (
                      <Link
                        href={profileUrl}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm"
                      >
                        {endorser.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900 text-sm">
                        {endorser.name}
                      </span>
                    )}
                    {endorser.is_verified && (
                      <span title="Verified Attorney"><Shield className="w-3.5 h-3.5 text-green-600" /></span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    {endorser.specialty}
                    {endorser.address_city && endorser.address_state
                      ? ` — ${endorser.address_city}, ${endorser.address_state}`
                      : ''}
                  </p>

                  {endorsement.comment && (
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 italic">
                        &ldquo;{endorsement.comment}&rdquo;
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(endorsement.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state — show count badge only if DB not queried yet */}
      {!loading && endorsements.length === 0 && endorsementCount > 0 && (
        <p className="text-sm text-gray-500 italic">
          This attorney has {endorsementCount} peer endorsement{endorsementCount !== 1 ? 's' : ''} from other licensed lawyers.
        </p>
      )}
    </div>
  )
}
