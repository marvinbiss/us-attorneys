'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Star, MapPin, Phone, Clock } from 'lucide-react'

interface Provider {
  id: string
  name: string
  rating_average?: number
  review_count?: number
  address_city?: string
  specialty?: string
  is_verified?: boolean
  phone?: string
}

interface MapTooltipProps {
  provider: Provider
  position: { x: number; y: number }
}

/**
 * World-class tooltip for map markers with rich information
 */
export default function MapTooltip({ provider, position }: MapTooltipProps) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
      className="fixed z-[10000] pointer-events-none"
      style={{
        left: position.x + 20,
        top: position.y - 60
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-3 min-w-[250px] max-w-[300px] border border-gray-100">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm truncate leading-tight">
              {provider.name}
            </h4>
            {provider.specialty && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">
                {provider.specialty}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {provider.is_verified && (
              <div
                className="p-1 rounded-full"
                title="Verified"
                style={{ backgroundColor: '#1877f2' }}
              >
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2" />

        {/* Stats */}
        <div className="space-y-1.5">
          {/* Rating */}
          {provider.rating_average && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="font-bold text-gray-900 text-xs">
                  {provider.rating_average.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                ({provider.review_count} reviews)
              </span>
            </div>
          )}

          {/* Location */}
          {provider.address_city && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{provider.address_city}</span>
            </div>
          )}

          {/* Phone */}
          {provider.phone && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{provider.phone}</span>
            </div>
          )}

          {/* Quick status */}
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>Available</span>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
      </div>
    </motion.div>
  )
}
