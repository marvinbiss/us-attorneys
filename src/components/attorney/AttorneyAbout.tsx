'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, ChevronDown } from 'lucide-react'
import { Artisan } from './types'

interface AttorneyAboutProps {
  artisan: Artisan
}

export function AttorneyAbout({ artisan }: AttorneyAboutProps) {
  const [expanded, setExpanded] = useState(false)

  const description = artisan.description || ''
  const isLong = description.length > 300

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 overflow-hidden"
    >
      {/* Section header */}
      <div className="px-6 pt-6 pb-0">
        <h2 className="text-xl font-semibold text-gray-900 font-heading mb-5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-clay-50 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-clay-400" />
          </div>
          &Agrave; propos
        </h2>
      </div>

      {/* Description */}
      {description ? (
        <div className="px-6">
          <div className="relative">
            <div
              id="about-description"
              aria-expanded={isLong ? expanded : undefined}
              className={`text-slate-600 leading-relaxed text-[0.95rem] ${!expanded && isLong ? 'line-clamp-4' : ''}`}
            >
              {description}
            </div>
            {isLong && !expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FFFCF8] to-transparent pointer-events-none" />
            )}
          </div>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls="about-description"
              className="mt-2 text-clay-400 font-medium text-sm flex items-center gap-1 hover:text-clay-600 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 rounded transition-colors"
            >
              {expanded ? 'Voir moins' : 'Voir plus'}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
        </div>
      ) : null}

      <div className="pb-6" />
    </motion.div>
  )
}
