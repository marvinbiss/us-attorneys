'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { User, ChevronDown, Calendar, Shield, Star, Users, MapPin, CheckCircle } from 'lucide-react'
import { Artisan } from './types'
import type { LegacyAttorney } from '@/types/legacy'

interface AttorneyAboutProps {
  attorney: Artisan
}

// "Why choose" cards -- merged from former AttorneyWhyChoose component
interface WhyCard {
  icon: React.ElementType
  title: string
  description: string
}

function getWhyCards(attorney: LegacyAttorney): WhyCard[] {
  const cards: WhyCard[] = []

  if (attorney.creation_date) {
    const creationYear = new Date(attorney.creation_date).getFullYear()
    const currentYear = new Date().getFullYear()
    const years = currentYear - creationYear
    if (years > 0) {
      cards.push({
        icon: Calendar,
        title: 'Experience',
        description: `${years} years in practice`,
      })
    }
  }

  if (attorney.is_verified) {
    cards.push({
      icon: Shield,
      title: 'Reliability',
      description: 'Identity verified (Bar Number)',
    })
  }

  if (attorney.average_rating > 0) {
    cards.push({
      icon: Star,
      title: 'Satisfaction',
      description: `Rated ${attorney.average_rating.toFixed(1)}/5 (${attorney.review_count} reviews)`,
    })
  }

  if (attorney.team_size && attorney.team_size > 1) {
    cards.push({
      icon: Users,
      title: 'Team',
      description: `Team of ${attorney.team_size} professionals`,
    })
  }

  if (attorney.intervention_radius_km) {
    cards.push({
      icon: MapPin,
      title: 'Proximity',
      description: `Service area within ${attorney.intervention_radius_km} miles`,
    })
  }

  if (attorney.free_quote) {
    cards.push({
      icon: CheckCircle,
      title: 'No obligation',
      description: 'Free consultation',
    })
  }

  return cards.slice(0, 3)
}

export function AttorneyAbout({ attorney }: AttorneyAboutProps) {
  const reducedMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)

  const description = attorney.description || ''
  const bio = attorney.bio || ''
  const isLong = description.length > 300
  const whyCards = getWhyCards(attorney as LegacyAttorney)

  // Calculate years of experience
  const currentYear = new Date().getFullYear()
  let yearsOfExperience: number | null = null
  if (attorney.creation_date) {
    const year = new Date(attorney.creation_date).getFullYear()
    yearsOfExperience = currentYear - year
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.15 }}
      className="bg-[#FFFCF8] dark:bg-gray-800 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 overflow-hidden"
    >
      {/* Section header */}
      <div className="px-6 pt-6 pb-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-heading mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-clay-50 dark:bg-clay-900/30 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-clay-400" />
          </div>
          About
        </h2>
      </div>

      <div className="px-6 pb-6">
        {/* Quick stats row */}
        {(yearsOfExperience || attorney.member_since) && (
          <div className="flex flex-wrap gap-3 mb-4">
            {yearsOfExperience !== null && yearsOfExperience > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-sm font-medium border border-sand-300 dark:border-gray-600">
                <Calendar className="w-4 h-4 text-clay-400" aria-hidden="true" />
                {yearsOfExperience} years of experience
              </span>
            )}
            {attorney.member_since && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-sm font-medium border border-sand-300 dark:border-gray-600">
                Member since {attorney.member_since}
              </span>
            )}
          </div>
        )}

        {/* Description / Bio */}
        {description ? (
          <div>
            <div className="relative">
              <div
                id="about-description"
                aria-expanded={isLong ? expanded : undefined}
                className={`text-slate-600 dark:text-gray-300 leading-relaxed text-[0.95rem] ${!expanded && isLong ? 'line-clamp-4' : ''}`}
              >
                {description}
              </div>
              {isLong && !expanded && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FFFCF8] dark:from-gray-800 to-transparent pointer-events-none" />
              )}
            </div>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-controls="about-description"
                className="mt-2 text-clay-400 dark:text-clay-300 font-medium text-sm flex items-center gap-1 hover:text-clay-600 dark:hover:text-clay-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 rounded transition-colors"
              >
                {expanded ? 'Show less' : 'Show more'}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            )}
          </div>
        ) : null}

        {/* Bio (separate from description if both exist) */}
        {bio && bio !== description && (
          <div className="mt-4 pt-4 border-t border-stone-200/40 dark:border-gray-700">
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-[0.95rem]">{bio}</p>
          </div>
        )}

        {/* Why choose -- merged from AttorneyWhyChoose */}
        {whyCards.length > 0 && (
          <div className="mt-5 pt-5 border-t border-stone-200/40 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {whyCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl bg-white dark:bg-gray-700 border border-stone-200/60 dark:border-gray-600 p-4"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-clay-50 dark:bg-clay-900/30 mb-2.5">
                    <card.icon className="w-4.5 h-4.5 text-clay-400" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-0.5">{card.title}</p>
                  <p className="text-xs text-slate-600 dark:text-gray-400">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
