import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Phone, CheckCircle, Clock } from 'lucide-react'
import { BLUR_PLACEHOLDER } from '@/lib/data/images'
import { getAttorneyUrl } from '@/lib/utils'

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
  const profileUrl = getAttorneyUrl({
    slug: provider.slug,
    specialty: provider.service_type || null,
    city: provider.address_city || null,
  })

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
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
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {provider.image_url ? (
              <Image
                src={provider.image_url}
                alt={`${provider.name}${provider.service_type ? ` - ${provider.service_type}` : ''} in ${provider.address_city}`}
                fill
                className="object-cover"
                sizes="64px"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                {provider.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={profileUrl}
                className="truncate font-semibold text-gray-900 transition-colors hover:text-blue-600"
              >
                {provider.name}
              </Link>
              {provider.is_verified && (
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
              )}
            </div>

            {provider.service_type && (
              <p className="mt-0.5 text-sm font-medium text-blue-600">{provider.service_type}</p>
            )}

            <div className="mt-1 flex items-center gap-1">
              {renderStars(provider.rating_average)}
              <span className="ml-1 text-sm font-medium text-gray-700">
                {provider.rating_average.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">({provider.review_count} reviews)</span>
            </div>

            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>
                {provider.address_city}, {provider.address_region}
              </span>
            </div>
          </div>
        </div>

        {provider.description && (
          <p className="mt-4 line-clamp-2 text-sm text-gray-600">{provider.description}</p>
        )}

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {provider.is_available_24h && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              <Clock className="h-3 w-3" />
              24/7
            </span>
          )}
          {provider.response_time && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
              Responds in {provider.response_time}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
          <Link
            href={profileUrl}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            View profile
          </Link>
          {showContact && provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttorneyCard
