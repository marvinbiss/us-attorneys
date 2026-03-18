import Link from 'next/link'
import { MapPin, Phone, Star, ChevronRight, ShieldCheck, Award } from 'lucide-react'
import { Provider } from '@/types'
import { getAttorneyUrl, getAvatarColor } from '@/lib/utils'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { TrustScore } from '@/components/attorney/TrustScore'

type AttorneyCardProvider = Partial<Provider> & Pick<Provider, 'id' | 'name'> & {
  trust_score?: number | null
}

function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10
}

interface AttorneyCardProps {
  provider: AttorneyCardProvider
  isHovered?: boolean
}

export default function AttorneyCard({
  provider,
  isHovered = false,
}: AttorneyCardProps) {
  const providerUrl = getAttorneyUrl({ stable_id: provider.stable_id, slug: provider.slug, specialty: provider.specialty, city: provider.address_city })
  const ratingValue = provider.rating_average?.toFixed(1)
  const reviewCount = provider.review_count

  return (
    <div
      className={`group/card relative overflow-hidden rounded-2xl border bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] active:bg-gray-50 dark:active:bg-gray-700 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-amber-400 before:via-amber-500 before:to-orange-500 before:opacity-60 before:transition-opacity before:duration-300 ${
        isHovered
          ? '-translate-y-1.5 scale-[1.02] border-amber-200 dark:border-amber-700 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12),0_4px_6px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] before:opacity-100'
          : 'border-gray-100 dark:border-gray-700 shadow-sm hover:-translate-y-1 hover:scale-[1.02] hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:before:opacity-100'
      }`}
    >
      {/* Favorite button — top-right */}
      <FavoriteButton
        attorneyId={provider.stable_id || provider.id}
        attorneyName={provider.name}
        size="sm"
        className="absolute top-3 right-3 z-30"
      />
      {/* Featured badge */}
      {provider.is_featured && (
        <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          <Award className="w-3.5 h-3.5" />
          Featured
        </div>
      )}
      {/* Mobile: full-card tappable overlay link */}
      <Link
        href={providerUrl}
        className="absolute inset-0 z-10 md:hidden"
        aria-label={`View ${provider.name}'s profile`}
      />
      {/* Mobile: right arrow indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden z-0">
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>
      {/* Avatar, Name and verification */}
      <div className="flex items-start gap-4 mb-2">
        {/* Avatar / Initials */}
        <Link href={providerUrl} className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(provider.name)} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
            {provider.name.charAt(0).toUpperCase()}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={providerUrl}
              className="text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-clay-600 transition-colors duration-200 truncate"
            >
              {provider.name}
            </Link>
            {provider.is_verified && (
              <span
                className="relative inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-clay-400 to-clay-600"
                aria-label="Verified Attorney"
                title="Verified Attorney"
              >
                <svg
                  className="w-3.5 h-3.5 text-white relative z-10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                {/* Shimmer effect */}
                <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </span>
            )}
          </div>
          {provider.specialty && (
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{provider.specialty}</p>
          )}
        </div>
        {ratingValue && typeof reviewCount === 'number' && reviewCount > 0 ? (
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5 justify-end">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500 transition-transform duration-300 group-hover/card:scale-110 group-hover/card:animate-[pulseGlow_1.5s_ease-in-out_infinite]" />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {ratingValue}
              </span>
            </div>
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <span className="text-xs text-gray-500">{reviewCount} reviews</span>
              {reviewCount > 10 && (
                <span className="text-2xs font-semibold text-clay-600 bg-clay-50 px-1.5 py-0.5 rounded-full">10+</span>
              )}
            </div>
          </div>
        ) : (
          <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            New
          </span>
        )}
      </div>

      {/* Address + Bar Number trust signal */}
      {provider.address_line1 && (
        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
          <span>
            {provider.address_line1}
            {provider.address_zip &&
             !provider.address_line1.includes(provider.address_zip) &&
             `, ${provider.address_zip}${provider.address_city ? ` ${provider.address_city}` : ''}`}
          </span>
        </div>
      )}
      {provider.bar_number && (
        <p className="flex items-center gap-1 text-xs text-stone-500 mb-3 ml-6">
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          Bar # {provider.bar_number}
        </p>
      )}

      {/* Trust Score Badge */}
      {provider.trust_score != null && provider.trust_score > 0 && (
        <div className="mb-3 ml-6">
          <TrustScore score={provider.trust_score} variant="badge" />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 relative z-20">
        <Link
          href={`${providerUrl}#quote`}
          className="flex-1 py-3 min-h-[48px] flex items-center justify-center text-center bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-500/35 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-200"
        >
          Request a Consultation
        </Link>
        {isValidPhone(provider.phone) && (
          <a
            href={`tel:${provider.phone}`}
            className="group flex-1 flex items-center justify-center gap-2 py-3 min-h-[48px] border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-200"
          >
            <Phone className="w-5 h-5" />
            Call
          </a>
        )}
      </div>
    </div>
  )
}
