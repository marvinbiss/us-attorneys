'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Clock, BadgeCheck, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { getAttorneyUrl, getAvatarColor } from '@/lib/utils'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { BLUR_PLACEHOLDER } from '@/lib/data/images'

interface AttorneyCardProps {
  id: string
  name: string
  profession: string
  slug: string
  location: string
  locationSlug: string
  rating: number
  reviewCount: number
  imageUrl?: string
  isVerified?: boolean
  isPremium?: boolean
  isAvailableNow?: boolean
  nextAvailable?: string
  specialties?: string[]
  priceRange?: string
  responseTime?: string
  variant?: 'default' | 'horizontal' | 'compact'
}

export function AttorneyCard({
  id,
  name,
  profession,
  slug,
  location,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locationSlug: _locationSlug,
  rating,
  reviewCount,
  imageUrl,
  isVerified = false,
  isPremium = false,
  isAvailableNow = false,
  nextAvailable,
  specialties = [],
  priceRange,
  responseTime,
  variant = 'default',
}: AttorneyCardProps) {
  const [_isHovered, setIsHovered] = useState(false)

  const href = getAttorneyUrl({ stable_id: id, slug, specialty: profession, city: location })

  // Horizontal variant (for lists)
  if (variant === 'horizontal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
      >
        <Link href={href} className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${name} - ${profession} in ${location}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 192px"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center`}>
                <span className="text-4xl font-bold text-white">
                  {name.charAt(0)}
                </span>
              </div>
            )}

            {/* Badge premium */}
            {isPremium && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Premium
              </div>
            )}

            {/* Availability */}
            {isAvailableNow && (
              <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Available
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    {name}
                  </h3>
                  {isVerified && (
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <p className="text-slate-600">{profession}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
                <span className="text-slate-500">({reviewCount})</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
              <MapPin className="w-4 h-4" />
              {location}
            </div>

            {/* Specialties */}
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {specialties.slice(0, 3).map((specialty, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}

            {/* Additional info */}
            <div className="flex items-center gap-4 text-sm">
              {responseTime && (
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-4 h-4" />
                  Responds in {responseTime}
                </div>
              )}
              {priceRange && (
                <div className="text-slate-500">
                  {priceRange}
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  // Variant compact
  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <Image src={imageUrl} alt={`${name} - ${profession} in ${location}`} fill className="object-cover" sizes="48px" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center`}>
              <span className="font-bold text-white">{name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="font-medium text-slate-900 truncate">{name}</h4>
            {isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
          </div>
          <p className="text-sm text-slate-500 truncate">{profession}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="font-medium text-sm">{rating.toFixed(1)}</span>
        </div>
      </Link>
    )
  }

  // Default variant (Airbnb-style card)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Link href={href} className="block">
        {/* Image container */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${name} - ${profession} in ${location}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center`}>
              <span className="text-6xl font-bold text-white/90">
                {name.charAt(0)}
              </span>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Premium badge */}
          {isPremium && (
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg"
            >
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                Premium
              </span>
            </motion.div>
          )}

          {/* Favorite button */}
          <FavoriteButton
            attorneyId={id}
            attorneyName={name}
            size="md"
            className="absolute top-3 right-3 z-10"
          />

          {/* Availability */}
          {isAvailableNow ? (
            <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Available now
            </div>
          ) : nextAvailable ? (
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Calendar className="w-3 h-3" />
              {nextAvailable}
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {name}
              </h3>
              {isVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-medium text-sm text-slate-900">{rating.toFixed(1)}</span>
              <span className="text-slate-500 text-sm">({reviewCount})</span>
            </div>
          </div>

          {/* Profession */}
          <p className="text-slate-600 text-sm">{profession}</p>

          {/* Location */}
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </div>

          {/* Specialties */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {specialties.slice(0, 2).map((specialty, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                >
                  {specialty}
                </span>
              ))}
              {specialties.length > 2 && (
                <span className="text-xs text-slate-500">
                  +{specialties.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

// Attorney grid
export function AttorneyGrid({
  attorneys,
  loading = false,
}: {
  attorneys: AttorneyCardProps[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/3] bg-slate-200 rounded-2xl mb-3" />
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {attorneys.map((atty) => (
        <AttorneyCard key={atty.id} {...atty} />
      ))}
    </div>
  )
}
