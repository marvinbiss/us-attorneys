import Link from 'next/link'
import { MapPin, Phone, Star, ChevronRight, ShieldCheck } from 'lucide-react'
import { Provider } from '@/types'
import { getArtisanUrl, getAvatarColor } from '@/lib/utils'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { CompareButton } from '@/components/ui/CompareButton'

type ProviderCardProvider = Partial<Provider> & Pick<Provider, 'id' | 'name'>

function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10
}

interface ProviderCardProps {
  provider: ProviderCardProvider
  isHovered?: boolean
}

export default function ProviderCard({
  provider,
  isHovered = false,
}: ProviderCardProps) {
  const providerUrl = getArtisanUrl({ stable_id: provider.stable_id, slug: provider.slug, specialty: provider.specialty, city: provider.address_city })
  const ratingValue = provider.rating_average?.toFixed(1)
  const reviewCount = provider.review_count

  return (
    <div
      className={`group/card relative overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-sm p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] active:bg-gray-50 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-amber-400 before:via-amber-500 before:to-orange-500 before:opacity-60 before:transition-opacity before:duration-300 ${
        isHovered
          ? '-translate-y-1.5 scale-[1.02] border-amber-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12),0_4px_6px_-2px_rgba(0,0,0,0.05)] before:opacity-100'
          : 'border-gray-100 shadow-sm hover:-translate-y-1 hover:scale-[1.02] hover:border-amber-200 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:before:opacity-100'
      }`}
    >
      {/* Bouton favori — top-right */}
      <FavoriteButton
        providerId={provider.stable_id || provider.id}
        providerName={provider.name}
        size="sm"
        className="absolute top-3 right-3 z-30"
      />
      {/* Mobile: full-card tappable overlay link */}
      <Link
        href={providerUrl}
        className="absolute inset-0 z-10 md:hidden"
        aria-label={`Voir le profil de ${provider.name}`}
      />
      {/* Mobile: right arrow indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden z-0">
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>
      {/* Avatar, Nom et vérification */}
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
              className="text-xl font-bold text-gray-900 hover:text-clay-600 transition-colors duration-200 truncate"
            >
              {provider.name}
            </Link>
            {provider.is_verified && (
              <span
                className="relative inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-clay-400 to-clay-600"
                aria-label="Artisan référencé"
                title="Artisan référencé"
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
            <p className="text-sm text-slate-500 font-medium mt-0.5">{provider.specialty}</p>
          )}
        </div>
        {ratingValue && typeof reviewCount === 'number' && reviewCount > 0 ? (
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5 justify-end">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500 transition-transform duration-300 group-hover/card:scale-110 group-hover/card:animate-[pulseGlow_1.5s_ease-in-out_infinite]" />
              <span className="text-xl font-bold text-gray-900">
                {ratingValue}
              </span>
            </div>
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <span className="text-xs text-gray-500">{reviewCount} avis</span>
              {reviewCount > 10 && (
                <span className="text-2xs font-semibold text-clay-600 bg-clay-50 px-1.5 py-0.5 rounded-full">10+</span>
              )}
            </div>
          </div>
        ) : (
          <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
            Nouveau
          </span>
        )}
      </div>

      {/* Adresse + SIREN trust signal */}
      {provider.address_street && (
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-1">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
          <span>
            {provider.address_street}
            {provider.address_postal_code &&
             !provider.address_street.includes(provider.address_postal_code) &&
             `, ${provider.address_postal_code}${provider.address_city ? ` ${provider.address_city}` : ''}`}
          </span>
        </div>
      )}
      {provider.siret && (
        <p className="flex items-center gap-1 text-xs text-stone-500 mb-3 ml-6">
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          SIREN {provider.siret.slice(0, 9)}
        </p>
      )}

      {/* Bouton comparer — désactivé temporairement, à réactiver plus tard */}
      <div className="mb-3 hidden md:block">
        <CompareButton
          provider={{ id: provider.stable_id || provider.id, name: provider.name, slug: provider.slug || '', specialty: provider.specialty, address_city: provider.address_city, address_region: provider.address_region, address_postal_code: provider.address_postal_code, is_verified: provider.is_verified, rating_average: provider.rating_average, review_count: provider.review_count, phone: provider.phone, siret: provider.siret }}
          size="sm"
        />
      </div>

      {/* Boutons */}
      <div className="flex gap-3 relative z-20">
        <Link
          href={`${providerUrl}#devis`}
          className="flex-1 py-3 min-h-[48px] flex items-center justify-center text-center bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-500/35 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-200"
        >
          Demander un devis
        </Link>
        {isValidPhone(provider.phone) && (
          <a
            href={`tel:${provider.phone}`}
            className="group flex-1 flex items-center justify-center gap-2 py-3 min-h-[48px] border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-200"
          >
            <Phone className="w-5 h-5" />
            Appeler
          </a>
        )}
      </div>
    </div>
  )
}
