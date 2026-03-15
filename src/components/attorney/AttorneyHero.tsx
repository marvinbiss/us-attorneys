'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star, MapPin, CheckCircle, Users, Clock, Phone, CalendarCheck } from 'lucide-react'
import { getDisplayName } from './types'
import type { LegacyArtisan } from '@/types/legacy'
import {
  VerificationLevelBadge,
  VerifiedBadge,
} from '@/components/reviews/VerifiedBadge'
import { BookingFunnel } from '@/lib/analytics/tracking'

interface AttorneyHeroProps {
  artisan: LegacyArtisan
}

// Determine verification level based on artisan data
function getVerificationLevel(artisan: LegacyArtisan): 'none' | 'basic' | 'standard' | 'premium' | 'enterprise' {
  if (artisan.is_verified) {
    return 'basic'
  }
  return 'none'
}

export function AttorneyHero({ artisan }: AttorneyHeroProps) {
  const displayName = getDisplayName(artisan)
  const verificationLevel = getVerificationLevel(artisan)
  const [showPhone, setShowPhone] = useState(false)

  const hasPortfolioImage = artisan.portfolio && artisan.portfolio.length > 0 && artisan.portfolio[0].imageUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 overflow-hidden"
      role="banner"
      aria-label={`${displayName}'s profile`}
    >
      {/* Premium gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-clay-400 via-clay-300 to-clay-500" />

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Pulsing ring for attorneys accepting new clients */}
              {artisan.accepts_new_clients && (
                <motion.div
                  className="absolute -inset-1.5 rounded-2xl border-2 border-clay-400/50"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                />
              )}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-clay-400 to-clay-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg shadow-glow-clay overflow-hidden ring-4 ring-[#FFFCF8] relative">
                {hasPortfolioImage ? (
                  <Image
                    src={artisan.portfolio![0].imageUrl}
                    alt={`${displayName} - ${artisan.specialty} in ${artisan.city}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 96px, 128px"
                  />
                ) : (
                  <span aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {artisan.is_verified && (
                <Link
                  href="/verification-process"
                  className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-br from-clay-400 to-clay-600 text-white p-1.5 rounded-full shadow-lg ring-2 ring-white hover:ring-clay-200 transition-all"
                  aria-label="Verified attorney - view verification process"
                  title="View our verification process"
                >
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                </Link>
              )}
              {/* Team size badge overlapping bottom of avatar */}
              {artisan.team_size && artisan.team_size > 1 && (
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full shadow-md border border-stone-200 text-xs font-medium text-slate-700 whitespace-nowrap">
                  <Users className="w-3 h-3 text-clay-400" aria-hidden="true" />
                  Team of {artisan.team_size}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Top Badges Row */}
            <div className="flex flex-wrap gap-2 mb-3" role="list" aria-label="Badges and certifications">
              <VerificationLevelBadge level={verificationLevel} size="sm" />
            </div>

            {/* Name & Specialty */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-1.5 tracking-tight">
              {displayName}
              <span className="sr-only"> — {artisan.specialty} in {artisan.city}</span>
            </h1>
            <p className="text-lg text-slate-600 mb-3 font-medium">{artisan.specialty}</p>

            {/* Location */}
            <div className="flex items-center gap-2 text-slate-500 mb-4">
              <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <span className="font-medium">{artisan.city} ({artisan.postal_code})</span>
              {artisan.intervention_radius_km && (
                <>
                  <span className="text-slate-300" aria-hidden="true">•</span>
                  <span className="text-slate-400">Radius: {artisan.intervention_radius_km} mi</span>
                </>
              )}
            </div>

            {/* Phone - click-to-reveal then call */}
            {artisan.phone && (
              <button
                type="button"
                onClick={() => {
                  if (showPhone) {
                    BookingFunnel.clickPhone(artisan.id, artisan.business_name || '', 'hero')
                    window.location.href = `tel:${artisan.phone!.replace(/\s/g, '')}`
                  } else {
                    BookingFunnel.revealPhone(artisan.id, artisan.business_name || '', 'hero')
                    setShowPhone(true)
                  }
                }}
                className="inline-flex items-center gap-2 text-clay-400 hover:text-clay-600 font-medium mb-4 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 rounded"
                aria-label={showPhone ? `Call ${artisan.phone}` : 'Show phone number'}
              >
                <Phone className="w-4 h-4" />
                <span>{showPhone ? artisan.phone : 'Show number'}</span>
              </button>
            )}

            {/* Verification Badges Row */}
            <div className="flex flex-wrap gap-2 mb-4">
              {artisan.is_verified && (
                <VerifiedBadge type="identity" size="sm" />
              )}
            </div>

            {/* Rating & Stats Row */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2" role="group" aria-label="Average rating">
                {artisan.average_rating !== null && artisan.average_rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" aria-hidden="true" />
                    <span className="font-bold text-gray-900" aria-label={`Rating ${artisan.average_rating.toFixed(1)} out of 5`}>
                      {artisan.average_rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {artisan.review_count > 0 && (
                  <a href="#reviews" className="text-slate-600 hover:text-clay-600 transition-colors duration-200" aria-label={`${artisan.review_count} client reviews`}>
                    ({artisan.review_count} reviews)
                  </a>
                )}
              </div>

              {artisan.team_size && artisan.team_size > 1 && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>Team of {artisan.team_size}</span>
                </div>
              )}

              {artisan.member_since && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CalendarCheck className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>Member since {artisan.member_since}</span>
                </div>
              )}

              {artisan.updated_at && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="w-4 h-4 text-clay-400" />
                  <span>Updated {new Date(artisan.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            {/* Freshness / activity indicator */}
            {(artisan.member_since || artisan.accepts_new_clients) && (
              <div className="flex items-center gap-3 flex-wrap mt-3">
                {artisan.accepts_new_clients === true && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sand-200 text-stone-700 text-xs font-medium border border-sand-300">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clay-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-clay-500" />
                    </span>
                    Active profile
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
