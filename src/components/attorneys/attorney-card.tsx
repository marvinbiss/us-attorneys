'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Phone, CheckCircle, Clock } from 'lucide-react'
import { BLUR_PLACEHOLDER } from '@/lib/data/images'

interface AttorneyCardProps {
  provider: {
    id: string
    slug: string
    name: string
    description?: string
    address_city: string
    address_region: string
    phone?: string
    rating_average: number
    review_count: number
    is_verified: boolean
    is_available_24h?: boolean
    response_time?: string
    image_url?: string
    service_type?: string
  }
  showContact?: boolean
}

export function AttorneyCard({ provider, showContact = false }: AttorneyCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : star - 0.5 <= rating
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {provider.image_url ? (
              <Image
                src={provider.image_url}
                alt={`${provider.name}${provider.service_type ? ` - ${provider.service_type}` : ''} à ${provider.address_city}`}
                fill
                className="object-cover"
                sizes="64px"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                {provider.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/artisan/${provider.slug}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
              >
                {provider.name}
              </Link>
              {provider.is_verified && (
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
            </div>

            {provider.service_type && (
              <p className="text-sm text-blue-600 font-medium mt-0.5">
                {provider.service_type}
              </p>
            )}

            <div className="flex items-center gap-1 mt-1">
              {renderStars(provider.rating_average)}
              <span className="text-sm font-medium text-gray-700 ml-1">
                {provider.rating_average.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({provider.review_count} avis)
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4" />
              <span>{provider.address_city}, {provider.address_region}</span>
            </div>
          </div>
        </div>

        {provider.description && (
          <p className="mt-4 text-gray-600 text-sm line-clamp-2">
            {provider.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {provider.is_available_24h && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3" />
              24h/24
            </span>
          )}
          {provider.response_time && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              Répond en {provider.response_time}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <Link
            href={`/artisan/${provider.slug}`}
            className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Voir le profil
          </Link>
          {showContact && provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <Phone className="w-4 h-4" />
              Appeler
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttorneyCard
